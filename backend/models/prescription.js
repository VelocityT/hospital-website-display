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
    // WHO TYPED IT (audit trail). Always taken from the JWT, never from the
    // request body — see prescription.controller.js.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // WHO IS PRESCRIBING (the clinical fact that gets printed and signed).
    // Usually the same as createdBy, but they differ when a receptionist
    // records a prescription on behalf of the visit's assigned doctor.
    // Optional: prescriptions created before this field existed have none,
    // and the print falls back to createdBy.
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    note: String,
  },
  { timestamps: true }
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;
