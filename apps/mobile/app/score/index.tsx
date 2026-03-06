import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import {
  ProgressRing,
  ProgressBar,
  SectionCard,
  StatusBadge,
  SkeletonLoader,
} from '../../src/components';
import { useNetworkStatus } from '../../src/lib/network';
import { DashboardSummary, WhtSummary, PaymentMode } from '@biasharasmart/shared-types';

// --- Constants ---
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ScoreData {
  total: number;
  breakdown: {
    consistency: number;
    taxHygiene: number;
    growth: number;
    greenMultiplier: number;
  };
  nextMilestone: number;
  loanEligible: boolean;
}

// --- Component ---
export default function ScoreScreen() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('legacy');

  const fetchScore = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    try {
      // 1. Get business ID from summary
      const summaryRes = await fetch(`${API_BASE}/api/dashboard/summary`);
      if (!summaryRes.ok) throw new Error('Failed to fetch business ID');
      const summary: DashboardSummary = await summaryRes.json();
      const businessId = summary.business.id;

      // 2. Fetch Score
      const scoreRes = await fetch(`${API_BASE}/api/score/${businessId}`);
      if (!scoreRes.ok) throw new Error('Failed to fetch score');
      const data: ScoreData = await scoreRes.json();
      setScoreData(data);

      // 3. Fetch WHT summary for paymentMode
      const whtRes = await fetch(`${API_BASE}/api/payments/wht-summary/${businessId}`);
      if (whtRes.ok) {
        const whtData: WhtSummary = await whtRes.json();
        setPaymentMode(whtData.paymentMode);
      }
    } catch (error) {
      console.error('Score fetch error:', error);
      Alert.alert('Error', 'Could not load your Biashara Score.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScore();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchScore(true);
  };

  if (loading && !scoreData) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.loadingContainer}>
            <SkeletonLoader variant="hero" count={1} />
            <SkeletonLoader variant="row" count={4} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const score = scoreData?.total ?? 0;
  
  // Color logic
  let scoreColor: string = colors.red;
  if (score >= 800) scoreColor = colors.cobalt;
  else if (score >= 600) scoreColor = colors.mint;
  else if (score >= 400) scoreColor = colors.gold;

  const getTips = () => {
    if (!scoreData) return [];
    const tips = [];
    if (scoreData.breakdown.consistency < 200) {
      tips.push({ text: 'Generate more eTIMS receipts daily (+40 pts)', icon: 'receipt' });
    }
    if (scoreData.breakdown.taxHygiene < 150) {
      tips.push({ text: 'Pay your WHT on time (+30 pts per payment)', icon: 'account-balance-wallet' });
    }
    if (paymentMode === 'legacy') {
      tips.push({ text: 'Switch to Gateway (+100 pts)', icon: 'bolt' });
    }
    return tips;
  };

  const tips = getTips();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint} />
        }
      >
        {/* Main Score Ring */}
        <View style={styles.ringSection}>
          <ProgressRing
            progress={score / 1000}
            label={score.toString()}
            sublabel="/ 1000"
            size={220}
            color={scoreColor}
          />
          <View style={styles.badgeContainer}>
            {scoreData?.loanEligible ? (
              <StatusBadge status="compliant" label="LOAN ELIGIBLE" size="large" />
            ) : (
              <StatusBadge status="warning" label="NEEDS IMPROVEMENT" size="large" />
            )}
          </View>
        </View>

        {/* Milestone Card */}
        <View style={styles.milestoneCard}>
          <MaterialIcons name="flag" size={24} color={colors.mint} />
          <View style={styles.milestoneText}>
            <Text style={styles.milestoneLabel}>Next Milestone</Text>
            <Text style={styles.milestoneValue}>
              {scoreData ? (scoreData.nextMilestone - score) : 0} pts to unlock Co-op Bank loan
            </Text>
          </View>
        </View>

        {/* Score Breakdown */}
        <SectionCard title="Score Breakdown" accentColor={colors.mint}>
          <ProgressBar
            label="Consistency"
            current={scoreData?.breakdown.consistency ?? 0}
            max={400}
            color={colors.mint}
          />
          <ProgressBar
            label="Tax Hygiene"
            current={scoreData?.breakdown.taxHygiene ?? 0}
            max={300}
            color={colors.gold}
          />
          <ProgressBar
            label="Growth"
            current={scoreData?.breakdown.growth ?? 0}
            max={300}
            color={colors.cobalt}
          />
          <View style={styles.lockedRow}>
            <MaterialIcons name="lock" size={16} color={colors.greyMid} />
            <Text style={styles.lockedText}>Green Multiplier: Coming in Phase 3</Text>
          </View>
        </SectionCard>

        {/* How to Improve */}
        <SectionCard title="How to Improve" accentColor={colors.gold}>
          {tips.map((tip, idx) => (
            <View key={idx} style={styles.tipRow}>
              <MaterialIcons name={tip.icon as any} size={20} color={colors.mint} />
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
          {tips.length === 0 && (
            <Text style={styles.emptyTips}>You have a perfect score! Keep it up.</Text>
          )}
        </SectionCard>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    padding: spacing.screenPadding,
  },
  ringSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.ink,
  },
  badgeContainer: {
    marginTop: spacing.lg,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greyDark,
    marginHorizontal: spacing.screenPadding,
    padding: spacing.md,
    borderRadius: spacing.radius.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.mint,
  },
  milestoneText: {
    marginLeft: spacing.md,
  },
  milestoneLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    textTransform: 'uppercase',
  },
  milestoneValue: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginTop: 2,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    opacity: 0.6,
  },
  lockedText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    marginLeft: spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyDark,
  },
  tipText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.white,
    marginLeft: spacing.sm,
    flex: 1,
  },
  emptyTips: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.mint,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  footerSpacer: {
    height: 60,
  },
});
