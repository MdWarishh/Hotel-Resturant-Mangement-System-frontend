'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Building2, DoorOpen, User, Mail, Phone, CreditCard, Users, Calendar, Loader2, AlertCircle } from 'lucide-react';

export default function CreateBookingPage() {
  const router = useRouter();
  const { user } = useAuth();

  // 📹 State
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [form, setForm] = useState({
    hotel: '',
    room: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    idProofType: 'aadhar',
    idProofNumber: '',
    adults: 1,
    children: 0,
    checkInDate: '',
    checkOutDate: '',
    roomCharges: '',
    advancePayment: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* -------------------- FETCH HOTELS -------------------- */
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await apiRequest('/hotels');
        setHotels(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch hotels', err);
      }
    };

    fetchHotels();
  }, []);

  /* -------------------- FETCH ROOMS -------------------- */
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await apiRequest(
          `/rooms?hotel=${form.hotel}&status=available`
        );
        setRooms(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      }
    };

    if (form.hotel) fetchRooms();
    else setRooms([]);
  }, [form.hotel]);

  /* -------------------- HANDLE CHANGE -------------------- */
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  /* -------------------- SUBMIT BOOKING -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          hotel: form.hotel,
          room: form.room,

          guest: {
            name: form.guestName,
            phone: form.guestPhone,
            email: form.guestEmail || undefined,
          },

          numberOfGuests: {
            adults: Number(form.adults),
            children: 0,
          },

          dates: {
            checkIn: new Date(form.checkInDate).toISOString(),
            checkOut: new Date(form.checkOutDate).toISOString(),
          },

          pricing: {
            roomCharges: 0,
            extraCharges: 0,
            discount: 0,
          },

          advancePayment: 0,
        }),
      });

      router.push('/hotel-admin/bookings');
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-semibold text-[rgb(34,40,49)]">
            New Booking
          </h2>
          <p className="mt-1 text-sm text-[rgb(57,62,70)]">
            Create a new guest reservation
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 rounded-lg bg-[rgb(238,238,238)] px-4 py-2 text-sm font-medium text-[rgb(34,40,49)] transition-all duration-200 hover:bg-[rgb(57,62,70)] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 animate-[shake_0.4s_ease-in-out]">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-8 shadow-lg"
      >
        {/* HOTEL & ROOM SECTION */}
        <FormSection title="Property Details" icon={<Building2 className="h-5 w-5" />}>
          <Select
            label="Hotel"
            name="hotel"
            value={form.hotel}
            onChange={handleChange}
            icon={<Building2 className="h-5 w-5" />}
            required
          >
            <option value="">Select Hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id}>
                {hotel.name}
              </option>
            ))}
          </Select>

          <Select
            label="Room"
            name="room"
            value={form.room}
            onChange={handleChange}
            icon={<DoorOpen className="h-5 w-5" />}
            required
            disabled={!form.hotel || rooms.length === 0}
          >
            <option value="">
              {rooms.length === 0 ? 'No available rooms' : 'Select Room'}
            </option>
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                Room {room.roomNumber}
              </option>
            ))}
          </Select>
        </FormSection>

        {/* GUEST SECTION */}
        <FormSection title="Guest Information" icon={<User className="h-5 w-5" />}>
          <Input
            label="Guest Name"
            name="guestName"
            value={form.guestName}
            onChange={handleChange}
            icon={<User className="h-5 w-5" />}
            placeholder="John Doe"
          />
          <Input
            label="Guest Email"
            type="email"
            name="guestEmail"
            value={form.guestEmail}
            onChange={handleChange}
            icon={<Mail className="h-5 w-5" />}
            placeholder="guest@example.com"
          />
          <Input
            label="Guest Phone"
            name="guestPhone"
            value={form.guestPhone}
            onChange={handleChange}
            icon={<Phone className="h-5 w-5" />}
            placeholder="+91 1234567890"
          />
          <Input
            label="ID Proof Number"
            name="idProofNumber"
            value={form.idProofNumber}
            onChange={handleChange}
            icon={<CreditCard className="h-5 w-5" />}
            placeholder="Enter ID proof number"
          />
        </FormSection>

        {/* STAY DETAILS SECTION */}
        <FormSection title="Stay Details" icon={<Calendar className="h-5 w-5" />}>
          <Input
            label="Check-in Date"
            type="datetime-local"
            name="checkInDate"
            value={form.checkInDate}
            onChange={handleChange}
            icon={<Calendar className="h-5 w-5" />}
          />
          <Input
            label="Check-out Date"
            type="datetime-local"
            name="checkOutDate"
            value={form.checkOutDate}
            onChange={handleChange}
            icon={<Calendar className="h-5 w-5" />}
          />
          <Input
            label="Adults"
            type="number"
            min="1"
            name="adults"
            value={form.adults}
            onChange={handleChange}
            icon={<Users className="h-5 w-5" />}
          />
        </FormSection>

        {/* PAYMENT SECTION */}
        <FormSection title="Payment Details" icon={<CreditCard className="h-5 w-5" />}>
          <Input
            label="Room Charges"
            type="number"
            name="roomCharges"
            value={form.roomCharges}
            onChange={handleChange}
            icon={<CreditCard className="h-5 w-5" />}
            placeholder="0"
          />
          <Input
            label="Advance Payment"
            type="number"
            name="advancePayment"
            value={form.advancePayment}
            onChange={handleChange}
            icon={<CreditCard className="h-5 w-5" />}
            placeholder="0"
          />
        </FormSection>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[rgb(0,173,181)] py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating Booking...
            </span>
          ) : (
            'Create Booking'
          )}
        </button>
      </form>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

/* -------------------- FORM SECTION -------------------- */
function FormSection({ title, icon, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-[rgb(57,62,70)]/10 pb-2">
        <div className="text-[rgb(0,173,181)]">{icon}</div>
        <h3 className="text-lg font-semibold text-[rgb(34,40,49)]">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

/* -------------------- INPUT -------------------- */
function Input({ label, icon, ...props }) {
  return (
    <div className="group">
      <label className="mb-2 block text-sm font-medium text-[rgb(34,40,49)]">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(57,62,70)]/50 transition-colors duration-200 group-focus-within:text-[rgb(0,173,181)]">
            {icon}
          </div>
        )}
        <input
          {...props}
          required
          className={`w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 py-2.5 pr-4 text-[rgb(34,40,49)] placeholder-[rgb(57,62,70)]/50 transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20 disabled:cursor-not-allowed disabled:opacity-60 ${
            icon ? 'pl-11' : 'pl-4'
          }`}
        />
      </div>
    </div>
  );
}

/* -------------------- SELECT -------------------- */
function Select({ label, icon, children, ...props }) {
  return (
    <div className="group">
      <label className="mb-2 block text-sm font-medium text-[rgb(34,40,49)]">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(57,62,70)]/50 transition-colors duration-200 group-focus-within:text-[rgb(0,173,181)]">
            {icon}
          </div>
        )}
        <select
          {...props}
          className={`w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 py-2.5 pr-4 text-[rgb(34,40,49)] transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20 disabled:cursor-not-allowed disabled:opacity-60 ${
            icon ? 'pl-11' : 'pl-4'
          }`}
        >
          {children}
        </select>
      </div>
    </div>
  );
}