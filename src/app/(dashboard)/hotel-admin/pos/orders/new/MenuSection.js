'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { useOrder } from '@/context/OrderContext';
import { Loader2, X, Search, AlertCircle, Plus, Minus } from 'lucide-react';

export default function MenuSection() {
  const { addItem } = useOrder();

  const [menu, setMenu] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState('all'); // 'all' = sabhi items
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [variantPicker, setVariantPicker] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await apiRequest('/pos/menu');
        const menuData = res.data.menu || [];
        setMenu(menuData);
        if (menuData.length) {
          setActiveCategoryId(menuData[0].category._id);
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
        setError('Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Jab category change ho, subcategory reset ho jaye
  const handleCategoryChange = (categoryId) => {
    setActiveCategoryId(categoryId);
    setActiveSubCategoryId('all');
  };

  // Active category ka data
  const activeCategory = menu.find(cat => cat.category._id === activeCategoryId) || menu[0];

  // Active category ke items se subcategories nikalo (unique)
  const subCategoriesInActiveCategory = (() => {
    if (!activeCategory) return [];
    const map = new Map();
    activeCategory.items.forEach(item => {
      if (item.subCategory) {
        const id = item.subCategory._id || item.subCategory;
        const name = item.subCategory.name || item.subCategory;
        if (!map.has(id)) map.set(id, { _id: id, name });
      }
    });
    return Array.from(map.values());
  })();

  // Search + subcategory filter
  const filteredItems = (() => {
    if (!activeCategory) return [];
    return activeCategory.items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubCategory =
        activeSubCategoryId === 'all' ||
        (item.subCategory &&
          (item.subCategory._id || item.subCategory) === activeSubCategoryId);

      return matchesSearch && matchesSubCategory;
    });
  })();

  // Search ke time filtered categories (category tabs ke liye)
  const filteredMenu = menu
    .map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(category => category.items.length > 0);

  const handleAddItem = (item, variant = null) => {
    if (!item.isAvailable) return;

    addItem({
      menuItemId: item._id,
      name: item.name,
      price: variant ? variant.price : item.price,
      variant: variant ? variant.name : null,
      quantity,
    });

    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[rgb(0,173,181)] text-white rounded-lg hover:bg-[rgb(0,173,181)]/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search & Categories */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setActiveSubCategoryId('all');
            }}
            className="w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-[rgb(0,173,181)] focus:ring-2 focus:ring-[rgb(0,173,181)]/30"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {menu.map((cat) => (
            <button
              key={cat.category._id}
              onClick={() => handleCategoryChange(cat.category._id)}
              className={`flex-shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategoryId === cat.category._id
                  ? 'bg-[rgb(0,173,181)] text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {cat.category.name}
            </button>
          ))}
        </div>

        {/* Sub-Category Tabs — sirf tab dikhein jab subcategories hon */}
        {subCategoriesInActiveCategory.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pt-3 pb-1 scrollbar-hide">
            {/* "All" tab */}
            <button
              onClick={() => setActiveSubCategoryId('all')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeSubCategoryId === 'all'
                  ? 'bg-[rgb(0,173,181)]/15 border-[rgb(0,173,181)] text-[rgb(0,173,181)]'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[rgb(0,173,181)]'
              }`}
            >
              All
            </button>

            {subCategoriesInActiveCategory.map(sub => (
              <button
                key={sub._id}
                onClick={() => setActiveSubCategoryId(sub._id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeSubCategoryId === sub._id
                    ? 'bg-[rgb(0,173,181)]/15 border-[rgb(0,173,181)] text-[rgb(0,173,181)]'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[rgb(0,173,181)]'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No items found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {item.image && (
                  <div className="h-48 bg-gray-200 dark:bg-gray-700">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    <span className="text-lg font-bold text-[rgb(0,173,181)] ml-2 flex-shrink-0">
                      ₹{item.price}
                    </span>
                  </div>

                  {/* Sub-category badge — sirf tab dikhao jab ho */}
                  {item.subCategory && (
                    <span className="inline-block mb-2 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[rgb(0,173,181)]/10 text-[rgb(0,173,181)] border border-[rgb(0,173,181)]/30">
                      {item.subCategory.name || item.subCategory}
                    </span>
                  )}

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {item.description || 'No description'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.type && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.type === 'veg' ? 'bg-green-100 text-green-800' :
                        item.type === 'non-veg' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                    )}
                    {!item.isAvailable && (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => item.variants?.length > 0 ? setVariantPicker(item) : handleAddItem(item)}
                    disabled={!item.isAvailable}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                      item.isAvailable
                        ? 'bg-[rgb(0,173,181)] text-white hover:bg-[rgb(0,173,181)]/90'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {item.variants?.length > 0 ? 'Select Variant' : 'Add'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variant Picker Modal */}
      {variantPicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Select Variant for {variantPicker.name}
              </h3>
              <button onClick={() => setVariantPicker(null)}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="space-y-3">
              {variantPicker.variants.map((v) => (
                <button
                  key={v.name}
                  onClick={() => {
                    handleAddItem(variantPicker, v);
                    setVariantPicker(null);
                  }}
                  className="flex w-full items-center justify-between p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <span className="font-medium">{v.name}</span>
                  <span className="font-bold text-[rgb(0,173,181)]">₹{v.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}