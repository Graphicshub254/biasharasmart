"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootLayout;
const expo_router_1 = require("expo-router");
const expo_status_bar_1 = require("expo-status-bar");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
function RootLayout() {
    return (<react_native_safe_area_context_1.SafeAreaProvider>
      <expo_status_bar_1.StatusBar style="light"/>
      <expo_router_1.Stack screenOptions={{ headerShown: false }}>
        <expo_router_1.Stack.Screen name="index"/>
        <expo_router_1.Stack.Screen name="onboard"/>
        <expo_router_1.Stack.Screen name="(tabs)"/>
      </expo_router_1.Stack>
    </react_native_safe_area_context_1.SafeAreaProvider>);
}
