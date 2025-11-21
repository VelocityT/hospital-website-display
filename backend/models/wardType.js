import mongoose from "mongoose";

const wardTypeConfigSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  types: {
    type: [String],
    default: ["General", "Private", "ICU", "Semi-Private", "Emergency"],
    trim: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const WardTypeConfig = mongoose.model("WardTypeConfig", wardTypeConfigSchema);
export default WardTypeConfig;
