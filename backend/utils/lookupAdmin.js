// Read-only lookup: which hospital does a given user email belong to?
// Run from the backend folder:  node utils/lookupAdmin.js
// Optionally pass an email:      node utils/lookupAdmin.js someone@example.com

import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const EMAIL = (process.argv[2] || "admin@gmail.com").trim();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    const users = mongoose.connection.collection("users");
    const hospitals = mongoose.connection.collection("hospitals");

    const matches = await users
      .find({ email: { $regex: `^${EMAIL}$`, $options: "i" } })
      .toArray();

    console.log(`\nMatches for "${EMAIL}": ${matches.length}\n`);

    for (const u of matches) {
      const h = u.hospital
        ? await hospitals.findOne({ _id: u.hospital })
        : null;

      console.log("------------------------------------------------");
      console.log("User      :", u.email);
      console.log("Name      :", u.fullName || "-");
      console.log("Role      :", u.role);
      console.log("Staff ID  :", u.staffId || "-");
      console.log("User _id  :", String(u._id));
      if (h) {
        console.log("Hospital  :", h.fullName || h.name || "(unnamed)");
        console.log("Hosp email:", h.email || "-");
        console.log("Hosp _id  :", String(h._id));
        console.log("Disabled  :", !!h.isDisabled, "| Deleted:", !!h.isDeleted);
      } else if (u.role === "superAdmin") {
        console.log("Hospital  : (superAdmin — not tied to a hospital)");
      } else {
        console.log("Hospital  : (no hospital reference on this user)");
      }
    }

    if (!matches.length) {
      console.log("No user found with that email. Check spelling/case.");
    }
  } catch (err) {
    console.error("Lookup failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
