import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { config, addNewBanner, chooseBanner } from "../controllers/setting.controller.js";
import upload from "../middleware/multer.js";
import catchAsync from "../middleware/catchAsync.js";

const settingRoutes = express.Router();

settingRoutes.use(protect, adminOnly);

settingRoutes.get("/config", catchAsync(config));
settingRoutes.post("/banners",
    upload.fields([{ name: 'img', maxCount: 1 }]),
    catchAsync(addNewBanner));
settingRoutes.put("/banners/:index", catchAsync(chooseBanner));

export default settingRoutes;