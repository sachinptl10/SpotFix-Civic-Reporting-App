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
import { useTheme } from '../../theme/ThemeContext';
import locationService from '../../services/locationService';
import reportService from '../../services/reportService';
import MapMarker from '../../components/MapMarker';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import LoadingState from '../../components/LoadingState';
import { getImageUrl, formatDate } from '../../utils/helpers';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const GOV_STATUS_FILTERS = [
  { id: 'All', label: 'All Reports' },
  { id: 'pending', label: 'Pending' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'resolved', label: 'Resolved' },
];

export default function GovernmentMapScreen() {
  const router = useRouter();
  const mapRef = useRef(null);
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  const [reports, setReports] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    loadReports();
    locateUser();
  }, [selectedStatus]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const params = {
        limit: 100,
        status: selectedStatus === 'All' ? undefined : selectedStatus,
      };
      const res = await reportService.getReports(params);
      if (res && res.reports) {
        setReports(res.reports);
      }
    } catch (err) {
      console.warn('[GovMap] Load error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const locateUser = async () => {
    setIsLocating(true);
    try {
      const pos = await locationService.getCurrentPosition();
      setUserLocation(pos);
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: pos.latitude,
          longitude: pos.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }, 800);
      }
    } catch (err) {
      console.warn('[GovMap] Location error:', err.message);
    } finally {
      setIsLocating(false);
    }
  };

  const validReports = reports.filter(
    (r) => typeof r.latitude === 'number' && typeof r.longitude === 'number'
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: 28.6139,
          longitude: 77.2090,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1 * ASPECT_RATIO,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedReport(null)}
      >
        {validReports.map((report) => (
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
              onPress={() => router.push(`/government/report/${report._id || report.id}`)}
            >
              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle} numberOfLines={1}>
                  {report.reportNumber ? `#${report.reportNumber} ` : ''}{report.title}
                </Text>
                <View style={styles.calloutMetaRow}>
                  <StatusBadge status={report.status} size="sm" />
                  <PriorityBadge priority={report.priority} size="sm" />
                </View>
                <Text style={styles.calloutTapHint}>Tap to open review ›</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Top Filter Chips */}
      <View style={styles.topFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {GOV_STATUS_FILTERS.map((f) => {
            const isSelected = selectedStatus === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                activeOpacity={0.8}
                onPress={() => setSelectedStatus(f.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? '#0284C7' : colors.surface,
                    borderColor: isSelected ? '#0284C7' : colors.border,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      fontSize: fontSizes.xs,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Floating Recenter Button */}
      <TouchableOpacity
        style={[styles.recenterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={locateUser}
        accessibilityLabel="Recenter map"
      >
        <MaterialCommunityIcons
          name={isLocating ? 'crosshairs-gps' : 'crosshairs'}
          size={24}
          color="#0284C7"
        />
      </TouchableOpacity>

      {/* Selected Marker Detail Card */}
      {selectedReport && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/government/report/${selectedReport._id || selectedReport.id}`)}
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
              style={[styles.thumbnail, { borderRadius: borderRadius.md }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.surfaceSubtle, borderRadius: borderRadius.md }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color={colors.textMuted} />
            </View>
          )}

          <View style={styles.selectedInfo}>
            <View style={styles.selectedBadgeRow}>
              <StatusBadge status={selectedReport.status} size="sm" />
              <PriorityBadge priority={selectedReport.priority} size="sm" />
            </View>
            <Text style={[styles.selectedTitle, { color: colors.textPrimary, fontSize: fontSizes.sm }]} numberOfLines={1}>
              {selectedReport.reportNumber ? `#${selectedReport.reportNumber} ` : ''}{selectedReport.title}
            </Text>
            <Text style={[styles.selectedAddress, { color: colors.textSecondary, fontSize: fontSizes.xs }]} numberOfLines={1}>
              {selectedReport.address}
            </Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {isLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
          <ActivityIndicator size="small" color="#0284C7" />
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
    top: 14,
    left: 0,
    right: 0,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterChipText: {},
  recenterBtn: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 76,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  thumbnail: {
    width: 52,
    height: 52,
    marginRight: 10,
  },
  placeholder: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  selectedTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  selectedAddress: {},
  calloutBox: {
    width: 200,
    padding: 4,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  calloutMetaRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  calloutTapHint: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    padding: 10,
    elevation: 4,
  },
});
