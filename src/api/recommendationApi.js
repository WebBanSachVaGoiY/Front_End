import api from './axios';
import { bookApi } from './bookApi';

/**
 * Tầng phục vụ gợi ý (Recommendation Serving Layer).
 *
 * Các endpoint này do Spring Boot (book-runner) cung cấp — đọc trực tiếp bảng
 * `user_recommendations` / `book_similarities` mà tiến trình huấn luyện (FastAPI)
 * ghi ra. Frontend KHÔNG phụ thuộc trực tiếp vào Python: chỉ cần Spring Boot chạy.
 *
 * - GET /api/v1/recommendations/for-you                          (cần đăng nhập)
 * - GET /api/v1/recommendations/related/{bookId}
 * - GET /api/v1/recommendations/frequently-bought-together/{bookId}
 * - GET /api/v1/recommendations/trending
 */

const isOfflineOrUnimplemented = (err) => {
  if (!err?.response) return true; // Mất mạng / Backend chưa bật
  if (err.response.status === 502) return true; // Vite proxy Bad Gateway
  if (err.response.status === 404) return true; // Endpoint Backend chưa viết
  return false;
};

/** Chuẩn hoá payload trả về thành mảng sách (chấp nhận cả mảng trần và Page). */
const toList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

/** Loại bỏ chính cuốn sách đang xem khỏi danh sách gợi ý. */
const excludeBook = (list, bookId) =>
  toList(list).filter((book) => String(book?.id) !== String(bookId));

export const recommendationApi = {
  /**
   * Gợi ý cá nhân hoá cho người dùng đang đăng nhập.
   * Backend tự xử lý cold-start (user ít tương tác → trả sách bán chạy/điểm cao).
   */
  getForYou: async (limit = 10) => {
    try {
      const { data } = await api.get('/recommendations/for-you', { params: { limit } });
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return toList(data?.data ?? data);
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      // Fallback ngoại tuyến: dùng danh sách sách điểm cao
      const fallback = await bookApi.getRecommendations();
      return toList(fallback).slice(0, limit);
    }
  },

  /** Sách tương tự theo thuật toán Content-Based Filtering. */
  getRelated: async (bookId, limit = 10) => {
    try {
      const { data } = await api.get(`/recommendations/related/${bookId}`, { params: { limit } });
      return excludeBook(data?.data ?? data, bookId);
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      return [];
    }
  },

  /** Sách thường được mua cùng (FBT — đồng xuất hiện trong cùng đơn hàng). */
  getFrequentlyBoughtTogether: async (bookId, limit = 10) => {
    try {
      const { data } = await api.get(`/recommendations/frequently-bought-together/${bookId}`, {
        params: { limit },
      });
      return excludeBook(data?.data ?? data, bookId);
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      return [];
    }
  },

  /** Sách bán chạy / nổi bật — dùng cho khách vãng lai. */
  getTrending: async (limit = 10) => {
    try {
      const { data } = await api.get('/recommendations/trending', { params: { limit } });
      return toList(data?.data ?? data);
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const fallback = await bookApi.getBooks({ sort: 'best_seller', size: limit });
      return toList(fallback).slice(0, limit);
    }
  },
};

export default recommendationApi;
