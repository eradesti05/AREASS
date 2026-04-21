import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import { Card, StatCard } from "../components/UIComponents";
import { akademikAPI, prediksiAPI } from "../services/api";
import {
  BookOpen,
  TrendingUp,
  Award,
  BarChart2,
  RefreshCw,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";

const AnalyticsPage = () => {
  const { mahasiswaId } = useParams();
  const [searchParams] = useSearchParams();
  const strataFilter = searchParams.get("strata");
  
  const [akademik, setAkademik] = useState([]);
  const [prediksi, setPrediksi] = useState({
    hasilPrediksi: "Aman",
    skorConfidence: 0,
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchAll = async () => {
      try {
        let akademikData, prediksiData;

        if (mahasiswaId) {
          // Get data for specific mahasiswa (dosen/kaprodi view)
          [akademikData, prediksiData] = await Promise.all([
            akademikAPI.getByMahasiswaId(mahasiswaId),
            prediksiAPI.getByMahasiswaId(mahasiswaId),
          ]);
        } else {
          // Get logged-in user data
          [akademikData, prediksiData] = await Promise.all([
            akademikAPI.getAll(),
            prediksiAPI.getLatest(strataFilter || "S1"),
          ]);
        }

        setAkademik(Array.isArray(akademikData) ? akademikData : []);
        setPrediksi(prediksiData);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [mahasiswaId, strataFilter]);

  // Filter akademik berdasarkan strata parameter jika ada
  const filteredAkademik = strataFilter 
    ? akademik.filter((item) => item.strata === strataFilter) 
    : akademik;

  const latest = filteredAkademik[filteredAkademik.length - 1] || {};

  const prediksiColor =
    prediksi.hasilPrediksi === "Aman"
      ? C.green
      : prediksi.hasilPrediksi === "Waspada"
        ? C.yellow
        : C.red;

  const rekomendasiText = {
    Aman: `IPK Anda sebesar ${latest.ipkTotal?.toFixed(2) || "-"} menunjukkan capaian akademik kamu berada pada kondisi yang baik. Pertahankan konsistensimu dalam belajar. Sekarang kamu berada di jalur yang tepat untuk menyelesaikan studi tepat waktu.`,
    Waspada: `IPK Anda sebesar ${latest.ipkTotal?.toFixed(2) || "-"} menunjukkan bahwa kamu sudah berusaha semakismal mungkin dalam belajar, namun ada beberapa indikator yang perlu kamu diperhatikan. Alangkah baiknya segera diskusikan kendala dalam belajar yang kamu hadapi dengan dosen wali untuk mencegah risiko lebih lanjut.`,
    "Perlu perhatian": `IPK Anda sebesar ${latest.ipkTotal?.toFixed(2) || "-"} menunjukkan bahwa kamu sudah coba bejuang sejauh ini. Saat ini performa akademikmu memerlukan perhatian segera. Berdasarkan data akademikmu, terdapat risiko yang signifikan. Alangkah baiknya segera menghubungi dosen wali untuk mendapatkan pendampingan.`,
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
    <div style={{ padding: 32 }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: C.textDark,
          marginBottom: 24,
        }}
      >
        Detail Analisis Akademik
      </div>

      {/* Data Akademik */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 32,
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

      {/* Prediksi dan Rekomendasi  */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: C.textDark,
          marginBottom: 16,
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
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.textDark,
                marginBottom: 8,
              }}
            >
              Rekomendasi
            </div>

            <p
              style={{
                color: C.textGray,
                lineHeight: 1.8,
                margin: 0,
                fontSize: 14,
              }}
            >
              Berdasarkan analisis data akademik Anda, performa akademik Anda
              saat ini berada dalam kondisi{" "}
              <strong style={{ color: prediksiColor }}>
                {prediksi.hasilPrediksi}
              </strong>
              .{" "}
              {rekomendasiText[prediksi.hasilPrediksi] ||
                rekomendasiText["Aman"]}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
