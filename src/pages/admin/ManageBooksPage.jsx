import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Star } from 'lucide-react';
import { bookApi } from '../../api/bookApi';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { DEFAULT_BOOK_COVER } from '../../utils/constants';
import './AdminDashboard.css';

const EMPTY_BOOK = {
  title: '', author: '', publisher: '', isbn: '',
  price: '', discountPrice: '', stockQuantity: '',
  description: '', coverImageUrl: '', language: 'Tiếng Việt',
  publicationYear: '', pageCount: '', categoryId: '',
};

export default function ManageBooksPage() {
  const PAGE_SIZE = 15;
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form, setForm] = useState(EMPTY_BOOK);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();

  const fetchBooks = async (pageIndex = page, searchKeyword = search) => {
    setLoading(true);
    try {
      const params = {
        page: pageIndex,
        size: PAGE_SIZE,
      };
      if (searchKeyword && searchKeyword.trim()) {
        params.keyword = searchKeyword.trim();
      }
      const data = await bookApi.getAdminBooks(params);
      const items = data.content || (Array.isArray(data) ? data : []);
      setBooks(items);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements ?? items.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(0, '');
    bookApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (!val.trim()) {
      setPage(0);
      fetchBooks(0, '');
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setPage(0);
      fetchBooks(0, search);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setPage(newPage);
    fetchBooks(newPage, search);
  };

  const openCreate = () => {
    bookApi.getCategories().then(setCategories).catch(() => {});
    setEditingBook(null);
    setForm(EMPTY_BOOK);
    setModalOpen(true);
  };

  const openEdit = (book) => {
    bookApi.getCategories().then(setCategories).catch(() => {});
    setEditingBook(book);
    setForm({
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      isbn: book.isbn || '',
      price: book.price || '',
      discountPrice: book.discountPrice || '',
      stockQuantity: book.stockQuantity || 0,
      description: book.description || '',
      coverImageUrl: book.coverImageUrl || '',
      language: book.language || 'Tiếng Việt',
      publicationYear: book.publicationYear || '',
      pageCount: book.pageCount || '',
      categoryId: book.category?.id || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.price) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        publicationYear: form.publicationYear ? parseInt(form.publicationYear) : null,
        pageCount: form.pageCount ? parseInt(form.pageCount) : null,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      };

      if (editingBook) {
        await bookApi.updateBook(editingBook.id, payload);
        toast.success('Cập nhật sách thành công');
      } else {
        await bookApi.createBook(payload);
        toast.success('Thêm sách thành công');
      }
      setModalOpen(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu sách');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bookId, bookTitle) => {
    if (!confirm(`Xóa sách "${bookTitle}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(bookId);
    try {
      await bookApi.deleteBook(bookId);
      toast.success('Đã xóa sách');
      fetchBooks();
    } catch {
      toast.error('Không thể xóa sách');
    } finally {
      setDeleting(null);
    }
  };

  const [togglingFeaturedId, setTogglingFeaturedId] = useState(null);

  const handleToggleFeatured = async (bookId, currentFeatured) => {
    setTogglingFeaturedId(bookId);
    try {
      await bookApi.toggleFeatured(bookId);
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, isFeatured: !currentFeatured } : b))
      );
      toast.success(currentFeatured ? 'Đã bỏ đánh dấu nổi bật' : 'Đã đánh dấu sách nổi bật ⭐');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đổi trạng thái nổi bật');
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const filteredBooks = books;

  const setF = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Quản lý sách</h1>
        <p>Thêm, sửa, xóa sách trong hệ thống</p>
      </div>

      <div className="admin-controls">
        <div className="admin-search-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            className="form-input admin-search-input"
            placeholder="Tìm kiếm theo tên, tác giả... (nhấn Enter để tìm)"
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate} id="add-book-btn">
          Thêm sách mới
        </Button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sách</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Đánh giá</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={book.coverImageUrl || DEFAULT_BOOK_COVER}
                          alt={book.title}
                          style={{ width: 40, height: 54, objectFit: 'cover', borderRadius: 6 }}
                          onError={(e) => { e.target.src = DEFAULT_BOOK_COVER; }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200 }}
                               className="text-sm">{book.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{book.author}</div>
                        </div>
                      </div>
                    </td>
                    <td>{book.category?.name || '—'}</td>
                    <td>
                      <div style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        {formatCurrency(book.discountPrice || book.price)}
                      </div>
                      {book.discountPrice && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatCurrency(book.price)}
                        </div>
                      )}
                    </td>
                    <td>{book.stockQuantity}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={12} fill="var(--accent)" color="var(--accent)" />
                        <span>{book.averageRating?.toFixed(1) || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        color: book.active ? 'var(--success)' : 'var(--error)',
                        fontWeight: 600, fontSize: '0.8125rem',
                      }}>
                        {book.active ? '✓ Đang bán' : '✗ Ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-actions btn-icon-sm"
                          onClick={() => handleToggleFeatured(book.id, book.isFeatured)}
                          disabled={togglingFeaturedId === book.id}
                          title={book.isFeatured ? 'Bỏ nổi bật' : 'Đặt làm sách nổi bật'}
                          style={{ color: book.isFeatured ? 'var(--accent)' : 'var(--text-muted)' }}
                        >
                          <Star size={14} fill={book.isFeatured ? 'var(--accent)' : 'none'} />
                        </button>
                        <button className="table-actions btn-icon-sm" onClick={() => openEdit(book)} title="Sửa">
                          <Pencil size={14} />
                        </button>
                        <button
                          className="table-actions btn-icon-sm danger"
                          onClick={() => handleDelete(book.id, book.title)}
                          disabled={deleting === book.id}
                          title="Xóa"
                        >
                          {deleting === book.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBooks.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Không tìm thấy sách nào
              </p>
            )}

            {totalPages > 1 && (
              <div className="admin-pagination-wrapper">
                <div className="admin-pagination-info">
                  Hiển thị <strong>{filteredBooks.length}</strong> / <strong>{totalElements}</strong> cuốn sách (Trang {page + 1}/{totalPages})
                </div>
                <div className="admin-pagination">
                  <button
                    type="button"
                    className="admin-page-btn"
                    disabled={page === 0}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Trước
                  </button>

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
                        type="button"
                        className={`admin-page-btn ${pageNum === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className="admin-page-btn"
                    disabled={page >= totalPages - 1}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBook ? 'Sửa thông tin sách' : 'Thêm sách mới'}
        size="lg"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input id="book-title" label="Tên sách *" value={form.title} onChange={setF('title')} required />
            <Input id="book-author" label="Tác giả *" value={form.author} onChange={setF('author')} required />
            <Input id="book-publisher" label="Nhà xuất bản" value={form.publisher} onChange={setF('publisher')} />
            <Input id="book-isbn" label="ISBN" value={form.isbn} onChange={setF('isbn')} />
            <Input id="book-price" label="Giá bán (₫) *" type="number" value={form.price} onChange={setF('price')} required />
            <Input id="book-discount" label="Giá khuyến mãi (₫)" type="number" value={form.discountPrice} onChange={setF('discountPrice')} />
            <Input id="book-stock" label="Số lượng kho" type="number" value={form.stockQuantity} onChange={setF('stockQuantity')} />
            <div className="form-group">
              <label className="form-label">Danh mục *</label>
              <select className="form-input" value={form.categoryId} onChange={setF('categoryId')} required>
                <option value="">— Chọn danh mục —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <small style={{ color: 'var(--accent)', marginTop: 4, display: 'block', fontSize: '0.75rem' }}>
                  ⚠️ Chưa có danh mục nào. Hãy vào mục "Quản lý danh mục" để tạo trước!
                </small>
              )}
            </div>
            <Input id="book-year" label="Năm XB" type="number" value={form.publicationYear} onChange={setF('publicationYear')} />
            <Input id="book-pages" label="Số trang" type="number" value={form.pageCount} onChange={setF('pageCount')} />
          </div>
          <Input id="book-cover" label="URL ảnh bìa" value={form.coverImageUrl} onChange={setF('coverImageUrl')} placeholder="https://..." />
          <Textarea id="book-desc" label="Mô tả" value={form.description} onChange={setF('description')} rows={4} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '0.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingBook ? 'Lưu thay đổi' : 'Thêm sách'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
