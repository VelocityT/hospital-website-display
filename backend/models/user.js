import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      unique: true,
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

const User = mongoose.model("User", userSchema);
export default User;
