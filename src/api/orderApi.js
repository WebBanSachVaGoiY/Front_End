import api from './axios';
import { INITIAL_ORDERS } from '../utils/mockData';
import { cartApi } from './cartApi';

const ORDERS_KEY = 'bookrunner_orders';

const getStoredOrders = () => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORDERS;
  }
};

const isOfflineOrUnimplemented = (err) => {
  if (!err?.response) return true; // Mất mạng / Backend chưa bật
  if (err.response.status === 502) return true; // Vite proxy Bad Gateway
  if (err.response.status === 404) return true; // Endpoint Backend chưa viết
  return false;
};

export const orderApi = {
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const orders = getStoredOrders();
      const cartData = await cartApi.getCart();
      const items = cartData.items || [];

      const totalAmount = items.reduce(
        (sum, it) => sum + (it.book?.discountPrice || it.book?.price || 0) * it.quantity,
        0
      );
      const shippingFee = 30000;
      const finalAmount = totalAmount + shippingFee;

      const newOrder = {
        id: Date.now(),
        orderCode: `BR-${Date.now().toString().slice(-6)}`,
        recipientName: orderData.recipientName,
        recipientPhone: orderData.recipientPhone,
        shippingAddress: orderData.shippingAddress,
        note: orderData.note || '',
        paymentMethod: orderData.paymentMethod || 'COD',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        totalAmount,
        shippingFee,
        finalAmount,
        items,
        createdAt: new Date().toISOString(),
      };

      orders.unshift(newOrder);
      saveOrders(orders);
      return newOrder;
    }
  },

  getMyOrders: async (params = {}) => {
    try {
      const response = await api.get('/orders/my-orders', { params });
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const orders = getStoredOrders();
      return {
        content: orders,
        totalElements: orders.length,
      };
    }
  },

  getOrder: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const orders = getStoredOrders();
      const order = orders.find((o) => String(o.id) === String(id));
      if (!order) throw new Error('Không tìm thấy đơn hàng');
      return order;
    }
  },

  cancelOrder: async (id) => {
    try {
      const response = await api.put(`/orders/${id}/cancel`);
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const orders = getStoredOrders();
      const order = orders.find((o) => String(o.id) === String(id));
      if (order) {
        order.status = 'CANCELLED';
        saveOrders(orders);
      }
      return order;
    }
  },

  // Admin
  getAllOrders: async (params = {}) => {
    try {
      const response = await api.get('/admin/orders', { params });
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      let orders = getStoredOrders();
      if (params.status) {
        orders = orders.filter((o) => o.status === params.status);
      }
      return {
        content: orders,
        totalElements: orders.length,
      };
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      const response = await api.put(`/admin/orders/${id}/status`, { status });
      // TODO: [DTO-UNWRAP] Gỡ unwrap sau khi Backend chuẩn hóa ApiResponse<T>
      return response.data?.data || response.data;
    } catch (err) {
      if (!isOfflineOrUnimplemented(err)) throw err;
      const orders = getStoredOrders();
      const order = orders.find((o) => String(o.id) === String(id));
      if (order) {
        order.status = status;
        saveOrders(orders);
      }
      return order;
    }
  },
};
