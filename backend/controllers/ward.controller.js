import mongoose from "mongoose";
import Bed from "../models/bed.js";
import Ipd from "../models/ipd.js";
import Ward from "../models/ward.js";
import WardTypeConfig from "../models/wardType.js";

export const createOrUpdateWardTypes = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { wardTypesArr } = req.body;

    if (!Array.isArray(wardTypesArr) || wardTypesArr.length === 0) {
      return res
        .status(400)
        .json({ message: "wardTypesArr must be a non-empty array." });
    }

    const newTypes = wardTypesArr.map((t) => t.trim()).filter(Boolean);

    let config = await WardTypeConfig.findOne({ hospital });

    if (config) {
      const existingTypes = config.types.map((t) => t.trim());
      const mergedTypes = Array.from(new Set([...existingTypes, ...newTypes]));

      config.types = mergedTypes;
      await config.save();

      return res.status(200).json({
        message: "Ward types updated successfully.",
        data: config.types,
      });
    }

    config = await WardTypeConfig.create({
      hospital,
      types: newTypes,
    });

    res.status(201).json({
      message: "Ward types created successfully.",
      data: config.types,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getAllWardTypes = async (req, res) => {
  try {
    const { hospital } = req.authority;

    const config = await WardTypeConfig.findOne({ hospital });

    if (!config) {
      return res.status(404).json({
        message: "No ward type config found for this admin.",
        data: null,
      });
    }

    res.status(200).json({
      message: "Ward types fetched successfully.",
      data: config.types,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const createAndUpdateWard = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { wardId, type, ...rest } = req.body;

    if (!type || typeof type !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Ward type is required." });
    }

    const trimmedType = type.trim().toLowerCase();

    const config = await WardTypeConfig.findOne({ hospital });
    if (!config || !Array.isArray(config.types)) {
      return res.status(400).json({
        success: false,
        message: "Ward types not configured for this admin.",
      });
    }

    const allowedTypes = config.types.map((t) => t.trim().toLowerCase());
    if (!allowedTypes.includes(trimmedType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ward type. Allowed types: ${allowedTypes.join(", ")}`,
      });
    }

    if (wardId) {
      const updated = await Ward.findOneAndUpdate(
        { _id: wardId, hospital },
        { ...rest, type: type.trim() },
        { new: true }
      );

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Ward not found or unauthorized." });
      }

      return res.status(200).json({
        success: true,
        ward: updated,
        message: "Ward updated successfully.",
      });
    }

    const ward = await Ward.create({
      ...rest,
      type: type.trim(),
      hospital,
    });

    return res
      .status(201)
      .json({ success: true, ward, message: "Ward created successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWard = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const updated = await Ward.findOneAndUpdate(
      { _id: req.params.id, hospital },
      req.body,
      {
        new: true,
      }
    );
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Ward not found" });
    }
    res.json({ success: true, ward: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllWards = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { search = "", page = 1, limit = 20 } = req.query;

    const query = { hospital };
    if (search && search.length > 0) {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [wards, total] = await Promise.all([
      Ward.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ward.countDocuments(query),
    ]);

    const enrichedWards = await Promise.all(
      wards.map(async (ward) => {
        const beds = await Bed.find({ hospital, ward: ward._id }).sort({
          createdAt: 1,
        });
        return {
          ...ward.toObject(),
          beds,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedWards,
      count: total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch wards.",
      error: error.message,
    });
  }
};

export const createBeds = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { count, ward, charge } = req.body;

    if (!ward || !count || count < 1) {
      return res.status(400).json({
        success: false,
        message: "Ward ID and valid bed count are required.",
      });
    }

    const wardData = await Ward.findOne({ _id: ward, hospital });
    if (!wardData) {
      return res.status(404).json({
        success: false,
        message: "Ward not found.",
      });
    }

    const existingBedsCount = await Bed.countDocuments({ hospital, ward });

    const newBeds = [];

    for (let i = 1; i <= count; i++) {
      const bedNumber = String(existingBedsCount + i);
      newBeds.push({
        hospital,
        bedNumber,
        ward,
        charge,
      });
    }

    const createdBeds = await Bed.insertMany(newBeds);

    const populatedBeds = await Bed.find({
      _id: { $in: createdBeds.map((b) => b._id) },
      hospital,
    }).populate("ward", "name type floor");

    res.status(201).json({
      success: true,
      message: `${createdBeds.length} bed(s) created successfully.`,
      data: populatedBeds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create beds.",
      error: error.message,
    });
  }
};

export const getBedsByWardId = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { wardId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!wardId) {
      return res.status(400).json({
        success: false,
        message: "Ward ID is required.",
      });
    }
    const ward = await Ward.findOne({ _id: wardId, hospital });

    const bedQuery = { hospital, ward: wardId };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [beds, total] = await Promise.all([
      Bed.find(bedQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: "ward",
          select: "name type floor",
        })
        .populate({
          path: "patient",
          select: "fullName patientId",
        }),
      Bed.countDocuments(bedQuery),
    ]);

    res.status(200).json({
      success: true,
      data: { ward, beds },
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      count: beds.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch beds.",
      error: error.message,
    });
  }
};
export const deleteWard = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const wardId = req.params.id;

    const ward = await Ward.findOne({ _id: wardId, hospital });
    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Ward not found or not authorized.",
      });
    }

    const occupiedBed = await Bed.findOne({
      ward: wardId,
      hospital,
      status: "Occupied",
    });

    if (occupiedBed) {
      return res.status(400).json({
        success: false,
        message: "Some Beds are occupied in this Ward",
      });
    }

    await Bed.deleteMany({ ward: wardId, hospital });

    await Ward.findOneAndDelete({ _id: wardId, hospital });

    return res.status(200).json({
      success: true,
      message: "Ward and associated beds deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete ward.",
      error: error.message,
    });
  }
};
export const deleteLastBed = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { wardId } = req.params;

    if (!wardId) {
      return res
        .status(400)
        .json({ success: false, message: "Ward ID is required." });
    }

    const [lastBed] = await Bed.aggregate([
      { $match: { ward: new mongoose.Types.ObjectId(wardId), hospital } },
      {
        $addFields: {
          bedNumberNumeric: { $toInt: "$bedNumber" },
        },
      },
      { $sort: { bedNumberNumeric: -1 } },
      { $limit: 1 },
    ]);

    if (!lastBed) {
      return res
        .status(404)
        .json({ success: false, message: "No beds found in this ward." });
    }

    if (lastBed.status === "Occupied") {
      return res.status(400).json({
        success: false,
        message: `Cannot delete bed ${lastBed.bedNumber} because it is occupied.`,
      });
    }

    const deleted = await Bed.findOneAndDelete({ _id: lastBed._id, hospital });

    res.status(200).json({
      success: true,
      message: `Bed ${deleted.bedNumber} deleted successfully.`,
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete last bed.",
      error: error.message,
    });
  }
};

export const getAvailableWardsAndBeds = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { isEdit, ipdId } = req.query;

    const wards = await Ward.find({ isActive: true, hospital }).sort({
      name: 1,
    });

    let patientBed = null;
    if (isEdit && ipdId) {
      const ipd = await Ipd.findOne({ _id: ipdId, hospital })
        .select("bed")
        .populate("bed", "bedNumber charge ward");
      patientBed = ipd?.bed || null;
    }

    const result = await Promise.all(
      wards.map(async (ward) => {
        let beds = await Bed.find({
          hospital,
          ward: ward._id,
          status: "Available",
        })
          .select("bedNumber charge status")
          .sort({ bedNumber: 1 });

        if (
          isEdit &&
          patientBed &&
          String(patientBed.ward) === String(ward._id) &&
          !beds.some((b) => String(b._id) === String(patientBed._id))
        ) {
          beds = [patientBed, ...beds];
        }

        return {
          _id: ward._id,
          name: ward.name,
          floor: ward.floor,
          type: ward.type,
          beds,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch wards and beds",
      error: err.message,
    });
  }
};
export const changeBedStatus = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { bedId, status } = req.body;

    if (!bedId || !status) {
      return res
        .status(400)
        .json({ success: false, message: "bedId and status are required" });
    }

    if (!["Available", "Maintenance"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const updatedBed = await Bed.findOneAndUpdate(
      { _id: bedId, hospital },
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedBed) {
      return res.status(404).json({ success: false, message: "Bed not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Bed status updated to ${status}`,
      data: updatedBed,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
