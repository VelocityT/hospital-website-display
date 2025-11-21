import mongoose from "mongoose";
import Bed from "../models/bed.js";
import Ipd from "../models/ipd.js";
import { addOnlyDateStage, extractArray } from "../utils/helper.js";
import dayjs from "dayjs";

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
    const { hospital } = req.authority;
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
    const bedCharge = (ipd.bed?.charge || 0) * daysAdmitted;
    const doctorCharge = (ipd.attendingDoctor?.ipdCharge || 0) * daysAdmitted;
    const totalCharge = bedCharge + doctorCharge;

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
