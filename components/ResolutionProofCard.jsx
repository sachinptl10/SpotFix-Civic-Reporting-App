import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { formatDate, getImageUrl } from '../utils/helpers';

export default function ResolutionProofCard({
  resolvedImageUrl,
  resolutionNote,
  resolvedAt,
  reviewedBy,
}) {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  if (!resolvedImageUrl && !resolutionNote && !resolvedAt) {
    return null;
  }

  const imageSrc = resolvedImageUrl ? { uri: getImageUrl(resolvedImageUrl) } : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: '#10B981',
          borderRadius: borderRadius.xl,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
      ]}
    >
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="check-decagram" size={16} color="#059669" />
          <Text style={styles.badgeText}>Official Resolution Proof</Text>
        </View>

        {resolvedAt && (
          <Text style={[styles.dateText, { color: colors.textMuted, fontSize: fontSizes.xs }]}>
            Resolved on {formatDate(resolvedAt)}
          </Text>
        )}
      </View>

      {/* Resolution Photo */}
      {imageSrc && (
        <View style={[styles.imageContainer, { borderRadius: borderRadius.lg, backgroundColor: colors.surfaceSubtle }]}>
          <Image source={imageSrc} style={styles.image} resizeMode="cover" />
          <View style={styles.verifiedWatermark}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#FFFFFF" />
            <Text style={styles.watermarkText}>Municipal Work Complete</Text>
          </View>
        </View>
      )}

      {/* Resolution Note */}
      {resolutionNote ? (
        <View style={[styles.noteBox, { backgroundColor: '#ECFDF5', borderRadius: borderRadius.md }]}>
          <Text style={styles.noteTitle}>Municipal Official's Work Summary:</Text>
          <Text style={styles.noteBody}>{resolutionNote}</Text>
        </View>
      ) : null}

      {reviewedBy?.name && (
        <Text style={[styles.resolvedBy, { color: colors.textMuted, fontSize: fontSizes.tiny }]}>
          Verified by: {reviewedBy.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
  },
  badgeText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 12,
  },
  dateText: {
    fontWeight: '500',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  verifiedWatermark: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  watermarkText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  noteBox: {
    padding: 10,
    marginBottom: 6,
  },
  noteTitle: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  noteBody: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  resolvedBy: {
    fontStyle: 'italic',
    textAlign: 'right',
  },
});
