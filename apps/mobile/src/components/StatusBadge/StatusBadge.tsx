
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export type StatusType = 'compliant' | 'warning' | 'lapsed' | 'pending' | 'filed' | 'overdue' | 'draft' | 'submitted';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG: Record<StatusType, { color: string; bg: string; icon: string; defaultLabel: string }> = {
  compliant: { color: colors.green,  bg: colors.greenBg,  icon: '✓', defaultLabel: 'Compliant' },
  warning:   { color: colors.gold,   bg: colors.goldBg,   icon: '!', defaultLabel: 'Action Required' },
  lapsed:    { color: colors.red,    bg: colors.redBg,    icon: '✕', defaultLabel: 'Lapsed' },
  pending:   { color: colors.greyMid,bg: colors.grey1,    icon: '…', defaultLabel: 'Pending' },
  filed:     { color: colors.teal,   bg: colors.tealLight, icon: '✓', defaultLabel: 'Filed' },
  overdue:   { color: colors.orange, bg: colors.orangeBg, icon: '!', defaultLabel: 'Overdue' },
  draft:     { color: colors.greyMid,bg: colors.greyDark, icon: '✎', defaultLabel: 'Draft' },
  submitted: { color: colors.mint,   bg: colors.cobalt,   icon: '↑', defaultLabel: 'Submitted' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status, label, size = 'medium',
}) => {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.defaultLabel;
  return (
    <View style={[styles.container, styles[size], { backgroundColor: config.bg }]}>
      <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
      <Text style={[styles.label, { color: config.color }]}>{displayLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: spacing.radius.full,
    paddingHorizontal: spacing.sm,
  },
  small:  { paddingVertical: 2 },
  medium: { paddingVertical: spacing.xs },
  large:  { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  icon: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    marginRight: 4,
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.semibold,
  },
});
