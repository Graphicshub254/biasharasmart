
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;          // e.g. "KES" or "days"
  trend?: number;         // % change
  accentColor?: string;
  onPress?: () => void;
  isLoading?: boolean;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label, value, unit, trend, accentColor = colors.mint, onPress, isLoading = false,
}) => {
  if (isLoading) return <View style={styles.skeleton} />;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={styles.valueRow}>
        {unit && <Text style={[styles.unit, { color: accentColor }]}>{unit}</Text>}
        <Text style={[styles.value, { color: accentColor }]}>
          {typeof value === 'number' ? value.toLocaleString('en-KE') : value}
        </Text>
      </View>
      {trend !== undefined && (
        <Text style={[styles.trend, trend >= 0 ? styles.up : styles.down]}>
          {trend >= 0 ? '↑' : '↓'}{Math.abs(trend).toFixed(1)}%
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md, padding: spacing.md,
    margin: spacing.xs,
  },
  skeleton: {
    flex: 1, height: 80, backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md, margin: spacing.xs, opacity: 0.4,
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    color: colors.greyMid,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs },
  unit: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.semibold,
    marginRight: 3,
  },
  value: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.bold,
  },
  trend: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    marginTop: 2,
  },
  up:   { color: colors.mint },
  down: { color: colors.red },
});
