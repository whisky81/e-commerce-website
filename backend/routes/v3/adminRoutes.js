import express from "express";
import { protect, adminOnly } from "../../middleware/auth.middleware.js";
import catchAsync from "../../middleware/catchAsync.js";
import {bulkCreateShippingOrder} from "../../controllers/admin/shippingOrder.js";
import {ordersListV3} from "../../controllers/order.controller.js";
const adminRoutes = express.Router();
adminRoutes.use(protect, adminOnly);

adminRoutes.post("/shipping-orders/bulk-create", catchAsync(bulkCreateShippingOrder));
adminRoutes.get("/orders", catchAsync(ordersListV3));


export default adminRoutes;
