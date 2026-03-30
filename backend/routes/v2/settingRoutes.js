import express from "express";
import { protect, adminOnly } from "../../middleware/v2/auth.middleware.js";
import { config, addNewBanner, chooseBanner } from "../../controllers/v2/setting.controller.js";
import upload from "../../middleware/multer.js";

const settingRoutes = express.Router();

settingRoutes.get("/config", protect, adminOnly, config);
settingRoutes.post("/banners",
    protect,
    adminOnly,
    upload.fields([{ name: 'img', maxCount: 1 }]),
    addNewBanner);
settingRoutes.put("/banners/:index", protect, adminOnly, chooseBanner);

export default settingRoutes;