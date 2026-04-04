import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";
import NotificationCenter from "./NotificationCenter";
// import { Search, Settings, Bell } from "lucide-react";

const Navbar = ({ user, onLogout, currentPath }) => {
  const navigate = useNavigate();

  const navItems =
    user?.role === "mahasiswa"
      ? [
          { path: "/dashboard", label: "Dashboard" },
          { path: "/tasks", label: "Task Management" },
          { path: "/analytics", label: "Analitik" },
          { path: "/profile", label: "Profil" },
          { path: "/akademik/input", label: "Input Data Akademik" },
        ]
      : user?.role === "dosen_wali"
        ? [
            { path: "/dashboard-dosen", label: "Dashboard" },
            { path: "/profile", label: "Profil" },
          ]
        : [
            { path: "/dashboard-kaprodi", label: "Dashboard" },
            { path: "/profile", label: "Profil" },
          ];

  return (
    <div
      style={{
        background: C.white,
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        borderBottom: "1px solid #E8EAF0",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
          onClick={() => navigate(navItems[0].path)}
        >
          <img
            src="/LogoAREASS.png"
            alt="AREASS Logo"
            style={{
              width: 40,
              height: 40,
              objectFit: "contain",
              paddingRight: 40,
            }}
          />
          <div>
            <span
              style={{
                color: C.primary,
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: 1,
              }}
            ></span>
            <div
              style={{
                fontSize: 8,
                color: C.textGray,
                fontWeight: 600,
                letterSpacing: 0.5,
                lineHeight: 1,
              }}
            ></div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {navItems.map((item) => {
            const isActive =
              currentPath === item.path ||
              currentPath.startsWith(item.path + "/");
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  background: isActive ? C.primaryLight : "transparent",
                  color: isActive ? C.primary : C.textGray,
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 16px",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            background: C.bg,
            borderRadius: 24,
            padding: "6px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: C.textGray,
            fontSize: 14,
          }}
        >
          <span>
            <Search size={20} color="#718EBF" />
          </span>{" "}
          Cari sesuatu?
        </div>
        <span style={{ fontSize: 20, cursor: "pointer" }}>
          <Settings size={20} color="#718EBF" />
        </span>
        <Bell size={20} color="#718EBF" />
        <div
          onClick={onLogout}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {user?.nama?.charAt(0) || "U"}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
