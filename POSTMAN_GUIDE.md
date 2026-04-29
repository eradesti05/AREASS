# 📮 AREASS Postman Collection Guide

## ✅ Quick Start

### 1. Import Collection ke Postman

**Cara Import:**
- Buka Postman
- Klik **Import** di sebelah kiri atas
- Pilih file `AREASS_Postman_Collection.json`
- Collection akan tersedia di sidebar Anda

### 2. Setup Environment Variables

Collection sudah include variable-variable penting:
- `baseUrl`: URL API (default: `http://localhost:5000/api`)
- `token`: JWT token (auto-fill saat login)
- `userId`, `userRole`, `userName`: User info
- `taskId`, `akademikId`, `mahasiswaId`: ID resources

---

## 🚀 Workflow Testing

### Step 1: Register User
Pilih salah satu:
- **Register Mahasiswa** - untuk student testing
- **Register Dosen Wali** - untuk advisor testing  
- **Register Kaprodi** - untuk department head testing

```json
{
  "nama": "Budi Santoso",
  "email": "12345@student.example.com",
  "password": "Password123!",
  "userType": "mahasiswa",
  "prodi": "Teknik Informatika"
}
```

**💡 NIM auto-extract:** Gunakan format email `<NIM>@student.example.com`

### Step 2: Login
Gunakan endpoint **Login** dengan credentials yang sama.
- Token otomatis disimpan ke environment variable `{{token}}`
- Setiap request berikutnya akan include token di header Authorization

### Step 3: Testing by Role

#### 🎓 **Mahasiswa (Student)**
1. Create Task
2. Get Task Summary
3. Create Akademik Record
4. Run Prediction
5. View Notifications

#### 👨‍🏫 **Dosen Wali (Advisor)**
1. Get All Mahasiswa in Prodi
2. Get Akademik History Mahasiswa
3. View predictions for students

#### 👨‍💼 **Kaprodi (Department Head)**
1. Get All Mahasiswa in Department
2. View Statistics Distribution
3. Analyze Trend by Semester
4. View All Akademik Data

---

## 🔑 Authentication Flow

1. **Register/Login** → Dapatkan JWT token
2. Token auto-saved ke `{{token}}` variable
3. Setiap request ke protected endpoint include:
   ```
   Authorization: Bearer {{token}}
   ```
4. Token berlaku **7 hari**

---

## 📊 Test Scenarios

### Scenario 1: Complete Mahasiswa Journey
```
1. Register Mahasiswa → Dapatkan token
2. Get Current User Profile
3. Create 3 Tasks
4. Get Task Summary
5. Update Task Status → "On Progress"
6. Create Akademik Record
7. Run Prediction
8. Get Latest Prediction
9. View Notifications
```

### Scenario 2: Dosen Wali Monitoring
```
1. Login as Dosen Wali
2. Get All Mahasiswa (filter by strata)
3. Select satu mahasiswa
4. Get Akademik History Mahasiswa
5. View trend analysis
```

### Scenario 3: Kaprodi Dashboard
```
1. Login as Kaprodi
2. Get All Mahasiswa (filter strata)
3. Get Statistics Distribution
4. Get Trend Analysis by Semester
5. Get All Akademik Data
```

---

## 🎯 Key Features Testing

### Task Priority Calculation
Task priority otomatis dihitung berdasarkan:
- **Deadline**: Semakin dekat semakin tinggi
- **Tingkat Kesulitan**: Tinggi > Sedang > Rendah
- **Status**: Done (-score), On Progress (normal), Backlog (+score)

**Test:** Create multiple tasks dengan deadline berbeda dan lihat sorting

### Akademik & Prediction
- Input data akademik (GPA, SKS, dll)
- Run prediction → ML service akan process
- Prediction results: "Aman", "Waspada", "Perlu Perhatian"

### Notifications
- Auto-generated berdasarkan akademik status
- Type: `urgent`, `warning`, `summary`
- Test: Mark notification as read

---

## 🔄 Variable Reference

### Auto-set Variables (setelah login)
| Variable | Set by | Usage |
|----------|--------|-------|
| `{{token}}` | Login response | Authorization header |
| `{{userId}}` | Login response | User identification |
| `{{userRole}}` | Login response | Role checking |
| `{{userName}}` | Login response | Display purposes |

### Manual Variables (set saat testing)
```
{{taskId}}        → Dari Create/Get Tasks response
{{akademikId}}    → Dari Create Akademik response
{{mahasiswaId}}   → Dari Dosen/Kaprodi list
{{notificationId}} → Dari Get Notifications response
```

