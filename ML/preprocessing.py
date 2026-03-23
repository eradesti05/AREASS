"""
Preprocessing Pipeline — Data Akademik Sintetis
AREASS — Academic Risk Estimation and Adaptive Scheduling System
Kelompok 2 — IF5200 Perancangan Penelitian Terapan

Pipeline ini mengubah raw dataset multi-row per mahasiswa menjadi
feature matrix yang siap digunakan oleh model ML.

Alur preprocessing:
    1. Load & validasi data mentah
    2. Feature engineering (fitur agregat temporal per baris)
    3. Encoding variabel kategorikal dan label
    4. Drop kolom yang tidak digunakan sebagai fitur
    5. Train-test split di level mahasiswa (mencegah data leakage)
    6. Feature scaling (StandardScaler pada fitur numerik kontinu)
    7. Simpan artefak preprocessing

Catatan desain:
    - Split dilakukan di level mahasiswa, bukan baris, agar seluruh
      riwayat semester satu mahasiswa tidak tersebar di train dan test.
    - Scaling hanya diterapkan pada fitur numerik kontinu; fitur ordinal
      hasil encoding (strata) tidak di-scale.
    - ip_trend dihitung sebagai slope regresi linear ip_semester terhadap
      waktu (indeks semester), mengikuti pendekatan fitur temporal dalam
      EDM (Chung & Lee, 2024; Asare et al., 2025).
    - Untuk semester 1, ip_trend dan ip_std tidak dapat dihitung dari
      lebih dari satu titik data; nilai default 0.0 digunakan dan
      didokumentasikan sebagai limitasi.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pickle
import argparse
import os


# ----------------------------------------------------------------
# Konstanta
# ----------------------------------------------------------------

# Mapping strata ke nilai ordinal.
# Urutan hierarki akademik dipertahankan: S1 < S2 < S3.
STRATA_ENCODING = {"S1": 1, "S2": 2, "S3": 3}

# Mapping label ke nilai integer untuk klasifikasi.
# Urutan tidak mengandung makna ordinal — ini nominal multiclass.
LABEL_ENCODING = {
    "lulus_tepat_waktu": 0,
    "lulus_terlambat":   1,
    "dropout":           2,
}

# Fitur numerik kontinu yang akan di-scale.
# Fitur ordinal (strata) dan fitur yang sudah ternormalisasi secara
# alami (rasio, semester) tidak dimasukkan ke dalam scaling.
FEATURES_TO_SCALE = [
    "ip_semester",
    "ipk_total",
    "sks_semester",
    "sks_tidak_lulus",
    "rata_sks_gagal_per_sem",
    "ip_trend",
    "ip_std",
]

# Fitur akhir yang digunakan sebagai input model, berurutan.
FEATURE_COLUMNS = [
    "strata",               # ordinal encoded
    "semester",             # posisi temporal mahasiswa saat ini
    "ip_semester",          # IP semester terakhir
    "ipk_total",            # IPK kumulatif SKS-weighted
    "sks_semester",         # beban studi semester ini
    "rasio_sks_lulus",      # progres SKS terhadap target kelulusan
    "sks_tidak_lulus",      # akumulasi SKS gagal
    "rata_sks_gagal_per_sem",  # rata-rata SKS gagal per semester
    "ip_trend",             # slope tren IP dari waktu ke waktu
    "ip_std",               # konsistensi performa IP
    "rasio_progress",       # posisi semester terhadap batas maksimum
]

TARGET_COLUMN = "label_encoded"


# ----------------------------------------------------------------
# Step 1 — Load & validasi
# ----------------------------------------------------------------

def load_and_validate(filepath: str) -> pd.DataFrame:
    """
    Load CSV dan jalankan validasi dasar terhadap skema dan nilai.

    Validasi yang dilakukan:
    - Kolom wajib hadir
    - Tidak ada missing value pada kolom kritis
    - Nilai IP dalam rentang [0, 4]
    - SKS tidak negatif
    - Label hanya dari nilai yang diketahui

    Parameters
    ----------
    filepath : str
        Path ke file CSV hasil datagen.py.

    Returns
    -------
    pd.DataFrame
        DataFrame yang sudah divalidasi.

    Raises
    ------
    ValueError
        Jika validasi gagal.
    """

    df = pd.read_csv(filepath)

    required_columns = [
        "student_id", "strata", "semester", "ip_semester", "ipk_total",
        "sks_semester", "total_sks", "sks_lulus", "sks_tidak_lulus",
        "label_kelulusan",
    ]
    missing_cols = [c for c in required_columns if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Kolom tidak ditemukan: {missing_cols}")

    # Cek missing value pada kolom kritis
    critical_cols = ["student_id", "ip_semester", "ipk_total", "sks_lulus", "label_kelulusan"]
    for col in critical_cols:
        n_null = df[col].isnull().sum()
        if n_null > 0:
            raise ValueError(f"Missing value pada kolom '{col}': {n_null} baris")

    # Cek rentang nilai IP
    if (df["ip_semester"] < 0).any() or (df["ip_semester"] > 4).any():
        raise ValueError("ip_semester mengandung nilai di luar rentang [0, 4]")
    if (df["ipk_total"] < 0).any() or (df["ipk_total"] > 4).any():
        raise ValueError("ipk_total mengandung nilai di luar rentang [0, 4]")

    # Cek SKS tidak negatif
    for col in ["sks_semester", "sks_lulus", "sks_tidak_lulus"]:
        if (df[col] < 0).any():
            raise ValueError(f"Nilai negatif ditemukan pada kolom '{col}'")

    # Cek label valid
    known_labels = set(LABEL_ENCODING.keys())
    unknown_labels = set(df["label_kelulusan"].unique()) - known_labels
    if unknown_labels:
        raise ValueError(f"Label tidak dikenal: {unknown_labels}")

    print(f"[load] {len(df)} baris, {df['student_id'].nunique()} mahasiswa unik")
    _print_label_distribution(df, "Label distribution (raw)")

    return df


# ----------------------------------------------------------------
# Step 2 — Feature engineering
# ----------------------------------------------------------------

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Hitung fitur agregat temporal per baris semester.

    Setiap baris merepresentasikan snapshot kondisi mahasiswa pada
    akhir semester tertentu. Semua fitur dihitung dari data semester 1
    hingga semester saat ini (inklusif), sehingga tidak ada data leakage
    dari semester masa depan.

    Fitur yang dihasilkan:

    rasio_sks_lulus
        sks_lulus / target_sks per strata.
        Merepresentasikan progres mahasiswa terhadap syarat kelulusan.
        Referensi: Hämäläinen & Vinni-Laakso (2024) menggunakan
        accumulated credits sebagai fitur terpenting.

    rata_sks_gagal_per_sem
        sks_tidak_lulus / semester.
        Rata-rata beban kegagalan per semester hingga saat ini.

    ip_trend
        Slope regresi linear ip_semester terhadap indeks waktu (1..sem).
        Nilai positif menunjukkan tren IP membaik; negatif memburuk.
        Mengikuti pendekatan fitur temporal dalam EDM (Chung & Lee, 2024;
        Asare et al., 2025).
        Untuk semester 1 (hanya satu titik data), slope tidak dapat
        dihitung — diisi 0.0 sebagai nilai netral.

    ip_std
        Standar deviasi ip_semester dari semester 1 hingga sekarang.
        Merepresentasikan konsistensi performa akademik.
        Untuk semester 1, std tidak terdefinisi — diisi 0.0.

    rasio_progress
        semester / max_semester per strata.
        Merepresentasikan posisi mahasiswa dalam rentang waktu studi
        yang diizinkan.

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame hasil load_and_validate.

    Returns
    -------
    pd.DataFrame
        DataFrame dengan kolom fitur baru ditambahkan.
    """

    # Mapping target_sks dan max_semester per strata dibutuhkan
    # untuk menghitung rasio; diambil dari STRATA_CONFIG di datagen.
    target_sks_map  = {"S1": 144, "S2": 36, "S3": 42}
    max_semester_map = {"S1": 14,  "S2": 8,  "S3": 10}

    df = df.copy()

    # --- Fitur berbasis rasio (vectorized, tidak butuh groupby) ---

    df["rasio_sks_lulus"] = df.apply(
        lambda r: r["sks_lulus"] / target_sks_map[r["strata"]], axis=1
    ).clip(0.0, 1.0)
    # Clip ke 1.0 untuk baris terakhir mahasiswa yang sks_lulus sedikit
    # melampaui target akibat pembulatan sks_gagal_semester.

    df["rata_sks_gagal_per_sem"] = df["sks_tidak_lulus"] / df["semester"]

    df["rasio_progress"] = df.apply(
        lambda r: r["semester"] / max_semester_map[r["strata"]], axis=1
    )

    # --- Fitur temporal (butuh riwayat per mahasiswa per semester) ---
    # Dihitung dengan groupby + expanding window agar setiap baris hanya
    # melihat data hingga semester tersebut, tidak ke depan.

    ip_trend_values = []
    ip_std_values   = []

    for student_id, group in df.groupby("student_id", sort=False):
        # group sudah terurut per semester karena data digenerate berurutan;
        # sort ulang untuk memastikan.
        group = group.sort_values("semester")
        ip_vals = group["ip_semester"].values
        n = len(ip_vals)

        trends = []
        stds   = []

        for i in range(n):
            window = ip_vals[:i + 1]   # semester 1 s/d semester i+1

            if i == 0:
                # Hanya satu titik data — slope dan std tidak terdefinisi.
                # Diisi 0.0 sebagai nilai netral (tidak ada tren yang terdeteksi).
                # Ini merupakan limitasi yang perlu dicatat dalam paper.
                trends.append(0.0)
                stds.append(0.0)
            else:
                # Slope regresi linear: ip ~ a + b*t, dengan t = [1, 2, ..., i+1]
                # Menggunakan numpy polyfit degree 1.
                t = np.arange(1, i + 2, dtype=float)
                slope = np.polyfit(t, window, 1)[0]
                trends.append(float(slope))
                stds.append(float(np.std(window, ddof=0)))
                # ddof=0: population std, konsisten dengan ukuran window kecil.

        ip_trend_values.extend(trends)
        ip_std_values.extend(stds)

    df["ip_trend"] = ip_trend_values
    df["ip_std"]   = ip_std_values

    print(f"[feature_engineering] {len(FEATURE_COLUMNS)} fitur dihasilkan")
    return df


