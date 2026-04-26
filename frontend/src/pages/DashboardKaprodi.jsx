import React, { useState, useEffect, useMemo } from "react";
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
  const [rawTrendData, setRawTrendData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedStrata, setSelectedStrata] = useState("Semua");
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState(null);
  const [selectedTrendStrata, setSelectedTrendStrata] = useState("Semua");
  const [nimMap, setNimMap] = useState({});

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const [resMahasiswa, resStats, resTren, resAkademik] =
          await Promise.all([
            kaprodiAPI.getMahasiswa(
              selectedStrata === "Semua" ? null : selectedStrata
            ),
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

        // Generate random NIM untuk setiap mahasiswa yang belum ada di map
        const newNimMap = { ...nimMap };
        mahasiswaWithStrata.forEach((m) => {
          if (!newNimMap[m.id]) {
            const randomNim = Math.floor(10000000 + Math.random() * 90000000).toString();
            newNimMap[m.id] = randomNim;
          }
        });
        setNimMap(newNimMap);

        // Buat bikin list mahasiswa ini
        setMahasiswaList(mahasiswaWithStrata);

        // Process trend data - group by tahunAkademik + semesterType
        console.log("RES TREN RAW:", resTren);
        let processedTren = resTren;
        
        // Jika API return simple format {strata, jumlah}, langsung grouping
        // Tidak generate dummy data
        
        const trendByTahunMap = {};
        let semesterCounter = 1;
        
        // Jika ada tahunAkademik & semesterType, grouping by itu
        // Jika tidak ada, treat sebagai single data point
        if (Array.isArray(processedTren) && processedTren.length > 0) {
          const firstItem = processedTren[0];
          
          if (firstItem.tahunAkademik && firstItem.semesterType) {
            // Format dengan tahun akademik
            processedTren.forEach((item) => {
              const key = `${item.tahunAkademik} ${item.semesterType}`;
              if (!trendByTahunMap[key]) {
                trendByTahunMap[key] = { 
                  label: `Sem ${semesterCounter}`,
                  tahunAkademik: item.tahunAkademik,
                  semesterType: item.semesterType,
                };
                semesterCounter++;
              }
              trendByTahunMap[key][item.strata] = item.jumlah;
            });
          } else {
            // Format simple hanya strata & jumlah - buat single data point
            const defaultKey = "Data";
            trendByTahunMap[defaultKey] = {
              label: "Data Mahasiswa",
              tahunAkademik: "-",
              semesterType: "-",
            };
            processedTren.forEach((item) => {
              trendByTahunMap[defaultKey][item.strata] = item.jumlah;
            });
          }
        }

        const formattedTrendData = Object.values(trendByTahunMap).sort((a, b) => {
          if (a.tahunAkademik !== b.tahunAkademik) {
            return a.tahunAkademik.localeCompare(b.tahunAkademik);
          }
          return a.semesterType === "Ganjil" ? -1 : 1;
        });
        console.log("FORMATTED TREND DATA:", formattedTrendData);
        
        setRawTrendData(formattedTrendData);
        // Set tahun akademik pertama as default jika ada data
        if (formattedTrendData.length > 0) {
          setSelectedTahunAkademik(formattedTrendData[0].label);
        }
        
        // Tampilkan semua semester data, filter berdasarkan strata
        let filteredData = formattedTrendData;
        
        // Jika strata trend dipilih, hanya tampilkan data untuk strata itu
        if (selectedTrendStrata !== "Semua") {
          filteredData = filteredData.map(item => ({
            ...item,
            [selectedTrendStrata]: item[selectedTrendStrata]
          }));
        }
        
        setTrendData(filteredData);

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
  }, [selectedStrata, selectedTrendStrata]);

  if (loading) {
    return (
      <div style={{ padding: "clamp(16px, 4vw, 32px)", textAlign: "center" }}>
        Memproses data mahasiswa...
      </div>
    );
  }

  // Mapping warna konsisten untuk setiap strata
  const strataColorMap = {
    "D3": "#FF6B35",      // Orange terang
    "S1": "#1B7C6B",      // Hijau (C.green)
    "S2": "#FDB813",      // Kuning (C.yellow)
    "S3": "#E74C3C",      // Merah terang
  };

  const uniqueStrata = ["D3", "S1", "S2", "S3"];
  const filteredMahasiswa = mahasiswaList.filter((m) => {
    // Exclude mahasiswa dengan strata "Tidak diketahui"
    if (m.strata === "Tidak diketahui") {
      return false;
    }

    const statusMatch =
      filterStatus === "Semua" || m.hasilPrediksi === filterStatus;

    const strataMatch =
      selectedStrata === "Semua" || m.strata === selectedStrata;

    return statusMatch && strataMatch;
  });

  // Get unique tahun akademik dari raw trend data
  const uniqueTahunAkademik = Array.from(
    new Set(rawTrendData.map(item => item.label))
  );

  // Get unique strata dari raw trend data
  const strataInTrend = new Set();
  rawTrendData.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== "label" && key !== "tahunAkademik" && key !== "semesterType" && !isNaN(item[key])) {
        strataInTrend.add(key);
      }
    });
  });
  const availableStrata = Array.from(strataInTrend).sort();

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
            Tren Jumlah Mahasiswa
          </div>
          
          {/* Filter Strata */}
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              gap: "clamp(6px, 2vw, 8px)",
              flexWrap: "wrap",
            }}
          >
            {["Semua", ...availableStrata].map((strata) => {
              const bgColor = strata === "Semua" ? C.accent : strataColorMap[strata] || "#9F7AEA";
              return (
                <button
                  key={strata}
                  onClick={() => setSelectedTrendStrata(strata)}
                  style={{
                    padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "clamp(11px, 2vw, 12px)",
                    fontWeight: 600,
                    background:
                      selectedTrendStrata === strata ? bgColor : "rgba(0,0,0,0.05)",
                    color: selectedTrendStrata === strata ? "#fff" : "#333",
                    whiteSpace: "nowrap",
                  }}
                >
                  {strata}
                </button>
              );
            })}
          </div>
          {trendData.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 280,
                color: C.textGray,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              📊 Tidak ada data untuk periode ini
            </div>
          ) : (
            <LineChart
              width={500}
              height={280}
              data={trendData}
              style={{ maxWidth: "100%" }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              {(selectedTrendStrata === "Semua" ? availableStrata : [selectedTrendStrata]).map((strata) => {
                const strataColor = strataColorMap[strata] || "#9F7AEA";
                return (
                  <Line
                    key={strata}
                    type="monotone"
                    dataKey={strata}
                    name={strata}
                    stroke={strataColor}
                    strokeWidth={3}
                    dot={{ r: 6, fill: strataColor }}
                    activeDot={{ r: 8 }}
                  />
                );
              })}
            </LineChart>
          )}
        </Card>

        <Card>
          <div style={{ fontWeight: 700, marginBottom: 16, color: C.textDark }}>
            Distribusi Prediksi Kelulusan
          </div>
          {pieData.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 280,
                color: C.textGray,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              📊 Tidak ada data prediksi
            </div>
          ) : (
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
          )}
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
        {filteredMahasiswa.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 16px",
              color: C.textGray,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Tidak ada mahasiswa yang sesuai dengan filter
          </div>
        ) : (
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
                  {nimMap[m.id || m._id] || "-"}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    fontSize: 14,
                    color: C.textDark,
                    fontWeight: 500,
                    textTransform: "capitalize",
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
        )}
      </Card>
    </div>
  );
};

export default DashboardKaprodi;