---

## 📝 Example Request: Create Task

```http
POST {{baseUrl}}/tasks
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "namaTugas": "Buat proposal skripsi",
  "kategoriTask": "Academic",
  "deadline": "2026-05-10",
  "tingkatKesulitan": "Tinggi",
  "estimasiPengerjaan": "15 jam",
  "status": "Backlog"
}
```

**Response:**
```json
{
  "message": "Task berhasil dibuat",
  "task": {
    "_id": "507f1f77bcf86cd799439011",
    "namaTugas": "Buat proposal skripsi",
    "priorityScore": 85,
    "priorityLabel": "URGENT",
    "status": "Backlog",
    "createdAt": "2026-04-29T10:30:00.000Z"
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "401 Unauthorized"
**Penyebab:** Token tidak ada atau expired
**Solusi:** 
- Login ulang
- Paste token baru ke variable `{{token}}`
- Pastikan Authorization header ada

### Issue 2: "400 Bad Request"
**Penyebab:** Format request salah
**Solusi:**
- Check JSON format di body
- Pastikan required fields ada
- Lihat dokumentasi endpoint

### Issue 3: "403 Forbidden"
**Penyebab:** User role tidak memiliki akses
**Solusi:**
- Verify user role dengan endpoint `/auth/me`
- Gunakan user dengan role yang sesuai
- Contoh: Task endpoint hanya untuk mahasiswa

### Issue 4: "Cannot GET /api/..."
**Penyebab:** Backend tidak jalan
**Solusi:**
- Start backend: `npm run dev` di folder backend/
- Check baseUrl benar: `http://localhost:5000/api`
- Pastikan MongoDB running

---

## 🔗 API Endpoints Overview

### Authentication (Public)
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user (authenticated)
- `PUT /auth/profile` - Update profile

### Tasks (Mahasiswa only)
- `GET /tasks` - Get all tasks
- `GET /tasks/summary` - Task summary
- `POST /tasks` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Akademik
- `GET /akademik` - Get akademik records
- `POST /akademik` - Create akademik
- `PUT /akademik/:id` - Update akademik

### Predictions (ML Integration)
- `POST /prediksi` - Run prediction
- `GET /prediksi/latest` - Get latest prediction
- `GET /prediksi/:id` - Get prediction by ID

### Dosen Wali
- `GET /dosen/mahasiswa` - Get students
- `GET /dosen/mahasiswa/:id/akademik` - Get student history

### Kaprodi
- `GET /kaprodi/mahasiswa` - Get all students
- `GET /kaprodi/statistik` - Statistics
- `GET /kaprodi/tren-semester` - Trend analysis
- `GET /kaprodi/akademik` - All akademik data

### Notifications
- `GET /notifications` - Get notifications
- `PUT /notifications/:id/read` - Mark as read
- `POST /notifications/trigger-test` - Test notification

### Other
- `GET /categories` - Get categories
- `POST /categories` - Create category
- `POST /seed` - Seed database

---

## ⚙️ Configuration

### Change Base URL
Jika API running di host/port berbeda:
1. Buka Collection variables
2. Edit `baseUrl` value
3. Contoh: `http://192.168.1.100:5000/api`

### Change JWT Secret (Backend)
Edit di `backend/.env` atau `backend/server.js`:
```
JWT_SECRET=your_custom_secret_here
```

### Change MongoDB URI (Backend)
Edit di `backend/.env`:
```
MONGODB_URI=mongodb://your-host:27017/areass
```

---

## 📌 Tips & Best Practices

1. **Test Authorization First**
   - Selalu login sebelum test protected endpoints
   - Verify token tersimpan di variables

2. **Use Collections for Organization**
   - Setiap role punya folder sendiri
   - Easy to find and manage endpoints

3. **Test with Real Data**
   - Use realistic values di test data
   - Test edge cases (deadline dalam 1 hari, dll)

4. **Monitor Network Tab**
   - Check request/response headers
   - Verify Content-Type: application/json

5. **Automation Testing**
   - Use Postman Scripts untuk automation
   - Pre-request scripts untuk setup
   - Test scripts untuk validation

---

## 🆘 Support

Jika ada error:
1. Check backend logs
2. Verify database connection
3. Check environment variables
4. Review API_DOCUMENTATION.md

---

**Last Updated:** April 29, 2026  
**Collection Version:** 1.0.0  
**API Base URL:** `http://localhost:5000/api`
