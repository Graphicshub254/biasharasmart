"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInvoiceSync = useInvoiceSync;
const react_1 = require("react");
const network_1 = require("./network");
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const BUSINESS_ID = '7951dda8-a30e-4928-8350-b6c5662154a8'; // temp until T1.6 auth
function useInvoiceSync() {
    const { isOnline } = (0, network_1.useNetworkStatus)();
    const wasOffline = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (!isOnline) {
            wasOffline.current = true;
            return;
        }
        // Only sync if we were previously offline
        if (!wasOffline.current)
            return;
        wasOffline.current = false;
        const syncQueue = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/invoices/offline-queue/${BUSINESS_ID}`);
                if (!res.ok)
                    return;
                const queued = await res.json();
                // Fire sync for each queued invoice
                await Promise.allSettled(queued.map(invoice => fetch(`${API_BASE}/api/invoices/${invoice.id}/sync`, {
                    method: 'POST',
                })));
            }
            catch {
                // Silent fail — will retry next reconnect
            }
        };
        syncQueue();
    }, [isOnline]);
}
