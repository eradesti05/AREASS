import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { akademikAPI } from "../services/api";

export default function InputDataAkademikPage({ user }) {
  const navigate = useNavigate();
  const { userTypeParam } = useParams();
  const [strata, setStrata] = useState("");
  const [semesterAktif, setSemesterAktif] = useState("");
  const [ipk, setIpk] = useState("");
  const [sks, setSks] = useState("");
  const [jumlahSksLulus, setJumlahSksLulus] = useState("");
  const [dataSemester, setDataSemester] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const maxSemesterByJenjang = {
    D3: 10,
    S1: 16,
    S2: 8,
    S3: 12,
  };

  const maxSemester = maxSemesterByJenjang[strata] || 0;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (semesterAktif) {
      const rows = Array.from({ length: parseInt(semesterAktif) }, (_, i) => ({
        semester: i + 1,
        ip: "",
        sks: "",
        sksLulus: "",
      }));
      setDataSemester(rows);
    }
  }, [semesterAktif]);

  useEffect(() => {
    if (parseInt(semesterAktif) > maxSemester) {
      setSemesterAktif("");
      setDataSemester([]);
    }
  }, [semesterAktif, maxSemester]);

  const updateDataSemester = (index, field, value) => {
    const updated = [...dataSemester];
    updated[index] = { ...updated[index], [field]: value };
    setDataSemester(updated);
  };

  const sksTidakLulus = useMemo(() => {
    const total = parseInt(sks) || 0;
    const lulus = parseInt(jumlahSksLulus) || 0;
    return total - lulus >= 0 ? total - lulus : 0;
  }, [sks, jumlahSksLulus]);

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
      totalSks: sks || "---",
      sksLulus: jumlahSksLulus || "---",
      sksTidakLulus: sksTidakLulus || 0,
      totalSksPerSemester: totalSksPerSemester || "---",
    };
  }, [ipk, sks, jumlahSksLulus, dataSemester]);

  const dataUmumLengkap =
    strata && semesterAktif && ipk && sks && jumlahSksLulus;

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    const token = localStorage.getItem("areass_token");
    const user = JSON.parse(localStorage.getItem("areass_user"));
    let latestPrediksi = null;
    
    try {
      // Process each semester, skip if already exists
      for (const row of dataSemester) {
        const payload = {
          strata,
          semesterKe: row.semester,
          ipSemester: parseFloat(row.ip) || 0,
          ipkTotal: parseFloat(ipk),
          sksPerSemester: parseInt(row.sks) || 0,
          jumlahSksLulus: parseInt(row.sksLulus) || 0,
          totalSks: parseInt(sks),
          jumlahMkDiulang: sksTidakLulus,
        };
        
        try {
          const data = await akademikAPI.create(payload);
          
          // Save the latest prediction from backend
          if (data.prediksi) {
            latestPrediksi = data.prediksi;
            localStorage.setItem(`prediksi_${user._id}`, JSON.stringify(data.prediksi));
          }
        } catch (error) {
          // Skip if semester already exists, continue to next semester
          if (error.message?.includes("sudah ada")) {
            console.log(`Semester ${row.semester} sudah ada, skip...`);
            continue;
          } else {
            setMessage({
              type: "error",
              text: error.message || "Gagal menyimpan data",
            });
            setLoading(false);
            return;
          }
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
      borderRadius: 15,
      border: "1px solid #DFEAF2",
      outline: "none",
      cursor: "pointer",
      boxSizing: "border-box",
    },
    infoBox: {
      color: "#718EBF",
      background: "#fff",
      fontSize: isMobile ? 12 : 15,
      padding: isMobile ? "10px 12px" : "12px 16px",
      borderRadius: 15,
      border: "1px solid #DFEAF2",
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
      background: "#DFEAF2",
      padding: isMobile ? "14px" : "20px",
      gap: isMobile ? 8 : 16,
      borderRadius: 15,
      border: "1px solid #718EBF",
      minWidth: isMobile ? "100%" : 150,
    },
    summaryLabel: {
      color: "#718EBF",
      fontSize: isMobile ? 13 : 15,
    },
    summaryValue: {
      color: "#718EBF",
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
    <div style={S.page}>
      <span style={S.pageTitle}>Input Data Akademik</span>

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
              <select
                value={strata}
                onChange={(e) => setStrata(e.target.value)}
                style={S.select}
              >
                <option value="" disabled>
                  Pilih Strata/Jenjang
                </option>
                <option value="D3">D3</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
                <option value="S3">S3</option>
              </select>
            </div>
            <div style={S.fieldGroup}>
              <span style={S.label}>Semester Aktif Saat Ini</span>
              <select
                value={semesterAktif}
                onChange={(e) => setSemesterAktif(e.target.value)}
                style={S.select}
                disabled={!strata}
              >
                <option value="" disabled>
                  Pilih semester aktif
                </option>
                {Array.from({ length: maxSemester }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div style={S.fieldGroup}>
              <span style={S.label}>IPK Total (Kumulatif)</span>
              <input
                type="number"
                min="0"
                max="4"
                step="0.01"
                placeholder="0.00 - 4.00"
                value={ipk}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (e.target.value === "" || (val >= 0 && val <= 4))
                    setIpk(e.target.value);
                }}
                style={S.input}
              />
            </div>
          </div>
          <div style={S.row}>
            <div style={S.fieldGroup}>
              <span style={S.label}>Total SKS ditempuh</span>
              <input
                placeholder="contoh : 72"
                value={sks}
                onChange={(e) => {
                  if (e.target.value === "" || /^\d+$/.test(e.target.value))
                    setSks(e.target.value);
                }}
                style={S.input}
              />
            </div>
            <div style={S.fieldGroup}>
              <span style={S.label}>Jumlah SKS lulus</span>
              <input
                placeholder="contoh : 67"
                value={jumlahSksLulus}
                onChange={(e) => {
                  if (e.target.value === "" || /^\d+$/.test(e.target.value))
                    setJumlahSksLulus(e.target.value);
                }}
                style={S.input}
              />
            </div>
            <div style={S.fieldGroup}>
              <span style={S.label}>Jumlah SKS tidak lulus</span>
              <input
                value={sksTidakLulus}
                readOnly
                style={{ ...S.input, background: "#F3F4F6" }}
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
              sudah kamu jalani.
            </div>
            <div style={S.tableHeader}>
              <span style={S.tableHeaderSem}>Semester</span>
              <span style={S.tableHeaderCol}>IP Semester</span>
              <span style={S.tableHeaderCol}>SKS Per Semester</span>
              <span style={S.tableHeaderCol}>SKS Lulus Per Semester</span>
            </div>
            {dataSemester.map((row, index) => (
              <div key={index} style={S.tableRow}>
                <span style={S.tableRowLabel}>Sem {row.semester}</span>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  placeholder="0.00 - 4.00"
                  value={row.ip}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (e.target.value === "" || (val >= 0 && val <= 4))
                      updateDataSemester(index, "ip", e.target.value);
                  }}
                  style={S.tableInput}
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="contoh: 20"
                  value={row.sks}
                  onChange={(e) => {
                    if (e.target.value === "" || /^\d+$/.test(e.target.value))
                      updateDataSemester(index, "sks", e.target.value);
                  }}
                  style={S.tableInput}
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="contoh: 20"
                  value={row.sksLulus}
                  onChange={(e) => {
                    if (e.target.value === "" || /^\d+$/.test(e.target.value))
                      updateDataSemester(index, "sksLulus", e.target.value);
                  }}
                  style={S.tableInput}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ringkasan */}
      {dataUmumLengkap && (
        <div style={S.card}>
          <div style={S.cardBody}>
            <div style={S.sectionHeader}>
              <span style={S.sectionTitle}>Ringkasan Data</span>
              <div style={S.sectionDivider} />
            </div>
            <div style={S.summaryRow}>
              {[
                { label: "IPK", value: ringkasan.ipk },
                { label: "Rata-rata IP", value: ringkasan.rataRataIp },
                { label: "Total SKS", value: ringkasan.totalSks },
              ].map((item) => (
                <div key={item.label} style={S.summaryCard}>
                  <span style={S.summaryLabel}>{item.label}</span>
                  <span style={S.summaryValue}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={S.summaryRow}>
              {[
                { label: "Total SKS Lulus", value: ringkasan.sksLulus },
                {
                  label: "Total SKS Tidak Lulus",
                  value: ringkasan.sksTidakLulus,
                },
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
      <div style={S.submitRow}>
        <button
          onClick={handleSubmit}
          disabled={!dataUmumLengkap || loading}
          style={dataUmumLengkap && !loading ? S.btnActive : S.btnDisabled}
        >
          {loading ? "Menyimpan..." : "Add Data"}
        </button>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <div style={S.modalCloseBtn} onClick={() => setShowSuccessModal(false)}>
              ✕
            </div>
            
            <div style={S.modalContent}>
              <div style={S.modalIcon}>✓</div>
              <h2 style={S.modalTitle}>Data Berhasil Dibuat</h2>
              <button
                onClick={() => {
                  if (user?._id) {
                    localStorage.setItem(`akademik_completed_${user._id}`, "true");
                  }
                  window.location.href = "/dashboard";
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
  );
}
