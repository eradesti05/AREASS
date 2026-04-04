"""
Inference Preprocessing — AREASS
Kelompok 2 — IF5200 Perancangan Penelitian Terapan

Fungsi preprocess_for_inference() mengubah riwayat semester mahasiswa
(dikirim dari client sebagai JSON) menjadi feature vector yang siap
digunakan oleh model ML.

Komponen yang digunakan dari preprocessing.py:
    - STRATA_ENCODING       : mapping strata ke ordinal
    - FEATURE_COLUMNS       : urutan fitur yang diharapkan model
    - FEATURES_TO_SCALE     : kolom yang di-scale
    - _compute_temporal_features_single() : fungsi baru, lihat di bawah

Tidak digunakan saat inferensi:
    - load_and_validate()   : mengharapkan label_kelulusan
    - split_data()          : tidak relevan
    - scale_features()      : scaler di-load dari artefak, tidak di-fit ulang
    - encode() label        : label belum ada saat inferensi

Asumsi desain:
    - Client mengirim seluruh riwayat semester mahasiswa (semester 1
      hingga semester saat ini) dalam satu request.
    - Prediksi dilakukan pada snapshot semester terakhir setelah
      fitur temporal dihitung dari seluruh riwayat.
    - scaler.pkl harus di-load sekali saat startup FastAPI dan
      diteruskan ke fungsi ini (bukan di-load per request).
"""

import numpy as np
import pandas as pd
import pickle
from sklearn.preprocessing import StandardScaler

# Import konstanta dari preprocessing.py
# Pastikan preprocessing.py berada di direktori yang sama atau di PYTHONPATH.
from preprocessing import (
    STRATA_ENCODING,
    FEATURE_COLUMNS,
    FEATURES_TO_SCALE,
    LABEL_ENCODING,
)

# Mapping target_sks dan max_semester per strata.
# Diduplikasi di sini agar inference.py dapat berdiri sendiri
# jika suatu saat dipisah dari preprocessing.py.
_TARGET_SKS_MAP   = {"S1": 144, "S2": 36, "S3": 42}
_MAX_SEMESTER_MAP = {"S1": 14,  "S2": 8,  "S3": 10}

# Inverse mapping untuk decode prediksi ke label string
LABEL_DECODING = {v: k for k, v in LABEL_ENCODING.items()}


# ----------------------------------------------------------------
# Fungsi utama inferensi
# ----------------------------------------------------------------

def preprocess_for_inference(
    history: list[dict],
    scaler: StandardScaler,
) -> pd.DataFrame:
    """
    Ubah riwayat semester mahasiswa menjadi feature vector untuk inferensi.

    Fungsi ini melakukan seluruh tahap preprocessing yang relevan
    (feature engineering, encoding, scaling) tanpa membutuhkan label,
    split, atau fitting scaler baru.

    Parameters
    ----------
    history : list[dict]
        Riwayat semester mahasiswa, terurut dari semester 1 hingga
        semester saat ini. Setiap dict merepresentasikan satu semester.

        Kolom yang diharapkan per dict:
            strata          : str  — "S1" | "S2" | "S3"
            semester        : int  — nomor semester (1-based)
            ip_semester     : float
            ipk_total       : float — IPK kumulatif SKS-weighted # optional, bisa dihitung di sini jika tidak disediakan
            sks_semester    : int
            total_sks       : int
            sks_lulus       : int
            sks_tidak_lulus : int

        Kolom opsional (diabaikan jika ada):
            student_id, label_kelulusan

        Contoh input (3 semester):
            [
                {"strata": "S1", "semester": 1, "ip_semester": 2.5,
                 "ipk_total": 2.5, "sks_semester": 20, "total_sks": 20,
                 "sks_lulus": 18, "sks_tidak_lulus": 2},
                {"strata": "S1", "semester": 2, "ip_semester": 2.8,
                 "ipk_total": 2.64, "sks_semester": 22, "total_sks": 42,
                 "sks_lulus": 38, "sks_tidak_lulus": 4},
                {"strata": "S1", "semester": 3, "ip_semester": 3.1,
                 "ipk_total": 2.79, "sks_semester": 21, "total_sks": 63,
                 "sks_lulus": 58, "sks_tidak_lulus": 5},
            ]

    scaler : StandardScaler
        Scaler yang sudah di-fit pada data training. Di-load sekali
        saat startup FastAPI via load_scaler().

    Returns
    -------
    pd.DataFrame
        Satu baris feature vector (shape: 1 x 11) siap dimasukkan
        ke model.predict() atau model.predict_proba().

    Raises
    ------
    ValueError
        Jika history kosong, strata tidak dikenal, atau kolom wajib
        tidak lengkap.
    """

    if not history:
        raise ValueError("history tidak boleh kosong")

    # Validasi dan konversi ke DataFrame
    df = _validate_and_parse(history)

    # Urutkan berdasarkan semester — antisipasi jika client kirim tidak berurutan
    df = df.sort_values("semester").reset_index(drop=True)

    strata = df["strata"].iloc[0]

    df["sks_tidak_lulus"] = df["sks_semester"] - df["sks_lulus"]  # inferensi sks_tidak_lulus sebelum cumsum
    # ubah total_sks, sks_lulus, sks_tidak_lulus jadi kumulatif per semester untuk menghitung fitur temporal dengan benar
    df[["total_sks", "sks_lulus", "sks_tidak_lulus"]] = df[["total_sks", "sks_lulus", "sks_tidak_lulus"]].cumsum()

    df = _compute_ipk(df)  # hitung ipk_total dari ip_semester dan sks_semester
    # Feature engineering — sama persis dengan pipeline training,
    # tapi hanya untuk satu mahasiswa
    df = _engineer_features_single(df, strata)

    # Ambil snapshot semester terakhir (baris terakhir setelah sort)
    snapshot = df.iloc[[-1]].copy()

    # Encode strata
    snapshot["strata"] = STRATA_ENCODING[strata]

    # Pilih kolom fitur sesuai urutan yang diharapkan model
    X = snapshot[FEATURE_COLUMNS].reset_index(drop=True)

    # Scaling — gunakan scaler dari training, jangan fit ulang
    X[FEATURES_TO_SCALE] = scaler.transform(X[FEATURES_TO_SCALE])

    return X


