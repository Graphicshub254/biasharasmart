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
exports.default = TccScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8'; // temp until T1.6
function TccScreen() {
    const router = (0, expo_router_1.useRouter)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(false);
    const [tcc, setTcc] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchTcc = async () => {
            setLoading(true);
            setError(false);
            try {
                const res = await fetch(`${API_BASE}/api/tcc/${BUSINESS_ID}`);
                if (!res.ok)
                    throw new Error('Failed to fetch');
                const data = await res.json();
                setTcc(data);
            }
            catch (err) {
                console.error('TCC fetch error:', err);
                setError(true);
            }
            finally {
                setLoading(false);
            }
        };
        fetchTcc();
    }, []);
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).toUpperCase();
    };
    if (loading) {
        return (<react_native_1.SafeAreaView style={styles.container}>
        <react_native_1.View style={styles.header}>
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <vector_icons_1.MaterialIcons name="chevron-left" size={32} color={ui_tokens_1.colors.white}/>
          </react_native_1.TouchableOpacity>
          <react_native_1.Text style={styles.headerTitle}>Tax Compliance Certificate</react_native_1.Text>
        </react_native_1.View>
        <react_native_1.ScrollView contentContainerStyle={styles.scrollContent}>
          <react_native_1.View style={styles.ringPlaceholder}>
            <components_1.SkeletonLoader variant="card" count={1} style={{ height: 200, width: 200, borderRadius: 100 }}/>
          </react_native_1.View>
          <components_1.SkeletonLoader variant="card" count={2}/>
        </react_native_1.ScrollView>
      </react_native_1.SafeAreaView>);
    }
    if (error || !tcc) {
        return (<react_native_1.SafeAreaView style={styles.container}>
        <react_native_1.View style={styles.header}>
          <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <vector_icons_1.MaterialIcons name="chevron-left" size={32} color={ui_tokens_1.colors.white}/>
          </react_native_1.TouchableOpacity>
          <react_native_1.Text style={styles.headerTitle}>Tax Compliance Certificate</react_native_1.Text>
        </react_native_1.View>
        <react_native_1.View style={styles.center}>
          <vector_icons_1.MaterialIcons name="error-outline" size={48} color={ui_tokens_1.colors.red}/>
          <react_native_1.Text style={styles.errorText}>Failed to load TCC status</react_native_1.Text>
          <react_native_1.View style={{ marginTop: 20, width: '100%' }}>
            <components_1.ActionButton label="Try Again" onPress={() => router.replace('/tcc')}/>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.SafeAreaView>);
    }
    const statusColor = {
        compliant: ui_tokens_1.colors.mint,
        warning: ui_tokens_1.colors.gold,
        lapsed: ui_tokens_1.colors.red,
    }[tcc.status];
    const badgeConfig = {
        compliant: { label: 'TCC Valid', status: 'compliant' },
        warning: { label: 'Expiring Soon', status: 'warning' },
        lapsed: { label: 'TCC Lapsed', status: 'lapsed' },
    }[tcc.status];
    return (<react_native_1.SafeAreaView style={styles.container}>
      {/* Header */}
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <vector_icons_1.MaterialIcons name="chevron-left" size={32} color={ui_tokens_1.colors.white}/>
        </react_native_1.TouchableOpacity>
        <react_native_1.Text style={styles.headerTitle}>Tax Compliance Certificate</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Ring Section */}
        <react_native_1.View style={styles.ringSection}>
          <components_1.ProgressRing progress={Math.min(1, tcc.daysRemaining / 365)} label={tcc.daysRemaining.toString()} sublabel="days" color={statusColor} size={220}/>
          <react_native_1.View style={styles.badgeWrapper}>
            <components_1.StatusBadge status={badgeConfig.status} label={badgeConfig.label} size="large"/>
          </react_native_1.View>
          <react_native_1.Text style={styles.expiryText}>Expires {formatDate(tcc.expiryDate)}</react_native_1.Text>
        </react_native_1.View>

        {/* Info Sections */}
        <components_1.SectionCard title="What is TCC?" expandable={true} defaultExpanded={false}>
          <react_native_1.Text style={styles.infoText}>
            A Tax Compliance Certificate (TCC) confirms your business is up to date with KRA obligations. 
            It is required for government tenders and certain business transactions.
          </react_native_1.Text>
        </components_1.SectionCard>

        <components_1.SectionCard title="What to do if lapsed" expandable={true} defaultExpanded={false}>
          <react_native_1.Text style={styles.infoText}>
            Visit KRA iTax portal at itax.kra.go.ke to file any outstanding returns and apply for a new TCC.
          </react_native_1.Text>
        </components_1.SectionCard>

        {/* Action Button */}
        {(tcc.status === 'lapsed' || tcc.status === 'warning') && (<react_native_1.View style={styles.actionSection}>
            <components_1.ActionButton label={tcc.status === 'lapsed' ? 'Apply for TCC' : 'Renew TCC'} onPress={() => react_native_1.Linking.openURL('https://itax.kra.go.ke')}/>
          </react_native_1.View>)}
      </react_native_1.ScrollView>
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
        paddingHorizontal: ui_tokens_1.spacing.sm,
        paddingVertical: ui_tokens_1.spacing.md,
    },
    backButton: {
        padding: ui_tokens_1.spacing.xs,
    },
    headerTitle: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginLeft: ui_tokens_1.spacing.xs,
    },
    scrollContent: {
        paddingBottom: ui_tokens_1.spacing.xxl,
    },
    ringSection: {
        alignItems: 'center',
        paddingVertical: ui_tokens_1.spacing.xl,
    },
    ringPlaceholder: {
        alignItems: 'center',
        paddingVertical: ui_tokens_1.spacing.xl,
    },
    badgeWrapper: {
        marginTop: ui_tokens_1.spacing.lg,
        marginBottom: ui_tokens_1.spacing.sm,
    },
    expiryText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold,
    },
    infoText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
        lineHeight: 18,
    },
    actionSection: {
        paddingHorizontal: ui_tokens_1.spacing.screenPadding,
        marginTop: ui_tokens_1.spacing.lg,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: ui_tokens_1.spacing.xl,
    },
    errorText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.greyMid,
        marginTop: ui_tokens_1.spacing.md,
        textAlign: 'center',
    },
});
