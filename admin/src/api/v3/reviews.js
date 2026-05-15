import api from "../client";

/**
 * V3 Admin Review API.
 */

/** List reviews with filters (paginated). */
export const fetchReviews = (params) =>
  api.get("/api/v3/admin/reviews", { params });

/** Get a single review by id. */
export const getReview = (id) =>
  api.get(`/api/v3/admin/reviews/${id}`);

/** Delete a review. */
export const deleteReview = (id) =>
  api.delete(`/api/v3/admin/reviews/${id}`);

/** Hide a review (soft-delete). */
export const hideReview = (id) =>
  api.patch(`/api/v3/admin/reviews/${id}/hide`);

/** Unhide a review. */
export const unhideReview = (id) =>
  api.patch(`/api/v3/admin/reviews/${id}/unhide`);

/** Bulk-delete reviews. */
export const bulkDeleteReviews = (ids) =>
  api.post("/api/v3/admin/reviews/bulk-delete", { ids });
