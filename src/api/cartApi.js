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
 *   { items: [{ id, bookId, cartId, quantity, book: { id, title, price, discountPrice,
 *     coverImageUrl, stockQuantity, active } }], totalQuantity, totalPrice }
 */
const normalizeCartData = (cartData) => {
  if (!cartData) return { items: [], totalQuantity: 0, totalPrice: 0 };

  const rawList = cartData.cartItemDTOList || cartData.items || (Array.isArray(cartData) ? cartData : []);
  const items = rawList.map((it) => {
    if (it.book) return it;
    return {
      id: it.bookId ?? it.cartId,
      bookId: it.bookId,
      cartId: it.cartId,
      quantity: it.quantity,
      book: {
        id: it.bookId,
        title: it.productName || 'Sách',
        coverImageUrl: it.imageUrl,
        price: Number(it.originalPrice || it.unitPrice || 0),
        discountPrice: it.unitPrice != null ? Number(it.unitPrice) : Number(it.originalPrice || 0),
        stockQuantity: it.availableStock != null ? it.availableStock : 99,
        active: it.isActive !== false,
      },
    };
  });

  return {
    ...cartData,
    items,
    totalQuantity: cartData.totalQuantity ?? items.reduce((sum, it) => sum + (it.quantity || 0), 0),
    totalPrice: cartData.totalPrice ? Number(cartData.totalPrice) : items.reduce((sum, it) => {
      const p = it.book?.discountPrice || it.book?.price || 0;
      return sum + p * (it.quantity || 1);
    }, 0),
  };
};

export const cartApi = {
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      const data = response.data?.data || response.data;
      return normalizeCartData(data);
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const items = getStoredCartItems();
      return { items };
    }
  },

  addItem: async ({ bookId, quantity = 1 }) => {
    try {
      const response = await api.post('/cart/items', { bookId: Number(bookId), quantity: Number(quantity) });
      const raw = response.data?.data || response.data;
      return raw ? normalizeCartData(raw) : null;
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
      const response = await api.put(`/cart/items/${itemId}`, { quantity: Number(quantity) });
      const raw = response.data?.data || response.data;
      return raw ? normalizeCartData(raw) : null;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      let items = getStoredCartItems();
      if (quantity <= 0) {
        items = items.filter((it) => String(it.id) !== String(itemId) && String(it.book?.id) !== String(itemId));
      } else {
        const item = items.find((it) => String(it.id) === String(itemId) || String(it.book?.id) === String(itemId));
        if (item) item.quantity = quantity;
      }
      saveCartItems(items);
      return { items };
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
    } catch {
      try {
        await api.delete('/cart/items', { data: [Number(itemId)] });
      } catch (err) {
        if (!isOfflineOrUnimplemented(err)) throw err;
        const items = getStoredCartItems().filter((it) => String(it.id) !== String(itemId) && String(it.book?.id) !== String(itemId));
        saveCartItems(items);
      }
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
      localStorage.removeItem(CART_KEY);
    }
  },
};
