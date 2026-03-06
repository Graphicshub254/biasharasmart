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
exports.default = ScoreScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const vector_icons_1 = require("@expo/vector-icons");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const components_1 = require("../../src/components");
const network_1 = require("../../src/lib/network");
// --- Constants ---
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
// --- Component ---
function ScoreScreen() {
    const router = (0, expo_router_1.useRouter)();
    const { isOnline } = (0, network_1.useNetworkStatus)();
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [scoreData, setScoreData] = (0, react_1.useState)(null);
    const [paymentMode, setPaymentMode] = (0, react_1.useState)('legacy');
    const fetchScore = (0, react_1.useCallback)(async (isRefresh = false) => {
        if (!isRefresh)
            setLoading(true);
        try {
            // 1. Get business ID from summary
            const summaryRes = await fetch(`${API_BASE}/api/dashboard/summary`);
            if (!summaryRes.ok)
                throw new Error('Failed to fetch business ID');
            const summary = await summaryRes.json();
            const businessId = summary.business.id;
            // 2. Fetch Score
            const scoreRes = await fetch(`${API_BASE}/api/score/${businessId}`);
            if (!scoreRes.ok)
                throw new Error('Failed to fetch score');
            const data = await scoreRes.json();
            setScoreData(data);
            // 3. Fetch WHT summary for paymentMode
            const whtRes = await fetch(`${API_BASE}/api/payments/wht-summary/${businessId}`);
            if (whtRes.ok) {
                const whtData = await whtRes.json();
                setPaymentMode(whtData.paymentMode);
            }
        }
        catch (error) {
            console.error('Score fetch error:', error);
            react_native_1.Alert.alert('Error', 'Could not load your Biashara Score.');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        fetchScore();
    }, []);
    const onRefresh = () => {
        setRefreshing(true);
        fetchScore(true);
    };
    if (loading && !scoreData) {
        return (<react_native_1.SafeAreaView style={styles.container}>
        <react_native_1.ScrollView contentContainerStyle={styles.scrollContent}>
          <react_native_1.View style={styles.loadingContainer}>
            <components_1.SkeletonLoader variant="hero" count={1}/>
            <components_1.SkeletonLoader variant="row" count={4}/>
          </react_native_1.View>
        </react_native_1.ScrollView>
      </react_native_1.SafeAreaView>);
    }
    const score = scoreData?.total ?? 0;
    // Color logic
    let scoreColor = ui_tokens_1.colors.red;
    if (score >= 800)
        scoreColor = ui_tokens_1.colors.cobalt;
    else if (score >= 600)
        scoreColor = ui_tokens_1.colors.mint;
    else if (score >= 400)
        scoreColor = ui_tokens_1.colors.gold;
    const getTips = () => {
        if (!scoreData)
            return [];
        const tips = [];
        if (scoreData.breakdown.consistency < 200) {
            tips.push({ text: 'Generate more eTIMS receipts daily (+40 pts)', icon: 'receipt' });
        }
        if (scoreData.breakdown.taxHygiene < 150) {
            tips.push({ text: 'Pay your WHT on time (+30 pts per payment)', icon: 'account-balance-wallet' });
        }
        if (paymentMode === 'legacy') {
            tips.push({ text: 'Switch to Gateway (+100 pts)', icon: 'bolt' });
        }
        return tips;
    };
    const tips = getTips();
    return (<react_native_1.SafeAreaView style={styles.container}>
      <react_native_1.ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<react_native_1.RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui_tokens_1.colors.mint}/>}>
        {/* Main Score Ring */}
        <react_native_1.View style={styles.ringSection}>
          <components_1.ProgressRing progress={score / 1000} label={score.toString()} sublabel="/ 1000" size={220} color={scoreColor}/>
          <react_native_1.View style={styles.badgeContainer}>
            {scoreData?.loanEligible ? (<components_1.StatusBadge status="compliant" label="LOAN ELIGIBLE" size="large"/>) : (<components_1.StatusBadge status="warning" label="NEEDS IMPROVEMENT" size="large"/>)}
          </react_native_1.View>
        </react_native_1.View>

        {/* Milestone Card */}
        <react_native_1.View style={styles.milestoneCard}>
          <vector_icons_1.MaterialIcons name="flag" size={24} color={ui_tokens_1.colors.mint}/>
          <react_native_1.View style={styles.milestoneText}>
            <react_native_1.Text style={styles.milestoneLabel}>Next Milestone</react_native_1.Text>
            <react_native_1.Text style={styles.milestoneValue}>
              {scoreData ? (scoreData.nextMilestone - score) : 0} pts to unlock Co-op Bank loan
            </react_native_1.Text>
          </react_native_1.View>
        </react_native_1.View>

        {/* Score Breakdown */}
        <components_1.SectionCard title="Score Breakdown" accentColor={ui_tokens_1.colors.mint}>
          <components_1.ProgressBar label="Consistency" current={scoreData?.breakdown.consistency ?? 0} max={400} color={ui_tokens_1.colors.mint}/>
          <components_1.ProgressBar label="Tax Hygiene" current={scoreData?.breakdown.taxHygiene ?? 0} max={300} color={ui_tokens_1.colors.gold}/>
          <components_1.ProgressBar label="Growth" current={scoreData?.breakdown.growth ?? 0} max={300} color={ui_tokens_1.colors.cobalt}/>
          <react_native_1.View style={styles.lockedRow}>
            <vector_icons_1.MaterialIcons name="lock" size={16} color={ui_tokens_1.colors.greyMid}/>
            <react_native_1.Text style={styles.lockedText}>Green Multiplier: Coming in Phase 3</react_native_1.Text>
          </react_native_1.View>
        </components_1.SectionCard>

        {/* How to Improve */}
        <components_1.SectionCard title="How to Improve" accentColor={ui_tokens_1.colors.gold}>
          {tips.map((tip, idx) => (<react_native_1.View key={idx} style={styles.tipRow}>
              <vector_icons_1.MaterialIcons name={tip.icon} size={20} color={ui_tokens_1.colors.mint}/>
              <react_native_1.Text style={styles.tipText}>{tip.text}</react_native_1.Text>
            </react_native_1.View>))}
          {tips.length === 0 && (<react_native_1.Text style={styles.emptyTips}>You have a perfect score! Keep it up.</react_native_1.Text>)}
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
    scrollContent: {
        paddingBottom: ui_tokens_1.spacing.xxl,
    },
    loadingContainer: {
        padding: ui_tokens_1.spacing.screenPadding,
    },
    ringSection: {
        alignItems: 'center',
        paddingVertical: ui_tokens_1.spacing.xl,
        backgroundColor: ui_tokens_1.colors.ink,
    },
    badgeContainer: {
        marginTop: ui_tokens_1.spacing.lg,
    },
    milestoneCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ui_tokens_1.colors.greyDark,
        marginHorizontal: ui_tokens_1.spacing.screenPadding,
        padding: ui_tokens_1.spacing.md,
        borderRadius: ui_tokens_1.spacing.radius.lg,
        marginBottom: ui_tokens_1.spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: ui_tokens_1.colors.mint,
    },
    milestoneText: {
        marginLeft: ui_tokens_1.spacing.md,
    },
    milestoneLabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        textTransform: 'uppercase',
    },
    milestoneValue: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
        color: ui_tokens_1.colors.white,
        marginTop: 2,
    },
    lockedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: ui_tokens_1.spacing.sm,
        opacity: 0.6,
    },
    lockedText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.greyMid,
        marginLeft: ui_tokens_1.spacing.xs,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: ui_tokens_1.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: ui_tokens_1.colors.greyDark,
    },
    tipText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.white,
        marginLeft: ui_tokens_1.spacing.sm,
        flex: 1,
    },
    emptyTips: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.body,
        color: ui_tokens_1.colors.mint,
        textAlign: 'center',
        paddingVertical: ui_tokens_1.spacing.md,
    },
    footerSpacer: {
        height: 60,
    },
});
