import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';

export const PROVIDER_DEFAULT = 'default';
export const PROVIDER_GOOGLE = 'google';

/**
 * Marker component for Web Map
 */
export const Marker = ({
  coordinate,
  title,
  description,
  onPress,
  children,
  pinColor = '#EF4444',
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.webMarkerContainer,
        { transform: [{ translateY: -15 }] },
      ]}
    >
      {children ? (
        children
      ) : (
        <View style={[styles.defaultPin, { backgroundColor: pinColor }]}>
          <Text style={styles.pinText}>📍</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Callout component for Web Map
 */
export const Callout = ({ children, onPress, style }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.calloutBox, style]}>
      {children}
    </TouchableOpacity>
  );
};

/**
 * MapView for Web (react-native-web compatible)
 */
const MapView = forwardRef(
  (
    {
      style,
      initialRegion,
      region,
      onRegionChangeComplete,
      onPress,
      children,
      showsUserLocation,
      showsMyLocationButton,
      ...rest
    },
    ref
  ) => {
    const [currentRegion, setCurrentRegion] = useState(
      region ||
        initialRegion || {
          latitude: 28.6139,
          longitude: 77.209,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
    );

    useEffect(() => {
      if (region) {
        setCurrentRegion(region);
      }
    }, [region?.latitude, region?.longitude]);

    useImperativeHandle(ref, () => ({
      animateToRegion: (newRegion, duration) => {
        if (newRegion) {
          setCurrentRegion(newRegion);
          if (onRegionChangeComplete) {
            onRegionChangeComplete(newRegion);
          }
        }
      },
      fitToCoordinates: (coordinates, options) => {
        if (coordinates && coordinates.length > 0) {
          const first = coordinates[0];
          const newRegion = {
            latitude: first.latitude,
            longitude: first.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          };
          setCurrentRegion(newRegion);
          if (onRegionChangeComplete) {
            onRegionChangeComplete(newRegion);
          }
        }
      },
    }));

    const lat = currentRegion?.latitude || 28.6139;
    const lng = currentRegion?.longitude || 77.209;
    const delta = currentRegion?.latitudeDelta || 0.04;

    const bbox = `${lng - delta},${lat - delta / 2},${lng + delta},${lat + delta / 2}`;
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      bbox
    )}&layer=mapnik&marker=${lat}%2C${lng}`;

    return (
      <View style={[styles.container, style]}>
        {/* Interactive OpenStreetMap Embed for Web */}
        {typeof window !== 'undefined' ? (
          <iframe
            title="Civic Map"
            src={osmUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              pointerEvents: 'auto',
            }}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>🗺️ Civic Map View</Text>
            <Text style={styles.fallbackCoords}>
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Floating Children / Controls */}
        <View style={styles.overlayContainer} pointerEvents="box-none">
          {children}
        </View>
      </View>
    );
  }
);

MapView.displayName = 'WebMapView';

export default MapView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  webMarkerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  defaultPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinText: {
    fontSize: 16,
  },
  calloutBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  fallbackCoords: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});
