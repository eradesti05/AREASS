import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";
import { Card, StatusBadge } from "../components/UIComponents";
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
import { Info } from "lucide-react";

const DashboardKaprodi = () => {
  const navigate = useNavigate();
  const [hoveredPrediksi, setHoveredPrediksi] = useState(false);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const [resMahasiswa, resStats, resTren] = await Promise.all([
          kaprodiAPI.getMahasiswa(),
          kaprodiAPI.getStatistik(),
          kaprodiAPI.getTrenSemester(),
        ]);

        // Buat bikin list mahasiswa ini
        setMahasiswaList(resMahasiswa || []);

        // buat bikin trend jumlah mhs persemester
        const dataPerSemester = resTren.map((item) => ({
          semester: `Sem ${item.semesterKe}`,
          jumlah: item.jumlah,
        }));
        setTrendData(dataPerSemester);

        // mapping data buat Pie Chart
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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              {" "}
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
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
              {[
                "NIM",
                "Nama",
                "IPK",
                "Prediksi Status",
                "Detail Analisis Akademik",
              ].map((h) => (
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
                <td>
                  {" "}
                  <div
                    onClick={() => navigate("/analytics/${m.id}")}
                    onMouseEnter={() => setHoveredPrediksi(true)}
                    onMouseLeave={() => setHoveredPrediksi(false)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(22, 20, 20, 0.56)",
                      background: hoveredPrediksi
                        ? "rgba(5, 5, 5, 0.35)"
                        : "rgba(255,255,255,0.2)",

                      color: "#040404",
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
                    <Info size={14} style={{ color: "#040404" }} /> {"Lihat"}
                  </div>
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
