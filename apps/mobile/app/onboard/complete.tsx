import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';
import { ActionButton } from '../../src/components/ActionButton/ActionButton';
import { OnboardingStore } from '../../src/lib/onboarding-store';

export default function CompleteScreen() {
  const router = useRouter();
  const [taxpayerName, setTaxpayerName] = useState('');

  useEffect(() => {
    async function init() {
      const data = await OnboardingStore.getData();
      setTaxpayerName(data.taxpayerName ?? '');

      // Trigger GavaConnect registration - fire and forget
      const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
      fetch(`${API_BASE}/api/onboard/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch((err) => {
        // Silent fail - webhook will retry via GavaConnect (or manual retry)
        console.warn('GavaConnect registration background trigger failed:', err);
      });
    }
    init();
  }, []);

  const handleDashboard = async () => {
    await OnboardingStore.clear();
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <MaterialIcons name="check-circle" size={80} color={colors.mint} />
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Your business has been registered. KRA compliance monitoring is now active.
          </Text>
          {taxpayerName ? (
            <Text style={styles.taxpayerName}>{taxpayerName}</Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <ActionButton
            label="Go to Dashboard"
            onPress={handleDashboard}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  container: {
    flex: 1,
    padding: spacing.screenPadding,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
    marginTop: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  taxpayerName: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    color: colors.mint,
    marginTop: spacing.lg,
    textAlign: 'center',
    fontWeight: typography.fontWeight.semibold,
  },
  footer: {
    marginBottom: spacing.lg,
  },
});
