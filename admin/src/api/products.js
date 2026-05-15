import api from "./client";

export const fetchProducts     = (params) => api.get("/api/products", { params });
export const fetchProduct      = (id)     => api.get(`/api/admin/products/${id}`);
export const createProduct     = (fd)     => api.post("/api/admin/products", fd, {
                                             headers: { "Content-Type": "multipart/form-data" } });
export const updateProduct     = (id, d)  => api.put(`/api/admin/products/${id}`, d);
export const bulkDeleteProducts = (ids)   => api.delete("/api/admin/products", { data: { bulk: ids } });
export const bulkImportProducts = (rows)  => api.post("/api/products/bulk-import", { products: rows });
