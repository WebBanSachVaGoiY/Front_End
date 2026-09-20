import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, BookOpen, Star, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { bookApi } from '../../api/bookApi';
import { BookCard } from '../../components/book/BookCard';
import { PageSpinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import './HomePage.css';

export default function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [newBooks, setNewBooks] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, newer, cats, recommended] = await Promise.all([
          bookApi.getFeaturedBooks().catch(() => ({ content: [] })),
          bookApi.getBooks({ sort: 'newest', size: 8 }).catch(() => ({ content: [] })),
          bookApi.getCategories().catch(() => []),
          bookApi.getRecommendations().catch(() => ({ content: [] })),
        ]);
        setFeaturedBooks(featured.content || featured || []);
        setNewBooks(newer.content || newer || []);
        setCategories(cats.slice ? cats.slice(0, 8) : []);
        setRecommendedBooks(recommended.content || recommended || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const STATS = [
    { icon: <BookOpen size={24} />, value: '10,000+', label: 'Đầu sách' },
    { icon: <Star size={24} />, value: '50,000+', label: 'Đánh giá' },
    { icon: <TrendingUp size={24} />, value: '5,000+', label: 'Khách hàng' },
    { icon: <Zap size={24} />, value: '99%', label: 'Hài lòng' },
  ];

  if (loading) return (
    <>
      <Navbar />
      <PageSpinner />
    </>
  );

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-bg">
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />
            <div className="hero-orb hero-orb-3" />
          </div>

          <div className="container hero-content">
            <div className="hero-text animate-fadeInUp">
              <div className="hero-badge">
                <Zap size={14} />
                <span>Hệ thống gợi ý sách thông minh</span>
              </div>
              <h1 className="hero-title">
                Khám phá tri thức qua<br />
                <span className="hero-highlight">từng trang sách</span>
              </h1>
              <p className="hero-desc">
                Hàng nghìn đầu sách chất lượng, giá tốt, giao hàng tận nơi.
                Hệ thống AI gợi ý sách phù hợp với sở thích của bạn.
              </p>

              <form className="hero-search" onSubmit={handleSearch}>
                <Search size={20} className="hero-search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tên sách, tác giả..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="hero-search-input"
                />
                <Button type="submit" variant="accent" className="hero-search-btn">
                  Tìm kiếm
                </Button>
              </form>

              <div className="hero-actions">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<BookOpen size={18} />}
                  onClick={() => navigate('/books')}
                >
                  Xem tất cả sách
                </Button>
                <Link to="/books?featured=true" className="hero-link">
                  Sách nổi bật <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-bar">
            <div className="container stats-grid">
              {STATS.map((stat, i) => (
                <div key={i} className="stat-item animate-fadeInUp" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="stat-icon">{stat.icon}</span>
                  <div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="section">
            <div className="container">
              <div className="section-header">
                <h2 className="section-title">Danh mục sách</h2>
                <Link to="/books" className="see-all-link">
                  Xem tất cả <ArrowRight size={16} />
                </Link>
              </div>
              <div className="categories-grid">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/books?categoryId=${cat.id}`}
                    className="category-card"
                  >
                    <span className="category-icon">📚</span>
                    <span className="category-name">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recommended Books */}
        {recommendedBooks.length > 0 && (
          <section className="section">
            <div className="container">
              <div className="section-header">
                <h2 className="section-title">
                  <Sparkles size={24} className="section-title-icon" style={{ color: 'var(--accent)' }} />
                  Gợi ý dành cho bạn
                </h2>
                <Link to="/books" className="see-all-link">
                  Xem tất cả <ArrowRight size={16} />
                </Link>
              </div>
              <div className="book-grid">
                {recommendedBooks.slice(0, 4).map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Books */}
        {featuredBooks.length > 0 && (
          <section className="section featured-section">
            <div className="container">
              <div className="section-header">
                <h2 className="section-title">
                  <Star size={24} className="section-title-icon" />
                  Sách nổi bật
                </h2>
                <Link to="/books?featured=true" className="see-all-link">
                  Xem tất cả <ArrowRight size={16} />
                </Link>
              </div>
              <div className="book-grid">
                {featuredBooks.slice(0, 8).map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newBooks.length > 0 && (
          <section className="section">
            <div className="container">
              <div className="section-header">
                <h2 className="section-title">
                  <Zap size={24} className="section-title-icon" />
                  Sách mới nhất
                </h2>
                <Link to="/books?sort=newest" className="see-all-link">
                  Xem tất cả <ArrowRight size={16} />
                </Link>
              </div>
              <div className="book-grid">
                {newBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Banner */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div className="cta-orb" />
              <div className="cta-content">
                <h2>Bắt đầu hành trình đọc sách ngay hôm nay</h2>
                <p>Đăng ký miễn phí, nhận gợi ý sách cá nhân hoá từ AI</p>
                <div className="cta-actions">
                  <Button variant="accent" size="lg" onClick={() => navigate('/register')}>
                    Đăng ký miễn phí
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate('/books')}>
                    Khám phá ngay
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
