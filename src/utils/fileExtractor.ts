import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import * as XLSX from 'xlsx';

// Initialize PDF.js worker using Vite's bundled worker URL
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  } catch (e) {
    console.warn('Worker configuration notice:', e);
  }
}

export class PasswordRequiredError extends Error {
  fileName: string;
  isIncorrect: boolean;
  constructor(fileName: string, isIncorrect = false) {
    super(isIncorrect ? `Incorrect password for "${fileName}". Please try again.` : `Statement "${fileName}" is password protected.`);
    this.name = 'PasswordRequiredError';
    this.fileName = fileName;
    this.isIncorrect = isIncorrect;
    Object.setPrototypeOf(this, PasswordRequiredError.prototype);
  }
}

export function isPasswordError(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || err?.name || err || '').toLowerCase();
  const code = err?.code;
  return (
    err?.name === 'PasswordException' ||
    code === 1 || // PasswordResponses.NEED_PASSWORD
    code === 2 || // PasswordResponses.INCORRECT_PASSWORD
    msg.includes('password') ||
    msg.includes('encrypted') ||
    msg.includes('bad password') ||
    msg.includes('passwordexception') ||
    msg.includes('needs a password') ||
    msg.includes('protected') ||
    msg.includes('decrypt') ||
    msg.includes('bad decrypt')
  );
}

/**
 * Fast binary scan to detect whether a PDF file contains encryption dictionary
 */
export function isPdfEncryptedBuffer(buffer: ArrayBuffer): boolean {
  try {
    const bytes = new Uint8Array(buffer);
    const len = bytes.length;
    if (len < 30) return false;
    const scanChunk = (start: number, end: number) => {
      const sub = bytes.subarray(start, end);
      const str = new TextDecoder('latin1').decode(sub);
      return /\/Encrypt\b/i.test(str);
    };
    if (len > 8192) {
      if (scanChunk(len - 8192, len)) return true;
    }
    return scanChunk(0, Math.min(len, 4096));
  } catch {
    return false;
  }
}

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
  statusText?: string;
}

