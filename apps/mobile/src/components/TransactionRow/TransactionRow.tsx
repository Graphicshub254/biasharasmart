
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export type TransactionType = 'income' | 'expense' | 'pending' | 'failed';

export interface TransactionRowProps {
  id: string;
  type: TransactionType;
  title: string;          // customer name or description
  subtitle?: string;      // invoice number or reference
  amount: number;         // KES
  timestamp: Date;
  onPress?: () => void;
  isLoading?: boolean;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  type, title, subtitle, amount, timestamp, onPress, isLoading = false,
}) => {
  const isCredit = type === 'income';
  const amountColor = type === 'income' ? colors.mint
    : type === 'failed' ? colors.red
    : type === 'pending' ? colors.gold
    : colors.white;

  if (isLoading) return <View style={styles.skeleton} />;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconDot, styles[`dot_${type}`]]} />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {isCredit ? '+' : '-'}KES {Math.abs(amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.time}>
          {timestamp.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.screenPadding,
    borderBottomWidth: 1, borderBottomColor: colors.greyDark,
  },
  skeleton: {
    height: 64, marginHorizontal: spacing.screenPadding,
    backgroundColor: colors.greyDark, borderRadius: spacing.radius.sm,
    opacity: 0.4, marginBottom: spacing.sm,
  },
  iconDot: {
    width: 10, height: 10, borderRadius: 5, marginRight: spacing.md,
  },
  dot_income:  { backgroundColor: colors.mint },
  dot_expense: { backgroundColor: colors.greyMid },
  dot_pending: { backgroundColor: colors.gold },
  dot_failed:  { backgroundColor: colors.red },
  details: { flex: 1 },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  subtitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid, marginTop: 2,
  },
  right: { alignItems: 'flex-end' },
  amount: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  time: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid, marginTop: 2,
  },
});
