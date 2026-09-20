// Mock voucher data — sẽ thay bằng API thật khi backend implement
const MOCK_VOUCHERS = [
  { id: 1, code: 'SALE10', name: 'Giảm 10%', discount: 10, minOrder: 100000 },
  { id: 2, code: 'SALE20', name: 'Giảm 20%', discount: 20, minOrder: 200000 },
  { id: 3, code: 'NEWUSER', name: 'Khách mới giảm 15%', discount: 15, minOrder: 0 },
  { id: 4, code: 'BOOK30', name: 'Sách giảm 30%', discount: 30, minOrder: 300000 },
];

export const voucherApi = {
  getVouchers: async () => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_VOUCHERS;
  },

  validateVoucher: async (code, orderAmount) => {
    await new Promise((r) => setTimeout(r, 300));
    const voucher = MOCK_VOUCHERS.find(
      (v) => v.code.toUpperCase() === code.toUpperCase()
    );
    if (!voucher) {
      throw new Error('Mã giảm giá không tồn tại');
    }
    if (orderAmount < voucher.minOrder) {
      throw new Error(
        `Đơn hàng tối thiểu ${voucher.minOrder.toLocaleString('vi-VN')}₫ để dùng mã này`
      );
    }
    return voucher;
  },
};