# ----------------------------------------------------------------
# Step 3 — Encoding
# ----------------------------------------------------------------

def encode(df: pd.DataFrame) -> pd.DataFrame:
    """
    Encode variabel kategorikal dan label target.

    Encoding yang diterapkan:

    strata → ordinal integer (S1=1, S2=2, S3=3)
        Urutan hierarki akademik dipertahankan. Ordinal encoding dipilih
        karena strata memiliki urutan yang bermakna (kompleksitas studi
        meningkat dari S1 ke S3).

    label_kelulusan → integer (lulus_tepat_waktu=0, lulus_terlambat=1, dropout=2)
        Label asli dipertahankan di kolom 'label_kelulusan' untuk
        keperluan analisis; hasil encoding disimpan di 'label_encoded'.

    Parameters
    ----------
    df : pd.DataFrame

    Returns
    -------
    pd.DataFrame
    """

    df = df.copy()
    df["strata"]        = df["strata"].map(STRATA_ENCODING)
    df["label_encoded"] = df["label_kelulusan"].map(LABEL_ENCODING)

    print(f"[encode] strata: {STRATA_ENCODING}")
    print(f"[encode] label:  {LABEL_ENCODING}")
    return df


# ----------------------------------------------------------------
# Step 4 — Drop kolom yang tidak dipakai sebagai fitur
# ----------------------------------------------------------------

