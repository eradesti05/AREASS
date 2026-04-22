const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "areass_secret_2026";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/areass";
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";
console.log("🔧 Configured ML API URL:", ML_API_URL);

// ─── CONNECT DB ───────────────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ─── MODELS ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["mahasiswa", "dosen_wali", "kaprodi"],
    required: true,
  },
  nim: String,
  prodi: String,
  dosenWaliId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

const akademikSchema = new mongoose.Schema({
  mahasiswaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  nim: String,
  strata: { type: String, default: "S2" },
  semesterKe: Number,
  ipSemester: Number,
  ipkTotal: Number,
  sksPerSemester: Number,
  totalSks: Number,
  jumlahSksLulus: Number,
  jumlahMkDiulang: { type: Number, default: 0 },
  hasilPrediksi: {
    type: String,
    enum: ["Aman", "Waspada", "Perlu perhatian"],
    default: null,
  },
  skorConfidence: Number,
  updatedAt: { type: Date, default: Date.now },
});
const Akademik = mongoose.model("Akademik", akademikSchema);

const taskSchema = new mongoose.Schema({
  mahasiswaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  namaTugas: { type: String, required: true },
  kategoriTask: { type: String, required: true },
  deadline: { type: Date, required: true },
  tingkatKesulitan: {
    type: String,
    enum: ["Rendah", "Sedang", "Tinggi"],
    required: true,
  },
  estimasiPengerjaan: { type: String, required: true },
  status: {
    type: String,
    enum: ["Backlog", "On Progress", "Done"],
    default: "Backlog",
  },
  priorityScore: { type: Number, default: 0 },
  priorityLabel: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Task = mongoose.model("Task", taskSchema);

// ─── NOTIFICATION SCHEMA ──────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["urgent", "warning", "summary"],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  isRead: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now },
  readAt: { type: Date },
});
const Notification = mongoose.model("Notification", notificationSchema);

// ─── CATEGORY SCHEMA ──────────────────────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});
const Category = mongoose.model("Category", categorySchema);

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token tidak ditemukan" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Token tidak valid" });
  }
};

const role =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Akses ditolak" });
    next();
  };

// ─── MAP ML PREDICTION TO VALID ENUM ──────────────────────────────────────────
// ML API return: lulus_tepat_waktu, lulus_terlambat, dropout, etc
// Database enum: Aman, Waspada, Perlu perhatian
const mapMLPredictionToEnum = (mlPrediction) => {
  const predictionMap = {
    lulus_tepat_waktu: "Aman",
    lulus_on_time: "Aman",
    lulus_terlambat: "Waspada",
    lulus_late: "Waspada",
    at_risk: "Waspada",
    dropout: "Perlu perhatian",
    at_risk_dropout: "Perlu perhatian",
  };

  return predictionMap[mlPrediction?.toLowerCase()] || "Aman"; // Default to Aman
};

