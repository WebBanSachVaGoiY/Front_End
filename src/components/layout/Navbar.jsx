import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, ShoppingCart, User, LogOut,
  ChevronDown, Menu, X, Settings, Package, LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

export function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/books?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <BookOpen size={22} />
          </div>
          <span className="logo-text">
            Book<span className="logo-accent">Runner</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-links hidden-mobile">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Trang chủ
          </NavLink>
          <NavLink to="/books" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Sách
          </NavLink>
        </div>

        {/* Search */}
        <form className="navbar-search hidden-mobile" onSubmit={handleSearch}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm sách, tác giả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </form>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Cart */}
          <Link to="/cart" className="nav-icon-btn" aria-label="Giỏ hàng">
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems > 99 ? '99+' : totalItems}</span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-label="Tài khoản"
              >
                <div className="user-avatar">
                  {user?.fullName?.[0] || user?.username?.[0] || 'U'}
                </div>
                <span className="user-name hidden-mobile">
                  {user?.fullName || user?.username}
                </span>
                <ChevronDown
                  size={14}
                  className={`chevron ${userMenuOpen ? 'open' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown animate-fadeInDown">
                  <div className="dropdown-header">
                    <span className="dropdown-name">
                      {user?.fullName || user?.username}
                    </span>
                    <span className="dropdown-email">{user?.email}</span>
                  </div>
                  <div className="dropdown-divider" />
                  {isAdmin() && (
                    <Link
                      to="/admin"
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      Quản trị viên
                    </Link>
                  )}
                  <Link
                    to="/orders"
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Package size={16} />
                    Đơn hàng của tôi
                  </Link>
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings size={16} />
                    Hồ sơ
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons hidden-mobile">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu animate-fadeInDown">
          <form className="mobile-search" onSubmit={handleSearch}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm sách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              autoFocus
            />
          </form>
          <NavLink to="/" end className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            Trang chủ
          </NavLink>
          <NavLink to="/books" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            Sách
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/orders" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                Đơn hàng của tôi
              </NavLink>
              <NavLink to="/profile" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                Hồ sơ
              </NavLink>
              {isAdmin() && (
                <NavLink to="/admin" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  Quản trị viên
                </NavLink>
              )}
              <button className="mobile-nav-link danger" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                Đăng nhập
              </Link>
              <Link to="/register" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                Đăng ký
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
