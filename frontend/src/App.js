import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

// Components
import Navbar from "./components/Navbar";

// Services
import { akademikAPI } from "./services/api";

// Pages
import LoginPageMahasiswa from "./pages/LoginPageMahasiswa";
import LoginPageDosen from "./pages/LoginPageDosen";
import LoginPageKaprodi from "./pages/LoginPageKaprodi";
import RegisterPage from "./pages/RegisterPage";
import RegisterPageMahasiswa from "./pages/RegisterPageMahasiswa";
import RegisterPageDosen from "./pages/RegisterPageDosen";
import RegisterPageKaprodi from "./pages/RegisterPageKaprodi";
import DashboardMahasiswa from "./pages/DashboardMahasiswa";
import TaskManagement from "./pages/TaskManagement";
import CreateTask from "./pages/CreateTask";
import EditTask from "./pages/EditTask";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardKaprodi from "./pages/DashboardKaprodi";
import DashboardDosenWali from "./pages/DashboardDosenWali";
import InputDataAkademikPage from "./pages/InputDataAkademikPage";
import AnalyticsPageKaprodi from "./pages/AnalyticsPageKaprodi";
import AnalyticsPageDosen from "./pages/AnalyticsPageDosen";

// Wrapper buat RegisterPage untuk validasi userType (deprecated - menggunakan komponen spesifik per role)
// function RegisterPageWrapper({ user, userType }) {
//   if (user) return <Navigate to="/dashboard" />;
//   return <RegisterPage allowedRole={userType} userType={userType} />;
// }

