import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import { SectionCard } from '../../src/components';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function ReportsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchBusinessId() {
      try {
        const res = await fetch(`${API_BASE}/api/dashboard/summary`);
        if (res.ok) {
          const data = await res.json();
          setBusinessId(data.business.id);
        }
      } catch (error) {
        console.error('Failed to fetch business ID:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBusinessId();
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2025, 2026];

  const navigateToReport = (type: 'pl' | 'kra' | 'wht') => {
    if (!businessId) return;
    router.push({
      pathname: `/reports/${type}`,
      params: { businessId, month: selectedMonth, year: selectedYear }
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.mint} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SectionCard title="Select Period" accentColor={colors.cobalt}>
          <View style={styles.pickerRow}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Month</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthButton,
                      selectedMonth === index + 1 && styles.selectedMonthButton
                    ]}
                    onPress={() => setSelectedMonth(index + 1)}
                  >
                    <Text style={[
                      styles.monthButtonText,
                      selectedMonth === index + 1 && styles.selectedMonthButtonText
                    ]}>
                      {month.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.pickerRow}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Year</Text>
              <View style={styles.yearRow}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearButton,
                      selectedYear === year && styles.selectedYearButton
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[
                      styles.yearButtonText,
                      selectedYear === year && styles.selectedYearButtonText
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </SectionCard>

        <View style={styles.reportsGrid}>
          <TouchableOpacity 
            style={styles.reportCard}
            onPress={() => navigateToReport('pl')}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.mint + '20' }]}>
              <MaterialIcons name="account-balance" size={32} color={colors.mint} />
            </View>
            <Text style={styles.reportTitle}>Profit & Loss</Text>
            <Text style={styles.reportDesc}>Revenue vs Expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.reportCard}
            onPress={() => navigateToReport('kra')}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.gold + '20' }]}>
              <MaterialIcons name="reorder" size={32} color={colors.gold} />
            </View>
            <Text style={styles.reportTitle}>KRA Reconciliation</Text>
            <Text style={styles.reportDesc}>Invoices vs Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.reportCard}
            onPress={() => navigateToReport('wht')}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.red + '20' }]}>
              <MaterialIcons name="assignment" size={32} color={colors.red} />
            </View>
            <Text style={styles.reportTitle}>WHT Statement</Text>
            <Text style={styles.reportDesc}>Tax Liability History</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  pickerRow: {
    marginBottom: spacing.md,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
    marginBottom: spacing.xs,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  monthButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.full,
    backgroundColor: colors.greyDark,
    marginRight: spacing.xs,
  },
  selectedMonthButton: {
    backgroundColor: colors.cobalt,
  },
  monthButtonText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
  },
  selectedMonthButtonText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  yearRow: {
    flexDirection: 'row',
  },
  yearButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.full,
    backgroundColor: colors.greyDark,
    marginRight: spacing.sm,
  },
  selectedYearButton: {
    backgroundColor: colors.cobalt,
  },
  yearButtonText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
  },
  selectedYearButtonText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  reportsGrid: {
    paddingHorizontal: spacing.screenPadding,
    flexDirection: 'column',
  },
  reportCard: {
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'column',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reportTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: 4,
  },
  reportDesc: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
  },
});
