import Hospital from "../models/hospital.js";
import mongoose from "mongoose";

/**
 * Safety net for every counter-based ID.
 *
 * All IDs (patientId, staffId, billNumber, OPT-xxxxx, SUR-xxxxx) come from a
 * PER-HOSPITAL counter. If a counter ever drifts behind reality — a restored
 * backup, a manual DB edit, a failed insert, a bulk import — the next generated
 * value would collide with an existing document and the whole request fails
 * (E11000). This checks the candidate value against the collection and keeps
 * incrementing the counter until it finds a free one.
 *
 * @param {String} collectionName  e.g. "bills", "patients"
 * @param {String} field           e.g. "billNumber", "patientId"
 * @param {ObjectId} hospitalId
 * @param {String} value           candidate value
 * @returns {Boolean} true if the value is free for this hospital
 */
const isFree = async (collectionName, field, hospitalId, value) => {
  const existing = await mongoose.connection
    .collection(collectionName)
    .findOne({ hospital: hospitalId, [field]: value }, { projection: { _id: 1 } });
  return !existing;
};

export const generateCustomId = async (hospitalId, type) => {
  const prefixField = type === "staff" ? "staffPrefix" : "patientPrefix";
  const counterField = type === "staff" ? "staffCounter" : "patientCounter";

  const collectionName = type === "staff" ? "users" : "patients";
  const field = type === "staff" ? "staffId" : "patientId";

  // Retry a bounded number of times in case the counter has drifted behind
  // the data (see isFree above). Normal path resolves on the first attempt.
  for (let attempt = 0; attempt < 50; attempt++) {
    const updatedHospital = await Hospital.findOneAndUpdate(
      { _id: hospitalId },
      { $inc: { [counterField]: 1 } },
      { new: true }
    ).lean();

    if (!updatedHospital) throw new Error("Hospital not found");

    const prefix = updatedHospital[prefixField] || "";
    const paddedCount = String(updatedHospital[counterField]).padStart(3, "0");
    const candidate = `${prefix}-${paddedCount}`;

    if (await isFree(collectionName, field, hospitalId, candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not generate a unique ${field} after 50 attempts. ` +
      `Check the ${counterField} on this hospital.`
  );
};
export const generateBillNumber = async (hospitalId) => {
  for (let attempt = 0; attempt < 50; attempt++) {
    const updatedHospital = await Hospital.findOneAndUpdate(
      { _id: hospitalId },
      { $inc: { billCounter: 1 } },
      { new: true }
    ).lean();

    if (!updatedHospital) throw new Error("Hospital not found");

    const candidate = String(updatedHospital.billCounter).padStart(6, "0");

    if (await isFree("bills", "billNumber", hospitalId, candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Could not generate a unique billNumber after 50 attempts. " +
      "Check billCounter on this hospital."
  );
};

/**
 * Generic per-hospital sequence generator for module-specific numbers
 * (optical orders, surgeries, and any future module).
 *
 * @param {ObjectId} hospitalId
 * @param {String} counterField  field on Hospital, e.g. "opticalCounter"
 * @param {String} prefix        e.g. "OPT"
 * @param {String} collectionName e.g. "opticalorders"
 * @param {String} field         e.g. "orderNumber"
 * @param {Number} pad           digits to pad to
 */
export const generateSequenceNumber = async (
  hospitalId,
  counterField,
  prefix,
  collectionName,
  field,
  pad = 5
) => {
  for (let attempt = 0; attempt < 50; attempt++) {
    const updatedHospital = await Hospital.findOneAndUpdate(
      { _id: hospitalId },
      { $inc: { [counterField]: 1 } },
      { new: true }
    ).lean();

    if (!updatedHospital) throw new Error("Hospital not found");

    const candidate = `${prefix}-${String(updatedHospital[counterField]).padStart(
      pad,
      "0"
    )}`;

    if (await isFree(collectionName, field, hospitalId, candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not generate a unique ${field} after 50 attempts. ` +
      `Check ${counterField} on this hospital.`
  );
};
