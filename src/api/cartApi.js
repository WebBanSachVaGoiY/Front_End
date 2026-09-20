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

export const cartApi = {
  getCart: async () => {
    try {
      const { data } = await api.get('/cart');
      return data;
    } catch {
      const items = getStoredCartItems();
      return { items };
    }
  },

  addItem: async ({ bookId, quantity = 1 }) => {
    try {
      const { data } = await api.post('/cart/items', { bookId, quantity });
      return data;
    } catch {
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
      const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
      return data;
    } catch {
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
    } catch {
      const items = getStoredCartItems().filter((it) => String(it.id) !== String(itemId));
      saveCartItems(items);
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
    } catch {
      localStorage.removeItem(CART_KEY);
    }
  },
};
