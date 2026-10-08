import { 
  FileTypeResult, 
  LayoutIdentificationResult, 
  ColumnMappingConfig, 
  NormalizedStatementRecord,
  Transaction,
  CrossSourceSyncMatch,
  CategoryDraftCsvInfo
} from '../types';

/**
 * 1. IDENTIFY FILE TYPE
 * Analyzes file extension, MIME type, and content signatures.
 */
export function identifyFileType(fileName: string, mimeType = '', fileSize = 0): FileTypeResult {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const fileSizeFormatted = formatFileSize(fileSize);

  if (extension === 'csv' || mimeType.includes('csv') || mimeType.includes('comma-separated-values')) {
    return {
      fileType: 'csv',
      extension: 'csv',
      formatLabel: 'CSV (Comma/Delimited Structured Text)',
      mimeType: mimeType || 'text/csv',
      fileSizeFormatted,
      isDirectlyParseable: true
    };
  }

  if (extension === 'pdf' || mimeType.includes('pdf')) {
    return {
      fileType: 'pdf',
      extension: 'pdf',
      formatLabel: 'PDF (Official Bank/Card e-Statement)',
      mimeType: mimeType || 'application/pdf',
      fileSizeFormatted,
      isDirectlyParseable: false // Treated via bank profile parser
    };
  }

  if (extension === 'xlsx' || extension === 'xls' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return {
      fileType: 'xlsx',
      extension,
      formatLabel: 'EXCEL (Spreadsheet Statement)',
      mimeType: mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSizeFormatted,
      isDirectlyParseable: false
    };
  }

  if (['txt', 'ofx', 'qif', 'json'].includes(extension)) {
    return {
      fileType: 'txt',
      extension,
      formatLabel: `${extension.toUpperCase()} (Financial Data Export)`,
      mimeType: mimeType || 'text/plain',
      fileSizeFormatted,
      isDirectlyParseable: true
    };
  }

  return {
    fileType: 'unknown',
    extension,
    formatLabel: 'Unknown / Binary Document',
    mimeType: mimeType || 'application/octet-stream',
    fileSizeFormatted,
    isDirectlyParseable: false
  };
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return 'Sample Dataset';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 2. IDENTIFY THE LAYOUT FOR DIFFERENT BANKS, UPI APPS & CREDIT CARDS
 * Deep sniffer that handles:
 * - Preamble headers (skips non-table bank account metadata lines)
 * - Delimiters (comma, semicolon, tab)
 * - Bank profiles: SBI, HDFC, ICICI, Axis, Kotak
 * - UPI profiles: PhonePe, Google Pay, Paytm, CRED
 * - Credit Cards: HDFC Credit Card, SBI Card, ICICI Amazon Pay, Axis Credit Card
 * - Fallback / Custom user CSV layout detection
 */
interface LayoutSignature {
  entityCategory: 'bank' | 'upi' | 'credit_card';
  entityName: string;
  layoutName: string;
  keywords: string[];
  dateHints: string[];
  descHints: string[];
  debitHints: string[];
  creditHints: string[];
  amountHints: string[];
  typeHints: string[];
  refHints: string[];
  balanceHints: string[];
}

const LAYOUT_SIGNATURES: LayoutSignature[] = [
  // BANKS
  {
    entityCategory: 'bank',
    entityName: 'State Bank of India (SBI)',
    layoutName: 'SBI Core Banking Passbook Layout',
    keywords: ['txn date', 'value date', 'narration', 'ref no', 'cheque no', 'debit', 'credit', 'balance'],
    dateHints: ['txn date', 'transaction date', 'date'],
    descHints: ['narration', 'description', 'particulars'],
    debitHints: ['debit', 'withdrawal', 'dr'],
    creditHints: ['credit', 'deposit', 'cr'],
    amountHints: ['amount'],
    typeHints: ['type', 'dr/cr'],
    refHints: ['ref no', 'cheque no', 'utr', 'txn id'],
    balanceHints: ['balance', 'closing balance']
  },
  {
    entityCategory: 'bank',
    entityName: 'HDFC Bank',
    layoutName: 'HDFC Multi-Column NetBanking Layout',
    keywords: ['narration', 'chq/ref number', 'value dt', 'withdrawal amt', 'deposit amt', 'closing balance'],
    dateHints: ['date', 'txn date', 'value dt'],
    descHints: ['narration', 'transaction description', 'particulars'],
    debitHints: ['withdrawal amt', 'withdrawal amt.', 'debit'],
    creditHints: ['deposit amt', 'deposit amt.', 'credit'],
    amountHints: ['amount'],
    typeHints: ['type'],
    refHints: ['chq/ref number', 'chq / ref no', 'ref number'],
    balanceHints: ['closing balance', 'balance']
  },
  {
    entityCategory: 'bank',
    entityName: 'ICICI Bank',
    layoutName: 'ICICI Infinity Banking Layout',
    keywords: ['tran date', 'remark', 'transaction id', 'debit', 'credit', 'balance', 'cheque'],
    dateHints: ['tran date', 'transaction date', 'date'],
    descHints: ['remark', 'description', 'particulars'],
    debitHints: ['debit amount', 'withdrawal', 'debit'],
    creditHints: ['credit amount', 'deposit', 'credit'],
    amountHints: ['amount', 'transaction amount'],
    typeHints: ['cr/dr', 'type'],
    refHints: ['transaction id', 'cheque number', 'ref id'],
    balanceHints: ['balance', 'available balance']
  },
  {
    entityCategory: 'bank',
    entityName: 'Axis Bank',
    layoutName: 'Axis Corporate & Retail Statement Layout',
    keywords: ['tran date', 'particulars', 'chq no', 'debit', 'credit', 'balance', 'init. br'],
    dateHints: ['tran date', 'date'],
    descHints: ['particulars', 'description'],
    debitHints: ['debit', 'dr'],
    creditHints: ['credit', 'cr'],
    amountHints: ['amount'],
    typeHints: ['type'],
    refHints: ['chq no', 'reference', 'utr'],
    balanceHints: ['balance']
  },
  {
    entityCategory: 'bank',
    entityName: 'Kotak Mahindra Bank',
    layoutName: 'Kotak Active Money Statement Layout',
    keywords: ['sl. no.', 'transaction date', 'description', 'chq / ref no.', 'amount', 'dr / cr', 'balance'],
    dateHints: ['transaction date', 'date'],
    descHints: ['description', 'particulars'],
    debitHints: ['debit', 'withdrawal'],
    creditHints: ['credit', 'deposit'],
    amountHints: ['amount'],
    typeHints: ['dr / cr', 'dr/cr', 'type'],
    refHints: ['chq / ref no.', 'chq/ref no', 'ref no'],
    balanceHints: ['balance']
  },

  // UPI APPS
  {
    entityCategory: 'upi',
    entityName: 'PhonePe',
    layoutName: 'PhonePe UPI Activity Statement',
    keywords: ['transaction id', 'paid to', 'received from', 'type', 'amount', 'phonepe', 'ybl'],
    dateHints: ['date', 'time', 'timestamp'],
    descHints: ['paid to', 'received from', 'merchant', 'description'],
    debitHints: ['debit'],
    creditHints: ['credit'],
    amountHints: ['amount', 'amount (₹)', 'txn amount'],
    typeHints: ['type', 'transaction type', 'status'],
    refHints: ['transaction id', 'txn id', 'utr number', 'bank ref'],
    balanceHints: ['closing balance', 'wallet balance']
  },
  {
    entityCategory: 'upi',
    entityName: 'Google Pay (GPay)',
    layoutName: 'Google Pay Transaction History Layout',
    keywords: ['time', 'description', 'transaction id', 'status', 'amount', 'google pay', 'upi'],
    dateHints: ['time', 'date', 'completed on'],
    descHints: ['description', 'paid to', 'to/from', 'name'],
    debitHints: ['debit'],
    creditHints: ['credit'],
    amountHints: ['amount', 'amount paid'],
    typeHints: ['type', 'status'],
    refHints: ['transaction id', 'google transaction id', 'upi txn id'],
    balanceHints: ['balance']
  },
  {
    entityCategory: 'upi',
    entityName: 'Paytm',
    layoutName: 'Paytm UPI & Wallet Passbook Layout',
    keywords: [
      'passbook payments history', 'paytm statement for', 'transaction details', 
      'notes & tags', 'your account', 'upi ref no', '# money received',
      'activity', 'order id', 'wallet txn id', 'debit (rs.)', 'credit (rs.)', 'paytm'
    ],
    dateHints: ['date & time', 'date &', 'date', 'time', 'transaction date'],
    descHints: ['transaction details', 'details', 'activity', 'narration', 'particulars'],
    debitHints: ['debit (rs.)', 'debit', 'paid', 'payment made'],
    creditHints: ['credit (rs.)', 'credit', 'received', 'payment received'],
    amountHints: ['amount', 'payment made', 'payment received'],
    typeHints: ['type'],
    refHints: ['upi ref no', 'upi ref', 'bank ref no', 'order id', 'wallet txn id'],
    balanceHints: ['closing balance', 'closing balance (rs.)']
  },
  {
    entityCategory: 'upi',
    entityName: 'CRED',
    layoutName: 'CRED UPI & Bill Pay Statement',
    keywords: ['txn date', 'merchant', 'payment method', 'amount', 'cashback', 'cred'],
    dateHints: ['txn date', 'date'],
    descHints: ['merchant', 'details', 'beneficiary'],
    debitHints: ['debit'],
    creditHints: ['cashback', 'refund'],
    amountHints: ['amount', 'total amount'],
    typeHints: ['type', 'status'],
    refHints: ['ref id', 'utr', 'payment id'],
    balanceHints: ['balance']
  },

  // CREDIT CARDS
  {
    entityCategory: 'credit_card',
    entityName: 'HDFC Credit Card',
    layoutName: 'HDFC Credit Card Monthly Statement',
    keywords: ['date', 'transaction description', 'amount', 'dr/cr', 'card number', 'reward points'],
    dateHints: ['date', 'txn date', 'billing date'],
    descHints: ['transaction description', 'details', 'merchant'],
    debitHints: ['debit', 'dr'],
    creditHints: ['credit', 'payment', 'cr'],
    amountHints: ['amount', 'amount (rs.)'],
    typeHints: ['dr/cr', 'cr/dr', 'type'],
    refHints: ['reference number', 'ref number', 'txn id'],
    balanceHints: ['total due', 'available credit limit']
  },
  {
    entityCategory: 'credit_card',
    entityName: 'SBI Card',
    layoutName: 'SBI Credit Card Transaction Statement',
    keywords: ['transaction date', 'posting date', 'details', 'amount (in rs)', 'type (d/c)', 'sbi card'],
    dateHints: ['transaction date', 'date', 'posting date'],
    descHints: ['details', 'description', 'merchant name'],
    debitHints: ['debit', 'd'],
    creditHints: ['credit', 'c', 'payment'],
    amountHints: ['amount (in rs)', 'amount', 'transaction amount'],
    typeHints: ['type (d/c)', 'd/c', 'type'],
    refHints: ['ref no', 'reference number'],
    balanceHints: ['total amount due', 'available limit']
  },
  {
    entityCategory: 'credit_card',
    entityName: 'ICICI Amazon Pay / Coral Card',
    layoutName: 'ICICI Credit Card Statement Layout',
    keywords: ['date', 'reference number', 'transaction details', 'reward points', 'amount', 'international'],
    dateHints: ['date', 'transaction date'],
    descHints: ['transaction details', 'merchant', 'details'],
    debitHints: ['debit', 'dr'],
    creditHints: ['credit', 'cr'],
    amountHints: ['amount', 'amount (in inr)'],
    typeHints: ['cr/dr', 'type'],
    refHints: ['reference number', 'ref no'],
    balanceHints: ['balance', 'total dues']
  },
  {
    entityCategory: 'credit_card',
    entityName: 'Axis Bank Credit Card',
    layoutName: 'Axis Bank Credit Card Statement Layout',
    keywords: ['transaction date', 'particulars', 'amount', 'ref no', 'currency', 'axis card'],
    dateHints: ['transaction date', 'date'],
    descHints: ['particulars', 'description'],
    debitHints: ['debit', 'dr'],
    creditHints: ['credit', 'cr'],
    amountHints: ['amount'],
    typeHints: ['type', 'dr/cr'],
    refHints: ['ref no', 'ref number'],
    balanceHints: ['total outstanding', 'credit limit']
  }
];

export function identifyLayout(rawContent: string, fileName = ''): LayoutIdentificationResult {
  // Clean potential UTF-8 BOM or Windows line endings
  const cleanContent = (rawContent || '').replace(/^\uFEFF/, '');
  const lines = cleanContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return createEmptyLayoutResult();
  }

  // Detect delimiter: sniff lines with commas, semicolons, tabs, pipes, spaces
  const delimiter = detectDelimiter(lines.slice(0, 30));

  // Find the Header Row Index (deep scan up to 120 lines to skip long bank metadata preambles)
  const { headerRowIndex, headers } = findHeaderRow(lines, delimiter);

  const cleanHeadersLower = headers.map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const fullText = (fileName + ' ' + cleanHeadersLower.join(' ') + ' ' + lines.slice(0, 10).join(' ')).toLowerCase();

  // Match against known layout signatures
  let bestMatch: LayoutSignature | null = null;
  let bestScore = 0;

  for (const sig of LAYOUT_SIGNATURES) {
    let score = 0;
    
    // Keyword match
    for (const kw of sig.keywords) {
      if (cleanHeadersLower.some(h => h.includes(kw)) || fullText.includes(kw)) {
        score += 15;
      }
    }

    // Name match in filename or header
    if (fileName.toLowerCase().includes(sig.entityName.toLowerCase().split(' ')[0])) {
      score += 30;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = sig;
    }
  }

  // Determine Entity Category & Name
  let entityCategory: 'bank' | 'upi' | 'credit_card' | 'unknown' = 'unknown';
  let entityName = 'Custom Statement';
  let layoutName = 'Generic Delimited CSV Layout';
  let confidenceScore = Math.min(Math.round((bestScore / 75) * 100), 98);

  if (bestMatch && bestScore >= 25) {
    entityCategory = bestMatch.entityCategory;
    entityName = bestMatch.entityName;
    layoutName = bestMatch.layoutName;
  } else {
    // Infer category by keywords
    if (fullText.includes('upi') || fullText.includes('vpa') || fullText.includes('phonepe') || fullText.includes('gpay')) {
      entityCategory = 'upi';
      entityName = 'UPI Provider Export';
      layoutName = 'Standard UPI Activity Log';
      confidenceScore = 72;
    } else if (fullText.includes('card') || fullText.includes('limit') || fullText.includes('minimum due')) {
      entityCategory = 'credit_card';
      entityName = 'Credit Card Statement';
      layoutName = 'Credit Card Transaction Log';
      confidenceScore = 75;
    } else {
      entityCategory = 'bank';
      entityName = 'Bank Passbook / Ledger';
      layoutName = 'Bank Transaction Log';
      confidenceScore = 65;
    }
  }

  // Auto-map columns
  const columnMapping = mapColumns(cleanHeadersLower, headers, bestMatch);

  // Extract sample data rows
  const rawDataRows = lines.slice(headerRowIndex + 1);
  const sampleRows: string[][] = [];
  for (let i = 0; i < Math.min(5, rawDataRows.length); i++) {
    const rowCells = parseCsvRow(rawDataRows[i], delimiter);
    if (rowCells.length >= Math.max(2, headers.length - 2)) {
      sampleRows.push(rowCells);
    }
  }

  return {
    entityCategory,
    entityName,
    layoutName,
    confidenceScore: Math.max(confidenceScore, 60),
    delimiter,
    headerRowIndex,
    detectedHeaders: headers,
    columnMapping,
    sampleRows,
    totalDataRows: Math.max(0, lines.length - headerRowIndex - 1)
  };
}

