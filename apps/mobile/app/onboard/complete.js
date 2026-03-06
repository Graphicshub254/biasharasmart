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
exports.default = CompleteScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const ActionButton_1 = require("../../src/components/ActionButton/ActionButton");
const onboarding_store_1 = require("../../src/lib/onboarding-store");
function CompleteScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [taxpayerName, setTaxpayerName] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        async function init() {
            const data = await onboarding_store_1.OnboardingStore.getData();
            setTaxpayerName(data.taxpayerName ?? '');
            // Trigger GavaConnect registration - fire and forget
            const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
            fetch(`${API_BASE}/api/onboard/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).catch((err) => {
                // Silent fail - webhook will retry via GavaConnect (or manual retry)
                console.warn('GavaConnect registration background trigger failed:', err);
            });
        }
        init();
    }, []);
    const handleDashboard = async () => {
        await onboarding_store_1.OnboardingStore.clear();
        router.replace('/(tabs)/dashboard');
    };
    return (<react_native_1.SafeAreaView style={styles.safeArea}>
      <react_native_1.View style={styles.container}>
        <react_native_1.View style={styles.content}>
          <vector_icons_1.MaterialIcons name="check-circle" size={80} color={ui_tokens_1.colors.mint}/>
          <react_native_1.Text style={styles.title}>You're all set!</react_native_1.Text>
          <react_native_1.Text style={styles.subtitle}>
            Your business has been registered. KRA compliance monitoring is now active.
          </react_native_1.Text>
          {taxpayerName ? (<react_native_1.Text style={styles.taxpayerName}>{taxpayerName}</react_native_1.Text>) : null}
        </react_native_1.View>

        <react_native_1.View style={styles.footer}>
          <ActionButton_1.ActionButton label="Go to Dashboard" onPress={handleDashboard}/>
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
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.title,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginTop: ui_tokens_1.spacing.xl,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
        marginTop: ui_tokens_1.spacing.md,
        textAlign: 'center',
        paddingHorizontal: ui_tokens_1.spacing.xl,
    },
    taxpayerName: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        color: ui_tokens_1.colors.mint,
        marginTop: ui_tokens_1.spacing.lg,
        textAlign: 'center',
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
    },
    footer: {
        marginBottom: ui_tokens_1.spacing.lg,
    },
});
