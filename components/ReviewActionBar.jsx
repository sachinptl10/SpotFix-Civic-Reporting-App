import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import CustomButton from './CustomButton';
import CustomInput from './CustomInput';

export default function ReviewActionBar({
  report,
  onUnderReview,
  onApprove,
  onReject,
  onResolve,
  isActionLoading,
}) {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  // Reject Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Resolve Modal State
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionImageUri, setResolutionImageUri] = useState(null);
  const [resolveError, setResolveError] = useState('');

  const status = (report?.status || 'pending').toLowerCase();

  // Handle Pick Resolution Photo
  const handlePickResolutionPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setResolutionImageUri(result.assets[0].uri);
        setResolveError('');
      }
    } catch (err) {
      console.warn('[ReviewActionBar] ImagePicker error:', err);
    }
  };

  // Submit Reject
  const handleConfirmReject = () => {
    if (!rejectReason || rejectReason.trim().length === 0) {
      setRejectError('A rejection reason is mandatory.');
      return;
    }
    if (rejectReason.trim().length < 5) {
      setRejectError('Reason must be at least 5 characters long.');
      return;
    }

    setRejectModalVisible(false);
    onReject(rejectReason.trim());
    setRejectReason('');
    setRejectError('');
  };

  // Submit Resolve
  const handleConfirmResolve = () => {
    if (!resolutionNote || resolutionNote.trim().length === 0) {
      setResolveError('Please provide a resolution note.');
      return;
    }
    if (!resolutionImageUri) {
      setResolveError('Resolution proof photograph is mandatory.');
      return;
    }

    setResolveModalVisible(false);
    onResolve({
      note: resolutionNote.trim(),
      imageUri: resolutionImageUri,
    });
    setResolutionNote('');
    setResolutionImageUri(null);
    setResolveError('');
  };

  if (status === 'resolved') {
    return (
      <View style={[styles.terminalBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
        <MaterialCommunityIcons name="check-circle" size={18} color="#059669" />
        <Text style={styles.terminalText}>This issue has been successfully resolved.</Text>
      </View>
    );
  }

  if (status === 'rejected') {
    return (
      <View style={[styles.terminalBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
        <MaterialCommunityIcons name="close-circle" size={18} color="#DC2626" />
        <Text style={[styles.terminalText, { color: '#991B1B' }]}>This report was rejected.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* PENDING: Mark Under Review */}
      {status === 'pending' && (
        <CustomButton
          title="Mark Under Review"
          onPress={onUnderReview}
          loading={isActionLoading}
          disabled={isActionLoading}
          variant="primary"
          size="lg"
          icon="progress-clock"
          style={styles.actionBtn}
        />
      )}

      {/* UNDER REVIEW: Approve or Reject */}
      {status === 'under_review' && (
        <View style={styles.buttonRow}>
          <CustomButton
            title="Approve Report"
            onPress={() => onApprove()}
            loading={isActionLoading}
            disabled={isActionLoading}
            variant="primary"
            size="lg"
            icon="check-circle-outline"
            style={[styles.actionBtn, { flex: 1.5 }]}
          />

          <CustomButton
            title="Reject"
            onPress={() => setRejectModalVisible(true)}
            disabled={isActionLoading}
            variant="danger"
            size="lg"
            icon="close-circle-outline"
            style={[styles.actionBtn, { flex: 1 }]}
          />
        </View>
      )}

      {/* APPROVED: Mark Resolved */}
      {status === 'approved' && (
        <CustomButton
          title="Mark as Resolved (Upload Proof)"
          onPress={() => setResolveModalVisible(true)}
          loading={isActionLoading}
          disabled={isActionLoading}
          variant="primary"
          size="lg"
          icon="camera-check-outline"
          style={[styles.actionBtn, { backgroundColor: '#059669' }]}
        />
      )}

      {/* REJECT MODAL */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.xl,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color={colors.danger} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary, fontSize: fontSizes.lg }]}>
                Reject Civic Report?
              </Text>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
              The reporting citizen will receive a formal rejection notification containing this reason.
            </Text>

            <CustomInput
              label="Mandatory Rejection Reason *"
              placeholder="e.g. Duplicate issue already logged; or image does not show reported issue..."
              value={rejectReason}
              onChangeText={(t) => {
                setRejectReason(t);
                if (rejectError) setRejectError('');
              }}
              error={rejectError}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalBtnRow}>
              <CustomButton
                title="Cancel"
                onPress={() => setRejectModalVisible(false)}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <CustomButton
                title="Confirm Reject"
                onPress={handleConfirmReject}
                variant="danger"
                size="md"
                style={{ flex: 1.2 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* RESOLVE MODAL */}
      <Modal
        visible={resolveModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setResolveModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.xl,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#059669" />
              <Text style={[styles.modalTitle, { color: colors.textPrimary, fontSize: fontSizes.lg }]}>
                Submit Resolution Proof
              </Text>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
              Upload a photograph proving the municipal work is complete. The citizen will be notified.
            </Text>

            {/* Resolution Photo Box */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickResolutionPhoto}
              style={[
                styles.resolutionPhotoPicker,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: resolutionImageUri ? '#059669' : colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              {resolutionImageUri ? (
                <Image source={{ uri: resolutionImageUri }} style={styles.resolutionThumb} resizeMode="cover" />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={32} color={colors.primary} />
                  <Text style={[styles.pickerPlaceholderText, { color: colors.primary, fontSize: fontSizes.xs }]}>
                    Select Resolution Photo *
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <CustomInput
              label="Work Resolution Note *"
              placeholder="e.g. Patching complete, asphalt leveled and verified..."
              value={resolutionNote}
              onChangeText={(t) => {
                setResolutionNote(t);
                if (resolveError) setResolveError('');
              }}
              multiline
              numberOfLines={3}
            />

            {resolveError ? (
              <Text style={[styles.errorText, { color: colors.danger, fontSize: fontSizes.xs }]}>
                {resolveError}
              </Text>
            ) : null}

            <View style={styles.modalBtnRow}>
              <CustomButton
                title="Cancel"
                onPress={() => setResolveModalVisible(false)}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
              />
              <CustomButton
                title="Mark Resolved"
                onPress={handleConfirmResolve}
                variant="primary"
                size="md"
                style={{ flex: 1.2, backgroundColor: '#059669' }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: '100%',
  },
  terminalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  terminalText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  modalTitle: {
    fontWeight: '700',
  },
  modalSubtitle: {
    lineHeight: 18,
    marginBottom: 14,
  },
  resolutionPhotoPicker: {
    height: 140,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resolutionThumb: {
    width: '100%',
    height: '100%',
  },
  pickerPlaceholder: {
    alignItems: 'center',
  },
  pickerPlaceholderText: {
    marginTop: 6,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  errorText: {
    fontWeight: '600',
    marginBottom: 8,
  },
});
