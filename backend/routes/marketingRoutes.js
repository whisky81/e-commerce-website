// backend/routes/marketingRoutes.js
import express from "express"
import { protect, adminOnly } from "../middleware/auth.middleware.js"
import { sendBulkPromo, applyBulkDiscount, removeBulkDiscount } from "../controllers/marketing.controller.js"

const marketingRoutes = express.Router()

marketingRoutes.post("/send-promo",      protect, adminOnly, sendBulkPromo)
marketingRoutes.post("/bulk-discount",   protect, adminOnly, applyBulkDiscount)
marketingRoutes.post("/remove-discount", protect, adminOnly, removeBulkDiscount)

export default marketingRoutes
