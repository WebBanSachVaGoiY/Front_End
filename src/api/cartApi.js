import api from './axios';
import { bookApi } from './bookApi';

const CART_KEY = 'bookrunner_cart_items';

const getStoredCartItems = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCartItems = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
};

const isOfflineOrUnimplemented = (err) => {
  if (!err?.response) return true; // Mất mạng / Backend chưa bật
  if (err.response.status === 502) return true; // Vite proxy Bad Gateway
  if (err.response.status === 404) return true; // Endpoint Backend chưa viết
  return false;
};

export const cartApi = {
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const items = getStoredCartItems();
      return { items };
    }
  },

  addItem: async ({ bookId, quantity = 1 }) => {
    try {
      const response = await api.post('/cart/items', { bookId, quantity });
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const items = getStoredCartItems();
      const existingIdx = items.findIndex((it) => String(it.book?.id) === String(bookId));
      if (existingIdx !== -1) {
        items[existingIdx].quantity += quantity;
      } else {
        const book = await bookApi.getBook(bookId);
        items.push({
          id: Date.now(),
          quantity,
          book,
        });
      }
      saveCartItems(items);
      return { items };
    }
  },

  updateItem: async (itemId, { quantity }) => {
    try {
      const response = await api.put(`/cart/items/${itemId}`, { quantity });
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      let items = getStoredCartItems();
      if (quantity <= 0) {
        items = items.filter((it) => String(it.id) !== String(itemId));
      } else {
        const item = items.find((it) => String(it.id) === String(itemId));
        if (item) item.quantity = quantity;
      }
      saveCartItems(items);
      return { items };
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const items = getStoredCartItems().filter((it) => String(it.id) !== String(itemId));
      saveCartItems(items);
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
    } catch (err) {
      // Backend chưa có Cart API (Plan 2 sẽ thêm), bỏ qua lỗi 404/502
      if (!isOfflineOrUnimplemented(err)) throw err;
    } finally {
      // Đảm bảo localStorage luôn được dọn dẹp sạch sau khi thanh toán thành công
      localStorage.removeItem(CART_KEY);
    }
  },
};
