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
exports.default = PaymentsScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const network_1 = require("../../src/lib/network");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
function PaymentsScreen() {
    const router = (0, expo_router_1.useRouter)();
    const { isOnline } = (0, network_1.useNetworkStatus)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [payments, setPayments] = (0, react_1.useState)([]);
    const [whtSummary, setWhtSummary] = (0, react_1.useState)(null);
    const [businessId, setBusinessId] = (0, react_1.useState)(null);
    const fetchPayments = (0, react_1.useCallback)(async (isRefresh = false) => {
        if (!isRefresh)
            setLoading(true);
        try {
            // 1. Get business ID from dashboard summary if not already set
            let currentBusinessId = businessId;
            if (!currentBusinessId) {
                const dashboardRes = await fetch(`${API_BASE}/api/dashboard/summary`);
                if (dashboardRes.ok) {
                    const dashboardData = await dashboardRes.json();
                    currentBusinessId = dashboardData.business.id;
                    setBusinessId(currentBusinessId);
                }
            }
            if (currentBusinessId) {
                // 2. Fetch payments and WHT summary in parallel
                const [paymentsRes, whtRes] = await Promise.all([
                    fetch(`${API_BASE}/api/payments/${currentBusinessId}`),
                    fetch(`${API_BASE}/api/payments/wht-summary/${currentBusinessId}`),
                ]);
                if (paymentsRes.ok) {
                    const paymentsData = await paymentsRes.json();
                    setPayments(paymentsData.data);
                }
                if (whtRes.ok) {
                    const whtData = await whtRes.json();
                    setWhtSummary(whtData);
                }
            }
        }
        catch (error) {
            console.error('Payments fetch error:', error);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [businessId]);
    (0, react_1.useEffect)(() => {
        fetchPayments();
    }, []);
    (0, react_1.useEffect)(() => {
        if (isOnline)
            fetchPayments();
    }, [isOnline]);
    const onRefresh = () => {
        setRefreshing(true);
        fetchPayments(true);
    };
    const mapStatusToType = (status) => {
        switch (status) {
            case 'confirmed': return 'income';
            case 'pending': return 'pending';
            case 'failed': return 'failed';
            default: return 'pending';
        }
    };
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Text style={styles.title}>Payments</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui_tokens_1.colors.mint}/>}>
        {loading && !refreshing ? (<react_native_1.View style={{ paddingHorizontal: ui_tokens_1.spacing.screenPadding }}>
            <components_1.SkeletonLoader variant="row" count={8}/>
          </react_native_1.View>) : (<>
            {/* WHT Alert */}
            {whtSummary && whtSummary.totalPending > 0 && (<components_1.AlertBanner type={whtSummary.overdueCount > 0 ? 'error' : 'warning'} title="WHT Due" message={`KES ${whtSummary.totalPending.toLocaleString()} withholding tax is pending remittance to KRA.`} dismissable={false}/>)}

            {/* Gateway Upsell Alert */}
            {whtSummary && whtSummary.paymentMode === 'legacy' && (<components_1.AlertBanner type="info" title="Upgrade to Gateway" message="Switch to Gateway flow to have WHT automatically remitted. Earn +100 Bia Score points." actionLabel="Learn More" onAction={() => router.push('/onboard/type')} dismissable={true}/>)}

            {/* Transaction List */}
            {payments.length > 0 ? (payments.map((p) => (<components_1.TransactionRow key={p.id} id={p.id} type={mapStatusToType(p.status)} title={p.phoneNumber || p.mpesaCode || 'Unknown Payment'} subtitle={`${p.paymentFlow === 'gateway' ? 'Gateway' : 'Legacy'} Flow • ${p.mpesaCode || 'Pending Ref'}`} amount={Number(p.amountKes)} timestamp={new Date(p.createdAt)} onPress={() => { }}/>))) : (<react_native_1.View style={styles.emptyContainer}>
                <react_native_1.Text style={styles.emptyText}>No payments recorded yet.</react_native_1.Text>
              </react_native_1.View>)}
          </>)}
      </react_native_1.ScrollView>

      {/* FAB */}
      <react_native_1.TouchableOpacity style={styles.fab} onPress={() => router.push('/payments/confirm')} activeOpacity={0.8}>
        <vector_icons_1.MaterialIcons name="add" size={24} color={ui_tokens_1.colors.ink}/>
        <react_native_1.Text style={styles.fabText}>Collect Payment</react_native_1.Text>
      </react_native_1.TouchableOpacity>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    header: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingVertical: ui_tokens_1.spacing.md,
    },
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.title,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    scrollContent: {
        paddingBottom: 100, // Space for FAB
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
    },
    fab: {
        position: 'absolute',
        bottom: ui_tokens_1.spacing.lg,
        right: ui_tokens_1.spacing.screenPadding,
        backgroundColor: ui_tokens_1.colors.mint,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ui_tokens_1.spacing.lg,
        paddingVertical: ui_tokens_1.spacing.md,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    fabText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.ink,
        marginLeft: ui_tokens_1.spacing.xs,
    },
});
