'use client';

import { useState, useEffect } from 'react';
// import { getAllHotels } from '@/services/allinoneApi';
import Link from 'next/link';
import Image from 'next/image';
import { getAllHotels } from '@/services/allinonApi';

export const dynamic = 'force-static';

export default function AllInOneHotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Fetch hotels on mount
  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllHotels(filters);
      setHotels(response.data.hotels || []);
    } catch (err) {
      console.error('Fetch hotels error:', err);
      setError(err.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchHotels({ search: searchQuery, city: selectedCity });
  };

  // Get unique cities from hotels
  const cities = [...new Set(hotels.map((h) => h.address?.city).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🍽️ Restaurants & Hotels
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Browse menu and order online
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Powered by</p>
              <p className="text-lg font-semibold text-orange-600">Your Resturant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="bg-white border-b text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            
            {cities.length > 0 && (
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            )}

            <button
              type="submit"
              className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading restaurants...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold">⚠️ {error}</p>
            <button
              onClick={() => fetchHotels()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Hotels Grid */}
        {!loading && !error && hotels.length > 0 && (
          <div>
            <p className="text-gray-600 mb-6">
              Found {hotels.length} restaurant{hotels.length !== 1 ? 's' : ''}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel._id} hotel={hotel} />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && hotels.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No restaurants found
            </h3>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2024 Amulya Restaurant Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Hotel Card Component
function HotelCard({ hotel }) {
  return (
    <Link href={`/allinone/${hotel.code}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
        {/* Hotel Image */}
        <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-600 overflow-hidden">
          {hotel.logo ? (
            <Image
              src={hotel.logo}
              alt={hotel.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          
          {/* Code Badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-xs font-mono font-semibold text-orange-600">
              {hotel.code}
            </span>
          </div>
        </div>

        {/* Hotel Info */}
        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
            {hotel.name}
          </h3>
          
          {hotel.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {hotel.description}
            </p>
          )}

          {/* Address */}
          <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-2">
              {hotel.address?.street}, {hotel.address?.city}, {hotel.address?.state} - {hotel.address?.pincode}
            </span>
          </div>

          {/* Contact */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{hotel.contact?.phone}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-orange-600">📋</span>
              <span className="text-sm font-medium text-gray-700">
                {hotel.totalMenuCategories || 0} Categories
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-orange-600">🍴</span>
              <span className="text-sm font-medium text-gray-700">
                {hotel.totalMenuItems || 0} Items
              </span>
            </div>
          </div>

          {/* View Menu Button */}
          <button className="mt-4 w-full py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors group-hover:bg-orange-700">
            View Menu & Order
          </button>
        </div>
      </div>
    </Link>
  );
}