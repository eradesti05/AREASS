import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";
import { Card } from "../components/UIComponents";
import { akademikAPI, taskAPI, prediksiAPI } from "../services/api";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import { Bar as BarChart, Line as LineChart } from "react-chartjs-2";
import {
  Chart as ChartJS2,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip2,
  Legend as ChartLegend2,
} from "chart.js";
import {
  PieChart,
  Pie as MiniPie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  CheckCircle,
  TrendingUp,
  ListTodo,
  Clock,
  Zap,
  View,
  Info,
  Tag,
  Calendar,
  Edit2,
  X,
} from "lucide-react";

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);
ChartJS2.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip2,
  ChartLegend2,
);

const DashboardMahasiswa = ({ user }) => {
  const navigate = useNavigate();
  const [akademik, setAkademik] = useState([]);
  const [uniqueStrata, setUniqueStrata] = useState([]);
  const [selectedStrata, setSelectedStrata] = useState("");
  const [summary, setSummary] = useState({
    totalTugas: 0,
    tenggatWaktuTugas: 0,
    estimasiBebanKerja: 0,
    backlog: 0,
    onProgress: 0,
    done: 0,
  });
  const [prediksi, setPrediksi] = useState({
    hasilPrediksi: "Aman",
    skorConfidence: 0,
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showUpcomingTasks, setShowUpcomingTasks] = useState(false);
  const [openStrataSKSDropdown, setOpenStrataSKSDropdown] = useState(false);
  const [openStrataIPKDropdown, setOpenStrataIPKDropdown] = useState(false);
  const [openStrataCardDropdown, setOpenStrataCardDropdown] = useState(false);
  const strataSKSRef = useRef(null);
  const strataIPKRef = useRef(null);
  const strataCardRef = useRef(null);

  // ✅ Helper function untuk menghitung hari tersisa/terlambat secara KONSISTEN
  const calculateSisaHari = (deadlineStr) => {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  };

  // Handle click outside for strata dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (strataSKSRef.current && !strataSKSRef.current.contains(e.target)) {
        setOpenStrataSKSDropdown(false);
      }
      if (strataIPKRef.current && !strataIPKRef.current.contains(e.target)) {
        setOpenStrataIPKDropdown(false);
      }
      if (strataCardRef.current && !strataCardRef.current.contains(e.target)) {
        setOpenStrataCardDropdown(false);
      }
    };

    if (openStrataSKSDropdown || openStrataIPKDropdown || openStrataCardDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openStrataSKSDropdown, openStrataIPKDropdown, openStrataCardDropdown]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const akademikResult = await akademikAPI.getAll().catch((e) => {
          console.error("❌ Akademik API Error:", e);
          return [];
        });

        const summaryResult = await taskAPI.getSummary().catch((e) => {
          console.error("❌ Task Summary API Error:", e);
          return {
            totalTugas: 0,
            tenggatWaktuTugas: 0,
            estimasiBebanKerja: 0,
            backlog: 0,
            onProgress: 0,
            done: 0,
          };
        });

        const tasksResult = await taskAPI.getAll().catch((e) => {
          console.error("❌ Tasks API Error:", e);
          return [];
        });

        // ─── Proses akademik array dulu ───
        const akademikArray = Array.isArray(akademikResult)
          ? akademikResult
          : akademikResult?.data || [];

        const tasksArray = Array.isArray(tasksResult)
          ? tasksResult
          : tasksResult?.data || [];

        // ─── Auto run prediksi jika ada data akademik ───
        let prediksiResult = { hasilPrediksi: "Aman", skorConfidence: 0 };
        if (akademikArray.length > 0) {
          // Extract unique strata dulu untuk determine strata pertama
          const strata = [...new Set(akademikArray.map((item) => item.strata))].filter(Boolean);
          const firstStrata = strata[0] || "S1";
          
          prediksiResult = await prediksiAPI.run().catch(async () => {
            return await prediksiAPI
              .getLatest(firstStrata)
              .catch(() => ({ hasilPrediksi: "Aman", skorConfidence: 0 }));
          });
        }

        setAkademik(akademikArray);
        setSummary(summaryResult);
        setTasks(tasksArray);
        setPrediksi(prediksiResult);

        // Extract unique strata dari akademik data
        const strata = [...new Set(akademikArray.map((item) => item.strata))];
        setUniqueStrata(strata.filter(Boolean)); // filter out null/undefined

        // Set default selectedStrata ke strata pertama
        if (akademikArray.length > 0) {
          const firstStrata = akademikArray[0].strata || "";
          setSelectedStrata(firstStrata);
        }
      } catch (err) {
        console.error("❌ Dashboard fetch error:", err);
        setAkademik([]);
        setSummary({
          totalTugas: 0,
          tenggatWaktuTugas: 0,
          estimasiBebanKerja: 0,
          backlog: 0,
          onProgress: 0,
          done: 0,
        });
        setTasks([]);
        setPrediksi({ hasilPrediksi: "Aman", skorConfidence: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ─── Fetch prediksi berdasarkan selectedStrata ───
  useEffect(() => {
    if (selectedStrata) {
      prediksiAPI
        .getLatest(selectedStrata)
        .then((result) => {
          console.log(`✅ Prediksi untuk ${selectedStrata}:`, result);
          setPrediksi(result);
        })
        .catch((err) => {
          console.error(`❌ Error fetching prediksi for ${selectedStrata}:`, err);
        });
    }
  }, [selectedStrata]);

  // Filter akademik by selected strata
  const filteredAkademik =
    selectedStrata && akademik.length > 0
      ? akademik
          .filter((a) => a.strata === selectedStrata)
          .sort((a, b) => a.semesterKe - b.semesterKe)
      : akademik.sort((a, b) => a.semesterKe - b.semesterKe);

  const latest = filteredAkademik[filteredAkademik.length - 1] || {};

  const ipkTrend =
    filteredAkademik && filteredAkademik.length > 0
      ? filteredAkademik.map((d) => ({
          semester: `Sem ${d.semesterKe}`,
          ip: d.ipSemester,
        }))
      : [];

  const sksTrend =
    filteredAkademik && filteredAkademik.length > 0
      ? filteredAkademik.map((d) => ({
          semester: `Sem ${d.semesterKe}`,
          sks: d.sksPerSemester,
        }))
      : [];

  // Hitung max SKS otomatis dari data
  const maxSks =
    sksTrend.length > 0
      ? Math.max(
          24,
          Math.ceil(Math.max(...sksTrend.map((d) => d.sks || 0)) * 1.1),
        )
      : 24;

  // Hitung min dan max IPK otomatis dari data untuk better visualization
  const minIpk =
    ipkTrend.length > 0
      ? Math.max(0, Math.floor(Math.min(...ipkTrend.map((d) => d.ip || 4.0)) * 10) / 10 - 0.2)
      : 1.0;
  const maxIpk =
    ipkTrend.length > 0
      ? Math.ceil(Math.max(...ipkTrend.map((d) => d.ip || 1.0)) * 10) / 10 + 0.1 <= 4.0
        ? 4.0 + 0.15
        : Math.ceil(Math.max(...ipkTrend.map((d) => d.ip || 1.0)) * 10) / 10 + 0.1
      : 4.0;
  const taskProgress = [
    { name: "Backlog", value: summary.backlog || 0, color: "#000000" },
    { name: "On Progress", value: summary.onProgress || 0, color: "#FF9800" },
    { name: "Done", value: summary.done || 0, color: "#4CAF50" },
  ];

  const [hoveredPrediksi, setHoveredPrediksi] = useState(false);

  const statusConfig = {
    Aman: {
      color: C.green,
      label:
        "Luar biasa! Kamu telah menunjukkan konsistensi yang hebat dalam studimu. Pertahankan semangat dan ritme belajarmu ya, kamu sudah berada di jalur yang tepat untuk lulus tepat waktu. Teruslah bersinar!",
    },
    Waspada: {
      color: C.yellow,
      label:
        "Apresiasi besar untuk semua usaha yang telah kamu lakukan. Saat ini, ada beberapa bagian akademik yang butuh perhatian kecil agar tetap stabil. Yuk, coba ceritakan kendalamu kepada dosen wali lebih awal supaya langkahmu ke depan kembali lancar dan tenang.",
    },
    "Perlu perhatian": {
      color: C.red,
      label:
        "Terima kasih sudah berjuang dan bertahan sejauh ini, kerja kerasmu sangat berharga. Saat ini kondisi akademikmu sedang cukup menantang dan butuh perhatian segera. Yuk, kita cari solusi terbaik bersama dosen wali agar bebanmu terasa lebih ringan. Kamu tidak sendirian!",
    },
  };

  const status = statusConfig[prediksi.hasilPrediksi] || statusConfig["Aman"];
  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <div
          style={{
            color: C.textGray,
            fontSize: "clamp(14px, 3vw, 16px)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg
            style={{ animation: "spin 1s linear infinite" }}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2A10 10 0 0 0 2 12" strokeLinecap="round" />
          </svg>
          Memuat data...
        </div>
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    <div
      style={{
        padding: "clamp(12px, 4vw, 24px) clamp(8px, 3vw, 16px)",
        background: "#F4F6F9",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* Mahasiswa, Kemajuan Tugas, and Ringkasan Harian - 3 Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "clamp(12px, 3vw, 24px)",
          marginBottom: "clamp(20px, 3vw, 32px)",
          maxWidth: 1200,
          margin: "0 auto clamp(20px, 3vw, 32px)",
          boxSizing: "border-box",
        }}
      >
        {/* Mahasiswa Welcome Card */}
        <Card
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            borderRadius: 12,
            border: "none",
            padding: "clamp(14px, 2vw, 18px) clamp(16px, 2vw, 20px)",
            background: "#FFFFFF",
          }}
        >
          <div
            style={{
              fontSize: "clamp(10px, 1.5vw, 11px)",
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              marginBottom: "clamp(6px, 1vw, 8px)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Mahasiswa
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "clamp(18px, 5vw, 22px)",
                color: C.textDark,
                marginBottom: "clamp(12px, 2vw, 20px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "clamp(8px, 2vw, 12px)"
              }}
            >
              <span>Halo, {user.nama?.split(" ")[0]}! 👋</span>
              {/* Filter Strata - Custom Dropdown */}
              {uniqueStrata.length > 0 && (
                <div ref={strataCardRef} style={{ position: "relative", width: "fit-content" }}>
                  <div
                    onClick={() => setOpenStrataCardDropdown(!openStrataCardDropdown)}
                    style={{
                      border: "none",
                      borderRadius: 24,
                      padding: "10px 14px",
                      fontSize: 13,
                      minWidth: "80px",
                      textAlign: "center",
                      outline: "none",
                      color: "#1F2937",
                      background: "#F3F4F6",
                      boxSizing: "border-box",
                      fontWeight: 600,
                      boxShadow: "none",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    onMouseEnter={(e) => {
                      if (!openStrataCardDropdown) {
                        e.currentTarget.style.background = "#E5E7EB";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!openStrataCardDropdown) {
                        e.currentTarget.style.background = "#F3F4F6";
                      }
                    }}
                  >
                    <span>{selectedStrata}</span>
                    <span style={{ transform: openStrataCardDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", fontSize: 10 }}>▼</span>
                  </div>
                  {openStrataCardDropdown && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: 6,
                      background: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: 12,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                      zIndex: 1000,
                      overflow: "hidden",
                      minWidth: "80px"
                    }}>
                      {uniqueStrata.map((strata) => (
                        <div
                          key={strata}
                          onClick={() => {
                            setSelectedStrata(strata);
                            setOpenStrataCardDropdown(false);
                          }}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            borderBottom: strata === uniqueStrata[uniqueStrata.length - 1] ? "none" : "1px solid #F3F4F6",
                            fontSize: 13,
                            transition: "all 0.15s ease",
                            background: selectedStrata === strata ? "#F3F4F6" : "transparent",
                            color: selectedStrata === strata ? "#1F2937" : "#6B7280",
                            fontWeight: selectedStrata === strata ? 600 : 500,
                            textAlign: "center"
                          }}
                          onMouseEnter={(e) => {
                            if (selectedStrata !== strata) {
                              e.currentTarget.style.background = "#F9FAFB";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedStrata !== strata) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {strata}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div
              style={{
                color: C.textGray,
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Status Akademikmu saat ini :
            </div>
            {/* Dynamic prediction badge */}
            {prediksi?.hasilPrediksi ? (
              <>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: status.color,
                    color: "#FFFFFF",
                    padding: "8px 16px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: prediksi.hasilPrediksi === "Aman" 
                      ? `0 0 20px rgba(16, 185, 129, 0.15)` 
                      : prediksi.hasilPrediksi === "Waspada"
                        ? `0 0 20px rgba(245, 158, 11, 0.15)`
                        : `0 0 20px rgba(239, 68, 68, 0.15)`,
                    marginBottom: 16,
                  }}
                >
                  <CheckCircle size={16} /> {prediksi.hasilPrediksi}
                </div>

                <div
                  style={{
                    color: prediksi.hasilPrediksi === "Aman"
                      ? "#047857"
                      : prediksi.hasilPrediksi === "Waspada"
                        ? "#92400E"
                        : "#991B1B",
                    background: prediksi.hasilPrediksi === "Aman"
                      ? "#ECFDF5"
                      : prediksi.hasilPrediksi === "Waspada"
                        ? "#FFFBEB"
                        : "#FEF2F2",
                    fontSize: 14,
                    padding: "16px 16px",
                    borderRadius: 12,
                    marginTop: 12,
                    marginBottom: 12,
                    lineHeight: 1.7,
                    fontWeight: 500,
                    borderLeft: `4px solid ${status.color}`,
                  }}
                >
                  {status.label}
                </div>
                <div
                  onClick={() => navigate(`/analytics?strata=${selectedStrata}`)}
                  onMouseEnter={() => setHoveredPrediksi(true)}
                  onMouseLeave={() => setHoveredPrediksi(false)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: hoveredPrediksi ? "#BFDBFE" : "#DBEAFE",
                    color: "#1E40AF",
                    padding: "10px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    marginTop: 12,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    transform: hoveredPrediksi ? "translateY(-2px)" : "translateY(0)",
                  }}
                >
                  <Info size={16} /> {"Detail Analisis Akademik"}
                </div>
              </>
            ) : (
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  padding: "6px 12px",
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Belum ada prediksi
              </div>
            )}
          </div>
        </Card>

        {/* Kemajuan Tugas & Ringkasan Harian Combined */}
        <Card
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            borderRadius: 12,
            border: "none",
            padding: "0",
            background: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Kemajuan Tugas Section */}
          <div style={{ padding: "18px", borderBottom: "1px solid #F0F0F0" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.textGray,
                marginBottom: 10,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                textAlign: "center",
              }}
            >
              Kemajuan Tugas
            </div>
            {summary.totalTugas === 0 ? (
              <div
                style={{
                  color: "#a39c94",
                  textAlign: "center",
                  padding: "40px 20px",
                  fontSize: "14px",
                  height: "110px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                <div> Belum ada tugas</div>
                <a
                  href="/tasks/create"
                  style={{
                    color: "#7bbf9e",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: "600",
                    borderBottom: "1px solid #7bbf9e",
                  }}
                >
                  Buat tugas sekarang →
                </a>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "clamp(12px, 3vw, 20px)", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                {/* Chart on the center */}
                <div style={{ width: "140px", height: "140px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <MiniPie
                        data={taskProgress}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        dataKey="value"
                      >
                        {taskProgress.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </MiniPie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend on the right - 3 rows */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "clamp(8px, 2vw, 12px)",
                    justifyContent: "center",
                    flex: "0 1 auto",
                    minWidth: "120px",
                  }}
                >
                  {taskProgress.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: t.color,
                        }}
                      />
                      <span style={{ color: C.textGray }}>
                        {t.value} {t.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ringkasan Harian Section */}
          <div style={{ padding: "16px" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.textGray,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                textAlign: "center",
              }}
            >
              Ringkasan Harian
            </div>
            {summary.totalTugas === 0 ? (
              <div
                style={{
                  color: "#a39c94",
                  textAlign: "center",
                  padding: "30px 20px",
                  fontSize: "14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                <div style={{ color: "#a39c94" }}>
                  <ListTodo size={32} strokeWidth={1.5} />
                </div>
                <div>Belum ada tugas yang dibuat</div>
                <a
                  href="/tasks/create"
                  style={{
                    color: "#7bbf9e",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: "600",
                    borderBottom: "1px solid #7bbf9e",
                  }}
                >
                  Mulai buat tugas →
                </a>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>
                {[
                  {
                    val: summary.totalTugas,
                    label: "Total Tugas",
                    desc: "Jumlah seluruh tugas Anda",
                    unit: "task",
                    bg: C.accent,
                    icon: ListTodo,
                  },
                  {
                    val: summary.tenggatWaktuTugas,
                    label: "Tenggat Waktu",
                    desc: "Task dengan deadline ≤ 7 hari ke depan",
                    unit: "task",
                    bg: C.primary,
                    icon: Clock,
                  },
                  {
                    val: summary.estimasiBebanKerja,
                    label: "Estimasi Beban",
                    desc: "Total jam kerja dari semua task",
                    unit: "jam",
                    bg: C.red,
                    icon: Zap,
                  },
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  const handleItemClick = () => {
                    if (i === 0) {
                      // Total Tugas - go to Kelola Tugas
                      navigate("/tasks");
                    } else if (i === 1) {
                      // Tenggat Waktu - show upcoming tasks modal
                      setShowUpcomingTasks(true);
                    } else if (i === 2) {
                      // Estimasi Beban - go to Kelola Tugas
                      navigate("/tasks");
                    }
                  };
                  return (
                    <div
                      key={i}
                      onClick={handleItemClick}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        padding: 10,
                        borderRight: i < 2 ? "1px solid #F0F0F0" : "none",
                        flex: 1,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        borderRadius: 8,
                        position: "relative",
                      }}
                      title={item.desc}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F9FAFB";
                        e.currentTarget.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "8px",
                          background: `${item.bg}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: item.bg,
                        }}
                      >
                        <IconComponent size={24} />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 18,
                            color: item.bg,
                          }}
                        >
                          {item.val} {item.unit && <span style={{ fontSize: 14, fontWeight: 500 }}>{item.unit}</span>}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.textGray,
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "clamp(12px, 3vw, 24px)",
          maxWidth: 1200,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* Bar Chart - Trend Beban SKS */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "clamp(14px, 2vw, 20px)",
            border: "none",
            boxShadow: "none",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "clamp(12px, 2vw, 16px)",
              flexWrap: "wrap",
              gap: "clamp(8px, 2vw, 12px)"
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#8b8377",
                letterSpacing: "0.5px",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              Trend Beban SKS
            </h2>
            {uniqueStrata.length > 0 && (
              <div ref={strataSKSRef} style={{ position: 'relative', width: 'fit-content' }}>
                <div
                  onClick={() => setOpenStrataSKSDropdown(!openStrataSKSDropdown)}
                  style={{
                    border: "2px solid #29B6F6",
                    borderRadius: 20,
                    padding: "10px 14px",
                    fontSize: 13,
                    minWidth: "80px",
                    textAlign: "center",
                    outline: "none",
                    color: "#29B6F6",
                    background: "white",
                    boxSizing: "border-box",
                    fontWeight: 600,
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  onMouseEnter={(e) => {
                    if (!openStrataSKSDropdown) {
                      e.currentTarget.style.borderColor = "#0D9FE3";
                      e.currentTarget.style.background = "#E1F5FE";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!openStrataSKSDropdown) {
                      e.currentTarget.style.borderColor = "#29B6F6";
                      e.currentTarget.style.background = "white";
                    }
                  }}
                >
                  <span>{selectedStrata || "Strata"}</span>
                  <span style={{transform: openStrataSKSDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", fontSize: 10}}>▼</span>
                </div>
                {openStrataSKSDropdown && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 6,
                    background: "white",
                    border: "2px solid #29B6F6",
                    borderRadius: 16,
                    boxShadow: "0 8px 20px rgba(41, 182, 246, 0.15)",
                    zIndex: 1000,
                    overflow: "hidden",
                    minWidth: "80px"
                  }}>
                    {uniqueStrata.map((strata) => (
                      <div
                        key={strata}
                        onClick={() => {
                          setSelectedStrata(strata);
                          setOpenStrataSKSDropdown(false);
                        }}
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: 13,
                          transition: "all 0.15s ease",
                          background: selectedStrata === strata ? "#E1F5FE" : "transparent",
                          color: selectedStrata === strata ? "#29B6F6" : "#333",
                          fontWeight: selectedStrata === strata ? 600 : 500,
                          textAlign: "center"
                        }}
                        onMouseEnter={(e) => {
                          if (selectedStrata !== strata) {
                            e.currentTarget.style.background = "#F9F9F9";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedStrata !== strata) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {strata}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {sksTrend && sksTrend.length > 0 ? (
            <>
              <div
                style={{
                  position: "relative",
                  height: "280px",
                  marginBottom: "12px",
                }}
              >
                <BarChart
                  data={{
                    labels: sksTrend.map((d) => d.semester),
                    datasets: [
                      {
                        label: "Beban SKS",
                        data: sksTrend.map((d) => d.sks),
                        backgroundColor: "#7bbf9e",
                        borderRadius: 8,
                        borderSkipped: false,
                        categoryPercentage: 0.6,
                        barPercentage: 0.8,
                      },
                    ],
                  }}
                  options={{
                    indexAxis: "x",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: "#ffffff",
                        borderColor: "#e0dbd1",
                        borderWidth: 1,
                        titleColor: "#8b8377",
                        bodyColor: "#8b8377",
                        padding: 8,
                        borderRadius: 6,
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 },
                      },
                    },
                    scales: {
                      y: {
                        display: false,
                        beginAtZero: true,
                        max: maxSks,
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          color: "#a39c94",
                          font: { size: 12 },
                        },
                        border: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "12px",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#8b8377",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: "#7bbf9e",
                      borderRadius: "2px",
                    }}
                  />
                  <span>Beban SKS</span>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                color: "#a39c94",
                textAlign: "center",
                padding: "40px 20px",
                fontSize: "14px",
                height: "280px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <div>Belum ada data akademik</div>
              <a
                href="/akademik/input"
                style={{
                  color: "#7bbf9e",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: "600",
                  borderBottom: "1px solid #7bbf9e",
                }}
              >
                Input data sekarang →
              </a>
            </div>
          )}
        </div>

        {/* Line Chart - Trend IPK */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "20px",
            border: "none",
            boxShadow: "none",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#8b8377",
                letterSpacing: "0.5px",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              Trend IPK
            </h2>
            {uniqueStrata.length > 0 && (
              <div ref={strataIPKRef} style={{ position: 'relative', width: 'fit-content' }}>
                <div
                  onClick={() => setOpenStrataIPKDropdown(!openStrataIPKDropdown)}
                  style={{
                    border: "2px solid #29B6F6",
                    borderRadius: 20,
                    padding: "10px 14px",
                    fontSize: 13,
                    minWidth: "80px",
                    textAlign: "center",
                    outline: "none",
                    color: "#29B6F6",
                    background: "white",
                    boxSizing: "border-box",
                    fontWeight: 600,
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  onMouseEnter={(e) => {
                    if (!openStrataIPKDropdown) {
                      e.currentTarget.style.borderColor = "#0D9FE3";
                      e.currentTarget.style.background = "#E1F5FE";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!openStrataIPKDropdown) {
                      e.currentTarget.style.borderColor = "#29B6F6";
                      e.currentTarget.style.background = "white";
                    }
                  }}
                >
                  <span>{selectedStrata || "Strata"}</span>
                  <span style={{transform: openStrataIPKDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", fontSize: 10}}>▼</span>
                </div>
                {openStrataIPKDropdown && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 6,
                    background: "white",
                    border: "2px solid #29B6F6",
                    borderRadius: 16,
                    boxShadow: "0 8px 20px rgba(41, 182, 246, 0.15)",
                    zIndex: 1000,
                    overflow: "hidden",
                    minWidth: "80px"
                  }}>
                    {uniqueStrata.map((strata) => (
                      <div
                        key={strata}
                        onClick={() => {
                          setSelectedStrata(strata);
                          setOpenStrataIPKDropdown(false);
                        }}
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #F0F0F0",
                          fontSize: 13,
                          transition: "all 0.15s ease",
                          background: selectedStrata === strata ? "#E1F5FE" : "transparent",
                          color: selectedStrata === strata ? "#29B6F6" : "#333",
                          fontWeight: selectedStrata === strata ? 600 : 500,
                          textAlign: "center"
                        }}
                        onMouseEnter={(e) => {
                          if (selectedStrata !== strata) {
                            e.currentTarget.style.background = "#F9F9F9";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedStrata !== strata) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {strata}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {ipkTrend && ipkTrend.length > 0 ? (
            <>
              <div
                style={{
                  position: "relative",
                  height: "280px",
                  marginBottom: "12px",
                }}
              >
                <LineChart
                  data={{
                    labels: ipkTrend.map((d) => d.semester),
                    datasets: [
                      {
                        label: "IP Semester",
                        data: ipkTrend.map((d) => d.ip),
                        borderColor: "#e9a84c",
                        borderDash: [5, 5],
                        borderWidth: 2.5,
                        pointRadius: 5,
                        pointBackgroundColor: "#e9a84c",
                        pointBorderColor: "#e9a84c",
                        pointBorderWidth: 0,
                        pointHoverRadius: 6,
                        tension: 0.3,
                        fill: false,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: "#ffffff",
                        borderColor: "#e0dbd1",
                        borderWidth: 1,
                        titleColor: "#8b8377",
                        bodyColor: "#8b8377",
                        padding: 8,
                        borderRadius: 6,
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 },
                      },
                    },
                    scales: {
                      y: {
                        min: minIpk,
                        max: maxIpk,
                        ticks: {
                          color: "#a39c94",
                          font: { size: 12 },
                          callback: (value) => {
                            const rounded = Math.round(value * 10) / 10;
                            return rounded <= 4.0 && value === rounded ? rounded.toFixed(1) : '';
                          },
                        },
                        grid: {
                          color: "#e8e0d7",
                          drawBorder: false,
                        },
                        border: {
                          display: false,
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          color: "#a39c94",
                          font: { size: 12 },
                        },
                        border: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "12px",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#8b8377",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "2.5px",
                      backgroundColor: "#e9a84c",
                      backgroundImage:
                        "linear-gradient(to right, #e9a84c 0%, #e9a84c 60%, transparent 60%)",
                    }}
                  />
                  <span>IP Semester</span>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                color: "#a39c94",
                textAlign: "center",
                padding: "40px 20px",
                fontSize: "14px",
                height: "280px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <div>Belum ada data akademik</div>
              <a
                href="/akademik/input"
                style={{
                  color: "#7bbf9e",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: "600",
                  borderBottom: "1px solid #7bbf9e",
                }}
              >
                Input data sekarang →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tugas Mendatang */}
      {tasks.length > 0 && (
        <div
          style={{
            maxWidth: 1200,
            margin: "clamp(16px, 4vw, 24px) auto 0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "clamp(12px, 4vw, 24px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            boxSizing: "border-box",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(11px, 2.5vw, 13px)",
              fontWeight: "700",
              color: "#8b8377",
              marginBottom: "clamp(12px, 3vw, 20px)",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            📋 Tugas Mendatang
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks
              .filter((t) => t.status !== "Done") // Exclude completed tasks
              .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
              .slice(0, 5) // Show only top 5
              .map((task) => {
                const sisaHari = calculateSisaHari(task.deadline);
                const isOverdue = sisaHari < 0;

                return (
                  <div
                    key={task._id}
                    onClick={() => setSelectedTask(task)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "clamp(10px, 3vw, 14px) clamp(12px, 3vw, 16px)",
                      background: "#f9f9f9",
                      borderRadius: "10px",
                      border: "1px solid #e8e8e8",
                      transition: "all 0.2s",
                      cursor: "pointer",
                      gap: "clamp(8px, 2vw, 12px)",
                      flexWrap: "wrap",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#f0f8f6";
                      e.currentTarget.style.borderColor = "#7bbf9e";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(123,191,158,0.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f9f9f9";
                      e.currentTarget.style.borderColor = "#e8e8e8";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "clamp(10px, 2vw, 14px)",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        disabled
                        style={{
                          cursor: "not-allowed",
                          width: 20,
                          height: 20,
                          flexShrink: 0,
                          accentColor: "#7bbf9e",
                          opacity: 0.5,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "clamp(12px, 2.5vw, 13px)",
                            fontWeight: 600,
                            color: "#2c3e50",
                            marginBottom: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.namaTugas}
                        </div>
                        <div
                          style={{
                            fontSize: "clamp(10px, 2vw, 11px)",
                            color: "#999",
                            fontWeight: 500,
                          }}
                        >
                          {task.kategoriTask}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(10px, 2vw, 11px)",
                        fontWeight: 700,
                        padding: "clamp(6px, 2vw, 8px) clamp(10px, 2vw, 14px)",
                        borderRadius: "20px",
                        background: isOverdue
                          ? "#FF6B6B"
                          : sisaHari === 0
                            ? "#FF6B6B"
                            : sisaHari === 1
                              ? "#FFC107"
                              : "#4CAF50",
                        color: "#fff",
                        minWidth: "clamp(70px, 20vw, 90px)",
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isOverdue
                        ? `Terlambat ${Math.abs(sisaHari)} hari`
                        : sisaHari === 1
                          ? "1 hari"
                          : sisaHari === 0
                            ? "Hari ini"
                            : `${sisaHari} hari`}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxSizing: "border-box",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "#F8FAFB",
                borderRadius: "16px 16px 0 0",
                padding: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Detail Tugas
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#1F2937",
                    lineHeight: 1.2,
                  }}
                >
                  {selectedTask.namaTugas}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  background: "#F3F4F6",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                  padding: "8px",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                  flexShrink: 0,
                  marginLeft: "12px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#E5E7EB";
                  e.currentTarget.style.color = "#374151";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#F3F4F6";
                  e.currentTarget.style.color = "#6B7280";
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Status & Deadline Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Status */}
                <div
                  style={{
                    background: "#F9FAFB",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#6B7280",
                      marginBottom: "6px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <CheckCircle size={14} />
                    Status
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "white",
                      background:
                        selectedTask.status === "Backlog"
                          ? "#6B7280"
                          : selectedTask.status === "On Progress"
                            ? "#F59E0B"
                            : "#10B981",
                    }}
                  >
                    {selectedTask.status}
                  </div>
                </div>

                {/* Deadline */}
                {selectedTask.deadline && (
                  <div
                    style={{
                      background: "#F9FAFB",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#6B7280",
                        marginBottom: "6px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Calendar size={14} />
                      Tenggat Waktu
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1F2937" }}>
                      {new Date(selectedTask.deadline).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Category */}
              <div
                style={{
                  background: "#F9FAFB",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <Tag size={16} color="#6B7280" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "11px", color: "#6B7280", fontWeight: 700, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Kategori
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#1F2937" }}>
                    {selectedTask.kategoriTask}
                  </div>
                </div>
              </div>

              {/* Estimasi Jam */}
              {selectedTask.estimasiJam && (
                <div
                  style={{
                    background: "#F9FAFB",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Clock size={16} color="#6B7280" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "11px", color: "#6B7280", fontWeight: 700, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Estimasi Jam Kerja
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1F2937" }}>
                      {selectedTask.estimasiJam} jam
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedTask.deskripsi && (
                <div
                  style={{
                    background: "#F9FAFB",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#6B7280",
                      marginBottom: "8px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Info size={14} />
                    Deskripsi
                  </div>
                  <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.5", fontWeight: 500 }}>
                    {selectedTask.deskripsi}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "8px",
                  paddingTop: "16px",
                  borderTop: "1px solid #E5E7EB",
                }}
              >
                <button
                  onClick={() => navigate(`/tasks/edit/${selectedTask._id}`)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "#10B981",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#059669")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "#10B981")}
                >
                  <Edit2 size={16} />
                  Edit Tugas
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "#F3F4F6",
                    color: "#374151",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#E5E7EB";
                    e.currentTarget.style.borderColor = "#9CA3AF";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#F3F4F6";
                    e.currentTarget.style.borderColor = "#D1D5DB";
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Tasks Modal */}
      {showUpcomingTasks && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setShowUpcomingTasks(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxSizing: "border-box",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: "#F8FAFB",
                borderRadius: "16px 16px 0 0",
                padding: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Tugas Mendatang
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#1F2937",
                  }}
                >
                  Daftar Tenggat Waktu
                </h2>
              </div>
              <button
                onClick={() => setShowUpcomingTasks(false)}
                style={{
                  background: "#F3F4F6",
                  border: "none",
                  cursor: "pointer",
                  color: "#6B7280",
                  padding: "8px",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                  flexShrink: 0,
                  marginLeft: "12px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#E5E7EB";
                  e.currentTarget.style.color = "#374151";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#F3F4F6";
                  e.currentTarget.style.color = "#6B7280";
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tasks List */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {(() => {
                const filtered = tasks.filter((t) => {
                  // Filter SAMA DENGAN backend: status !== Done dan deadline <= 7 hari ke depan
                  if (t.status === "Done") return false;
                  
                  const sisaHari = calculateSisaHari(t.deadline);
                  
                  console.log(`Task: ${t.namaTugas}, Deadline: ${t.deadline}, SisaHari: ${sisaHari}, Pass: ${sisaHari <= 7}`);
                  
                  // Tampilkan task yang ada dalam 7 hari ke depan (upcoming)
                  return sisaHari <= 7;
                });
                
                console.log(`Modal: Showing ${filtered.length} tasks out of ${tasks.length} total. Summary says: ${summary.tenggatWaktuTugas}`);
                
                return filtered;
              })()
                
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                .map((task, idx) => {
                  const deadline = new Date(task.deadline);
                  const sisaHari = calculateSisaHari(task.deadline);
                  const isOverdue = sisaHari < 0;
                  
                  let statusColor = "#10B981"; // Normal - hijau
                  let statusBg = "#ECFDF5";
                  let priorityLabel = "Normal";
                  let priorityIcon = "📅";
                  
                  if (isOverdue) {
                    statusColor = "#DC2626"; // Overdue - merah
                    statusBg = "#FEE2E2";
                    priorityLabel = `Terlambat ${Math.abs(sisaHari)} hari`;
                    priorityIcon = "🔥";
                  } else if (sisaHari === 0) {
                    statusColor = "#DC2626"; // Hari ini - merah
                    statusBg = "#FEE2E2";
                    priorityLabel = "Hari ini";
                    priorityIcon = "⚡";
                  } else if (sisaHari === 1) {
                    statusColor = "#EA580C"; // Esok - orange
                    statusBg = "#FFEDD5";
                    priorityLabel = "1 hari tersisa";
                    priorityIcon = "⚠️";
                  } else if (sisaHari <= 3) {
                    statusColor = "#F59E0B"; // Dekat - kuning
                    statusBg = "#FFFBEB";
                    priorityLabel = `${sisaHari} hari tersisa`;
                    priorityIcon = "📌";
                  } else {
                    priorityLabel = `${sisaHari} hari tersisa`;
                    priorityIcon = "✓";
                  }

                  return (
                    <div
                      key={task._id}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowUpcomingTasks(false);
                      }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        alignItems: "start",
                        gap: "12px",
                        padding: "14px 16px",
                        background: "white",
                        borderRadius: "12px",
                        border: `2px solid ${statusBg}`,
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = statusBg;
                        e.currentTarget.style.boxShadow =
                          `0 4px 12px rgba(0,0,0,0.08)`;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {/* Left Content */}
                      <div style={{ display: "flex", gap: "12px", minWidth: 0 }}>
                        <div style={{ 
                          fontSize: "28px", 
                          lineHeight: 1, 
                          display: "flex", 
                          alignItems: "center",
                          flexShrink: 0 
                        }}>
                          {priorityIcon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#1F2937",
                              marginBottom: "4px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {task.namaTugas}
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "white",
                                background: task.status === "Backlog"
                                  ? "#6B7280"
                                  : task.status === "On Progress"
                                    ? "#F59E0B"
                                    : "#10B981",
                                padding: "2px 8px",
                                borderRadius: "4px",
                              }}
                            >
                              {task.status}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#6B7280",
                                background: "#F3F4F6",
                                padding: "2px 8px",
                                borderRadius: "4px",
                              }}
                            >
                              {task.kategoriTask}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6B7280",
                              fontWeight: 500,
                            }}
                          >
                            {deadline.toLocaleDateString("id-ID", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right Content - Status Badge */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "4px",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: statusBg,
                            color: statusColor,
                            whiteSpace: "nowrap",
                            textAlign: "center",
                          }}
                        >
                          {priorityLabel}
                        </div>
                        {task.estimasiJam && (
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              color: "#6B7280",
                              padding: "3px 6px",
                              background: "#F3F4F6",
                              borderRadius: "4px",
                            }}
                          >
                            ⏱️ {task.estimasiJam}h
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              {tasks.filter((t) => {
                if (t.status === "Done") return false;
                const deadline = new Date(t.deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const sisaHari = Math.ceil(
                  (deadline - today) / (1000 * 60 * 60 * 24),
                );
                return sisaHari <= 7;
              }).length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#9CA3AF",
                  }}
                >
                  <div style={{ fontSize: "40px", marginBottom: "8px" }}>✨</div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#6B7280", marginBottom: "4px" }}>Tidak ada tugas mendatang</div>
                  <div style={{ fontSize: "12px", color: "#9CA3AF" }}>Semua tugas Anda sudah terselesaikan</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid #E5E7EB",
                padding: "16px 24px",
                background: "white",
                borderRadius: "0 0 16px 16px",
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() => navigate("/tasks")}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,185,129,0.3)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span>Kelola Tugas</span>
                <span>→</span>
              </button>
              <button
                onClick={() => setShowUpcomingTasks(false)}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#E5E7EB";
                  e.currentTarget.style.borderColor = "#9CA3AF";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#F3F4F6";
                  e.currentTarget.style.borderColor = "#D1D5DB";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default DashboardMahasiswa;
