import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useReports } from '../../context/ReportContext';
import { useTheme } from '../../theme/ThemeContext';
import useToast from '../../hooks/useToast';
import reportService from '../../services/reportService';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import CategoryPicker from '../../components/CategoryPicker';
import LoadingState from '../../components/LoadingState';
import { getImageUrl, getErrorMessage } from '../../utils/helpers';

export default function EditReportScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { reports, updateReportInState } = useReports();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();
  const toast = useToast();

  const [report, setReport] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [newImageUri, setNewImageUri] = useState(null);
  const [mediaType, setMediaType] = useState('image');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const cached = reports.find((r) => (r._id || r.id) === id);
    if (cached) {
      populateFields(cached);
      setIsLoading(false);
    } else {
      fetchReport();
    }
  }, [id]);

  const populateFields = (data) => {
    setReport(data);
    setTitle(data.title || '');
    setCategory(data.category || 'Other');
    setDescription(data.description || '');
    setCurrentImageUrl(data.imageUrl || null);
    setMediaType(data.mediaType || 'image');
  };

  const fetchReport = async () => {
    try {
      const response = await reportService.getReportById(id);
      if (response && response.report) {
        populateFields(response.report);
      }
    } catch (err) {
      console.warn('[EditReport] Fetch error:', err.message);
      toast.showError('Could not load report to edit.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickNewMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setNewImageUri(asset.uri);
        setMediaType(asset.type === 'video' ? 'video' : 'image');
      }
    } catch (err) {
      console.warn('[ImagePicker] Failed to pick media:', err);
    }
  };

  const handleSave = async () => {
    const validationErrors = {};
    if (!title || title.trim().length === 0) {
      validationErrors.title = 'Title is required.';
    } else if (title.trim().length < 5) {
      validationErrors.title = 'Title must be at least 5 characters.';
    }

    if (!description || description.trim().length === 0) {
      validationErrors.description = 'Description is required.';
    } else if (description.trim().length < 10) {
      validationErrors.description = 'Description must be at least 10 characters.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.showError('Please correct the validation errors.');
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      const result = await reportService.updateReport(
        id,
        {
          title: title.trim(),
          category,
          description: description.trim(),
        },
        newImageUri
      );

      if (result && result.report) {
        updateReportInState(result.report);
      }

      toast.showSuccess('Report successfully updated!');
      router.replace(`/report/${id}`);
    } catch (err) {
      console.warn('[EditReport] Save error:', err);
      const msg = getErrorMessage(err, 'Failed to update report.');
      if (err.errors) {
        setErrors(err.errors);
      }
      toast.showError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading report data..." />
      </View>
    );
  }

  const displayedImage = newImageUri
    ? { uri: newImageUri }
    : currentImageUrl
    ? { uri: getImageUrl(currentImageUrl) }
    : null;

  const isVideo = mediaType === 'video';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Media Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={[styles.cardHeader, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
            Report Media
          </Text>

          <View style={[styles.imageContainer, { borderRadius: borderRadius.lg, backgroundColor: colors.surfaceSubtle }]}>
            {displayedImage ? (
              <Image source={displayedImage} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.noImage}>
                <MaterialCommunityIcons name="image-outline" size={40} color={colors.textMuted} />
              </View>
            )}

            {isVideo && (
              <View style={styles.videoBadge}>
                <MaterialCommunityIcons name="play-circle" size={16} color="#FFFFFF" />
                <Text style={styles.videoBadgeText}>Video</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handlePickNewMedia}
              style={styles.changePhotoButton}
            >
              <MaterialCommunityIcons name="camera-outline" size={16} color="#FFFFFF" />
              <Text style={styles.changePhotoText}>
                {newImageUri ? 'Change Media' : 'Replace Media'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Details Form Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text style={[styles.cardHeader, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
            Modify Details
          </Text>

          <CustomInput
            label="Issue Title *"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
            }}
            error={errors.title}
          />

          <CategoryPicker
            selectedCategory={category}
            onSelectCategory={setCategory}
          />

          <CustomInput
            label="Description *"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
            }}
            error={errors.description}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Actions */}
        <View style={[styles.actions, { gap: spacing.sm }]}>
          <CustomButton
            title="Save Changes"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            variant="primary"
            size="lg"
            icon="content-save-outline"
          />

          <CustomButton
            title="Cancel"
            onPress={() => router.back()}
            disabled={isSaving}
            variant="outline"
            size="md"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  sectionCard: {
    borderWidth: 1,
  },
  cardHeader: {
    fontWeight: '700',
    marginBottom: 8,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  actions: {
    marginTop: 4,
    marginBottom: 24,
  },
});
