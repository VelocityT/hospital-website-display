import express from "express";
import {
  payPatientIpdBill,
  payPatientMedicineBill,
  payPatientOpdBill,
  payPatientPathologyReportBill,
} from "../controllers/pay.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { roleBasedAccess } from "../middlewares/roleBaseAccess.middleare.js";

const router = express.Router();
router.use(authenticateToken);

router.post(
  "/patient-ipd-bill",
  roleBasedAccess(["admin", "receptionist"]),
  payPatientIpdBill
);
router.post(
  "/patient-opd-bill",
  roleBasedAccess(["admin", "receptionist"]),
  payPatientOpdBill
);
router.post(
  "/patient-pathology-bill",
  roleBasedAccess(["admin", "receptionist", "pathologist"]),
  payPatientPathologyReportBill
);
router.post(
  "/patient-medicine-bill",
  roleBasedAccess(["admin", "receptionist", "pharmacist"]),
  payPatientMedicineBill
);
export default router;
