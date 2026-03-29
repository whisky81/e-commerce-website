import express from "express";
import { protect, adminOnly } from "../../middleware/v2/auth.middleware.js";
import { adminStats } from "../../controllers/v2/adminStats.controller.js";

const adminRoutes = express.Router();

adminRoutes.get("/stats", protect, adminOnly, adminStats);

export default adminRoutes;
