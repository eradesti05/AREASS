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
import { useParams } from "react-router-dom";

const AnalyticsPage = () => {
  const [akademik, setAkademik] = useState([]);
  const [prediksi, setPrediksi] = useState({
    hasilPrediksi: "Aman",
    skorConfidence: 0,
  });
  const [loading, setLoading] = useState(true);
  const { mahasiswaId } = useParams();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        let akademikData, prediksiData;

        if (mahasiswaId) {
          akademikData = await fetch(
            `http://localhost:5000/api/akademik/${mahasiswaId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("areass_token")}`,
              },
            },
          ).then((r) => r.json());
          prediksiData = await fetch(
            `http://localhost:5000/api/prediksi/${mahasiswaId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("areass_token")}`,
              },
            },
          ).then((r) => r.json());
        } else {
          [akademikData, prediksiData] = await Promise.all([
            akademikAPI.getAll(),
            prediksiAPI.getLatest(),
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
  }, [mahasiswaId]);

  const latest = akademik[akademik.length - 1] || {};

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
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          icon={<BookOpen size={20} color="#F59E0B" />}
          label="Semester"
          value={latest.semesterKe || "-"}
          iconBg="#FFF0CC"
        />
        <StatCard
          icon={<TrendingUp size={20} color="#F59E0B" />}
          label="IP Semester"
          value={latest.ipSemester?.toFixed(2) || "-"}
          iconBg="#E8EAFF"
        />
        <StatCard
          icon={<Award size={20} color="#F59E0B" />}
          label="IPK"
          value={latest.ipkTotal?.toFixed(2) || "-"}
          iconBg="#FFE0E8"
        />
        <StatCard
          icon={<Clock size={20} color="#F59E0B" />}
          label="SKS Semester"
          value={latest.sksPerSemester || "-"}
          iconBg="#FFF0CC"
        />
        <StatCard
          icon={<BarChart2 size={20} color="#F59E0B" />}
          label="Total SKS"
          value={latest.totalSks || "-"}
          iconBg="#E8EAFF"
        />
        <StatCard
          icon={<RefreshCw size={20} color="#F59E0B" />}
          label="SKS Mengulang"
          value={latest.jumlahMkDiulang ?? 0}
          iconBg="#FFE0E8"
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/*hasil prediksi */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <StatCard
            icon={<ShieldCheck size={20} color="#F59E0B" />}
            label="Hasil Prediksi"
            value={prediksi.hasilPrediksi}
            iconBg="#FFF0CC"
          />
        </div>

        {/* rekomendasi */}
        <Card>
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
              color: C.textGray,
              lineHeight: 1.8,
              margin: 0,
              fontSize: 14,
            }}
          >
            Berdasarkan analisis data akademik Anda, performa akademik Anda saat
            ini berada dalam kondisi{" "}
            <strong style={{ color: prediksiColor }}>
              {prediksi.hasilPrediksi}
            </strong>
            .{" "}
            {rekomendasiText[prediksi.hasilPrediksi] || rekomendasiText["Aman"]}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
