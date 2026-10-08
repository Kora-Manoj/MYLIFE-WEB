import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Tag, 
  Calendar, 
  FileText,
  Bookmark
} from 'lucide-react';

export const KnowledgeBaseScreen: React.FC = () => {
  const { notes, addNote, deleteNote, togglePinNote } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New note form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Finance' | 'Career' | 'Health' | 'Tech' | 'Personal'>('Finance');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('Guidelines, Reference');

  const categories = ['All', 'Finance', 'Tech', 'Health', 'Career', 'Personal'];

  const filteredNotes = notes.filter(n => {
    const matchesCat = selectedCategory === 'All' || n.category === selectedCategory;
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          n.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    addNote({
      title,
      category,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isPinned: false
    });

    setTitle('');
    setContent('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4 pb-6">
      
      {/* Header with Search and Create */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes, guidelines, tags..."
            className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Note</span>
        </button>
      </div>

      {/* Category Pills (Functional filter buttons) */}
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

      {/* Notes List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No notes found matching your filter.
          </div>
        ) : (
          filteredNotes.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl bg-slate-900/90 border transition-all relative group ${
                n.isPinned ? 'border-amber-400/50 shadow-sm' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-bold text-slate-100 leading-snug">
                  {n.title}
                </h4>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePinNote(n.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      n.isPinned ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Pin Note"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line mb-3">
                {n.content}
              </p>

              {/* Unboxed metadata adhering to frontend design guidelines */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-amber-300/90 font-medium">{n.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{n.updatedAt}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {n.tags.map(tag => (
                    <span key={tag} className="text-slate-400 hover:text-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-amber-400/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Create Knowledge Base Note</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200 text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. UPI Reconciliation Rules & Checkpoints"
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
                    <option value="Finance">Finance</option>
                    <option value="Tech">Tech</option>
                    <option value="Health">Health</option>
                    <option value="Career">Career</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Banking, UPI, Taxes"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Content / Summary</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write clear instructions, reference documentation, or system notes..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
              >
                Save to Knowledge Base
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
