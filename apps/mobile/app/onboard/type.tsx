import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing } from "@biasharasmart/ui-tokens";
import { ActionButton } from "../../src/components/ActionButton/ActionButton";
import { OnboardingStore, OnboardingData } from "../../src/lib/onboarding-store";

type BusinessType = OnboardingData["businessType"];

interface TypeOption {
  id: NonNullable<BusinessType>;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const OPTIONS: TypeOption[] = [
  {
    id: "sole_proprietor",
    title: "Sole Proprietor",
    description: "Individual business owner",
    icon: "person",
  },
  {
    id: "partnership",
    title: "Partnership",
    description: "Two or more owners",
    icon: "group",
  },
  {
    id: "limited_company",
    title: "Limited Company",
    description: "Incorporated business (Ltd)",
    icon: "business",
  },
];

export default function TypeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<BusinessType>(undefined);

  useEffect(() => {
    async function loadSaved() {
      const data = await OnboardingStore.getData();
      if (data.businessType) {
        setSelected(data.businessType);
      }
    }
    loadSaved();
  }, []);

  const handleContinue = async () => {
    if (!selected) return;
    await OnboardingStore.saveStep("pin");
    await OnboardingStore.saveData({ businessType: selected });
    router.push("/onboard/pin");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>What type of business?</Text>
          <Text style={styles.subtitle}>Choose your registration type</Text>
        </View>

        <View style={styles.optionsContainer}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.card,
                  isSelected ? styles.cardSelected : styles.cardUnselected,
                ]}
                onPress={() => setSelected(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                  <MaterialIcons
                    name={option.icon}
                    size={24}
                    color={isSelected ? colors.mint : colors.greyMid}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {option.title}
                  </Text>
                  <Text style={styles.cardDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.stepText}>Step 1 of 4</Text>
          <ActionButton
            label="Continue"
            onPress={handleContinue}
            isDisabled={!selected}
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
    justifyContent: "space-between",
  },
  headerContainer: {
    marginTop: spacing.xxl,
  },
  title: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    color: colors.greyMid,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.cardPadding,
    borderRadius: spacing.radius.lg,
    borderWidth: 2,
  },
  cardUnselected: {
    backgroundColor: colors.greyDark,
    borderColor: colors.transparent,
  },
  cardSelected: {
    backgroundColor: colors.cobalt,
    borderColor: colors.mint,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: spacing.radius.md,
    backgroundColor: colors.ink, // fallback for no opacity variant
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: colors.navyDeep, // fallback for no opacity variant
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.heading,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginBottom: 2,
  },
  cardTitleSelected: {
    // optional
  },
  cardDescription: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
  },
  footer: {
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  stepText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
    marginBottom: spacing.md,
  },
});
