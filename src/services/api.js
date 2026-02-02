// src/services/api.js

// Yeh logic check karega ki browser mein URL kya hai


const BASE_URL = getBaseURL();

export const apiRequest = async (endpoint, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
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

  return { data }; // AuthContext '.data' expect kar raha hai, isliye wrap kiya hai
};