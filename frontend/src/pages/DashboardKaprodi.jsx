import { C } from '../constants/theme';
import { Card } from '../components/UIComponents';
import { StatusBadge } from '../components/UIComponents';
import { mahasiswaList, prediksiTrend, distribusiPrediksi } from '../data/dummyData';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const DashboardKaprodi = () => (
  <div style={{ padding: 32 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, marginBottom: 32 }}>
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 16, color: C.textDark }}>Prediksi Tren Jumlah Mahasiswa</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={prediksiTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="jumlah" name="Jumlah Mahasiswa"
              stroke={C.accent} strokeWidth={2} dot={{ fill: C.accent }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, marginBottom: 16, color: C.textDark }}>Distribusi Prediksi Kelulusan</div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={distribusiPrediksi} cx="50%" cy="50%" outerRadius={80}
              dataKey="value" label={({ name, value }) => `${value}%`}>
              {distribusiPrediksi.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>

    <div style={{ fontWeight: 700, fontSize: 16, color: C.textDark, marginBottom: 16 }}>
      Tabel Mahasiswa dan Prediksi Status
    </div>
    <Card>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["NIM", "Nama", "IPK", "Prediksi Status"].map(h => (
              <th key={h} style={{
                textAlign: "left", padding: "10px 16px",
                color: C.primary, fontSize: 13, fontWeight: 600,
                borderBottom: "1px solid #F0F0F0"
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mahasiswaList.map((m, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #F8F8F8" }}>
              <td style={{ padding: "14px 16px", fontSize: 14, color: C.textGray }}>{m.nim}</td>
              <td style={{ padding: "14px 16px", fontSize: 14, color: C.textDark, fontWeight: 500 }}>{m.nama}</td>
              <td style={{ padding: "14px 16px", fontSize: 14, color: C.textDark }}>{m.ipk}</td>
              <td style={{ padding: "14px 16px" }}><StatusBadge status={m.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

export default DashboardKaprodi;
