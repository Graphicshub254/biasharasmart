import { Stack } from 'expo-router';
import { colors } from '@biasharasmart/ui-tokens';

export default function ReportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.cobalt,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Reports',
        }}
      />
      <Stack.Screen
        name="pl"
        options={{
          title: 'Profit & Loss',
        }}
      />
      <Stack.Screen
        name="kra"
        options={{
          title: 'KRA Reconciliation',
        }}
      />
      <Stack.Screen
        name="wht"
        options={{
          title: 'WHT Statement',
        }}
      />
    </Stack>
  );
}
