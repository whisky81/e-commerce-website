import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor: handle 401 globally
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Don't reload for the profile check — 401 is expected when not logged in
      const isProfileCheck = error.config?.url?.includes("/api/users/profile");
      if (!isProfileCheck) {
        window.location.reload(); // triggers AuthProvider re-init → will show login
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