function InnerApp({ user, setUser, tasks, setTasks }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (u) => {
    setUser(u);

    if (u.token) {
      localStorage.setItem("areass_token", u.token);
    }
    // buat nyimpen data user juga agar saat refresh tidak hilang
    localStorage.setItem("areass_user", JSON.stringify(u));
    // ──────────────────────────

    const userId = u._id || u.id;

    if (u.role === "mahasiswa") {
      try {
        // Check ke server apakah mahasiswa sudah input data akademik
        const akademikData = await akademikAPI.getAll();
        const hasAkademikData = akademikData && akademikData.length > 0;

        // Set localStorage flag berdasarkan data dari server
        if (hasAkademikData) {
          localStorage.setItem(`akademik_completed_${userId}`, "true");
          navigate("/dashboard");
        } else {
          localStorage.removeItem(`akademik_completed_${userId}`);
          navigate("/akademik/input");
        }
      } catch (err) {
        // Jika error, fallback ke check localStorage
        console.error("Error checking akademik data:", err);
        const akademikCompleted = localStorage.getItem(
          `akademik_completed_${userId}`,
        );
        if (akademikCompleted) {
          navigate("/dashboard");
        } else {
          navigate("/akademik/input");
        }
      }
    } else if (u.role === "dosen_wali" || u.role === "dosen")
      navigate("/dashboard-dosen");
    else if (u.role === "kaprodi") navigate("/dashboard-kaprodi");
  };

  const handleLogout = () => {
    // Determine logout path based on current user role
    const userRole = user?.role;
    const logoutPath = 
      userRole === "kaprodi" 
        ? "/kaprodi/login" 
        : userRole === "dosen_wali"
        ? "/dosen/login"
        : "/mahasiswa/login";

    console.log("🔍 Logout - Role:", userRole, "→", logoutPath);

    // Clear localStorage
    localStorage.removeItem("areass_token");
    localStorage.removeItem("areass_user");
    
    // Clear user state
    setUser(null);
    
    // Use hard redirect to ensure navigation happens
    window.location.href = logoutPath;
  };

  // Check akademik data from server and sync localStorage
  useEffect(() => {
    const checkAkademikData = async () => {
      if (user?.role === "mahasiswa") {
        try {
          const akademikData = await akademikAPI.getAll();
          const hasAkademikData = akademikData && akademikData.length > 0;
          const userId = user._id || user.id;

          if (hasAkademikData) {
            localStorage.setItem(`akademik_completed_${userId}`, "true");
          } else {
            localStorage.removeItem(`akademik_completed_${userId}`);
          }
        } catch (err) {
          console.log("Info: Could not verify akademik data from server");
        }
      }
    };

    checkAkademikData();
  }, [user]);

  if (
    !user &&
    location.pathname !== "/mahasiswa/login" &&
    location.pathname !== "/dosen/login" &&
    location.pathname !== "/kaprodi/login" &&
    location.pathname !== "/register" &&
    !location.pathname.match(/^\/(mahasiswa|dosen|kaprodi)\/(login|register)$/)
  ) {
    return <Navigate to="/mahasiswa/login" />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#EFF1F5",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {user && (
        <Navbar
          user={user}
          onLogout={handleLogout}
          currentPath={location.pathname}
        />
      )}
      <Routes>
        {/* ─── Separate Login Pages per Role (Best Practice) ─── */}
        <Route
          path="/mahasiswa/login"
          element={
            user?.role === "mahasiswa" ? (
              <Navigate to="/dashboard" />
            ) : (
              <LoginPageMahasiswa onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dosen/login"
          element={
            user?.role === "dosen_wali" ? (
              <Navigate to="/dashboard-dosen" />
            ) : (
              <LoginPageDosen onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/kaprodi/login"
          element={
            user?.role === "kaprodi" ? (
              <Navigate to="/dashboard-kaprodi" />
            ) : (
              <LoginPageKaprodi onLogin={handleLogin} />
            )
          }
        />

        {/* Generic Routes (redirect to mahasiswa) */}
        <Route path="/login" element={<Navigate to="/mahasiswa/login" />} />
        <Route
          path="/register"
          element={<Navigate to="/mahasiswa/register" />}
        />

        {/* Separate Register Pages per Role */}
        <Route
          path="/mahasiswa/register"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <RegisterPageMahasiswa />
            )
          }
        />
        <Route
          path="/dosen/register"
          element={
            user ? (
              <Navigate to="/dashboard-dosen" />
            ) : (
              <RegisterPageDosen />
            )
          }
        />
        <Route
          path="/kaprodi/register"
          element={
            user ? (
              <Navigate to="/dashboard-kaprodi" />
            ) : (
              <RegisterPageKaprodi />
            )
          }
        />

        {/* Original Routes (kept for compatibility) */}
        <Route
          path="/dashboard"
          element={
            user?.role === "mahasiswa" ? (
              !localStorage.getItem(
                `akademik_completed_${user._id || user.id}`,
              ) ? (
                <Navigate to="/akademik/input" replace />
              ) : (
                <DashboardMahasiswa user={user} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/tasks"
          element={
            user?.role === "mahasiswa" ? (
              !localStorage.getItem(
                `akademik_completed_${user._id || user.id}`,
              ) ? (
                <Navigate to="/akademik/input" replace />
              ) : (
                <TaskManagement tasks={tasks} setTasks={setTasks} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/tasks/create"
          element={
            user?.role === "mahasiswa" ? (
              !localStorage.getItem(
                `akademik_completed_${user._id || user.id}`,
              ) ? (
                <Navigate to="/akademik/input" replace />
              ) : (
                <CreateTask setTasks={setTasks} />
              )
            ) : (
              <Navigate to="/mahasiswa/login" />
            )
          }
        />
        <Route
          path="/tasks/edit/:id"
          element={
            user?.role === "mahasiswa" ? (
              !localStorage.getItem(
                `akademik_completed_${user._id || user.id}`,
              ) ? (
                <Navigate to="/akademik/input" replace />
              ) : (
                <EditTask />
              )
            ) : (
              <Navigate to="/mahasiswa/login" />
            )
          }
        />
        <Route
          path="/analytics"
          element={
            user?.role === "mahasiswa" ? (
              !localStorage.getItem(
                `akademik_completed_${user._id || user.id}`,
              ) ? (
                <Navigate to="/akademik/input" replace />
              ) : (
                <AnalyticsPage />
              )
            ) : (
              <Navigate to="/mahasiswa/login" />
            )
          }
        />
        <Route
          path="/dashboard-dosen"
          element={
            user?.role === "dosen_wali" ? (
              <DashboardDosenWali />
            ) : (
              <Navigate to="/dosen/login" />
            )
          }
        />
        <Route
          path="/dashboard-kaprodi"
          element={
            user?.role === "kaprodi" ? (
              <DashboardKaprodi />
            ) : (
              <Navigate to="/kaprodi/login" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            user?.role === "mahasiswa" ? (
              !localStorage.getItem(
                `akademik_completed_${user._id || user.id}`,
              ) ? (
                <Navigate to="/akademik/input" replace />
              ) : (
                <ProfilePage user={user} />
              )
            ) : user ? (
              <ProfilePage user={user} />
            ) : (
              <Navigate to="/mahasiswa/login" />
            )
          }
        />
        <Route
          path="/akademik/input"
          element={
            user?.role === "mahasiswa" ? (
              <InputDataAkademikPage user={user} />
            ) : (
              <Navigate to="/mahasiswa/login" />
            )
          }
        />

        <Route
          path="/analytics/:mahasiswaId"
          element={
            user?.role === "kaprodi" || user?.role === "dosen_wali" ? (
              <AnalyticsPage />
            ) : (
              <Navigate to="/mahasiswa/login" />
            )
          }
        />
        <Route
          path="/kaprodi/analytics/:mahasiswaId"
          element={<AnalyticsPageKaprodi />}
        />
        <Route
          path="/dosen/analytics/:mahasiswaId"
          element={<AnalyticsPageDosen />}
        />

        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("areass_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [tasks, setTasks] = useState([]);

  return (
    <BrowserRouter>
      <InnerApp
        user={user}
        setUser={setUser}
        tasks={tasks}
        setTasks={setTasks}
      />
    </BrowserRouter>
  );
}

export default App;
