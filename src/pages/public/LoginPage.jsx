import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './AuthPages.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const validate = () => {
    const errs = {};
    if (!form.email?.trim()) errs.email = 'Vui lòng nhập email hoặc tên đăng nhập';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await login(form.email, form.password);
      toast.success('Đăng nhập thành công! Chào mừng trở lại 👋');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Email hoặc mật khẩu không đúng';
      toast.error(msg);
      setErrors({ api: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background decoration */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-card animate-scaleIn">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <BookOpen size={28} />
          </div>
          <span className="auth-logo-text">
            Book<span className="logo-accent">Runner</span>
          </span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Chào mừng trở lại!</h1>
          <p className="auth-subtitle">Đăng nhập để tiếp tục khám phá sách</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="email"
            type="text"
            label="Email hoặc Tên đăng nhập"
            placeholder="admin4 hoặc your@email.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            icon={<Mail size={16} />}
            error={errors.email}
            required
            autoComplete="username"
          />

          <Input
            id="password"
            type={showPass ? 'text' : 'password'}
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            icon={<Lock size={16} />}
            iconRight={
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPass((v) => !v)}
                aria-label="Hiện/ẩn mật khẩu"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password}
            required
            autoComplete="current-password"
          />

          {errors.api && (
            <div className="auth-error">{errors.api}</div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            id="login-btn"
          >
            Đăng nhập
          </Button>
        </form>

        <div style={{ marginTop: '1.25rem', padding: '0.875rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Tài khoản thử nghiệm nhanh (Click để điền):
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => setForm({ email: 'taivankhoanso2@gmail.com', password: 'Password123' })}
            >
              👤 Khách hàng
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => setForm({ email: 'admin4@bookrunner.vn', password: 'Password123' })}
            >
              🔑 Quản trị viên
            </button>
          </div>
        </div>

        <p className="auth-switch">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-link">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
