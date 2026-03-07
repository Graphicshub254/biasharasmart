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
exports.default = SecurityScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
function SecurityScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [businessId, setBusinessId] = (0, react_1.useState)(null);
    const [vaultStatus, setVaultStatus] = (0, react_1.useState)(null);
    const [events, setEvents] = (0, react_1.useState)([]);
    const [secret, setSecret] = (0, react_1.useState)('');
    const [showSecretInput, setShowSecretInput] = (0, react_1.useState)(false);
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const fetchData = (0, react_1.useCallback)(async (isRefresh = false) => {
        if (!isRefresh)
            setLoading(true);
        try {
            // First get businessId from dashboard summary
            const dashRes = await fetch(`${API_BASE}/api/dashboard/summary`);
            if (!dashRes.ok)
                throw new Error('Failed to fetch business ID');
            const dashData = await dashRes.json();
            const bId = dashData.business.id;
            setBusinessId(bId);
            // Get vault status
            const statusRes = await fetch(`${API_BASE}/api/fraud/public/vault-status/${bId}`);
            if (statusRes.ok) {
                setVaultStatus(await statusRes.json());
            }
            // Get events
            const eventsRes = await fetch(`${API_BASE}/api/fraud/public/events/${bId}`);
            if (eventsRes.ok) {
                setEvents(await eventsRes.json());
            }
        }
        catch (error) {
            console.error('Security screen fetch error:', error);
            react_native_1.Alert.alert('Error', 'Failed to load security data');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        fetchData();
    }, []);
    const handleToggleVault = async () => {
        if (!businessId)
            return;
        const isActivating = !vaultStatus?.vaultMode;
        const action = isActivating ? 'trigger' : 'release';
        const reason = isActivating ? 'User manual activation' : 'User manual release';
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/fraud/public/vault/${businessId}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: isActivating ? JSON.stringify({ reason }) : undefined,
            });
            if (res.ok) {
                react_native_1.Alert.alert('Success', `Vault Mode ${isActivating ? 'activated' : 'released'}`);
                fetchData(true);
            }
            else {
                throw new Error('Action failed');
            }
        }
        catch (error) {
            react_native_1.Alert.alert('Error', `Failed to ${isActivating ? 'activate' : 'release'} Vault Mode`);
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleChangeSecret = async () => {
        if (!businessId)
            return;
        if (secret.length !== 3 || !/^\d+$/.test(secret)) {
            react_native_1.Alert.alert('Invalid Secret', 'Please enter a 3-digit numeric code');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/fraud/public/secret/${businessId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret }),
            });
            if (res.ok) {
                react_native_1.Alert.alert('Success', 'Transaction secret updated');
                setShowSecretInput(false);
                setSecret('');
            }
            else {
                throw new Error('Action failed');
            }
        }
        catch (error) {
            react_native_1.Alert.alert('Error', 'Failed to update transaction secret');
        }
        finally {
            setSubmitting(false);
        }
    };
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return ui_tokens_1.colors.red;
            case 'high': return ui_tokens_1.colors.gold;
            case 'medium': return ui_tokens_1.colors.teal;
            default: return ui_tokens_1.colors.greyMid;
        }
    };
    if (loading && !vaultStatus) {
        return (<react_native_1.SafeAreaView style={styles.container}>
        <react_native_1.View style={styles.centered}>
          <react_native_1.ActivityIndicator size="large" color={ui_tokens_1.colors.mint}/>
        </react_native_1.View>
      </react_native_1.SafeAreaView>);
    }
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <vector_icons_1.MaterialIcons name="arrow-back" size={24} color={ui_tokens_1.colors.white}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.Text style={styles.headerTitle}>Security</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={ui_tokens_1.colors.mint}/>}>
        {/* Vault Mode */}
        <components_1.SectionCard title="Vault Mode" accentColor={vaultStatus?.vaultMode ? ui_tokens_1.colors.red : ui_tokens_1.colors.mint}>
          <react_native_1.View style={styles.vaultInfo}>
            <react_native_1.View>
              <react_native_1.Text style={styles.cardLabel}>Status</react_native_1.Text>
              <react_native_1.View style={styles.statusRow}>
                <components_1.StatusBadge status={vaultStatus?.vaultMode ? 'lapsed' : 'compliant'} label={vaultStatus?.vaultMode ? 'Active' : 'Inactive'}/>
              </react_native_1.View>
            </react_native_1.View>
            {vaultStatus?.vaultMode && (<react_native_1.View style={styles.expiryBox}>
                <vector_icons_1.MaterialIcons name="lock-clock" size={20} color={ui_tokens_1.colors.gold}/>
                <react_native_1.Text style={styles.expiryText}>24hr Freeze Active</react_native_1.Text>
              </react_native_1.View>)}
          </react_native_1.View>
          <react_native_1.Text style={styles.cardDescription}>
            Vault Mode freezes all outgoing payments and withdrawals for 24 hours. Trigger this if you suspect unauthorized access.
          </react_native_1.Text>
          <components_1.ActionButton label={vaultStatus?.vaultMode ? 'Release Vault' : 'Activate Vault'} variant={vaultStatus?.vaultMode ? 'ghost' : 'danger'} onPress={handleToggleVault} isLoading={submitting}/>
        </components_1.SectionCard>

        {/* Transaction Secret */}
        <components_1.SectionCard title="Transaction Secret" accentColor={ui_tokens_1.colors.cobalt}>
          <react_native_1.View style={styles.secretRow}>
            <react_native_1.View>
              <react_native_1.Text style={styles.cardLabel}>Verification Code</react_native_1.Text>
              <react_native_1.Text style={styles.maskedSecret}>***</react_native_1.Text>
            </react_native_1.View>
            <components_1.ActionButton label={showSecretInput ? 'Cancel' : 'Change Secret'} variant="ghost" fullWidth={false} onPress={() => setShowSecretInput(!showSecretInput)}/>
          </react_native_1.View>
          {showSecretInput && (<react_native_1.View style={styles.secretInputContainer}>
              <components_1.InputField label="New 3-Digit Secret" value={secret} onChangeText={setSecret} placeholder="e.g. 742" keyboardType="number-pad" maxLength={3}/>
              <components_1.ActionButton label="Save New Secret" onPress={handleChangeSecret} isLoading={submitting}/>
            </react_native_1.View>)}
          <react_native_1.Text style={styles.cardDescription}>
            This 3-digit code will be required to authorize all payments. Never share it with anyone.
          </react_native_1.Text>
        </components_1.SectionCard>

        {/* Recent Events */}
        <components_1.SectionCard title="Recent Activity" accentColor={ui_tokens_1.colors.teal}>
          {events.length === 0 ? (<react_native_1.View style={styles.emptyState}>
              <vector_icons_1.MaterialIcons name="check-circle-outline" size={48} color={ui_tokens_1.colors.mint}/>
              <react_native_1.Text style={styles.emptyText}>No suspicious activity detected</react_native_1.Text>
            </react_native_1.View>) : (events.map((event) => (<react_native_1.View key={event.id} style={styles.eventItem}>
                <react_native_1.View style={styles.eventHeader}>
                  <react_native_1.View style={styles.eventTypeContainer}>
                    <react_native_1.Text style={styles.eventTypeText}>{event.eventType.replace(/_/g, ' ')}</react_native_1.Text>
                    <react_native_1.View style={[styles.severityBadge, { backgroundColor: getSeverityColor(event.severity) }]}>
                      <react_native_1.Text style={styles.severityText}>{event.severity}</react_native_1.Text>
                    </react_native_1.View>
                  </react_native_1.View>
                  <react_native_1.Text style={styles.eventDate}>
                    {new Date(event.createdAt).toLocaleDateString()}
                  </react_native_1.Text>
                </react_native_1.View>
                <react_native_1.Text style={styles.eventDescription}>{event.description}</react_native_1.Text>
              </react_native_1.View>)))}
        </components_1.SectionCard>

        <react_native_1.View style={styles.footerSpacer}/>
      </react_native_1.ScrollView>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        paddingVertical: ui_tokens_1.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: ui_tokens_1.colors.greyDark,
    },
    backButton: {
        marginRight: ui_tokens_1.spacing.md,
    },
    headerTitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.title,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
    },
    scrollContent: {
        paddingVertical: ui_tokens_1.spacing.md,
    },
    vaultInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: ui_tokens_1.spacing.md,
    },
    cardLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expiryBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ui_tokens_1.colors.ink,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: ui_tokens_1.colors.gold,
    },
    expiryText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: 10,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.gold,
        marginLeft: 6,
    },
    cardDescription: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        marginBottom: ui_tokens_1.spacing.lg,
        lineHeight: 16,
    },
    secretRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: ui_tokens_1.spacing.md,
    },
    maskedSecret: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: 24,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        letterSpacing: 4,
    },
    secretInputContainer: {
        backgroundColor: ui_tokens_1.colors.ink,
        padding: ui_tokens_1.spacing.md,
        borderRadius: ui_tokens_1.spacing.radius.md,
        marginBottom: ui_tokens_1.spacing.md,
        borderWidth: 1,
        borderColor: ui_tokens_1.colors.greyDark,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: ui_tokens_1.spacing.xl,
    },
    emptyText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
        marginTop: ui_tokens_1.spacing.md,
    },
    eventItem: {
        paddingVertical: ui_tokens_1.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: ui_tokens_1.colors.ink,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    eventTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eventTypeText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginRight: 8,
    },
    severityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    severityText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: 8,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        textTransform: 'uppercase',
    },
    eventDate: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: 10,
        color: ui_tokens_1.colors.greyMid,
    },
    eventDescription: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        lineHeight: 16,
    },
    footerSpacer: {
        height: 40,
    },
});
