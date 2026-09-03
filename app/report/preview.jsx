import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from '../../components/CustomButton';
import useToast from '../../hooks/useToast';

export default function PreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { imageUri, mediaType = 'image' } = useLocalSearchParams();
  const toast = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleRetake = () => {
    router.back();
  };

  const handleUsePhoto = () => {
    router.push({
      pathname: '/report/create',
      params: {
        imageUri,
        mediaType,
      },
    });
  };

  // Optional: Save captured media directly to device gallery
  const handleSaveToGallery = async () => {
    if (!imageUri || isSaving || isSaved) return;

    try {
      setIsSaving(true);
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        toast.showError('Permission required to save photo to your gallery.');
        return;
      }

      await MediaLibrary.saveToLibraryAsync(imageUri);
      setIsSaved(true);
      toast.showSuccess(
        mediaType === 'video'
          ? 'Video saved to your Photos gallery!'
          : 'Photo saved to your Photos gallery!'
      );
    } catch (err) {
      console.warn('[MediaLibrary] Save failed:', err);
      toast.showError('Could not save media to device gallery.');
    } finally {
      setIsSaving(false);
    }
  };

  const isVideo = mediaType === 'video';

  return (
    <View style={styles.container}>
      {/* Full Screen Image/Video Poster Preview */}
      {imageUri ? (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          {isVideo && (
            <View style={styles.videoIndicatorOverlay}>
              <MaterialCommunityIcons name="video" size={48} color="#FFFFFF" />
              <Text style={styles.videoIndicatorText}>Video captured successfully</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyPreview}>
          <Text style={styles.emptyText}>No media selected</Text>
        </View>
      )}

      {/* Top Header Overlay */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titlePill}>
          <Text style={styles.titlePillText}>
            {isVideo ? 'Video Review' : 'Photo Review'}
          </Text>
        </View>

        {/* Save to Gallery Button in Top Bar */}
        <TouchableOpacity
          onPress={handleSaveToGallery}
          disabled={isSaving || isSaved}
          style={[styles.saveGalleryButton, isSaved && styles.saveGalleryButtonSaved]}
          accessibilityLabel="Save to device photo gallery"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons
              name={isSaved ? 'check-circle' : 'download'}
              size={18}
              color="#FFFFFF"
            />
          )}
          <Text style={styles.saveGalleryText}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.promptText}>
          {isVideo
            ? 'Does this video clearly show the issue?'
            : 'Does this photograph clearly show the problem?'}
        </Text>

        <View style={styles.buttonRow}>
          <CustomButton
            title="Retake"
            onPress={handleRetake}
            variant="secondary"
            size="lg"
            icon="camera-retake-outline"
            style={styles.retakeButton}
          />

          <CustomButton
            title="Use This File"
            onPress={handleUsePhoto}
            variant="primary"
            size="lg"
            icon="check"
            style={styles.useButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoIndicatorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titlePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  titlePillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  saveGalleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 6,
  },
  saveGalleryButtonSaved: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    borderColor: '#10B981',
  },
  saveGalleryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingTop: 20,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  promptText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  useButton: {
    flex: 1.5,
  },
});
