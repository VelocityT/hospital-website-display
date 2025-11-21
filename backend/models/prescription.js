import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientType: {
      type: String,
      enum: ["ipd", "opd"],
      required: true,
    },
    ipd: String,
    opd: String,
    medicines: [
      {
        _id: false,
        medicine: { type: String, required: true },
        medicineCategory: { type: String },
        doseDuration: { type: String },
        doseInterval: { type: String },
      },
    ],
    labTests: [
      {
        _id: false,
        testName: { type: String, required: true },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: String,
  },
  { timestamps: true }
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;
