// src/services/api.js

// Yeh logic check karega ki browser mein URL kya hai
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Agar hostname localhost nahi hai, toh Render ka URL use karo
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return "https://hotel-resturant-mangement-system.onrender.com/api";
    }
  }
  // Local development ke liye default
  return "http://localhost:5000/api";
};

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