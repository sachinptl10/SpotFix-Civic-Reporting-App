import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

export const contactService = {
  /**
   * Request device contacts permission
   */
  async requestPermission() {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return {
        granted: status === 'granted',
        status,
      };
    } catch (error) {
      console.warn('[Contacts] Permission request failed:', error);
      return { granted: false, status: 'error', error };
    }
  },

  /**
   * Fetch all device contacts with phone and email fields
   */
  async getContacts() {
    try {
      const permission = await this.requestPermission();
      if (!permission.granted) {
        throw new Error('Contacts permission not granted');
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      if (!data || data.length === 0) {
        return [];
      }

      // Sanitize and filter contacts who have at least a name or phone
      return data
        .filter((c) => c.name || (c.phoneNumbers && c.phoneNumbers.length > 0))
        .map((c) => {
          const primaryPhone = c.phoneNumbers && c.phoneNumbers.length > 0 ? c.phoneNumbers[0].number : null;
          const primaryEmail = c.emails && c.emails.length > 0 ? c.emails[0].email : null;

          return {
            id: c.id || Math.random().toString(),
            name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown Contact',
            phone: primaryPhone,
            email: primaryEmail,
            raw: c,
          };
        });
    } catch (error) {
      console.warn('[Contacts] Failed to load contacts:', error);
      throw error;
    }
  },

  /**
   * Filter contacts by search query string
   */
  filterContacts(contacts, query) {
    if (!query || query.trim() === '') {
      return contacts;
    }
    const lower = query.toLowerCase().trim();
    return contacts.filter((c) => {
      const nameMatch = c.name && c.name.toLowerCase().includes(lower);
      const phoneMatch = c.phone && c.phone.includes(lower);
      const emailMatch = c.email && c.email.toLowerCase().includes(lower);
      return nameMatch || phoneMatch || emailMatch;
    });
  },

  /**
   * Native phone call action
   */
  async callContact(phoneNumber) {
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This contact does not have a registered phone number.');
      return;
    }
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    const supported = await Linking.canOpenURL(url).catch(() => false);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unavailable', `Phone calls are not supported on this device/simulator. Target number: ${phoneNumber}`);
    }
  },

  /**
   * Native SMS messaging action
   */
  async messageContact(phoneNumber, message = 'Hi, I would like to inform you about a civic issue in our neighborhood reported via SpotFix.') {
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'This contact does not have a phone number for SMS.');
      return;
    }
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const encodedMessage = encodeURIComponent(message);
    const url = `sms:${cleanNumber}${separator}body=${encodedMessage}`;

    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unavailable', `SMS messaging is not supported on this device/simulator.`);
    }
  },

  /**
   * Native Email action
   */
  async emailContact(email, subject = 'SpotFix Civic Issue Alert', body = 'Hi,\n\nI reported a civic issue in our area via SpotFix and wanted to keep you informed.') {
    if (!email) {
      Alert.alert('No Email', 'This contact does not have an email address.');
      return;
    }
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const url = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;

    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unavailable', `Email client is not configured on this device.`);
    }
  },
};

export default contactService;
