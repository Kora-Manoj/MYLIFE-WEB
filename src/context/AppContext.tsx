import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  ScreenType, 
  AuthMode, 
  BankStatement,
  BankAccountType, 
  UpiStatement, 
  CreditCardStatement,
  Transaction,
  NormalizedStatementRecord,
  ColumnMappingConfig,
  NoteItem,
  HealthMetric,
  DocumentItem,
  ActionTask,
  UITheme,
  TextScale,
  MoneyActiveView,
  PendingStatementReview,
  StatementCsvVaultItem,
  CrossSourceSyncMatch,
  CategoryDraftCsvInfo
} from '../types';
import {
  identifyFileType,
  identifyLayout,
  normalizeStatementData,
  extractTransactionsFromRawText,
  generateNormalizedCsvString,
  downloadCsvFile,
  deriveTransactionTag,
  generateCategoryDraftCsv,
  syncAndReduceRepeats,
  generateConsolidatedAllTransactionsCsv,
  isPaytmPlaceholder,
  cleanDeduplicatedText,
  SAMPLE_DATASETS
} from '../utils/statementProcessor';

interface AppContextType {
  // Theme & Accessibility for all types of eyes
  uiTheme: UITheme;
  setUiTheme: (theme: UITheme) => void;
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;
  isThemeModalOpen: boolean;
  setIsThemeModalOpen: (open: boolean) => void;
  isMobileTestOpen: boolean;
  setIsMobileTestOpen: (open: boolean) => void;

  // Auth state
  currentUser: User | null;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  signIn: (email: string, name?: string) => void;
  signUp: (name: string, email: string) => void;
  signOut: () => void;

  // Navigation
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;
  navigationHistory: ScreenType[];
  goBack: () => void;

  // View presentation mode
  viewMode: 'mobile' | 'desktop' | 'diagram';
  setViewMode: (mode: 'mobile' | 'desktop' | 'diagram') => void;

  // Money Management statements & active subview
  moneyActiveView: MoneyActiveView;
  setMoneyActiveView: (view: MoneyActiveView) => void;
  bankStatements: BankStatement[];
  upiStatements: UpiStatement[];
  creditCardStatements: CreditCardStatement[];
  transactions: Transaction[];
  deleteTransaction: (id: string) => void;
  updateTransactionTag: (id: string, newTag: string) => void;
  updateTransactionDetails: (id: string, updates: { tag?: string; senderName?: string; receiverName?: string }) => void;
  addBankStatement: (statement: Omit<BankStatement, 'id' | 'uploadDate' | 'status'>) => void;
  deleteBankStatement: (id: string) => void;
  updateBankAccountType: (id: string, accountType: BankAccountType) => void;
  addUpiStatement: (statement: Omit<UpiStatement, 'id' | 'uploadDate' | 'status'>) => void;
  deleteUpiStatement: (id: string) => void;
  addCreditCardStatement: (statement: Omit<CreditCardStatement, 'id' | 'uploadDate' | 'status'>) => void;
  deleteCreditCardStatement: (id: string) => void;
  classifyAndAddStatement: (fileName: string, content?: string, fileSizeStr?: string) => { category: 'bank' | 'upi' | 'credit_card'; name: string; id: string };
  classifyUploadedFile: (fileName: string, content?: string, fileSizeStr?: string) => PendingStatementReview;
  confirmPendingStatement: (item: PendingStatementReview, processImmediately?: boolean) => void;
  confirmMultiplePendingStatements: (items: PendingStatementReview[], processImmediately?: boolean) => void;
  reclassifyStatement: (id: string, fromCategory: 'bank' | 'upi' | 'credit_card', toCategory: 'bank' | 'upi' | 'credit_card') => void;
  processAllStatements: () => void;
  clearAllStatements: () => void;
  isProcessing: boolean;
  statementsProcessed: boolean;

  // Normalization dataset & CSV export for feature use
  normalizedDataset: NormalizedStatementRecord[];
  normalizedCsvString: string;
  downloadNormalizedCsv: () => void;
  ingestUserCsv: (csvContent: string, fileName: string, customMapping?: ColumnMappingConfig) => { success: boolean; recordsCount: number; message: string };

  // 3-Tier CSV Architecture & Cross-Source Sync Pipeline
  getCategoryDraftCsv: (category: 'bank' | 'upi' | 'credit_card') => CategoryDraftCsvInfo;
  downloadCategoryDraftCsv: (category: 'bank' | 'upi' | 'credit_card') => void;
  downloadConsolidatedAllTransactionsCsv: () => void;
  crossSourceMatches: CrossSourceSyncMatch[];
  showReducedRepeats: boolean;
  setShowReducedRepeats: (show: boolean) => void;

  // Separate Statement CSV Vault & On-Demand Synchronization
  csvVaultItems: StatementCsvVaultItem[];
  isCsvVaultOpen: boolean;
  setIsCsvVaultOpen: (open: boolean) => void;
  downloadSingleStatementCsv: (statementId: string) => void;
  syncStatementCsvs: (selectedStatementIds?: string[]) => void;
  toggleStatementCsvSync: (statementId: string) => void;

  // Drawers / review modals triggered by the down-arrow as specified in draw.io
  isBankReviewOpen: boolean;
  setIsBankReviewOpen: (open: boolean) => void;
  isUpiReviewOpen: boolean;
  setIsUpiReviewOpen: (open: boolean) => void;
  isCreditCardReviewOpen: boolean;
  setIsCreditCardReviewOpen: (open: boolean) => void;

