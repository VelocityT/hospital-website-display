import Hospital from "../models/hospital.js";

export const generateCustomId = async (hospitalId, type) => {
  const prefixField = type === "staff" ? "staffPrefix" : "patientPrefix";
  const counterField = type === "staff" ? "staffCounter" : "patientCounter";

  const updatedHospital = await Hospital.findOneAndUpdate(
    { _id: hospitalId },
    { $inc: { [counterField]: 1 } },
    { new: true }
  ).lean();

  if (!updatedHospital) throw new Error("Hospital not found");

  const prefix = updatedHospital[prefixField] || "";
  const paddedCount = String(updatedHospital[counterField]).padStart(3, "0");

  return `${prefix}-${paddedCount}`;
};
export const generateBillNumber = async (hospitalId) => {
  const updatedHospital = await Hospital.findOneAndUpdate(
    { _id: hospitalId },
    { $inc: { billCounter: 1 } },
    { new: true }
  ).lean();

  if (!updatedHospital) throw new Error("Hospital not found");

  const paddedCount = String(updatedHospital.billCounter).padStart(6, "0");

  return paddedCount;
};
