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
exports.default = PlReportScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const Print = __importStar(require("expo-print"));
const Sharing = __importStar(require("expo-sharing"));
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
function PlReportScreen() {
    const { businessId, month, year } = (0, expo_router_1.useLocalSearchParams)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [report, setReport] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        fetchReport();
    }, [businessId, month, year]);
    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/reports/${businessId}/pl?month=${month}&year=${year}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
            else {
                react_native_1.Alert.alert('Error', 'Failed to fetch P&L report');
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #2D3436; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .brand { color: #00D2FF; font-size: 24px; font-weight: bold; }
            .title { font-size: 28px; font-weight: bold; text-transform: uppercase; margin: 0; }
            .period { color: #636E72; font-size: 16px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; color: #2D3436; border-bottom: 1px solid #DFE6E9; padding-bottom: 10px; margin-bottom: 15px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F1F2F6; }
            .label { color: #636E72; }
            .value { font-weight: bold; }
            .total-row { display: flex; justify-content: space-between; padding: 20px 0; margin-top: 10px; border-top: 2px solid #2D3436; font-size: 20px; font-weight: bold; }
            .footer { margin-top: 50px; font-size: 12px; color: #B2BEC3; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">BiasharaSmart</div>
              <h1 class="title">Profit & Loss Statement</h1>
            </div>
            <div class="period">${new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
          </div>

          <div class="section">
            <div class="section-title">Revenue & Taxes</div>
            <div class="row">
              <div class="label">Gross Revenue (Confirmed Payments)</div>
              <div class="value">KES ${report.revenue.toLocaleString()}</div>
            </div>
            <div class="row">
              <div class="label">VAT Collected (Paid Invoices)</div>
              <div class="value">KES ${report.vatCollected.toLocaleString()}</div>
            </div>
            <div class="row">
              <div class="label">Withholding Tax (WHT) Deducted</div>
              <div class="value">- KES ${report.whtDeducted.toLocaleString()}</div>
            </div>
            <div class="total-row">
              <div>Net Revenue</div>
              <div>KES ${report.netRevenue.toLocaleString()}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Activity Summary</div>
            <div class="row">
              <div class="label">Invoices Issued</div>
              <div class="value">${report.invoiceCount}</div>
            </div>
            <div class="row">
              <div class="label">Payments Received</div>
              <div class="value">${report.paymentCount}</div>
            </div>
          </div>

          <div class="footer">
            Generated on ${new Date(report.generatedAt).toLocaleString()} • BiasharaSmart Reports
          </div>
        </body>
      </html>
    `;
        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
        catch (error) {
            console.error('PDF generation error:', error);
            react_native_1.Alert.alert('Error', 'Failed to generate or share PDF');
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
        <components_1.SectionCard title="Revenue Breakdown" accentColor={ui_tokens_1.colors.mint}>
          <react_native_1.View style={styles.row}>
            <react_native_1.Text style={styles.label}>Gross Revenue</react_native_1.Text>
            <react_native_1.Text style={styles.value}>KES {report.revenue.toLocaleString()}</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.row}>
            <react_native_1.Text style={styles.label}>VAT Collected</react_native_1.Text>
            <react_native_1.Text style={styles.value}>KES {report.vatCollected.toLocaleString()}</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.row}>
            <react_native_1.Text style={styles.label}>WHT Deducted</react_native_1.Text>
            <react_native_1.Text style={styles.value}>- KES {report.whtDeducted.toLocaleString()}</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={[styles.row, styles.totalRow]}>
            <react_native_1.Text style={styles.totalLabel}>Net Revenue</react_native_1.Text>
            <react_native_1.Text style={styles.totalValue}>KES {report.netRevenue.toLocaleString()}</react_native_1.Text>
          </react_native_1.View>
        </components_1.SectionCard>

        <components_1.SectionCard title="Transaction Volume" accentColor={ui_tokens_1.colors.cobalt}>
          <react_native_1.View style={styles.row}>
            <react_native_1.Text style={styles.label}>Invoices Processed</react_native_1.Text>
            <react_native_1.Text style={styles.value}>{report.invoiceCount}</react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.row}>
            <react_native_1.Text style={styles.label}>Confirmed Payments</react_native_1.Text>
            <react_native_1.Text style={styles.value}>{report.paymentCount}</react_native_1.Text>
          </react_native_1.View>
        </components_1.SectionCard>

        <react_native_1.View style={styles.actionContainer}>
          <components_1.ActionButton label="Export PDF Statement" onPress={exportPdf} variant="primary"/>
        </react_native_1.View>

        <react_native_1.Text style={styles.footerText}>
          Generated at: {new Date(report.generatedAt).toLocaleString()}
        </react_native_1.Text>
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: ui_tokens_1.spacing.sm,
    },
    label: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
    },
    value: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
        color: ui_tokens_1.colors.white,
    },
    totalRow: {
        marginTop: ui_tokens_1.spacing.md,
        borderTopWidth: 1,
        borderTopColor: ui_tokens_1.colors.greyDark,
        paddingTop: ui_tokens_1.spacing.md,
    },
    totalLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.mint,
    },
    totalValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.mint,
    },
    actionContainer: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        marginTop: ui_tokens_1.spacing.lg,
    },
    footerText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: 10,
        color: ui_tokens_1.colors.greyMid,
        textAlign: 'center',
        marginTop: ui_tokens_1.spacing.xl,
        paddingBottom: ui_tokens_1.spacing.lg,
    },
});
