# Code of Conduct — AREASS (Kelompok 2)

> Dokumen ini mengatur standar kolaborasi pengembangan proyek AREASS, mencakup Git workflow, konvensi penamaan, dan tanggung jawab per peran.

---

## 1. Struktur Branch

```
main
 └── develop
      ├── feature/<scope>-<deskripsi>
      └── fix/<deskripsi>
```

| Branch | Fungsi | Siapa yang push |
|---|---|---|
| `main` | Production. Trigger GitHub Actions deployment | **DevOps only** (via PR dari `develop`) |
| `develop` | Integration branch. Semua fitur dikumpulkan di sini | Semua anggota (via PR) |
| `feature/*` | Pengembangan fitur baru | Anggota terkait |
| `fix/*` | Perbaikan bug | Anggota terkait |

**Aturan utama:**
- Tidak ada yang boleh push langsung ke `main` atau `develop`.
- Semua perubahan masuk via **Pull Request (PR)**.
- PR ke `develop` membutuhkan minimal **1 approval** dari anggota lain.
- PR ke `main` hanya dilakukan oleh **DevOps** setelah `develop` stabil.

---

## 2. Konvensi Penamaan Branch

Format: `<tipe>/<scope>-<deskripsi-singkat>`

| Tipe | Digunakan untuk |
|---|---|
| `feature` | Fitur baru |
| `fix` | Perbaikan bug |
| `refactor` | Refactoring tanpa perubahan fungsional |
| `docs` | Perubahan dokumentasi |
| `chore` | Config, dependency, CI/CD |

**Contoh:**
```
feature/ml-synthetic-data-generator
feature/frontend-dashboard-prediction
feature/backend-predict-endpoint
fix/ml-data-leakage-train-split
chore/ci-github-actions-deploy
docs/update-readme-setup
```

---

## 3. Konvensi Commit Message

Format: `<tipe>(<scope>): <deskripsi singkat>`

```
feat(ml): add AdaBoost ensemble model
fix(backend): resolve duplicate SKS cumsum on inference
refactor(frontend): simplify prediction form component
chore(ci): add Tailscale OAuth to deploy workflow
docs: update API endpoint documentation
```

Tipe yang valid: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`.

---

## 4. Workflow Per Anggota

### 4.1 Alur Umum (Semua Anggota)

```bash
# 1. Selalu mulai dari develop terbaru
git checkout develop
git pull origin develop

# 2. Buat branch baru
git checkout -b feature/<scope>-<deskripsi>

# 3. Kerjakan fitur, commit secara incremental
git add .
git commit -m "feat(<scope>): <deskripsi>"

# 4. Sync dengan develop sebelum PR (hindari conflict besar)
git fetch origin
git rebase origin/develop

# 5. Push dan buat Pull Request ke develop
git push origin feature/<scope>-<deskripsi>
```

Kemudian buat PR di GitHub: `feature/... → develop`.

---

### 4.2 DevOps

**Tanggung jawab tambahan:**
- Menjaga file `docker-compose.yml`, `docker-compose.prod.yml`, dan `.github/workflows/`.
- Semua perubahan infrastruktur (CI/CD, Docker, Nginx, environment variables) harus melalui branch `chore/` atau `feature/` — tidak langsung ke `develop`.
- Merge `develop → main` dilakukan **manual** setelah semua anggota konfirmasi fitur siap deploy.
- Sebelum merge ke `main`, pastikan semua anggota sudah konfirmasi fitur mereka berjalan di lokal dan tidak ada PR yang masih open ke `develop`.

**Deployment flow:**
```
develop (stabil) → PR ke main → merge → GitHub Actions trigger → deploy ke server
```

**File yang hanya DevOps yang boleh ubah tanpa PR approval tambahan:**
- `.github/workflows/*.yml`
- `docker-compose.prod.yml`
- `nginx.conf` (production)

---

### 4.3 ML Engineer (AI Sub-team)

**Tanggung jawab:**
- Semua eksperimen ML berada di bawah direktori `ml/` atau `services/ml/`.
- Branch penamaan menggunakan prefix `feature/ml-*`.

**Aturan commit `ML/artifacts/`:**
- Commit artifact (`.pkl`, `.joblib`) **hanya boleh dilakukan oleh DevOps/ML Lead** — bukan anggota lain.
- Artifact hanya di-commit saat model sudah **final/stabil**, bukan setiap eksperimen atau retrain intermediate.
- Alasannya: setiap commit artifact menambah ~27MB ke history Git secara permanen. Retrain berulang tanpa kontrol akan membengkakkan ukuran repo.

**Yang TIDAK boleh di-commit ke Git:**
```
# ML/.gitignore
__pycache__/
**/__pycache__/
*.pyc
.ipynb_checkpoints/
data/raw/       # jika nanti ada data real dari input pengguna
```

`ML/data/` (synthetic) dan `ML/artifacts/` boleh ada di repo, tapi pengelolaannya sepenuhnya di tangan ML Lead.

**Workflow eksperimen:**
1. Eksperimen awal boleh di Jupyter Notebook, tapi kode final harus dipindah ke `.py` script sebelum PR.
2. Setiap perubahan pipeline (fitur baru, model baru, perubahan preprocessing) harus disertai update pada `README` atau docstring yang menjelaskan perubahan tersebut.
3. Pastikan `train_test_split` selalu dilakukan di **level student** (bukan row) untuk mencegah data leakage.

---

### 4.4 Frontend Engineer

- Branch prefix: `feature/frontend-*`
- Jangan commit file build (`build/`, `dist/`, `.next/`).
- Environment variable (`REACT_APP_*`) tidak di-commit — gunakan `.env.example` sebagai template.

---

### 4.5 Backend Engineer

- Branch prefix: `feature/backend-*`
- File `.env` tidak di-commit — gunakan `.env.example`.
- Perubahan schema MongoDB atau endpoint API baru harus didokumentasikan di PR description.

---

## 5. Pull Request

**PR Description wajib mencantumkan:**
- Apa yang diubah dan mengapa.
- Cara testing manual (jika ada).
- Screenshot atau log jika relevan.

**Checklist sebelum request review:**
- [ ] Sudah `rebase` dari `develop` terbaru.
- [ ] Tidak ada conflict.
- [ ] Tidak ada file sensitif (`.env`, data real pengguna) yang ter-commit.
- [ ] Tidak ada perubahan ke `ML/artifacts/` atau `ML/data/` (kecuali ML Lead).
- [ ] Kode sudah berjalan di lokal (via Docker Compose dev).

---

## 6. Hal yang Dilarang

- ❌ Push langsung ke `main` atau `develop`.
- ❌ Force push ke branch yang sudah di-share (`develop`, `main`).
- ❌ Commit file `.env` atau data mentah (data real pengguna) ke repository.
- ❌ Commit ke `ML/artifacts/` atau `ML/data/` — hanya ML Lead yang boleh.
- ❌ Merge PR sendiri tanpa approval anggota lain (kecuali darurat dan sudah diskusi di grup).

---

## 7. Resolusi Conflict

Jika terjadi conflict saat rebase:

```bash
git fetch origin
git rebase origin/develop

# Jika ada conflict, resolve manual lalu:
git add <file-yang-diresolved>
git rebase --continue
```

Jika conflict terlalu kompleks, koordinasikan dengan anggota terkait sebelum melanjutkan.

---

*Dokumen ini berlaku untuk semua anggota Kelompok 2 — IF5200 Perancangan Penelitian Terapan, ITB.*
