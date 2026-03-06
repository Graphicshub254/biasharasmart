"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionButton = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const ActionButton = ({ label, onPress, variant = 'primary', isLoading = false, isDisabled = false, fullWidth = true, icon, }) => {
    return (<react_native_1.TouchableOpacity style={[
            styles.base,
            styles[variant],
            fullWidth && styles.fullWidth,
            (isDisabled || isLoading) && styles.disabled,
        ]} onPress={onPress} disabled={isDisabled || isLoading} activeOpacity={0.8}>
      {isLoading ? (<react_native_1.ActivityIndicator color={variant === 'ghost' ? ui_tokens_1.colors.cobalt : ui_tokens_1.colors.white}/>) : (<react_native_1.View style={styles.content}>
          {icon && <react_native_1.View style={styles.icon}>{icon}</react_native_1.View>}
          <react_native_1.Text style={[styles.label, styles[`label_${variant}`]]}>{label}</react_native_1.Text>
        </react_native_1.View>)}
    </react_native_1.TouchableOpacity>);
};
exports.ActionButton = ActionButton;
const styles = react_native_1.StyleSheet.create({
    base: {
        height: ui_tokens_1.spacing.touchTarget,
        borderRadius: ui_tokens_1.spacing.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: ui_tokens_1.spacing.lg,
    },
    fullWidth: { width: '100%' },
    primary: { backgroundColor: ui_tokens_1.colors.cobalt },
    secondary: { backgroundColor: ui_tokens_1.colors.teal },
    ghost: { backgroundColor: ui_tokens_1.colors.transparent, borderWidth: 1.5, borderColor: ui_tokens_1.colors.cobalt },
    danger: { backgroundColor: ui_tokens_1.colors.red },
    disabled: { opacity: 0.5 },
    content: { flexDirection: 'row', alignItems: 'center' },
    icon: { marginRight: ui_tokens_1.spacing.sm },
    label: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
    },
    label_primary: { color: ui_tokens_1.colors.white },
    label_secondary: { color: ui_tokens_1.colors.white },
    label_ghost: { color: ui_tokens_1.colors.cobalt },
    label_danger: { color: ui_tokens_1.colors.white },
});
