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
exports.default = TypeScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const ActionButton_1 = require("../../src/components/ActionButton/ActionButton");
const onboarding_store_1 = require("../../src/lib/onboarding-store");
const OPTIONS = [
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
function TypeScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [selected, setSelected] = (0, react_1.useState)(undefined);
    (0, react_1.useEffect)(() => {
        async function loadSaved() {
            const data = await onboarding_store_1.OnboardingStore.getData();
            if (data.businessType) {
                setSelected(data.businessType);
            }
        }
        loadSaved();
    }, []);
    const handleContinue = async () => {
        if (!selected)
            return;
        await onboarding_store_1.OnboardingStore.saveStep("pin");
        await onboarding_store_1.OnboardingStore.saveData({ businessType: selected });
        router.push("/onboard/pin");
    };
    return (<react_native_1.SafeAreaView style={styles.safeArea}>
      <react_native_1.View style={styles.container}>
        <react_native_1.View style={styles.headerContainer}>
          <react_native_1.Text style={styles.title}>What type of business?</react_native_1.Text>
          <react_native_1.Text style={styles.subtitle}>Choose your registration type</react_native_1.Text>
        </react_native_1.View>

        <react_native_1.View style={styles.optionsContainer}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (<react_native_1.TouchableOpacity key={option.id} style={[
                    styles.card,
                    isSelected ? styles.cardSelected : styles.cardUnselected,
                ]} onPress={() => setSelected(option.id)} activeOpacity={0.7}>
                <react_native_1.View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                  <vector_icons_1.MaterialIcons name={option.icon} size={24} color={isSelected ? ui_tokens_1.colors.mint : ui_tokens_1.colors.greyMid}/>
                </react_native_1.View>
                <react_native_1.View style={styles.textContainer}>
                  <react_native_1.Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {option.title}
                  </react_native_1.Text>
                  <react_native_1.Text style={styles.cardDescription}>{option.description}</react_native_1.Text>
                </react_native_1.View>
              </react_native_1.TouchableOpacity>);
        })}
        </react_native_1.View>

        <react_native_1.View style={styles.footer}>
          <react_native_1.Text style={styles.stepText}>Step 1 of 4</react_native_1.Text>
          <ActionButton_1.ActionButton label="Continue" onPress={handleContinue} isDisabled={!selected}/>
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
    headerContainer: {
        marginTop: ui_tokens_1.spacing.xxl,
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
    optionsContainer: {
        flex: 1,
        justifyContent: "center",
        gap: ui_tokens_1.spacing.md,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: ui_tokens_1.spacing.cardPadding,
        borderRadius: ui_tokens_1.spacing.radius.lg,
        borderWidth: 2,
    },
    cardUnselected: {
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderColor: ui_tokens_1.colors.transparent,
    },
    cardSelected: {
        backgroundColor: ui_tokens_1.colors.cobalt,
        borderColor: ui_tokens_1.colors.mint,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: ui_tokens_1.spacing.radius.md,
        backgroundColor: ui_tokens_1.colors.ink, // fallback for no opacity variant
        alignItems: "center",
        justifyContent: "center",
        marginRight: ui_tokens_1.spacing.md,
    },
    iconContainerSelected: {
        backgroundColor: ui_tokens_1.colors.navyDeep, // fallback for no opacity variant
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
        color: ui_tokens_1.colors.white,
        marginBottom: 2,
    },
    cardTitleSelected: {
    // optional
    },
    cardDescription: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
    },
    footer: {
        marginBottom: ui_tokens_1.spacing.lg,
        alignItems: "center",
    },
    stepText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
        marginBottom: ui_tokens_1.spacing.md,
    },
});
