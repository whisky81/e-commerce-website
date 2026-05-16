import api from "./client";

export const loginApi    = (email, password) => api.post("/api/auth/login", { email, password });
export const logoutApi   = ()                => api.post("/api/auth/logout");
export const getProfile  = ()                => api.get("/api/users/profile");
