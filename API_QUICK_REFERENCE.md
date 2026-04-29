# 📖 AREASS API - Quick Reference Card

**Base URL:** `http://localhost:5000/api`  
**Auth:** JWT Token (Bearer {{token}})  
**Content-Type:** `application/json`

---

## 🔐 AUTHENTICATION

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | ❌ | Register user (mahasiswa/dosen_wali/kaprodi) |
| `/auth/login` | POST | ❌ | Login & get JWT token (7 days valid) |
| `/auth/me` | GET | ✅ | Get current user profile |
| `/auth/profile` | PUT | ✅ | Update profile (nama, email) |

### Register Request
```json
{
  "nama": "Name",
  "email": "NIM@student.example.com",
  "password": "Pass123!",
  "userType": "mahasiswa",
  "prodi": "Teknik Informatika"
}
```
✨ **NIM auto-extract** dari email (angka sebelum @)

### Login Request
```json
{
  "email": "12345@student.example.com",
  "password": "Pass123!",
  "userType": "mahasiswa"
}
```
Response auto-set `{{token}}`, `{{userId}}`, `{{userRole}}`

---

## 📋 TASKS (Mahasiswa Only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tasks` | GET | Get all tasks (sorted by priority) |
| `/tasks/summary` | GET | Task summary: total, tenggat, status breakdown |
| `/tasks` | POST | Create new task |
| `/tasks/:id` | PUT | Update task |
| `/tasks/:id` | DELETE | Delete own task |

### Create Task
```json
POST /tasks
{
  "namaTugas": "Task name",
  "kategoriTask": "Academic",
  "deadline": "2026-05-10",
  "tingkatKesulitan": "Tinggi",        // Rendah/Sedang/Tinggi
  "estimasiPengerjaan": "15 jam",
  "status": "Backlog"                  // Backlog/On Progress/Done
}
```
**Response includes:** priorityScore, priorityLabel (auto-calculated)

### Task Summary Response
```json
{
  "totalTugas": 5,
  "tenggatWaktuTugas": 2,              // deadline ≤ 7 hari
  "estimasiBebanKerja": "50 jam",
  "backlog": 2,
  "onProgress": 1,
  "done": 2
}
```

### Priority Calculation Formula
- **Deadline:** Close deadline = Higher priority
- **Difficulty:** Tinggi > Sedang > Rendah
- **Status:** Backlog +points, On Progress normal, Done -points
- **Result:** Label = CRITICAL, URGENT, HIGH, NORMAL, LOW

---

## 📊 AKADEMIK DATA

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/akademik` | GET | ✅ | Get all akademik records |
| `/akademik` | POST | ✅ | Create akademik record |
| `/akademik/:id` | PUT | ✅ | Update akademik record |

### Create/Update Akademik
```json
{
  "nim": "12345",
  "strata": "S1",                      // S1/S2/S3
  "tahunAkademik": "2025/2026",
  "semesterType": "Ganjil",            // Ganjil/Genap
  "semesterKe": 5,
  "ipSemester": 3.45,
  "ipkTotal": 3.50,
  "sksPerSemester": 20,
  "totalSks": 90,
  "jumlahSksLulus": 85,
  "jumlahMkDiulang": 0
}
```

---

## 🔮 PREDICTIONS (ML Service)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/prediksi` | POST | Run prediction (calls ML service) |
| `/prediksi/latest` | GET | Get latest prediction (strata param) |
| `/prediksi/:id` | GET | Get prediction by mahasiswa ID |

### Run Prediction
```
POST /prediksi
```
**Prerequisites:** Akademik data must exist
**Response:**
```json
{
  "hasilPrediksi": "Aman",             // Aman/Waspada/Perlu Perhatian
  "skorConfidence": 0.87
}
```

### Get Latest Prediction
```
GET /prediksi/latest?strata=S1
```
**Query params:** strata (S1/S2/S3, default: S1)

---

## 👨‍🏫 DOSEN WALI DASHBOARD

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dosen/mahasiswa` | GET | Get students in same prodi |
| `/dosen/mahasiswa/:id/akademik` | GET | Get akademik history for student |

### Get Students
```
GET /dosen/mahasiswa?strata=S1
```
**Query:** strata (optional)  
**Response:** Array of students with latest akademik data

### Get Student Akademik History
```
GET /dosen/mahasiswa/{{mahasiswaId}}/akademik
```
**Response:** Array of akademik records (sorted by semester)

---

## 👨‍💼 KAPRODI DASHBOARD

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/kaprodi/mahasiswa` | GET | Get all students in department |
| `/kaprodi/statistik` | GET | Statistics distribution |
| `/kaprodi/tren-semester` | GET | Trend analysis by semester |
| `/kaprodi/akademik` | GET | All akademik data |

### Get Students
```
GET /kaprodi/mahasiswa?strata=S1
```
**Response:** All students with prediction status

### Get Statistics
```
GET /kaprodi/statistik
```
**Response:**
```json
{
  "totalMahasiswa": 45,
  "distribusi": [
    { "_id": "Aman", "jumlah": 30 },
    { "_id": "Waspada", "jumlah": 10 },
    { "_id": "Perlu Perhatian", "jumlah": 5 }
  ]
}
```

