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
exports.AlertBanner = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const ALERT_CONFIG = {
    info: { border: ui_tokens_1.colors.cobalt, bg: '#E3F0FF', title: ui_tokens_1.colors.cobalt },
    warning: { border: ui_tokens_1.colors.gold, bg: ui_tokens_1.colors.goldBg, title: ui_tokens_1.colors.gold },
    error: { border: ui_tokens_1.colors.red, bg: ui_tokens_1.colors.redBg, title: ui_tokens_1.colors.red },
    success: { border: ui_tokens_1.colors.green, bg: ui_tokens_1.colors.greenBg, title: ui_tokens_1.colors.green },
};
const AlertBanner = ({ type, title, message, actionLabel, onAction, dismissable = true, }) => {
    const [visible, setVisible] = (0, react_1.useState)(true);
    const config = ALERT_CONFIG[type];
    if (!visible)
        return null;
    return (<react_native_1.View style={[styles.container, { backgroundColor: config.bg, borderLeftColor: config.border }]}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={[styles.title, { color: config.title }]}>{title}</react_native_1.Text>
        {message && <react_native_1.Text style={styles.message}>{message}</react_native_1.Text>}
        {actionLabel && onAction && (<react_native_1.TouchableOpacity onPress={onAction}>
            <react_native_1.Text style={[styles.action, { color: config.border }]}>{actionLabel}</react_native_1.Text>
          </react_native_1.TouchableOpacity>)}
      </react_native_1.View>
      {dismissable && (<react_native_1.TouchableOpacity onPress={() => setVisible(false)} style={styles.dismiss}>
          <react_native_1.Text style={styles.dismissText}>✕</react_native_1.Text>
        </react_native_1.TouchableOpacity>)}
    </react_native_1.View>);
};
exports.AlertBanner = AlertBanner;
const styles = react_native_1.StyleSheet.create({
    container: {
        flexDirection: 'row', borderLeftWidth: 4,
        borderRadius: ui_tokens_1.spacing.radius.sm, padding: ui_tokens_1.spacing.md,
        marginHorizontal: ui_tokens_1.spacing.screenPadding, marginBottom: ui_tokens_1.spacing.sm,
    },
    content: { flex: 1 },
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
    },
    message: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.black, marginTop: 4,
    },
    action: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
        marginTop: ui_tokens_1.spacing.sm, textDecorationLine: 'underline',
    },
    dismiss: { padding: ui_tokens_1.spacing.xs },
    dismissText: { color: ui_tokens_1.colors.greyMid, fontSize: 14 },
});
