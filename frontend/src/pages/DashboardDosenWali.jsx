import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";
import { Card, StatusBadge } from "../components/UIComponents";
import { dosenAPI } from "../services/api";
import { Info } from "lucide-react";

const DashboardDosen = () => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedStrata, setSelectedStrata] = useState("Semua");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const resMahasiswa = await dosenAPI.getMahasiswa();

        const mahasiswaArray = Array.isArray(resMahasiswa)
          ? resMahasiswa
          : resMahasiswa?.data || [];

        // ambil strata dari akademik tiap mahasiswa
        const mahasiswaWithStrata = await Promise.all(
          mahasiswaArray.map(async (m) => {
            try {
              const resAkademik = await dosenAPI.getAkademikById(m.id);

              const akademikArray = Array.isArray(resAkademik)
                ? resAkademik
                : resAkademik?.data || [];

              return {
                ...m,
                strata:
                  akademikArray.length > 0
                    ? akademikArray[0].strata?.toUpperCase()
                    : "Tidak diketahui",
              };
            } catch (err) {
              return { ...m, strata: "Tidak diketahui" };
            }
          }),
        );

        setMahasiswaList(mahasiswaWithStrata);
      } catch (error) {
        console.error("Error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
          fontWeight: 700,
          fontSize: 16,
          color: C.textDark,
          marginBottom: 16,
        }}
      >
        Tabel Mahasiswa dan Prediksi Status
      </div>

      <Card>
        {/* FILTER */}
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

        {/* TABLE */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["NIM", "Nama", "IPK", "Prediksi Status", "Detail"].map((h) => (
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
              <tr key={m.id || i}>
                <td style={{ padding: "14px 16px" }}>{m.nim}</td>
                <td style={{ padding: "14px 16px" }}>{m.nama}</td>
                <td style={{ padding: "14px 16px" }}>{m.ipkTotal}</td>

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
                      navigate(`/dosen/analytics/${m.id}`);
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

export default DashboardDosen;
