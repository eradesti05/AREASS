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
    Aman: `IPK Anda sebesar ${latest.ipkTotal?.toFixed(2) || "-"} menunjukkan luar biasa! Kamu telah menunjukkan konsistensi yang hebat dalam studimu. Pertahankan semangat dan ritme belajarmu ya, kamu sudah berada di jalur yang tepat untuk lulus tepat waktu. Teruslah bersinar!`,
    Waspada: `IPK Anda sebesar ${latest.ipkTotal?.toFixed(2) || "-"} - Apresiasi besar untuk semua usaha yang telah kamu lakukan. Saat ini, ada beberapa bagian akademik yang butuh perhatian kecil agar tetap stabil. Yuk, coba ceritakan kendalamu kepada dosen wali lebih awal supaya langkahmu ke depan kembali lancar dan tenang.`,
    "Perlu perhatian": `IPK Anda sebesar ${latest.ipkTotal?.toFixed(2) || "-"} - Terima kasih sudah berjuang dan bertahan sejauh ini, kerja kerasmu sangat berharga. Saat ini kondisi akademikmu sedang cukup menantang dan butuh perhatian segera. Yuk, kita cari solusi terbaik bersama dosen wali agar bebanmu terasa lebih ringan. Kamu tidak sendirian!`,
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
        Detail Analisis Akademik
      </div>

      {/* Data Akademik */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
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
              backgroundColor: "#F9FAFB",
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
