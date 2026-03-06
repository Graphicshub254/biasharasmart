"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReportsLayout;
const expo_router_1 = require("expo-router");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
function ReportsLayout() {
    return (<expo_router_1.Stack screenOptions={{
            headerStyle: {
                backgroundColor: ui_tokens_1.colors.cobalt,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        }}>
      <expo_router_1.Stack.Screen name="index" options={{
            title: 'Reports',
        }}/>
      <expo_router_1.Stack.Screen name="pl" options={{
            title: 'Profit & Loss',
        }}/>
      <expo_router_1.Stack.Screen name="kra" options={{
            title: 'KRA Reconciliation',
        }}/>
      <expo_router_1.Stack.Screen name="wht" options={{
            title: 'WHT Statement',
        }}/>
    </expo_router_1.Stack>);
}
