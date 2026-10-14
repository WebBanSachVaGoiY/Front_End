import api from './axios';

export const interactionApi = {
  /**
   * Ghi nhận tương tác người dùng (VIEW, ADD_TO_CART) ngầm định cho RecSys.
   * POST /api/v1/interactions/log
   *
   * @param {{ bookId: number|string, interactionType: 'VIEW'|'ADD_TO_CART' }} payload
   * @returns {Promise<any>}
   */
  logInteraction: async ({ bookId, interactionType }) => {
    try {
      const response = await api.post('/interactions/log', {
        bookId: Number(bookId),
        interactionType,
      });
      return response.data?.data || response.data;
    } catch (err) {
      // Fire-and-forget: Nuốt lỗi ngầm để không bao giờ làm gián đoạn trải nghiệm UI
      console.debug('Tracking interaction skipped or failed:', err?.message || err);
      return null;
    }
  },
};
