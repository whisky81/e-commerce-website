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
orderRoutes.post("/stripe", protect, catchAsync(placeOrderStripe));
orderRoutes.post("/momo",   protect, catchAsync(placeOrderMoMo));
orderRoutes.post("/vnpay",  protect, catchAsync(placeOrderVNPay));
orderRoutes.get ("/me",     protect, catchAsync(userOrders));

// ─── Payment verification ─────────────────────────────────────────────────────
// verify-stripe: user phải đăng nhập để verify
orderRoutes.post("/verify-stripe", protect, catchAsync(verifyStripe));
// momo-ipn: MoMo server-to-server webhook — KHÔNG cần protect
orderRoutes.post("/momo-ipn",      catchAsync(verifyMoMoIPN));
// vnpay-return: GET redirect từ cổng VNPay — KHÔNG cần protect
orderRoutes.get ("/vnpay-return",  catchAsync(verifyVNPayReturn));

// ─── Order actions ────────────────────────────────────────────────────────────
orderRoutes.patch("/:orderId/cancel",  protect, catchAsync(cancelOrder));
orderRoutes.post ("/:orderId/contact", protect, catchAsync(contactSupport));

export default orderRoutes;
