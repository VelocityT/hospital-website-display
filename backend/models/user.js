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
    ipdCharge: { type: Number },
    opdCharge: { type: Number },
    ipdCommission: { type: Number },
    opdCommission: { type: Number },
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
