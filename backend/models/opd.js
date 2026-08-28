import mongoose from "mongoose";

const opdVisitSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  // Per-hospital number — uniqueness enforced by the compound index below.
  opdNumber: { type: String, required: true },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Negotiated consultation charge for THIS visit only — see the matching
  // field on ipd.js for the full reasoning. null/undefined means "use
  // doctor.opdCharge as normal". Set from PayModal at billing time, admin
  // only.
  doctorChargeOverride: { type: Number, default: null, min: 0 },
  visitDateTime: { type: Date, default: Date.now },
  notes: String,
  symptoms: {
    symptomNames: [String],
    symptomType: [String],
    description: String,
  },
  status: {
    type: String,
    enum: ["Scheduled", "Workup Done", "With Doctor", "Completed"],
    default: "Scheduled",
  },
  payment: {
    status: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
    },
  },
  doctorPayment: [
    {
      amount: { type: Number, required: true },
      paidAt: { type: Date, default: Date.now },
    },
  ],
  prescriptions: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
  ],
});

// OPD numbers are generated per hospital, so uniqueness must be scoped to the
// hospital — a global index makes two hospitals collide on the same number.
opdVisitSchema.index({ hospital: 1, opdNumber: 1 }, { unique: true });

const Opd = mongoose.model("Opd", opdVisitSchema);
export default Opd;