def select_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Pertahankan hanya kolom yang diperlukan untuk training dan evaluasi.

    Kolom yang di-drop:
    - student_id   : identifier, bukan fitur prediktif
    - total_sks    : redundan; informasi sudah tercakup di rasio_sks_lulus
    - sks_lulus    : redundan; sudah direpresentasikan oleh rasio_sks_lulus
    - label_kelulusan : string original, digantikan label_encoded

    Parameters
    ----------
    df : pd.DataFrame

    Returns
    -------
    pd.DataFrame
        Hanya berisi FEATURE_COLUMNS + [TARGET_COLUMN] + ['student_id'].
        student_id dipertahankan sementara untuk keperluan split;
        akan di-drop sebelum training.
    """

    keep = ["student_id"] + FEATURE_COLUMNS + [TARGET_COLUMN]
    df = df[keep].copy()
    print(f"[select_columns] kolom dipertahankan: {FEATURE_COLUMNS + [TARGET_COLUMN]}")
    return df


# ----------------------------------------------------------------
# Step 5 — Train-test split di level mahasiswa
# ----------------------------------------------------------------

def split_data(
    df: pd.DataFrame,
    test_size: float = 0.2,
    random_state: int = 42,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Split dataset menjadi train dan test set.

    Split dilakukan di level mahasiswa (bukan baris) untuk mencegah
    data leakage — tanpa ini, semester awal dan akhir mahasiswa yang
    sama bisa tersebar di train dan test, sehingga model "melihat"
    informasi masa depan saat training.

    Stratifikasi menggunakan label mahasiswa (satu label per mahasiswa)
    agar proporsi kelas terjaga di train dan test.

    Parameters
    ----------
    df : pd.DataFrame
        Output dari select_columns, masih mengandung student_id.
    test_size : float
        Proporsi test set. Default 0.2 (80/20 split).
    random_state : int
        Seed untuk reprodusibilitas split.

    Returns
    -------
    X_train, X_test : pd.DataFrame
        Feature matrix tanpa student_id dan tanpa label.
    y_train, y_test : pd.Series
        Label target (integer encoded).
    """

    # Ambil satu baris per mahasiswa untuk mendapatkan labelnya
    student_labels = (
        df.drop_duplicates("student_id")[["student_id", TARGET_COLUMN]]
        .set_index("student_id")
    )

    # Split di level student_id dengan stratifikasi label
    train_ids, test_ids = train_test_split(
        student_labels.index,
        test_size=test_size,
        random_state=random_state,
        stratify=student_labels[TARGET_COLUMN],
    )

    df_train = df[df["student_id"].isin(train_ids)].copy()
    df_test  = df[df["student_id"].isin(test_ids)].copy()

    # Drop student_id — tidak digunakan sebagai fitur
    X_train = df_train[FEATURE_COLUMNS].reset_index(drop=True)
    X_test  = df_test[FEATURE_COLUMNS].reset_index(drop=True)
    y_train = df_train[TARGET_COLUMN].reset_index(drop=True)
    y_test  = df_test[TARGET_COLUMN].reset_index(drop=True)

    print(f"[split] train: {len(X_train)} baris ({df_train['student_id'].nunique()} mahasiswa)")
    print(f"[split] test:  {len(X_test)} baris ({df_test['student_id'].nunique()} mahasiswa)")
    _print_label_distribution_from_series(y_train, "Label distribution — train")
    _print_label_distribution_from_series(y_test,  "Label distribution — test")

    return X_train, X_test, y_train, y_test


