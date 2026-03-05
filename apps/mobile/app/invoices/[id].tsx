import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import {
  StatusBadge,
  SectionCard,
  SkeletonLoader,
  ActionButton,
} from '../../src/components';
import { StatusType } from '../../src/components/StatusBadge/StatusBadge';
import { Invoice, InvoiceStatus } from '@biasharasmart/shared-types';

const { width } = Dimensions.get('window');

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const statusToBadge = (status: InvoiceStatus): { type: StatusType; label: string } => {
  switch (status) {
    case InvoiceStatus.PAID:
      return { type: 'filed', label: 'PAID' };
    case InvoiceStatus.ISSUED:
      return { type: 'compliant', label: 'ISSUED' };
    case InvoiceStatus.PENDING_KRA:
      return { type: 'pending', label: 'PENDING KRA' };
    case InvoiceStatus.OVERDUE:
      return { type: 'overdue', label: 'OVERDUE' };
    case InvoiceStatus.CANCELLED:
      return { type: 'lapsed', label: 'CANCELLED' };
    default:
      return { type: 'pending', label: status.toUpperCase() };
  }
};

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_BASE}/api/invoices/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setInvoice(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoice();
  }, [id]);

  const markAsPaid = async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInvoice(updated);
      }
    } catch (err) {
      console.error('Mark as paid error:', err);
    }
  };

  const syncKra = async () => {
    if (!id) return;
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/invoices/${id}/sync`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setInvoice(updated);
      }
    } catch (err) {
      console.error('Sync KRA error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const sharePdf = async () => {
    if (!invoice) return;
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #003366; padding-bottom: 20px; }
            .title { color: #003366; font-size: 24px; margin: 0; }
            .meta { margin-top: 30px; }
            .section { margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; border-bottom: 1px solid #ddd; padding: 10px; color: #777; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .totals { margin-top: 40px; width: 40%; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { border-top: 2px solid #00BFA5; margin-top: 10px; padding-top: 10px; color: #00BFA5; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">BiasharaSmart Invoice</h1>
              <p>Ref: ${invoice.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div class="meta">
            <p><strong>Customer:</strong> ${invoice.customerName ?? 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('en-KE')}</p>
            ${invoice.cuNumber ? `<p><strong>KRA CU:</strong> ${invoice.cuNumber}</p>` : ''}
          </div>
          <div class="section">
            <table>
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th style="text-align:center">QTY</th>
                  <th style="text-align:right">PRICE</th>
                  <th style="text-align:right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.lineItems.map((item: any) => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align:center">${item.quantity}</td>
                    <td style="text-align:right">KES ${parseFloat(item.unitPrice).toLocaleString('en-KE')}</td>
                    <td style="text-align:right">KES ${parseFloat(item.total).toLocaleString('en-KE')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>KES ${parseFloat(invoice.subtotalKes.toString()).toLocaleString('en-KE')}</span>
            </div>
            <div class="total-row">
              <span>VAT (16%)</span>
              <span>KES ${parseFloat(invoice.vatAmountKes.toString()).toLocaleString('en-KE')}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total</span>
              <span>KES ${parseFloat(invoice.totalKes.toString()).toLocaleString('en-KE')}</span>
            </div>
          </div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Invoice ${invoice.id.slice(-8).toUpperCase()}`,
      });
    } catch (err) {
      console.error('PDF Share error:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scroll}>
          <SkeletonLoader variant="card" count={4} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.red} />
          <Text style={styles.errorText}>Invoice not found</Text>
          <ActionButton
            label="Go Back"
            onPress={() => router.back()}
            variant="ghost"
            fullWidth={false}
          />
        </View>
      </SafeAreaView>
    );
  }

  const badgeConfig = statusToBadge(invoice.status);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <StatusBadge status={badgeConfig.type} label={badgeConfig.label} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Meta Card */}
        <View style={styles.metaCard}>
          <Text style={styles.invoiceRef}>{invoice.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.customerName}>{invoice.customerName || 'Walk-in Customer'}</Text>
          {invoice.customerPhone && (
            <Text style={styles.customerPhone}>{invoice.customerPhone}</Text>
          )}
          
          {invoice.cuNumber && (
            <View style={styles.kraBadge}>
              <Text style={styles.kraBadgeText}>KRA ✓ {invoice.cuNumber}</Text>
            </View>
          )}
          
          <Text style={styles.dateLabel}>
            Issued on {new Date(invoice.createdAt).toLocaleDateString('en-KE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>

        {/* Items Section */}
        <SectionCard title="Items" accentColor={colors.mint}>
          {invoice.lineItems.map((item, index) => (
            <View key={index} style={styles.lineItem}>
              <View style={styles.lineItemLeft}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.vatLabel}>VAT {item.vatRate * 100}%</Text>
              </View>
              <View style={styles.lineItemCenter}>
                <Text style={styles.itemQtyPrice}>
                  {item.quantity} x {parseFloat(item.unitPrice.toString()).toLocaleString('en-KE')}
                </Text>
              </View>
              <View style={styles.lineItemRight}>
                <Text style={styles.itemTotal}>
                  {parseFloat(item.total.toString()).toLocaleString('en-KE')}
                </Text>
              </View>
            </View>
          ))}
        </SectionCard>

        {/* Totals Card */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              KES {parseFloat(invoice.subtotalKes.toString()).toLocaleString('en-KE')}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.greyMid }]}>VAT 16%</Text>
            <Text style={[styles.totalValue, { color: colors.greyMid }]}>
              KES {parseFloat(invoice.vatAmountKes.toString()).toLocaleString('en-KE')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              KES {parseFloat(invoice.totalKes.toString()).toLocaleString('en-KE')}
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <ActionButton
              label="Share PDF"
              onPress={sharePdf}
              variant="secondary"
              icon={<Ionicons name="share-outline" size={20} color={colors.white} />}
            />
          </View>
          {(invoice.status === InvoiceStatus.ISSUED || invoice.status === InvoiceStatus.PENDING_KRA) && (
            <View style={{ flex: 1 }}>
              <ActionButton
                label="Mark as Paid"
                onPress={markAsPaid}
                variant="primary"
                icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />}
              />
            </View>
          )}
        </View>
        {invoice.offlineQueued && (
          <View style={{ marginTop: spacing.sm }}>
            <ActionButton
              label={syncing ? "Syncing..." : "Sync KRA"}
              onPress={syncKra}
              variant="ghost"
              isLoading={syncing}
              icon={<Ionicons name="cloud-upload-outline" size={20} color={colors.cobalt} />}
            />
          </View>
        )}
      </View>
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
    justifyContent: 'space-between',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    flex: 1,
    marginLeft: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  metaCard: {
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    marginHorizontal: spacing.screenPadding,
    padding: spacing.cardPadding,
    marginBottom: spacing.md,
  },
  invoiceRef: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
    marginBottom: spacing.xs,
  },
  customerName: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: 4,
  },
  customerPhone: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
    marginBottom: spacing.md,
  },
  kraBadge: {
    backgroundColor: colors.greenBg,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.radius.full,
    marginBottom: spacing.md,
  },
  kraBadgeText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.green,
    fontWeight: typography.fontWeight.bold,
  },
  dateLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
  },
  lineItemLeft: {
    flex: 2,
  },
  lineItemCenter: {
    flex: 1.5,
    alignItems: 'center',
  },
  lineItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemDescription: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.white,
  },
  vatLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
  },
  itemQtyPrice: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
    textAlign: 'center',
  },
  itemTotal: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.body,
    color: colors.mint,
    fontWeight: typography.fontWeight.bold,
  },
  totalsCard: {
    marginHorizontal: spacing.screenPadding,
    padding: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.white,
  },
  totalValue: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.body,
    color: colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: colors.greyDark,
    marginVertical: spacing.sm,
  },
  grandTotalLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  grandTotalValue: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.mint,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.ink,
    padding: spacing.screenPadding,
    borderTopWidth: 1,
    borderTopColor: colors.greyDark,
  },
  footerActions: {
    flexDirection: 'row',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    color: colors.white,
    marginTop: spacing.md,
  },
});
