import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    address: String,

    phone: { type: String, required: true },
    email: String,
    website: String,
    logoUrl: String,

    modules: {
      pharmacy: { type: Boolean, default: false },
      ipd: { type: Boolean, default: false },
      opd: { type: Boolean, default: false },
      pathology: { type: Boolean, default: false },
      billing: { type: Boolean, default: false },
      inventory: { type: Boolean, default: false },
      ophthalmology: { type: Boolean, default: false },
      opticalShop: { type: Boolean, default: false },
      ot: { type: Boolean, default: false },
    },

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Which printed letterhead this hospital uses.
    // "default" = the generic Velocare header every hospital gets.
    // Anything else maps to a bespoke template in
    // frontend/src/pages/printMaterial/templates/index.js — add the key there
    // first, otherwise the app silently falls back to "default".
    printTemplate: {
      type: String,
      default: "default",
    },
    staffPrefix: String,
    patientPrefix: String,
    staffCounter: {
      type: Number,
      default: 0,
    },
    patientCounter: {
      type: Number,
      default: 0,
    },
    billCounter: {
      type: Number,
      default: 0,
    },
    opticalCounter: {
      type: Number,
      default: 0,
    },
    surgeryCounter: {
      type: Number,
      default: 0,
    },
    isDisabled: {
      default: false,
      type: Boolean,
    },
    isDeleted: {
      default: false,
      type: Boolean,
    },
  },
  { timestamps: true }
);

const Hospital = mongoose.model("Hospital", hospitalSchema);
export default Hospital;
