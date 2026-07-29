// One-time migration: make ALL counter-based IDs unique PER HOSPITAL
// instead of globally.
//
// Run once from the backend folder:  node utils/fixTenantIndexes.js
//
// WHY
// ---
// Every ID in Velocare (patientId, staffId, billNumber, opdNumber, ipdNumber,
// OPT-xxxxx, SUR-xxxxx) is generated from a PER-HOSPITAL counter on the
// Hospital document. But several collections were created with a GLOBAL unique
// index on that field. The moment a second hospital's counter reaches a value
// an older hospital already used, inserts fail with:
//
//   E11000 duplicate key error ... index: billNumber_1 dup key: {...}
//
// This script drops each legacy global index and replaces it with a compound
// { hospital, <field> } unique index, then resyncs every hospital's counter to
// its own highest existing value.
//
// SAFETY
// ------
// - It does NOT modify, move or delete any patient/bill/visit document.
// - It refuses to create an index if real duplicates exist within a hospital,
//   printing them instead so you can decide what to do.
// - It is idempotent: safe to run repeatedly.
// - Counters are only ever moved FORWARD, never backwards.

import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import Hospital from "../models/hospital.js";

dotenv.config();
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

// collection, field, legacy global index name, hospital counter field, parser
const TARGETS = [
  {
    collection: "bills",
    field: "billNumber",
    legacyIndex: "billNumber_1",
    counterField: "billCounter",
    parse: (v) => parseInt(v, 10), // "000006" -> 6
  },
  {
    collection: "patients",
    field: "patientId",
    legacyIndex: "patientId_1",
    counterField: "patientCounter",
    parse: (v) => parseInt(String(v).split("-").pop(), 10), // "PT-001" -> 1
  },
  {
    collection: "users",
    field: "staffId",
    legacyIndex: "staffId_1",
    counterField: "staffCounter",
    parse: (v) => parseInt(String(v).split("-").pop(), 10), // "ST-001" -> 1
  },
  {
    collection: "opds",
    field: "opdNumber",
    legacyIndex: "opdNumber_1",
    counterField: null, // derived from patient, no standalone counter
  },
  {
    collection: "ipds",
    field: "ipdNumber",
    legacyIndex: "ipdNumber_1",
    counterField: null,
  },
  {
    collection: "opticalorders",
    field: "orderNumber",
    legacyIndex: "orderNumber_1",
    counterField: "opticalCounter",
    parse: (v) => parseInt(String(v).split("-").pop(), 10), // "OPT-00001" -> 1
  },
  {
    collection: "eyesurgeries",
    field: "surgeryNumber",
    legacyIndex: "surgeryNumber_1",
    counterField: "surgeryCounter",
    parse: (v) => parseInt(String(v).split("-").pop(), 10), // "SUR-00001" -> 1
  },
];

const processTarget = async (t) => {
  const col = mongoose.connection.collection(t.collection);
  const compoundName = `hospital_1_${t.field}_1`;

  console.log(`\n──────── ${t.collection}.${t.field} ────────`);

  // Collection may not exist yet (e.g. no optical orders created).
  const collections = await mongoose.connection.db
    .listCollections({ name: t.collection })
    .toArray();
  if (!collections.length) {
    console.log("  Collection does not exist yet — skipping.");
    return;
  }

  const indexes = await col.indexes();

  // 1) Drop the legacy global unique index.
  if (indexes.some((i) => i.name === t.legacyIndex)) {
    await col.dropIndex(t.legacyIndex);
    console.log(`  ✔ Dropped global index: ${t.legacyIndex}`);
  } else {
    console.log(`  · No global index ${t.legacyIndex} (already migrated)`);
  }

  // 2) Guard: documents missing the field would all collide as `null`.
  const missing = await col.countDocuments({
    $or: [{ [t.field]: null }, { [t.field]: { $exists: false } }],
  });
  if (missing > 0) {
    console.error(
      `  ✖ ${missing} document(s) have no ${t.field}. ` +
        `Cannot create a unique index until these are fixed. Skipping.`
    );
    return;
  }

  // 3) Guard: genuine duplicates WITHIN a hospital.
  const dupes = await col
    .aggregate([
      {
        $group: {
          _id: { hospital: "$hospital", value: `$${t.field}` },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  if (dupes.length) {
    console.error(
      `  ✖ ${dupes.length} duplicate (hospital, ${t.field}) pair(s) found. ` +
        `Resolve these manually, then re-run. Skipping index creation.`
    );
    dupes
      .slice(0, 10)
      .forEach((d) =>
        console.error(
          `      hospital=${d._id.hospital} ${t.field}=${d._id.value} ×${d.count}`
        )
      );
    return;
  }

  // 4) Create the compound per-hospital unique index.
  if (indexes.some((i) => i.name === compoundName)) {
    console.log(`  · Compound index ${compoundName} already exists`);
  } else {
    await col.createIndex(
      { hospital: 1, [t.field]: 1 },
      { unique: true, name: compoundName }
    );
    console.log(`  ✔ Created compound unique index: ${compoundName}`);
  }

  // 5) Move each hospital's counter FORWARD to its own highest value.
  if (!t.counterField || !t.parse) {
    console.log("  · No counter to resync for this collection");
    return;
  }

  const hospitals = await Hospital.find(
    {},
    { _id: 1, fullName: 1, [t.counterField]: 1 }
  ).lean();

  for (const h of hospitals) {
    const docs = await col
      .find({ hospital: h._id })
      .project({ [t.field]: 1 })
      .toArray();

    const maxNum = docs.reduce((max, d) => {
      const n = t.parse(d[t.field]);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);

    const current = h[t.counterField] || 0;
    if (maxNum > current) {
      await Hospital.updateOne(
        { _id: h._id },
        { $set: { [t.counterField]: maxNum } }
      );
      console.log(
        `  ↑ ${h.fullName}: ${t.counterField} ${current} → ${maxNum}`
      );
    }
  }
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

    for (const t of TARGETS) {
      await processTarget(t);
    }

    console.log(
      "\n✅ Migration complete. Restart the backend so Mongoose picks up the new index state."
    );
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
