import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, typography, spacing } from "@biasharasmart/ui-tokens";
import { ActionButton } from "../../src/components/ActionButton/ActionButton";
import { InputField } from "../../src/components/InputField/InputField";
import { OnboardingStore } from "../../src/lib/onboarding-store";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type ValidationState = "idle" | "loading" | "success" | "error";

export default function MpesaScreen() {
  const router = useRouter();
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [type, setType] = useState<"paybill" | "till">("paybill");
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [businessName, setBusinessName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const isInitialMount = useRef(true);

  useEffect(() => {
    async function restore() {
      const data = await OnboardingStore.getData();
      if (data.paybill) {
        setMpesaNumber(data.paybill);
      }
      if (data.paybillType) {
        setType(data.paybillType);
      }
    }
    restore();
  }, []);

  const validateMpesa = useCallback(async (value: string, mpesaType: "paybill" | "till") => {
    if (!/^\d{5,10}$/.test(value)) {
      setValidationState("error");
      setErrorMsg(`Enter a valid ${mpesaType === "paybill" ? "Paybill" : "Till"} number`);
      return;
    }

    setValidationState("loading");
    try {
      const res = await fetch(`${API_BASE}/api/onboard/validate-mpesa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paybill: value, type: mpesaType }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationState("success");
        setBusinessName(data.businessName);
      } else {
        setValidationState("error");
        setErrorMsg(Array.isArray(data.message) ? data.message[0] : (data.message || "Validation failed"));
      }
    } catch (e) {
      setValidationState("error");
      setErrorMsg("Could not reach validation server");
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!mpesaNumber) {
      setValidationState("idle");
      return;
    }

    const timer = setTimeout(() => {
      validateMpesa(mpesaNumber, type);
    }, 800);

    return () => clearTimeout(timer);
  }, [mpesaNumber, type, validateMpesa]);

  const handleToggle = (newType: "paybill" | "till") => {
    if (newType === type) return;
    setType(newType);
    setMpesaNumber("");
    setValidationState("idle");
    setBusinessName("");
    setErrorMsg("");
  };

  const handleContinue = async () => {
    if (validationState !== "success") return;
    await OnboardingStore.saveStep("kyc");
    await OnboardingStore.saveData({ paybill: mpesaNumber, paybillType: type });
    router.push("/onboard/kyc");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={32} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Link your M-Pesa</Text>
            <Text style={styles.subtitle}>Enter your Paybill or Till number</Text>
          </View>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.pill, type === "paybill" ? styles.pillSelected : styles.pillUnselected]}
              onPress={() => handleToggle("paybill")}
            >
              <Text style={[styles.pillText, type === "paybill" ? styles.pillTextSelected : styles.pillTextUnselected]}>
                Paybill
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, type === "till" ? styles.pillSelected : styles.pillUnselected]}
              onPress={() => handleToggle("till")}
            >
              <Text style={[styles.pillText, type === "till" ? styles.pillTextSelected : styles.pillTextUnselected]}>
                Till Number
              </Text>
            </TouchableOpacity>
          </View>

          <InputField
            label={type === "paybill" ? "Paybill Number" : "Till Number"}
            value={mpesaNumber}
            onChangeText={setMpesaNumber}
            placeholder={type === "paybill" ? "e.g. 174379" : "e.g. 5551234"}
            keyboardType="numeric"
            maxLength={10}
          />

          <View style={styles.statusContainer}>
            {validationState === "loading" && (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={colors.greyMid} style={styles.spinner} />
                <Text style={styles.statusTextLoading}>Validating with Daraja...</Text>
              </View>
            )}

            {validationState === "success" && (
              <View style={styles.statusRow}>
                <MaterialIcons name="check-circle" size={16} color={colors.mint} />
                <Text style={styles.statusTextSuccess}>{businessName}</Text>
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
          <Text style={styles.stepIndicator}>Step 3 of 4</Text>
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
    marginBottom: spacing.md,
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
  toggleRow: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    backgroundColor: colors.greyDark,
    borderRadius: spacing.radius.md,
    padding: 4,
  },
  pill: {
    flex: 1,
    height: 36,
    borderRadius: spacing.radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  pillSelected: {
    backgroundColor: colors.cobalt,
  },
  pillUnselected: {
    backgroundColor: "transparent",
  },
  pillText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.semibold,
  },
  pillTextSelected: {
    color: colors.white,
  },
  pillTextUnselected: {
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
  stepIndicator: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    color: colors.greyMid,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
