import { Stack } from 'expo-router';
import { colors, typography } from '@biasharasmart/ui-tokens';

export default function CarbonLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.ink,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontFamily: typography.fontFamily.primary,
          fontWeight: typography.fontWeight.bold,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Green Dashboard' }} />
      <Stack.Screen name="add-asset" options={{ title: 'Register Asset', presentation: 'modal' }} />
      <Stack.Screen name="log-reading" options={{ title: 'Log Reading', presentation: 'modal' }} />
    </Stack>
  );
}
