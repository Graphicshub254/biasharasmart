// ─── WHT Constants ───────────────────────────────────────────────────────────
export const WHT_RATE = 0.05;              // 5% Withholding Tax rate
export const WHT_REMITTANCE_DAYS = 5;      // 5-day rolling window for KRA remittance
export const VAT_RATE_STANDARD = 0.16;     // 16% standard VAT
export const VAT_RATE_ZERO = 0;            // Zero-rated VAT

// ─── Payroll Constants (2026) ─────────────────────────────────────────────────
export const SHIF_RATE = 0.0275;           // 2.75% Social Health Insurance Fund
export const NSSF_TIER_1_MAX = 6000;       // NSSF Tier 1 ceiling
export const NSSF_TIER_2_MAX = 18000;      // NSSF Tier 2 ceiling
export const NSSF_TIER_1_RATE = 0.06;      // 6% on first KES 6,000
export const NSSF_TIER_2_RATE = 0.06;      // 6% on KES 6,001–18,000

// ─── Payment flow types ───────────────────────────────────────────────────────
export type PaymentMode = 'legacy' | 'gateway';
export type WhtStatus = 'pending' | 'escrowed' | 'remitted';
export type PaymentFlow = 'legacy' | 'gateway';

// ─── WHT Liability ────────────────────────────────────────────────────────────
export interface WhtLiability {
  id: string;
  businessId: string;
  paymentId?: string;
  amountKes: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

// ─── WHT Dashboard summary ────────────────────────────────────────────────────
export interface WhtSummary {
  totalPending: number;      // total KES owed to KRA
  overdueCount: number;      // count of overdue liabilities
  nextDueDate: string | null; // earliest due date
  paymentMode: PaymentMode;  // current business payment mode
}

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

export enum VatReturnStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
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
  paymentMode: PaymentMode;
  biaScore: number;
  coOpVirtualAccount?: string;
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

export interface VatReturn {
  id: string;
  businessId: string;
  periodMonth: number;
  periodYear: number;
  outputVatKes: number;
  inputVatKes: number;
  netVatKes: number;
  status: VatReturnStatus;
  gavaconnectAcknowledgement?: string;
  submittedAt?: string;
  createdAt: string;
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
  phoneNumber?: string;
  whtAmountKes: number;
  whtStatus: WhtStatus;
  paymentFlow: PaymentFlow;
  mpesaCode?: string;
  escrowRef?: string;
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
