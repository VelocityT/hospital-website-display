import mongoose from "mongoose";

// Per-eye refraction/measurement block (OD = right eye, OS = left eye)
const eyeSideSchema = {
  _id: false,
  // Vision
  uncorrectedVA: String, // e.g. 6/60
  pinholeVA: String,
  correctedVA: String, // with current glasses
  bcva: String, // best corrected VA after refraction
  // Auto refractometer reading
  arSph: String,
  arCyl: String,
  arAxis: String,
  // Subjective / final refraction
  sph: String,
  cyl: String,
  axis: String,
  add: String, // near addition
  // Pressure
  iop: String, // mmHg
};

const eyeExamSchema = new mongoose.Schema(
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
    opd: { type: String }, // opdNumber (same convention as Prescription)
    ipd: { type: String },

    // ---------- Optometrist workup ----------
    workup: {
      chiefComplaints: [String], // Blurred Vision, Watering, Redness...
      complaintDuration: String,
      systemicIllness: [String], // Diabetes, Hypertension, Thyroid...
      ocularHistory: String, // previous surgery / trauma / glasses
      currentGlasses: { type: Boolean, default: false },
      iopMethod: { type: String, enum: ["NCT", "Applanation", "Schiotz", ""] },
      dilated: { type: Boolean, default: false },
      dilatedAt: Date,
      rightEye: eyeSideSchema,
      leftEye: eyeSideSchema,
      notes: String,
      workupBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      workupAt: Date,
    },

    // ---------- Doctor findings ----------
    doctorFindings: {
      slitLamp: {
        rightEye: String,
        leftEye: String,
      },
      fundus: {
        rightEye: String,
        leftEye: String,
      },
      cdRatio: {
        rightEye: String, // cup-disc ratio e.g. 0.3
        leftEye: String,
      },
      diagnosis: [String], // Cataract, Glaucoma, Refractive Error...
      advice: {
        type: String,
        enum: ["", "Glasses", "Medical Management", "Surgery", "Referral", "Observation"],
        default: "",
      },
      surgeryAdvised: String, // e.g. PHACO with IOL - Right Eye
      reviewDate: Date,
      notes: String,
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      examinedAt: Date,
    },

    // ---------- Final glasses prescription ----------
    glassesPrescription: {
      prescribed: { type: Boolean, default: false },
      rightEye: {
        _id: false,
        distSph: String,
        distCyl: String,
        distAxis: String,
        distVA: String,
        nearAdd: String,
      },
      leftEye: {
        _id: false,
        distSph: String,
        distCyl: String,
        distAxis: String,
        distVA: String,
        nearAdd: String,
      },
      pd: String, // pupillary distance (mm)
      lensType: {
        type: String,
        enum: [
          "",
          "Single Vision",
          "Bifocal",
          "Progressive",
          "Contact Lens",
        ],
        default: "",
      },
      lensMaterialNote: String, // e.g. ARC, Photochromic, Blue cut
      remarks: String,
    },

    status: {
      type: String,
      enum: ["Workup Pending", "Workup Done", "Completed"],
      default: "Workup Pending",
    },

    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

eyeExamSchema.index({ hospital: 1, opd: 1 });
eyeExamSchema.index({ hospital: 1, patient: 1, createdAt: -1 });

const EyeExam = mongoose.model("EyeExam", eyeExamSchema);
export default EyeExam;