export async function extractTextFromUploadedFile(
  file: File, 
  password?: string,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<string> {
  const fileName = file.name.toLowerCase();
  const extension = fileName.split('.').pop() || '';

  // 1. CSV, TXT, TSV, OFX, QIF: Direct text read
  if (['csv', 'txt', 'tsv', 'ofx', 'qif'].includes(extension) || file.type.includes('text') || file.type.includes('csv')) {
    if (onProgress) onProgress({ currentPage: 1, totalPages: 1, percent: 50, statusText: 'Reading text content...' });
    const text = await file.text();
    if (onProgress) onProgress({ currentPage: 1, totalPages: 1, percent: 100, statusText: 'Completed' });
    return text;
  }

  // 2. EXCEL (XLSX, XLS): Convert sheets to CSV with native date formatting
  if (['xlsx', 'xls'].includes(extension) || file.type.includes('spreadsheet') || file.type.includes('excel')) {
    try {
      if (onProgress) onProgress({ currentPage: 1, totalPages: 1, percent: 30, statusText: 'Parsing Excel workbook...' });
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { 
        type: 'array', 
        cellDates: true,
        password: password || undefined
      });
      const sheetsCsv: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (sheet) {
          const csv = XLSX.utils.sheet_to_csv(sheet, { dateNF: 'yyyy-mm-dd' });
          if (csv && csv.trim().length > 0) {
            sheetsCsv.push(csv);
          }
        }
      }
      if (onProgress) onProgress({ currentPage: 1, totalPages: 1, percent: 100, statusText: 'Completed' });
      return sheetsCsv.join('\n');
    } catch (err: any) {
      if (isPasswordError(err)) {
        throw new PasswordRequiredError(file.name, !!password);
      }
      console.warn('Excel extraction error:', err);
      return '';
    }
  }

  // 3. PDF Files
  if (extension === 'pdf' || file.type.includes('pdf')) {
    let loadingTask: any = null;
    let passwordErrorToThrow: PasswordRequiredError | null = null;
    let rejectPasswordSignal: ((err: any) => void) | null = null;
    const passwordSignal = new Promise<never>((_, reject) => {
      rejectPasswordSignal = reject;
    });

    try {
      const buffer = await file.arrayBuffer();
      const isEncrypted = isPdfEncryptedBuffer(buffer);

      loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
        password: password || undefined
      });

      // Hook PDF.js onPassword: fire immediately on password challenge without hanging or looping
      loadingTask.onPassword = (updatePassword: (pw: string) => void, reason: number) => {
        // PDF.js PasswordResponses: NEED_PASSWORD = 1, INCORRECT_PASSWORD = 2
        const isIncorrect = reason === 2 || (reason === 1 && Boolean(password));
        const err = new PasswordRequiredError(file.name, isIncorrect);
        passwordErrorToThrow = err;
        try {
          loadingTask.destroy();
        } catch {}
        if (rejectPasswordSignal) {
          rejectPasswordSignal(err);
        }
      };

      // Safety timeout race: never hang if worker stalls
      let timeoutId: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          if (isEncrypted) {
            reject(new PasswordRequiredError(file.name, Boolean(password)));
          } else {
            reject(new Error('PDF reading timed out.'));
          }
        }, 12000);
      });

      let pdf: any;
      try {
        pdf = await Promise.race([loadingTask.promise, passwordSignal, timeoutPromise]);
      } finally {
        clearTimeout(timeoutId);
      }

      const totalPages = Math.min(pdf.numPages, 1000);
      const textPieces: string[] = [];

      interface TextItemPos {
        str: string;
        x: number;
        y: number;
        width: number;
      }

      // Process in small batches with async yields to keep the browser responsive
      const BATCH_SIZE = 4;
      for (let batchStart = 1; batchStart <= totalPages; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
        
        if (onProgress) {
          const percent = Math.round((batchStart / totalPages) * 100);
          onProgress({
            currentPage: batchStart,
            totalPages,
            percent,
            statusText: `Reading page ${batchStart} of ${totalPages} (${percent}%)`
          });
          // Yield to browser event loop
          await new Promise(r => setTimeout(r, 0));
        }

        const pagePromises = [];
        for (let pageNum = batchStart; pageNum <= batchEnd; pageNum++) {
          pagePromises.push((async (pNum) => {
            const page = await pdf.getPage(pNum);
            try {
              const textContent = await page.getTextContent();
              const rawItems: TextItemPos[] = [];
              for (const item of textContent.items as any[]) {
                if ('str' in item && typeof item.str === 'string' && item.str.trim().length > 0) {
                  rawItems.push({
                    str: item.str,
                    x: item.transform[4] || 0,
                    y: item.transform[5] || 0,
                    width: item.width || (item.str.length * 5)
                  });
                }
              }

              // Fast O(N log N) row bucketing: sort by Y descending, then X ascending
              rawItems.sort((a, b) => b.y - a.y || a.x - b.x);

              const rowBuckets: { y: number; items: TextItemPos[] }[] = [];
              for (const item of rawItems) {
                const lastBucket = rowBuckets[rowBuckets.length - 1];
                if (lastBucket && Math.abs(lastBucket.y - item.y) <= 5.5) {
                  lastBucket.items.push(item);
                } else {
                  rowBuckets.push({ y: item.y, items: [item] });
                }
              }

              const pageRows: string[] = [];
              for (const row of rowBuckets) {
                // Ensure items in row are ordered left-to-right (X ascending)
                row.items.sort((a, b) => a.x - b.x);

                const cells: string[] = [];
                let currentCell = '';
                let lastRight = -1;

                for (const item of row.items) {
                  if (lastRight === -1) {
                    currentCell = item.str.trim();
                    lastRight = item.x + item.width;
                  } else {
                    const gap = item.x - lastRight;
                    const isAmountOrCode = /^(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|\d+\.\d{2}|₹|rs\.?|inr|\bdr\b|\bcr\b)$/i.test(item.str.trim());
                    const isLikelyNewColumn = gap > 8 || (isAmountOrCode && gap > 4);

                    if (isLikelyNewColumn) {
                      if (currentCell) cells.push(currentCell);
                      currentCell = item.str.trim();
                    } else {
                      currentCell += (currentCell.endsWith(' ') || item.str.startsWith(' ') ? '' : ' ') + item.str.trim();
                    }
                    lastRight = item.x + item.width;
                  }
                }
                if (currentCell) cells.push(currentCell);

                let finalCells = cells;
                if (cells.length === 1 && /\s{2,}/.test(cells[0])) {
                  finalCells = cells[0].split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
                }

                if (finalCells.length > 0) {
                  const csvLine = finalCells.map(c => `"${c.replace(/"/g, '""')}"`).join(',');
                  pageRows.push(csvLine);
                }
              }

              return pageRows.join('\n');
            } finally {
              try {
                if (page && typeof (page as any).cleanup === 'function') {
                  (page as any).cleanup();
                }
              } catch {}
            }
          })(pageNum));
        }

        const batchResults = await Promise.all(pagePromises);
        textPieces.push(...batchResults.filter(Boolean));
      }

      if (onProgress) {
        onProgress({ currentPage: totalPages, totalPages, percent: 100, statusText: 'Extraction complete' });
      }
      return textPieces.join('\n');
    } catch (err: any) {
      if (err instanceof PasswordRequiredError || err?.name === 'PasswordRequiredError') {
        throw err;
      }
      if (passwordErrorToThrow) {
        throw passwordErrorToThrow;
      }
      if (isPasswordError(err)) {
        throw new PasswordRequiredError(file.name, Boolean(password));
      }
      try {
        const buf = await file.arrayBuffer();
        if (isPdfEncryptedBuffer(buf)) {
          throw new PasswordRequiredError(file.name, Boolean(password));
        }
      } catch (innerErr) {
        if (innerErr instanceof PasswordRequiredError) throw innerErr;
      }

      console.warn('PDF extraction error, falling back to binary stream extractor:', err);
      return await extractTextFromPdfFallback(file);
    } finally {
      try {
        if (loadingTask && typeof loadingTask.destroy === 'function') {
          loadingTask.destroy();
        }
      } catch {}
    }
  }

  return '';
}

