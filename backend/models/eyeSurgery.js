import mongoose from "mongoose";

const eyeSurgerySchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    surgeryNumber: { type: String, unique: true, required: true },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    eyeExam: { type: mongoose.Schema.Types.ObjectId, ref: "EyeExam" },
    opd: String,
    ipd: String,

    surgeryType: {
      type: String,
      enum: [
        "Cataract - PHACO",
        "Cataract - SICS",
        "Cataract - FLACS",
        "LASIK / Refractive",
        "Pterygium Excision",
        "Glaucoma Surgery",
        "Squint Correction",
        "Retina / Vitrectomy",
        "DCR / DCT",
        "Other",
      ],
      required: true,
    },
    eye: {
      type: String,
      enum: ["Right Eye (OD)", "Left Eye (OS)", "Both Eyes"],
      required: true,
    },

    // ---------- Counseling ----------
    counseling: {
      counseledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      counseledAt: Date,
      packagesOffered: [
        {
          _id: false,
          name: String, // e.g. "Monofocal (Indian)", "Multifocal (Imported)"
          iolModel: String,
          price: Number,
        },
      ],
      selectedPackage: {
        name: String,
        iolModel: String,
        price: Number,
      },
      estimatedCost: Number,
      notes: String,
    },

    // ---------- Biometry / pre-op ----------
    biometry: {
      k1: String,
      k2: String,
      axialLength: String,
      formula: String, // SRK/T, Barrett...
      iolPower: String,
      fitnessDone: { type: Boolean, default: false }, // physician fitness
      fitnessNote: String,
    },

    surgeon: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    otDate: Date,

    status: {
      type: String,
      enum: [
        "Advised",
        "Counseled",
        "Scheduled",
        "Completed",
        "Cancelled",
      ],
      default: "Advised",
    },

    operativeNotes: String,
    followUpDate: Date,

    payment: {
      status: {
        type: String,
        enum: ["Paid", "Partial", "Unpaid"],
        default: "Unpaid",
      },
      // running total actually collected across all installments
      paidAmount: { type: Number, default: 0 },
      // one Bill per payment installment = full payment history
      // (mirrors Ipd/Opd/Pathology/Medicine billing pattern)
      bill: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bill" }],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

eyeSurgerySchema.index({ hospital: 1, status: 1, otDate: 1 });

const EyeSurgery = mongoose.model("EyeSurgery", eyeSurgerySchema);
export default EyeSurgery;
