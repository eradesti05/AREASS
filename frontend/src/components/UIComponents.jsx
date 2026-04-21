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

export const StatCard = ({ icon, label, value, secondary, secondaryColor, iconBg }) => (
  <Card style={{ 
    display: "flex", 
    alignItems: "center", 
    gap: 16, 
    flex: 1, 
    minWidth: 180,
    padding: "18px 20px",
    borderRadius: 12,
    border: "1px solid #F0F0F0",
    transition: "all 0.3s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
    e.currentTarget.style.transform = "translateY(-2px)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
    e.currentTarget.style.transform = "translateY(0)";
  }}
  >
    <div style={{
      width: 56, height: 56, borderRadius: "12px", background: iconBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 24, flexShrink: 0
    }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: C.textGray, marginBottom: 2, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.textDark, marginBottom: 4 }}>{value}</div>
      {secondary && (
        <div style={{ 
          fontSize: 11, 
          fontWeight: 600,
          color: secondaryColor || "#10B981",
          background: `${secondaryColor || "#10B981"}15`,
          padding: "2px 8px",
          borderRadius: 4,
          display: "inline-block"
        }}>
          {secondary}
        </div>
      )}
    </div>
  </Card>
);
