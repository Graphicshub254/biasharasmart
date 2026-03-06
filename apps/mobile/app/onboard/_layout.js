"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OnboardLayout;
const expo_router_1 = require("expo-router");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
function OnboardLayout() {
    return (<expo_router_1.Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: ui_tokens_1.colors.ink },
            animation: 'slide_from_right',
        }}/>);
}
