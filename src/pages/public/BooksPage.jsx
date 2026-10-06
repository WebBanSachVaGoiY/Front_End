import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { bookApi } from '../../api/bookApi';
import { BookCard } from '../../components/book/BookCard';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { SORT_OPTIONS } from '../../utils/constants';
import './BooksPage.css';

export default function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [showFilter, setShowFilter] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    sort: searchParams.get('sort') || 'newest',
    minPrice: '',
    maxPrice: '',
  });

  const PAGE_SIZE = 12;

  const fetchBooks = useCallback(async (currentPage = 0, currentFilters = filters) => {
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
      minPrice: '',
      maxPrice: '',
    };
    setFilters(initialFilters);
    setPage(0);
    fetchBooks(0, initialFilters);
  }, [searchParams]);

  const applyFilters = () => {
    const newParams = {};
    if (filters.search) newParams.search = filters.search;
    if (filters.categoryId) newParams.categoryId = filters.categoryId;
    if (filters.sort && filters.sort !== 'newest') newParams.sort = filters.sort;
    setSearchParams(newParams);
    setShowFilter(false);
  };

  const clearFilters = () => {
    setFilters({ search: '', categoryId: '', sort: 'newest', minPrice: '', maxPrice: '' });
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchBooks(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = filters.search || filters.categoryId || filters.sort !== 'newest';

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
                  {total > 0 ? `${total} quyển sách` : 'Đang tìm kiếm...'}
                </p>
              </div>

              <div className="books-controls">
                {/* Sort */}
                <div className="sort-select-wrapper">
                  <ChevronDown size={14} className="sort-chevron" />
                  <select
                    className="sort-select"
                    value={filters.sort}
                    onChange={(e) => {
                      const newF = { ...filters, sort: e.target.value };
                      setFilters(newF);
                      const params = {};
                      if (newF.search) params.search = newF.search;
                      if (newF.categoryId) params.categoryId = newF.categoryId;
                      if (newF.sort !== 'newest') params.sort = newF.sort;
                      setSearchParams(params);
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<SlidersHorizontal size={16} />}
                  onClick={() => setShowFilter((v) => !v)}
                >
                  Bộ lọc
                  {hasActiveFilters && <span className="filter-dot" />}
                </Button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilter && (
              <div className="filter-panel animate-fadeInDown card">
                <div className="filter-grid">
                  {/* Search */}
                  <div className="filter-field">
                    <label className="form-label">Tìm kiếm</label>
                    <div className="search-wrapper">
                      <Search size={16} className="search-field-icon" />
                      <input
                        type="text"
                        className="form-input has-icon-left"
                        placeholder="Tên sách, tác giả..."
                        value={filters.search}
                        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="filter-field">
                    <label className="form-label">Danh mục</label>
                    <select
                      className="form-input"
                      value={filters.categoryId}
                      onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
                    >
                      <option value="">Tất cả danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="filter-field">
                    <label className="form-label">Giá từ (₫)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                    />
                  </div>

                  <div className="filter-field">
                    <label className="form-label">Đến (₫)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="1.000.000"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="filter-actions">
                  <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={clearFilters}>
                    Xóa bộ lọc
                  </Button>
                  <Button variant="primary" size="sm" onClick={applyFilters}>
                    Áp dụng
                  </Button>
                </div>
              </div>
            )}

            {/* Active filter tags */}
            {(filters.search || filters.categoryId) && (
              <div className="filter-tags">
                {filters.search && (
                  <span className="filter-tag">
                    Tìm: "{filters.search}"
                    <button onClick={() => setFilters((f) => ({ ...f, search: '' }))}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.categoryId && (
                  <span className="filter-tag">
                    {categories.find((c) => String(c.id) === filters.categoryId)?.name}
                    <button onClick={() => setFilters((f) => ({ ...f, categoryId: '' }))}>
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Books Grid */}
            {loading ? (
              <div className="books-loading">
                <Spinner size="lg" />
                <p>Đang tải sách...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="books-empty">
                <span className="books-empty-icon">📚</span>
                <h3>Không tìm thấy sách</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <Button variant="primary" onClick={clearFilters}>Xóa bộ lọc</Button>
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
