import express from "express";

import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  createOrUpdateOpticalItem,
  getOpticalItems,
  deleteOpticalItem,
  createOpticalOrder,
  getOpticalOrders,
  updateOpticalOrderStatus,
} from "../controllers/optical.controller.js";

const router = express.Router();
router.use(authenticateToken);

router.post("/item", createOrUpdateOpticalItem);
router.get("/items", getOpticalItems);
router.delete("/item/:id", deleteOpticalItem);

router.post("/order", createOpticalOrder);
router.get("/orders", getOpticalOrders);
router.put("/order/:id/status", updateOpticalOrderStatus);

export default router;
