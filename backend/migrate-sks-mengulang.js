/**
 * Migration Script: Update jumlahMkDiulang untuk semua Akademik records
 * 
 * Formula: jumlahMkDiulang = sksPerSemester - jumlahSksLulus
 * 
 * Usage: node migrate-sks-mengulang.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/areass";

// Schema definition
const akademikSchema = new mongoose.Schema({
  mahasiswaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  nim: String,
  strata: { type: String, default: "S2" },
  tahunAkademik: { type: String, default: "2025/2026" },
  semesterType: { type: String, enum: ["Ganjil", "Genap"], default: "Ganjil" },
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

async function migrateData() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all akademik records
    const allAkademik = await Akademik.find({});
    console.log(`\n📊 Found ${allAkademik.length} records to process\n`);

    if (allAkademik.length === 0) {
      console.log("⚠️  No records found to update");
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let updateCount = 0;

    // Process each record
    for (const record of allAkademik) {
      const sksPerSemester = record.sksPerSemester || 0;
      const jumlahSksLulus = record.jumlahSksLulus || 0;
      const calculatedMkDiulang = Math.max(0, sksPerSemester - jumlahSksLulus);

      // Only update if value changed
      if (record.jumlahMkDiulang !== calculatedMkDiulang) {
        const oldValue = record.jumlahMkDiulang;
        
        await Akademik.findByIdAndUpdate(
          record._id,
          { jumlahMkDiulang: calculatedMkDiulang },
          { new: true }
        );

        updateCount++;
        console.log(
          `✅ Updated: ${record.nim} | Sem ${record.semesterKe} (${record.strata}) | ${sksPerSemester} - ${jumlahSksLulus} = ${calculatedMkDiulang} (was: ${oldValue})`
        );
      } else {
        console.log(
          `⏭️  Skipped: ${record.nim} | Sem ${record.semesterKe} (${record.strata}) | Already correct (${calculatedMkDiulang})`
        );
      }
      
      successCount++;
    }

    console.log("\n" + "=".repeat(70));
    console.log(`✨ Migration Complete!`);
    console.log(`   Total Processed: ${successCount}`);
    console.log(`   Updated: ${updateCount}`);
    console.log(`   Skipped: ${successCount - updateCount}`);
    console.log("=".repeat(70) + "\n");

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during migration:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrateData();
