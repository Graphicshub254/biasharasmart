import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import {
  ProgressRing,
  StatusBadge,
  SectionCard,
  SkeletonLoader,
  ActionButton,
} from '../../src/components';
import { TccStatus } from '@biasharasmart/shared-types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8'; // temp until T1.6

export default function TccScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tcc, setTcc] = useState<TccStatus | null>(null);

  useEffect(() => {
    const fetchTcc = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_BASE}/api/tcc/${BUSINESS_ID}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data: TccStatus = await res.json();
        setTcc(data);
      } catch (err) {
        console.error('TCC fetch error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTcc();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={32} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tax Compliance Certificate</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.ringPlaceholder}>
            <SkeletonLoader variant="card" count={1} style={{ height: 200, width: 200, borderRadius: 100 }} />
          </View>
          <SkeletonLoader variant="card" count={2} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !tcc) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={32} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tax Compliance Certificate</Text>
        </View>
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color={colors.red} />
          <Text style={styles.errorText}>Failed to load TCC status</Text>
          <View style={{ marginTop: 20, width: '100%' }}>
            <ActionButton label="Try Again" onPress={() => router.replace('/tcc')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = {
    compliant: colors.mint,
    warning: colors.gold,
    lapsed: colors.red,
  }[tcc.status];

  const badgeConfig = {
    compliant: { label: 'TCC Valid', status: 'compliant' as const },
    warning: { label: 'Expiring Soon', status: 'warning' as const },
    lapsed: { label: 'TCC Lapsed', status: 'lapsed' as const },
  }[tcc.status];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={32} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Compliance Certificate</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Ring Section */}
        <View style={styles.ringSection}>
          <ProgressRing
            progress={Math.min(1, tcc.daysRemaining / 365)}
            label={tcc.daysRemaining.toString()}
            sublabel="days"
            color={statusColor}
            size={220}
          />
          <View style={styles.badgeWrapper}>
            <StatusBadge status={badgeConfig.status} label={badgeConfig.label} size="large" />
          </View>
          <Text style={styles.expiryText}>Expires {formatDate(tcc.expiryDate)}</Text>
        </View>

        {/* Info Sections */}
        <SectionCard title="What is TCC?" expandable={true} defaultExpanded={false}>
          <Text style={styles.infoText}>
            A Tax Compliance Certificate (TCC) confirms your business is up to date with KRA obligations. 
            It is required for government tenders and certain business transactions.
          </Text>
        </SectionCard>

        <SectionCard title="What to do if lapsed" expandable={true} defaultExpanded={false}>
          <Text style={styles.infoText}>
            Visit KRA iTax portal at itax.kra.go.ke to file any outstanding returns and apply for a new TCC.
          </Text>
        </SectionCard>

        {/* Action Button */}
        {(tcc.status === 'lapsed' || tcc.status === 'warning') && (
          <View style={styles.actionSection}>
            <ActionButton
              label={tcc.status === 'lapsed' ? 'Apply for TCC' : 'Renew TCC'}
              onPress={() => Linking.openURL('https://itax.kra.go.ke')}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  ringSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  ringPlaceholder: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  badgeWrapper: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  expiryText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    fontWeight: typography.fontWeight.semibold,
  },
  infoText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
    lineHeight: 18,
  },
  actionSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
