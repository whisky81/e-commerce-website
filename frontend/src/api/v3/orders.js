import api from "../client";

/**
 * V3 Order API — replaces deprecated v2 endpoints.
 *
 * Deprecated v2 routes:
 *   POST /api/orders/place       → POST /api/v3/orders/cod/create
 *   POST /api/orders/stripe       → POST /api/v3/orders/stripe/create
 *   POST /api/orders/momo         → (no v3 equivalent; MoMo/VNPay remain v2-only)
 *   POST /api/orders/vnpay        → (no v3 equivalent)
 *   GET  /api/orders/me           → GET  /api/v3/orders/me
 *   PATCH /api/orders/:id/cancel  → PATCH /api/v3/orders/:id/cancel
 */

/** Preview order — shows shipping fee, ETA, subtotal, discounts before placing. */
export const previewOrder = (data) =>
  api.post("/api/v3/orders/preview", data);

/** Create COD (cash-on-delivery) order. */
export const createCodOrder = (data) =>
  api.post("/api/v3/orders/cod/create", data);

/** Create Stripe (bank card) order — returns sessionUrl for redirect. */
export const createStripeOrder = (data) =>
  api.post("/api/v3/orders/stripe/create", data);

/** Get current user's orders (paginated). */
export const getUserOrders = (params) =>
  api.get("/api/v3/orders/me", { params });

/** Cancel an order. */
export const cancelOrder = (orderId) =>
  api.patch(`/api/v3/orders/${orderId}/cancel`);

// contactSupport remains in v2 (not yet migrated to v3)
