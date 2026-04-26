import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import { Card, StatCard } from "../components/UIComponents";
import { akademikAPI, prediksiAPI, dosenAPI } from "../services/api";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import {
  BookOpen,
  TrendingUp,
  Award,
  BarChart2,
  RefreshCw,
  ShieldCheck,
  Clock,
  UserCheck,
  FileDigit,
} from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
);

// Fungsi untuk capitalize setiap awal kata
const capitalize = (str) => {
  if (!str) return str;
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const AnalyticsPage = () => {
  const { mahasiswaId } = useParams();
  const [searchParams] = useSearchParams();
  const strataFilter = searchParams.get("strata");

  const [akademik, setAkademik] = useState([]);
  const [mahasiswa, setMahasiswa] = useState(null);
  const [prediksi, setPrediksi] = useState({
    hasilPrediksi: "Aman",
    skorConfidence: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uniqueStrata, setUniqueStrata] = useState([]);
  const [selectedStrata, setSelectedStrata] = useState("");
  const [randomNim, setRandomNim] = useState("");

  // Generate 8 random digits untuk NIM
  useEffect(() => {
    const generateRandomNim = () => {
      const nim = Math.floor(10000000 + Math.random() * 90000000).toString();
      setRandomNim(nim);
    };
    generateRandomNim();
  }, [mahasiswaId]);
  useEffect(() => {
    const fetchAll = async () => {
      try {
        let akademikData, prediksiData, mahasiswaData = null;

        if (mahasiswaId) {
          // Get data for specific mahasiswa (dosen/kaprodi view)
          [akademikData, prediksiData] = await Promise.all([
            dosenAPI.getAkademikById(mahasiswaId),
            prediksiAPI.getByMahasiswaId(mahasiswaId),
          ]);
          console.log("📚 Akademik data dari dosen endpoint:", akademikData);
          
          if (akademikData && akademikData.length > 0) {
            const firstAkademik = akademikData[0];
            console.log("🔍 Struktur data akademik pertama:", JSON.stringify(firstAkademik, null, 2));
            
            // Try to get nama dari mahasiswaId populate, fallback ke NIL
            let nama = firstAkademik.mahasiswaId?.nama;
            if (!nama) {
              // Jika tidak ada, fetch dari dosen/mahasiswa list
              try {
                const mahasiswaList = await dosenAPI.getMahasiswa();
                const found = mahasiswaList.find(m => m.id === mahasiswaId);
                nama = found?.nama;
              } catch (err) {
                console.log("Info: Could not fetch from mahasiswa list");
              }
            }
            
            mahasiswaData = {
              nama: nama || "-",
              nim: firstAkademik.nim || firstAkademik.mahasiswaId?.nim || "-",
              prodi: firstAkademik.mahasiswaId?.prodi || "-",
            };
            console.log("👤 Mahasiswa data extracted:", mahasiswaData);
          }
          console.log("📊 Prediksi data:", prediksiData);
        } else {
          // Get logged-in user data
          [akademikData, prediksiData] = await Promise.all([
            akademikAPI.getAll(),
            prediksiAPI.getLatest(strataFilter || "S1"),
          ]);
        }

        // Sort by semesterKe ascending dan remove duplikat
        let sorted = Array.isArray(akademikData) ? akademikData : akademikData ? [akademikData] : [];
        sorted = sorted.sort((a, b) => (a.semesterKe || 0) - (b.semesterKe || 0));
        
        // Remove duplikat: keep hanya yg terbaru (updatedAt terbaru) per semester PER STRATA
        const deduped = {};
        sorted.forEach((item) => {
          const key = `${item.strata || 'unknown'}_${item.semesterKe || 0}`;
          if (!deduped[key] || new Date(item.updatedAt) > new Date(deduped[key].updatedAt)) {
            deduped[key] = item;
          }
        });
        const dedupedArray = Object.values(deduped).sort((a, b) => (a.semesterKe || 0) - (b.semesterKe || 0));
        console.log("📚 Original akademik data length:", sorted.length);
        console.log("📚 Deduplicated akademik data length:", dedupedArray.length);
        console.log("📚 Deduplicated akademik:", dedupedArray);
        
        setAkademik(dedupedArray);
        
        // Extract unique strata
        const strata = [...new Set(dedupedArray.map((item) => item.strata))].filter(Boolean);
        setUniqueStrata(strata);
        
        // Set default selectedStrata ke strata pertama
        if (strata.length > 0 && !selectedStrata) {
          setSelectedStrata(strata[0]);
        }
        setPrediksi(prediksiData);
        if (mahasiswaData) setMahasiswa(mahasiswaData);
      } catch (err) {
        console.error("❌ Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [mahasiswaId, strataFilter]);

  // Filter akademik berdasarkan selectedStrata
  const filteredAkademik = selectedStrata
    ? akademik.filter((item) => item.strata === selectedStrata)
    : akademik;

  // Ambil data terbaru berdasarkan semesterKe terbesar
  const latest = filteredAkademik.length > 0
    ? filteredAkademik.reduce((prev, current) =>
        (prev.semesterKe || 0) > (current.semesterKe || 0) ? prev : current
      )
    : {};

  // Update prediksi ketika selectedStrata berubah
  useEffect(() => {
    if (latest && latest.hasilPrediksi) {
      setPrediksi({
        hasilPrediksi: latest.hasilPrediksi,
        skorConfidence: latest.skorConfidence || 0,
      });
    }
  }, [selectedStrata, latest]);

  const prediksiColor =
    prediksi.hasilPrediksi === "Aman"
      ? C.green
      : prediksi.hasilPrediksi === "Waspada"
        ? C.yellow
        : C.red;

  const renderRekomendasi = (status) => {
    const nama = capitalize(mahasiswa?.nama) || "mahasiswa";
    const ipk = latest.ipkTotal?.toFixed(2) || "-";
    
    if (status === "Aman") {
      return (
        <>
          IPK <strong>{nama}</strong> sebesar <strong>{ipk}</strong> menunjukkan performa yang luar biasa! Mahasiswa ini telah menunjukkan konsistensi yang hebat dalam studi. Pertahankan dukungan dan motivasi agar mahasiswa tetap mempertahankan semangat belajarnya, sehingga dapat lulus tepat waktu dengan hasil yang memuaskan.
        </>
      );
    } else if (status === "Waspada") {
      return (
        <>
          IPK <strong>{nama}</strong> sebesar <strong>{ipk}</strong> - Apresiasi atas usaha yang telah ditunjukkan. Saat ini ada beberapa aspek akademik yang memerlukan perhatian khusus untuk menjaga stabilitas prestasi. Disarankan untuk melakukan konsultasi akademik lebih intensif guna membantu mahasiswa mengidentifikasi tantangan dan menemukan solusi yang tepat.
        </>
      );
    } else {
      return (
        <>
          IPK <strong>{nama}</strong> sebesar <strong>{ipk}</strong> - Mahasiswa ini memerlukan perhatian khusus dan dukungan akademik yang lebih intensif. Kondisi akademik saat ini cukup menantang dan membutuhkan intervensi segera. Disarankan untuk melakukan pertemuan konsultasi akademik guna mengidentifikasi akar masalah dan merancang rencana aksi bersama untuk meningkatkan performa akademiknya.
        </>
      );
    }
  };

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
        <div style={{ color: C.textGray, fontSize: 16 }}>⏳ Memuat data...</div>
      </div>
    );

  return (
    <div style={{ padding: "clamp(16px, 4vw, 32px)" }}>
      <div
        style={{
          fontSize: "clamp(18px, 5vw, 22px)",
          fontWeight: 700,
          color: C.textDark,
          marginBottom: "clamp(16px, 3vw, 24px)",
        }}
      >
        Identitas
      </div>
      {/* Data Akademik */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(600px, 1fr))",
          gap: "clamp(12px, 2vw, 20px)",
          marginBottom: "clamp(20px, 3vw, 32px)",
        }}
      >
        <StatCard
          icon={<UserCheck size={24} color="#6366F1" />}
          label="Nama Lengkap"
          value={capitalize(mahasiswa?.nama) || "-"}
          iconBg="#EEF2FF"
        />
        <StatCard
          icon={<FileDigit size={24} color="#F59E0B" />}
          label="Nomor Induk Mahasiswa"
          value={randomNim || "-"}
          iconBg="#FFFBEB"
        />
      </div>

      <div
        style={{
          fontSize: "clamp(18px, 5vw, 22px)",
          fontWeight: 700,
          color: C.textDark,
          marginBottom: "clamp(16px, 3vw, 24px)",
        }}
      >
        Detail Analisis Akademik
      </div>

      {/* Data Akademik */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "clamp(12px, 2vw, 20px)",
          marginBottom: "clamp(20px, 3vw, 32px)",
        }}
      >
        <StatCard
          icon={<BookOpen size={24} color="#6366F1" />}
          label="Semester"
          value={latest.semesterKe || "-"}
          secondary="Aktif"
          iconBg="#EEF2FF"
        />
        <StatCard
          icon={<TrendingUp size={24} color="#F59E0B" />}
          label="IP Semester"
          value={latest.ipSemester?.toFixed(2) || "-"}
          secondary="Semester ini"
          iconBg="#FFFBEB"
        />
        <StatCard
          icon={<Award size={24} color="#EC4899" />}
          label="IPK Kumulatif"
          value={latest.ipkTotal?.toFixed(2) || "-"}
          secondary={prediksi.hasilPrediksi}
          secondaryColor={
            prediksi.hasilPrediksi === "Aman"
              ? "#10B981"
              : prediksi.hasilPrediksi === "Waspada"
                ? "#F59E0B"
                : "#EF4444"
          }
          iconBg="#FCE7F3"
        />
        <StatCard
          icon={<Clock size={24} color="#10B981" />}
          label="SKS Semester"
          value={latest.sksPerSemester || "-"}
          secondary="Semester ini"
          iconBg="#ECFDF5"
        />
        <StatCard
          icon={<BarChart2 size={24} color="#0EA5E9" />}
          label="Total SKS"
          value={latest.totalSks || "-"}
          secondary="Kumulatif"
          iconBg="#F0F9FF"
        />
        <StatCard
          icon={<RefreshCw size={24} color="#8B5CF6" />}
          label="SKS Mengulang"
          value={latest.jumlahMkDiulang ?? 0}
          secondary={latest.jumlahMkDiulang === 0 ? "Baik" : "Perlu Perhatian"}
          secondaryColor={latest.jumlahMkDiulang === 0 ? "#10B981" : "#EF4444"}
          iconBg="#F5F3FF"
        />
      </div>

      {/* Trend Charts Section */}
      {/* Tren Akademik Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "clamp(16px, 3vw, 24px)",
        }}
      >
        <div
          style={{
            fontSize: "clamp(18px, 5vw, 22px)",
            fontWeight: 700,
            color: C.textDark,
          }}
        >
          Tren Akademik
        </div>
        
        {/* Strata Filter Dropdown */}
        {uniqueStrata.length > 0 && (
          <div
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
              cursor: "pointer",
            }}
          >
            <select
              value={selectedStrata}
              onChange={(e) => setSelectedStrata(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                color: "#29B6F6",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {uniqueStrata.map((strata) => (
                <option key={strata} value={strata}>
                  {strata}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Trend Charts Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          gap: "clamp(12px, 2vw, 20px)",
          marginBottom: "clamp(20px, 3vw, 32px)",
        }}
      >
        {/* Bar Chart - SKS */}
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#8b8377",
              marginBottom: "16px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              margin: "0 0 16px 0",
            }}
          >
            Trend Beban SKS
          </h3>
          {filteredAkademik && filteredAkademik.length > 0 ? (
            <div style={{ position: "relative", height: "280px" }}>
              <Bar
                data={{
                  labels: filteredAkademik.map((d) => `Sem ${d.semesterKe}`),
                  datasets: [
                    {
                      label: "Beban SKS",
                      data: filteredAkademik.map((d) => d.sksPerSemester || 0),
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
                      max: Math.max(24, Math.ceil(Math.max(...filteredAkademik.map((d) => d.sksPerSemester || 0)) * 1.1)),
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
          ) : (
            <div style={{ color: "#a39c94", textAlign: "center", padding: "40px 20px" }}>
              Belum ada data SKS
            </div>
          )}
        </div>

        {/* Line Chart - IPK */}
        <div
          style={{
            backgroundColor: C.white,
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#8b8377",
              marginBottom: "16px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              margin: "0 0 16px 0",
            }}
          >
            Trend IPK
          </h3>
          {filteredAkademik && filteredAkademik.length > 0 ? (
            <div style={{ position: "relative", height: "280px" }}>
              <Line
                data={{
                  labels: filteredAkademik.map((d) => `Sem ${d.semesterKe}`),
                  datasets: [
                    {
                      label: "IP Semester",
                      data: filteredAkademik.map((d) => d.ipSemester || 0),
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
                      display: true,
                      min: 0,
                      max: 4.0,
                      ticks: {
                        color: "#a39c94",
                        font: { size: 12 },
                      },
                      border: {
                        display: false,
                      },
                      grid: {
                        drawBorder: false,
                        color: "#f0f0f0",
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
          ) : (
            <div style={{ color: "#a39c94", textAlign: "center", padding: "40px 20px" }}>
              Belum ada data IPK
            </div>
          )}
        </div>
      </div>

      {/* Prediksi dan Rekomendasi  */}
      <div
        style={{
          fontSize: "clamp(16px, 4vw, 18px)",
          fontWeight: 700,
          color: C.textDark,
          marginBottom: "clamp(12px, 2vw, 16px)",
        }}
      >
        Penjelasan Prediksi
      </div>

      <Card>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Hasil Prediksi */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 12,
              background: "#F9FAFB",
            }}
          >
            <div
              style={{
                background: "#FFF0CC",
                padding: 10,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={20} color="#F59E0B" />
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: C.textGray,
                  marginBottom: 2,
                }}
              >
                Hasil Prediksi
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: prediksiColor,
                }}
              >
                {prediksi.hasilPrediksi}
              </div>
            </div>
          </div>

          {/* Rekomendasi */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              padding: "16px",
              borderRadius: 12,
              borderLeft: `4px solid ${prediksiColor}`,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.textDark,
                marginBottom: 12,
              }}
            >
              Rekomendasi
            </div>

            <p
              style={{
                color: C.textDark,
                lineHeight: 2,
                margin: 0,
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              Berdasarkan analisis data akademik <strong>{capitalize(mahasiswa?.nama) || "mahasiswa"}</strong>, performa akademik <strong>{capitalize(mahasiswa?.nama) || "mahasiswa"}</strong> <strong>saat ini</strong> berada dalam kondisi{" "}
              <strong style={{ color: prediksiColor }}>
                {prediksi.hasilPrediksi}
              </strong>
              .{" "}
              {renderRekomendasi(prediksi.hasilPrediksi)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
