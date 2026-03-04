
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '@biasharasmart/ui-tokens';

export type SkeletonVariant = 'card' | 'row' | 'hero' | 'tile';

export interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  count?: number;
  style?: ViewStyle;
}

const SKELETON_HEIGHTS: Record<SkeletonVariant, number> = {
  hero: 160, card: 120, row: 64, tile: 80,
};

const SkeletonItem: React.FC<{ height: number; style?: ViewStyle }> = ({ height, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  return (
    <Animated.View style={[styles.item, { height, opacity }, style]} />
  );
};

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card', count = 1, style,
}) => {
  const height = SKELETON_HEIGHTS[variant];
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} height={height} style={style} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.screenPadding,
  },
});
