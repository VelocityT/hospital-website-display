import mongoose from "mongoose";

const ipdAdmissionSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  ipdNumber: { type: String, unique: true, required: true },
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
  doctorPayment: [
    {
      amount: { type: Number },
      paidAt: { type: Date, default: Date.now },
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

const Ipd = mongoose.model("Ipd", ipdAdmissionSchema);
export default Ipd;
