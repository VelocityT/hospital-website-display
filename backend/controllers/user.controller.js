import Bill from "../models/bill.js";
import Hospital from "../models/hospital.js";
import Ipd from "../models/ipd.js";
import Opd from "../models/opd.js";
import StaffPayment from "../models/staffPayment.js";
import pathologyTestReport from "../models/pathologyTestReport.js";
import User from "../models/user.js";
import { generateCustomId } from "../utils/generateCustomId.js";
import { addOnlyDateStage, hashPassword } from "../utils/helper.js";
import { getUserIncome } from "../services/incomeService.js";

export const registerOrUpdateUser = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const photo = req.file;
    const userData = req.body;

    // This endpoint receives multipart/form-data, so every value arrives as a
    // string. Normalise the salary fields before they reach Mongoose:
    // "" cannot be cast to Boolean or Number and would throw a CastError.
    if ("isSalaried" in userData) {
      userData.isSalaried =
        userData.isSalaried === true || userData.isSalaried === "true";
    }
    // Every Number field on the schema. This endpoint receives
    // multipart/form-data, so an untouched or hidden input arrives as the empty
    // string — and Mongoose cannot cast "" to Number, it throws a CastError and
    // the whole save fails with a generic 500.
    //
    // Deleting the key (rather than coercing to 0) is deliberate: it lets the
    // schema default apply on create and leaves the stored value untouched on
    // edit. Coercing to 0 would silently wipe a doctor's commission the first
    // time someone saved the form with that section collapsed.
    //
    // A real 0 is preserved — it is a legitimate value (free consultation,
    // salaried doctor on no commission) and must survive to the database.
    const NUMERIC_FIELDS = [
      "ipdCharge",
      "opdCharge",
      "ipdCommission",
      "opdCommission",
      "monthlySalary",
      "prescriptionValidityDays",
    ];
    for (const field of NUMERIC_FIELDS) {
      const value = userData[field];
      if (value === "" || value === null || value === undefined) {
        delete userData[field];
      } else if (Number.isNaN(Number(value))) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a number`,
        });
      }
    }

    if (userData.edit === "true" && userData?._id) {
      const { _id, edit, password, ...rest } = userData;

      const updatedUser = await User.findOneAndUpdate(
        { _id, hospital },
        { ...rest },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found for update",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
      });
    }

    const staffId = await generateCustomId(hospital, "staff");
    const newUser = await User.create({
      staffId,
      ...userData,
      hospital,
      password: await hashPassword(userData.password),
      ...(photo && { profilePhoto: `/uploads/${photo.filename}` }),
    });
    if (newUser.role === "admin") {
      await Hospital.findByIdAndUpdate(hospital, {
        $push: { admins: newUser._id },
      });
    }

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      const fieldLabels = {
        email: "Email",
        phone: "Phone Number",
        panNumber: "PAN Number",
        aadharNumber: "Aadhar Number",
      };

      return res.status(400).json({
        success: false,
        message: `${
          fieldLabels[duplicateField] || duplicateField
        } already exists`,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const userType = req.query.userType;
    const { search = "", page = 1, limit = 20 } = req.query;

    const query = { hospital };
    if (userType) {
      query.role = userType;
    }
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};
export const getAllStaff = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const {
      search = "",
      role = "",
      gender = "",
      page = 1,
      limit = 20,
    } = req.query;

    const query = { hospital };
    if (role) {
      query.role = role;
    }
    if (gender) {
      query.gender = gender;
    }
    query.$or = [
      { staffId: { $regex: search, $options: "i" } },
      { fullName: { $regex: search, $options: "i" } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [response, total] = await Promise.all([
      User.find(query)
        .select("fullName role staffId gender department")
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: response,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { hospital, role, _id: authorityId } = req.authority;
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    let user;
    if (role === "superAdmin") {
      user = await User.findOne({ _id: id }).select("-password");
    } else {
      user = await User.findOne({ _id: id, hospital }).select("-password");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const payments = await StaffPayment.find({
      staff: user?._id,
      paymentType: { $ne: "Doctor Commission" },
    });
    return res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      data: {
        user,
        payments,
      },
    });
  } catch (error) {;
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

export const getStaffForAssign = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { staffType } = req.query;

    if (!staffType) {
      return res.status(400).json({
        success: false,
        message: "Staff type is required (e.g., doctor, nurse)",
      });
    }

    const staff = await User.find({ hospital, role: staffType }).select(
      // prescriptionValidityDays travels with the doctor so a blank prescription
      // printed straight off a visit can show the right validity in the footer
      // without a second round trip.
      "fullName qualification specialist ipdCharge opdCharge prescriptionValidityDays"
    );

    return res.status(200).json({
      success: true,
      message: `${
        staffType.charAt(0).toUpperCase() + staffType.slice(1)
      }s fetched successfully`,
      data: staff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

export const getUserPayments = async (req, res) => {
  try {
    const { hospital, role, _id: authorityId } = req.authority;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findOne({
      _id: id,
      hospital,
    }).select(
      // isSalaried/monthlySalary are needed here: StaffProfile passes this
      // record straight into DoctorIpds/DoctorOpds, which hide the commission
      // "Pay" action for salaried doctors. Omit them and the button reappears.
      "fullName role staffId profilePhoto phone dateOfJoining ipdCharge opdCharge ipdCommission opdCommission isSalaried monthlySalary"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this hospital",
      });
    }

    const payments = await StaffPayment.find({
      staff: user?._id,
      paymentType: { $ne: "Doctor Commission" },
    });

    return res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      data: { user, payments },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

export const createStaffPayment = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const {
      paymentType,
      amount,
      paymentDate,
      notes,
      staff,
      salaryMonth,
      month,
      role,
    } = req.body;

    if (!staff || !paymentType || !amount || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const staffDoc = await User.findOne({ _id: staff, hospital }).select(
      "fullName role staffId hospital"
    );

    if (!staffDoc) {
      return res.status(404).json({
        success: false,
        message: "Staff not found in this hospital",
      });
    }

    const payment = new StaffPayment({
      staff,
      hospital,
      paymentType,
      amount,
      paymentDate,
      notes,
      role,
      salaryMonth: paymentType === "Monthly Salary" ? salaryMonth : null,
      month: paymentType === "Monthly Salary" ? month : null,
    });

    await payment.save();

    return res.status(201).json({
      success: true,
      message: "Payment added successfully",
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while creating payment",
    });
  }
};
export const updateStaffPayment = async (req, res) => {
  try {
    const { hospital } = req.authority;
    const { id } = req.params;
    const {
      paymentType,
      amount,
      paymentDate,
      notes,
      salaryMonth,
      month,
      role,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const payment = await StaffPayment.findOne({ _id: id, hospital });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found in this hospital",
      });
    }

    payment.paymentType = paymentType || payment.paymentType;
    payment.amount = amount ?? payment.amount;
    payment.paymentDate = paymentDate || payment.paymentDate;
    payment.notes = notes ?? payment.notes;
    payment.role = role || payment.role;
    payment.salaryMonth = paymentType === "Monthly Salary" ? salaryMonth : null;
    payment.month = paymentType === "Monthly Salary" ? month : null;

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while updating payment",
    });
  }
};
export const getIncomeOverview = async (req, res) => {
  try {
    const { role, id, startDate, endDate } = req.query;
    const {_id,hospital} = req.authority

    const income = await getUserIncome({
      role,
      hospital,
      authorityId:_id,
      id,
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      data: income,
    });
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch income overview",
    });
  }
};
