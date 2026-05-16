import api from "./client";

/** @param {{ page?: number, limit?: number }} [params] */
export const fetchOrders = (params = {}) =>
  api.get("/api/v3/admin/orders", {
    params: { page: params.page ?? 1, limit: params.limit ?? 12 },
  });

export const updateOrderStatus = (ids, status) =>
  api.put("/api/orders/status", { bulk: ids, status });

export const bulkCreateShippingOrders = (ids) =>
  api.post("/api/v3/admin/shipping-orders/bulk-create", { bulk: ids });
