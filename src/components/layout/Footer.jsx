import { Link } from 'react-router-dom';
import { BookOpen, Globe, Mail, Phone, Share2 } from 'lucide-react';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="logo-icon">
                <BookOpen size={20} />
              </div>
              <span>Book<span className="logo-accent">Runner</span></span>
            </Link>
            <p className="footer-tagline">
              Khám phá tri thức qua từng trang sách. Hàng nghìn đầu sách chất lượng, giao hàng tận nơi.
            </p>
            <div className="footer-socials">
              <a href="#" className="social-btn" aria-label="Website"><Globe size={16} /></a>
              <a href="#" className="social-btn" aria-label="Community"><Share2 size={16} /></a>
              <a href="#" className="social-btn" aria-label="Email"><Mail size={16} /></a>
            </div>
          </div>

          {/* Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Khám phá</h4>
            <ul className="footer-links">
              <li><Link to="/books">Tất cả sách</Link></li>
              <li><Link to="/books?featured=true">Sách nổi bật</Link></li>
              <li><Link to="/books?sort=best_seller">Bán chạy nhất</Link></li>
              <li><Link to="/books?sort=newest">Sách mới nhất</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Tài khoản</h4>
            <ul className="footer-links">
              <li><Link to="/login">Đăng nhập</Link></li>
              <li><Link to="/register">Đăng ký</Link></li>
              <li><Link to="/profile">Hồ sơ</Link></li>
              <li><Link to="/orders">Đơn hàng</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Liên hệ</h4>
            <ul className="footer-contact">
              <li>
                <Mail size={14} />
                <span>support@bookrunner.vn</span>
              </li>
              <li>
                <Phone size={14} />
                <span>0123 456 789</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} BookRunner. All rights reserved.</p>
          <p>Made with ♥ in Vietnam</p>
        </div>
      </div>
    </footer>
  );
}
