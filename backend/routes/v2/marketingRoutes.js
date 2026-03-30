// backend/routes/v2/marketingRoutes.js
import express from "express"
import { protect, adminOnly } from "../../middleware/v2/auth.middleware.js"
import { sendBulkPromo, applyBulkDiscount, removeBulkDiscount } from "../../controllers/v2/marketing.controller.js"

const marketingRoutes = express.Router()

marketingRoutes.post("/send-promo",      protect, adminOnly, sendBulkPromo)
marketingRoutes.post("/bulk-discount",   protect, adminOnly, applyBulkDiscount)
marketingRoutes.post("/remove-discount", protect, adminOnly, removeBulkDiscount)

export default marketingRoutes
