export const USERS = [
  { id: 1, role: "mahasiswa", email: "23525789@mahasiswa.itb.ac.id", password: "password", nama: "Ahmad Muhklis", nim: "23525789", prodi: "Magister Informatika" },
  { id: 2, role: "dosen_wali", email: "dosenwali@itb.ac.id", password: "password", nama: "Dr. Budi Santoso", nim: "-", prodi: "Magister Informatika" },
  { id: 3, role: "kaprodi", email: "kaprodi@itb.ac.id", password: "password", nama: "Prof. Siti Rahma", nim: "-", prodi: "Magister Informatika" },
];

export const ipkTrend = [
  { semester: "Sem 1", ip: 0.5 },
  { semester: "Sem 2", ip: 2.2 },
  { semester: "Sem 3", ip: 1.6 },
  { semester: "Sem 4", ip: 3.7 },
  { semester: "Sem 5", ip: 2.0 },
  { semester: "Sem 6", ip: 2.9 },
];

export const sksTrend = [
  { semester: "Sem 1", sks: 13 },
  { semester: "Sem 2", sks: 11 },
  { semester: "Sem 3", sks: 11 },
  { semester: "Sem 4", sks: 24 },
  { semester: "Sem 5", sks: 15 },
  { semester: "Sem 6", sks: 16 },
];

export const taskProgress = [
  { name: "On Progress", value: 30, color: "#1A2050" },
  { name: "Backlog", value: 20, color: "#FF6B8A" },
  { name: "Done", value: 50, color: "#F5A623" },
];

export const mahasiswaList = [
  { nim: "23525112", nama: "Saffa Ramayani", ipk: 3.45, status: "Aman" },
  { nim: "23525101", nama: "Sayyid Hardja", ipk: 2.76, status: "Waspada" },
  { nim: "23525789", nama: "Ahmad Muhklis", ipk: 3.97, status: "Aman" },
  { nim: "23525456", nama: "Abdi Widianto", ipk: 3.67, status: "Aman" },
  { nim: "23525123", nama: "Haikal Alfaridzy", ipk: 2.38, status: "Perlu perhatian" },
];

export const prediksiTrend = [
  { semester: "Sem 1", jumlah: 130 },
  { semester: "Sem 2", jumlah: 210 },
  { semester: "Sem 3", jumlah: 170 },
  { semester: "Sem 4", jumlah: 285 },
  { semester: "Sem 5", jumlah: 200 },
  { semester: "Sem 6", jumlah: 245 },
];

export const distribusiPrediksi = [
  { name: "Lulus tepat waktu", value: 45, color: "#1A2050" },
  { name: "Lulus terlambat", value: 35, color: "#1A23C8" },
  { name: "Drop out", value: 20, color: "#FF00FF" },
];

export const nilaiMahasiswaBimbingan = [
  { semester: "Sem 1", nilai: 3.2 },
  { semester: "Sem 2", nilai: 3.5 },
  { semester: "Sem 3", nilai: 3.1 },
  { semester: "Sem 4", nilai: 3.8 },
  { semester: "Sem 5", nilai: 3.6 },
  { semester: "Sem 6", nilai: 3.9 },
];

export const initialTasks = [
  { id: 1, nama: "Brainstorming", kategori: "Penelitian", kesulitan: "Rendah", deadline: "2026-03-25", estimasi: "2 jam", status: "Backlog", deskripsi: "Brainstorming brings team members diverse experience into play." },
  { id: 2, nama: "Analisis Data", kategori: "Statistika", kesulitan: "Tinggi", deadline: "2026-03-26", estimasi: "5 jam", status: "Backlog", deskripsi: "Analisis data untuk kebutuhan penelitian terapan." },
  { id: 3, nama: "Wireframes", kategori: "IF5200", kesulitan: "Tinggi", deadline: "2026-03-27", estimasi: "4 jam", status: "Backlog", deskripsi: "Low fidelity wireframes include the most basic content and visuals." },
  { id: 4, nama: "Brainstorming", kategori: "Penelitian", kesulitan: "Rendah", deadline: "2026-03-28", estimasi: "2 jam", status: "Backlog", deskripsi: "Brainstorming brings team members diverse experience into play." },
  { id: 5, nama: "Onboarding Illustrations", kategori: "IF5100", kesulitan: "Rendah", deadline: "2026-03-24", estimasi: "3 jam", status: "On Progress", deskripsi: "Membuat ilustrasi onboarding untuk sistem." },
  { id: 6, nama: "Wireframes", kategori: "IF5200", kesulitan: "Tinggi", deadline: "2026-03-25", estimasi: "4 jam", status: "On Progress", deskripsi: "Low fidelity wireframes include the most basic content and visuals." },
  { id: 7, nama: "Wireframes", kategori: "IF5200", kesulitan: "Tinggi", deadline: "2026-03-26", estimasi: "4 jam", status: "On Progress", deskripsi: "Low fidelity wireframes include the most basic content and visuals." },
  { id: 8, nama: "Mobile App Design", kategori: "IF5300", kesulitan: "Tinggi", deadline: "2026-03-20", estimasi: "6 jam", status: "Done", deskripsi: "Desain aplikasi mobile AREASS." },
  { id: 9, nama: "Design System", kategori: "IF5300", kesulitan: "Sedang", deadline: "2026-03-21", estimasi: "3 jam", status: "Done", deskripsi: "It just needs to adapt the UI from what you did before." },
];
