
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
