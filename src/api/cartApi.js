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

/**
 * Adapter ánh xạ CartDTO từ Backend Spring Boot sang format mà Frontend UI cần.
 *
 * Backend trả về (CartDTO):
 *   { userId, cartItemDTOList: [{ cartId, bookId, productName, imageUrl, quantity,
 *     originalPrice, unitPrice, availableStock, isActive }], totalQuantity, totalPrice }
 *
 * Frontend UI mong đợi:
 *   { items: [{ id, quantity, book: { id, title, price, discountPrice,
 *     coverImageUrl, stockQuantity, active } }], totalQuantity, totalPrice }
 */
const normalizeCartData = (cartData) => {
  if (!cartData) return { items: [], totalQuantity: 0, totalPrice: 0 };

  // Nếu dữ liệu đã ở dạng items (mock data hoặc format cũ) → trả nguyên
  if (Array.isArray(cartData.items)) {
    return cartData;
  }

  // Ánh xạ cartItemDTOList → items
  const rawList = cartData.cartItemDTOList || [];
  const items = rawList.map((item) => ({
    id: item.bookId || item.cartId,
    cartId: item.cartId,
    quantity: item.quantity,
    book: {
      id: item.bookId,
      title: item.productName || 'Sách',
      coverImageUrl: item.imageUrl,
      price: item.originalPrice || 0,
      discountPrice: item.unitPrice,
      stockQuantity: item.availableStock || 99,
      active: item.isActive !== false,
    },
  }));

  return {
    ...cartData,
    items,
  };
};

export const cartApi = {
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      const raw = response.data?.data || response.data;
      return normalizeCartData(raw);
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const items = getStoredCartItems();
      return { items };
    }
  },

  addItem: async ({ bookId, quantity = 1 }) => {
    try {
      const response = await api.post('/cart/items', { bookId, quantity });
      const raw = response.data?.data || response.data;
      return normalizeCartData(raw);
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
      const raw = response.data?.data || response.data;
      return normalizeCartData(raw);
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

  /** Xóa nhiều sản phẩm cùng lúc theo danh sách bookId — khớp DELETE /cart/items (body: List<Long>) */
  deleteItems: async (bookIds = []) => {
    try {
      await api.delete('/cart/items', { data: bookIds });
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const idSet = new Set(bookIds.map(String));
      const items = getStoredCartItems().filter(
        (it) => !idSet.has(String(it.id)) && !idSet.has(String(it.book?.id))
      );
      saveCartItems(items);
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
    } finally {
      // Đảm bảo localStorage luôn được dọn dẹp sạch sau khi thanh toán thành công
      localStorage.removeItem(CART_KEY);
    }
  },
};
