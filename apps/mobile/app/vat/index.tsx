import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import { SectionCard, MetricTile, StatusBadge, ActionButton } from '../../src/components';
import { VatReturn, VatReturnStatus } from '@biasharasmart/shared-types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function VatReturnsScreen() {
  const router = useRouter();
  const [currentDraft, setCurrentDraft] = useState<VatReturn | null>(null);
  const [previousReturns, setPreviousReturns] = useState<VatReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!refreshing) setLoading(true);
    try {
      // 1. Fetch current draft
      const currentRes = await fetch(`${API_BASE}/api/vat/${BUSINESS_ID}/current`);
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        setCurrentDraft(currentData);
      }

      // 2. Fetch history
      const historyRes = await fetch(`${API_BASE}/api/vat/${BUSINESS_ID}?limit=20`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        // Filter out current draft from history if it exists there
        const history = (historyData.data as VatReturn[]).filter(r => r.id !== currentDraft?.id);
        setPreviousReturns(history);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await fetch(`${API_BASE}/api/vat/${BUSINESS_ID}/calculate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Calculation failed');
      const data = await res.json();
      Alert.alert('Success', `VAT calculated from ${data.invoiceCount} invoices.`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate VAT. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentDraft) return;
    
    Alert.alert(
      'File VAT Return',
      `Are you sure you want to file the return for ${MONTHS[currentDraft.periodMonth - 1]} ${currentDraft.periodYear}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'File Now',
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await fetch(`${API_BASE}/api/vat/${currentDraft.id}/submit`, {
                method: 'POST',
              });
              if (!res.ok) throw new Error('Submission failed');
              Alert.alert('Success', 'VAT return filed successfully.');
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to file VAT return. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const renderCurrentDraft = () => {
    if (!currentDraft) return null;

    const isDraft = currentDraft.status === VatReturnStatus.DRAFT;
    const canFile = isDraft && Number(currentDraft.netVatKes) > 0;

    return (
      <SectionCard 
        title={`Current Period: ${MONTHS[currentDraft.periodMonth - 1]} ${currentDraft.periodYear}`}
        accentColor={colors.mint}
      >
        <View style={styles.statusRow}>
          <Text style={styles.label}>Status</Text>
          <StatusBadge status={currentDraft.status as any} />
        </View>

        <View style={styles.metricsGrid}>
          <MetricTile 
            label="Output VAT" 
            value={Number(currentDraft.outputVatKes)} 
            unit="KES" 
            accentColor={colors.white}
          />
          <MetricTile 
            label="Input VAT" 
            value={Number(currentDraft.inputVatKes)} 
            unit="KES" 
            accentColor={colors.white}
          />
        </View>

        <View style={styles.netVatRow}>
          <Text style={styles.netVatLabel}>Net VAT Payable</Text>
          <Text style={styles.netVatValue}>
            KES {Number(currentDraft.netVatKes).toLocaleString('en-KE')}
          </Text>
        </View>

        {isDraft && (
          <View style={styles.actionRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <ActionButton 
                label="Calculate" 
                onPress={handleCalculate} 
                isLoading={calculating}
                variant="secondary"
              />
            </View>
            <View style={{ flex: 1 }}>
              <ActionButton 
                label="File Return" 
                onPress={handleSubmit} 
                isLoading={submitting}
                isDisabled={!canFile}
              />
            </View>
          </View>
        )}
      </SectionCard>
    );
  };

  const VatReturnRow = ({ item }: { item: VatReturn }) => (
    <TouchableOpacity 
      style={styles.historyRow}
      onPress={() => router.push(`/vat/${item.id}`)}
    >
      <View>
        <Text style={styles.periodText}>
          {MONTHS[item.periodMonth - 1]} {item.periodYear}
        </Text>
        <Text style={styles.amountText}>
          KES {Number(item.netVatKes).toLocaleString('en-KE')}
        </Text>
      </View>
      <StatusBadge status={item.status as any} size="small" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.mint}
          />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.mint} style={{ marginTop: 40 }} />
        ) : (
          <>
            {renderCurrentDraft()}

            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>History</Text>
            </View>

            {previousReturns.length > 0 ? (
              <View style={styles.historyContainer}>
                {previousReturns.map(item => (
                  <VatReturnRow key={item.id} item={item} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No previous returns found</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: 40,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
  },
  metricsGrid: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
  },
  netVatRow: {
    backgroundColor: colors.grey1,
    padding: spacing.md,
    borderRadius: spacing.radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  netVatLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  netVatValue: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.mint,
  },
  actionRow: {
    flexDirection: 'row',
  },
  historyHeader: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  historyTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  historyContainer: {
    marginHorizontal: spacing.screenPadding,
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
  },
  periodText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  amountText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
    marginTop: 2,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
  },
});
