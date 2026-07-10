// Diagnostic: who created a given hospital, and which superAdmin can see it.
// Run:  node utils/whoOwnsHospital.js "specialist hospital"
// (defaults to "specialist hospital" if no name is passed)

import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const NAME = (process.argv[2] || "specialist hospital").trim();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    const hospitals = mongoose.connection.collection("hospitals");
    const users = mongoose.connection.collection("users");

    const h = await hospitals.findOne({
      fullName: { $regex: `^${NAME}$`, $options: "i" },
    });

    if (!h) {
      console.log(`No hospital named "${NAME}" found.`);
      return;
    }

    console.log("\nHospital  :", h.fullName, "| _id:", String(h._id));
    console.log("createdBy :", h.createdBy ? String(h.createdBy) : "(none)");

    if (h.createdBy) {
      const owner = await users.findOne({ _id: h.createdBy });
      console.log(
        "Owner acct:",
        owner
          ? `${owner.fullName} <${owner.email}> role=${owner.role}`
          : "(owner user not found)"
      );
    }

    const superAdmins = await users
      .find({ role: "superAdmin" })
      .project({ fullName: 1, email: 1 })
      .toArray();

    console.log(`\nAll superAdmins (${superAdmins.length}):`);
    for (const s of superAdmins) {
      const owns = String(s._id) === String(h.createdBy) ? "  <-- SEES IT" : "";
      console.log(` - ${s.fullName} <${s.email}>  ${String(s._id)}${owns}`);
    }

    console.log(
      "\nLog in as the superAdmin marked 'SEES IT' to view/edit this hospital."
    );
  } catch (err) {
    console.error("Lookup failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
