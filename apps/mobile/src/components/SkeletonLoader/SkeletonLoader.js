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
exports.SkeletonLoader = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const ui_tokens_1 = require("@biasharasmart/ui-tokens");
const SKELETON_HEIGHTS = {
    hero: 160, card: 120, row: 64, tile: 80,
};
const SkeletonItem = ({ height, style }) => {
    const opacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0.3)).current;
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
            react_native_1.Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])).start();
    }, [opacity]);
    return (<react_native_1.Animated.View style={[styles.item, { height, opacity }, style]}/>);
};
const SkeletonLoader = ({ variant = 'card', count = 1, style, }) => {
    const height = SKELETON_HEIGHTS[variant];
    return (<react_native_1.View>
      {Array.from({ length: count }).map((_, i) => (<SkeletonItem key={i} height={height} style={style}/>))}
    </react_native_1.View>);
};
exports.SkeletonLoader = SkeletonLoader;
const styles = react_native_1.StyleSheet.create({
    item: {
        backgroundColor: ui_tokens_1.colors.greyDark,
        borderRadius: ui_tokens_1.spacing.radius.md,
        marginBottom: ui_tokens_1.spacing.sm,
        marginHorizontal: ui_tokens_1.spacing.screenPadding,
    },
});
