import { Stack } from 'expo-router';
import { colors, typography } from '@biasharasmart/ui-tokens';

export default function ScoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.ink,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontFamily: typography.fontFamily.primary,
          fontWeight: typography.fontWeight.bold as any,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Biashara Score',
        }}
      />
    </Stack>
  );
}
