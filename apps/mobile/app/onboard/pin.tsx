import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing } from "@biasharasmart/ui-tokens";
import { ActionButton } from "../../src/components/ActionButton/ActionButton";
import { InputField } from "../../src/components/InputField/InputField";
import { OnboardingStore } from "../../src/lib/onboarding-store";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type ValidationState = "idle" | "loading" | "success" | "error";

export default function PinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [taxpayerName, setTaxpayerName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function restore() {
      const data = await OnboardingStore.getData();
      if (data.kraPin) {
        setPin(data.kraPin);
      }
    }
    restore();
  }, []);

  const validatePin = useCallback(async (pinToValidate: string) => {
    const formattedPin = pinToValidate.toUpperCase();
    if (!/^[AP]\d{9}[A-Z]$/.test(formattedPin)) {
      setValidationState("error");
      setErrorMsg("Invalid KRA PIN format");
      return;
    }

    setValidationState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/onboard/validate-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kraPin: formattedPin }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationState("success");
        setTaxpayerName(data.taxpayerName);
      } else {
        setValidationState("error");
        setErrorMsg(Array.isArray(data.message) ? data.message[0] : (data.message || "Invalid KRA PIN"));
      }
    } catch (e) {
      setValidationState("error");
      setErrorMsg("Could not reach validation server");
    }
  }, []);

  useEffect(() => {
    if (!pin) {
      setValidationState("idle");
      return;
    }

    const timer = setTimeout(() => {
      validatePin(pin);
    }, 800);

    return () => clearTimeout(timer);
  }, [pin, validatePin]);

  const handleContinue = async () => {
    if (validationState !== "success") return;
    await OnboardingStore.saveStep("mpesa");
    await OnboardingStore.saveData({ kraPin: pin.toUpperCase(), taxpayerName });
    router.push("/onboard/mpesa");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={32} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Enter your KRA PIN</Text>
            <Text style={styles.subtitle}>We'll verify your tax compliance status</Text>
          </View>

          <InputField
            label="KRA PIN"
            value={pin}
            onChangeText={(text) => setPin(text.toUpperCase())}
            placeholder="e.g. A123456789B"
            maxLength={11}
          />

          <View style={styles.statusContainer}>
            {validationState === "loading" && (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={colors.greyMid} style={styles.spinner} />
                <Text style={styles.statusTextLoading}>Validating with KRA...</Text>
              </View>
            )}

            {validationState === "success" && (
              <View style={styles.statusRow}>
                <MaterialIcons name="check-circle" size={16} color={colors.mint} />
                <Text style={styles.statusTextSuccess}>{taxpayerName}</Text>
              </View>
            )}

            {validationState === "error" && (
              <View style={styles.statusRow}>
                <MaterialIcons name="error" size={16} color={colors.red} />
                <Text style={styles.statusTextError}>{errorMsg}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <ActionButton
            label="Continue"
            onPress={handleContinue}
            isDisabled={validationState !== "success"}
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
  backButton: {
    marginLeft: -spacing.sm,
    marginBottom: spacing.md,
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerContainer: {
    marginBottom: spacing.xl,
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
  statusContainer: {
    marginTop: spacing.xs,
    minHeight: 24,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinner: {
    marginRight: spacing.sm,
  },
  statusTextLoading: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.greyMid,
  },
  statusTextSuccess: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.mint,
    marginLeft: spacing.xs,
  },
  statusTextError: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    color: colors.red,
    marginLeft: spacing.xs,
  },
  footer: {
    marginBottom: spacing.lg,
  },
});
