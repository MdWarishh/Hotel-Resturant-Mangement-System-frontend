// frontend/app/allinone/[hotelCode]/page.js

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
// ✅ Next.js 15: useParams() ki jagah use(params) use karo
import { getPublicMenu, getHotelByCode, formatPrice } from '@/services/allinonApi';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import axios from 'axios';
import CartDrawer from '@/components/allinone/CartDrawer';
import TrackOrderModal from '@/components/allinone/TrackOrderModal';
import StarRating from '@/components/allinone/StarRating';

// ✅ FIXED: useParams() ki jagah params prop use karo (Next.js 15 style)
export default function PublicMenuPage({ params }) {
  // ✅ Next.js 15: params ek Promise hai, use() se unwrap karo
  const { hotelCode } = use(params);
  
  const router = useRouter();
  const { addToCart, getItemCount, openCart, isOpen } = useCart();

  const [hotel, setHotel] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [itemRatings, setItemRatings] = useState({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (hotelCode) {
      fetchData();
    }
  }, [hotelCode]);

  useEffect(() => {
    if (menu.length > 0) {
      fetchAllRatings();
    }
  }, [menu]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [hotelResponse, menuResponse] = await Promise.all([
        getHotelByCode(hotelCode),
        getPublicMenu(hotelCode),
      ]);

      setHotel(hotelResponse.data.hotel);
      setMenu(menuResponse.data.menu || []);

      if (menuResponse.data.menu && menuResponse.data.menu.length > 0) {
        setSelectedCategory(menuResponse.data.menu[0].category._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRatings = async () => {
    const ratings = {};
    const allItems = menu.flatMap(cat => cat.items);

    for (const item of allItems) {
      try {
        const response = await axios.get(
          `${API_URL}/allinone/${hotelCode}/items/${item._id}/feedback`
        );
        ratings[item._id] = response.data.data.stats;
      } catch (err) {
        ratings[item._id] = { averageRating: 0, totalReviews: 0 };
      }
    }

    setItemRatings(ratings);
  };

  const filteredMenu = menu.map((categoryData) => ({
    ...categoryData,
    items: categoryData.items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((categoryData) => categoryData.items.length > 0);

  const activeCategoryData = selectedCategory
    ? filteredMenu.find((cat) => cat.category._id === selectedCategory)
    : filteredMenu[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-black">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/allinone')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
          >
            Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40 text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/allinone')}
                className="p-2 hover:bg-gray-300 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{hotel?.name}</h1>
                <p className="text-sm text-gray-600">{hotel?.code}</p>
              </div>
            </div>

            <button
              onClick={openCart}
              className="relative px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold">Cart</span>
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white text-black border-b sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="bg-white border-b sticky top-[136px] z-20 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-3">
            {filteredMenu.map((categoryData) => (
              <button
                key={categoryData.category._id}
                onClick={() => setSelectedCategory(categoryData.category._id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === categoryData.category._id
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {categoryData.category.name} ({categoryData.items.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {activeCategoryData ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {activeCategoryData.category.name}
              </h2>
              {activeCategoryData.category.description && (
                <p className="text-gray-600 mt-1">
                  {activeCategoryData.category.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCategoryData.items.map((item) => (
                <MenuItem
                  key={item._id}
                  item={item}
                  onAddToCart={addToCart}
                  rating={itemRatings[item._id]}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search</p>
          </div>
        )}
      </main>

      {/* Floating Track Order Button */}
      <button
        onClick={() => setTrackModalOpen(true)}
        className="fixed bottom-6 left-6 z-30 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>Track Order</span>
      </button>

      <CartDrawer isOpen={isOpen} hotelCode={hotelCode} hotel={hotel} />
      <TrackOrderModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        hotelCode={hotelCode}
      />
    </div>
  );
}

// Menu Item Component
function MenuItem({ item, onAddToCart, rating }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const getPrice = () => {
    if (selectedVariant && item.variants?.length > 0) {
      const variant = item.variants.find((v) => v.name === selectedVariant);
      return variant?.price || item.price;
    }
    return item.price;
  };

  const handleAddToCart = () => {
    onAddToCart({
      _id: item._id,
      name: item.name,
      price: getPrice(),
      variant: selectedVariant,
      quantity: quantity,
      images: item.images,
      preparationTime: item.preparationTime,
    });
    setQuantity(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {item.images && item.images.length > 0 ? (
        <div className="relative h-48 bg-gray-200">
          <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
          <span className="text-6xl">🍽️</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 flex-1">{item.name}</h3>
          {item.type && (
            <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
              item.type === 'veg' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {item.type === 'veg' ? '🟢 VEG' : '🔴 NON-VEG'}
            </span>
          )}
        </div>

        {rating && (
          <div className="mb-2">
            <StarRating
              rating={rating.averageRating || 0}
              totalReviews={rating.totalReviews || 0}
              size="sm"
            />
          </div>
        )}

        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        {item.variants && item.variants.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Select Size:</p>
            <div className="flex gap-2">
              {item.variants.map((variant) => (
                <button
                  key={variant.name}
                  onClick={() => setSelectedVariant(variant.name)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedVariant === variant.name
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <p className="text-2xl font-bold text-orange-600">{formatPrice(getPrice())}</p>
            {item.preparationTime && (
              <p className="text-xs text-gray-500">⏱️ {item.preparationTime} min</p>
            )}
          </div>

          <div className="text-black flex items-center gap-2">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 py-1 hover:bg-gray-100">-</button>
              <span className="px-3 py-1 font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-2 py-1 hover:bg-gray-100">+</button>
            </div>
            <button
              onClick={handleAddToCart}
              className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}