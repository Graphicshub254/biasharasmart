"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MoreScreen;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const MENU_ITEMS = [
    { label: 'Biashara Score', icon: 'speed', route: '/score' },
    { label: 'TCC Status', icon: 'verified', route: '/tcc' },
    { label: 'VAT Returns', icon: 'receipt-long', route: '/vat' },
    { label: 'Business Profile', icon: 'business', route: '/profile', placeholder: 'Profile management coming in T1.6' },
];
function MoreScreen() {
    const router = (0, expo_router_1.useRouter)();
    const handlePress = (item) => {
        if (item.placeholder) {
            alert(item.placeholder);
        }
        else {
            router.push(item.route);
        }
    };
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Text style={styles.headerTitle}>More</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent}>
        <react_native_1.View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (<react_native_1.TouchableOpacity key={item.label} style={[
                styles.menuItem,
                index === 0 && styles.firstItem,
                index === MENU_ITEMS.length - 1 && styles.lastItem,
            ]} onPress={() => handlePress(item)}>
              <react_native_1.View style={styles.itemLeft}>
                <vector_icons_1.MaterialIcons name={item.icon} size={24} color={ui_tokens_1.colors.mint}/>
                <react_native_1.Text style={styles.itemLabel}>{item.label}</react_native_1.Text>
              </react_native_1.View>
              <vector_icons_1.MaterialIcons name="chevron-right" size={24} color={ui_tokens_1.colors.greyMid}/>
            </react_native_1.TouchableOpacity>))}
        </react_native_1.View>

        <react_native_1.View style={styles.footer}>
          <react_native_1.Text style={styles.versionText}>BiasharaSmart v1.0.0</react_native_1.Text>
        </react_native_1.View>
      </react_native_1.ScrollView>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    header: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingVertical: ui_tokens_1.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: ui_tokens_1.colors.greyDark,
    },
    headerTitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.title,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    scrollContent: {
        paddingVertical: ui_tokens_1.spacing.md,
    },
    menuContainer: {
        marginHorizontal: ui_tokens_1.spacing.screenPadding,
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: ui_tokens_1.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: ui_tokens_1.colors.ink,
    },
    firstItem: {
        borderTopLeftRadius: ui_tokens_1.spacing.radius.md,
        borderTopRightRadius: ui_tokens_1.spacing.radius.md,
    },
    lastItem: {
        borderBottomWidth: 0,
        borderBottomLeftRadius: ui_tokens_1.spacing.radius.md,
        borderBottomRightRadius: ui_tokens_1.spacing.radius.md,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.white,
        marginLeft: ui_tokens_1.spacing.md,
    },
    footer: {
        marginTop: ui_tokens_1.spacing.xl,
        alignItems: 'center',
    },
    versionText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
    },
});
