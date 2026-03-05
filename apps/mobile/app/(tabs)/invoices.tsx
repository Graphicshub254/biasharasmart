import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import { InvoiceCard } from '../../src/components/InvoiceCard/InvoiceCard';
import { SkeletonLoader } from '../../src/components/SkeletonLoader/SkeletonLoader';
import { ActionButton } from '../../src/components/ActionButton/ActionButton';
import { Invoice, InvoiceStatus } from '@biasharasmart/shared-types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8'; // temp until auth in T1.6

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending_kra', label: 'Pending KRA' },
  { key: 'issued', label: 'Issued' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

export default function InvoicesScreen() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [total, setTotal] = useState(0);

  const fetchInvoices = async (statusFilter?: string) => {
    if (!refreshing) setLoading(true);
    try {
      const params = new URLSearchParams({ businessId: BUSINESS_ID });
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const res = await fetch(`${API_BASE}/api/invoices?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInvoices(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error('Fetch error:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInvoices(activeFilter);
    }, [activeFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices(activeFilter);
  };

  const renderFilterPill = ({ key, label }: { key: string; label: string }) => {
    const isActive = activeFilter === key;
    return (
      <TouchableOpacity
        key={key}
        style={[styles.pill, isActive && styles.pillActive]}
        onPress={() => setActiveFilter(key)}
      >
        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: Invoice }) => (
    <InvoiceCard
      id={item.id}
      customerName={item.customerName ?? 'Unknown Customer'}
      amount={typeof item.totalKes === 'string' ? parseFloat(item.totalKes) : item.totalKes}
      status={item.status as any}
      cuNumber={item.cuNumber}
      invoiceNumber={item.id.slice(-8).toUpperCase()}
      onPress={() => router.push(`/invoices/${item.id}`)}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color={colors.greyMid} />
        <Text style={styles.emptyTitle}>No invoices yet</Text>
        <Text style={styles.emptySubtitle}>
          {activeFilter === 'all' 
            ? 'Create your first invoice to get started'
            : `No ${activeFilter.replace('_', ' ')} invoices found`}
        </Text>
        {activeFilter === 'all' && (
          <View style={styles.emptyAction}>
            <ActionButton 
              label="Create Invoice" 
              onPress={() => router.push('/invoices/create')}
              fullWidth={false}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/invoices/create')}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map(renderFilterPill)}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <SkeletonLoader variant="card" count={5} />
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.mint}
              colors={[colors.mint]}
            />
          }
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cobalt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterWrapper: {
    marginBottom: spacing.md,
  },
  filterScroll: {
    paddingHorizontal: spacing.screenPadding,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.full,
    backgroundColor: colors.greyDark,
    marginRight: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.cobalt,
  },
  pillText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.medium,
    color: colors.greyMid,
  },
  pillTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingBottom: 100, // Clear the tab bar
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyAction: {
    marginTop: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
});
