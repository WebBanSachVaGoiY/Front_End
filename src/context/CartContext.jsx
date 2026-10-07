import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const initialState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  discount: 0,
  shippingFee: 30000,
  voucher: null,
  isLoading: false,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CART': {
      const items = action.payload || [];
      const subtotal = items.reduce((sum, item) => {
        const price = item.book?.discountPrice || item.book?.price || 0;
        return sum + price * item.quantity;
      }, 0);
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      return { ...state, items, subtotal, totalItems, isLoading: false };
    }
    case 'UPDATE_ITEM_QTY': {
      const { itemId, quantity } = action.payload;
      const items = state.items.map((it) => {
        if (String(it.id) === String(itemId) || String(it.book?.id) === String(itemId)) {
          return { ...it, quantity };
        }
        return it;
      });
      const subtotal = items.reduce((sum, item) => {
        const price = item.book?.discountPrice || item.book?.price || 0;
        return sum + price * item.quantity;
      }, 0);
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      return { ...state, items, subtotal, totalItems };
    }
    case 'APPLY_VOUCHER': {
      const discount = action.payload
        ? Math.round(state.subtotal * (action.payload.discount / 100))
        : 0;
      return { ...state, voucher: action.payload, discount };
    }
    case 'CLEAR_VOUCHER':
      return { ...state, voucher: null, discount: 0 };
    case 'CLEAR_CART':
      return { ...initialState };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async (silent = false) => {
    if (!isAuthenticated) {
      dispatch({ type: 'CLEAR_CART' });
      return;
    }
    if (!silent) {
      dispatch({ type: 'SET_LOADING', payload: true });
    }
    try {
      const data = await cartApi.getCart();
      dispatch({ type: 'SET_CART', payload: data.items || [] });
    } catch {
      if (!silent) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (bookId, quantity = 1) => {
    await cartApi.addItem({ bookId, quantity });
    await fetchCart(true);
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    dispatch({ type: 'UPDATE_ITEM_QTY', payload: { itemId, quantity } });
    try {
      await cartApi.updateItem(itemId, { quantity });
      await fetchCart(true);
    } catch {
      await fetchCart(true);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartApi.removeItem(itemId);
    } finally {
      await fetchCart(true);
    }
  };

  const deleteSelectedItems = async (itemIds = []) => {
    try {
      await cartApi.deleteItems(itemIds);
    } finally {
      await fetchCart(true);
    }
  };

  const clearCart = async () => {
    await cartApi.clearCart();
    dispatch({ type: 'CLEAR_CART' });
  };

  const applyVoucher = (voucher) => {
    dispatch({ type: 'APPLY_VOUCHER', payload: voucher });
  };

  const removeVoucher = () => {
    dispatch({ type: 'CLEAR_VOUCHER' });
  };

  const getFinalAmount = () => {
    return Math.max(0, state.subtotal - state.discount + state.shippingFee);
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        deleteSelectedItems,
        clearCart,
        applyVoucher,
        removeVoucher,
        getFinalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
