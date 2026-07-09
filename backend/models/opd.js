import mongoose from "mongoose";

const opdVisitSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  opdNumber: { type: String, unique: true, required: true },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
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

const Opd = mongoose.model("Opd", opdVisitSchema);
export default Opd;
