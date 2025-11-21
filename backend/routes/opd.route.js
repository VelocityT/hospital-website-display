import express from "express";
import {
  getAllOpdPatients,
  updateOpdDetails,
} from "../controllers/opd.controller.js";
import upload from "../middlewares/multer.js";
import { roleBasedAccess } from "../middlewares/roleBaseAccess.middleare.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/all-opd-patients", getAllOpdPatients);

router.put(
  "/update-opd/:opdId",
  roleBasedAccess(["admin", "receptionist", "doctor"]),
  upload.none(),
  updateOpdDetails
);

export default router;
