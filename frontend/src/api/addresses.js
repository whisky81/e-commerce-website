import api from "./client";

export const fetchProvinces = () =>
  api.get("/api/v3/addresses/3-level/provinces");

export const fetchDistricts = (provinceId) =>
  api.get(`/api/v3/addresses/3-level/districts/${provinceId}`);

export const fetchWards = (districtId) =>
  api.get(`/api/v3/addresses/3-level/wards/${districtId}`);
