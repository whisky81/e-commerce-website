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
      // Don't dispatch for the profile check — 401 is expected when not logged in
      const isProfileCheck = error.config?.url?.includes("/api/users/profile");
      if (!isProfileCheck) {
        // Dispatch custom event instead of hard reload — preserves state
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
