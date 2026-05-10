import api from "./client";

export const placeOrder       = (data) => api.post("/api/orders/place", data);
export const placeOrderStripe = (data) => api.post("/api/orders/stripe", data);
export const placeOrderMoMo   = (data) => api.post("/api/orders/momo", data);
export const placeOrderVNPay  = (data) => api.post("/api/orders/vnpay", data);
export const getUserOrders    = () => api.get("/api/orders/me");
export const cancelOrder      = (orderId) => api.patch(`/api/orders/${orderId}/cancel`);
export const contactSupport   = (orderId, message) => api.post(`/api/orders/${orderId}/contact`, { message });
