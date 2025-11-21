import express from "express";
import {
  createPatient,
  getAllPatients,
  getPatientDetails,
  updatePatientRegistration,
  switchPatientToIpd,
  getPatientIpdOpdDetails,
  getPatientFullDetails,
  addOpdOrIpd,
  searchPatient,
} from "../controllers/patient.controller.js";
import upload from "../middlewares/multer.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { roleBasedAccess } from "../middlewares/roleBaseAccess.middleare.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/all-patients", getAllPatients);
router.get("/patient-details/:id", getPatientDetails);
router.get("/ipd-opd-details/:id", getPatientIpdOpdDetails);
router.get("/patient-full-details/:patientId", getPatientFullDetails);
router.get("/patient-search", searchPatient);

router.put(
  "/patient-registration/edit/:id",
  roleBasedAccess(["admin", "doctor", "receptionist"]),
  upload.array("medicalDocuments", 5),
  updatePatientRegistration
);
router.post(
  "/patient-registration",
  roleBasedAccess(["admin", "doctor", "receptionist"]),
  upload.array("medicalDocuments", 5),
  createPatient
);
router.post(
  "/add-opd-ipd",
  roleBasedAccess(["admin", "receptionist"]),
  addOpdOrIpd
);

router.post(
  "/:id/patient-switch-to-ipd",
  roleBasedAccess(["admin", "receptionist"]),
  switchPatientToIpd
);

export default router;
