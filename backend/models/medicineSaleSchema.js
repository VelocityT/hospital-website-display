import mongoose from "mongoose";

const medicineSaleSchema = new mongoose.Schema(
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
    medicines: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine",
          required: false,
        },
        _id: false,
        name: { type: String, required: true },
        sellPrice: { type: Number, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String },
      },
    ],
    payableAmount: {
      type: Number,
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payment: {
      status: {
        type: String,
        enum: ["Paid", "Unpaid"],
        default: "Unpaid",
      },
      bill: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Bill",
        },
      ],
    },
  },
  { timestamps: true }
);

const MedicineSale = mongoose.model("MedicineSale", medicineSaleSchema);
export default MedicineSale;
