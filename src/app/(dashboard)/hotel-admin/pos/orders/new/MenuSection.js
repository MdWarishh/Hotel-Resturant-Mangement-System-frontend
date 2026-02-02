'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/services/api';
import { useOrder } from '@/context/OrderContext';
import { Loader2, X, Tag } from 'lucide-react';

/**
 * POS Menu Section
 * - Fetches full menu (category-wise)
 * - Allows item + variant selection
 */
export default function MenuSection() {
  const { addItem } = useOrder();

  const [menu, setMenu] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [variantPicker, setVariantPicker] = useState(null);

  /**
   * Fetch full menu
   */
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await apiRequest('/pos/menu');
        setMenu(res.data.menu || []);
        if (res.data.menu?.length) {
          setActiveCategoryId(res.data.menu[0].category._id);
        }
      } catch (err) {
        console.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  /**
   * Handle add item (variant enforced)
   */
  const handleAddItem = (item, variant = null) => {
    addItem({
      menuItemId: item._id,
      name: item.name,
      variant,
      price: variant
        ? item.variants.find((v) => v.name === variant)?.price
        : item.price,
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[rgb(0,173,181)]" />
          <p className="text-sm text-[rgb(57,62,70)]">Loading menu...</p>
        </div>
      </div>
    );
  }

  const activeCategory = menu.find((c) => c.category._id === activeCategoryId);

  return (
    <div className="flex h-full">
      {/* CATEGORIES */}
      <div className="w-1/4 space-y-1 border-r border-[rgb(57,62,70)]/10 bg-[rgb(238,238,238)]/50 p-3">
        {menu.map((cat) => {
          const isActive = activeCategoryId === cat.category._id;
          return (
            <button
              key={cat.category._id}
              onClick={() => setActiveCategoryId(cat.category._id)}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[rgb(0,173,181)] text-white shadow-lg'
                  : 'bg-white text-[rgb(57,62,70)] hover:bg-[rgb(238,238,238)]'
              }`}
            >
              {cat.category.name}
            </button>
          );
        })}
      </div>

      {/* ITEMS */}
      <div className="w-3/4 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {activeCategory?.items.map((item) => (
            <button
              key={item._id}
              onClick={() => {
                if (item.variants?.length) {
                  setVariantPicker(item);
                } else {
                  handleAddItem(item);
                }
              }}
              className="group rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-4 text-left shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <h4 className="mb-2 font-semibold text-[rgb(34,40,49)]">
                {item.name}
              </h4>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[rgb(0,173,181)]" />
                <p className="text-sm font-medium text-[rgb(0,173,181)]">
                  ₹{item.price}
                </p>
              </div>
              {item.variants?.length > 0 && (
                <p className="mt-2 text-xs text-[rgb(57,62,70)]">
                  {item.variants.length} variants available
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* VARIANT PICKER MODAL */}
      {variantPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(34,40,49)]/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-[modalSlide_0.3s_ease-out] rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[rgb(34,40,49)]">
                Select Variant
              </h3>
              <button
                onClick={() => setVariantPicker(null)}
                className="rounded-lg p-1 text-[rgb(57,62,70)] transition-colors hover:bg-[rgb(238,238,238)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {variantPicker.variants.map((v) => (
                <button
                  key={v.name}
                  onClick={() => {
                    handleAddItem(variantPicker, v.name);
                    setVariantPicker(null);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-[rgb(57,62,70)]/10 bg-[rgb(238,238,238)]/30 px-4 py-3 text-left transition-all hover:bg-[rgb(0,173,181)] hover:text-white"
                >
                  <span className="font-medium">{v.name}</span>
                  <span className="font-semibold">₹{v.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalSlide {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}