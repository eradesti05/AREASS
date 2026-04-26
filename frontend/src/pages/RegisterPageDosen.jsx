import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";
import { authAPI } from "../services/api";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  BookOpen,
} from "lucide-react";

const RegisterPageDosen = () => {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [prodi, setProdi] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!nama || !email || !password || !prodi) {
      setError("Semua field harus diisi");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    if (!email.endsWith("@itb.ac.id")) {
      setError("Gunakan email dosen (@itb.ac.id)");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authAPI.register({
        nama: nama,
        email,
        password,
        role: "dosen_wali",
        prodi,
      });
      navigate("/dosen/login");
    } catch (err) {
      setError(err.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    background: C.bg,
    borderRadius: 10,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  };
  const inputStyle = {
    border: "none",
    background: "transparent",
    width: "100%",
    fontSize: 14,
    outline: "none",
  };
  const labelStyle = { fontSize: 11, color: C.textGray };

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
          margin: "70px",
          padding: "48px 40px",
          width: 480,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 25, color: C.textDark, marginBottom: 4 }}>
            Register Dosen Wali
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
          </div>
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

        {/* Nama Lengkap */}
        <div style={fieldStyle}>
          <span>
            <User size={20} color="#718EBF" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Nama Lengkap</div>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              placeholder="Input nama lengkap anda"
              type="text"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Email */}
        <div style={fieldStyle}>
          <span>
            <Mail size={20} color="#718EBF" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              placeholder="xxxxxxxx@itb.ac.id"
              type="email"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Password */}
        <div style={fieldStyle}>
          <span>
            <Lock size={20} color="#718EBF" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Password</div>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              placeholder="Minimal 8 karakter"
              style={inputStyle}
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

        {/* Prodi */}
        <div style={fieldStyle}>
          <span>
            <BookOpen size={20} color="#718EBF" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Prodi</div>
            <input
              value={prodi}
              onChange={(e) => setProdi(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              placeholder="Input nama prodi"
              type="text"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Info: Role sudah ditetapkan sebagai Dosen Wali */}
        <div
          style={{
            background: "#E8F4F8",
            color: "#0369A1",
            fontSize: 12,
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          Role anda akan ditetapkan sebagai <strong>Dosen Wali</strong>
        </div>

        {/* Error */}
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

        {/* Tombol Register */}
        <button
          onClick={handleRegister}
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
          {loading ? "Memproses..." : "Register"}
        </button>

        {/* Link ke Login */}
        <div style={{ textAlign: "center", fontSize: 13, color: C.textGray }}>
          Sudah punya akun?{" "}
          <span
            onClick={() => navigate("/dosen/login")}
            style={{ color: C.primary, cursor: "pointer", fontWeight: 600 }}
          >
            Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPageDosen;
