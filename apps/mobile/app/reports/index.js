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
exports.default = ReportsScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
function ReportsScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [businessId, setBusinessId] = (0, react_1.useState)(null);
    const [selectedMonth, setSelectedMonth] = (0, react_1.useState)(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = (0, react_1.useState)(new Date().getFullYear());
    (0, react_1.useEffect)(() => {
        async function fetchBusinessId() {
            try {
                const res = await fetch(`${API_BASE}/api/dashboard/summary`);
                if (res.ok) {
                    const data = await res.json();
                    setBusinessId(data.business.id);
                }
            }
            catch (error) {
                console.error('Failed to fetch business ID:', error);
            }
            finally {
                setLoading(false);
            }
        }
        fetchBusinessId();
    }, []);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const years = [2024, 2025, 2026];
    const navigateToReport = (type) => {
        if (!businessId)
            return;
        router.push({
            pathname: `/reports/${type}`,
            params: { businessId, month: selectedMonth, year: selectedYear }
        });
    };
    if (loading) {
        return (<react_native_1.View style={styles.loadingContainer}>
        <react_native_1.ActivityIndicator size="large" color={ui_tokens_1.colors.mint}/>
      </react_native_1.View>);
    }
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent}>
        <components_1.SectionCard title="Select Period" accentColor={ui_tokens_1.colors.cobalt}>
          <react_native_1.View style={styles.pickerRow}>
            <react_native_1.View style={styles.pickerContainer}>
              <react_native_1.Text style={styles.pickerLabel}>Month</react_native_1.Text>
              <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {months.map((month, index) => (<react_native_1.TouchableOpacity key={month} style={[
                styles.monthButton,
                selectedMonth === index + 1 && styles.selectedMonthButton
            ]} onPress={() => setSelectedMonth(index + 1)}>
                    <react_native_1.Text style={[
                styles.monthButtonText,
                selectedMonth === index + 1 && styles.selectedMonthButtonText
            ]}>
                      {month.slice(0, 3)}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>))}
              </react_native_1.ScrollView>
            </react_native_1.View>
          </react_native_1.View>

          <react_native_1.View style={styles.pickerRow}>
            <react_native_1.View style={styles.pickerContainer}>
              <react_native_1.Text style={styles.pickerLabel}>Year</react_native_1.Text>
              <react_native_1.View style={styles.yearRow}>
                {years.map((year) => (<react_native_1.TouchableOpacity key={year} style={[
                styles.yearButton,
                selectedYear === year && styles.selectedYearButton
            ]} onPress={() => setSelectedYear(year)}>
                    <react_native_1.Text style={[
                styles.yearButtonText,
                selectedYear === year && styles.selectedYearButtonText
            ]}>
                      {year}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>))}
              </react_native_1.View>
            </react_native_1.View>
          </react_native_1.View>
        </components_1.SectionCard>

        <react_native_1.View style={styles.reportsGrid}>
          <react_native_1.TouchableOpacity style={styles.reportCard} onPress={() => navigateToReport('pl')}>
            <react_native_1.View style={[styles.iconContainer, { backgroundColor: ui_tokens_1.colors.mint + '20' }]}>
              <vector_icons_1.MaterialIcons name="account-balance" size={32} color={ui_tokens_1.colors.mint}/>
            </react_native_1.View>
            <react_native_1.Text style={styles.reportTitle}>Profit & Loss</react_native_1.Text>
            <react_native_1.Text style={styles.reportDesc}>Revenue vs Expenses</react_native_1.Text>
          </react_native_1.TouchableOpacity>

          <react_native_1.TouchableOpacity style={styles.reportCard} onPress={() => navigateToReport('kra')}>
            <react_native_1.View style={[styles.iconContainer, { backgroundColor: ui_tokens_1.colors.gold + '20' }]}>
              <vector_icons_1.MaterialIcons name="reorder" size={32} color={ui_tokens_1.colors.gold}/>
            </react_native_1.View>
            <react_native_1.Text style={styles.reportTitle}>KRA Reconciliation</react_native_1.Text>
            <react_native_1.Text style={styles.reportDesc}>Invoices vs Payments</react_native_1.Text>
          </react_native_1.TouchableOpacity>

          <react_native_1.TouchableOpacity style={styles.reportCard} onPress={() => navigateToReport('wht')}>
            <react_native_1.View style={[styles.iconContainer, { backgroundColor: ui_tokens_1.colors.red + '20' }]}>
              <vector_icons_1.MaterialIcons name="assignment" size={32} color={ui_tokens_1.colors.red}/>
            </react_native_1.View>
            <react_native_1.Text style={styles.reportTitle}>WHT Statement</react_native_1.Text>
            <react_native_1.Text style={styles.reportDesc}>Tax Liability History</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.ScrollView>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingVertical: ui_tokens_1.spacing.md,
    },
    pickerRow: {
        marginBottom: ui_tokens_1.spacing.md,
    },
    pickerContainer: {
        flex: 1,
    },
    pickerLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
        marginBottom: ui_tokens_1.spacing.xs,
    },
    horizontalScroll: {
        flexDirection: 'row',
    },
    monthButton: {
        paddingHorizontal: ui_tokens_1.spacing.md,
        paddingVertical: ui_tokens_1.spacing.sm,
        borderRadius: ui_tokens_1.spacing.radius.full,
        backgroundColor: ui_tokens_1.colors.greyDark,
        marginRight: ui_tokens_1.spacing.xs,
    },
    selectedMonthButton: {
        backgroundColor: ui_tokens_1.colors.cobalt,
    },
    monthButtonText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
    },
    selectedMonthButtonText: {
        color: ui_tokens_1.colors.white,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
    },
    yearRow: {
        flexDirection: 'row',
    },
    yearButton: {
        paddingHorizontal: ui_tokens_1.spacing.lg,
        paddingVertical: ui_tokens_1.spacing.sm,
        borderRadius: ui_tokens_1.spacing.radius.full,
        backgroundColor: ui_tokens_1.colors.greyDark,
        marginRight: ui_tokens_1.spacing.sm,
    },
    selectedYearButton: {
        backgroundColor: ui_tokens_1.colors.cobalt,
    },
    yearButtonText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
    },
    selectedYearButtonText: {
        color: ui_tokens_1.colors.white,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
    },
    reportsGrid: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        flexDirection: 'column',
    },
    reportCard: {
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        padding: ui_tokens_1.spacing.lg,
        marginBottom: ui_tokens_1.spacing.md,
        flexDirection: 'column',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: ui_tokens_1.colors.ink,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: ui_tokens_1.spacing.md,
    },
    reportTitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginBottom: 4,
    },
    reportDesc: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
    },
});
