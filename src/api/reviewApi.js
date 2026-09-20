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

export const reviewApi = {
  getBookReviews: async (bookId, params = {}) => {
    try {
      const { data } = await api.get(`/books/${bookId}/reviews`, { params });
      return data;
    } catch {
      const allReviews = getStoredReviews();
      const filtered = allReviews.filter((r) => String(r.bookId) === String(bookId));
      return {
        content: filtered,
        totalElements: filtered.length,
      };
    }
  },

  createReview: async (reviewData) => {
    try {
      const { data } = await api.post('/reviews', reviewData);
      return data;
    } catch {
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
      const { data } = await api.put(`/reviews/${id}`, reviewData);
      return data;
    } catch {
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
    } catch {
      const reviews = getStoredReviews().filter((r) => String(r.id) !== String(id));
      saveReviews(reviews);
    }
  },
};
