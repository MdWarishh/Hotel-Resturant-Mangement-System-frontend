'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, Building2, DoorOpen, User, Mail, Phone, CreditCard, 
  Users, Calendar, Loader2, AlertCircle, CheckCircle2, Info, Upload, Clock
} from 'lucide-react';

export default function CreateBookingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const hotelId = user?.hotel?._id;

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [pricingPreview, setPricingPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [idProofPreview, setIdProofPreview] = useState(null);

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
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hotelId) return;
    apiRequest(`/rooms?hotel=${hotelId}&status=available`)
      .then(res => setRooms(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [hotelId]);

  useEffect(() => {
    if (!form.room) {
      setSelectedRoom(null);
      setPricingPreview(null);
      return;
    }
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

  // 🔥 UPDATED: Pricing calculation with auto-calculated hourly rate
  useEffect(() => {
    if (!selectedRoom || !form.checkInDate) {
      setPricingPreview(null);
      return;
    }

    if (bookingType === 'daily' && !form.checkOutDate) {
      setPricingPreview(null);
      return;
    }

    let newErrors = {};

    if (bookingType === 'daily') {
      const checkIn = new Date(form.checkInDate);
      const checkOut = new Date(form.checkOutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) newErrors.checkInDate = "Check-in date cannot be in the past";
      if (checkOut <= checkIn) newErrors.checkOutDate = "Check-out must be after check-in";

      setErrors(prev => ({ ...prev, ...newErrors }));

      if (Object.keys(newErrors).length > 0 || checkIn >= checkOut) {
        setPricingPreview(null);
        return;
      }

      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      let roomCharges = selectedRoom.pricing.basePrice * nights;
      let extraCharges = 0;

      const extraAdults = Math.max(0, Number(form.adults) - (selectedRoom.capacity?.adults || 0));
      extraCharges += extraAdults * (selectedRoom.pricing.extraAdultCharge || 0) * nights;

      const extraChildren = Math.max(0, Number(form.children) - (selectedRoom.capacity?.children || 0));
      extraCharges += extraChildren * (selectedRoom.pricing.extraChildCharge || 0) * nights;

      const subtotal = roomCharges + extraCharges;
      const tax = Math.ceil(subtotal * 0.05);
      const total = subtotal + tax;

      setPricingPreview({ duration: nights, roomCharges, extraCharges, subtotal, tax, total });
    } else {
      // 🔥 UPDATED: Auto-calculate hourly rate if not set (40% of daily rate)
      const duration = form.hours;
      const hourlyRate = selectedRoom.pricing?.hourlyRate > 0 
        ? selectedRoom.pricing.hourlyRate 
        : Math.ceil(selectedRoom.pricing.basePrice * 0.4);
      
      const roomCharges = hourlyRate * duration;
      const extraCharges = 0;

      const subtotal = roomCharges + extraCharges;
      const tax = Math.ceil(subtotal * 0.05);
      const total = subtotal + tax;

      setPricingPreview({ duration, roomCharges, extraCharges, subtotal, tax, total, hourlyRate });
    }
  }, [selectedRoom, form.checkInDate, form.checkOutDate, form.adults, form.children, form.hours, bookingType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Only JPG/PNG files allowed');
      return;
    }

    setForm(prev => ({ ...prev, idProofImage: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, idProofImageBase64: reader.result }));
      setIdProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const isFormValid = () => {
    const baseValid = (
      form.room &&
      form.guestName.trim() &&
      form.guestPhone.match(/^\d{10}$/) &&
      form.checkInDate &&
      pricingPreview &&
      form.source
    );

    if (bookingType === 'daily') {
      return baseValid && form.checkOutDate && !errors.checkInDate && !errors.checkOutDate;
    } else {
      return baseValid && form.hours >= 1 && form.hours <= 12;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setLoading(true);

    try {
      let checkIn, checkOut;
      
      if (bookingType === 'hourly') {
        checkIn = new Date(`${form.checkInDate}T${form.checkInTime}`);
        checkOut = new Date(checkIn.getTime() + form.hours * 60 * 60 * 1000);
      } else {
        checkIn = new Date(`${form.checkInDate}T${form.checkInTime || '14:00'}`);
        checkOut = new Date(`${form.checkOutDate}T${form.checkOutTime || '12:00'}`);
      }

      const payload = {
        hotel: hotelId,
        room: form.room,
        bookingType,
        hours: bookingType === 'hourly' ? form.hours : undefined,
        guest: {
          name: form.guestName.trim(),
          phone: form.guestPhone,
          email: form.guestEmail?.trim() || undefined,
          idProof: form.idProofNumber
            ? { 
                type: form.idProofType, 
                number: form.idProofNumber.trim(),
                imageBase64: form.idProofImageBase64 || undefined
              } 
            : undefined,
        },
        numberOfGuests: { adults: Number(form.adults), children: Number(form.children) },
        dates: {
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
        },
        advancePayment: Number(form.advancePayment) || 0,
        specialRequests: form.specialRequests.trim(),
        source: form.source,
      };

      await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push('/hotel-admin/bookings');
    } catch (err) {
      alert(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-4xl font-bold text-gray-900">Create New Booking</h1>
            <p className="mt-2 text-gray-600">Reserve a room for your guest</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Booking Type Selector */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-teal-600" />
                    Booking Type
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setBookingType('daily')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        bookingType === 'daily'
                          ? 'border-teal-600 bg-teal-50 shadow-md'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Calendar className={`h-8 w-8 mx-auto mb-2 ${bookingType === 'daily' ? 'text-teal-600' : 'text-gray-400'}`} />
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900">Daily Booking</h4>
                        <p className="text-sm text-gray-600 mt-1">Book by nights</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingType('hourly')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        bookingType === 'hourly'
                          ? 'border-teal-600 bg-teal-50 shadow-md'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Clock className={`h-8 w-8 mx-auto mb-2 ${bookingType === 'hourly' ? 'text-teal-600' : 'text-gray-400'}`} />
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900">Hourly Booking</h4>
                        <p className="text-sm text-gray-600 mt-1">Book by hours (1-12)</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Room Selection - 🔥 UPDATED: All rooms now available for both modes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-teal-600" /> Select Room
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map(room => {
                      // 🔥 UPDATED: Calculate hourly rate on-the-fly if not set
                      const hourlyRate = room.pricing?.hourlyRate > 0 
                        ? room.pricing.hourlyRate 
                        : Math.ceil(room.pricing.basePrice * 0.4);

                      return (
                        <button
                          key={room._id}
                          type="button"
                          onClick={() => setForm({ ...form, room: room._id })}
                          className={`p-5 rounded-xl border-2 text-left transition-all ${
                            form.room === room._id
                              ? 'border-teal-600 bg-teal-50 shadow-md'
                              : 'border-gray-300 hover:border-teal-400'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <DoorOpen className="h-6 w-6 text-teal-600" />
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              room.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {room.status}
                            </span>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900">{room.roomNumber}</h4>
                          <p className="text-sm text-gray-600 mb-3">{room.roomType}</p>
                          <div className="space-y-1">
                            <p className="text-lg font-semibold text-teal-700">₹{room.pricing?.basePrice?.toLocaleString()}/night</p>
                            <p className="text-xs text-gray-600">₹{hourlyRate}/hour</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.room && <p className="mt-2 text-red-600 text-sm">{errors.room}</p>}
                </div>

                {/* Booking Source */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Source</h3>
                  <select
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                    className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                    required
                  >
                    <option value="Direct">Direct</option>
                    <option value="OYO">OYO</option>
                    <option value="MakeMyTrip">MakeMyTrip</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Goibibo">Goibibo</option>
                    <option value="Airbnb">Airbnb</option>
                    <option value="Agoda">Agoda</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Guest Information - Same as before */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-teal-600" /> Guest Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="guestName"
                        value={form.guestName}
                        onChange={handleChange}
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">Phone Number <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        name="guestPhone"
                        value={form.guestPhone}
                        onChange={handleChange}
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                        placeholder="9876543210"
                        maxLength={10}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">Email (optional)</label>
                      <input
                        type="email"
                        name="guestEmail"
                        value={form.guestEmail}
                        onChange={handleChange}
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">ID Proof Type</label>
                      <select
                        name="idProofType"
                        value={form.idProofType}
                        onChange={handleChange}
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                      >
                        <option value="aadhar">Aadhar Card</option>
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                        <option value="voter_id">Voter ID</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-base font-medium text-gray-800 mb-2">ID Proof Number (optional)</label>
                      <input
                        type="text"
                        name="idProofNumber"
                        value={form.idProofNumber}
                        onChange={handleChange}
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                        placeholder="Enter ID number"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-base font-medium text-gray-800 mb-2">
                        Upload ID Proof Photo (optional)
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer flex-1">
                          <div className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-teal-500 transition-colors bg-gray-50">
                            <Upload className="h-6 w-6 text-gray-500" />
                            <span className="text-gray-600">
                              {form.idProofImage ? form.idProofImage.name : 'Click to upload JPG/PNG (max 5MB)'}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>

                        {idProofPreview && (
                          <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                            <img 
                              src={idProofPreview} 
                              alt="ID Proof Preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates & Duration Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-teal-600" />
                    {bookingType === 'hourly' ? 'Booking Time & Duration' : 'Dates'}
                  </h3>

                  {bookingType === 'daily' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">Check-in Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          name="checkInDate"
                          value={form.checkInDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                          required
                        />
                        {errors.checkInDate && <p className="mt-1 text-red-600 text-sm">{errors.checkInDate}</p>}
                      </div>

                      <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">Check-out Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          name="checkOutDate"
                          value={form.checkOutDate}
                          onChange={handleChange}
                          className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                          required
                        />
                        {errors.checkOutDate && <p className="mt-1 text-red-600 text-sm">{errors.checkOutDate}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Start Date <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            name="checkInDate"
                            value={form.checkInDate}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Start Time <span className="text-red-500">*</span></label>
                          <input
                            type="time"
                            name="checkInTime"
                            value={form.checkInTime}
                            onChange={handleChange}
                            className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-base font-medium text-gray-800 mb-2">Duration (Hours) <span className="text-red-500">*</span></label>
                          <select
                            name="hours"
                            value={form.hours}
                            onChange={handleChange}
                            className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                            required
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                              <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {form.checkOutDate && form.checkOutTime && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <p className="text-sm text-blue-900">
                            <strong>End Time:</strong> {new Date(`${form.checkOutDate}T${form.checkOutTime}`).toLocaleString('en-IN', { 
                              dateStyle: 'medium', 
                              timeStyle: 'short' 
                            })}
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
                    <input
                      type="number"
                      min="1"
                      name="adults"
                      value={form.adults}
                      onChange={handleChange}
                      className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">Children</label>
                    <input
                      type="number"
                      min="0"
                      name="children"
                      value="form.children"
                      onChange={handleChange}
                      className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                    />
                  </div>
                </div>

                {/* Additional */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">Special Requests (optional)</label>
                    <textarea
                      name="specialRequests"
                      value={form.specialRequests}
                      onChange={handleChange}
                      rows={3}
                      className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200 resize-none"
                      placeholder="Early check-in, extra bed, dietary preferences, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">Advance Payment (₹) - optional</label>
                    <input
                      type="number"
                      name="advancePayment"
                      value={form.advancePayment}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                      placeholder="0"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className={`mt-8 w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all shadow-lg
                    ${isFormValid() 
                      ? 'bg-teal-600 hover:bg-teal-700' 
                      : 'bg-gray-400 cursor-not-allowed'}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin h-6 w-6" />
                      Processing...
                    </span>
                  ) : (
                    'Confirm Booking & Reserve Room'
                  )}
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
                  <div className="p-5 bg-teal-50 rounded-xl border border-teal-100">
                    <div className="text-sm text-teal-800 mb-1">
                      Room Charges ({pricingPreview.duration} {bookingType === 'hourly' 
                        ? (pricingPreview.duration === 1 ? 'hour' : 'hours')
                        : (pricingPreview.duration === 1 ? 'night' : 'nights')
                      })
                      {bookingType === 'hourly' && pricingPreview.hourlyRate && (
                        <span className="block text-xs mt-1">@ ₹{pricingPreview.hourlyRate}/hour</span>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-gray-900">₹{pricingPreview.roomCharges.toLocaleString()}</div>

                    {pricingPreview.extraCharges > 0 && (
                      <div className="mt-3 text-sm text-teal-700">
                        + ₹{pricingPreview.extraCharges.toLocaleString()} (extra guests)
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">₹{pricingPreview.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (5%)</span>
                      <span className="font-medium">₹{pricingPreview.tax.toLocaleString()}</span>
                    </div>
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