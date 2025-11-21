import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: false,
    },
    recDate: {
      type: Date,
      required: true,
    },
    batch: {
      type: String,
      required: false,
    },
    manufactureDate: {
      type: Date,
      required: false,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    supplier: {
      type: String,
      required: false,
    },
    invoiceNo: {
      type: String,
      required: false,
    },
    invoiceDate: {
      type: Date,
      required: false,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      required: true,
    },
    currentStock: {
      type: Number,
      required: false,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Medicine = mongoose.model("Medicine", medicineSchema);
export default Medicine;
