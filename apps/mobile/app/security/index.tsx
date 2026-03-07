import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import {
  SectionCard,
  ActionButton,
  StatusBadge,
  InputField,
} from '../../src/components';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function SecurityScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [vaultStatus, setVaultStatus] = useState<{ vaultMode: boolean, vaultTriggeredAt?: Date } | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [secret, setSecret] = useState('');
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      // First get businessId from dashboard summary
      const dashRes = await fetch(`${API_BASE}/api/dashboard/summary`);
      if (!dashRes.ok) throw new Error('Failed to fetch business ID');
      const dashData = await dashRes.json();
      const bId = dashData.business.id;
      setBusinessId(bId);

      // Get vault status
      const statusRes = await fetch(`${API_BASE}/api/fraud/public/vault-status/${bId}`);
      if (statusRes.ok) {
        setVaultStatus(await statusRes.json());
      }

      // Get events
      const eventsRes = await fetch(`${API_BASE}/api/fraud/public/events/${bId}`);
      if (eventsRes.ok) {
        setEvents(await eventsRes.json());
      }
    } catch (error) {
      console.error('Security screen fetch error:', error);
      Alert.alert('Error', 'Failed to load security data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleVault = async () => {
    if (!businessId) return;
    const isActivating = !vaultStatus?.vaultMode;
    const action = isActivating ? 'trigger' : 'release';
    const reason = isActivating ? 'User manual activation' : 'User manual release';

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/fraud/public/vault/${businessId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: isActivating ? JSON.stringify({ reason }) : undefined,
      });

      if (res.ok) {
        Alert.alert('Success', `Vault Mode ${isActivating ? 'activated' : 'released'}`);
        fetchData(true);
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isActivating ? 'activate' : 'release'} Vault Mode`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeSecret = async () => {
    if (!businessId) return;
    if (secret.length !== 3 || !/^\d+$/.test(secret)) {
      Alert.alert('Invalid Secret', 'Please enter a 3-digit numeric code');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/fraud/public/secret/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });

      if (res.ok) {
        Alert.alert('Success', 'Transaction secret updated');
        setShowSecretInput(false);
        setSecret('');
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update transaction secret');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return colors.red;
      case 'high': return colors.gold;
      case 'medium': return colors.teal;
      default: return colors.greyMid;
    }
  };

  if (loading && !vaultStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.mint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.mint} />
        }
      >
        {/* Vault Mode */}
        <SectionCard title="Vault Mode" accentColor={vaultStatus?.vaultMode ? colors.red : colors.mint}>
          <View style={styles.vaultInfo}>
            <View>
              <Text style={styles.cardLabel}>Status</Text>
              <View style={styles.statusRow}>
                <StatusBadge
                  status={vaultStatus?.vaultMode ? 'lapsed' : 'compliant'}
                  label={vaultStatus?.vaultMode ? 'Active' : 'Inactive'}
                />
              </View>
            </View>
            {vaultStatus?.vaultMode && (
              <View style={styles.expiryBox}>
                <MaterialIcons name="lock-clock" size={20} color={colors.gold} />
                <Text style={styles.expiryText}>24hr Freeze Active</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardDescription}>
            Vault Mode freezes all outgoing payments and withdrawals for 24 hours. Trigger this if you suspect unauthorized access.
          </Text>
          <ActionButton
            label={vaultStatus?.vaultMode ? 'Release Vault' : 'Activate Vault'}
            variant={vaultStatus?.vaultMode ? 'ghost' : 'danger'}
            onPress={handleToggleVault}
            isLoading={submitting}
          />
        </SectionCard>

        {/* Transaction Secret */}
        <SectionCard title="Transaction Secret" accentColor={colors.cobalt}>
          <View style={styles.secretRow}>
            <View>
              <Text style={styles.cardLabel}>Verification Code</Text>
              <Text style={styles.maskedSecret}>***</Text>
            </View>
            <ActionButton
              label={showSecretInput ? 'Cancel' : 'Change Secret'}
              variant="ghost"
              fullWidth={false}
              onPress={() => setShowSecretInput(!showSecretInput)}
            />
          </View>
          {showSecretInput && (
            <View style={styles.secretInputContainer}>
              <InputField
                label="New 3-Digit Secret"
                value={secret}
                onChangeText={setSecret}
                placeholder="e.g. 742"
                keyboardType="number-pad"
                maxLength={3}
              />
              <ActionButton
                label="Save New Secret"
                onPress={handleChangeSecret}
                isLoading={submitting}
              />
            </View>
          )}
          <Text style={styles.cardDescription}>
            This 3-digit code will be required to authorize all payments. Never share it with anyone.
          </Text>
        </SectionCard>

        {/* Recent Events */}
        <SectionCard title="Recent Activity" accentColor={colors.teal}>
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="check-circle-outline" size={48} color={colors.mint} />
              <Text style={styles.emptyText}>No suspicious activity detected</Text>
            </View>
          ) : (
            events.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventTypeContainer}>
                    <Text style={styles.eventTypeText}>{event.eventType.replace(/_/g, ' ')}</Text>
                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(event.severity) }]}>
                      <Text style={styles.severityText}>{event.severity}</Text>
                    </View>
                  </View>
                  <Text style={styles.eventDate}>
                    {new Date(event.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </View>
            ))
          )}
        </SectionCard>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyDark,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  vaultInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  expiryText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.gold,
    marginLeft: 6,
  },
  cardDescription: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    marginBottom: spacing.lg,
    lineHeight: 16,
  },
  secretRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  maskedSecret: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 4,
  },
  secretInputContainer: {
    backgroundColor: colors.ink,
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.greyDark,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
    marginTop: spacing.md,
  },
  eventItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  eventDate: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 10,
    color: colors.greyMid,
  },
  eventDescription: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    lineHeight: 16,
  },
  footerSpacer: {
    height: 40,
  },
});
