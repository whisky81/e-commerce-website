import api from "./client";

export const fetchOrders       = (params) => api.get("/api/orders", { params });
export const updateOrderStatus = (ids, status) => api.put("/api/orders/status", { bulk: ids, status });
