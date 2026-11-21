import React, { useMemo, useState } from 'react';
import { BookOpen, Search, X, Lock, CheckCircle2 } from 'lucide-react';
import { EDUCATIONAL_CATEGORIES, EDUCATIONAL_ENTRIES } from '../game/educationData';
import { EducationalCategory } from '../game/types';

interface ScientificDatabaseModalProps {
  discoveredIds: string[];
  onSelectEntry: (entryId: string) => void;
  onClose: () => void;
}

export const ScientificDatabaseModal: React.FC<ScientificDatabaseModalProps> = ({
  discoveredIds,
  onSelectEntry,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | EducationalCategory>('ALL');
  const [query, setQuery] = useState('');

  const unlockedSet = useMemo(() => new Set(discoveredIds), [discoveredIds]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EDUCATIONAL_ENTRIES.filter((entry) => {
      if (selectedCategory !== 'ALL' && entry.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        entry.subjectName.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q) ||
        entry.whatIsIt.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, query]);

  return (
    <div
      data-testid="scientific-database-modal"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Permanent Scientific Knowledge Database"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-sky-500/40 bg-[#090d14] text-slate-100 shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-[#0d131d]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-lg font-bold tracking-wide text-white">
                SCIENTIFIC KNOWLEDGE DATABASE
              </h2>
              <p className="text-xs font-mono-tech text-slate-400">
                13 SCIENTIFIC DISCIPLINES • DISCOVERED {discoveredIds.length} /{' '}
                {EDUCATIONAL_ENTRIES.length} ENTRIES
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subjects..."
                className="pl-8 pr-3 py-1.5 rounded border border-slate-700 bg-slate-900 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-600/90 hover:bg-red-500 text-white text-xs font-mono-tech font-bold"
            >
              <X className="w-3.5 h-3.5" />
              CLOSE
            </button>
          </div>
        </div>

        {/* Category Filter Tabs (All 13 Categories) */}
        <div className="px-5 py-2.5 border-b border-slate-800 bg-[#0a0f17] flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono-tech transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
            }`}
          >
            ALL ({EDUCATIONAL_ENTRIES.length})
          </button>
          {EDUCATIONAL_CATEGORIES.map((cat) => {
            const count = EDUCATIONAL_ENTRIES.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono-tech transition-colors ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Entries Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEntries.map((entry) => {
            const discovered = unlockedSet.has(entry.id);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectEntry(entry.id)}
                className={`text-left rounded-lg border p-4 transition-all flex flex-col justify-between ${
                  discovered
                    ? 'border-sky-500/40 bg-slate-900/65 hover:border-sky-400 hover:bg-slate-900'
                    : 'border-slate-800 bg-slate-950/60 hover:border-amber-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono-tech uppercase tracking-wider rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                      {entry.category}
                    </span>
                    {discovered ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono-tech text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        RECORDED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono-tech text-amber-400">
                        <Lock className="w-3 h-3" />
                        ARCHIVE STUDY
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{entry.subjectName}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {entry.whatIsIt}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono-tech text-sky-400">
                  <span>{entry.mainParts.length} DIAGRAM PARTS</span>
                  <span>OPEN BRIEFING →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