### Get Trend
```
GET /kaprodi/tren-semester
```
**Response:** Array of {strata, jumlah, tahunAkademik, semesterType}

---

## 🔔 NOTIFICATIONS

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notifications` | GET | Get all notifications |
| `/notifications/:id/read` | PUT | Mark notification as read |
| `/notifications/trigger-test` | POST | Send test notification |

### Notification Response
```json
{
  "_id": "...",
  "userId": "...",
  "type": "urgent",                    // urgent/warning/summary
  "message": "Notification text",
  "read": false,
  "createdAt": "2026-04-29T10:00:00Z"
}
```

---

## 📂 CATEGORIES

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/categories` | GET | Get all categories |
| `/categories` | POST | Create new category |

### Create Category
```json
POST /categories
{
  "nama": "Research"
}
```

---

## 🌱 UTILITIES

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/seed` | POST | Populate DB with sample data |

**⚠️ Run only once or clear DB first**

---

## 🔑 COMMON VARIABLES

| Variable | Auto-Set By | Usage |
|----------|-------------|-------|
| `{{baseUrl}}` | - | Base URL: http://localhost:5000/api |
| `{{token}}` | Login | JWT token (7 days) |
| `{{userId}}` | Login | Current user ID |
| `{{userRole}}` | Login | mahasiswa/dosen_wali/kaprodi |
| `{{userName}}` | Login | Current user name |
| `{{taskId}}` | Manual | Task ID from response |
| `{{akademikId}}` | Manual | Akademik record ID |
| `{{mahasiswaId}}` | Manual | Student ID |
| `{{notificationId}}` | Manual | Notification ID |

---

## ⚠️ HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | ✅ OK - Success |
| 201 | ✅ Created - Resource created |
| 400 | ❌ Bad Request - Invalid input |
| 401 | ❌ Unauthorized - No token or expired |
| 403 | ❌ Forbidden - Insufficient permission |
| 404 | ❌ Not Found - Resource doesn't exist |
| 500 | ❌ Server Error - Internal error |

---

## 🎯 Common Workflows

### Register & Login
```
1. POST /auth/register
   Input: nama, email, password, userType, prodi
   
2. POST /auth/login
   Input: email, password, userType
   Output: token → saved to {{token}}
```

### Create & Manage Tasks (Mahasiswa)
```
1. POST /tasks
   Create new task
   
2. GET /tasks
   View all tasks (sorted by priority)
   
3. PUT /tasks/:id
   Update task status (Backlog → On Progress → Done)
   
4. GET /tasks/summary
   Check deadline urgency & workload
```

### Monitor Student (Dosen Wali)
```
1. GET /dosen/mahasiswa
   Get all students
   
2. GET /dosen/mahasiswa/:id/akademik
   View student's akademik history
```

### Department Analytics (Kaprodi)
```
1. GET /kaprodi/mahasiswa
   Get all students
   
2. GET /kaprodi/statistik
   Check prediction distribution
   
3. GET /kaprodi/tren-semester
   Analyze trends
```

---

## 🔒 Authorization

### Protected Endpoints (require JWT)
```
Authorization: Bearer {{token}}
```
- All endpoints EXCEPT /auth/register, /auth/login, /seed

### Role-Based Access
```
PUBLIC (no role check)
- POST /auth/register
- POST /auth/login

MAHASISWA ONLY
- GET/POST/PUT/DELETE /tasks
- GET/POST/PUT /akademik
- POST /prediksi

DOSEN_WALI
- GET /dosen/mahasiswa
- GET /dosen/mahasiswa/:id/akademik

KAPRODI
- GET /kaprodi/mahasiswa
- GET /kaprodi/statistik
- GET /kaprodi/tren-semester
- GET /kaprodi/akademik

ALL AUTHENTICATED
- GET /auth/me
- PUT /auth/profile
- GET/PUT /notifications
- GET /categories
```

---

## 💡 Tips

- **NIM Format:** Use `NIM@student.example.com` for auto-extraction
- **Priority Score:** Automatically calculated - no need to set manually
- **Token Expiry:** 7 days - login again if expired
- **ML Integration:** Prediction requires akademik data input first
- **Deadline Format:** Use ISO format: `YYYY-MM-DD`
- **Strata:** Always use S1/S2/S3 (not S1,S2,S3)

---

## ❌ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No token or expired | Login again |
| 403 Forbidden | Wrong role | Use correct user role |
| 400 Bad Request | Invalid input | Check JSON format |
| 404 Not Found | Resource doesn't exist | Check ID parameter |
| 500 Server Error | Backend issue | Check backend logs |

---

## 🚀 Performance Tips

- Pagination: Not implemented (use on frontend)
- Sorting: Automatic for tasks & akademik
- Filtering: Use query params (strata)
- Caching: Implement on frontend

---

**Last Updated:** April 29, 2026  
**Quick Reference Version:** 1.0  
**Status:** Ready ✅
