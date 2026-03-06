"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceCard = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const BalanceCard = ({ amount, label, variant = 'large', isBlurred = false, onToggleBlur, trend, isLoading = false, }) => {
    const formattedAmount = isBlurred
        ? '••••••'
        : `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
    if (isLoading) {
        return <react_native_1.View style={[styles.container, styles.skeleton]}/>;
    }
    return (<react_native_1.View style={[styles.container, styles[variant]]}>
      <react_native_1.Text style={styles.label}>{label}</react_native_1.Text>
      <react_native_1.TouchableOpacity onPress={onToggleBlur} activeOpacity={0.8}>
        <react_native_1.Text style={styles.amount}>{formattedAmount}</react_native_1.Text>
      </react_native_1.TouchableOpacity>
      {trend !== undefined && (<react_native_1.Text style={[styles.trend, trend >= 0 ? styles.trendUp : styles.trendDown]}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% vs last month
        </react_native_1.Text>)}
    </react_native_1.View>);
};
exports.BalanceCard = BalanceCard;
const styles = react_native_1.StyleSheet.create({
    container: {
        backgroundColor: ui_tokens_1.colors.ink,
        borderRadius: ui_tokens_1.spacing.radius.lg,
        padding: ui_tokens_1.spacing.cardPadding,
    },
    large: { minHeight: 160 },
    medium: { minHeight: 120 },
    compact: { minHeight: 80 },
    skeleton: {
        backgroundColor: ui_tokens_1.colors.greyDark,
        opacity: 0.4,
        minHeight: 160,
    },
    label: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        color: ui_tokens_1.colors.greyMid,
        marginBottom: ui_tokens_1.spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    amount: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.hero,
        fontWeight: ui_tokens_1.typography.fontWeight.black,
        color: ui_tokens_1.colors.mint,
        letterSpacing: -1,
    },
    trend: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        marginTop: ui_tokens_1.spacing.xs,
    },
    trendUp: { color: ui_tokens_1.colors.mint },
    trendDown: { color: ui_tokens_1.colors.red },
});
