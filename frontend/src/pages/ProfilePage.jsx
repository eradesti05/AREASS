import { useState } from "react";
import { C } from '../constants/theme';
import { Card } from '../components/UIComponents';
import { Edit2 } from 'lucide-react';

const ProfilePage = ({ user }) => {
  const [tab, setTab] = useState("Edit Profil");
  const tabs = ["Edit Profil", "Preferensi", "Keamanan"];

  const inputStyle = {
    border: "1.5px solid #E0E4F0", 
    borderRadius: 10, 
    padding: "clamp(8px, 2vw, 10px) clamp(10px, 2vw, 14px)",
    fontSize: "clamp(13px, 2.5vw, 14px)", 
    width: "100%", 
    outline: "none",
    boxSizing: "border-box", 
    color: C.textGray
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
    <div style={{ 
      padding: "clamp(16px, 4vw, 32px)"
    }}>
      <Card style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          gap: "clamp(16px, 4vw, 32px)", 
          borderBottom: "1px solid #E8EAF0", 
          marginBottom: "clamp(16px, 4vw, 32px)",
          overflowX: "auto",
          flexWrap: "wrap"
        }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "8px 4px", fontSize: "clamp(13px, 2.5vw, 15px)",
              fontWeight: tab === t ? 700 : 400,
              color: tab === t ? C.primary : C.textGray,
              borderBottom: tab === t ? `2px solid ${C.primary}` : "2px solid transparent",
              marginBottom: -1,
              whiteSpace: "nowrap"
            }}>{t}</button>
          ))}
        </div>

        <div style={{ 
          display: "flex", 
          gap: "clamp(16px, 4vw, 32px)",
          flexDirection: "column",
          "@media (min-width: 768px)": {
            flexDirection: "row"
          }
        }}>
          {/* Avatar */}
          <div style={{ 
            position: "relative", 
            width: "clamp(80px, 25vw, 100px)", 
            height: "clamp(80px, 25vw, 100px)", 
            flexShrink: 0,
            margin: "0 auto"
          }}>
            <div style={{
              width: "100%", 
              height: "100%", 
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "clamp(28px, 10vw, 36px)", fontWeight: 700
            }}>{user.nama.charAt(0)}</div>
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 28, height: 28, background: C.primary, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", cursor: "pointer"
            }}>
              <Edit2 size={14} />
            </div>
          </div>

          {/* Form */}
          <div style={{ 
            flex: 1, 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: "clamp(12px, 3vw, 20px)",
            width: "100%"
          }}>
            {fields.map((f, i) => (
              <div key={i}>
                <div style={{ 
                  fontSize: "clamp(12px, 2.5vw, 13px)", 
                  fontWeight: 500, 
                  color: C.textDark, 
                  marginBottom: 8 
                }}>{f.label}</div>
                <input 
                  defaultValue={f.val} 
                  type={f.type || "text"} 
                  style={{
                    ...inputStyle,
                    fontSize: "clamp(13px, 2.5vw, 14px)"
                  }} 
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "clamp(16px, 4vw, 24px)" }}>
          <button disabled style={{
            background: "#D0D5E0", color: "#999", border: "none",
            borderRadius: 12, padding: "clamp(10px, 2.5vw, 12px) clamp(24px, 5vw, 40px)",
            fontWeight: 600, cursor: "not-allowed", fontSize: "clamp(13px, 2.5vw, 15px)"
          }}>Simpan</button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