# ----------------------------------------------------------------
# Helper: validasi dan parse input
# ----------------------------------------------------------------

def _validate_and_parse(history: list[dict]) -> pd.DataFrame:
    """
    Validasi kolom wajib dan nilai dasar, konversi ke DataFrame.

    Raises
    ------
    ValueError
        Jika kolom wajib tidak ada atau nilai di luar range yang wajar.
    """

    required_fields = [
        "strata", "semester", "ip_semester",
        "sks_semester", "total_sks", "sks_lulus",
    ]

    for i, entry in enumerate(history):
        missing = [f for f in required_fields if f not in entry]
        if missing:
            raise ValueError(f"Semester ke-{i+1}: field tidak lengkap: {missing}")

    df = pd.DataFrame(history)

    # Validasi strata
    unknown_strata = set(df["strata"].unique()) - set(_TARGET_SKS_MAP.keys())
    if unknown_strata:
        raise ValueError(f"Strata tidak dikenal: {unknown_strata}")

    # Validasi semua semester berasal dari strata yang sama
    if df["strata"].nunique() > 1:
        raise ValueError("Semua entri history harus memiliki strata yang sama")

    # Validasi range IP
    if (df["ip_semester"] < 0).any() or (df["ip_semester"] > 4).any():
        raise ValueError("ip_semester harus dalam rentang [0, 4]")
    # if (df["ipk_total"] < 0).any() or (df["ipk_total"] > 4).any():
    #     raise ValueError("ipk_total harus dalam rentang [0, 4]")

    # Validasi SKS tidak negatif
    for col in ["sks_semester", "sks_lulus"]:
        if (df[col] < 0).any():
            raise ValueError(f"Nilai negatif tidak valid pada field '{col}'")

    return df


# ---------------------------------------------------------------
# Helper: menghitung IPK kumulatif per semester dari IP semester dan SKS semester
# ---------------------------------------------------------------

def _compute_ipk(df: pd.DataFrame) -> pd.DataFrame:
    """
    Hitung ipk_total per semester dari ip_semester dan sks_semester.
    Menggantikan kebutuhan input ipk_total dari user.
    """
    df = df.copy()
    ip_vals  = df["ip_semester"].values
    sks_vals = df["sks_semester"].values

    ipk_list = []
    for i in range(len(ip_vals)):
        ipk = (
            sum(ip_vals[j] * sks_vals[j] for j in range(i + 1))
            / sum(sks_vals[j] for j in range(i + 1))
        )
        ipk_list.append(round(float(ipk), 3))

    df["ipk_total"] = ipk_list
    return df

# ----------------------------------------------------------------
# Helper: feature engineering untuk satu mahasiswa
# ----------------------------------------------------------------

def _engineer_features_single(df: pd.DataFrame, strata: str) -> pd.DataFrame:
    """
    Hitung fitur agregat temporal untuk satu mahasiswa.

    Logika identik dengan engineer_features() di preprocessing.py,
    tapi dioptimalkan untuk input single-student tanpa groupby.

    Fitur yang dihitung:
        rasio_sks_lulus, rata_sks_gagal_per_sem, rasio_progress,
        ip_trend, ip_std

    Untuk semester 1, ip_trend dan ip_std diisi 0.0 (lihat
    dokumentasi engineer_features() di preprocessing.py).
    """

    df = df.copy()
    target_sks   = _TARGET_SKS_MAP[strata]
    max_semester = _MAX_SEMESTER_MAP[strata]

    df["rasio_sks_lulus"] = (df["sks_lulus"] / target_sks).clip(0.0, 1.0)
    df["rata_sks_gagal_per_sem"] = df["sks_tidak_lulus"] / df["semester"]
    df["rasio_progress"] = df["semester"] / max_semester

    ip_vals = df["ip_semester"].values
    n = len(ip_vals)
    trends = []
    stds   = []

    for i in range(n):
        window = ip_vals[:i + 1]
        if i == 0:
            trends.append(0.0)
            stds.append(0.0)
        else:
            t = np.arange(1, i + 2, dtype=float)
            slope = np.polyfit(t, window, 1)[0]
            trends.append(float(slope))
            stds.append(float(np.std(window, ddof=0)))

    df["ip_trend"] = trends
    df["ip_std"]   = stds

    return df


# ----------------------------------------------------------------
# Helper: load scaler dari artefak
# ----------------------------------------------------------------

def load_scaler(scaler_path: str) -> StandardScaler:
    """
    Load scaler yang sudah di-fit dari file pickle.

    Dipanggil sekali saat startup FastAPI (lihat contoh di bawah),
    bukan per request.

    Parameters
    ----------
    scaler_path : str
        Path ke scaler.pkl hasil pipeline training.

    Returns
    -------
    StandardScaler
    """

    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)
    return scaler

