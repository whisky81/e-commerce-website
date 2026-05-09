import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
  placeOrder,
  placeOrderStripe,
  placeOrderMoMo,
  placeOrderVNPay,
  ordersList,
  userOrders,
  updateStatus,
  verifyStripe,
  verifyMoMoIPN,
  verifyVNPayReturn,
  cancelOrder,
  contactSupport,
} from "../controllers/order.controller.js";
import catchAsync from "../middleware/catchAsync.js";
const orderRoutes = express.Router();

// ─── Admin ────────────────────────────────────────────────────────────────────
orderRoutes.get ("/",       protect, adminOnly, catchAsync(ordersList));
orderRoutes.put ("/status", protect, adminOnly, catchAsync(updateStatus));

// ─── User ─────────────────────────────────────────────────────────────────────
orderRoutes.post("/place",  protect, catchAsync(placeOrder));
orderRoutes.post("/stripe", protect, placeOrderStripe);
orderRoutes.post("/momo",   protect, placeOrderMoMo);
orderRoutes.post("/vnpay",  protect, placeOrderVNPay);
orderRoutes.get ("/me",     protect, catchAsync(userOrders));

// ─── Payment verification ─────────────────────────────────────────────────────
orderRoutes.post("/verify-stripe", protect, verifyStripe);
orderRoutes.post("/momo-ipn",      verifyMoMoIPN);           // webhook – không cần protect
orderRoutes.get ("/vnpay-return",  verifyVNPayReturn);       // GET redirect từ VNPay

// ─── Order actions ────────────────────────────────────────────────────────────
orderRoutes.patch("/:orderId/cancel",  protect, catchAsync(cancelOrder));
orderRoutes.post ("/:orderId/contact", protect, catchAsync(contactSupport));

export default orderRoutes;
