import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import {
  AlertBanner,
  TransactionRow,
  SkeletonLoader,
} from '../../src/components';
import { useNetworkStatus } from '../../src/lib/network';
import { Payment, WhtSummary, DashboardSummary } from '@biasharasmart/shared-types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function PaymentsScreen() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [whtSummary, setWhtSummary] = useState<WhtSummary | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const fetchPayments = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      // 1. Get business ID from dashboard summary if not already set
      let currentBusinessId = businessId;
      if (!currentBusinessId) {
        const dashboardRes = await fetch(`${API_BASE}/api/dashboard/summary`);
        if (dashboardRes.ok) {
          const dashboardData: DashboardSummary = await dashboardRes.json();
          currentBusinessId = dashboardData.business.id;
          setBusinessId(currentBusinessId);
        }
      }

      if (currentBusinessId) {
        // 2. Fetch payments and WHT summary in parallel
        const [paymentsRes, whtRes] = await Promise.all([
          fetch(`${API_BASE}/api/payments/${currentBusinessId}`),
          fetch(`${API_BASE}/api/payments/wht-summary/${currentBusinessId}`),
        ]);

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData.data);
        }

        if (whtRes.ok) {
          const whtData = await whtRes.json();
          setWhtSummary(whtData);
        }
      }
    } catch (error) {
      console.error('Payments fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (isOnline) fetchPayments();
  }, [isOnline]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments(true);
  };

  const mapStatusToType = (status: string): any => {
    switch (status) {
      case 'confirmed': return 'income';
      case 'pending': return 'pending';
      case 'failed': return 'failed';
      default: return 'pending';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint} />
        }
      >
        {loading && !refreshing ? (
          <View style={{ paddingHorizontal: spacing.screenPadding }}>
            <SkeletonLoader variant="row" count={8} />
          </View>
        ) : (
          <>
            {/* WHT Alert */}
            {whtSummary && whtSummary.totalPending > 0 && (
              <AlertBanner
                type={whtSummary.overdueCount > 0 ? 'error' : 'warning'}
                title="WHT Due"
                message={`KES ${whtSummary.totalPending.toLocaleString()} withholding tax is pending remittance to KRA.`}
                dismissable={false}
              />
            )}

            {/* Gateway Upsell Alert */}
            {whtSummary && whtSummary.paymentMode === 'legacy' && (
              <AlertBanner
                type="info"
                title="Upgrade to Gateway"
                message="Switch to Gateway flow to have WHT automatically remitted. Earn +100 Bia Score points."
                actionLabel="Learn More"
                onAction={() => router.push('/onboard/type')}
                dismissable={true}
              />
            )}

            {/* Transaction List */}
            {payments.length > 0 ? (
              payments.map((p) => (
                <TransactionRow
                  key={p.id}
                  id={p.id}
                  type={mapStatusToType(p.status)}
                  title={p.phoneNumber || p.mpesaCode || 'Unknown Payment'}
                  subtitle={`${p.paymentFlow === 'gateway' ? 'Gateway' : 'Legacy'} Flow • ${p.mpesaCode || 'Pending Ref'}`}
                  amount={Number(p.amountKes)}
                  timestamp={new Date(p.createdAt)}
                  onPress={() => {}}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No payments recorded yet.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/payments/confirm')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={24} color={colors.ink} />
        <Text style={styles.fabText}>Collect Payment</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.screenPadding,
    backgroundColor: colors.mint,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink,
    marginLeft: spacing.xs,
  },
});
