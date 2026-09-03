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
    label: report.category || 'Other',
    icon: 'alert-circle-outline',
    color: colors.primary,
  };

  const imageSource = report.imageUrl ? { uri: getImageUrl(report.imageUrl) } : null;
  const isVideo = report.mediaType === 'video';
  const reportRef = report.reportNumber ? `#${report.reportNumber}` : '';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Report: ${report.title}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          marginBottom: spacing.md,
        },
      ]}
    >
      {/* Thumbnail */}
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

        {/* Video indicator badge */}
        {isVideo && (
          <View style={styles.videoBadge}>
            <MaterialCommunityIcons name="play-circle" size={16} color="#FFFFFF" />
            <Text style={styles.videoBadgeText}>Video</Text>
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

      {/* Card Content */}
      <View style={[styles.content, { padding: spacing.md }]}>
        {/* Report ID & Date Row */}
        <View style={styles.topRow}>
          <View style={styles.categoryPill}>
            <MaterialCommunityIcons
              name={categoryMeta.icon}
              size={14}
              color={categoryMeta.color}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.categoryLabel, { color: categoryMeta.color, fontSize: fontSizes.xs }]}>
              {categoryMeta.label}
            </Text>
          </View>

          <View style={styles.dateAndRefRow}>
            {reportRef ? (
              <Text style={[styles.refText, { color: colors.primary, fontSize: fontSizes.xs }]}>
                {reportRef}
              </Text>
            ) : null}
            <Text style={[styles.dateText, { color: colors.textMuted, fontSize: fontSizes.xs }]}>
              • {formatDate(report.createdAt)}
            </Text>
          </View>
        </View>

        {/* Title */}
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
          {truncateText(report.description, 100)}
        </Text>

        {/* Address footer */}
        <View
          style={[
            styles.addressRow,
            {
              borderTopColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={14}
            color={colors.textSecondary}
            style={styles.locationIcon}
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
            {report.address || 'Location coordinates saved'}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {},
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLabel: {
    fontWeight: '700',
  },
  dateAndRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refText: {
    fontWeight: '800',
  },
  dateText: {},
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    lineHeight: 20,
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  locationIcon: {
    marginRight: 4,
  },
  addressText: {
    flex: 1,
  },
});
