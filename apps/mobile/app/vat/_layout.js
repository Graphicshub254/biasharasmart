"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VatLayout;
const expo_router_1 = require("expo-router");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
function VatLayout() {
    return (<expo_router_1.Stack screenOptions={{
            headerStyle: {
                backgroundColor: ui_tokens_1.colors.ink,
            },
            headerTintColor: ui_tokens_1.colors.white,
            headerTitleStyle: {
                fontFamily: ui_tokens_1.typography.fontFamily.primary,
                fontWeight: ui_tokens_1.typography.fontWeight.bold,
            },
            headerShadowVisible: false,
        }}>
      <expo_router_1.Stack.Screen name="index" options={{
            title: 'VAT Returns',
        }}/>
      <expo_router_1.Stack.Screen name="[period]" options={{
            title: 'Return Detail',
        }}/>
    </expo_router_1.Stack>);
}
