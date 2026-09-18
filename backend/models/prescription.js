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
    // Handwritten mode: the doctor draws the Rx on a touchscreen/stylus pad
    // instead of picking medicines from the structured fields below. Stored
    // as a base64 PNG data URL so it can be dropped straight into an <img>
    // on print with no separate file storage. Optional — a prescription is
    // either typed (medicines/labTests) or handwritten (this field), and the
    // two are allowed to coexist if a doctor adds typed items alongside a
    // handwritten note, but the print view treats handwrittenImage as the
    // primary content when present (see PrintPrescription.jsx).
    handwrittenImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;
