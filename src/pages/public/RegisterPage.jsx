import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './AuthPages.css';

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Vui lòng nhập họ tên';
    if (!form.email) errs.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.password) {
      errs.password = 'Vui lòng nhập mật khẩu';
    } else if (form.password.length < 8) {
      errs.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) {
      errs.password = 'Mật khẩu phải chứa ít nhất một chữ cái và một chữ số';
    }
    if (!form.confirmPassword) errs.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Mật khẩu không khớp';
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
      await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email,
        password: form.password,
      });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) {
        setErrors({ email: 'Email này đã được sử dụng' });
      } else {
        setErrors({ api: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-card animate-scaleIn">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <BookOpen size={28} />
          </div>
          <span className="auth-logo-text">
            Book<span className="logo-accent">Runner</span>
          </span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Tạo tài khoản</h1>
          <p className="auth-subtitle">Tham gia cộng đồng yêu sách của chúng tôi</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="fullName"
            type="text"
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChange={set('fullName')}
            icon={<User size={16} />}
            error={errors.fullName}
            required
            autoComplete="name"
          />

          <Input
            id="reg-email"
            type="email"
            label="Email"
            placeholder="your@email.com"
            value={form.email}
            onChange={set('email')}
            icon={<Mail size={16} />}
            error={errors.email}
            required
            autoComplete="email"
          />

          <Input
            id="reg-password"
            type={showPass ? 'text' : 'password'}
            label="Mật khẩu"
            placeholder="Ít nhất 8 ký tự, gồm chữ và số"
            value={form.password}
            onChange={set('password')}
            icon={<Lock size={16} />}
            iconRight={
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={errors.password}
            required
          />

          <Input
            id="confirmPassword"
            type={showPass ? 'text' : 'password'}
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            icon={<Lock size={16} />}
            error={errors.confirmPassword}
            required
          />

          {errors.api && (
            <div className="auth-error">{errors.api}</div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            id="register-btn"
          >
            Tạo tài khoản
          </Button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
