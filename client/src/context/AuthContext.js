import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete api.defaults.headers.common.Authorization;
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      delete api.defaults.headers.common.Authorization;
      setLoading(false);
    }
  }, [token]);

  const sendOTP = async (phone) => {
    const res = await api.post('/auth/send-otp', { phone });
    return res.data;
  };

  const verifyOTP = async (phone, otp, name, password) => {
    const payload = { phone, otp };

    if (name?.trim()) {
      payload.name = name.trim();
    }
    if (password) {
      payload.password = password;
    }

    const res = await api.post('/auth/verify-otp', payload);
    const { token: newToken, user: newUser } = res.data;

    localStorage.setItem('token', newToken);
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);

    return res.data;
  };

  const setPassword = async (password) => {
    const res = await api.post('/auth/set-password', { password });
    setUser(res.data.user);
    return res.data;
  };

  const loginWithPassword = async (phone, password) => {
    const res = await api.post('/auth/login', { phone, password });
    const { token: newToken, user: newUser } = res.data;

    localStorage.setItem('token', newToken);
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);

    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sendOTP,
        verifyOTP,
        setPassword,
        loginWithPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
