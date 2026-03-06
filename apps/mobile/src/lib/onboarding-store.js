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
exports.OnboardingStore = void 0;
const SecureStore = __importStar(require("expo-secure-store"));
const STEP_KEY = 'onboarding_step';
const DATA_KEY = 'onboarding_data';
exports.OnboardingStore = {
    async saveStep(step) {
        await SecureStore.setItemAsync(STEP_KEY, step);
    },
    async getStep() {
        const val = await SecureStore.getItemAsync(STEP_KEY);
        return val ?? null;
    },
    async saveData(data) {
        const existing = await exports.OnboardingStore.getData();
        const merged = { ...existing, ...data };
        await SecureStore.setItemAsync(DATA_KEY, JSON.stringify(merged));
    },
    async getData() {
        const val = await SecureStore.getItemAsync(DATA_KEY);
        return val ? JSON.parse(val) : {};
    },
    async clear() {
        await SecureStore.deleteItemAsync(STEP_KEY);
        await SecureStore.deleteItemAsync(DATA_KEY);
    },
};
