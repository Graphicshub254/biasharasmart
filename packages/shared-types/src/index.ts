export interface Business {
  id: string;
  name: string;
  kraPin: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  businessId: string;
  customerId: string;
  invoiceNumber: string;
  amount: number;
  vatAmount: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  dueDate: Date;
  issuedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  amount: number;
  method: 'mpesa' | 'bank_transfer' | 'cash';
  reference: string;
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntry {
  id: string;
  businessId: string;
  type: 'debit' | 'credit';
  amount: number;
  account: string;
  description: string;
  entryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VATReturn {
  id: string;
  businessId: string;
  period: string; // e.g., "2024-03"
  salesAmount: number;
  inputVAT: number;
  outputVAT: number;
  payableVAT: number;
  status: 'draft' | 'submitted' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}
