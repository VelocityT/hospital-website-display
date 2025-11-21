import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    billNumber: {
      type: String,
      unique: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    entry: {
      entryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "enteries.type",
      },
      checkId: String,
      type: {
        type: String,
        enum: ["Ipd", "Opd", "Pathology", "Medicine"],
        required: true,
      },
    },
    totalCharge: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    payableAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Insurance"],
    },
  },
  {
    timestamps: true,
  }
);

const Bill = mongoose.model("Bill", billSchema);
export default Bill;
