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
exports.default = VatReturnDetailScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const Print = __importStar(require("expo-print"));
const Sharing = __importStar(require("expo-sharing"));
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
function VatReturnDetailScreen() {
    const { period: id } = (0, expo_router_1.useLocalSearchParams)();
    const router = (0, expo_router_1.useRouter)();
    const [vatReturn, setVatReturn] = (0, react_1.useState)(null);
    const [invoices, setInvoices] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const fetchVatReturn = async () => {
            setLoading(true);
            setError(false);
            try {
                const res = await fetch(`${API_BASE}/api/vat/detail/${id}`);
                if (!res.ok)
                    throw new Error('Not found');
                const data = await res.json();
                setVatReturn(data);
                const invRes = await fetch(`${API_BASE}/api/vat/detail/${id}/invoices`);
                if (invRes.ok) {
                    const invData = await invRes.json();
                    setInvoices(invData);
                }
            }
            catch (err) {
                console.error('Fetch error:', err);
                setError(true);
            }
            finally {
                setLoading(false);
            }
        };
        if (id)
            fetchVatReturn();
    }, [id]);
    const sharePdf = async () => {
        if (!vatReturn)
            return;
        const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #00BFA5; padding-bottom: 20px; }
            .title { color: #00BFA5; font-size: 24px; margin: 0; }
            .meta { margin-top: 30px; }
            .section { margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; border-bottom: 1px solid #ddd; padding: 10px; color: #777; font-size: 12px; }    
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .totals { margin-top: 40px; width: 50%; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { border-top: 2px solid #00BFA5; margin-top: 10px; padding-top: 10px; color: #00BFA5; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">VAT Return Statement</h1>
              <p>Period: ${MONTHS[vatReturn.periodMonth - 1]} ${vatReturn.periodYear}</p>
            </div>
            <div style="text-align: right">
              <p><strong>Status:</strong> ${vatReturn.status.toUpperCase()}</p>
              ${vatReturn.gavaconnectAcknowledgement ? `<p><strong>KRA Ack:</strong> ${vatReturn.gavaconnectAcknowledgement}</p>` : ''}
            </div>
          </div>
          <div class="section">
            <h3>Summary</h3>
            <div class="totals" style="margin-left: 0; width: 100%;">
              <div class="total-row"><span>Output VAT (Total Sales)</span><span>KES ${Number(vatReturn.outputVatKes).toLocaleString('en-KE')}</span></div>
              <div class="total-row"><span>Input VAT (Total Purchases)</span><span>KES ${Number(vatReturn.inputVatKes).toLocaleString('en-KE')}</span></div>
              <div class="total-row grand-total"><span>Net VAT Payable</span><span>KES ${Number(vatReturn.netVatKes).toLocaleString('en-KE')}</span></div>
            </div>
          </div>
          <div class="section">
            <h3>Contributing Invoices</h3>
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>INVOICE REF</th>
                  <th>CUSTOMER</th>
                  <th style="text-align:right">VAT AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.map((inv) => `
                  <tr>
                    <td>${new Date(inv.createdAt).toLocaleDateString('en-KE')}</td>
                    <td>${inv.id.slice(-8).toUpperCase()}</td>
                    <td>${inv.customerName || 'N/A'}</td>
                    <td style="text-align:right">KES ${Number(inv.vatAmountKes).toLocaleString('en-KE')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `VAT_Return_${MONTHS[vatReturn.periodMonth - 1]}_${vatReturn.periodYear}`,
            });
        }
        catch (err) {
            console.error('PDF Share error:', err);
        }
    };
    if (loading) {
        return (<react_native_1.SafeAreaView style={styles.container}>
        <expo_router_1.Stack.Screen options={{ headerShown: false }}/>
        <react_native_1.View style={styles.loadingContainer}>
          <react_native_1.ActivityIndicator size="large" color={ui_tokens_1.colors.mint}/>
        </react_native_1.View>
      </react_native_1.SafeAreaView>);
    }
    if (error || !vatReturn) {
        return (<react_native_1.SafeAreaView style={styles.container}>
        <expo_router_1.Stack.Screen options={{ headerShown: false }}/>
        <react_native_1.View style={styles.errorContainer}>
          <vector_icons_1.MaterialIcons name="error-outline" size={64} color={ui_tokens_1.colors.red}/>
          <react_native_1.Text style={styles.errorText}>VAT Return not found</react_native_1.Text>
          <components_1.ActionButton label="Go Back" onPress={() => router.back()} variant="ghost" fullWidth={false}/>
        </react_native_1.View>
      </react_native_1.SafeAreaView>);
    }
    const TimelineItem = ({ label, date, status, isLast }) => (<react_native_1.View style={styles.timelineItem}>
      <react_native_1.View style={styles.timelineLeft}>
        <react_native_1.View style={[
            styles.timelineDot,
            status === 'complete' && styles.dotComplete,
            status === 'active' && styles.dotActive,
        ]}/>
        {!isLast && <react_native_1.View style={[styles.timelineLine, status === 'complete' && styles.lineComplete]}/>}
      </react_native_1.View>
      <react_native_1.View style={styles.timelineContent}>
        <react_native_1.Text style={[styles.timelineLabel, status === 'pending' && styles.textPending]}>{label}</react_native_1.Text>
        {date && <react_native_1.Text style={styles.timelineDate}>{new Date(date).toLocaleString('en-KE')}</react_native_1.Text>}
      </react_native_1.View>
    </react_native_1.View>);
    return (<react_native_1.SafeAreaView style={styles.container}>
      <expo_router_1.Stack.Screen options={{ headerShown: false }}/>

      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <vector_icons_1.Ionicons name="chevron-back" size={28} color={ui_tokens_1.colors.white}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.Text style={styles.headerTitle}>Return Detail</react_native_1.Text>
        <components_1.StatusBadge status={vatReturn.status}/>
      </react_native_1.View>

      <react_native_1.ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <react_native_1.View style={styles.summaryCard}>
          <react_native_1.Text style={styles.summaryTitle}>{MONTHS[vatReturn.periodMonth - 1]} {vatReturn.periodYear}</react_native_1.Text>
          <react_native_1.View style={styles.metricsGrid}>
            <components_1.MetricTile label="Output VAT" value={Number(vatReturn.outputVatKes)} unit="KES"/>
            <components_1.MetricTile label="Input VAT" value={Number(vatReturn.inputVatKes)} unit="KES"/>
          </react_native_1.View>
          <react_native_1.View style={styles.netVatBox}>
            <react_native_1.Text style={styles.netVatLabel}>Net VAT Payable</react_native_1.Text>
            <react_native_1.Text style={styles.netVatValue}>KES {Number(vatReturn.netVatKes).toLocaleString('en-KE')}</react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>

        <components_1.SectionCard title="Status Timeline" accentColor={ui_tokens_1.colors.cobalt}>
          <TimelineItem label="Draft Created" date={vatReturn.createdAt} status="complete"/>
          <TimelineItem label="Submitted to GavaConnect" date={vatReturn.submittedAt} status={vatReturn.submittedAt ? 'complete' : 'active'}/>
          <TimelineItem label="KRA Acknowledged" status={vatReturn.gavaconnectAcknowledgement ? 'complete' : 'pending'} isLast/>
        </components_1.SectionCard>

        <components_1.SectionCard title="Contributing Invoices" accentColor={ui_tokens_1.colors.mint} expandable defaultExpanded={false}>
          {invoices.length > 0 ? (invoices.map((inv) => (<react_native_1.TouchableOpacity key={inv.id} style={styles.invoiceRow} onPress={() => router.push(`/invoices/${inv.id}`)}>
                <react_native_1.View>
                  <react_native_1.Text style={styles.invoiceRef}>{inv.id.slice(-8).toUpperCase()}</react_native_1.Text>
                  <react_native_1.Text style={styles.invoiceDate}>{new Date(inv.createdAt).toLocaleDateString('en-KE')}</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.Text style={styles.invoiceAmount}>KES {Number(inv.vatAmountKes).toLocaleString('en-KE')}</react_native_1.Text>
              </react_native_1.TouchableOpacity>))) : (<react_native_1.Text style={styles.emptyText}>No invoices for this period</react_native_1.Text>)}
        </components_1.SectionCard>

        <react_native_1.View style={{ height: 100 }}/>
      </react_native_1.ScrollView>

      <react_native_1.View style={styles.footer}>
        <components_1.ActionButton label="Download PDF Statement" onPress={sharePdf} variant="secondary" icon={<vector_icons_1.Ionicons name="download-outline" size={20} color={ui_tokens_1.colors.white}/>}/>
      </react_native_1.View>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: ui_tokens_1.colors.ink },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: ui_tokens_1.spacing.xl },
    errorText: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.heading, color: ui_tokens_1.colors.white, marginTop: ui_tokens_1.spacing.md },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: ui_tokens_1.spacing.screenPadding, paddingVertical: ui_tokens_1.spacing.md, justifyContent: 'space-between' },
    backButton: { padding: ui_tokens_1.spacing.xs },
    headerTitle: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.heading, fontWeight: ui_tokens_1.typography.fontWeight.bold, color: ui_tokens_1.colors.white, flex: 1, marginLeft: ui_tokens_1.spacing.md },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: ui_tokens_1.spacing.xxxl },
    summaryCard: { marginHorizontal: ui_tokens_1.spacing.screenPadding, padding: ui_tokens_1.spacing.md, backgroundColor: ui_tokens_1.colors.greyDark, borderRadius: ui_tokens_1.spacing.radius.md, marginBottom: ui_tokens_1.spacing.md },
    summaryTitle: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.heading, fontWeight: ui_tokens_1.typography.fontWeight.bold, color: ui_tokens_1.colors.white, marginBottom: ui_tokens_1.spacing.md },
    metricsGrid: { flexDirection: 'row', marginHorizontal: -ui_tokens_1.spacing.xs, marginBottom: ui_tokens_1.spacing.md },
    netVatBox: { backgroundColor: ui_tokens_1.colors.ink, padding: ui_tokens_1.spacing.md, borderRadius: ui_tokens_1.spacing.radius.sm, alignItems: 'center' },
    netVatLabel: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption, color: ui_tokens_1.colors.greyMid, textTransform: 'uppercase' },
    netVatValue: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.title, fontWeight: ui_tokens_1.typography.fontWeight.bold, color: ui_tokens_1.colors.mint, marginTop: 4 },
    timelineItem: { flexDirection: 'row', marginBottom: 0 },
    timelineLeft: { width: 30, alignItems: 'center' },
    timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: ui_tokens_1.colors.greyMid, zIndex: 1 },
    dotComplete: { backgroundColor: ui_tokens_1.colors.mint },
    dotActive: { backgroundColor: ui_tokens_1.colors.cobalt },
    timelineLine: { width: 2, flex: 1, backgroundColor: ui_tokens_1.colors.greyMid, marginVertical: -2 },
    lineComplete: { backgroundColor: ui_tokens_1.colors.mint },
    timelineContent: { flex: 1, paddingBottom: ui_tokens_1.spacing.lg, paddingLeft: ui_tokens_1.spacing.sm },
    timelineLabel: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.body, fontWeight: ui_tokens_1.typography.fontWeight.semibold, color: ui_tokens_1.colors.white },
    timelineDate: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption, color: ui_tokens_1.colors.greyMid, marginTop: 2 },
    textPending: { color: ui_tokens_1.colors.greyMid },
    invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: ui_tokens_1.spacing.sm, borderBottomWidth: 1, borderBottomColor: ui_tokens_1.colors.ink },
    invoiceRef: { fontFamily: ui_tokens_1.typography.fontFamily.mono, fontSize: ui_tokens_1.typography.fontSize.body, color: ui_tokens_1.colors.white },
    invoiceDate: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption, color: ui_tokens_1.colors.greyMid },
    invoiceAmount: { fontFamily: ui_tokens_1.typography.fontFamily.mono, fontSize: ui_tokens_1.typography.fontSize.body, fontWeight: ui_tokens_1.typography.fontWeight.bold, color: ui_tokens_1.colors.mint },
    emptyText: { fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.body, color: ui_tokens_1.colors.greyMid, textAlign: 'center', padding: ui_tokens_1.spacing.md },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: ui_tokens_1.colors.ink, padding: ui_tokens_1.spacing.screenPadding, borderTopWidth: 1, borderTopColor: ui_tokens_1.colors.greyDark },
});
