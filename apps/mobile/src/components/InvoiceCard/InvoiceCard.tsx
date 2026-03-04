
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import { StatusBadge } from '../StatusBadge/StatusBadge';

export type InvoiceStatus = 'draft' | 'pending_kra' | 'issued' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceCardProps {
  id: string;
  customerName: string;
  amount: number;
  status: InvoiceStatus;
  cuNumber?: string;        // KRA CU number — shown as verified badge
  daysCounter?: number;     // days overdue or days until due
  invoiceNumber?: string;
  onPress?: () => void;
  isLoading?: boolean;
}

const STATUS_MAP: Record<InvoiceStatus, 'compliant'|'warning'|'lapsed'|'pending'|'filed'|'overdue'> = {
  draft: 'pending', pending_kra: 'pending', issued: 'filed',
  paid: 'compliant', overdue: 'overdue', cancelled: 'lapsed',
};

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  customerName, amount, status, cuNumber, daysCounter, invoiceNumber, onPress, isLoading = false,
}) => {
  if (isLoading) return <View style={[styles.container, styles.skeleton]} />;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.customer} numberOfLines={1}>{customerName}</Text>
        <StatusBadge status={STATUS_MAP[status]} size="small" />
      </View>
      {invoiceNumber && <Text style={styles.invoiceNum}>{invoiceNumber}</Text>}
      <View style={styles.footer}>
        <Text style={styles.amount}>
          KES {amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </Text>
        {cuNumber && (
          <View style={styles.cuBadge}>
            <Text style={styles.cuText}>KRA ✓ {cuNumber.slice(-8)}</Text>
          </View>
        )}
        {daysCounter !== undefined && status === 'overdue' && (
          <Text style={styles.daysOverdue}>{daysCounter}d overdue</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.greyDark, borderRadius: spacing.radius.md,
    padding: spacing.md, marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  skeleton: { height: 100, opacity: 0.4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customer: {
    fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold, color: colors.white, flex: 1, marginRight: spacing.sm,
  },
  invoiceNum: {
    fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.caption,
    color: colors.greyMid, marginTop: 2,
  },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, justifyContent: 'space-between' },
  amount: {
    fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold, color: colors.mint,
  },
  cuBadge: {
    backgroundColor: colors.greenBg, borderRadius: spacing.radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  cuText: {
    fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.caption,
    color: colors.green, fontWeight: typography.fontWeight.semibold,
  },
  daysOverdue: {
    fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption,
    color: colors.orange, fontWeight: typography.fontWeight.medium,
  },
});
