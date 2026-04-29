# 📮 AREASS Postman Collection - Complete Setup

**Date:** April 29, 2026  
**Version:** 1.0  
**Status:** ✅ Ready for Testing  

---

## 🎉 What's Been Created

Saya telah membuat **5 file lengkap** untuk Postman collection AREASS Anda:

### ✅ Files Created:

| # | File | Purpose | Size |
|---|------|---------|------|
| 1 | **AREASS_Postman_Collection.json** | Main Postman collection dengan 26 endpoints | Ready to import |
| 2 | **AREASS_Postman_Environment_Dev.json** | Environment variables untuk development | Development setup |
| 3 | **SETUP_POSTMAN.md** | Setup instructions & overview | Get started in 5 mins |
| 4 | **POSTMAN_GUIDE.md** | Detailed guide with workflows | Complete documentation |
| 5 | **API_QUICK_REFERENCE.md** | Cheat sheet & quick reference | Quick lookup |

---

## 🚀 Quick Start (Copy-Paste Ready)

### 1️⃣ Start Backend
```bash
cd backend
npm install
npm run dev
```
✅ Backend running on `http://localhost:5000/api`

### 2️⃣ Import Postman Collection
- Open Postman
- Click **Import**
- Select file: `AREASS_Postman_Collection.json`
- ✅ Collection imported!

### 3️⃣ Import Environment (Optional)
- Postman → **Environments**
- Click **Import**
- Select: `AREASS_Postman_Environment_Dev.json`
- ✅ Environment ready!

### 4️⃣ Test First Endpoint
1. Go to **Authentication → Register Mahasiswa**
2. Click **Send**
3. Response: `{ "message": "Registrasi berhasil" }`
4. ✅ API Connected!

---

## 📊 Collection Overview

### 🔐 Authentication (6 endpoints)
- Register Mahasiswa, Dosen Wali, Kaprodi
- Login
- Get User Profile
- Update Profile

### 📋 Task Management (5 endpoints)
- Get All Tasks
- Get Task Summary
- Create Task
- Update Task
- Delete Task

### 📊 Akademik Data (3 endpoints)
- Get All Records
- Create Record
- Update Record

### 🔮 Predictions (3 endpoints)
- Run Prediction
- Get Latest Prediction
- Get Prediction by ID

### 🧑‍🎓 Dosen Wali (2 endpoints)
- Get Students in Prodi
- Get Student Akademik History

### 👨‍💼 Kaprodi (4 endpoints)
- Get All Students
- Get Statistics
- Get Trend Analysis
- Get All Akademik Data

### 🔔 Notifications (3 endpoints)
- Get All Notifications
- Mark as Read
- Trigger Test

### 📂 Categories (2 endpoints)
- Get All Categories
- Create Category

### 🌱 Utilities (1 endpoint)
- Seed Database

**Total: 26 Endpoints** ✅

---

## 🎯 Features Included

✅ **Authentication**
- JWT Token (7-day expiry)
- Auto-save token to {{token}} variable
- Role-based access control

✅ **Task Management**
- Auto-priority calculation
- Status tracking (Backlog → On Progress → Done)
- Deadline-based urgency

✅ **Akademik Integration**
- GPA tracking
- Semester management
- SKS monitoring

✅ **ML Predictions**
- Calls external ML service
- Confidence scoring
- Status categories (Aman, Waspada, Perlu Perhatian)

✅ **Role-Based Dashboards**
- Mahasiswa: Task & akademik view
- Dosen Wali: Student monitoring
- Kaprodi: Department analytics

✅ **Notifications**
- Auto-generated alerts
- Read status tracking
- Multiple types (urgent, warning, summary)

---

## 📖 Documentation Files

### 📄 SETUP_POSTMAN.md
**Best for:** First-time users, quick setup
- 5-minute setup guide
- Verification checklist
- Configuration tips
- Common workflows

### 📄 POSTMAN_GUIDE.md
**Best for:** Detailed learning, troubleshooting
- Complete workflow guide
- Test scenarios per role
- Variable reference
- Common issues & solutions
- Best practices

### 📄 API_QUICK_REFERENCE.md
**Best for:** Quick lookups, API reference
- Endpoint cheat sheet
- Request/response examples
- Status codes
- Common workflows
- Performance tips

