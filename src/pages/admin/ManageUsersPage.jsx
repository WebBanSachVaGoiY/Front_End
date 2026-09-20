import { useEffect, useState } from 'react';
import { Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { formatDateTime } from '../../utils/formatDate';
import './AdminDashboard.css';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
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
                      {toggling === user.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <button
                          onClick={() => handleToggle(user.id, user.enabled)}
                          style={{
                            background: 'none', border: 'none',
                            color: user.enabled ? 'var(--error)' : 'var(--success)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            gap: 6, fontSize: '0.8125rem', fontWeight: 600,
                            fontFamily: 'inherit', transition: 'opacity 0.2s',
                          }}
                          title={user.enabled ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          {user.enabled
                            ? <><ToggleRight size={18} /> Vô hiệu hóa</>
                            : <><ToggleLeft size={18} /> Kích hoạt</>
                          }
                        </button>
                      )}
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
    </div>
  );
}
