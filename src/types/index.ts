export type ScreenType = 
  | 'home' 
  | 'money' 
  | 'knowledge' 
  | 'health' 
  | 'documents' 
  | 'action_pt';

export type MoneyActiveView = 'hub' | 'statements' | 'ledger' | 'analytics';

export type AuthMode = 'signin' | 'signup' | 'signed_out';

export type UITheme = 'dark' | 'sepia' | 'sage' | 'light' | 'high_contrast';
export type TextScale = 'normal' | 'large';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  memberSince: string;
}

export interface StatementCsvVaultItem {
  id: string; // e.g. csv_bank_1234
  statementId: string;
  entityName: string;
  category: 'bank' | 'upi' | 'credit_card';
  fileName: string;
  fileSize: string;
  recordsCount: number;
  totalCredit: number;
  totalDebit: number;
  csvContent: string;
  isSynced: boolean;
  savedAt: string;
}

export type BankAccountType = 
  | 'savings' 
  | 'current' 
  | 'salary' 
  | 'fd' 
  | 'rd' 
  | 'nre' 
  | 'nro' 
  | 'fcnr';

export interface BankStatement {
  id: string;
  bankName: string; // e.g. "SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "SIB"
  accountNumberMasked: string; // e.g. "•••• 4892"
  accountType?: BankAccountType; // Savings, Current, Salary, FD, RD, NRE, NRO, FCNR
  fileName: string;
  fileSize: string;
  uploadDate: string;
  period: string;
  transactionsCount: number;
  totalCredit: number;
  totalDebit: number;
  openingBalance: number;
  closingBalance: number;
  status: 'uploaded' | 'processed';
  parsedRecords?: NormalizedStatementRecord[];
  csvContent?: string;
  isSyncedToLedger?: boolean;
  syncedAt?: string;
}

export interface UpiStatement {
  id: string;
  upiApp: string; // e.g. "PhonePe", "Google Pay", "Paytm", "CRED"
  upiId: string; // e.g. "user@okhdfcbank"
  fileName: string;
  fileSize: string;
  uploadDate: string;
  period: string;
  transactionsCount: number;
  totalSpent: number;
  totalReceived: number;
  status: 'uploaded' | 'processed';
  parsedRecords?: NormalizedStatementRecord[];
  csvContent?: string;
  isSyncedToLedger?: boolean;
  syncedAt?: string;
}

export interface CreditCardStatement {
  id: string;
  cardName: string; // e.g. "HDFC Millennia", "SBI SimplyCLICK", "ICICI Amazon Pay", "Axis Magnus"
  cardNumberMasked: string; // e.g. "•••• 9102"
  fileName: string;
  fileSize: string;
  uploadDate: string;
  period: string;
  transactionsCount: number;
  totalSpends: number;
  totalPayments: number;
  creditLimit: number;
  availableLimit: number;
  status: 'uploaded' | 'processed';
  parsedRecords?: NormalizedStatementRecord[];
  csvContent?: string;
  isSyncedToLedger?: boolean;
  syncedAt?: string;
}

export interface PendingStatementReview {
  id: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  category: 'bank' | 'upi' | 'credit_card';
  detectedCategory: 'bank' | 'upi' | 'credit_card';
  entityName: string;
  accountOrIdMasked: string;
  period: string;
  transactionsCount: number;
  totalCredit: number;
  totalDebit: number;
  openingBalance?: number;
  closingBalance?: number;
  creditLimit?: number;
  previewRows?: Array<{
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    category?: string;
  }>;
  parsedRecords?: NormalizedStatementRecord[];
  rawContent?: string;
  isValidStatement: boolean;
  validationError?: string;
}

export interface NormalizedStatementRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM:SS or HH:MM
  description: string;
  receiverName?: string; // Payee / Merchant / Beneficiary
  senderName?: string; // Origin / Benefactor / Employer
  fromEntity?: string; // Explicit "FROM" origin
  toEntity?: string; // Explicit "TO" destination
  tag?: string; // Purpose of transaction (Food, Travel, Health, etc.)
  sourceType: 'bank' | 'upi' | 'credit_card';
  sourceEntity: string; // "SBI", "HDFC Bank", "PhonePe", "Google Pay", "HDFC Credit Card", "SBI Card"
  category: string;
  referenceNo: string;
  bankTxnNumber?: string;
  upiUtr?: string;
  referenceType?: 'UTR' | 'RRN' | 'UPI_REF' | 'IMPS' | 'CHQ' | 'DD' | 'AUDIT' | 'REF';
  referenceLabel?: string;
  debit: number;
  credit: number;
  netAmount: number;
  balance?: number;
  detectedLayout: string;
  isRepeatReduced?: boolean;
  repeatMatchId?: string;
  repeatReason?: string;
}

