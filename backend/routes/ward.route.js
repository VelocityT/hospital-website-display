import express from "express";
import {
  createOrUpdateWardTypes,
  getAllWardTypes,
  createAndUpdateWard,
  updateWard,
  getAllWards,
  createBeds,
  getBedsByWardId,
  deleteWard,
  deleteLastBed,
  changeBedStatus,
} from "../controllers/ward.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { roleBasedAccess } from "../middlewares/roleBaseAccess.middleare.js";

const router = express.Router();
router.use(authenticateToken);

router.get("/all-wards", getAllWards);
router.get("/beds/:wardId", getBedsByWardId);
router.get("/wardTypes/all", getAllWardTypes);

router.use(roleBasedAccess(["admin"]));
router.post("/wardTypes/create", createOrUpdateWardTypes);
router.post("/create-update-ward", createAndUpdateWard);
router.put("/update-ward/:id", updateWard);

router.post("/create-beds", createBeds);
router.put("/bed/status", changeBedStatus);
router.delete("/delete-ward/:id", deleteWard);
router.delete("/delete-last-bed/:wardId", deleteLastBed);

export default router;
