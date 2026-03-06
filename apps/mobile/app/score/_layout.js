"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ScoreLayout;
const expo_router_1 = require("expo-router");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
function ScoreLayout() {
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
            title: 'Biashara Score',
        }}/>
    </expo_router_1.Stack>);
}
