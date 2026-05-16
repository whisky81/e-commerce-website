import api from "./client";

/** V3 checkout preview — shipping fee, ETA, total */
export const previewOrder = (data) =>
  api.post("/api/v3/orders/preview", data);

export const placeOrderCod = (data) =>
  api.post("/api/v3/orders/cod/create", data);

export const placeOrderStripe = (data) =>
  api.post("/api/v3/orders/stripe/create", data);

/** After Stripe redirect — replaces POST /api/orders/verify-stripe */
export const verifyStripeCheckout = (data) =>
  api.post("/api/v3/payments/stripe/checkout-session", data);

/** @deprecated Backend returns 400 — use {@link placeOrderCod} */
export const placeOrder = (data) => api.post("/api/orders/place", data);

/** @deprecated Use {@link placeOrderStripe} */
export const placeOrderStripeLegacy = (data) =>
  api.post("/api/orders/stripe", data);

export const placeOrderMoMo = (data) => api.post("/api/orders/momo", data);
export const placeOrderVNPay = (data) => api.post("/api/orders/vnpay", data);
export const getUserOrders = () => api.get("/api/orders/me");
export const cancelOrder = (orderId) =>
  api.patch(`/api/orders/${orderId}/cancel`);
export const contactSupport = (orderId, message) =>
  api.post(`/api/orders/${orderId}/contact`, { message });
