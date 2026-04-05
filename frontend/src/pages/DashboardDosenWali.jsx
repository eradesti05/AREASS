import { C } from '../constants/theme';
import { Card, StatusBadge } from '../components/UIComponents';
import { mahasiswaList, nilaiMahasiswaBimbingan } from '../data/dummyData';
import { Edit2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

const DashboardDosenWali = () => (
  <div style={{ padding: 32 }}>
    <div style={{ fontWeight: 700, fontSize: 18, color: C.textDark, marginBottom: 20 }}>
      Tren Nilai Mahasiswa Bimbingan
    </div>
    <Card style={{ marginBottom: 32 }}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={nilaiMahasiswaBimbingan}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 4]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="nilai" name="Rata-rata Nilai"
            stroke={C.primary} strokeWidth={2} dot={{ fill: C.primary, r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>

    <div style={{ fontWeight: 700, fontSize: 16, color: C.textDark, marginBottom: 16 }}>
      Tabel Mahasiswa dan Prediksi Status
    </div>
    <Card>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["NIM", "Nama", "IPK", "Prediksi Status", "Akademik dan Risiko"].map(h => (
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
              <td style={{ padding: "14px 16px" }}>
                <button style={{
                  background: "transparent", border: "1.5px solid #E0E4F0",
                  borderRadius: 8, padding: "4px 10px", cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textGray
                }}>
                  <Edit2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

export default DashboardDosenWali;