# ----------------------------------------------------------------
# Step 6 — Feature scaling
# ----------------------------------------------------------------

def scale_features(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, StandardScaler]:
    """
    Terapkan StandardScaler pada fitur numerik kontinu.

    Scaler di-fit hanya pada X_train dan diterapkan ke X_test untuk
    mencegah data leakage dari distribusi test set.

    Fitur yang di-scale (FEATURES_TO_SCALE):
        ip_semester, ipk_total, sks_semester, sks_tidak_lulus,
        rata_sks_gagal_per_sem, ip_trend, ip_std

    Fitur yang tidak di-scale:
        strata         — ordinal integer (1, 2, 3); skala sudah sempit
        semester       — integer diskrit; tree-based model tidak sensitif
        rasio_sks_lulus  — sudah ternormalisasi [0, 1]
        rasio_progress   — sudah ternormalisasi [0, 1]

    Meskipun Decision Tree dan tree-based ensemble tidak membutuhkan
    scaling, StandardScaler tetap diterapkan ke semua model untuk
    konsistensi eksperimen komparatif — terutama karena SVM sangat
    sensitif terhadap skala fitur.

    Parameters
    ----------
    X_train, X_test : pd.DataFrame

    Returns
    -------
    X_train_scaled, X_test_scaled : pd.DataFrame
    scaler : StandardScaler
        Scaler yang sudah di-fit; disimpan untuk inferensi produksi.
    """

    X_train_scaled = X_train.copy()
    X_test_scaled  = X_test.copy()

    scaler = StandardScaler()
    X_train_scaled[FEATURES_TO_SCALE] = scaler.fit_transform(X_train[FEATURES_TO_SCALE])
    X_test_scaled[FEATURES_TO_SCALE]  = scaler.transform(X_test[FEATURES_TO_SCALE])

    print(f"[scale] StandardScaler diterapkan pada: {FEATURES_TO_SCALE}")
    print(f"[scale] Scaler fit pada X_train ({len(X_train)} baris); transform ke X_test")

    return X_train_scaled, X_test_scaled, scaler


# ----------------------------------------------------------------
# Step 7 — Simpan artefak
# ----------------------------------------------------------------

