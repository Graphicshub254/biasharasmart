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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressRing = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_svg_1 = __importStar(require("react-native-svg"));
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const ProgressRing = ({ progress, label, sublabel, size = 180, color = ui_tokens_1.colors.mint, isLoading = false, }) => {
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - progress * circumference;
    if (isLoading) {
        return (<react_native_1.View style={[styles.container, { width: size, height: size, borderRadius: size / 2, opacity: 0.4 }]}>
        <react_native_1.View style={styles.loadingInner}/>
      </react_native_1.View>);
    }
    return (<react_native_1.View style={[styles.container, { width: size, height: size }]}>
      <react_native_svg_1.default width={size} height={size}>
        <react_native_svg_1.G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <react_native_svg_1.Circle cx={size / 2} cy={size / 2} r={radius} stroke={ui_tokens_1.colors.greyDark} strokeWidth={strokeWidth} fill="transparent"/>
          {/* Progress circle */}
          <react_native_svg_1.Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="transparent"/>
        </react_native_svg_1.G>
      </react_native_svg_1.default>
      <react_native_1.View style={styles.innerContent}>
        <react_native_1.Text style={[styles.value, { color }]}>{label}</react_native_1.Text>
        {sublabel && <react_native_1.Text style={styles.sublabel}>{sublabel}</react_native_1.Text>}
      </react_native_1.View>
    </react_native_1.View>);
};
exports.ProgressRing = ProgressRing;
const styles = react_native_1.StyleSheet.create({
    container: {
        alignItems: 'center', justifyContent: 'center',
    },
    innerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: 48,
        fontWeight: ui_tokens_1.typography.fontWeight.bold,
    },
    sublabel: {
        fontFamily: ui_tokens_1.typography.fontFamily.primary,
        fontSize: ui_tokens_1.typography.fontSize.label,
        color: ui_tokens_1.colors.greyMid,
        marginTop: -4,
    },
    loadingInner: {
        flex: 1,
        backgroundColor: ui_tokens_1.colors.greyDark,
        width: '100%',
        borderRadius: 999,
    }
});
