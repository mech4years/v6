import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, X, BookOpen, ShieldAlert } from 'lucide-react';
import { EDUCATIONAL_BY_ID, EDUCATIONAL_ENTRIES } from '../game/educationData';
import { EducationalEntryDef, GameSettings } from '../game/types';
import { EducationalDiagram } from './EducationalDiagram';

interface EducationalReaderModalProps {
  entryId: string;
  settings: GameSettings;
  isMultiplayer: boolean;
  discoveredIds: string[];
  onChangeEntry: (id: string) => void;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  onClose: () => void;
}

const TEXT_SIZE_CLASSES: Record<'small' | 'medium' | 'large' | 'xlarge', string> = {
  small: 'text-xs leading-relaxed',
  medium: 'text-sm leading-relaxed',
  large: 'text-base leading-relaxed',
  xlarge: 'text-lg leading-loose',
};

export const EducationalReaderModal: React.FC<EducationalReaderModalProps> = ({
  entryId,
  settings,
  isMultiplayer,
  discoveredIds,
  onChangeEntry,
  onUpdateSettings,
  onClose,
}) => {
  const entry: EducationalEntryDef =
    EDUCATIONAL_BY_ID[entryId] ?? EDUCATIONAL_ENTRIES[0];
  const currentIdx = Math.max(
    0,
    EDUCATIONAL_ENTRIES.findIndex((e) => e.id === entry.id)
  );
  const prevEntry =
    EDUCATIONAL_ENTRIES[(currentIdx - 1 + EDUCATIONAL_ENTRIES.length) % EDUCATIONAL_ENTRIES.length];
  const nextEntry = EDUCATIONAL_ENTRIES[(currentIdx + 1) % EDUCATIONAL_ENTRIES.length];

  const [explanationLevel, setExplanationLevel] = useState<'simple' | 'advanced'>('simple');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textSize = settings.eduTextSize ?? 'medium';
  const narrationEnabled = settings.narrationEnabled ?? true;

  const stopSpeech = () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // ignore speech cleanup errors
    }
    setIsSpeaking(false);
  };

  const toggleNarration = () => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(entry.narrationScript);
        utter.rate = 0.96;
        utter.pitch = 1.0;
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utter);
      } catch {
        setIsSpeaking(false);
      }
    }
  };

  useEffect(() => {
    stopSpeech();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    if (narrationEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utter = new SpeechSynthesisUtterance(entry.narrationScript);
        utter.rate = 0.96;
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utter);
      } catch {
        setIsSpeaking(false);
      }
    }
    return () => stopSpeech();
  }, [entry.id]);

  // Keyboard support: Escape closes, Left/Right arrows switch entry
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        stopSpeech();
        onClose();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onChangeEntry(prevEntry.id);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onChangeEntry(nextEntry.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevEntry.id, nextEntry.id, onClose, onChangeEntry]);

  // Gamepad polling: B button closes, D-pad left/right flips entries, right stick scrolls
  useEffect(() => {
    let raf = 0;
    let lastSwitchAt = 0;
    const poll = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = pads[0];
      if (pad) {
        const now = performance.now();
        if (pad.buttons[1]?.pressed) {
          stopSpeech();
          onClose();
          return;
        }
        if (now - lastSwitchAt > 320) {
          if (pad.buttons[14]?.pressed) {
            lastSwitchAt = now;
            onChangeEntry(prevEntry.id);
          } else if (pad.buttons[15]?.pressed) {
            lastSwitchAt = now;
            onChangeEntry(nextEntry.id);
          }
        }
        const stickY = pad.axes[3] ?? 0;
        if (Math.abs(stickY) > 0.2 && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += stickY * 14;
        }
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [prevEntry.id, nextEntry.id, onClose, onChangeEntry]);

  // Safe double-click close on non-text-selectable backdrop/header only
  const handleSafeBackdropDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const sel = window.getSelection()?.toString() ?? '';
    if (sel.trim().length > 0) return;
    stopSpeech();
    onClose();
  };

  const handleSafeHeaderDoubleClick = () => {
    const sel = window.getSelection()?.toString() ?? '';
    if (sel.trim().length > 0) return;
    stopSpeech();
    onClose();
  };

  const bodyClass = TEXT_SIZE_CLASSES[textSize];

  return (
    <div
      data-testid="educational-reader-modal"
      onDoubleClick={handleSafeBackdropDoubleClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Educational Entry: ${entry.subjectName}`}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl border border-sky-500/40 bg-[#0b1017] text-slate-100 shadow-2xl overflow-hidden"
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar (double-clicking frame closes safely; single click Close always works) */}
        <div
          onDoubleClick={handleSafeHeaderDoubleClick}
          className="select-none flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-800 bg-[#0e1520]"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono-tech uppercase tracking-widest rounded bg-sky-950/90 text-sky-300 border border-sky-500/40">
                  {entry.category}
                </span>
                <span className="text-[10px] font-mono-tech uppercase tracking-widest text-emerald-300">
                  {isMultiplayer
                    ? 'LIVE CO-OP SESSION — TEAMMATES ACTIVE'
                    : 'SOLO SCAN — ENEMIES FROZEN'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                {entry.subjectName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Text size controls */}
            <div className="flex items-center rounded border border-slate-700 bg-slate-900/90 p-0.5 text-[11px] font-mono-tech">
              {(['small', 'medium', 'large', 'xlarge'] as const).map((sz, idx) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onUpdateSettings({ eduTextSize: sz })}
                  className={`px-2 py-1 rounded transition-colors ${
                    textSize === sz
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title={`Text size ${sz}`}
                >
                  {['S', 'M', 'L', 'XL'][idx]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleNarration}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono-tech transition-colors ${
                isSpeaking
                  ? 'border-amber-400 bg-amber-950/60 text-amber-200'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-sky-400'
              }`}
            >
              {isSpeaking ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {isSpeaking ? 'STOP AUDIO' : 'NARRATE'}
            </button>

            <button
              type="button"
              data-testid="edu-close-btn"
              onClick={() => {
                stopSpeech();
                onClose();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-600/90 hover:bg-red-500 text-white text-xs font-mono-tech font-bold tracking-wider"
            >
              <X className="w-3.5 h-3.5" />
              CLOSE
            </button>
          </div>
        </div>

        {/* Scrollable Educational Body (double-clicking/highlighting text here NEVER closes) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-5 select-text"
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {/* Diagram */}
          <EducationalDiagram diagramType={entry.diagramType} parts={entry.mainParts} />

          {/* Structured Knowledge Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="rounded-lg border border-slate-800 bg-slate-900/45 p-4">
              <h3 className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-sky-400 mb-1.5">
                WHAT IS IT?
              </h3>
              <p className={`${bodyClass} text-slate-200`}>{entry.whatIsIt}</p>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900/45 p-4">
              <h3 className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-sky-400 mb-1.5">
                WHAT DOES IT DO?
              </h3>
              <p className={`${bodyClass} text-slate-200`}>{entry.whatDoesItDo}</p>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900/45 p-4 md:col-span-2">
              <h3 className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-sky-400 mb-1.5">
                HOW DOES IT WORK?
              </h3>
              <p className={`${bodyClass} text-slate-200`}>{entry.howDoesItWork}</p>
            </section>
          </div>

          {/* Main Parts & Important Facts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="rounded-lg border border-slate-800 bg-slate-900/45 p-4">
              <h3 className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-amber-400 mb-2">
                MAIN PARTS &amp; COMPONENTS
              </h3>
              <ul className="space-y-2">
                {entry.mainParts.map((part) => (
                  <li key={part.label} className={`${bodyClass} text-slate-300`}>
                    <span className="font-semibold text-amber-300">{part.label}: </span>
                    {part.role}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900/45 p-4 space-y-3">
              <div>
                <h3 className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-emerald-400 mb-1.5">
                  WHY IS IT IMPORTANT?
                </h3>
                <p className={`${bodyClass} text-slate-200`}>{entry.whyImportant}</p>
              </div>
              <div>
                <h4 className="text-[11px] font-mono-tech uppercase tracking-[0.2em] text-emerald-400 mb-1.5">
                  IMPORTANT SCIENTIFIC FACTS
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {entry.importantFacts.map((fact) => (
                    <li key={fact} className={`${bodyClass} text-slate-300`}>
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          {/* REAL SCIENCE vs GAME FICTION strict separation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] font-mono-tech uppercase tracking-widest rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  REAL SCIENCE
                </span>
                <div className="flex items-center rounded border border-emerald-700/60 bg-black/40 p-0.5 text-[11px] font-mono-tech">
                  <button
                    type="button"
                    onClick={() => setExplanationLevel('simple')}
                    className={`px-2 py-0.5 rounded ${
                      explanationLevel === 'simple'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-emerald-200'
                    }`}
                  >
                    EASY
                  </button>
                  <button
                    type="button"
                    onClick={() => setExplanationLevel('advanced')}
                    className={`px-2 py-0.5 rounded ${
                      explanationLevel === 'advanced'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-emerald-200'
                    }`}
                  >
                    ADVANCED
                  </button>
                </div>
              </div>
              <p className={`${bodyClass} text-emerald-50`}>
                {explanationLevel === 'simple'
                  ? entry.realScienceSimple
                  : entry.realScienceAdvanced}
              </p>
            </section>

            <section className="rounded-lg border border-red-500/40 bg-red-950/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span className="px-2 py-0.5 text-[10px] font-mono-tech uppercase tracking-widest rounded bg-red-500/20 text-red-300 border border-red-500/40">
                  GAME LORE (FICTIONAL STORY)
                </span>
              </div>
              <p className={`${bodyClass} text-red-100/90`}>{entry.gameLoreFictional}</p>
            </section>
          </div>

          {/* Narration Subtitles Track */}
          {showSubtitles && (
            <div className="rounded-lg border border-slate-700 bg-black/75 px-4 py-2.5 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono-tech uppercase tracking-widest text-amber-400 mb-0.5">
                  SUBTITLES &amp; AUDIO TRANSCRIPT
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {entry.narrationScript}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubtitles(false)}
                className="text-[10px] font-mono-tech text-slate-400 hover:text-white shrink-0"
              >
                HIDE
              </button>
            </div>
          )}
          {!showSubtitles && (
            <button
              type="button"
              onClick={() => setShowSubtitles(true)}
              className="text-[11px] font-mono-tech text-sky-400 hover:text-sky-300 underline"
            >
              Show Subtitles
            </button>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="select-none flex items-center justify-between gap-2 px-5 py-2.5 border-t border-slate-800 bg-[#0e1520]">
          <button
            type="button"
            onClick={() => onChangeEntry(prevEntry.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-900 hover:border-sky-400 text-xs font-mono-tech text-slate-200 min-w-0 max-w-[230px]"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">PREV: {prevEntry.subjectName}</span>
          </button>

          <div className="hidden sm:block text-[11px] font-mono-tech tabular-nums text-slate-400 shrink-0">
            ENTRY {currentIdx + 1} / {EDUCATIONAL_ENTRIES.length} • UNLOCKED{' '}
            {discoveredIds.length}/{EDUCATIONAL_ENTRIES.length}
          </div>

          <button
            type="button"
            onClick={() => onChangeEntry(nextEntry.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-900 hover:border-sky-400 text-xs font-mono-tech text-slate-200 min-w-0 max-w-[230px]"
          >
            <span className="truncate">NEXT: {nextEntry.subjectName}</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
