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
exports.default = VatReturnsScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const shared_types_1 = require("@biasharasmart/shared-types");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8';
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
function VatReturnsScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [currentDraft, setCurrentDraft] = (0, react_1.useState)(null);
    const [previousReturns, setPreviousReturns] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [calculating, setCalculating] = (0, react_1.useState)(false);
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const fetchData = async () => {
        if (!refreshing)
            setLoading(true);
        try {
            // 1. Fetch current draft
            const currentRes = await fetch(`${API_BASE}/api/vat/${BUSINESS_ID}/current`);
            if (currentRes.ok) {
                const currentData = await currentRes.json();
                setCurrentDraft(currentData);
            }
            // 2. Fetch history
            const historyRes = await fetch(`${API_BASE}/api/vat/${BUSINESS_ID}?limit=20`);
            if (historyRes.ok) {
                const historyData = await historyRes.json();
                // Filter out current draft from history if it exists there
                const history = historyData.data.filter(r => r.id !== currentDraft?.id);
                setPreviousReturns(history);
            }
        }
        catch (error) {
            console.error('Fetch error:', error);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    (0, expo_router_1.useFocusEffect)((0, react_1.useCallback)(() => {
        fetchData();
    }, []));
    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };
    const handleCalculate = async () => {
        setCalculating(true);
        try {
            const res = await fetch(`${API_BASE}/api/vat/${BUSINESS_ID}/calculate`, {
                method: 'POST',
            });
            if (!res.ok)
                throw new Error('Calculation failed');
            const data = await res.json();
            react_native_1.Alert.alert('Success', `VAT calculated from ${data.invoiceCount} invoices.`);
            fetchData();
        }
        catch (error) {
            react_native_1.Alert.alert('Error', 'Failed to calculate VAT. Please try again.');
        }
        finally {
            setCalculating(false);
        }
    };
    const handleSubmit = async () => {
        if (!currentDraft)
            return;
        react_native_1.Alert.alert('File VAT Return', `Are you sure you want to file the return for ${MONTHS[currentDraft.periodMonth - 1]} ${currentDraft.periodYear}? This action cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'File Now',
                onPress: async () => {
                    setSubmitting(true);
                    try {
                        const res = await fetch(`${API_BASE}/api/vat/${currentDraft.id}/submit`, {
                            method: 'POST',
                        });
                        if (!res.ok)
                            throw new Error('Submission failed');
                        react_native_1.Alert.alert('Success', 'VAT return filed successfully.');
                        fetchData();
                    }
                    catch (error) {
                        react_native_1.Alert.alert('Error', 'Failed to file VAT return. Please try again.');
                    }
                    finally {
                        setSubmitting(false);
                    }
                },
            },
        ]);
    };
    const renderCurrentDraft = () => {
        if (!currentDraft)
            return null;
        const isDraft = currentDraft.status === shared_types_1.VatReturnStatus.DRAFT;
        const canFile = isDraft && Number(currentDraft.netVatKes) > 0;
        return (<components_1.SectionCard title={`Current Period: ${MONTHS[currentDraft.periodMonth - 1]} ${currentDraft.periodYear}`} accentColor={ui_tokens_1.colors.mint}>
        <react_native_1.View style={styles.statusRow}>
          <react_native_1.Text style={styles.label}>Status</react_native_1.Text>
          <components_1.StatusBadge status={currentDraft.status}/>
        </react_native_1.View>

        <react_native_1.View style={styles.metricsGrid}>
          <components_1.MetricTile label="Output VAT" value={Number(currentDraft.outputVatKes)} unit="KES" accentColor={ui_tokens_1.colors.white}/>
          <components_1.MetricTile label="Input VAT" value={Number(currentDraft.inputVatKes)} unit="KES" accentColor={ui_tokens_1.colors.white}/>
        </react_native_1.View>

        <react_native_1.View style={styles.netVatRow}>
          <react_native_1.Text style={styles.netVatLabel}>Net VAT Payable</react_native_1.Text>
          <react_native_1.Text style={styles.netVatValue}>
            KES {Number(currentDraft.netVatKes).toLocaleString('en-KE')}
          </react_native_1.Text>
        </react_native_1.View>

        {isDraft && (<react_native_1.View style={styles.actionRow}>
            <react_native_1.View style={{ flex: 1, marginRight: ui_tokens_1.spacing.sm }}>
              <components_1.ActionButton label="Calculate" onPress={handleCalculate} isLoading={calculating} variant="secondary"/>
            </react_native_1.View>
            <react_native_1.View style={{ flex: 1 }}>
              <components_1.ActionButton label="File Return" onPress={handleSubmit} isLoading={submitting} isDisabled={!canFile}/>
            </react_native_1.View>
          </react_native_1.View>)}
      </components_1.SectionCard>);
    };
    const VatReturnRow = ({ item }) => (<react_native_1.TouchableOpacity style={styles.historyRow} onPress={() => router.push(`/vat/${item.id}`)}>
      <react_native_1.View>
        <react_native_1.Text style={styles.periodText}>
          {MONTHS[item.periodMonth - 1]} {item.periodYear}
        </react_native_1.Text>
        <react_native_1.Text style={styles.amountText}>
          KES {Number(item.netVatKes).toLocaleString('en-KE')}
        </react_native_1.Text>
      </react_native_1.View>
      <components_1.StatusBadge status={item.status} size="small"/>
    </react_native_1.TouchableOpacity>);
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui_tokens_1.colors.mint}/>}>
        {loading && !refreshing ? (<react_native_1.ActivityIndicator size="large" color={ui_tokens_1.colors.mint} style={{ marginTop: 40 }}/>) : (<>
            {renderCurrentDraft()}

            <react_native_1.View style={styles.historyHeader}>
              <react_native_1.Text style={styles.historyTitle}>History</react_native_1.Text>
            </react_native_1.View>

            {previousReturns.length > 0 ? (<react_native_1.View style={styles.historyContainer}>
                {previousReturns.map(item => (<VatReturnRow key={item.id} item={item}/>))}
              </react_native_1.View>) : (<react_native_1.View style={styles.emptyContainer}>
                <react_native_1.Text style={styles.emptyText}>No previous returns found</react_native_1.Text>
              </react_native_1.View>)}
          </>)}
      </react_native_1.ScrollView>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    scrollContent: {
        paddingVertical: ui_tokens_1.spacing.md,
        paddingBottom: 40,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ui_tokens_1.spacing.md,
    },
    label: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
    },
    metricsGrid: {
        flexDirection: 'row',
        marginHorizontal: -ui_tokens_1.spacing.xs,
        marginBottom: ui_tokens_1.spacing.md,
    },
    netVatRow: {
        backgroundColor: ui_tokens_1.colors.grey1,
        padding: ui_tokens_1.spacing.md,
        borderRadius: ui_tokens_1.spacing.radius.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ui_tokens_1.spacing.lg,
    },
    netVatLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
        color: ui_tokens_1.colors.white,
    },
    netVatValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.mint,
    },
    actionRow: {
        flexDirection: 'row',
    },
    historyHeader: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        marginTop: ui_tokens_1.spacing.lg,
        marginBottom: ui_tokens_1.spacing.sm,
    },
    historyTitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    historyContainer: {
        marginHorizontal: ui_tokens_1.spacing.screenPadding,
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        overflow: 'hidden',
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: ui_tokens_1.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: ui_tokens_1.colors.ink,
    },
    periodText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
        color: ui_tokens_1.colors.white,
    },
    amountText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
        marginTop: 2,
    },
    emptyContainer: {
        padding: ui_tokens_1.spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
    },
});
