import express from "express";
import {
  createOrUpdatePathologyTest,
  getAllPathologyTests,
  getPathologyTestById,
  createUpdateTestReport,
  getAllPathologyTestReports,
  getTestReportById,
  searchPathologyTests,
  pathologySales,
} from "../controllers/pathology.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { roleBasedAccess } from "../middlewares/roleBaseAccess.middleare.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/all-tests", getAllPathologyTests);
router.get("/tests", searchPathologyTests);
router.get("/all-reports", getAllPathologyTestReports);
router.post("/create-test-report", createUpdateTestReport);
router.get("/test-report/:id", getTestReportById);

router.post("/test", roleBasedAccess(["admin"]), createOrUpdatePathologyTest);

router.put(
  "/test/:id",
  roleBasedAccess(["admin"]),
  createOrUpdatePathologyTest
);

router.get("/test/:id", getPathologyTestById);
router.get(
  "/sales/report",
  roleBasedAccess(["admin", "pathologist"]),
  pathologySales
);

export default router;
