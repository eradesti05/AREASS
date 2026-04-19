const getBaseUrl = () => {
  return process.env.REACT_APP_API_URL || "http://localhost:5000/api";
};

// ─── HELPER ───────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("areass_token");

const request = async (method, endpoint, body = null) => {
  const baseUrl = getBaseUrl();
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${baseUrl}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Request gagal");
  return data;
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password, userType) =>
    request("POST", "/auth/login", { email, password, userType }),
  register: (data, userType) =>
    request("POST", "/auth/register", { ...data, userType }),
  getMe: () => request("GET", "/auth/me"),
  updateProfile: (data) => request("PUT", "/auth/profile", data),
};

// ─── TASKS ────────────────────────────────────────────────────────────────────
export const taskAPI = {
  getAll: () => request("GET", "/tasks"),
  getSummary: () => request("GET", "/tasks/summary"),
  create: (data) => request("POST", "/tasks", data),
  update: (id, data) => request("PUT", `/tasks/${id}`, data),
  delete: (id) => request("DELETE", `/tasks/${id}`),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: () => request("GET", "/notifications"),
  markAsRead: (id) => request("PUT", `/notifications/${id}/read`),
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const categoryAPI = {
  getAll: () => request("GET", "/categories"),
  create: (name) => request("POST", "/categories", { name }),
};

// ─── AKADEMIK ─────────────────────────────────────────────────────────────────
export const akademikAPI = {
  getAll: () => request("GET", "/akademik"),
  create: (data) => request("POST", "/akademik", data),
  update: (id, data) => request("PUT", `/akademik/${id}`, data),
};

// ─── PREDIKSI ─────────────────────────────────────────────────────────────────
export const prediksiAPI = {
  run: () => request("POST", "/prediksi"),
  getLatest: () => request("GET", "/prediksi/latest"),
};

// ─── DOSEN WALI ───────────────────────────────────────────────────────────────
export const dosenAPI = {
  getMahasiswa: () => request("GET", "/dosen/mahasiswa"),
  getAkademikMahasiswa: (id) =>
    request("GET", `/dosen/mahasiswa/${id}/akademik`),
};

// ─── KAPRODI ──────────────────────────────────────────────────────────────────
export const kaprodiAPI = {
  getMahasiswa: () => request("GET", "/kaprodi/mahasiswa"),
  getStatistik: () => request("GET", "/kaprodi/statistik"),
};
