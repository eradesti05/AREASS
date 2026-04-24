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
  const [hoveredId, setHoveredId] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedStrata, setSelectedStrata] = useState("Semua");

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const [resMahasiswa, resStats, resTren, resAkademik] =
          await Promise.all([
            kaprodiAPI.getMahasiswa(),
            kaprodiAPI.getStatistik(),
            kaprodiAPI.getTrenSemester(),
            kaprodiAPI.getAkademik(),
          ]);
        console.log("RES STATS:", resStats);

        const mahasiswaArray = Array.isArray(resMahasiswa)
          ? resMahasiswa
          : resMahasiswa?.data || [];

        const akademikArray = Array.isArray(resAkademik)
          ? resAkademik
          : resAkademik?.data || [];

        //bikin mapping mahasiswaId -> strata
        const strataMap = {};

        akademikArray.forEach((a) => {
          if (a.mahasiswaId && a.strata) {
            strataMap[a.mahasiswaId] = a.strata.toUpperCase();
          }
        });
        //inject ke mahasiswa
        const mahasiswaWithStrata = mahasiswaArray.map((m) => ({
          ...m,
          strata: strataMap[m.id] || "Tidak diketahui",
        }));

        // Buat bikin list mahasiswa ini
        setMahasiswaList(mahasiswaWithStrata);

        // buat bikin trend jumlah mhs persemester
        // const dataPerSemester = resTren.map((item) => ({
        //   semester: `Sem ${item.semesterKe}`,
        //   jumlah: item.jumlah,
        // }));

        const dataPerSemester = resTren.map((item) => ({
          semester: `Sem ${item.semesterKe ?? item._id}`, // fallback ke _id
          jumlah: item.jumlah,
        }));

        setTrendData(dataPerSemester);

        const labelMapping = {
          Aman: "Lulus Tepat Waktu",
          Waspada: "Lulus Terlambat",
          "Perlu perhatian": "Potensi Drop Out",
        };
        // mapping data buat Pie Chart
        if (resStats && resStats.distribusi) {
          const formattedPie = resStats.distribusi.map((item) => {
            let sliceColor = "#94A3B8";
            if (item._id === "Aman") sliceColor = C.green;
            else if (item._id === "Waspada") sliceColor = C.yellow;
            else if (item._id === "Perlu perhatian") sliceColor = C.red;

            return {
              name: labelMapping[item._id] || item._id,
              value: item.jumlah,
              color: sliceColor,
            };
          });

          console.log("PIE DATA FINAL:", formattedPie);
          console.log("DISTRIBUSI:", resStats.distribusi);
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
      <div style={{ padding: "clamp(16px, 4vw, 32px)", textAlign: "center" }}>
        Memproses data mahasiswa...
      </div>
    );
  }

  const uniqueStrata = ["D3", "S1", "S2", "S3"];
  const filteredMahasiswa = mahasiswaList.filter((m) => {
    const statusMatch =
      filterStatus === "Semua" || m.hasilPrediksi === filterStatus;

    const strataMatch =
      selectedStrata === "Semua" || m.strata === selectedStrata;

    return statusMatch && strataMatch;
  });

  return (
    <div style={{ padding: "clamp(16px, 4vw, 32px)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "clamp(16px, 3vw, 24px)",
          marginBottom: "clamp(20px, 3vw, 32px)",
        }}
      >
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 16, color: C.textDark }}>
            Prediksi Tren Jumlah Mahasiswa
          </div>
          <LineChart
            width={500}
            height={280}
            data={trendData}
            style={{ maxWidth: "100%" }}
          >
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
        </Card>

        <Card>
          <div style={{ fontWeight: 700, marginBottom: 16, color: C.textDark }}>
            Distribusi Prediksi Kelulusan
          </div>
          <PieChart width={500} height={280} style={{ maxWidth: "100%" }}>
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
        </Card>
      </div>

      <div
        style={{
          fontWeight: 700,
          fontSize: "clamp(14px, 3vw, 16px)",
          color: C.textDark,
          marginBottom: "clamp(12px, 2vw, 16px)",
        }}
      >
        Tabel Mahasiswa dan Prediksi Status
      </div>
      <Card>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            gap: "clamp(6px, 2vw, 8px)",
            flexWrap: "wrap",
          }}
        >
          {["Semua", "Aman", "Waspada", "Perlu perhatian"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontSize: "clamp(11px, 2vw, 12px)",
                fontWeight: 600,
                background:
                  filterStatus === status ? C.primary : "rgba(0,0,0,0.05)",
                color: filterStatus === status ? "#fff" : "#333",
                whiteSpace: "nowrap",
              }}
            >
              {status}
            </button>
          ))}
          <select
            value={selectedStrata}
            onChange={(e) => setSelectedStrata(e.target.value)}
            style={{
              padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 10px)",
              borderRadius: 8,
              fontSize: "clamp(11px, 2vw, 12px)",
            }}
          >
            <option value="Semua">Semua</option>
            {uniqueStrata.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
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
            {filteredMahasiswa.map((m, i) => (
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
                    onClick={() => {
                      if (!m || !m.id) {
                        console.error("ID tidak ditemukan:", m);
                        return;
                      }
                      navigate(`/kaprodi/analytics/${m.id}`, {
                        state: m,
                      });
                    }}
                    onMouseEnter={() => setHoveredId(m.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(22, 20, 20, 0.56)",
                      background:
                        hoveredId === m.id
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
                      transform:
                        hoveredId === m.id ? "scale(1.05)" : "scale(1)",
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
