import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    // Unique per hospital (not globally). Enforced by the compound index
    // below so two hospitals can each have their own bill sequence.
    billNumber: {
      type: String,
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
        enum: ["Ipd", "Opd", "Pathology", "Medicine", "Optical", "Surgery"],
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

// Bill numbers are generated per hospital (see generateBillNumber), so
// uniqueness must be scoped to the hospital — otherwise different hospitals
// collide on the same padded counter (e.g. "000005").
billSchema.index({ hospital: 1, billNumber: 1 }, { unique: true });

const Bill = mongoose.model("Bill", billSchema);
export default Bill;
