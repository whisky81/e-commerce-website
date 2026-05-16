import api from "./client";

export const loginApi    = (email, password) => api.post("/api/auth/login", { email, password });
export const registerApi = (name, email, password) => api.post("/api/auth/register", { name, email, password });
export const logoutApi   = () => api.post("/api/auth/logout");
export const getProfile  = () => api.get("/api/users/profile");
export const updateProfile = (data) => api.put("/api/users/profile", data);
export const resendVerification = () => api.post("/api/auth/resend-verification");
