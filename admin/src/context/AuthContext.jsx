import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // null = loading, undefined = unauthenticated
  const [isInitialized, setIsInitialized] = useState(false);

  // Bootstrap: try to restore session from httpOnly cookie
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/profile`,
          { withCredentials: true }
        );
        if (!cancelled && res.data.success) {
          setUser(res.data.data);
        }
      } catch {
        if (!cancelled) setUser(undefined);
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (loginResponseData) => {
    // First set the minimal user data from login to trigger isAuthenticated
    setUser(loginResponseData);
    // Then refetch full profile to get complete user data (name, email, etc.)
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/profile`,
        { withCredentials: true }
      );
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch {
      // Keep the minimal user data if profile refetch fails
    }
  }, []);

  const logout = useCallback(async () => {
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
      {},
      { withCredentials: true }
    );
    setUser(undefined);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isInitialized, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
