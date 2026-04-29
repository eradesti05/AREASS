# 🎯 AREASS Postman Collection - Setup Instructions

Dokumentasi lengkap untuk menggunakan Postman Collection dengan AREASS API.

## 📦 Files Included

### 1. **AREASS_Postman_Collection.json**
   - Koleksi lengkap semua API endpoints
   - 26 endpoint sudah ter-organize per kategori:
     - 🔐 Authentication (Register, Login, Profile)
     - 📋 Task Management
     - 📊 Akademik Data
     - 🔮 Predictions (ML)
     - 🧑‍🎓 Dosen Wali Dashboard
     - 👨‍💼 Kaprodi Dashboard
     - 🔔 Notifications
     - 📂 Categories
     - 🌱 Database Seed
   - Pre-configured variables
   - Auto-save token setelah login
   - Ready to use - tinggal import!

### 2. **AREASS_Postman_Environment_Dev.json**
   - Environment configuration untuk development
   - Variables: baseUrl, token, userId, role, dll

### 3. **POSTMAN_GUIDE.md**
   - Panduan lengkap menggunakan collection
   - Workflow testing per role
   - Troubleshooting & tips

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install & Start Backend
```bash
cd backend
npm install
npm run dev
```
Backend akan running di `http://localhost:5000`

### Step 2: Import Collection ke Postman
```
Postman → Import → Select AREASS_Postman_Collection.json
```

### Step 3: Import Environment (Optional)
```
Postman → Environments → Import → AREASS_Postman_Environment_Dev.json
```

### Step 4: Test API
1. Go to **Authentication → Login**
2. Input credentials
3. Send - token otomatis tersimpan
4. Try other endpoints!

---

## 🎯 Testing Checklist

- [ ] Backend running on `http://localhost:5000`
- [ ] MongoDB connected
- [ ] Collection imported to Postman
- [ ] Environment selected (Dev)
- [ ] Register user successfully
- [ ] Login & get token
- [ ] Create task
- [ ] Get task summary
- [ ] Create akademik record
- [ ] Run prediction

---

## 📋 API Roles & Access

### Mahasiswa (Student)
- Create/edit own tasks
- Input akademik data
- View own predictions
- Receive notifications

### Dosen Wali (Advisor)
- View all mahasiswa dalam program studi yang sama
- View akademik history mahasiswa
- Monitor predictions

### Kaprodi (Department Head)
- View all mahasiswa dalam department
- View statistics & trends
- Analyze performance distribution

### Public
- Register & Login

---

## 🔐 Authentication

**Default JWT Secret:** `areass_secret_2026` (changeable via .env)

**Token expiration:** 7 days

**Usage in Postman:**
```
Authorization: Bearer {{token}}
```
- Automatically set after login
- Auto-included in all protected endpoints

---

## 💡 Key Endpoints Explained

### Registration
```json
POST /auth/register
{
  "nama": "Student Name",
  "email": "12345@student.example.com",  // NIM from email
  "password": "Password123!",
  "userType": "mahasiswa",               // mahasiswa/dosen_wali/kaprodi
  "prodi": "Teknik Informatika"
}
```

### Create Task with Priority Calculation
```json
POST /tasks
{
  "namaTugas": "Task name",
  "kategoriTask": "Academic",
  "deadline": "2026-05-10",
  "tingkatKesulitan": "Tinggi",          // Rendah/Sedang/Tinggi
  "estimasiPengerjaan": "15 jam",
  "status": "Backlog"                    // Backlog/On Progress/Done
}
```
Priority Score otomatis dihitung!

### Get Task Summary
```json
GET /tasks/summary
Response: {
  "totalTugas": 5,
  "tenggatWaktuTugas": 2,    // deadline ≤ 7 hari
  "estimasiBebanKerja": "50 jam",
  "backlog": 2,
  "onProgress": 1,
  "done": 2
}
```

### Akademik & Predictions
```json
POST /akademik
{
  "strata": "S1",
  "tahunAkademik": "2025/2026",
  "semesterType": "Ganjil",
  "ipkTotal": 3.50,
  "...other fields"
}

POST /prediksi
Response: {
  "hasilPrediksi": "Aman",        // Aman/Waspada/Perlu Perhatian
  "skorConfidence": 0.87
}
```

---

