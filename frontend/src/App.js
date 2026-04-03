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

    if (u.role === "mahasiswa") navigate("/dashboard");
    else if (u.role === "dosen_wali") navigate("/dashboard-dosen");
    else if (u.role === "kaprodi") navigate("/dashboard-kaprodi");
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  if (
    !user &&
    location.pathname !== "/login" &&
    location.pathname !== "/register"
  ) {
    return <Navigate to="/login" />;
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
        <Route
          path="/login"
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
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />
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
            user?.role === "mahasiswa" ? <EditTask /> : <Navigate to="/login" />
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
