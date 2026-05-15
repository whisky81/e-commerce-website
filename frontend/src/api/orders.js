/**
 * Order API — legacy v2 endpoints (deprecated, kept for backward compat).
 *
 * ⚠️  DEPRECATED — migrate to:
 *   import { createCodOrder, createStripeOrder, getUserOrders, cancelOrder, previewOrder }
 *     from "./v3/orders";
 */
import api from "./client";

/** @deprecated Use `createCodOrder` from "./v3/orders" */
export const placeOrder = (data) => api.post("/api/orders/place", data);

/** @deprecated Use `createStripeOrder` from "./v3/orders" */
export const placeOrderStripe = (data) => api.post("/api/orders/stripe", data);

/** @deprecated MoMo/VNPay not available in v3; these remain for v2 compat */
export const placeOrderMoMo = (data) => api.post("/api/orders/momo", data);
export const placeOrderVNPay = (data) => api.post("/api/orders/vnpay", data);

/** @deprecated Use `getUserOrders` from "./v3/orders" */
export const getUserOrders = () => api.get("/api/orders/me");

/** @deprecated Use `cancelOrder` from "./v3/orders" */
export const cancelOrder = (orderId) => api.patch(`/api/orders/${orderId}/cancel`);

/** @deprecated Use `contactSupport` from "./v3/orders" */
export const contactSupport = (orderId, message) => api.post(`/api/orders/${orderId}/contact`, { message });

// ── Re-export v3 for convenience ────────────────────────────────────
export {
  previewOrder,
  createCodOrder,
  createStripeOrder,
} from "./v3/orders";

// v3 aliases (prefer tree-shakeable direct imports from ./v3/orders)
import {
  previewOrder as _previewOrder,
  createCodOrder as _createCodOrder,
  createStripeOrder as _createStripeOrder,
} from "./v3/orders";

export const v3 = {
  previewOrder: _previewOrder,
  createCodOrder: _createCodOrder,
  createStripeOrder: _createStripeOrder,
  getUserOrders: _previewOrder, // falls through to re-export above
};
