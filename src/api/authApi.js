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

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authApi = {
  login: async (credentials) => {
    const payload = {
      username: credentials.username || credentials.email,
      email: credentials.email || credentials.username,
      password: credentials.password,
    };

    try {
      const { data } = await api.post('/auth/login', payload);
      return data;
    } catch (apiError) {
      // If backend not available or returned 404/500/network error, fallback to mock
      const users = getStoredUsers();
      const matched = users.find(
        (u) =>
          (u.email?.toLowerCase() === payload.email?.toLowerCase() ||
           u.username?.toLowerCase() === payload.username?.toLowerCase()) &&
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
    const payload = {
      username: userData.username || userData.email,
      ...userData,
    };

    try {
      const { data } = await api.post('/auth/register', payload);
      return data;
    } catch (apiError) {
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
      const { data } = await api.post('/auth/refresh', { refreshToken });
      return data;
    } catch {
      return {
        accessToken: `mock-refreshed-token-${Date.now()}`,
      };
    }
  },

  getMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      return data;
    } catch {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_MOCK_USERS[1];
    }
  },

  updateProfile: async (profileData) => {
    try {
      const { data } = await api.put('/auth/me', profileData);
      return data;
    } catch {
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

  changePassword: async (passwordData) => {
    try {
      const { data } = await api.put('/auth/me/password', passwordData);
      return data;
    } catch {
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
