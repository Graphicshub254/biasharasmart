"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRow = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const TransactionRow = ({ type, title, subtitle, amount, timestamp, onPress, isLoading = false, }) => {
    const isCredit = type === 'income';
    const amountColor = type === 'income' ? ui_tokens_1.colors.mint
        : type === 'failed' ? ui_tokens_1.colors.red
            : type === 'pending' ? ui_tokens_1.colors.gold
                : ui_tokens_1.colors.white;
    if (isLoading)
        return <react_native_1.View style={styles.skeleton}/>;
    return (<react_native_1.TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <react_native_1.View style={[styles.iconDot, styles[`dot_${type}`]]}/>
      <react_native_1.View style={styles.details}>
        <react_native_1.Text style={styles.title} numberOfLines={1}>{title}</react_native_1.Text>
        {subtitle && <react_native_1.Text style={styles.subtitle} numberOfLines={1}>{subtitle}</react_native_1.Text>}
      </react_native_1.View>
      <react_native_1.View style={styles.right}>
        <react_native_1.Text style={[styles.amount, { color: amountColor }]}>
          {isCredit ? '+' : '-'}KES {Math.abs(amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </react_native_1.Text>
        <react_native_1.Text style={styles.time}>
          {timestamp.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
        </react_native_1.Text>
      </react_native_1.View>
    </react_native_1.TouchableOpacity>);
};
exports.TransactionRow = TransactionRow;
const styles = react_native_1.StyleSheet.create({
    container: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: ui_tokens_1.spacing.md, paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        borderBottomWidth: 1, borderBottomColor: ui_tokens_1.colors.greyDark,
    },
    skeleton: {
        height: 64, marginHorizontal: ui_tokens_1.spacing.screenPadding,
        backgroundColor: ui_tokens_1.colors.greyDark, borderRadius: ui_tokens_1.spacing.radius.sm,
        opacity: 0.4, marginBottom: ui_tokens_1.spacing.sm,
    },
    iconDot: {
        width: 10, height: 10, borderRadius: 5, marginRight: ui_tokens_1.spacing.md,
    },
    dot_income: { backgroundColor: ui_tokens_1.colors.mint },
    dot_expense: { backgroundColor: ui_tokens_1.colors.greyMid },
    dot_pending: { backgroundColor: ui_tokens_1.colors.gold },
    dot_failed: { backgroundColor: ui_tokens_1.colors.red },
    details: { flex: 1 },
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        color: ui_tokens_1.colors.white,
    },
    subtitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid, marginTop: 2,
    },
    right: { alignItems: 'flex-end' },
    amount: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
    },
    time: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid, marginTop: 2,
    },
});
