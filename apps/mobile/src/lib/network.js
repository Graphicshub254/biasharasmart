"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNetworkStatus = useNetworkStatus;
const netinfo_1 = __importDefault(require("@react-native-community/netinfo"));
const react_1 = require("react");
function useNetworkStatus() {
    const [isOnline, setIsOnline] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const unsubscribe = netinfo_1.default.addEventListener((state) => {
            setIsOnline(state.isConnected ?? true);
        });
        return unsubscribe;
    }, []);
    return { isOnline };
}
