import api from './axios';
import { DEFAULT_MOCK_USERS } from '../utils/mockData';

const USERS_KEY = 'bookrunner_users';
const CURRENT_USER_KEY = 'bookrunner_current_user';

const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_MOCK_USERS));
      return DEFAULT_MOCK_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MOCK_USERS;
  }
};

const isOfflineOrUnimplemented = (err) => {
  if (!err?.response) return true; // Mất mạng / Backend chưa bật
  if (err.response.status === 502) return true; // Vite proxy Bad Gateway
  if (err.response.status === 404) return true; // Endpoint Backend chưa viết
  return false;
};

export const authApi = {
  login: async (credentials) => {
    const usernameOrEmail = (credentials.usernameOrEmail || credentials.email || credentials.username || '').trim();
    const payload = {
      usernameOrEmail,
      password: credentials.password,
    };

    try {
      const response = await api.post('/auth/login', payload);
      const resData = response.data?.data || response.data;
      const userObj = {
        id: resData.userId || resData.id,
        username: resData.username,
        email: resData.email,
        fullName: resData.fullName,
        role: resData.role,
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userObj));
      return {
        accessToken: resData.accessToken,
        refreshToken: resData.refreshToken,
        user: userObj,
      };
    } catch (apiError) {
      if (apiError.response && (apiError.response.status === 400 || apiError.response.status === 401 || apiError.response.status === 403)) {
        throw new Error(apiError.response.data?.message || 'Tài khoản hoặc mật khẩu không chính xác');
      }

      // If backend not available (502 / Network error), fallback to mock
      const users = getStoredUsers();
      const matched = users.find(
        (u) =>
          (u.email?.toLowerCase() === usernameOrEmail.toLowerCase() ||
           u.username?.toLowerCase() === usernameOrEmail.toLowerCase()) &&
          u.password === payload.password
      );

      if (matched) {
        if (matched.enabled === false) {
          throw new Error('Tài khoản của bạn đã bị tạm khóa bởi quản trị viên');
        }
        const userObj = {
          id: matched.id,
          username: matched.username,
          email: matched.email,
          fullName: matched.fullName,
          phone: matched.phone || '',
          address: matched.address || '',
          role: matched.role,
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userObj));
        return {
          accessToken: `mock-jwt-token-${matched.id}-${Date.now()}`,
          refreshToken: `mock-refresh-token-${matched.id}`,
          user: userObj,
        };
      }

      // If user provided custom credentials that don't match, return helpful error
      throw new Error(apiError.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
    }
  },

  register: async (userData) => {
    let generatedUsername = (userData.username || userData.email?.split('@')[0] || userData.email || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    if (generatedUsername.length < 3) {
      generatedUsername = `${generatedUsername}user`.slice(0, 50);
    }
    const payload = {
      username: generatedUsername,
      ...userData,
    };

    try {
      const response = await api.post('/auth/register', payload);
      const resData = response.data?.data || response.data;
      return resData;
    } catch (apiError) {
      if (apiError.response?.data?.message) {
        throw new Error(apiError.response.data.message);
      }
      const users = getStoredUsers();
      const existing = users.find(
        (u) =>
          u.email?.toLowerCase() === payload.email?.toLowerCase() ||
          u.username?.toLowerCase() === payload.username?.toLowerCase()
      );

      if (existing) {
        throw new Error('Email hoặc tên đăng nhập này đã được sử dụng');
      }

      const newUser = {
        id: Date.now(),
        username: payload.username || payload.email.split('@')[0],
        email: payload.email,
        password: payload.password,
        fullName: payload.fullName || 'Khách hàng',
        phone: payload.phone || '',
        address: payload.address || '',
        role: 'ROLE_CUSTOMER',
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      return {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  refresh: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const resData = response.data?.data || response.data;
      return {
        accessToken: resData.accessToken,
        refreshToken: resData.refreshToken,
      };
    } catch {
      return {
        accessToken: `mock-refreshed-token-${Date.now()}`,
        refreshToken,
      };
    }
  },

  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      const resData = response.data?.data || response.data;
      if (resData) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(resData));
        return resData;
      }
      return resData;
    } catch {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_MOCK_USERS[1];
    }
  },

  // [USER-MODULE-BE] Đã tích hợp Backend UserController (/users/profile). Fallback chỉ kích hoạt khi server offline.
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      const currentUser = stored ? JSON.parse(stored) : DEFAULT_MOCK_USERS[1];
      const updated = { ...currentUser, ...profileData };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));

      const users = getStoredUsers();
      const idx = users.findIndex((u) => u.id === updated.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...profileData };
        saveUsers(users);
      }
      return updated;
    }
  },

  // [USER-MODULE-BE] Đã tích hợp Backend UserController (/users/change-password). Fallback chỉ kích hoạt khi server offline.
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/change-password', passwordData);
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      const currentUser = stored ? JSON.parse(stored) : null;
      if (!currentUser) throw new Error('Chưa đăng nhập');

      const users = getStoredUsers();
      const user = users.find((u) => u.id === currentUser.id);
      if (!user) throw new Error('Không tìm thấy tài khoản');
      if (user.password !== passwordData.currentPassword) {
        throw new Error('Mật khẩu hiện tại không chính xác');
      }
      user.password = passwordData.newPassword;
      saveUsers(users);
      return { message: 'Đổi mật khẩu thành công' };
    }
  },
};
