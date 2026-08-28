import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Generated from a PER-HOSPITAL counter + prefix (see generateCustomId),
    // so uniqueness is scoped to the hospital by the compound index below.
    // NOTE: email and phone stay GLOBALLY unique — they are login identity.
    staffId: {
      type: String,
      required: true,
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePhoto: { type: String },

    role: {
      type: String,
      enum: [
        "admin",
        "doctor",
        "nurse",
        "receptionist",
        "pharmacist",
        "superAdmin",
        "pathologist",
        "optometrist",
        "optician",
      ],
      default: "receptionist",
    },
    department: { type: String },
    designation: { type: String },

    gender: { type: String, enum: ["Male", "Female", "Other"] },
    dob: { type: Date },
    bloodGroup: { type: String },
    phone: { type: String, required: true, unique: true },
    emergencyContact: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    maritalStatus: { type: String },

    currentAddress: { type: String },
    permanentAddress: { type: String },

    qualification: { type: String },
    specialist: { type: String },
    // How long this doctor's prescription stays valid, in days. Printed in the
    // letterhead footer ("Validity for N Days") so pharmacies and the patient
    // know when a re-check is due. Set per doctor because a physician writing
    // a 3-month chronic regimen and a surgeon writing post-op cover do not
    // mean the same thing by "valid".
    //
    // Defaults to 5 — the value Nasa's printed pad carried before this was
    // configurable, so existing doctors keep printing exactly what they did.
    prescriptionValidityDays: { type: Number, default: 5, min: 0 },
    // What the PATIENT is billed for this doctor. Applies to every doctor,
    // salaried or not — salary changes how the doctor is PAID, never what the
    // hospital charges.
    ipdCharge: { type: Number },
    opdCharge: { type: Number },
    // Commission-based pay: a % of the above, paid out per visit and recorded
    // in the OPD/IPD `doctorPayment` array. Ignored when isSalaried is true.
    ipdCommission: { type: Number },
    opdCommission: { type: Number },
    // Doctor's default rate/cut for performing a surgery — same pattern as
    // ipdCharge/ipdCommission above. This is just the DEFAULT: an individual
    // surgery charge line on a patient's IPD bill (Ipd.surgeryCharges[]) can
    // still be entered at a different amount, same as any other charge.
    surgeryCharge: { type: Number },
    surgeryCommission: { type: Number },
    // Salaried doctors draw a fixed monthly amount instead of per-visit
    // commission. Their income view shows the salary; commission payouts are
    // blocked so nobody can be paid twice for the same work.
    isSalaried: { type: Boolean, default: false },
    monthlySalary: { type: Number },
    dateOfJoining: { type: Date, default: Date.now },
    workExperience: { type: String },
    note: { type: String },

    panNumber: { type: String },
    aadharNumber: { type: String },
    reference: { type: String },

    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },

    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Staff IDs are generated per hospital (prefix + counter), so uniqueness must
// be scoped to the hospital. email/phone remain globally unique (login identity).
userSchema.index({ hospital: 1, staffId: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
export default User;
