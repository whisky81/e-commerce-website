import api from "./client";

export const fetchProducts = (params) => api.get("/api/products", { params });
export const fetchProduct  = (productId) => api.get(`/api/products/${productId}`);
