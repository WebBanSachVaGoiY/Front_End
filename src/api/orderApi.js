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

const saveOrders = (orders) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const orderApi = {
  createOrder: async (orderData) => {
    try {
      const { data } = await api.post('/orders', orderData);
      return data;
    } catch {
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
      const { data } = await api.get('/orders/my', { params });
      return data;
    } catch {
      const orders = getStoredOrders();
      return {
        content: orders,
        totalElements: orders.length,
      };
    }
  },

  getOrder: async (id) => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    } catch {
      const orders = getStoredOrders();
      const order = orders.find((o) => String(o.id) === String(id));
      if (!order) throw new Error('Không tìm thấy đơn hàng');
      return order;
    }
  },

  cancelOrder: async (id) => {
    try {
      const { data } = await api.patch(`/orders/${id}/cancel`);
      return data;
    } catch {
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
      const { data } = await api.get('/admin/orders', { params });
      return data;
    } catch {
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
      const { data } = await api.patch(`/admin/orders/${id}/status`, { status });
      return data;
    } catch {
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
