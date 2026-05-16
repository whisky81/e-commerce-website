import api from "./client";

export const sendPromo       = (data) => api.post("/api/marketing/send-promo", data);
export const applyBulkDiscount = (data) => api.post("/api/marketing/bulk-discount", data);
export const removeBulkDiscount = (productIds) =>
  api.delete("/api/marketing/bulk-discount", { data: { productIds: productIds?.length ? productIds : undefined } });
