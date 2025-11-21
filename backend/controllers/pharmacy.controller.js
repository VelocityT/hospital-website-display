import Medicine from "../models/medicine.js";
import MedicineSale from "../models/medicineSaleSchema.js";
import Patient from "../models/patient.js";
import { parseExcel } from "../utils/parseExcel.js";

const fieldMap = {
  Name: "name",
  Category: "category",
  Unit: "unit",
  Manufacturer: "manufacturer",
  "Received Date": "recDate",
  "Batch No.": "batch",
  "Manufacture Date": "manufactureDate",
  "Expiry Date": "expiryDate",
  Supplier: "supplier",
  "Invoice No.": "invoiceNo",
  "Invoice Date": "invoiceDate",
  "Cost Price": "costPrice",
  "Purchase Price": "purchasePrice",
  "Sell Price": "sellPrice",
  MRP: "mrp",
  Stock: "currentStock",
};

export const createAndUpdateMedicine = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { _id, ...details } = req.body;

    details.costPrice = parseFloat(details.costPrice);
    details.purchasePrice = parseFloat(details.purchasePrice);
    details.sellPrice = parseFloat(details.sellPrice);

    const requiredFields = [
      "name",
      "category",
      "unit",
      "manufacturer",
      "costPrice",
      "purchasePrice",
      "sellPrice",
      "mrp",
      "recDate",
      "expiryDate",
    ];

    for (const field of requiredFields) {
      if (!details[field] && details[field] !== 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
        });
      }
    }

    let result;

    if (_id) {
      const existing = await Medicine.findOne({ _id, hospital });
      if (!existing) {
        return res
          .status(404)
          .json({ success: false, message: "Medicine not found" });
      }

      Object.assign(existing, details);
      result = await existing.save();

      return res.status(200).json({
        success: true,
        message: "Medicine updated successfully",
        medicine: result,
      });
    } else {
      result = await Medicine.create({ ...details, hospital });

      return res.status(201).json({
        success: true,
        message: "Medicine created successfully",
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllMedicines = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { search = "", page = 1, limit = 20 } = req.query;

    const query = { hospital };
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [medicines, total] = await Promise.all([
      Medicine.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Medicine.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Medicines retrieved successfully",
      data: medicines,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve medicines",
    });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { id } = req.params;

    const medicine = await Medicine.findOne({ _id: id, hospital });
    if (!medicine) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: "Medicine not found",
      });
    }

    medicine.isDeleted = !medicine.isDeleted;
    await medicine.save();

    return res.status(200).json({
      success: true,
      code: 200,
      message: `Medicine ${
        medicine.isDeleted ? "marked as deleted" : "restored successfully"
      }`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      message: "Server error",
    });
  }
};

