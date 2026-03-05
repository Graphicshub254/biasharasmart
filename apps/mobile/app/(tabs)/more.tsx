import { View, Text } from 'react-native';
import { colors } from '@biasharasmart/ui-tokens';
export default function MoreScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.greyMid }}>Coming in T1.3</Text>
    </View>
  );
}
