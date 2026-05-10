import api from "./client";

export const fetchConfig            = ()     => api.get("/api/setting/config");
export const addBanner              = (fd)   => api.post("/api/setting/banners", fd, {
                                                headers: { "Content-Type": "multipart/form-data" } });
export const activateBannerByIndex  = (idx)  => api.put(`/api/setting/banners/${idx}`);
