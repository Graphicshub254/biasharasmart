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
exports.default = InvoiceDetailScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const Print = __importStar(require("expo-print"));
const Sharing = __importStar(require("expo-sharing"));
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const shared_types_1 = require("@biasharasmart/shared-types");
const { width } = react_native_1.Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const statusToBadge = (status) => {
    switch (status) {
        case shared_types_1.InvoiceStatus.PAID:
            return { type: 'filed', label: 'PAID' };
        case shared_types_1.InvoiceStatus.ISSUED:
            return { type: 'compliant', label: 'ISSUED' };
        case shared_types_1.InvoiceStatus.PENDING_KRA:
            return { type: 'pending', label: 'PENDING KRA' };
        case shared_types_1.InvoiceStatus.OVERDUE:
            return { type: 'overdue', label: 'OVERDUE' };
        case shared_types_1.InvoiceStatus.CANCELLED:
            return { type: 'lapsed', label: 'CANCELLED' };
        default:
            return { type: 'pending', label: status.toUpperCase() };
    }
};
function InvoiceDetailScreen() {
    const { id } = (0, expo_router_1.useLocalSearchParams)();
    const router = (0, expo_router_1.useRouter)();
    const [invoice, setInvoice] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(false);
    const [syncing, setSyncing] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const fetchInvoice = async () => {
            setLoading(true);
            setError(false);
            try {
                const res = await fetch(`${API_BASE}/api/invoices/${id}`);
                if (!res.ok)
                    throw new Error('Not found');
                const data = await res.json();
                setInvoice(data);
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
            fetchInvoice();
    }, [id]);
    const markAsPaid = async () => {
        if (!id)
            return;
        try {
            const res = await fetch(`${API_BASE}/api/invoices/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid' }),
            });
            if (res.ok) {
                const updated = await res.json();
                setInvoice(updated);
            }
        }
        catch (err) {
            console.error('Mark as paid error:', err);
        }
    };
    const syncKra = async () => {
        if (!id)
            return;
        setSyncing(true);
        try {
            const res = await fetch(`${API_BASE}/api/invoices/${id}/sync`, { method: 'POST' });
            if (res.ok) {
                const updated = await res.json();
                setInvoice(updated);
            }
        }
        catch (err) {
            console.error('Sync KRA error:', err);
        }
        finally {
            setSyncing(false);
        }
    };
    const sharePdf = async () => {
        if (!invoice)
            return;
        const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #003366; padding-bottom: 20px; }
            .title { color: #003366; font-size: 24px; margin: 0; }
            .meta { margin-top: 30px; }
            .section { margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; border-bottom: 1px solid #ddd; padding: 10px; color: #777; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .totals { margin-top: 40px; width: 40%; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { border-top: 2px solid #00BFA5; margin-top: 10px; padding-top: 10px; color: #00BFA5; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">BiasharaSmart Invoice</h1>
              <p>Ref: ${invoice.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <div class="meta">
            <p><strong>Customer:</strong> ${invoice.customerName ?? 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('en-KE')}</p>
            ${invoice.cuNumber ? `<p><strong>KRA CU:</strong> ${invoice.cuNumber}</p>` : ''}
          </div>
          <div class="section">
            <table>
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th style="text-align:center">QTY</th>
                  <th style="text-align:right">PRICE</th>
                  <th style="text-align:right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.lineItems.map((item) => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align:center">${item.quantity}</td>
                    <td style="text-align:right">KES ${parseFloat(item.unitPrice).toLocaleString('en-KE')}</td>
                    <td style="text-align:right">KES ${parseFloat(item.total).toLocaleString('en-KE')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>KES ${parseFloat(invoice.subtotalKes.toString()).toLocaleString('en-KE')}</span>
            </div>
            <div class="total-row">
              <span>VAT (16%)</span>
              <span>KES ${parseFloat(invoice.vatAmountKes.toString()).toLocaleString('en-KE')}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total</span>
              <span>KES ${parseFloat(invoice.totalKes.toString()).toLocaleString('en-KE')}</span>
            </div>
          </div>
        </body>
      </html>
    `;
        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Invoice ${invoice.id.slice(-8).toUpperCase()}`,
            });
        }
        catch (err) {
            console.error('PDF Share error:', err);
        }
    };
    if (loading) {
        return (<react_native_1.SafeAreaView style={styles.container}>
        <expo_router_1.Stack.Screen options={{ headerShown: false }}/>
        <react_native_1.View style={styles.header}>
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <vector_icons_1.Ionicons name="chevron-back" size={28} color={ui_tokens_1.colors.white}/>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
        <react_native_1.ScrollView style={styles.scroll}>
          <components_1.SkeletonLoader variant="card" count={4}/>
        </react_native_1.ScrollView>
      </react_native_1.SafeAreaView>);
    }
    if (error || !invoice) {
        return (<react_native_1.SafeAreaView style={styles.container}>
        <expo_router_1.Stack.Screen options={{ headerShown: false }}/>
        <react_native_1.View style={styles.errorContainer}>
          <vector_icons_1.Ionicons name="alert-circle-outline" size={64} color={ui_tokens_1.colors.red}/>
          <react_native_1.Text style={styles.errorText}>Invoice not found</react_native_1.Text>
          <components_1.ActionButton label="Go Back" onPress={() => router.back()} variant="ghost" fullWidth={false}/>
        </react_native_1.View>
      </react_native_1.SafeAreaView>);
    }
    const badgeConfig = statusToBadge(invoice.status);
    return (<react_native_1.SafeAreaView style={styles.container}>
      <expo_router_1.Stack.Screen options={{ headerShown: false }}/>
      
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <vector_icons_1.Ionicons name="chevron-back" size={28} color={ui_tokens_1.colors.white}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.Text style={styles.headerTitle}>Invoice</react_native_1.Text>
        <components_1.StatusBadge status={badgeConfig.type} label={badgeConfig.label}/>
      </react_native_1.View>

      <react_native_1.ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Meta Card */}
        <react_native_1.View style={styles.metaCard}>
          <react_native_1.Text style={styles.invoiceRef}>{invoice.id.slice(-8).toUpperCase()}</react_native_1.Text>
          <react_native_1.Text style={styles.customerName}>{invoice.customerName || 'Walk-in Customer'}</react_native_1.Text>
          {invoice.customerPhone && (<react_native_1.Text style={styles.customerPhone}>{invoice.customerPhone}</react_native_1.Text>)}
          
          {invoice.cuNumber && (<react_native_1.View style={styles.kraBadge}>
              <react_native_1.Text style={styles.kraBadgeText}>KRA ✓ {invoice.cuNumber}</react_native_1.Text>
            </react_native_1.View>)}
          
          <react_native_1.Text style={styles.dateLabel}>
            Issued on {new Date(invoice.createdAt).toLocaleDateString('en-KE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })}
          </react_native_1.Text>
        </react_native_1.View>

        {/* Items Section */}
        <components_1.SectionCard title="Items" accentColor={ui_tokens_1.colors.mint}>
          {invoice.lineItems.map((item, index) => (<react_native_1.View key={index} style={styles.lineItem}>
              <react_native_1.View style={styles.lineItemLeft}>
                <react_native_1.Text style={styles.itemDescription}>{item.description}</react_native_1.Text>
                <react_native_1.Text style={styles.vatLabel}>VAT {item.vatRate * 100}%</react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={styles.lineItemCenter}>
                <react_native_1.Text style={styles.itemQtyPrice}>
                  {item.quantity} x {parseFloat(item.unitPrice.toString()).toLocaleString('en-KE')}
                </react_native_1.Text>
              </react_native_1.View>
              <react_native_1.View style={styles.lineItemRight}>
                <react_native_1.Text style={styles.itemTotal}>
                  {parseFloat(item.total.toString()).toLocaleString('en-KE')}
                </react_native_1.Text>
              </react_native_1.View>
            </react_native_1.View>))}
        </components_1.SectionCard>

        {/* Totals Card */}
        <react_native_1.View style={styles.totalsCard}>
          <react_native_1.View style={styles.totalRow}>
            <react_native_1.Text style={styles.totalLabel}>Subtotal</react_native_1.Text>
            <react_native_1.Text style={styles.totalValue}>
              KES {parseFloat(invoice.subtotalKes.toString()).toLocaleString('en-KE')}
            </react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.totalRow}>
            <react_native_1.Text style={[styles.totalLabel, { color: ui_tokens_1.colors.greyMid }]}>VAT 16%</react_native_1.Text>
            <react_native_1.Text style={[styles.totalValue, { color: ui_tokens_1.colors.greyMid }]}>
              KES {parseFloat(invoice.vatAmountKes.toString()).toLocaleString('en-KE')}
            </react_native_1.Text>
          </react_native_1.View>
          <react_native_1.View style={styles.divider}/>
          <react_native_1.View style={styles.totalRow}>
            <react_native_1.Text style={styles.grandTotalLabel}>Total</react_native_1.Text>
            <react_native_1.Text style={styles.grandTotalValue}>
              KES {parseFloat(invoice.totalKes.toString()).toLocaleString('en-KE')}
            </react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>

        <react_native_1.View style={{ height: ui_tokens_1.spacing.xxl }}/>
      </react_native_1.ScrollView>

      {/* Footer Actions */}
      <react_native_1.View style={styles.footer}>
        <react_native_1.View style={styles.footerActions}>
          <react_native_1.View style={{ flex: 1, marginRight: ui_tokens_1.spacing.sm }}>
            <components_1.ActionButton label="Share PDF" onPress={sharePdf} variant="secondary" icon={<vector_icons_1.Ionicons name="share-outline" size={20} color={ui_tokens_1.colors.white}/>}/>
          </react_native_1.View>
          {(invoice.status === shared_types_1.InvoiceStatus.ISSUED || invoice.status === shared_types_1.InvoiceStatus.PENDING_KRA) && (<react_native_1.View style={{ flex: 1 }}>
              <components_1.ActionButton label="Mark as Paid" onPress={markAsPaid} variant="primary" icon={<vector_icons_1.Ionicons name="checkmark-circle-outline" size={20} color={ui_tokens_1.colors.white}/>}/>
            </react_native_1.View>)}
        </react_native_1.View>
        {invoice.offlineQueued && (<react_native_1.View style={{ marginTop: ui_tokens_1.spacing.sm }}>
            <components_1.ActionButton label={syncing ? "Syncing..." : "Sync KRA"} onPress={syncKra} variant="ghost" isLoading={syncing} icon={<vector_icons_1.Ionicons name="cloud-upload-outline" size={20} color={ui_tokens_1.colors.cobalt}/>}/>
          </react_native_1.View>)}
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
        alignItems: 'center',
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingVertical: ui_tokens_1.spacing.md,
        justifyContent: 'space-between',
    },
    backButton: {
        padding: ui_tokens_1.spacing.xs,
    },
    headerTitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        flex: 1,
        marginLeft: ui_tokens_1.spacing.md,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: ui_tokens_1.spacing.xxxl,
    },
    metaCard: {
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        marginHorizontal: ui_tokens_1.spacing.screenPadding,
        padding: ui_tokens_1.spacing.cardPadding,
        marginBottom: ui_tokens_1.spacing.md,
    },
    invoiceRef: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
        marginBottom: ui_tokens_1.spacing.xs,
    },
    customerName: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginBottom: 4,
    },
    customerPhone: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
        marginBottom: ui_tokens_1.spacing.md,
    },
    kraBadge: {
        backgroundColor: ui_tokens_1.colors.greenBg,
        alignSelf: 'flex-start',
        paddingHorizontal: ui_tokens_1.spacing.sm,
        paddingVertical: 2,
        borderRadius: ui_tokens_1.spacing.radius.full,
        marginBottom: ui_tokens_1.spacing.md,
    },
    kraBadgeText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.green,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
    },
    dateLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
    },
    lineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: ui_tokens_1.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: ui_tokens_1.colors.ink,
    },
    lineItemLeft: {
        flex: 2,
    },
    lineItemCenter: {
        flex: 1.5,
        alignItems: 'center',
    },
    lineItemRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    itemDescription: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.white,
    },
    vatLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
    },
    itemQtyPrice: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
        textAlign: 'center',
    },
    itemTotal: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.mint,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
    },
    totalsCard: {
        marginHorizontal: ui_tokens_1.spacing.screenPadding,
        padding: ui_tokens_1.spacing.md,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: ui_tokens_1.spacing.xs,
    },
    totalLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.white,
    },
    totalValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.white,
    },
    divider: {
        height: 1,
        backgroundColor: ui_tokens_1.colors.greyDark,
        marginVertical: ui_tokens_1.spacing.sm,
    },
    grandTotalLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    grandTotalValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.mono,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.mint,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: ui_tokens_1.colors.ink,
        padding: ui_tokens_1.spacing.screenPadding,
        borderTopWidth: 1,
        borderTopColor: ui_tokens_1.colors.greyDark,
    },
    footerActions: {
        flexDirection: 'row',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: ui_tokens_1.spacing.xl,
    },
    errorText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.heading,
        color: ui_tokens_1.colors.white,
        marginTop: ui_tokens_1.spacing.md,
    },
});
