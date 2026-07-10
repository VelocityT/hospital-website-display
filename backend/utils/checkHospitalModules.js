// Show the enabled modules for a hospital.
// Run:  node utils/checkHospitalModules.js "specialist hospital"

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
    const h = await hospitals.findOne({
      fullName: { $regex: `^${NAME}$`, $options: "i" },
    });
    if (!h) {
      console.log(`No hospital named "${NAME}".`);
      return;
    }
    console.log("\nHospital :", h.fullName, "| _id:", String(h._id));
    console.log("modules  :", JSON.stringify(h.modules, null, 2));
    console.log(
      "\nophthalmology:",
      h.modules?.ophthalmology,
      "| opticalShop:",
      h.modules?.opticalShop,
      "| ot:",
      h.modules?.ot
    );
  } catch (err) {
    console.error("Failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
