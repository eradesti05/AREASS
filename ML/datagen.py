"""
Generasi Data Akademik Sintetis
AREASS — Academic Risk Estimation and Adaptive Scheduling System
Kelompok 2 — IF5200 Perancangan Penelitian Terapan

Implementasi algoritma v2.
"""

import numpy as np
import pandas as pd
from typing import Optional
import argparse

# ----------------------------------------------------------------
# Konfigurasi parameter per strata
# ----------------------------------------------------------------

STRATA_CONFIG = {
    "S1": {
        "target_sks":        144,
        "max_semester":       14,
        "batas_tepat_waktu":   8,
    },
    "S2": {
        "target_sks":         36,
        "max_semester":        8,
        "batas_tepat_waktu":   4,
    },
    "S3": {
        "target_sks":         42,
        "max_semester":       10,
        "batas_tepat_waktu":   8,  # dapat diubah; diskusikan dengan tim
    },
}


# ----------------------------------------------------------------
# Fungsi utama
# ----------------------------------------------------------------

def generate_data_sintetis(
    n_students: int,
    strata_distribution: Optional[dict] = None,
    random_seed: Optional[int] = None,
) -> pd.DataFrame:
    """
    Generate dataset akademik sintetis multi-row per mahasiswa.

    Parameters
    ----------
    n_students : int
        Jumlah mahasiswa yang disimulasikan.
    strata_distribution : dict, optional
        Proporsi tiap strata, misal {"S1": 0.7, "S2": 0.2, "S3": 0.1}.
        Default: {"S1": 0.7, "S2": 0.2, "S3": 0.1}.
    random_seed : int, optional
        Seed untuk reprodusibilitas.

    Returns
    -------
    pd.DataFrame
        Dataset dengan distribusi label natural. Kolom:
        student_id, strata, semester, ip_semester, ipk_total,
        sks_semester, total_sks, sks_lulus, sks_tidak_lulus, label_kelulusan.

    Notes
    -----
    Distribusi label dibiarkan natural sesuai hasil simulasi.
    Penanganan class imbalance dilakukan di pipeline ML (class_weight,
    oversampling, dll.), bukan di tahap generasi data.
    """

    if strata_distribution is None:
        strata_distribution = {"S1": 0.7, "S2": 0.2, "S3": 0.1}

    rng = np.random.default_rng(random_seed)

    strata_list  = list(strata_distribution.keys())
    strata_probs = list(strata_distribution.values())

    records = []          # kumpulan baris semester
    label_map = {}        # student_id -> label_kelulusan

    # ----------------------------------------------------------------
    # STEP 1 & 2 — Generate profil dan simulasi perjalanan akademik
    # ----------------------------------------------------------------

    for student_id in range(1, n_students + 1):

        # Step 1 — profil mahasiswa
        strata       = rng.choice(strata_list, p=strata_probs)
        cfg          = STRATA_CONFIG[strata]
        target_sks   = cfg["target_sks"]
        max_semester = cfg["max_semester"]

        ability_score = rng.uniform(0.4, 0.9)

        semester        = 1
        total_sks       = 0
        sks_lulus       = 0
        sks_tidak_lulus = 0
        ip_history      = []
        sks_history     = []

        # Step 2 — simulasi per semester
        while semester <= max_semester and sks_lulus < target_sks:

            # 2.1 SKS semester
            if semester == 1:
                sks_semester = int(rng.integers(18, 23))   # 18–22 inklusif
            else:
                ip_prev = ip_history[-1]
                if ip_prev >= 3.0:
                    sks_semester = int(rng.integers(21, 25))  # 21–24
                elif ip_prev >= 2.5:
                    sks_semester = int(rng.integers(18, 22))  # 18–21
                else:
                    sks_semester = int(rng.integers(15, 19))  # 15–18

            # 2.2 IP semester
            ip_semester = rng.normal(loc=ability_score * 4, scale=0.3)
            ip_semester = float(np.clip(ip_semester, 0.0, 4.0))

            ip_history.append(ip_semester)
            sks_history.append(sks_semester)

            # 2.3 Simulasi kegagalan
            if ip_semester >= 3.0:
                fail_ratio = rng.uniform(0.00, 0.05)
            elif ip_semester >= 2.5:
                fail_ratio = rng.uniform(0.05, 0.10)
            elif ip_semester >= 2.0:
                fail_ratio = rng.uniform(0.10, 0.20)
            else:
                fail_ratio = rng.uniform(0.20, 0.35)

            sks_gagal_semester = round(sks_semester * fail_ratio)
            sks_lulus_semester = sks_semester - sks_gagal_semester

            # 2.4 Update progres
            total_sks       += sks_semester
            sks_lulus       += sks_lulus_semester
            sks_tidak_lulus += sks_gagal_semester

            # 2.5 IPK total (SKS-weighted mean)
            ipk_total = (
                sum(ip * sks for ip, sks in zip(ip_history, sks_history))
                / sum(sks_history)
            )

            # 2.6 Simpan record semester
            records.append({
                "student_id":     student_id,
                "strata":         strata,
                "semester":       semester,
                "ip_semester":    round(ip_semester, 3),
                "ipk_total":      round(ipk_total, 3),
                "sks_semester":   sks_semester,
                "total_sks":      total_sks,
                "sks_lulus":      sks_lulus,
                "sks_tidak_lulus": sks_tidak_lulus,
                "label_kelulusan": None,   # diisi di Step 4
            })

            # 2.7 Naik semester
            semester += 1

        # ----------------------------------------------------------------
        # STEP 3 — Tentukan label kelulusan
        # ----------------------------------------------------------------

        semester_selesai = semester - 1
        batas_tepat_waktu = cfg["batas_tepat_waktu"]

        if sks_lulus >= target_sks and ipk_total >= 2.0:
            if semester_selesai <= batas_tepat_waktu:
                label = "lulus_tepat_waktu"
            else:
                label = "lulus_terlambat"
        else:
            label = "dropout"

        label_map[student_id] = label

    # ----------------------------------------------------------------
    # STEP 4 — Assign label ke semua record mahasiswa
    # ----------------------------------------------------------------

    df = pd.DataFrame(records)
    df["label_kelulusan"] = df["student_id"].map(label_map)

    return df.reset_index(drop=True)


# ----------------------------------------------------------------
# Entry point
# ----------------------------------------------------------------

if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Generate dataset akademik sintetis.")
    parser.add_argument('-n', '--n_students', type=int, default=3000, help="Jumlah mahasiswa yang disimulasikan.")
    parser.add_argument('-s', '--seed', type=int, default=42, help="Seed untuk reprodusibilitas.")
    parser.add_argument("output", help="Path ke file output CSV.")

    args = parser.parse_args()

    df = generate_data_sintetis(
        n_students=args.n_students,
        strata_distribution={"S1": 0.7, "S2": 0.2, "S3": 0.1},
        random_seed=args.seed,
    )

    print(f"\nTotal baris dataset: {len(df)}")
    print(f"Total mahasiswa unik: {df['student_id'].nunique()}")

    print("\nDistribusi label (natural):")
    label_dist = df.drop_duplicates("student_id")["label_kelulusan"].value_counts()
    for label, count in label_dist.items():
        print(f"  {label}: {count} mahasiswa ({count / label_dist.sum() * 100:.1f}%)")

    print(f"\nContoh data (10 baris pertama):")
    print(df.head(10).to_string(index=False))

    # Simpan ke CSV
    df.to_csv(args.output, index=False)
    print(f"\nDataset disimpan ke: {args.output}")