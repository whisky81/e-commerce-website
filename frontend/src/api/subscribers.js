import api from "./client";

export const subscribe   = (email, name) => api.post("/api/subscribers", { email, name });
export const unsubscribe = () => api.post("/api/subscribers/unsubscribe");
