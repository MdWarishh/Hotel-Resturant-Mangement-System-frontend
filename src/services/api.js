// src/services/api.js - FIXED VERSION
import { API_BASE_URL } from '@/utils/constants';

export const apiRequest = async (endpoint, options = {}) => {
  console.log(API_BASE_URL, 'API_BASE_URL');
  
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  // 🔥 FIX: Build config properly with stringified body
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  // 🔥 CRITICAL FIX: Stringify body if it exists
  if (options.body) {
    // Check if body is already a string
    if (typeof options.body === 'string') {
      config.body = options.body;
    } else {
      // Stringify the object
      config.body = JSON.stringify(options.body);
    }
  }

  console.log('🔥 API Request:', {
    url: `${API_BASE_URL}${endpoint}`,
    method: config.method,
    hasToken: !!token,
    bodyType: typeof config.body,
  });

  const res = await fetch(`${API_BASE_URL}${endpoint}`, config);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};