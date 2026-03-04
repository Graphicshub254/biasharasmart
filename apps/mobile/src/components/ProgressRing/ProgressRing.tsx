
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export interface ProgressRingProps {
  progress: number;       // 0-100
  label: string;
  sublabel?: string;
  size?: number;
  color?: string;
  isLoading?: boolean;
}

// Stub implementation — full SVG ring in T1.5
export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress, label, sublabel, size = 80, color = colors.mint, isLoading = false,
}) => {
  if (isLoading) return <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, opacity: 0.4 }]} />;
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={[styles.value, { color }]}>{Math.round(progress)}%</Text>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      {sublabel && <Text style={styles.sublabel} numberOfLines={1}>{sublabel}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.greyDark,
  },
  value: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label, fontWeight: typography.fontWeight.bold,
  },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 9, color: colors.greyMid, textAlign: 'center', paddingHorizontal: 4,
  },
  sublabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 8, color: colors.greyMid, textAlign: 'center',
  },
});
