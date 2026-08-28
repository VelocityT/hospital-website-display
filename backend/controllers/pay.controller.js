import dayjs from "dayjs";
import Ipd from "../models/ipd.js";
import Opd from "../models/opd.js";
import Bill from "../models/bill.js";
import { generateBillNumber } from "../utils/generateCustomId.js";
import pathologyTestReport from "../models/pathologyTestReport.js";
import MedicineSale from "../models/medicineSaleSchema.js";
import { calculateStayDays } from "../utils/helper.js";

export const payPatientIpdBill = async (req, res) => {
  try {
    const { hospital, role } = req.authority;
    const payload = req.body;
    const tax = payload?.tax || 0;
    const discount = payload?.discount || 0;
    const amountPaying = payload?.amountPaying;

    if (!amountPaying || amountPaying < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount. Must be at least ₹1.",
      });
    }

    const getEntry = await Ipd.findOne({
      hospital,
      _id: payload?.entry?.entryId,
      ipdNumber: payload?.entry?.checkId,
    })
      .populate("attendingDoctor", "ipdCharge fullName")
      .populate("bed", "charge")
      .populate("payment.bill");

    if (!getEntry) {
      return res.status(404).json({
        success: false,
        message: "IPD entry not found or invalid type.",
      });
    }

    // A negotiated rate for THIS admission, if one was agreed — only admin
    // can set it (it changes what the doctor is paid, not just what the
    // patient owes), and only when a real value is sent. `null` explicitly
    // clears a previous negotiation back to the doctor's normal ipdCharge;
    // `undefined`/absent leaves whatever is already on the record untouched.
    const wantsOverrideChange =
      role === "admin" && Object.prototype.hasOwnProperty.call(
        payload,
        "doctorChargeOverride"
      );
    if (wantsOverrideChange) {
      const raw = payload.doctorChargeOverride;
      getEntry.doctorChargeOverride =
        raw === null || raw === "" ? null : Math.max(Number(raw) || 0, 0);
    }

    const admissionDate = dayjs(getEntry.admissionDate);
    const dischargeDate = dayjs(getEntry.dischargeSummary?.dischargeDate);
    const days = calculateStayDays(admissionDate, dischargeDate);

    // Negotiated rate wins over the doctor's default when one is set for
    // this admission. Falls back to the normal ipdCharge otherwise — this
    // is the ONLY place that matters, everything downstream (bill, balance,
    // commission) already reads doctorCharge/doctorRate from here.
    const doctorRate =
      getEntry.doctorChargeOverride ?? getEntry.attendingDoctor?.ipdCharge ?? 0;
    const bedCharge = (getEntry.bed?.charge || 0) * days;
    const doctorCharge = doctorRate * days;
    const surgeryChargesTotal = (getEntry.surgeryCharges || []).reduce(
      (sum, s) => sum + (Number(s?.charge) || 0),
      0
    );
    const totalAmountFromDb = bedCharge + doctorCharge + surgeryChargesTotal;

    const paidAmount = amountPaying + tax - discount;
    const totalChargePaid = getEntry?.payment?.bill.reduce(
      (sum, bill) => sum + (bill?.totalCharge || 0),
      0
    );

    // Never allow collecting more than what is actually outstanding.
    // The UI already caps this, but the API must enforce it independently —
    // otherwise a stale tab or a direct API call produces a negative balance.
    const remainingBalance = totalAmountFromDb - totalChargePaid;

    // On rejection, return the authoritative figures. The client uses these to
    // correct what it is showing instead of leaving a stale "To be paid" on
    // screen that the API will never accept.
    const balanceSnapshot = {
      days,
      totalAmount: totalAmountFromDb,
      paidAmount: totalChargePaid,
      remainingBalance,
    };

    if (remainingBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "This IPD bill is already fully paid. Nothing is pending.",
        data: balanceSnapshot,
      });
    }

    if (amountPaying > remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds the pending balance of ₹${remainingBalance}.`,
        data: balanceSnapshot,
      });
    }

    const doesFullPaymentDone = totalChargePaid + amountPaying;

    const billNumber = await generateBillNumber(hospital);

    const billData = {
      billNumber,
      hospital,
      patient: getEntry?.patient,
      entry: {
        type: "Ipd",
        entryId: getEntry?._id,
        checkId: getEntry?.ipdNumber,
      },
      paidAmount,
      payableAmount: totalAmountFromDb - totalChargePaid - amountPaying,
      totalCharge: amountPaying,
      tax,
      discount,
      paymentMethod: payload?.paymentMethod,
    };

    const newBill = await Bill.create(billData);

    await Ipd.findOneAndUpdate(
      { _id: getEntry._id, hospital },
      {
        $set: {
          // NOTE: the discharge date lives on dischargeSummary — reading
          // `getEntry.dischargeDate` (which does not exist on the schema) made
          // this condition always false, so an IPD bill could never reach
          // "Paid" and the Pay button never turned into a Paid tag.
          // An admitted patient's bill still grows every midnight, so we only
          // settle the record once the patient is actually discharged.
          "payment.status":
            doesFullPaymentDone >= totalAmountFromDb &&
            getEntry?.dischargeSummary?.dischargeDate
              ? "Paid"
              : "Pending",
          // Only touched when an admin actually sent a change this call —
          // otherwise this would silently overwrite an existing negotiated
          // rate with null on every ordinary payment.
          ...(wantsOverrideChange
            ? { doctorChargeOverride: getEntry.doctorChargeOverride }
            : {}),
        },
        $push: {
          "payment.bill": newBill._id,
        },
      }
    );

    const updatedIpd = await Ipd.findOne({ _id: getEntry._id, hospital })
      .populate("attendingDoctor", "ipdCharge fullName")
      .populate("bed", "charge")
      .populate("payment.bill");

    return res.status(200).json({
      success: true,
      message: "Payment recorded successfully.",
      data: { updatedIpd },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update payment details",
      error: error.message,
    });
  }
};

export const payPatientOpdBill = async (req, res) => {
  try {
    const { hospital, role } = req.authority;
    const payload = req.body;

    const tax = payload?.tax || 0;
    const discount = payload?.discount || 0;
    const amountPaying = payload?.amountPaying;

    if (!amountPaying || amountPaying < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount. Must be at least ₹1.",
      });
    }

    const getEntry = await Opd.findOne({
      hospital,
      _id: payload?.entry?.entryId,
      opdNumber: payload?.entry?.checkId,
    }).populate("doctor", "opdCharge");

    if (!getEntry) {
      return res.status(404).json({
        success: false,
        message: "OPD entry not found or invalid type.",
      });
    }

    // Same negotiated-rate mechanism as the IPD flow above — admin only,
    // only touched when a value is actually sent this call.
    const wantsOverrideChange =
      role === "admin" && Object.prototype.hasOwnProperty.call(
        payload,
        "doctorChargeOverride"
      );
    if (wantsOverrideChange) {
      const raw = payload.doctorChargeOverride;
      getEntry.doctorChargeOverride =
        raw === null || raw === "" ? null : Math.max(Number(raw) || 0, 0);
    }

    const billNumber = await generateBillNumber(hospital);

    const doctorRate =
      getEntry.doctorChargeOverride ?? getEntry?.doctor?.opdCharge ?? 0;
    const newTotalAmount = doctorRate + tax - discount;

    const billData = {
      billNumber,
      hospital,
      patient: getEntry?.patient,
      entry: {
        type: "Opd",
        entryId: getEntry?._id,
        checkId: getEntry?.opdNumber,
      },
      totalCharge: amountPaying,
      tax,
      discount,
      paidAmount: newTotalAmount,
      payableAmount: 0,
      paymentMethod: payload?.paymentMethod,
    };

    const newBill = await Bill.create(billData);

    await Opd.findOneAndUpdate(
      { _id: getEntry._id, hospital },
      {
        $set: {
          "payment.status": "Paid",
          ...(wantsOverrideChange
            ? { doctorChargeOverride: getEntry.doctorChargeOverride }
            : {}),
        },
        $push: {
          "payment.bill": newBill._id,
        },
      }
    );

    const updatedOpd = await Opd.findOne({ _id: getEntry._id, hospital })
      .populate("doctor", "fullName role opdCharge")
      .populate("payment.bill");

    return res.status(200).json({
      success: true,
      message: "Payment recorded successfully.",
      data: {
        updatedOpd,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update payment details",
      error: error.message,
    });
  }
};
export const payPatientPathologyReportBill = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const payload = req.body;

    const tax = payload?.tax || 0;
    const discount = payload?.discount || 0;
    const amountPaying = payload?.amountPaying;

    if (!amountPaying || amountPaying < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount. Must be at least ₹1.",
      });
    }

    const report = await pathologyTestReport
      .findOne({
        hospital,
        _id: payload?.entry?.entryId,
      })
      .populate("test");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Pathology test report not found.",
      });
    }

    const billNumber = await generateBillNumber(hospital);
    const totalCharge = report?.payableAmount + tax - discount;

    const billData = {
      billNumber,
      hospital,
      patient: report?.patient,
      entry: {
        type: "Pathology",
        entryId: report?._id,
        checkId: report?.test?.testCode || "",
      },
      totalCharge: amountPaying,
      tax,
      discount,
      paidAmount: totalCharge,
      payableAmount: 0,
      paymentMethod: payload?.paymentMethod,
    };

    const newBill = await Bill.create(billData);

    await pathologyTestReport.findByIdAndUpdate(report._id, {
      $set: { "payment.status": "Paid" },
      $push: { "payment.bill": newBill._id },
    });

    const updatedReport = await pathologyTestReport
      .findOne({ _id: report._id, hospital })
      .populate("test")
      .populate("payment.bill")
      .populate("reportedBy", "fullName role");
    return res.status(200).json({
      success: true,
      message: "Pathology bill paid successfully.",
      data: {
        updatedReport,
      },
    });
  } catch (error) {
    // console.error("Error in payPatientPathologyReportBill:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update pathology payment details",
      error: error.message,
    });
  }
};
export const payPatientMedicineBill = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const payload = req.body;

    const tax = payload?.tax || 0;
    const discount = payload?.discount || 0;
    const amountPaying = +payload?.amountPaying;

    if (!amountPaying || amountPaying < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount. Must be at least ₹1.",
      });
    }

    const order = await MedicineSale.findOne({
      hospital,
      _id: payload?.entry?.entryId,
    }).populate("medicines payment.bill");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Medicine order not found.",
      });
    }

    // Guard against overpayment (same reasoning as the IPD flow above).
    const medicineAlreadyPaid = (order?.payment?.bill || []).reduce(
      (sum, b) => sum + (b?.paidAmount || 0),
      0
    );
    const medicineRemaining = +(
      (order?.payableAmount || 0) - medicineAlreadyPaid
    ).toFixed(2);

    if (medicineRemaining <= 0) {
      return res.status(400).json({
        success: false,
        message: "This medicine order is already fully paid. Nothing is pending.",
      });
    }

    if (amountPaying > medicineRemaining) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds the pending balance of ₹${medicineRemaining}.`,
      });
    }

    const billNumber = await generateBillNumber(hospital);
    const totalCharge = parseFloat(amountPaying.toFixed(2));

    const billData = {
      billNumber,
      hospital,
      patient: order?.patient,
      entry: {
        type: "Medicine",
        entryId: order?._id,
        checkId: payload?.entry?.checkId || "-",
      },
      totalCharge,
      tax,
      discount,
      paidAmount: totalCharge - discount + tax,
      payableAmount: (
        order?.payableAmount -
        order.payment.bill?.reduce((sum, b) => sum + (b.paidAmount || 0), 0) -
        amountPaying
      ).toFixed(2),
      paymentMethod: payload?.paymentMethod,
    };

    const newBill = await Bill.create(billData);
    const paymentStatus =
      amountPaying +
        order.payment.bill?.reduce((sum, b) => sum + (b.paidAmount || 0), 0) <
      order?.payableAmount
        ? "Unpaid"
        : "Paid";

    await MedicineSale.findByIdAndUpdate(order._id, {
      $set: { "payment.status": paymentStatus },
      $push: { "payment.bill": newBill._id },
    });

    const updatedOrder = await MedicineSale.findOne({
      _id: order._id,
      hospital,
    })
      .populate("medicines")
      .populate("generatedBy", "fullName role")
      .populate("payment.bill");

    return res.status(200).json({
      success: true,
      message: "Medicine bill paid successfully.",
      data: {
        updatedOrder,
      },
    });
  } catch (error) {
    // console.error("Error in payPatientMedicineBill:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update medicine payment details",
      error: error.message,
    });
  }
};
