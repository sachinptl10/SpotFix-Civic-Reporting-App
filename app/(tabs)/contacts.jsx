import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useContacts from '../../hooks/useContacts';
import { useReports } from '../../context/ReportContext';
import { useTheme } from '../../theme/ThemeContext';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import PermissionCard from '../../components/PermissionCard';
import StatusBadge from '../../components/StatusBadge';
import { getUserInitials } from '../../utils/helpers';

export default function ContactsScreen() {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();
  const { reports } = useReports();

  const {
    filteredContacts,
    searchQuery,
    setSearchQuery,
    isLoading,
    permissionDenied,
    selectedContact,
    selectContact,
    clearSelectedContact,
    loadContacts,
    callContact,
    messageContact,
    emailContact,
    shareReportWithContact,
  } = useContacts();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReportToShare, setSelectedReportToShare] = useState(reports[0] || null);

  const handleOpenNotifyModal = (contact) => {
    selectContact(contact);
    if (!selectedReportToShare && reports.length > 0) {
      setSelectedReportToShare(reports[0]);
    }
    setIsModalVisible(true);
  };

  const handleCall = () => {
    if (selectedContact?.phone) {
      callContact(selectedContact.phone);
    } else {
      Alert.alert('No Phone Number', 'This contact does not have a registered phone number.');
    }
  };

  const handleSms = () => {
    if (!selectedContact?.phone) {
      Alert.alert('No Phone Number', 'This contact does not have a phone number for SMS.');
      return;
    }

    if (selectedReportToShare) {
      shareReportWithContact(selectedReportToShare, 'sms');
    } else {
      messageContact(
        selectedContact.phone,
        `Hello ${selectedContact.name},\nI would like to notify you about a local civic issue reported via SpotFix.`
      );
    }
  };

  const handleEmail = () => {
    if (!selectedContact?.email) {
      Alert.alert('No Email Address', 'This contact does not have an email address.');
      return;
    }

    if (selectedReportToShare) {
      shareReportWithContact(selectedReportToShare, 'email');
    } else {
      emailContact(
        selectedContact.email,
        'Civic Issue Alert — SpotFix',
        `Dear ${selectedContact.name},\n\nI reported a civic problem in our area using the SpotFix app and wanted to keep you informed.`
      );
    }
  };

  if (permissionDenied) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <PermissionCard
          icon="account-lock-outline"
          title="Contacts Access Required"
          description="SpotFix requires permission to read your contacts so you can alert local representatives, municipality staff, or neighbors about civic issues."
          onRequestPermission={loadContacts}
          buttonTitle="Grant Contacts Permission"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <CustomInput
          placeholder="Search contacts by name, phone, or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="magnify"
          rightIcon={searchQuery ? 'close-circle' : null}
          onRightIconPress={() => setSearchQuery('')}
          style={{ marginBottom: 0 }}
        />
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedContact?.id === item.id;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleOpenNotifyModal(item)}
              style={[
                styles.contactItem,
                {
                  backgroundColor: isSelected ? colors.surfaceSubtle : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: borderRadius.lg,
                },
                isSelected && styles.contactItemSelected,
              ]}
            >
              {/* Checkmark or Initials Avatar */}
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle },
                ]}
              >
                {isSelected ? (
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.primary, fontSize: fontSizes.sm }]}>
                    {getUserInitials(item.name)}
                  </Text>
                )}
              </View>

              <View style={styles.contactInfo}>
                <Text
                  style={[
                    styles.contactName,
                    { color: colors.textPrimary, fontSize: fontSizes.sm + 1 },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                {item.phone && (
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons
                      name="phone-outline"
                      size={13}
                      color={colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.metaText, { color: colors.textSecondary, fontSize: fontSizes.xs }]} numberOfLines={1}>
                      {item.phone}
                    </Text>
                  </View>
                )}

                {item.email && (
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={13}
                      color={colors.textMuted}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.metaText, { color: colors.textMuted, fontSize: fontSizes.xs }]} numberOfLines={1}>
                      {item.email}
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.notifyPill, { backgroundColor: colors.surfaceSubtle, borderRadius: borderRadius.full }]}>
                <Text style={[styles.notifyPillText, { color: colors.primary, fontSize: fontSizes.tiny }]}>
                  Notify
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => {
          if (isLoading) {
            return <LoadingState message="Loading device contacts..." />;
          }
          if (searchQuery.trim() !== '') {
            return (
              <EmptyState
                icon="account-search-outline"
                title="No Contacts Found"
                subtitle={`No contacts matched "${searchQuery}". Try a different search term.`}
              />
            );
          }
          return (
            <EmptyState
              icon="account-group-outline"
              title="No Contacts Available"
              subtitle="No device contacts found with phone or email information."
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Notify Contact Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalAvatar, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.modalAvatarText, { color: colors.primary, fontSize: fontSizes.lg }]}>
                  {getUserInitials(selectedContact?.name)}
                </Text>
              </View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary, fontSize: fontSizes.lg }]}>
                Notify {selectedContact?.name}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                Share report details or contact directly regarding local civic issues.
              </Text>
            </View>

            {/* Optional: Attach a Specific Report to the alert */}
            {reports.length > 0 && (
              <View style={styles.attachReportSection}>
                <Text style={[styles.attachLabel, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                  Select Report to Share:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reportChips}>
                  {reports.slice(0, 5).map((rep) => {
                    const isRepSelected = selectedReportToShare?._id === rep._id;
                    return (
                      <TouchableOpacity
                        key={rep._id || rep.id}
                        onPress={() => setSelectedReportToShare(rep)}
                        style={[
                          styles.reportChip,
                          {
                            backgroundColor: isRepSelected ? colors.primary : colors.surfaceSubtle,
                            borderColor: isRepSelected ? colors.primary : colors.border,
                            borderRadius: borderRadius.md,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.reportChipTitle,
                            {
                              color: isRepSelected ? '#FFFFFF' : colors.textPrimary,
                              fontSize: fontSizes.xs,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {rep.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionGrid}>
              <CustomButton
                title={selectedContact?.phone ? `Call ${selectedContact.phone}` : 'Call (No Phone)'}
                onPress={handleCall}
                disabled={!selectedContact?.phone}
                icon="phone"
                variant="primary"
                size="md"
              />

              <CustomButton
                title={selectedContact?.phone ? `SMS Issue Alert` : 'SMS (No Phone)'}
                onPress={handleSms}
                disabled={!selectedContact?.phone}
                icon="message-text-outline"
                variant="secondary"
                size="md"
              />

              <CustomButton
                title={selectedContact?.email ? `Email Issue Report` : 'Email (No Email)'}
                onPress={handleEmail}
                disabled={!selectedContact?.email}
                icon="email-outline"
                variant="secondary"
                size="md"
              />
            </View>

            <CustomButton
              title="Done"
              onPress={() => setIsModalVisible(false)}
              variant="outline"
              size="md"
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  contactItemSelected: {
    borderWidth: 1.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {},
  notifyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  notifyPillText: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalAvatarText: {
    fontWeight: '700',
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  attachReportSection: {
    marginBottom: 16,
  },
  attachLabel: {
    fontWeight: '600',
    marginBottom: 6,
  },
  reportChips: {
    gap: 8,
    paddingVertical: 2,
  },
  reportChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    maxWidth: 160,
  },
  reportChipTitle: {
    fontWeight: '600',
  },
  actionGrid: {
    gap: 10,
    marginBottom: 8,
  },
});
