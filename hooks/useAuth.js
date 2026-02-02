import { useEffect, useState } from 'react';
import api from '@/services/api';

/**
 * useAuth
 * Central hook to manage authentication state
 */
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data || response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  return {
    user,
    role: user?.role || null,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser: fetchCurrentUser,
  };
};

export default useAuth;
