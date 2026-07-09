import express from "express";

import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  getEyeQueue,
  upsertWorkup,
  upsertDoctorFindings,
  getEyeExam,
  getPatientEyeHistory,
} from "../controllers/eyeExam.controller.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/queue", getEyeQueue);
router.post("/workup", upsertWorkup);
router.post("/doctor-findings", upsertDoctorFindings);
router.get("/exam", getEyeExam);
router.get("/history/:patientId", getPatientEyeHistory);

export default router;
