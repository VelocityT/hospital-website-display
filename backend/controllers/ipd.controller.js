import mongoose from "mongoose";
import Bed from "../models/bed.js";
import Ipd from "../models/ipd.js";
import { addOnlyDateStage, extractArray } from "../utils/helper.js";
import dayjs from "dayjs";

// Admin-only negotiated per-admission doctor rate (Ipd.doctorChargeOverride).
// This is what the HOSPITAL pays the doctor for this admission — it never
// affects what the patient is billed (see pay.controller.js /
// dischargePatient, both of which always use the doctor's standard
// ipdCharge). Any non-admin value is silently dropped rather than rejected:
// the edit form doesn't show this field to non-admins, so a non-admin value
// here would only come from bypassing the UI.
const resolveDoctorChargeOverride = (raw, role) => {
  if (role !== "admin" || raw === undefined || raw === "" || raw === null) {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export const getAllIpdPatients = async (req, res) => {
  try {
    const { hospital, role, _id } = req.authority;
    const {
      page = 1,
      pageSize = 20,
      filterMode = "date",
      startDate,
      endDate,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const pipeline = [
      {
        $match: { hospital: new mongoose.Types.ObjectId(hospital) },
      },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },
      {
        $lookup: {
          from: "users",
          localField: "attendingDoctor",
          foreignField: "_id",
          as: "attendingDoctor",
        },
      },
      {
        $unwind: { path: "$attendingDoctor", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "users",
          localField: "attendingNurse",
          foreignField: "_id",
          as: "attendingNurse",
        },
      },
      {
        $unwind: { path: "$attendingNurse", preserveNullAndEmptyArrays: true },
      },
    ];

    if (filterMode === "date" && startDate && endDate) {
      pipeline.push({
        $match: {
          admissionDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      });
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");

      const searchMatch = {
        $or: [
          { "patient.fullName": regex },
          { "patient.contact.phone": regex },
          { ipdNumber: regex },
        ],
      };

      if (role === "doctor") {
        pipeline.push({
          $match: {
            $and: [
              { "attendingDoctor._id": new mongoose.Types.ObjectId(_id) },
              searchMatch,
            ],
          },
        });
      } else if (role === "nurse") {
        pipeline.push({
          $match: {
            $and: [
              { "attendingNurse._id": new mongoose.Types.ObjectId(_id) },
              searchMatch,
            ],
          },
        });
      } else {
        pipeline.push({ $match: searchMatch });
      }
    } else if (role === "doctor") {
      pipeline.push({
        $match: {
          "attendingDoctor._id": new mongoose.Types.ObjectId(_id),
        },
      });
    } else if (role === "nurse") {
      pipeline.push({
        $match: {
          "attendingNurse._id": new mongoose.Types.ObjectId(_id),
        },
      });
    }

    pipeline.push(
      { $sort: { admissionDate: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          ipdNumber: 1,
          admissionDate: 1,
          status: 1,
          attendingDoctor: {
            _id: "$attendingDoctor._id",
            fullName: "$attendingDoctor.fullName",
          },
          attendingNurse: {
            _id: "$attendingNurse._id",
            fullName: "$attendingNurse.fullName",
          },
          patient: {
            _id: "$patient._id",
            fullName: "$patient.fullName",
            gender: "$patient.gender",
            dob: "$patient.dob",
            bloodGroup: "$patient.bloodGroup",
            patientId: "$patient.patientId",
            contact: {
              phone: "$patient.contact.phone",
            },
          },
        },
      }
    );

    const ipdPatients = await Ipd.aggregate(pipeline);

    const pipelineForCount = pipeline.filter(
      (stage) => !("$skip" in stage || "$limit" in stage || "$sort" in stage)
    );
    const totalCount = await Ipd.aggregate([
      ...pipelineForCount,
      { $count: "count" },
    ]);

    res.status(200).json({
      success: true,
      message: "IPD patients fetched successfully",
      data: ipdPatients,
      total: totalCount[0]?.count || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch IPD patients",
      error: error.message,
    });
  }
};

export const updateIpdDetails = async (req, res) => {
  try {
    const { hospital, role } = req.authority;
    const { ipdId } = req.params;

    const existingIpd = await Ipd.findOne({ _id: ipdId, hospital }).populate(
      "bed"
    );
    if (!existingIpd) {
      return res.status(404).json({
        success: false,
        message: "IPD record not found",
      });
    }

    const newBedId = req.body.IPD?.bed;
    const oldBedId = existingIpd.bed?._id?.toString();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (oldBedId) {
        await Bed.findOneAndUpdate(
          { _id: oldBedId, hospital },
          { status: "Available", patient: null, bedType:"General" },
          { session }
        );
      }

      await Bed.findOneAndUpdate(
        { _id: newBedId, hospital },
        { status: "Occupied", patient: existingIpd.patient, bedType:req.body?.IPD?.bedType },
        { session }
      );

    const updateData = {
      attendingDoctor: req.body.IPD?.doctor || null,
      attendingNurse: req.body.IPD?.nurse || null,
      ward: req.body.IPD?.ward || "",
      bed: newBedId || oldBedId || "",
      notes: req.body.IPD?.ipdNotes || "",
      height: req.body.IPD?.height || "",
      weight: req.body.IPD?.weight || "",
      bloodPressure: req.body.IPD?.bloodPressure || "",
      symptoms: {
        symptomNames: extractArray(req.body.symptoms, "symptomNames"),
        symptomType: extractArray(req.body.symptoms, "symptomType"),
        description: req.body.symptoms?.description || "",
      },
      // Only ever touched for an admin. The edit form hides this field from
      // every other role, so their submission has no way to signal "clear
      // it" vs "never saw it" — omitting the key entirely here is what
      // stops a routine bed-change edit by reception from silently wiping
      // out a negotiated rate an admin set earlier.
      ...(role === "admin"
        ? {
            doctorChargeOverride: resolveDoctorChargeOverride(
              req.body.IPD?.doctorChargeOverride,
              role
            ),
          }
        : {}),
    };

      await Ipd.findOneAndUpdate({ _id: ipdId, hospital }, updateData, {
        new: true,
        runValidators: true,
        session,
      });

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      res.status(500).json({ success: false, message: err.message });
    }

    res.status(200).json({
      success: true,
      message: "IPD details updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update IPD details",
      error: error.message,
    });
  }
};

/**
 * Add a surgery/OT charge line to an in-progress or already-discharged IPD
 * admission. Deliberately NOT the ophthalmology module's EyeSurgery flow
 * (counseling/biometry/OT board) — this is the lightweight general-hospital
 * version: pick a doctor, name the procedure, set an amount, done. It just
 * pushes onto Ipd.surgeryCharges[]; payPatientIpdBill and dischargePatient
 * both already fold this array into the total the next time either runs.
 */
export const addSurgeryCharge = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { ipdId } = req.params;
    const { doctor, procedureName, charge, date, notes } = req.body;

    if (!procedureName || !String(procedureName).trim()) {
      return res.status(400).json({
        success: false,
        message: "Procedure name is required.",
      });
    }

    const chargeAmount = Number(charge);
    if (!Number.isFinite(chargeAmount) || chargeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Charge must be a positive amount.",
      });
    }

    const ipd = await Ipd.findOne({ _id: ipdId, hospital });
    if (!ipd) {
      return res.status(404).json({
        success: false,
        message: "IPD record not found",
      });
    }

    ipd.surgeryCharges.push({
      doctor: doctor || null,
      procedureName: String(procedureName).trim(),
      charge: chargeAmount,
      date: date ? new Date(date) : new Date(),
      notes,
    });
    await ipd.save();

    const updatedIpd = await Ipd.findOne({ _id: ipdId, hospital }).populate(
      "surgeryCharges.doctor",
      "fullName"
    );

    return res.status(200).json({
      success: true,
      message: "Surgery charge added successfully",
      data: { ipd: updatedIpd },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add surgery charge",
      error: error.message,
    });
  }
};

