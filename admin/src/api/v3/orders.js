import api from "../client";

/**
 * V3 Admin Order API.
 *
 * Deprecated:
 *   GET /api/orders           → GET /api/v3/admin/orders
 *   PUT /api/orders/status    → PATCH /api/v3/admin/orders/:id/status
 */

/** List orders with filters (paginated). */
export const fetchOrders = (params) =>
  api.get("/api/v3/admin/orders", { params });

/** Get a single order by id. */
export const getOrder = (id) =>
  api.get(`/api/v3/admin/orders/${id}`);

/** Update a single order's status. */
export const updateOrderStatus = (orderId, status) =>
  api.patch(`/api/v3/admin/orders/${orderId}/status`, { status });

/** Bulk-update order statuses. */
export const bulkUpdateStatus = (ids, status) =>
  api.post("/api/v3/admin/orders/bulk-status", { ids, status });
