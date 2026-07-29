import Bill from "../models/bill.js";
import EyeSurgery from "../models/eyeSurgery.js";
import {
  generateBillNumber,
  generateSequenceNumber,
} from "../utils/generateCustomId.js";

// Per-hospital surgery number (SUR-00001). generateSequenceNumber verifies the
// candidate is free for THIS hospital, so a drifted counter can't cause E11000.
const generateSurgeryNumber = (hospitalId) =>
  generateSequenceNumber(
    hospitalId,
    "surgeryCounter",
    "SUR",
    "eyesurgeries",
    "surgeryNumber"
  );

// POST /eye-surgery  (create — usually from doctor "advise surgery")
export const createEyeSurgery = async (req, res) => {
  try {
    const { hospital, _id: userId } = req.authority;
    const { patient, eyeExam, opd, ipd, surgeryType, eye, counseling } =
      req.body;

    if (!patient || !surgeryType || !eye) {
      return res.status(400).json({
        success: false,
        message: "Patient, surgery type and eye are required",
      });
    }

    const surgeryNumber = await generateSurgeryNumber(hospital);

    const surgery = await EyeSurgery.create({
      hospital,
      surgeryNumber,
      patient,
      eyeExam,
      opd,
      ipd,
      surgeryType,
      eye,
      counseling,
      createdBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Surgery advice recorded",
      data: surgery,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create surgery record",
      error: error.message,
    });
  }
};

// PUT /eye-surgery/:id  (counseling / biometry / scheduling / completion)
export const updateEyeSurgery = async (req, res) => {
  try {
    const { hospital, _id: userId } = req.authority;
    const { id } = req.params;
    const {
      counseling,
      biometry,
      surgeon,
      otDate,
      status,
      operativeNotes,
      followUpDate,
      collectAmount = 0,
      paymentMethod,
    } = req.body;

    const surgery = await EyeSurgery.findOne({ _id: id, hospital });
    if (!surgery) {
      return res
        .status(404)
        .json({ success: false, message: "Surgery record not found" });
    }

    if (counseling) {
      surgery.counseling = {
        ...surgery.counseling,
        ...counseling,
        counseledBy: userId,
        counseledAt: new Date(),
      };
      if (surgery.status === "Advised") surgery.status = "Counseled";
    }
    if (biometry) {
      surgery.biometry = { ...surgery.biometry, ...biometry };
    }
    if (surgeon) surgery.surgeon = surgeon;
    if (otDate) {
      surgery.otDate = otDate;
      if (["Advised", "Counseled"].includes(surgery.status)) {
        surgery.status = "Scheduled";
      }
    }
    if (status) surgery.status = status;
    if (operativeNotes !== undefined) surgery.operativeNotes = operativeNotes;
    if (followUpDate) surgery.followUpDate = followUpDate;

    // ---- Payment collection against the surgery package ----
    // Mirrors the Ipd/Opd/Pathology/Medicine billing concept: each payment
    // creates its own Bill (installment) so we keep a full history with dates,
    // per-payment amounts and the running balance. Status becomes Paid only
    // when the collected total reaches the package cost.
    if (collectAmount > 0) {
      const tax = Number(req.body.tax) || 0;
      const discount = Number(req.body.discount) || 0;

      const packageCost =
        surgery.counseling?.selectedPackage?.price ||
        surgery.counseling?.estimatedCost ||
        0;

      // Sum what has already been collected across previous installments.
      const existingBillIds = Array.isArray(surgery.payment?.bill)
        ? surgery.payment.bill
        : surgery.payment?.bill
        ? [surgery.payment.bill]
        : [];
      const existingBills = existingBillIds.length
        ? await Bill.find({ _id: { $in: existingBillIds } }).lean()
        : [];
      const alreadyPaid = existingBills.reduce(
        (sum, b) => sum + (b.totalCharge || 0),
        0
      );

      const newPaidTotal = alreadyPaid + collectAmount;
      // Balance left after this installment (never negative).
      const balanceAfter = packageCost
        ? Math.max(packageCost - newPaidTotal, 0)
        : 0;

      const billNumber = await generateBillNumber(hospital);
      const bill = await Bill.create({
        hospital,
        billNumber,
        patient: surgery.patient,
        entry: {
          entryId: surgery._id,
          checkId: surgery.surgeryNumber,
          type: "Surgery",
        },
        totalCharge: collectAmount, // amount collected in THIS installment
        tax,
        discount,
        paidAmount: collectAmount + tax - discount,
        payableAmount: balanceAfter, // remaining balance after this payment
        paymentMethod: paymentMethod || "Cash",
      });

      surgery.payment.bill = [...existingBillIds, bill._id];
      surgery.payment.paidAmount = newPaidTotal;
      surgery.payment.status =
        packageCost > 0 && newPaidTotal >= packageCost
          ? "Paid"
          : newPaidTotal > 0
          ? "Partial"
          : "Unpaid";
    }

    await surgery.save();

    const updatedSurgery = await EyeSurgery.findById(surgery._id)
      .populate("patient", "patientId fullName")
      .populate("surgeon", "fullName specialist")
      .populate("counseling.counseledBy", "fullName")
      .populate("payment.bill")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Surgery record updated",
      data: updatedSurgery,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update surgery record",
      error: error.message,
    });
  }
};

// GET /eye-surgery/list
export const getEyeSurgeries = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { status, surgeonId, from, to, page = 1, limit = 20 } = req.query;

    const query = { hospital };
    if (status) query.status = status;
    if (surgeonId) query.surgeon = surgeonId;
    if (from || to) {
      query.otDate = {};
      if (from) query.otDate.$gte = new Date(from);
      if (to) query.otDate.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [surgeries, total] = await Promise.all([
      EyeSurgery.find(query)
        .populate("patient", "patientId fullName dob gender contact")
        .populate("surgeon", "fullName specialist")
        .populate("counseling.counseledBy", "fullName")
        .populate("payment.bill")
        .sort({ otDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      EyeSurgery.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: surgeries,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch surgeries",
      error: error.message,
    });
  }
};

// GET /eye-surgery/:id
export const getEyeSurgeryById = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { id } = req.params;

    const surgery = await EyeSurgery.findOne({ _id: id, hospital })
      .populate("patient", "patientId fullName dob gender bloodGroup contact")
      .populate("surgeon", "fullName specialist")
      .populate("eyeExam")
      .lean();

    if (!surgery) {
      return res
        .status(404)
        .json({ success: false, message: "Surgery record not found" });
    }

    return res.status(200).json({ success: true, data: surgery });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch surgery record",
      error: error.message,
    });
  }
};
