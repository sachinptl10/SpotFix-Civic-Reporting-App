import { useState, useEffect, useMemo, useCallback } from 'react';
import contactService from '../services/contactService';

export default function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    setPermissionDenied(false);

    try {
      const data = await contactService.getContacts();
      setContacts(data);
    } catch (err) {
      console.warn('[useContacts] Error loading contacts:', err.message);
      if (err.message.includes('permission')) {
        setPermissionDenied(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Filtered contacts based on search query
  const filteredContacts = useMemo(() => {
    return contactService.filterContacts(contacts, searchQuery);
  }, [contacts, searchQuery]);

  const selectContact = useCallback((contact) => {
    setSelectedContact((prev) => (prev?.id === contact?.id ? null : contact));
  }, []);

  const clearSelectedContact = useCallback(() => {
    setSelectedContact(null);
  }, []);

  const callContact = useCallback((phone) => {
    contactService.callContact(phone || selectedContact?.phone);
  }, [selectedContact]);

  const messageContact = useCallback((phone, message) => {
    contactService.messageContact(phone || selectedContact?.phone, message);
  }, [selectedContact]);

  const emailContact = useCallback((email, subject, body) => {
    contactService.emailContact(email || selectedContact?.email, subject, body);
  }, [selectedContact]);

  // Share a specific report with contact
  const shareReportWithContact = useCallback((report, method = 'sms') => {
    if (!selectedContact) return;

    const subject = `Civic Alert: ${report.title} (${report.category})`;
    const body =
      `Hello ${selectedContact.name},\n\n` +
      `I have reported a civic issue via SpotFix:\n` +
      `• Issue: ${report.title}\n` +
      `• Category: ${report.category}\n` +
      `• Status: ${report.status}\n` +
      `• Location: ${report.address}\n\n` +
      `Description:\n${report.description}\n\n` +
      `Sent via SpotFix Civic Reporting.`;

    if (method === 'sms' && selectedContact.phone) {
      contactService.messageContact(selectedContact.phone, body);
    } else if (method === 'email' && selectedContact.email) {
      contactService.emailContact(selectedContact.email, subject, body);
    } else if (method === 'call' && selectedContact.phone) {
      contactService.callContact(selectedContact.phone);
    }
  }, [selectedContact]);

  return {
    contacts,
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
  };
}
