'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Building2, DoorOpen, User, Mail, Phone, CreditCard,
  Users, Calendar, Loader2, AlertCircle, CheckCircle2, Info, Upload, Clock,
  DollarSign, Plus, Trash2, Tag
} from 'lucide-react';

// ── Inline error component ──
function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

export default function CreateBookingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const hotelId = user?.hotel?._id;

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [pricingPreview, setPricingPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [idProofPreview, setIdProofPreview] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const [bookingType, setBookingType] = useState('daily');

  const [form, setForm] = useState({
    room: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    idProofType: 'aadhar',
    idProofNumber: '',
    idProofImage: null,
    idProofImageBase64: '',
    adults: 1,
    children: 0,
    checkInDate: '',
    checkInTime: '14:00',
    checkOutDate: '',
    checkOutTime: '12:00',
    hours: 1,
    specialRequests: '',
    advancePayment: '',
    source: 'Direct',
    manualPrice: '',
    useManualPrice: false,
    additionalGuests: [],
    customCharges: [],
    useManualDailyPrice: false,
    manualDailyPrice: '',
    paymentMethod: '', // '' = unpaid | 'cash' | 'upi' | 'card'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hotelId) return;
    apiRequest(`/rooms?hotel=${hotelId}&status=available`)
      .then(res => setRooms(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [hotelId]);

  useEffect(() => {
    if (!form.room) { setSelectedRoom(null); setPricingPreview(null); return; }
    const room = rooms.find(r => r._id === form.room);
    setSelectedRoom(room || null);
  }, [form.room, rooms]);

  useEffect(() => {
    if (bookingType === 'hourly' && form.checkInDate && form.checkInTime && form.hours) {
      const checkIn = new Date(`${form.checkInDate}T${form.checkInTime}`);
      const checkOut = new Date(checkIn.getTime() + form.hours * 60 * 60 * 1000);
      setForm(prev => ({
        ...prev,
        checkOutDate: checkOut.toISOString().split('T')[0],
        checkOutTime: checkOut.toTimeString().slice(0, 5),
      }));
    }
  }, [bookingType, form.checkInDate, form.checkInTime, form.hours]);

  const customChargesTotal = form.customCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  useEffect(() => {
    if (!selectedRoom || !form.checkInDate) { setPricingPreview(null); return; }
    if (bookingType === 'daily' && !form.checkOutDate) { setPricingPreview(null); return; }

    let newErrors = {};

    if (bookingType === 'daily') {
      const checkIn = new Date(form.checkInDate);
      const checkOut = new Date(form.checkOutDate);
      if (checkOut <= checkIn) newErrors.checkOutDate = 'Check-out must be after check-in';
      setErrors(prev => ({ ...prev, checkInDate: '', checkOutDate: '', ...newErrors }));
      if (Object.keys(newErrors).length > 0) { setPricingPreview(null); return; }

      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      let roomCharges = form.useManualDailyPrice && form.manualDailyPrice
        ? Number(form.manualDailyPrice)
        : selectedRoom.pricing.basePrice * nights;

      let extraCharges = 0;
      if (!form.useManualDailyPrice) {
        const extraAdults = Math.max(0, Number(form.adults) - (selectedRoom.capacity?.adults || 0));
        extraCharges += extraAdults * (selectedRoom.pricing.extraAdultCharge || 0) * nights;
        const extraChildren = Math.max(0, Number(form.children) - (selectedRoom.capacity?.children || 0));
        extraCharges += extraChildren * (selectedRoom.pricing.extraChildCharge || 0) * nights;
      }

      const subtotal = roomCharges + extraCharges + customChargesTotal;
      const tax = Math.ceil(subtotal * 0.05);
      setPricingPreview({ duration: nights, roomCharges, extraCharges, customChargesTotal, subtotal, tax, total: subtotal + tax, isManualPrice: form.useManualDailyPrice });
    } else {
      const duration = form.hours;
      let roomCharges = 0, hourlyRate = 0;
      if (form.useManualPrice && form.manualPrice) {
        roomCharges = Number(form.manualPrice);
        hourlyRate = null;
      } else {
        hourlyRate = selectedRoom.pricing?.hourlyRate > 0
          ? selectedRoom.pricing.hourlyRate
          : Math.ceil(selectedRoom.pricing.basePrice * 0.4);
        roomCharges = hourlyRate * duration;
      }
      const subtotal = roomCharges + customChargesTotal;
      const tax = Math.round(subtotal * 0.05);
      setPricingPreview({ duration, roomCharges, extraCharges: 0, customChargesTotal, subtotal, tax, total: subtotal + tax, hourlyRate, isManualPrice: form.useManualPrice });
    }
  }, [selectedRoom, form.checkInDate, form.checkOutDate, form.adults, form.children, form.hours, bookingType, form.useManualPrice, form.manualPrice, form.useManualDailyPrice, form.manualDailyPrice, customChargesTotal]);

  // ── Handlers ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ── Validate field on blur — show error immediately ──
  const handleBlur = (e) => {
    const { name, value } = e.target;
    let msg = '';

    if (name === 'guestName' && !value.trim()) {
      msg = 'Guest name is required';
    }
    if (name === 'guestPhone' && !value.trim()) {
      msg = 'Phone number is required';
    }
    if (name === 'guestEmail' && value.trim()) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(value)) msg = 'Enter a valid email address';
    }

    if (msg) setErrors(prev => ({ ...prev, [name]: msg }));
  };

  const addAdditionalGuest = () => setForm(prev => ({ ...prev, additionalGuests: [...prev.additionalGuests, { name: '', phone: '' }] }));
  const removeAdditionalGuest = (index) => setForm(prev => ({ ...prev, additionalGuests: prev.additionalGuests.filter((_, i) => i !== index) }));
  const handleAdditionalGuestChange = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.additionalGuests];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, additionalGuests: updated };
    });
  };

  const addCustomCharge = () => setForm(prev => ({ ...prev, customCharges: [...prev.customCharges, { label: '', amount: '' }] }));
  const removeCustomCharge = (index) => setForm(prev => ({ ...prev, customCharges: prev.customCharges.filter((_, i) => i !== index) }));
  const handleCustomChargeChange = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.customCharges];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customCharges: updated };
    });
  };

  const handleManualPriceToggle = (e) => setForm(prev => ({ ...prev, useManualPrice: e.target.checked, manualPrice: '' }));
  const handleManualDailyPriceToggle = (e) => setForm(prev => ({ ...prev, useManualDailyPrice: e.target.checked, manualDailyPrice: '' }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image size should be less than 5MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) { alert('Only JPG/PNG files allowed'); return; }
    setForm(prev => ({ ...prev, idProofImage: file }));
    const reader = new FileReader();
    reader.onloadend = () => { setForm(prev => ({ ...prev, idProofImageBase64: reader.result })); setIdProofPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  // ── Validate before submit — returns errors object ──
  const validateAll = () => {
    const newErrors = {};

    if (!form.room) newErrors.room = 'Please select a room';
    if (!form.guestName.trim()) newErrors.guestName = 'Guest name is required';
    if (!form.guestPhone.trim()) newErrors.guestPhone = 'Phone number is required';
    if (!form.checkInDate) newErrors.checkInDate = 'Check-in date is required';
    if (!form.source) newErrors.source = 'Booking source is required';

    if (form.guestEmail.trim()) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(form.guestEmail)) newErrors.guestEmail = 'Enter a valid email address';
    }

    if (bookingType === 'daily') {
      if (!form.checkOutDate) newErrors.checkOutDate = 'Check-out date is required';
      else {
        const ci = new Date(form.checkInDate), co = new Date(form.checkOutDate);
        if (co <= ci) newErrors.checkOutDate = 'Check-out must be after check-in';
      }
      if (form.useManualDailyPrice && (!form.manualDailyPrice || Number(form.manualDailyPrice) <= 0)) {
        newErrors.manualDailyPrice = 'Enter a valid custom price';
      }
    } else {
      if (form.useManualPrice && (!form.manualPrice || Number(form.manualPrice) <= 0)) {
        newErrors.manualPrice = 'Enter a valid custom price';
      }
    }

    form.customCharges.forEach((c, i) => {
      if (c.label.trim() && (!c.amount || Number(c.amount) <= 0)) {
        newErrors[`customCharge_amount_${i}`] = 'Enter amount for this charge';
      }
      if (c.amount && !c.label.trim()) {
        newErrors[`customCharge_label_${i}`] = 'Enter description for this charge';
      }
    });

    return newErrors;
  };

  const isFormValid = () => {
    const errs = validateAll();
    return Object.keys(errs).length === 0 && !!pricingPreview;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const el = document.querySelector(`[name="${firstErrorKey}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    try {
      let checkIn, checkOut;
      if (bookingType === 'hourly') {
        checkIn = new Date(`${form.checkInDate}T${form.checkInTime}`);
        checkOut = new Date(checkIn.getTime() + form.hours * 60 * 60 * 1000);
      } else {
        checkIn = new Date(`${form.checkInDate}T${form.checkInTime}`);
        checkOut = new Date(`${form.checkOutDate}T${form.checkOutTime}`);
      }

      const bookingData = {
        hotel: hotelId,
        room: form.room,
        bookingType,
        guest: {
          name: form.guestName.trim(),
          email: form.guestEmail.trim() || undefined,
          phone: form.guestPhone.trim(),
          idProof: {
            type: form.idProofType,
            number: form.idProofNumber,
            imageBase64: form.idProofImageBase64,
          },
        },
        numberOfGuests: {
          adults: Number(form.adults),
          children: Number(form.children),
        },
        dates: {
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
        },
        specialRequests: form.specialRequests || '',
        advancePayment: form.advancePayment ? Number(form.advancePayment) : 0,
        paymentMethod: form.paymentMethod || undefined, // ✅ send to backend
        source: form.source,
        additionalGuests: form.additionalGuests
          .filter(g => g.name.trim())
          .map(g => ({ name: g.name.trim(), phone: g.phone.trim() })),
        customCharges: form.customCharges
          .filter(c => c.label.trim() && Number(c.amount) > 0)
          .map(c => ({ label: c.label.trim(), amount: Number(c.amount) })),
      };

      if (bookingType === 'hourly') {
        bookingData.hours = form.hours;
        if (form.useManualPrice && form.manualPrice) {
          bookingData.manualHourlyRate = Number(form.manualPrice);
          bookingData.isFixedPrice = true;
        }
      } else {
        if (form.useManualDailyPrice && form.manualDailyPrice) {
          bookingData.manualDailyRate = Number(form.manualDailyPrice);
          bookingData.isFixedPrice = true;
        }
      }

      const response = await apiRequest('/bookings', { method: 'POST', body: bookingData });

      const role = user?.role;
      if (role === 'cashier') {
        router.push(`/cashier/bookings/${response.data.booking._id}`);
      } else {
        router.push(`/hotel-admin/bookings/${response.data.booking._id}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      setSubmitError(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validationState = isFormValid();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Create New Booking</h1>
            <p className="text-gray-600 mt-1">Reserve a room for your guest</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">

              {/* ✅ Submit-level error banner */}
              {submitError && (
                <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Room Selection */}
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-2">
                    Select Room <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="room"
                    value={form.room}
                    onChange={handleChange}
                    className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.room ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Choose a room...</option>
                    {rooms.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.roomNumber} - {r.roomType} (₹{r.pricing.basePrice}/night)
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.room} />
                </div>

                {/* Booking Type */}
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    Booking Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { type: 'daily', icon: <Calendar className="h-5 w-5 mx-auto mb-2" />, label: 'Daily/Nightly Stay' },
                      { type: 'hourly', icon: <Clock className="h-5 w-5 mx-auto mb-2" />, label: 'Hourly Stay' },
                    ].map(({ type, icon, label }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBookingType(type)}
                        className={`px-6 py-4 rounded-xl font-medium transition-all border-2 ${
                          bookingType === type
                            ? 'bg-teal-50 border-teal-500 text-teal-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {icon}{label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guest Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5" /> Guest Information
                  </h3>

                  {/* Name */}
                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="guestName"
                      value={form.guestName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.guestName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      placeholder="Enter guest full name"
                    />
                    <FieldError message={errors.guestName} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">
                        Email <span className="text-gray-400 text-sm">(optional)</span>
                      </label>
                      <input
                        type="text"
                        name="guestEmail"
                        value={form.guestEmail}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="guest@email.com"
                        className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.guestEmail ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                      <FieldError message={errors.guestEmail} />
                    </div>

                    {/* Phone — ✅ No maxLength restriction, no pattern, any format accepted */}
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="guestPhone"
                        value={form.guestPhone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Phone number"
                        className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.guestPhone ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                      <FieldError message={errors.guestPhone} />
                    </div>
                  </div>

                  {/* ID Proof */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">ID Proof Type</label>
                      <select
                        name="idProofType"
                        value={form.idProofType}
                        onChange={handleChange}
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                      >
                        <option value="aadhar">Aadhar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="passport">Passport</option>
                        <option value="driving-license">Driving License</option>
                        <option value="voter-id">Voter ID</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">ID Proof Number</label>
                      <input
                        type="text"
                        name="idProofNumber"
                        value={form.idProofNumber}
                        onChange={handleChange}
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">Upload ID Proof (optional)</label>
                    <div className="mt-2">
                      <label className="flex items-center gap-3 px-5 py-3.5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-500 transition-colors">
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">{form.idProofImage ? form.idProofImage.name : 'Choose file (JPG/PNG, max 5MB)'}</span>
                        <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleImageChange} className="hidden" />
                      </label>
                    </div>
                    {idProofPreview && (
                      <div className="mt-4">
                        <img src={idProofPreview} alt="ID Proof Preview" className="w-48 h-auto rounded-xl border" />
                      </div>
                    )}
                  </div>

                  {/* Booking Source */}
                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">
                      Booking Source <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="source"
                      value={form.source}
                      onChange={handleChange}
                      className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.source ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    >
                      <option value="Direct">Direct</option>
                      <option value="Airbnb">Airbnb</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="MakeMyTrip">MakeMyTrip</option>
                      <option value="OYO">OYO</option>
                      <option value="Goibibo">Goibibo</option>
                      <option value="Agoda">Agoda</option>
                    </select>
                    <FieldError message={errors.source} />
                  </div>
                </div>

                {/* Additional Guests */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5" /> Additional Guests <span className="text-sm font-normal text-gray-500">(optional)</span>
                    </h3>
                    <button type="button" onClick={addAdditionalGuest} className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-300 text-teal-700 rounded-xl text-sm font-medium hover:bg-teal-100 transition-colors">
                      + Add Guest
                    </button>
                  </div>
                  {form.additionalGuests.length === 0 && <p className="text-sm text-gray-400 italic">No additional guests added</p>}
                  {form.additionalGuests.map((guest, index) => (
                    <div key={index} className="flex gap-3 items-center mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={`Guest ${index + 2} Name`}
                          value={guest.name}
                          onChange={(e) => handleAdditionalGuestChange(index, 'name', e.target.value)}
                          className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-teal-500 text-sm mb-2"
                        />
                        <input
                          type="tel"
                          placeholder="Phone (optional)"
                          value={guest.phone}
                          onChange={(e) => handleAdditionalGuestChange(index, 'phone', e.target.value)}
                          className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-teal-500 text-sm"
                        />
                      </div>
                      <button type="button" onClick={() => removeAdditionalGuest(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">✕</button>
                    </div>
                  ))}
                </div>

                {/* Stay Details */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Stay Details
                  </h3>

                  {bookingType === 'daily' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Check-in Date <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            name="checkInDate"
                            value={form.checkInDate}
                            onChange={handleChange}
                            className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.checkInDate ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                          />
                          <FieldError message={errors.checkInDate} />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Check-in Time <span className="text-red-500">*</span></label>
                          <input type="time" name="checkInTime" value={form.checkInTime} onChange={handleChange} className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Check-out Date <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            name="checkOutDate"
                            value={form.checkOutDate}
                            onChange={handleChange}
                            min={form.checkInDate || undefined}
                            className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.checkOutDate ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                          />
                          <FieldError message={errors.checkOutDate} />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Check-out Time <span className="text-red-500">*</span></label>
                          <input type="time" name="checkOutTime" value={form.checkOutTime} onChange={handleChange} className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                        </div>
                      </div>

                      {/* Daily Custom Price */}
                      <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <input type="checkbox" id="useManualDailyPrice" checked={form.useManualDailyPrice} onChange={handleManualDailyPriceToggle} className="mt-1 w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500" />
                          <div className="flex-1">
                            <label htmlFor="useManualDailyPrice" className="text-base font-semibold text-gray-900 cursor-pointer flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-teal-600" /> Set Custom Price Per Night
                            </label>
                            <p className="text-sm text-gray-600 mt-1">Override default room price and set your own nightly rate</p>
                            {selectedRoom && !form.useManualDailyPrice && (
                              <p className="text-xs text-teal-700 mt-1 font-medium">Default: ₹{selectedRoom.pricing.basePrice}/night</p>
                            )}
                          </div>
                        </div>
                        {form.useManualDailyPrice && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Price Per Night (₹) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              name="manualDailyPrice"
                              value={form.manualDailyPrice}
                              onChange={handleChange}
                              min="1"
                              placeholder="Enter price per night"
                              className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 font-semibold text-lg ${errors.manualDailyPrice ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            />
                            <FieldError message={errors.manualDailyPrice} />
                            {form.manualDailyPrice && !errors.manualDailyPrice && (
                              <p className="text-sm text-green-700 mt-2 font-medium">✓ This is the fixed room charge (GST will be added on top)</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Start Date <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            name="checkInDate"
                            value={form.checkInDate}
                            onChange={handleChange}
                            className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.checkInDate ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                          />
                          <FieldError message={errors.checkInDate} />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Start Time <span className="text-red-500">*</span></label>
                          <input type="time" name="checkInTime" value={form.checkInTime} onChange={handleChange} className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Duration (Hours) <span className="text-red-500">*</span></label>
                          <select name="hours" value={form.hours} onChange={handleChange} className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200">
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                              <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Hourly Custom Price */}
                      <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <input type="checkbox" id="useManualPrice" checked={form.useManualPrice} onChange={handleManualPriceToggle} className="mt-1 w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500" />
                          <div className="flex-1">
                            <label htmlFor="useManualPrice" className="text-base font-semibold text-gray-900 cursor-pointer flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-orange-600" /> Set Custom Price Per Hour
                            </label>
                            <p className="text-sm text-gray-600 mt-1">Override automatic price calculation and set your own hourly rate</p>
                          </div>
                        </div>
                        {form.useManualPrice && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Price Per Hour (₹) <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              name="manualPrice"
                              value={form.manualPrice}
                              onChange={handleChange}
                              min="1"
                              placeholder="Enter price per hour"
                              className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-orange-500 focus:ring-orange-200 font-semibold text-lg ${errors.manualPrice ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            />
                            <FieldError message={errors.manualPrice} />
                          </div>
                        )}
                      </div>

                      {form.checkOutDate && form.checkOutTime && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="text-sm text-blue-900">
                            <strong>End Time:</strong> {new Date(`${form.checkOutDate}T${form.checkOutTime}`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Number of Guests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">Adults <span className="text-red-500">*</span></label>
                    <input type="number" min="1" name="adults" value={form.adults} onChange={handleChange} className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">Children</label>
                    <input type="number" min="0" name="children" value={form.children} onChange={handleChange} className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                  </div>
                </div>

                {/* Extra / Custom Charges */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-purple-600" /> Extra Charges <span className="text-sm font-normal text-gray-500">(optional)</span>
                    </h3>
                    <button type="button" onClick={addCustomCharge} className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-300 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors">
                      <Plus className="h-4 w-4" /> Add Charge
                    </button>
                  </div>
                  {form.customCharges.length === 0
                    ? <p className="text-sm text-gray-400 italic">No extra charges added. Click "Add Charge" to add AC charge, extra bed, etc.</p>
                    : (
                      <div className="space-y-3">
                        {form.customCharges.map((charge, index) => (
                          <div key={index} className="flex gap-3 items-start p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Charge Description <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  placeholder="e.g. AC Charge, Extra Bed"
                                  value={charge.label}
                                  onChange={(e) => handleCustomChargeChange(index, 'label', e.target.value)}
                                  className={`text-black w-full px-4 py-2.5 border rounded-xl text-sm bg-white ${errors[`customCharge_label_${index}`] ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                <FieldError message={errors[`customCharge_label_${index}`]} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  min="1"
                                  value={charge.amount}
                                  onChange={(e) => handleCustomChargeChange(index, 'amount', e.target.value)}
                                  className={`text-black w-full px-4 py-2.5 border rounded-xl text-sm bg-white font-semibold ${errors[`customCharge_amount_${index}`] ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                <FieldError message={errors[`customCharge_amount_${index}`]} />
                              </div>
                            </div>
                            <button type="button" onClick={() => removeCustomCharge(index)} className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {customChargesTotal > 0 && (
                          <div className="flex justify-end">
                            <p className="text-sm font-semibold text-purple-700 bg-purple-100 px-4 py-2 rounded-lg">
                              Extra Charges Total: ₹{customChargesTotal.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  }
                </div>


                {/* ✅ Payment Method */}
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    Payment Method <span className="text-gray-400 text-sm">(optional — select if paid now)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'cash', label: 'Cash', icon: '💵' },
                      { value: 'upi',  label: 'UPI',  icon: '📱' },
                      { value: 'card', label: 'Card', icon: '💳' },
                    ].map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setForm(prev => ({
                            ...prev,
                            paymentMethod: prev.paymentMethod === value ? '' : value,
                          }))
                        }
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-semibold transition-all ${
                          form.paymentMethod === value
                            ? 'border-teal-600 bg-teal-50 text-teal-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{icon}</span>
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                  {form.paymentMethod ? (
                    <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      Payment confirmed via {form.paymentMethod.toUpperCase()} — full amount will be marked as PAID
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400 italic">
                      No method selected → booking will be saved as UNPAID (pay later)
                    </p>
                  )}
                </div>
                {/* Special Requests & Advance Payment */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">Special Requests (optional)</label>
                    <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} rows={3} className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200 resize-none" placeholder="Early check-in, extra bed, dietary preferences, etc." />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">Advance Payment (₹) - optional</label>
                    <input type="number" name="advancePayment" value={form.advancePayment} onChange={handleChange} min="0" className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" placeholder="0" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-8 w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all shadow-lg ${
                    !loading ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin h-6 w-6" /> Processing...
                    </span>
                  ) : 'Confirm Booking & Reserve Room'}
                </button>
              </form>
            </div>
          </div>

          {/* Pricing Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-teal-600" /> Booking Summary
              </h3>

              {selectedRoom && pricingPreview ? (
                <div className="space-y-5">
                  <div className={`p-5 rounded-xl border ${pricingPreview.isManualPrice ? 'bg-orange-50 border-orange-200' : 'bg-teal-50 border-teal-100'}`}>
                    <div className={`text-sm mb-1 ${pricingPreview.isManualPrice ? 'text-orange-800' : 'text-teal-800'}`}>
                      Room Charges ({pricingPreview.duration} {bookingType === 'hourly' ? (pricingPreview.duration === 1 ? 'hour' : 'hours') : (pricingPreview.duration === 1 ? 'night' : 'nights')})
                      {bookingType === 'hourly' && (
                        pricingPreview.isManualPrice
                          ? <span className="block text-xs mt-1"><span className="px-2 py-0.5 bg-orange-200 text-orange-900 rounded-full text-xs font-semibold">FIXED PRICE</span></span>
                          : pricingPreview.hourlyRate ? <span className="block text-xs mt-1">@ ₹{pricingPreview.hourlyRate}/hour</span> : null
                      )}
                      {bookingType === 'daily' && pricingPreview.isManualPrice && (
                        <span className="block text-xs mt-1">
                          @ ₹{form.manualDailyPrice}/night
                          <span className="ml-2 px-2 py-0.5 bg-teal-200 text-teal-900 rounded-full text-xs font-semibold">CUSTOM</span>
                        </span>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-gray-900">₹{pricingPreview.roomCharges.toLocaleString()}</div>
                    {pricingPreview.extraCharges > 0 && (
                      <div className={`mt-3 text-sm ${pricingPreview.isManualPrice ? 'text-orange-700' : 'text-teal-700'}`}>
                        + ₹{pricingPreview.extraCharges.toLocaleString()} (extra guests)
                      </div>
                    )}
                  </div>

                  {form.customCharges.filter(c => c.label && Number(c.amount) > 0).length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Extra Charges</p>
                      {form.customCharges.filter(c => c.label && Number(c.amount) > 0).map((c, i) => (
                        <div key={i} className="flex justify-between text-sm text-purple-800">
                          <span>{c.label}</span>
                          <span className="font-semibold">+₹{Number(c.amount).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t border-purple-300 pt-2 flex justify-between text-sm font-bold text-purple-900">
                        <span>Extra Total</span>
                        <span>₹{customChargesTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">₹{pricingPreview.subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>GST (5%)</span><span className="font-medium">₹{pricingPreview.tax.toLocaleString()}</span></div>
                    <div className="border-t border-gray-200 pt-4 mt-2 flex justify-between text-xl font-bold text-teal-700">
                      <span>Total Amount</span>
                      <span>₹{pricingPreview.total.toLocaleString()}</span>
                    </div>
                    {Number(form.advancePayment) > 0 && (
                      <div className="flex justify-between text-green-700 font-medium pt-2 border-t border-gray-200">
                        <span>Advance Paid</span>
                        <span>- ₹{Number(form.advancePayment).toLocaleString()}</span>
                      </div>
                    )}
                    {Number(form.advancePayment) > 0 && pricingPreview && (
                      <div className="flex justify-between text-orange-700 font-semibold">
                        <span>Due Amount</span>
                        <span>₹{(pricingPreview.total - Number(form.advancePayment)).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
                    Room status will change to <strong>RESERVED</strong> upon confirmation.
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Info className="mx-auto h-12 w-12 mb-4 opacity-70" />
                  <p className="font-medium">Select room and dates to preview pricing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}