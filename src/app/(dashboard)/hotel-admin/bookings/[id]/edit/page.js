'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, User, CreditCard, Users, Calendar, Loader2, AlertCircle,
  CheckCircle2, Info, Clock, DollarSign, Plus, Trash2, Tag, Receipt
} from 'lucide-react';

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      {message}
    </p>
  );
}

// yyyy-MM-dd and HH:mm helpers from an ISO date
const toDateInput = (iso) => (iso ? new Date(iso).toISOString().split('T')[0] : '');
const toTimeInput = (iso) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '');

export default function EditBookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const [bookingType, setBookingType] = useState('daily');

  const [form, setForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestGSTNumber: '',
    idProofType: 'aadhar',
    idProofNumber: '',
    adults: 1,
    children: 0,
    checkInDate: '',
    checkInTime: '14:00',
    checkOutDate: '',
    checkOutTime: '12:00',
    hours: 1,
    specialRequests: '',
    additionalGuests: [],
    customCharges: [],
    useManualPrice: false,
    manualPrice: '',
    useManualDailyPrice: false,
    manualDailyPrice: '',
  });

  const [roomInfo, setRoomInfo] = useState(null); // basic room pricing for preview

  // ── Fetch existing booking ──
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiRequest(`/bookings/${id}`);
        const b = res.data?.booking;
        if (!b) { setFetchError('Booking not found'); return; }
        setBooking(b);
        setRoomInfo(b.room || null);
        setBookingType(b.bookingType || 'daily');

        setForm({
          guestName: b.guest?.name || '',
          guestEmail: b.guest?.email || '',
          guestPhone: b.guest?.phone || '',
          guestGSTNumber: b.guest?.gstNumber || '',
          idProofType: b.guest?.idProof?.type || 'aadhar',
          idProofNumber: b.guest?.idProof?.number || '',
          adults: b.numberOfGuests?.adults || 1,
          children: b.numberOfGuests?.children || 0,
          checkInDate: toDateInput(b.dates?.checkIn),
          checkInTime: toTimeInput(b.dates?.checkIn) || '14:00',
          checkOutDate: toDateInput(b.dates?.checkOut),
          checkOutTime: toTimeInput(b.dates?.checkOut) || '12:00',
          hours: b.hours || 1,
          specialRequests: b.specialRequests || '',
          additionalGuests: b.additionalGuests?.length ? b.additionalGuests : [],
          customCharges: b.pricing?.customCharges?.length
            ? b.pricing.customCharges.map(c => ({ label: c.label, amount: c.amount }))
            : [],
          useManualPrice: !!b.pricing?.manualHourlyRate,
          manualPrice: b.pricing?.manualHourlyRate || '',
          useManualDailyPrice: !!b.pricing?.manualDailyRate,
          manualDailyPrice: b.pricing?.manualDailyRate || '',
        });
      } catch (err) {
        setFetchError(err.message || 'Failed to load booking');
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [id]);

  // ── Permission check (mirrors backend logic) ──
  const adminRoles = ['super_admin', 'hotel_admin'];
  const isAdmin = adminRoles.includes(user?.role);
  const blockedAlways = ['cancelled', 'no_show'];
  const canEdit =
    booking &&
    !blockedAlways.includes(booking.status) &&
    (booking.status !== 'checked_out' || isAdmin);

  // ── Live pricing preview ──
  const customChargesTotal = form.customCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const [pricingPreview, setPricingPreview] = useState(null);

  useEffect(() => {
    if (!roomInfo || !form.checkInDate) { setPricingPreview(null); return; }
    if (bookingType === 'daily' && !form.checkOutDate) { setPricingPreview(null); return; }

    if (bookingType === 'daily') {
      const checkIn = new Date(form.checkInDate);
      const checkOut = new Date(form.checkOutDate);
      if (checkOut <= checkIn) { setPricingPreview(null); return; }

      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      let roomCharges = form.useManualDailyPrice && form.manualDailyPrice
        ? Number(form.manualDailyPrice)
        : (roomInfo.pricing?.basePrice || 0) * nights;

      let extraCharges = 0;
      if (!form.useManualDailyPrice && roomInfo.capacity) {
        const extraAdults = Math.max(0, Number(form.adults) - (roomInfo.capacity.adults || 0));
        extraCharges += extraAdults * (roomInfo.pricing?.extraAdultCharge || 0) * nights;
        const extraChildren = Math.max(0, Number(form.children) - (roomInfo.capacity.children || 0));
        extraCharges += extraChildren * (roomInfo.pricing?.extraChildCharge || 0) * nights;
      }

      const subtotal = roomCharges + extraCharges + customChargesTotal;
      const tax = Math.round(subtotal * 0.05);
      setPricingPreview({ duration: nights, roomCharges, extraCharges, subtotal, tax, total: subtotal + tax });
    } else {
      const duration = Number(form.hours) || 0;
      let roomCharges = 0;
      if (form.useManualPrice && form.manualPrice) {
        roomCharges = Number(form.manualPrice);
      } else {
        const hourlyRate = roomInfo.pricing?.hourlyRate > 0
          ? roomInfo.pricing.hourlyRate
          : Math.ceil((roomInfo.pricing?.basePrice || 0) * 0.4);
        roomCharges = hourlyRate * duration;
      }
      const subtotal = roomCharges + customChargesTotal;
      const tax = Math.round(subtotal * 0.05);
      setPricingPreview({ duration, roomCharges, extraCharges: 0, subtotal, tax, total: subtotal + tax });
    }
  }, [roomInfo, form.checkInDate, form.checkOutDate, form.adults, form.children, form.hours,
      bookingType, form.useManualPrice, form.manualPrice, form.useManualDailyPrice, form.manualDailyPrice, customChargesTotal]);

  // ── Handlers ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const addAdditionalGuest = () => setForm(prev => ({ ...prev, additionalGuests: [...prev.additionalGuests, { name: '', phone: '' }] }));
  const removeAdditionalGuest = (i) => setForm(prev => ({ ...prev, additionalGuests: prev.additionalGuests.filter((_, idx) => idx !== i) }));
  const handleAdditionalGuestChange = (i, field, value) => {
    setForm(prev => {
      const updated = [...prev.additionalGuests];
      updated[i] = { ...updated[i], [field]: value };
      return { ...prev, additionalGuests: updated };
    });
  };

  const addCustomCharge = () => setForm(prev => ({ ...prev, customCharges: [...prev.customCharges, { label: '', amount: '' }] }));
  const removeCustomCharge = (i) => setForm(prev => ({ ...prev, customCharges: prev.customCharges.filter((_, idx) => idx !== i) }));
  const handleCustomChargeChange = (i, field, value) => {
    setForm(prev => {
      const updated = [...prev.customCharges];
      updated[i] = { ...updated[i], [field]: value };
      return { ...prev, customCharges: updated };
    });
  };

  const validateAll = () => {
    const e = {};
    if (!form.guestName.trim()) e.guestName = 'Guest name is required';
    if (!form.guestPhone.trim()) e.guestPhone = 'Phone number is required';
    if (!form.checkInDate) e.checkInDate = 'Check-in date is required';

    if (form.guestEmail.trim()) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(form.guestEmail)) e.guestEmail = 'Enter a valid email address';
    }

    if (bookingType === 'daily') {
      if (!form.checkOutDate) e.checkOutDate = 'Check-out date is required';
      else {
        const ci = new Date(form.checkInDate), co = new Date(form.checkOutDate);
        if (co <= ci) e.checkOutDate = 'Check-out must be after check-in';
      }
      if (form.useManualDailyPrice && (!form.manualDailyPrice || Number(form.manualDailyPrice) <= 0)) {
        e.manualDailyPrice = 'Enter a valid custom price';
      }
    } else {
      if (form.useManualPrice && (!form.manualPrice || Number(form.manualPrice) <= 0)) {
        e.manualPrice = 'Enter a valid custom price';
      }
    }

    form.customCharges.forEach((c, i) => {
      if (c.label.trim() && (!c.amount || Number(c.amount) <= 0)) e[`customCharge_amount_${i}`] = 'Enter amount';
      if (c.amount && !c.label.trim()) e[`customCharge_label_${i}`] = 'Enter description';
    });

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstKey = Object.keys(validationErrors)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    try {
      let checkIn, checkOut;
      if (bookingType === 'hourly') {
        checkIn = new Date(`${form.checkInDate}T${form.checkInTime}`);
        checkOut = new Date(checkIn.getTime() + Number(form.hours) * 60 * 60 * 1000);
      } else {
        checkIn = new Date(`${form.checkInDate}T${form.checkInTime}`);
        checkOut = new Date(`${form.checkOutDate}T${form.checkOutTime}`);
      }

      const payload = {
        guest: {
          name: form.guestName.trim(),
          email: form.guestEmail.trim() || undefined,
          phone: form.guestPhone.trim(),
          gstNumber: form.guestGSTNumber.trim() || undefined,
          idProof: {
            type: form.idProofType,
            number: form.idProofNumber,
            // no imageBase64 sent here — image kept as-is unless re-uploaded elsewhere
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
        additionalGuests: form.additionalGuests
          .filter(g => g.name.trim())
          .map(g => ({ name: g.name.trim(), phone: g.phone.trim() })),
        customCharges: form.customCharges
          .filter(c => c.label.trim() && Number(c.amount) > 0)
          .map(c => ({ label: c.label.trim(), amount: Number(c.amount) })),
      };

      if (bookingType === 'hourly') {
        payload.hours = Number(form.hours);
        if (form.useManualPrice && form.manualPrice) {
          payload.manualHourlyRate = Number(form.manualPrice);
          payload.isFixedPrice = true;
        }
      } else {
        if (form.useManualDailyPrice && form.manualDailyPrice) {
          payload.manualDailyRate = Number(form.manualDailyPrice);
          payload.isFixedPrice = true;
        }
      }

      await apiRequest(`/bookings/${id}`, { method: 'PUT', body: payload });
      router.push(`/hotel-admin/bookings/${id}`);
    } catch (err) {
      console.error('Update booking error:', err);
      setSubmitError(err.message || 'Failed to update booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading / error / permission states ──
  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (fetchError || !booking) {
    return <div className="text-center py-20 text-red-600">{fetchError || 'Booking not found'}</div>;
  }

  if (!canEdit) {
    return (
      <div className="max-w-xl mx-auto mt-20 bg-white border border-red-200 rounded-3xl p-10 text-center shadow-sm">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cannot Edit This Booking</h2>
        <p className="text-gray-600">
          {['cancelled', 'no_show'].includes(booking.status)
            ? `Bookings with status "${booking.status.replace('_', ' ')}" cannot be edited.`
            : 'Only an admin can edit a checked-out booking.'}
        </p>
        <button
          onClick={() => router.push(`/hotel-admin/bookings/${id}`)}
          className="mt-6 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700"
        >
          Back to Booking
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Edit Booking #{booking.bookingNumber}</h1>
            <p className="text-gray-600 mt-1">
              Room {booking.room?.roomNumber} - {booking.room?.roomType} • Status: {booking.status.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>

        {booking.status === 'checked_out' && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-xl">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">
              This booking is already checked out. You're editing it as an admin — changes affect the historical record and invoice.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              {submitError && (
                <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Note: Room and Booking Type are fixed on edit */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center gap-2">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  Room and booking type ({bookingType === 'hourly' ? 'Hourly' : 'Daily/Nightly'}) cannot be changed here. To switch rooms, cancel and create a new booking.
                </div>

                {/* Guest Info */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5" /> Guest Information
                  </h3>

                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" name="guestName" value={form.guestName} onChange={handleChange}
                      className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.guestName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                    <FieldError message={errors.guestName} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">Email <span className="text-gray-400 text-sm">(optional)</span></label>
                      <input
                        type="text" name="guestEmail" value={form.guestEmail} onChange={handleChange}
                        className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.guestEmail ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                      <FieldError message={errors.guestEmail} />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel" name="guestPhone" value={form.guestPhone} onChange={handleChange}
                        className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.guestPhone ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                      <FieldError message={errors.guestPhone} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">GST Number <span className="text-gray-400 text-sm">(optional)</span></label>
                    <div className="relative">
                      <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text" name="guestGSTNumber" value={form.guestGSTNumber} onChange={handleChange}
                        className="text-black w-full pl-12 pr-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200 uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">ID Proof Type</label>
                      <select name="idProofType" value={form.idProofType} onChange={handleChange}
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200">
                        <option value="aadhar">Aadhar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="passport">Passport</option>
                        <option value="driving-license">Driving License</option>
                        <option value="voter-id">Voter ID</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">ID Proof Number</label>
                      <input type="text" name="idProofNumber" value={form.idProofNumber} onChange={handleChange}
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                    </div>
                  </div>
                </div>

                {/* Additional Guests */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5" /> Additional Guests
                    </h3>
                    <button type="button" onClick={addAdditionalGuest}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-300 text-teal-700 rounded-xl text-sm font-medium hover:bg-teal-100 transition-colors">
                      + Add Guest
                    </button>
                  </div>
                  {form.additionalGuests.length === 0 && <p className="text-sm text-gray-400 italic">No additional guests</p>}
                  {form.additionalGuests.map((guest, index) => (
                    <div key={index} className="flex gap-3 items-center mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex-1">
                        <input type="text" placeholder={`Guest ${index + 2} Name`} value={guest.name}
                          onChange={(e) => handleAdditionalGuestChange(index, 'name', e.target.value)}
                          className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-teal-500 text-sm mb-2" />
                        <input type="tel" placeholder="Phone (optional)" value={guest.phone}
                          onChange={(e) => handleAdditionalGuestChange(index, 'phone', e.target.value)}
                          className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:border-teal-500 text-sm" />
                      </div>
                      <button type="button" onClick={() => removeAdditionalGuest(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">✕</button>
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
                          <input type="date" name="checkInDate" value={form.checkInDate} onChange={handleChange}
                            className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.checkInDate ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                          <FieldError message={errors.checkInDate} />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Check-in Time</label>
                          <input type="time" name="checkInTime" value={form.checkInTime} onChange={handleChange}
                            className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Check-out Date <span className="text-red-500">*</span></label>
                          <input type="date" name="checkOutDate" value={form.checkOutDate} onChange={handleChange}
                            min={form.checkInDate || undefined}
                            className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.checkOutDate ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                          <FieldError message={errors.checkOutDate} />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Check-out Time</label>
                          <input type="time" name="checkOutTime" value={form.checkOutTime} onChange={handleChange}
                            className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                        </div>
                      </div>

                      <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <input type="checkbox" id="useManualDailyPrice" checked={form.useManualDailyPrice}
                            onChange={(e) => setForm(prev => ({ ...prev, useManualDailyPrice: e.target.checked }))}
                            className="mt-1 w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500" />
                          <div className="flex-1">
                            <label htmlFor="useManualDailyPrice" className="text-base font-semibold text-gray-900 cursor-pointer flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-teal-600" /> Custom Price Per Night
                            </label>
                          </div>
                        </div>
                        {form.useManualDailyPrice && (
                          <div>
                            <input type="number" name="manualDailyPrice" value={form.manualDailyPrice} onChange={handleChange}
                              min="1" placeholder="Enter price per night"
                              className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 font-semibold text-lg ${errors.manualDailyPrice ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                            <FieldError message={errors.manualDailyPrice} />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Start Date <span className="text-red-500">*</span></label>
                          <input type="date" name="checkInDate" value={form.checkInDate} onChange={handleChange}
                            className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-teal-500 focus:ring-teal-200 ${errors.checkInDate ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                          <FieldError message={errors.checkInDate} />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Start Time</label>
                          <input type="time" name="checkInTime" value={form.checkInTime} onChange={handleChange}
                            className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Duration (Hours) <span className="text-red-500">*</span></label>
                          <select name="hours" value={form.hours} onChange={handleChange}
                            className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200">
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                              <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <input type="checkbox" id="useManualPrice" checked={form.useManualPrice}
                            onChange={(e) => setForm(prev => ({ ...prev, useManualPrice: e.target.checked }))}
                            className="mt-1 w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500" />
                          <div className="flex-1">
                            <label htmlFor="useManualPrice" className="text-base font-semibold text-gray-900 cursor-pointer flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-orange-600" /> Custom Price Per Hour
                            </label>
                          </div>
                        </div>
                        {form.useManualPrice && (
                          <div>
                            <input type="number" name="manualPrice" value={form.manualPrice} onChange={handleChange}
                              min="1" placeholder="Enter price per hour"
                              className={`text-black w-full px-5 py-3.5 border rounded-xl focus:border-orange-500 focus:ring-orange-200 font-semibold text-lg ${errors.manualPrice ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                            <FieldError message={errors.manualPrice} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Guests count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">Adults <span className="text-red-500">*</span></label>
                    <input type="number" min="1" name="adults" value={form.adults} onChange={handleChange}
                      className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">Children</label>
                    <input type="number" min="0" name="children" value={form.children} onChange={handleChange}
                      className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200" />
                  </div>
                </div>

                {/* Custom charges */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Tag className="h-5 w-5 text-purple-600" /> Extra Charges
                    </h3>
                    <button type="button" onClick={addCustomCharge}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-300 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors">
                      <Plus className="h-4 w-4" /> Add Charge
                    </button>
                  </div>
                  {form.customCharges.length === 0
                    ? <p className="text-sm text-gray-400 italic">No extra charges added</p>
                    : (
                      <div className="space-y-3">
                        {form.customCharges.map((charge, index) => (
                          <div key={index} className="flex gap-3 items-start p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <input type="text" placeholder="e.g. AC Charge, Extra Bed" value={charge.label}
                                  onChange={(e) => handleCustomChargeChange(index, 'label', e.target.value)}
                                  className={`text-black w-full px-4 py-2.5 border rounded-xl text-sm bg-white ${errors[`customCharge_label_${index}`] ? 'border-red-400' : 'border-gray-300'}`} />
                                <FieldError message={errors[`customCharge_label_${index}`]} />
                              </div>
                              <div>
                                <input type="number" placeholder="Amount" min="1" value={charge.amount}
                                  onChange={(e) => handleCustomChargeChange(index, 'amount', e.target.value)}
                                  className={`text-black w-full px-4 py-2.5 border rounded-xl text-sm bg-white font-semibold ${errors[`customCharge_amount_${index}`] ? 'border-red-400' : 'border-gray-300'}`} />
                                <FieldError message={errors[`customCharge_amount_${index}`]} />
                              </div>
                            </div>
                            <button type="button" onClick={() => removeCustomCharge(index)}
                              className="mt-1 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>

                {/* Special requests */}
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-2">Special Requests</label>
                  <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} rows={3}
                    className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200 resize-none" />
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => router.push(`/hotel-admin/bookings/${id}`)}
                    className="flex-1 py-4 px-6 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className={`flex-1 py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all shadow-lg ${!loading ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <Loader2 className="animate-spin h-6 w-6" /> Saving...
                      </span>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Pricing Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-teal-600" /> Updated Pricing
              </h3>
              {pricingPreview ? (
                <div className="space-y-5">
                  <div className="p-5 rounded-xl border bg-teal-50 border-teal-100">
                    <div className="text-sm mb-1 text-teal-800">
                      Room Charges ({pricingPreview.duration} {bookingType === 'hourly' ? 'hr(s)' : 'night(s)'})
                    </div>
                    <div className="text-3xl font-bold text-gray-900">₹{pricingPreview.roomCharges.toLocaleString()}</div>
                    {pricingPreview.extraCharges > 0 && (
                      <div className="mt-3 text-sm text-teal-700">+ ₹{pricingPreview.extraCharges.toLocaleString()} (extra guests)</div>
                    )}
                  </div>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">₹{pricingPreview.subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>GST (5%)</span><span className="font-medium">₹{pricingPreview.tax.toLocaleString()}</span></div>
                    <div className="border-t border-gray-200 pt-4 mt-2 flex justify-between text-xl font-bold text-teal-700">
                      <span>New Total</span><span>₹{pricingPreview.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 pt-2 border-t border-gray-200">
                      <span>Old Total</span><span>₹{(booking.pricing?.total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Already Paid</span><span>₹{(booking.advancePayment || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl text-sm text-amber-800">
                    Saving will recalculate the total. Payment status updates automatically based on amount already paid.
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Info className="mx-auto h-12 w-12 mb-4 opacity-70" />
                  <p className="font-medium">Fill dates to preview updated pricing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}