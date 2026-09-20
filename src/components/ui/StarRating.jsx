import { Star } from 'lucide-react';
import './StarRating.css';

export function StarRating({ rating, maxStars = 5, size = 16, interactive = false, onChange }) {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <div className={`star-rating ${interactive ? 'star-interactive' : ''}`}>
      {stars.map((star) => {
        const filled = star <= Math.round(rating);
        return (
          <button
            key={star}
            type="button"
            className={`star ${filled ? 'star-filled' : 'star-empty'}`}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
            style={{ '--size': `${size}px` }}
            aria-label={`${star} sao`}
            disabled={!interactive}
          >
            <Star size={size} fill={filled ? 'currentColor' : 'none'} />
          </button>
        );
      })}
    </div>
  );
}

export function RatingDisplay({ rating, totalReviews, size = 14 }) {
  return (
    <div className="rating-display">
      <StarRating rating={rating} size={size} />
      <span className="rating-value">{rating?.toFixed(1)}</span>
      {totalReviews != null && (
        <span className="rating-count">({totalReviews})</span>
      )}
    </div>
  );
}
