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
      {/* 1. Full-screen Camera Viewfinder Layer */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flashMode}
        enableTorch={enableTorch}
        zoom={zoom}
        mode={mode}
      />

      {/* 2. Tap to Focus Overlay */}
      <TouchableWithoutFeedback onPress={handleTapToFocus}>
        <View style={StyleSheet.absoluteFill}>
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

      {/* 3. Foreground Controls Overlay Layer (Always on top with zIndex: 999) */}
      <View
        style={[
          styles.overlayContainer,
          {
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Top Controls Bar */}
        <View style={styles.topControls}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.iconCircleButton}
            accessibilityLabel="Cancel photo capture"
          >
            <MaterialCommunityIcons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Flash / Torch Toggle */}
          <TouchableOpacity
            onPress={toggleFlash}
            style={[styles.iconCircleButton, flashMode !== 'off' && styles.iconCircleActive]}
            accessibilityLabel={`Flash ${flashMode}`}
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
          >
            <Text style={styles.zoomText}>{getZoomLabel()}</Text>
          </TouchableOpacity>

          {/* Flip Camera */}
          <TouchableOpacity
            onPress={toggleCameraFacing}
            style={styles.iconCircleButton}
            accessibilityLabel="Flip camera facing"
          >
            <MaterialCommunityIcons name="camera-flip-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Center / Timer Alert if Recording */}
        {isRecording && (
          <View style={styles.recordingTimerPill}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTimerText}>
              Recording 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:30
            </Text>
          </View>
        )}

        {/* Bottom Bar: Mode Selector & Shutter */}
        <View style={styles.bottomControls}>
          {/* Mode Switcher: Photo / Video */}
          <View style={styles.modeSwitcher}>
            <TouchableOpacity
              onPress={() => setMode('picture')}
              disabled={isRecording}
              style={[styles.modeTab, mode === 'picture' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === 'picture' && styles.modeTabTextActive]}>
                PHOTO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('video')}
              disabled={isRecording}
              style={[styles.modeTab, mode === 'video' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === 'video' && styles.modeTabTextActive]}>
                VIDEO
              </Text>
            </TouchableOpacity>
          </View>

          {/* Shutter Row */}
          <View style={styles.shutterRow}>
            {/* Gallery Pick */}
            <TouchableOpacity
              onPress={handlePickFromGallery}
              disabled={isRecording}
              style={styles.controlWithLabel}
              accessibilityLabel="Pick from photo library"
            >
              <View style={styles.iconCircleButton}>
                <MaterialCommunityIcons name="image-multiple-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.controlLabelText}>Gallery</Text>
            </TouchableOpacity>

            {/* Shutter Button with Camera Icon inside */}
            <TouchableOpacity
              onPress={handleShutterPress}
              disabled={isCapturing}
              activeOpacity={0.8}
              style={[
                styles.shutterOuter,
                mode === 'video' && { borderColor: '#EF4444' },
              ]}
              accessibilityLabel={mode === 'video' ? (isRecording ? 'Stop video' : 'Record video') : 'Take photo'}
            >
              <View
                style={[
                  styles.shutterInner,
                  mode === 'video' && {
                    backgroundColor: '#EF4444',
                    borderRadius: isRecording ? 8 : 30,
                    width: isRecording ? 28 : 58,
                    height: isRecording ? 28 : 58,
                  },
                ]}
              >
                {isCapturing ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : mode === 'picture' ? (
                  <MaterialCommunityIcons name="camera" size={32} color="#1E293B" />
                ) : null}
              </View>
            </TouchableOpacity>

            {/* System Camera Direct Access */}
            <TouchableOpacity
              onPress={handleLaunchSystemCamera}
              disabled={isRecording}
              style={styles.controlWithLabel}
              accessibilityLabel="Switch to system camera app"
            >
              <View style={styles.iconCircleButton}>
                <MaterialCommunityIcons name="camera-iris" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.controlLabelText}>System</Text>
            </TouchableOpacity>
          </View>

          {/* Explicit Helper Text: TAP TO CLICK PHOTO */}
          <View style={styles.tapToSnapBadge}>
            <Text style={styles.tapToSnapText}>
              {mode === 'picture' ? 'TAP WHITE BUTTON TO CLICK PHOTO' : 'TAP RED BUTTON TO RECORD VIDEO'}
            </Text>
          </View>
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 999,
    elevation: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  zoomButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  zoomText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
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
  recordingTimerPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordingTimerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  bottomControls: {
    alignItems: 'center',
    gap: 16,
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 9999,
    padding: 3,
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  modeTabText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeTabTextActive: {
    color: '#0F172A',
  },
  shutterRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryFallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  galleryFallbackText: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  cancelFallback: {
    marginTop: 8,
    padding: 8,
  },
  cancelFallbackText: {
    fontSize: 14,
  },
  controlWithLabel: {
    alignItems: 'center',
    gap: 4,
  },
  controlLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tapToSnapBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 9999,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tapToSnapText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
