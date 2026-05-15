import api from "./client";

export const getCart     = () => api.get("/api/cart");
export const addToCart   = (productId, quantity) => api.post("/api/cart", { productId, quantity });
export const removeFromCart = (productId) => api.delete(`/api/cart/${productId}`);
