import mongoose from "mongoose";

const rxSideSchema = {
  _id: false,
  distSph: String,
  distCyl: String,
  distAxis: String,
  nearAdd: String,
};

const opticalOrderSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    orderNumber: { type: String, unique: true, required: true },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    eyeExam: { type: mongoose.Schema.Types.ObjectId, ref: "EyeExam" },
    opd: String,

    // Rx snapshot at order time (kept even if exam later edited)
    rx: {
      rightEye: rxSideSchema,
      leftEye: rxSideSchema,
      pd: String,
      lensType: String,
    },

    items: [
      {
        _id: false,
        item: { type: mongoose.Schema.Types.ObjectId, ref: "OpticalItem" },
        name: { type: String, required: true },
        itemType: String,
        quantity: { type: Number, default: 1, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],

    totalAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["Ordered", "Lab", "Ready", "Delivered", "Cancelled"],
      default: "Ordered",
    },
    expectedDelivery: Date,
    deliveredAt: Date,

    payment: {
      status: {
        type: String,
        enum: ["Paid", "Partial", "Unpaid"],
        default: "Unpaid",
      },
      bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" },
    },

    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

opticalOrderSchema.index({ hospital: 1, status: 1, createdAt: -1 });

const OpticalOrder = mongoose.model("OpticalOrder", opticalOrderSchema);
export default OpticalOrder;
