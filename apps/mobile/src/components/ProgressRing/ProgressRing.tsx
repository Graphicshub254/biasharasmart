import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export interface ProgressRingProps {
  progress: number;       // 0-1
  label: string;
  sublabel?: string;
  size?: number;
  color?: string;
  isLoading?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress, label, sublabel, size = 180, color = colors.mint, isLoading = false,
}) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  if (isLoading) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, opacity: 0.4 }]}>
        <View style={styles.loadingInner} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.greyDark}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      <View style={styles.innerContent}>
        <Text style={[styles.value, { color }]}>{label}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center', justifyContent: 'center',
  },
  innerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
  },
  sublabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
    marginTop: -4,
  },
  loadingInner: {
    flex: 1,
    backgroundColor: colors.greyDark,
    width: '100%',
    borderRadius: 999,
  }
});
