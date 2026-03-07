import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '@biasharasmart/ui-tokens';

// Mock business ID - in real app would come from auth context
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8';
const API_URL = 'http://localhost:3000/api';

interface CarbonSummary {
  currentMonth: {
    totalKwh: number;
    carbonKgAvoided: number;
    dividendKes: number;
    kncrRef: string | null;
    status: string;
  };
  greenMultiplierActive: boolean;
  assetsCount: number;
  history: Array<{ month: string; kwh: number; carbon: number }>;
}

export default function CarbonDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CarbonSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/carbon/${BUSINESS_ID}`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching carbon summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.mint} />
      </View>
    );
  }

  const maxKwh = Math.max(...(summary?.history.map(h => h.kwh) || [1]));

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint} />}
    >
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Generation (kWh)</Text>
        <Text style={styles.summaryValue}>{summary?.currentMonth.totalKwh.toFixed(1)}</Text>
        
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.subLabel}>CO2 Avoided</Text>
            <Text style={styles.subValue}>{summary?.currentMonth.carbonKgAvoided.toFixed(2)} kg</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.subLabel}>Est. Dividend</Text>
            <Text style={styles.subValue}>KES {summary?.currentMonth.dividendKes.toLocaleString()}</Text>
          </View>
        </View>

        {summary?.currentMonth.kncrRef && (
          <View style={styles.kncrContainer}>
            <MaterialIcons name="verified" size={16} color={colors.ink} />
            <Text style={styles.kncrText}>KNCR: {summary.currentMonth.kncrRef}</Text>
          </View>
        )}
      </View>

      {/* Multiplier Badge */}
      <View style={[styles.multiplierBadge, summary?.greenMultiplierActive ? styles.activeBadge : styles.inactiveBadge]}>
        <MaterialIcons 
          name={summary?.greenMultiplierActive ? "auto-awesome" : "lock"} 
          size={20} 
          color={colors.white} 
        />
        <Text style={styles.multiplierText}>
          {summary?.greenMultiplierActive 
            ? "+50 Bia Score pts ACTIVE" 
            : "Generate 100+ kWh to unlock multiplier"}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/carbon/log-reading')}
        >
          <MaterialIcons name="add-chart" size={24} color={colors.white} />
          <Text style={styles.actionText}>Log Reading</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.greyDark }]}
          onPress={() => router.push('/carbon/add-asset')}
        >
          <MaterialIcons name="add-business" size={24} color={colors.white} />
          <Text style={styles.actionText}>Add Asset</Text>
        </TouchableOpacity>
      </View>

      {/* History Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Generation</Text>
        <View style={styles.chartContainer}>
          {summary?.history.map((h, i) => (
            <View key={i} style={styles.chartBarGroup}>
              <View style={styles.barBackground}>
                <View 
                  style={[
                    styles.barFill, 
                    { height: `${(h.kwh / maxKwh) * 100}%` || '0%' }
                  ]} 
                />
              </View>
              <Text style={styles.chartLabel}>{h.month}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    padding: spacing.screenPadding,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: colors.mint,
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  summaryLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.ink,
    opacity: 0.8,
  },
  summaryValue: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink,
    marginVertical: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(7, 42, 39, 0.1)',
  },
  subLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.ink,
    opacity: 0.7,
  },
  subValue: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(7, 42, 39, 0.1)',
    marginHorizontal: spacing.lg,
  },
  kncrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.radius.sm,
  },
  kncrText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 10,
    color: colors.ink,
    marginLeft: 4,
    fontWeight: typography.fontWeight.bold,
  },
  multiplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    marginBottom: spacing.lg,
  },
  activeBadge: {
    backgroundColor: colors.mint,
  },
  inactiveBadge: {
    backgroundColor: colors.greyMid,
    opacity: 0.6,
  },
  multiplierText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.mint,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
  },
  chartBarGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 20,
    height: 100,
    backgroundColor: colors.ink,
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.mint,
    borderRadius: 10,
  },
  chartLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 10,
    color: colors.greyMid,
    marginTop: spacing.xs,
  },
});
