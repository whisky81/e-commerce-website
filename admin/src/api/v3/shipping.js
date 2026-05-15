import api from "../client";

/**
 * V3 Admin Shipping Order API — GHN integration management.
 */

/** Preview shipping fee before creating a shipping order. */
export const previewShipping = (orderId) =>
  api.post("/api/v3/admin/shipping/preview", { orderId });

/** Create a shipping order via GHN. */
export const createShipping = (orderId) =>
  api.post("/api/v3/admin/shipping/create", { orderId });

/** Get shipping order details (tracking, status). */
export const getShippingOrder = (shippingOrderId) =>
  api.get(`/api/v3/admin/shipping/orders/${shippingOrderId}`);

/** Cancel a shipping order. */
export const cancelShipping = (shippingOrderId) =>
  api.post("/api/v3/admin/shipping/cancel", { shippingOrderId });
