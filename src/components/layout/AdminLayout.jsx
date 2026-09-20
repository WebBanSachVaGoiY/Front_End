import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Package, Users, ChevronRight, LogOut, BookMarked,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/admin/books', icon: <BookOpen size={18} />, label: 'Quản lý sách' },
  { to: '/admin/orders', icon: <Package size={18} />, label: 'Quản lý đơn hàng' },
  { to: '/admin/users', icon: <Users size={18} />, label: 'Quản lý người dùng' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <BookMarked size={22} />
          <span>BookRunner <span className="admin-label">Admin</span></span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
              <ChevronRight size={14} className="sidebar-chevron" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar-sm">
              {user?.fullName?.[0] || user?.username?.[0] || 'A'}
            </div>
            <div>
              <div className="sidebar-username">
                {user?.fullName || user?.username}
              </div>
              <div className="sidebar-role">Quản trị viên</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Đăng xuất">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
