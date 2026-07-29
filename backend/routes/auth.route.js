import express from "express";
import {
  createOrUpdateHospital,
  getDashboardStatsData,
  getIncomeOverview,
  loginUser,
  logoutUser,
  getHospitalList,
  getHospitalById,
  impersonateUser,
  leaveImpersonation,
  checkHospitalPrefix,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { roleBasedAccess } from "../middlewares/roleBaseAccess.middleare.js";
import upload from "../middlewares/multer.js";
import { authLimiter } from "../middlewares/authLimit.middleware.js";
const router = express.Router();

router.post("/login", authLimiter, loginUser);
router.get("/logout", logoutUser);

router.use(authenticateToken);
router.get("/dashboard/static-data", getDashboardStatsData);
router.get("/income/overview", getIncomeOverview);
router.post("/leave-impersonation", leaveImpersonation);

router.use(roleBasedAccess(["superAdmin"]));
router.post(
  "/create-update-hospital",
  upload.single("logo"),
  createOrUpdateHospital
);
router.get("/check-prefix", checkHospitalPrefix);
router.get("/hospitals-list", getHospitalList);
router.get("/hospital/:id", getHospitalById);
router.post("/impersonate/:userId", impersonateUser);

export default router;
