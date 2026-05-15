import api from "../client";

/**
 * V3 Shipping API — fee estimation and delivery time.
 */

/** Get estimated delivery time to default address. */
export const getDeliveryEta = () =>
  api.get("/api/v3/shipping/eta");

/** Estimate shipping fee for items to an address (uses default if no addressId). */
export const estimateShippingFee = (data) =>
  api.post("/api/v3/shipping/estimate-fee", data);
