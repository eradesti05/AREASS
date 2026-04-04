import { useState } from "react";
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

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardMahasiswa from "./pages/DashboardMahasiswa";
import TaskManagement from "./pages/TaskManagement";
import CreateTask from "./pages/CreateTask";
import EditTask from "./pages/EditTask";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardKaprodi from "./pages/DashboardKaprodi";
import DashboardDosenWali from "./pages/DashboardDosenWali";
import InputDataAkademikPage from "./pages/InputDataAkademikPage";

// ─── INNER APP ───────────────────────────────────────────────────────────────
function InnerApp({ user, setUser, tasks, setTasks }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (u) => {
    setUser(u);

    // For mahasiswa, check if academic data is completed
    if (u.role === "mahasiswa") {
      const akademikCompleted = localStorage.getItem(`akademik_completed_${u._id}`);
      if (akademikCompleted) {
        navigate("/dashboard");
      } else {
        // First time login - redirect to complete academic data
        navigate("/akademik/input");
      }
    }
    else if (u.role === "dosen_wali" || u.role === "dosen") navigate("/dashboard-dosen");
    else if (u.role === "kaprodi") navigate("/dashboard-kaprodi");
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/mahasiswa/login");
  };

  if (
    !user &&
    location.pathname !== "/login" &&
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
        {/* Generic Routes (redirect to mahasiswa) */}
        <Route
          path="/login"
          element={<Navigate to="/mahasiswa/login" />}
        />
        <Route
          path="/register"
          element={<Navigate to="/mahasiswa/register" />}
        />

        {/* User Type Specific Routes */}
        <Route
          path="/:userTypeParam/login"
          element={
            user ? (
              <Navigate
                to={
                  user.role === "mahasiswa"
                    ? "/dashboard"
                    : user.role === "dosen_wali"
                      ? "/dashboard-dosen"
                      : "/dashboard-kaprodi"
                }
              />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/:userTypeParam/register"
          element={user ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />

        {/* Original Routes (kept for compatibility) */}
        <Route
          path="/dashboard"
          element={
            user?.role === "mahasiswa" ? (
              <DashboardMahasiswa user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/tasks"
          element={
            user?.role === "mahasiswa" ? (
              <TaskManagement tasks={tasks} setTasks={setTasks} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/tasks/create"
          element={
            user?.role === "mahasiswa" ? (
              <CreateTask setTasks={setTasks} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/tasks/edit/:id"
          element={
            user?.role === "mahasiswa" ? (
              <EditTask />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/analytics"
          element={
            user?.role === "mahasiswa" ? (
              <AnalyticsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard-dosen"
          element={
            user?.role === "dosen_wali" ? (
              <DashboardDosenWali />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard-kaprodi"
          element={
            user?.role === "kaprodi" ? (
              <DashboardKaprodi />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            user ? <ProfilePage user={user} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/akademik/input"
          element={
            user?.role === "mahasiswa" ? (
              <InputDataAkademikPage user={user} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────
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
