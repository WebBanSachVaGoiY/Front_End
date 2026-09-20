export const ORDER_STATUS = {
  PENDING: { label: 'Chờ xử lý', color: '#B45309', bg: '#FEF3C7' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#1D4ED8', bg: '#DBEAFE' },
  SHIPPING: { label: 'Đang giao hàng', color: '#6D28D9', bg: '#EDE9FE' },
  DELIVERED: { label: 'Đã giao hàng', color: '#047857', bg: '#D1FAE5' },
  CANCELLED: { label: 'Đã hủy', color: '#B91C1C', bg: '#FEE2E2' },
  RETURNED: { label: 'Hoàn hàng', color: '#4B5563', bg: '#F3F4F6' },
};

export const PAYMENT_METHOD = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
};

export const PAYMENT_STATUS = {
  PENDING: { label: 'Chưa thanh toán', color: '#F59E0B' },
  PAID: { label: 'Đã thanh toán', color: '#10B981' },
  FAILED: { label: 'Thanh toán thất bại', color: '#EF4444' },
  REFUNDED: { label: 'Đã hoàn tiền', color: '#6B7280' },
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'best_seller', label: 'Bán chạy nhất' },
];

export const DEFAULT_BOOK_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80';

export const SHIPPING_FEE = 30000;
