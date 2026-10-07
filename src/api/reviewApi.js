import api from './axios';

const REVIEWS_KEY = 'bookrunner_reviews';

const getStoredReviews = () => {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveReviews = (reviews) => {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
};

const isOfflineOrUnimplemented = (err) => {
  if (!err?.response) return true; // Mất mạng / Backend chưa bật
  if (err.response.status === 502) return true; // Vite proxy Bad Gateway
  if (err.response.status === 404) return true; // Endpoint Backend chưa viết
  return false;
};

export const reviewApi = {
  // TODO: [REVIEW-MODULE-BE] Backend chưa có ReviewController (/books/{id}/reviews). Đang dùng mock fallback cho 404/offline.
  getBookReviews: async (bookId, params = {}) => {
    try {
      const response = await api.get(`/books/${bookId}/reviews`, { params });
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const allReviews = getStoredReviews();
      const filtered = allReviews.filter((r) => String(r.bookId) === String(bookId));
      return {
        content: filtered,
        totalElements: filtered.length,
      };
    }
  },

  canUserReview: async (bookId) => {
    try {
      const response = await api.get(`/books/${bookId}/can-review`);
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      return { canReview: true, hasPurchased: true, alreadyReviewed: false };
    }
  },

  // TODO: [REVIEW-MODULE-BE] Backend chưa có ReviewController (POST /books/{id}/reviews). Đang dùng mock fallback cho 404/offline.
  createReview: async (reviewData) => {
    try {
      const response = await api.post(`/books/${reviewData.bookId}/reviews`, reviewData);
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const reviews = getStoredReviews();
      let currentUser = { fullName: 'Bạn đọc' };
      try {
        const u = localStorage.getItem('bookrunner_current_user');
        if (u) currentUser = JSON.parse(u);
      } catch {}

      const newReview = {
        id: Date.now(),
        bookId: reviewData.bookId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        user: {
          fullName: currentUser.fullName || 'Khách hàng',
        },
        createdAt: new Date().toISOString(),
      };
      reviews.unshift(newReview);
      saveReviews(reviews);
      return newReview;
    }
  },

  updateReview: async (id, reviewData) => {
    try {
      const response = await api.put(`/reviews/${id}`, reviewData);
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const reviews = getStoredReviews();
      const idx = reviews.findIndex((r) => String(r.id) === String(id));
      if (idx !== -1) {
        reviews[idx] = { ...reviews[idx], ...reviewData };
        saveReviews(reviews);
        return reviews[idx];
      }
      throw new Error('Không tìm thấy đánh giá');
    }
  },

  deleteReview: async (id) => {
    try {
      await api.delete(`/reviews/${id}`);
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const reviews = getStoredReviews().filter((r) => String(r.id) !== String(id));
      saveReviews(reviews);
    }
  },
};
