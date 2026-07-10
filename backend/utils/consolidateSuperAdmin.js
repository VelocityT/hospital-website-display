// Consolidate to a single superAdmin and reassign ALL hospitals to it.
//
//   Dry run (shows the plan, changes nothing):
//     node utils/consolidateSuperAdmin.js
//   Apply the changes:
//     node utils/consolidateSuperAdmin.js --confirm
//
// Keeper superAdmin is superadmin@gmail.com. Every hospital's `createdBy`
// is set to the keeper, and all other superAdmin accounts are deleted.
// Deletion is permanent — the dry run is there so you can review first.

import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const KEEPER_EMAIL = "superadmin@gmail.com";
const CONFIRM = process.argv.includes("--confirm");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    const users = mongoose.connection.collection("users");
    const hospitals = mongoose.connection.collection("hospitals");

    const keeper = await users.findOne({
      email: { $regex: `^${KEEPER_EMAIL}$`, $options: "i" },
      role: "superAdmin",
    });

    if (!keeper) {
      console.log(
        `ABORT: keeper superAdmin "${KEEPER_EMAIL}" not found. Nothing changed.`
      );
      return;
    }

    const others = await users
      .find({ role: "superAdmin", _id: { $ne: keeper._id } })
      .project({ fullName: 1, email: 1 })
      .toArray();

    const totalHospitals = await hospitals.countDocuments({});
    const notOwned = await hospitals.countDocuments({
      createdBy: { $ne: keeper._id },
    });

    console.log("\n=========== PLAN ===========");
    console.log(`Keeper superAdmin : ${keeper.fullName} <${keeper.email}>`);
    console.log(`Keeper _id        : ${String(keeper._id)}`);
    console.log(`Hospitals total   : ${totalHospitals}`);
    console.log(`Will reassign     : ${notOwned} hospital(s) -> keeper`);
    console.log(`superAdmins to DELETE (${others.length}):`);
    others.forEach((o) =>
      console.log(`   - ${o.fullName} <${o.email}> ${String(o._id)}`)
    );
    console.log("============================\n");

    if (!CONFIRM) {
      console.log("DRY RUN — nothing changed.");
      console.log("Re-run with  --confirm  to apply these changes.");
      return;
    }

    const upd = await hospitals.updateMany(
      {},
      { $set: { createdBy: keeper._id } }
    );
    console.log(`Reassigned ${upd.modifiedCount} hospital(s) to keeper.`);

    const del = await users.deleteMany({
      role: "superAdmin",
      _id: { $ne: keeper._id },
    });
    console.log(`Deleted ${del.deletedCount} other superAdmin account(s).`);

    console.log("\nDone. Log in as", KEEPER_EMAIL, "to see all hospitals.");
  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
