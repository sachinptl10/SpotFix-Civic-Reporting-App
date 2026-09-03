import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useReports } from '../../context/ReportContext';
import { useTheme } from '../../theme/ThemeContext';
import useToast from '../../hooks/useToast';
import reportService from '../../services/reportService';
import StatusBadge from '../../components/StatusBadge';
import CustomButton from '../../components/CustomButton';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { formatDate, getImageUrl } from '../../utils/helpers';
import { CATEGORIES } from '../../utils/constants';

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { deleteReportFromState, reports } = useReports();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();
  const toast = useToast();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cached = reports.find((r) => (r._id || r.id) === id);
    if (cached) {
      setReport(cached);
      setIsLoading(false);
    }
    loadReportDetails();
  }, [id]);

  const loadReportDetails = async () => {
    try {
      const response = await reportService.getReportById(id);
      if (response && response.report) {
        setReport(response.report);
      }
    } catch (err) {
      console.warn('[ReportDetails] Error loading details:', err.message);
      if (!report) {
        setError(err.message || 'Unable to retrieve report information.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/edit/${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Report?',
      'Are you sure you want to permanently delete this report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ],
      { cancelable: true }
    );
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await reportService.deleteReport(id);
      deleteReportFromState(id);
      toast.showSuccess('Report deleted successfully.');
      router.replace('/(tabs)/home');
    } catch (err) {
      console.warn('[ReportDetails] Delete error:', err.message);
      toast.showError(err.message || 'Could not delete report.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && !report) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading report details..." />
      </View>
    );
  }

  if (error && !report) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Report Not Found"
          message={error}
          onRetry={loadReportDetails}
        />
      </View>
    );
  }

  const categoryMeta = CATEGORIES.find((c) => c.id === report?.category) || {
    label: report?.category || 'Civic Issue',
    icon: 'alert-circle-outline',
    color: colors.primary,
  };

  const isVideo = report?.mediaType === 'video';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Large Hero Image */}
      <View style={[styles.heroImageContainer, { backgroundColor: colors.surfaceSubtle }]}>
        {report?.imageUrl ? (
          <Image
            source={{ uri: getImageUrl(report.imageUrl) }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons
              name={categoryMeta.icon}
              size={60}
              color={colors.textMuted}
            />
          </View>
        )}

        {/* Video Overlay Indicator */}
        {isVideo && (
          <View style={styles.videoBadge}>
            <MaterialCommunityIcons name="play-circle" size={24} color="#FFFFFF" />
            <Text style={styles.videoBadgeText}>Civic Video Attachment</Text>
          </View>
        )}

        <View style={styles.heroBadgeOverlay}>
          <StatusBadge status={report?.status} size="md" />
        </View>
      </View>

      {/* Main Details Card */}
      <View
        style={[
          styles.detailsCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
            padding: spacing.lg,
          },
        ]}
      >
        {/* Category & Date */}
        <View style={styles.metaRow}>
          <View style={[styles.categoryTag, { backgroundColor: colors.surfaceSubtle, borderRadius: borderRadius.full }]}>
            <MaterialCommunityIcons
              name={categoryMeta.icon}
              size={16}
              color={categoryMeta.color}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.categoryText, { color: categoryMeta.color, fontSize: fontSizes.xs }]}>
              {categoryMeta.label}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textMuted, fontSize: fontSizes.xs }]}>
            {formatDate(report?.createdAt)}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
          {report?.title}
        </Text>

        {/* Description */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
          Description
        </Text>
        <Text style={[styles.descriptionText, { color: colors.textPrimary, fontSize: fontSizes.sm + 1 }]}>
          {report?.description}
        </Text>

        {/* Location Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
          Incident Location
        </Text>
        <View style={[styles.locationContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
          <View style={styles.addressRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color={colors.danger}
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.addressText, { color: colors.textPrimary, fontSize: fontSizes.sm }]}>
                {report?.address || 'Location Saved'}
              </Text>
              {typeof report?.latitude === 'number' && typeof report?.longitude === 'number' && (
                <Text style={[styles.coordsText, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                  Coordinates: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                </Text>
              )}
            </View>
          </View>

          {/* Interactive Mini Map */}
          {typeof report?.latitude === 'number' && typeof report?.longitude === 'number' && (
            <View style={[styles.mapWrapper, { borderRadius: borderRadius.md, borderColor: colors.border }]}>
              <MapView
                provider={PROVIDER_DEFAULT}
                style={styles.map}
                initialRegion={{
                  latitude: report.latitude,
                  longitude: report.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: report.latitude,
                    longitude: report.longitude,
                  }}
                  title={report.title}
                  description={report.address}
                />
              </MapView>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons: Edit and Delete */}
      <View style={[styles.buttonRow, { paddingHorizontal: spacing.lg, gap: spacing.sm }]}>
        <CustomButton
          title="Edit Report"
          onPress={handleEdit}
          variant="secondary"
          size="lg"
          icon="pencil-outline"
          style={styles.editButton}
        />

        <CustomButton
          title="Delete"
          onPress={handleDelete}
          loading={isDeleting}
          disabled={isDeleting}
          variant="danger"
          size="lg"
          icon="trash-can-outline"
          style={styles.deleteButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  heroImageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBadgeOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  videoBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 6,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsCard: {
    marginTop: -16,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontWeight: '700',
  },
  dateText: {},
  title: {
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 14,
  },
  sectionHeading: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  descriptionText: {
    lineHeight: 22,
    marginBottom: 16,
  },
  locationContainer: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addressText: {
    fontWeight: '600',
    lineHeight: 20,
  },
  coordsText: {
    marginTop: 2,
  },
  mapWrapper: {
    height: 160,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  editButton: {
    flex: 2,
  },
  deleteButton: {
    flex: 1.2,
  },
});
