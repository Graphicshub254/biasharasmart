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
exports.InputField = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', error, hint, isDisabled = false, secureTextEntry = false, maxLength, }) => {
    const [focused, setFocused] = (0, react_1.useState)(false);
    const borderColor = error ? ui_tokens_1.colors.red : focused ? ui_tokens_1.colors.cobalt : ui_tokens_1.colors.greyDark;
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.label}>{label}</react_native_1.Text>
      <react_native_1.TextInput style={[styles.input, { borderColor }]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={ui_tokens_1.colors.greyMid} keyboardType={keyboardType} secureTextEntry={secureTextEntry} editable={!isDisabled} maxLength={maxLength} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}/>
      {error && <react_native_1.Text style={styles.error}>{error}</react_native_1.Text>}
      {hint && !error && <react_native_1.Text style={styles.hint}>{hint}</react_native_1.Text>}
    </react_native_1.View>);
};
exports.InputField = InputField;
const styles = react_native_1.StyleSheet.create({
    container: { marginBottom: ui_tokens_1.spacing.md },
    label: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        color: ui_tokens_1.colors.greyMid,
        marginBottom: ui_tokens_1.spacing.xs,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    input: {
        height: ui_tokens_1.spacing.touchTarget,
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderWidth: 1.5, borderRadius: ui_tokens_1.spacing.radius.md,
        paddingHorizontal: ui_tokens_1.spacing.md,
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.white,
    },
    error: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.red, marginTop: 4,
    },
    hint: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid, marginTop: 4,
    },
});