export const dischargePatient = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { ipdId, patientId, ...summary } = req.body;

    const ipd = await Ipd.findOne({ _id: ipdId, patient: patientId, hospital })
      .populate("attendingDoctor", "ipdCharge")
      .populate("bed", "charge")
      .populate("payment.bill");

    if (!ipd) {
      return res.status(404).json({
        success: false,
        message: "IPD record not found",
      });
    }
    if (ipd.status === "Discharged") {
      return res.status(400).json({
        success: false,
        message: "Patient is already discharged.",
      });
    }

    const daysAdmitted = Math.max(dayjs().diff(ipd.admissionDate, "day"), 1);
    // Same formula as payPatientIpdBill in pay.controller.js — the patient is
    // always charged the doctor's standard ipdCharge (doctorChargeOverride
    // is a private hospital-doctor payout arrangement and never affects what
    // the patient owes), and surgery charges count toward what has to be
    // settled before discharge. If this drifts from that formula, discharge
    // can silently under- or over-charge: skipping surgeryCharges would let
    // discharge go through with an unpaid procedure still on the bill.
    const bedCharge = (ipd.bed?.charge || 0) * daysAdmitted;
    const doctorCharge = (ipd.attendingDoctor?.ipdCharge || 0) * daysAdmitted;
    const surgeryChargesTotal = (ipd.surgeryCharges || []).reduce(
      (sum, s) => sum + (Number(s?.charge) || 0),
      0
    );
    const totalCharge = bedCharge + doctorCharge + surgeryChargesTotal;

    const paidTotal =
      ipd.payment?.bill?.reduce((sum, bill) => sum + bill.totalCharge, 0) || 0;

    if (paidTotal < totalCharge) {
      return res.status(400).json({
        success: false,
        message: "Bill payment is not fully completed.",
      });
    }

    ipd.payment.status = "Paid";
    ipd.dischargeSummary = {
      ...summary,
      dischargeDate: dayjs().toDate(),
    };
    ipd.status = "Discharged";

    const updateBedPromise = ipd.bed?._id
      ? Bed.findOneAndUpdate(
          { _id: ipd.bed._id, hospital },
          { status: "Available", patient: null, bedType: "General" },
          { new: true }
        )
      : null;

    await Promise.all([ipd.save(), updateBedPromise]);

    return res.status(200).json({
      success: true,
      message: "Patient discharged successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong during discharge",
      error: error.message,
    });
  }
};