/**
 * Fallback PDF string extractor that finds readable lines from PDF streams
 */
async function extractTextFromPdfFallback(file: File): Promise<string> {
  try {
    const text = await file.text();
    const lines: string[] = [];
    
    // Look for text in (text) Tj
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    let currentLine: string[] = [];
    while ((match = tjRegex.exec(text)) !== null) {
      const val = match[1].trim();
      if (val) {
        currentLine.push(val);
        if (currentLine.length >= 4) {
          lines.push(currentLine.map(v => `"${v.replace(/"/g, '""')}"`).join(','));
          currentLine = [];
        }
      }
    }

    // Look for text in array format: [(text) 20 (more)] TJ
    const arrayRegex = /\[([^\]]+)\]\s*TJ/g;
    let arrMatch;
    while ((arrMatch = arrayRegex.exec(text)) !== null) {
      const inner = arrMatch[1];
      const strMatches = inner.match(/\(([^)]+)\)/g);
      if (strMatches && strMatches.length > 0) {
        const row = strMatches.map(s => s.replace(/[()]/g, '').trim()).filter(Boolean);
        if (row.length > 0) {
          lines.push(row.map(v => `"${v.replace(/"/g, '""')}"`).join(','));
        }
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine.map(v => `"${v.replace(/"/g, '""')}"`).join(','));
    }

    return lines.join('\n');
  } catch {
    return '';
  }
}
