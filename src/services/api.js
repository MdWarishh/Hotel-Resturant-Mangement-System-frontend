// src/services/api.js
import { API_BASE_URL } from '@/utils/constants';

export const apiRequest = async (endpoint, options = {}) => {

  console.log(API_BASE_URL, 'API_BASE_URL'); // Debugging line to check the value of API_BASE_URL 
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};