export const uploadMedicineExcel = async (req, res) => {
  try {
    const { hospital } = req.authority;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const rows = parseExcel(req.file.buffer, fieldMap);
    const medicineData = rows.map((row) => ({
      ...row,
      hospital,
    }));

    if (
      !medicineData ||
      medicineData.length === 0 ||
      medicineData.every((row) => Object.keys(row).length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty or improperly formatted",
      });
    }

    const savedMedicines = await Medicine.insertMany(medicineData);

    return res.status(200).json({
      success: true,
      message: `${savedMedicines.length} medicines saved successfully`,
      data: { savedMedicines },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while uploading data",
    });
  }
};
export const searchMedicine = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { name = "", forPharmacy = false } = req.query;

    const query = { hospital };

    if (name) {
      query.name = { $regex: name, $options: "i" };
      query.isDeleted = false;
    }

    const selectFields =
      forPharmacy === "true"
        ? "name category unit sellPrice currentStock"
        : "name category unit";

    const medicines = await Medicine.find(query).limit(20).select(selectFields);

    res.status(200).json({
      success: true,
      message: "Medicines fetched successfully",
      data: medicines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search medicines",
    });
  }
};
export const createMedicineOrder = async (req, res) => {
  try {
    const { medicinesList, patientData } = req.body;
    const { hospital, _id: userId } = req.authority;

    if (
      !medicinesList ||
      !Array.isArray(medicinesList) ||
      medicinesList.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No medicines provided",
      });
    }

    if (!patientData || !patientData.patientId || !patientData.patientType) {
      return res.status(400).json({
        success: false,
        message: "Incomplete patient data",
      });
    }

    // Validate stock and medicineId first
    for (const medicine of medicinesList) {
      if (!medicine.medicineId) continue; // skip if no ID

      const found = await Medicine.findById(medicine.medicineId);
      if (!found) {
        return res.status(404).json({
          success: false,
          message: `Medicine not found: ${medicine.medicine}`,
        });
      }

      if (found.currentStock < medicine.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for medicine: ${medicine.medicine}`,
        });
      }
    }

    const medicines = medicinesList.map((med) => ({
      medicineId: med.medicineId,
      name: med.medicine,
      sellPrice: med.sellPrice,
      quantity: med.quantity,
      unit: med.unit,
    }));

    const payableAmount = medicines.reduce(
      (sum, med) => sum + med.sellPrice * med.quantity,
      0
    );

    const newOrder = await MedicineSale.create({
      hospital,
      patient: patientData.patientId,
      medicines,
      payableAmount,
      generatedBy: userId,
    });

    if (newOrder) {
      for (const medicine of medicinesList) {
        if (!medicine.medicineId) continue;

        const found = await Medicine.findById(medicine.medicineId);
        if (!found) continue;

        const updatedStock = found.currentStock - medicine.quantity;
        await Medicine.findByIdAndUpdate(medicine.medicineId, {
          currentStock: updatedStock,
        });
      }
    }

    await Patient.findByIdAndUpdate(patientData.patientId, {
      $push: { medicineOrders: newOrder._id },
    });

    res.status(201).json({
      success: true,
      message: "Medicine order created successfully",
    });
  } catch (error) {
    // console.error("Error creating medicine order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create medicine order",
    });
  }
};

export const getPatientsMedicineOrders = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const {
      search = "",
      page = 1,
      limit = 20,
      filterMode,
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const regexSearch = new RegExp(search, "i");

    const matchedPatients = await Patient.find({
      hospital,
      $or: [
        { fullName: { $regex: regexSearch } },
        { patientId: { $regex: regexSearch } },
      ],
    }).select("_id");

    const patientIds = matchedPatients.map((p) => p._id);

    const query = {
      hospital,
      ...(search && { patient: { $in: patientIds } }),
    };

    if (filterMode === "date" && startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const [orders, total] = await Promise.all([
      MedicineSale.find(query)
        .populate("patient", "fullName patientId")
        .populate("payment.bill")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MedicineSale.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Patient medicine orders fetched successfully",
      data: orders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    // console.error("Error in getPatientsMedicineOrders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve patient medicine orders",
    });
  }
};

export const pharmacySales = async (req, res) => {
  try {
    const hospital = req.authority.hospital;
    const { filterMode, date, search = "", page = 1, limit = 10 } = req.query;

    const matchStage = { hospital };

    if (filterMode === "date" && date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      matchStage.createdAt = { $gte: start, $lt: end };
    }

    const pipeline = [
      { $match: matchStage },
      { $unwind: "$medicines" },
      { $match: { "medicines.medicineId": { $ne: null } } },
      {
        $group: {
          _id: "$medicines.medicineId",
          name: { $first: "$medicines.name" },
          totalQuantitySold: { $sum: "$medicines.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$medicines.sellPrice", "$medicines.quantity"],
            },
          },
          sellPrice: { $first: "$medicines.sellPrice" },
        },
      },
      {
        $lookup: {
          from: "medicines",
          localField: "_id",
          foreignField: "_id",
          as: "medicineDetails",
        },
      },
      { $unwind: "$medicineDetails" },
      {
        $addFields: {
          purchasePrice: "$medicineDetails.purchasePrice",
          profit: {
            $multiply: [
              {
                $subtract: [
                  "$sellPrice",
                  { $ifNull: ["$medicineDetails.purchasePrice", 0] },
                ],
              },
              "$totalQuantitySold",
            ],
          },
        },
      },
      {
        $project: {
          medicineId: "$_id",
          name: 1,
          totalQuantitySold: 1,
          sellPrice: 1,
          purchasePrice: 1,
          totalRevenue: 1,
          profit: 1,
        },
      },
      {
        $match: {
          name: { $regex: search, $options: "i" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      {
        $facet: {
          data: [
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await MedicineSale.aggregate(pipeline);
    const sales = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json({
      success: true,
      data: sales,
      total,
      message: "Sales fetched",
    });
  } catch (error) {
    // console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pharmacy sales",
    });
  }
};
