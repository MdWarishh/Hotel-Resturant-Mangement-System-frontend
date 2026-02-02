'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, DoorOpen, Bed, Users, CreditCard, FileText, Loader2, AlertCircle, Layers } from 'lucide-react';

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
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const payload = {
        hotel: user.hotel,
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
          extraAdultCharge: form.extraAdultCharge
            ? Number(form.extraAdultCharge)
            : undefined,
          extraChildCharge: form.extraChildCharge
            ? Number(form.extraChildCharge)
            : undefined,
        },
        description: form.description,
      };

      await apiRequest('/rooms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      router.push('/hotel-admin/rooms');
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        setErrors([err.message || 'Failed to create room']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-6 shadow-lg">
        <div>
          <h2 className="text-2xl font-semibold text-[rgb(34,40,49)]">Add Room</h2>
          <p className="mt-1 text-sm text-[rgb(57,62,70)]">
            Create a new room in your hotel
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

      {/* ERRORS */}
      {errors.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 animate-[shake_0.4s_ease-in-out]">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-8 shadow-lg"
      >
        {/* BASIC INFO */}
        <FormSection title="Basic Information" icon={<DoorOpen className="h-5 w-5" />}>
          <Input
            label="Room Number"
            name="roomNumber"
            value={form.roomNumber}
            onChange={handleChange}
            icon={<DoorOpen className="h-5 w-5" />}
            placeholder="101"
          />

          <Select
            label="Room Type"
            name="roomType"
            value={form.roomType}
            onChange={handleChange}
            icon={<Bed className="h-5 w-5" />}
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
            icon={<Layers className="h-5 w-5" />}
            placeholder="0"
          />
        </FormSection>

        {/* CAPACITY */}
        <FormSection title="Capacity" icon={<Users className="h-5 w-5" />}>
          <Input
            label="Adults Capacity"
            name="adults"
            type="number"
            value={form.adults}
            onChange={handleChange}
            icon={<Users className="h-5 w-5" />}
            placeholder="1"
          />
          <Input
            label="Children Capacity"
            name="children"
            type="number"
            value={form.children}
            onChange={handleChange}
            icon={<Users className="h-5 w-5" />}
            placeholder="0"
          />
        </FormSection>

        {/* PRICING */}
        <FormSection title="Pricing" icon={<CreditCard className="h-5 w-5" />}>
          <Input
            label="Base Price (₹)"
            name="basePrice"
            type="number"
            value={form.basePrice}
            onChange={handleChange}
            icon={<CreditCard className="h-5 w-5" />}
            placeholder="1000"
          />
          <Input
            label="Weekend Price (₹)"
            name="weekendPrice"
            type="number"
            value={form.weekendPrice}
            onChange={handleChange}
            icon={<CreditCard className="h-5 w-5" />}
            placeholder="1200"
          />
          <Input
            label="Extra Adult Charge (₹)"
            name="extraAdultCharge"
            type="number"
            value={form.extraAdultCharge}
            onChange={handleChange}
            icon={<CreditCard className="h-5 w-5" />}
            placeholder="500"
          />
          <Input
            label="Extra Child Charge (₹)"
            name="extraChildCharge"
            type="number"
            value={form.extraChildCharge}
            onChange={handleChange}
            icon={<CreditCard className="h-5 w-5" />}
            placeholder="300"
          />
        </FormSection>

        {/* DESCRIPTION */}
        <FormSection title="Description" icon={<FileText className="h-5 w-5" />}>
          <div className="col-span-2">
            <label className="mb-2 block text-sm font-medium text-[rgb(34,40,49)]">
              Room Description
            </label>
            <div className="relative">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 px-4 py-2.5 text-[rgb(34,40,49)] placeholder-[rgb(57,62,70)]/50 transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20"
                placeholder="Enter room description and amenities..."
              />
            </div>
          </div>
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
              Creating Room...
            </span>
          ) : (
            'Create Room'
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
          className={`w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 py-2.5 pr-4 text-[rgb(34,40,49)] placeholder-[rgb(57,62,70)]/50 transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20 ${
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
          className={`w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 py-2.5 pr-4 text-[rgb(34,40,49)] transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20 ${
            icon ? 'pl-11' : 'pl-4'
          }`}
        >
          {children}
        </select>
      </div>
    </div>
  );
}