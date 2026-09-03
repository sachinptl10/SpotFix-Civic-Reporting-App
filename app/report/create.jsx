import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useReports } from '../../context/ReportContext';
import { useTheme } from '../../theme/ThemeContext';
import useToast from '../../hooks/useToast';
import useLocation from '../../hooks/useLocation';
import reportService from '../../services/reportService';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import CategoryPicker from '../../components/CategoryPicker';
import { validateReportForm } from '../../utils/validation';
import { getErrorMessage } from '../../utils/helpers';

export default function CreateReportScreen() {
  const router = useRouter();
  const { imageUri, mediaType = 'image' } = useLocalSearchParams();
  const { addReport, fetchReports } = useReports();
  const { colors, borderRadius, spacing, fontSizes } = useTheme();
  const toast = useToast();

  const mapRef = useRef(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [description, setDescription] = useState('');

  // Location via custom hook (auto live tracking enabled)
  const {
    location,
    address,
    isLocating,
    isWatching,
    error: locationHookError,
    getCurrentPosition,
    startWatching,
    stopWatching,
    setManualLocation,
    searchAddress,
  } = useLocation({ autoTrack: true });

  // Manual Location Search
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle manual address search
  const handleSearchAddress = async () => {
    if (!searchLocationQuery || searchLocationQuery.trim().length < 3) {
      toast.showWarning('Please type at least 3 characters to search for a location.');
      return;
    }

    setIsSearchingLocation(true);
    try {
      const results = await searchAddress(searchLocationQuery);
      setLocationSearchResults(results);
      if (results.length === 0) {
        toast.showInfo('No matching address locations found.');
      }
    } catch (e) {
      toast.showError('Address search failed.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setIsManualOverride(true);
    stopWatching();
    setManualLocation({
      latitude: result.latitude,
      longitude: result.longitude,
      address: searchLocationQuery,
    });
    setLocationSearchResults([]);

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
    toast.showSuccess('Location updated manually.');
  };

  // Allow user to drag pin on map to adjust location
  const handleMarkerDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setIsManualOverride(true);
    stopWatching();
    setManualLocation({ latitude, longitude });
    toast.showInfo('Pin position adjusted.');
  };

  // Re-enable live GPS tracking
  const handleResetToLiveGPS = async () => {
    setIsManualOverride(false);
    await startWatching();
    await getCurrentPosition();
    toast.showSuccess('Switched back to Live GPS tracking.');
  };

  const handleSubmit = async () => {
    const validation = validateReportForm({
      title,
      category,
      description,
      imageUri,
      location,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.showError('Please correct the highlighted form errors.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await reportService.createReport({
        title: title.trim(),
        category,
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        address: address || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`,
        imageUri,
        mediaType,
      });

      if (result && result.report) {
        addReport(result.report);
      } else {
        await fetchReports();
      }

      toast.showSuccess('Report submitted successfully!');
      router.replace('/(tabs)/home');
    } catch (err) {
      console.warn('[CreateReport] Submission error:', err);
      const msg = getErrorMessage(err, 'Failed to submit report. Please try again.');
      if (err.errors) {
        setErrors(err.errors);
      }
      toast.showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {/* Section 1: Attached Media Preview */}
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
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardHeader, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
              {isVideo ? 'Attached Video' : 'Issue Photograph'}
            </Text>
            {isVideo && (
              <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="video" size={14} color="#FFFFFF" />
                <Text style={styles.typeBadgeText}>VIDEO</Text>
              </View>
            )}
          </View>

          <View style={[styles.imagePreviewContainer, { borderRadius: borderRadius.lg }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.attachedImage} resizeMode="cover" />
            ) : (
              <View style={[styles.noImage, { backgroundColor: colors.surfaceSubtle }]}>
                <MaterialCommunityIcons name="image-off-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.noImageText, { color: colors.textMuted, fontSize: fontSizes.sm }]}>
                  No media attached
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => router.push('/report/camera')}
              style={styles.changePhotoBadge}
            >
              <MaterialCommunityIcons name="camera-retake" size={16} color="#FFFFFF" />
              <Text style={styles.changePhotoText}>Retake</Text>
            </TouchableOpacity>
          </View>
          {errors.image ? (
            <Text style={[styles.errorText, { color: colors.danger, fontSize: fontSizes.xs }]}>
              {errors.image}
            </Text>
          ) : null}
        </View>

        {/* Section 2: GPS Location Card with Live Tracking & Manual Search */}
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
          <View style={styles.locationHeaderRow}>
            <Text style={[styles.cardHeader, { color: colors.textPrimary, fontSize: fontSizes.md }]}>
              Incident Location
            </Text>

            {/* Live GPS / Manual status badge */}
            <View style={styles.locationBadgesRow}>
              {isManualOverride ? (
                <TouchableOpacity onPress={handleResetToLiveGPS} style={styles.manualBadge}>
                  <MaterialCommunityIcons name="map-marker-radius" size={14} color="#D97706" />
                  <Text style={styles.manualBadgeText}>Manual Pin (Tap for GPS)</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.liveGpsBadge}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveGpsText}>Live GPS</Text>
                </View>
              )}
            </View>
          </View>

          {/* Current Address Display */}
          <View style={[styles.addressBox, { backgroundColor: colors.surfaceSubtle, borderRadius: borderRadius.md }]}>
            <MaterialCommunityIcons
              name="map-marker"
              size={22}
              color={colors.danger}
              style={styles.addressMarkerIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.addressTitle, { color: colors.textSecondary }]}>
                {isManualOverride ? 'Selected Location' : 'Current GPS Location'}
              </Text>
              <Text style={[styles.addressContent, { color: colors.textPrimary, fontSize: fontSizes.sm }]}>
                {address || (isLocating ? 'Acquiring street address...' : 'Address unavailable')}
              </Text>
              {location && (
                <Text style={[styles.coordsText, { color: colors.textMuted }]}>
                  Lat: {location.latitude.toFixed(5)} • Lng: {location.longitude.toFixed(5)}
                </Text>
              )}
            </View>
          </View>

          {/* Manual Location Search Bar */}
          <View style={styles.manualSearchRow}>
            <View style={{ flex: 1 }}>
              <CustomInput
                placeholder="Search or enter different address..."
                value={searchLocationQuery}
                onChangeText={setSearchLocationQuery}
                leftIcon="magnify"
                style={{ marginBottom: 0 }}
              />
            </View>
            <TouchableOpacity
              onPress={handleSearchAddress}
              disabled={isSearchingLocation}
              style={[styles.searchAddressButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
            >
              {isSearchingLocation ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.searchAddressButtonText}>Find</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search suggestions if any */}
          {locationSearchResults.length > 0 && (
            <View style={[styles.searchResultsList, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              {locationSearchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelectSearchResult(item)}
                  style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                >
                  <MaterialCommunityIcons name="map-marker-check" size={18} color={colors.primary} />
                  <Text style={[styles.searchResultText, { color: colors.textPrimary, fontSize: fontSizes.xs }]}>
                    Set position to coordinates: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Interactive Map with Draggable Pin */}
          {location && (
            <View style={[styles.miniMapWrapper, { borderRadius: borderRadius.md, borderColor: colors.border }]}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_DEFAULT}
                style={styles.miniMap}
                region={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.006,
                  longitudeDelta: 0.006,
                }}
                showsUserLocation={!isManualOverride}
              >
                <Marker
                  draggable
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  onDragEnd={handleMarkerDragEnd}
                  title="Issue Location"
                  description="Drag to fine-tune incident position"
                />
              </MapView>
            </View>
          )}

          <Text style={[styles.dragHintText, { color: colors.textMuted, fontSize: fontSizes.tiny }]}>
            Tip: Drag the pin on the map to pinpoint the exact location.
          </Text>

          {locationHookError ? (
            <Text style={[styles.errorText, { color: colors.danger, fontSize: fontSizes.xs }]}>
              {locationHookError}
            </Text>
          ) : null}
          {errors.location ? (
            <Text style={[styles.errorText, { color: colors.danger, fontSize: fontSizes.xs }]}>
              {errors.location}
            </Text>
          ) : null}
        </View>

        {/* Section 3: Problem Details Form */}
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
            Issue Details
          </Text>

          <CustomInput
            label="Issue Title *"
            placeholder="e.g. Deep pothole causing traffic obstruction"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
            }}
            error={errors.title}
          />

          <CategoryPicker
            selectedCategory={category}
            onSelectCategory={(cat) => {
              setCategory(cat);
              if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
            }}
            error={errors.category}
          />

          <CustomInput
            label="Description *"
            placeholder="Describe the issue, hazards to pedestrians or vehicles, how long it has been present..."
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

        {/* Submission Action */}
        <View style={styles.actionContainer}>
          <CustomButton
            title={isSubmitting ? 'Submitting Report...' : 'Submit Report'}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            size="lg"
            variant="primary"
            icon="send"
            style={styles.submitButton}
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
  sectionCard: {
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeader: {
    fontWeight: '700',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    gap: 4,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
    position: 'relative',
  },
  attachedImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 4,
  },
  changePhotoBadge: {
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
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveGpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveGpsText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
  },
  manualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  manualBadgeText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  addressBox: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 10,
  },
  addressMarkerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  addressTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressContent: {
    fontWeight: '600',
    lineHeight: 18,
  },
  coordsText: {
    fontSize: 11,
    marginTop: 2,
  },
  manualSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchAddressButton: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchAddressButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchResultsList: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchResultText: {
    flex: 1,
    fontWeight: '600',
  },
  miniMapWrapper: {
    height: 140,
    overflow: 'hidden',
    borderWidth: 1,
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  dragHintText: {
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionContainer: {
    marginTop: 4,
    marginBottom: 24,
  },
  submitButton: {
    width: '100%',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  errorText: {
    marginTop: 4,
  },
});
