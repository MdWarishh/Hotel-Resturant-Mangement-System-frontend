// frontend/services/publicApi.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Public API Service
 * No authentication required
 */

// ============================================
// HOTELS API
// ============================================

/**
 * Get all active hotels
 * @param {Object} params - { city, search }
 */
export const getAllHotels = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/public/hotels${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch hotels');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hotels:', error);
    throw error;
  }
};

/**
 * Get hotel details by code
 * @param {string} hotelCode - Hotel code (e.g., 'HOTEL001')
 */
export const getHotelByCode = async (hotelCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/hotels/${hotelCode}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch hotel details');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    throw error;
  }
};

// ============================================
// MENU API
// ============================================

/**
 * Get full menu (categories + items) by hotel code
 * @param {string} hotelCode - Hotel code
 */
export const getPublicMenu = async (hotelCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/${hotelCode}/menu`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch menu');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching menu:', error);
    throw error;
  }
};

/**
 * Get menu categories only
 * @param {string} hotelCode - Hotel code
 */
export const getPublicCategories = async (hotelCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/${hotelCode}/categories`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch categories');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get menu items by category
 * @param {string} hotelCode - Hotel code
 * @param {string} categoryId - Category ID
 */
export const getCategoryItems = async (hotelCode, categoryId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/public/${hotelCode}/categories/${categoryId}/items`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch items');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching category items:', error);
    throw error;
  }
};

/**
 * Get single menu item details
 * @param {string} hotelCode - Hotel code
 * @param {string} itemId - Item ID
 */
export const getMenuItem = async (hotelCode, itemId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/${hotelCode}/items/${itemId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch item details');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching menu item:', error);
    throw error;
  }
};

// ============================================
// RESOURCES API (Tables & Rooms)
// ============================================

/**
 * Get available tables for dine-in
 * @param {string} hotelCode - Hotel code
 */
export const getAvailableTables = async (hotelCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/${hotelCode}/tables/available`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch tables');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw error;
  }
};

/**
 * Get occupied rooms for room service
 * @param {string} hotelCode - Hotel code
 */
export const getAvailableRooms = async (hotelCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/${hotelCode}/rooms/available`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch rooms');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

// ============================================
// ORDER API
// ============================================

/**
 * Place a public order
 * @param {string} hotelCode - Hotel code
 * @param {Object} orderData - Order details
 * @returns {Promise} Order response
 */
export const placePublicOrder = async (hotelCode, orderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/${hotelCode}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to place order');
    }
    
    return data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};

/**
 * Track order status
 * @param {string} hotelCode - Hotel code
 * @param {string} orderNumber - Order number (e.g., 'ORD2402101234')
 */
export const trackOrder = async (hotelCode, orderNumber) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/public/${hotelCode}/order/${orderNumber}`
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order details');
    }
    
    return data;
  } catch (error) {
    console.error('Error tracking order:', error);
    throw error;
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format price in INR
 * @param {number} price - Price amount
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Get order status badge color
 * @param {string} status - Order status
 */
export const getOrderStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    served: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  
  return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

/**
 * Calculate cart total
 * @param {Array} items - Cart items
 */
export const calculateCartTotal = (items) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  const tax = Math.ceil((subtotal * 5) / 100); // 5% GST
  const total = subtotal + tax;
  
  return { subtotal, tax, total };
};