import api from "../client";

/**
 * V3 3‑Level Address API (Vietnam administrative units).
 *
 * Deprecated:
 *   POST   /api/users/addresses        → POST   /api/v3/addresses/3-level/user
 *   PUT    /api/users/addresses/:id    → PUT    /api/v3/addresses/3-level/user/:addressId
 *   DELETE /api/users/addresses         → DELETE /api/v3/addresses/3-level/user
 */

/** Get all provinces (Tỉnh/Thành phố). */
export const getProvinces = () =>
  api.get("/api/v3/addresses/3-level/provinces");

/** Get districts within a province (Quận/Huyện). */
export const getDistricts = (provinceCode) =>
  api.get(`/api/v3/addresses/3-level/districts/${provinceCode}`);

/** Get wards within a district (Phường/Xã). */
export const getWards = (districtCode) =>
  api.get(`/api/v3/addresses/3-level/wards/${districtCode}`);

/** Save a new user address with 3-level codes. */
export const saveAddress = (data) =>
  api.post("/api/v3/addresses/3-level/user", data);

/** Get all user addresses. */
export const getUserAddresses = () =>
  api.get("/api/v3/addresses/3-level/user");

/** Update a user address. */
export const updateAddress = (addressId, data) =>
  api.put(`/api/v3/addresses/3-level/user/${addressId}`, data);

/** Bulk-delete user addresses. */
export const deleteAddresses = (ids) =>
  api.delete("/api/v3/addresses/3-level/user", { data: { bulk: ids } });
