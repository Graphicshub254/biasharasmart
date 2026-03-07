import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@biasharasmart/ui-tokens';

const MENU_ITEMS = [
  { label: 'Payroll', icon: 'people', route: '/payroll' },
  { label: 'Reports', icon: 'assessment', route: '/reports' },
  { label: 'Biashara Score', icon: 'speed', route: '/score' },
  { label: 'TCC Status', icon: 'verified', route: '/tcc' },
  { label: 'VAT Returns', icon: 'receipt-long', route: '/vat' },
  { label: 'Green Carbon', icon: 'eco', route: '/carbon' },
  { label: 'Security', icon: 'security', route: '/security' },
  { label: 'Business Profile', icon: 'business', route: '/profile', placeholder: 'Profile management coming in T1.6' },
];

export default function MoreScreen() {
  const router = useRouter();

  const handlePress = (item: typeof MENU_ITEMS[0]) => {
    if (item.placeholder) {
      alert(item.placeholder);
    } else {
      router.push(item.route as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index === 0 && styles.firstItem,
                index === MENU_ITEMS.length - 1 && styles.lastItem,
              ]}
              onPress={() => handlePress(item)}
            >
              <View style={styles.itemLeft}>
                <MaterialIcons name={item.icon as any} size={24} color={colors.mint} />
                <Text style={styles.itemLabel}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.greyMid} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>BiasharaSmart v1.0.0</Text>
        </View>
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
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyDark,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  scrollContent: {
    paddingVertical: spacing.md,
  },
  menuContainer: {
    marginHorizontal: spacing.screenPadding,
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
  },
  firstItem: {
    borderTopLeftRadius: spacing.radius.md,
    borderTopRightRadius: spacing.radius.md,
  },
  lastItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: spacing.radius.md,
    borderBottomRightRadius: spacing.radius.md,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLabel: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.white,
    marginLeft: spacing.md,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  versionText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
  },
});
