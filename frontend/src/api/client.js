import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Don't dispatch auth:unauthorized for the profile check itself —
      // 401 is expected when the user is simply not logged in.
      const isProfileCheck = error.config?.url?.includes("/api/users/profile");
      if (!isProfileCheck) {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
