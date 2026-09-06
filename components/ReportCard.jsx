import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { formatDate, getImageUrl, truncateText } from '../utils/helpers';
import { CATEGORIES } from '../utils/constants';
import { useTheme } from '../theme/ThemeContext';

export default function ReportCard({ report, onPress, showPriority = true }) {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  if (!report) return null;

  const categoryMeta = CATEGORIES.find((c) => c.id === report.category) || {
    label: report.category || 'Civic Issue',
    icon: 'alert-circle-outline',
    color: colors.primary,
  };

  const imageSource = report.imageUrl ? { uri: getImageUrl(report.imageUrl) } : null;
  const isVideo = report.mediaType === 'video';
  const reportRef = report.reportNumber ? `#${report.reportNumber}` : '';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Report: ${report.title}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: borderRadius.md,
          marginBottom: spacing.md,
        },
      ]}
    >
      {/* Evidence Thumbnail with Clear Overlays */}
      <View style={[styles.imageContainer, { backgroundColor: colors.surfaceSubtle }]}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: colors.surfaceSubtle }]}>
            <MaterialCommunityIcons
              name={categoryMeta.icon}
              size={36}
              color={colors.textMuted}
            />
          </View>
        )}

        {/* Video format badge */}
        {isVideo && (
          <View style={styles.videoBadge}>
            <MaterialCommunityIcons name="video" size={14} color="#FFFFFF" />
            <Text style={styles.videoBadgeText}>Video Clip</Text>
          </View>
        )}

        {/* Status Badge overlay */}
        <View style={styles.statusBadgeOverlay}>
          <StatusBadge status={report.status} size="sm" />
        </View>

        {/* Priority Badge overlay */}
        {showPriority && report.priority && (
          <View style={styles.priorityBadgeOverlay}>
            <PriorityBadge priority={report.priority} size="sm" />
          </View>
        )}
      </View>

      {/* Card Content Ledger */}
      <View style={[styles.content, { padding: spacing.md }]}>
        {/* Header Row: Category Badge & Ticket Reference */}
        <View style={styles.topRow}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <MaterialCommunityIcons
              name={categoryMeta.icon}
              size={13}
              color={categoryMeta.color}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.categoryLabel, { color: colors.textPrimary, fontSize: fontSizes.xs }]}>
              {categoryMeta.label}
            </Text>
          </View>

          {reportRef ? (
            <View style={[styles.ticketBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <Text style={[styles.ticketText, { color: colors.textSecondary, fontSize: fontSizes.tiny }]}>
                {reportRef}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Report Title */}
        <Text
          style={[
            styles.title,
            {
              color: colors.textPrimary,
              fontSize: fontSizes.md,
            },
          ]}
          numberOfLines={1}
        >
          {report.title}
        </Text>

        {/* Description snippet */}
        <Text
          style={[
            styles.description,
            {
              color: colors.textSecondary,
              fontSize: fontSizes.sm,
            },
          ]}
          numberOfLines={2}
        >
          {truncateText(report.description, 110)}
        </Text>

        {/* Metadata Footer: Address & Clean Date */}
        <View
          style={[
            styles.footerRow,
            {
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.locationGroup}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={14}
              color={colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.addressText,
                {
                  color: colors.textSecondary,
                  fontSize: fontSizes.xs,
                },
              ]}
              numberOfLines={1}
            >
              {report.address || 'Geotagged coordinates recorded'}
            </Text>
          </View>

          <Text
            style={[
              styles.dateText,
              {
                color: colors.textMuted,
                fontSize: fontSizes.tiny,
              },
            ]}
          >
            {formatDate(report.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  priorityBadgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {},
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 4,
  },
  categoryLabel: {
    fontWeight: '600',
  },
  ticketBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderRadius: 4,
  },
  ticketText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  description: {
    lineHeight: 20,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 9,
    borderTopWidth: 1,
  },
  locationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  addressText: {
    flex: 1,
  },
  dateText: {
    fontWeight: '500',
  },
});
