import React, { useState, useEffect, useMemo } from "react";

export default function InputDataAkademikPage() {
  const [strata, setStrata] = useState("");
  const [semesterAktif, setSemesterAktif] = useState("");
  const [ipk, setIpk] = useState("");
  const [sks, setSks] = useState("");
  const [jumlahSksLulus, setJumlahSksLulus] = useState("");
  const [jumlahSksTidakLulus, setJumlahSksTidakLulus] = useState("");
  const [dataSemester, setDataSemester] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (semesterAktif) {
      const rows = Array.from({ length: parseInt(semesterAktif) }, (_, i) => ({
        semester: i + 1,
        ip: "",
        sks: "",
      }));
      setDataSemester(rows);
    }
  }, [semesterAktif]);

  const updateDataSemester = (index, field, value) => {
    const updated = [...dataSemester];
    updated[index] = { ...updated[index], [field]: value };
    setDataSemester(updated);
  };

  const ringkasan = useMemo(() => {
    const totalIp = dataSemester.reduce(
      (sum, row) => sum + (parseFloat(row.ip) || 0),
      0,
    );
    const rataRataIp =
      dataSemester.length > 0
        ? (totalIp / dataSemester.length).toFixed(2)
        : "---";
    const totalSksPerSemester = dataSemester.reduce(
      (sum, row) => sum + (parseInt(row.sks) || 0),
      0,
    );
    return {
      ipk: ipk || "---",
      rataRataIp,
      totalSks: sks || "---",
      sksLulus: jumlahSksLulus || "---",
      sksTidakLulus: jumlahSksTidakLulus || "---",
      totalSksPerSemester: totalSksPerSemester || "---",
    };
  }, [ipk, sks, jumlahSksLulus, jumlahSksTidakLulus, dataSemester]);

  const dataUmumLengkap =
    strata &&
    semesterAktif &&
    ipk &&
    sks &&
    jumlahSksLulus &&
    jumlahSksTidakLulus;

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    const token = localStorage.getItem("areass_token");

    try {
      for (const row of dataSemester) {
        const payload = {
          strata,
          semesterKe: row.semester,
          ipSemester: parseFloat(row.ip) || 0,
          ipkTotal: parseFloat(ipk),
          sksPerSemester: parseInt(row.sks) || 0,
          totalSks: parseInt(sks),
          jumlahSksLulus: parseInt(jumlahSksLulus),
          jumlahMkDiulang: parseInt(jumlahSksTidakLulus) || 0,
        };

        const res = await fetch("http://localhost:5000/api/akademik", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage({
            type: "error",
            text: data.message || "Gagal menyimpan data",
          });
          setLoading(false);
          return;
        }
      }
      setMessage({
        type: "success",
        text: "Data akademik yang diinputkan berhasil disimpan!",
      });
    } catch (err) {
      setMessage({ type: "error", text: "Gagal terhubung ke server" });
    } finally {
      setLoading(false);
    }
  };

  //  inline style aku buat disini ya
  const S = {
    page: {
      display: "flex",
      flexDirection: "column",
      background: "#F4F6F9",
      minHeight: "100vh",
      padding: "32px 40px",
      gap: 24,
    },
    pageTitle: {
      color: "#333B69",
      fontSize: 22,
      fontWeight: 700,
    },
    card: {
      width: "100%",
      maxWidth: 1048,
      background: "#fff",
      margin: "0 auto",
      borderRadius: 25,
      boxShadow: "4px 4px 18px #00000040",
    },
    cardBody: {
      padding: "32px",
      display: "flex",
      flexDirection: "column",
      gap: 24,
    },
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      gap: 16,
    },
    sectionTitle: {
      color: "#232323",
      fontSize: 18,
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    sectionDivider: {
      flex: 1,
      background: "#DFEAF2",
      height: 3,
    },
    row: {
      display: "flex",
      gap: 20,
      flexWrap: "wrap",
    },
    fieldGroup: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      gap: 8,
      minWidth: 180,
    },
    label: {
      color: "#232323",
      fontSize: 15,
    },
    input: {
      width: "100%",
      color: "#718EBF",
      background: "#fff",
      fontSize: 15,
      padding: "14px 20px",
      borderRadius: 15,
      border: "1px solid #DFEAF2",
      outline: "none",
      boxSizing: "border-box",
    },
    select: {
      width: "100%",
      color: "#718EBF",
      background: "#fff",
      fontSize: 15,
      padding: "14px 20px",
      borderRadius: 15,
      border: "1px solid #DFEAF2",
      outline: "none",
      cursor: "pointer",
      boxSizing: "border-box",
    },
    infoBox: {
      color: "#718EBF",
      background: "#fff",
      fontSize: 15,
      padding: "12px 16px",
      borderRadius: 15,
      border: "1px solid #DFEAF2",
    },
    tableHeader: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "0 4px",
    },
    tableHeaderSem: {
      color: "#232323",
      fontSize: 15,
      fontWeight: 600,
      width: 100,
      flexShrink: 0,
    },
    tableHeaderCol: {
      color: "#232323",
      fontSize: 15,
      fontWeight: 600,
      flex: 1,
    },
    tableRow: {
      display: "flex",
      alignItems: "center",
      gap: 16,
    },
    tableRowLabel: {
      color: "#718EBF",
      fontSize: 15,
      fontWeight: 600,
      width: 100,
      flexShrink: 0,
    },
    tableInput: {
      flex: 1,
      color: "#718EBF",
      background: "#fff",
      fontSize: 15,
      padding: "14px 20px",
      borderRadius: 15,
      border: "1px solid #DFEAF2",
      outline: "none",
    },
    summaryCard: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      background: "#DFEAF2",
      padding: "20px",
      gap: 16,
      borderRadius: 15,
      border: "1px solid #718EBF",
      minWidth: 150,
    },
    summaryLabel: {
      color: "#718EBF",
      fontSize: 15,
    },
    summaryValue: {
      color: "#718EBF",
      fontSize: 24,
      fontWeight: 700,
    },
    submitRow: {
      display: "flex",
      justifyContent: "flex-end",
      width: "100%",
      maxWidth: 1048,
      margin: "0 auto 40px",
    },
    btnActive: {
      background: "#1814F3",
      color: "#fff",
      fontSize: 18,
      padding: "14px 40px",
      borderRadius: 9,
      border: "none",
      cursor: "pointer",
    },
    btnDisabled: {
      background: "#9CA3AF",
      color: "#fff",
      fontSize: 18,
      padding: "14px 40px",
      borderRadius: 9,
      border: "none",
      cursor: "not-allowed",
    },
    msgSuccess: {
      width: "100%",
      maxWidth: 1048,
      margin: "0 auto",
      padding: "16px 20px",
      borderRadius: 15,
      background: "#22C55E",
      color: "#fff",
      fontWeight: 600,
    },
    msgError: {
      width: "100%",
      maxWidth: 1048,
      margin: "0 auto",
      padding: "16px 20px",
      borderRadius: 15,
      background: "#EF4444",
      color: "#fff",
      fontWeight: 600,
    },
  };

  return (
    <div style={S.page}>
      <span style={S.pageTitle}>Input Data Akademik</span>

      {/* Notifikasi */}
      {message && (
        <div style={message.type === "success" ? S.msgSuccess : S.msgError}>
          {message.text}
        </div>
      )}

      {/* iIsian untuk data umum */}
      <div style={S.card}>
        <div style={S.cardBody}>
          <div style={S.sectionHeader}>
            <span style={S.sectionTitle}>Data Umum</span>
            <div style={S.sectionDivider} />
          </div>

          <div style={S.row}>
            <div style={S.fieldGroup}>
              <span style={S.label}>Strata/Jenjang</span>
              <select
                value={strata}
                onChange={(e) => setStrata(e.target.value)}
                style={S.select}
              >
                <option value="" disabled>
                  Pilih Strata/Jenjang
                </option>
                <option value="D3">D3</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
                <option value="S3">S3</option>
              </select>
            </div>
            <div style={S.fieldGroup}>
              <span style={S.label}>Semester Aktif Saat Ini</span>
              <select
                value={semesterAktif}
                onChange={(e) => setSemesterAktif(e.target.value)}
                style={S.select}
              >
                <option value="" disabled>
                  Pilih semester aktif
                </option>
                {Array.from({ length: 14 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div style={S.fieldGroup}>
              <span style={S.label}>IPK Total (Kumulatif)</span>
              <input
                type="number"
                min="0"
                max="4"
                step="0.01"
                placeholder="0.00 - 4.00"
                value={ipk}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (e.target.value === "" || (val >= 0 && val <= 4))
                    setIpk(e.target.value);
                }}
                style={S.input}
              />
            </div>
          </div>

          <div style={S.row}>
            <div style={S.fieldGroup}>
              <span style={S.label}>Total SKS ditempuh</span>
              <input
                placeholder="contoh : 72"
                value={sks}
                onChange={(e) => {
                  if (e.target.value === "" || /^\d+$/.test(e.target.value))
                    setSks(e.target.value);
                }}
                style={S.input}
              />
            </div>
            <div style={S.fieldGroup}>
              <span style={S.label}>Jumlah SKS lulus</span>
              <input
                placeholder="contoh : 67"
                value={jumlahSksLulus}
                onChange={(e) => {
                  if (e.target.value === "" || /^\d+$/.test(e.target.value))
                    setJumlahSksLulus(e.target.value);
                }}
                style={S.input}
              />
            </div>
            <div style={S.fieldGroup}>
              <span style={S.label}>Jumlah SKS tidak lulus</span>
              <input
                placeholder="contoh : 5"
                value={jumlahSksTidakLulus}
                onChange={(e) => {
                  if (e.target.value === "" || /^\d+$/.test(e.target.value))
                    setJumlahSksTidakLulus(e.target.value);
                }}
                style={S.input}
              />
            </div>
          </div>
        </div>
      </div>

      {/* isian data per semester */}
      {dataUmumLengkap && (
        <div style={S.card}>
          <div style={{ ...S.cardBody, gap: 20 }}>
            <div style={S.sectionHeader}>
              <span style={S.sectionTitle}>Data Per Semester</span>
              <div style={S.sectionDivider} />
            </div>
            <div style={S.infoBox}>
              Isi IP Semester dan SKS yang ditempuh untuk setiap semester yang
              sudah kamu jalani.
            </div>
            <div style={S.tableHeader}>
              <span style={S.tableHeaderSem}>Semester</span>
              <span style={S.tableHeaderCol}>IP Semester</span>
              <span style={S.tableHeaderCol}>SKS Per Semester</span>
            </div>
            {dataSemester.map((row, index) => (
              <div key={index} style={S.tableRow}>
                <span style={S.tableRowLabel}>Sem {row.semester}</span>
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  placeholder="0.00 - 4.00"
                  value={row.ip}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (e.target.value === "" || (val >= 0 && val <= 4))
                      updateDataSemester(index, "ip", e.target.value);
                  }}
                  style={S.tableInput}
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="contoh: 20"
                  value={row.sks}
                  onChange={(e) => {
                    if (e.target.value === "" || /^\d+$/.test(e.target.value))
                      updateDataSemester(index, "sks", e.target.value);
                  }}
                  style={S.tableInput}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* hasil ringkasan */}
      {dataUmumLengkap && (
        <div style={S.card}>
          <div style={S.cardBody}>
            <div style={S.sectionHeader}>
              <span style={S.sectionTitle}>Ringkasan Data</span>
              <div style={S.sectionDivider} />
            </div>
            <div style={S.row}>
              {[
                { label: "IPK", value: ringkasan.ipk },
                { label: "Rata-rata IP", value: ringkasan.rataRataIp },
                { label: "Total SKS", value: ringkasan.totalSks },
              ].map((item) => (
                <div key={item.label} style={S.summaryCard}>
                  <span style={S.summaryLabel}>{item.label}</span>
                  <span style={S.summaryValue}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={S.row}>
              {[
                { label: "Total SKS Lulus", value: ringkasan.sksLulus },
                {
                  label: "Total SKS Tidak Lulus",
                  value: ringkasan.sksTidakLulus,
                },
                {
                  label: "Total SKS Per Semester",
                  value: ringkasan.totalSksPerSemester,
                },
              ].map((item) => (
                <div key={item.label} style={S.summaryCard}>
                  <span style={S.summaryLabel}>{item.label}</span>
                  <span style={S.summaryValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* button submit */}
      <div style={S.submitRow}>
        <button
          onClick={handleSubmit}
          disabled={!dataUmumLengkap || loading}
          style={dataUmumLengkap && !loading ? S.btnActive : S.btnDisabled}
        >
          {loading ? "Menyimpan..." : "Add Data"}
        </button>
      </div>
    </div>
  );
}
