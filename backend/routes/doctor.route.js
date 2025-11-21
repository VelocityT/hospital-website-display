import express from 'express';
import { payDoctorCommission,  getDoctorCases } from '../controllers/doctor.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { roleBasedAccess } from '../middlewares/roleBaseAccess.middleare.js';

const router = express.Router();
router.use(authenticateToken)

router.post("/pay-commission", payDoctorCommission);
router.get("/ipds/:doctorId", roleBasedAccess(["admin", "doctor"]), getDoctorCases);
router.get("/opds/:doctorId", roleBasedAccess(["admin", "doctor"]), getDoctorCases);

export default router;
