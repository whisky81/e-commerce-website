// backend/routes/orderRoutes.js
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

const orderRoutes = express.Router();

// ─── Admin ────────────────────────────────────────────────────────────────────
orderRoutes.get ("/",       protect, adminOnly, ordersList);
orderRoutes.put ("/status", protect, adminOnly, updateStatus);

// ─── User ─────────────────────────────────────────────────────────────────────
orderRoutes.post("/place",  protect, placeOrder);
orderRoutes.post("/stripe", protect, placeOrderStripe);
orderRoutes.post("/momo",   protect, placeOrderMoMo);
orderRoutes.post("/vnpay",  protect, placeOrderVNPay);
orderRoutes.get ("/my",     protect, userOrders);

// ─── Payment verification ─────────────────────────────────────────────────────
orderRoutes.post("/verify-stripe", protect, verifyStripe);
orderRoutes.post("/momo-ipn",      verifyMoMoIPN);           // webhook – không cần protect
orderRoutes.get ("/vnpay-return",  verifyVNPayReturn);       // GET redirect từ VNPay

// ─── Order actions ────────────────────────────────────────────────────────────
orderRoutes.patch("/:orderId/cancel",  protect, cancelOrder);
orderRoutes.post ("/:orderId/contact", protect, contactSupport);

export default orderRoutes;