export interface FileTypeResult {
  fileType: 'csv' | 'pdf' | 'xlsx' | 'txt' | 'unknown';
  extension: string;
  formatLabel: string;
  mimeType: string;
  fileSizeFormatted: string;
  isDirectlyParseable: boolean;
}

export interface LayoutIdentificationResult {
  entityCategory: 'bank' | 'upi' | 'credit_card' | 'unknown';
  entityName: string;
  layoutName: string;
  confidenceScore: number; // 0 - 100
  delimiter: string;
  headerRowIndex: number;
  detectedHeaders: string[];
  columnMapping: ColumnMappingConfig;
  sampleRows: string[][];
  totalDataRows: number;
}

export interface ColumnMappingConfig {
  dateCol: string;
  descCol: string;
  timeCol?: string;
  debitCol?: string;
  creditCol?: string;
  amountCol?: string;
  typeCol?: string; // Dr / Cr
  refCol?: string;
  balanceCol?: string;
}

export interface Transaction {
  id: string;
  date: string;
  time?: string; // HH:MM:SS or HH:MM
  description: string;
  receiverName?: string; // Payee / Merchant / Beneficiary
  senderName?: string; // Origin / Benefactor / Employer
  fromEntity?: string; // Explicit "FROM" origin
  toEntity?: string; // Explicit "TO" destination
  tag: string; // Purpose: Food, Travel, Health, Shopping, Bills, etc.
  type: 'credit' | 'debit';
  amount: number;
  balance?: number; // Running closing balance from statement
  category: 
    | 'Food & Dining' 
    | 'Shopping' 
    | 'Groceries' 
    | 'Utilities & Bills' 
    | 'Investments' 
    | 'Salary & Income' 
    | 'Rent & Housing' 
    | 'Healthcare' 
    | 'Travel & Fuel' 
    | 'Transfer';
  sourceType: 'bank' | 'upi' | 'credit_card';
  sourceName: string; // "SBI", "PhonePe", "HDFC Credit Card", etc.
  referenceNo: string;
  bankTxnNumber?: string; // Bank cheque / ref / txn ID
  upiUtr?: string; // 12-digit UPI UTR / RRN
  referenceType?: 'UTR' | 'RRN' | 'UPI_REF' | 'IMPS' | 'CHQ' | 'DD' | 'AUDIT' | 'REF';
  referenceLabel?: string;
  isReconciledDuplicate?: boolean;
  isRepeatReduced?: boolean;
  repeatMatchId?: string;
  repeatReason?: string;
}

export interface CrossSourceSyncMatch {
  id: string;
  primaryTxnId: string;
  companionTxnId: string;
  primarySourceName: string;
  companionSourceName: string;
  date: string;
  amount: number;
  matchType: 'bank_upi_overlap' | 'bank_cc_settlement' | 'exact_duplicate';
  reason: string;
  isReduced: boolean;
}

export interface CategoryDraftCsvInfo {
  category: 'bank' | 'upi' | 'credit_card';
  title: string;
  fileName: string;
  recordsCount: number;
  totalCredit: number;
  totalDebit: number;
  csvContent: string;
  generatedAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  category: 'Finance' | 'Career' | 'Health' | 'Tech' | 'Personal';
  content: string;
  tags: string[];
  updatedAt: string;
  isPinned?: boolean;
}

export interface HealthMetric {
  waterMl: number;
  waterGoalMl: number;
  steps: number;
  stepsGoal: number;
  sleepHours: number;
  restingHeartRate: number;
  systolicBp: number;
  diastolicBp: number;
  weightKg: number;
  recentLogs: Array<{
    id: string;
    title: string;
    category: 'Vitals' | 'Workout' | 'Medication' | 'Lab Result';
    value: string;
    time: string;
  }>;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'Identity' | 'Financial' | 'Medical' | 'Vehicle' | 'Property';
  docNumber: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  expiryDate?: string;
  isVerified: boolean;
  notes?: string;
}

export interface ActionTask {
  id: string;
  title: string;
  project: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
  checklist: Array<{ id: string; text: string; completed: boolean }>;
}
