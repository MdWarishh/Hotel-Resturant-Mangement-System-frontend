// src/utils/constants.js
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOTEL_ADMIN: 'hotel_admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  KITCHEN_STAFF: 'kitchen_staff',
};

// export const API_BASE_URL = 'http://localhost:5000/api'

export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://hotel-resturant-management-system-backend-production.up.railway.app/api'
    : 'http://localhost:5000/api';
