import mongoose from "mongoose";
import dotenv from "dotenv";
import Patient from "../models/patient.js";
import Ipd from "../models/ipd.js";

dotenv.config();

const fixPatientIpds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("🔗 Connected to MongoDB");

    const patients = await Patient.find({}, "_id fullName ipds");
    const ipds = await Ipd.find({}, "_id patient ipdNumber");

    let updatedCount = 0;

    for (const patient of patients) {
      const matchingIpds = ipds
        .filter((ipd) => ipd.patient.toString() === patient._id.toString())
        .map((ipd) => ipd._id);

      if (matchingIpds.length > 0) {
        await Patient.updateOne(
          { _id: patient._id },
          { $addToSet: { ipds: { $each: matchingIpds } } }
        );

        console.log(
          `👤 Patient: ${patient.fullName || patient._id}\n` +
            `   Matched IPDs: ${matchingIpds.join(", ")}`
        );

        updatedCount++;
      }
    }

    console.log(`\n✅ Fixed IPDs for ${updatedCount} patients`);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error fixing patient IPDs:", error.message);
    process.exit(1);
  }
};

fixPatientIpds();
