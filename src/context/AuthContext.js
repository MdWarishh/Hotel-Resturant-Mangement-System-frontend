'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // 🔥 ADD THIS
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const res = await apiRequest('/auth/me');
      setUser(res.data.user);
      handleRoleRedirect(res.data.user.role);
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    

    const authToken = res.data.token;
    localStorage.setItem('token', authToken);
    setToken(authToken); // 🔥 SET TOKEN IN STATE
    setUser(res.data.user);
    handleRoleRedirect(res.data.user.role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null); // 🔥 CLEAR TOKEN FROM STATE
    setUser(null);
    router.push('/login');
  };

  // ---------- ROLE REDIRECT ----------
  const handleRoleRedirect = (role) => {
    switch (role) {
      case USER_ROLES.SUPER_ADMIN:
        router.push('/super-admin');
        break;
      case USER_ROLES.HOTEL_ADMIN:
        router.push('/hotel-admin');
        break;
      case USER_ROLES.MANAGER:
        router.push('/manager');
        break;
      case USER_ROLES.CASHIER:
        router.push('/cashier');
        break;
      case USER_ROLES.KITCHEN_STAFF:
        router.push('/kitchen');
        break;
      default:
        router.push('/login');
    }
  };

  // ---------- INIT ----------
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken); // 🔥 SET TOKEN FROM LOCALSTORAGE
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading }} // 🔥 ADD TOKEN HERE
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);