  // Knowledge base state
  notes: NoteItem[];
  addNote: (note: Omit<NoteItem, 'id' | 'updatedAt'>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  // Health state
  healthMetric: HealthMetric;
  addWater: (amountMl: number) => void;
  logHealthEntry: (title: string, category: 'Vitals' | 'Workout' | 'Medication' | 'Lab Result', value: string) => void;

  // Documents state
  documents: DocumentItem[];
  addDocument: (doc: Omit<DocumentItem, 'id' | 'uploadedAt'>) => void;
  deleteDocument: (id: string) => void;

  // Action P&T state
  tasks: ActionTask[];
  addTask: (task: Omit<ActionTask, 'id'>) => void;
  toggleTaskStatus: (id: string) => void;
  toggleChecklistItem: (taskId: string, checklistId: string) => void;
  deleteTask: (id: string) => void;

  // Reset demo data helper
  resetAllData: () => void;
}

const defaultUser: User = {
  id: 'usr_001',
  name: 'Manoj Kumar',
  email: 'koramanojkumar15720@gmail.com',
  memberSince: 'March 2026'
};

const initialBankStatements: BankStatement[] = [];
const initialUpiStatements: UpiStatement[] = [];
const initialCreditCardStatements: CreditCardStatement[] = [];
const initialTransactions: Transaction[] = [];

const initialNotes: NoteItem[] = [
  {
    id: 'note_01',
    title: 'Tax Saving 80C & Health Insurance Checklist FY 26-27',
    category: 'Finance',
    content: 'Review ELSS allocations (max ₹1.5L), National Pension Scheme (₹50k under 80CCD), and verify Section 80D medical policy receipts before March 31.',
    tags: ['Taxes', '80C', 'Finance'],
    updatedAt: '24 Sep 2026',
    isPinned: true
  },
  {
    id: 'note_02',
    title: 'MYLIFE Architecture V:1 Notes',
    category: 'Tech',
    content: 'User flow hierarchy: Auth (Sign In, Up, Out) -> Home Page (MM, KB, HM, DM, Action P&T) -> Money Management includes Bank and UPI statement upload with down-arrow list review drawers.',
    tags: ['Architecture', 'System Design'],
    updatedAt: '24 Sep 2026',
    isPinned: true
  },
  {
    id: 'note_03',
    title: 'Morning Routine & Vitals Benchmark',
    category: 'Health',
    content: 'Target 8,000 steps daily. Drink 3000ml water. Record resting blood pressure twice weekly.',
    tags: ['Wellness', 'Routine'],
    updatedAt: '22 Sep 2026'
  }
];

const initialHealth: HealthMetric = {
  waterMl: 1750,
  waterGoalMl: 3000,
  steps: 6420,
  stepsGoal: 10000,
  sleepHours: 7.5,
  restingHeartRate: 68,
  systolicBp: 118,
  diastolicBp: 78,
  weightKg: 72.4,
  recentLogs: [
    { id: 'hl_1', title: 'Morning Cardio Walk', category: 'Workout', value: '4.2 km (48 mins)', time: '07:30 AM' },
    { id: 'hl_2', title: 'Blood Pressure Check', category: 'Vitals', value: '118/78 mmHg', time: '08:15 AM' },
    { id: 'hl_3', title: 'Multivitamin + Omega 3', category: 'Medication', value: '1 Capsule taken', time: '09:00 AM' }
  ]
};

const initialDocuments: DocumentItem[] = [
  {
    id: 'doc_aadhaar',
    title: 'Aadhaar Card (National ID)',
    category: 'Identity',
    docNumber: 'XXXX-XXXX-4819',
    fileName: 'eAadhaar_PasswordProtected.pdf',
    fileSize: '1.8 MB',
    uploadedAt: '12 Jan 2026',
    isVerified: true,
    notes: 'Official UIDAI downloaded copy with digital signature'
  },
  {
    id: 'doc_pan',
    title: 'Permanent Account Number (PAN)',
    category: 'Financial',
    docNumber: 'ABCDE1234F',
    fileName: 'ePAN_Manoj_Kumar.pdf',
    fileSize: '640 KB',
    uploadedAt: '12 Jan 2026',
    isVerified: true
  },
  {
    id: 'doc_dl',
    title: 'Driving License (LMV & MCWG)',
    category: 'Identity',
    docNumber: 'DL-0420180019284',
    fileName: 'Driving_License_DigiLocker.pdf',
    fileSize: '950 KB',
    uploadedAt: '15 Feb 2026',
    expiryDate: '20 Nov 2032',
    isVerified: true
  },
  {
    id: 'doc_health_ins',
    title: 'HDFC ERGO Health Suraksha Policy',
    category: 'Medical',
    docNumber: 'POL-99201948',
    fileName: 'Health_Insurance_Schedule_2026.pdf',
    fileSize: '2.4 MB',
    uploadedAt: '01 Jan 2026',
    expiryDate: '31 Dec 2026',
    isVerified: true,
    notes: 'Sum Insured ₹10,00,000 + Super Top-up'
  }
];

const initialTasks: ActionTask[] = [
  {
    id: 'task_01',
    title: 'Review SBI & PhonePe statement reconciliations',
    project: 'Financial Audit',
    priority: 'High',
    status: 'in_progress',
    dueDate: 'Today',
    checklist: [
      { id: 'c1', text: 'Upload February SBI PDF statement', completed: true },
      { id: 'c2', text: 'Verify PhonePe UPI merchant breakdown', completed: true },
      { id: 'c3', text: 'Confirm monthly rent NEFT debit', completed: false }
    ]
  },
  {
    id: 'task_02',
    title: 'Complete annual medical blood panel & lipid profile',
    project: 'Health 2026',
    priority: 'Medium',
    status: 'todo',
    dueDate: '28 Sep 2026',
    checklist: [
      { id: 'c4', text: 'Schedule fasting slot with lab', completed: true },
      { id: 'c5', text: 'Upload reports to Document Vault', completed: false }
    ]
  },
  {
    id: 'task_03',
    title: 'Synthesize product roadmap notes in Knowledge Base',
    project: 'Personal Development',
    priority: 'Low',
    status: 'completed',
    dueDate: 'Yesterday',
    checklist: [
      { id: 'c6', text: 'Draft system architecture diagram', completed: true },
      { id: 'c7', text: 'Organize into searchable tags', completed: true }
    ]
  }
];

// Safe storage helpers to prevent Uncaught DOMException (QuotaExceededError or SecurityError)
const safeGetStorage = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch {
    return fallback;
  }
};

const safeGetRawStorage = (key: string, fallback = ''): string => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const safeSetStorage = (key: string, value: any): boolean => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, str);
    return true;
  } catch (err: any) {
    console.warn(`Safe storage write failed for ${key} (storage quota or restriction):`, err);
    // If quota exceeded, attempt freeing space from large non-essential cached CSV strings
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      try {
        window.localStorage.removeItem('m_app_normalized_csv');
        window.localStorage.removeItem('m_app_normalized_dataset');
      } catch {}
    }
    return false;
  }
};

