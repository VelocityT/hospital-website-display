import mongoose from "mongoose";

// Frames / lenses / contact lenses stock — mirrors medicine.js pattern
const opticalItemSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    itemType: {
      type: String,
      enum: ["Frame", "Lens", "Contact Lens", "Sunglasses", "Accessory"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    size: { type: String, trim: true }, // frame size / lens dia
    color: { type: String, trim: true },
    supplier: { type: String },
    invoiceNo: { type: String },
    invoiceDate: { type: Date },
    recDate: { type: Date },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: { type: Number },
    currentStock: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

opticalItemSchema.index({ hospital: 1, itemType: 1, name: 1 });

const OpticalItem = mongoose.model("OpticalItem", opticalItemSchema);
export default OpticalItem;
