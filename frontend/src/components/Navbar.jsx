import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";
import NotificationCenter from "./NotificationCenter";
import { Search, Bell, LogOut, AlertCircle, Menu, X } from "lucide-react";

const Navbar = ({ user, onLogout, currentPath }) => {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Handle both _id (MongoDB) dan id (backend response)
  const userId = user?._id || user?.id;

  // Check if akademik is completed for mahasiswa
  const akademikCompleted =
    user?.role === "mahasiswa"
      ? localStorage.getItem(`akademik_completed_${userId}`)
      : true;

  const navItems =
    user?.role === "mahasiswa"
      ? akademikCompleted
        ? [
            { path: "/dashboard", label: "Dashboard" },
            { path: "/tasks", label: "Kelola Tugas" },
            // { path: "/analytics", label: "Analitik" },
            { path: "/akademik/input", label: "Input Data Akademik" },
            { path: "/profile", label: "Profil" },
          ]
        : [{ path: "/akademik/input", label: "Input Data Akademik" }]
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
        padding: "0 max(12px, 2vw)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "clamp(56px, 10vh, 64px)",
        borderBottom: "1px solid #E8EAF0",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexWrap: "wrap",
        gap: "clamp(8px, 1vw, 12px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "min(32px, 4vw)" }}>
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
              paddingRight: "min(40px, 3vw)",
            }}
          />
          <div>
            <span
              style={{
                color: C.primary,
                fontWeight: 800,
                fontSize: "clamp(14px, 4vw, 20px)",
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
        
        {/* Desktop Navigation */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
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
                  padding: "6px clamp(8px, 2vw, 16px)",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  fontSize: "clamp(11px, 2.5vw, 14px)",
                  whiteSpace: "nowrap",
                  display: window.innerWidth > 768 ? "block" : "none",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 2vw, 16px)" }}>
        <div
          style={{
            background: C.bg,
            borderRadius: 24,
            padding: "6px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: C.textGray,
            fontSize: "clamp(11px, 2vw, 14px)",
            display: "none",
          }}
        >
          <span>
            <Search size={20} color="#718EBF" />
          </span>{" "}
          Cari sesuatu?
        </div>
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: window.innerWidth <= 768 ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 8px",
          }}
        >
          {showMobileMenu ? (
            <X size={24} color="#718EBF" />
          ) : (
            <Menu size={24} color="#718EBF" />
          )}
        </button>
        
        <NotificationCenter />

        {/* Profile Avatar with Dropdown */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
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
              transition: "all 0.2s",
              boxShadow: showLogoutMenu
                ? "0 0 0 3px rgba(102, 126, 234, 0.2)"
                : "none",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {user?.nama?.charAt(0) || "U"}
          </div>

          {/* Dropdown Menu */}
          {showLogoutMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 1000,
                minWidth: 200,
                marginTop: 8,
              }}
            >
              {/* User Info */}
              <div
                style={{
                  padding: 12,
                  borderBottom: "1px solid #f0f0f0",
                  fontSize: 13,
                }}
              >
                <div
                  style={{ fontWeight: 600, color: "#2c3e50", marginBottom: 4 }}
                >
                  {user?.nama}
                </div>
                <div style={{ fontSize: 12, color: "#8b8377" }}>
                  {user?.email}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setShowLogoutMenu(false);
                  setShowConfirmModal(true);
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  color: "#FF6B6B",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 13,
                  textAlign: "left",
                  borderRadius: "0 0 12px 12px",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#FFF0F0")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <LogOut size={16} style={{ marginRight: 6 }} /> Keluar
              </button>
            </div>
          )}
        </div>

        {/* Logout Confirmation Modal */}
        {showConfirmModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
            }}
            onClick={() => setShowConfirmModal(false)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 32,
                maxWidth: 400,
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "#FFE8E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LogOut size={32} color="#FF6B6B" />
                </div>
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#2c3e50",
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Konfirmasi Keluar
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#8b8377",
                  marginBottom: 24,
                  lineHeight: 1.6,
                  textAlign: "center",
                }}
              >
                Apakah Anda yakin ingin keluar dari akun ini?
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "#f0f0f0",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    color: "#8b8377",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#e8e8e8")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#f0f0f0")
                  }
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    onLogout();
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "#FF6B6B",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    color: "#fff",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#FF5252")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#FF6B6B")
                  }
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Menu Dropdown */}
      {showMobileMenu && window.innerWidth <= 768 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            borderBottom: "1px solid #E8EAF0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {navItems.map((item) => {
            const isActive =
              currentPath === item.path ||
              currentPath.startsWith(item.path + "/");
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setShowMobileMenu(false);
                }}
                style={{
                  background: isActive ? C.primaryLight : "transparent",
                  color: isActive ? C.primary : C.textGray,
                  border: "none",
                  borderBottom: "1px solid #f0f0f0",
                  padding: "12px 16px",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  fontSize: "14px",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f5f5f5")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = isActive
                    ? C.primaryLight
                    : "transparent")
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Navbar;
