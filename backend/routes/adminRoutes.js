import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { adminStats } from "../controllers/adminStats.controller.js";

const adminRoutes = express.Router();

adminRoutes.get("/stats", protect, adminOnly, adminStats);

export default adminRoutes;
