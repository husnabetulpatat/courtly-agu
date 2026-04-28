import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const loadMe = async () => {
    try {
      const token = localStorage.getItem("agu_tennis_token");

      if (!token) {
        setUser(null);
        return;
      }

      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem("agu_tennis_token");
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password
    });

    localStorage.setItem("agu_tennis_token", response.data.token);
    setUser(response.data.user);

    return response.data.user;
  };

  const register = async (formData) => {
    const response = await api.post("/auth/register", formData);

    localStorage.setItem("agu_tennis_token", response.data.token);
    setUser(response.data.user);

    return response.data.user;
  };

  const updateProfile = async (formData) => {
    const response = await api.patch("/auth/me", formData);
    setUser(response.data.user);

    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem("agu_tennis_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loadingAuth,
        login,
        register,
        updateProfile,
        logout,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === "ADMIN" || user?.role === "COACH"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};