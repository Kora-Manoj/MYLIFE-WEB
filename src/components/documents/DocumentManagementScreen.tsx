import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FolderLock, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Eye, 
  FileText, 
  AlertCircle, 
  Download,
  Lock,
  X
} from 'lucide-react';
import { DocumentItem } from '../../types';

export const DocumentManagementScreen: React.FC = () => {
  const { documents, addDocument, deleteDocument } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New doc fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Identity' | 'Financial' | 'Medical' | 'Vehicle' | 'Property'>('Identity');
  const [docNumber, setDocNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const categories = ['All', 'Identity', 'Financial', 'Medical', 'Vehicle', 'Property'];

  const filteredDocs = documents.filter(d => {
    return selectedCategory === 'All' || d.category === selectedCategory;
  });

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    addDocument({
      title,
      category,
      docNumber: docNumber || 'N/A',
      fileName: `${title.replace(/\s+/g, '_')}_Official.pdf`,
      fileSize: '1.5 MB',
      expiryDate: expiryDate || undefined,
      isVerified: true,
      notes
    });

    setTitle('');
    setDocNumber('');
    setExpiryDate('');
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4 pb-6">
      
      {/* Header with Security Badge */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
            <FolderLock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Secure Document Vault</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </h3>
            <p className="text-[10px] text-slate-400">Encrypted records, KYC IDs & insurance policies</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Doc</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
              selectedCategory === c
                ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {filteredDocs.map(doc => (
          <div
            key={doc.id}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100 leading-snug">
                    {doc.title}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    ID: {doc.docNumber}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Unboxed metadata line adhering to SKILL.md rules */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-amber-400/90 font-medium">{doc.category}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">{doc.fileSize}</span>
                <span aria-hidden="true">·</span>
                <span>Uploaded {doc.uploadedAt}</span>
              </div>
              {doc.expiryDate && (
                <div className="flex items-center gap-1 text-amber-300 font-mono text-[10px]">
                  <span>Expires: {doc.expiryDate}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Document Vault Certificate</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-base text-slate-100">{previewDoc.title}</div>
              <div className="text-slate-400 font-mono">Reference Number: {previewDoc.docNumber}</div>
              <div className="text-slate-400">File: {previewDoc.fileName} ({previewDoc.fileSize})</div>
              {previewDoc.notes && (
                <div className="p-2.5 rounded-lg bg-slate-900 text-slate-300 text-[11px] mt-2 border border-slate-800">
                  {previewDoc.notes}
                </div>
              )}
            </div>

            <button
              onClick={() => setPreviewDoc(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-amber-400/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Store Document in Vault</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200 text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Passport, Vehicle Insurance"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                  >
                    <option value="Identity">Identity</option>
                    <option value="Financial">Financial</option>
                    <option value="Medical">Medical</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Property">Property</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Document / Policy ID</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. Z1234567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Expiration Date (Optional)</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="e.g. 31 Dec 2030"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
              >
                Secure in Document Vault
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
