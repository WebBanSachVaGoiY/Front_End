import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authApi } from '../../api/authApi';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const setP = (field) => (e) => setProfileForm((f) => ({ ...f, [field]: e.target.value }));
  const setPw = (field) => (e) => setPasswordForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await authApi.updateProfile(profileForm);
      updateUser(updated);
      toast.success('Cập nhật thông tin thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }
    if (passwordForm.newPassword.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(passwordForm.newPassword)) {
      toast.error('Mật khẩu mới phải từ 8 ký tự, bao gồm cả chữ và số');
      return;
    }
    setSavingPass(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Đổi mật khẩu thành công');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="profile-page">
          <div className="container">
            {/* Profile header */}
            <div className="profile-header animate-fadeInDown">
              <div className="profile-avatar">
                {user?.fullName?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div>
                <h1 className="profile-name">{user?.fullName || user?.username}</h1>
                <p className="profile-email">{user?.email}</p>
                <span className="profile-role">
                  {user?.role === 'ROLE_ADMIN' ? '🔑 Quản trị viên' : '👤 Khách hàng'}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
              <button
                className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={16} /> Thông tin cá nhân
              </button>
              <button
                className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                <Lock size={16} /> Đổi mật khẩu
              </button>
            </div>

            <div className="profile-content animate-fadeInUp">
              {activeTab === 'profile' ? (
                <form className="card profile-form" onSubmit={handleSaveProfile}>
                  <h3>Thông tin cá nhân</h3>
                  <div className="form-row-2">
                    <Input
                      id="fullName"
                      label="Họ và tên"
                      value={profileForm.fullName}
                      onChange={setP('fullName')}
                      icon={<User size={16} />}
                    />
                    <Input
                      id="profile-email"
                      type="email"
                      label="Email"
                      value={profileForm.email}
                      onChange={setP('email')}
                      icon={<Mail size={16} />}
                      disabled
                      hint="Email không thể thay đổi"
                    />
                  </div>
                  <div className="form-row-2">
                    <Input
                      id="phone"
                      label="Số điện thoại"
                      value={profileForm.phone}
                      onChange={setP('phone')}
                      icon={<Phone size={16} />}
                      placeholder="0912345678"
                    />
                  </div>
                  <Input
                    id="address"
                    label="Địa chỉ"
                    value={profileForm.address}
                    onChange={setP('address')}
                    icon={<MapPin size={16} />}
                    placeholder="Địa chỉ của bạn"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<Save size={16} />}
                    loading={saving}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Lưu thay đổi
                  </Button>
                </form>
              ) : (
                <form className="card profile-form" onSubmit={handleChangePassword}>
                  <h3>Đổi mật khẩu</h3>
                  <Input
                    id="currentPassword"
                    type="password"
                    label="Mật khẩu hiện tại"
                    value={passwordForm.currentPassword}
                    onChange={setPw('currentPassword')}
                    icon={<Lock size={16} />}
                    required
                  />
                  <Input
                    id="newPassword"
                    type="password"
                    label="Mật khẩu mới"
                    value={passwordForm.newPassword}
                    onChange={setPw('newPassword')}
                    icon={<Lock size={16} />}
                    hint="Ít nhất 8 ký tự, gồm cả chữ và số"
                    required
                  />
                  <Input
                    id="confirmPassword"
                    type="password"
                    label="Xác nhận mật khẩu mới"
                    value={passwordForm.confirmPassword}
                    onChange={setPw('confirmPassword')}
                    icon={<Lock size={16} />}
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    loading={savingPass}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Đổi mật khẩu
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
