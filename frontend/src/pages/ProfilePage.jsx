import { useState } from "react";
import { C } from '../constants/theme';
import { Card } from '../components/UIComponents';

const ProfilePage = ({ user }) => {
  const [tab, setTab] = useState("Edit Profil");
  const tabs = ["Edit Profil", "Preferensi", "Keamanan"];

  const inputStyle = {
    border: "1.5px solid #E0E4F0", borderRadius: 10, padding: "10px 14px",
    fontSize: 14, width: "100%", outline: "none",
    boxSizing: "border-box", color: C.textGray
  };

  const fields = [
    { label: "Nama", val: user.nama },
    { label: "User Name", val: user.nama.toLowerCase().replace(" ", "_") },
    { label: "Email", val: user.email },
    { label: "Password", val: "••••••••••", type: "password" },
    { label: "Tanggal Lahir", val: "25 Januari 2000" },
    { label: "Alamat Saat Ini", val: "Cisitu Bandung" },
    { label: "Alamat Rumah", val: "Jatinangor" },
    { label: "Kota/Kabupaten", val: "Sumedang" },
    { label: "Kode Pos", val: "45962" },
    { label: "Negara", val: "Indonesia" },
  ];

  return (
    <div style={{ padding: 32 }}>
      <Card style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 32, borderBottom: "1px solid #E8EAF0", marginBottom: 32 }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "8px 4px", fontSize: 15,
              fontWeight: tab === t ? 700 : 400,
              color: tab === t ? C.primary : C.textGray,
              borderBottom: tab === t ? `2px solid ${C.primary}` : "2px solid transparent",
              marginBottom: -1
            }}>{t}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 32 }}>
          {/* Avatar */}
          <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 36, fontWeight: 700
            }}>{user.nama.charAt(0)}</div>
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 28, height: 28, background: C.primary, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, cursor: "pointer"
            }}>✏️</div>
          </div>

          {/* Form */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {fields.map((f, i) => (
              <div key={i}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.textDark, marginBottom: 8 }}>{f.label}</div>
                <input defaultValue={f.val} type={f.type || "text"} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <button style={{
            background: C.primary, color: "#fff", border: "none",
            borderRadius: 12, padding: "12px 40px",
            fontWeight: 600, cursor: "pointer", fontSize: 15
          }}>Simpan</button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
