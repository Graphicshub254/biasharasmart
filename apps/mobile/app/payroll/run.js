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
exports.default = RunPayrollScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const shared_types_1 = require("@biasharasmart/shared-types");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8';
function RunPayrollScreen() {
    const router = (0, expo_router_1.useRouter)();
    const { selectedEmployeeId } = (0, expo_router_1.useLocalSearchParams)();
    const [entries, setEntries] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [date, setDate] = (0, react_1.useState)(new Date().toISOString().split('T')[0]);
    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/payroll/${BUSINESS_ID}/employees`);
            if (!res.ok)
                throw new Error('Failed to fetch employees');
            const data = await res.json();
            const initialEntries = data.map(emp => ({
                employeeId: emp.id,
                fullName: emp.fullName,
                dailyRateKes: emp.dailyRateKes,
                daysWorked: '1',
                selected: emp.id === selectedEmployeeId,
            }));
            setEntries(initialEntries);
        }
        catch (error) {
            console.error('Fetch error:', error);
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchEmployees();
    }, []);
    const toggleSelect = (id) => {
        setEntries(prev => prev.map(e => e.employeeId === id ? { ...e, selected: !e.selected } : e));
    };
    const updateDays = (id, days) => {
        setEntries(prev => prev.map(e => e.employeeId === id ? { ...e, daysWorked: days } : e));
    };
    const calculateDeductions = (grossKes) => {
        const shif = +(grossKes * shared_types_1.SHIF_RATE).toFixed(2);
        let nssf = 0;
        if (grossKes <= shared_types_1.NSSF_TIER_1_MAX) {
            nssf = +(grossKes * shared_types_1.NSSF_TIER_1_RATE).toFixed(2);
        }
        else if (grossKes <= shared_types_1.NSSF_TIER_2_MAX) {
            nssf = +(shared_types_1.NSSF_TIER_1_MAX * shared_types_1.NSSF_TIER_1_RATE + (grossKes - shared_types_1.NSSF_TIER_1_MAX) * shared_types_1.NSSF_TIER_2_RATE).toFixed(2);
        }
        else {
            nssf = +(shared_types_1.NSSF_TIER_1_MAX * shared_types_1.NSSF_TIER_1_RATE + (shared_types_1.NSSF_TIER_2_MAX - shared_types_1.NSSF_TIER_1_MAX) * shared_types_1.NSSF_TIER_2_RATE).toFixed(2);
        }
        return { shif, nssf, net: +(grossKes - shif - nssf).toFixed(2) };
    };
    const selectedEntries = entries.filter(e => e.selected);
    const totals = selectedEntries.reduce((acc, e) => {
        const gross = e.dailyRateKes * parseFloat(e.daysWorked || '0');
        const { shif, nssf, net } = calculateDeductions(gross);
        return {
            gross: acc.gross + gross,
            shif: acc.shif + shif,
            nssf: acc.nssf + nssf,
            net: acc.net + net,
        };
    }, { gross: 0, shif: 0, nssf: 0, net: 0 });
    const handlePayAll = async () => {
        if (selectedEntries.length === 0) {
            react_native_1.Alert.alert('No Selection', 'Please select at least one employee to pay.');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                date,
                entries: selectedEntries.map(e => ({
                    employeeId: e.employeeId,
                    daysWorked: parseFloat(e.daysWorked),
                })),
            };
            const res = await fetch(`${API_BASE}/api/payroll/${BUSINESS_ID}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok)
                throw new Error('Failed to run payroll');
            const data = await res.json();
            react_native_1.Alert.alert('Success', `Paid ${data.results.length} employees. Total Net: KES ${data.totalNet.toLocaleString()}`, [
                { text: 'View Receipt', onPress: () => router.replace('/payroll') }
            ]);
        }
        catch (error) {
            react_native_1.Alert.alert('Error', error.message);
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <vector_icons_1.Ionicons name="arrow-back" size={24} color={ui_tokens_1.colors.white}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.Text style={styles.title}>Run Payroll</react_native_1.Text>
        <react_native_1.View style={{ width: 24 }}/>
      </react_native_1.View>

      <react_native_1.View style={styles.dateRow}>
        <react_native_1.Text style={styles.dateLabel}>Payment Date:</react_native_1.Text>
        <react_native_1.Text style={styles.dateValue}>{date}</react_native_1.Text>
      </react_native_1.View>

      {loading ? (<react_native_1.View style={styles.loadingContainer}>
          <react_native_1.ActivityIndicator size="large" color={ui_tokens_1.colors.mint}/>
        </react_native_1.View>) : (<react_native_1.ScrollView style={styles.list}>
          {entries.map(item => {
                const gross = item.dailyRateKes * parseFloat(item.daysWorked || '0');
                const { shif, nssf, net } = calculateDeductions(gross);
                return (<react_native_1.View key={item.employeeId} style={[styles.entryCard, item.selected && styles.entryCardSelected]}>
                <react_native_1.TouchableOpacity style={styles.entryHeader} onPress={() => toggleSelect(item.employeeId)}>
                  <vector_icons_1.Ionicons name={item.selected ? "checkbox" : "square-outline"} size={24} color={item.selected ? ui_tokens_1.colors.mint : ui_tokens_1.colors.greyMid}/>
                  <react_native_1.Text style={styles.employeeName}>{item.fullName}</react_native_1.Text>
                  <react_native_1.Text style={styles.dailyRate}>@{item.dailyRateKes}/day</react_native_1.Text>
                </react_native_1.TouchableOpacity>

                {item.selected && (<react_native_1.View style={styles.entryDetails}>
                    <react_native_1.View style={styles.daysInputRow}>
                      <react_native_1.Text style={styles.detailLabel}>Days worked:</react_native_1.Text>
                      <react_native_1.TextInput style={styles.daysInput} value={item.daysWorked} onChangeText={(v) => updateDays(item.employeeId, v)} keyboardType="numeric" selectTextOnFocus/>
                    </react_native_1.View>
                    
                    <react_native_1.View style={styles.deductionsTable}>
                      <react_native_1.View style={styles.deductionRow}>
                        <react_native_1.Text style={styles.deductionLabel}>Gross</react_native_1.Text>
                        <react_native_1.Text style={styles.deductionValue}>KES {gross.toFixed(2)}</react_native_1.Text>
                      </react_native_1.View>
                      <react_native_1.View style={styles.deductionRow}>
                        <react_native_1.Text style={styles.deductionLabel}>SHIF (2.75%)</react_native_1.Text>
                        <react_native_1.Text style={styles.deductionValue}>- KES {shif.toFixed(2)}</react_native_1.Text>
                      </react_native_1.View>
                      <react_native_1.View style={styles.deductionRow}>
                        <react_native_1.Text style={styles.deductionLabel}>NSSF (Tier 1+2)</react_native_1.Text>
                        <react_native_1.Text style={styles.deductionValue}>- KES {nssf.toFixed(2)}</react_native_1.Text>
                      </react_native_1.View>
                      <react_native_1.View style={[styles.deductionRow, styles.netRow]}>
                        <react_native_1.Text style={styles.netLabel}>Net Pay</react_native_1.Text>
                        <react_native_1.Text style={styles.netValue}>KES {net.toFixed(2)}</react_native_1.Text>
                      </react_native_1.View>
                    </react_native_1.View>
                  </react_native_1.View>)}
              </react_native_1.View>);
            })}
        </react_native_1.ScrollView>)}

      <react_native_1.View style={styles.summary}>
        <react_native_1.View style={styles.summaryRow}>
          <react_native_1.Text style={styles.summaryLabel}>Total Net Disbursement</react_native_1.Text>
          <react_native_1.Text style={styles.summaryValue}>KES {totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</react_native_1.Text>
        </react_native_1.View>
        <react_native_1.TouchableOpacity style={styles.payAllButton} onPress={handlePayAll} disabled={submitting || selectedEntries.length === 0}>
          {submitting ? (<react_native_1.ActivityIndicator color={ui_tokens_1.colors.ink}/>) : (<react_native_1.Text style={styles.payAllButtonText}>Pay {selectedEntries.length} Employees</react_native_1.Text>)}
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
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
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.title,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    dateRow: {
        flexDirection: 'row',
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingBottom: ui_tokens_1.spacing.md,
        alignItems: 'center',
    },
    dateLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
    },
    dateValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginLeft: ui_tokens_1.spacing.xs,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        flex: 1,
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
    },
    entryCard: {
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        padding: ui_tokens_1.spacing.md,
        marginBottom: ui_tokens_1.spacing.md,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    entryCardSelected: {
        borderColor: ui_tokens_1.colors.mint,
    },
    entryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    employeeName: {
        flex: 1,
        marginLeft: ui_tokens_1.spacing.sm,
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    dailyRate: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
    },
    entryDetails: {
        marginTop: ui_tokens_1.spacing.md,
        paddingTop: ui_tokens_1.spacing.md,
        borderTopWidth: 1,
        borderTopColor: ui_tokens_1.colors.greyMid + '33',
    },
    daysInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: ui_tokens_1.spacing.md,
    },
    detailLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.white,
    },
    daysInput: {
        backgroundColor: ui_tokens_1.colors.ink,
        borderRadius: ui_tokens_1.spacing.radius.sm,
        paddingHorizontal: ui_tokens_1.spacing.md,
        paddingVertical: ui_tokens_1.spacing.xs,
        color: ui_tokens_1.colors.white,
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        width: 60,
        textAlign: 'center',
    },
    deductionsTable: {
        backgroundColor: ui_tokens_1.colors.ink,
        padding: ui_tokens_1.spacing.md,
        borderRadius: ui_tokens_1.spacing.radius.sm,
    },
    deductionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: ui_tokens_1.spacing.xs,
    },
    deductionLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
    },
    deductionValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.white,
    },
    netRow: {
        marginTop: ui_tokens_1.spacing.xs,
        paddingTop: ui_tokens_1.spacing.xs,
        borderTopWidth: 1,
        borderTopColor: ui_tokens_1.colors.greyMid + '33',
    },
    netLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.mint,
    },
    netValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.mint,
    },
    summary: {
        padding: ui_tokens_1.spacing.screenPadding,
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderTopLeftRadius: ui_tokens_1.spacing.radius.xl,
        borderTopRightRadius: ui_tokens_1.spacing.radius.xl,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ui_tokens_1.spacing.md,
    },
    summaryLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
    },
    summaryValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    payAllButton: {
        backgroundColor: ui_tokens_1.colors.mint,
        paddingVertical: ui_tokens_1.spacing.md,
        borderRadius: ui_tokens_1.spacing.radius.md,
        alignItems: 'center',
    },
    payAllButtonText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.ink,
    },
});
