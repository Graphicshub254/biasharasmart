import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import {
  InputField,
  ActionButton,
  InvoiceCard,
  AlertBanner,
} from '../../src/components';
import { Invoice, DashboardSummary, WHT_RATE } from '@biasharasmart/shared-types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type Tab = 'stk' | 'manual';

export default function ConfirmPaymentScreen() {
  const router = useRouter();
  const { invoiceId: queryInvoiceId } = useLocalSearchParams<{ invoiceId: string }>();

  const [activeTab, setActiveTab] = useState<Tab>('stk');
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // Form states
  const [phone, setPhone] = useState('254');
  const [invoiceId, setInvoiceId] = useState(queryInvoiceId || '');
  const [mpesaCode, setMpesaCode] = useState('');
  const [amount, setAmount] = useState('');
  
  const [polling, setPolling] = useState(false);

  const fetchInitialData = useCallback(async () => {
    try {
      const dashboardRes = await fetch(`${API_BASE}/api/dashboard/summary`);
      if (dashboardRes.ok) {
        const dashboardData: DashboardSummary = await dashboardRes.json();
        setBusinessId(dashboardData.business.id);
      }

      if (invoiceId) {
        const invoiceRes = await fetch(`${API_BASE}/api/invoices/${invoiceId}`);
        if (invoiceRes.ok) {
          const invoiceData = await invoiceRes.json();
          setInvoice(invoiceData);
          setAmount(invoiceData.totalKes.toString());
        }
      }
    } catch (error) {
      console.error('Confirm fetch error:', error);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Polling for payment status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (polling && invoiceId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/invoices/${invoiceId}`);
          if (res.ok) {
            const data: Invoice = await res.json();
            if (data.status === 'paid') {
              setPolling(false);
              clearInterval(interval);
              Alert.alert('Payment Successful', 'The invoice has been paid via STK push.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/payments') }
              ]);
            }
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [polling, invoiceId, router]);

  const handleStkPush = async () => {
    if (!phone.match(/^254[0-9]{9}$/)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (254XXXXXXXXX).');
      return;
    }
    if (!invoiceId) {
      Alert.alert('Error', 'Invoice ID is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/gateway/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, phone }),
      });

      if (res.ok) {
        const data = await res.json();
        setPolling(true);
        Alert.alert('STK Push Sent', `Please check your phone (${phone}) for the M-Pesa prompt.`);
      } else {
        const err = await res.json();
        Alert.alert('STK Push Failed', err.message || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!businessId || !invoiceId || !mpesaCode || !amount) {
      Alert.alert('Error', 'All fields are required for manual reconcile.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/legacy/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          invoiceId,
          mpesaCode,
          amountKes: Number(amount),
          phone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const whtAmount = data.whtLiability.amountKes;
        Alert.alert(
          'Reconciled Successfully',
          `WHT liability of KES ${whtAmount.toLocaleString()} created — due in 5 days.`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/payments') }]
        );
      } else {
        const err = await res.json();
        Alert.alert('Reconcile Failed', err.message || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const total = Number(amount) || 0;
  const whtAmount = +(total * WHT_RATE).toFixed(2);
  const merchantAmount = +(total - whtAmount).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Payment</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stk' && styles.activeTab]}
          onPress={() => setActiveTab('stk')}
        >
          <Text style={[styles.tabText, activeTab === 'stk' && styles.activeTabText]}>STK Push</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
          onPress={() => setActiveTab('manual')}
        >
          <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Manual Reconcile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {invoice && (
          <View style={styles.invoiceSection}>
            <InvoiceCard
              id={invoice.id}
              customerName={invoice.customerName || 'Customer'}
              amount={Number(invoice.totalKes)}
              status={invoice.status as any}
              invoiceNumber={`INV-${invoice.id.slice(0, 8).toUpperCase()}`}
            />
            <View style={styles.whtBreakdown}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Gross Amount:</Text>
                <Text style={styles.breakdownValue}>KES {total.toLocaleString()}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>WHT (5%):</Text>
                <Text style={[styles.breakdownValue, { color: colors.gold }]}>- KES {whtAmount.toLocaleString()}</Text>
              </View>
              <View style={[styles.breakdownRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Settlement Amount:</Text>
                <Text style={styles.totalValue}>KES {merchantAmount.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.form}>
          {activeTab === 'stk' ? (
            <>
              <InputField
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="254712345678"
                keyboardType="phone-pad"
                maxLength={12}
                hint="Customer will receive an M-Pesa PIN prompt"
              />
              <InputField
                label="Invoice ID"
                value={invoiceId}
                onChangeText={setInvoiceId}
                placeholder="Enter Invoice UUID"
                isDisabled={!!queryInvoiceId}
              />
              <ActionButton
                label={polling ? 'Waiting for M-Pesa...' : 'Send STK Push'}
                onPress={handleStkPush}
                isLoading={loading}
                isDisabled={polling}
                icon={polling ? <ActivityIndicator size="small" color={colors.white} /> : <MaterialIcons name="send" size={20} color={colors.white} />}
              />
              {polling && (
                <View style={styles.pollingStatus}>
                  <Text style={styles.pollingText}>Awaiting payment confirmation...</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <InputField
                label="M-Pesa Receipt Code"
                value={mpesaCode}
                onChangeText={(text) => setMpesaCode(text.toUpperCase())}
                placeholder="e.g. QGH2XK8L9P"
                maxLength={10}
              />
              <InputField
                label="Amount (KES)"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
               <InputField
                label="Invoice ID"
                value={invoiceId}
                onChangeText={setInvoiceId}
                placeholder="Enter Invoice UUID"
                isDisabled={!!queryInvoiceId}
              />
              <ActionButton
                label="Confirm Reconcile"
                onPress={handleReconcile}
                isLoading={loading}
                variant="secondary"
                icon={<MaterialIcons name="check-circle" size={20} color={colors.white} />}
              />
              <AlertBanner
                type="warning"
                title="Legacy Mode"
                message="You must manually remit the 5% WHT to KRA within 5 days."
                dismissable={false}
              />
            </>
          )}
        </View>
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
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.greyDark,
  },
  activeTab: {
    borderBottomColor: colors.mint,
  },
  tabText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
    fontWeight: typography.fontWeight.medium,
  },
  activeTabText: {
    color: colors.mint,
    fontWeight: typography.fontWeight.bold,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  invoiceSection: {
    marginBottom: spacing.lg,
  },
  whtBreakdown: {
    backgroundColor: colors.greyDark,
    marginHorizontal: spacing.screenPadding,
    marginTop: -spacing.sm,
    padding: spacing.md,
    borderBottomLeftRadius: spacing.radius.md,
    borderBottomRightRadius: spacing.radius.md,
    borderTopWidth: 1,
    borderTopColor: colors.ink,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
  },
  breakdownValue: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.caption,
    color: colors.white,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.greyMid,
    marginBottom: 0,
  },
  totalLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  totalValue: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.bold,
    color: colors.mint,
  },
  form: {
    paddingHorizontal: spacing.screenPadding,
  },
  pollingStatus: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  pollingText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.gold,
    fontStyle: 'italic',
  },
});
