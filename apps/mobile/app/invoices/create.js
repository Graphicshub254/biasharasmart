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
exports.default = CreateInvoiceScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const InputField_1 = require("../../src/components/InputField/InputField");
const ActionButton_1 = require("../../src/components/ActionButton/ActionButton");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8'; // temp until auth in T1.6
function CreateInvoiceScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [customerName, setCustomerName] = (0, react_1.useState)('');
    const [customerPhone, setCustomerPhone] = (0, react_1.useState)('');
    const [lineItems, setLineItems] = (0, react_1.useState)([
        { id: Math.random().toString(), description: '', quantity: '1', unitPrice: '', vatRate: 0.16 },
    ]);
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const totals = (0, react_1.useMemo)(() => {
        let subtotal = 0;
        let vat = 0;
        lineItems.forEach(item => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unitPrice) || 0;
            const lineTotal = qty * price;
            subtotal += lineTotal;
            vat += lineTotal * item.vatRate;
        });
        return { subtotal, vat, total: subtotal + vat };
    }, [lineItems]);
    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: Math.random().toString(), description: '', quantity: '1', unitPrice: '', vatRate: 0.16 },
        ]);
    };
    const removeLineItem = (id) => {
        if (lineItems.length === 1)
            return;
        setLineItems(lineItems.filter(item => item.id !== id));
    };
    const updateLineItem = (id, updates) => {
        setLineItems(lineItems.map(item => item.id === id ? { ...item, ...updates } : item));
    };
    const isValid = lineItems.every(item => item.description.trim() !== '' &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.unitPrice) >= 0);
    const handleSubmit = async () => {
        if (!isValid) {
            react_native_1.Alert.alert('Invalid Form', 'Please fill in all line item details correctly.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId: BUSINESS_ID,
                    customerName: customerName.trim() || undefined,
                    customerPhone: customerPhone.trim() || undefined,
                    lineItems: lineItems.map(item => ({
                        description: item.description,
                        quantity: parseFloat(item.quantity),
                        unitPrice: parseFloat(item.unitPrice),
                        vatRate: item.vatRate,
                    })),
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to create invoice');
            }
            const invoice = await res.json();
            // Temporary until T1.3c builds detail screen
            react_native_1.Alert.alert('Success', 'Invoice created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
        catch (e) {
            react_native_1.Alert.alert('Error', e.message ?? 'Could not create invoice');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.KeyboardAvoidingView behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <react_native_1.View style={styles.header}>
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <vector_icons_1.Ionicons name="chevron-back" size={28} color={ui_tokens_1.colors.white}/>
          </react_native_1.TouchableOpacity>
          <react_native_1.Text style={styles.headerTitle}>New Invoice</react_native_1.Text>
          <react_native_1.View style={{ width: 28 }}/>
        </react_native_1.View>

        <react_native_1.ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <react_native_1.View style={styles.section}>
            <react_native_1.Text style={styles.sectionTitle}>Customer</react_native_1.Text>
            <InputField_1.InputField label="Customer Name" value={customerName} onChangeText={setCustomerName} placeholder="e.g. John Doe"/>
            <InputField_1.InputField label="Customer Phone" value={customerPhone} onChangeText={setCustomerPhone} placeholder="e.g. 0712345678" keyboardType="phone-pad"/>
          </react_native_1.View>

          <react_native_1.View style={styles.section}>
            <react_native_1.View style={styles.sectionHeader}>
              <react_native_1.Text style={styles.sectionTitle}>Line Items</react_native_1.Text>
              <react_native_1.TouchableOpacity onPress={addLineItem} style={styles.addGhost}>
                <vector_icons_1.Ionicons name="add-circle-outline" size={20} color={ui_tokens_1.colors.mint}/>
                <react_native_1.Text style={styles.addGhostText}>Add Item</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>

            {lineItems.map((item, index) => {
            const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
            return (<react_native_1.View key={item.id} style={styles.lineItemCard}>
                  <react_native_1.View style={styles.lineItemTop}>
                    <react_native_1.Text style={styles.lineItemNumber}>Item {index + 1}</react_native_1.Text>
                    {lineItems.length > 1 && (<react_native_1.TouchableOpacity onPress={() => removeLineItem(item.id)}>
                        <vector_icons_1.Ionicons name="trash-outline" size={20} color={ui_tokens_1.colors.red}/>
                      </react_native_1.TouchableOpacity>)}
                  </react_native_1.View>

                  <InputField_1.InputField label="Description" value={item.description} onChangeText={(text) => updateLineItem(item.id, { description: text })} placeholder="What are you charging for?"/>

                  <react_native_1.View style={styles.row}>
                    <react_native_1.View style={{ flex: 1, marginRight: ui_tokens_1.spacing.sm }}>
                      <InputField_1.InputField label="Qty" value={item.quantity} onChangeText={(text) => updateLineItem(item.id, { quantity: text })} keyboardType="numeric"/>
                    </react_native_1.View>
                    <react_native_1.View style={{ flex: 2 }}>
                      <InputField_1.InputField label="Unit Price (KES)" value={item.unitPrice} onChangeText={(text) => updateLineItem(item.id, { unitPrice: text })} keyboardType="numeric"/>
                    </react_native_1.View>
                  </react_native_1.View>

                  <react_native_1.View style={styles.vatRow}>
                    <react_native_1.Text style={styles.vatLabel}>VAT Rate</react_native_1.Text>
                    <react_native_1.View style={styles.vatPills}>
                      <react_native_1.TouchableOpacity style={[styles.vatPill, item.vatRate === 0.16 && styles.vatPillActive]} onPress={() => updateLineItem(item.id, { vatRate: 0.16 })}>
                        <react_native_1.Text style={[styles.vatPillText, item.vatRate === 0.16 && styles.vatPillTextActive]}>16%</react_native_1.Text>
                      </react_native_1.TouchableOpacity>
                      <react_native_1.TouchableOpacity style={[styles.vatPill, item.vatRate === 0 && styles.vatPillActive]} onPress={() => updateLineItem(item.id, { vatRate: 0 })}>
                        <react_native_1.Text style={[styles.vatPillText, item.vatRate === 0 && styles.vatPillTextActive]}>0%</react_native_1.Text>
                      </react_native_1.TouchableOpacity>
                    </react_native_1.View>
                    <react_native_1.View style={{ flex: 1 }}/>
                    <react_native_1.Text style={styles.lineTotal}>
                      KES {lineTotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </react_native_1.Text>
                  </react_native_1.View>
                </react_native_1.View>);
        })}
          </react_native_1.View>

          <react_native_1.View style={styles.totalsSection}>
            <react_native_1.View style={styles.totalRow}>
              <react_native_1.Text style={styles.totalLabel}>Subtotal</react_native_1.Text>
              <react_native_1.Text style={styles.totalValue}>KES {totals.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.totalRow}>
              <react_native_1.Text style={styles.totalLabel}>VAT Total</react_native_1.Text>
              <react_native_1.Text style={styles.totalValue}>KES {totals.vat.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</react_native_1.Text>
            </react_native_1.View>
            <react_native_1.View style={styles.divider}/>
            <react_native_1.View style={styles.totalRow}>
              <react_native_1.Text style={[styles.totalLabel, { color: ui_tokens_1.colors.white }]}>Grand Total</react_native_1.Text>
              <react_native_1.Text style={styles.grandTotal}>KES {totals.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</react_native_1.Text>
            </react_native_1.View>
          </react_native_1.View>

          <react_native_1.View style={styles.actionWrapper}>
            <ActionButton_1.ActionButton label="Create Invoice" onPress={handleSubmit} isLoading={submitting} isDisabled={!isValid}/>
          </react_native_1.View>
        </react_native_1.ScrollView>
      </react_native_1.KeyboardAvoidingView>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingVertical: ui_tokens_1.spacing.md,
    },
    backButton: {
        padding: ui_tokens_1.spacing.xs,
    },
    headerTitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingBottom: ui_tokens_1.spacing.xxl,
    },
    section: {
        marginBottom: ui_tokens_1.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ui_tokens_1.spacing.md,
    },
    sectionTitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
        color: ui_tokens_1.colors.greyMid,
        marginBottom: ui_tokens_1.spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    addGhost: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addGhostText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
        color: ui_tokens_1.colors.mint,
        marginLeft: 4,
    },
    lineItemCard: {
        backgroundColor: ui_tokens_1.colors.greyDark + '33', // faint overlay
        borderRadius: ui_tokens_1.spacing.radius.md,
        padding: ui_tokens_1.spacing.md,
        marginBottom: ui_tokens_1.spacing.md,
        borderWidth: 1,
        borderColor: ui_tokens_1.colors.greyDark,
    },
    lineItemTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ui_tokens_1.spacing.sm,
    },
    lineItemNumber: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
    },
    row: {
        flexDirection: 'row',
    },
    vatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: ui_tokens_1.spacing.xs,
    },
    vatLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        marginRight: ui_tokens_1.spacing.sm,
    },
    vatPills: {
        flexDirection: 'row',
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.sm,
        padding: 2,
    },
    vatPill: {
        paddingHorizontal: ui_tokens_1.spacing.sm,
        paddingVertical: 4,
        borderRadius: ui_tokens_1.spacing.radius.sm - 2,
    },
    vatPillActive: {
        backgroundColor: ui_tokens_1.colors.cobalt,
    },
    vatPillText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: 10,
        color: ui_tokens_1.colors.greyMid,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
    },
    vatPillTextActive: {
        color: ui_tokens_1.colors.white,
    },
    lineTotal: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.mint,
    },
    totalsSection: {
        backgroundColor: ui_tokens_1.colors.greyDark + '11',
        borderRadius: ui_tokens_1.spacing.radius.lg,
        padding: ui_tokens_1.spacing.lg,
        marginBottom: ui_tokens_1.spacing.xl,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ui_tokens_1.spacing.sm,
    },
    totalLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
    },
    totalValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.white,
    },
    divider: {
        height: 1,
        backgroundColor: ui_tokens_1.colors.greyDark,
        marginVertical: ui_tokens_1.spacing.md,
    },
    grandTotal: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.mint,
    },
    actionWrapper: {
        marginTop: ui_tokens_1.spacing.md,
    },
});
