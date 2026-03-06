import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import {
  StatusBadge,
  SectionCard,
  ActionButton,
  MetricTile,
} from '../../src/components';
import { VatReturn, VatReturnStatus, Invoice } from '@biasharasmart/shared-types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function VatReturnDetailScreen() {
  const { period: id } = useLocalSearchParams<{ period: string }>();
  const router = useRouter();
  const [vatReturn, setVatReturn] = useState<VatReturn | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVatReturn = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_BASE}/api/vat/detail/${id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setVatReturn(data);

        const invRes = await fetch(`${API_BASE}/api/vat/detail/${id}/invoices`);
        if (invRes.ok) {
          const invData = await invRes.json();
          setInvoices(invData);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVatReturn();
  }, [id]);

  const sharePdf = async () => {
    if (!vatReturn) return;
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #00BFA5; padding-bottom: 20px; }
            .title { color: #00BFA5; font-size: 24px; margin: 0; }
            .meta { margin-top: 30px; }
            .section { margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; border-bottom: 1px solid #ddd; padding: 10px; color: #777; font-size: 12px; }    
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .totals { margin-top: 40px; width: 50%; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { border-top: 2px solid #00BFA5; margin-top: 10px; padding-top: 10px; color: #00BFA5; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">VAT Return Statement</h1>
              <p>Period: ${MONTHS[vatReturn.periodMonth - 1]} ${vatReturn.periodYear}</p>
            </div>
            <div style="text-align: right">
              <p><strong>Status:</strong> ${vatReturn.status.toUpperCase()}</p>
              ${vatReturn.gavaconnectAcknowledgement ? `<p><strong>KRA Ack:</strong> ${vatReturn.gavaconnectAcknowledgement}</p>` : ''}
            </div>
          </div>
          <div class="section">
            <h3>Summary</h3>
            <div class="totals" style="margin-left: 0; width: 100%;">
              <div class="total-row"><span>Output VAT (Total Sales)</span><span>KES ${Number(vatReturn.outputVatKes).toLocaleString('en-KE')}</span></div>
              <div class="total-row"><span>Input VAT (Total Purchases)</span><span>KES ${Number(vatReturn.inputVatKes).toLocaleString('en-KE')}</span></div>
              <div class="total-row grand-total"><span>Net VAT Payable</span><span>KES ${Number(vatReturn.netVatKes).toLocaleString('en-KE')}</span></div>
            </div>
          </div>
          <div class="section">
            <h3>Contributing Invoices</h3>
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>INVOICE REF</th>
                  <th>CUSTOMER</th>
                  <th style="text-align:right">VAT AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.map((inv: any) => `
                  <tr>
                    <td>${new Date(inv.createdAt).toLocaleDateString('en-KE')}</td>
                    <td>${inv.id.slice(-8).toUpperCase()}</td>
                    <td>${inv.customerName || 'N/A'}</td>
                    <td style="text-align:right">KES ${Number(inv.vatAmountKes).toLocaleString('en-KE')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `VAT_Return_${MONTHS[vatReturn.periodMonth - 1]}_${vatReturn.periodYear}`,
      });
    } catch (err) {
      console.error('PDF Share error:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.mint} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !vatReturn) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.red} />
          <Text style={styles.errorText}>VAT Return not found</Text>
          <ActionButton label="Go Back" onPress={() => router.back()} variant="ghost" fullWidth={false} />
        </View>
      </SafeAreaView>
    );
  }

  const TimelineItem = ({ label, date, status, isLast }: { label: string, date?: string, status: 'complete' | 'active' | 'pending', isLast?: boolean }) => (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View style={[
          styles.timelineDot, 
          status === 'complete' && styles.dotComplete,
          status === 'active' && styles.dotActive,
        ]} />
        {!isLast && <View style={[styles.timelineLine, status === 'complete' && styles.lineComplete]} />}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineLabel, status === 'pending' && styles.textPending]}>{label}</Text>
        {date && <Text style={styles.timelineDate}>{new Date(date).toLocaleString('en-KE')}</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return Detail</Text>
        <StatusBadge status={vatReturn.status as any} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{MONTHS[vatReturn.periodMonth - 1]} {vatReturn.periodYear}</Text>
          <View style={styles.metricsGrid}>
            <MetricTile label="Output VAT" value={Number(vatReturn.outputVatKes)} unit="KES" />
            <MetricTile label="Input VAT" value={Number(vatReturn.inputVatKes)} unit="KES" />
          </View>
          <View style={styles.netVatBox}>
            <Text style={styles.netVatLabel}>Net VAT Payable</Text>
            <Text style={styles.netVatValue}>KES {Number(vatReturn.netVatKes).toLocaleString('en-KE')}</Text>
          </View>
        </View>

        <SectionCard title="Status Timeline" accentColor={colors.cobalt}>
          <TimelineItem 
            label="Draft Created" 
            date={vatReturn.createdAt} 
            status="complete" 
          />
          <TimelineItem 
            label="Submitted to GavaConnect" 
            date={vatReturn.submittedAt} 
            status={vatReturn.submittedAt ? 'complete' : 'active'} 
          />
          <TimelineItem 
            label="KRA Acknowledged" 
            status={vatReturn.gavaconnectAcknowledgement ? 'complete' : 'pending'} 
            isLast 
          />
        </SectionCard>

        <SectionCard title="Contributing Invoices" accentColor={colors.mint} expandable defaultExpanded={false}>
          {invoices.length > 0 ? (
            invoices.map((inv) => (
              <TouchableOpacity key={inv.id} style={styles.invoiceRow} onPress={() => router.push(`/invoices/${inv.id}`)}>
                <View>
                  <Text style={styles.invoiceRef}>{inv.id.slice(-8).toUpperCase()}</Text>
                  <Text style={styles.invoiceDate}>{new Date(inv.createdAt).toLocaleDateString('en-KE')}</Text>
                </View>
                <Text style={styles.invoiceAmount}>KES {Number(inv.vatAmountKes).toLocaleString('en-KE')}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No invoices for this period</Text>
          )}
        </SectionCard>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <ActionButton 
          label="Download PDF Statement" 
          onPress={sharePdf} 
          variant="secondary"
          icon={<Ionicons name="download-outline" size={20} color={colors.white} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorText: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.heading, color: colors.white, marginTop: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screenPadding, paddingVertical: spacing.md, justifyContent: 'space-between' },
  backButton: { padding: spacing.xs },
  headerTitle: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.heading, fontWeight: typography.fontWeight.bold, color: colors.white, flex: 1, marginLeft: spacing.md },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxl },
  summaryCard: { marginHorizontal: spacing.screenPadding, padding: spacing.md, backgroundColor: colors.greyDark, borderRadius: spacing.radius.md, marginBottom: spacing.md },
  summaryTitle: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.heading, fontWeight: typography.fontWeight.bold, color: colors.white, marginBottom: spacing.md },
  metricsGrid: { flexDirection: 'row', marginHorizontal: -spacing.xs, marginBottom: spacing.md },
  netVatBox: { backgroundColor: colors.ink, padding: spacing.md, borderRadius: spacing.radius.sm, alignItems: 'center' },
  netVatLabel: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption, color: colors.greyMid, textTransform: 'uppercase' },
  netVatValue: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.title, fontWeight: typography.fontWeight.bold, color: colors.mint, marginTop: 4 },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.greyMid, zIndex: 1 },
  dotComplete: { backgroundColor: colors.mint },
  dotActive: { backgroundColor: colors.cobalt },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.greyMid, marginVertical: -2 },
  lineComplete: { backgroundColor: colors.mint },
  timelineContent: { flex: 1, paddingBottom: spacing.lg, paddingLeft: spacing.sm },
  timelineLabel: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold, color: colors.white },
  timelineDate: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption, color: colors.greyMid, marginTop: 2 },
  textPending: { color: colors.greyMid },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.ink },
  invoiceRef: { fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.body, color: colors.white },
  invoiceDate: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption, color: colors.greyMid },
  invoiceAmount: { fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.bold, color: colors.mint },
  emptyText: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.body, color: colors.greyMid, textAlign: 'center', padding: spacing.md },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.ink, padding: spacing.screenPadding, borderTopWidth: 1, borderTopColor: colors.greyDark },
});
