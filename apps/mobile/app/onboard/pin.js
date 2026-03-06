"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PinScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const ActionButton_1 = require("../../src/components/ActionButton/ActionButton");
const InputField_1 = require("../../src/components/InputField/InputField");
const onboarding_store_1 = require("../../src/lib/onboarding-store");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
function PinScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [pin, setPin] = (0, react_1.useState)("");
    const [validationState, setValidationState] = (0, react_1.useState)("idle");
    const [taxpayerName, setTaxpayerName] = (0, react_1.useState)("");
    const [errorMsg, setErrorMsg] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        async function restore() {
            const data = await onboarding_store_1.OnboardingStore.getData();
            if (data.kraPin) {
                setPin(data.kraPin);
            }
        }
        restore();
    }, []);
    const validatePin = (0, react_1.useCallback)(async (pinToValidate) => {
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
            }
            else {
                setValidationState("error");
                setErrorMsg(Array.isArray(data.message) ? data.message[0] : (data.message || "Invalid KRA PIN"));
            }
        }
        catch (e) {
            setValidationState("error");
            setErrorMsg("Could not reach validation server");
        }
    }, []);
    (0, react_1.useEffect)(() => {
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
        if (validationState !== "success")
            return;
        await onboarding_store_1.OnboardingStore.saveStep("mpesa");
        await onboarding_store_1.OnboardingStore.saveData({ kraPin: pin.toUpperCase(), taxpayerName });
        router.push("/onboard/mpesa");
    };
    return (<react_native_1.SafeAreaView style={styles.safeArea}>
      <react_native_1.View style={styles.container}>
        <react_native_1.View>
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <vector_icons_1.MaterialIcons name="chevron-left" size={32} color={ui_tokens_1.colors.white}/>
          </react_native_1.TouchableOpacity>

          <react_native_1.View style={styles.headerContainer}>
            <react_native_1.Text style={styles.title}>Enter your KRA PIN</react_native_1.Text>
            <react_native_1.Text style={styles.subtitle}>We'll verify your tax compliance status</react_native_1.Text>
          </react_native_1.View>

          <InputField_1.InputField label="KRA PIN" value={pin} onChangeText={(text) => setPin(text.toUpperCase())} placeholder="e.g. A123456789B" maxLength={11}/>

          <react_native_1.View style={styles.statusContainer}>
            {validationState === "loading" && (<react_native_1.View style={styles.statusRow}>
                <react_native_1.ActivityIndicator size="small" color={ui_tokens_1.colors.greyMid} style={styles.spinner}/>
                <react_native_1.Text style={styles.statusTextLoading}>Validating with KRA...</react_native_1.Text>
              </react_native_1.View>)}

            {validationState === "success" && (<react_native_1.View style={styles.statusRow}>
                <vector_icons_1.MaterialIcons name="check-circle" size={16} color={ui_tokens_1.colors.mint}/>
                <react_native_1.Text style={styles.statusTextSuccess}>{taxpayerName}</react_native_1.Text>
              </react_native_1.View>)}

            {validationState === "error" && (<react_native_1.View style={styles.statusRow}>
                <vector_icons_1.MaterialIcons name="error" size={16} color={ui_tokens_1.colors.red}/>
                <react_native_1.Text style={styles.statusTextError}>{errorMsg}</react_native_1.Text>
              </react_native_1.View>)}
          </react_native_1.View>
        </react_native_1.View>

        <react_native_1.View style={styles.footer}>
          <ActionButton_1.ActionButton label="Continue" onPress={handleContinue} isDisabled={validationState !== "success"}/>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    container: {
        flex: 1,
        padding: ui_tokens_1.spacing.screenPadding,
        justifyContent: "space-between",
    },
    backButton: {
        marginLeft: -ui_tokens_1.spacing.sm,
        marginBottom: ui_tokens_1.spacing.md,
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    headerContainer: {
        marginBottom: ui_tokens_1.spacing.xl,
    },
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.title,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginBottom: ui_tokens_1.spacing.sm,
    },
    subtitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
    },
    statusContainer: {
        marginTop: ui_tokens_1.spacing.xs,
        minHeight: 24,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    spinner: {
        marginRight: ui_tokens_1.spacing.sm,
    },
    statusTextLoading: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
    },
    statusTextSuccess: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.mint,
        marginLeft: ui_tokens_1.spacing.xs,
    },
    statusTextError: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.red,
        marginLeft: ui_tokens_1.spacing.xs,
    },
    footer: {
        marginBottom: ui_tokens_1.spacing.lg,
    },
});
