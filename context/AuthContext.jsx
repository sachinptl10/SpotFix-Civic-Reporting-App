import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { setUnauthorizedListener } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('[AuthContext] Logout warning:', err);
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  // Set up global 401 Unauthorized interceptor
  useEffect(() => {
    setUnauthorizedListener(() => {
      logout();
    });
  }, [logout]);

  // Restore authentication state from SecureStore on startup
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const savedToken = await authService.getPersistedToken();
        if (savedToken) {
          setToken(savedToken);
          // Verify with backend
          try {
            const res = await authService.getProfile();
            if (res && res.user) {
              setUser(res.user);
            }
          } catch (profileErr) {
            console.warn('[AuthContext] Token validation failed:', profileErr.message);
            if (profileErr.status === 401) {
              await logout();
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Bootstrap error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, [logout]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const refreshProfile = async () => {
    try {
      const res = await authService.getProfile();
      if (res && res.user) {
        setUser(res.user);
      }
      return res.user;
    } catch (err) {
      console.warn('[AuthContext] Refresh profile failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
