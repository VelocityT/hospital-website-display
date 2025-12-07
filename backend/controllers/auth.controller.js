import User from "../models/user.js";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import bcrypt from "bcrypt";
import Opd from "../models/opd.js";
import Ipd from "../models/ipd.js";
import Patient from "../models/patient.js";
import Bill from "../models/bill.js";
import Hospital from "../models/hospital.js";
import { addOnlyDateStage, hashPassword } from "../utils/helper.js";
import { generateCustomId } from "../utils/generateCustomId.js";
import MedicineSale from "../models/medicineSaleSchema.js";
import Medicine from "../models/medicine.js";
import PathologyTest from "../models/pathologyTest.js";
import pathologyTestReport from "../models/pathologyTestReport.js";

export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (role !== "superAdmin") {
      const hospital = await Hospital.findById(user.hospital).lean();
      if (!hospital || hospital.isDeleted) {
        return res.status(401).json({
          success: false,
          message: "This hospital no longer exist",
        });
      } else if (!hospital || hospital.isDisabled) {
        return res.status(401).json({
          success: false,
          message: "Access to this hospital is not allowed",
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const payload = {
      _id: user._id,
      email: user.email,
      role: user.role,
      hospital: user.hospital || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET , {
      expiresIn: "1d",
    });

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        ...userData,
        hospital:
          role === "superAdmin"
            ? null
            : await Hospital.findById(user.hospital).lean(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const getDashboardStatsData = async (req, res) => {
  try {
    const { role, hospital, _id: authorityId } = req.authority;

    const todayDateStr = dayjs().format("YYYY-MM-DD");

    if (role === "admin") {
      const [
        ipdsTodayAgg,
        opdsTodayAgg,
        patientsTodayAgg,
        ipdsTotal,
        ipdsActive,
        opdsTotal,
        totalPatients,
        doctors,
        receptionists,
        pharmacists,
        nurses,
        admins,
      ] = await Promise.all([
        Ipd.aggregate([
          addOnlyDateStage("admissionDate"),
          { $match: { hospital, onlyDate: todayDateStr } },
          { $count: "count" },
        ]),
        Opd.aggregate([
          addOnlyDateStage("visitDateTime"),
          { $match: { hospital, onlyDate: todayDateStr } },
          { $count: "count" },
        ]),
        Patient.aggregate([
          addOnlyDateStage("createdAt"),
          { $match: { hospital, onlyDate: todayDateStr } },
          { $count: "count" },
        ]),
        Ipd.countDocuments({ hospital }),
        Ipd.countDocuments({ hospital, status: "Admitted" }),
        Opd.countDocuments({ hospital }),
        Patient.countDocuments({ hospital }),
        User.countDocuments({ hospital, role: "doctor" }),
        User.countDocuments({ hospital, role: "receptionist" }),
        User.countDocuments({ hospital, role: "pharmacist" }),
        User.countDocuments({ hospital, role: "nurse" }),
        User.countDocuments({ hospital, role: "admins" }),
      ]);

      const ipdsToday = ipdsTodayAgg[0]?.count || 0;
      const opdsToday = opdsTodayAgg[0]?.count || 0;
      const todayPatients = patientsTodayAgg[0]?.count || 0;

      return res.status(200).json({
        success: true,
        message: "Admin dashboard stats fetched successfully.",
        data: {
          newPatients: {
            ipdsToday,
            opdsToday,
            ipdsTotal,
            opdsTotal,
            ipdsActive,
            todayPatients,
            totalPatients,
          },
          staffs: {
            doctors,
            receptionists,
            pharmacists,
            nurses,
            admins,
          },
        },
      });
    } else if (role === "pharmacist") {
      const [
        medicineSalesTodayAgg,
        medicineSalesTotalAgg,
        totalMedicines,
        lowStockMedicines,
      ] = await Promise.all([
        MedicineSale.aggregate([
          addOnlyDateStage("createdAt"),
          { $match: { hospital, onlyDate: todayDateStr } },
          { $count: "count" },
        ]),
        MedicineSale.countDocuments({ hospital }),
        Medicine.countDocuments({ hospital, isDeleted: false }),
        Medicine.find({ hospital, isDeleted: false })
          .sort({ currentStock: 1 })
          .limit(10)
          .select("name currentStock category"),
      ]);

      const medicineSalesToday = medicineSalesTodayAgg[0]?.count || 0;

      return res.status(200).json({
        success: true,
        message: "Pharmacist dashboard stats fetched successfully.",
        data: {
          medicineOrders: {
            today: medicineSalesToday,
            total: medicineSalesTotalAgg,
          },
          stock: {
            totalMedicines,
            lowStock: lowStockMedicines,
          },
        },
      });
    } else if (role === "pathologist") {
      const [
        pathologyTestsTodayAgg,
        pathologyTestsTotalAgg,
        totalTestsAvailable,
      ] = await Promise.all([
        pathologyTestReport.aggregate([
          addOnlyDateStage("createdAt"),
          { $match: { hospital, onlyDate: todayDateStr } },
          { $count: "count" },
        ]),
        pathologyTestReport.countDocuments({ hospital }),
        PathologyTest.countDocuments({ hospital, isDeleted: false }),
      ]);

      const pathologyTestsToday = pathologyTestsTodayAgg[0]?.count || 0;

      return res.status(200).json({
        success: true,
        message: "Pathologist dashboard stats fetched successfully.",
        data: {
          testReports: {
            today: pathologyTestsToday,
            total: pathologyTestsTotalAgg,
          },
          tests: {
            totalAvailable: totalTestsAvailable,
          },
        },
      });
    } else if (role === "receptionist") {
      const [
        ipdsTodayAgg,
        opdsTodayAgg,
        patientsTodayAgg,
        ipdsTotal,
        ipdsActive,
        opdsTotal,
        totalPatients,
      ] = await Promise.all([
        Ipd.aggregate([
          addOnlyDateStage("admissionDate"),
          { $match: { hospital, onlyDate: todayDateStr } },
          { $count: "count" },
        ]),
        Opd.aggregate([
          addOnlyDateStage("visitDateTime"),
          { $match: { hospital, onlyDate: todayDateStr } },
          { $count: "count" },
        ]),
        Patient.aggregate([
          addOnlyDateStage("createdAt"),
          { $match: { hospital, onlyDate: todayDateStr } },
          { $count: "count" },
        ]),
        Ipd.countDocuments({ hospital }),
        Ipd.countDocuments({ hospital, status: "Admitted" }),
        Opd.countDocuments({ hospital }),
        Patient.countDocuments({ hospital }),
      ]);

      const ipdsToday = ipdsTodayAgg[0]?.count || 0;
      const opdsToday = opdsTodayAgg[0]?.count || 0;
      const todayPatients = patientsTodayAgg[0]?.count || 0;

      return res.status(200).json({
        success: true,
        message: "Receptionist dashboard stats fetched successfully.",
        data: {
          newPatients: {
            ipdsToday,
            opdsToday,
            ipdsTotal,
            opdsTotal,
            ipdsActive,
            todayPatients,
            totalPatients,
          },
        },
      });
    } else if (role === "superAdmin") {
      const hospitals = await Hospital.find({ createdBy: authorityId })
        .select("fullName email phone isDisabled")
        .lean();

      const hospitalStats = await Promise.all(
        hospitals.map(async ({ _id, fullName }) => {
          const [staffCount, patientCount] = await Promise.all([
            User.countDocuments({ hospital: _id }),
            Patient.countDocuments({ hospital: _id }),
          ]);
          return { _id, name: fullName, staffCount, patientCount };
        })
      );

      const stats = {
        total: hospitals.length,
        active: hospitals.filter((h) => !h.isDisabled).length,
        inactive: hospitals.filter((h) => h.isDisabled).length,
      };

      return res.status(200).json({
        success: true,
        message: "SuperAdmin dashboard data fetched.",
        data: {
          hospitals,
          hospitalStats,
          stats,
        },
      });
    } else if (role === "doctor") {
      const [ipdsTodayAgg, opdsTodayAgg, ipdsTotal, opdsTotal] =
        await Promise.all([
          Ipd.aggregate([
            addOnlyDateStage("admissionDate"),
            {
              $match: {
                hospital,
                attendingDoctor: authorityId,
                onlyDate: todayDateStr,
              },
            },
            { $count: "count" },
          ]),
          Opd.aggregate([
            addOnlyDateStage("visitDateTime"),
            {
              $match: {
                hospital,
                doctor: authorityId,
                onlyDate: todayDateStr,
              },
            },
            { $count: "count" },
          ]),
          Ipd.countDocuments({ hospital, attendingDoctor: authorityId }),
          Opd.countDocuments({ hospital, doctor: authorityId }),
        ]);

      const ipdsToday = ipdsTodayAgg[0]?.count || 0;
      const opdsToday = opdsTodayAgg[0]?.count || 0;

      return res.status(200).json({
        success: true,
        message: "Doctor dashboard stats fetched successfully.",
        data: {
          newPatients: {
            ipdsToday,
            opdsToday,
            ipdsTotal,
            opdsTotal,
          },
        },
      });
    } else if (role === "nurse") {
      const [ipdsTodayAgg, ipdsTotal] = await Promise.all([
        Ipd.aggregate([
          addOnlyDateStage("admissionDate"),
          {
            $match: {
              hospital,
              attendingNurse: authorityId,
              onlyDate: todayDateStr,
            },
          },
          { $count: "count" },
        ]),
        Ipd.countDocuments({ hospital, attendingNurse: authorityId }),
      ]);

      const ipdsToday = ipdsTodayAgg[0]?.count || 0;

      return res.status(200).json({
        success: true,
        message: "Nurse dashboard stats fetched successfully.",
        data: {
          newPatients: {
            ipdsToday,
            ipdsTotal,
          },
        },
      });
    }

    return res.status(403).json({
      success: false,
      message: "You are not authorized to access this dashboard data.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

export const getIncomeOverview = async (req, res) => {
  try {
    const { hospital, _id, role } = req.authority;
    const {
      incomeSource,
      filterMode = "date",
      selectedDate,
      search = "",
      page = 1,
      limit = 10,
    } = req.query;

    if (!incomeSource) {
      return res.status(400).json({
        success: false,
        message: "Missing income source",
      });
    }

    const user = await User.findOne({ _id, hospital }).select("role");
    if (!user || user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access: user not valid",
      });
    }

    if (user.role === "admin") {
      const matchQuery = {
        hospital,
        "entry.type": incomeSource === "Pharmacy" ? "Medicine" : incomeSource,
      };

      const pipeline = [];

      if (filterMode === "date" && selectedDate) {
        const selectedDateStr = dayjs(selectedDate).format("YYYY-MM-DD");

        pipeline.push(addOnlyDateStage("createdAt", "onlyDate"), {
          $match: {
            ...matchQuery,
            onlyDate: selectedDateStr,
          },
        });
      } else {
        pipeline.push({ $match: matchQuery });
      }

      pipeline.push(
        {
          $group: {
            _id: "$patient",
            totalCharge: { $sum: "$totalCharge" },
            tax: { $sum: "$tax" },
            discount: { $sum: "$discount" },
            paidAmount: { $sum: "$paidAmount" },
          },
        },
        {
          $lookup: {
            from: "patients",
            localField: "_id",
            foreignField: "_id",
            as: "patient",
          },
        },
        { $unwind: "$patient" },
        {
          $project: {
            _id: 0,
            patientId: "$patient.patientId",
            fullName: "$patient.fullName",
            totalCharge: 1,
            tax: 1,
            discount: 1,
            paidAmount: 1,
          },
        }
      );

      if (search && search.length > 0) {
        pipeline.push({
          $match: {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { patientId: { $regex: search, $options: "i" } },
            ],
          },
        });
      }

      pipeline.push(
        { $sort: { fullName: 1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      );

      const countPipeline = pipeline.slice(0, -3);
      countPipeline.push({ $count: "total" });

      const [incomeData, totalCountArr] = await Promise.all([
        Bill.aggregate(pipeline),
        Bill.aggregate(countPipeline),
      ]);
      const total = totalCountArr[0]?.total || 0;

      return res.status(200).json({
        success: true,
        data: incomeData,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        message: `Income overview for ${incomeSource}`,
      });
    }
    if (user.role === "doctor") {
      const doctorId = _id;
      const matchCommon = {
        hospital,
        doctorPayment: { $exists: true, $ne: [] },
      };

      const dateMatch = {};
      if (filterMode === "date" && selectedDate) {
        const selected = dayjs(selectedDate).startOf("day").toDate();
        const end = dayjs(selectedDate).endOf("day").toDate();
        dateMatch["doctorPayment.paidAt"] = { $gte: selected, $lte: end };
      }

      const basePipeline = (doctorField, collection) => [
        {
          $match: {
            ...matchCommon,
            [doctorField]: doctorId,
            ...(Object.keys(dateMatch).length ? dateMatch : {}),
          },
        },
        { $unwind: "$doctorPayment" },
        ...(Object.keys(dateMatch).length ? [{ $match: dateMatch }] : []),
        {
          $group: {
            _id: "$patient",
            totalDoctorIncome: { $sum: "$doctorPayment.amount" },
          },
        },
        {
          $lookup: {
            from: "patients",
            localField: "_id",
            foreignField: "_id",
            as: "patient",
          },
        },
        { $unwind: "$patient" },
        {
          $project: {
            _id: 0,
            patientId: "$patient.patientId",
            fullName: "$patient.fullName",
            paidAmount: "$totalDoctorIncome",
          },
        },
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { fullName: { $regex: search, $options: "i" } },
                    { patientId: { $regex: search, $options: "i" } },
                  ],
                },
              },
            ]
          : []),
        { $sort: { fullName: 1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) },
      ];

      const countPipeline = (doctorField) => [
        {
          $match: {
            ...matchCommon,
            [doctorField]: doctorId,
            ...(Object.keys(dateMatch).length ? dateMatch : {}),
          },
        },
        { $unwind: "$doctorPayment" },
        ...(Object.keys(dateMatch).length ? [{ $match: dateMatch }] : []),
        {
          $group: {
            _id: "$patient",
          },
        },
        { $count: "total" },
      ];

      let data = [];
      let total = 0;

      if (incomeSource === "Ipd") {
        const [ipdData, ipdCountArr] = await Promise.all([
          Ipd.aggregate(basePipeline("attendingDoctor", Ipd)),
          Ipd.aggregate(countPipeline("attendingDoctor")),
        ]);
        data = ipdData;
        total = ipdCountArr[0]?.total || 0;
      } else if (incomeSource === "Opd") {
        const [opdData, opdCountArr] = await Promise.all([
          Opd.aggregate(basePipeline("doctor", Opd)),
          Opd.aggregate(countPipeline("doctor")),
        ]);
        data = opdData;
        total = opdCountArr[0]?.total || 0;
      } else {
        const [ipdData, opdData, ipdCountArr, opdCountArr] = await Promise.all([
          Ipd.aggregate(basePipeline("attendingDoctor", Ipd)),
          Opd.aggregate(basePipeline("doctor", Opd)),
          Ipd.aggregate(countPipeline("attendingDoctor")),
          Opd.aggregate(countPipeline("doctor")),
        ]);
        data = [...ipdData, ...opdData];
        total = (ipdCountArr[0]?.total || 0) + (opdCountArr[0]?.total || 0);
      }

      return res.status(200).json({
        success: true,
        data,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        message: "Doctor income overview calculated from doctor payments",
      });
    }

    const dummyIncome = {
      Ipd: 12000,
      Opd: 8000,
      Pharmacy: 5000,
      Pathology: 4000,
    };

    if (incomeSource in dummyIncome) {
      return res.status(200).json({
        success: true,
        data: {
          [incomeSource]: dummyIncome[incomeSource],
        },
        message: `Income data for ${incomeSource}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: dummyIncome,
      message: "Income overview fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch income overview",
      error: error.message,
    });
  }
};

export const createOrUpdateHospital = async (req, res) => {
  try {
    const {
      adminFullName,
      adminEmail,
      adminPassword,
      adminPhone,
      fullName,
      address,
      phone,
      email,
      website,
      hospitalId,
      isDisabled,
      staffPrefix,
      patientPrefix,
      isDeleted,
      ...modules
    } = JSON.parse(req.body.hospitalInfo);

    const logo = req.file;
    const createdBy = req.authority?._id;
    const editMode = req.body.editMode === "true";

    if (editMode && hospitalId) {
      const existingHospital = await Hospital.findById(hospitalId);
      if (!existingHospital) {
        return res
          .status(404)
          .json({ success: false, message: "Hospital not found" });
      }

      const updateData = {
        fullName,
        address,
        phone,
        email,
        website,
        modules,
        isDisabled,
        isDeleted,
        staffPrefix,
        patientPrefix,
      };

      await Hospital.findByIdAndUpdate(hospitalId, updateData, { new: true });

      return res.status(200).json({
        success: true,
        message: "Hospital updated successfully",
      });
    }

    const existingHospital = await Hospital.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingHospital) {
      return res.status(400).json({
        success: false,
        message: "Hospital with this email or phone already exists",
      });
    }

    const hashedPassword = await hashPassword(adminPassword);

    const newHospital = await Hospital.create({
      fullName,
      address,
      phone,
      email,
      website,
      modules,
      createdBy,
      isDisabled,
      isDeleted,
      staffPrefix,
      patientPrefix,
    });

    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { phone: adminPhone }],
    });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email or phone already exists",
      });
    }

    const staffId = await generateCustomId(newHospital._id, "staff");
    const newAdmin = await User.create({
      staffId,
      fullName: adminFullName,
      email: adminEmail,
      password: hashedPassword,
      phone: adminPhone,
      role: "admin",
      hospital: newHospital._id,
    });

    newHospital.admins.push(newAdmin._id);
    await newHospital.save();

    return res.status(201).json({
      success: true,
      message: "Hospital and admin created successfully",
      hospitalId: newHospital._id,
      adminId: newAdmin._id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getHospitalList = async (req, res) => {
  try {
    const _id = req.authority?._id;

    const superAdmin = await User.findOne({
      _id,
      role: "superAdmin",
    });
    if (!superAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only super admins can view hospitals.",
      });
    }

    const hospitalsList = await Hospital.find({ createdBy: _id });

    return res.status(200).json({
      success: true,
      hospitals: hospitalsList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const getHospitalById = async (req, res) => {
  try {
    const hospitalId = req.params.id;

    const hospital = await Hospital.findById(hospitalId).populate(
      "admins",
      "fullName email phone staffId"
    );

    if (!hospital) {
      return res
        .status(404)
        .json({ success: false, message: "Hospital not found" });
    }

    return res.status(200).json({ success: true, hospital });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const impersonateUser = async (req, res) => {
  try {
    const { _id } = req.authority;
    const { userId } = req.params;

    const superAdmin =await User.findById(_id).lean();
    if (superAdmin.role !== "superAdmin") {
      return res.status(401).json({
        success: false,
        message:
          "Access denied. You do not have permission to access this resource.",
      });
    }
    const targetUser = await User.findById(userId).select("-password");
    const hospitalStatus = await Hospital.findById(targetUser?.hospital);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found for impersonation.",
      });
    }
    const impersonatedBy = req.authority?._id;
    const token = jwt.sign(
      {
        _id: targetUser._id,
        role: targetUser.role,
        email: targetUser.email,
        hospital: targetUser?.hospital || null,
        impersonatedBy,
      },
      process.env.JWT_SECRET || "ijf9348yuq",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      token,
      message: `Now impersonating ${targetUser.fullName}`,
      user: { targetUser, impersonatedBy },
      hospital: hospitalStatus,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const leaveImpersonation = async (req, res) => {
  try {
    const originalUserId = req.authority?.impersonatedBy;

    if (!originalUserId) {
      return res.status(400).json({
        success: false,
        message: "Not impersonating any user.",
      });
    }

    const originalUser = await User.findById(originalUserId).select(
      "-password"
    );
    if (!originalUser) {
      return res.status(404).json({
        success: false,
        message: "Original user not found.",
      });
    }

    const token = jwt.sign(
      { _id: originalUser._id, role: originalUser.role },
      process.env.JWT_SECRET || "ijf9348yuq",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      token,
      message: "Returned to original user.",
      user: originalUser,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
