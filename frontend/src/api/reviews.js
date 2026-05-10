import api from "./client";

export const createReview  = (formData) => api.post("/api/reviews", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const updateReview  = (reviewId, data) => api.patch(`/api/reviews/${reviewId}`, data);
