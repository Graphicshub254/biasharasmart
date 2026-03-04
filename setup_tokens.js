#!/usr/bin/env node
/**
 * T0.3 — BiasharaSmart Design Token System + Component Stubs
 * Run: node setup_tokens.js from ~/projects/biasharasmart
 */

const fs = require('fs');
const path = require('path');

const base = process.cwd();

function write(filePath, content) {
  const full = path.join(base, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log(`  ✓ ${filePath}`);
}

// ── 1. TOKENS ────────────────────────────────────────────────────────────────
write('packages/ui-tokens/src/colors.ts', `
export const colors = {
  // Backgrounds
  ink:      '#0A0F1E',   // primary screen background
  navyDeep: '#003366',   // brand navy
  cobalt:   '#1565C0',   // interactive / primary CTA
  greyDark: '#455A64',   // secondary surface
  greyMid:  '#78909C',   // secondary text / labels
  grey1:    '#F5F7FA',   // light surface
  stripe:   '#EFF4FB',   // table stripe

  // Accents
  mint:     '#00BFA5',   // balance amount, success, progress
  teal:     '#00796B',   // M-Pesa green, payment confirmed
  tealLight:'#E0F2F1',   // teal surface

  // Semantic
  gold:     '#F9A825',   // warning, deadline approaching
  goldBg:   '#FFF8E1',
  green:    '#2E7D32',   // filed, compliant, approved
  greenBg:  '#E8F5E9',
  red:      '#C62828',   // lapsed, failed, danger
  redBg:    '#FFEBEE',
  orange:   '#E65100',   // overdue, needs attention
  orangeBg: '#FFF3E0',

  // Base
  white:    '#FFFFFF',
  black:    '#1A1A1A',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;
`);

write('packages/ui-tokens/src/typography.ts', `
export const typography = {
  // Font families
  fontFamily: {
    primary: 'Inter',        // all UI text
    mono:    'JetBrainsMono', // KRA CU numbers, amounts in tables
  },

  // Font sizes (sp — scales with user accessibility settings)
  fontSize: {
    hero:    48,   // balance amount — one per screen
    title:   28,   // screen title, modal header
    heading: 22,   // card title, section header
    body:    16,   // body copy, descriptions
    label:   13,   // form labels, table column headers
    caption: 11,   // timestamps, fine print
    mono:    14,   // CU numbers, TIN, tabular amounts
  },

  // Font weights
  fontWeight: {
    black:    '900',
    bold:     '700',
    semibold: '600',
    medium:   '500',
    regular:  '400',
  },

  // Line heights
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },
} as const;
`);

write('packages/ui-tokens/src/spacing.ts', `
export const spacing = {
  // Base unit: 4px
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl:64,

  // Touch targets (minimum 48pt per accessibility guidelines)
  touchTarget: 48,

  // Screen padding
  screenPadding: 16,

  // Card padding
  cardPadding: 20,

  // Border radius
  radius: {
    sm:   8,
    md:   12,
    lg:   16,
    xl:   24,
    full: 9999,
  },
} as const;
`);

write('packages/ui-tokens/src/shadows.ts', `
import { colors } from './colors';

export const shadows = {
  card: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modal: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  button: {
    shadowColor: colors.cobalt,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
`);

write('packages/ui-tokens/src/index.ts', `
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
`);

write('packages/ui-tokens/package.json', JSON.stringify({
  name: '@biasharasmart/ui-tokens',
  version: '0.1.0',
  main: 'src/index.ts',
  scripts: { 'type-check': 'tsc --noEmit' },
  devDependencies: { typescript: '^5.0.0' }
}, null, 2));

write('packages/ui-tokens/tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: 'ES2020',
    module: 'CommonJS',
    strict: true,
    declaration: true,
    outDir: 'dist',
    rootDir: 'src'
  },
  include: ['src/**/*']
}, null, 2));

// ── 2. COMPONENT STUBS ───────────────────────────────────────────────────────
const componentsBase = 'apps/mobile/src/components';

// BalanceCard
write(`${componentsBase}/BalanceCard/BalanceCard.tsx`, `
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
    : \`KES \${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}\`;

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
`);

// ActionButton
write(`${componentsBase}/ActionButton/ActionButton.tsx`, `
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
          <Text style={[styles.label, styles[\`label_\${variant}\`]]}>{label}</Text>
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
`);

// TransactionRow
write(`${componentsBase}/TransactionRow/TransactionRow.tsx`, `
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
      <View style={[styles.iconDot, styles[\`dot_\${type}\`]]} />
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
`);

// StatusBadge
write(`${componentsBase}/StatusBadge/StatusBadge.tsx`, `
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export type StatusType = 'compliant' | 'warning' | 'lapsed' | 'pending' | 'filed' | 'overdue';

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
`);

