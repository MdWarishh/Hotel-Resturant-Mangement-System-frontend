'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Hotel, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      // redirect AuthContext handle karega (role based)
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[rgb(238,238,238)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[rgb(0,173,181)]" />
          <p className="text-sm text-[rgb(57,62,70)]">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(238,238,238)] px-4 py-8">
      <div className="w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[rgb(0,173,181)] shadow-lg transition-transform duration-300 hover:scale-105">
            <Hotel className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[rgb(34,40,49)]">
            Amulya Resturant
          </h1>
          <p className="mt-2 text-sm text-[rgb(57,62,70)]">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-[rgb(57,62,70)]/10 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl">
          {error && (
            <div className="mb-6 animate-[shake_0.4s_ease-in-out] rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="group">
              <label className="mb-2 block text-sm font-medium text-[rgb(34,40,49)]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgb(57,62,70)]/50 transition-colors duration-200 group-focus-within:text-[rgb(0,173,181)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 py-2.5 pl-11 pr-4 text-[rgb(34,40,49)] placeholder-[rgb(57,62,70)]/50 transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20"
                  placeholder="admin@hotelmaster.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group">
              <label className="mb-2 block text-sm font-medium text-[rgb(34,40,49)]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgb(57,62,70)]/50 transition-colors duration-200 group-focus-within:text-[rgb(0,173,181)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[rgb(57,62,70)]/20 bg-[rgb(238,238,238)]/30 py-2.5 pl-11 pr-4 text-[rgb(34,40,49)] placeholder-[rgb(57,62,70)]/50 transition-all duration-200 focus:border-[rgb(0,173,181)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/20"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full overflow-hidden rounded-lg bg-[rgb(0,173,181)] py-2.5 font-medium text-white shadow-lg transition-all duration-200 hover:bg-[rgb(0,173,181)]/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[rgb(0,173,181)]/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[rgb(57,62,70)]">
          Secure login powered by Amulya Resturant
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}