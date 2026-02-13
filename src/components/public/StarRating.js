// frontend/components/public/StarRating.jsx

'use client';

export default function StarRating({ rating, totalReviews, size = 'sm', showCount = true }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Size classes
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSize = sizeClasses[size] || sizeClasses.sm;

  // Generate stars
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      // Full star
      stars.push(
        <svg
          key={i}
          className={`${iconSize} text-yellow-400 fill-current`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      // Half star
      stars.push(
        <div key={i} className="relative">
          <svg
            className={`${iconSize} text-gray-300`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <svg
            className={`${iconSize} text-yellow-400 absolute top-0 left-0`}
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      );
    } else {
      // Empty star
      stars.push(
        <svg
          key={i}
          className={`${iconSize} text-gray-300`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
  }

  if (rating === 0 && totalReviews === 0) {
    return (
      <div className="flex items-center gap-1 text-gray-400 text-sm">
        <span>No reviews yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">{stars}</div>
      {showCount && (
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} {totalReviews > 0 && `(${totalReviews})`}
        </span>
      )}
    </div>
  );
}