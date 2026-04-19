import React, { useState, useEffect } from "react";
import { C } from "../constants/theme";
import { Card, StatusBadge } from "../components/UIComponents"; // Digabung agar rapi
import { kaprodiAPI } from "../services/api";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const DashboardKaprodi = () => {
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const [resMahasiswa, resStats] = await Promise.all([
          kaprodiAPI.getMahasiswa(),
          kaprodiAPI.getStatistik(),
        ]);

        // 1. Set List Mahasiswa
        setMahasiswaList(resMahasiswa || []);

        // 2. Set Trend Data (Pastikan key-nya 'jumlah')
        const dataPerSemester = [
          { semester: "Ganjil 23", jumlah: 45 },
          { semester: "Genap 23", jumlah: 52 },
          { semester: "Ganjil 24", jumlah: 48 },
          { semester: "Genap 24", jumlah: resMahasiswa?.length || 0 },
        ];
        setTrendData(dataPerSemester);

        // 3. Mapping data untuk Pie Chart
        if (resStats && resStats.distribusi) {
          const formattedPie = resStats.distribusi.map((item) => {
            let sliceColor = "#94A3B8";
            if (item._id === "Aman") sliceColor = "#22C55E";
            else if (item._id === "Waspada") sliceColor = "#F59E0B";
            else if (item._id === "Perlu perhatian") sliceColor = "#EF4444";

            return {
              name: item._id,
              value: item.jumlah,
              color: sliceColor,
            };
          });
          setPieData(formattedPie);
        }
      } catch (error) {
        console.error("Error:", error.message);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        Memproses data mahasiswa...
      </div>
    );
  }

  // --- PERBAIKAN: Tambahkan RETURN di sini ---
  return (
    <div style={{ padding: 32 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 24,
          marginBottom: 32,
        }}
      >
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 16, color: C.textDark }}>
            Prediksi Tren Jumlah Mahasiswa
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              {" "}
              {/* Pastikan trendData adalah array [{semester: '...', jumlah: 0}] */}
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              {/* Key untuk sumbu X (Label Semester) */}
              <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
              {/* Sumbu Y akan otomatis menyesuaikan angka jumlah */}
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {/* Garis Grafik */}
              <Line
                type="monotone"
                dataKey="jumlah"
                name="Total Mahasiswa"
                stroke={C.accent}
                strokeWidth={3}
                dot={{ r: 6, fill: C.accent }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, marginBottom: 16, color: C.textDark }}>
            Distribusi Prediksi Kelulusan
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60} // Opsional: buat jadi Donut Chart agar lebih modern
                outerRadius={80}
                paddingAngle={5}
                dataKey="value" // Properti angka
                nameKey="name" // Properti label ('Aman', dll)
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: C.textDark,
          marginBottom: 16,
        }}
      >
        Tabel Mahasiswa dan Prediksi Status
      </div>
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["NIM", "Nama", "IPK", "Prediksi Status"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "10px 16px",
                    color: C.primary,
                    fontSize: 13,
                    fontWeight: 600,
                    borderBottom: "1px solid #F0F0F0",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mahasiswaList.map((m, i) => (
              <tr
                key={m._id || i}
                style={{ borderBottom: "1px solid #F8F8F8" }}
              >
                <td
                  style={{
                    padding: "14px 16px",
                    fontSize: 14,
                    color: C.textGray,
                  }}
                >
                  {m.nim}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    fontSize: 14,
                    color: C.textDark,
                    fontWeight: 500,
                  }}
                >
                  {m.nama}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    fontSize: 14,
                    color: C.textDark,
                  }}
                >
                  {m.ipkTotal}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <StatusBadge status={m.hasilPrediksi} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default DashboardKaprodi;
