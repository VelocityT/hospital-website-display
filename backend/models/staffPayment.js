import mongoose from "mongoose";

const staffPaymentSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        "admin",
        "doctor",
        "nurse",
        "receptionist",
        "pharmacist",
        "superAdmin",
        "pathologist",
      ],
    },
    month: { type: String },
    paymentType: {
      type: String,
      required: true,
      enum: ["Monthly Salary", "Bonus", "Other Expense", "Doctor Commission"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("StaffPayment", staffPaymentSchema);
