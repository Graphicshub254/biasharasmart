"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const ProgressBar = ({ current, max, label, color = ui_tokens_1.colors.mint, }) => {
    const percentage = Math.min(1, Math.max(0, current / max));
    return (<react_native_1.View style={styles.container}>
      <react_native_1.View style={styles.labelRow}>
        <react_native_1.Text style={styles.label}>{label}</react_native_1.Text>
        <react_native_1.Text style={styles.value}>{current}/{max}</react_native_1.Text>
      </react_native_1.View>
      <react_native_1.View style={styles.track}>
        <react_native_1.View style={[
            styles.fill,
            { width: `${percentage * 100}%`, backgroundColor: color }
        ]}/>
      </react_native_1.View>
    </react_native_1.View>);
};
exports.ProgressBar = ProgressBar;
const styles = react_native_1.StyleSheet.create({
    container: {
        marginBottom: ui_tokens_1.spacing.md,
        width: '100%',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ui_tokens_1.spacing.xs,
    },
    label: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
        color: ui_tokens_1.colors.white,
    },
    value: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
    },
    track: {
        height: 8,
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: 4,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 4,
    },
});
