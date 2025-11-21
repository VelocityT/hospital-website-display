import express from "express";
import {
  dischargePatient,
  getAllIpdPatients,
  updateIpdDetails,
} from "../controllers/ipd.controller.js";
import { getAvailableWardsAndBeds } from "../controllers/ward.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { roleBasedAccess } from "../middlewares/roleBaseAccess.middleare.js";
import upload from "../middlewares/multer.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/all-ipd-patients", getAllIpdPatients);
router.get("/available-wards-beds", getAvailableWardsAndBeds);

router.put(
  "/update-ipd/:ipdId",
  roleBasedAccess(["admin", "receptionist", "doctor"]),
  upload.none(),
  updateIpdDetails
);
router.put(
  "/discharge-ipd-patient",
  roleBasedAccess(["admin", "receptionist"]),
  dischargePatient
);

export default router;
