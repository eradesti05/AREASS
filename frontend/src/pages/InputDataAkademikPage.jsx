import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { akademikAPI } from "../services/api";
import { X, CheckCircle } from 'lucide-react';
import { C } from "../constants/theme";

export default function InputDataAkademikPage({ user }) {
  const navigate = useNavigate();
  const { userTypeParam } = useParams();
  const [strata, setStrata] = useState("");
  const [semesterAktif, setSemesterAktif] = useState("");
  const [openDropdownStrata, setOpenDropdownStrata] = useState(false);
  const [openDropdownSemester, setOpenDropdownSemester] = useState(false);
  const dropdownRefStrata = useRef(null);
  const dropdownRefSemester = useRef(null);
  const [ipk, setIpk] = useState("");
  const [dataSemester, setDataSemester] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [existingAkademik, setExistingAkademik] = useState([]);
  const [selectedSemesterExists, setSelectedSemesterExists] = useState(false);
  const maxSemesterByJenjang = {
    D3: 10,
    S1: 16,
    S2: 8,
    S3: 12,
  };

  const maxSemester = maxSemesterByJenjang[strata] || 0;

  // Fetch existing akademik data on component load
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const data = await akademikAPI.getAll();
        const akademikArray = Array.isArray(data) ? data : (data?.data || []);
        setExistingAkademik(akademikArray);
      } catch (err) {
        console.log("Info: No existing akademik data");
      }
    };
    fetchExistingData();
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRefStrata.current && !dropdownRefStrata.current.contains(e.target)) {
        setOpenDropdownStrata(false);
      }
      if (dropdownRefSemester.current && !dropdownRefSemester.current.contains(e.target)) {
        setOpenDropdownSemester(false);
      }
    };
    
    if (openDropdownStrata || openDropdownSemester) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdownStrata, openDropdownSemester]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (semesterAktif) {
      // Filter semesters that already have data for this specific strata
      const existingSemestersForStrata = existingAkademik
        .filter(a => a.strata === strata) // Only check current strata
        .map(a => a.semesterKe);
      
      // Create rows untuk semua semester (termasuk yang sudah ada) untuk ditampilkan
      const rows = Array.from({ length: parseInt(semesterAktif) }, (_, i) => {
        const semesterNum = i + 1;
        // Cari data existing untuk semester ini
        const existing = existingAkademik.find(
          a => a.strata === strata && a.semesterKe === semesterNum
        );
        
        if (existing) {
          // Jika sudah ada, populate dengan data existing (read-only)
          return {
            semester: semesterNum,
            ip: existing.ipSemester?.toString() || "",
            sks: existing.sksPerSemester?.toString() || "",
            sksLulus: existing.jumlahSksLulus?.toString() || "",
            isExisting: true,
          };
        }
        
        // Jika belum ada, return empty form
        return {
          semester: semesterNum,
          ip: "",
          sks: "",
          sksLulus: "",
          isExisting: false,
        };
      });
      
      setDataSemester(rows);
    }
  }, [semesterAktif, strata, existingAkademik]);

  useEffect(() => {
    if (parseInt(semesterAktif) > maxSemester) {
      setSemesterAktif("");
      setDataSemester([]);
    }
  }, [semesterAktif, maxSemester]);

  // Reset data semester when strata changes
  useEffect(() => {
    setSemesterAktif("");
    setDataSemester([]);
  }, [strata]);

  // Check if selected semester already exists for this strata
  useEffect(() => {
    if (strata && semesterAktif) {
      const exists = existingAkademik.some(
        a => a.strata === strata && a.semesterKe === parseInt(semesterAktif)
      );
      setSelectedSemesterExists(exists);
    } else {
      setSelectedSemesterExists(false);
    }
  }, [strata, semesterAktif, existingAkademik]);

  const updateDataSemester = (index, field, value) => {
    const updated = [...dataSemester];
    updated[index] = { ...updated[index], [field]: value };
    setDataSemester(updated);
  };

  const ringkasan = useMemo(() => {
    const totalIp = dataSemester.reduce(
      (sum, row) => sum + (parseFloat(row.ip) || 0),
      0,
    );
    const rataRataIp =
      dataSemester.length > 0
        ? (totalIp / dataSemester.length).toFixed(2)
        : "---";
    const totalSksPerSemester = dataSemester.reduce(
      (sum, row) => sum + (parseInt(row.sks) || 0),
      0,
    );
    return {
      ipk: ipk || "---",
      rataRataIp,
      totalSksPerSemester: totalSksPerSemester || "---",
    };
  }, [ipk, dataSemester]);

  // Cek hanya data umum saja (untuk show form)
  const dataUmumLengkap =
    strata && semesterAktif && ipk &&
    dataSemester.length > 0;

  // Cek data umum + semua semester terisi (untuk enable submit button)
  const dataSemesterLengkap = 
    dataUmumLengkap &&
    dataSemester.every(row => row.ip && row.sks && row.sksLulus);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    const token = localStorage.getItem("areass_token");
    const user = JSON.parse(localStorage.getItem("areass_user"));
    let latestPrediksi = null;
    
    try {
      // Refresh existing akademik data before submit untuk memastikan data terbaru
      const freshData = await akademikAPI.getAll();
      const freshAkademikArray = Array.isArray(freshData) ? freshData : (freshData?.data || []);
      setExistingAkademik(freshAkademikArray);
      
      // Process each semester, skip if already exists
      for (const row of dataSemester) {
        // Skip existing data (already in database)
        if (row.isExisting) {
          console.log(`⏭️ Semester ${row.semester} untuk ${strata} sudah ada (skip)`);
          continue;
        }
        
        // Frontend double-check: apakah semester+strata sudah ada?
        const isDuplicate = freshAkademikArray.some(
          a => a.strata === strata && a.semesterKe === row.semester
        );
        
        if (isDuplicate) {
          console.log(`❌ Semester ${row.semester} untuk ${strata} sudah ada (ditolak di frontend)`);
          setMessage({
            type: "error",
            text: `Data ${strata} Semester ${row.semester} sudah ada. Silakan refresh halaman.`,
          });
          setLoading(false);
          return;
        }
        
        const payload = {
          strata,
          semesterKe: row.semester,
          ipSemester: parseFloat(row.ip) || 0,
          ipkTotal: parseFloat(ipk),
          sksPerSemester: parseInt(row.sks) || 0,
          jumlahSksLulus: parseInt(row.sksLulus) || 0,
          totalSks: parseInt(ringkasan.totalSksPerSemester) || 0,
        };
        
        try {
          const data = await akademikAPI.create(payload);
          console.log(`✅ Data ${strata} semester ${row.semester} berhasil disimpan/diupdate`);
          
          // Save the latest prediction from backend
          if (data.prediksi) {
            latestPrediksi = data.prediksi;
            localStorage.setItem(`prediksi_${user._id}`, JSON.stringify(data.prediksi));
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: error.message || "Gagal menyimpan data",
          });
          setLoading(false);
          return;
        }
      }
      
      // Set akademik completed flag
      if (user?._id) {
        localStorage.setItem(`akademik_completed_${user._id}`, "true");
      }
      
      // Show success modal instead of auto redirect
      setShowSuccessModal(true);
      setLoading(false);
    } catch (err) {
      setMessage({ type: "error", text: "Gagal terhubung ke server" });
      setLoading(false);
    }
  };

  // Breakpoints
  const isMobile = windowWidth <= 368;
  const isTablet = windowWidth <= 768;

  const S = {
    page: {
      display: "flex",
      flexDirection: "column",
      background: "#F4F6F9",
      minHeight: "100vh",
      padding: isMobile ? "16px 12px" : isTablet ? "24px 20px" : "32px 40px",
      gap: isMobile ? 16 : 24,
      boxSizing: "border-box",
    },
    pageTitle: {
      color: "#333B69",
      fontSize: isMobile ? 18 : 22,
      fontWeight: 700,
    },
    card: {
      width: "100%",
      background: "#fff",
      borderRadius: isMobile ? 15 : 25,
      boxShadow: "4px 4px 18px #00000040",
      boxSizing: "border-box",
    },
    cardBody: {
      padding: isMobile ? "16px" : isTablet ? "24px" : "32px",
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? 16 : 24,
    },
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      gap: 16,
    },
    sectionTitle: {
      color: "#232323",
      fontSize: isMobile ? 15 : 18,
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    sectionDivider: {
      flex: 1,
      background: "#DFEAF2",
      height: 3,
    },
    row: {
      display: "flex",
      flexDirection: isMobile ? "column" : isTablet ? "column" : "row",
      gap: isMobile ? 12 : 20,
    },
    fieldGroup: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      gap: 8,
      minWidth: 0,
    },
    label: {
      color: "#232323",
      fontSize: isMobile ? 13 : 15,
    },
    input: {
      width: "100%",
      color: "#718EBF",
      background: "#fff",
      fontSize: isMobile ? 13 : 15,
      padding: isMobile ? "10px 14px" : "14px 20px",
      borderRadius: 15,
      border: "1px solid #DFEAF2",
      outline: "none",
      boxSizing: "border-box",
    },
    select: {
      width: "100%",
      color: "#718EBF",
      background: "#fff",
      fontSize: isMobile ? 13 : 15,
      padding: isMobile ? "10px 14px" : "14px 20px",
      borderRadius: 20,
      border: "2px solid #DFEAF2",
      outline: "none",
      cursor: "pointer",
      boxSizing: "border-box",
      transition: "all 0.3s ease",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23718EBF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 14px center",
      backgroundSize: "20px",
      paddingRight: isMobile ? "35px" : "40px",      // Styling untuk option ketika dropdown open
      WebkitAppearance: "none",
      MozAppearance: "none",
      boxShadow: "0 2px 8px rgba(113, 142, 191, 0.1)",    },
    infoBox: {
      color: "#0277BD",
      background: "linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%)",
      fontSize: isMobile ? 13 : 14,
      padding: isMobile ? "14px 16px" : "16px 20px",
      borderRadius: 16,
      border: "2px solid #29B6F6",
      boxShadow: "0 2px 8px rgba(41, 182, 246, 0.1)",
      fontWeight: 500,
    },
    tableHeader: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 8 : 16,
      padding: "0 4px",
    },
    tableHeaderSem: {
      color: "#232323",
      fontSize: isMobile ? 12 : 15,
      fontWeight: 600,
      width: isMobile ? 60 : 100,
      flexShrink: 0,
    },
    tableHeaderCol: {
      color: "#232323",
      fontSize: isMobile ? 12 : 15,
      fontWeight: 600,
      flex: 1,
    },
    tableRow: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 8 : 16,
    },
    tableRowLabel: {
      color: "#718EBF",
      fontSize: isMobile ? 12 : 15,
      fontWeight: 600,
      width: isMobile ? 60 : 100,
      flexShrink: 0,
    },
    tableInput: {
      flex: 1,
      color: "#718EBF",
      background: "#fff",
      fontSize: isMobile ? 13 : 15,
      padding: isMobile ? "10px 10px" : "14px 20px",
      borderRadius: 15,
      border: "1px solid #DFEAF2",
      outline: "none",
      minWidth: 0,
    },
    summaryRow: {
      display: "flex",
      flexDirection: isMobile ? "column" : isTablet ? "row" : "row",
      gap: isMobile ? 10 : 16,
      flexWrap: "wrap",
    },
    summaryCard: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      background: "#fff",
      padding: isMobile ? "14px" : "20px",
      gap: isMobile ? 8 : 16,
      borderRadius: 15,
      border: "1px solid #718EBF",
      minWidth: isMobile ? "100%" : 150,
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(41, 182, 246, 0.1)",
    },
    summaryLabel: {
      color: "#718EBF",
      fontSize: isMobile ? 13 : 15,
    },
    summaryValue: {
      color: "#1F2937",
      fontSize: isMobile ? 20 : 24,
      fontWeight: 700,
    },
    submitRow: {
      display: "flex",
      justifyContent: isMobile ? "stretch" : "flex-end",
      width: "100%",
      marginBottom: 40,
    },
    btnActive: {
      background: "#1814F3",
      color: "#fff",
      fontSize: isMobile ? 15 : 18,
      padding: isMobile ? "12px 20px" : "14px 40px",
      borderRadius: 9,
      border: "none",
      cursor: "pointer",
      width: isMobile ? "100%" : "auto",
    },
    btnDisabled: {
      background: "#9CA3AF",
      color: "#fff",
      fontSize: isMobile ? 15 : 18,
      padding: isMobile ? "12px 20px" : "14px 40px",
      borderRadius: 9,
      border: "none",
      cursor: "not-allowed",
      width: isMobile ? "100%" : "auto",
    },
    msgSuccess: {
      width: "100%",
      padding: "16px 20px",
      borderRadius: 15,
      background: "#22C55E",
      color: "#fff",
      fontWeight: 600,
      fontSize: isMobile ? 13 : 15,
      boxSizing: "border-box",
    },
    msgError: {
      width: "100%",
      padding: "16px 20px",
      borderRadius: 15,
      background: "#EF4444",
      color: "#fff",
      fontWeight: 600,
      fontSize: isMobile ? 13 : 15,
      boxSizing: "border-box",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modal: {
      background: "#fff",
      borderRadius: 20,
      padding: "40px 32px",
      maxWidth: 400,
      width: "90%",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
      position: "relative",
    },
    modalCloseBtn: {
      position: "absolute",
      top: 16,
      right: 16,
      background: "#E5E7EB",
      border: "none",
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      color: "#6B7280",
      fontSize: 20,
    },
    modalContent: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
    },
    modalIcon: {
      width: 80,
      height: 80,
      borderRadius: "50%",
      background: "#E0F7F4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 40,
      color: "#14B8A6",
      fontWeight: 700,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 700,
      color: "#1F2937",
      margin: 0,
      textAlign: "center",
    },
    modalBtn: {
      width: "100%",
      padding: "14px 20px",
      background: "#14B8A6",
      color: "#fff",
      border: "none",
      borderRadius: 12,
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
      marginTop: 8,
    },
  };

  return (
    <>
      <style>{`
        select {
          font-family: inherit;
        }
        select:hover {
          border-color: #5D9CEC !important;
          box-shadow: 0 4px 12px rgba(93, 156, 236, 0.2) !important;
        }
        select:focus {
          border-color: #29B6F6 !important;
          box-shadow: 0 4px 12px rgba(41, 182, 246, 0.3) !important;
        }
        select option {
          padding: 12px 16px;
          background: white;
          color: #718EBF;
          border: none;
          border-radius: 8px;
        }
        select option:hover {
          background: #E1F5FE;
        }
        select option:checked {
          background: linear-gradient(#29B6F6, #29B6F6);
          background-color: #29B6F6;
          color: white;
        }
      `}</style>
      <div style={S.page}>
      <span style={S.pageTitle}>Input Data Akademik</span>

      {/* Notifikasi Penting */}
      <div style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderLeft: "4px solid #EF5350",
        borderRadius: 12,
        padding: "24px",
        display: "flex",
        gap: 20,
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      }}>
        <div style={{
          fontSize: 40,
          flexShrink: 0,
        }}>⚠️</div>
        <div style={{display: "flex", flexDirection: "column", gap: 16, flex: 1}}>
          <div style={{fontSize: 18, fontWeight: 700, color: "#EF5350", letterSpacing: 1}}>PERHATIAN</div>
          <ol style={{margin: 0, paddingLeft: 0, display: "flex", flexDirection: "column", gap: 12}}>
            <li style={{display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, color: "#333", listStyle: "none"}}>
              <span style={{color: "#EF5350", fontWeight: 700, minWidth: 20}}>1</span>
              <span>Data yang diinput hanya untuk semester yang <span style={{color: "#EF5350", fontWeight: 600}}>sudah selesai</span></span>
            </li>
            <li style={{display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, color: "#333", listStyle: "none"}}>
              <span style={{color: "#EF5350", fontWeight: 700, minWidth: 20}}>2</span>
              <span>Jangan memasukkan data semester yang <span style={{color: "#EF5350", fontWeight: 600}}>sedang berlangsung</span></span>
            </li>
            <li style={{display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, color: "#333", listStyle: "none"}}>
              <span style={{color: "#EF5350", fontWeight: 700, minWidth: 20}}>3</span>
              <span>Pastikan semester memiliki <span style={{color: "#EF5350", fontWeight: 600}}>nilai IP Semester</span> sebelum diinput</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Notifikasi */}
      {message && (
        <div style={message.type === "success" ? S.msgSuccess : S.msgError}>
          {message.text}
        </div>
      )}

      {/* Data Umum */}
      <div style={S.card}>
        <div style={S.cardBody}>
          <div style={S.sectionHeader}>
            <span style={S.sectionTitle}>Data Umum</span>
            <div style={S.sectionDivider} />
          </div>
          <div style={S.row}>
            <div style={S.fieldGroup}>
              <span style={S.label}>Strata/Jenjang</span>
              <div style={{ position: 'relative', zIndex: 100 }} ref={dropdownRefStrata}>
                <div
                  onClick={() => setOpenDropdownStrata(!openDropdownStrata)}
                  style={{
                    border: "1.5px solid #DFEAF2",
                    borderRadius: 20,
                    padding: "14px 20px",
                    fontSize: 15,
                    color: strata ? "#718EBF" : "#A0AEC0",
                    cursor: "pointer",
                    background: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#5D9CEC";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(93, 156, 236, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#DFEAF2";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.02)";
                  }}
                >
                  <span>{strata || "Pilih Strata/Jenjang"}</span>
                  <span style={{fontSize: 12, transform: openDropdownStrata ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease"}}>▼</span>
                </div>

                {openDropdownStrata && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 8,
                      background: "#fff",
                      border: "1.5px solid #5D9CEC",
                      borderRadius: 12,
                      boxShadow: "0 8px 20px rgba(93, 156, 236, 0.15)",
                      zIndex: 100,
                      overflow: "hidden",
                    }}
                  >
                    {["D3", "S1", "S2", "S3"].map((opt) => (
                      <div
                        key={opt}
                        onClick={() => {
                          setStrata(opt);
                          setOpenDropdownStrata(false);
                        }}
                        style={{
                          padding: "14px 20px",
                          cursor: "pointer",
                          borderBottom: "1px solid #F5F6FA",
                          fontSize: 15,
                          transition: "all 0.15s ease",
                          background: strata === opt ? "#E8EAFF" : "transparent",
                          color: strata === opt ? "#1A23C8" : "#718EBF",
                          fontWeight: strata === opt ? 600 : 500,
                        }}
                        onMouseEnter={(e) => {
                          if (strata !== opt) {
                            e.currentTarget.style.background = "#F5F6FA";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (strata !== opt) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={S.fieldGroup}>
              <span style={S.label}>Semester yang telah dilalui/selesai</span>
              <div style={{ position: 'relative', zIndex: 99 }} ref={dropdownRefSemester}>
                <div
                  onClick={() => setOpenDropdownSemester(!openDropdownSemester)}
                  style={{
                    border: "1.5px solid #DFEAF2",
                    borderRadius: 20,
                    padding: "14px 20px",
                    fontSize: 15,
                    color: semesterAktif ? "#718EBF" : "#A0AEC0",
                    cursor: strata ? "pointer" : "not-allowed",
                    background: strata ? "#fff" : "#F3F4F6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                    transition: "all 0.3s ease",
                    opacity: strata ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    if (strata) {
                      e.currentTarget.style.borderColor = "#5D9CEC";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(93, 156, 236, 0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#DFEAF2";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.02)";
                  }}
                >
                  <span>{semesterAktif ? `Semester ${semesterAktif}` : "Pilih semester aktif"}</span>
                  <span style={{fontSize: 12, transform: openDropdownSemester ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease"}}>▼</span>
                </div>

                {openDropdownSemester && strata && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 8,
                      background: "#fff",
                      border: "1.5px solid #5D9CEC",
                      borderRadius: 12,
                      boxShadow: "0 8px 20px rgba(93, 156, 236, 0.15)",
                      zIndex: 99,
                      maxHeight: 250,
                      overflowY: "auto",
                    }}
                  >
                    {Array.from({ length: maxSemester }, (_, i) => i + 1).map((sem) => (
                      <div
                        key={sem}
                        onClick={() => {
                          setSemesterAktif(String(sem));
                          setOpenDropdownSemester(false);
                        }}
                        style={{
                          padding: "14px 20px",
                          cursor: "pointer",
                          borderBottom: "1px solid #F5F6FA",
                          fontSize: 15,
                          transition: "all 0.15s ease",
                          background: semesterAktif === String(sem) ? "#E8EAFF" : "transparent",
                          color: semesterAktif === String(sem) ? "#1A23C8" : "#718EBF",
                          fontWeight: semesterAktif === String(sem) ? 600 : 500,
                        }}
                        onMouseEnter={(e) => {
                          if (semesterAktif !== String(sem)) {
                            e.currentTarget.style.background = "#F5F6FA";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (semesterAktif !== String(sem)) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        Semester {sem}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Alert if semester already exists */}
            {selectedSemesterExists && (
              <div style={{
                background: "linear-gradient(135deg, #E3F2FD 0%, #E1F5FE 100%)",
                border: "2px solid #29B6F6",
                borderRadius: 16,
                padding: "20px 24px",
                fontSize: 15,
                color: "#01579B",
                fontWeight: 600,
                gridColumn: "1 / -1",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 4px 12px rgba(41, 182, 246, 0.15)",
              }}>
                <div style={{display: "flex", alignItems: "center", gap: 12}}>
                  <span style={{
                    fontSize: 24,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    background: "rgba(41, 182, 246, 0.2)",
                    borderRadius: 8,
                    lineHeight: 1
                  }}>✓</span>
                  <span>Data {strata} Semester {semesterAktif} sudah ada. Tidak perlu input ulang.</span>
                </div>
                <div style={{
                  background: "rgba(255, 255, 255, 0.7)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontSize: 13,
                  color: "#0277BD",
                  fontWeight: 500
                }}>
                  <strong>Semester yang sudah ada untuk {strata}:</strong>
                  <div style={{marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap"}}>
                    {existingAkademik
                      .filter(a => a.strata === strata)
                      .sort((a, b) => a.semesterKe - b.semesterKe)
                      .map(a => (
                        <span key={a._id} style={{
                          background: "#29B6F6",
                          color: "#fff",
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          Sem {a.semesterKe}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            )}
            <div style={S.fieldGroup}>
              <span style={S.label}>IPK Total (Kumulatif)</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00 - 4.00"
                value={ipk}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                    setIpk(val);
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val === "") {
                    setIpk("");
                  } else {
                    const numVal = parseFloat(val);
                    if (!isNaN(numVal) && numVal >= 0 && numVal <= 4) {
                      setIpk(numVal.toFixed(2));
                    } else {
                      setIpk("");
                    }
                  }
                }}
                onWheel={(e) => e.target.blur()}
                style={S.input}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Per Semester */}
      {dataUmumLengkap && (
        <div style={S.card}>
          <div style={{ ...S.cardBody, gap: 20 }}>
            <div style={S.sectionHeader}>
              <span style={S.sectionTitle}>Data Per Semester</span>
              <div style={S.sectionDivider} />
            </div>
            
            <div style={S.infoBox}>
              Isi IP Semester dan SKS yang ditempuh untuk setiap semester yang
              sudah kamu jalani. Data per strata disimpan terpisah.
            </div>
            
            {dataSemester.length === 0 ? (
              <div style={{
                background: "#FFF9C4",
                border: "1px solid #FBC02D",
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                color: "#F57F17",
                textAlign: "center"
              }}>
                ℹ️ Semester yang dipilih datanya sudah ada.
              </div>
            ) : (
              <>
                <div style={S.tableHeader}>
                  <span style={S.tableHeaderSem}>Semester</span>
                  <span style={S.tableHeaderCol}>IP Semester</span>
                  <span style={S.tableHeaderCol}>SKS Per Semester</span>
                  <span style={S.tableHeaderCol}>SKS Lulus Per Semester</span>
                </div>
                {dataSemester.map((row, index) => (
                  <div key={`sem-${row.semester}-${strata}`} style={S.tableRow}>
                    <span style={S.tableRowLabel}>Sem {row.semester} {row.isExisting && <span style={{color: "#4CAF50", fontWeight: 700}}>(✓ Ada)</span>}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00 - 4.00"
                      value={row.ip}
                      readOnly={row.isExisting}
                      onChange={(e) => {
                        if (!row.isExisting) {
                          const val = e.target.value;
                          if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                            updateDataSemester(index, "ip", val);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        if (!row.isExisting) {
                          const val = e.target.value.trim();
                          if (val === "") {
                            updateDataSemester(index, "ip", "");
                          } else {
                            const numVal = parseFloat(val);
                            if (!isNaN(numVal) && numVal >= 0 && numVal <= 4) {
                              updateDataSemester(index, "ip", numVal.toFixed(2));
                            } else {
                              updateDataSemester(index, "ip", "");
                            }
                          }
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      style={{...S.tableInput, background: row.isExisting ? "#F3F4F6" : "#FFFFFF"}}
                    />
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="1"
                      placeholder="contoh: 20"
                      value={row.sks}
                      readOnly={row.isExisting}
                      onChange={(e) => {
                        if (!row.isExisting) {
                          updateDataSemester(index, "sks", e.target.value);
                        }
                      }}
                      onBlur={(e) => {
                        if (!row.isExisting) {
                          const val = e.target.value.trim();
                          if (val === "") {
                            updateDataSemester(index, "sks", "");
                          } else {
                            const numVal = parseInt(val);
                            if (!isNaN(numVal) && numVal >= 0 && numVal <= 24) {
                              updateDataSemester(index, "sks", numVal.toString());
                            } else {
                              updateDataSemester(index, "sks", "");
                            }
                          }
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      style={{...S.tableInput, background: row.isExisting ? "#F3F4F6" : "#FFFFFF"}}
                    />
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="1"
                      placeholder="contoh: 20"
                      value={row.sksLulus}
                      readOnly={row.isExisting}
                      onChange={(e) => {
                        if (!row.isExisting) {
                          updateDataSemester(index, "sksLulus", e.target.value);
                        }
                      }}
                      onBlur={(e) => {
                        if (!row.isExisting) {
                          const val = e.target.value.trim();
                          if (val === "") {
                            updateDataSemester(index, "sksLulus", "");
                          } else {
                            const numVal = parseInt(val);
                            if (!isNaN(numVal) && numVal >= 0 && numVal <= 24) {
                              updateDataSemester(index, "sksLulus", numVal.toString());
                            } else {
                              updateDataSemester(index, "sksLulus", "");
                            }
                          }
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      style={{...S.tableInput, background: row.isExisting ? "#F3F4F6" : "#FFFFFF"}}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Ringkasan */}
      {dataUmumLengkap && !selectedSemesterExists && (
        <div style={S.card}>
          <div style={S.cardBody}>
            <div style={S.sectionHeader}>
              <span style={S.sectionTitle}>Ringkasan Data</span>
              <div style={S.sectionDivider} />
            </div>
            <div style={S.summaryRow}>
              {[
                { label: "Rata-rata IP", value: ringkasan.rataRataIp },
                {
                  label: "Total SKS Per Semester",
                  value: ringkasan.totalSksPerSemester,
                },
              ].map((item) => (
                <div key={item.label} style={S.summaryCard}>
                  <span style={S.summaryLabel}>{item.label}</span>
                  <span style={S.summaryValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tombol Submit */}
      {dataUmumLengkap && !selectedSemesterExists && (
        <div style={S.submitRow}>
          <button
            onClick={handleSubmit}
            disabled={!dataSemesterLengkap || loading}
            style={dataSemesterLengkap && !loading ? S.btnActive : S.btnDisabled}
          >
            {loading ? "Menyimpan..." : "Kirim Data"}
          </button>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <div style={S.modalCloseBtn} onClick={() => setShowSuccessModal(false)}>
              <X size={24} />
            </div>
            
            <div style={S.modalContent}>
              <div style={S.modalIcon}>
                <CheckCircle size={40} fill="#14B8A6" color="white" />
              </div>
              <h2 style={S.modalTitle}>Data Berhasil Dibuat</h2>
              <button
                onClick={() => {
                  console.log("Modal OK clicked");
                  
                  // Coba ambil user dari localStorage dulu
                  let userToUse = null;
                  try {
                    const storedUserStr = localStorage.getItem("areass_user");
                    console.log("Raw stored user string:", storedUserStr);
                    if (storedUserStr) {
                      userToUse = JSON.parse(storedUserStr);
                      console.log("Parsed stored user:", userToUse);
                    }
                  } catch (e) {
                    console.error("Error parsing localStorage user:", e);
                  }
                  
                  // Fallback ke prop user jika localStorage kosong
                  if (!userToUse && user) {
                    console.log("Using prop user as fallback:", user);
                    userToUse = user;
                  }
                  
                  console.log("Final user to use:", userToUse);
                  
                  // Handle both _id (MongoDB) dan id (backend response)
                  const userId = userToUse?._id || userToUse?.id;
                  
                  if (userId) {
                    const flagKey = `akademik_completed_${userId}`;
                    localStorage.setItem(flagKey, "true");
                    console.log(`Flag set: ${flagKey} = ${localStorage.getItem(flagKey)}`);
                    
                    // Hard reload untuk ensure flag terdeteksi dan page reload
                    setTimeout(() => {
                      console.log("Redirecting dengan hard reload ke /dashboard");
                      window.location.href = "/dashboard";
                    }, 200);
                  } else {
                    console.error("User ID TIDAK DITEMUKAN - user object:", userToUse, "props user:", user);
                    alert("Error: User tidak ditemukan. Silakan login kembali.");
                  }
                }}
                style={S.modalBtn}
              >
                Oke
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
