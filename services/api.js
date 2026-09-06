import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_HOST, detectDevServerHost } from '../utils/constants';

const TOKEN_KEY = 'spotfix_auth_token';
const SERVER_OVERRIDE_KEY = 'spotfix_custom_server_host';

let unauthorizedListener = null;
let cachedServerHost = null;

export const setUnauthorizedListener = (fn) => {
  unauthorizedListener = fn;
};

/**
 * Returns the currently active server host URL.
 * Checks for a user-configured host first; otherwise auto-detects from Expo Metro.
 */
export const getActiveServerHost = async () => {
  try {
    const custom = await AsyncStorage.getItem(SERVER_OVERRIDE_KEY);
    if (custom && custom.trim().length > 0) {
      cachedServerHost = custom.trim().replace(/\/+$/, '');
      return cachedServerHost;
    }
  } catch (err) {
    // Ignore storage read errors
  }

  cachedServerHost = detectDevServerHost();
  return cachedServerHost;
};

/**
 * Persists a user-defined custom server host (or clears it to restore auto-detection).
 */
export const setActiveServerHost = async (newHost) => {
  try {
    if (!newHost || newHost.trim().length === 0) {
      await AsyncStorage.removeItem(SERVER_OVERRIDE_KEY);
      cachedServerHost = detectDevServerHost();
    } else {
      const clean = newHost.trim().replace(/\/+$/, '');
      await AsyncStorage.setItem(SERVER_OVERRIDE_KEY, clean);
      cachedServerHost = clean;
    }
  } catch (err) {
    console.warn('[api] Failed to save custom server host:', err);
  }
  return cachedServerHost;
};

/**
 * Synchronous getter for currently resolved host
 */
export const getCurrentServerHostSync = () => {
  return cachedServerHost || SERVER_HOST;
};

/**
 * Test server connectivity and return latency and diagnostics
 */
export const pingServer = async (hostToTest) => {
  const targetHost = (hostToTest || cachedServerHost || detectDevServerHost()).replace(/\/+$/, '');
  const startTime = Date.now();

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

  try {
    const response = await fetch(`${targetHost}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller?.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    const data = await response.json().catch(() => null);

    if (response.ok) {
      return {
        success: true,
        status: response.status,
        latencyMs,
        data,
        host: targetHost,
      };
    }

    return {
      success: false,
      status: response.status,
      latencyMs,
      message: `Server returned HTTP ${response.status}`,
      host: targetHost,
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: err.name === 'AbortError' ? 'Connection timed out (6s)' : err.message,
      host: targetHost,
    };
  }
};

/**
 * Helper to get stored auth token
 */
export const getStoredToken = async () => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('[Storage] Failed to read token:', err);
    return null;
  }
};

/**
 * Helper to store auth token
 */
export const storeAuthToken = async (token) => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (token) {
          window.localStorage.setItem(TOKEN_KEY, token);
        } else {
          window.localStorage.removeItem(TOKEN_KEY);
        }
      }
      return;
    }
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (err) {
    console.warn('[Storage] Failed to save token:', err);
  }
};

/**
 * Helper to remove auth token
 */
export const removeAuthToken = async () => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('[Storage] Failed to delete token:', err);
  }
};

/**
 * Central API request handler with automatic token injection & 401 handling
 */
export const apiRequest = async (endpoint, options = {}) => {
  const host = await getActiveServerHost();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${host}/api${cleanEndpoint}`;

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

  const isFormData = Boolean(
    options.body &&
      (options.body instanceof FormData ||
        typeof options.body.append === 'function' ||
        options.body?._parts ||
        options.body?.constructor?.name === 'FormData')
  );

  // Set Content-Type to application/json unless it's FormData
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  } else if (isFormData) {
    // Ensure Content-Type is NOT set so fetch automatically computes the multipart boundary
    delete headers['Content-Type'];
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    ...options,
  };

  if (options.body && !isFormData && typeof options.body === 'object') {
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
    const errorMsg = error.message || '';
    const isNetworkError =
      error.isNetworkError ||
      errorMsg === 'Network request failed' ||
      errorMsg.includes('fetch failed') ||
      errorMsg.includes('offline') ||
      errorMsg.includes('The Internet connection appears to be offline') ||
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('NetworkError') ||
      errorMsg.includes('UnexpectedException') ||
      error.name === 'TypeError';

    if (isNetworkError) {
      const netError = new Error(
        `Cannot reach the SpotFix server at ${host}. Please ensure your device and computer are connected to the same Wi-Fi / Hotspot network and the backend server is running.`
      );
      netError.isNetworkError = true;
      netError.serverHost = host;
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
