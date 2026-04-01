import { useState, useEffect } from "react";
import { C } from '../constants/theme';
import { Card } from '../components/UIComponents';
import { akademikAPI, taskAPI, prediksiAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DashboardMahasiswa = ({ user }) => {
  const [akademik, setAkademik] = useState([]);
  const [summary, setSummary] = useState({ totalTugas: 0, tenggatWaktuTugas: 0, estimasiBebanKerja: 0, backlog: 0, onProgress: 0, done: 0 });
  const [prediksi, setPrediksi] = useState({ hasilPrediksi: 'Aman', skorConfidence: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [akData, sumData, predData] = await Promise.all([
          akademikAPI.getAll(),
          taskAPI.getSummary(),
          prediksiAPI.getLatest(),
        ]);
        setAkademik(akData);
        setSummary(sumData);
        setPrediksi(predData);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const latest = akademik[akademik.length - 1] || {};
  const ipkTrend = akademik.map(d => ({ semester: `Sem ${d.semesterKe}`, ip: d.ipSemester }));
  const sksTrend = akademik.map(d => ({ semester: `Sem ${d.semesterKe}`, sks: d.sksPerSemester }));
  const taskProgress = [
    { name: "On Progress", value: summary.onProgress || 0, color: "#FF9800" },
    { name: "Backlog", value: summary.backlog || 0, color: "#000000" },
    { name: "Done", value: summary.done || 0, color: "#4CAF50" },
  ];

  const statusColor = { 'Aman': C.green, 'Waspada': C.yellow, 'Perlu perhatian': C.red };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ color: C.textGray, fontSize: 16 }}>⏳ Memuat data...</div>
    </div>
  );

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 32 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Mahasiswa</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFF0CC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛡️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Selamat Datang</div>
              <div style={{ color: C.textGray, fontSize: 12 }}>{user.nama}</div>
              <div style={{ color: C.textGray, fontSize: 12 }}>{user.nim}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>Indikator Resiko Akademik</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFF0CC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛡️</div>
            <div>
              <div style={{ color: C.textGray, fontSize: 12 }}>Status Akademik</div>
              <div style={{ color: statusColor[prediksi.hasilPrediksi] || C.green, fontWeight: 700, fontSize: 14 }}>
                {prediksi.hasilPrediksi || 'Aman'}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textDark, marginBottom: 8 }}>Kemajuan Tugas</div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={taskProgress} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                {taskProgress.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {taskProgress.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                <span style={{ color: C.textGray }}>{t.value} {t.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: 8, fontSize: 16, fontWeight: 700, color: C.textDark }}>Ringkasan Harian</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { val: summary.totalTugas, label: "Total Tugas", bg: C.accent },
          { val: summary.tenggatWaktuTugas, label: "Tenggat Waktu Tugas", bg: C.primary },
          { val: summary.estimasiBebanKerja, label: "Estimasi Beban Kerja", bg: C.red },
        ].map((item, i) => (
          <Card key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 20 }}>{item.val}</div>
            <div style={{ fontWeight: 600, color: C.textDark, fontSize: 14 }}>{item.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 16, color: C.textDark }}>Trend Beban SKS</div>
          {sksTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sksTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sks" name="Beban SKS" fill={C.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: C.textGray, textAlign: "center", padding: 40 }}>Belum ada data akademik</div>}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 16, color: C.textDark }}>Trend IPK</div>
          {ipkTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ipkTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ip" name="IP Semester" stroke={C.accent} strokeWidth={2} dot={{ fill: C.accent }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div style={{ color: C.textGray, textAlign: "center", padding: 40 }}>Belum ada data akademik</div>}
        </Card>
      </div>
    </div>
  );
};

export default DashboardMahasiswa;
