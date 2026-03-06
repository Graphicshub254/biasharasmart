"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Index;
const react_1 = require("react");
const expo_router_1 = require("expo-router");
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const onboarding_store_1 = require("../src/lib/onboarding-store");
const STEP_ROUTES = {
    type: '/onboard/type',
    pin: '/onboard/pin',
    mpesa: '/onboard/mpesa',
    kyc: '/onboard/kyc',
    complete: '/onboard/complete',
};
function Index() {
    const router = (0, expo_router_1.useRouter)();
    (0, react_1.useEffect)(() => {
        async function resume() {
            const step = await onboarding_store_1.OnboardingStore.getStep();
            if (step && STEP_ROUTES[step]) {
                router.replace(STEP_ROUTES[step]);
            }
            else {
                // After onboarding is done (no saved step), route to /(tabs)/dashboard
                router.replace('/(tabs)/dashboard');
            }
        }
        resume();
    }, []);
    // Show spinner while checking saved step
    return (<react_native_1.View style={{ flex: 1, backgroundColor: ui_tokens_1.colors.ink, alignItems: 'center', justifyContent: 'center' }}>
      <react_native_1.ActivityIndicator color={ui_tokens_1.colors.mint} size="large"/>
    </react_native_1.View>);
}
