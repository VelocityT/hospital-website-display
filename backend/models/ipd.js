import mongoose from "mongoose";

const ipdAdmissionSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  // Per-hospital number — uniqueness enforced by the compound index below.
  ipdNumber: { type: String, required: true },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  admissionDate: { type: Date, default: Date.now },
  notes: String,
  dischargeSummary: {
    dischargeReason: String,
    dischargeDate: Date,
    dischargeCondition: String,
    dischargedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  reason: String,
  bed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bed",
  },
  ward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ward",
  },
  height: String,
  weight: String,
  bloodPressure: String,
  attendingDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  attendingNurse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Negotiated per-day doctor rate for THIS admission only — never touches
  // attendingDoctor.ipdCharge, so every other patient this doctor sees keeps
  // billing at the normal rate. null/undefined means "no negotiation, use
  // the doctor's default ipdCharge". Set at admission time (IPDForm, both
  // the OPD-to-IPD switch and direct-IPD-intake screens share that form) or
  // adjusted later from PayModal at billing time — admin only in both
  // places, since this also changes what the doctor is paid (see
  // frontend/src/utils/helper.js calculateCommission).
  doctorChargeOverride: { type: Number, default: null, min: 0 },
  doctorPayment: [
    {
      amount: { type: Number },
      paidAt: { type: Date, default: Date.now },
    },
  ],
  // Ad-hoc surgery / OT charges incurred during this admission. Separate
  // from the eye-care module's EyeSurgery model (counseling/biometry/OT
  // board workflow) — this is the lightweight "we did a procedure, charge
  // for it" version for hospitals that don't run the ophthalmology module.
  // Added at billing time from the IPD charge screen, or defaults can be
  // set per-doctor via User.surgeryCharge.
  surgeryCharges: [
    {
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      procedureName: { type: String, required: true },
      charge: { type: Number, required: true, min: 0 },
      date: { type: Date, default: Date.now },
      notes: String,
    },
  ],
  symptoms: {
    symptomNames: [String],
    symptomType: [String],
    description: String,
  },
  status: {
    type: String,
    enum: ["Admitted", "Discharged"],
    default: "Admitted",
  },
  consentForms: [
    {
      formType: String,
      signedBy: String,
      signedAt: Date,
    },
  ],
  payment: {
    status: {
      type: String,
      enum: ["Paid", "Unpaid", "Pending"],
      default: "Unpaid",
    },
    bill: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bill",
      },
    ],
  },
  prescriptions: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
  ],
});

// IPD numbers are generated per hospital, so uniqueness must be scoped to the
// hospital — a global index makes two hospitals collide on the same number.
ipdAdmissionSchema.index({ hospital: 1, ipdNumber: 1 }, { unique: true });

const Ipd = mongoose.model("Ipd", ipdAdmissionSchema);
export default Ipd;
