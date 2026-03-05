import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@biasharasmart/ui-tokens';
import { OnboardingStore } from '../src/lib/onboarding-store';

const STEP_ROUTES: Record<string, string> = {
  type:     '/onboard/type',
  pin:      '/onboard/pin',
  mpesa:    '/onboard/mpesa',
  kyc:      '/onboard/kyc',
  complete: '/onboard/complete',
};

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function resume() {
      const step = await OnboardingStore.getStep();
      if (step && STEP_ROUTES[step]) {
        router.replace(STEP_ROUTES[step] as any);
      } else {
        // After onboarding is done (no saved step), route to /(tabs)/dashboard
        router.replace('/(tabs)/dashboard');
      }
    }
    resume();
  }, []);

  // Show spinner while checking saved step
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.mint} size="large" />
    </View>
  );
}
