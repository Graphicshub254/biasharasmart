
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export type BalanceCardVariant = 'large' | 'medium' | 'compact';

export interface BalanceCardProps {
  amount: number;          // amount in KES
  label: string;           // e.g. "This Month's Revenue"
  variant?: BalanceCardVariant;
  isBlurred?: boolean;     // blur-to-hide toggle
  onToggleBlur?: () => void;
  trend?: number;          // % change from last period
  isLoading?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  amount,
  label,
  variant = 'large',
  isBlurred = false,
  onToggleBlur,
  trend,
  isLoading = false,
}) => {
  const formattedAmount = isBlurred
    ? '••••••'
    : `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  if (isLoading) {
    return <View style={[styles.container, styles.skeleton]} />;
  }

  return (
    <View style={[styles.container, styles[variant]]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onToggleBlur} activeOpacity={0.8}>
        <Text style={styles.amount}>{formattedAmount}</Text>
      </TouchableOpacity>
      {trend !== undefined && (
        <Text style={[styles.trend, trend >= 0 ? styles.trendUp : styles.trendDown]}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs last month
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink,
    borderRadius: spacing.radius.lg,
    padding: spacing.cardPadding,
  },
  large: { minHeight: 160 },
  medium: { minHeight: 120 },
  compact: { minHeight: 80 },
  skeleton: {
    backgroundColor: colors.greyDark,
    opacity: 0.4,
    minHeight: 160,
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.medium,
    color: colors.greyMid,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amount: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.black,
    color: colors.mint,
    letterSpacing: -1,
  },
  trend: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  trendUp:   { color: colors.mint },
  trendDown: { color: colors.red },
});