// ─── RULE-BASED PRIORITY SCORE ────────────────────────────────────────────────
// Formula: Score = (urgensi × 3) + (kesulitan × 1.5) + estimasi + (status_backlog × 2)
// Semakin tinggi score = semakin prioritas
// Range: 2 (min) hingga 21 (max) untuk distribusi yang lebih baik
const hitungPriority = (task) => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const sisaHari = Math.max(
    0,
    Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)),
  );

  // Skor urgensi berdasarkan sisa hari — ini faktor paling penting
  let skorUrgensi = 1;
  if (sisaHari <= 1)
    skorUrgensi = 5; // Hari ini atau lusa
  else if (sisaHari <= 3)
    skorUrgensi = 4; // 2-3 hari
  else if (sisaHari <= 7)
    skorUrgensi = 3; // 4-7 hari
  else if (sisaHari <= 14) skorUrgensi = 2; // 8-14 hari
  // else skorUrgensi = 1 (lebih dari 2 minggu)

  // Skor kesulitan
  const skorKesulitan = { Tinggi: 3, Sedang: 2, Rendah: 1 };

  // Skor estimasi pengerjaan
  const jam = parseInt(task.estimasiPengerjaan) || 1;
  const skorEstimasi = jam >= 6 ? 3 : jam >= 3 ? 2 : 1;

  // Skor status — backlog lebih prioritas karena belum dimulai
  const skorStatus =
    task.status === "Backlog" ? 2 : task.status === "On Progress" ? 1 : 0;

  // Total dengan bobot yang lebih jelas
  const totalScore =
    skorUrgensi * 3 +
    (skorKesulitan[task.tingkatKesulitan] || 1) * 1.5 +
    skorEstimasi +
    skorStatus;

  // Label prioritas — threshold yang lebih variatif
  let label = "Rendah";
  if (totalScore >= 18)
    label = "Kritis"; // ~86-100% dari max
  else if (totalScore >= 13)
    label = "Tinggi"; // ~62-85% dari max
  else if (totalScore >= 8)
    label = "Sedang"; // ~38-61% dari max
  else label = "Rendah"; // ~10-37% dari max

  return { score: totalScore, label, sisaHari };
};

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  try {
    const { nama, email, password, role: userRole, prodi } = req.body; // ← hapus nim dari sini

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email sudah terdaftar" });

    const nim = email.split("@")[0]; // ← nim diambil dari email

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      nama,
      email,
      password: hashed,
      role: userRole,
      nim,
      prodi,
    });
    res.status(201).json({ message: "Registrasi berhasil", userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Email atau password salah" });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        nama: user.nama,
        nim: user.nim,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: {
        id: user._id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        nim: user.nim,
        prodi: user.prodi,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/auth/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/auth/profile", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { nama: req.body.nama, nim: req.body.nim, prodi: req.body.prodi },
      { new: true },
    ).select("-password");
    res.json({ message: "Profil diperbarui", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── TASK ROUTES ──────────────────────────────────────────────────────────────
// GET semua task — otomatis diurutkan berdasarkan priority score (rule-based)
app.get("/api/tasks", auth, role("mahasiswa"), async (req, res) => {
  try {
    const tasks = await Task.find({ mahasiswaId: req.user.id }).sort({
      priorityScore: -1,
      deadline: 1,
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET summary harian
app.get("/api/tasks/summary", auth, role("mahasiswa"), async (req, res) => {
  try {
    const tasks = await Task.find({ mahasiswaId: req.user.id });
    const now = new Date();
    const tenggatDekat = tasks.filter((t) => {
      const sisa = Math.ceil(
        (new Date(t.deadline) - now) / (1000 * 60 * 60 * 24),
      );
      return sisa <= 7 && t.status !== "Done";
    });
    res.json({
      totalTugas: tasks.length,
      tenggatWaktuTugas: tenggatDekat.length,
      estimasiBebanKerja: tasks.filter((t) => t.status !== "Done").length,
      backlog: tasks.filter((t) => t.status === "Backlog").length,
      onProgress: tasks.filter((t) => t.status === "On Progress").length,
      done: tasks.filter((t) => t.status === "Done").length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST buat task baru — langsung hitung priority score
app.post("/api/tasks", auth, role("mahasiswa"), async (req, res) => {
  try {
    const {
      namaTugas,
      kategoriTask,
      deadline,
      tingkatKesulitan,
      estimasiPengerjaan,
    } = req.body;

    if (
      !namaTugas ||
      !kategoriTask ||
      !deadline ||
      !tingkatKesulitan ||
      !estimasiPengerjaan
    ) {
      return res.status(400).json({ message: "Semua field harus diisi" });
    }

    const taskData = {
      mahasiswaId: req.user.id,
      namaTugas,
      kategoriTask,
      deadline,
      tingkatKesulitan,
      estimasiPengerjaan: String(estimasiPengerjaan),
    };

    const { score, label } = hitungPriority(taskData);
    taskData.priorityScore = score;
    taskData.priorityLabel = label;

    const task = await Task.create(taskData);
    res.status(201).json({ message: "Task berhasil dibuat", task, data: task });
  } catch (err) {
    res.status(500).json({ message: "Error membuat task: " + err.message });
  }
});

// PUT update task (status, dll) — recalculate priority score
app.put("/api/tasks/:id", auth, role("mahasiswa"), async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      mahasiswaId: req.user.id,
    });
    if (!task) return res.status(404).json({ message: "Task tidak ditemukan" });

    Object.assign(task, req.body);
    const { score, label } = hitungPriority(task);
    task.priorityScore = score;
    task.priorityLabel = label;
    task.updatedAt = new Date();
    await task.save();

    res.json({ message: "Task diperbarui", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE task
app.delete("/api/tasks/:id", auth, role("mahasiswa"), async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      mahasiswaId: req.user.id,
    });
    if (!task) return res.status(404).json({ message: "Task tidak ditemukan" });
    res.json({ message: "Task dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── AKADEMIK ROUTES ──────────────────────────────────────────────────────────
app.get("/api/akademik", auth, role("mahasiswa"), async (req, res) => {
  try {
    const data = await Akademik.find({ mahasiswaId: req.user.id }).sort({
      semesterKe: 1,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/akademik", auth, role("mahasiswa"), async (req, res) => {
  try {
    const existing = await Akademik.findOne({
      mahasiswaId: req.user.id,
      strata: req.body.strata,
      semesterKe: req.body.semesterKe,
    });
    if (existing)
      return res.status(400).json({
        message: `Data semester ${req.body.semesterKe} untuk ${req.body.strata} sudah ada`,
      });

    const data = await Akademik.create({
      mahasiswaId: req.user.id,
      nim: req.user.nim,
      ...req.body,
    });

    // After saving, try to get prediction from ML API
    let mlPredictions = {};
    try {
      const allAkademik = await Akademik.find({
        mahasiswaId: req.user.id,
      }).sort({ strata: 1, semesterKe: 1 });

      if (allAkademik.length === 0) {
        console.warn("⚠️ No akademik data found for student", req.user.id);
      } else {
        // ✅ Build grouped payload per strata sesuai spec ML API baru
        const stratas = ["S1", "S2", "S3"];
        const predictions = [];

        for (const strata of stratas) {
          const akademikByStrata = allAkademik.filter((a) => a.strata === strata);
          
          if (akademikByStrata.length > 0) {
            const latest = akademikByStrata[akademikByStrata.length - 1];
            
            predictions.push({
              strata: strata,
              ipk_total: latest.ipkTotal,
              history: akademikByStrata.map((row) => ({
                strata: row.strata,
                semester: row.semesterKe,
                ip_semester: row.ipSemester,
                sks_semester: row.sksPerSemester,
                total_sks: row.sksPerSemester,
                sks_lulus: row.jumlahSksLulus,
              })),
            });
          }
        }

        // ✅ Build payload sesuai spec
        const mlPayload = {
          student_id: req.user.id,
          predictions: predictions,
        };

        console.log(
          "📤 Sending to ML API with",
          predictions.length,
          "strata(s):",
          JSON.stringify(mlPayload, null, 2),
        );

        const mlRes = await fetch(`${ML_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mlPayload),
          timeout: 5000,
        });

        if (mlRes.ok) {
          mlPredictions = await mlRes.json();
          console.log("✅ ML Predictions received:", JSON.stringify(mlPredictions, null, 2));

          // ✅ Handle response format: { S1: {...}, S2: {...}, S3: {...} }
          for (const strata of stratas) {
            if (mlPredictions[strata]) {
              const prediction = mlPredictions[strata];
              const mlPredictionValue = prediction.prediction;
              const mappedPrediction = mapMLPredictionToEnum(mlPredictionValue);
              const probability = prediction.probability || {};
              const skorConfidence = probability[mlPredictionValue] || 0.5;

              console.log(`📊 Storing prediction for ${strata}:`, {
                mlValue: mlPredictionValue,
                mapped: mappedPrediction,
                skorConfidence,
              });

              // Update all akademik records untuk strata ini
              await Akademik.updateMany(
                { mahasiswaId: req.user.id, strata: strata },
                {
                  hasilPrediksi: mappedPrediction,
                  skorConfidence: skorConfidence,
                },
              );
            }
          }
        } else {
          console.error("❌ ML API Error:", mlRes.status, mlRes.statusText);
          const errorText = await mlRes.text();
          console.error("ML API Response:", errorText);
        }
      }
    } catch (mlErr) {
      console.error("ML Prediction Error:", mlErr.message);
      // Don't block - prediction is optional
    }

    res.status(201).json({
      message: "Data akademik disimpan + prediksi di-generate",
      data,
      mlPredictions: mlPredictions || {},
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/akademik/:id", auth, role("mahasiswa"), async (req, res) => {
  try {
    const data = await Akademik.findOneAndUpdate(
      { _id: req.params.id, mahasiswaId: req.user.id },
      { ...req.body, updatedAt: new Date() },
      { new: true },
    );
    if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });
    res.json({ message: "Data akademik diperbarui", data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PREDIKSI ROUTES ──────────────────────────────────────────────────────────
app.post("/api/prediksi", auth, role("mahasiswa"), async (req, res) => {
  try {
    const allAkademik = await Akademik.find({ 
      mahasiswaId: req.user.id 
    }).sort({ strata: 1, semesterKe: 1 });
    
    if (!allAkademik.length)
      return res.status(400).json({ message: "Data akademik belum ada" });

    let mlPredictions = {};
    try {
      // ✅ Build grouped payload per strata sesuai spec ML API baru
      const stratas = ["S1", "S2", "S3"];
      const predictions = [];

      for (const strata of stratas) {
        const akademikByStrata = allAkademik.filter((a) => a.strata === strata);
        
        if (akademikByStrata.length > 0) {
          const latest = akademikByStrata[akademikByStrata.length - 1];
          
          predictions.push({
            strata: strata,
            ipk_total: latest.ipkTotal,
            history: akademikByStrata.map((row) => ({
              strata: row.strata,
              semester: row.semesterKe,
              ip_semester: row.ipSemester,
              sks_semester: row.sksPerSemester,
              total_sks: row.sksPerSemester,
              sks_lulus: row.jumlahSksLulus,
            })),
          });
        }
      }

      if (predictions.length > 0) {
        // ✅ Build payload sesuai spec
        const mlPayload = {
          student_id: req.user.id,
          predictions: predictions,
        };

        console.log(
          "📤 POST /api/prediksi: Sending to ML API with",
          predictions.length,
          "strata(s):",
          JSON.stringify(mlPayload, null, 2),
        );

        const mlRes = await fetch(`${ML_API_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mlPayload),
          timeout: 5000,
        });

        if (mlRes.ok) {
          mlPredictions = await mlRes.json();
          console.log("✅ ML Predictions received:", JSON.stringify(mlPredictions, null, 2));

          // ✅ Handle response format: { S1: {...}, S2: {...}, S3: {...} }
          for (const strata of stratas) {
            if (mlPredictions[strata]) {
              const prediction = mlPredictions[strata];
              const mlPredictionValue = prediction.prediction;
              const mappedPrediction = mapMLPredictionToEnum(mlPredictionValue);
              const probability = prediction.probability || {};
              const skorConfidence = probability[mlPredictionValue] || 0.5;

              console.log(`📊 Storing prediction for ${strata}:`, {
                mlValue: mlPredictionValue,
                mapped: mappedPrediction,
                skorConfidence,
              });

              // Update all akademik records untuk strata ini
              await Akademik.updateMany(
                { mahasiswaId: req.user.id, strata: strata },
                {
                  hasilPrediksi: mappedPrediction,
                  skorConfidence: skorConfidence,
                },
              );
            }
          }
        } else {
          console.error("❌ ML API Error:", mlRes.status, mlRes.statusText);
          const errorText = await mlRes.text();
          console.error("ML API Response:", errorText);
        }
      }
    } catch (mlErr) {
      console.error("ML Prediction Error:", mlErr.message);
      // Don't block - continue without ML prediction
    }

    // Return latest prediction for user's first strata
    const latestPrediksi = await Akademik.findOne({
      mahasiswaId: req.user.id,
      hasilPrediksi: { $ne: null },
    }).sort({ semesterKe: -1 });

    res.json({
      hasilPrediksi: latestPrediksi?.hasilPrediksi || "Aman",
      skorConfidence: latestPrediksi?.skorConfidence || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/prediksi/latest", auth, role("mahasiswa"), async (req, res) => {
  try {
    // Get strata dari query parameter, default ke S1
    const strata = req.query.strata || "S1";
    
    const latest = await Akademik.findOne({
      mahasiswaId: req.user.id,
      strata: strata,
      hasilPrediksi: { $ne: null },
    }).sort({ semesterKe: -1 });
    
    if (!latest) return res.json({ hasilPrediksi: "Aman", skorConfidence: 0 });
    res.json({
      hasilPrediksi: latest.hasilPrediksi,
      skorConfidence: latest.skorConfidence,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DOSEN WALI ROUTES ────────────────────────────────────────────────────────
app.get("/api/dosen/mahasiswa", auth, role("dosen_wali"), async (req, res) => {
  try {
    const list = await User.find({
      dosenWaliId: req.user.id,
      role: "mahasiswa",
    }).select("-password");
    const result = await Promise.all(
      list.map(async (m) => {
        const ak = await Akademik.findOne({ mahasiswaId: m._id }).sort({
          semesterKe: -1,
        });
        return {
          id: m._id,
          nama: m.nama,
          nim: m.nim,
          prodi: m.prodi,
          ipkTotal: ak?.ipkTotal || 0,
          semesterKe: ak?.semesterKe || 0,
          hasilPrediksi: ak?.hasilPrediksi || "Belum ada data",
        };
      }),
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get(
  "/api/dosen/mahasiswa/:id/akademik",
  auth,
  role("dosen_wali"),
  async (req, res) => {
    try {
      const data = await Akademik.find({ mahasiswaId: req.params.id }).sort({
        semesterKe: 1,
      });
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ─── KAPRODI ROUTES ───────────────────────────────────────────────────────────
app.get("/api/kaprodi/mahasiswa", auth, role("kaprodi"), async (req, res) => {
  try {
    const kaprodi = await User.findById(req.user.id);
    const list = await User.find({
      role: "mahasiswa",
      prodi: kaprodi.prodi,
    }).select("-password");
    const result = await Promise.all(
      list.map(async (m) => {
        const ak = await Akademik.findOne({ mahasiswaId: m._id }).sort({
          semesterKe: -1,
        });
        return {
          id: m._id,
          nama: m.nama,
          nim: m.nim,
          ipkTotal: ak?.ipkTotal || 0,
          semesterKe: ak?.semesterKe || 0,
          hasilPrediksi: ak?.hasilPrediksi || "Belum ada data",
        };
      }),
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/kaprodi/statistik", auth, role("kaprodi"), async (req, res) => {
  try {
    const kaprodi = await User.findById(req.user.id);
    const list = await User.find({ role: "mahasiswa", prodi: kaprodi.prodi });
    const ids = list.map((m) => m._id);
    const stats = await Akademik.aggregate([
      { $match: { mahasiswaId: { $in: ids }, hasilPrediksi: { $ne: null } } },
      { $sort: { semesterKe: -1 } },
      {
        $group: {
          _id: "$mahasiswaId",
          hasilPrediksi: { $first: "$hasilPrediksi" },
        },
      },
      { $group: { _id: "$hasilPrediksi", jumlah: { $sum: 1 } } },
    ]);
    res.json({ totalMahasiswa: list.length, distribusi: stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── SEED DATA ────────────────────────────────────────────────────────────────
app.post("/api/seed", async (req, res) => {
  try {
    await User.deleteMany({});
    await Akademik.deleteMany({});
    await Task.deleteMany({});

    const pass = await bcrypt.hash("password", 10);

    const mahasiswa = await User.create({
      nama: "Ahmad Muhklis",
      email: "23525789@mahasiswa.itb.ac.id",
      password: pass,
      role: "mahasiswa",
      nim: "23525789",
      prodi: "Magister Informatika",
    });
    const dosen = await User.create({
      nama: "Dr. Budi Santoso",
      email: "dosenwali@itb.ac.id",
      password: pass,
      role: "dosen_wali",
      prodi: "Magister Informatika",
    });
    await User.create({
      nama: "Prof. Siti Rahma",
      email: "kaprodi@itb.ac.id",
      password: pass,
      role: "kaprodi",
      prodi: "Magister Informatika",
    });
    await User.findByIdAndUpdate(mahasiswa._id, { dosenWaliId: dosen._id });

    // Seed data akademik per semester
    const semData = [
      {
        semesterKe: 1,
        ipSemester: 3.2,
        ipkTotal: 3.2,
        sksPerSemester: 13,
        totalSks: 13,
        jumlahSksLulus: 13,
      },
      {
        semesterKe: 2,
        ipSemester: 3.5,
        ipkTotal: 3.35,
        sksPerSemester: 14,
        totalSks: 27,
        jumlahSksLulus: 27,
      },
      {
        semesterKe: 3,
        ipSemester: 3.1,
        ipkTotal: 3.27,
        sksPerSemester: 12,
        totalSks: 39,
        jumlahSksLulus: 39,
      },
      {
        semesterKe: 4,
        ipSemester: 3.78,
        ipkTotal: 3.38,
        sksPerSemester: 20,
        totalSks: 59,
        jumlahSksLulus: 59,
      },
    ];
    for (const d of semData) {
      await Akademik.create({
        mahasiswaId: mahasiswa._id,
        nim: mahasiswa.nim,
        strata: "S2",
        ...d,
        jumlahMkDiulang: 0,
        hasilPrediksi: "Aman",
        skorConfidence: 0.87,
      });
    }

    // Seed tasks dengan priority score otomatis
    const tasksData = [
      {
        namaTugas: "Analisis Data",
        kategoriTask: "Statistika",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        tingkatKesulitan: "Tinggi",
        estimasiPengerjaan: "5 jam",
        status: "Backlog",
      },
      {
        namaTugas: "Brainstorming",
        kategoriTask: "Penelitian",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        tingkatKesulitan: "Rendah",
        estimasiPengerjaan: "2 jam",
        status: "Backlog",
      },
      {
        namaTugas: "Wireframes",
        kategoriTask: "IF5200",
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tingkatKesulitan: "Tinggi",
        estimasiPengerjaan: "4 jam",
        status: "On Progress",
      },
      {
        namaTugas: "Design System",
        kategoriTask: "IF5300",
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tingkatKesulitan: "Sedang",
        estimasiPengerjaan: "3 jam",
        status: "Done",
      },
    ];
    for (const t of tasksData) {
      const taskData = { mahasiswaId: mahasiswa._id, ...t };
      const { score, label } = hitungPriority(taskData);
      await Task.create({
        ...taskData,
        priorityScore: score,
        priorityLabel: label,
      });
    }

    res.json({
      message:
        "✅ Seed berhasil! Akun: 23525789@mahasiswa.itb.ac.id / password",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── NOTIFICATION ROUTES ──────────────────────────────────────────────────────
// GET notifications untuk user
app.get("/api/notifications", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ sentAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark notification as read
app.put("/api/notifications/:id/read", auth, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true },
    );
    if (!notif)
      return res.status(404).json({ message: "Notifikasi tidak ditemukan" });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manual trigger for testing (DELETE this in production)
app.post("/api/notifications/trigger-test", auth, async (req, res) => {
  try {
    // Buat notifikasi test langsung
    const testNotif = await Notification.create({
      userId: req.user.id,
      type: "summary",
      title: "🧪 Notifikasi Test",
      message: "Ini notifikasi test dari Postman. Notifikasi sistem berhasil terhubung!",
    });

    const notifs = await Notification.find({ userId: req.user.id })
      .sort({ sentAt: -1 })
      .limit(10);
    
    res.json({
      message: "✅ Test notification created successfully",
      data: notifs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CATEGORY ROUTES ──────────────────────────────────────────────────────────
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    // Return array of names for frontend compatibility
    res.json(categories.map((cat) => cat.name));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/categories", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Nama kategori harus diisi" });
    }

    // Check if category already exists
    const exists = await Category.findOne({ name: name.trim() });
    if (exists) {
      return res.json({ message: "Kategori sudah ada", data: exists });
    }

    const category = await Category.create({ name: name.trim() });
    res
      .status(201)
      .json({ message: "✅ Kategori berhasil ditambahkan", data: category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── NOTIFICATION GENERATION LOGIC ────────────────────────────────────────────
const generateDailyNotifications = async () => {
  try {
    const mahasiswas = await User.find({ role: "mahasiswa" });

    for (const mahasiswa of mahasiswas) {
      const tasks = await Task.find({ mahasiswaId: mahasiswa._id });
      const now = new Date();

      // Rule 1: Urgent tasks (deadline <= 1 hari)
      const urgentTasks = tasks.filter((t) => {
        if (t.status === "Done") return false;
        const sisa = Math.ceil(
          (new Date(t.deadline) - now) / (1000 * 60 * 60 * 24),
        );
        return sisa <= 1 && sisa > 0;
      });

      // Rule 2: Warning tasks (deadline 3-7 hari & status Backlog)
      const warningTasks = tasks.filter((t) => {
        if (t.status !== "Backlog") return false;
        const sisa = Math.ceil(
          (new Date(t.deadline) - now) / (1000 * 60 * 60 * 24),
        );
        return sisa > 1 && sisa <= 7;
      });

      // Rule 3: Overdue tasks
      const overdueTasks = tasks.filter((t) => {
        if (t.status === "Done") return false;
        const sisa = Math.ceil(
          (new Date(t.deadline) - now) / (1000 * 60 * 60 * 24),
        );
        return sisa < 0;
      });

      // Create notifications
      if (urgentTasks.length > 0) {
        for (const task of urgentTasks) {
          await Notification.create({
            userId: mahasiswa._id,
            type: "urgent",
            title: "🚨 URGENT: Deadline Besok!",
            message: `Task "${task.namaTugas}" deadline hari besok jam 23:59`,
            relatedTaskId: task._id,
          });
        }
      }

      if (warningTasks.length > 0) {
        for (const task of warningTasks) {
          const sisa = Math.ceil(
            (new Date(task.deadline) - now) / (1000 * 60 * 60 * 24),
          );
          await Notification.create({
            userId: mahasiswa._id,
            type: "warning",
            title: "⚠️ Task Alert",
            message: `Task "${task.namaTugas}" deadline ${sisa} hari lagi. Status: Backlog (belum dikerjakan)`,
            relatedTaskId: task._id,
          });
        }
      }

      if (overdueTasks.length > 0) {
        for (const task of overdueTasks) {
          const sisa = Math.abs(
            Math.ceil((new Date(task.deadline) - now) / (1000 * 60 * 60 * 24)),
          );
          await Notification.create({
            userId: mahasiswa._id,
            type: "urgent",
            title: "❌ Task Overdue!",
            message: `Task "${task.namaTugas}" sudah ${sisa} hari terlamabat!`,
            relatedTaskId: task._id,
          });
        }
      }

      // Rule 4: Daily summary
      const totalTasks = tasks.length;
      const onProgress = tasks.filter((t) => t.status === "On Progress").length;
      const done = tasks.filter((t) => t.status === "Done").length;

      await Notification.create({
        userId: mahasiswa._id,
        type: "summary",
        title: "📊 Daily Summary",
        message: `Hari ini: ${totalTasks} total tugas | ${onProgress} progres | ${done} selesai | ${urgentTasks.length} urgent | ${overdueTasks.length} overdue`,
      });
    }

    console.log(
      "✅ Daily notifications generated at",
      new Date().toLocaleTimeString(),
    );
  } catch (err) {
    console.error("❌ Error generating notifications:", err);
  }
};

// ─── CRON JOB SCHEDULER (Run setiap hari pukul 23:59) ─────────────────────────
cron.schedule("59 23 * * *", () => {
  console.log("🔔 Running daily notification scheduler...");
  generateDailyNotifications();
});

// ─── INITIALIZE DEFAULT CATEGORIES ────────────────────────────────────────────
const initializeCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      const defaultCategories = [
        { name: "IF5100" },
        { name: "IF5200" },
        { name: "IF5300" },
        { name: "Penelitian" },
        { name: "Statistika" },
        { name: "UKM" },
      ];
      await Category.insertMany(defaultCategories);
      console.log("✅ Default categories initialized");
    }
  } catch (err) {
    console.error("❌ Error initializing categories:", err);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await initializeCategories();
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});

// GET tren mahasiswa per semester (untuk kaprodi)
app.get(
  "/api/kaprodi/tren-semester",
  auth,
  role("kaprodi"),
  async (req, res) => {
    try {
      const kaprodi = await User.findById(req.user.id);
      const mahasiswaList = await User.find({
        role: "mahasiswa",
        prodi: kaprodi.prodi,
      });
      const ids = mahasiswaList.map((m) => m._id);

      // Hitung jumlah mahasiswa per semester
      const tren = await Akademik.aggregate([
        { $match: { mahasiswaId: { $in: ids } } },
        {
          $group: { _id: "$semesterKe", jumlah: { $addToSet: "$mahasiswaId" } },
        },
        { $project: { semesterKe: "$_id", jumlah: { $size: "$jumlah" } } },
        { $sort: { semesterKe: 1 } },
      ]);

      res.json(tren);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

app.get(
  "/api/akademik/:id",
  auth,
  role("kaprodi", "dosen_wali"),
  async (req, res) => {
    try {
      const data = await Akademik.find({
        mahasiswaId: req.params.id,
      }).sort({ semesterKe: 1 });

      res.json(data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

app.get(
  "/api/prediksi/:id",
  auth,
  role("kaprodi", "dosen_wali"),
  async (req, res) => {
    try {
      const latest = await Akademik.findOne({
        mahasiswaId: req.params.id,
        hasilPrediksi: { $ne: null },
      }).sort({ semesterKe: -1 });

      if (!latest) {
        return res.json({
          hasilPrediksi: "Belum ada data",
          skorConfidence: 0,
        });
      }

      res.json({
        hasilPrediksi: latest.hasilPrediksi,
        skorConfidence: latest.skorConfidence,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

app.get("/api/kaprodi/akademik", auth, role("kaprodi"), async (req, res) => {
  try {
    const kaprodi = await User.findById(req.user.id);

    const mahasiswaList = await User.find({
      role: "mahasiswa",
      prodi: kaprodi.prodi,
    });

    const ids = mahasiswaList.map((m) => m._id);

    const data = await Akademik.find({
      mahasiswaId: { $in: ids },
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
