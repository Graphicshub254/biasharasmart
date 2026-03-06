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
exports.default = InvoicesScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const InvoiceCard_1 = require("../../src/components/InvoiceCard/InvoiceCard");
const SkeletonLoader_1 = require("../../src/components/SkeletonLoader/SkeletonLoader");
const ActionButton_1 = require("../../src/components/ActionButton/ActionButton");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8'; // temp until auth in T1.6
const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'pending_kra', label: 'Pending KRA' },
    { key: 'issued', label: 'Issued' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
];
function InvoicesScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [invoices, setInvoices] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [activeFilter, setActiveFilter] = (0, react_1.useState)('all');
    const [total, setTotal] = (0, react_1.useState)(0);
    const fetchInvoices = async (statusFilter) => {
        if (!refreshing)
            setLoading(true);
        try {
            const params = new URLSearchParams({ businessId: BUSINESS_ID });
            if (statusFilter && statusFilter !== 'all') {
                params.append('status', statusFilter);
            }
            const res = await fetch(`${API_BASE}/api/invoices?${params.toString()}`);
            if (!res.ok)
                throw new Error('Failed to fetch');
            const data = await res.json();
            setInvoices(data.data ?? []);
            setTotal(data.total ?? 0);
        }
        catch (error) {
            console.error('Fetch error:', error);
            setInvoices([]);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    (0, expo_router_1.useFocusEffect)((0, react_1.useCallback)(() => {
        fetchInvoices(activeFilter);
    }, [activeFilter]));
    const onRefresh = () => {
        setRefreshing(true);
        fetchInvoices(activeFilter);
    };
    const renderFilterPill = ({ key, label }) => {
        const isActive = activeFilter === key;
        return (<react_native_1.TouchableOpacity key={key} style={[styles.pill, isActive && styles.pillActive]} onPress={() => setActiveFilter(key)}>
        <react_native_1.Text style={[styles.pillText, isActive && styles.pillTextActive]}>
          {label}
        </react_native_1.Text>
      </react_native_1.TouchableOpacity>);
    };
    const renderItem = ({ item }) => (<InvoiceCard_1.InvoiceCard id={item.id} customerName={item.customerName ?? 'Unknown Customer'} amount={typeof item.totalKes === 'string' ? parseFloat(item.totalKes) : item.totalKes} status={item.status} cuNumber={item.cuNumber} invoiceNumber={item.id.slice(-8).toUpperCase()} onPress={() => router.push(`/invoices/${item.id}`)}/>);
    const renderEmpty = () => {
        if (loading)
            return null;
        return (<react_native_1.View style={styles.emptyContainer}>
        <vector_icons_1.Ionicons name="document-text-outline" size={64} color={ui_tokens_1.colors.greyMid}/>
        <react_native_1.Text style={styles.emptyTitle}>No invoices yet</react_native_1.Text>
        <react_native_1.Text style={styles.emptySubtitle}>
          {activeFilter === 'all'
                ? 'Create your first invoice to get started'
                : `No ${activeFilter.replace('_', ' ')} invoices found`}
        </react_native_1.Text>
        {activeFilter === 'all' && (<react_native_1.View style={styles.emptyAction}>
            <ActionButton_1.ActionButton label="Create Invoice" onPress={() => router.push('/invoices/create')} fullWidth={false}/>
          </react_native_1.View>)}
      </react_native_1.View>);
    };
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Text style={styles.title}>Invoices</react_native_1.Text>
        <react_native_1.TouchableOpacity style={styles.addButton} onPress={() => router.push('/invoices/create')}>
          <vector_icons_1.Ionicons name="add" size={28} color={ui_tokens_1.colors.white}/>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <react_native_1.View style={styles.filterWrapper}>
        <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(renderFilterPill)}
        </react_native_1.ScrollView>
      </react_native_1.View>

      {loading && !refreshing ? (<SkeletonLoader_1.SkeletonLoader variant="card" count={5}/>) : (<react_native_1.FlatList data={invoices} renderItem={renderItem} keyExtractor={(item) => item.id} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui_tokens_1.colors.mint} colors={[ui_tokens_1.colors.mint]}/>} ListEmptyComponent={renderEmpty} contentContainerStyle={styles.listContent}/>)}
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
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.title,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: ui_tokens_1.colors.cobalt,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterWrapper: {
        marginBottom: ui_tokens_1.spacing.md,
    },
    filterScroll: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
    },
    pill: {
        paddingHorizontal: ui_tokens_1.spacing.md,
        paddingVertical: ui_tokens_1.spacing.sm,
        borderRadius: ui_tokens_1.spacing.radius.full,
        backgroundColor: ui_tokens_1.colors.greyDark,
        marginRight: ui_tokens_1.spacing.sm,
    },
    pillActive: {
        backgroundColor: ui_tokens_1.colors.cobalt,
    },
    pillText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        color: ui_tokens_1.colors.greyMid,
    },
    pillTextActive: {
        color: ui_tokens_1.colors.white,
    },
    listContent: {
        paddingBottom: 100, // Clear the tab bar
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 64,
        paddingHorizontal: ui_tokens_1.spacing.xl,
    },
    emptyTitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginTop: ui_tokens_1.spacing.md,
    },
    emptySubtitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
        textAlign: 'center',
        marginTop: ui_tokens_1.spacing.sm,
    },
    emptyAction: {
        marginTop: ui_tokens_1.spacing.xl,
        width: '100%',
        alignItems: 'center',
    },
});
