import api from './axios';
import { DEFAULT_MOCK_USERS } from '../utils/mockData';

const USERS_KEY = 'bookrunner_users';

const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_MOCK_USERS;
  } catch {
    return DEFAULT_MOCK_USERS;
  }
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const isOfflineOrUnimplemented = (err) => {
  if (!err?.response) return true; // Mất mạng / Backend chưa bật
  if (err.response.status === 502) return true; // Vite proxy Bad Gateway
  if (err.response.status === 404) return true; // Endpoint Backend chưa viết
  return false;
};

// TODO: [ADMIN-STATS-USERS-BE] Backend chưa có Controller thống kê (/admin/stats/**) và quản lý User (/admin/users/**).
export const adminApi = {
  // Dashboard stats
  getStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      return {
        totalRevenue: 285000000,
        totalOrders: 1420,
        totalUsers: 5630,
        totalBooks: 9,
      };
    }
  },

  getRevenueChart: async (params = {}) => {
    try {
      const response = await api.get('/admin/stats/revenue', { params });
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      return [
        { month: 'T1', revenue: 14000000 },
        { month: 'T2', revenue: 21000000 },
        { month: 'T3', revenue: 18000000 },
        { month: 'T4', revenue: 29000000 },
        { month: 'T5', revenue: 26000000 },
        { month: 'T6', revenue: 34000000 },
        { month: 'T7', revenue: 32000000 },
        { month: 'T8', revenue: 41000000 },
        { month: 'T9', revenue: 38000000 },
      ];
    }
  },

  getBestSellers: async (limit = 10) => {
    try {
      const response = await api.get('/admin/stats/best-sellers', { params: { limit } });
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      return [
        { title: 'Đắc Nhân Tâm', sold: 185 },
        { title: 'Nhà Giả Kim', sold: 164 },
        { title: 'Atomic Habits', sold: 142 },
        { title: 'Sapiens: Lược Sử Loài Người', sold: 98 },
        { title: 'Cây Cam Ngọt Của Tôi', sold: 86 },
      ];
    }
  },

  // User management
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const users = getStoredUsers();
      return {
        content: users,
        totalElements: users.length,
      };
    }
  },

  getUser: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const users = getStoredUsers();
      const user = users.find((u) => String(u.id) === String(id));
      if (!user) throw new Error('Không tìm thấy người dùng');
      return user;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const users = getStoredUsers();
      const idx = users.findIndex((u) => String(u.id) === String(id));
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...userData };
        saveUsers(users);
        return users[idx];
      }
      throw new Error('Không tìm thấy người dùng');
    }
  },

  toggleUserEnabled: async (id) => {
    try {
      const response = await api.patch(`/admin/users/${id}/toggle-enabled`);
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const users = getStoredUsers();
      const user = users.find((u) => String(u.id) === String(id));
      if (user) {
        user.enabled = !user.enabled;
        saveUsers(users);
        return user;
      }
      throw new Error('Không tìm thấy người dùng');
    }
  },
};
