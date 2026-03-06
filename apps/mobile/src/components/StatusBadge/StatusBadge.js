"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBadge = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const STATUS_CONFIG = {
    compliant: { color: ui_tokens_1.colors.green, bg: ui_tokens_1.colors.greenBg, icon: '✓', defaultLabel: 'Compliant' },
    warning: { color: ui_tokens_1.colors.gold, bg: ui_tokens_1.colors.goldBg, icon: '!', defaultLabel: 'Action Required' },
    lapsed: { color: ui_tokens_1.colors.red, bg: ui_tokens_1.colors.redBg, icon: '✕', defaultLabel: 'Lapsed' },
    pending: { color: ui_tokens_1.colors.greyMid, bg: ui_tokens_1.colors.grey1, icon: '…', defaultLabel: 'Pending' },
    filed: { color: ui_tokens_1.colors.teal, bg: ui_tokens_1.colors.tealLight, icon: '✓', defaultLabel: 'Filed' },
    overdue: { color: ui_tokens_1.colors.orange, bg: ui_tokens_1.colors.orangeBg, icon: '!', defaultLabel: 'Overdue' },
    draft: { color: ui_tokens_1.colors.greyMid, bg: ui_tokens_1.colors.greyDark, icon: '✎', defaultLabel: 'Draft' },
    submitted: { color: ui_tokens_1.colors.mint, bg: ui_tokens_1.colors.cobalt, icon: '↑', defaultLabel: 'Submitted' },
};
const StatusBadge = ({ status, label, size = 'medium', }) => {
    const config = STATUS_CONFIG[status];
    const displayLabel = label ?? config.defaultLabel;
    return (<react_native_1.View style={[styles.container, styles[size], { backgroundColor: config.bg }]}>
      <react_native_1.Text style={[styles.icon, { color: config.color }]}>{config.icon}</react_native_1.Text>
      <react_native_1.Text style={[styles.label, { color: config.color }]}>{displayLabel}</react_native_1.Text>
    </react_native_1.View>);
};
exports.StatusBadge = StatusBadge;
const styles = react_native_1.StyleSheet.create({
    container: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: ui_tokens_1.spacing.radius.full,
        paddingHorizontal: ui_tokens_1.spacing.sm,
    },
    small: { paddingVertical: 2 },
    medium: { paddingVertical: ui_tokens_1.spacing.xs },
    large: { paddingVertical: ui_tokens_1.spacing.sm, paddingHorizontal: ui_tokens_1.spacing.md },
    icon: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        marginRight: 4,
    },
    label: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
    },
});
