"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TabLayout;
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
function TabLayout() {
    return (<expo_router_1.Tabs screenOptions={{
            headerShown: false,
            tabBarStyle: {
                backgroundColor: ui_tokens_1.colors.navyDeep,
                borderTopColor: 'rgba(255,255,255,0.08)',
                height: 60,
                paddingBottom: 8,
            },
            tabBarActiveTintColor: ui_tokens_1.colors.mint,
            tabBarInactiveTintColor: ui_tokens_1.colors.greyMid,
            tabBarLabelStyle: {
                fontFamily: ui_tokens_1.typography.fontFamily.primary,
                fontSize: 11,
            },
        }}>
      <expo_router_1.Tabs.Screen name="dashboard" options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (<vector_icons_1.MaterialIcons name="home" size={size} color={color}/>),
        }}/>
      <expo_router_1.Tabs.Screen name="invoices" options={{
            title: 'Invoices',
            tabBarIcon: ({ color, size }) => (<vector_icons_1.MaterialIcons name="receipt" size={size} color={color}/>),
        }}/>
      <expo_router_1.Tabs.Screen name="payments" options={{
            title: 'Payments',
            tabBarIcon: ({ color, size }) => (<vector_icons_1.MaterialIcons name="payments" size={size} color={color}/>),
        }}/>
      <expo_router_1.Tabs.Screen name="more" options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => (<vector_icons_1.MaterialIcons name="menu" size={size} color={color}/>),
        }}/>
    </expo_router_1.Tabs>);
}
