'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, Building2, DoorOpen, User, Mail, Phone, CreditCard, 
  Users, Calendar, Loader2, AlertCircle, CheckCircle2, Info, Upload, Clock,
  DollarSign
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
    manualPrice: '',
    useManualPrice: false,
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
      const duration = form.hours;
      
      let roomCharges = 0;
      let hourlyRate = 0;
      
      if (form.useManualPrice && form.manualPrice) {
        hourlyRate = Number(form.manualPrice);
        roomCharges = hourlyRate * duration;
      } else {
        hourlyRate = selectedRoom.pricing?.hourlyRate > 0 
          ? selectedRoom.pricing.hourlyRate 
          : Math.ceil(selectedRoom.pricing.basePrice * 0.4);
        roomCharges = hourlyRate * duration;
      }
      
      const extraCharges = 0;
      const subtotal = roomCharges + extraCharges;
      const tax = Math.ceil(subtotal * 0.05);
      const total = subtotal + tax;

      setPricingPreview({ 
        duration, 
        roomCharges, 
        extraCharges, 
        subtotal, 
        tax, 
        total, 
        hourlyRate,
        isManualPrice: form.useManualPrice
      });
    }
  }, [selectedRoom, form.checkInDate, form.checkOutDate, form.adults, form.children, form.hours, bookingType, form.useManualPrice, form.manualPrice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleManualPriceToggle = (e) => {
    const checked = e.target.checked;
    setForm(prev => ({ 
      ...prev, 
      useManualPrice: checked,
      manualPrice: checked ? '' : ''
    }));
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

  // 🔥 FIXED: Complete validation function
  const isFormValid = () => {
    // Base validation
    const hasRoom = !!form.room;
    const hasName = form.guestName.trim().length > 0;
    const hasPhone = /^\d{10}$/.test(form.guestPhone);
    const hasCheckIn = !!form.checkInDate;
    const hasSource = !!form.source;
    const hasSelectedRoom = !!selectedRoom;
    const hasPricing = !!pricingPreview;

    const baseValid = hasRoom && hasName && hasPhone && hasCheckIn && hasSource && hasSelectedRoom && hasPricing;

    if (!baseValid) {
      // Debug output
      console.log('Base validation failed:', {
        hasRoom,
        hasName,
        hasPhone,
        hasCheckIn,
        hasSource,
        hasSelectedRoom,
        hasPricing
      });
      return false;
    }

    if (bookingType === 'daily') {
      const hasCheckOut = !!form.checkOutDate;
      const noCheckInError = !errors.checkInDate;
      const noCheckOutError = !errors.checkOutDate;
      
      const isValid = hasCheckOut && noCheckInError && noCheckOutError;
      
      if (!isValid) {
        console.log('Daily validation failed:', {
          hasCheckOut,
          noCheckInError,
          noCheckOutError
        });
      }
      
      return isValid;
    } else {
      // Hourly validation
      const validHours = form.hours >= 1 && form.hours <= 12;
      
      // Manual price validation - only required if checkbox is enabled
      let manualPriceValid = true;
      if (form.useManualPrice) {
        manualPriceValid = form.manualPrice && Number(form.manualPrice) > 0;
      }
      
      const isValid = validHours && manualPriceValid;
      
      if (!isValid) {
        console.log('Hourly validation failed:', {
          validHours,
          hours: form.hours,
          useManualPrice: form.useManualPrice,
          manualPrice: form.manualPrice,
          manualPriceValid
        });
      }
      
      return isValid;
    }
  };

 
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // ✅ Check validation first
  if (!isFormValid()) {
    alert('Please fill all required fields correctly');
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
      source: form.source,
    };

    if (bookingType === 'hourly') {
      bookingData.hours = form.hours;
      
      if (form.useManualPrice && form.manualPrice) {
        bookingData.manualHourlyRate = Number(form.manualPrice);
      }
    }

    // 🔥 FIXED: Simple apiRequest call
    const response = await apiRequest('/bookings', {
      method: 'POST',
      body: bookingData,  // ✅ Just the object
    });

    router.push(`/hotel-admin/bookings/${response.data.booking._id}`);
  } catch (error) {
    console.error('Booking error:', error);
    alert(error.message || 'Failed to create booking');
  } finally {
    setLoading(false);
  }
};

  // 🔥 Debug output - shows current validation state
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

        {/* 🔥 DEBUG PANEL - Remove this after fixing */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-mono text-gray-800">
            🐛 Debug: Form Valid = <strong>{validationState ? 'YES ✅' : 'NO ❌'}</strong>
            {' | '}
            Room: {form.room ? '✅' : '❌'}
            {' | '}
            Name: {form.guestName ? '✅' : '❌'}
            {' | '}
            Phone: {/^\d{10}$/.test(form.guestPhone) ? '✅' : '❌'}
            {' | '}
            Date: {form.checkInDate ? '✅' : '❌'}
            {' | '}
            Pricing: {pricingPreview ? '✅' : '❌'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
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
                    className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                    required
                  >
                    <option value="">Choose a room...</option>
                    {rooms.map(r => (
                      <option key={r._id} value={r._id}>
                        {r.roomNumber} - {r.roomType} (₹{r.pricing.basePrice}/night)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Booking Type Selection */}
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    Booking Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setBookingType('daily')}
                      className={`px-6 py-4 rounded-xl font-medium transition-all border-2 ${
                        bookingType === 'daily'
                          ? 'bg-teal-50 border-teal-500 text-teal-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <Calendar className="h-5 w-5 mx-auto mb-2" />
                      Daily/Nightly Stay
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType('hourly')}
                      className={`px-6 py-4 rounded-xl font-medium transition-all border-2 ${
                        bookingType === 'hourly'
                          ? 'bg-teal-50 border-teal-500 text-teal-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <Clock className="h-5 w-5 mx-auto mb-2" />
                      Hourly Stay
                    </button>
                  </div>
                </div>

                {/* Guest Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5" /> Guest Information
                  </h3>

                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="guestName"
                      value={form.guestName}
                      onChange={handleChange}
                      className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">Email</label>
                      <input
                        type="email"
                        name="guestEmail"
                        value={form.guestEmail}
                        onChange={handleChange}
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-800 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="guestPhone"
                        value={form.guestPhone}
                        onChange={handleChange}
                        pattern="\d{10}"
                        placeholder="10 digits"
                        className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                        required
                      />
                    </div>
                  </div>

                  {/* ID Proof Section */}
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
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {idProofPreview && (
                      <div className="mt-4">
                        <img src={idProofPreview} alt="ID Proof Preview" className="w-48 h-auto rounded-xl border" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-800 mb-2">
                      Booking Source <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="source"
                      value={form.source}
                      onChange={handleChange}
                      className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                      required
                    >
                      <option value="Direct">Direct</option>
                      <option value="Phone">Phone</option>
                      <option value="Email">Email</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Booking.com">Booking.com</option>
                      <option value="MakeMyTrip">MakeMyTrip</option>
                      <option value="OYO">OYO</option>
                      <option value="Goibibo">Goibibo</option>
                      <option value="Agoda">Agoda</option>
                    </select>
                  </div>
                </div>

                {/* Check-in/out Dates */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Stay Details
                  </h3>

                  {bookingType === 'daily' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">
                          Check-in Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="checkInDate"
                          value={form.checkInDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                          required
                        />
                        {errors.checkInDate && <p className="text-red-500 text-sm mt-1">{errors.checkInDate}</p>}
                      </div>

                      <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">
                          Check-in Time <span className="text-red-500">*</span>
                        </label>
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
                        <label className="block text-base font-medium text-gray-800 mb-2">
                          Check-out Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="checkOutDate"
                          value={form.checkOutDate}
                          onChange={handleChange}
                          min={form.checkInDate || new Date().toISOString().split('T')[0]}
                          className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                          required
                        />
                        {errors.checkOutDate && <p className="text-red-500 text-sm mt-1">{errors.checkOutDate}</p>}
                      </div>

                      <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">
                          Check-out Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          name="checkOutTime"
                          value={form.checkOutTime}
                          onChange={handleChange}
                          className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-teal-500 focus:ring-teal-200"
                          required
                        />
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

                      {/* Manual Price Option for Hourly Bookings */}
                      <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <input
                            type="checkbox"
                            id="useManualPrice"
                            checked={form.useManualPrice}
                            onChange={handleManualPriceToggle}
                            className="mt-1 w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                          />
                          <div className="flex-1">
                            <label htmlFor="useManualPrice" className="text-base font-semibold text-gray-900 cursor-pointer flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-orange-600" />
                              Set Custom Price Per Hour
                            </label>
                            <p className="text-sm text-gray-600 mt-1">
                              Override automatic price calculation and set your own hourly rate
                            </p>
                          </div>
                        </div>

                        {form.useManualPrice && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Price Per Hour (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              name="manualPrice"
                              value={form.manualPrice}
                              onChange={handleChange}
                              min="1"
                              step="1"
                              placeholder="Enter price per hour"
                              className="text-black w-full px-5 py-3.5 border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-orange-200 font-semibold text-lg"
                              required
                            />
                            {form.manualPrice && (
                              <p className="text-sm text-green-700 mt-2 font-medium">
                                Total: ₹{Number(form.manualPrice) * form.hours} for {form.hours} hour{form.hours > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {form.checkOutDate && form.checkOutTime && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
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
                      value={form.children}
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
                  disabled={loading || !validationState}
                  className={`mt-8 w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all shadow-lg
                    ${validationState 
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
                  <div className={`p-5 rounded-xl border ${
                    pricingPreview.isManualPrice 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-teal-50 border-teal-100'
                  }`}>
                    <div className={`text-sm mb-1 ${
                      pricingPreview.isManualPrice ? 'text-orange-800' : 'text-teal-800'
                    }`}>
                      Room Charges ({pricingPreview.duration} {bookingType === 'hourly' 
                        ? (pricingPreview.duration === 1 ? 'hour' : 'hours')
                        : (pricingPreview.duration === 1 ? 'night' : 'nights')
                      })
                      {bookingType === 'hourly' && pricingPreview.hourlyRate && (
                        <span className="block text-xs mt-1">
                          @ ₹{pricingPreview.hourlyRate}/hour
                          {pricingPreview.isManualPrice && (
                            <span className="ml-2 px-2 py-0.5 bg-orange-200 text-orange-900 rounded-full text-xs font-semibold">
                              CUSTOM
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-gray-900">₹{pricingPreview.roomCharges.toLocaleString()}</div>

                    {pricingPreview.extraCharges > 0 && (
                      <div className={`mt-3 text-sm ${
                        pricingPreview.isManualPrice ? 'text-orange-700' : 'text-teal-700'
                      }`}>
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