## 🎛️ Configuration

### Change Base URL
Edit dalam Postman:
1. Select Environment (top-right)
2. Edit `baseUrl` variable
3. Save

**Default:** `http://localhost:5000/api`  
**Custom:** `http://your-host:port/api`

### Change Backend Port
Edit `backend/.env`:
```
PORT=3001
```

### Database Connection
Edit `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/areass
JWT_SECRET=your_secret_here
ML_API_URL=http://localhost:8000
```

---

## ✅ Common Workflows

### Scenario 1: New Student Registration
```
1. Register Mahasiswa
   Input: nama, email (format: NIM@student.example.com), password
   
2. Login
   Get JWT token → auto-saved to {{token}}
   
3. Create Tasks
   Add multiple tasks dengan deadline berbeda
   
4. Input Akademik Data
   Input: GPA, SKS, semester info
   
5. Run Prediction
   System calls ML service → get hasil prediksi
   
6. View Notifications
   Auto-generated based on prediction status
```

### Scenario 2: Dosen Monitoring
```
1. Login as Dosen Wali
   Get token
   
2. Get Students in Prodi
   GET /dosen/mahasiswa (auto-filter by dosen's prodi)
   Optional: filter by strata (S1/S2/S3)
   
3. View Student Akademik History
   GET /dosen/mahasiswa/{mahasiswaId}/akademik
   
4. Monitor Predictions
   Check each student's latest prediction status
```

### Scenario 3: Kaprodi Analytics
```
1. Login as Kaprodi
   
2. Get All Students
   GET /kaprodi/mahasiswa
   
3. View Statistics
   GET /kaprodi/statistik
   Response: distribution of statuses (Aman/Waspada/Perlu Perhatian)
   
4. Trend Analysis
   GET /kaprodi/tren-semester
   View performance trend per semester per strata
   
5. Export Data
   Copy data to Excel/CSV for reporting
```

---

## 🆘 Troubleshooting

### "Cannot connect to localhost:5000"
- [ ] Backend running? `npm run dev` in backend/
- [ ] Check port: `lsof -i :5000` (Mac/Linux)
- [ ] Check firewall settings

### "401 Unauthorized"
- [ ] Login first
- [ ] Check token in {{token}} variable
- [ ] Token expired? Login again (7-day expiry)

### "MongoDB connection error"
- [ ] MongoDB running? `mongod`
- [ ] Correct URI in .env?
- [ ] Network access allowed?

### "Token not auto-saving"
- [ ] Check Tests tab in Login endpoint
- [ ] Scripts must be enabled
- [ ] Check response format

### "Prediction returns error"
- [ ] ML service running? `python server.py` in ML/
- [ ] Check ML_API_URL in backend/.env
- [ ] Valid akademik data submitted?

---

## 📊 Database Seed

Run this to populate sample data:

```
POST /seed
```

Creates:
- 3 sample mahasiswa
- 5 sample tasks
- 3 akademik records
- 5 task categories

**⚠️ Run only once or clear DB first**

---

## 🔄 API Response Format

### Success Response (200)
```json
{
  "message": "Operation successful",
  "data": { /* actual data */ }
}
```

### Error Response (4xx/5xx)
```json
{
  "message": "Error description",
  "error": "Detailed error info"
}
```

---

## 📱 Rate Limiting
Currently: No rate limiting (development mode)

---

## 🔒 Security Notes

- JWT token valid 7 days
- Passwords hashed with bcrypt
- Role-based access control implemented
- CORS enabled for localhost development

---

## 📚 Additional Resources

- **API Documentation:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Error Handling Guide:** [ERROR_HANDLING_QUICK_SUMMARY.md](ERROR_HANDLING_QUICK_SUMMARY.md)
- **Code of Conduct:** [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Full Guide:** [POSTMAN_GUIDE.md](POSTMAN_GUIDE.md)

---

## ✨ Next Steps

1. ✅ Import collection & environment
2. ✅ Register test users
3. ✅ Test all endpoints
4. ✅ Develop frontend integration
5. ✅ Deploy to production

---

**Created:** April 29, 2026  
**Version:** 1.0  
**Status:** Ready for Testing ✅

For issues or questions, refer to ERROR_HANDLING_QUICK_SUMMARY.md or API_DOCUMENTATION.md
