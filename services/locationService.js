import * as Location from 'expo-location';

export const locationService = {
  /**
   * Check and request foreground location permissions
   */
  async requestPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return {
        granted: status === 'granted',
        status,
      };
    } catch (error) {
      console.warn('[Location] Permission request failed:', error);
      return { granted: false, status: 'error', error };
    }
  },

  /**
   * Check current permission status without prompting
   */
  async getPermissionStatus() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return {
        granted: status === 'granted',
        status,
      };
    } catch (error) {
      return { granted: false, status: 'unknown' };
    }
  },

  /**
   * Acquire device's current GPS coordinates
   */
  async getCurrentPosition() {
    try {
      const permission = await this.requestPermission();
      if (!permission.granted) {
        throw new Error('Location permission was denied.');
      }

      // Try balanced accuracy for speed and reliability
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.warn('[Location] Error getting position:', error);
      // Try last known position as fallback
      const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
      if (lastKnown) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          accuracy: lastKnown.coords.accuracy,
        };
      }
      throw error;
    }
  },

  /**
   * Convert latitude and longitude into a readable street address
   */
  async reverseGeocode(latitude, longitude) {
    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (!result) {
        return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      }

      // Format components into a clean address
      const parts = [];
      if (result.name && result.name !== result.street) parts.push(result.name);
      if (result.streetNumber || result.street) {
        parts.push([result.streetNumber, result.street].filter(Boolean).join(' '));
      }
      if (result.district) parts.push(result.district);
      if (result.city) parts.push(result.city);
      if (result.region) parts.push(result.region);
      if (result.postalCode) parts.push(result.postalCode);
      if (result.country) parts.push(result.country);

      const addressString = parts.filter(Boolean).join(', ');
      return addressString || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    } catch (error) {
      console.warn('[Location] Reverse geocoding failed:', error);
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
  },
};

export default locationService;
