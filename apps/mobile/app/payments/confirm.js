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
exports.default = ConfirmPaymentScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const shared_types_1 = require("@biasharasmart/shared-types");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
function ConfirmPaymentScreen() {
    const router = (0, expo_router_1.useRouter)();
    const { invoiceId: queryInvoiceId } = (0, expo_router_1.useLocalSearchParams)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('stk');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [businessId, setBusinessId] = (0, react_1.useState)(null);
    const [invoice, setInvoice] = (0, react_1.useState)(null);
    // Form states
    const [phone, setPhone] = (0, react_1.useState)('254');
    const [invoiceId, setInvoiceId] = (0, react_1.useState)(queryInvoiceId || '');
    const [mpesaCode, setMpesaCode] = (0, react_1.useState)('');
    const [amount, setAmount] = (0, react_1.useState)('');
    const [polling, setPolling] = (0, react_1.useState)(false);
    const fetchInitialData = (0, react_1.useCallback)(async () => {
        try {
            const dashboardRes = await fetch(`${API_BASE}/api/dashboard/summary`);
            if (dashboardRes.ok) {
                const dashboardData = await dashboardRes.json();
                setBusinessId(dashboardData.business.id);
            }
            if (invoiceId) {
                const invoiceRes = await fetch(`${API_BASE}/api/invoices/${invoiceId}`);
                if (invoiceRes.ok) {
                    const invoiceData = await invoiceRes.json();
                    setInvoice(invoiceData);
                    setAmount(invoiceData.totalKes.toString());
                }
            }
        }
        catch (error) {
            console.error('Confirm fetch error:', error);
        }
    }, [invoiceId]);
    (0, react_1.useEffect)(() => {
        fetchInitialData();
    }, [fetchInitialData]);
    // Polling for payment status
    (0, react_1.useEffect)(() => {
        let interval;
        if (polling && invoiceId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${API_BASE}/api/invoices/${invoiceId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.status === 'paid') {
                            setPolling(false);
                            clearInterval(interval);
                            react_native_1.Alert.alert('Payment Successful', 'The invoice has been paid via STK push.', [
                                { text: 'OK', onPress: () => router.replace('/(tabs)/payments') }
                            ]);
                        }
                    }
                }
                catch (e) {
                    console.error('Polling error:', e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [polling, invoiceId, router]);
    const handleStkPush = async () => {
        if (!phone.match(/^254[0-9]{9}$/)) {
            react_native_1.Alert.alert('Invalid Phone', 'Please enter a valid phone number (254XXXXXXXXX).');
            return;
        }
        if (!invoiceId) {
            react_native_1.Alert.alert('Error', 'Invoice ID is required.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/payments/gateway/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId, phone }),
            });
            if (res.ok) {
                const data = await res.json();
                setPolling(true);
                react_native_1.Alert.alert('STK Push Sent', `Please check your phone (${phone}) for the M-Pesa prompt.`);
            }
            else {
                const err = await res.json();
                react_native_1.Alert.alert('STK Push Failed', err.message || 'Unknown error');
            }
        }
        catch (error) {
            react_native_1.Alert.alert('Network Error', 'Could not connect to the server.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleReconcile = async () => {
        if (!businessId || !invoiceId || !mpesaCode || !amount) {
            react_native_1.Alert.alert('Error', 'All fields are required for manual reconcile.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/payments/legacy/reconcile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId,
                    invoiceId,
                    mpesaCode,
                    amountKes: Number(amount),
                    phone,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const whtAmount = data.whtLiability.amountKes;
                react_native_1.Alert.alert('Reconciled Successfully', `WHT liability of KES ${whtAmount.toLocaleString()} created — due in 5 days.`, [{ text: 'OK', onPress: () => router.replace('/(tabs)/payments') }]);
            }
            else {
                const err = await res.json();
                react_native_1.Alert.alert('Reconcile Failed', err.message || 'Unknown error');
            }
        }
        catch (error) {
            react_native_1.Alert.alert('Network Error', 'Could not connect to the server.');
        }
        finally {
            setLoading(false);
        }
    };
    const total = Number(amount) || 0;
    const whtAmount = +(total * shared_types_1.WHT_RATE).toFixed(2);
    const merchantAmount = +(total - whtAmount).toFixed(2);
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <vector_icons_1.MaterialIcons name="arrow-back" size={24} color={ui_tokens_1.colors.white}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.Text style={styles.title}>Confirm Payment</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.View style={styles.tabContainer}>
        <react_native_1.TouchableOpacity style={[styles.tab, activeTab === 'stk' && styles.activeTab]} onPress={() => setActiveTab('stk')}>
          <react_native_1.Text style={[styles.tabText, activeTab === 'stk' && styles.activeTabText]}>STK Push</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        <react_native_1.TouchableOpacity style={[styles.tab, activeTab === 'manual' && styles.activeTab]} onPress={() => setActiveTab('manual')}>
          <react_native_1.Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Manual Reconcile</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent}>
        {invoice && (<react_native_1.View style={styles.invoiceSection}>
            <components_1.InvoiceCard id={invoice.id} customerName={invoice.customerName || 'Customer'} amount={Number(invoice.totalKes)} status={invoice.status} invoiceNumber={`INV-${invoice.id.slice(0, 8).toUpperCase()}`}/>
            <react_native_1.View style={styles.whtBreakdown}>
              <react_native_1.View style={styles.breakdownRow}>
                <react_native_1.Text style={styles.breakdownLabel}>Gross Amount:</react_native_1.Text>
                <react_native_1.Text style={styles.breakdownValue}>KES {total.toLocaleString()}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={styles.breakdownRow}>
                <react_native_1.Text style={styles.breakdownLabel}>WHT (5%):</react_native_1.Text>
                <react_native_1.Text style={[styles.breakdownValue, { color: ui_tokens_1.colors.gold }]}>- KES {whtAmount.toLocaleString()}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={[styles.breakdownRow, styles.totalRow]}>
                <react_native_1.Text style={styles.totalLabel}>Settlement Amount:</react_native_1.Text>
                <react_native_1.Text style={styles.totalValue}>KES {merchantAmount.toLocaleString()}</react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.View>)}

        <react_native_1.View style={styles.form}>
          {activeTab === 'stk' ? (<>
              <components_1.InputField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="254712345678" keyboardType="phone-pad" maxLength={12} hint="Customer will receive an M-Pesa PIN prompt"/>
              <components_1.InputField label="Invoice ID" value={invoiceId} onChangeText={setInvoiceId} placeholder="Enter Invoice UUID" isDisabled={!!queryInvoiceId}/>
              <components_1.ActionButton label={polling ? 'Waiting for M-Pesa...' : 'Send STK Push'} onPress={handleStkPush} isLoading={loading} isDisabled={polling} icon={polling ? <react_native_1.ActivityIndicator size="small" color={ui_tokens_1.colors.white}/> : <vector_icons_1.MaterialIcons name="send" size={20} color={ui_tokens_1.colors.white}/>}/>
              {polling && (<react_native_1.View style={styles.pollingStatus}>
                  <react_native_1.Text style={styles.pollingText}>Awaiting payment confirmation...</react_native_1.Text>
                </react_native_1.View>)}
            </>) : (<>
              <components_1.InputField label="M-Pesa Receipt Code" value={mpesaCode} onChangeText={(text) => setMpesaCode(text.toUpperCase())} placeholder="e.g. QGH2XK8L9P" maxLength={10}/>
              <components_1.InputField label="Amount (KES)" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numeric"/>
               <components_1.InputField label="Invoice ID" value={invoiceId} onChangeText={setInvoiceId} placeholder="Enter Invoice UUID" isDisabled={!!queryInvoiceId}/>
              <components_1.ActionButton label="Confirm Reconcile" onPress={handleReconcile} isLoading={loading} variant="secondary" icon={<vector_icons_1.MaterialIcons name="check-circle" size={20} color={ui_tokens_1.colors.white}/>}/>
              <components_1.AlertBanner type="warning" title="Legacy Mode" message="You must manually remit the 5% WHT to KRA within 5 days." dismissable={false}/>
            </>)}
        </react_native_1.View>
      </react_native_1.ScrollView>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingVertical: ui_tokens_1.spacing.md,
    },
    backButton: {
        marginRight: ui_tokens_1.spacing.md,
    },
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        marginBottom: ui_tokens_1.spacing.md,
    },
    tab: {
        flex: 1,
        paddingVertical: ui_tokens_1.spacing.sm,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: ui_tokens_1.colors.greyDark,
    },
    activeTab: {
        borderBottomColor: ui_tokens_1.colors.mint,
    },
    tabText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
    },
    activeTabText: {
        color: ui_tokens_1.colors.mint,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
    },
    scrollContent: {
        paddingBottom: ui_tokens_1.spacing.xl,
    },
    invoiceSection: {
        marginBottom: ui_tokens_1.spacing.lg,
    },
    whtBreakdown: {
        backgroundColor: ui_tokens_1.colors.greyDark,
        marginHorizontal: ui_tokens_1.spacing.screenPadding,
        marginTop: -ui_tokens_1.spacing.sm,
        padding: ui_tokens_1.spacing.md,
        borderBottomLeftRadius: ui_tokens_1.spacing.radius.md,
        borderBottomRightRadius: ui_tokens_1.spacing.radius.md,
        borderTopWidth: 1,
        borderTopColor: ui_tokens_1.colors.ink,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    breakdownLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
    },
    breakdownValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.white,
    },
    totalRow: {
        marginTop: ui_tokens_1.spacing.sm,
        paddingTop: ui_tokens_1.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: ui_tokens_1.colors.greyMid,
        marginBottom: 0,
    },
    totalLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    totalValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.mint,
    },
    form: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
    },
    pollingStatus: {
        marginTop: ui_tokens_1.spacing.md,
        alignItems: 'center',
    },
    pollingText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.gold,
        fontStyle: 'italic',
    },
});
