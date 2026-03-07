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
exports.default = PayrollScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8';
function PayrollScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [employees, setEmployees] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/payroll/${BUSINESS_ID}/employees`);
            if (!res.ok)
                throw new Error('Failed to fetch employees');
            const data = await res.json();
            setEmployees(data);
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
        fetchEmployees();
    }, []));
    const onRefresh = () => {
        setRefreshing(true);
        fetchEmployees();
    };
    const renderItem = ({ item }) => (<react_native_1.View style={styles.employeeCard}>
      <react_native_1.View style={styles.employeeInfo}>
        <react_native_1.Text style={styles.employeeName}>{item.fullName}</react_native_1.Text>
        <react_native_1.Text style={styles.employeePhone}>{item.phone}</react_native_1.Text>
        <react_native_1.Text style={styles.employeeRate}>KES {item.dailyRateKes} / day</react_native_1.Text>
      </react_native_1.View>
      <react_native_1.TouchableOpacity style={styles.payButton} onPress={() => router.push({
            pathname: '/payroll/run',
            params: { selectedEmployeeId: item.id }
        })}>
        <react_native_1.Text style={styles.payButtonText}>Pay Today</react_native_1.Text>
      </react_native_1.TouchableOpacity>
    </react_native_1.View>);
    const renderEmpty = () => {
        if (loading)
            return null;
        return (<react_native_1.View style={styles.emptyContainer}>
        <vector_icons_1.Ionicons name="people-outline" size={64} color={ui_tokens_1.colors.greyMid}/>
        <react_native_1.Text style={styles.emptyTitle}>No employees yet</react_native_1.Text>
        <react_native_1.Text style={styles.emptySubtitle}>Add your first employee to start managing payroll</react_native_1.Text>
        <react_native_1.TouchableOpacity style={styles.emptyActionButton} onPress={() => router.push('/payroll/add-employee')}>
          <react_native_1.Text style={styles.emptyActionText}>Add Employee</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>);
    };
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <vector_icons_1.Ionicons name="arrow-back" size={24} color={ui_tokens_1.colors.white}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.Text style={styles.title}>Payroll</react_native_1.Text>
        <react_native_1.View style={{ width: 24 }}/>
      </react_native_1.View>

      {loading && !refreshing ? (<react_native_1.View style={styles.loadingContainer}>
          <react_native_1.ActivityIndicator size="large" color={ui_tokens_1.colors.mint}/>
        </react_native_1.View>) : (<react_native_1.FlatList data={employees} renderItem={renderItem} keyExtractor={(item) => item.id} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui_tokens_1.colors.mint} colors={[ui_tokens_1.colors.mint]}/>} ListEmptyComponent={renderEmpty} contentContainerStyle={styles.listContent}/>)}

      {employees.length > 0 && (<react_native_1.View style={styles.footer}>
          <react_native_1.TouchableOpacity style={styles.runPayrollButton} onPress={() => router.push('/payroll/run')}>
            <react_native_1.Text style={styles.runPayrollButtonText}>Run Payroll</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>)}

      <react_native_1.TouchableOpacity style={styles.fab} onPress={() => router.push('/payroll/add-employee')}>
        <vector_icons_1.Ionicons name="add" size={32} color={ui_tokens_1.colors.white}/>
      </react_native_1.TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingBottom: 120,
        flexGrow: 1,
    },
    employeeCard: {
        flexDirection: 'row',
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        padding: ui_tokens_1.spacing.md,
        marginBottom: ui_tokens_1.spacing.md,
        alignItems: 'center',
    },
    employeeInfo: {
        flex: 1,
    },
    employeeName: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    employeePhone: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
        marginTop: 2,
    },
    employeeRate: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.medium,
        color: ui_tokens_1.colors.mint,
        marginTop: 4,
    },
    payButton: {
        backgroundColor: ui_tokens_1.colors.cobalt,
        paddingHorizontal: ui_tokens_1.spacing.md,
        paddingVertical: ui_tokens_1.spacing.sm,
        borderRadius: ui_tokens_1.spacing.radius.sm,
    },
    payButtonText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
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
        paddingHorizontal: ui_tokens_1.spacing.xl,
    },
    emptyActionButton: {
        marginTop: ui_tokens_1.spacing.xl,
        backgroundColor: ui_tokens_1.colors.cobalt,
        paddingHorizontal: ui_tokens_1.spacing.xl,
        paddingVertical: ui_tokens_1.spacing.md,
        borderRadius: ui_tokens_1.spacing.radius.md,
    },
    emptyActionText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    fab: {
        position: 'absolute',
        right: ui_tokens_1.spacing.screenPadding,
        bottom: 100,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: ui_tokens_1.colors.mint,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: ui_tokens_1.spacing.screenPadding,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    runPayrollButton: {
        backgroundColor: ui_tokens_1.colors.mint,
        paddingVertical: ui_tokens_1.spacing.md,
        borderRadius: ui_tokens_1.spacing.radius.md,
        alignItems: 'center',
    },
    runPayrollButtonText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.ink,
    },
});
