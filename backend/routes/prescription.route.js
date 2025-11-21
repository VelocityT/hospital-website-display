import express from "express";

import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  createPrescription,
  getPatientPrescription,
} from "../controllers/prescription.controller.js";

const router = express.Router();
router.use(authenticateToken);

router.post("/create-prescription", createPrescription);
router.get("/patient-prescription", getPatientPrescription);

export default router;
