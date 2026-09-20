// Format số tiền theo chuẩn VND
export const formatCurrency = (amount) => {
  if (amount == null) return '0₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Format số (không đơn vị)
export const formatNumber = (num) => {
  if (num == null) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
};
