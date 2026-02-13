'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { ArrowLeft, DoorOpen, Bed, Users, CreditCard, FileText, Loader2, AlertCircle, Trash2, Edit3, Calendar, Lock, Unlock, Image as ImageIcon, Save, X } from 'lucide-react';

export default function RoomDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [images, setImages] = useState([]); // { url or preview, file for new }
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const availableAmenities = [
    'AC', 'WiFi', 'TV', 'Mini Bar', 'Room Service', 'Safe', 'Hair Dryer', 'Iron', 'Coffee Maker', 'Refrigerator'
  ];

  // Fetch room data
// Change this part in your useEffect
useEffect(() => {
  const fetchRoom = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/rooms/${id}`);
      console.log('Fetched Room Data:', res.data);
      
      // FIX: Access the nested room property from the response
      const roomData = res.data?.room || res.data; 
      setRoom(roomData); 
      
      // Also initialize amenities and images here to ensure View Mode works immediately
      setAmenities(roomData.amenities || []);
      setImages((roomData.images || []).map(url => ({ url, preview: url })));
      
    } catch (err) {
      console.error('Fetch Error:', err);
      setErrors(['Failed to load room details']);
    } finally {
      setLoading(false);
    }
  };
  fetchRoom();
}, [id]);

  useEffect(() => {
    if (room) {
      console.log('Setting form from room:', room);
      setForm({
        roomNumber: room.roomNumber || '',
        roomType: room.roomType || 'deluxe',
        floor: room.floor || 0,
        adults: room.capacity?.adults || 1,
        children: room.capacity?.children || 0,
        basePrice: room.pricing?.basePrice || '',
        weekendPrice: room.pricing?.weekendPrice || '',
        extraAdultCharge: room.pricing?.extraAdultCharge || '',
        extraChildCharge: room.pricing?.extraChildCharge || '',
        description: room.description || '',
        bedType: room.features?.bedType || 'double',
        view: room.features?.view || 'none',
        smokingAllowed: room.features?.smokingAllowed || false,
        petsAllowed: room.features?.petsAllowed || false,
        balcony: room.features?.balcony || false,
        bathroom: room.features?.bathroom || 'attached',
      });
    }
  }, [room]);

// Add this useEffect to sync the images/amenities when you enter Edit Mode
useEffect(() => {
  if (isEditMode && room) {
    setAmenities(room.amenities || []);
    setImages((room.images || []).map(url => ({ url, preview: url })));
  }
}, [isEditMode, room]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
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
      if (prev[index].preview.startsWith('blob:')) URL.revokeObjectURL(prev[index].preview);
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);

    try {
      const base64NewImages = await Promise.all(
        images.filter(img => img.file).map(img => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(img.file);
        }))
      );

      const existingImageUrls = images.filter(img => !img.file).map(img => img.url);

      const payload = {
        roomNumber: form.roomNumber.trim(),
        roomType: form.roomType,
        floor: Number(form.floor),
        capacity: {
          adults: Number(form.adults),
          children: Number(form.children),
        },
        pricing: {
          basePrice: Number(form.basePrice),
          weekendPrice: form.weekendPrice ? Number(form.weekendPrice) : undefined,
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
        images: [...existingImageUrls, ...base64NewImages], // merge existing + new
      };

      await apiRequest(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      // Refresh data
      const res = await apiRequest(`/rooms/${id}`);
      setRoom(res.data);
      setForm({ ...form, ...res.data }); // update form
      setAmenities(res.data.amenities || []);
      setImages((res.data.images || []).map(url => ({ url, preview: url })));
      setIsEditMode(false);
      alert('Room updated successfully!');
    } catch (err) {
      setErrors([err.message || 'Update failed']);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/rooms/${id}`, { method: 'DELETE' });
      router.push('/hotel-admin/rooms');
    } catch (err) {
      alert(err.message || 'Failed to delete room');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[rgb(0,173,181)]" />
        <p className="ml-4 text-lg">Loading room details...</p>
      </div>
    );
  }

 if (errors.length > 0 || !room) {
    return (
      <div className="text-center p-10 text-red-600 text-xl">
        {errors[0] || 'Room data not available'}
      </div>
    );
  }

  console.log('Rendering with room:', room); // Debug: Ye print hoga agar render ho raha hai

  const capType = (room.roomType || 'Unknown').charAt(0).toUpperCase() + (room.roomType || '').slice(1);
  const capStatus = (room.status || 'unknown').charAt(0).toUpperCase() + (room.status || '').slice(1);

  const isOccupied = room.status === 'occupied';
  const canCheckIn = ['available', 'reserved'].includes(room.status);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow border">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6 text-[rgb(0,173,181)]" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {room.roomNumber} - {capType}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Floor {room.floor ?? 'N/A'} • {capStatus}
            </p>
          </div>
        </div>

        {!isEditMode ? (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Edit3 size={18} />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save
            </button>
            <button
              onClick={() => setIsEditMode(false)}
              className="flex items-center gap-2 px-5 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        )}
      </div>

      {!isEditMode ? (
        /* VIEW MODE */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DoorOpen className="text-[rgb(0,173,181)]" /> Basic Info
            </h3>
            <div className="space-y-3">
              <p><strong>Room No:</strong> {room.roomNumber || 'N/A'}</p>
              <p><strong>Type:</strong> {capType}</p>
              <p><strong>Floor:</strong> {room.floor ?? 'N/A'}</p>
              <p><strong>Status:</strong> {capStatus}</p>
              <p><strong>Description:</strong> {room.description || '—'}</p>
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="text-[rgb(0,173,181)]" /> Capacity
            </h3>
            <div className="space-y-3">
              <p><strong>Adults:</strong> {room.capacity?.adults ?? 0}</p>
              <p><strong>Children:</strong> {room.capacity?.children ?? 0}</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="text-[rgb(0,173,181)]" /> Pricing
            </h3>
            <div className="space-y-3">
              <p><strong>Base:</strong> ₹{room.pricing?.basePrice ?? 0}</p>
              <p><strong>Weekend:</strong> ₹{room.pricing?.weekendPrice ?? '—'}</p>
              <p><strong>Extra Adult:</strong> ₹{room.pricing?.extraAdultCharge ?? 0}</p>
              <p><strong>Extra Child:</strong> ₹{room.pricing?.extraChildCharge ?? 0}</p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bed className="text-[rgb(0,173,181)]" /> Features & Amenities
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="space-y-2">
                  <li>Bed Type: {room.features?.bedType || 'N/A'}</li>
                  <li>View: {room.features?.view || 'N/A'}</li>
                  <li>Smoking: {room.features?.smokingAllowed ? 'Yes' : 'No'}</li>
                  <li>Pets: {room.features?.petsAllowed ? 'Yes' : 'No'}</li>
                  <li>Balcony: {room.features?.balcony ? 'Yes' : 'No'}</li>
                  <li>Bathroom: {room.features?.bathroom || 'N/A'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {room.amenities?.length > 0 ? (
                    room.amenities.map((a, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          {room.images?.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="text-[rgb(0,173,181)]" /> Images
              </h3>
              <div className="grid grid-cols-2 gap-4">
  {room.images && room.images.map((imgObj, index) => (
    <img
      key={index}
      src={imgObj.url} // Access the .url property of the object
      alt={`Room view ${index + 1}`}
      className="w-full h-48 object-cover rounded-lg border"
    />
  ))}
</div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow lg:col-span-2 text-center text-gray-500">
              No images
            </div>
          )}

          {/* Current Booking */}
          {room.currentBooking ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="text-[rgb(0,173,181)]" /> Current Booking
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <p><strong>Guest:</strong> {room.currentBooking.guestName || 'N/A'}</p>
                <p><strong>Check-in:</strong> {room.currentBooking.checkIn ? new Date(room.currentBooking.checkIn).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Check-out:</strong> {room.currentBooking.checkOut ? new Date(room.currentBooking.checkOut).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Advance:</strong> ₹{room.currentBooking.advancePayment || 0}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow lg:col-span-2 text-center text-gray-500">
              No active booking
            </div>
          )}
        </div>
      ) : (
        /* EDIT MODE - Full form with all fields */
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border shadow">
          <h2 className="text-2xl font-bold mb-6">Edit Room</h2>

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded">
              {errors.map((err, i) => <p key={i}>{err}</p>)}
            </div>
          )}

          <div className="space-y-8">
            {/* Basic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Room Number *</label>
                <input
                  name="roomNumber"
                  value={form.roomNumber}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Room Type *</label>
                <select
                  name="roomType"
                  value={form.roomType}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Floor</label>
                <input
                  type="number"
                  name="floor"
                  value={form.floor}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  min="0"
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Adults</label>
                <input
                  type="number"
                  name="adults"
                  value={form.adults}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Children</label>
                <input
                  type="number"
                  name="children"
                  value={form.children}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  min="0"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Base Price (₹) *</label>
                <input
                  type="number"
                  name="basePrice"
                  value={form.basePrice}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weekend Price (₹)</label>
                <input
                  type="number"
                  name="weekendPrice"
                  value={form.weekendPrice}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Extra Adult (₹)</label>
                <input
                  type="number"
                  name="extraAdultCharge"
                  value={form.extraAdultCharge}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Extra Child (₹)</label>
                <input
                  type="number"
                  name="extraChildCharge"
                  value={form.extraChildCharge}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                  min="0"
                />
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Bed Type</label>
                <select
                  name="bedType"
                  value={form.bedType}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="queen">Queen</option>
                  <option value="king">King</option>
                  <option value="twin">Twin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">View</label>
                <select
                  name="view"
                  value={form.view}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                >
                  <option value="none">None</option>
                  <option value="city">City</option>
                  <option value="garden">Garden</option>
                  <option value="pool">Pool</option>
                  <option value="mountain">Mountain</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="smokingAllowed" checked={form.smokingAllowed} onChange={handleChange} />
                  Smoking Allowed
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="petsAllowed" checked={form.petsAllowed} onChange={handleChange} />
                  Pets Allowed
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="balcony" checked={form.balcony} onChange={handleChange} />
                  Balcony
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bathroom Type</label>
                <select
                  name="bathroom"
                  value={form.bathroom}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)]"
                >
                  <option value="shared">Shared</option>
                  <option value="attached">Attached</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium mb-2">Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableAmenities.map(a => (
                  <label key={a} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={amenities.includes(a)}
                      onChange={() => handleAmenityToggle(a)}
                    />
                    {a}
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[rgb(0,173,181)] h-32"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium mb-2">Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              <div className="grid grid-cols-3 gap-4 mt-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img.preview || img.url} alt="" className="w-full h-32 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete Room?</h3>
            <p className="mb-6">Are you sure? This cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2 border rounded-lg">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-6 py-2 bg-red-600 text-white rounded-lg">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}