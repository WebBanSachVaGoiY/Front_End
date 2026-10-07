import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Zap, Minus, Plus,
  BookOpen, Building, Calendar, Hash, Globe, Trash2,
} from 'lucide-react';
import { bookApi } from '../../api/bookApi';
import { reviewApi } from '../../api/reviewApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { RatingDisplay, StarRating } from '../../components/ui/StarRating';
import { StockBadge } from '../../components/ui/Badge';
import { BookCard } from '../../components/book/BookCard';
import { formatCurrency } from '../../utils/formatCurrency';
import { timeAgo } from '../../utils/formatDate';
import { DEFAULT_BOOK_COVER } from '../../utils/constants';
import './BookDetailPage.css';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Review form
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReviewState, setCanReviewState] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [bookData, reviewData] = await Promise.all([
          bookApi.getBook(id),
          reviewApi.getBookReviews(id).catch(() => []),
        ]);
        setBook(bookData);
        setReviews(reviewData.content || reviewData || []);

        if (bookData.category?.id) {
          const relatedData = await bookApi.getBooks({
            categoryId: bookData.category.id,
            size: 4,
          }).catch(() => ({ content: [] }));
          setRelated((relatedData.content || []).filter((b) => b.id !== bookData.id));
        }

        if (isAuthenticated) {
          reviewApi.canUserReview(id)
            .then(setCanReviewState)
            .catch(() => setCanReviewState({ canReview: true }));
        }
      } catch {
        toast.error('Không tìm thấy sách');
        navigate('/books');
      } finally {
        setLoading(false);
      }
    };
    fetch();
    window.scrollTo(0, 0);
  }, [id, isAuthenticated]);

  const changeQty = (delta) => {
    setQuantity((q) => {
      const next = q + delta;
      if (next < 1) return 1;
      if (next > (book?.stockQuantity || 1)) {
        toast.warning(`Chỉ còn ${book.stockQuantity} cuốn trong kho`);
        return book.stockQuantity;
      }
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await addToCart(book.id, quantity);
      toast.success(`Đã thêm ${quantity} cuốn vào giỏ hàng`);
    } catch {
      toast.error('Không thể thêm vào giỏ hàng');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để mua hàng');
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await addToCart(book.id, quantity);
      navigate('/checkout');
    } catch {
      toast.error('Không thể xử lý yêu cầu mua ngay');
    } finally {
      setAdding(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để đánh giá');
      return;
    }
    setSubmittingReview(true);
    try {
      const newReview = await reviewApi.createReview({
        bookId: book.id,
        rating: myRating,
        comment: myComment,
      });
      setReviews((prev) => [newReview, ...prev]);
      setMyComment('');
      setCanReviewState((prev) => ({ ...prev, canReview: false, alreadyReviewed: true }));
      toast.success('Cảm ơn đánh giá của bạn!');
      bookApi.getBook(book.id).then(setBook).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này không?')) return;
    try {
      await reviewApi.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success('Đã xóa đánh giá thành công');
      reviewApi.canUserReview(book.id).then(setCanReviewState).catch(() => {});
      bookApi.getBook(book.id).then(setBook).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa đánh giá');
    }
  };

  if (loading) return <><Navbar /><PageSpinner /></>;
  if (!book) return null;

  const hasDiscount = book.discountPrice && book.discountPrice < book.price;
  const displayPrice = hasDiscount ? book.discountPrice : book.price;
  const discountPct = hasDiscount
    ? Math.round((1 - book.discountPrice / book.price) * 100)
    : 0;

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="book-detail-page">
          <div className="container">
            {/* Breadcrumb */}
            <nav className="breadcrumb animate-fadeInDown">
              <Link to="/">Trang chủ</Link>
              <span>/</span>
              <Link to="/books">Sách</Link>
              <span>/</span>
              <span>{book.title}</span>
            </nav>

            {/* Main Content */}
            <div className="book-detail-grid animate-fadeInUp">
              {/* Cover */}
              <div className="book-cover-section">
                <div className="book-cover-wrapper">
                  <img
                    src={book.coverImageUrl || DEFAULT_BOOK_COVER}
                    alt={book.title}
                    className="book-cover-img"
                    onError={(e) => { e.target.src = DEFAULT_BOOK_COVER; }}
                  />
                  {hasDiscount && (
                    <div className="cover-discount-badge">-{discountPct}%</div>
                  )}
                </div>

                {/* Specs */}
                <div className="book-specs card">
                  {book.publisher && (
                    <div className="spec-row">
                      <Building size={15} />
                      <div>
                        <span className="spec-label">NXB</span>
                        <span className="spec-value">{book.publisher}</span>
                      </div>
                    </div>
                  )}
                  {book.publicationYear && (
                    <div className="spec-row">
                      <Calendar size={15} />
                      <div>
                        <span className="spec-label">Năm XB</span>
                        <span className="spec-value">{book.publicationYear}</span>
                      </div>
                    </div>
                  )}
                  {book.isbn && (
                    <div className="spec-row">
                      <Hash size={15} />
                      <div>
                        <span className="spec-label">ISBN</span>
                        <span className="spec-value">{book.isbn}</span>
                      </div>
                    </div>
                  )}
                  {book.pageCount && (
                    <div className="spec-row">
                      <BookOpen size={15} />
                      <div>
                        <span className="spec-label">Số trang</span>
                        <span className="spec-value">{book.pageCount}</span>
                      </div>
                    </div>
                  )}
                  {book.language && (
                    <div className="spec-row">
                      <Globe size={15} />
                      <div>
                        <span className="spec-label">Ngôn ngữ</span>
                        <span className="spec-value">{book.language}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="book-info-section">
                {book.category && (
                  <Link to={`/books?categoryId=${book.category.id}`} className="book-category-link">
                    {book.category.name}
                  </Link>
                )}

                <h1 className="book-detail-title">{book.title}</h1>
                <p className="book-detail-author">Tác giả: <strong>{book.author}</strong></p>

                <div className="book-detail-rating">
                  <RatingDisplay rating={book.averageRating} totalReviews={book.totalReviews} size={16} />
                  <StockBadge stock={book.stockQuantity} />
                </div>

                {/* Price */}
                <div className="book-detail-price">
                  <span className="detail-price-current">{formatCurrency(displayPrice)}</span>
                  {hasDiscount && (
                    <>
                      <span className="detail-price-original">{formatCurrency(book.price)}</span>
                      <span className="detail-price-save">Tiết kiệm {formatCurrency(book.price - book.discountPrice)}</span>
                    </>
                  )}
                </div>

                {/* Quantity */}
                {book.stockQuantity > 0 && (
                  <div className="quantity-section">
                    <label className="form-label">Số lượng</label>
                    <div className="quantity-control">
                      <button className="qty-btn" onClick={() => changeQty(-1)} disabled={quantity <= 1}>
                        <Minus size={16} />
                      </button>
                      <input
                        type="number"
                        className="qty-input"
                        value={quantity}
                        min={1}
                        max={book.stockQuantity}
                        onChange={(e) => {
                          let v = parseInt(e.target.value) || 1;
                          if (v > book.stockQuantity) { v = book.stockQuantity; toast.warning(`Chỉ còn ${book.stockQuantity} cuốn`); }
                          setQuantity(v);
                        }}
                      />
                      <button className="qty-btn" onClick={() => changeQty(1)} disabled={quantity >= book.stockQuantity}>
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="qty-stock">Còn {book.stockQuantity} cuốn</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="book-detail-actions">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ShoppingCart size={18} />}
                    onClick={handleAddToCart}
                    loading={adding}
                    disabled={book.stockQuantity === 0}
                    fullWidth
                    id="add-to-cart-btn"
                  >
                    {book.stockQuantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                  </Button>
                  {book.stockQuantity > 0 && (
                    <Button
                      variant="accent"
                      size="lg"
                      icon={<Zap size={18} />}
                      onClick={handleBuyNow}
                      fullWidth
                      id="buy-now-btn"
                    >
                      Mua ngay
                    </Button>
                  )}
                </div>

                {/* Description */}
                {book.description && (
                  <div className="book-description">
                    <h3>Mô tả sách</h3>
                    <p>{book.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section animate-fadeInUp">
              <h2 className="section-title">
                Đánh giá ({reviews.length})
              </h2>

              {/* Write Review */}
              {isAuthenticated && (
                <div className="write-review card">
                  <h4>Viết đánh giá</h4>
                  {canReviewState && !canReviewState.canReview ? (
                    <div style={{
                      padding: '12px 16px',
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      marginTop: '8px',
                    }}>
                      💡 {canReviewState.reason || (canReviewState.alreadyReviewed ? 'Bạn đã đánh giá cuốn sách này rồi.' : 'Chỉ những khách hàng đã mua và nhận sách thành công mới có thể gửi đánh giá.')}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview}>
                      <div className="review-rating">
                        <label className="form-label">Chấm điểm</label>
                        <StarRating
                          rating={myRating}
                          interactive
                          size={28}
                          onChange={setMyRating}
                        />
                      </div>
                      <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">Nhận xét của bạn</label>
                        <textarea
                          className="form-input form-textarea"
                          placeholder="Chia sẻ cảm nhận về cuốn sách..."
                          value={myComment}
                          onChange={(e) => setMyComment(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={submittingReview}
                        style={{ marginTop: '1rem' }}
                      >
                        Gửi đánh giá
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div className="reviews-empty">
                  <p>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {reviews.map((review) => {
                    const isOwnerOrAdmin = user && (user.id === review.user?.id || user.role === 'ROLE_ADMIN');
                    return (
                      <div key={review.id} className="review-card card">
                        <div className="review-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="reviewer-avatar">
                              {review.user?.fullName?.[0] || review.user?.username?.[0] || 'U'}
                            </div>
                            <div>
                              <div className="reviewer-name">
                                {review.user?.fullName || review.user?.username}
                              </div>
                              <div className="review-meta">
                                <StarRating rating={review.rating} size={12} />
                                <span className="review-time">{timeAgo(review.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {isOwnerOrAdmin && (
                            <button
                              type="button"
                              className="btn-icon-sm danger"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                padding: '4px 6px',
                                borderRadius: '4px',
                                opacity: 0.7,
                                transition: 'opacity 0.2s',
                              }}
                              onClick={() => handleDeleteReview(review.id)}
                              title="Xóa đánh giá"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                        {review.comment && (
                          <p className="review-comment" style={{ marginTop: '8px' }}>{review.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Related Books */}
            {related.length > 0 && (
              <div className="related-section animate-fadeInUp">
                <div className="section-header">
                  <h2 className="section-title">Sách cùng danh mục</h2>
                  <Link to={`/books?categoryId=${book.category?.id}`} className="see-all-link">
                    Xem thêm →
                  </Link>
                </div>
                <div className="book-grid">
                  {related.map((b) => <BookCard key={b.id} book={b} />)}
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