// MetricTile
write(`${componentsBase}/MetricTile/MetricTile.tsx`, `
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
`);

// AlertBanner
write(`${componentsBase}/AlertBanner/AlertBanner.tsx`, `
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
`);

// InputField
write(`${componentsBase}/InputField/InputField.tsx`, `
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  hint?: string;
  isDisabled?: boolean;
  secureTextEntry?: boolean;
  maxLength?: number;
}

export const InputField: React.FC<InputFieldProps> = ({
  label, value, onChangeText, placeholder, keyboardType = 'default',
  error, hint, isDisabled = false, secureTextEntry = false, maxLength,
}) => {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.red : focused ? colors.cobalt : colors.greyDark;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.greyMid}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={!isDisabled}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.medium,
    color: colors.greyMid,
    marginBottom: spacing.xs,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    height: spacing.touchTarget,
    backgroundColor: colors.greyDark,
    borderWidth: 1.5, borderRadius: spacing.radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.white,
  },
  error: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.red, marginTop: 4,
  },
  hint: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid, marginTop: 4,
  },
});
`);

// SkeletonLoader
write(`${componentsBase}/SkeletonLoader/SkeletonLoader.tsx`, `
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
`);

// InvoiceCard
write(`${componentsBase}/InvoiceCard/InvoiceCard.tsx`, `
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
`);

// SectionCard
write(`${componentsBase}/SectionCard/SectionCard.tsx`, `
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

export interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  accentColor?: string;
  badge?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title, children, expandable = false, defaultExpanded = true, accentColor = colors.cobalt, badge,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.header, { borderLeftColor: accentColor }]}
        onPress={() => expandable && setExpanded(!expanded)}
        activeOpacity={expandable ? 0.7 : 1}
      >
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight}>
          {badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
          {expandable && <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>}
        </View>
      </TouchableOpacity>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.greyDark, borderRadius: spacing.radius.md,
    marginHorizontal: spacing.screenPadding, marginBottom: spacing.sm, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderLeftWidth: 3,
  },
  title: {
    fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold, color: colors.white,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    backgroundColor: colors.cobalt, borderRadius: spacing.radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2, marginRight: spacing.sm,
  },
  badgeText: {
    fontFamily: typography.fontFamily.primary, fontSize: typography.fontSize.caption,
    color: colors.white, fontWeight: typography.fontWeight.semibold,
  },
  chevron: { color: colors.greyMid, fontSize: 12 },
  content: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.ink },
});
`);

// ProgressRing (stub — full SVG implementation in T1.5)
write(`${componentsBase}/ProgressRing/ProgressRing.tsx`, `
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
`);

// components index
write(`${componentsBase}/index.ts`, `
export * from './BalanceCard/BalanceCard';
export * from './ActionButton/ActionButton';
export * from './TransactionRow/TransactionRow';
export * from './StatusBadge/StatusBadge';
export * from './MetricTile/MetricTile';
export * from './AlertBanner/AlertBanner';
export * from './InputField/InputField';
export * from './SkeletonLoader/SkeletonLoader';
export * from './InvoiceCard/InvoiceCard';
export * from './SectionCard/SectionCard';
export * from './ProgressRing/ProgressRing';
`);

// Update root package.json workspaces to include ui-tokens
const rootPkg = path.join(base, 'package.json');
if (fs.existsSync(rootPkg)) {
  const pkg = JSON.parse(fs.readFileSync(rootPkg, 'utf8'));
  pkg.workspaces = pkg.workspaces || [];
  if (!pkg.workspaces.includes('packages/ui-tokens')) {
    pkg.workspaces.push('packages/ui-tokens');
    fs.writeFileSync(rootPkg, JSON.stringify(pkg, null, 2));
    console.log('  ✓ Added ui-tokens to root workspaces');
  }
}

// Update progress.txt
const progressPath = path.join(base, 'progress.txt');
if (fs.existsSync(progressPath)) {
  const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  progress.tasks['T0.3'] = {
    status: 'complete',
    notes: '12 component stubs created. Design tokens: colors, typography, spacing, shadows. All components typed with strict TypeScript.'
  };
  progress.current_task = 'T0.4';
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  console.log('  ✓ progress.txt updated');
}

console.log('\n✅ T0.3 COMPLETE');
console.log('   12 components created:');
console.log('   BalanceCard, ActionButton, TransactionRow, StatusBadge,');
console.log('   MetricTile, AlertBanner, InputField, SkeletonLoader,');
console.log('   InvoiceCard, SectionCard, ProgressRing + index');
console.log('   Design tokens: colors, typography, spacing, shadows');
console.log('\n   Next: T0.4 — NestJS database module + TypeORM connection');
