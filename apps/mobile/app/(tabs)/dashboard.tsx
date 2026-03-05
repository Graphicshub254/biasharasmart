import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import {
  BalanceCard,
  MetricTile,
  AlertBanner,
  SectionCard,
  TransactionRow,
  SkeletonLoader,
  ActionButton,
} from '../../src/components';
import { useNetworkStatus } from '../../src/lib/network';
import { DashboardSummary } from '@biasharasmart/shared-types';

// --- Constants ---

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// --- Component ---
export default function DashboardScreen() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cachedSummary, setCachedSummary] = useState<DashboardSummary | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/summary`);
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      
      const data: DashboardSummary = await res.json();
      setSummary(data);
      setCachedSummary(data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      if (cachedSummary) {
        setSummary(cachedSummary);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cachedSummary]);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, []);

  // Re-fetch when coming back online
  useEffect(() => {
    if (isOnline) {
      fetchDashboard();
    }
  }, [isOnline]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard(true);
  };

  const handleAction = (route: string, placeholder?: string) => {
    if (placeholder) {
      Alert.alert('Coming Soon', placeholder);
    } else {
      router.push(route as any);
    }
  };

  // --- Render Helpers ---

  if (loading && !summary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.skeletonTitle} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SkeletonLoader variant="hero" count={1} />
          <View style={styles.metricGrid}>
            <SkeletonLoader variant="tile" count={4} style={{ flex: 1 }} />
          </View>
          <SkeletonLoader variant="row" count={5} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const tccConfig = summary?.tcc ? {
    compliant: { type: 'success' as const, title: 'TCC Valid', message: `Tax Compliance Certificate is active — ${summary.tcc.daysRemaining} days remaining` },
    warning:   { type: 'warning' as const, title: 'TCC Expiring', message: `Tax Compliance Certificate expires soon — ${summary.tcc.daysRemaining} days remaining. Renew now.` },
    lapsed:    { type: 'error' as const,   title: 'TCC Lapsed', message: 'Your Tax Compliance Certificate has lapsed. Renew immediately to avoid penalties.' },
  }[summary.tcc.status] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.businessName}>{summary?.business.name || 'Loading...'}</Text>
          <Text style={styles.kraPin}>PIN: {summary?.business.kraPin}</Text>
        </View>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <MaterialIcons name="cloud-off" size={14} color={colors.white} />
            <Text style={styles.offlineText}>OFFLINE</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint} />
        }
      >
        {/* Offline Banner */}
        {!isOnline && !cachedSummary && (
          <AlertBanner
            type="warning"
            title="You're offline"
            message="Connect to the internet to load your dashboard data."
            dismissable={false}
          />
        )}

        {/* Balance Card */}
        <View style={styles.section}>
          <BalanceCard
            label="This Month's Revenue"
            amount={summary?.revenue.thisMonth || 0}
            trend={summary?.revenue.trend}
            isBlurred={isBlurred}
            onToggleBlur={() => setIsBlurred(!isBlurred)}
            variant="large"
            isLoading={loading}
          />
        </View>

        {/* Metric Grid */}
        <View style={styles.metricGrid}>
          <View style={styles.metricRow}>
            <MetricTile
              label="Invoices"
              value={summary?.invoices.total || 0}
              accentColor={colors.mint}
              isLoading={loading}
            />
            <MetricTile
              label="Pending"
              value={summary?.invoices.pending || 0}
              accentColor={colors.gold}
              isLoading={loading}
            />
          </View>
          <View style={styles.metricRow}>
            <MetricTile
              label="Overdue"
              value={summary?.invoices.overdue || 0}
              accentColor={colors.red}
              isLoading={loading}
            />
            <MetricTile
              label="Today"
              value={summary?.payments.todayCount || 0}
              unit="pmts"
              accentColor={colors.teal}
              isLoading={loading}
            />
          </View>
        </View>

        {/* TCC Status */}
        {tccConfig && (
          <AlertBanner
            type={tccConfig.type}
            title={tccConfig.title}
            message={tccConfig.message}
          />
        )}

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <ActionButton
            label="New Invoice"
            variant="ghost"
            fullWidth={false}
            onPress={() => handleAction('/(tabs)/invoices')}
          />
          <ActionButton
            label="Record Payment"
            variant="ghost"
            fullWidth={false}
            onPress={() => handleAction('/(tabs)/payments')}
          />
          <ActionButton
            label="File VAT"
            variant="ghost"
            fullWidth={false}
            onPress={() => handleAction('', 'VAT Filing coming in T2.1')}
          />
        </View>

        {/* Recent Transactions */}
        <SectionCard title="Recent Transactions" accentColor={colors.mint}>
          {summary?.recentTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              id={tx.id}
              type={tx.type === 'credit' ? 'income' : 'expense'}
              title={tx.description}
              amount={tx.amount}
              timestamp={new Date(tx.date)}
              onPress={() => Alert.alert('Transaction Detail', `ID: ${tx.id}\n${tx.description}`)}
            />
          ))}
          {(!summary?.recentTransactions || summary.recentTransactions.length === 0) && (
            <Text style={styles.emptyText}>No recent transactions</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    backgroundColor: colors.ink,
  },
  businessName: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  kraPin: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    marginTop: 2,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginLeft: 4,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  section: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  metricGrid: {
    paddingHorizontal: spacing.screenPadding - spacing.xs,
    marginBottom: spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    height: 40,
  },
  emptyText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  skeletonTitle: {
    width: 150,
    height: 24,
    backgroundColor: colors.greyDark,
    borderRadius: 4,
    opacity: 0.4,
  },
  footerSpacer: {
    height: 40,
  },
});
