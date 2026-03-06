import { Stack } from 'expo-router';
import { colors } from '@biasharasmart/ui-tokens';

export default function TccLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink },
      }}
    />
  );
}
