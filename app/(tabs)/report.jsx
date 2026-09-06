import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeContext';
import useToast from '../../hooks/useToast';

export default function TabReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();
  const toast = useToast();
  const [isLaunchingPicker, setIsLaunchingPicker] = useState(false);

  // Direct Camera Photo Capture
  const handleTakePhoto = async () => {
    try {
      setIsLaunchingPicker(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Access Needed',
          'SpotFix requires camera access to capture photographs of civic issues.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Pro Viewfinder',
              onPress: () => router.push('/report/camera'),
            },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        mediaTypes: ['images'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        router.push({
          pathname: '/report/create',
          params: {
            imageUri: photo.uri,
            mediaType: 'image',
          },
        });
      }
    } catch (err) {
      console.warn('[TabReport] Camera error:', err);
      toast.showError('Could not launch camera. Opening Viewfinder...');
      router.push('/report/camera');
    } finally {
      setIsLaunchingPicker(false);
    }
  };

  // Pick from Photo Gallery
  const handlePickFromGallery = async () => {
    try {
      setIsLaunchingPicker(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        router.push({
          pathname: '/report/create',
          params: {
            imageUri: asset.uri,
            mediaType: isVideo ? 'video' : 'image',
          },
        });
      }
    } catch (err) {
      console.warn('[TabReport] Gallery error:', err);
      toast.showError('Could not open photo gallery.');
    } finally {
      setIsLaunchingPicker(false);
    }
  };

  // Live Camera Viewfinder
  const handleOpenLiveCamera = () => {
    router.push('/report/camera');
  };

  // Directly open form
  const handleOpenFormDirectly = () => {
    router.push('/report/create');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Banner */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceSubtle }]}>
          <MaterialCommunityIcons name="camera-iris" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.mainTitle, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
          Click Photo to Report Issue
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.sm }]}>
          Spot a pothole, broken streetlight, or garbage dump? Capture high-clarity photo evidence to dispatch municipal repair crews.
        </Text>
      </View>

      {/* Primary Capture Action Cards */}
      <View style={styles.actionsContainer}>
        {/* Button 1: Direct Photo Capture */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleTakePhoto}
          disabled={isLaunchingPicker}
          style={[
            styles.actionCard,
            styles.primaryActionCard,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View style={styles.actionCardLeft}>
            <View style={styles.primaryActionIconBox}>
              <MaterialCommunityIcons name="camera" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={styles.primaryActionTitle}>Take Photo of Spot</Text>
              <Text style={styles.primaryActionDesc}>
                Open camera immediately to snap the civic issue
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Button 2: Choose from Gallery */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePickFromGallery}
          disabled={isLaunchingPicker}
          style={[
            styles.actionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View style={styles.actionCardLeft}>
            <View style={[styles.secondaryActionIconBox, { backgroundColor: colors.surfaceSubtle }]}>
              <MaterialCommunityIcons name="image-multiple-outline" size={26} color={colors.primary} />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={[styles.secondaryActionTitle, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
                Choose from Gallery
              </Text>
              <Text style={[styles.secondaryActionDesc, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                Select an existing photo or video from device
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Button 3: Live Viewfinder / Video */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenLiveCamera}
          style={[
            styles.actionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View style={styles.actionCardLeft}>
            <View style={[styles.secondaryActionIconBox, { backgroundColor: colors.surfaceSubtle }]}>
              <MaterialCommunityIcons name="video-outline" size={26} color="#0284C7" />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={[styles.secondaryActionTitle, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
                Pro Camera & Video
              </Text>
              <Text style={[styles.secondaryActionDesc, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                Full-screen viewfinder with zoom & short video
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Button 4: Report Form Directly */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenFormDirectly}
          style={[
            styles.actionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <View style={styles.actionCardLeft}>
            <View style={[styles.secondaryActionIconBox, { backgroundColor: colors.surfaceSubtle }]}>
              <MaterialCommunityIcons name="file-document-edit-outline" size={26} color="#16A34A" />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={[styles.secondaryActionTitle, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
                Fill Report Details First
              </Text>
              <Text style={[styles.secondaryActionDesc, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                Enter description & GPS location, then attach photo
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Photography Guidance Card */}
      <View
        style={[
          styles.tipsCard,
          {
            backgroundColor: colors.surfaceSubtle,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
            padding: spacing.md,
          },
        ]}
      >
        <View style={styles.tipsHeaderRow}>
          <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#D97706" />
          <Text style={[styles.tipsHeader, { color: colors.textPrimary, fontSize: fontSizes.sm }]}>
            Tips for Rapid Municipal Resolution
          </Text>
        </View>
        <Text style={[styles.tipItem, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
          • <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Clear View:</Text> Capture the defect from 5-10 feet away in daylight.
        </Text>
        <Text style={[styles.tipItem, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
          • <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Street Context:</Text> Include a nearby landmark or street sign if possible.
        </Text>
        <Text style={[styles.tipItem, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
          • <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Safety First:</Text> Do not step into active high-speed traffic to photograph.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerCard: {
    borderWidth: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainTitle: {
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsContainer: {
    width: '100%',
  },
  actionCard: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryActionCard: {
    borderWidth: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  primaryActionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  secondaryActionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionTextBox: {
    flex: 1,
  },
  primaryActionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  primaryActionDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
  },
  secondaryActionTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  secondaryActionDesc: {
    lineHeight: 16,
  },
  tipsCard: {
    borderWidth: 1,
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  tipsHeader: {
    fontWeight: '700',
  },
  tipItem: {
    lineHeight: 18,
    marginBottom: 4,
  },
});
