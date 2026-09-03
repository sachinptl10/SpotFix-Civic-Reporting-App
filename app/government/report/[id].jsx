import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import useToast from '../../../hooks/useToast';
import reportService from '../../../services/reportService';
import StatusBadge from '../../../components/StatusBadge';
import PriorityBadge from '../../../components/PriorityBadge';
import StatusTimeline from '../../../components/StatusTimeline';
import ResolutionProofCard from '../../../components/ResolutionProofCard';
import ReviewActionBar from '../../../components/ReviewActionBar';
import LoadingState from '../../../components/LoadingState';
import ErrorState from '../../../components/ErrorState';
import { formatDate, getImageUrl } from '../../../utils/helpers';
import { CATEGORIES } from '../../../utils/constants';

const PRIORITIES = ['low', 'medium', 'high'];

export default function GovernmentReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();
  const toast = useToast();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportService.getReportById(id);
      if (res && res.report) {
        setReport(res.report);
      }
    } catch (err) {
      console.warn('[GovReportDetail] Load error:', err.message);
      setError(err.message || 'Unable to retrieve report details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Priority Change Action
  const handleSetPriority = async (newPriority) => {
    if (!report || report.priority === newPriority) return;
    try {
      const res = await reportService.setPriority(id, newPriority);
      if (res && res.report) {
        setReport(res.report);
        toast.showSuccess(`Priority set to ${newPriority.toUpperCase()}`);
      }
    } catch (err) {
      toast.showError(err.message || 'Failed to update priority.');
    }
  };

  // Under Review Action
  const handleUnderReview = async () => {
    setIsActionLoading(true);
    try {
      const res = await reportService.markUnderReview(id, 'Issue taken under review by municipal officer.');
      if (res && res.report) {
        setReport(res.report);
        toast.showSuccess('Report is now Under Review.');
      }
    } catch (err) {
      toast.showError(err.message || 'Failed to change review status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Approve Action
  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      const res = await reportService.approveReport(id, 'Civic issue verified and approved for work.');
      if (res && res.report) {
        setReport(res.report);
        toast.showSuccess('Report approved successfully!');
      }
    } catch (err) {
      toast.showError(err.message || 'Failed to approve report.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Reject Action
  const handleReject = async (reason) => {
    setIsActionLoading(true);
    try {
      const res = await reportService.rejectReport(id, reason);
      if (res && res.report) {
        setReport(res.report);
        toast.showSuccess('Report rejected and citizen notified.');
      }
    } catch (err) {
      toast.showError(err.message || 'Failed to reject report.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Resolve Action
  const handleResolve = async ({ note, imageUri }) => {
    setIsActionLoading(true);
    try {
      const res = await reportService.resolveReport(id, { note, imageUri });
      if (res && res.report) {
        setReport(res.report);
        toast.showSuccess('Issue marked as Resolved with proof!');
      }
    } catch (err) {
      toast.showError(err.message || 'Failed to resolve report.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading && !report) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading civic report evidence..." />
      </View>
    );
  }

  if (error && !report) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ErrorState title="Report Error" message={error} onRetry={fetchReport} />
      </View>
    );
  }

  const categoryMeta = CATEGORIES.find((c) => c.id === report?.category) || {
    label: report?.category || 'Civic Issue',
    icon: 'alert-circle-outline',
    color: colors.primary,
  };

  const imageSrc = report?.imageUrl ? { uri: getImageUrl(report.imageUrl) } : null;
  const isVideo = report?.mediaType === 'video';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.surfaceSubtle }]}>
          {imageSrc ? (
            <Image source={imageSrc} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <MaterialCommunityIcons name={categoryMeta.icon} size={60} color={colors.textMuted} />
            </View>
          )}

          {isVideo && (
            <View style={styles.videoBadge}>
              <MaterialCommunityIcons name="play-circle" size={20} color="#FFFFFF" />
              <Text style={styles.videoBadgeText}>Citizen Video Evidence</Text>
            </View>
          )}

          <View style={styles.heroStatusOverlay}>
            <StatusBadge status={report?.status} size="md" />
          </View>
        </View>

        {/* Content Card */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          {/* Reference & Submitter Row */}
          <View style={styles.refRow}>
            <View style={styles.refPill}>
              <MaterialCommunityIcons name="pound" size={14} color="#0284C7" />
              <Text style={styles.refPillText}>
                {report?.reportNumber ? report.reportNumber : `ID: ${report?._id?.slice(-6)}`}
              </Text>
            </View>

            <Text style={[styles.submittedDate, { color: colors.textMuted, fontSize: fontSizes.xs }]}>
              Submitted {formatDate(report?.createdAt)}
            </Text>
          </View>

          {/* Citizen Details */}
          {report?.user?.name && (
            <View style={styles.submitterRow}>
              <MaterialCommunityIcons name="account-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.submitterText, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                Reported by Citizen: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{report.user.name}</Text>
              </Text>
            </View>
          )}

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
            {report?.title}
          </Text>

          {/* Description */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Citizen Statement
          </Text>
          <Text style={[styles.description, { color: colors.textPrimary, fontSize: fontSizes.sm + 1 }]}>
            {report?.description}
          </Text>

          {/* Priority Assignment Selector */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Assign Priority Level
          </Text>
          <View style={styles.prioritySelectorRow}>
            {PRIORITIES.map((p) => {
              const isSelected = (report?.priority || 'medium').toLowerCase() === p;
              const color = p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#10B981';
              return (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.8}
                  onPress={() => handleSetPriority(p)}
                  style={[
                    styles.priorityBtn,
                    {
                      backgroundColor: isSelected ? color : colors.surfaceSubtle,
                      borderColor: isSelected ? color : colors.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityBtnText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                        fontWeight: isSelected ? '800' : '600',
                        fontSize: fontSizes.xs,
                      },
                    ]}
                  >
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Location & Coordinates */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Location & Coordinates
          </Text>
          <View style={[styles.locationBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.danger} style={{ marginRight: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.addressText, { color: colors.textPrimary, fontSize: fontSizes.sm }]}>
                  {report?.address || 'Location coordinates saved'}
                </Text>
                {typeof report?.latitude === 'number' && typeof report?.longitude === 'number' && (
                  <Text style={[styles.coordsText, { color: colors.textMuted, fontSize: fontSizes.xs }]}>
                    {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                  </Text>
                )}
              </View>
            </View>

            {typeof report?.latitude === 'number' && typeof report?.longitude === 'number' && (
              <View style={[styles.mapContainer, { borderRadius: borderRadius.md, borderColor: colors.border }]}>
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
                  />
                </MapView>
              </View>
            )}
          </View>

          {/* Review Note if any */}
          {report?.reviewNote ? (
            <View style={[styles.reviewNoteBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderRadius: borderRadius.md }]}>
              <Text style={styles.reviewNoteTitle}>Official Review Note:</Text>
              <Text style={styles.reviewNoteBody}>{report.reviewNote}</Text>
            </View>
          ) : null}

          {/* Resolution Proof if resolved */}
          {report?.status === 'resolved' && (
            <ResolutionProofCard
              resolvedImageUrl={report.resolvedImageUrl}
              resolutionNote={report.resolutionNote}
              resolvedAt={report.resolvedAt}
              reviewedBy={report.reviewedBy}
            />
          )}

          {/* Audit Trail Timeline */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
            Status History & Audit Trail
          </Text>
          <StatusTimeline
            statusHistory={report?.statusHistory || []}
            currentStatus={report?.status}
          />
        </View>
      </ScrollView>

      {/* Floating Government Action Bar */}
      <ReviewActionBar
        report={report}
        onUnderReview={handleUnderReview}
        onApprove={handleApprove}
        onReject={handleReject}
        onResolve={handleResolve}
        isActionLoading={isActionLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  heroCard: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  heroStatusOverlay: {
    position: 'absolute',
    bottom: 14,
    right: 14,
  },
  detailsCard: {
    margin: 16,
    marginTop: -16,
    borderWidth: 1,
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 2,
  },
  refPillText: {
    color: '#0284C7',
    fontWeight: '800',
    fontSize: 12,
  },
  submittedDate: {
    fontWeight: '500',
  },
  submitterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  submitterText: {},
  title: {
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 10,
  },
  sectionHeading: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  description: {
    lineHeight: 22,
    marginBottom: 10,
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  priorityBtnText: {},
  locationBox: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addressText: {
    fontWeight: '600',
    lineHeight: 18,
  },
  coordsText: {
    marginTop: 2,
  },
  mapContainer: {
    height: 140,
    overflow: 'hidden',
    borderWidth: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  reviewNoteBox: {
    padding: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  reviewNoteTitle: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  reviewNoteBody: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '500',
  },
});
