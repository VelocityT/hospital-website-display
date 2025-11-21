import mongoose from "mongoose";

const pathologyTestReportSchema = new mongoose.Schema(
  {
    patientType: {
      type: String,
      enum: ["Ipd", "Opd"],
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    ipd: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "patientType",
    },
    opd: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "patientType",
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PathologyTest",
      required: true,
    },
    results: [
      {
        _id: false,
        name: { type: String },
        result: { type: String },
        unit: { type: String },
        normalRange: { type: String },
      },
    ],
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: {
      type: String,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    payableAmount: {
      type: Number,
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

export default mongoose.model("PathologyTestReport", pathologyTestReportSchema);