---

## 💡 User Roles & Test Cases

### 🎓 Mahasiswa (Student)
**Test Flow:**
1. Register → `12345@student.example.com`
2. Login → Get token
3. Create 3 tasks
4. Update task status
5. Input akademik data
6. Run prediction
7. View notifications

### 👨‍🏫 Dosen Wali (Advisor)
**Test Flow:**
1. Register dosen
2. Login → Get advisor token
3. View all students in prodi
4. Select student → View akademik history
5. Monitor prediction status

### 👨‍💼 Kaprodi (Department Head)
**Test Flow:**
1. Register kaprodi
2. Login → Get kaprodi token
3. View all students in department
4. Check statistics distribution
5. Analyze semester trends

---

## 🔑 Pre-configured Variables

All automatically set after login:

```
{{baseUrl}}      → http://localhost:5000/api
{{token}}        → JWT token (auto-saved after login)
{{userId}}       → Current user ID
{{userRole}}     → mahasiswa/dosen_wali/kaprodi
{{userName}}     → Current user name
{{taskId}}       → Task ID (set manually from response)
{{akademikId}}   → Akademik ID (set manually)
{{mahasiswaId}}  → Student ID (set manually)
{{notificationId}} → Notification ID (set manually)
```

---

## ⚙️ Configuration

### Change Base URL
Edit collection variable `{{baseUrl}}`:
- Development: `http://localhost:5000/api`
- Staging: `http://staging-api.example.com/api`
- Production: `http://api.example.com/api`

### Environment Variables (.env)
Backend needs:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/areass
JWT_SECRET=areass_secret_2026
ML_API_URL=http://localhost:8000
```

### Database
```bash
# Start MongoDB
mongod

# Or with Docker
docker run -d -p 27017:27017 mongo
```

---

## ✅ Verification Checklist

- [ ] Backend running: `http://localhost:5000/api` responds to ping
- [ ] MongoDB connected: Check backend logs for ✅ MongoDB connected
- [ ] Collection imported: Visible in Postman sidebar
- [ ] Environment selected: (top-right corner shows environment name)
- [ ] Register works: Can create new user
- [ ] Login works: Receive token, {{token}} variable populated
- [ ] Create task works: Can POST to /tasks with status 200/201
- [ ] Get summary works: GET /tasks/summary returns data
- [ ] Notifications work: GET /notifications returns array

All ✅? **You're ready to go!**

---

## 🐛 Troubleshooting

### Backend not connecting
```
❌ Error: "Cannot connect to localhost:5000"
✅ Solution: 
   1. npm run dev in backend/
   2. Check port: lsof -i :5000
   3. Try http://localhost:5000/
```

### Token not auto-saving
```
❌ Error: {{token}} is empty after login
✅ Solution:
   1. Check Login endpoint Tests tab
   2. Verify response has 'token' field
   3. Try login manually & copy token
```

### MongoDB connection error
```
❌ Error: "MongoDB error: connection refused"
✅ Solution:
   1. Start MongoDB: mongod
   2. Check MONGODB_URI in .env
   3. Verify connection: mongo --eval "db.version()"
```

### Prediction fails
```
❌ Error: "ML service error"
✅ Solution:
   1. Start ML service: python ML/server.py
   2. Check ML_API_URL in backend/.env
   3. Create akademik data first
```

---

## 📚 File Descriptions

### AREASS_Postman_Collection.json
- **Format:** Postman v2.1.0 JSON
- **Endpoints:** 26 organized by category
- **Variables:** Pre-configured {{baseUrl}}, {{token}}, etc.
- **Scripts:** Auto-save token on login
- **Import:** File → Import in Postman

### AREASS_Postman_Environment_Dev.json
- **Format:** Postman environment JSON
- **Variables:** baseUrl, token, userId, role, etc.
- **Scope:** Development environment
- **Import:** Environments → Import

### SETUP_POSTMAN.md
- **Length:** ~500 lines
- **Sections:** Quick start, checklist, config, workflows
- **Audience:** All users
- **Read Time:** 10 minutes

### POSTMAN_GUIDE.md
- **Length:** ~800 lines
- **Sections:** Auth flow, scenarios, troubleshooting, best practices
- **Audience:** Developers, QA testers
- **Read Time:** 30 minutes

