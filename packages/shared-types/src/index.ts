// ─── Enums (must match entity enums exactly) ────────────────────────────────

export enum BusinessType {
  SOLE_PROPRIETOR = 'sole_proprietor',
  PARTNERSHIP = 'partnership',
  LIMITED_COMPANY = 'limited_company',
}

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING_KRA = 'pending_kra',
  ISSUED = 'issued',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

// ─── Core domain interfaces ──────────────────────────────────────────────────

export interface Business {
  id: string;
  kraPin: string;
  businessName: string;
  businessType: BusinessType;
  mpesaPaybill?: string;
  mpesaTill?: string;
  gavaconnectId?: string;
  kycStatus: KycStatus;
  createdAt: string;   // ISO string — serialised from Date by JSON
  updatedAt: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  customerName?: string;
  customerPhone?: string;
  lineItems: LineItem[];
  subtotalKes: number;
  vatAmountKes: number;
  totalKes: number;
  status: InvoiceStatus;
  cuNumber?: string;
  offlineQueued: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;    // e.g. 0.16 for 16%
  total: number;
}

export interface Payment {
  id: string;
  businessId: string;
  invoiceId?: string;
  amountKes: number;
  mpesaRef?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export type OnboardingStep = 'type' | 'pin' | 'mpesa' | 'kyc' | 'complete';

export interface OnboardingData {
  businessType?: 'sole_proprietor' | 'partnership' | 'limited_company';
  kraPin?: string;
  taxpayerName?: string;
  paybill?: string;
  paybillType?: 'paybill' | 'till';
  kycDocumentUrl?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardSummary {
  business: {
    id: string;
    name: string;
    kraPin: string;
    kycStatus: string;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    trend: number;
  };
  invoices: {
    total: number;
    pending: number;
    overdue: number;
  };
  payments: {
    todayCount: number;
    todayTotal: number;
  };
  tcc: {
    status: 'compliant' | 'warning' | 'lapsed';
    daysRemaining: number;
  };
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    date: string;
  }>;
}

// ─── TCC ─────────────────────────────────────────────────────────────────────

export interface TccStatus {
  status: 'compliant' | 'warning' | 'lapsed';
  expiryDate: string;
  daysRemaining: number;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
