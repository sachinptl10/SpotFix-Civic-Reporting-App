import api from './api';

export const analyticsService = {
  /**
   * Get government analytics summary
   */
  async getSummary() {
    return await api.get('/analytics/summary');
  },
};

export default analyticsService;
