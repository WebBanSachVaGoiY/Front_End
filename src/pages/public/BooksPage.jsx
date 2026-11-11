import { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown, Tag, DollarSign, RotateCcw } from 'lucide-react';
import { bookApi } from '../../api/bookApi';
import { BookCard } from '../../components/book/BookCard';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { SORT_OPTIONS } from '../../utils/constants';
import './BooksPage.css';

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: '', max: '' },
  { label: 'Dưới 100.000₫', min: '', max: '100000' },
  { label: '100.000₫ - 200.000₫', min: '100000', max: '200000' },
  { label: '200.000₫ - 500.000₫', min: '200000', max: '500000' },
  { label: 'Trên 500.000₫', min: '500000', max: '' },
];

export default function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [showFilter, setShowFilter] = useState(false);

  // Search input with debounce
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debounceTimerRef = useRef(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    sort: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  });

  const PAGE_SIZE = 12;

  const fetchBooks = useCallback(async (currentPage, currentFilters) => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: PAGE_SIZE,
        sort: currentFilters.sort,
      };
      if (currentFilters.search) params.keyword = currentFilters.search;
      if (currentFilters.categoryId) params.categoryId = currentFilters.categoryId;
      if (currentFilters.minPrice) params.minPrice = currentFilters.minPrice;
      if (currentFilters.maxPrice) params.maxPrice = currentFilters.maxPrice;

      let result;
      if (currentFilters.search) {
        result = await bookApi.searchBooks(currentFilters.search, params);
      } else {
        result = await bookApi.getBooks(params);
      }

      setBooks(result.content || result || []);
      setTotal(result.totalElements || (result.content || result)?.length || 0);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bookApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const initialFilters = {
      search: searchParams.get('search') || '',
      categoryId: searchParams.get('categoryId') || '',
      sort: searchParams.get('sort') || 'newest',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
    };
    setFilters(initialFilters);
    setSearchInput(initialFilters.search);
    setPage(0);
    fetchBooks(0, initialFilters);
  }, [searchParams, fetchBooks]);

  const buildParams = (f) => {
    const params = {};
    if (f.search) params.search = f.search;
    if (f.categoryId) params.categoryId = f.categoryId;
    if (f.sort && f.sort !== 'newest') params.sort = f.sort;
    if (f.minPrice) params.minPrice = f.minPrice;
    if (f.maxPrice) params.maxPrice = f.maxPrice;
    return params;
  };

  const updateFiltersAndUrl = (newFilters) => {
    setFilters(newFilters);
    setSearchParams(buildParams(newFilters));
  };

  // Debounced search typing handler
  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const updated = { ...filters, search: value.trim() };
      updateFiltersAndUrl(updated);
    }, 400);
  };

  const handleCategorySelect = (catId) => {
    const updated = { ...filters, categoryId: String(catId) === String(filters.categoryId) ? '' : catId };
    updateFiltersAndUrl(updated);
  };

  const handlePricePresetSelect = (preset) => {
    const updated = { ...filters, minPrice: preset.min, maxPrice: preset.max };
    updateFiltersAndUrl(updated);
  };

  const isPresetActive = (preset) => {
    return String(filters.minPrice || '') === String(preset.min) && String(filters.maxPrice || '') === String(preset.max);
  };

  const clearFilters = () => {
    setSearchInput('');
    const emptyFilters = { search: '', categoryId: '', sort: 'newest', minPrice: '', maxPrice: '' };
    setFilters(emptyFilters);
    setSearchParams({});
  };

  const clearFilterField = (field) => {
    if (field === 'search') setSearchInput('');
    const updated = { ...filters, [field]: '' };
    updateFiltersAndUrl(updated);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchBooks(newPage, filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters =
    filters.search || filters.categoryId || filters.sort !== 'newest' || filters.minPrice || filters.maxPrice;

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="books-page">
          <div className="container">
            {/* Header */}
            <div className="books-header animate-fadeInDown">
              <div>
                <h1 className="books-title">Tất cả sách</h1>
                <p className="books-count">
                  {total > 0 ? `Tìm thấy ${total} quyển sách chất lượng` : 'Đang tìm kiếm...'}
                </p>
              </div>

              <div className="books-controls">
                {/* Search Bar on Header */}
                <div className="header-search-box">
                  <Search size={16} className="search-box-icon" />
                  <input
                    type="text"
                    className="header-search-input"
                    placeholder="Tìm theo tên sách, tác giả..."
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                  {searchInput && (
                    <button className="search-clear-btn" onClick={() => handleSearchChange('')}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Sort Selector */}
                <div className="sort-select-wrapper">
                  <ChevronDown size={14} className="sort-chevron" />
                  <select
                    className="sort-select"
                    value={filters.sort}
                    onChange={(e) => {
                      const newSort = e.target.value;
                      updateFiltersAndUrl({ ...filters, sort: newSort });
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Panel Toggle Button */}
                <Button
                  variant={showFilter ? 'primary' : 'secondary'}
                  size="sm"
                  icon={<SlidersHorizontal size={16} />}
                  onClick={() => setShowFilter((v) => !v)}
                >
                  Bộ lọc
                  {hasActiveFilters && <span className="filter-dot" />}
                </Button>
              </div>
            </div>

            {/* Quick Category Pills */}
            <div className="category-pills-bar animate-fadeInDown">
              <button
                className={`category-pill ${!filters.categoryId ? 'active' : ''}`}
                onClick={() => handleCategorySelect('')}
              >
                Tất cả thể loại
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-pill ${String(filters.categoryId) === String(cat.id) ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Expandable Filter Panel */}
            {showFilter && (
              <div className="filter-panel animate-fadeInDown card">
                <div className="filter-panel-title">
                  <span className="flex-center gap-2 font-semibold">
                    <SlidersHorizontal size={16} /> Bộ lọc nâng cao
                  </span>
                  <button className="filter-close-btn" onClick={() => setShowFilter(false)}>
                    <X size={16} />
                  </button>
                </div>

                {/* Price Presets */}
                <div className="filter-section">
                  <label className="filter-label">
                    <DollarSign size={14} /> Khoảng giá nhanh
                  </label>
                  <div className="price-presets-grid">
                    {PRICE_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        className={`price-preset-chip ${isPresetActive(p) ? 'active' : ''}`}
                        onClick={() => handlePricePresetSelect(p)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Min / Max Price Inputs */}
                <div className="filter-grid-custom-price">
                  <div className="filter-field">
                    <label className="form-label">Giá tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      min="0"
                      step="10000"
                      value={filters.minPrice}
                      onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                    />
                  </div>
                  <div className="filter-field">
                    <label className="form-label">Giá tối đa (VNĐ)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="1.000.000"
                      min="0"
                      step="10000"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="filter-actions">
                  <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={clearFilters}>
                    Xóa tất cả bộ lọc
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      updateFiltersAndUrl(filters);
                      setShowFilter(false);
                    }}
                  >
                    Áp dụng bộ lọc
                  </Button>
                </div>
              </div>
            )}

            {/* Active filter tags */}
            {hasActiveFilters && (
              <div className="filter-tags animate-fadeIn">
                <span className="filter-tags-label">Đang lọc theo:</span>
                {filters.search && (
                  <span className="filter-tag">
                    <Search size={12} /> Từ khóa: "{filters.search}"
                    <button onClick={() => clearFilterField('search')} title="Xóa tìm kiếm">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.categoryId && (
                  <span className="filter-tag">
                    <Tag size={12} /> {categories.find((c) => String(c.id) === String(filters.categoryId))?.name}
                    <button onClick={() => clearFilterField('categoryId')} title="Xóa danh mục">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.minPrice && !filters.maxPrice && (
                  <span className="filter-tag">
                    <DollarSign size={12} /> Từ {Number(filters.minPrice).toLocaleString('vi-VN')}₫
                    <button onClick={() => clearFilterField('minPrice')} title="Xóa giá tối thiểu">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.maxPrice && !filters.minPrice && (
                  <span className="filter-tag">
                    <DollarSign size={12} /> Đến {Number(filters.maxPrice).toLocaleString('vi-VN')}₫
                    <button onClick={() => clearFilterField('maxPrice')} title="Xóa giá tối đa">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.minPrice && filters.maxPrice && (
                  <span className="filter-tag">
                    <DollarSign size={12} /> {Number(filters.minPrice).toLocaleString('vi-VN')}₫ - {Number(filters.maxPrice).toLocaleString('vi-VN')}₫
                    <button
                      onClick={() => {
                        const updated = { ...filters, minPrice: '', maxPrice: '' };
                        updateFiltersAndUrl(updated);
                      }}
                      title="Xóa khoảng giá"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button className="filter-clear-all-btn" onClick={clearFilters}>
                  Xóa lọc
                </button>
              </div>
            )}

            {/* Books Grid */}
            {loading ? (
              <div className="books-loading">
                <Spinner size="lg" />
                <p>Đang tìm kiếm sách...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="books-empty">
                <span className="books-empty-icon">📚</span>
                <h3>Không tìm thấy cuốn sách nào phù hợp</h3>
                <p>Hãy thử thay đổi từ khóa hoặc điều chỉnh khoảng giá/thể loại bạn đang tìm.</p>
                <Button variant="primary" onClick={clearFilters}>
                  Xem tất cả sách
                </Button>
              </div>
            ) : (
              <div className="book-grid animate-fadeInUp">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Trước
                </Button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i;
                  } else if (page <= 3) {
                    pageNum = i;
                  } else if (page >= totalPages - 4) {
                    pageNum = totalPages - 7 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`page-btn ${pageNum === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
