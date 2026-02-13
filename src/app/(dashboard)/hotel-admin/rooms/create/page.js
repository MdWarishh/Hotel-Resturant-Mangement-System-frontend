'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, DoorOpen, Bed, Users, CreditCard, FileText, Loader2, AlertCircle, Layers, Plus, X, Image as ImageIcon } from 'lucide-react';

export default function CreateRoomPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    roomNumber: '',
    roomType: 'deluxe',
    floor: 0,
    adults: 1,
    children: 0,
    basePrice: '',
    weekendPrice: '',
    extraAdultCharge: '',
    extraChildCharge: '',
    description: '',
    bedType: 'double',
    view: 'none',
    smokingAllowed: false,
    petsAllowed: false,
    balcony: false,
    bathroom: 'attached',
  });

  const [amenities, setAmenities] = useState([]); // array of selected amenities
  const [images, setImages] = useState([]); // array of { file, preview }
  const [showWeekendPrice, setShowWeekendPrice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // per field errors

  const availableAmenities = [
    'AC', 'WiFi', 'TV', 'Mini Bar', 'Room Service', 'Safe', 'Hair Dryer', 'Iron', 'Coffee Maker', 'Refrigerator'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error on change
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAmenityToggle = (amenity) => {
    setAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].preview); // cleanup
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Simple validation
    const newErrors = {};
    if (!form.roomNumber.trim()) newErrors.roomNumber = 'Room number is required';
    if (!form.roomType) newErrors.roomType = 'Room type is required';
    if (form.floor < 0) newErrors.floor = 'Floor cannot be negative';
    if (form.basePrice <= 0) newErrors.basePrice = 'Base price must be greater than 0';
    // Add more as needed

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

  try {
    // 1. Process images into the new object structure
    const imagePromises = images.map(img => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result; // This includes the "data:image/..." prefix
        resolve({
          url: base64Data, // Your backend will receive this Base64 string
          public_id: `temp_${Date.now()}_${img.file.name}`, // Temporary ID for now
          isPrimary: false
        });
      };
      reader.readAsDataURL(img.file);
    }));

    const formattedImages = await Promise.all(imagePromises);

      const payload = {
        hotel: user.hotel,
        roomNumber: form.roomNumber.trim().toUpperCase(),
        roomType: form.roomType,
        floor: Number(form.floor),
        capacity: {
          adults: Number(form.adults),
          children: Number(form.children),
        },
        pricing: {
          basePrice: Number(form.basePrice),
          weekendPrice: showWeekendPrice && form.weekendPrice ? Number(form.weekendPrice) : undefined,
          extraAdultCharge: form.extraAdultCharge ? Number(form.extraAdultCharge) : undefined,
          extraChildCharge: form.extraChildCharge ? Number(form.extraChildCharge) : undefined,
        },
        description: form.description,
        amenities,
        features: {
          bedType: form.bedType,
          view: form.view,
          smokingAllowed: form.smokingAllowed,
          petsAllowed: form.petsAllowed,
          balcony: form.balcony,
          bathroom: form.bathroom,
        },
        images: formattedImages, // backend needs to handle base64 array
      };

      await apiRequest('/rooms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push('/hotel-admin/rooms');
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors.reduce((acc, e) => ({ ...acc, [e.field]: e.message }), {}));
      } else {
        setErrors({ general: err.message || 'Failed to create room' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-lg dark:bg-gray-800">
        <div>
          <h2 className="text-3xl font-bold text-[rgb(34,40,49)] dark:text-white">Add New Room</h2>
          <p className="mt-2 text-[rgb(57,62,70)] dark:text-gray-400">
            Fill in the details to create a new room in your hotel
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.general && (
          <div className="rounded-lg bg-red-100 p-4 text-red-700">
            {errors.general}
          </div>
        )}

        {/* Basic Section */}
        <FormSection title="Basic Information" icon={<DoorOpen className="h-5 w-5" />}>
          <Input
            label="Room Number *"
            name="roomNumber"
            value={form.roomNumber}
            onChange={handleChange}
            placeholder="e.g. 101"
            error={errors.roomNumber}
          />
          <Select
            label="Room Type *"
            name="roomType"
            value={form.roomType}
            onChange={handleChange}
            error={errors.roomType}
          >
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="deluxe">Deluxe</option>
            <option value="suite">Suite</option>
            <option value="premium">Premium</option>
          </Select>
          <Input
            label="Floor"
            name="floor"
            type="number"
            value={form.floor}
            onChange={handleChange}
            placeholder="e.g. 3"
            min="0"
            error={errors.floor}
          />
          <Input
            label="Description"
            name="description"
            type="textarea"
            value={form.description}
            onChange={handleChange}
            placeholder="Room details, special notes..."
            rows="4"
          />
        </FormSection>

        {/* Capacity */}
        <FormSection title="Capacity" icon={<Users className="h-5 w-5" />}>
          <Input
            label="Adults"
            name="adults"
            type="number"
            value={form.adults}
            onChange={handleChange}
            min="1"
          />
          <Input
            label="Children"
            name="children"
            type="number"
            value={form.children}
            onChange={handleChange}
            min="0"
          />
        </FormSection>

        {/* Pricing */}
        <FormSection title="Pricing" icon={<CreditCard className="h-5 w-5" />}>
          <Input
            label="Base Price (₹) *"
            name="basePrice"
            type="number"
            value={form.basePrice}
            onChange={handleChange}
            min="0"
            error={errors.basePrice}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showWeekendPrice}
              onChange={(e) => setShowWeekendPrice(e.target.checked)}
              className="h-5 w-5 text-[rgb(0,173,181)]"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Different weekend price?</label>
          </div>
          {showWeekendPrice && (
            <Input
              label="Weekend Price (₹)"
              name="weekendPrice"
              type="number"
              value={form.weekendPrice}
              onChange={handleChange}
              min="0"
            />
          )}
          <Input
            label="Extra Adult Charge (₹)"
            name="extraAdultCharge"
            type="number"
            value={form.extraAdultCharge}
            onChange={handleChange}
            min="0"
          />
          <Input
            label="Extra Child Charge (₹)"
            name="extraChildCharge"
            type="number"
            value={form.extraChildCharge}
            onChange={handleChange}
            min="0"
          />
        </FormSection>

        {/* Features */}
        <FormSection title="Features" icon={<Bed className="h-5 w-5" />}>
          <Select
            label="Bed Type"
            name="bedType"
            value={form.bedType}
            onChange={handleChange}
          >
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="queen">Queen</option>
            <option value="king">King</option>
            <option value="twin">Twin</option>
          </Select>
          <Select
            label="View"
            name="view"
            value={form.view}
            onChange={handleChange}
          >
            <option value="none">None</option>
            <option value="city">City</option>
            <option value="garden">Garden</option>
            <option value="pool">Pool</option>
            <option value="mountain">Mountain</option>
            <option value="ocean">Ocean</option>
          </Select>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" name="smokingAllowed" checked={form.smokingAllowed} onChange={handleChange} className="h-5 w-5 text-[rgb(0,173,181)]" />
              <label>Smoking Allowed</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="petsAllowed" checked={form.petsAllowed} onChange={handleChange} className="h-5 w-5 text-[rgb(0,173,181)]" />
              <label>Pets Allowed</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="balcony" checked={form.balcony} onChange={handleChange} className="h-5 w-5 text-[rgb(0,173,181)]" />
              <label>Balcony</label>
            </div>
          </div>
          <Select
            label="Bathroom Type"
            name="bathroom"
            value={form.bathroom}
            onChange={handleChange}
          >
            <option value="shared">Shared</option>
            <option value="attached">Attached</option>
            <option value="premium">Premium</option>
          </Select>
        </FormSection>

        {/* Amenities */}
        <FormSection title="Amenities" icon={<Layers className="h-5 w-5" />}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableAmenities.map((amenity) => (
              <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="h-5 w-5 text-[rgb(0,173,181)] rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{amenity}</span>
              </label>
            ))}
          </div>
        </FormSection>

        {/* Images */}
        <FormSection title="Room Images" icon={<ImageIcon className="h-5 w-5" />}>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[rgb(0,173,181)] file:text-white hover:file:bg-[rgb(0,173,181)]/90"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm">
                  <img src={img.preview} alt={`Preview ${idx}`} className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            {images.length === 0 && <p className="text-gray-500 text-center">No images selected</p>}
          </div>
        </FormSection>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-[rgb(0,173,181)] text-white rounded-lg font-medium hover:bg-[rgb(0,173,181)]/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Room'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Reusable Components (same as before, but add error prop if needed) */
function FormSection({ title, icon, children }) {
  return (
    <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl border shadow">
      <div className="flex items-center gap-2 border-b pb-2">
        <div className="text-[rgb(0,173,181)]">{icon}</div>
        <h3 className="text-lg font-semibold text-[rgb(34,40,49)] dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Input({ label, icon, error, ...props }) {
  return (
    <div className="group">
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full rounded-lg border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-[rgb(0,173,181)] focus:ring-2 focus:ring-[rgb(0,173,181)]/30 ${icon ? 'pl-10' : 'pl-3'}`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Select({ label, icon, error, children, ...props }) {
  return (
    <div className="group">
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <select
          {...props}
          className={`w-full rounded-lg border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-[rgb(0,173,181)] focus:ring-2 focus:ring-[rgb(0,173,181)]/30 ${icon ? 'pl-10' : 'pl-3'}`}
        >
          {children}
        </select>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}