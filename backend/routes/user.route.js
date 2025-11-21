import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { roleBasedAccess } from "../middlewares/roleBaseAccess.middleare.js";
import upload from "../middlewares/multer.js";
import {
  registerOrUpdateUser,
  getUsers,
  getAllStaff,
  getUserById,
  getStaffForAssign,
  getUserPayments,
  createStaffPayment,
  updateStaffPayment,
  getIncomeOverview,
} from "../controllers/user.controller.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/get-user/:id", getUserById);
router.get("/get-income", getIncomeOverview);
router.get("/get-user-payments/:id", getUserPayments);
router.get("/all-users", getUsers);
router.get("/all-staff", roleBasedAccess(["admin"]), getAllStaff);
router.get("/staff-assing", getStaffForAssign);

router.post(
  "/register-update-user",
  roleBasedAccess(["admin"]),
  upload.single("photo"),
  registerOrUpdateUser
);
router.post("/payment", roleBasedAccess(["admin"]), createStaffPayment);
router.patch("/payments/:id", roleBasedAccess(["admin"]), updateStaffPayment);

export default router;
