import { C } from '../constants/theme';

export const StatusBadge = ({ status }) => {
  const map = {
    "Aman": { bg: C.green, text: "#fff" },
    "Waspada": { bg: C.yellow, text: "#fff" },
    "Perlu perhatian": { bg: C.red, text: "#fff" },
    "Rendah": { bg: "#FFE0CC", text: "#E07020" },
    "Sedang": { bg: "#FFF0B0", text: "#B08000" },
    "Tinggi": { bg: "#FFD0DC", text: "#C01040" },
    "Selesai": { bg: "#D0FFE8", text: "#00A050" },
    "Backlog": { bg: "#FFD0DC", text: "#C01040" },
    "On Progress": { bg: "#D0E8FF", text: "#0050C0" },
    "Done": { bg: "#D0FFE8", text: "#00A050" },
  };
  const s = map[status] || { bg: "#eee", text: "#555" };
  return (
    <span style={{
      background: s.bg, color: s.text, padding: "2px 10px",
      borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap"
    }}>{status}</span>
  );
};

export const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.white, borderRadius: 16, padding: 20,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)", ...style
  }}>{children}</div>
);

export const StatCard = ({ icon, label, value, iconBg }) => (
  <Card style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 160 }}>
    <div style={{
      width: 52, height: 52, borderRadius: "50%", background: iconBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, flexShrink: 0
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 12, color: C.textGray, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.textDark }}>{value}</div>
    </div>
  </Card>
);
