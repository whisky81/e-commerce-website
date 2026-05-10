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
      // Token expired or invalid → force redirect to login
      window.location.reload(); // triggers AuthProvider re-init → will show login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
