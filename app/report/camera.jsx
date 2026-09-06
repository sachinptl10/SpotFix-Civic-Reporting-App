import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PermissionCard from '../../components/PermissionCard';
import { useTheme } from '../../theme/ThemeContext';

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [flashMode, setFlashMode] = useState('off'); // 'off' | 'on' | 'auto'
  const [enableTorch, setEnableTorch] = useState(false);
  const [zoom, setZoom] = useState(0); // 0 to 1
  const [mode, setMode] = useState('picture'); // 'picture' | 'video'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  // Focus Indicator State
  const [focusPoint, setFocusPoint] = useState(null);
  const focusAnim = useRef(new Animated.Value(1)).current;
  const focusOpacity = useRef(new Animated.Value(0)).current;

  // Recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 30) {
            // Auto stop at 30 seconds max
            stopVideoRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Flash toggle: off -> on -> auto -> off
  const toggleFlash = () => {
    if (flashMode === 'off') {
      setFlashMode('on');
      setEnableTorch(true);
    } else if (flashMode === 'on') {
      setFlashMode('auto');
      setEnableTorch(false);
    } else {
      setFlashMode('off');
      setEnableTorch(false);
    }
  };

  // Zoom control steps: 0 (1x) -> 0.25 (2x) -> 0.5 (3x)
  const cycleZoom = () => {
    if (zoom === 0) setZoom(0.25);
    else if (zoom === 0.25) setZoom(0.5);
    else setZoom(0);
  };

  const getZoomLabel = () => {
    if (zoom === 0) return '1x';
    if (zoom === 0.25) return '2x';
    return '3x';
  };

  // Tap-to-Focus Handler
  const handleTapToFocus = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    setFocusPoint({ x: locationX, y: locationY });

    focusAnim.setValue(1.5);
    focusOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(focusAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(focusOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setFocusPoint(null);
    });
  };

  // Capture Photo
  const handleCapturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        router.push({
          pathname: '/report/preview',
          params: {
            imageUri: photo.uri,
            mediaType: 'image',
          },
        });
      }
    } catch (err) {
      console.warn('[Camera] Take picture error:', err);
      Alert.alert('Capture Error', 'Could not take photograph. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Record Short Video
  const startVideoRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 30,
        quality: '720p',
      });

      if (video && video.uri) {
        router.push({
          pathname: '/report/preview',
          params: {
            imageUri: video.uri,
            mediaType: 'video',
          },
        });
      }
    } catch (err) {
      console.warn('[Camera] Video recording error:', err);
      Alert.alert('Video Error', 'Could not record video.');
    } finally {
      setIsRecording(false);
    }
  };

  const stopVideoRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  // Shutter Action depending on Mode
  const handleShutterPress = () => {
    if (mode === 'video') {
      if (isRecording) {
        stopVideoRecording();
      } else {
        startVideoRecording();
      }
    } else {
      handleCapturePhoto();
    }
  };

  // Flip Camera
  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Gallery Fallback
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mode === 'video' ? ['videos'] : ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVid = asset.type === 'video';
        router.push({
          pathname: '/report/preview',
          params: {
            imageUri: asset.uri,
            mediaType: isVid ? 'video' : 'image',
          },
        });
      }
    } catch (err) {
      console.warn('[ImagePicker] Error:', err);
    }
  };

  // Launch system camera directly (works universally even if CameraView has issues)
  const handleLaunchSystemCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
        mediaTypes: ['images'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        router.push({
          pathname: '/report/preview',
          params: {
            imageUri: asset.uri,
            mediaType: 'image',
          },
        });
      }
    } catch (err) {
      console.warn('[Camera] System camera error:', err);
      Alert.alert('Camera Error', 'Could not open system camera.');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background, padding: 20 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, marginVertical: 12 }]}>
          Initializing camera...
        </Text>
        <TouchableOpacity
          onPress={handleLaunchSystemCamera}
          style={[styles.galleryFallbackButton, { marginTop: 16 }]}
        >
          <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
          <Text style={[styles.galleryFallbackText, { color: colors.primary }]}>
            Open System Camera Directly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePickFromGallery} style={styles.galleryFallbackButton}>
          <MaterialCommunityIcons name="image-outline" size={20} color={colors.primary} />
          <Text style={[styles.galleryFallbackText, { color: colors.primary }]}>
            Or pick from Photo Gallery
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelFallback}>
          <Text style={[styles.cancelFallbackText, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <PermissionCard
          icon="camera-off-outline"
          title="Camera Access Required"
          description="SpotFix requires camera permission to capture photographs or short videos of civic problems."
          onRequestPermission={requestPermission}
          buttonTitle="Allow Camera Access"
        />

        <TouchableOpacity onPress={handleLaunchSystemCamera} style={styles.galleryFallbackButton}>
          <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
          <Text style={[styles.galleryFallbackText, { color: colors.primary }]}>
            Open System Camera Directly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePickFromGallery} style={styles.galleryFallbackButton}>
          <MaterialCommunityIcons name="image-outline" size={20} color={colors.primary} />
          <Text style={[styles.galleryFallbackText, { color: colors.primary }]}>
            Or pick from Photo Gallery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCancel} style={styles.cancelFallback}>
          <Text style={[styles.cancelFallbackText, { color: colors.textSecondary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      {/* 1. Full-screen Camera Viewfinder Layer */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flashMode}
        enableTorch={enableTorch}
        zoom={zoom}
        mode={mode}
      />

      {/* 2. Tap to Focus Overlay */}
      <TouchableWithoutFeedback onPress={handleTapToFocus}>
        <View style={StyleSheet.absoluteFillObject}>
          {focusPoint && (
            <Animated.View
              style={[
                styles.focusBox,
                {
                  left: focusPoint.x - 30,
                  top: focusPoint.y - 30,
                  transform: [{ scale: focusAnim }],
                  opacity: focusOpacity,
                },
              ]}
            >
              <View style={styles.focusCornerTL} />
              <View style={styles.focusCornerTR} />
              <View style={styles.focusCornerBL} />
              <View style={styles.focusCornerBR} />
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* 3. Pinned Top Header Bar (Fixed to Top) */}
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 8 },
        ]}
      >
        {/* Close Button */}
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.topIconButton}
          accessibilityLabel="Cancel photo capture"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Flash Toggle */}
        <TouchableOpacity
          onPress={toggleFlash}
          style={[styles.topIconButton, flashMode !== 'off' && styles.topIconButtonActive]}
          accessibilityLabel={`Flash ${flashMode}`}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={
              flashMode === 'on'
                ? 'flash'
                : flashMode === 'auto'
                ? 'flash-auto'
                : 'flash-off'
            }
            size={22}
            color={flashMode !== 'off' ? '#FBBF24' : '#FFFFFF'}
          />
        </TouchableOpacity>

        {/* Zoom Step Button */}
        <TouchableOpacity
          onPress={cycleZoom}
          style={styles.zoomButton}
          accessibilityLabel={`Zoom ${getZoomLabel()}`}
          activeOpacity={0.7}
        >
          <Text style={styles.zoomText}>{getZoomLabel()}</Text>
        </TouchableOpacity>

        {/* Flip Camera Facing */}
        <TouchableOpacity
          onPress={toggleCameraFacing}
          style={styles.topIconButton}
          accessibilityLabel="Flip camera"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="camera-flip-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 4. Floating Recording Pill (Active during video recording) */}
      {isRecording && (
        <View style={[styles.recordingPill, { top: insets.top + 68 }]}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>
            REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:30
          </Text>
        </View>
      )}

      {/* 5. Pinned Universal Camera Footer Dock (Fixed to Bottom) */}
      <View
        style={[
          styles.footerDock,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
      >
        {/* Mode Switcher: PHOTO | VIDEO */}
        <View style={styles.modeSwitcherRow}>
          <TouchableOpacity
            onPress={() => setMode('picture')}
            disabled={isRecording}
            style={styles.modeTab}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'picture' && styles.modeTabTextActive,
              ]}
            >
              PHOTO
            </Text>
            {mode === 'picture' && <View style={styles.modeActiveDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode('video')}
            disabled={isRecording}
            style={styles.modeTab}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeTabText,
                mode === 'video' && styles.modeTabTextActive,
              ]}
            >
              VIDEO
            </Text>
            {mode === 'video' && <View style={styles.modeActiveDot} />}
          </TouchableOpacity>
        </View>

        {/* Shutter & Side Controls Row */}
        <View style={styles.shutterRow}>
          {/* Gallery Button */}
          <TouchableOpacity
            onPress={handlePickFromGallery}
            disabled={isRecording}
            style={styles.sideControlCol}
            accessibilityLabel="Pick from photo gallery"
            activeOpacity={0.7}
          >
            <View style={styles.sideCircleButton}>
              <MaterialCommunityIcons name="image-multiple" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.sideControlLabel}>Gallery</Text>
          </TouchableOpacity>

          {/* Universal Shutter Button */}
          <TouchableOpacity
            onPress={handleShutterPress}
            disabled={isCapturing}
            activeOpacity={0.85}
            style={[
              styles.shutterOuterRing,
              mode === 'video' && styles.shutterOuterRingVideo,
            ]}
            accessibilityLabel={
              mode === 'video'
                ? isRecording
                  ? 'Stop recording video'
                  : 'Start recording video'
                : 'Capture photograph'
            }
          >
            <View
              style={[
                styles.shutterInnerDisc,
                mode === 'video' && styles.shutterInnerDiscVideo,
                isRecording && styles.shutterInnerDiscRecording,
              ]}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color="#1E293B" />
              ) : mode === 'picture' ? (
                <MaterialCommunityIcons name="camera" size={32} color="#1E293B" />
              ) : null}
            </View>
          </TouchableOpacity>

          {/* System Camera Direct Access */}
          <TouchableOpacity
            onPress={handleLaunchSystemCamera}
            disabled={isRecording}
            style={styles.sideControlCol}
            accessibilityLabel="Open system camera directly"
            activeOpacity={0.7}
          >
            <View style={styles.sideCircleButton}>
              <MaterialCommunityIcons name="camera-iris" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.sideControlLabel}>System</Text>
          </TouchableOpacity>
        </View>

        {/* Helper Guidance Badge */}
        <View style={styles.hintBadge}>
          <Text style={styles.hintBadgeText}>
            {mode === 'picture'
              ? 'TAP SHUTTER TO CLICK PHOTO'
              : isRecording
              ? 'RECORDING • TAP RED BUTTON TO STOP'
              : 'TAP RED BUTTON TO RECORD VIDEO'}
          </Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  galleryFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  galleryFallbackText: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  cancelFallback: {
    marginTop: 16,
    padding: 8,
  },
  cancelFallbackText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Focus Ring
  focusBox: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderColor: '#FBBF24',
    borderWidth: 1.5,
  },
  focusCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 8,
    height: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FBBF24',
  },
  focusCornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FBBF24',
  },
  focusCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 8,
    height: 8,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FBBF24',
  },
  focusCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 8,
    height: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FBBF24',
  },

  // Fixed Top Header Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topIconButtonActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    borderWidth: 1.5,
    borderColor: '#FBBF24',
  },
  zoomButton: {
    minWidth: 46,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // Floating Recording Pill
  recordingPill: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordingText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Pinned Bottom Universal Camera Footer Dock
  footerDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 16,
    alignItems: 'center',
  },

  // Mode Switcher (PHOTO | VIDEO)
  modeSwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    marginBottom: 16,
  },
  modeTab: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modeTabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  modeTabTextActive: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  modeActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FBBF24',
    marginTop: 4,
  },

  // Shutter & Controls Row
  shutterRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  sideControlCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  sideCircleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideControlLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // Universal Shutter Button
  shutterOuterRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterOuterRingVideo: {
    borderColor: '#EF4444',
  },
  shutterInnerDisc: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInnerDiscVideo: {
    backgroundColor: '#EF4444',
  },
  shutterInnerDiscRecording: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },

  // Helper Hint Badge
  hintBadge: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  hintBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
