"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricTile = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const MetricTile = ({ label, value, unit, trend, accentColor = ui_tokens_1.colors.mint, onPress, isLoading = false, }) => {
    if (isLoading)
        return <react_native_1.View style={styles.skeleton}/>;
    return (<react_native_1.TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <react_native_1.Text style={styles.label} numberOfLines={1}>{label}</react_native_1.Text>
      <react_native_1.View style={styles.valueRow}>
        {unit && <react_native_1.Text style={[styles.unit, { color: accentColor }]}>{unit}</react_native_1.Text>}
        <react_native_1.Text style={[styles.value, { color: accentColor }]}>
          {typeof value === 'number' ? value.toLocaleString('en-KE') : value}
        </react_native_1.Text>
      </react_native_1.View>
      {trend !== undefined && (<react_native_1.Text style={[styles.trend, trend >= 0 ? styles.up : styles.down]}>
          {trend >= 0 ? '↑' : '↓'}{Math.abs(trend).toFixed(1)}%
        </react_native_1.Text>)}
    </react_native_1.TouchableOpacity>);
};
exports.MetricTile = MetricTile;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1, backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md, padding: ui_tokens_1.spacing.md,
        margin: ui_tokens_1.spacing.xs,
    },
    skeleton: {
        flex: 1, height: 80, backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md, margin: ui_tokens_1.spacing.xs, opacity: 0.4,
    },
    label: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        color: ui_tokens_1.colors.greyMid,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: ui_tokens_1.spacing.xs },
    unit: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
        marginRight: 3,
    },
    value: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
    },
    trend: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        marginTop: 2,
    },
    up: { color: ui_tokens_1.colors.mint },
    down: { color: ui_tokens_1.colors.red },
});
