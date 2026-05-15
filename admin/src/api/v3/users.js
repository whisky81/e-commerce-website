import api from "../client";

/**
 * V3 Admin User API.
 */

/** List users with filters (paginated). */
export const fetchUsers = (params) =>
  api.get("/api/v3/admin/users", { params });

/** Get a single user by id. */
export const getUser = (id) =>
  api.get(`/api/v3/admin/users/${id}`);

/** Update a user (role, isActive, etc.). */
export const updateUser = (userId, data) =>
  api.patch(`/api/v3/admin/users/${userId}`, data);

/** Promote a user to admin. */
export const makeAdmin = (userId) =>
  api.post(`/api/v3/admin/users/${userId}/make-admin`);

/** Delete a user. */
export const deleteUser = (userId) =>
  api.delete(`/api/v3/admin/users/${userId}`);
