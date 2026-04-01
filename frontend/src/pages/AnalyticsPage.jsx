import { C } from '../constants/theme';
import { Card, StatCard } from '../components/UIComponents';

const AnalyticsPage = () => (
  <div style={{ padding: 32 }}>
    <div style={{ fontSize: 22, fontWeight: 700, color: C.textDark, marginBottom: 24 }}>Detail Analisis Akademik</div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
      <StatCard icon="💰" label="Semester" value="4" iconBg="#FFF0CC" />
      <StatCard icon="💳" label="IP Semester" value="3.78" iconBg="#E8EAFF" />
      <StatCard icon="📊" label="IPK" value="3.80" iconBg="#FFE0E8" />
      <StatCard icon="💰" label="SKS Semester" value="20" iconBg="#FFF0CC" />
      <StatCard icon="💳" label="Total SKS" value="90" iconBg="#E8EAFF" />
      <StatCard icon="📊" label="Matkul Diulang" value="0" iconBg="#FFE0E8" />
    </div>

    <div style={{ fontSize: 18, fontWeight: 700, color: C.textDark, marginBottom: 16 }}>Penjelasan Prediksi</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
      <StatCard icon="💰" label="Hasil Prediksi" value="Aman" iconBg="#FFF0CC" />
      <StatCard icon="💳" label="Skor Confidence" value="0.87" iconBg="#E8EAFF" />
      <StatCard icon="📊" label="Faktor Resiko" value="Rendah" iconBg="#FFE0E8" />
    </div>

    <div style={{ fontSize: 18, fontWeight: 700, color: C.textDark, marginBottom: 16 }}>Rekomendasi</div>
    <Card>
      <p style={{ color: C.textGray, lineHeight: 1.8, margin: 0, fontSize: 14 }}>
        Berdasarkan analisis data akademik Anda, performa akademik Anda saat ini berada dalam kondisi{" "}
        <strong style={{ color: C.green }}>Aman</strong>.
        IPK Anda sebesar 3.80 menunjukkan capaian yang sangat baik. Pastikan untuk mempertahankan
        konsistensi pengerjaan tugas dan manajemen waktu yang baik. Perhatikan beban SKS di semester
        berikutnya agar tidak melebihi kapasitas optimal. Terus pantau perkembangan akademik Anda
        melalui sistem ini secara berkala.
      </p>
    </Card>
  </div>
);

export default AnalyticsPage;
