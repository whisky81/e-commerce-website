import api from "./client";

export const fetchStats = (params) => api.get("/api/admin/stats", { params });
