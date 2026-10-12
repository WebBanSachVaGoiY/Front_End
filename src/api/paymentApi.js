import api from './axios';

export const paymentApi = {
  /**
   * Tạo liên kết thanh toán VNPay Sandbox cho đơn hàng.
   * POST /api/v1/payments/vnpay/create-url?orderId={orderId}
   *
   * @param {number|string} orderId - ID đơn hàng cần thanh toán
   * @returns {Promise<{ orderId: number, orderCode: string, amount: number, paymentUrl: string }>}
   */
  createVNPayUrl: async (orderId) => {
    const response = await api.post('/payments/vnpay/create-url', null, {
      params: { orderId },
    });
    return response.data?.data || response.data;
  },

  /**
   * Xác thực kết quả thanh toán từ các tham số query do VNPay trả về trên Return URL.
   * GET /api/v1/payments/vnpay/callback-verify
   *
   * @param {Object} queryParams - Toàn bộ query params từ URL (vnp_TxnRef, vnp_ResponseCode, vnp_SecureHash,...)
   * @returns {Promise<{ success: boolean, orderId: number, orderCode: string, transactionNo: string, amount: number, bankCode: string, responseCode: string, message: string }>}
   */
  verifyVNPayReturn: async (queryParams) => {
    const response = await api.get('/payments/vnpay/callback-verify', {
      params: queryParams,
    });
    return response.data?.data || response.data;
  },
};
