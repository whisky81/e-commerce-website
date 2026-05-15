/**
 * Admin Order API — delegates to v3.
 *
 * ⚠️  Legacy endpoints removed; all orders management now uses /api/v3/admin/orders.
 */
export { fetchOrders, updateOrderStatus, getOrder, bulkUpdateStatus } from "./v3/orders";