def save_artifacts(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
    scaler: StandardScaler,
    output_dir: str,
) -> None:
    """
    Simpan semua artefak preprocessing ke direktori output.

    File yang disimpan:
        X_train.csv, X_test.csv  — feature matrix
        y_train.csv, y_test.csv  — label target
        scaler.pkl               — fitted StandardScaler untuk inferensi
        label_encoding.csv       — mapping label string ke integer
        feature_columns.txt      — urutan kolom fitur

    Parameters
    ----------
    output_dir : str
        Direktori output; dibuat jika belum ada.
    """

    os.makedirs(output_dir, exist_ok=True)

    X_train.to_csv(os.path.join(output_dir, "X_train.csv"), index=False)
    X_test.to_csv(os.path.join(output_dir, "X_test.csv"),  index=False)
    y_train.to_csv(os.path.join(output_dir, "y_train.csv"), index=False, header=True)
    y_test.to_csv(os.path.join(output_dir, "y_test.csv"),   index=False, header=True)

    with open(os.path.join(output_dir, "scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)

    pd.DataFrame(
        list(LABEL_ENCODING.items()), columns=["label", "encoded"]
    ).to_csv(os.path.join(output_dir, "label_encoding.csv"), index=False)

    with open(os.path.join(output_dir, "feature_columns.txt"), "w") as f:
        f.write("\n".join(FEATURE_COLUMNS))

    print(f"[save] Artefak disimpan ke: {output_dir}/")
    for fname in ["X_train.csv", "X_test.csv", "y_train.csv", "y_test.csv",
                  "scaler.pkl", "label_encoding.csv", "feature_columns.txt"]:
        fpath = os.path.join(output_dir, fname)
        print(f"       {fname} ({os.path.getsize(fpath):,} bytes)")


# ----------------------------------------------------------------
# Helper: print distribusi label
# ----------------------------------------------------------------

def _print_label_distribution(df: pd.DataFrame, title: str) -> None:
    label_dist = df.drop_duplicates("student_id")["label_kelulusan"].value_counts()
    total = label_dist.sum()
    print(f"  [{title}]")
    for label, count in label_dist.items():
        print(f"    {label}: {count} ({count/total*100:.1f}%)")


def _print_label_distribution_from_series(y: pd.Series, title: str) -> None:
    inv_map = {v: k for k, v in LABEL_ENCODING.items()}
    counts = y.value_counts().sort_index()
    total = counts.sum()
    print(f"  [{title}]")
    for encoded, count in counts.items():
        label = inv_map[encoded]
        print(f"    {label}: {count} ({count/total*100:.1f}%)")


# ----------------------------------------------------------------
# Entry point
# ----------------------------------------------------------------

def run_pipeline(
    input_path: str,
    output_dir: str,
    test_size: float = 0.2,
    random_state: int = 42,
) -> tuple:
    """
    Jalankan pipeline preprocessing end-to-end.

    Parameters
    ----------
    input_path : str
        Path ke CSV hasil datagen.py.
    output_dir : str
        Direktori untuk menyimpan artefak.
    test_size : float
        Proporsi test set. Default 0.2.
    random_state : int
        Seed untuk reprodusibilitas. Default 42.

    Returns
    -------
    X_train, X_test, y_train, y_test, scaler
    """

    print("=" * 55)
    print("AREASS — Preprocessing Pipeline")
    print("=" * 55)

    df = load_and_validate(input_path)
    df = engineer_features(df)
    df = encode(df)
    df = select_columns(df)

    X_train, X_test, y_train, y_test = split_data(
        df, test_size=test_size, random_state=random_state
    )

    X_train_scaled, X_test_scaled, scaler = scale_features(X_train, X_test)

    save_artifacts(X_train_scaled, X_test_scaled, y_train, y_test, scaler, output_dir)

    print("=" * 55)
    print("Pipeline selesai.")
    print("=" * 55)

    return X_train_scaled, X_test_scaled, y_train, y_test, scaler


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Preprocessing pipeline AREASS.")
    parser.add_argument("input",      help="Path ke CSV hasil datagen.py.")
    parser.add_argument("output_dir", help="Direktori output artefak preprocessing.")
    parser.add_argument("--test-size",     type=float, default=0.2,
                        help="Proporsi test set (default: 0.2).")
    parser.add_argument("--random-state",  type=int,   default=42,
                        help="Seed reprodusibilitas (default: 42).")
    args = parser.parse_args()

    run_pipeline(
        input_path=args.input,
        output_dir=args.output_dir,
        test_size=args.test_size,
        random_state=args.random_state,
    )
