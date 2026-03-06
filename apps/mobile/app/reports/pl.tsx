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

interface PlReport {
  period: { month: number; year: number };
  revenue: number;
  vatCollected: number;
  whtDeducted: number;
  netRevenue: number;
  invoiceCount: number;
  paymentCount: number;
  generatedAt: string;
}

export default function PlReportScreen() {
  const { businessId, month, year } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<PlReport | null>(null);

  useEffect(() => {
    fetchReport();
  }, [businessId, month, year]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${businessId}/pl?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        Alert.alert('Error', 'Failed to fetch P&L report');
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #2D3436; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .brand { color: #00D2FF; font-size: 24px; font-weight: bold; }
            .title { font-size: 28px; font-weight: bold; text-transform: uppercase; margin: 0; }
            .period { color: #636E72; font-size: 16px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #2D3436; border-bottom: 1px solid #DFE6E9; padding-bottom: 10px; margin-bottom: 15px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F1F2F6; }
            .label { color: #636E72; }
            .value { font-weight: bold; }
            .total-row { display: flex; justify-content: space-between; padding: 20px 0; margin-top: 10px; border-top: 2px solid #2D3436; font-size: 20px; font-weight: bold; }
            .footer { margin-top: 50px; font-size: 12px; color: #B2BEC3; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">BiasharaSmart</div>
              <h1 class="title">Profit & Loss Statement</h1>
            </div>
            <div class="period">${new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
          </div>

          <div class="section">
            <div class="section-title">Revenue & Taxes</div>
            <div class="row">
              <div class="label">Gross Revenue (Confirmed Payments)</div>
              <div class="value">KES ${report.revenue.toLocaleString()}</div>
            </div>
            <div class="row">
              <div class="label">VAT Collected (Paid Invoices)</div>
              <div class="value">KES ${report.vatCollected.toLocaleString()}</div>
            </div>
            <div class="row">
              <div class="label">Withholding Tax (WHT) Deducted</div>
              <div class="value">- KES ${report.whtDeducted.toLocaleString()}</div>
            </div>
            <div class="total-row">
              <div>Net Revenue</div>
              <div>KES ${report.netRevenue.toLocaleString()}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Activity Summary</div>
            <div class="row">
              <div class="label">Invoices Issued</div>
              <div class="value">${report.invoiceCount}</div>
            </div>
            <div class="row">
              <div class="label">Payments Received</div>
              <div class="value">${report.paymentCount}</div>
            </div>
          </div>

          <div class="footer">
            Generated on ${new Date(report.generatedAt).toLocaleString()} • BiasharaSmart Reports
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate or share PDF');
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
        <SectionCard title="Revenue Breakdown" accentColor={colors.mint}>
          <View style={styles.row}>
            <Text style={styles.label}>Gross Revenue</Text>
            <Text style={styles.value}>KES {report.revenue.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>VAT Collected</Text>
            <Text style={styles.value}>KES {report.vatCollected.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>WHT Deducted</Text>
            <Text style={styles.value}>- KES {report.whtDeducted.toLocaleString()}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Net Revenue</Text>
            <Text style={styles.totalValue}>KES {report.netRevenue.toLocaleString()}</Text>
          </View>
        </SectionCard>

        <SectionCard title="Transaction Volume" accentColor={colors.cobalt}>
          <View style={styles.row}>
            <Text style={styles.label}>Invoices Processed</Text>
            <Text style={styles.value}>{report.invoiceCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Confirmed Payments</Text>
            <Text style={styles.value}>{report.paymentCount}</Text>
          </View>
        </SectionCard>

        <View style={styles.actionContainer}>
          <ActionButton
            label="Export PDF Statement"
            onPress={exportPdf}
            variant="primary"
          />
        </View>

        <Text style={styles.footerText}>
          Generated at: {new Date(report.generatedAt).toLocaleString()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
  },
  value: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  totalRow: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.greyDark,
    paddingTop: spacing.md,
  },
  totalLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.mint,
  },
  totalValue: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.mint,
  },
  actionContainer: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
  },
  footerText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 10,
    color: colors.greyMid,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
});
