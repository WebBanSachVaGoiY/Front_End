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

export const adminApi = {
  // ──────────────────────────────────────────────────────
  // Dashboard stats — Khớp với AdminStatsController (Spring Boot)
  // Endpoints: GET /admin/stats, GET /admin/stats/revenue, GET /admin/stats/best-sellers
  // ──────────────────────────────────────────────────────
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data?.data || response.data;
  },

  getRevenueChart: async (params = {}) => {
    const response = await api.get('/admin/stats/revenue', { params });
    return response.data?.data || response.data;
  },

  getBestSellers: async (limit = 10) => {
    const response = await api.get('/admin/stats/best-sellers', { params: { limit } });
    return response.data?.data || response.data;
  },

  // ──────────────────────────────────────────────────────
  // User management — Khớp với AdminUserController (Spring Boot)
  // Endpoints: GET /admin/users, GET /admin/users/{id},
  //            PUT /admin/users/{id}, PATCH /admin/users/{id}/toggle-enabled
  // ──────────────────────────────────────────────────────

  /** Lấy danh sách người dùng phân trang — GET /api/v1/admin/users */
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

  /** Xem chi tiết một người dùng — GET /api/v1/admin/users/{id} */
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

  /**
   * Cập nhật thông tin / phân quyền người dùng — PUT /api/v1/admin/users/{id}
   * Body khớp AdminUpdateUserRequest: { fullName, phone, address, role, enabled }
   */
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

  // ──────────────────────────────────────────────────────
  // RecSys — Khớp với AdminRecommendationController (Spring Boot)
  // Endpoint: POST /admin/recommendations/train?type=all|content-based|collaborative|co-purchase
  // ──────────────────────────────────────────────────────

  /**
   * Trigger huấn luyện lại mô hình gợi ý (đồng bộ — chờ tới khi xong).
   * Spring Boot sẽ gọi sang RecSys FastAPI rồi xoá cache gợi ý.
   */
  trainRecommendations: async (type = 'all') => {
    const response = await api.post('/admin/recommendations/train', null, { params: { type } });
    return response.data?.data || response.data;
  },

  /** Lấy chỉ số đo lường đánh giá mô hình RecSys — GET /api/v1/admin/recommendations/evaluate */
  evaluateRecommendations: async (topK = 10) => {
    const response = await api.get('/admin/recommendations/evaluate', { params: { topK } });
    return response.data?.data || response.data;
  },

  /** Bật / tắt trạng thái hoạt động tài khoản — PATCH /api/v1/admin/users/{id}/toggle-enabled */
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
