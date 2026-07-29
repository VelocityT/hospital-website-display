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

    const getEntry = await Ipd.findOne({
      hospital,
      _id: payload?.entry?.entryId,
      ipdNumber: payload?.entry?.checkId,
    })
      .populate("attendingDoctor", "ipdCharge")
      .populate("bed", "charge")
      .populate("payment.bill");

    if (!getEntry) {
      return res.status(404).json({
        success: false,
        message: "IPD entry not found or invalid type.",
      });
    }

    const admissionDate = dayjs(getEntry.admissionDate);
    const dischargeDate = dayjs(getEntry.dischargeSummary?.dischargeDate);
    const days = calculateStayDays(admissionDate, dischargeDate);

    const bedCharge = (getEntry.bed?.charge || 0) * days;
    const doctorCharge = (getEntry.attendingDoctor?.ipdCharge || 0) * days;
    const totalAmountFromDb = bedCharge + doctorCharge;

    const paidAmount = amountPaying + tax - discount;
    const totalChargePaid = getEntry?.payment?.bill.reduce(
      (sum, bill) => sum + (bill?.totalCharge || 0),
      0
    );

    // Never allow collecting more than what is actually outstanding.
    // The UI already caps this, but the API must enforce it independently —
    // otherwise a stale tab or a direct API call produces a negative balance.
    const remainingBalance = totalAmountFromDb - totalChargePaid;

    if (remainingBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "This IPD bill is already fully paid. Nothing is pending.",
      });
    }

    if (amountPaying > remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds the pending balance of ₹${remainingBalance}.`,
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
          "payment.status":
            doesFullPaymentDone === totalAmountFromDb && getEntry?.dischargeDate
              ? "Paid"
              : "Pending",
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

    const billNumber = await generateBillNumber(hospital);

    const newTotalAmount = getEntry?.doctor?.opdCharge + tax - discount;

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
