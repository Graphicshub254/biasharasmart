"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceCard = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const StatusBadge_1 = require("../StatusBadge/StatusBadge");
const STATUS_MAP = {
    draft: 'pending', pending_kra: 'pending', issued: 'filed',
    paid: 'compliant', overdue: 'overdue', cancelled: 'lapsed',
};
const InvoiceCard = ({ customerName, amount, status, cuNumber, daysCounter, invoiceNumber, onPress, isLoading = false, }) => {
    if (isLoading)
        return <react_native_1.View style={[styles.container, styles.skeleton]}/>;
    return (<react_native_1.TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Text style={styles.customer} numberOfLines={1}>{customerName}</react_native_1.Text>
        <StatusBadge_1.StatusBadge status={STATUS_MAP[status]} size="small"/>
      </react_native_1.View>
      {invoiceNumber && <react_native_1.Text style={styles.invoiceNum}>{invoiceNumber}</react_native_1.Text>}
      <react_native_1.View style={styles.footer}>
        <react_native_1.Text style={styles.amount}>
          KES {amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </react_native_1.Text>
        {cuNumber && (<react_native_1.View style={styles.cuBadge}>
            <react_native_1.Text style={styles.cuText}>KRA ✓ {cuNumber.slice(-8)}</react_native_1.Text>
          </react_native_1.View>)}
        {daysCounter !== undefined && status === 'overdue' && (<react_native_1.Text style={styles.daysOverdue}>{daysCounter}d overdue</react_native_1.Text>)}
      </react_native_1.View>
    </react_native_1.TouchableOpacity>);
};
exports.InvoiceCard = InvoiceCard;
const styles = react_native_1.StyleSheet.create({
    container: {
        backgroundColor: ui_tokens_1.colors.greyDark, borderRadius: ui_tokens_1.spacing.radius.md,
        padding: ui_tokens_1.spacing.md, marginHorizontal: ui_tokens_1.spacing.screenPadding,
        marginBottom: ui_tokens_1.spacing.sm,
    },
    skeleton: { height: 100, opacity: 0.4 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    customer: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold, color: ui_tokens_1.colors.white, flex: 1, marginRight: ui_tokens_1.spacing.sm,
    },
    invoiceNum: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono, fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid, marginTop: 2,
    },
    footer: { flexDirection: 'row', alignItems: 'center', marginTop: ui_tokens_1.spacing.sm, justifyContent: 'space-between' },
    amount: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono, fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold, color: ui_tokens_1.colors.mint,
    },
    cuBadge: {
        backgroundColor: ui_tokens_1.colors.greenBg, borderRadius: ui_tokens_1.spacing.radius.full,
        paddingHorizontal: ui_tokens_1.spacing.sm, paddingVertical: 2,
    },
    cuText: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono, fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.green, fontWeight: ui_tokens_1.typography.fontWeight.semibold,
    },
    daysOverdue: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.orange, fontWeight: ui_tokens_1.typography.fontWeight.medium,
    },
});
