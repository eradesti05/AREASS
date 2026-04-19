import { useState, useEffect } from "react";
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
          prediksiResult = await prediksiAPI.run().catch(async () => {
            return await prediksiAPI
              .getLatest()
              .catch(() => ({ hasilPrediksi: "Aman", skorConfidence: 0 }));
          });
        }

        setAkademik(akademikArray);
        setSummary(summaryResult);
        setTasks(tasksArray);
        setPrediksi(prediksiResult);
        
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

  const latest = akademik[akademik.length - 1] || {};

  // Get unique strata from akademik data
  const uniqueStrata = Array.from(
    new Set(akademik.map((a) => a.strata).filter(Boolean))
  ).sort();

  // Use akademik data if available, filter by selectedStrata
  const filteredAkademik =
    selectedStrata && akademik.length > 0
      ? akademik
          .filter((a) => a.strata === selectedStrata)
          .sort((a, b) => a.semesterKe - b.semesterKe)
      : akademik.sort((a, b) => a.semesterKe - b.semesterKe);

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
          Math.ceil(Math.max(...sksTrend.map((d) => d.sks || 0)) * 1.1)
        )
      : 24;
  const taskProgress = [
    { name: "On Progress", value: summary.onProgress || 0, color: "#FF9800" },
    { name: "Backlog", value: summary.backlog || 0, color: "#000000" },
    { name: "Done", value: summary.done || 0, color: "#4CAF50" },
  ];

  const [hoveredPrediksi, setHoveredPrediksi] = useState(false);

  const statusConfig = {
    Aman: {
      color: C.green,
      label:
        "Hasil performa akademikmu berada pada kondisi yang baik. Pertahankan konsistensimu dalam belajar. Sekarang kamu berada di jalur yang tepat untuk menyelesaikan studi tepat waktu.",
    },
    Waspada: {
      color: C.yellow,
      label:
        "Kamu sudah berusaha semakismal mungkin dalam belajar, namun ada beberapa indikator yang perlu kamu diperhatikan. Performa akademikmu menunjukkan tanda-tanda yang perlu kamu waspadai. Alangkah baiknya segera diskusikan kendala dalam belajar yang kamu hadapi dengan dosen wali untuk mencegah risiko lebih lanjut.",
    },
    "Perlu perhatian": {
      color: C.red,
      label:
        "Semangat, kamu sudah coba bejuang sejauh ini. Saat ini performa akademikmu memerlukan perhatian segera. Berdasarkan data akademikmu, terdapat risiko yang signifikan. Alangkah baiknya segera menghubungi dosen wali untuk mendapatkan pendampingan.",
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
        background: "#f0ede6",
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
            background: status.color,
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
                fontSize: 18,
                color: "#FFFFFF",
                marginBottom: 4,
              }}
            >
              Selamat Datang, {user.nama?.split(" ")[0]}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 12,
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
                    gap: 6,
                    background: "rgba(255,255,255,0.2)",
                    color: "#FFFFFF",
                    padding: "6px 12px",
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle size={14} /> {prediksi.hasilPrediksi}
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 11,
                    marginTop: 8,
                  }}
                >
                  {status.label}
                </div>
                <div
                  onClick={() => navigate("/analytics")}
                  onMouseEnter={() => setHoveredPrediksi(true)}
                  onMouseLeave={() => setHoveredPrediksi(false)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255, 255, 255, 0.56)",
                    background: hoveredPrediksi
                      ? "rgba(255,255,255,0.35)"
                      : "rgba(255,255,255,0.2)",

                    color: "#FFFFFF",
                    padding: "6px 12px",
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 12,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    transform: hoveredPrediksi ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <Info size={14} /> {"Detail Analisis Akademik"}
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

        {/* Kemajuan Tugas */}
        <Card
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            borderRadius: 12,
            border: "none",
            padding: "18px",
            background: "#FFFFFF",
          }}
        >
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
              <div>📭 Belum ada tugas</div>
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
            <>
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <MiniPie
                    data={taskProgress}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={42}
                    dataKey="value"
                  >
                    {taskProgress.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </MiniPie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                {taskProgress.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
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
            </>
          )}
        </Card>

        <Card
          style={{
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            borderRadius: 12,
            border: "none",
            padding: "16px",
            background: "#FFFFFF",
          }}
        >
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
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                      alignItems: "center",
                      gap: 12,
                      paddingBottom: 10,
                      borderBottom: i < 2 ? "1px solid #F0F0F0" : "none",
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
                    <div style={{ flex: 1 }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
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
              <select
                value={selectedStrata}
                onChange={(e) => setSelectedStrata(e.target.value)}
                style={{
                  padding: "10px 36px 10px 14px",
                  borderRadius: "16px",
                  border: "2px solid #E0E0E0",
                  fontSize: "13px",
                  color: "#333",
                  cursor: "pointer",
                  background: "white",
                  transition: "all 0.3s ease",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  backgroundSize: "18px",
                  fontWeight: 500,
                }}
              >
                {uniqueStrata.map((strata) => (
                  <option key={strata} value={strata}>
                    {strata}
                  </option>
                ))}
              </select>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
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
              <select
                value={selectedStrata}
                onChange={(e) => setSelectedStrata(e.target.value)}
                style={{
                  padding: "10px 36px 10px 14px",
                  borderRadius: "16px",
                  border: "2px solid #E0E0E0",
                  fontSize: "13px",
                  color: "#333",
                  cursor: "pointer",
                  background: "white",
                  transition: "all 0.3s ease",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  backgroundSize: "18px",
                  fontWeight: 500,
                }}
              >
                {uniqueStrata.map((strata) => (
                  <option key={strata} value={strata}>
                    {strata}
                  </option>
                ))}
              </select>
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
                        min: 1.0,
                        max: 4.0,
                        ticks: {
                          color: "#a39c94",
                          font: { size: 12 },
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
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 10px)" }}>
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
