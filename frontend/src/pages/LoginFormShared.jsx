import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";
import { authAPI } from "../services/api";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

/**
 * Shared login form component untuk semua role
 * Pros: DRY, maintainable
 * Cons: None - extracted properly
 */
const LoginFormShared = ({ requiredRole, userType, registerPath, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email dan password harus diisi");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authAPI.login(email, password);

      // Validate role match
      if (res.user.role !== requiredRole) {
        setError(
          `Halaman ini hanya untuk ${userType}. Silakan login di halaman yang sesuai.`,
        );
        setLoading(false);
        return;
      }

      const role = res.user.role?.toLowerCase().trim();
      const roleMap = {
        mahasiswa: "mahasiswa",
        "dosen wali": "dosen_wali",
        dosen_wali: "dosen_wali",
        kaprodi: "kaprodi",
      };

      const normalizedRole = roleMap[role];
      const cleanUser = { ...res.user, role: normalizedRole };

      localStorage.setItem("areass_token", res.token);
      localStorage.setItem("areass_user", JSON.stringify(cleanUser));

      onLoginSuccess(cleanUser);
    } catch (err) {
      setError(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const emailPlaceholder =
    userType === "mahasiswa"
      ? "xxxxxxxx@mahasiswa.itb.ac.id"
      : "xxxxxxxx@itb.ac.id";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 20,
          padding: "48px 40px",
          width: 480,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 25, color: C.textDark, marginBottom: 4 }}>
            Selamat Datang di
          </div>
          <div>
            <img
              src="/LogoAREASS.png"
              alt="AREASS Logo"
              style={{
                width: 180,
                height: 180,
                objectFit: "contain",
              }}
            />
            <div
              style={{
                fontSize: 12,
                color: C.textGray,
                fontWeight: 600,
                letterSpacing: 1,
                marginTop: 4,
              }}
            >
              Academic Risk Estimation and Adaptive Scheduling System
            </div>
          </div>
        </div>

        {/* Email Input */}
        <div
          style={{
            background: C.bg,
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <span>
            <Mail size={20} color="#718EBF" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.textGray }}>Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder={emailPlaceholder}
              type="text"
              style={{
                border: "none",
                background: "transparent",
                width: "100%",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Password Input */}
        <div
          style={{
            background: C.bg,
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span>
            <Lock size={20} color="#718EBF" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.textGray }}>Password</div>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••••"
              style={{
                border: "none",
                background: "transparent",
                width: "100%",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>
          <span
            onClick={() => setShowPass(!showPass)}
            style={{ cursor: "pointer", fontSize: 16 }}
          >
            {showPass ? (
              <EyeOff size={20} color="#718EBF" />
            ) : (
              <Eye size={20} color="#718EBF" />
            )}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              color: C.red,
              fontSize: 12,
              marginBottom: 12,
              textAlign: "center",
              background: "#FFE8EC",
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? "#9099E8" : C.primary,
            color: C.white,
            border: "none",
            borderRadius: 10,
            padding: "14px",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 20,
          }}
        >
          {loading ? "Memproses..." : "Login"}
        </button>

        {/* Register Link */}
        <div style={{ textAlign: "center", fontSize: 13, color: C.textGray }}>
          Kamu tidak memiliki akun?{" "}
          <span
            onClick={() => navigate(registerPath)}
            style={{ color: C.primary, cursor: "pointer", fontWeight: 600 }}
          >
            Register
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginFormShared;
