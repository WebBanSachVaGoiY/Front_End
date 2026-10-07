import { useEffect, useState } from 'react';
import { Search, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../utils/formatDate';
import './AdminDashboard.css';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', role: 'ROLE_CUSTOMER', enabled: true });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({ size: 100 });
      setUsers(data.content || data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'ROLE_CUSTOMER',
      enabled: user.enabled !== false,
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateUser(editingUser.id, form);
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...form, ...(updated || {}) } : u))
      );
      toast.success('Cập nhật người dùng thành công');
      setEditingUser(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật người dùng');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (userId, currentEnabled) => {
    setToggling(userId);
    try {
      await adminApi.toggleUserEnabled(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, enabled: !currentEnabled } : u))
      );
      toast.success(currentEnabled ? 'Đã vô hiệu hóa tài khoản' : 'Đã kích hoạt tài khoản');
    } catch {
      toast.error('Không thể thay đổi trạng thái tài khoản');
    } finally {
      setToggling(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Quản lý người dùng</h1>
        <p>Xem và quản lý tài khoản người dùng</p>
      </div>

      <div className="admin-controls">
        <div className="admin-search-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            className="form-input admin-search-input"
            placeholder="Tìm tên, email, username..."
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
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th>Ngày tham gia</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36,
                          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.875rem', fontWeight: 700, color: 'white',
                          textTransform: 'uppercase', flexShrink: 0,
                        }}>
                          {user.fullName?.[0] || user.username?.[0] || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {user.fullName || user.username}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{user.phone || '—'}</td>
                    <td>
                      <span style={{
                        color: user.role === 'ROLE_ADMIN' ? 'var(--accent)' : 'var(--primary-light)',
                        fontWeight: 600, fontSize: '0.8125rem',
                      }}>
                        {user.role === 'ROLE_ADMIN' ? '🔑 Admin' : '👤 Khách hàng'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td>
                      <span style={{
                        color: user.enabled ? 'var(--success)' : 'var(--error)',
                        fontWeight: 600, fontSize: '0.8125rem',
                      }}>
                        {user.enabled ? '✓ Hoạt động' : '✗ Bị khóa'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="table-actions btn-icon-sm"
                          onClick={() => openEdit(user)}
                          title="Sửa thông tin"
                        >
                          <Pencil size={14} />
                        </button>
                        {toggling === user.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <button
                            onClick={() => handleToggle(user.id, user.enabled)}
                            style={{
                              background: 'none', border: 'none',
                              color: user.enabled ? 'var(--error)' : 'var(--success)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              gap: 4, fontSize: '0.8125rem', fontWeight: 600,
                              fontFamily: 'inherit', transition: 'opacity 0.2s',
                            }}
                            title={user.enabled ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {user.enabled
                              ? <><ToggleRight size={18} /> Khóa</>
                              : <><ToggleLeft size={18} /> Mở</>
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Không tìm thấy người dùng
              </p>
            )}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Sửa thông tin: ${editingUser.fullName || editingUser.username}`}
          size="md"
        >
          <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input
                className="form-input"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Nhập họ và tên..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0912..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Địa chỉ</label>
              <input
                className="form-input"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Số nhà, đường, quận/huyện..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phân quyền vai trò</label>
              <select
                className="form-input"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="ROLE_CUSTOMER">👤 Khách hàng (ROLE_CUSTOMER)</option>
                <option value="ROLE_ADMIN">🔑 Quản trị viên (ROLE_ADMIN)</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="userEnabledCheckbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <label htmlFor="userEnabledCheckbox" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                Tài khoản đang hoạt động
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
