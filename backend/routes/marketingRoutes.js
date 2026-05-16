// backend/routes/marketingRoutes.js
import express from "express"
import { protect, adminOnly } from "../middleware/auth.middleware.js"
import { sendBulkPromo, applyBulkDiscount, removeBulkDiscount } from "../controllers/marketing.controller.js"
import catchAsync from "../middleware/catchAsync.js";

const marketingRoutes = express.Router()

marketingRoutes.use(protect, adminOnly);

marketingRoutes.post("/send-promo",      catchAsync(sendBulkPromo)) 
marketingRoutes.post("/bulk-discount",   catchAsync(applyBulkDiscount)) 
marketingRoutes.delete("/bulk-discount", catchAsync(removeBulkDiscount))

export default marketingRoutes
