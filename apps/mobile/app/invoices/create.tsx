import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import { InputField } from '../../src/components/InputField/InputField';
import { ActionButton } from '../../src/components/ActionButton/ActionButton';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8'; // temp until auth in T1.6

type LineItemForm = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: number;
};

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { id: Math.random().toString(), description: '', quantity: '1', unitPrice: '', vatRate: 0.16 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    lineItems.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const lineTotal = qty * price;
      subtotal += lineTotal;
      vat += lineTotal * item.vatRate;
    });
    return { subtotal, vat, total: subtotal + vat };
  }, [lineItems]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Math.random().toString(), description: '', quantity: '1', unitPrice: '', vatRate: 0.16 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, updates: Partial<LineItemForm>) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const isValid = lineItems.every(item => 
    item.description.trim() !== '' && 
    parseFloat(item.quantity) > 0 && 
    parseFloat(item.unitPrice) >= 0
  );

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert('Invalid Form', 'Please fill in all line item details correctly.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: BUSINESS_ID,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          lineItems: lineItems.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            vatRate: item.vatRate,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create invoice');
      }

      const invoice = await res.json();
      // Temporary until T1.3c builds detail screen
      Alert.alert('Success', 'Invoice created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Invoice</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <InputField
              label="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. John Doe"
            />
            <InputField
              label="Customer Phone"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="e.g. 0712345678"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Line Items</Text>
              <TouchableOpacity onPress={addLineItem} style={styles.addGhost}>
                <Ionicons name="add-circle-outline" size={20} color={colors.mint} />
                <Text style={styles.addGhostText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {lineItems.map((item, index) => {
              const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
              return (
                <View key={item.id} style={styles.lineItemCard}>
                  <View style={styles.lineItemTop}>
                    <Text style={styles.lineItemNumber}>Item {index + 1}</Text>
                    {lineItems.length > 1 && (
                      <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                        <Ionicons name="trash-outline" size={20} color={colors.red} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <InputField
                    label="Description"
                    value={item.description}
                    onChangeText={(text) => updateLineItem(item.id, { description: text })}
                    placeholder="What are you charging for?"
                  />

                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <InputField
                        label="Qty"
                        value={item.quantity}
                        onChangeText={(text) => updateLineItem(item.id, { quantity: text })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 2 }}>
                      <InputField
                        label="Unit Price (KES)"
                        value={item.unitPrice}
                        onChangeText={(text) => updateLineItem(item.id, { unitPrice: text })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.vatRow}>
                    <Text style={styles.vatLabel}>VAT Rate</Text>
                    <View style={styles.vatPills}>
                      <TouchableOpacity 
                        style={[styles.vatPill, item.vatRate === 0.16 && styles.vatPillActive]}
                        onPress={() => updateLineItem(item.id, { vatRate: 0.16 })}
                      >
                        <Text style={[styles.vatPillText, item.vatRate === 0.16 && styles.vatPillTextActive]}>16%</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.vatPill, item.vatRate === 0 && styles.vatPillActive]}
                        onPress={() => updateLineItem(item.id, { vatRate: 0 })}
                      >
                        <Text style={[styles.vatPillText, item.vatRate === 0 && styles.vatPillTextActive]}>0%</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.lineTotal}>
                      KES {lineTotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>KES {totals.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT Total</Text>
              <Text style={styles.totalValue}>KES {totals.vat.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.white }]}>Grand Total</Text>
              <Text style={styles.grandTotal}>KES {totals.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>

          <View style={styles.actionWrapper}>
            <ActionButton
              label="Create Invoice"
              onPress={handleSubmit}
              isLoading={submitting}
              isDisabled={!isValid}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.semibold,
    color: colors.greyMid,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addGhost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addGhostText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.semibold,
    color: colors.mint,
    marginLeft: 4,
  },
  lineItemCard: {
    backgroundColor: colors.greyDark + '33', // faint overlay
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.greyDark,
  },
  lineItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lineItemNumber: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    fontWeight: typography.fontWeight.bold,
  },
  row: {
    flexDirection: 'row',
  },
  vatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  vatLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    marginRight: spacing.sm,
  },
  vatPills: {
    flexDirection: 'row',
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.sm,
    padding: 2,
  },
  vatPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.radius.sm - 2,
  },
  vatPillActive: {
    backgroundColor: colors.cobalt,
  },
  vatPillText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 10,
    color: colors.greyMid,
    fontWeight: typography.fontWeight.bold,
  },
  vatPillTextActive: {
    color: colors.white,
  },
  lineTotal: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.mint,
  },
  totalsSection: {
    backgroundColor: colors.greyDark + '11',
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
  },
  totalValue: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.body,
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: colors.greyDark,
    marginVertical: spacing.md,
  },
  grandTotal: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.mint,
  },
  actionWrapper: {
    marginTop: spacing.md,
  },
});
