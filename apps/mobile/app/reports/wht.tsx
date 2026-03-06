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

interface WhtRow {
  id: string;
  paymentId: string;
  amountKes: number;
  dueDate: string;
  status: string;
  mpesaCode: string;
  createdAt: string;
}

interface WhtReport {
  period: { month: number; year: number };
  rows: WhtRow[];
  totalOwed: number;
  totalPaid: number;
  generatedAt: string;
}

export default function WhtReportScreen() {
  const { businessId, month, year } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WhtReport | null>(null);

  useEffect(() => {
    fetchReport();
  }, [businessId, month, year]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${businessId}/wht?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        Alert.alert('Error', 'Failed to fetch WHT statement');
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
            .status-paid { color: green; }
            .status-pending { color: orange; }
            .status-overdue { color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>WHT Liability Statement</h1>
            <p>Period: ${new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date Created</th>
                <th>Due Date</th>
                <th>M-Pesa</th>
                <th>Amount KES</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${report.rows.map(row => `
                <tr>
                  <td>${new Date(row.createdAt).toLocaleDateString()}</td>
                  <td>${new Date(row.dueDate).toLocaleDateString()}</td>
                  <td>${row.mpesaCode}</td>
                  <td>${row.amountKes.toLocaleString()}</td>
                  <td class="status-${row.status.toLowerCase()}">${row.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 20px;">
            <p><strong>Total Paid:</strong> KES ${report.totalPaid.toLocaleString()}</p>
            <p><strong>Total Outstanding:</strong> KES ${report.totalOwed.toLocaleString()}</p>
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
        <SectionCard title="Statement Summary" accentColor={colors.red}>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Outstanding Balance</Text>
            <Text style={[styles.value, { color: colors.red }]}>KES {report.totalOwed.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Total Paid (This Month)</Text>
            <Text style={[styles.value, { color: colors.mint }]}>KES {report.totalPaid.toLocaleString()}</Text>
          </View>
        </SectionCard>

        <SectionCard title="WHT Liabilities" accentColor={colors.cobalt}>
          {report.rows.map((row, idx) => (
            <View key={idx} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.dateText}>{new Date(row.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.amount}>KES {row.amountKes.toLocaleString()}</Text>
              </View>
              <View style={styles.rowFooter}>
                <Text style={styles.detailText}>Due: {new Date(row.dueDate).toLocaleDateString()}</Text>
                <Text style={[
                  styles.statusText,
                  row.status === 'paid' ? { color: colors.mint } : 
                  row.status === 'overdue' ? { color: colors.red } : { color: colors.gold }
                ]}>
                  {row.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
          {report.rows.length === 0 && (
            <Text style={styles.emptyText}>No WHT liabilities in this period</Text>
          )}
        </SectionCard>

        <View style={styles.actionContainer}>
          <ActionButton label="Export PDF Statement" onPress={exportPdf} variant="primary" />
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
  dateText: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption, color: colors.greyMid },
  amount: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.bold, color: colors.white },
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  detailText: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption, color: colors.greyMid },
  statusText: { fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.bold },
  emptyText: { textAlign: 'center', color: colors.greyMid, paddingVertical: spacing.lg },
  actionContainer: { paddingHorizontal: spacing.screenPadding, marginTop: spacing.lg, paddingBottom: spacing.xl },
});
