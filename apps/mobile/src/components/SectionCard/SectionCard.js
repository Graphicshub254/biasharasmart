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
exports.SectionCard = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const SectionCard = ({ title, children, expandable = false, defaultExpanded = true, accentColor = ui_tokens_1.colors.cobalt, badge, }) => {
    const [expanded, setExpanded] = (0, react_1.useState)(defaultExpanded);
    return (<react_native_1.View style={styles.container}>
      <react_native_1.TouchableOpacity style={[styles.header, { borderLeftColor: accentColor }]} onPress={() => expandable && setExpanded(!expanded)} activeOpacity={expandable ? 0.7 : 1}>
        <react_native_1.Text style={styles.title}>{title}</react_native_1.Text>
        <react_native_1.View style={styles.headerRight}>
          {badge && <react_native_1.View style={styles.badge}><react_native_1.Text style={styles.badgeText}>{badge}</react_native_1.Text></react_native_1.View>}
          {expandable && <react_native_1.Text style={styles.chevron}>{expanded ? '▲' : '▼'}</react_native_1.Text>}
        </react_native_1.View>
      </react_native_1.TouchableOpacity>
      {expanded && <react_native_1.View style={styles.content}>{children}</react_native_1.View>}
    </react_native_1.View>);
};
exports.SectionCard = SectionCard;
const styles = react_native_1.StyleSheet.create({
    container: {
        backgroundColor: ui_tokens_1.colors.greyDark, borderRadius: ui_tokens_1.spacing.radius.md,
        marginHorizontal: ui_tokens_1.spacing.screenPadding, marginBottom: ui_tokens_1.spacing.sm, overflow: 'hidden',
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: ui_tokens_1.spacing.md, borderLeftWidth: 3,
    },
    title: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.body,
        fontWeight: ui_tokens_1.typography.fontWeight.semibold, color: ui_tokens_1.colors.white,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    badge: {
        backgroundColor: ui_tokens_1.colors.cobalt, borderRadius: ui_tokens_1.spacing.radius.full,
        paddingHorizontal: ui_tokens_1.spacing.sm, paddingVertical: 2, marginRight: ui_tokens_1.spacing.sm,
    },
    badgeText: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary, fontSize: ui_tokens_1.typography.fontSize.caption,
        color: ui_tokens_1.colors.white, fontWeight: ui_tokens_1.typography.fontWeight.semibold,
    },
    chevron: { color: ui_tokens_1.colors.greyMid, fontSize: 12 },
    content: { padding: ui_tokens_1.spacing.md, borderTopWidth: 1, borderTopColor: ui_tokens_1.colors.ink },
});
