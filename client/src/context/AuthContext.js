import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      axios
        .get('/api/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try{
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, ...userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }catch (err){
      if (err.response?.status ===403) {
        return err.response.data;
      }
      throw err;
    }
    
  };

  const register = async (name, email, password, role = 'customer', phone='') => {
    const res = await axios.post('/api/auth/register', { name, email, password, role, phone });
    const { token, ...userData } = res.data;
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const verifyPhone = async (userId, otp) => {
  const res = await axios.post('/api/auth/verify-phone', { userId, otp });
  return res.data;
};

// ✅ add verifyEmail (saves token when both verified)
const verifyEmail = async (userId, otp) => {
  const res = await axios.post('/api/auth/verify-email', { userId, otp });
  if (res.data.fullyVerified) {
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify({
      _id: res.data._id,
      name: res.data.name,
      email: res.data.email,
      role: res.data.role
    }));
    setUser({
      _id: res.data._id,
      name: res.data.name,
      email: res.data.email,
      role: res.data.role
    });
  }
  return res.data;
};
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    verifyPhone,
    verifyEmail,
    isAuthenticated: !!user
  };

  return React.createElement(AuthContext.Provider, { value: value }, children);
};
