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
exports.default = WhtReportScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const Print = __importStar(require("expo-print"));
const Sharing = __importStar(require("expo-sharing"));
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
function WhtReportScreen() {
    const { businessId, month, year } = (0, expo_router_1.useLocalSearchParams)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [report, setReport] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        fetchReport();
    }, [businessId, month, year]);
    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/reports/${businessId}/wht?month=${month}&year=${year}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
            else {
                react_native_1.Alert.alert('Error', 'Failed to fetch WHT statement');
            }
        }
        catch (error) {
            console.error('Fetch report error:', error);
            react_native_1.Alert.alert('Error', 'An unexpected error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    const exportPdf = async () => {
        if (!report)
            return;
        const html = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { backgroundColor: #f2f2f2; }
            .status-paid { color: green; }
            .status-pending { color: orange; }
            .status-overdue { color: red; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>WHT Liability Statement</h1>
            <p>Period: ${new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date Created</th>
                <th>Due Date</th>
                <th>M-Pesa</th>
                <th>Amount KES</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${report.rows.map(row => `
                <tr>
                  <td>${new Date(row.createdAt).toLocaleDateString()}</td>
                  <td>${new Date(row.dueDate).toLocaleDateString()}</td>
                  <td>${row.mpesaCode}</td>
                  <td>${row.amountKes.toLocaleString()}</td>
                  <td class="status-${row.status.toLowerCase()}">${row.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 20px;">
            <p><strong>Total Paid:</strong> KES ${report.totalPaid.toLocaleString()}</p>
            <p><strong>Total Outstanding:</strong> KES ${report.totalOwed.toLocaleString()}</p>
          </div>
          <p style="font-size: 10px; margin-top: 30px;">Generated at ${new Date(report.generatedAt).toLocaleString()}</p>
        </body>
      </html>
    `;
        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
        catch (error) {
            react_native_1.Alert.alert('Error', 'Failed to export PDF');
        }
    };
    if (loading) {
        return (<react_native_1.View style={styles.loadingContainer}>
        <react_native_1.ActivityIndicator size="large" color={ui_tokens_1.colors.mint}/>
      </react_native_1.View>);
    }
    if (!report)
        return null;
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent}>
        <components_1.SectionCard title="Statement Summary" accentColor={ui_tokens_1.colors.red}>
          <react_native_1.View style={styles.summaryRow}>
            <react_native_1.Text style={styles.label}>Outstanding Balance</react_native_1.Text>
            <react_native_1.Text style={[styles.value, { color: ui_tokens_1.colors.red }]}>KES {report.totalOwed.toLocaleString()}</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.summaryRow}>
            <react_native_1.Text style={styles.label}>Total Paid (This Month)</react_native_1.Text>
            <react_native_1.Text style={[styles.value, { color: ui_tokens_1.colors.mint }]}>KES {report.totalPaid.toLocaleString()}</react_native_1.Text>
          </react_native_1.View>
        </components_1.SectionCard>

        <components_1.SectionCard title="WHT Liabilities" accentColor={ui_tokens_1.colors.cobalt}>
          {report.rows.map((row, idx) => (<react_native_1.View key={idx} style={styles.row}>
              <react_native_1.View style={styles.rowHeader}>
                <react_native_1.Text style={styles.dateText}>{new Date(row.createdAt).toLocaleDateString()}</react_native_1.Text>
                <react_native_1.Text style={styles.amount}>KES {row.amountKes.toLocaleString()}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={styles.rowFooter}>
                <react_native_1.Text style={styles.detailText}>Due: {new Date(row.dueDate).toLocaleDateString()}</react_native_1.Text>
                <react_native_1.Text style={[
                styles.statusText,
                row.status === 'paid' ? { color: ui_tokens_1.colors.mint } :
                    row.status === 'overdue' ? { color: ui_tokens_1.colors.red } : { color: ui_tokens_1.colors.gold }
            ]}>
                  {row.status.toUpperCase()}
                </react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>))}
          {report.rows.length === 0 && (<react_native_1.Text style={styles.emptyText}>No WHT liabilities in this period</react_native_1.Text>)}
        </components_1.SectionCard>

        <react_native_1.View style={styles.actionContainer}>
          <components_1.ActionButton label="Export PDF Statement" onPress={exportPdf} variant="primary"/>
        </react_native_1.View>
      </react_native_1.ScrollView>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: ui_tokens_1.colors.ink },
    loadingContainer: { flex: 1, backgroundColor: ui_tokens_1.colors.ink, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingVertical: ui_tokens_1.spacing.md },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: ui_tokens_1.spacing.xs },
    label: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.body, color: ui_tokens_1.colors.greyMid },
    value: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.body, fontWeight: ui_tokens_1.typography.fontWeight.bold, color: ui_tokens_1.colors.white },
    row: { paddingVertical: ui_tokens_1.spacing.md, borderBottomWidth: 1, borderBottomColor: ui_tokens_1.colors.greyDark },
    rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    dateText: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption, color: ui_tokens_1.colors.greyMid },
    amount: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.body, fontWeight: ui_tokens_1.typography.fontWeight.bold, color: ui_tokens_1.colors.white },
    rowFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    detailText: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption, color: ui_tokens_1.colors.greyMid },
    statusText: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption, fontWeight: ui_tokens_1.typography.fontWeight.bold },
    emptyText: { textAlign: 'center', color: ui_tokens_1.colors.greyMid, paddingVertical: ui_tokens_1.spacing.lg },
    actionContainer: { paddingHorizontal: ui_tokens_1.spacing.screenPadding, marginTop: ui_tokens_1.spacing.lg, paddingBottom: ui_tokens_1.spacing.xl },
});
