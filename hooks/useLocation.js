import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import locationService from '../services/locationService';

export default function useLocation({ autoTrack = false } = {}) {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState(null);

  const watcherRef = useRef(null);
  const isMountedRef = useRef(true);

  // Stop location watcher
  const stopWatching = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
    if (isMountedRef.current) {
      setIsWatching(false);
    }
  }, []);

  // One-time GPS fetch
  const getCurrentPosition = useCallback(async () => {
    if (!isMountedRef.current) return null;
    setIsLocating(true);
    setError(null);

    try {
      const position = await locationService.getCurrentPosition();
      if (!isMountedRef.current) return null;

      setLocation(position);

      // Reverse geocode to street address
      const resolvedAddress = await locationService.reverseGeocode(
        position.latitude,
        position.longitude
      );
      if (isMountedRef.current) {
        setAddress(resolvedAddress);
      }
      return { position, address: resolvedAddress };
    } catch (err) {
      console.warn('[useLocation] Error acquiring position:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Unable to retrieve location.');
        // Fallback default coordinates if in simulator or GPS off
        const fallback = { latitude: 37.78825, longitude: -122.4324 };
        setLocation(fallback);
        setAddress('San Francisco, CA (Default / Simulator)');
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLocating(false);
      }
    }
  }, []);

  // Start live location watching with watchPositionAsync
  const startWatching = useCallback(async () => {
    try {
      const permission = await locationService.requestPermission();
      if (!permission.granted) {
        setError('Location permission denied.');
        return;
      }

      // Stop existing watcher if any
      stopWatching();

      if (isMountedRef.current) {
        setIsWatching(true);
      }

      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 10,
        },
        async (loc) => {
          if (!isMountedRef.current || !loc.coords) return;

          const newCoords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
          };

          setLocation(newCoords);

          // Reverse geocode when moved significantly
          const street = await locationService.reverseGeocode(
            newCoords.latitude,
            newCoords.longitude
          );
          if (isMountedRef.current) {
            setAddress(street);
          }
        }
      );
    } catch (err) {
      console.warn('[useLocation] Watcher error:', err);
      if (isMountedRef.current) {
        setError(err.message);
        setIsWatching(false);
      }
    }
  }, [stopWatching]);

  // Set manual coordinates and address
  const setManualLocation = useCallback(async ({ latitude, longitude, address: customAddress }) => {
    stopWatching(); // stop watcher if manual coordinate chosen
    setLocation({ latitude, longitude });

    if (customAddress) {
      setAddress(customAddress);
    } else {
      const resolved = await locationService.reverseGeocode(latitude, longitude);
      if (isMountedRef.current) {
        setAddress(resolved);
      }
    }
  }, [stopWatching]);

  // Geocode address search
  const searchAddress = useCallback(async (query) => {
    if (!query || query.trim().length < 3) return [];
    try {
      const results = await Location.geocodeAsync(query.trim());
      if (results && results.length > 0) {
        return results.map((r, i) => ({
          id: `${r.latitude}_${r.longitude}_${i}`,
          latitude: r.latitude,
          longitude: r.longitude,
          title: query,
        }));
      }
      return [];
    } catch (e) {
      console.warn('[useLocation] Geocode search error:', e);
      return [];
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (autoTrack) {
      startWatching();
    } else {
      getCurrentPosition();
    }

    // Proper Watcher Cleanup on Unmount
    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, [autoTrack, getCurrentPosition, startWatching, stopWatching]);

  return {
    location,
    address,
    isLocating,
    isWatching,
    error,
    getCurrentPosition,
    startWatching,
    stopWatching,
    setManualLocation,
    searchAddress,
  };
}
