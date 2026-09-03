import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useReports } from '../../context/ReportContext';
import { useTheme } from '../../theme/ThemeContext';
import locationService from '../../services/locationService';
import MapMarker from '../../components/MapMarker';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { getImageUrl, formatDate } from '../../utils/helpers';
import { CATEGORIES } from '../../utils/constants';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MAP_CATEGORIES = [{ id: 'All', label: 'All', icon: 'view-grid-outline' }, ...CATEGORIES];

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef(null);
  const { reports, isLoading, fetchReports } = useReports();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  const [userLocation, setUserLocation] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCategory, setMapCategory] = useState('All');

  // Filter reports with valid coordinates
  const validReports = reports.filter(
    (r) => typeof r.latitude === 'number' && typeof r.longitude === 'number'
  );

  // Filter by selected map category
  const filteredMapReports = mapCategory === 'All'
    ? validReports
    : validReports.filter((r) => r.category === mapCategory);

  useEffect(() => {
    fetchReports({ scope: 'all' });
    locateUser();
  }, []);

  const locateUser = async () => {
    setIsLocating(true);
    try {
      const position = await locationService.getCurrentPosition();
      setUserLocation(position);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: position.latitude,
          longitude: position.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }, 800);
      }
    } catch (err) {
      console.warn('[Map] Could not locate user:', err.message);
    } finally {
      setIsLocating(false);
    }
  };

  const fitAllReports = () => {
    if (filteredMapReports.length === 0 || !mapRef.current) return;

    const coordinates = filteredMapReports.map((r) => ({
      latitude: r.latitude,
      longitude: r.longitude,
    }));

    if (userLocation) {
      coordinates.push({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 80, right: 60, bottom: 120, left: 60 },
      animated: true,
    });
  };

  const initialRegion = filteredMapReports.length > 0
    ? {
        latitude: filteredMapReports[0].latitude,
        longitude: filteredMapReports[0].longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }
    : userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }
    : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1 * ASPECT_RATIO,
      };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedReport(null)}
      >
        {filteredMapReports.map((report) => (
          <Marker
            key={report._id || report.id}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            onPress={() => setSelectedReport(report)}
          >
            <MapMarker
              category={report.category}
              isSelected={selectedReport?._id === report._id}
            />

            <Callout
              tooltip={false}
              onPress={() => router.push(`/report/${report._id || report.id}`)}
            >
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle} numberOfLines={1}>
                  {report.title}
                </Text>
                <Text style={styles.calloutCategory}>{report.category}</Text>
                <View style={styles.calloutStatusRow}>
                  <StatusBadge status={report.status} size="sm" />
                  <Text style={styles.calloutTapHint}>Tap for details ›</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Top Category Filter Bar */}
      <View style={styles.topFilterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {MAP_CATEGORIES.map((cat) => {
            const isSelected = mapCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => setMapCategory(cat.id)}
                style={[
                  styles.mapFilterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.mapFilterText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      fontSize: fontSizes.xs,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Floating Map Action Controls: Recenter & Fit Screen */}
      <View style={styles.floatingControls}>
        {/* Recenter Button (◎) */}
        <TouchableOpacity
          style={[styles.mapButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={locateUser}
          accessibilityLabel="Recenter map to current location"
        >
          <MaterialCommunityIcons
            name={isLocating ? 'crosshairs-gps' : 'crosshairs'}
            size={22}
            color={colors.primary}
          />
        </TouchableOpacity>

        {filteredMapReports.length > 0 && (
          <TouchableOpacity
            style={[styles.mapButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={fitAllReports}
            accessibilityLabel="Fit all issue pins on screen"
          >
            <MaterialCommunityIcons
              name="fit-to-screen-outline"
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Marker Detail Card Peek */}
      {selectedReport && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/report/${selectedReport._id || selectedReport.id}`)}
          style={[
            styles.selectedCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          {selectedReport.imageUrl ? (
            <Image
              source={{ uri: getImageUrl(selectedReport.imageUrl) }}
              style={[styles.selectedThumbnail, { borderRadius: borderRadius.md }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.selectedPlaceholder, { backgroundColor: colors.surfaceSubtle, borderRadius: borderRadius.md }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color={colors.textMuted} />
            </View>
          )}

          <View style={styles.selectedInfo}>
            <View style={styles.selectedTopRow}>
              <StatusBadge status={selectedReport.status} size="sm" />
              <Text style={[styles.selectedDate, { color: colors.textMuted, fontSize: fontSizes.tiny }]}>
                {formatDate(selectedReport.createdAt)}
              </Text>
            </View>

            <Text style={[styles.selectedTitle, { color: colors.textPrimary, fontSize: fontSizes.sm }]} numberOfLines={1}>
              {selectedReport.title}
            </Text>

            <Text style={[styles.selectedAddress, { color: colors.textSecondary, fontSize: fontSizes.xs }]} numberOfLines={1}>
              {selectedReport.address}
            </Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Empty State Overlay */}
      {!isLoading && filteredMapReports.length === 0 && (
        <View style={styles.emptyOverlay}>
          <EmptyState
            icon="map-marker-off-outline"
            title="No Mapped Reports"
            subtitle="No reports found for this area or category."
            buttonTitle="Report an Issue"
            onButtonPress={() => router.push('/report/camera')}
          />
        </View>
      )}

      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
          <LoadingState message="Loading map markers..." />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topFilterBar: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  mapFilterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  mapFilterText: {},
  floatingControls: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    gap: 10,
  },
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedThumbnail: {
    width: 52,
    height: 52,
    marginRight: 10,
  },
  selectedPlaceholder: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  selectedDate: {},
  selectedTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  selectedAddress: {},
  calloutContainer: {
    width: 200,
    padding: 4,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  calloutCategory: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  calloutStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calloutTapHint: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '600',
  },
  emptyOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});