function detectDelimiter(sampleLines: string[]): string {
  let commaCount = 0;
  let semiCount = 0;
  let tabCount = 0;
  let pipeCount = 0;

  for (const line of sampleLines) {
    commaCount += (line.match(/,/g) || []).length;
    semiCount += (line.match(/;/g) || []).length;
    tabCount += (line.match(/\t/g) || []).length;
    pipeCount += (line.match(/\|/g) || []).length;
  }

  if (pipeCount > commaCount && pipeCount > tabCount && pipeCount > 0) return '|';
  if (tabCount > commaCount && tabCount > semiCount && tabCount > 0) return '\t';
  if (semiCount > commaCount && semiCount > 0) return ';';
  if (commaCount > 0) return ',';

  // Check for 2+ consecutive spaces (fixed width or space-aligned tables)
  const hasMultipleSpaces = sampleLines.some(l => /\s{2,}/.test(l));
  if (hasMultipleSpaces) return 'whitespace';

  return ',';
}

function findHeaderRow(lines: string[], delimiter: string): { headerRowIndex: number; headers: string[] } {
  const financialTokens = [
    'date', 'txn', 'transaction', 'narration', 'description', 'particulars', 'remark', 'details',
    'debit', 'credit', 'withdrawal', 'deposit', 'withdrawals', 'deposits', 'amount', 'balance',
    'ref', 'chq', 'cheque', 'utr', 'activity', 'paid to', 'received from', 'closing balance', 'spent',
    'dr', 'cr', 'val date', 'value date', 'txn date', 'booking date', 'post date', 'tran date',
    'trans date', 'paid out', 'paid in', 'money out', 'money in', 'withdrawal amt', 'deposit amt',
    'billing', 'statement', 'type', 'net amount', 'total', 'fees', 'charges'
  ];

  let bestIndex = 0;
  let maxMatches = -1;
  let bestHeaders: string[] = [];

  // Deep scan up to 120 lines to reliably detect table headers in statements with lengthy preambles
  const maxScan = Math.min(120, lines.length);

  for (let i = 0; i < maxScan; i++) {
    const cells = parseCsvRow(lines[i], delimiter);
    if (cells.length < 2) continue;

    let matches = 0;
    for (const cell of cells) {
      const lower = cell.toLowerCase().trim();
      for (const token of financialTokens) {
        if (token.length <= 3) {
          if (new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`, 'i').test(lower)) {
            matches++;
            break;
          }
        } else if (lower.includes(token)) {
          matches++;
          break;
        }
      }
    }

    if (matches > 0) {
      const lowerLine = lines[i].toLowerCase();
      if (lowerLine.includes('date') && (lowerLine.includes('transaction details') || lowerLine.includes('notes & tags') || lowerLine.includes('amount') || lowerLine.includes('narration'))) {
        matches += 10;
      }
    }

    if (matches > maxMatches && matches >= 2) {
      maxMatches = matches;
      bestIndex = i;
      bestHeaders = cells;
    }
  }

  // If no explicit token matches found, look for the first row containing transactions with dates
  // The line directly preceding the first date-bearing row is usually the table header!
  if (maxMatches <= 0 && lines.length > 0) {
    for (let i = 0; i < Math.min(80, lines.length); i++) {
      const cells = parseCsvRow(lines[i], delimiter);
      const hasDate = cells.some(c => !!standardizeDate(c));
      if (hasDate) {
        if (i > 0) {
          bestHeaders = parseCsvRow(lines[i - 1], delimiter);
          bestIndex = i - 1;
        } else {
          // Row 0 itself is data! Synthesize generic headers
          bestHeaders = cells.map((_, idx) => `Col_${idx + 1}`);
          bestIndex = -1; // Indicate data starts at index 0
        }
        maxMatches = 1;
        break;
      }
    }
  }

  if (maxMatches <= 0 && lines.length > 0) {
    bestHeaders = parseCsvRow(lines[0], delimiter);
    bestIndex = 0;
  }

  return {
    headerRowIndex: bestIndex,
    headers: bestHeaders.map(h => h.trim().replace(/^["']|["']$/g, ''))
  };
}

export function parseCsvRow(rowText: string, delimiter = ','): string[] {
  if (delimiter === 'whitespace') {
    return rowText.trim().split(/\s{2,}|\t/).map(s => s.trim().replace(/^["']|["']$/g, ''));
  }

  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"' || char === "'") {
      if (inQuotes && rowText[i + 1] === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function mapColumns(cleanHeadersLower: string[], originalHeaders: string[], sig: LayoutSignature | null): ColumnMappingConfig {
  const mapping: ColumnMappingConfig = {
    dateCol: '',
    descCol: ''
  };

  const findCol = (hints: string[], excludeCols: string[] = []): string => {
    for (const hint of hints) {
      const idx = cleanHeadersLower.findIndex((h, i) => {
        if (excludeCols.includes(originalHeaders[i])) return false;
        if (h === hint) return true;
        // For short abbreviations (3 chars or fewer like dr, cr, dt), require whole word match
        if (hint.length <= 3) {
          const regex = new RegExp(`(^|[^a-z0-9])${hint}([^a-z0-9]|$)`, 'i');
          return regex.test(h);
        }
        return h.includes(hint);
      });
      if (idx !== -1) return originalHeaders[idx];
    }
    return '';
  };

  // Date column hints: prioritize primary transaction date over value date
  const allDateHints = sig?.dateHints || [
    'txn date', 'transaction date', 'posting date', 'post date', 'booking date',
    'trans date', 'tran date', 'date', 'dt', 'value date', 'value dt', 'date / time', 
    'time', 'timestamp'
  ];

  const allDescHints = sig?.descHints || [
    'narration', 'transaction description', 'particulars', 'transaction details',
    'description', 'details', 'remarks', 'remark', 'payee', 'merchant', 
    'beneficiary', 'paid to', 'received from', 'activity', 'notes', 'memo', 
    'party name', 'name', 'title'
  ];

  // Date Column
  mapping.dateCol = findCol(allDateHints);
  if (!mapping.dateCol) {
    const idx = cleanHeadersLower.findIndex(h => /(^|[^a-z])(date|dt)([^a-z]|$)/i.test(h));
    if (idx !== -1) mapping.dateCol = originalHeaders[idx];
  }

  // Time Column
  const timeHints = ['txn time', 'time (ist)', 'time', 'timestamp', 'tran time', 'posting time'];
  const timeCol = findCol(timeHints, [mapping.dateCol]);
  if (timeCol) mapping.timeCol = timeCol;

  // Description Column (excluding date column)
  mapping.descCol = findCol(allDescHints, [mapping.dateCol]);
  if (!mapping.descCol) {
    const idx = cleanHeadersLower.findIndex((h, i) => 
      originalHeaders[i] !== mapping.dateCol && /desc|narrat|partic|detail|remark|payee|merchant/i.test(h)
    );
    if (idx !== -1) mapping.descCol = originalHeaders[idx];
  }

  // Debit Column
  const debitHints = sig?.debitHints || [
    'withdrawal amt', 'withdrawal amt.', 'withdrawal amount', 'withdrawal', 
    'withdrawals', 'debit (rs.)', 'debit (inr)', 'debit amount', 'debit amt', 
    'dr amount', 'dr.', 'dr', 'debit', 'spent', 'paid out', 'money out', 'payment'
  ];
  const debitCol = findCol(debitHints, [mapping.dateCol, mapping.descCol]);
  if (debitCol) mapping.debitCol = debitCol;

  // Credit Column
  const creditHints = sig?.creditHints || [
    'deposit amt', 'deposit amt.', 'deposit amount', 'deposit', 
    'deposits', 'credit (rs.)', 'credit (inr)', 'credit amount', 'credit amt', 
    'cr amount', 'cr.', 'cr', 'credit', 'received', 'paid in', 'money in', 'refund'
  ];
  const creditCol = findCol(creditHints, [mapping.dateCol, mapping.descCol, mapping.debitCol || '']);
  if (creditCol) mapping.creditCol = creditCol;

  // Amount Column (if single amount column used)
  const amountHints = sig?.amountHints || [
    'amount (₹)', 'amount (in rs)', 'amount (in inr)', 'amount (rs.)', 'amount', 
    'txn amount', 'transaction amount', 'net amount', 'total amount', 'transaction amt', 'total'
  ];
  const amountCol = findCol(amountHints, [mapping.dateCol, mapping.descCol]);
  if (amountCol) mapping.amountCol = amountCol;

  // Type (Dr / Cr indicator)
  const typeHints = sig?.typeHints || [
    'dr/cr', 'cr/dr', 'dr / cr', 'cr / dr', 'type (d/c)', 'd/c', 'type', 
    'cr/dr indicator', 'transaction type', 'status'
  ];
  const typeCol = findCol(typeHints, [mapping.dateCol, mapping.descCol]);
  if (typeCol) mapping.typeCol = typeCol;

  // Reference Column
  const refHints = sig?.refHints || [
    'chq/ref number', 'chq / ref no', 'chq no', 'cheque no', 'cheque number', 
    'transaction id', 'txn id', 'reference number', 'reference no', 'ref number', 
    'ref no', 'ref id', 'utr number', 'utr', 'rrn', 'order id', 'upi ref', 'ref'
  ];
  const refCol = findCol(refHints, [mapping.dateCol, mapping.descCol]);
  if (refCol) mapping.refCol = refCol;

  // Balance Column
  const balanceHints = sig?.balanceHints || [
    'closing balance (rs.)', 'closing balance (inr)', 'closing balance', 
    'available balance', 'book balance', 'running balance', 'balance', 'bal'
  ];
  const balanceCol = findCol(balanceHints, [mapping.dateCol, mapping.descCol]);
  if (balanceCol) mapping.balanceCol = balanceCol;

  return mapping;
}

function createEmptyLayoutResult(): LayoutIdentificationResult {
  return {
    entityCategory: 'unknown',
    entityName: 'Empty Statement',
    layoutName: 'No Data Detected',
    confidenceScore: 0,
    delimiter: ',',
    headerRowIndex: 0,
    detectedHeaders: [],
    columnMapping: { dateCol: '', descCol: '' },
    sampleRows: [],
    totalDataRows: 0
  };
}

/**
 * Detects if a text string is a placeholder in Paytm statements
 * (e.g. "Add sender or receiver name", "Add a note", "Notes & Tags")
 */
export function isPaytmPlaceholder(text?: string): boolean {
  if (!text) return true;
  const lower = text.trim().toLowerCase();
  if (lower.length === 0) return true;
  return (
    lower.includes('add sender') ||
    lower.includes('add receiver') ||
    lower.includes('add note') ||
    lower.includes('add a note') ||
    lower.includes('add tag') ||
    lower.includes('add a tag') ||
    lower.includes('add description') ||
    lower.includes('add comment') ||
    lower.includes('notes & tags') ||
    lower.includes('transaction details') ||
    lower === 'notes' ||
    lower === 'tags' ||
    lower === 'note' ||
    lower === 'tag'
  );
}

export type TransactionReferenceType = 
  | 'UTR'       // 1. NEFT (16 alphanumeric) / RTGS (22 alphanumeric)
  | 'RRN'       // 2. UPI & Debit/Credit Card 12-digit numeric code
  | 'UPI_REF'   // 3. UPI Transaction ID / UPI Ref No. (12-digit or alphanumeric)
  | 'IMPS'      // 4. IMPS Reference Number (12-digit)
  | 'CHQ'       // 5. Cheque Number (CHQ NO. - 6-digit)
  | 'DD'        // 6. Demand Draft Number (DD No.)
  | 'AUDIT'     // 7. Internal System / Switch Audit Codes (e.g. AT 00989, ATM logs)
  | 'REF';      // General reference

export interface ReferenceClassification {
  type: TransactionReferenceType;
  label: string; // e.g. "UTR", "RRN", "UPI Ref", "IMPS", "CHQ", "DD No.", "Audit Code", "Ref"
  value: string;
  bankTxnNumber?: string;
  upiUtr?: string;
}

/**
 * Classifies transaction references into the 7 primary Indian financial reference types:
 * 1. UTR (NEFT 16-char / RTGS 22-char)
 * 2. RRN (12-digit UPI / Card / POS switch code)
 * 3. UPI Transaction ID / UPI Ref No.
 * 4. IMPS Reference Number (12-digit)
 * 5. Cheque Number (CHQ NO. 6-digit)
 * 6. Demand Draft Number (DD No.)
 * 7. Internal System / Switch Audit Codes (e.g. AT 00989, ATM logs)
 */
export function classifyTransactionReference(
  desc: string,
  rawRef?: string,
  sourceType?: 'bank' | 'upi' | 'credit_card'
): ReferenceClassification | null {
  const combined = `${desc || ''} ${rawRef || ''}`.trim();
  if (!combined) return null;

  // 1. UTR (NEFT & RTGS)
  // RTGS UTR: 22 alphanumeric
  const rtgsMatch = combined.match(/\b(?:RTGS|RTGS\s*UTR)[.:/\s#-]*([A-Za-z0-9]{22})\b/i) ||
                     combined.match(/\b([A-Za-z]{4}[0-9]{18})\b/) ||
                     combined.match(/\b(R\d{21})\b/);
  if (rtgsMatch) {
    return {
      type: 'UTR',
      label: 'UTR',
      value: rtgsMatch[1],
      bankTxnNumber: rtgsMatch[1],
      upiUtr: rtgsMatch[1]
    };
  }

  // NEFT UTR: 16 alphanumeric
  const neftMatch = combined.match(/\b(?:NEFT|NEFT\s*UTR)[.:/\s#-]*([A-Za-z0-9]{16})\b/i) ||
                     combined.match(/\b([A-Za-z]{4}[0-9]{12})\b/) ||
                     combined.match(/\b(N\d{15})\b/);
  if (neftMatch) {
    return {
      type: 'UTR',
      label: 'UTR',
      value: neftMatch[1],
      bankTxnNumber: neftMatch[1],
      upiUtr: neftMatch[1]
    };
  }

  // Explicit UTR prefix marker
  const genericUtrMatch = combined.match(/\b(?:UTR|UTR\s*NO)[.:/\s#-]*([A-Za-z0-9]{12,22})\b/i);
  if (genericUtrMatch) {
    return {
      type: 'UTR',
      label: 'UTR',
      value: genericUtrMatch[1],
      bankTxnNumber: genericUtrMatch[1],
      upiUtr: genericUtrMatch[1]
    };
  }

  // 2. RRN (Retrieval Reference Number - Standard 12-digit numeric code from UPI / Card)
  const upiRrnMatch = combined.match(/UPI\/(?:CR|DR)\/(\d{12})\b/i) ||
                      combined.match(/\b(?:RRN|RETRIEVAL\s*REF)[.:/\s#-]*(\d{12})\b/i) ||
                      combined.match(/\b(\d{12})\b/);
  if (upiRrnMatch) {
    // Also grab secondary audit code if present
    const secAudit = combined.match(/\b(AT\s*\d{4,6})\b/i);
    return {
      type: 'RRN',
      label: 'RRN',
      value: upiRrnMatch[1],
      upiUtr: upiRrnMatch[1],
      bankTxnNumber: secAudit ? secAudit[1].trim() : upiRrnMatch[1]
    };
  }

  // 3. UPI Transaction ID / UPI Ref No. (e.g. PhonePe T26..., Order ID, UPI Ref)
  const upiRefMatch = combined.match(/\b(?:UPI\s*Ref\s*No|UPI\s*Txn\s*ID|UPI\s*Ref|Txn\s*ID|Order\s*ID)[.:/\s#-]*([A-Za-z0-9]{10,24})\b/i) ||
                      combined.match(/\b(T\d{13,20})\b/);
  if (upiRefMatch) {
    return {
      type: 'UPI_REF',
      label: 'UPI Ref',
      value: upiRefMatch[1],
      upiUtr: upiRefMatch[1]
    };
  }

  // 4. IMPS Reference Number (10 to 18 digits/alphanumeric with explicit IMPS marker)
  const impsMatch = combined.match(/\b(?:IMPS|IMPS\s*REF|IMPS\s*TXN|IMPS\s*P2A|IMPS\s*P2P|IMPS\s*P2U)[.:/\s#-]*([A-Za-z0-9]{10,18})\b/i);
  if (impsMatch) {
    return {
      type: 'IMPS',
      label: 'IMPS',
      value: impsMatch[1],
      bankTxnNumber: impsMatch[1]
    };
  }

  // 5. Cheque Number (CHQ NO.) - 6 digits
  const chqMatch = combined.match(/\b(?:CHQ|CHEQUE|CLG|CHQ\s*DEP|CHQ\s*CLR|CHQ\s*NO|CHQ\s*LEAF)[.:/\s#-]*(\d{6})\b/i);
  if (chqMatch) {
    return {
      type: 'CHQ',
      label: 'CHQ',
      value: chqMatch[1],
      bankTxnNumber: chqMatch[1]
    };
  }
  if (sourceType === 'bank' && rawRef && /^\d{6}$/.test(rawRef.trim())) {
    return {
      type: 'CHQ',
      label: 'CHQ',
      value: rawRef.trim(),
      bankTxnNumber: rawRef.trim()
    };
  }

  // 6. Demand Draft Number (DD No.)
  const ddMatch = combined.match(/\b(?:DD\s*NO|DEMAND\s*DRAFT|DD\s*NUM|DD\s*ISSUE)[.:/\s#-]*([A-Za-z0-9]{6,16})\b/i);
  if (ddMatch) {
    return {
      type: 'DD',
      label: 'DD No.',
      value: ddMatch[1],
      bankTxnNumber: ddMatch[1]
    };
  }

  // 7. Internal System / Switch Audit Codes (e.g. AT 00989, ATM logs)
  const auditMatch = combined.match(/\b(AT\s*\d{4,6})\b/i) ||
                     combined.match(/\b(ATM\s*(?:WDL|DEP|TXN)[\s\w-]*\b)/i) ||
                     combined.match(/\b(SW\s*\d{4,8})\b/i) ||
                     combined.match(/\b(SYS\/REV\w*)\b/i) ||
                     combined.match(/\b(BRN-TXN-\d+)\b/i) ||
                     combined.match(/\b(CHG\/\w+)\b/i);
  if (auditMatch) {
    const val = auditMatch[1].trim();
    return {
      type: 'AUDIT',
      label: 'Audit',
      value: val,
      bankTxnNumber: val
    };
  }

  // Fallback explicit reference (Card / REF)
  const fallbackMatch = combined.match(/\b(?:REF|REF\s*NO|AUTH\s*CODE)[.:/\s#-]*([A-Za-z0-9]{6,20})\b/i);
  if (fallbackMatch) {
    return {
      type: 'REF',
      label: 'Ref',
      value: fallbackMatch[1],
      bankTxnNumber: fallbackMatch[1]
    };
  }

  if (rawRef && rawRef.trim().length >= 4 && !/sample|test|none|null/i.test(rawRef)) {
    return {
      type: 'REF',
      label: 'Ref',
      value: rawRef.trim(),
      bankTxnNumber: rawRef.trim()
    };
  }

  return null;
}

/**
 * Removes raw CSV quotes, delimiter residue, and empty column markers
 * e.g. '" " "," " ,"CEMTEX...' -> 'CEMTEX...'
 * e.g. 'Received from MR Kora","-","-" ' -> 'Received from MR Kora'
 */
export function cleanCsvArtifacts(text: string): string {
  if (!text) return '';
  return text
    .replace(/"[\s,-]*"/g, ' ')
    .replace(/"/g, '')
    .replace(/,\s*,/g, ' ')
    .replace(/,\s*-\s*,/g, ' ')
    .replace(/\b-\s*-\b/g, '')
    .replace(/^[,\s./\\|_-]+|[,\s./\\|_-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface TransactionFlowResult {
  fromEntity: string;
  toEntity: string;
  senderName?: string;
  cleanParticulars: string;
}

/**
 * Resolves the explicit Direction of a transaction:
 * - FROM (Origin): Who sent or where the funds originated (Employer, Sender, Bank Account)
 * - TO (Destination): Who received or where the funds landed (Bank Account, Merchant, Payee)
 */
export function resolveTransactionFlow(
  type: 'credit' | 'debit',
  description: string,
  sourceEntity: string,
  receiverName?: string,
  category?: string
): TransactionFlowResult {
  const isCredit = type === 'credit';
  const clean = cleanCsvArtifacts(description);
  const cleanRec = cleanCsvArtifacts(receiverName || '');
  const bankAccount = sourceEntity || 'Bank Account';

  let fromEntity = '';
  let toEntity = '';
  let senderName: string | undefined = undefined;

  if (isCredit) {
    toEntity = bankAccount;

    const fromMatch = clean.match(/(?:received from|money received from|transfer from|from|refund from|cashback from)\s+([^,]+)/i);
    const salaryMatch = clean.match(/^([A-Za-z0-9&.-]+)\s+(?:dep by salar|salary|payroll|stipend)/i);
    const inbMatch = clean.match(/\bINB\s+(\d+)/i);
    const upiMatch = clean.match(/UPI\/(?:CR|DR)\/\d+\/([^/]+)/i);

    if (salaryMatch) {
      senderName = salaryMatch[1].trim();
      fromEntity = `${senderName} (Salary)`;
    } else if (fromMatch) {
      senderName = fromMatch[1].trim();
      fromEntity = senderName;
    } else if (upiMatch) {
      senderName = upiMatch[1].trim();
      fromEntity = senderName;
    } else if (cleanRec && cleanRec !== bankAccount) {
      senderName = cleanRec;
      fromEntity = cleanRec;
    } else if (inbMatch) {
      fromEntity = 'Online Transfer (INB)';
    } else if (category === 'Salary & Income' || /salary/i.test(clean)) {
      const parts = clean.split(/\s+/);
      fromEntity = parts.length > 0 && parts[0].length > 2 ? `${parts[0]} (Salary)` : 'Employer (Salary)';
    } else {
      const simplified = clean.replace(/\b(dep\s*tfr|credit|dep|deposit|received)\b/gi, '').trim();
      fromEntity = simplified.length > 2 ? simplified : 'Direct Deposit';
    }
  } else {
    fromEntity = bankAccount;

    const toMatch = clean.match(/(?:paid to|payment to|transfer to|to)\s+([^,]+)/i);
    const upiMatch = clean.match(/UPI\/(?:DR|CR)\/\d+\/([^/]+)/i);

    if (toMatch) {
      toEntity = toMatch[1].trim();
    } else if (upiMatch) {
      toEntity = upiMatch[1].trim();
    } else if (cleanRec && cleanRec !== bankAccount) {
      toEntity = cleanRec;
    } else {
      const simplified = clean.replace(/\b(wdl\s*tfr|debit|wdl|withdrawal|paid|payment)\b/gi, '').trim();
      toEntity = simplified.length > 2 ? simplified : 'Beneficiary / Merchant';
    }
  }

  return {
    fromEntity: cleanCsvArtifacts(fromEntity),
    toEntity: cleanCsvArtifacts(toEntity),
    senderName: senderName ? cleanCsvArtifacts(senderName) : undefined,
    cleanParticulars: clean || description
  };
}

/**
 * Removes placeholder text, payment gateway routing garbage, extracted reference numbers,
 * and deduplicates consecutive repeating phrases or names
 */
export function cleanDeduplicatedText(text: string, refValue?: string): string {
  if (!text) return '';
  let cleaned = cleanCsvArtifacts(text);

  // Strip known reference value if provided so it does not repeat inside the description
  if (refValue && refValue.length >= 4) {
    const escaped = refValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
    cleaned = cleaned.replace(new RegExp(`(?:UTR|RRN|IMPS|NEFT|CHQ|DD|Order ID|UPI Ref)[:/\\s-]*${escaped}`, 'gi'), '');
  }

  // Check if raw text contains structured bank UPI narration: e.g. DEP/WDL TFR UPI/(?:CR|DR)/<RRN>/<Party>/...
  const upiPattern = cleaned.match(/(?:DEP|WDL)?\s*TFR\s*UPI\/(?:CR|DR)\/\d+\/([^/]+)/i);
  if (upiPattern) {
    const party = upiPattern[1].trim();
    if (party && party.length >= 2) {
      const isDep = /DEP|CR/i.test(cleaned);
      return isDep ? `Received from ${party}` : `Paid to ${party}`;
    }
  }

  // Strip generic payment routing tokens: UPI/CR/, UPI/DR/, UPI/, IMPS/, NEFT/, RTGS/, POS/
  cleaned = cleaned.replace(/\b(?:DEP|WDL)\s*TFR\b/gi, '');
  cleaned = cleaned.replace(/\bUPI\/(?:CR|DR)\/\d{10,18}\//gi, '');
  cleaned = cleaned.replace(/\bUPI\/\d{10,18}\//gi, '');
  cleaned = cleaned.replace(/\b(?:NEFT|RTGS|IMPS)\/[A-Za-z0-9/-]+\//gi, '');
  cleaned = cleaned.replace(/\b(?:UTIB|SBIN|HDFC|ICIC|PUNB|BARB|KKBK|YESB|IDFB)[0-9A-Za-z]{0,7}\b\/?/gi, ''); // Bank / IFSC codes
  cleaned = cleaned.replace(/\b(?:AT\s*00\d{3}|ATM\s*WDL\b|POS\s*SWIPE\b)/gi, '');
  cleaned = cleaned.replace(/\bPaym\s+\d+\b/gi, '');

  // 1. Remove Paytm placeholder phrases
  cleaned = cleaned.replace(/\badd\s+sender(?:\s*[\/or]+\s*receiver)?(?:\s+name)?\b/gi, '');
  cleaned = cleaned.replace(/\badd\s+receiver(?:\s+name)?\b/gi, '');
  cleaned = cleaned.replace(/\badd\s+a?\s*(?:note|tag|description|comment)(?:\s*[\/or]+\s*(?:note|tag))?\b/gi, '');
  cleaned = cleaned.replace(/\bnotes?\s*&\s*tags?\b/gi, '');
  cleaned = cleaned.replace(/[#/\\|_-]{2,}/g, ' ');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  // Strip dangling slashes/dashes
  cleaned = cleaned.replace(/^[\s/\\|_-]+|[\s/\\|_-]+$/g, '').trim();
  cleaned = cleaned.replace(/(?:\s*[/\\-]+\s*){2,}/g, ' - ').trim();

  // 2. Remove immediate repeated identical consecutive halves
  // e.g. "Paid to Manoj Kumar Paid to Manoj Kumar" -> "Paid to Manoj Kumar"
  const halfLen = Math.floor(cleaned.length / 2);
  for (let len = halfLen; len >= 3; len--) {
    const firstHalf = cleaned.slice(0, len).trim();
    const secondHalf = cleaned.slice(len).trim();
    if (firstHalf && firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
      cleaned = firstHalf;
      break;
    }
  }

  // 3. Word-level deduplication for names e.g. "Manoj Kumar Manoj Kumar"
  const words = cleaned.split(/\s+/);
  if (words.length >= 4 && words.length % 2 === 0) {
    const half = words.length / 2;
    const w1 = words.slice(0, half).join(' ');
    const w2 = words.slice(half).join(' ');
    if (w1.toLowerCase() === w2.toLowerCase()) {
      cleaned = w1;
    }
  }

  return cleaned.trim();
}

/**
 * Converts a time string (12-hour AM/PM or 24-hour) to total seconds from 00:00:00
 * for accurate chronological sorting and comparisons
 */
export function timeToTotalSeconds(timeStr?: string): number {
  if (!timeStr) return -1;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return -1;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const period = match[4]?.toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Compares two time strings chronologically
 * Returns < 0 if timeA is earlier than timeB, > 0 if timeA is later, 0 if equal
 */
export function compareTimes(timeA?: string, timeB?: string): number {
  const tA = timeToTotalSeconds(timeA);
  const tB = timeToTotalSeconds(timeB);
  if (tA === -1 && tB === -1) return 0;
  if (tA === -1) return -1;
  if (tB === -1) return 1;
  return tA - tB;
}

/**
 * Standardizes time to canonical format (e.g. "08:35 PM" or "08:35:10 PM")
 * with 2-digit padded hours and uppercase AM/PM
 */
export function standardizeTime(raw?: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\s*(AM|PM))?\b/i);
  if (!match) return undefined;

  let hour = parseInt(match[1], 10);
  const min = match[2].padStart(2, '0');
  const sec = match[3] ? match[3].padStart(2, '0') : undefined;
  const period = match[4]?.toUpperCase();

  if (period) {
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    let h12 = hour % 12;
    if (h12 === 0) h12 = 12;
    const h12Str = String(h12).padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return sec ? `${h12Str}:${min}:${sec} ${ampm}` : `${h12Str}:${min} ${ampm}`;
  }

  // 24-hour time without AM/PM
  let h12 = hour % 12;
  if (h12 === 0) h12 = 12;
  const h12Str = String(h12).padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return sec ? `${h12Str}:${min}:${sec} ${ampm}` : `${h12Str}:${min} ${ampm}`;
}

/**
 * DEDICATED PAYTM UPI PASSBOOK & STATEMENT PARSER
 * Accurately parses Paytm passbook payment history statements (PDF / text / CSV),
 * correctly resolving:
 * - Robust Statement period & year attribution (detects years from period or explicit transaction dates, never hardcoded 2026)
 * - Exact transaction timestamps with canonical 12-hour AM/PM normalization
 * - Complete Sender / Receiver identification without repetition of "Add sender or receiver name"
 * - Removal of duplicate repetitive text and placeholder phrases
 * - Real 12-digit UPI UTRs and Order IDs
 * - Exact monetary amounts (no prefix shifts)
 * - Native Purpose Tags (# Money Received, # Travel, # Food, etc.)
 */
export function isPaytmStatement(content: string, fileName = ''): boolean {
  const combined = (content + ' ' + fileName).toLowerCase();
  return (
    combined.includes('paytm') &&
    (combined.includes('passbook payments history') ||
     combined.includes('paytm statement for') ||
     combined.includes('upi ref no') ||
     combined.includes('total money paid') ||
     combined.includes('total money received') ||
     combined.includes('wallet txn id') ||
     combined.includes('paytm_upi') ||
     combined.includes('paytm upi') ||
     combined.includes('order id') ||
     combined.includes('activity') ||
     combined.includes('transaction details'))
  );
}

export function parsePhonePeStatement(rawContent: string): NormalizedStatementRecord[] {
  const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const records: NormalizedStatementRecord[] = [];
  const currentCalYear = new Date().getFullYear();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(/^([a-zA-Z]{3}\s+\d{1,2},\s+\d{4}|\d{1,2}\s+[a-zA-Z]{3},?\s+\d{4})/i);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const normalizedDate = standardizeDate(dateStr, currentCalYear);
      const time = standardizeTime(extractTime(line) || (i + 1 < lines.length ? extractTime(lines[i + 1]) : undefined));

      let desc = '';
      let amount = 0;
      let isCredit = false;

      for (let j = i; j < Math.min(i + 6, lines.length); j++) {
        const sub = lines[j];
        if (/Paid to|Received from|Add money|Payment to/i.test(sub) && !desc) {
          desc = sub;
        }
        if (/CREDIT/i.test(sub)) isCredit = true;
        const amtMatch = sub.match(/(?:Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
        if (amtMatch && amount === 0) {
          amount = parseFloat(amtMatch[1].replace(/,/g, ''));
        }
      }

      if (amount > 0 && normalizedDate) {
        const debit = isCredit ? 0 : amount;
        const credit = isCredit ? amount : 0;
        const netAmount = isCredit ? amount : -amount;
        const receiver = extractReceiverName(desc, 'upi');
        const category = categorizeTransaction(desc);
        const tag = deriveTransactionTag(category, desc);
        const refClass = classifyTransactionReference(desc, '', 'upi');
        const flow = resolveTransactionFlow(isCredit ? 'credit' : 'debit', desc, 'PhonePe', receiver, category);

        records.push({
          id: `phonepe_${Date.now()}_${records.length}`,
          date: normalizedDate,
          time,
          description: flow.cleanParticulars || desc || 'PhonePe UPI Transaction',
          receiverName: flow.toEntity || receiver,
          senderName: flow.senderName,
          fromEntity: flow.fromEntity,
          toEntity: flow.toEntity,
          tag,
          sourceType: 'upi',
          sourceEntity: 'PhonePe',
          category,
          referenceNo: refClass?.value || '',
          upiUtr: refClass?.upiUtr,
          referenceType: refClass?.type,
          referenceLabel: refClass?.label,
          debit,
          credit,
          netAmount,
          detectedLayout: 'PhonePe UPI Statement Layout'
        });
      }
    }
  }

  return records;
}

export function parseGooglePayStatement(rawContent: string): NormalizedStatementRecord[] {
  return parsePhonePeStatement(rawContent);
}

export function parsePaytmPassbookStatement(rawContent: string): NormalizedStatementRecord[] | null {
  if (!rawContent) return null;
  if (!isPaytmStatement(rawContent)) return null;

  const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // 1. Detect statement period and years from header or document content
  const currentCalYear = new Date().getFullYear();
  let startYear = currentCalYear;
  let endYear = currentCalYear;
  let endMonth = 12;

  // Look for statement period ranges: e.g. "Paytm Statement for 30 SEP'24 - 29 SEP'25" or "01 Oct 2023 - 30 Sep 2024"
  const periodMatch = rawContent.match(/(?:Paytm Statement for|Statement Period:?|Period:?)\s*(\d{1,2}\s+[a-zA-Z]{3}['\s]*(\d{2,4}))\s*[-to]+\s*(\d{1,2}\s+[a-zA-Z]{3}['\s]*(\d{2,4}))/i);
  if (periodMatch) {
    let sy = periodMatch[2];
    let ey = periodMatch[4];
    if (sy.length === 2) sy = `20${sy}`;
    if (ey.length === 2) ey = `20${ey}`;
    startYear = parseInt(sy, 10);
    endYear = parseInt(ey, 10);

    const emMatch = periodMatch[3].match(/[a-zA-Z]{3}/);
    if (emMatch) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const idx = monthNames.indexOf(emMatch[0].toLowerCase());
      if (idx >= 0) endMonth = idx + 1;
    }
  } else {
    // Scan for all 4-digit years in the text e.g. 2023, 2024, 2025
    const yrMatches = rawContent.match(/\b(20[12]\d)\b/g);
    if (yrMatches && yrMatches.length > 0) {
      const yrNums = yrMatches.map(y => parseInt(y, 10)).filter(y => y >= 2015 && y <= currentCalYear + 1);
      if (yrNums.length > 0) {
        const counts: Record<number, number> = {};
        for (const y of yrNums) counts[y] = (counts[y] || 0) + 1;
        const sortedYears = Object.keys(counts).map(Number).sort((a, b) => counts[b] - counts[a]);
        endYear = sortedYears[0];
        startYear = sortedYears[0];
      }
    }
  }

  // 2. CHECK IF THIS IS A STRUCTURED CSV / TSV EXPORT
  const delimiter = lines.slice(0, 10).some(l => l.includes('\t')) ? '\t' : ',';
  let headerRowIdx = -1;

  for (let li = 0; li < Math.min(15, lines.length); li++) {
    const l = lines[li].toLowerCase();
    const hasDelimiter = l.includes(',') || l.includes('\t');
    if (hasDelimiter && l.includes('date') && (l.includes('detail') || l.includes('activity') || l.includes('amount') || l.includes('upi') || l.includes('paid') || l.includes('order id') || l.includes('debit') || l.includes('credit'))) {
      headerRowIdx = li;
      break;
    }
  }

  // If structured CSV table detected, parse using dedicated column mappings
  if (headerRowIdx !== -1) {
    const headerCells = parseCsvRow(lines[headerRowIdx], delimiter).map(h => h.trim().toLowerCase());
    
    const dateIdx = headerCells.findIndex(h => h.includes('date'));
    let timeIdx = headerCells.findIndex(h => h === 'time' || (h.includes('time') && !h.includes('date')));
    const descIdx = headerCells.findIndex(h => h.includes('detail') || h.includes('activity') || h.includes('particular') || h.includes('narration') || h.includes('description'));
    const notesIdx = headerCells.findIndex(h => h.includes('note') || h.includes('tag'));
    const amountIdx = headerCells.findIndex(h => h === 'amount' || (h.includes('amount') && !h.includes('debit') && !h.includes('credit')));
    const debitIdx = headerCells.findIndex(h => h.includes('debit') || h.includes('paid') || h.includes('payment made'));
    const creditIdx = headerCells.findIndex(h => h.includes('credit') || h.includes('received') || h.includes('payment received'));
    const refIdx = headerCells.findIndex(h => h.includes('upi ref') || h.includes('ref no') || h.includes('order id') || h.includes('wallet txn id'));

    const csvRecords: NormalizedStatementRecord[] = [];

    for (let i = headerRowIdx + 1; i < lines.length; i++) {
      const cells = parseCsvRow(lines[i], delimiter);
      if (cells.length < 2) continue;

      // Date & Time
      const rawDateCell = dateIdx >= 0 ? cells[dateIdx] : '';
      let normalizedDate = standardizeDate(rawDateCell, endYear);
      let time = timeIdx >= 0 ? standardizeTime(cells[timeIdx]) : undefined;

      if (!time) {
        time = standardizeTime(extractTime(rawDateCell) || extractTime(lines[i]));
      }

      if (!normalizedDate) {
        for (let c = 0; c < cells.length; c++) {
          const test = standardizeDate(cells[c], endYear);
          if (test) {
            normalizedDate = test;
            if (!time) time = standardizeTime(extractTime(cells[c]));
            break;
          }
        }
      }
      if (!normalizedDate) continue;

      // Amounts
      let debit = debitIdx >= 0 ? parseAmount(cells[debitIdx]) : 0;
      let credit = creditIdx >= 0 ? parseAmount(cells[creditIdx]) : 0;

      if (debit === 0 && credit === 0 && amountIdx >= 0 && cells[amountIdx]) {
        const amtVal = parseAmount(cells[amountIdx]);
        const amtStr = cells[amountIdx].toLowerCase();
        if (amtStr.includes('+') || amtStr.includes('cr') || amtStr.includes('credit') || amtStr.includes('received')) {
          credit = amtVal;
        } else {
          debit = amtVal;
        }
      }

      if (debit === 0 && credit === 0) {
        const amtMatch = lines[i].match(/([+-])\s*(?:Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
        if (amtMatch) {
          const val = parseFloat(amtMatch[2].replace(/,/g, ''));
          if (amtMatch[1] === '+') credit = val;
          else debit = val;
        }
      }

      if (debit === 0 && credit === 0) continue;
      const isCredit = credit > 0;
      const netAmount = isCredit ? credit : -debit;

      // Description & Counterparty
      let rawDesc = descIdx >= 0 && cells[descIdx] ? cells[descIdx].trim() : '';
      if (isPaytmPlaceholder(rawDesc)) {
        rawDesc = '';
        for (let c = 0; c < cells.length; c++) {
          if (c !== dateIdx && c !== timeIdx && c !== amountIdx && c !== debitIdx && c !== creditIdx && c !== refIdx && c !== notesIdx) {
            const cand = cells[c].trim();
            if (cand && !isPaytmPlaceholder(cand) && !/^[\d\s.,\-+₹$()]+$/.test(cand) && cand.length > 2) {
              rawDesc = cand;
              break;
            }
          }
        }
      }
      rawDesc = cleanDeduplicatedText(rawDesc);
      if (!rawDesc || isPaytmPlaceholder(rawDesc)) {
        rawDesc = isCredit ? 'Money Received' : 'UPI Payment';
      }

      let receiver = extractReceiverName(rawDesc, 'upi');
      if (isPaytmPlaceholder(receiver)) {
        receiver = '';
      }
      if (!receiver) {
        if (/^Paid to\s+/i.test(rawDesc)) {
          receiver = cleanDeduplicatedText(rawDesc.replace(/^Paid to\s+/i, ''));
        } else if (/^Received from\s+/i.test(rawDesc)) {
          receiver = cleanDeduplicatedText(rawDesc.replace(/^Received from\s+/i, ''));
        } else if (!/\b(upi|payment|money|transfer)\b/i.test(rawDesc)) {
          receiver = rawDesc;
        }
      }
      if (isPaytmPlaceholder(receiver)) {
        receiver = isCredit ? 'UPI Sender' : 'UPI Recipient';
      }

      // Purpose Tag
      let tag = '';
      if (notesIdx >= 0 && cells[notesIdx]) {
        const notesCell = cells[notesIdx].trim();
        if (!isPaytmPlaceholder(notesCell)) {
          tag = notesCell.replace(/^[#\s]+/, '').trim();
        }
      }

      let category = categorizeTransaction(rawDesc);
      if (tag.toLowerCase().includes('travel')) category = 'Travel & Fuel';
      else if (tag.toLowerCase().includes('food')) category = 'Food & Dining';
      else if (tag.toLowerCase().includes('grocer')) category = 'Groceries';
      else if (tag.toLowerCase().includes('bill')) category = 'Utilities & Bills';
      else if (tag.toLowerCase().includes('money received')) category = 'Transfer';

      if (!tag) {
        tag = deriveTransactionTag(category, rawDesc);
      }

      // Reference / UTR classification
      const refClass = classifyTransactionReference(rawDesc, refIdx >= 0 ? cells[refIdx] : lines[i], 'upi');
      const upiUtr = refClass?.upiUtr;
      const referenceNo = refClass?.value || '';
      const cleanDesc = cleanDeduplicatedText(rawDesc, refClass?.value);
      const flow = resolveTransactionFlow(isCredit ? 'credit' : 'debit', cleanDesc || rawDesc, 'Paytm', receiver, category);

      csvRecords.push({
        id: `paytm_${Date.now()}_${i}`,
        date: normalizedDate,
        time,
        description: flow.cleanParticulars || cleanDesc || rawDesc,
        receiverName: flow.toEntity || receiver,
        senderName: flow.senderName,
        fromEntity: flow.fromEntity,
        toEntity: flow.toEntity,
        tag,
        sourceType: 'upi',
        sourceEntity: 'Paytm',
        category,
        referenceNo,
        bankTxnNumber: refClass?.bankTxnNumber,
        upiUtr,
        referenceType: refClass?.type,
        referenceLabel: refClass?.label,
        debit,
        credit,
        netAmount,
        detectedLayout: 'Paytm UPI Passbook Layout'
      });
    }

    if (csvRecords.length > 0) {
      return csvRecords;
    }
  }

  // 3. PARSE PDF / TEXT MULTI-LINE TRANSACTION STREAM
  const historyIdx = rawContent.search(/Passbook Payments History/i);
  const targetText = historyIdx >= 0 ? rawContent.slice(historyIdx) : rawContent;
  const textLines = targetText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const dateStartRegex = /^(?:["']\s*)?(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:['\s]*\d{2,4})?|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/i;

  const chunks: { dateStr: string; lines: string[] }[] = [];
  let currentChunk: { dateStr: string; lines: string[] } | null = null;

  for (const line of textLines) {
    if (/date\s*&\s*time|transaction details|notes\s*&\s*tags|your account|passbook payments history|all payments done/i.test(line)) {
      continue;
    }

    const dMatch = line.match(dateStartRegex);
    if (dMatch) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = {
        dateStr: dMatch[1].trim(),
        lines: [line]
      };
    } else if (currentChunk) {
      currentChunk.lines.push(line);
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  if (chunks.length === 0) return null;

  const monthMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };

  let currentYear = endYear;
  let prevMonth = endMonth;
  const records: NormalizedStatementRecord[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkText = chunk.lines.join(' ');

    // 1. Date & Year calculation
    let normalizedDate = standardizeDate(chunk.dateStr, currentYear);
    if (!normalizedDate) {
      const dm = chunk.dateStr.match(/(\d{1,2})\s*([a-zA-Z]{3})/i);
      if (!dm) continue;
      const day = dm[1].padStart(2, '0');
      const monStr = dm[2].toLowerCase();
      const monthNum = monthMap[monStr] || 9;
      const month = String(monthNum).padStart(2, '0');

      if (prevMonth !== -1 && monthNum > prevMonth + 2) {
        currentYear -= 1;
      }
      prevMonth = monthNum;
      normalizedDate = `${currentYear}-${month}-${day}`;
    }

    // 2. Time
    const time = standardizeTime(extractTime(chunkText));

    // 3. Amount & Direction (+ for received/credit, - for paid/debit)
    // Priority 1: with currency symbol Rs. / ₹ / INR (e.g. "- Rs. 350.00", "+ Rs. 1,000.00")
    let amtMatch = chunkText.match(/([+-])\s*(?:Rs\.?|₹|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amtMatch) {
      // Priority 2: line starting or preceded by space/quote with signed decimal amount
      amtMatch = chunkText.match(/(?:^|["'\s])([+-])\s*([\d,]+\.\d{2})\b/);
    }
    if (!amtMatch) {
      amtMatch = chunkText.match(/([+-])\s*([\d,]+(?:\.\d{1,2})?)/);
    }
    if (!amtMatch) continue;

    const sign = amtMatch[1];
    const rawAmt = amtMatch[2].replace(/,/g, '');
    const amountVal = parseFloat(rawAmt);
    if (isNaN(amountVal) || amountVal <= 0) continue;

    const isCredit = sign === '+';
    const credit = isCredit ? amountVal : 0;
    const debit = isCredit ? 0 : amountVal;
    const netAmount = isCredit ? amountVal : -amountVal;

    // 4. Reference classification (UTR / RRN / Order ID / IMPS)
    const refClass = classifyTransactionReference(chunkText, '', 'upi');
    const upiUtr = refClass?.upiUtr;
    const referenceNo = refClass?.value || '';

    // 5. UPI ID
    const upiIdMatch = chunkText.match(/UPI ID:?\s*([^\s,"]+@[^\s,"]+)/i);
    const upiId = upiIdMatch ? upiIdMatch[1].trim() : undefined;

    // 6. Tag
    let tag = '';
    const tagMatch = chunkText.match(/Tag:?\s*#?([^\n\r",]+)/i);
    if (tagMatch) {
      const candidateTag = tagMatch[1].replace(/[#\s]+/g, ' ').replace(/[^\w\s]/g, '').trim();
      if (!isPaytmPlaceholder(candidateTag)) {
        tag = candidateTag;
      }
    }

    // 7. Party Name & Sender / Receiver Description
    let partyName = '';

    // First: Look for explicit payment narration lines
    for (const l of chunk.lines) {
      const cleanedLine = cleanDeduplicatedText(l.replace(/^["']|["']$/g, '').trim());
      if (isPaytmPlaceholder(cleanedLine)) continue;
      if (/^(?:Paid to|Payment to|Money sent to|Received from|Money received from|Transfer to|Transfer from|Cashback from|Refund from|Automatic payment of)/i.test(cleanedLine)) {
        partyName = cleanedLine;
        break;
      }
    }

    // Second: If no explicit narration line, look for first clean non-metadata line
    if (!partyName) {
      for (const l of chunk.lines) {
        const cleanedLine = cleanDeduplicatedText(l.replace(/^["']|["']$/g, '').trim());
        if (isPaytmPlaceholder(cleanedLine)) continue;
        if (cleanedLine.includes(chunk.dateStr) || /^\d{1,2}\s+[a-zA-Z]{3}/i.test(cleanedLine)) continue;
        if (/^\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?$/i.test(cleanedLine)) continue;
        if (/^(?:UPI ID|UPI Ref|Bank Ref|Order ID|Tag:|Note:|Your Account|Other UPI|State Bank|Paytm Payments Bank|HDFC Bank|ICICI Bank|[+-]\s*Rs)/i.test(cleanedLine)) continue;
        if (cleanedLine.length < 2) continue;
        partyName = cleanedLine;
        break;
      }
    }

    partyName = cleanDeduplicatedText(partyName);
    if (!partyName || isPaytmPlaceholder(partyName)) {
      partyName = isCredit ? 'Money Received' : 'UPI Payment';
    }

    // Counterparty extraction
    let counterparty = extractReceiverName(partyName, 'upi');
    if (isPaytmPlaceholder(counterparty)) {
      counterparty = '';
    }
    if (!counterparty) {
      if (/^Paid to\s+/i.test(partyName)) {
        counterparty = cleanDeduplicatedText(partyName.replace(/^Paid to\s+/i, ''));
      } else if (/^Received from\s+/i.test(partyName)) {
        counterparty = cleanDeduplicatedText(partyName.replace(/^Received from\s+/i, ''));
      } else if (!/\b(upi|payment|money|transfer)\b/i.test(partyName)) {
        counterparty = partyName;
      }
    }
    if (isPaytmPlaceholder(counterparty)) {
      counterparty = isCredit ? 'UPI Sender' : 'UPI Recipient';
    }

    // Inferred Category
    let category = categorizeTransaction(partyName);
    if (tag.toLowerCase().includes('travel')) category = 'Travel & Fuel';
    else if (tag.toLowerCase().includes('food')) category = 'Food & Dining';
    else if (tag.toLowerCase().includes('grocer')) category = 'Groceries';
    else if (tag.toLowerCase().includes('bill')) category = 'Utilities & Bills';
    else if (tag.toLowerCase().includes('money received')) category = 'Transfer';

    if (!tag) {
      tag = deriveTransactionTag(category, partyName);
    }

    records.push({
      id: `paytm_${Date.now()}_${i}`,
      date: normalizedDate,
      time,
      description: cleanDeduplicatedText(partyName, refClass?.value),
      receiverName: cleanDeduplicatedText(counterparty, refClass?.value),
      tag,
      sourceType: 'upi',
      sourceEntity: 'Paytm',
      category,
      referenceNo,
      bankTxnNumber: refClass?.bankTxnNumber,
      upiUtr,
      referenceType: refClass?.type,
      referenceLabel: refClass?.label,
      debit,
      credit,
      netAmount,
      detectedLayout: 'Paytm UPI Passbook Layout'
    });
  }

  return records.length > 0 ? records : null;
}

/**
 * 3. NORMALISATION ENGINE
 * Normalizes all detected rows into the canonical format:
 * Date, Description, SourceType, SourceEntity, Category, ReferenceNo, DebitAmount, CreditAmount, NetAmount, Balance, Status
 */
export function normalizeStatementData(
  rawContent: string,
  layout: LayoutIdentificationResult,
  customMapping?: ColumnMappingConfig,
  overrideEntity?: string
): NormalizedStatementRecord[] {
  // Check dedicated Paytm Passbook parser first
  if (isPaytmStatement(rawContent, overrideEntity || layout.entityName)) {
    const paytmRecords = parsePaytmPassbookStatement(rawContent);
    if (paytmRecords && paytmRecords.length > 0) {
      return paytmRecords;
    }
  }

  const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= layout.headerRowIndex + 1) return [];

  const headers = layout.detectedHeaders;
  const mapping = customMapping || layout.columnMapping;
  const delimiter = layout.delimiter;

  const findIdx = (colName?: string) => {
    if (!colName) return -1;
    const lower = colName.toLowerCase().trim();
    const exact = headers.findIndex(h => h.toLowerCase().trim() === lower);
    if (exact !== -1) return exact;
    return headers.findIndex(h => {
      const hl = h.toLowerCase().trim();
      return hl.length > 0 && (hl.includes(lower) || lower.includes(hl));
    });
  };

  let dateIdx = findIdx(mapping.dateCol);
  const descIdx = findIdx(mapping.descCol);
  let debitIdx = findIdx(mapping.debitCol);
  let creditIdx = findIdx(mapping.creditCol);
  let amountIdx = findIdx(mapping.amountCol);
  const typeIdx = findIdx(mapping.typeCol);
  const refIdx = findIdx(mapping.refCol);
  const balanceIdx = findIdx(mapping.balanceCol);

  // If dateIdx was not found by name, check if any header contains date or dt
  if (dateIdx === -1) {
    dateIdx = headers.findIndex(h => /(^|[^a-z])(date|dt|time)([^a-z]|$)/i.test(h));
  }

  // If amount column was not found, check if any header contains amount hints
  if (debitIdx === -1 && creditIdx === -1 && amountIdx === -1) {
    amountIdx = headers.findIndex((h, idx) => 
      idx !== dateIdx && idx !== descIdx && /amount|amt|withdrawal|deposit|debit|credit|dr|cr|spent|received|inflow|outflow/i.test(h)
    );
  }

  // Sniff data rows directly if headers did not identify date or amount columns
  if (dateIdx === -1 || (debitIdx === -1 && creditIdx === -1 && amountIdx === -1)) {
    for (let r = Math.max(0, layout.headerRowIndex + 1); r < Math.min(layout.headerRowIndex + 20, lines.length); r++) {
      const sampleCells = parseCsvRow(lines[r], delimiter);
      if (dateIdx === -1) {
        for (let c = 0; c < sampleCells.length; c++) {
          if (standardizeDate(sampleCells[c])) {
            dateIdx = c;
            break;
          }
        }
      }
      if (debitIdx === -1 && creditIdx === -1 && amountIdx === -1) {
        for (let c = 0; c < sampleCells.length; c++) {
          if (c !== dateIdx && parseAmount(sampleCells[c]) > 0) {
            amountIdx = c;
            break;
          }
        }
      }
    }
  }

  const entityName = overrideEntity || layout.entityName;
  const sourceType = layout.entityCategory === 'unknown' ? 'bank' : layout.entityCategory;

  // If still no identifiable column, attempt the raw pattern fallback scanner before rejecting
  if (dateIdx === -1 || (debitIdx === -1 && creditIdx === -1 && amountIdx === -1)) {
    return extractTransactionsFromRawText(rawContent, entityName, sourceType);
  }

  const records: NormalizedStatementRecord[] = [];

  for (let i = layout.headerRowIndex + 1; i < lines.length; i++) {
    const cells = parseCsvRow(lines[i], delimiter);
    if (cells.length < 2) continue;

    // 1. Date normalization (MUST BE A GENUINE DATE, NO MADE-UP DATES)
    const rawDate = dateIdx >= 0 && cells[dateIdx] ? cells[dateIdx] : '';
    let normalizedDate = standardizeDate(rawDate);

    // If date was not found at dateIdx, try checking all cells in row
    if (!normalizedDate) {
      for (let c = 0; c < cells.length; c++) {
        if (c !== dateIdx) {
          const testDate = standardizeDate(cells[c]);
          if (testDate) {
            normalizedDate = testDate;
            break;
          }
        }
      }
    }

    // If still no valid date, this line is metadata, empty, or unrelated
    if (!normalizedDate) {
      continue;
    }

    // 2. Description
    const rawDesc = descIdx >= 0 && cells[descIdx] ? cells[descIdx] : '';
    let cleanDesc = sanitizeText(rawDesc);
    
    // If empty description or placeholder, look for another non-numeric cell
    if (!cleanDesc || isPaytmPlaceholder(cleanDesc)) {
      cleanDesc = '';
      for (let c = 0; c < cells.length; c++) {
        if (c !== dateIdx && c !== debitIdx && c !== creditIdx && c !== amountIdx && c !== balanceIdx) {
          const cand = sanitizeText(cells[c]);
          if (cand && !isPaytmPlaceholder(cand) && !/^[\d\s.,\-+₹$()]+$/.test(cand) && cand.length > 2) {
            cleanDesc = cand;
            break;
          }
        }
      }
    }
    cleanDesc = cleanDeduplicatedText(cleanDesc);
    if (!cleanDesc || isPaytmPlaceholder(cleanDesc)) cleanDesc = 'Transaction';

    const lowerDesc = cleanDesc.toLowerCase();
    // Skip summary / opening balance / closing balance / total rows
    if (
      lowerDesc.startsWith('opening balance') || 
      lowerDesc.startsWith('closing balance') ||
      lowerDesc.startsWith('total') || 
      lowerDesc.startsWith('grand total') || 
      lowerDesc.includes('brought forward') || 
      lowerDesc.includes('carried forward')
    ) {
      continue;
    }

    // 3. Debit & Credit amounts
    let debit = 0;
    let credit = 0;

    if (debitIdx >= 0 && cells[debitIdx]) {
      debit = parseAmount(cells[debitIdx]);
    }
    if (creditIdx >= 0 && cells[creditIdx]) {
      credit = parseAmount(cells[creditIdx]);
    }

    // If single amount column
    if (debit === 0 && credit === 0 && amountIdx >= 0 && cells[amountIdx]) {
      const parsed = parseAmount(cells[amountIdx]);
      if (parsed > 0) {
        let isCredit = false;

        if (typeIdx >= 0 && cells[typeIdx]) {
          const typeStr = cells[typeIdx].toLowerCase();
          if (typeStr.includes('cr') || typeStr.includes('credit') || typeStr.includes('deposit') || typeStr.includes('received')) {
            isCredit = true;
          } else if (typeStr.includes('dr') || typeStr.includes('debit') || typeStr.includes('withdrawal') || typeStr.includes('paid')) {
            isCredit = false;
          }
        } else if (cells[amountIdx].toLowerCase().includes('cr') || cells[amountIdx].includes('+')) {
          isCredit = true;
        } else if (cells[amountIdx].toLowerCase().includes('dr') || cells[amountIdx].includes('-') || cells[amountIdx].startsWith('(')) {
          isCredit = false;
        } else {
          // Heuristic based on description
          isCredit = /salary|dividend|interest|refund|cashback|deposit|received|credit/i.test(cleanDesc);
        }

        if (isCredit) {
          credit = parsed;
        } else {
          debit = parsed;
        }
      }
    }

    // Fallback: check remaining cells for amounts if debit/credit not yet found
    if (debit === 0 && credit === 0) {
      for (let c = cells.length - 1; c >= 0; c--) {
        if (c !== dateIdx && c !== descIdx) {
          const val = parseAmount(cells[c]);
          if (val > 0 && val < 500000000) {
            const cellText = (cells[c] + ' ' + (cells[c + 1] || '')).toLowerCase();
            if (cellText.includes('cr') || cellText.includes('+')) {
              credit = val;
            } else {
              debit = val;
            }
            break;
          }
        }
      }
    }

    // Strict validation: transaction must have either debit > 0 or credit > 0
    if (debit === 0 && credit === 0) {
      continue;
    }

    // 4. Net amount
    const netAmount = credit > 0 ? credit : -debit;

    // 5. Category inference & Tag
    const category = categorizeTransaction(cleanDesc);
    const tag = deriveTransactionTag(category, cleanDesc);

    // 6. Time and Receiver Extraction
    const time = standardizeTime(extractTime(lines[i]));
    const receiverName = extractReceiverName(cleanDesc, sourceType);

    // 7. Reference Number & UTR Classification
    const rawRefCell = refIdx >= 0 && cells[refIdx] ? cells[refIdx].trim() : '';
    const refClass = classifyTransactionReference(cleanDesc, rawRefCell, sourceType);
    const referenceNo = refClass?.value || rawRefCell || '';
    const cleanDescWithoutRef = cleanDeduplicatedText(cleanDesc, refClass?.value);

    // 8. Balance
    const balance = balanceIdx >= 0 && cells[balanceIdx] ? parseAmount(cells[balanceIdx]) : undefined;

    // 9. Direction & Flow (FROM -> TO)
    const isCredit = credit > 0;
    const finalDesc = cleanDescWithoutRef || cleanDesc;
    const flow = resolveTransactionFlow(isCredit ? 'credit' : 'debit', finalDesc, entityName, receiverName, category);

    records.push({
      id: `norm_${Date.now()}_${i}`,
      date: normalizedDate,
      time,
      description: flow.cleanParticulars || finalDesc,
      receiverName: flow.toEntity || cleanDeduplicatedText(receiverName, refClass?.value),
      senderName: flow.senderName,
      fromEntity: flow.fromEntity,
      toEntity: flow.toEntity,
      tag,
      sourceType,
      sourceEntity: entityName,
      category,
      referenceNo,
      bankTxnNumber: refClass?.bankTxnNumber,
      upiUtr: refClass?.upiUtr,
      referenceType: refClass?.type,
      referenceLabel: refClass?.label,
      debit,
      credit,
      netAmount,
      balance,
      detectedLayout: layout.layoutName
    });
  }

  // If table-based parsing found 0 valid records or missed records, check deep scanner
  const fallbackRecords = extractTransactionsFromRawText(rawContent, entityName, sourceType);
  if (records.length === 0) {
    if (fallbackRecords.length > 0) {
      return fallbackRecords;
    }
  } else if (fallbackRecords.length > records.length + 15) {
    // If deep scanner captured far more multi-year transactions (e.g. 4-year history), prefer fuller dataset
    return fallbackRecords;
  }

  return records;
}

/**
 * DEEP PATTERN RECOGNITION SCANNER
 * Rescues unstructured, space-separated, non-standard, or messy statement lines
 * Extracts transactions directly using date + currency/amount + narration patterns
 */
export function extractTransactionsFromRawText(
  rawContent: string,
  entityName = 'Statement',
  sourceType: 'bank' | 'upi' | 'credit_card' = 'bank'
): NormalizedStatementRecord[] {
  // Check dedicated Paytm Passbook parser first
  if (isPaytmStatement(rawContent, entityName)) {
    const paytmRecords = parsePaytmPassbookStatement(rawContent);
    if (paytmRecords && paytmRecords.length > 0) {
      return paytmRecords;
    }
  }

  const clean = (rawContent || '').replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 5);
  const records: NormalizedStatementRecord[] = [];

  const datePattern = /\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[\s\-/](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-/]\d{2,4})\b/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip summary / opening balance / closing balance / total rows
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.startsWith('opening balance') ||
      lowerLine.startsWith('closing balance') ||
      lowerLine.startsWith('total') ||
      lowerLine.includes('page ') ||
      lowerLine.includes('statement period')
    ) {
      continue;
    }

    // 1. Find all dates on the line (e.g. Txn Date AND Value Date)
    const datesFound = line.match(datePattern);
    if (!datesFound || datesFound.length === 0) continue;

    const normDate = standardizeDate(datesFound[0]);
    if (!normDate) continue;

    // CRUCIAL: Strip ALL date tokens from the line so Value Date is never mistaken for amount or leaves slashes
    let lineWithoutDates = line;
    for (const d of datesFound) {
      lineWithoutDates = lineWithoutDates.replace(d, ' ');
    }

    // 2. Extract genuine financial amounts:
    // First Priority: Explicit decimal numbers (e.g. 860.00, 5,334.67, 454.00, 0.67) or currency prefixed numbers
    const decimalRegex = /(?:₹|Rs\.?|INR)?\s*(\b\d{1,3}(?:,\d{2,3})*\.\d{2}\b|\b\d+\.\d{2}\b)/gi;
    const foundAmounts: { val: number; raw: string }[] = [];
    let amtMatch;
    while ((amtMatch = decimalRegex.exec(lineWithoutDates)) !== null) {
      const val = parseAmount(amtMatch[1]);
      if (val > 0 && val < 500000000) {
        foundAmounts.push({ val, raw: amtMatch[0] });
      }
    }

    // Fallback: If no decimal numbers, look for currency-prefixed whole numbers
    if (foundAmounts.length === 0) {
      const currRegex = /(?:₹|Rs\.?|INR)\s*(\b\d{1,3}(?:,\d{2,3})*\b|\b\d+\b)/gi;
      while ((amtMatch = currRegex.exec(lineWithoutDates)) !== null) {
        const val = parseAmount(amtMatch[1]);
        if (val > 0 && val < 500000000) {
          foundAmounts.push({ val, raw: amtMatch[0] });
        }
      }
    }

    // Trailing numbers at the end of the statement line
    if (foundAmounts.length === 0) {
      const trailingRegex = /\s+(\d{1,3}(?:,\d{2,3})*|\d+)(?:\s+(\d{1,3}(?:,\d{2,3})*|\d+))?\s*$/;
      const tm = lineWithoutDates.match(trailingRegex);
      if (tm) {
        if (tm[1]) foundAmounts.push({ val: parseAmount(tm[1]), raw: tm[1] });
        if (tm[2]) foundAmounts.push({ val: parseAmount(tm[2]), raw: tm[2] });
      }
    }

    if (foundAmounts.length === 0) continue;

    // 3. Determine transaction amount and closing balance
    let primaryAmount = 0;
    let balance: number | undefined = undefined;

    if (foundAmounts.length === 1) {
      primaryAmount = foundAmounts[0].val;
    } else if (foundAmounts.length === 2) {
      // 2 amounts: first is transaction amount, second is closing balance
      primaryAmount = foundAmounts[0].val;
      balance = foundAmounts[1].val;
    } else {
      // 3 or more amounts: last is closing balance, earlier is debit/credit
      balance = foundAmounts[foundAmounts.length - 1].val;
      const candidates = foundAmounts.slice(0, foundAmounts.length - 1).filter(a => a.val > 0);
      primaryAmount = candidates.length > 0 ? candidates[0].val : foundAmounts[0].val;
    }

    if (primaryAmount === 0) continue;

    // 4. Debit vs Credit detection
    const isExplicitCredit = /\b(dep\s*tfr|deposit|credit|\bcr\b|\bcr\.|\binflow|\brefund|\bcashback|\bsalary|received|upi\/cr)\b/i.test(lineWithoutDates);
    const isExplicitDebit = /\b(wdl\s*tfr|withdrawal|\bwdl\b|debit|\bdr\b|\bdr\.|\boutflow|paid|payment|upi\/dr)\b/i.test(lineWithoutDates);

    let isCredit = false;
    if (isExplicitCredit && !isExplicitDebit) {
      isCredit = true;
    } else if (isExplicitDebit && !isExplicitCredit) {
      isCredit = false;
    } else if (isExplicitCredit) {
      isCredit = true;
    } else {
      isCredit = false;
    }

    const credit = isCredit ? primaryAmount : 0;
    const debit = isCredit ? 0 : primaryAmount;

    // 5. Clean Narration & Counterparty
    let descWithoutAmts = lineWithoutDates;
    for (const fa of foundAmounts) {
      descWithoutAmts = descWithoutAmts.replace(fa.raw, ' ');
    }

    const refClass = classifyTransactionReference(line, '', sourceType);
    const receiverName = extractReceiverName(line, sourceType);

    // If the line has CSV structure (commas or quotes), extract cells directly to avoid residue like '" " "," " ,'
    let desc = '';
    if (line.includes(',') || line.includes('"')) {
      const parsedCells = parseCsvRow(line)
        .map(c => cleanCsvArtifacts(c))
        .filter(c => c && c !== '-' && c !== '--' && c !== 'NIL' && c !== 'nil' && !standardizeDate(c));
      const textCell = parsedCells.find(c => isNaN(Number(c.replace(/,/g, ''))));
      if (textCell && textCell.length > 1) {
        desc = textCell;
      }
    }

    if (!desc) {
      if (receiverName) {
        desc = isCredit ? `Received from ${receiverName}` : `Paid to ${receiverName}`;
      } else {
        desc = cleanDeduplicatedText(descWithoutAmts, refClass?.value);
      }
    }
    desc = cleanCsvArtifacts(desc);
    if (!desc || desc.length < 2) desc = `${entityName} Transaction`;

    const cat = categorizeTransaction(desc);
    const tag = deriveTransactionTag(cat, desc);
    const time = extractTime(line);
    const referenceNo = refClass?.value || '';

    // Compute Direction / Flow: FROM -> TO
    const flow = resolveTransactionFlow(isCredit ? 'credit' : 'debit', desc, entityName, receiverName, cat);

    records.push({
      id: `fallback_${Date.now()}_${i}`,
      date: normDate,
      time,
      description: flow.cleanParticulars || desc,
      receiverName: flow.toEntity || receiverName || cleanDeduplicatedText(receiverName, refClass?.value),
      senderName: flow.senderName,
      fromEntity: flow.fromEntity,
      toEntity: flow.toEntity,
      tag,
      sourceType,
      sourceEntity: entityName,
      category: cat,
      referenceNo,
      bankTxnNumber: refClass?.bankTxnNumber,
      upiUtr: refClass?.upiUtr,
      referenceType: refClass?.type,
      referenceLabel: refClass?.label,
      debit,
      credit,
      netAmount: credit > 0 ? credit : -debit,
      balance,
      detectedLayout: 'Pattern Recognition Scanner'
    });
  }

  return records;
}

/**
 * Validates and normalizes Date string to YYYY-MM-DD
 * Returns null if the string is NOT a valid financial transaction date
 */
export function standardizeDate(raw: string, defaultYear?: number): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/['"]/g, '');
  if (!cleaned || cleaned.length < 3) return null;

  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };

  // Format 0: DD Mon or DD-Mon without year (e.g. "28 Sep", "27 Dec")
  const ddMonMatch = cleaned.match(/^(\d{1,2})[\s\-\/]([a-zA-Z]{3,9})$/i);
  if (ddMonMatch) {
    const day = ddMonMatch[1].padStart(2, '0');
    const mon = monthMap[ddMonMatch[2].toLowerCase()];
    if (mon) {
      const yr = defaultYear || new Date().getFullYear();
      return `${yr}-${mon}-${day}`;
    }
  }

  // Format 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (optionally with time)
  const ymdMatch = cleaned.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }

  // Format 2: DD-Mon-YYYY or DD Mon YYYY or DD-Mon-YY (e.g. 15-Feb-2023 or 15 Feb 23)
  const dMonyMatch = cleaned.match(/^(\d{1,2})[\s\-\/]([a-zA-Z]{3,9})[\s\-\/](\d{2,4})/i);
  if (dMonyMatch) {
    const day = dMonyMatch[1].padStart(2, '0');
    const mon = monthMap[dMonyMatch[2].toLowerCase()];
    if (mon) {
      let year = dMonyMatch[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${mon}-${day}`;
    }
  }

  // Format 3: Mon DD, YYYY or Month DD YYYY (e.g. Jan 15, 2023 or March 20, 2024)
  const monDyMatch = cleaned.match(/^([a-zA-Z]{3,9})[\s\-\/]+(\d{1,2})[\s,\-\/]+(\d{2,4})/i);
  if (monDyMatch) {
    const mon = monthMap[monDyMatch[1].toLowerCase()];
    const day = monDyMatch[2].padStart(2, '0');
    let year = monDyMatch[3];
    if (year.length === 2) year = `20${year}`;
    if (mon) {
      return `${year}-${mon}-${day}`;
    }
  }

  // Format 4: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (or 2-digit year e.g. 21, 22, 23, 24, 25, 26)
  const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dmyMatch) {
    let day = dmyMatch[1];
    let month = dmyMatch[2];
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;

    const num1 = parseInt(day, 10);
    const num2 = parseInt(month, 10);

    // If month > 12 and day <= 12, it's actually MM/DD/YYYY
    if (num2 > 12 && num1 <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }

    if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Format 5: Compact YYYYMMDD (8 digits e.g. 20230415)
  const compactMatch = cleaned.match(/^(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/);
  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
  }

  // Standard JS Date parse check - use local date components to avoid UTC timezone shifts
  if (/[\/\-\.]/.test(cleaned) || /[a-zA-Z]{3}/.test(cleaned)) {
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      const yr = parsed.getFullYear();
      if (yr >= 1990 && yr <= 2040) {
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${yr}-${m}-${d}`;
      }
    }
  }

  return null;
}

/**
 * Formats canonical YYYY-MM-DD (or any date string) into Indian Banking Standard DD/MM/YYYY
 * for all CSV exports and Ledger display (as per image 1)
 */
export function formatToDisplayDate(
  dateStr?: string, 
  format: 'DD/MM/YYYY' | 'DD-MM-YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY'
): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  
  // Extract Year, Month, Day
  let year = '';
  let month = '';
  let day = '';

  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    year = ymdMatch[1];
    month = ymdMatch[2].padStart(2, '0');
    day = ymdMatch[3].padStart(2, '0');
  } else {
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (dmyMatch) {
      day = dmyMatch[1].padStart(2, '0');
      month = dmyMatch[2].padStart(2, '0');
      year = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
    } else {
      const monthNames: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      const dMonY = trimmed.match(/^(\d{1,2})[\s\-/]([a-zA-Z]{3,9})[\s\-/](\d{2,4})/);
      if (dMonY && monthNames[dMonY[2].toLowerCase().slice(0, 3)]) {
        day = dMonY[1].padStart(2, '0');
        month = monthNames[dMonY[2].toLowerCase().slice(0, 3)];
        year = dMonY[3].length === 2 ? `20${dMonY[3]}` : dMonY[3];
      } else {
        return trimmed;
      }
    }
  }

  if (format === 'DD-MM-YYYY') {
    return `${day}-${month}-${year}`;
  }
  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  return `${day}/${month}/${year}`;
}

export function parseAmount(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.abs(val);
  const s = String(val).trim();
  if (!s || s === '-' || s === '--' || s === 'NIL' || s === 'nil' || s === '0' || s === '0.00') return 0;

  // Clean currency symbols, commas, quotes, brackets, and prefixes like INR, Rs., Rs, Dr, Cr
  // Crucial: remove rs. or rs with dot before removing whitespace so that "Rs. 300" doesn't become ".300"
  let cleaned = s
    .replace(/[()]/g, '')
    .replace(/[₹\$€£]/g, '')
    .replace(/(?:inr|rs\.?|dr\.?|cr\.?)\s*/gi, '')
    .replace(/['"\s]/g, '');

  // Detect European comma decimal e.g. "1.250,50" -> "1250.50"
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Normal format: remove commas used as thousand separators
    cleaned = cleaned.replace(/,/g, '');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

function sanitizeText(val: string): string {
  return val.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Intelligent Category Classification
 */
export function categorizeTransaction(description: string): Transaction['category'] {
  const desc = description.toLowerCase();

  if (/swiggy|zomato|domino|pizza|burger|cafe|starbucks|restaurant|mcdonald|food|dining|eats|bakery|dhabha/i.test(desc)) {
    return 'Food & Dining';
  }
  if (/amazon|flipkart|myntra|zara|ajio|retail|cloth|store|mall|apparel|shopping|shoes|nike|h&m/i.test(desc)) {
    return 'Shopping';
  }
  if (/blinkit|zepto|instamart|bigbasket|supermarket|d-mart|grocer|kirana|vegetable|milk|dairy/i.test(desc)) {
    return 'Groceries';
  }
  if (/electricity|bescom|tneb|airtel|jio|vi\b|water|gas|broadband|bill|postpaid|recharge|dth|tatasky/i.test(desc)) {
    return 'Utilities & Bills';
  }
  if (/zerodha|groww|mutual fund|sip\b|bse\b|nse\b|kuvera|coin|sebi|investment|shares|stock/i.test(desc)) {
    return 'Investments';
  }
  if (/salary|payroll|infosys|tcs|wipro|google|direct dep|consulting|dividend|stipend|bonus/i.test(desc)) {
    return 'Salary & Income';
  }
  if (/rent|landlord|housing|society|maintenance|property|flat|apartment/i.test(desc)) {
    return 'Rent & Housing';
  }
  if (/apollo|pharmacy|hospital|clinic|doctor|medplus|1mg|lab|diagnostic|health|medical|dental/i.test(desc)) {
    return 'Healthcare';
  }
  if (/uber|ola|fuel|petrol|diesel|hpcl|bpcl|indianoil|fastag|metro|flight|irctc|train|railway/i.test(desc)) {
    return 'Travel & Fuel';
  }

  return 'Transfer';
}

export interface PaymentChannelInfo {
  code: string;
  label: string;
  description: string;
}

export function detectPaymentChannel(description: string, sourceType?: string): PaymentChannelInfo {
  const desc = (description || '').toUpperCase();
  const src = (sourceType || '').toLowerCase();

  if (desc.includes('UPI') || src === 'upi') {
    return { code: 'UPI', label: 'UPI', description: 'Unified Payments Interface: Instant mobile-to-mobile or merchant transfer' };
  }
  if (desc.includes('NEFT')) {
    return { code: 'NEFT', label: 'NEFT', description: 'National Electronic Funds Transfer: Batch-wise electronic fund settlement' };
  }
  if (desc.includes('RTGS')) {
    return { code: 'RTGS', label: 'RTGS', description: 'Real-Time Gross Settlement: High-value immediate settlement (₹2 Lakh+)' };
  }
  if (desc.includes('IMPS')) {
    return { code: 'IMPS', label: 'IMPS', description: 'Immediate Payment Service: 24/7 instant interbank fund transfer' };
  }
  if (desc.includes('NACH') || desc.includes('ECS') || desc.includes('ACH')) {
    return { code: 'NACH', label: 'NACH / ECS', description: 'National Automated Clearing House: Recurring debits/credits (EMIs, SIPs)' };
  }
  if (desc.includes('AEPS')) {
    return { code: 'AEPS', label: 'AEPS', description: 'Aadhaar Enabled Payment System: Biometric micro-ATM transaction' };
  }
  if (desc.includes('APBS') || desc.includes('DBT')) {
    return { code: 'APBS', label: 'APBS / DBT', description: 'Aadhaar Payment Bridge System: Government subsidy & DBT route' };
  }
  if (desc.includes('BBPS')) {
    return { code: 'BBPS', label: 'BBPS', description: 'Bharat Bill Payment System: Recurring utility bill platform' };
  }
  if (desc.includes('FASTAG') || desc.includes('NETC') || desc.includes('TOLL')) {
    return { code: 'NETC', label: 'FASTag / NETC', description: 'National Electronic Toll Collection: Highway toll payment' };
  }
  if (desc.includes('CHQ') || desc.includes('CHEQUE') || desc.includes('CTS')) {
    return { code: 'CTS', label: 'CTS Cheque', description: 'Cheque Truncation System: Digital physical cheque clearing' };
  }
  if (desc.includes('POS') || desc.includes('RUPAY') || desc.includes('VISA') || desc.includes('MASTERCARD') || desc.includes('ATM') || src === 'credit_card') {
    return { code: 'CARD', label: 'Card / POS', description: 'Card Network (RuPay/Visa/MC/ATM/POS/Online)' };
  }

  return { code: 'BANK', label: 'Bank Transfer', description: 'Direct bank account transfer' };
}

/**
 * Derives a clean purpose tag (Food, Travel, Health, Shopping, Bills, Loan/EMI, Insurance, etc.)
 */
export function deriveTransactionTag(category?: string, description?: string): string {
  const cat = (category || '').toLowerCase();
  const desc = (description || '').toLowerCase();

  if (cat.includes('food') || /swiggy|zomato|pizza|cafe|restaurant|food|burger|starbucks|bakery|dhabha|biryani|hotel|mess/i.test(desc)) return 'Food';
  if (cat.includes('travel') || /uber|ola|flight|irctc|fuel|petrol|diesel|metro|fastag|railway|hpcl|bpcl|iocl|indigo|air india|makemytrip|cab/i.test(desc)) return 'Travel';
  if (cat.includes('health') || /apollo|pharmacy|hospital|doctor|clinic|medplus|1mg|lab|dental|diagnostic|healthcare|chemist/i.test(desc)) return 'Health';
  if (cat.includes('shop') || /amazon|flipkart|myntra|zara|cloth|mall|retail|shoes|nike|h&m|decathlon|ajio|meesho/i.test(desc)) return 'Shopping';
  if (cat.includes('grocer') || /blinkit|zepto|instamart|bigbasket|supermarket|kirana|d-mart|dmart|grocery|fresh|vegetable/i.test(desc)) return 'Groceries';
  if (cat.includes('bill') || cat.includes('util') || /electricity|airtel|jio|bill|water|gas|wifi|broadband|recharge|bescom|tneb|mahadiscom|utility|postpaid/i.test(desc)) return 'Bills';
  if (cat.includes('invest') || /zerodha|groww|mutual fund|sip|stock|shares|bse|nse|kuvera|angelone|upstox|ppf|nps|gold/i.test(desc)) return 'Investments';
  if (cat.includes('emi') || /emi|loan|nach|bajaj finance|tvs credit|muthoot|home loan|car loan/i.test(desc)) return 'Loan / EMI';
  if (cat.includes('insurance') || /lic|insurance|policybazaar|acko|digit|hdfc ergo|icici lombard/i.test(desc)) return 'Insurance';
  if (cat.includes('rent') || /rent|landlord|maintenance|society|housing|flat/i.test(desc)) return 'Rent';
  if (cat.includes('salary') || /salary|payroll|stipend|bonus|dividend|dbt|apbs/i.test(desc)) return 'Salary';
  if (cat.includes('transfer') || /transfer|neft|imps|rtgs|self/i.test(desc)) return 'Transfer';
  return 'General';
}

/**
 * Extracts payee / receiver / merchant name
 */
export function extractReceiverName(desc: string, sourceType: 'bank' | 'upi' | 'credit_card'): string {
  if (!desc) return '';

  // 0. Match raw UPI slash format before text cleaning strips routing tokens: UPI/(?:P2M|P2P|CR|DR)/<Ref>/<Party>/...
  const rawUpiMatch = desc.match(/UPI\/(?:P2M|P2P|CR|DR)\/[^/]+\/([^/]+)/i);
  if (rawUpiMatch) {
    const name = cleanDeduplicatedText(rawUpiMatch[1].trim());
    if (name && !isPaytmPlaceholder(name) && name.length >= 2) return name;
  }

  const cleanedDesc = cleanDeduplicatedText(desc);
  if (isPaytmPlaceholder(cleanedDesc)) return '';

  // 1. UPI Received / Inflow patterns: "Received from XYZ", "Money received from XYZ", "Transfer from XYZ", "Refund from XYZ", "Cashback from XYZ"
  const receivedMatch = cleanedDesc.match(/(?:received from|money received from|transfer from|from|refund from|cashback from)\s+([A-Za-z0-9\s&.-]{2,40})/i);
  if (receivedMatch) {
    const name = cleanDeduplicatedText(receivedMatch[1].trim());
    if (!isPaytmPlaceholder(name)) return name;
  }

  // 2. UPI Outflow patterns: "Paid to XYZ", "Payment to XYZ", "Money sent to XYZ", "Transfer to XYZ", "To XYZ"
  const upiMatch = cleanedDesc.match(/(?:paid to|payment to|money sent to|transfer to|to)\s+([A-Za-z0-9\s&.-]{2,40})/i);
  if (upiMatch) {
    const name = cleanDeduplicatedText(upiMatch[1].trim());
    if (!isPaytmPlaceholder(name)) return name;
  }

  // 3. Automatic payment: "Automatic payment of ... for XYZ"
  const autoMatch = cleanedDesc.match(/(?:automatic payment of.*?for|auto-debit for)\s+([A-Za-z0-9\s&.-]{2,40})/i);
  if (autoMatch) {
    const name = cleanDeduplicatedText(autoMatch[1].trim());
    if (!isPaytmPlaceholder(name)) return name;
  }

  // 4. UPI slash format: UPI/P2M/.../XYZ
  const upiSlashMatch = cleanedDesc.match(/UPI\/(?:P2M|P2P|CR|DR)\/[^/]+\/([^/]+)/i);
  if (upiSlashMatch) {
    const name = cleanDeduplicatedText(upiSlashMatch[1].trim());
    if (!isPaytmPlaceholder(name)) return name;
  }

  // 5. Bank POS / NEFT patterns: "POS/401928/XYZ STORE", "NEFT/XYZ/..."
  const posMatch = cleanedDesc.match(/(?:POS|NEFT|IMPS)\/[^/]+\/([A-Za-z0-9\s&.-]{3,35})/i);
  if (posMatch) {
    const name = cleanDeduplicatedText(posMatch[1].trim());
    if (!isPaytmPlaceholder(name)) return name;
  }

  if (sourceType === 'credit_card') {
    const cleaned = cleanedDesc.replace(/\b(REF|TXN|NO|BANGALORE|MUMBAI|DELHI|IN|POS)\b/gi, '').trim();
    if (cleaned.length > 2) return cleaned.split(/\s{2,}/)[0];
  }

  // If sourceType is UPI and desc looks like a standalone merchant/person name (no generic transaction words)
  if (sourceType === 'upi' && !/\b(transaction|payment|transfer|upi|debit|credit|order id|ref no)\b/i.test(cleanedDesc)) {
    if (cleanedDesc.length >= 2 && cleanedDesc.length <= 40 && !isPaytmPlaceholder(cleanedDesc)) {
      return cleanedDesc;
    }
  }

  return '';
}

/**
 * Extracts time (HH:MM:SS or HH:MM) from raw line or cell text
 */
export function extractTime(raw: string): string | undefined {
  if (!raw) return undefined;
  const timeMatch = raw.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\s*(AM|PM))?\b/i);
  if (timeMatch) return timeMatch[0].trim();
  return undefined;
}

/**
 * Extracts Bank Transaction / Cheque number and UPI UTR / RRN using the 7 standard reference types
 */
export function extractRefAndUtr(desc: string, rawRef?: string, sourceType?: string): { 
  bankTxnNumber?: string; 
  upiUtr?: string;
  refType?: TransactionReferenceType;
  refLabel?: string;
  refValue?: string;
} {
  const refClass = classifyTransactionReference(desc, rawRef, sourceType as any);
  if (!refClass) return {};
  return {
    bankTxnNumber: refClass.bankTxnNumber,
    upiUtr: refClass.upiUtr,
    refType: refClass.type,
    refLabel: refClass.label,
    refValue: refClass.value
  };
}

/**
 * DRAFTS SINGLE CSV PER CATEGORY (Bank, UPI, Credit Card) as per date and time
 */
export function generateCategoryDraftCsv(
  category: 'bank' | 'upi' | 'credit_card',
  records: NormalizedStatementRecord[]
): CategoryDraftCsvInfo {
  const catRecords = records.filter(r => r.sourceType === category);

  // Sort strictly by Date (descending) and Time (descending)
  catRecords.sort((a, b) => {
    const dateComp = (b.date || '').localeCompare(a.date || '');
    if (dateComp !== 0) return dateComp;
    return compareTimes(b.time, a.time);
  });

  let header = '';
  let rows: string[] = [];

  if (category === 'bank') {
    header = 'Date,Time,Bank_Name,Description,Receiver_Payee,Purpose_Tag,Bank_Txn_No,Reference_No,Debit_Amount,Credit_Amount,Balance';
    rows = catRecords.map(r => {
      const receiver = cleanDeduplicatedText(r.receiverName || '', r.bankTxnNumber || r.referenceNo);
      const desc = cleanDeduplicatedText(r.description, r.bankTxnNumber || r.referenceNo);
      return [
        escapeCsv(formatToDisplayDate(r.date)),
        escapeCsv(r.time || ''),
        escapeCsv(r.sourceEntity),
        escapeCsv(desc),
        escapeCsv(isPaytmPlaceholder(receiver) ? '' : receiver),
        escapeCsv(r.tag || deriveTransactionTag(r.category, desc)),
        escapeCsv(r.bankTxnNumber || ''),
        escapeCsv(r.referenceNo === r.bankTxnNumber ? '' : (r.referenceNo || '')),
        r.debit > 0 ? r.debit.toFixed(2) : '0.00',
        r.credit > 0 ? r.credit.toFixed(2) : '0.00',
        r.balance !== undefined ? r.balance.toFixed(2) : ''
      ].join(',');
    });
  } else if (category === 'upi') {
    header = 'Date,Time,UPI_App,Paid_To_Or_Received_From,Description,Purpose_Tag,Type,Amount,Debit_Amount,Credit_Amount,UPI_UTR,Reference_No';
    rows = catRecords.map(r => {
      let receiver = cleanDeduplicatedText(r.receiverName || '', r.upiUtr || r.referenceNo);
      if (isPaytmPlaceholder(receiver)) receiver = '';

      let desc = cleanDeduplicatedText(r.description || '', r.upiUtr || r.referenceNo);
      if (isPaytmPlaceholder(desc)) desc = '';

      if (!receiver && desc) {
        receiver = extractReceiverName(desc, 'upi');
      }
      if (!receiver) {
        receiver = r.credit > 0 ? 'UPI Sender' : 'UPI Recipient';
      }

      if (!desc) {
        desc = r.credit > 0 ? `Received from ${receiver}` : `Paid to ${receiver}`;
      } else if (desc.toLowerCase() === receiver.toLowerCase()) {
        // Prevent identical duplicate repetition in consecutive columns
        desc = r.credit > 0 ? `Money received from ${receiver}` : `UPI payment to ${receiver}`;
      }

      return [
        escapeCsv(formatToDisplayDate(r.date)),
        escapeCsv(r.time || ''),
        escapeCsv(r.sourceEntity),
        escapeCsv(receiver),
        escapeCsv(desc),
        escapeCsv(r.tag || deriveTransactionTag(r.category, desc)),
        r.credit > 0 ? 'CREDIT' : 'DEBIT',
        (r.credit > 0 ? r.credit : r.debit).toFixed(2),
        r.debit > 0 ? r.debit.toFixed(2) : '0.00',
        r.credit > 0 ? r.credit.toFixed(2) : '0.00',
        escapeCsv(r.upiUtr || ''),
        escapeCsv(r.referenceNo === r.upiUtr ? '' : (r.referenceNo || ''))
      ].join(',');
    });
  } else {
    // Credit card
    header = 'Date,Time,Card_Name,Merchant_Description,Receiver_Merchant,Purpose_Tag,Type,Amount,Debit_Spent,Credit_Payment,Reference_No';
    rows = catRecords.map(r => {
      const receiver = cleanDeduplicatedText(r.receiverName || '', r.referenceNo);
      const desc = cleanDeduplicatedText(r.description, r.referenceNo);
      return [
        escapeCsv(formatToDisplayDate(r.date)),
        escapeCsv(r.time || ''),
        escapeCsv(r.sourceEntity),
        escapeCsv(desc),
        escapeCsv(isPaytmPlaceholder(receiver) ? (desc || '') : receiver),
        escapeCsv(r.tag || deriveTransactionTag(r.category, desc)),
        r.credit > 0 ? 'PAYMENT' : 'PURCHASE',
        (r.credit > 0 ? r.credit : r.debit).toFixed(2),
        r.debit > 0 ? r.debit.toFixed(2) : '0.00',
        r.credit > 0 ? r.credit.toFixed(2) : '0.00',
        escapeCsv(r.referenceNo || '')
      ].join(',');
    });
  }

  const csvContent = [header, ...rows].join('\n');
  const totalCredit = catRecords.reduce((sum, r) => sum + r.credit, 0);
  const totalDebit = catRecords.reduce((sum, r) => sum + r.debit, 0);

  const titleMap = {
    bank: 'Draft Bank Category CSV',
    upi: 'Draft UPI Category CSV',
    credit_card: 'Draft Credit Cards Category CSV'
  };

  const fileMap = {
    bank: 'Bank_Transactions_Draft.csv',
    upi: 'UPI_Transactions_Draft.csv',
    credit_card: 'CreditCard_Transactions_Draft.csv'
  };

  return {
    category,
    title: titleMap[category],
    fileName: fileMap[category],
    recordsCount: catRecords.length,
    totalCredit,
    totalDebit,
    csvContent,
    generatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
}

/**
 * CROSS-SOURCE SYNC & REDUCED REPEAT TRANSACTIONS
 * Identifies cross-source overlaps (e.g. Bank debit that matches UPI payment,
 * or Credit card bill payment from Bank account, or duplicate retries).
 * Reduces repeats while keeping full debug traceability.
 */
export function syncAndReduceRepeats(records: NormalizedStatementRecord[]): {
  syncedRecords: NormalizedStatementRecord[];
  repeatMatches: CrossSourceSyncMatch[];
  consolidatedCsv: string;
} {
  const synced = records.map(r => ({ ...r }));
  const matches: CrossSourceSyncMatch[] = [];

  // 1. Bank <-> UPI Overlap Detection
  const bankRecords = synced.filter(r => r.sourceType === 'bank' && r.debit > 0);
  const upiRecords = synced.filter(r => r.sourceType === 'upi' && r.debit > 0);

  for (const b of bankRecords) {
    if (b.isRepeatReduced) continue;

    for (const u of upiRecords) {
      if (u.isRepeatReduced) continue;

      const dateDiffDays = Math.abs(
        (new Date(b.date).getTime() - new Date(u.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Same day or ±1 day and same exact amount
      if (dateDiffDays <= 1 && Math.abs(b.debit - u.debit) < 0.01) {
        // Check matching signals: UTR in bank description, or receiver name match, or general UPI indicator
        const bDesc = (b.description || '').toLowerCase();
        const uRec = (u.receiverName || '').toLowerCase();
        const hasUtrMatch = u.upiUtr && b.description.includes(u.upiUtr);
        const hasRecMatch = uRec.length > 3 && bDesc.includes(uRec);
        const isBankUpiDebit = bDesc.includes('upi') || bDesc.includes('vpa') || bDesc.includes('imps') || dateDiffDays === 0;

        if (hasUtrMatch || hasRecMatch || isBankUpiDebit) {
          b.isRepeatReduced = true;
          b.repeatMatchId = u.id;
          b.repeatReason = `Bank debit matches UPI expense of ₹${u.debit} to "${u.receiverName || u.description}" (${u.sourceEntity})`;

          u.repeatMatchId = b.id;
          u.repeatReason = `Companion Bank debit synced (${b.sourceEntity})`;

          matches.push({
            id: `match_${b.id}_${u.id}`,
            primaryTxnId: u.id,
            companionTxnId: b.id,
            primarySourceName: u.sourceEntity,
            companionSourceName: b.sourceEntity,
            date: u.date,
            amount: u.debit,
            matchType: 'bank_upi_overlap',
            reason: `Bank debit of ₹${b.debit.toFixed(2)} on ${b.date} matches UPI expense to "${u.receiverName || u.description}" (UTR: ${u.upiUtr || 'N/A'})`,
            isReduced: true
          });

          break; // Matched this bank record
        }
      }
    }
  }

  // 2. Bank <-> Credit Card Settlement Detection
  const ccPayments = synced.filter(r => r.sourceType === 'credit_card' && r.credit > 0);
  for (const b of bankRecords) {
    if (b.isRepeatReduced) continue;

    for (const c of ccPayments) {
      if (c.isRepeatReduced) continue;

      const dateDiffDays = Math.abs(
        (new Date(b.date).getTime() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dateDiffDays <= 2 && Math.abs(b.debit - c.credit) < 0.01) {
        const bDesc = (b.description || '').toLowerCase();
        const isCcPayment = /credit\s*card|cc\s*pymt|hdfc\s*card|sbi\s*card|axis\s*card|cred|card\s*pay/i.test(bDesc);

        if (isCcPayment) {
          b.isRepeatReduced = true;
          b.repeatMatchId = c.id;
          b.repeatReason = `Credit card bill payment debited from Bank to ${c.sourceEntity}`;

          c.repeatMatchId = b.id;
          c.repeatReason = `Settlement payment received from Bank (${b.sourceEntity})`;

          matches.push({
            id: `match_${b.id}_${c.id}`,
            primaryTxnId: c.id,
            companionTxnId: b.id,
            primarySourceName: c.sourceEntity,
            companionSourceName: b.sourceEntity,
            date: b.date,
            amount: b.debit,
            matchType: 'bank_cc_settlement',
            reason: `Bank debit of ₹${b.debit.toFixed(2)} settled Credit Card payment for ${c.sourceEntity}`,
            isReduced: true
          });

          break;
        }
      }
    }
  }

  // Generate Consolidated All Transactions CSV
  const consolidatedCsv = generateConsolidatedAllTransactionsCsv(synced);

  return {
    syncedRecords: synced,
    repeatMatches: matches,
    consolidatedCsv
  };
}

/**
 * CONSOLIDATED ALL TRANSACTIONS CSV
 * Standardized single CSV formatted for all transactions with date, time, source, tag, and repeat reduction flags.
 */
export function generateConsolidatedAllTransactionsCsv(records: NormalizedStatementRecord[]): string {
  // Sort strictly by Date (descending) and Time (descending)
  const sorted = [...records].sort((a, b) => {
    const dateComp = (b.date || '').localeCompare(a.date || '');
    if (dateComp !== 0) return dateComp;
    return compareTimes(b.time, a.time);
  });

  const header = [
    'Date',
    'Time',
    'Source_Type',
    'Source_Entity',
    'Receiver_Payee',
    'Purpose_Tag',
    'Transaction_Type',
    'Amount',
    'Debit_Amount',
    'Credit_Amount',
    'Balance',
    'Description',
    'Bank_Txn_No',
    'UPI_UTR',
    'Reference_No',
    'Repeat_Reduced',
    'Repeat_Reason',
    'Sync_Match_ID'
  ].join(',');

  const rows = sorted.map(r => {
    const amt = r.credit > 0 ? r.credit : r.debit;
    const type = r.credit > 0 ? 'CREDIT' : 'DEBIT';
    const tag = r.tag || deriveTransactionTag(r.category, r.description);

    let receiver = cleanDeduplicatedText(r.receiverName || '');
    if (isPaytmPlaceholder(receiver)) receiver = '';
    let desc = cleanDeduplicatedText(r.description || '');
    if (isPaytmPlaceholder(desc)) desc = '';

    const effectiveRef = (r.referenceNo === r.upiUtr || r.referenceNo === r.bankTxnNumber) ? '' : (r.referenceNo || '');

    return [
      escapeCsv(formatToDisplayDate(r.date)),
      escapeCsv(r.time || ''),
      escapeCsv(r.sourceType),
      escapeCsv(r.sourceEntity),
      escapeCsv(receiver),
      escapeCsv(tag),
      type,
      amt.toFixed(2),
      r.debit > 0 ? r.debit.toFixed(2) : '0.00',
      r.credit > 0 ? r.credit.toFixed(2) : '0.00',
      r.balance !== undefined ? r.balance.toFixed(2) : '',
      escapeCsv(desc),
      escapeCsv(r.bankTxnNumber || ''),
      escapeCsv(r.upiUtr || ''),
      escapeCsv(effectiveRef),
      r.isRepeatReduced ? 'YES' : 'NO',
      escapeCsv(r.repeatReason || ''),
      escapeCsv(r.repeatMatchId || '')
    ].join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * CSV FORMAT GENERATOR FOR FEATURE USE
 * Generates the standardized CSV format ready for download & feature storage.
 */
export function generateNormalizedCsvString(records: NormalizedStatementRecord[]): string {
  const header = [
    'Date',
    'Description',
    'SourceType',
    'SourceEntity',
    'Category',
    'ReferenceNo',
    'DebitAmount',
    'CreditAmount',
    'NetAmount',
    'Balance',
    'Status'
  ].join(',');

  const rows = records.map(r => {
    return [
      escapeCsv(formatToDisplayDate(r.date)),
      escapeCsv(r.description),
      escapeCsv(r.sourceType),
      escapeCsv(r.sourceEntity),
      escapeCsv(r.category),
      escapeCsv(r.referenceNo),
      r.debit.toFixed(2),
      r.credit.toFixed(2),
      r.netAmount.toFixed(2),
      r.balance !== undefined ? r.balance.toFixed(2) : '',
      'Reconciled'
    ].join(',');
  });

  return [header, ...rows].join('\n');
}

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Browser download helper for saving normalized CSV files
 */
export function downloadCsvFile(csvContent: string, fileName = 'Normalized_Financial_Statement.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Built-in Sample Datasets for Instant Interactive Verification
 */
export const SAMPLE_DATASETS = {
  sbiBank: `Account Statement for A/c No: 38914892011
Branch: SBI Bangalore Tech Hub (04821)
Statement Period: 01-Feb-2026 to 28-Feb-2026
Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
01-Feb-2026,01-Feb-2026,Salary Credit from Employer,NEFT/INFY/910283,,125000.00,170200.00
03-Feb-2026,03-Feb-2026,House Rent Transfer to Landlord,NEFT/SBI/9912048,24000.00,,146200.00
08-Feb-2026,08-Feb-2026,Zerodha Broking Mutual Fund SIP,ACH/BSE/008819,25000.00,,121200.00
14-Feb-2026,14-Feb-2026,Apartment Maintenance & Water Bill,IMPS/SBI/401928,3500.00,,117700.00
22-Feb-2026,22-Feb-2026,Apollo Pharmacy Medicines,UPI/SBI/781029,850.00,,116850.00
26-Feb-2026,26-Feb-2026,HPCL Petrol Pump Fuel,POS/SBI/660192,2100.00,,114750.00`,

  hdfcCreditCard: `HDFC Bank Credit Card Statement
Card Member: Manoj Kumar | Card Ending: XX9102
Credit Limit: Rs. 3,50,000 | Available Limit: Rs. 2,98,400
Date,Transaction Description,Amount,Dr/Cr,Reference Number
02-Feb-2026,AMAZON INDIA RETAIL BANGALORE,4299.00,Dr,REF-HDFC-9910293
05-Feb-2026,SWIGGY BANGALORE IN,680.00,Dr,REF-HDFC-9910294
10-Feb-2026,PAYMENT RECEIVED - THANK YOU,35000.00,Cr,REF-HDFC-9910295
12-Feb-2026,ZARA RETAIL FORUM MALL,6490.00,Dr,REF-HDFC-9910296
18-Feb-2026,UBER RIDES INDIA,450.00,Dr,REF-HDFC-9910297
24-Feb-2026,AIRTEL POSTPAID BILL PAYMENT,1299.00,Dr,REF-HDFC-9910298`,

  phonePeUpi: `PhonePe Transaction Export Statement
UPI ID: manoj.k@ybl | Mobile: +91 98765 43210
Date,Transaction ID,Paid to / Received from,Type,Amount (₹)
04/02/2026,T2602041049281,Swiggy Delivery,DEBIT,450.00
09/02/2026,T2602091420194,Blinkit Instant Groceries,DEBIT,1240.00
15/02/2026,T2602151830112,Amazon Retail Purchase,DEBIT,3499.00
18/02/2026,T2602181120481,Cashback Reward PhonePe,CREDIT,150.00
21/02/2026,T2602211940182,Starbucks Coffee Indiranagar,DEBIT,780.00
27/02/2026,T2602271420199,Zepto Quick Commerce,DEBIT,620.00`,

  customUserCsv: `Date;Particulars;Chq_Ref;Withdrawal;Deposit;Current_Balance
15/02/2026;Salary Deposit Monthly;TXN-9021;;95000.00;145000.00
17/02/2026;Electricity Bescom Bill;UPI-8819;2100.00;;142900.00
20/02/2026;Supermarket D-Mart Grocery;POS-4401;4590.00;;138310.00
23/02/2026;Mutual Fund SIP Groww;ACH-1102;10000.00;;128310.00
25/02/2026;Cafe Coffee Day Meeting;UPI-7719;420.00;;127890.00`
};