const safeRemoveStorage = (key: string) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {}
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme & Accessibility for all types of eyes
  const [uiTheme, setUiTheme] = useState<UITheme>(() => {
    return (safeGetRawStorage('m_app_theme', 'dark') as UITheme) || 'dark';
  });

  const [textScale, setTextScale] = useState<TextScale>(() => {
    return (safeGetRawStorage('m_app_text_scale', 'normal') as TextScale) || 'normal';
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isMobileTestOpen, setIsMobileTestOpen] = useState(false);

  // Persistence with localStorage fallback
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return safeGetStorage<User | null>('m_app_user', defaultUser);
  });

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [activeScreen, setActiveScreen] = useState<ScreenType>('home');
  const [navigationHistory, setNavigationHistory] = useState<ScreenType[]>(['home']);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop' | 'diagram'>('mobile');
  const [moneyActiveView, setMoneyActiveView] = useState<MoneyActiveView>('hub');

  // Statements
  const [bankStatements, setBankStatements] = useState<BankStatement[]>(() => {
    const parsed = safeGetStorage<BankStatement[]>('m_app_bank_statements', []);
    return Array.isArray(parsed) ? parsed.filter(s => s.id !== 'bank_sbi_01' && s.id !== 'bank_hdfc_02') : [];
  });

  const [upiStatements, setUpiStatements] = useState<UpiStatement[]>(() => {
    const parsed = safeGetStorage<UpiStatement[]>('m_app_upi_statements', []);
    return Array.isArray(parsed) ? parsed.filter(s => s.id !== 'upi_phonepe_01' && s.id !== 'upi_gpay_02') : [];
  });

  const [creditCardStatements, setCreditCardStatements] = useState<CreditCardStatement[]>(() => {
    const parsed = safeGetStorage<CreditCardStatement[]>('m_app_cc_statements', []);
    return Array.isArray(parsed) ? parsed.filter(s => s.id !== 'cc_hdfc_01' && s.id !== 'cc_sbi_02') : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const parsed = safeGetStorage<Transaction[]>('m_app_transactions', []);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(t => !t.id.startsWith('tx_0') && !t.id.startsWith('tx_10'))
      .map(t => {
        let desc = cleanDeduplicatedText(t.description || '');
        if (isPaytmPlaceholder(desc)) desc = t.type === 'credit' ? 'Money Received' : 'UPI Payment';
        let rec = t.receiverName ? cleanDeduplicatedText(t.receiverName) : undefined;
        if (rec && isPaytmPlaceholder(rec)) rec = undefined;
        return {
          ...t,
          description: desc,
          receiverName: rec
        };
      });
  });

  const [normalizedDataset, setNormalizedDataset] = useState<NormalizedStatementRecord[]>(() => {
    const parsed = safeGetStorage<NormalizedStatementRecord[]>('m_app_normalized_dataset', []);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(r => {
      let desc = cleanDeduplicatedText(r.description || '');
      if (isPaytmPlaceholder(desc)) desc = r.credit > 0 ? 'Money Received' : 'UPI Payment';
      let rec = r.receiverName ? cleanDeduplicatedText(r.receiverName) : undefined;
      if (rec && isPaytmPlaceholder(rec)) rec = undefined;
      return {
        ...r,
        description: desc,
        receiverName: rec
      };
    });
  });

  const [normalizedCsvString, setNormalizedCsvString] = useState<string>(() => {
    return safeGetRawStorage('m_app_normalized_csv', '');
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [statementsProcessed, setStatementsProcessed] = useState(false);

  // Separate Statement CSV Vault (independent CSV stored per statement)
  const [csvVaultItems, setCsvVaultItems] = useState<StatementCsvVaultItem[]>(() => {
    return safeGetStorage<StatementCsvVaultItem[]>('m_app_csv_vault', []);
  });
  const [isCsvVaultOpen, setIsCsvVaultOpen] = useState(false);

  // Cross-Source Sync Matches and Repeat Reduction display state
  const [crossSourceMatches, setCrossSourceMatches] = useState<CrossSourceSyncMatch[]>([]);
  const [showReducedRepeats, setShowReducedRepeats] = useState<boolean>(false);

  // Down-arrow triggered drawers
  const [isBankReviewOpen, setIsBankReviewOpen] = useState(false);
  const [isUpiReviewOpen, setIsUpiReviewOpen] = useState(false);
  const [isCreditCardReviewOpen, setIsCreditCardReviewOpen] = useState(false);

  // Other modules
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    return safeGetStorage<NoteItem[]>('m_app_notes', initialNotes);
  });

  const [healthMetric, setHealthMetric] = useState<HealthMetric>(() => {
    return safeGetStorage<HealthMetric>('m_app_health', initialHealth);
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    return safeGetStorage<DocumentItem[]>('m_app_docs', initialDocuments);
  });

  const [tasks, setTasks] = useState<ActionTask[]>(() => {
    return safeGetStorage<ActionTask[]>('m_app_tasks', initialTasks);
  });

  // Sync safely to storage
  useEffect(() => {
    safeSetStorage('m_app_user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    safeSetStorage('m_app_bank_statements', bankStatements);
  }, [bankStatements]);

  useEffect(() => {
    safeSetStorage('m_app_upi_statements', upiStatements);
  }, [upiStatements]);

  useEffect(() => {
    safeSetStorage('m_app_cc_statements', creditCardStatements);
  }, [creditCardStatements]);

  useEffect(() => {
    safeSetStorage('m_app_normalized_dataset', normalizedDataset);
  }, [normalizedDataset]);

  useEffect(() => {
    safeSetStorage('m_app_normalized_csv', normalizedCsvString);
  }, [normalizedCsvString]);

  useEffect(() => {
    safeSetStorage('m_app_csv_vault', csvVaultItems);
  }, [csvVaultItems]);

  useEffect(() => {
    safeSetStorage('m_app_transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    safeSetStorage('m_app_notes', notes);
  }, [notes]);

  useEffect(() => {
    safeSetStorage('m_app_health', healthMetric);
  }, [healthMetric]);

  useEffect(() => {
    safeSetStorage('m_app_docs', documents);
  }, [documents]);

  useEffect(() => {
    safeSetStorage('m_app_tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    safeSetStorage('m_app_theme', uiTheme);
  }, [uiTheme]);

  useEffect(() => {
    safeSetStorage('m_app_text_scale', textScale);
  }, [textScale]);

  const changeActiveScreen = (screen: ScreenType) => {
    setNavigationHistory(prev => [...prev, screen]);
    setActiveScreen(screen);
  };

  const goBack = () => {
    if (activeScreen === 'money' && moneyActiveView !== 'hub') {
      setMoneyActiveView('hub');
      return;
    }
    if (navigationHistory.length > 1) {
      const nextHistory = [...navigationHistory];
      nextHistory.pop();
      const previousScreen = nextHistory[nextHistory.length - 1];
      setNavigationHistory(nextHistory);
      setActiveScreen(previousScreen);
    } else {
      setActiveScreen('home');
    }
  };

  // Auth actions
  const signIn = (email: string, name?: string) => {
    const user: User = {
      id: `usr_${Date.now()}`,
      name: name || (email.split('@')[0].replace(/[\._]/g, ' ') || 'Manoj Kumar'),
      email,
      memberSince: 'September 2026'
    };
    setCurrentUser(user);
    setActiveScreen('home');
  };

  const signUp = (name: string, email: string) => {
    const user: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      memberSince: 'September 2026'
    };
    setCurrentUser(user);
    setActiveScreen('home');
  };

  const signOut = () => {
    setCurrentUser(null);
    setAuthMode('signed_out');
  };

  // Money management actions
  const addBankStatement = (statement: Omit<BankStatement, 'id' | 'uploadDate' | 'status'>) => {
    const newStmt: BankStatement = {
      ...statement,
      id: `bank_${Date.now()}`,
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'uploaded'
    };
    setBankStatements(prev => [newStmt, ...prev]);
  };

  const deleteBankStatement = (id: string) => {
    const stmt = bankStatements.find(s => s.id === id);
    setBankStatements(prev => prev.filter(s => s.id !== id));
    setCsvVaultItems(prev => prev.filter(v => v.statementId !== id));
    if (stmt) {
      setTransactions(prev => prev.filter(t => !(t.sourceType === 'bank' && t.sourceName === stmt.bankName)));
    }
  };

  const updateBankAccountType = (id: string, accountType: BankAccountType) => {
    setBankStatements(prev => prev.map(s => s.id === id ? { ...s, accountType } : s));
  };

  const addUpiStatement = (statement: Omit<UpiStatement, 'id' | 'uploadDate' | 'status'>) => {
    const newStmt: UpiStatement = {
      ...statement,
      id: `upi_${Date.now()}`,
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'uploaded'
    };
    setUpiStatements(prev => [newStmt, ...prev]);
  };

  const deleteUpiStatement = (id: string) => {
    const stmt = upiStatements.find(s => s.id === id);
    setUpiStatements(prev => prev.filter(s => s.id !== id));
    setCsvVaultItems(prev => prev.filter(v => v.statementId !== id));
    if (stmt) {
      setTransactions(prev => prev.filter(t => !(t.sourceType === 'upi' && t.sourceName === stmt.upiApp)));
    }
  };

  const addCreditCardStatement = (statement: Omit<CreditCardStatement, 'id' | 'uploadDate' | 'status'>) => {
    const newStmt: CreditCardStatement = {
      ...statement,
      id: `cc_${Date.now()}`,
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'uploaded'
    };
    setCreditCardStatements(prev => [newStmt, ...prev]);
  };

  const deleteCreditCardStatement = (id: string) => {
    const stmt = creditCardStatements.find(s => s.id === id);
    setCreditCardStatements(prev => prev.filter(s => s.id !== id));
    setCsvVaultItems(prev => prev.filter(v => v.statementId !== id));
    if (stmt) {
      setTransactions(prev => prev.filter(t => !(t.sourceType === 'credit_card' && t.sourceName === stmt.cardName)));
    }
  };

  /**
   * AUTOMATED BACKEND CLASSIFIER
   * Automatically identifies whether an uploaded file is a Bank Statement,
   * UPI Statement, or Credit Card Statement, and prepares a detailed review item
   * so the user has the chance to review before processing.
   */
  const classifyUploadedFile = (
    fileName: string,
    content?: string,
    fileSizeStr?: string
  ): PendingStatementReview => {
    const size = fileSizeStr || '1.1 MB';
    const lowerName = fileName.toLowerCase();
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // 1. Extension check: reject non-document formats (images, audio, video, code, archives)
    const invalidExtensions = [
      'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico',
      'mp3', 'mp4', 'wav', 'avi', 'mov', 'mkv',
      'zip', 'tar', 'gz', 'rar', '7z',
      'exe', 'sh', 'bat', 'bin', 'dll',
      'py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'yaml', 'yml'
    ];

    if (invalidExtensions.includes(extension)) {
      return {
        id: `invalid_${Date.now()}`,
        fileName,
        fileSize: size,
        uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        category: 'bank',
        detectedCategory: 'bank',
        entityName: 'Unrecognized File Format',
        accountOrIdMasked: 'N/A',
        period: 'N/A',
        transactionsCount: 0,
        totalCredit: 0,
        totalDebit: 0,
        openingBalance: 0,
        closingBalance: 0,
        isValidStatement: false,
        validationError: `"${fileName}" is an unsupported file format (${extension.toUpperCase()}). Please upload a Bank, UPI, or Credit Card statement in CSV, PDF, XLSX, or TXT format.`
      };
    }

    // 2. Empty Content check
    if (!content || content.trim().length === 0) {
      return {
        id: `empty_${Date.now()}`,
        fileName,
        fileSize: size,
        uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        category: 'bank',
        detectedCategory: 'bank',
        entityName: 'Empty File',
        accountOrIdMasked: 'N/A',
        period: 'N/A',
        transactionsCount: 0,
        totalCredit: 0,
        totalDebit: 0,
        openingBalance: 0,
        closingBalance: 0,
        isValidStatement: false,
        validationError: `"${fileName}" is empty or no readable content could be extracted.`
      };
    }

    // 3. Financial Content Inspection
    let detectedCategory: 'bank' | 'upi' | 'credit_card' | 'unknown' = 'unknown';
    let entityName = '';
    let validRecords: NormalizedStatementRecord[] = [];

    try {
      const layout = identifyLayout(content, fileName);
      if (layout && layout.entityCategory && layout.entityCategory !== 'unknown') {
        detectedCategory = layout.entityCategory;
        entityName = layout.entityName;
      }

      const records = normalizeStatementData(content, layout, undefined, layout.entityName);
      if (records && records.length > 0) {
        // Filter strictly to valid monetary records with genuine dates
        validRecords = records.filter(r => (r.debit > 0 || r.credit > 0) && r.date);
      }

      // If regular layout detection found no valid records, attempt deep pattern recognition scanner
      if (validRecords.length === 0) {
        const fallback = extractTransactionsFromRawText(
          content,
          entityName || 'Statement',
          detectedCategory === 'unknown' ? 'bank' : detectedCategory
        );
        if (fallback && fallback.length > 0) {
          validRecords = fallback.filter(r => (r.debit > 0 || r.credit > 0) && r.date);
        }
      }
    } catch (e) {
      console.warn('Statement parsing error:', e);
    }

    // STRICT REJECTION OF UNRELATED / NON-STATEMENT FILES (NO MADE-UP NUMBERS)
    if (validRecords.length === 0) {
      return {
        id: `unrelated_${Date.now()}`,
        fileName,
        fileSize: size,
        uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        category: 'bank',
        detectedCategory: 'bank',
        entityName: 'Unrecognized Data File',
        accountOrIdMasked: 'N/A',
        period: 'N/A',
        transactionsCount: 0,
        totalCredit: 0,
        totalDebit: 0,
        openingBalance: 0,
        closingBalance: 0,
        isValidStatement: false,
        validationError: `"${fileName}" could not be recognized as a financial statement. No transaction dates, narration, or debit/credit amounts were found.`
      };
    }

    // 4. VALID STATEMENT WITH REAL PARSED TRANSACTIONS
    const parsedTxs = validRecords.length;
    const sumCredit = validRecords.reduce((s, r) => s + (r.credit || 0), 0);
    const sumDebit = validRecords.reduce((s, r) => s + (r.debit || 0), 0);

    const isCard = /(card|credit|visa|mastercard|amex|coral|millennia|regalia|simplyclick|bill|due|statement_cc)/i.test(lowerName) ||
                   /(credit card|card number|minimum amount due|total due|billing cycle)/i.test(content);
    const isUpi = /(upi|phonepe|gpay|googlepay|paytm|cred|bhim|vpa)/i.test(lowerName) ||
                  /(upi id|paid to|received from|upi ref|google pay|phonepe|paytm)/i.test(content);

    if (detectedCategory === 'unknown') {
      if (isCard) detectedCategory = 'credit_card';
      else if (isUpi) detectedCategory = 'upi';
      else detectedCategory = 'bank';
    }

    const newId = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const uploadDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Derive real period from dates in records
    const sortedDates = [...validRecords].map(r => r.date).filter(Boolean).sort();
    const period = sortedDates.length > 0 ? `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}` : 'Statement Period';

    // Preview rows (sample of real extracted transactions)
    const previewRows = validRecords.slice(0, 8).map(r => ({
      date: r.date,
      description: r.description,
      amount: r.debit > 0 ? r.debit : r.credit,
      type: (r.credit > 0 ? 'credit' : 'debit') as 'credit' | 'debit',
      category: r.category
    }));

    // Real balances (from statement if present, otherwise 0)
    const firstBal = validRecords[0]?.balance;
    const lastBal = validRecords[validRecords.length - 1]?.balance;
    const openingBalance = firstBal !== undefined ? Math.round(firstBal - validRecords[0].credit + validRecords[0].debit) : 0;
    const closingBalance = lastBal !== undefined ? Math.round(lastBal) : Math.round(openingBalance + sumCredit - sumDebit);

    if (detectedCategory === 'credit_card') {
      let cardName = entityName;
      if (!cardName || cardName === 'Custom Statement' || cardName === 'Credit Card Statement') {
        if (/hdfc/i.test(lowerName)) cardName = 'HDFC Credit Card';
        else if (/sbi/i.test(lowerName)) cardName = 'SBI Credit Card';
        else if (/icici/i.test(lowerName)) cardName = 'ICICI Credit Card';
        else if (/axis/i.test(lowerName)) cardName = 'Axis Credit Card';
        else cardName = `Credit Card (${fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')})`;
      }

      return {
        id: newId,
        fileName,
        fileSize: size,
        uploadDate,
        category: 'credit_card',
        detectedCategory: 'credit_card',
        entityName: cardName,
        accountOrIdMasked: 'Credit Card',
        period,
        transactionsCount: parsedTxs,
        totalCredit: sumCredit,
        totalDebit: sumDebit,
        creditLimit: 0,
        previewRows,
        parsedRecords: validRecords,
        rawContent: content,
        isValidStatement: true
      };
    } else if (detectedCategory === 'upi') {
      let upiApp = entityName;
      if (!upiApp || upiApp === 'Custom Statement' || upiApp === 'UPI Provider Export') {
        if (/phonepe/i.test(lowerName)) upiApp = 'PhonePe';
        else if (/gpay|google/i.test(lowerName)) upiApp = 'Google Pay';
        else if (/paytm/i.test(lowerName)) upiApp = 'Paytm';
        else if (/cred/i.test(lowerName)) upiApp = 'CRED';
        else upiApp = `UPI (${fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')})`;
      }

      return {
        id: newId,
        fileName,
        fileSize: size,
        uploadDate,
        category: 'upi',
        detectedCategory: 'upi',
        entityName: upiApp,
        accountOrIdMasked: 'UPI / VPA',
        period,
        transactionsCount: parsedTxs,
        totalCredit: sumCredit,
        totalDebit: sumDebit,
        previewRows,
        parsedRecords: validRecords,
        rawContent: content,
        isValidStatement: true
      };
    } else {
      let bankName = entityName;
      if (!bankName || bankName === 'Custom Statement' || bankName === 'Bank Passbook / Ledger') {
        if (/sbi/i.test(lowerName)) bankName = 'State Bank of India (SBI)';
        else if (/hdfc/i.test(lowerName)) bankName = 'HDFC Bank Ltd';
        else if (/icici/i.test(lowerName)) bankName = 'ICICI Bank';
        else if (/axis/i.test(lowerName)) bankName = 'Axis Bank Ltd';
        else if (/kotak/i.test(lowerName)) bankName = 'Kotak Mahindra Bank';
        else bankName = `Bank (${fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')})`;
      }

      return {
        id: newId,
        fileName,
        fileSize: size,
        uploadDate,
        category: 'bank',
        detectedCategory: 'bank',
        entityName: bankName,
        accountOrIdMasked: 'Bank Account',
        period,
        transactionsCount: parsedTxs,
        totalCredit: sumCredit,
        totalDebit: sumDebit,
        openingBalance,
        closingBalance,
        previewRows,
        parsedRecords: validRecords,
        rawContent: content,
        isValidStatement: true
      };
    }
  };

  /**
   * Helper to create or update a separate CSV vault entry for an individual statement
   * Keeping a single CSV is risky, so every statement gets an independent isolated CSV.
   */
  const saveSeparateStatementCsv = (
    statementId: string,
    entityName: string,
    category: 'bank' | 'upi' | 'credit_card',
    fileName: string,
    fileSize: string,
    records: NormalizedStatementRecord[],
    isSynced = false
  ): StatementCsvVaultItem => {
    const csvContent = generateNormalizedCsvString(records);
    const totalCredit = records.reduce((s, r) => s + (r.credit || 0), 0);
    const totalDebit = records.reduce((s, r) => s + (r.debit || 0), 0);
    const savedAt = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const vaultItem: StatementCsvVaultItem = {
      id: `csv_${statementId}`,
      statementId,
      entityName,
      category,
      fileName,
      fileSize,
      recordsCount: records.length,
      totalCredit,
      totalDebit,
      csvContent,
      isSynced,
      savedAt
    };

    setCsvVaultItems(prev => {
      const filtered = prev.filter(item => item.statementId !== statementId);
      return [vaultItem, ...filtered];
    });

    return vaultItem;
  };

  /**
   * CONFIRM PENDING STATEMENT AFTER USER REVIEW
   * Places statement into Bank, UPI, or Credit Card lists based on reviewed choices
   * and saves an independent isolated CSV for zero data risk.
   */
  const confirmPendingStatement = (
    item: PendingStatementReview,
    processImmediately = false
  ) => {
    if (!item.isValidStatement) {
      console.warn('Cannot confirm unrecognized or invalid statement file:', item.fileName);
      return;
    }
    const uploadDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const finalId = `${item.category}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const statementCsv = item.parsedRecords ? generateNormalizedCsvString(item.parsedRecords) : '';

    // Save isolated separate CSV in Vault
    saveSeparateStatementCsv(
      finalId,
      item.entityName,
      item.category,
      item.fileName,
      item.fileSize,
      item.parsedRecords || [],
      processImmediately
    );

    if (item.category === 'credit_card') {
      const newCardStmt: CreditCardStatement = {
        id: finalId,
        cardName: item.entityName,
        cardNumberMasked: item.accountOrIdMasked,
        fileName: item.fileName,
        fileSize: item.fileSize,
        uploadDate,
        period: item.period,
        transactionsCount: item.transactionsCount,
        totalSpends: item.totalDebit,
        totalPayments: item.totalCredit,
        creditLimit: item.creditLimit || 0,
        availableLimit: item.creditLimit ? item.creditLimit - item.totalDebit : 0,
        status: processImmediately ? 'processed' : 'uploaded',
        parsedRecords: item.parsedRecords,
        csvContent: statementCsv,
        isSyncedToLedger: processImmediately
      };
      setCreditCardStatements(prev => [newCardStmt, ...prev]);
    } else if (item.category === 'upi') {
      const newUpiStmt: UpiStatement = {
        id: finalId,
        upiApp: item.entityName,
        upiId: item.accountOrIdMasked,
        fileName: item.fileName,
        fileSize: item.fileSize,
        uploadDate,
        period: item.period,
        transactionsCount: item.transactionsCount,
        totalSpent: item.totalDebit,
        totalReceived: item.totalCredit,
        status: processImmediately ? 'processed' : 'uploaded',
        parsedRecords: item.parsedRecords,
        csvContent: statementCsv,
        isSyncedToLedger: processImmediately
      };
      setUpiStatements(prev => [newUpiStmt, ...prev]);
    } else {
      const newBankStmt: BankStatement = {
        id: finalId,
        bankName: item.entityName,
        accountNumberMasked: item.accountOrIdMasked,
        fileName: item.fileName,
        fileSize: item.fileSize,
        uploadDate,
        period: item.period,
        transactionsCount: item.transactionsCount,
        totalCredit: item.totalCredit,
        totalDebit: item.totalDebit,
        openingBalance: item.openingBalance || 0,
        closingBalance: item.closingBalance || (item.totalCredit - item.totalDebit),
        status: processImmediately ? 'processed' : 'uploaded',
        parsedRecords: item.parsedRecords,
        csvContent: statementCsv,
        isSyncedToLedger: processImmediately
      };
      setBankStatements(prev => [newBankStmt, ...prev]);
    }

    setStatementsProcessed(false);

    if (processImmediately) {
      setTimeout(() => {
        processAllStatements();
      }, 50);
    }
  };

  /**
   * CONFIRM MULTIPLE PENDING STATEMENTS IN ONE BATCH
   * Generates and stores separate CSV for each confirmed statement.
   */
  const confirmMultiplePendingStatements = (
    items: PendingStatementReview[],
    processImmediately = false
  ) => {
    const validItems = items.filter(it => it.isValidStatement);
    if (validItems.length === 0) return;

    const uploadDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newBankStmts: BankStatement[] = [];
    const newUpiStmts: UpiStatement[] = [];
    const newCardStmts: CreditCardStatement[] = [];

    validItems.forEach(item => {
      const finalId = `${item.category}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const statementCsv = item.parsedRecords ? generateNormalizedCsvString(item.parsedRecords) : '';

      // Save independent separate CSV into Vault
      saveSeparateStatementCsv(
        finalId,
        item.entityName,
        item.category,
        item.fileName,
        item.fileSize,
        item.parsedRecords || [],
        processImmediately
      );

      if (item.category === 'credit_card') {
        newCardStmts.push({
          id: finalId,
          cardName: item.entityName,
          cardNumberMasked: item.accountOrIdMasked,
          fileName: item.fileName,
          fileSize: item.fileSize,
          uploadDate,
          period: item.period,
          transactionsCount: item.transactionsCount,
          totalSpends: item.totalDebit,
          totalPayments: item.totalCredit,
          creditLimit: item.creditLimit || 0,
          availableLimit: item.creditLimit ? item.creditLimit - item.totalDebit : 0,
          status: processImmediately ? 'processed' : 'uploaded',
          parsedRecords: item.parsedRecords,
          csvContent: statementCsv,
          isSyncedToLedger: processImmediately
        });
      } else if (item.category === 'upi') {
        newUpiStmts.push({
          id: finalId,
          upiApp: item.entityName,
          upiId: item.accountOrIdMasked,
          fileName: item.fileName,
          fileSize: item.fileSize,
          uploadDate,
          period: item.period,
          transactionsCount: item.transactionsCount,
          totalSpent: item.totalDebit,
          totalReceived: item.totalCredit,
          status: processImmediately ? 'processed' : 'uploaded',
          parsedRecords: item.parsedRecords,
          csvContent: statementCsv,
          isSyncedToLedger: processImmediately
        });
      } else {
        newBankStmts.push({
          id: finalId,
          bankName: item.entityName,
          accountNumberMasked: item.accountOrIdMasked,
          fileName: item.fileName,
          fileSize: item.fileSize,
          uploadDate,
          period: item.period,
          transactionsCount: item.transactionsCount,
          totalCredit: item.totalCredit,
          totalDebit: item.totalDebit,
          openingBalance: item.openingBalance || 0,
          closingBalance: item.closingBalance || (item.totalCredit - item.totalDebit),
          status: processImmediately ? 'processed' : 'uploaded',
          parsedRecords: item.parsedRecords,
          csvContent: statementCsv,
          isSyncedToLedger: processImmediately
        });
      }
    });

    setBankStatements(prev => [...newBankStmts, ...prev]);
    setUpiStatements(prev => [...newUpiStmts, ...prev]);
    setCreditCardStatements(prev => [...newCardStmts, ...prev]);

    if (processImmediately) {
      const allRecords: NormalizedStatementRecord[] = [];

      // Collect records from newly confirmed statements
      validItems.forEach(item => {
        if (item.parsedRecords && item.parsedRecords.length > 0) {
          allRecords.push(...item.parsedRecords.map(r => ({
            ...r,
            sourceType: item.category as any,
            sourceEntity: item.entityName
          })));
        }
      });

      // Collect records from existing statements
      bankStatements.forEach(b => {
        if (b.parsedRecords && b.parsedRecords.length > 0) {
          allRecords.push(...b.parsedRecords.map(r => ({ ...r, sourceType: 'bank' as const, sourceEntity: b.bankName })));
        }
      });
      upiStatements.forEach(u => {
        if (u.parsedRecords && u.parsedRecords.length > 0) {
          allRecords.push(...u.parsedRecords.map(r => ({ ...r, sourceType: 'upi' as const, sourceEntity: u.upiApp })));
        }
      });
      creditCardStatements.forEach(c => {
        if (c.parsedRecords && c.parsedRecords.length > 0) {
          allRecords.push(...c.parsedRecords.map(r => ({ ...r, sourceType: 'credit_card' as const, sourceEntity: c.cardName })));
        }
      });

      // Cross-source sync and repeat reduction
      const { syncedRecords, repeatMatches, consolidatedCsv } = syncAndReduceRepeats(allRecords);

      setNormalizedDataset(syncedRecords);
      setCrossSourceMatches(repeatMatches);
      setNormalizedCsvString(consolidatedCsv);

      const mappedTransactions: Transaction[] = syncedRecords.map(nr => ({
        id: `tx_${nr.id}`,
        date: nr.date,
        time: nr.time,
        description: nr.description,
        receiverName: nr.receiverName,
        tag: nr.tag || deriveTransactionTag(nr.category, nr.description),
        type: nr.credit > 0 ? 'credit' : 'debit',
        amount: nr.credit > 0 ? nr.credit : nr.debit,
        balance: nr.balance,
        category: nr.category as any,
        sourceType: nr.sourceType,
        sourceName: nr.sourceEntity,
        referenceNo: nr.referenceNo,
        bankTxnNumber: nr.bankTxnNumber,
        upiUtr: nr.upiUtr,
        referenceType: nr.referenceType,
        referenceLabel: nr.referenceLabel,
        isRepeatReduced: nr.isRepeatReduced || false,
        repeatMatchId: nr.repeatMatchId,
        repeatReason: nr.repeatReason
      }));

      setTransactions(mappedTransactions);
      setStatementsProcessed(true);
      setMoneyActiveView('ledger');
    } else {
      setStatementsProcessed(false);
    }
  };

  /**
   * Quick backward-compatible classifier & adder
   */
  const classifyAndAddStatement = (
    fileName: string,
    content?: string,
    fileSizeStr?: string
  ): { category: 'bank' | 'upi' | 'credit_card'; name: string; id: string } => {
    const pending = classifyUploadedFile(fileName, content, fileSizeStr);
    confirmPendingStatement(pending, false);
    return { category: pending.category, name: pending.entityName, id: pending.id };
  };

  /**
   * RE-CLASSIFY STATEMENT DURING REVIEW
   * Allows user to correct or reassign a statement between Bank, UPI, and Credit Card
   */
  const reclassifyStatement = (
    id: string,
    fromCategory: 'bank' | 'upi' | 'credit_card',
    toCategory: 'bank' | 'upi' | 'credit_card'
  ) => {
    if (fromCategory === toCategory) return;

    if (fromCategory === 'bank') {
      const item = bankStatements.find(s => s.id === id);
      if (!item) return;
      deleteBankStatement(id);

      if (toCategory === 'upi') {
        addUpiStatement({
          upiApp: item.bankName.includes('Bank') ? item.bankName.replace(/Bank.*/, 'UPI') : `${item.bankName} UPI`,
          upiId: `user@${item.bankName.toLowerCase().replace(/[^a-z]/g, '') || 'okhdfcbank'}`,
          fileName: item.fileName,
          fileSize: item.fileSize,
          period: item.period,
          transactionsCount: item.transactionsCount,
          totalSpent: item.totalDebit,
          totalReceived: item.totalCredit
        });
      } else if (toCategory === 'credit_card') {
        addCreditCardStatement({
          cardName: `${item.bankName} Credit Card`,
          cardNumberMasked: item.accountNumberMasked,
          fileName: item.fileName,
          fileSize: item.fileSize,
          period: item.period,
          transactionsCount: item.transactionsCount,
          totalSpends: item.totalDebit,
          totalPayments: item.totalCredit,
          creditLimit: 250000,
          availableLimit: 250000 - item.totalDebit
        });
      }
    } else if (fromCategory === 'upi') {
      const item = upiStatements.find(s => s.id === id);
      if (!item) return;
      deleteUpiStatement(id);

      if (toCategory === 'bank') {
        addBankStatement({
          bankName: `${item.upiApp} Linked Bank`,
          accountNumberMasked: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
          fileName: item.fileName,
          fileSize: item.fileSize,
          period: item.period,
          transactionsCount: item.transactionsCount,
          totalCredit: item.totalReceived,
          totalDebit: item.totalSpent,
          openingBalance: 25000,
          closingBalance: 25000 + item.totalReceived - item.totalSpent
        });
      } else if (toCategory === 'credit_card') {
        addCreditCardStatement({
          cardName: `${item.upiApp} Co-Branded Card`,
          cardNumberMasked: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
          fileName: item.fileName,
          fileSize: item.fileSize,
          period: item.period,
          transactionsCount: item.transactionsCount,
          totalSpends: item.totalSpent,
          totalPayments: item.totalReceived,
          creditLimit: 200000,
          availableLimit: 200000 - item.totalSpent
        });
      }
    } else if (fromCategory === 'credit_card') {
      const item = creditCardStatements.find(s => s.id === id);
      if (!item) return;
      deleteCreditCardStatement(id);

      if (toCategory === 'bank') {
        addBankStatement({
          bankName: item.cardName.replace(/Card.*/, 'Bank').trim() || 'Bank Statement',
          accountNumberMasked: item.cardNumberMasked,
          fileName: item.fileName,
          fileSize: item.fileSize,
          period: item.period,
          transactionsCount: item.transactionsCount,
          totalCredit: item.totalPayments,
          totalDebit: item.totalSpends,
          openingBalance: 30000,
          closingBalance: 30000 + item.totalPayments - item.totalSpends
        });
      } else if (toCategory === 'upi') {
        addUpiStatement({
          upiApp: `${item.cardName.split(' ')[0]} UPI`,
          upiId: `user@${item.cardName.toLowerCase().split(' ')[0] || 'upi'}`,
          fileName: item.fileName,
          fileSize: item.fileSize,
          period: item.period,
          transactionsCount: item.transactionsCount,
          totalSpent: item.totalSpends,
          totalReceived: item.totalPayments
        });
      }
    }
  };

  const downloadNormalizedCsv = () => {
    const csvContent = normalizedCsvString || generateNormalizedCsvString(normalizedDataset);
    if (!csvContent) {
      // If empty, generate from current sample dataset
      const sbiLayout = identifyLayout(SAMPLE_DATASETS.sbiBank, 'SBI_Passbook.csv');
      const sampleNorm = normalizeStatementData(SAMPLE_DATASETS.sbiBank, sbiLayout);
      const generated = generateNormalizedCsvString(sampleNorm);
      downloadCsvFile(generated, 'Normalized_Financial_Statement.csv');
      return;
    }
    downloadCsvFile(csvContent, 'Normalized_Financial_Statement.csv');
  };

  /**
   * CAREFUL USER CSV INGESTION
   * When user itself uploads a CSV file, it may have different layouts.
   * We carefully detect delimiter, preamble, layout profile, map columns,
   * normalize to standard format, save the CSV for feature use, and append to Transactions.
   */
  const ingestUserCsv = (csvContent: string, fileName: string, customMapping?: ColumnMappingConfig) => {
    try {
      const layout = identifyLayout(csvContent, fileName);
      const normalizedRecords = normalizeStatementData(csvContent, layout, customMapping, layout.entityName);
      
      if (normalizedRecords.length === 0) {
        return { 
          success: false, 
          recordsCount: 0, 
          message: 'No valid transaction records detected. Please check that the file contains date and amount columns.' 
        };
      }

      setNormalizedDataset(prev => [...normalizedRecords, ...prev]);
      const fullCsv = generateNormalizedCsvString([...normalizedRecords, ...normalizedDataset]);
      setNormalizedCsvString(fullCsv);

      // Convert normalized records to Transactions
      const newTransactions: Transaction[] = normalizedRecords.map(nr => ({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: nr.date,
        time: nr.time,
        description: nr.description,
        receiverName: nr.receiverName,
        tag: nr.tag || deriveTransactionTag(nr.category, nr.description),
        type: nr.credit > 0 ? 'credit' : 'debit',
        amount: nr.credit > 0 ? nr.credit : nr.debit,
        balance: nr.balance,
        category: nr.category as any,
        sourceType: nr.sourceType,
        sourceName: nr.sourceEntity,
        referenceNo: nr.referenceNo,
        bankTxnNumber: nr.bankTxnNumber,
        upiUtr: nr.upiUtr,
        referenceType: nr.referenceType,
        referenceLabel: nr.referenceLabel,
        isRepeatReduced: nr.isRepeatReduced || false,
        repeatMatchId: nr.repeatMatchId,
        repeatReason: nr.repeatReason
      }));

      setTransactions(prev => [...newTransactions, ...prev]);
      setStatementsProcessed(true);

      return {
        success: true,
        recordsCount: normalizedRecords.length,
        message: `Successfully identified layout "${layout.layoutName}" (${layout.confidenceScore}% confidence) and normalized ${normalizedRecords.length} records into canonical CSV format!`
      };
    } catch (err: any) {
      return { 
        success: false, 
        recordsCount: 0, 
        message: `Failed to process user CSV: ${err.message || 'Parsing error'}` 
      };
    }
  };

  /**
   * STATEMENT PROCESS PIPELINE
   * Reconciles all actively reviewed statements (Banks, UPI, Credit Cards)
   * using the actual parsed records from the uploaded files into canonical records and unified Transactions Ledger.
   */
  const processAllStatements = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const allRecords: NormalizedStatementRecord[] = [];

      // 1. Bank Statements (Using real parsed records)
      bankStatements.forEach(b => {
        if (b.parsedRecords && b.parsedRecords.length > 0) {
          allRecords.push(...b.parsedRecords.map(r => ({
            ...r,
            sourceType: 'bank' as const,
            sourceEntity: b.bankName
          })));
        }
      });

      // 2. UPI Statements (Using real parsed records)
      upiStatements.forEach(u => {
        if (u.parsedRecords && u.parsedRecords.length > 0) {
          allRecords.push(...u.parsedRecords.map(r => ({
            ...r,
            sourceType: 'upi' as const,
            sourceEntity: u.upiApp
          })));
        }
      });

      // 3. Credit Card Statements (Using real parsed records)
      creditCardStatements.forEach(c => {
        if (c.parsedRecords && c.parsedRecords.length > 0) {
          allRecords.push(...c.parsedRecords.map(r => ({
            ...r,
            sourceType: 'credit_card' as const,
            sourceEntity: c.cardName
          })));
        }
      });

      // Cross-source sync and repeat reduction
      const { syncedRecords, repeatMatches, consolidatedCsv } = syncAndReduceRepeats(allRecords);

      setNormalizedDataset(syncedRecords);
      setCrossSourceMatches(repeatMatches);
      setNormalizedCsvString(consolidatedCsv);

      // Reconcile into unified Transactions Ledger with actual user transactions
      const mappedTransactions: Transaction[] = syncedRecords.map(nr => ({
        id: `tx_${nr.id}`,
        date: nr.date,
        time: nr.time,
        description: nr.description,
        receiverName: nr.receiverName,
        tag: nr.tag || deriveTransactionTag(nr.category, nr.description),
        type: nr.credit > 0 ? 'credit' : 'debit',
        amount: nr.credit > 0 ? nr.credit : nr.debit,
        balance: nr.balance,
        category: nr.category as any,
        sourceType: nr.sourceType,
        sourceName: nr.sourceEntity,
        referenceNo: nr.referenceNo,
        bankTxnNumber: nr.bankTxnNumber,
        upiUtr: nr.upiUtr,
        referenceType: nr.referenceType,
        referenceLabel: nr.referenceLabel,
        isRepeatReduced: nr.isRepeatReduced || false,
        repeatMatchId: nr.repeatMatchId,
        repeatReason: nr.repeatReason
      }));

      setTransactions(mappedTransactions);
      // Save and update isolated separate CSV for each statement in the Vault
      bankStatements.forEach(b => {
        saveSeparateStatementCsv(b.id, b.bankName, 'bank', b.fileName, b.fileSize, b.parsedRecords || [], true);
      });
      upiStatements.forEach(u => {
        saveSeparateStatementCsv(u.id, u.upiApp, 'upi', u.fileName, u.fileSize, u.parsedRecords || [], true);
      });
      creditCardStatements.forEach(c => {
        saveSeparateStatementCsv(c.id, c.cardName, 'credit_card', c.fileName, c.fileSize, c.parsedRecords || [], true);
      });

      setBankStatements(prev => prev.map(s => ({ ...s, status: 'processed', isSyncedToLedger: true })));
      setUpiStatements(prev => prev.map(s => ({ ...s, status: 'processed', isSyncedToLedger: true })));
      setCreditCardStatements(prev => prev.map(s => ({ ...s, status: 'processed', isSyncedToLedger: true })));
      setStatementsProcessed(true);
      setIsProcessing(false);
      setMoneyActiveView('ledger');
    }, 400);
  };

  /**
   * DOWNLOAD SINGLE STATEMENT CSV
   * Allows exporting individual isolated statement CSVs
   */
  const downloadSingleStatementCsv = (statementId: string) => {
    const item = csvVaultItems.find(v => v.statementId === statementId);
    if (item && item.csvContent) {
      const cleanName = item.entityName.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadCsvFile(item.csvContent, `${cleanName}_Separate_Statement.csv`);
      return;
    }
    const bank = bankStatements.find(s => s.id === statementId);
    if (bank && bank.parsedRecords) {
      const csv = bank.csvContent || generateNormalizedCsvString(bank.parsedRecords);
      downloadCsvFile(csv, `${bank.bankName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Separate_Statement.csv`);
      return;
    }
    const upi = upiStatements.find(s => s.id === statementId);
    if (upi && upi.parsedRecords) {
      const csv = upi.csvContent || generateNormalizedCsvString(upi.parsedRecords);
      downloadCsvFile(csv, `${upi.upiApp.replace(/[^a-zA-Z0-9_-]/g, '_')}_Separate_Statement.csv`);
      return;
    }
    const card = creditCardStatements.find(s => s.id === statementId);
    if (card && card.parsedRecords) {
      const csv = card.csvContent || generateNormalizedCsvString(card.parsedRecords);
      downloadCsvFile(csv, `${card.cardName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Separate_Statement.csv`);
      return;
    }
  };

  /**
   * ON-DEMAND CSV SYNC PIPELINE
   * Synchronizes selected (or all) separate statement CSVs into the active Ledger view as requested by user.
   */
  const syncStatementCsvs = (selectedStatementIds?: string[]) => {
    const allRecords: NormalizedStatementRecord[] = [];
    const targetIds = selectedStatementIds && selectedStatementIds.length > 0 
      ? selectedStatementIds 
      : [...bankStatements.map(s => s.id), ...upiStatements.map(s => s.id), ...creditCardStatements.map(s => s.id)];

    bankStatements.forEach(b => {
      if (targetIds.includes(b.id) && b.parsedRecords && b.parsedRecords.length > 0) {
        allRecords.push(...b.parsedRecords.map(r => ({ ...r, sourceType: 'bank' as const, sourceEntity: b.bankName })));
      }
    });

    upiStatements.forEach(u => {
      if (targetIds.includes(u.id) && u.parsedRecords && u.parsedRecords.length > 0) {
        allRecords.push(...u.parsedRecords.map(r => ({ ...r, sourceType: 'upi' as const, sourceEntity: u.upiApp })));
      }
    });

    creditCardStatements.forEach(c => {
      if (targetIds.includes(c.id) && c.parsedRecords && c.parsedRecords.length > 0) {
        allRecords.push(...c.parsedRecords.map(r => ({ ...r, sourceType: 'credit_card' as const, sourceEntity: c.cardName })));
      }
    });

    // Cross-source sync and repeat reduction
    const { syncedRecords, repeatMatches, consolidatedCsv } = syncAndReduceRepeats(allRecords);

    setNormalizedDataset(syncedRecords);
    setCrossSourceMatches(repeatMatches);
    setNormalizedCsvString(consolidatedCsv);

    const mappedTransactions: Transaction[] = syncedRecords.map(nr => ({
      id: `tx_${nr.id}`,
      date: nr.date,
      time: nr.time,
      description: nr.description,
      receiverName: nr.receiverName,
      tag: nr.tag || deriveTransactionTag(nr.category, nr.description),
      type: nr.credit > 0 ? 'credit' : 'debit',
      amount: nr.credit > 0 ? nr.credit : nr.debit,
      balance: nr.balance,
      category: nr.category as any,
      sourceType: nr.sourceType,
      sourceName: nr.sourceEntity,
      referenceNo: nr.referenceNo,
      bankTxnNumber: nr.bankTxnNumber,
      upiUtr: nr.upiUtr,
      referenceType: nr.referenceType,
      referenceLabel: nr.referenceLabel,
      isRepeatReduced: nr.isRepeatReduced || false,
      repeatMatchId: nr.repeatMatchId,
      repeatReason: nr.repeatReason
    }));

    setTransactions(mappedTransactions);
    setBankStatements(prev => prev.map(s => ({
      ...s,
      status: targetIds.includes(s.id) ? 'processed' : s.status,
      isSyncedToLedger: targetIds.includes(s.id)
    })));
    setUpiStatements(prev => prev.map(s => ({
      ...s,
      status: targetIds.includes(s.id) ? 'processed' : s.status,
      isSyncedToLedger: targetIds.includes(s.id)
    })));
    setCreditCardStatements(prev => prev.map(s => ({
      ...s,
      status: targetIds.includes(s.id) ? 'processed' : s.status,
      isSyncedToLedger: targetIds.includes(s.id)
    })));

    setCsvVaultItems(prev => prev.map(item => ({
      ...item,
      isSynced: targetIds.includes(item.statementId)
    })));

    setStatementsProcessed(true);
    setMoneyActiveView('ledger');
  };

  const toggleStatementCsvSync = (statementId: string) => {
    setCsvVaultItems(prev => prev.map(item => {
      if (item.statementId === statementId) {
        return { ...item, isSynced: !item.isSynced };
      }
      return item;
    }));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setNormalizedDataset(prev => prev.filter(r => r.id !== id && `tx_${r.id}` !== id));
  };

  /**
   * TAG / PURPOSE EDITING
   * Allows user to edit the purpose tag representing the transaction (Food, Travel, Health, etc.)
   */
  const updateTransactionTag = (id: string, newTag: string) => {
    const trimmed = newTag.trim() || 'General';
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, tag: trimmed } : t));
    setNormalizedDataset(prev => prev.map(r => (`tx_${r.id}` === id || r.id === id) ? { ...r, tag: trimmed } : r));
  };

  const updateTransactionDetails = (id: string, updates: { tag?: string; senderName?: string; receiverName?: string }) => {
    setTransactions(prev => prev.map(t => t.id === id ? { 
      ...t, 
      tag: updates.tag !== undefined ? (updates.tag.trim() || 'General') : t.tag,
      senderName: updates.senderName !== undefined ? updates.senderName.trim() : t.senderName,
      receiverName: updates.receiverName !== undefined ? updates.receiverName.trim() : t.receiverName
    } : t));
    setNormalizedDataset(prev => prev.map(r => (`tx_${r.id}` === id || r.id === id) ? { 
      ...r, 
      tag: updates.tag !== undefined ? (updates.tag.trim() || 'General') : r.tag,
      senderName: updates.senderName !== undefined ? updates.senderName.trim() : r.senderName,
      receiverName: updates.receiverName !== undefined ? updates.receiverName.trim() : r.receiverName
    } : r));
  };

  /**
   * 3-TIER CSV EXPORTS:
   * Tier 2: Category Draft CSVs (Bank, UPI, Credit Card sorted by Date & Time)
   * Tier 3: Consolidated All Transactions CSV with Reduced Repeats & Sync Audit
   */
  const getCategoryDraftCsv = (category: 'bank' | 'upi' | 'credit_card'): CategoryDraftCsvInfo => {
    return generateCategoryDraftCsv(category, normalizedDataset);
  };

  const downloadCategoryDraftCsv = (category: 'bank' | 'upi' | 'credit_card') => {
    const draft = generateCategoryDraftCsv(category, normalizedDataset);
    downloadCsvFile(draft.csvContent, draft.fileName);
  };

  const downloadConsolidatedAllTransactionsCsv = () => {
    const csvContent = generateConsolidatedAllTransactionsCsv(normalizedDataset);
    downloadCsvFile(csvContent, 'All_Transactions_Consolidated.csv');
  };

  /**
   * CLEAR ALL STATEMENTS
   * Removes all uploaded statements and clears the statement-derived ledger and CSV vault
   */
  const clearAllStatements = () => {
    setBankStatements([]);
    setUpiStatements([]);
    setCreditCardStatements([]);
    setTransactions([]);
    setNormalizedDataset([]);
    setNormalizedCsvString('');
    setCsvVaultItems([]);
    setStatementsProcessed(false);
    safeRemoveStorage('m_app_bank_statements');
    safeRemoveStorage('m_app_upi_statements');
    safeRemoveStorage('m_app_cc_statements');
    safeRemoveStorage('m_app_transactions');
    safeRemoveStorage('m_app_normalized_dataset');
    safeRemoveStorage('m_app_normalized_csv');
    safeRemoveStorage('m_app_csv_vault');
  };

  // Knowledge base actions
  const addNote = (note: Omit<NoteItem, 'id' | 'updatedAt'>) => {
    const newNote: NoteItem = {
      ...note,
      id: `note_${Date.now()}`,
      updatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const togglePinNote = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  // Health actions
  const addWater = (amountMl: number) => {
    setHealthMetric(prev => ({
      ...prev,
      waterMl: Math.min(prev.waterGoalMl * 2, prev.waterMl + amountMl)
    }));
  };

  const logHealthEntry = (title: string, category: 'Vitals' | 'Workout' | 'Medication' | 'Lab Result', value: string) => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setHealthMetric(prev => ({
      ...prev,
      recentLogs: [{ id: `hl_${Date.now()}`, title, category, value, time: now }, ...prev.recentLogs]
    }));
  };

  // Document actions
  const addDocument = (doc: Omit<DocumentItem, 'id' | 'uploadedAt'>) => {
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc_${Date.now()}`,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setDocuments(prev => [newDoc, ...prev]);
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Tasks actions
  const addTask = (task: Omit<ActionTask, 'id'>) => {
    const newTask: ActionTask = {
      ...task,
      id: `task_${Date.now()}`
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'completed' ? 'in_progress' : t.status === 'in_progress' ? 'completed' : 'in_progress';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const toggleChecklistItem = (taskId: string, checklistId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          checklist: t.checklist.map(c => c.id === checklistId ? { ...c, completed: !c.completed } : c)
        };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const resetAllData = () => {
    setBankStatements(initialBankStatements);
    setUpiStatements(initialUpiStatements);
    setCreditCardStatements(initialCreditCardStatements);
    setTransactions(initialTransactions);
    setNormalizedDataset([]);
    setNormalizedCsvString('');
    setNotes(initialNotes);
    setHealthMetric(initialHealth);
    setDocuments(initialDocuments);
    setTasks(initialTasks);
    setCurrentUser(defaultUser);
    setActiveScreen('home');
    setMoneyActiveView('hub');
    setStatementsProcessed(false);
  };

  return (
    <AppContext.Provider
      value={{
        uiTheme,
        setUiTheme,
        textScale,
        setTextScale,
        isThemeModalOpen,
        setIsThemeModalOpen,
        isMobileTestOpen,
        setIsMobileTestOpen,
        currentUser,
        authMode,
        setAuthMode,
        signIn,
        signUp,
        signOut,
        activeScreen,
        setActiveScreen: changeActiveScreen,
        navigationHistory,
        goBack,
        viewMode,
        setViewMode,
        moneyActiveView,
        setMoneyActiveView,
        bankStatements,
        upiStatements,
        creditCardStatements,
        transactions,
        deleteTransaction,
        updateTransactionTag,
        updateTransactionDetails,
        addBankStatement,
        deleteBankStatement,
        updateBankAccountType,
        addUpiStatement,
        deleteUpiStatement,
        addCreditCardStatement,
        deleteCreditCardStatement,
        classifyAndAddStatement,
        classifyUploadedFile,
        confirmPendingStatement,
        confirmMultiplePendingStatements,
        reclassifyStatement,
        processAllStatements,
        clearAllStatements,
        isProcessing,
        statementsProcessed,
        normalizedDataset,
        normalizedCsvString,
        downloadNormalizedCsv,
        ingestUserCsv,
        getCategoryDraftCsv,
        downloadCategoryDraftCsv,
        downloadConsolidatedAllTransactionsCsv,
        crossSourceMatches,
        showReducedRepeats,
        setShowReducedRepeats,
        csvVaultItems,
        isCsvVaultOpen,
        setIsCsvVaultOpen,
        downloadSingleStatementCsv,
        syncStatementCsvs,
        toggleStatementCsvSync,
        isBankReviewOpen,
        setIsBankReviewOpen,
        isUpiReviewOpen,
        setIsUpiReviewOpen,
        isCreditCardReviewOpen,
        setIsCreditCardReviewOpen,
        notes,
        addNote,
        deleteNote,
        togglePinNote,
        healthMetric,
        addWater,
        logHealthEntry,
        documents,
        addDocument,
        deleteDocument,
        tasks,
        addTask,
        toggleTaskStatus,
        toggleChecklistItem,
        deleteTask,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
