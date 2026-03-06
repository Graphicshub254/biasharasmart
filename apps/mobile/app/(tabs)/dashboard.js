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
exports.default = DashboardScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const network_1 = require("../../src/lib/network");
const invoice_sync_1 = require("../../src/lib/invoice-sync");
const notifications_1 = require("../../src/lib/notifications");
// --- Constants ---
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
// --- Component ---
function DashboardScreen() {
    const router = (0, expo_router_1.useRouter)();
    const { isOnline } = (0, network_1.useNetworkStatus)();
    (0, invoice_sync_1.useInvoiceSync)(); // auto-syncs offline invoice queue on reconnect
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [summary, setSummary] = (0, react_1.useState)(null);
    const [whtSummary, setWhtSummary] = (0, react_1.useState)(null);
    const [score, setScore] = (0, react_1.useState)(420);
    const [cachedSummary, setCachedSummary] = (0, react_1.useState)(null);
    const [isBlurred, setIsBlurred] = (0, react_1.useState)(false);
    const fetchDashboard = (0, react_1.useCallback)(async (isRefresh = false) => {
        if (!isRefresh)
            setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/dashboard/summary`);
            if (!res.ok)
                throw new Error('Failed to fetch dashboard data');
            const data = await res.json();
            setSummary(data);
            setCachedSummary(data);
            // Register for push notifications
            (0, notifications_1.registerForPushNotifications)(data.business.id);
            // Fetch WHT summary
            const whtRes = await fetch(`${API_BASE}/api/payments/wht-summary/${data.business.id}`);
            if (whtRes.ok) {
                const whtData = await whtRes.json();
                setWhtSummary(whtData);
            }
            // Fetch Score
            const scoreRes = await fetch(`${API_BASE}/api/score/${data.business.id}`);
            if (scoreRes.ok) {
                const scoreData = await scoreRes.json();
                setScore(scoreData.total);
            }
        }
        catch (error) {
            console.error('Dashboard fetch error:', error);
            if (cachedSummary) {
                setSummary(cachedSummary);
            }
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [cachedSummary]);
    // Initial fetch
    (0, react_1.useEffect)(() => {
        fetchDashboard();
    }, []);
    // Re-fetch when coming back online
    (0, react_1.useEffect)(() => {
        if (isOnline) {
            fetchDashboard();
        }
    }, [isOnline]);
    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboard(true);
    };
    const handleAction = (route, placeholder) => {
        if (placeholder) {
            react_native_1.Alert.alert('Coming Soon', placeholder);
        }
        else {
            router.push(route);
        }
    };
    // --- Render Helpers ---
    if (loading && !summary) {
        return (<react_native_1.SafeAreaView style={styles.container}>
        <react_native_1.View style={styles.header}>
          <react_native_1.View style={styles.skeletonTitle}/>
        </react_native_1.View>
        <react_native_1.ScrollView contentContainerStyle={styles.scrollContent}>
          <components_1.SkeletonLoader variant="hero" count={1}/>
          <react_native_1.View style={styles.metricGrid}>
            <components_1.SkeletonLoader variant="tile" count={4} style={{ flex: 1 }}/>
          </react_native_1.View>
          <components_1.SkeletonLoader variant="row" count={5}/>
        </react_native_1.ScrollView>
      </react_native_1.SafeAreaView>);
    }
    const tccConfig = summary?.tcc ? {
        compliant: { type: 'success', title: 'TCC Valid', message: `Tax Compliance Certificate is active — ${summary.tcc.daysRemaining} days remaining` },
        warning: { type: 'warning', title: 'TCC Expiring', message: `Tax Compliance Certificate expires soon — ${summary.tcc.daysRemaining} days remaining. Renew now.` },
        lapsed: { type: 'error', title: 'TCC Lapsed', message: 'Your Tax Compliance Certificate has lapsed. Renew immediately to avoid penalties.' },
    }[summary.tcc.status] : null;
    return (<react_native_1.SafeAreaView style={styles.container}>
      {/* Header */}
      <react_native_1.View style={styles.header}>
        <react_native_1.View>
          <react_native_1.Text style={styles.businessName}>{summary?.business.name || 'Loading...'}</react_native_1.Text>
          <react_native_1.Text style={styles.kraPin}>PIN: {summary?.business.kraPin}</react_native_1.Text>
        </react_native_1.View>
        {!isOnline && (<react_native_1.View style={styles.offlineBadge}>
            <vector_icons_1.MaterialIcons name="cloud-off" size={14} color={ui_tokens_1.colors.white}/>
            <react_native_1.Text style={styles.offlineText}>OFFLINE</react_native_1.Text>
          </react_native_1.View>)}
      </react_native_1.View>

      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui_tokens_1.colors.mint}/>}>
        {/* Offline Banner */}
        {!isOnline && !cachedSummary && (<components_1.AlertBanner type="warning" title="You're offline" message="Connect to the internet to load your dashboard data." dismissable={false}/>)}

        {/* Balance Card */}
        <react_native_1.View style={styles.section}>
          <components_1.BalanceCard label="This Month's Revenue" amount={summary?.revenue.thisMonth || 0} trend={summary?.revenue.trend} isBlurred={isBlurred} onToggleBlur={() => setIsBlurred(!isBlurred)} variant="large" isLoading={loading}/>
        </react_native_1.View>

        {/* Metric Grid */}
        <react_native_1.View style={styles.metricGrid}>
          <react_native_1.View style={styles.metricRow}>
            <components_1.MetricTile label="Invoices" value={summary?.invoices.total || 0} accentColor={ui_tokens_1.colors.mint} isLoading={loading}/>
            <components_1.MetricTile label="Pending" value={summary?.invoices.pending || 0} accentColor={ui_tokens_1.colors.gold} isLoading={loading}/>
          </react_native_1.View>
          <react_native_1.View style={styles.metricRow}>
            <components_1.MetricTile label="Overdue" value={summary?.invoices.overdue || 0} accentColor={ui_tokens_1.colors.red} isLoading={loading}/>
            <components_1.MetricTile label="Today" value={summary?.payments.todayCount || 0} unit="pmts" accentColor={ui_tokens_1.colors.teal} isLoading={loading}/>
          </react_native_1.View>
          <react_native_1.View style={styles.metricRow}>
            <components_1.MetricTile label="WHT Due" value={whtSummary?.totalPending || 0} unit="KES" accentColor={(whtSummary?.overdueCount || 0) > 0 ? ui_tokens_1.colors.red : ui_tokens_1.colors.gold} isLoading={loading}/>
            <components_1.MetricTile label="Bia Score" value={score} unit="/ 1000" accentColor={ui_tokens_1.colors.cobalt} isLoading={loading} onPress={() => router.push('/score')}/>
          </react_native_1.View>
        </react_native_1.View>

        {/* Gateway Upsell Banner */}
        {whtSummary?.paymentMode === 'legacy' && (<components_1.AlertBanner type="warning" title="Switch to Gateway" message="WHT auto-handled. Bia Score +100 pts." actionLabel="Upgrade Now" onAction={() => router.push('/(tabs)/payments')}/>)}

        {/* TCC Status */}
        {tccConfig && (<components_1.AlertBanner type={tccConfig.type} title={tccConfig.title} message={tccConfig.message}/>)}

        {/* Quick Actions */}
        <react_native_1.View style={styles.actionRow}>
          <components_1.ActionButton label="New Invoice" variant="ghost" fullWidth={false} onPress={() => handleAction('/(tabs)/invoices')}/>
          <components_1.ActionButton label="Record Payment" variant="ghost" fullWidth={false} onPress={() => handleAction('/(tabs)/payments')}/>
          <components_1.ActionButton label="File VAT" variant="ghost" fullWidth={false} onPress={() => handleAction('', 'VAT Filing coming in T2.1')}/>
        </react_native_1.View>

        {/* Recent Transactions */}
        <components_1.SectionCard title="Recent Transactions" accentColor={ui_tokens_1.colors.mint}>
          {summary?.recentTransactions.map((tx) => (<components_1.TransactionRow key={tx.id} id={tx.id} type={tx.type === 'credit' ? 'income' : 'expense'} title={tx.description} amount={tx.amount} timestamp={new Date(tx.date)} onPress={() => react_native_1.Alert.alert('Transaction Detail', `ID: ${tx.id}\n${tx.description}`)}/>))}
          {(!summary?.recentTransactions || summary.recentTransactions.length === 0) && (<react_native_1.Text style={styles.emptyText}>No recent transactions</react_native_1.Text>)}
        </components_1.SectionCard>

        <react_native_1.View style={styles.footerSpacer}/>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingVertical: ui_tokens_1.spacing.md,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    businessName: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    kraPin: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        marginTop: 2,
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ui_tokens_1.colors.red,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    offlineText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: 10,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginLeft: 4,
    },
    scrollContent: {
        paddingBottom: ui_tokens_1.spacing.xxl,
    },
    section: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        marginBottom: ui_tokens_1.spacing.md,
    },
    metricGrid: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding - ui_tokens_1.spacing.xs,
        marginBottom: ui_tokens_1.spacing.md,
    },
    metricRow: {
        flexDirection: 'row',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        marginBottom: ui_tokens_1.spacing.lg,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 4,
        height: 40,
    },
    emptyText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
        textAlign: 'center',
        paddingVertical: ui_tokens_1.spacing.lg,
    },
    skeletonTitle: {
        width: 150,
        height: 24,
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: 4,
        opacity: 0.4,
    },
    footerSpacer: {
        height: 40,
    },
});
