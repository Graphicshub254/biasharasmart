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
exports.default = MpesaScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const ActionButton_1 = require("../../src/components/ActionButton/ActionButton");
const InputField_1 = require("../../src/components/InputField/InputField");
const onboarding_store_1 = require("../../src/lib/onboarding-store");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
function MpesaScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [mpesaNumber, setMpesaNumber] = (0, react_1.useState)("");
    const [type, setType] = (0, react_1.useState)("paybill");
    const [validationState, setValidationState] = (0, react_1.useState)("idle");
    const [businessName, setBusinessName] = (0, react_1.useState)("");
    const [errorMsg, setErrorMsg] = (0, react_1.useState)("");
    const isInitialMount = (0, react_1.useRef)(true);
    (0, react_1.useEffect)(() => {
        async function restore() {
            const data = await onboarding_store_1.OnboardingStore.getData();
            if (data.paybill) {
                setMpesaNumber(data.paybill);
            }
            if (data.paybillType) {
                setType(data.paybillType);
            }
        }
        restore();
    }, []);
    const validateMpesa = (0, react_1.useCallback)(async (value, mpesaType) => {
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
            }
            else {
                setValidationState("error");
                setErrorMsg(Array.isArray(data.message) ? data.message[0] : (data.message || "Validation failed"));
            }
        }
        catch (e) {
            setValidationState("error");
            setErrorMsg("Could not reach validation server");
        }
    }, []);
    (0, react_1.useEffect)(() => {
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
    const handleToggle = (newType) => {
        if (newType === type)
            return;
        setType(newType);
        setMpesaNumber("");
        setValidationState("idle");
        setBusinessName("");
        setErrorMsg("");
    };
    const handleContinue = async () => {
        if (validationState !== "success")
            return;
        await onboarding_store_1.OnboardingStore.saveStep("kyc");
        await onboarding_store_1.OnboardingStore.saveData({ paybill: mpesaNumber, paybillType: type });
        router.push("/onboard/kyc");
    };
    return (<react_native_1.SafeAreaView style={styles.safeArea}>
      <react_native_1.View style={styles.container}>
        <react_native_1.View>
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <vector_icons_1.MaterialIcons name="chevron-left" size={32} color={ui_tokens_1.colors.white}/>
          </react_native_1.TouchableOpacity>

          <react_native_1.View style={styles.headerContainer}>
            <react_native_1.Text style={styles.title}>Link your M-Pesa</react_native_1.Text>
            <react_native_1.Text style={styles.subtitle}>Enter your Paybill or Till number</react_native_1.Text>
          </react_native_1.View>

          <react_native_1.View style={styles.toggleRow}>
            <react_native_1.TouchableOpacity style={[styles.pill, type === "paybill" ? styles.pillSelected : styles.pillUnselected]} onPress={() => handleToggle("paybill")}>
              <react_native_1.Text style={[styles.pillText, type === "paybill" ? styles.pillTextSelected : styles.pillTextUnselected]}>
                Paybill
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={[styles.pill, type === "till" ? styles.pillSelected : styles.pillUnselected]} onPress={() => handleToggle("till")}>
              <react_native_1.Text style={[styles.pillText, type === "till" ? styles.pillTextSelected : styles.pillTextUnselected]}>
                Till Number
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          <InputField_1.InputField label={type === "paybill" ? "Paybill Number" : "Till Number"} value={mpesaNumber} onChangeText={setMpesaNumber} placeholder={type === "paybill" ? "e.g. 174379" : "e.g. 5551234"} keyboardType="numeric" maxLength={10}/>

          <react_native_1.View style={styles.statusContainer}>
            {validationState === "loading" && (<react_native_1.View style={styles.statusRow}>
                <react_native_1.ActivityIndicator size="small" color={ui_tokens_1.colors.greyMid} style={styles.spinner}/>
                <react_native_1.Text style={styles.statusTextLoading}>Validating with Daraja...</react_native_1.Text>
              </react_native_1.View>)}

            {validationState === "success" && (<react_native_1.View style={styles.statusRow}>
                <vector_icons_1.MaterialIcons name="check-circle" size={16} color={ui_tokens_1.colors.mint}/>
                <react_native_1.Text style={styles.statusTextSuccess}>{businessName}</react_native_1.Text>
              </react_native_1.View>)}

            {validationState === "error" && (<react_native_1.View style={styles.statusRow}>
                <vector_icons_1.MaterialIcons name="error" size={16} color={ui_tokens_1.colors.red}/>
                <react_native_1.Text style={styles.statusTextError}>{errorMsg}</react_native_1.Text>
              </react_native_1.View>)}
          </react_native_1.View>
        </react_native_1.View>

        <react_native_1.View style={styles.footer}>
          <react_native_1.Text style={styles.stepIndicator}>Step 3 of 4</react_native_1.Text>
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
        marginBottom: ui_tokens_1.spacing.md,
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
    toggleRow: {
        flexDirection: "row",
        marginBottom: ui_tokens_1.spacing.lg,
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        padding: 4,
    },
    pill: {
        flex: 1,
        height: 36,
        borderRadius: ui_tokens_1.spacing.radius.sm,
        justifyContent: "center",
        alignItems: "center",
    },
    pillSelected: {
        backgroundColor: ui_tokens_1.colors.cobalt,
    },
    pillUnselected: {
        backgroundColor: "transparent",
    },
    pillText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
    },
    pillTextSelected: {
        color: ui_tokens_1.colors.white,
    },
    pillTextUnselected: {
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
    stepIndicator: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        textAlign: "center",
        marginBottom: ui_tokens_1.spacing.md,
    },
});
