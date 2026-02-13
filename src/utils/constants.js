// src/utils/constants.js
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOTEL_ADMIN: 'hotel_admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  KITCHEN_STAFF: 'kitchen_staff',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',   // ya jo bhi backend mein hai
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  // Add more if needed from backend constants
};

// export const API_BASE_URL = 'http://localhost:5000/api'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL + '/api';
