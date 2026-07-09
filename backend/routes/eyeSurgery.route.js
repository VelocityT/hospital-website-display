import express from "express";

import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  createEyeSurgery,
  updateEyeSurgery,
  getEyeSurgeries,
  getEyeSurgeryById,
} from "../controllers/eyeSurgery.controller.js";

const router = express.Router();
router.use(authenticateToken);

router.post("/", createEyeSurgery);
router.get("/list", getEyeSurgeries);
router.get("/:id", getEyeSurgeryById);
router.put("/:id", updateEyeSurgery);

export default router;
