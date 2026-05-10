import api from "./client";

export const uploadAvatar     = (formData) => api.post("/api/users/avatar", formData);
export const listFavorites    = () => api.get("/api/users/favorites");
export const addFavorite      = (productId) => api.post(`/api/users/favorites/${productId}`);
export const removeFavorite   = (productId) => api.delete(`/api/users/favorites/${productId}`);
export const addAddress       = (data) => api.post("/api/users/addresses", data);
export const updateAddress    = (addressId, data) => api.put(`/api/users/addresses/${addressId}`, data);
export const deleteAddresses  = (ids) => api.delete("/api/users/addresses", { data: { bulk: ids } });
