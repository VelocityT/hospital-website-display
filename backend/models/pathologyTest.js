import mongoose from "mongoose";

const pathologyTestSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    testCode: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    charge: {
      type: Number,
      required: true,
      min: 0,
    },
    sampleType: {
      type: String,
      trim: true,
    },
    tests: [
      {
        name: { type: String, required: true },
        unit: { type: String, trim: true },
        normalRange: { type: String, trim: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const PathologyTest = mongoose.model("PathologyTest", pathologyTestSchema);
export default PathologyTest;
