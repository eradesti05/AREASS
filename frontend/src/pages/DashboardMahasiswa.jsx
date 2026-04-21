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
  const [openStrataSKSDropdown, setOpenStrataSKSDropdown] = useState(false);
  const [openStrataIPKDropdown, setOpenStrataIPKDropdown] = useState(false);
  const [openStrataCardDropdown, setOpenStrataCardDropdown] = useState(false);
  const strataSKSRef = useRef(null);
  const strataIPKRef = useRef(null);
  const strataCardRef = useRef(null);

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
            fontSize: 16,
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
          marginBottom: 32,
          maxWidth: 1200,
          margin: "0 auto 32px",
          boxSizing: "border-box",
        }}
      >
        {/* Mahasiswa Welcome Card */}
        <Card
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            borderRadius: 12,
            border: "none",
            padding: "18px 20px",
            background: "#FFFFFF",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              marginBottom: 8,
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
                fontSize: 22,
                color: C.textDark,
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                {/* Chart on the left */}
                <div style={{ flex: "0 0 50%", display: "flex", justifyContent: "center" }}>
                  <ResponsiveContainer width="100%" height={140}>
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
                    flex: "1",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    justifyContent: "center",
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
                    bg: C.accent,
                    icon: ListTodo,
                  },
                  {
                    val: summary.tenggatWaktuTugas,
                    label: "Tenggat Waktu",
                    bg: C.primary,
                    icon: Clock,
                  },
                  {
                    val: summary.estimasiBebanKerja,
                    label: "Estimasi Beban",
                    bg: C.red,
                    icon: Zap,
                  },
                ].map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        padding: 10,
                        borderRight: i < 2 ? "1px solid #F0F0F0" : "none",
                        flex: 1,
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
                          {item.val}
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
                const deadline = new Date(task.deadline);
                const today = new Date();
                const sisaHari = Math.ceil(
                  (deadline - today) / (1000 * 60 * 60 * 24),
                );
                const isOverdue = sisaHari < 0;

                return (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/tasks/edit/${task._id}`)}
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
    </div>
  );
};

export default DashboardMahasiswa;