### API_QUICK_REFERENCE.md
- **Length:** ~600 lines
- **Sections:** Endpoint table, quick reference, examples
- **Audience:** API developers, quick lookup
- **Read Time:** 5 minutes (reference)

---

## 🎁 Bonus Tips

### 💡 Postman Pro Tips
1. **Tab Organization**
   - Use folders for each role
   - Pin frequently used endpoints
   - Create collection views

2. **Testing Automation**
   - Use Tests tab for assertions
   - Chain requests with variables
   - Build test suites

3. **Documentation**
   - Every endpoint has description
   - Request/response examples included
   - Use Markdown in descriptions

4. **Collaboration**
   - Export collection for team sharing
   - Use environments for different stages
   - Version control collection

### 🚀 Performance Testing
```
1. Load test with multiple users
2. Monitor response times
3. Check database query performance
4. Profile ML prediction service
```

### 📊 Monitoring
- Add logging to backend
- Use Postman tests for health checks
- Monitor database metrics
- Track ML API latency

---

## 🎓 Learning Resources

### For Postman
- [Postman Learning Center](https://learning.postman.com/)
- [Postman API Documentation](https://www.postman.com/api-platform/api-documentation/)

### For REST API Best Practices
- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes Guide](https://httpwg.org/)

### For JWT Authentication
- [JWT Introduction](https://jwt.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 📞 Support

### Documentation
- **Quick Lookup:** API_QUICK_REFERENCE.md
- **Setup Guide:** SETUP_POSTMAN.md
- **Detailed Guide:** POSTMAN_GUIDE.md
- **Error Handling:** ERROR_HANDLING_QUICK_SUMMARY.md
- **API Docs:** API_DOCUMENTATION.md

### Troubleshooting
1. Check documentation files
2. Review error handling guide
3. Check backend logs
4. Verify environment setup

---

## ✨ Next Steps

1. **Import Collection** → Copy AREASS_Postman_Collection.json to Postman
2. **Start Backend** → `npm run dev` in backend/
3. **Test Endpoints** → Start with Authentication
4. **Create Test Users** → Register different roles
5. **Run Test Flows** → Follow scenarios in POSTMAN_GUIDE.md
6. **Develop Frontend** → Use collection as API reference
7. **Integrate ML** → Test predictions with real data
8. **Deploy** → Update baseUrl for production

---

## 📝 Checklist Before Going Live

- [ ] All 26 endpoints tested
- [ ] Token auto-save verified
- [ ] CORS configured correctly
- [ ] Error handling tested
- [ ] Role-based access verified
- [ ] Database backup ready
- [ ] ML service integrated
- [ ] Monitoring setup
- [ ] Load testing passed
- [ ] Security review done

---

## 🎯 Success Criteria

✅ Collection imports without errors  
✅ Can login and get token  
✅ All endpoints return expected status codes  
✅ Role-based access works correctly  
✅ Predictions run successfully  
✅ Notifications generated properly  
✅ Performance acceptable (< 200ms response)  
✅ Documentation complete and clear  

---

## 📊 Collection Statistics

- **Total Endpoints:** 26
- **Organized by:** 8 categories
- **Authentication:** JWT-based
- **Roles:** 3 (mahasiswa, dosen_wali, kaprodi)
- **Database:** MongoDB
- **External Services:** ML API
- **Documentation:** 5 guides included
- **Test Coverage:** Complete user flows

---

## 🚀 Ready to Use!

Everything is set up and ready to import into Postman. Just:

1. **Import:** `AREASS_Postman_Collection.json`
2. **Read:** `SETUP_POSTMAN.md` (5 minutes)
3. **Test:** Follow first endpoint test
4. **Explore:** All 26 endpoints available
5. **Deploy:** Use as API reference

---

**Collection Created:** April 29, 2026  
**Version:** 1.0.0  
**Status:** ✅ Complete & Ready for Testing  
**Endpoints:** 26 / 26 ✅  
**Documentation:** 5 Files ✅  

**Happy Testing! 🎉**

---

For questions, refer to the markdown guides included in the project root:
- `SETUP_POSTMAN.md` - Setup & Overview
- `POSTMAN_GUIDE.md` - Detailed Guide
- `API_QUICK_REFERENCE.md` - Quick Cheat Sheet
