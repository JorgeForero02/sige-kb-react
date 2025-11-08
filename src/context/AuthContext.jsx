import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = apiClient.getToken();
      if (token) {
        try {
          const response = await apiClient.getProfile();
          const userData = response.data;
          setUser(userData);
          setRol(userData.rolInfo?.nombre || null);
          setIsAuthenticated(true);
        } catch (err) {
          apiClient.clearToken();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (documento, contrasena) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.login(documento, contrasena);
      const userData = response.data.usuario;
      apiClient.setToken(response.data.token);
      setUser(userData);
      setRol(userData.rol || userData.rolInfo?.nombre);
      setIsAuthenticated(true);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
    setRol(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        rol,
        loading,
        error,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}