import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, FolderTree } from 'lucide-react';
import { bookApi } from '../../api/bookApi';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import './AdminDashboard.css';

// Helper tạo slug chuẩn tiếng Việt
function generateSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const EMPTY_CATEGORY = {
  name: '',
  slug: '',
  description: '',
};

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_CATEGORY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await bookApi.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setForm(EMPTY_CATEGORY);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
    });
    setModalOpen(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      // Tự động sinh slug nếu đang tạo mới hoặc slug chưa bị sửa tay
      slug: !editingCategory ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: (form.slug.trim() || generateSlug(form.name)).trim(),
      description: form.description?.trim() || '',
    };

    setSaving(true);
    try {
      if (editingCategory) {
        await bookApi.updateCategory(editingCategory.id, payload);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await bookApi.createCategory(payload);
        toast.success('Thêm danh mục mới thành công');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || (editingCategory ? 'Lỗi khi cập nhật danh mục' : 'Lỗi khi thêm danh mục'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) return;
    setDeleting(id);
    try {
      await bookApi.deleteCategory(id);
      toast.success('Xóa danh mục thành công');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Xóa danh mục thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const filteredCategories = categories.filter((c) => {
    const kw = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(kw) ||
      c.slug?.toLowerCase().includes(kw) ||
      c.description?.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Quản lý danh mục sách</h1>
            <p>Tạo và quản lý các thể loại để phân loại sách trên hệ thống</p>
          </div>
          <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Thêm danh mục mới
          </Button>
        </div>
      </div>

      <div className="admin-controls">
        <div className="admin-search-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            className="form-input admin-search-input"
            placeholder="Tìm kiếm danh mục theo tên, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Tên danh mục</th>
                  <th>Slug (URL)</th>
                  <th>Mô tả</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id || cat.slug}>
                    <td><strong>#{cat.id || '-'}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <FolderTree size={16} color="var(--primary)" />
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td>
                      <code style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem', color: 'var(--accent)' }}>
                        {cat.slug}
                      </code>
                    </td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: 300 }}>
                      {cat.description || '—'}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'center' }}>
                        <button
                          className="table-actions btn-icon-sm"
                          onClick={() => openEdit(cat)}
                          title="Sửa danh mục"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="table-actions btn-icon-sm danger"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          disabled={deleting === cat.id}
                          title="Xóa danh mục"
                        >
                          {deleting === cat.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCategories.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <FolderTree size={36} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>Chưa có danh mục nào</p>
                <p style={{ fontSize: '0.875rem' }}>Hãy bấm nút "Thêm danh mục mới" ở trên để tạo thể loại sách đầu tiên!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Thêm / Sửa Danh mục */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Sửa thông tin danh mục' : 'Thêm danh mục mới'}
        size="md"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            id="cat-name"
            label="Tên danh mục *"
            placeholder="Ví dụ: Công nghệ thông tin, Tiểu thuyết..."
            value={form.name}
            onChange={handleNameChange}
            required
          />

          <Input
            id="cat-slug"
            label="Slug (Đường dẫn tĩnh) *"
            placeholder="cong-nghe-thong-tin"
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
            required
          />

          <Textarea
            id="cat-desc"
            label="Mô tả danh mục"
            placeholder="Mô tả ngắn gọn về danh mục này..."
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '0.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
