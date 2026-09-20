import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { DEFAULT_BOOK_COVER } from '../../utils/constants';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import './BookCard.css';

export function BookCard({ book }) {
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const hasDiscount = book.discountPrice && book.discountPrice < book.price;
  const displayPrice = hasDiscount ? book.discountPrice : book.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - book.discountPrice / book.price) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    if (book.stockQuantity === 0) {
      toast.error('Sách đã hết hàng');
      return;
    }
    setAdding(true);
    try {
      await addToCart(book.id, 1);
      toast.success(`Đã thêm "${book.title}" vào giỏ hàng`);
    } catch {
      toast.error('Không thể thêm vào giỏ hàng');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <div className="book-card-image-wrapper">
        <img
          src={imgError ? DEFAULT_BOOK_COVER : (book.coverImageUrl || DEFAULT_BOOK_COVER)}
          alt={book.title}
          className="book-card-image"
          onError={() => setImgError(true)}
          loading="lazy"
        />
        {hasDiscount && (
          <div className="book-card-discount">-{discountPercent}%</div>
        )}
        {book.isFeatured && (
          <div className="book-card-featured">Nổi bật</div>
        )}
        <div className="book-card-overlay">
          <button
            className="book-card-view-btn"
            aria-label="Xem chi tiết"
            title="Xem chi tiết"
          >
            <Eye size={18} />
            Xem chi tiết
          </button>
        </div>
      </div>

      <div className="book-card-body">
        <p className="book-card-category">{book.category?.name || 'Sách'}</p>
        <h3 className="book-card-title" title={book.title}>
          {book.title}
        </h3>
        <p className="book-card-author">{book.author}</p>

        <div className="book-card-rating">
          <Star size={12} fill="currentColor" className="star-icon" />
          <span>{book.averageRating?.toFixed(1) || '0.0'}</span>
          <span className="separator">·</span>
          <span>{book.totalReviews || 0} đánh giá</span>
        </div>

        <div className="book-card-footer">
          <div className="book-card-price">
            <span className="price-current">{formatCurrency(displayPrice)}</span>
            {hasDiscount && (
              <span className="price-original">{formatCurrency(book.price)}</span>
            )}
          </div>
          <button
            className={`book-card-cart-btn ${adding ? 'loading' : ''}`}
            onClick={handleAddToCart}
            disabled={adding || book.stockQuantity === 0}
            aria-label="Thêm vào giỏ hàng"
            title={book.stockQuantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
          >
            {adding ? (
              <span className="spinner spinner-sm" style={{ borderTopColor: 'white' }} />
            ) : (
              <ShoppingCart size={16} />
            )}
          </button>
        </div>

        {book.stockQuantity === 0 && (
          <div className="book-card-out-of-stock">Hết hàng</div>
        )}
      </div>
    </Link>
  );
}
