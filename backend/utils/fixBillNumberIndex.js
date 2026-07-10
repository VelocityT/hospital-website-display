// One-time migration: make bill numbers unique PER HOSPITAL instead of global.
// Run once from the backend folder:  node utils/fixBillNumberIndex.js
//
// Why: generateBillNumber() increments a per-hospital counter and pads it
// (e.g. "000005"). The old schema put a GLOBAL unique index on billNumber, so
// two hospitals sharing the same DB collided ("E11000 dup key billNumber").
// This drops that global index, adds a compound {hospital, billNumber} unique
// index, and resyncs each hospital's billCounter to its highest bill number.

import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import Hospital from "../models/hospital.js";

dotenv.config();
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("Connected to MongoDB");

    const bills = mongoose.connection.collection("bills");

    // 1) Drop the old global unique index if it exists.
    const indexes = await bills.indexes();
    console.log(
      "Current indexes:",
      indexes.map((i) => i.name)
    );
    if (indexes.some((i) => i.name === "billNumber_1")) {
      await bills.dropIndex("billNumber_1");
      console.log("Dropped global unique index: billNumber_1");
    } else {
      console.log("No global billNumber_1 index found (already migrated).");
    }

    // 2) Create the compound per-hospital unique index.
    await bills.createIndex(
      { hospital: 1, billNumber: 1 },
      { unique: true, name: "hospital_1_billNumber_1" }
    );
    console.log("Created compound unique index: hospital_1_billNumber_1");

    // 3) Resync each hospital's billCounter to its highest existing bill number
    //    so future bills never regenerate an existing number.
    const hospitals = await Hospital.find({}, { _id: 1 }).lean();
    for (const h of hospitals) {
      const top = await bills
        .find({ hospital: h._id })
        .project({ billNumber: 1 })
        .toArray();
      const maxNum = top.reduce((max, b) => {
        const n = parseInt(b.billNumber, 10);
        return Number.isFinite(n) && n > max ? n : max;
      }, 0);
      await Hospital.updateOne(
        { _id: h._id },
        { $set: { billCounter: maxNum } }
      );
      console.log(`Hospital ${h._id}: billCounter set to ${maxNum}`);
    }

    console.log("\nMigration complete.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
