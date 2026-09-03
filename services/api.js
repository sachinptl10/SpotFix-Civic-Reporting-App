import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../utils/constants';

const TOKEN_KEY = 'spotfix_auth_token';

let unauthorizedListener = null;

export const setUnauthorizedListener = (fn) => {
  unauthorizedListener = fn;
};

/**
 * Helper to get stored auth token
 */
export const getStoredToken = async () => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('[SecureStore] Failed to read token:', err);
    return null;
  }
};

/**
 * Helper to store auth token
 */
export const storeAuthToken = async (token) => {
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (err) {
    console.warn('[SecureStore] Failed to save token:', err);
  }
};

/**
 * Helper to remove auth token
 */
export const removeAuthToken = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('[SecureStore] Failed to delete token:', err);
  }
};

/**
 * Central API request handler with automatic token injection & 401 handling
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  // Attach JWT Bearer token if not explicitly disabled
  if (!options.skipAuth) {
    const token = await getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Set Content-Type to application/json unless it's FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    ...options,
  };

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Global 401 Unauthorized handling
      if (response.status === 401 && !options.skipAuth) {
        await removeAuthToken();
        if (typeof unauthorizedListener === 'function') {
          unauthorizedListener();
        }
      }

      const error = new Error(data?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.response = data;
      error.errors = data?.errors || null;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.message === 'Network request failed') {
      const netError = new Error(
        `Cannot reach the SpotFix server at ${API_BASE_URL}. Please check your connection.`
      );
      netError.isNetworkError = true;
      throw netError;
    }
    throw error;
  }
};

export default {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
