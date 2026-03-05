import * as SecureStore from 'expo-secure-store';

const STEP_KEY = 'onboarding_step';
const DATA_KEY = 'onboarding_data';

export type OnboardingData = {
  businessType?: 'sole_proprietor' | 'partnership' | 'limited_company';
  kraPin?: string;
  taxpayerName?: string;
  paybill?: string;
  paybillType?: 'paybill' | 'till';
  kycDocumentUrl?: string;
};

export type OnboardingStep = 'type' | 'pin' | 'mpesa' | 'kyc' | 'complete';

export const OnboardingStore = {
  async saveStep(step: OnboardingStep): Promise<void> {
    await SecureStore.setItemAsync(STEP_KEY, step);
  },

  async getStep(): Promise<OnboardingStep | null> {
    const val = await SecureStore.getItemAsync(STEP_KEY);
    return (val as OnboardingStep) ?? null;
  },

  async saveData(data: Partial<OnboardingData>): Promise<void> {
    const existing = await OnboardingStore.getData();
    const merged = { ...existing, ...data };
    await SecureStore.setItemAsync(DATA_KEY, JSON.stringify(merged));
  },

  async getData(): Promise<OnboardingData> {
    const val = await SecureStore.getItemAsync(DATA_KEY);
    return val ? JSON.parse(val) : {};
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(STEP_KEY);
    await SecureStore.deleteItemAsync(DATA_KEY);
  },
};
