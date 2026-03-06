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
exports.default = KraReportScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const Print = __importStar(require("expo-print"));
const Sharing = __importStar(require("expo-sharing"));
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
function KraReportScreen() {
    const { businessId, month, year } = (0, expo_router_1.useLocalSearchParams)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [report, setReport] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        fetchReport();
    }, [businessId, month, year]);
    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/reports/${businessId}/kra?month=${month}&year=${year}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
            else {
                react_native_1.Alert.alert('Error', 'Failed to fetch KRA reconciliation report');
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
            .total { margin-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KRA Reconciliation Report</h1>
            <p>Period: ${new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Inv Ref</th>
                <th>CU Number</th>
                <th>Status</th>
                <th>Total KES</th>
                <th>VAT KES</th>
                <th>M-Pesa</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${report.rows.map(row => `
                <tr>
                  <td>${row.invoiceRef}</td>
                  <td>${row.cuNumber}</td>
                  <td>${row.status}</td>
                  <td>${row.totalKes.toLocaleString()}</td>
                  <td>${row.vatKes.toLocaleString()}</td>
                  <td>${row.mpesaCode}</td>
                  <td>${row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Total VAT Due: KES ${report.totalVatDue.toLocaleString()}</p>
            <p>Unregistered Invoices: ${report.unregistered}</p>
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
        <components_1.SectionCard title="Summary" accentColor={ui_tokens_1.colors.gold}>
          <react_native_1.View style={styles.summaryRow}>
            <react_native_1.Text style={styles.label}>Total VAT Due</react_native_1.Text>
            <react_native_1.Text style={styles.value}>KES {report.totalVatDue.toLocaleString()}</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.summaryRow}>
            <react_native_1.Text style={styles.label}>Unregistered</react_native_1.Text>
            <react_native_1.Text style={[styles.value, report.unregistered > 0 && { color: ui_tokens_1.colors.red }]}>
              {report.unregistered}
            </react_native_1.Text>
          </react_native_1.View>
        </components_1.SectionCard>

        <components_1.SectionCard title="Invoices" accentColor={ui_tokens_1.colors.cobalt}>
          {report.rows.map((row, idx) => (<react_native_1.View key={idx} style={styles.row}>
              <react_native_1.View style={styles.rowHeader}>
                <react_native_1.Text style={styles.invRef}>#{row.invoiceRef}</react_native_1.Text>
                <react_native_1.Text style={styles.amount}>KES {row.totalKes.toLocaleString()}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={styles.rowDetails}>
                <react_native_1.Text style={styles.detailText}>CU: {row.cuNumber}</react_native_1.Text>
                <react_native_1.Text style={styles.detailText}>M-Pesa: {row.mpesaCode}</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={styles.rowFooter}>
                <react_native_1.Text style={styles.vatText}>VAT: KES {row.vatKes.toLocaleString()}</react_native_1.Text>
                <react_native_1.Text style={styles.dateText}>
                  {row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : row.status}
                </react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>))}
          {report.rows.length === 0 && (<react_native_1.Text style={styles.emptyText}>No invoices in this period</react_native_1.Text>)}
        </components_1.SectionCard>

        <react_native_1.View style={styles.actionContainer}>
          <components_1.ActionButton label="Export PDF Report" onPress={exportPdf} variant="primary"/>
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
    invRef: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.body, fontWeight: ui_tokens_1.typography.fontWeight.bold, color: ui_tokens_1.colors.white },
    amount: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.body, fontWeight: ui_tokens_1.typography.fontWeight.bold, color: ui_tokens_1.colors.mint },
    rowDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    detailText: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption, color: ui_tokens_1.colors.greyMid },
    rowFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    vatText: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption, color: ui_tokens_1.colors.gold },
    dateText: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption, color: ui_tokens_1.colors.greyMid },
    emptyText: { textAlign: 'center', color: ui_tokens_1.colors.greyMid, paddingVertical: ui_tokens_1.spacing.lg },
    actionContainer: { paddingHorizontal: ui_tokens_1.spacing.screenPadding, marginTop: ui_tokens_1.spacing.lg, paddingBottom: ui_tokens_1.spacing.xl },
});
