
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ActionButtonVariant;
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
  fullWidth = true,
  icon,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        (isDisabled || isLoading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.cobalt : colors.white} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: spacing.touchTarget,
    borderRadius: spacing.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  fullWidth: { width: '100%' },
  primary:   { backgroundColor: colors.cobalt },
  secondary: { backgroundColor: colors.teal },
  ghost:     { backgroundColor: colors.transparent, borderWidth: 1.5, borderColor: colors.cobalt },
  danger:    { backgroundColor: colors.red },
  disabled:  { opacity: 0.5 },
  content:   { flexDirection: 'row', alignItems: 'center' },
  icon:      { marginRight: spacing.sm },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  label_primary:   { color: colors.white },
  label_secondary: { color: colors.white },
  label_ghost:     { color: colors.cobalt },
  label_danger:    { color: colors.white },
});
