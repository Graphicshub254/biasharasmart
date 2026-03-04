
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export type AlertType = 'info' | 'warning' | 'error' | 'success';

export interface AlertBannerProps {
  type: AlertType;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissable?: boolean;
}

const ALERT_CONFIG: Record<AlertType, { border: string; bg: string; title: string }> = {
  info:    { border: colors.cobalt, bg: '#E3F0FF', title: colors.cobalt },
  warning: { border: colors.gold,   bg: colors.goldBg, title: colors.gold },
  error:   { border: colors.red,    bg: colors.redBg,  title: colors.red },
  success: { border: colors.green,  bg: colors.greenBg,title: colors.green },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type, title, message, actionLabel, onAction, dismissable = true,
}) => {
  const [visible, setVisible] = useState(true);
  const config = ALERT_CONFIG[type];
  if (!visible) return null;
  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderLeftColor: config.border }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: config.title }]}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}
        {actionLabel && onAction && (
          <TouchableOpacity onPress={onAction}>
            <Text style={[styles.action, { color: config.border }]}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      {dismissable && (
        <TouchableOpacity onPress={() => setVisible(false)} style={styles.dismiss}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', borderLeftWidth: 4,
    borderRadius: spacing.radius.sm, padding: spacing.md,
    marginHorizontal: spacing.screenPadding, marginBottom: spacing.sm,
  },
  content: { flex: 1 },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  message: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.black, marginTop: 4,
  },
  action: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.sm, textDecorationLine: 'underline',
  },
  dismiss: { padding: spacing.xs },
  dismissText: { color: colors.greyMid, fontSize: 14 },
});
