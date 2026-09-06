import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getActiveServerHost, setActiveServerHost, pingServer } from '../services/api';
import { detectDevServerHost } from '../utils/constants';

export default function ServerConfigModal({ visible, onClose, onSaved }) {
  const { colors, borderRadius, spacing, fontSizes } = useTheme();

  const [serverUrl, setServerUrl] = useState('');
  const [autoDetected, setAutoDetected] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCurrentHost();
    }
  }, [visible]);

  const loadCurrentHost = async () => {
    const current = await getActiveServerHost();
    const detected = detectDevServerHost();
    setServerUrl(current);
    setAutoDetected(detected);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await pingServer(serverUrl.trim());
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetToAuto = () => {
    const detected = detectDevServerHost();
    setServerUrl(detected);
    setTestResult(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await setActiveServerHost(serverUrl.trim());
      if (typeof onSaved === 'function') {
        onSaved(saved);
      }
      onClose();
    } catch (err) {
      console.warn('[ServerConfigModal] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBackdrop}
      >
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconPill, { backgroundColor: '#EFF6FF' }]}>
                <MaterialCommunityIcons name="server-network" size={22} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary, fontSize: fontSizes.lg }]}>
                  Server Connection
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                  Configure backend API IP & diagnose network
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Server URL Input */}
            <Text style={[styles.label, { color: colors.textPrimary, fontSize: fontSizes.xs }]}>
              Backend Server URL
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="web"
                size={18}
                color={colors.textMuted}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[styles.input, { color: colors.textPrimary, fontSize: fontSizes.sm }]}
                value={serverUrl}
                onChangeText={(val) => {
                  setServerUrl(val);
                  setTestResult(null);
                }}
                placeholder="http://172.20.10.2:5000"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Auto-detected hint */}
            <View style={styles.autoDetectRow}>
              <Text style={[styles.autoDetectText, { color: colors.textMuted, fontSize: fontSizes.xs }]}>
                Metro Auto-Detected: {autoDetected}
              </Text>
              {serverUrl !== autoDetected && (
                <TouchableOpacity onPress={handleResetToAuto}>
                  <Text style={[styles.resetText, { color: colors.primary, fontSize: fontSizes.xs }]}>
                    Reset to Auto
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Test Connection Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleTestConnection}
              disabled={isTesting || !serverUrl}
              style={[
                styles.testButton,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="lightning-bolt-outline"
                    size={18}
                    color={colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.testButtonText, { color: colors.primary, fontSize: fontSizes.sm }]}>
                    Test Server Connection
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Test Result Indicator */}
            {testResult && (
              <View
                style={[
                  styles.resultBox,
                  {
                    backgroundColor: testResult.success ? '#ECFDF5' : '#FEF2F2',
                    borderColor: testResult.success ? '#A7F3D0' : '#FECACA',
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={testResult.success ? 'check-circle' : 'alert-circle'}
                  size={20}
                  color={testResult.success ? '#10B981' : '#EF4444'}
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.resultTitle,
                      { color: testResult.success ? '#065F46' : '#991B1B', fontSize: fontSizes.xs },
                    ]}
                  >
                    {testResult.success ? 'Server is Online & Reachable!' : 'Connection Failed'}
                  </Text>
                  <Text
                    style={[
                      styles.resultDesc,
                      { color: testResult.success ? '#047857' : '#B91C1C', fontSize: fontSizes.xs },
                    ]}
                  >
                    {testResult.success
                      ? `Status ${testResult.status} | Latency: ${testResult.latencyMs}ms | DB: Connected`
                      : `${testResult.message || 'Cannot reach host'}. Make sure your phone and PC are connected to the same Wi-Fi or iPhone Hotspot.`}
                  </Text>
                </View>
              </View>
            )}

            {/* Hotspot & Wi-Fi Tip */}
            <View style={[styles.tipBox, { backgroundColor: colors.surfaceSubtle, borderRadius: borderRadius.md }]}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={[styles.tipText, { color: colors.textSecondary, fontSize: fontSizes.xs }]}>
                Tip: When using your iPhone Personal Hotspot, your PC IP is usually <Text style={{ fontWeight: '700' }}>172.20.10.2</Text>. On Home Wi-Fi, it matches your LAN router subnet (e.g. 192.168.x.x).
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.actionBtn, styles.cancelBtn, { borderColor: colors.border, borderRadius: borderRadius.md }]}
            >
              <Text style={[styles.actionBtnText, { color: colors.textPrimary, fontSize: fontSizes.sm }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving || !serverUrl}
              style={[styles.actionBtn, styles.saveBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.actionBtnText, { color: '#FFFFFF', fontSize: fontSizes.sm, fontWeight: '700' }]}>
                  Save & Apply
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: '800',
  },
  modalSubtitle: {
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  autoDetectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  autoDetectText: {
    flex: 1,
  },
  resetText: {
    fontWeight: '700',
    marginLeft: 8,
  },
  testButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 12,
    marginBottom: 12,
  },
  testButtonText: {
    fontWeight: '700',
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  resultTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  resultDesc: {
    lineHeight: 16,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginTop: 4,
  },
  tipText: {
    flex: 1,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  saveBtn: {
    minWidth: 120,
  },
  actionBtnText: {},
});
