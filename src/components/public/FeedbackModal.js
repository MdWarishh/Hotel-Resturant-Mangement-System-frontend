// frontend/components/public/FeedbackModal.jsx

'use client';

import { useState } from 'react';
import axios from 'axios';

export default function FeedbackModal({ isOpen, onClose, hotelCode, menuItem, customer, orderNumber }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(`${API_URL}/public/${hotelCode}/feedback`, {
        menuItemId: menuItem._id,
        orderNumber: orderNumber || undefined,
        rating,
        comment: comment.trim(),
        customer: {
          name: customer.name,
          phone: customer.phone,
        },
      });

      setSuccess(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {success ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600">Your feedback has been submitted successfully</p>
            </div>
          ) : (
            /* Feedback Form */
            <>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate This Item</h2>
                <p className="text-gray-600 text-sm">{menuItem.name}</p>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg
                        className={`w-12 h-12 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comment <span className="text-gray-400 text-sm">(Optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {comment.length}/500 characters
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}