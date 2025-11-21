import mongoose from "mongoose";
import Opd from "../models/opd.js";
import { addOnlyDateStage, extractArray } from "../utils/helper.js";
import dayjs from "dayjs";

export const getAllOpdPatients = async (req, res) => {
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
    const baseMatch = { hospital: new mongoose.Types.ObjectId(hospital) };

    const pipeline = [
      { $match: baseMatch },
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
          localField: "doctor",
          foreignField: "_id",
          as: "doctor",
        },
      },

      {
        $unwind: {
          path: "$doctor",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (filterMode === "date" && startDate && endDate) {
      pipeline.push({
        $match: {
          visitDateTime: {
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
          { opdNumber: regex },
        ],
      };

      if (role === "doctor") {
        pipeline.push({
          $match: {
            $and: [{ doctor: new mongoose.Types.ObjectId(_id) }, searchMatch],
          },
        });
      } else {
        pipeline.push({ $match: searchMatch });
      }
    }

    pipeline.push(
      { $sort: { visitDateTime: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          opdNumber: 1,
          doctor: 1,
          visitDateTime: 1,
          patient: {
            _id: "$patient._id",
            fullName: 1,
            gender: 1,
            dob: 1,
            contact: { phone: 1 },
            bloodGroup: 1,
            patientId: 1,
          },
        },
      }
    );

    const totalCount = await Opd.aggregate([
      ...pipeline.slice(
        0,
        pipeline.findIndex((p) => p.$sort || p.$skip || p.$limit)
      ),
      { $count: "count" },
    ]);

    const data = await Opd.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      data,
      total: totalCount[0]?.count || 0,
      message: "All OPD patients fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch OPD patients",
      error: error.message,
    });
  }
};

export const updateOpdDetails = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { opdId } = req.params;

    const updateData = {
      doctor: req.body.OPD?.doctor || null,
      notes: req.body.OPD?.opdNotes || "",
      symptoms: {
        symptomNames: extractArray(req.body.symptoms, "symptomNames"),
        symptomType: extractArray(req.body.symptoms, "symptomType"),
        description: req.body.symptoms?.description || "",
      },
    };

    await Opd.findOneAndUpdate({ _id: opdId, hospital }, updateData, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      success: true,
      message: "OPD details updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update OPD details",
      error: error.message,
    });
  }
};
