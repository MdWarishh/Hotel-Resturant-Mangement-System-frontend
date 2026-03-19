// frontend/app/allinone/[hotelCode]/page.js

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getPublicMenu, getHotelByCode, formatPrice } from '@/services/allinonApi';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import axios from 'axios';
import CartDrawer from '@/components/allinone/CartDrawer';
import TrackOrderModal from '@/components/allinone/TrackOrderModal';
import StarRating from '@/components/allinone/StarRating';

export default function PublicMenuPage({ params }) {
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
    if (hotelCode) fetchData();
  }, [hotelCode]);

  useEffect(() => {
    if (menu.length > 0) fetchAllRatings();
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
      } catch {
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

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }
          .loader-ring { animation: spin 1s linear infinite; }
          .loader-text { animation: pulse-glow 1.5s ease-in-out infinite; font-family: 'DM Sans', sans-serif; }
        `}</style>
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="loader-ring absolute inset-0 rounded-full border-4 border-transparent border-t-[#f97316] border-r-[#f97316]/40"></div>
            <div className="absolute inset-3 rounded-full bg-[#f97316]/10 flex items-center justify-center">
              <span className="text-lg">🍽️</span>
            </div>
          </div>
          <p className="loader-text text-[#f97316] text-sm font-semibold tracking-widest uppercase">Loading Menu…</p>
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0e0c] flex items-center justify-center p-4">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
        <div className="bg-[#1a1916] border border-[#2a2926] rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
          <div className="text-5xl mb-5">⚠️</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-[#9a9690] mb-8 text-sm leading-relaxed">{error}</p>
          <button
            onClick={() => router.push('/allinone')}
            className="px-8 py-3 bg-[#f97316] text-white rounded-2xl font-semibold text-sm tracking-wide hover:bg-[#ea6b0e] transition-all active:scale-95 shadow-lg shadow-orange-900/40"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            ← Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Page ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: '#faf8f5', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 99px; }

        /* Category pill scrollbar hide */
        .cat-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .cat-scroll::-webkit-scrollbar { display: none; }

        /* Card hover */
        .menu-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .menu-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px -12px rgba(249,115,22,0.18); }

        /* Cart badge pulse */
        @keyframes badge-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .badge-pop { animation: badge-pop 0.3s ease; }

        /* Fade-in items */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .fade-up-delay-1 { animation-delay: 0.05s; opacity: 0; }
        .fade-up-delay-2 { animation-delay: 0.1s; opacity: 0; }
        .fade-up-delay-3 { animation-delay: 0.15s; opacity: 0; }

        /* Float btn */
        .float-btn { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .float-btn:hover { transform: translateY(-2px) scale(1.04); }
        .float-btn:active { transform: scale(0.97); }

        /* Add btn */
        .add-btn { transition: all 0.18s ease; }
        .add-btn:hover { background: #ea6b0e; transform: scale(1.03); }
        .add-btn:active { transform: scale(0.97); }

        /* Search focus */
        .search-input:focus { box-shadow: 0 0 0 3px rgba(249,115,22,0.2); }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#ede9e3] sticky top-0 z-40" style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Back + Name */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/allinone')}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#faf8f5] border border-[#ede9e3] flex items-center justify-center hover:bg-[#f0ebe4] hover:border-[#f97316]/30 transition-all"
              >
                <svg className="w-4 h-4 text-[#6b6460]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-[#1a1412] leading-tight truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {hotel?.name}
                </h1>
                <p className="text-xs text-[#b5afa8] tracking-widest uppercase">{hotel?.code}</p>
              </div>
            </div>

            {/* Right: Cart */}
            <button
              onClick={openCart}
              className="flex-shrink-0 relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {getItemCount() > 0 && (
                <span className="badge-pop absolute -top-2 -right-2 bg-[#ef4444] text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── SEARCH ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#ede9e3] sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="relative max-w-xl">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5afa8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search dishes, drinks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input w-full pl-10 pr-4 py-2.5 bg-[#faf8f5] border border-[#ede9e3] rounded-xl text-sm text-[#1a1412] placeholder-[#c5bfb8] outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#c5bfb8] flex items-center justify-center hover:bg-[#a09890]"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CATEGORIES ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#ede9e3] sticky top-[121px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cat-scroll flex gap-2 py-3 overflow-x-auto">
            {filteredMenu.map((categoryData) => {
              const isActive = selectedCategory === categoryData.category._id;
              return (
                <button
                  key={categoryData.category._id}
                  onClick={() => setSelectedCategory(categoryData.category._id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
                  } : {
                    background: '#faf8f5',
                    color: '#6b6460',
                    border: '1.5px solid #ede9e3',
                  }}
                >
                  {categoryData.category.name}
                  <span
                    className="text-xs rounded-full px-1.5 py-0.5 font-bold"
                    style={isActive
                      ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                      : { background: '#ede9e3', color: '#9a9690' }
                    }
                  >
                    {categoryData.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        {activeCategoryData ? (
          <>
            {/* Category heading */}
            <div className="mb-6 fade-up">
              <h2
                className="text-2xl sm:text-3xl font-bold text-[#1a1412] leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {activeCategoryData.category.name}
              </h2>
              {activeCategoryData.category.description && (
                <p className="text-[#9a9690] mt-1.5 text-sm leading-relaxed max-w-lg">
                  {activeCategoryData.category.description}
                </p>
              )}
              <div className="mt-2 w-12 h-0.5 rounded-full bg-[#f97316]"></div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeCategoryData.items.map((item, idx) => (
                <div
                  key={item._id}
                  className={`fade-up ${idx % 3 === 1 ? 'fade-up-delay-1' : idx % 3 === 2 ? 'fade-up-delay-2' : ''}`}
                >
                  <MenuItem
                    item={item}
                    onAddToCart={addToCart}
                    rating={itemRatings[item._id]}
                    hotelCode={hotelCode}
                    onRatingUpdate={fetchAllRatings}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center fade-up">
            <div className="w-20 h-20 rounded-3xl bg-[#fde8d4] flex items-center justify-center mb-5 text-4xl">🔍</div>
            <h3 className="text-xl font-bold text-[#1a1412] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>No dishes found</h3>
            <p className="text-[#9a9690] text-sm">Try a different search term</p>
          </div>
        )}
      </main>

      {/* ── FLOATING TRACK ORDER ───────────────────────────────────── */}
      <button
        onClick={() => setTrackModalOpen(true)}
        className="float-btn fixed bottom-6 left-4 sm:left-6 z-30 flex items-center gap-2 px-5 py-3 text-white text-sm font-semibold rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
          boxShadow: '0 6px 24px rgba(29,78,216,0.4)',
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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

// ─────────────────────────────────────────────────────────────────────────────
// ⭐ Star Display
// ─────────────────────────────────────────────────────────────────────────────
function StarDisplay({ rating, totalReviews, onReviewClick }) {
  const filled = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${star <= filled ? 'text-amber-400' : 'text-[#e8e3dc]'}`}
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {totalReviews > 0 ? (
        <span className="text-[11px] text-[#9a9690] font-medium">
          {rating?.toFixed(1)} <span className="text-[#c5bfb8]">({totalReviews})</span>
        </span>
      ) : (
        <span className="text-[11px] text-[#c5bfb8]">No reviews</span>
      )}
      <button
        onClick={onReviewClick}
        className="text-[11px] text-[#f97316] font-semibold hover:text-[#ea580c] transition-colors ml-0.5"
      >
        + Rate
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 🍽️ Menu Item Card
// ─────────────────────────────────────────────────────────────────────────────
function MenuItem({ item, onAddToCart, rating, hotelCode, onRatingUpdate }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);

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
      quantity,
      images: item.images,
      preparationTime: item.preparationTime,
    });
    setQuantity(1);
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1200);
  };

  const typeConfig = {
    veg: { border: '#22c55e', dot: '#22c55e', label: 'Veg' },
    'non-veg': { border: '#ef4444', dot: '#ef4444', label: 'Non-Veg' },
    beverage: { border: '#60a5fa', dot: '#60a5fa', label: 'Beverage' },
  };
  const type = typeConfig[item.type] || null;

  const spicyMap = {
    mild: { label: '🌶 Mild', bg: '#fefce8', color: '#a16207' },
    medium: { label: '🌶🌶 Medium', bg: '#fff7ed', color: '#c2410c' },
    hot: { label: '🌶🌶🌶 Hot', bg: '#fef2f2', color: '#b91c1c' },
  };
  const spicy = spicyMap[item.spicyLevel];

  return (
    <>
      <div
        className="menu-card bg-white rounded-2xl overflow-hidden flex flex-col h-full"
        style={{ border: '1.5px solid #ede9e3', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
      >
        {/* Image */}
        <div className="relative h-44 overflow-hidden flex-shrink-0">
          {item.images && item.images.length > 0 ? (
            <Image
              src={item.images[0]}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="h-full flex items-center justify-center text-5xl"
              style={{ background: 'linear-gradient(135deg, #fde8d4 0%, #fecba1 50%, #fed7aa 100%)' }}
            >
              🍽️
            </div>
          )}

          {/* Veg/Non-veg badge */}
          {type && (
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
              style={{
                background: 'rgba(255,255,255,0.95)',
                border: `2px solid ${type.border}`,
                color: '#374151',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: type.dot }}></div>
              {type.label}
            </div>
          )}

          {/* Prep time badge */}
          {item.preparationTime && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white font-medium"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {item.preparationTime}m
            </div>
          )}

          {/* "Added!" flash overlay */}
          {addedFlash && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.15)', backdropFilter: 'blur(2px)' }}>
              <span className="bg-[#f97316] text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg">✓ Added!</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-base font-bold text-[#1a1412] leading-tight mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {item.name}
          </h3>

          {/* Stars */}
          <div className="mb-2">
            <StarDisplay
              rating={rating?.averageRating || 0}
              totalReviews={rating?.totalReviews || 0}
              onReviewClick={() => setShowReviewModal(true)}
            />
          </div>

          {item.description && (
            <p className="text-xs text-[#9a9690] mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs font-semibold rounded-full"
                  style={{ background: '#fff5ee', color: '#c2410c', border: '1px solid #fed7aa' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Spicy level */}
          {spicy && item.spicyLevel !== 'none' && (
            <div className="mb-3">
              <span
                className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: spicy.bg, color: spicy.color }}
              >
                {spicy.label}
              </span>
            </div>
          )}

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-[#6b6460] mb-1.5 uppercase tracking-wide">Size</p>
              <div className="flex flex-wrap gap-1.5">
                {item.variants.map((variant) => {
                  const isSelected = selectedVariant === variant.name;
                  return (
                    <button
                      key={variant.name}
                      onClick={() => setSelectedVariant(variant.name)}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                      style={isSelected ? {
                        background: '#f97316', color: '#fff', border: '1.5px solid #f97316',
                      } : {
                        background: '#faf8f5', color: '#6b6460', border: '1.5px solid #ede9e3',
                      }}
                    >
                      {variant.name} · ₹{variant.price}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price + Qty + Add */}
          <div className="mt-auto pt-3 border-t border-[#f5f0ea] flex items-center justify-between gap-2">
            <div>
              <p className="text-xl font-extrabold text-[#1a1412] leading-none">{formatPrice(getPrice())}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Quantity stepper */}
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{ border: '1.5px solid #ede9e3', background: '#faf8f5' }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-[#6b6460] font-bold text-base hover:bg-[#ede9e3] transition-colors"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-bold text-[#1a1412]">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-[#6b6460] font-bold text-base hover:bg-[#ede9e3] transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="add-btn px-5 py-2 text-white text-sm font-bold rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReviewModal && (
        <ReviewModal
          item={item}
          hotelCode={hotelCode}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={() => onRatingUpdate && onRatingUpdate()}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ⭐ Review Modal
// ─────────────────────────────────────────────────────────────────────────────
function ReviewModal({ item, hotelCode, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async () => {
    if (!rating) return setError('Please select a rating');
    if (!name.trim()) return setError('Please enter your name');
    if (!phone.trim()) return setError('Please enter your phone number');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/allinone/${hotelCode}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId: item._id, rating, comment, customer: { name, phone } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ['', '😞 Poor', '😐 Fair', '🙂 Good', '😊 Great', '🤩 Excellent!'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden"
        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-5 flex items-start justify-between"
          style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
        >
          <div>
            <h3 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Rate this dish
            </h3>
            <p className="text-orange-100 text-sm mt-0.5 opacity-90">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Star Picker */}
          <div className="text-center">
            <p className="text-xs font-semibold text-[#9a9690] uppercase tracking-widest mb-3">How was it?</p>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-125 active:scale-110"
                >
                  <svg
                    className={`w-10 h-10 transition-all duration-150 ${star <= (hovered || rating) ? 'text-amber-400 drop-shadow-sm' : 'text-[#e8e3dc]'}`}
                    fill="currentColor" viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm font-semibold text-[#f97316] mt-2">{ratingLabels[rating]}</p>
            )}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience (optional)…"
            rows={3}
            className="w-full px-4 py-3 text-sm text-[#1a1412] placeholder-[#c5bfb8] rounded-xl outline-none resize-none transition-all"
            style={{ border: '1.5px solid #ede9e3', background: '#faf8f5' }}
            onFocus={e => e.target.style.borderColor = '#f97316'}
            onBlur={e => e.target.style.borderColor = '#ede9e3'}
          />

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: name, onChange: setName, placeholder: 'Your name *', type: 'text' },
              { value: phone, onChange: setPhone, placeholder: 'Phone *', type: 'tel' },
            ].map((field, i) => (
              <input
                key={i}
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                type={field.type}
                className="px-4 py-2.5 text-sm text-[#1a1412] placeholder-[#c5bfb8] rounded-xl outline-none transition-all"
                style={{ border: '1.5px solid #ede9e3', background: '#faf8f5' }}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = '#ede9e3'}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-center font-medium" style={{ color: '#ef4444' }}>{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 text-white text-sm font-bold rounded-xl transition-all active:scale-98 disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              boxShadow: '0 6px 20px rgba(249,115,22,0.35)',
            }}
          >
            {loading ? 'Submitting…' : 'Submit Review ⭐'}
          </button>
        </div>
      </div>
    </div>
  );
}