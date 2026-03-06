import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import { SectionCard, ActionButton } from '../../src/components';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface KraRow {
  invoiceRef: string;
  cuNumber: string;
  status: string;
  totalKes: number;
  vatKes: number;
  mpesaCode: string;
  paymentDate: string | null;
}

interface KraReport {
  period: { month: number; year: number };
  rows: KraRow[];
  totalVatDue: number;
  unregistered: number;
  generatedAt: string;
}

export default function KraReportScreen() {
  const { businessId, month, year } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<KraReport | null>(null);

  useEffect(() => {
    fetchReport();
  }, [businessId, month, year]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${businessId}/kra?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        Alert.alert('Error', 'Failed to fetch KRA reconciliation report');
      }
    } catch (error) {
      console.error('Fetch report error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async () => {
    if (!report) return;

    const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { backgroundColor: #f2f2f2; }
            .total { margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KRA Reconciliation Report</h1>
            <p>Period: ${new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Inv Ref</th>
                <th>CU Number</th>
                <th>Status</th>
                <th>Total KES</th>
                <th>VAT KES</th>
                <th>M-Pesa</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${report.rows.map(row => `
                <tr>
                  <td>${row.invoiceRef}</td>
                  <td>${row.cuNumber}</td>
                  <td>${row.status}</td>
                  <td>${row.totalKes.toLocaleString()}</td>
                  <td>${row.vatKes.toLocaleString()}</td>
                  <td>${row.mpesaCode}</td>
                  <td>${row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Total VAT Due: KES ${report.totalVatDue.toLocaleString()}</p>
            <p>Unregistered Invoices: ${report.unregistered}</p>
          </div>
          <p style="font-size: 10px; margin-top: 30px;">Generated at ${new Date(report.generatedAt).toLocaleString()}</p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.mint} />
      </View>
    );
  }

  if (!report) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SectionCard title="Summary" accentColor={colors.gold}>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Total VAT Due</Text>
            <Text style={styles.value}>KES {report.totalVatDue.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Unregistered</Text>
            <Text style={[styles.value, report.unregistered > 0 && { color: colors.red }]}>
              {report.unregistered}
            </Text>
          </View>
        </SectionCard>

        <SectionCard title="Invoices" accentColor={colors.cobalt}>
          {report.rows.map((row, idx) => (
            <View key={idx} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.invRef}>#{row.invoiceRef}</Text>
                <Text style={styles.amount}>KES {row.totalKes.toLocaleString()}</Text>
              </View>
              <View style={styles.rowDetails}>
                <Text style={styles.detailText}>CU: {row.cuNumber}</Text>
                <Text style={styles.detailText}>M-Pesa: {row.mpesaCode}</Text>
              </View>
              <View style={styles.rowFooter}>
                <Text style={styles.vatText}>VAT: KES {row.vatKes.toLocaleString()}</Text>
                <Text style={styles.dateText}>
                  {row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : row.status}
                </Text>
              </View>
            </View>
          ))}
          {report.rows.length === 0 && (
            <Text style={styles.emptyText}>No invoices in this period</Text>
          )}
        </SectionCard>

        <View style={styles.actionContainer}>
          <ActionButton label="Export PDF Report" onPress={exportPdf} variant="primary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },
  loadingContainer: { flex: 1, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingVertical: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  label: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.body, color: colors.greyMid },
  value: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.bold, color: colors.white },
  row: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.greyDark },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  invRef: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.bold, color: colors.white },
  amount: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.bold, color: colors.mint },
  rowDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  detailText: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption, color: colors.greyMid },
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  vatText: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption, color: colors.gold },
  dateText: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption, color: colors.greyMid },
  emptyText: { textAlign: 'center', color: colors.greyMid, paddingVertical: spacing.lg },
  actionContainer: { paddingHorizontal: spacing.screenPadding, marginTop: spacing.lg, paddingBottom: spacing.xl },
});
