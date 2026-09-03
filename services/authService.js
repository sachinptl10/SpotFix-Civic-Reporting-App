import api, { storeAuthToken, removeAuthToken, getStoredToken } from './api';

export const authService = {
  /**
   * Log in user with email & password
   */
  async login(email, password) {
    const data = await api.post(
      '/auth/login',
      { email, password },
      { skipAuth: true }
    );
    if (data.token) {
      await storeAuthToken(data.token);
    }
    return data;
  },

  /**
   * Register a new user account
   */
  async register({ name, email, password, confirmPassword }) {
    const data = await api.post(
      '/auth/register',
      { name, email, password, confirmPassword },
      { skipAuth: true }
    );
    if (data.token) {
      await storeAuthToken(data.token);
    }
    return data;
  },

  /**
   * Fetch currently logged in user profile
   */
  async getProfile() {
    return await api.get('/auth/profile');
  },

  /**
   * Log out user and clean up local secure storage
   */
  async logout() {
    await removeAuthToken();
  },

  /**
   * Check if user has an existing saved token
   */
  async getPersistedToken() {
    return await getStoredToken();
  },
};

export default authService;
