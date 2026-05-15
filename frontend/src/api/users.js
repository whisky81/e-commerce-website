/**
 * User API — legacy v2 endpoints.
 *
 * ⚠️  DEPRECATED address endpoints — migrate to:
 *   import { saveAddress, getUserAddresses, updateAddress, deleteAddresses, getProvinces, getDistricts, getWards }
 *     from "./v3/addresses";
 */
import api from "./client";

export const uploadAvatar = (formData) =>
  api.post("/api/users/avatar", formData);

export const listFavorites = () =>
  api.get("/api/users/favorites");

export const addFavorite = (productId) =>
  api.post(`/api/users/favorites/${productId}`);

export const removeFavorite = (productId) =>
  api.delete(`/api/users/favorites/${productId}`);

/** @deprecated Use `saveAddress` from "./v3/addresses" */
export const addAddress = (data) =>
  api.post("/api/users/addresses", data);

/** @deprecated Use `updateAddress` from "./v3/addresses" */
export const updateAddress = (addressId, data) =>
  api.put(`/api/users/addresses/${addressId}`, data);

/** @deprecated Use `deleteAddresses` from "./v3/addresses" */
export const deleteAddresses = (ids) =>
  api.delete("/api/users/addresses", { data: { bulk: ids } });

// ── Re-export v3 for convenience ────────────────────────────────────
export {
  getProvinces,
  getDistricts,
  getWards,
  saveAddress,
  getUserAddresses,
} from "./v3/addresses";
