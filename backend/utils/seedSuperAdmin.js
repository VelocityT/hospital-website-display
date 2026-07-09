// Seed / reset a superAdmin account.
// Run from the backend folder:  node utils/seedSuperAdmin.js
//
// Edit the three values below, then run it. Safe to re-run: if a superAdmin
// with this email already exists, its password is reset instead of duplicated.

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dns from "dns";
import dotenv from "dotenv";
import User from "../models/user.js";

dotenv.config();
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]); // avoid ISP querySrv ECONNREFUSED
} catch (e) {}

// ---- EDIT THESE ----
const SUPER_ADMIN = {
  fullName: "Super Admin",
  email: "superadmin@velocity.com",
  password: "Admin@12345", // you log in with this plain password
  phone: "9999999999",
  staffId: "SA-001",
};
// --------------------

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("Connected to MongoDB");

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);

    const existing = await User.findOne({
      email: SUPER_ADMIN.email,
      role: "superAdmin",
    });

    if (existing) {
      existing.password = hashedPassword;
      await existing.save();
      console.log(`Existing superAdmin found - password reset for ${SUPER_ADMIN.email}`);
    } else {
      await User.create({
        ...SUPER_ADMIN,
        password: hashedPassword,
        role: "superAdmin",
      });
      console.log(`superAdmin created: ${SUPER_ADMIN.email}`);
    }

    console.log("\nLogin with:");
    console.log(`  Email:    ${SUPER_ADMIN.email}`);
    console.log(`  Password: ${SUPER_ADMIN.password}`);
    console.log("  Role:     superAdmin");
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
