import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('findlinks_token');
    if (!token) {
      // Auto login with demo account if available
      try {
        const res = await api.auth.login('demo@findlinks.in', 'password123');
        if (res.success && res.token) {
          localStorage.setItem('findlinks_token', res.token);
          setUser(res.user);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        localStorage.removeItem('findlinks_token');
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      localStorage.removeItem('findlinks_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem('findlinks_token', res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password, defaultPincode) => {
    const res = await api.auth.register(name, email, password, defaultPincode);
    if (res.success && res.token) {
      localStorage.setItem('findlinks_token', res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('findlinks_token');
    setUser(null);
  };

  const updatePincode = async (pincode) => {
    const res = await api.auth.updatePincode(pincode);
    if (res.success && res.user) {
      setUser(prev => ({ ...prev, defaultPincode: res.user.defaultPincode }));
    }
    return res;
  };

  const updateTelegramInfo = (telegramChatId, telegramUsername) => {
    setUser(prev => prev ? ({ ...prev, telegramChatId, telegramUsername }) : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updatePincode, updateTelegramInfo, refreshUser: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
