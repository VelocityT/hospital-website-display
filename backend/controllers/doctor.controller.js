import Ipd from "../models/ipd.js";
import Opd from "../models/opd.js";
import StaffPayment from "../models/staffPayment.js";
import User from "../models/user.js";

export const payDoctorCommission = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { ipdId, opdId, amount, staffId } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    if (!ipdId && !opdId) {
      return res
        .status(400)
        .json({ success: false, message: "IPD or OPD ID is required" });
    }

    const paymentEntry = {
      amount,
      paidAt: new Date(),
    };

    let updated;
    let paymentContext = "";

    if (ipdId) {
      const ipd = await Ipd.findOne({ _id: ipdId, hospital }).select(
        "-payment"
      );
      if (!ipd) {
        return res.status(404).json({
          success: false,
          message: "IPD entry not found",
        });
      }

      updated = await Ipd.findOneAndUpdate(
        { _id: ipdId, hospital },
        { $push: { doctorPayment: paymentEntry } },
        { new: true }
      )
        .select(
          "ipdNumber status patient bed ward doctorPayment attendingDoctor"
        )
        .populate({ path: "patient", select: "fullName" })
        .populate({ path: "bed", select: "bedNumber -_id" })
        .populate({ path: "ward", select: "name floor -_id" })
        .lean();

      paymentContext = `Commission for IPD #${updated.ipdNumber}`;
    }

    if (opdId) {
      const opd = await Opd.findOne({ _id: opdId, hospital }).select(
        "-payment"
      );
      if (!opd) {
        return res.status(404).json({
          success: false,
          message: "OPD entry not found",
        });
      }

      updated = await Opd.findOneAndUpdate(
        { _id: opdId, hospital },
        { $push: { doctorPayment: paymentEntry } },
        { new: true }
      )
        .select("opdNumber visitDateTime doctorPayment doctor")
        .populate({ path: "patient", select: "fullName -_id" })
        .lean();

      paymentContext = `Commission for OPD #${updated.opdNumber}`;
    }

    if (staffId) {
      const staffDoc = await User.findOne({ _id: staffId, hospital }).select(
        "fullName role staffId hospital"
      );

      if (staffDoc) {
        const staffPayment = new StaffPayment({
          staff: staffId,
          hospital,
          paymentType: "Doctor Commission",
          amount,
          paymentDate: new Date(),
          notes: paymentContext,
          role: staffDoc.role,
          salaryMonth: null,
          month: null,
        });

        await staffPayment.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Commission of ₹${amount} paid successfully.`,
      updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error during doctor commission payment",
    });
  }
};

export const getDoctorCases = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { doctorId } = req.params;
    const { page = 1, limit = 10, type } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (type === "ipd") {
      const filter = { attendingDoctor: doctorId, hospital };

      const [ipds, total] = await Promise.all([
        Ipd.find(filter)
          .select(
            "ipdNumber status patient bed ward doctorPayment admissionDate dischargeSummary"
          )
          .populate({ path: "patient", select: "fullName" })
          .populate({ path: "bed", select: "bedNumber -_id" })
          .populate({ path: "ward", select: "name floor -_id" })
          .sort({ admissionDate: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Ipd.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: ipds,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    }

    if (type === "opd") {
      const filter = { doctor: doctorId, hospital };

      const [opds, total] = await Promise.all([
        Opd.find(filter)
          .select("opdNumber visitDateTime doctorPayment patient")
          .populate({ path: "patient", select: "fullName -_id" })
          .sort({ visitDateTime: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Opd.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: opds,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid type. Must be 'ipd' or 'opd'.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor records",
    });
  }
};
