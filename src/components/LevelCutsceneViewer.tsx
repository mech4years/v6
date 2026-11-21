import React, { useEffect, useRef, useState } from 'react';
import { Atom, BookOpen, Radio, SkipForward, Sparkles, Users, Volume2, VolumeX } from 'lucide-react';
import { HorrorAudioEngine } from '../game/audio';
import { EDUCATIONAL_BY_ID } from '../game/educationData';
import { CutsceneTargetId } from '../game/types';
import {
  CutsceneViewerState,
  LevelCutsceneEngine,
  LEVEL_CUTSCENE_DEFS,
} from '../game/levelCutscenes';
import { EducationalDiagram } from './EducationalDiagram';

interface Props {
  targetId: CutsceneTargetId;
  audio: HorrorAudioEngine;
  onComplete: () => void;
  onSkip: () => void;
  onDiscoverEducation?: (entryId: string) => void;
  isMultiplayer?: boolean;
  partySize?: number;
  subtitleSize?: 'small' | 'medium' | 'large';
}

const LEVEL_TO_EDUCATION_ID: Record<number, string> = {
  0: 'edu_meteor',
  1: 'edu_generator',
  2: 'edu_tree',
  3: 'edu_cryo_lab',
  4: 'edu_tower_crane',
  5: 'edu_hydro_pump',
  6: 'edu_infected_mech',
  7: 'edu_climate_biosphere',
  8: 'edu_deep_geology',
  9: 'edu_weather_station',
  10: 'edu_satellite',
  11: 'edu_zero_g_station',
  12: 'edu_rare_earth',
};

export const LevelCutsceneViewer: React.FC<Props> = ({
  targetId,
  audio,
  onComplete,
  onSkip,
  onDiscoverEducation,
  isMultiplayer = false,
  partySize = 1,
  subtitleSize = 'medium',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const onSkipRef = useRef(onSkip);
  const onDiscoverRef = useRef(onDiscoverEducation);
  onCompleteRef.current = onComplete;
  onSkipRef.current = onSkip;
  onDiscoverRef.current = onDiscoverEducation;

  const def = LEVEL_CUTSCENE_DEFS[targetId] || LEVEL_CUTSCENE_DEFS.level_01;
  const eduId = LEVEL_TO_EDUCATION_ID[def.levelNumber] || 'edu_meteor';
  const eduEntry = EDUCATIONAL_BY_ID[eduId];

  const [audioUnlocked, setAudioUnlocked] = useState(() => audio.isUnlocked());
  const [skipVotes, setSkipVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [narrating, setNarrating] = useState(false);

  const [viewerState, setViewerState] = useState<CutsceneViewerState>({
    elapsed: 0,
    totalDuration: def.totalDuration,
    progressPct: 0,
    fadeOpacity: 1,
    titleCard: { heading: def.title, subheading: def.subtitle },
    activeDialogue: null,
    statement: null,
    secondaryStatement: null,
    glitchIntensity: 0,
    cinemaBarsOpacity: 1,
  });

  const engineRef = useRef<LevelCutsceneEngine | null>(null);

  const stopNarration = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setNarrating(false);
  };

  const toggleNarration = () => {
    if (!eduEntry || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (narrating) {
      stopNarration();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(eduEntry.narrationScript);
    u.rate = 0.96;
    u.pitch = 0.92;
    u.onend = () => setNarrating(false);
    u.onerror = () => setNarrating(false);
    setNarrating(true);
    window.speechSynthesis.speak(u);
  };

  const triggerVoteSkip = () => {
    if (!isMultiplayer || partySize <= 1) {
      stopNarration();
      audio.playClick(true);
      engineRef.current?.skip();
      onSkipRef.current();
      return;
    }

    if (!hasVoted) {
      setHasVoted(true);
      const nextVotes = skipVotes + 1;
      setSkipVotes(nextVotes);
      audio.playClick(true);
      if (nextVotes >= Math.ceil(partySize / 2)) {
        stopNarration();
        engineRef.current?.skip();
        onSkipRef.current();
      }
    }
  };

  useEffect(() => {
    if (eduEntry) {
      onDiscoverRef.current?.(eduEntry.id);
    }
  }, [eduEntry]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const unlockAudio = () => {
      audio.unlock();
      if (audio.isUnlocked()) setAudioUnlocked(true);
    };
    unlockAudio();

    const engine = new LevelCutsceneEngine(
      el,
      targetId,
      audio,
      (state) => setViewerState(state),
      () => {
        stopNarration();
        onCompleteRef.current();
      }
    );
    engineRef.current = engine;

    const onKeyDown = (e: KeyboardEvent) => {
      unlockAudio();
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        triggerVoteSkip();
      }
    };

    const onPointerDown = () => {
      unlockAudio();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
      stopNarration();
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, audio]);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none flex flex-col justify-between">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Screen Glitch Distortion Filter */}
      {viewerState.glitchIntensity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-color-dodge animate-pulse"
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(6,182,212,0.15) 0px, transparent 2px, transparent 4px)',
          }}
        />
      )}

      {/* Black Fade Overlay */}
      {viewerState.fadeOpacity > 0.01 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
          style={{ opacity: viewerState.fadeOpacity }}
        />
      )}

      {/* Cinematic Letterbox Bar: Top */}
      <div className="relative z-20 w-full h-14 sm:h-16 bg-black/95 flex items-center justify-between px-4 sm:px-10 border-b border-zinc-900/60 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] sm:text-xs font-mono-tech tracking-[0.22em] text-zinc-400 truncate">
            {def.chapterTag.replace(/\s*\/\/\s*/g, ' · ')}
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {eduEntry && (
            <button
              onClick={() => setShowBriefing((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[10px] sm:text-[11px] font-mono-tech transition-colors cursor-pointer ${
                showBriefing
                  ? 'border-sky-500 bg-sky-950/60 text-sky-200'
                  : 'border-zinc-700 bg-zinc-900/80 text-zinc-200 hover:border-sky-500/70'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>{showBriefing ? 'HIDE BRIEFING' : `SCIENCE: ${eduEntry.subjectName.toUpperCase()}`}</span>
            </button>
          )}

          {isMultiplayer && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono-tech text-zinc-400">
              <Users className="w-3 h-3 text-sky-400" />
              <span>
                SKIP VOTES: {skipVotes}/{partySize}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              audio.unlock();
              setAudioUnlocked(audio.isUnlocked());
            }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
            title={audioUnlocked ? 'Audio Active' : 'Click to Enable Audio'}
          >
            {audioUnlocked ? <Volume2 className="w-4 h-4 text-zinc-300" /> : <VolumeX className="w-4 h-4 text-red-500" />}
          </button>

          <button
            onClick={triggerVoteSkip}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700/80 hover:border-zinc-500 bg-zinc-950/70 hover:bg-zinc-900 text-[11px] font-mono-tech text-zinc-200 transition-colors cursor-pointer"
          >
            <span>{hasVoted ? 'VOTED TO SKIP' : 'SKIP SCENE'}</span>
            <SkipForward className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Toggleable Chapter Scientific Briefing Overlay */}
      {showBriefing && eduEntry && (
        <div className="absolute top-16 right-4 sm:right-8 z-30 w-[min(92vw,420px)] bg-[#070a10]/95 border border-sky-800/75 p-4 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono-tech tracking-widest text-sky-300">
                <Atom className="w-3.5 h-3.5" />
                <span>REAL SCIENCE · {eduEntry.category.toUpperCase()}</span>
              </div>
              <h3 className="font-display text-sm sm:text-base font-bold text-zinc-100 mt-0.5">
                {eduEntry.subjectName}
              </h3>
            </div>
            <button
              onClick={toggleNarration}
              className={`px-2 py-1 border text-[10px] font-mono-tech cursor-pointer ${
                narrating
                  ? 'border-sky-400 bg-sky-950/60 text-sky-200'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-sky-500'
              }`}
            >
              {narrating ? 'STOP VOICE' : 'NARRATE'}
            </button>
          </div>

          <EducationalDiagram
            diagramType={eduEntry.diagramType}
            parts={eduEntry.mainParts}
            compact
          />

          <p className="text-xs text-zinc-200 leading-relaxed">{eduEntry.realScienceSimple}</p>

          <div className="border-t border-red-900/60 pt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono-tech tracking-widest text-red-400">
              <Sparkles className="w-3 h-3" />
              <span>GAME LORE (FICTIONAL)</span>
            </div>
            <p className="text-[11px] text-red-200/90 mt-0.5 leading-snug">
              {eduEntry.gameLoreFictional}
            </p>
          </div>
        </div>
      )}

      {/* Center Cinematic Stage Overlays */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
        {viewerState.titleCard && (
          <div className="space-y-2 animate-fade-in max-w-2xl">
            <p className="text-[11px] sm:text-xs font-mono-tech tracking-[0.3em] text-red-500 uppercase">
              {viewerState.titleCard.subheading}
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-black tracking-[0.2em] text-zinc-100 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              {viewerState.titleCard.heading}
            </h1>
          </div>
        )}

        {viewerState.statement && (
          <div className="my-auto max-w-3xl space-y-3 px-4 py-6 bg-black/60 border-y border-red-900/60 shadow-2xl animate-fade-in">
            <div className="font-display text-xl sm:text-3xl md:text-4xl font-extrabold tracking-[0.22em] text-zinc-100 leading-snug drop-shadow-[0_0_24px_rgba(239,68,68,0.65)]">
              {viewerState.statement}
            </div>
            {viewerState.secondaryStatement && (
              <div className="font-mono-tech text-xs sm:text-sm tracking-[0.25em] text-sky-400 uppercase">
                {viewerState.secondaryStatement}
              </div>
            )}
            <div className="pt-2 text-[10px] sm:text-xs font-mono-tech text-zinc-400 tracking-[0.2em]">
              NEXT OBJECTIVE: {def.nextLevelTitle.replace(/\s*\/\/\s*/g, ' · ')} · {def.nextLocation}
            </div>
          </div>
        )}
      </div>

      {/* Cinematic Subtitles & Comms Banner: Bottom */}
      <div className="relative z-20 w-full bg-black/90 border-t border-zinc-900/80 px-6 sm:px-12 py-4 flex flex-col items-center gap-3">
        {viewerState.activeDialogue && (
          <div className="w-full max-w-2xl bg-zinc-950/80 border border-zinc-800 p-3.5 flex items-start gap-3 text-left shadow-lg">
            <div className="p-1.5 bg-red-950/60 border border-red-800/60 text-red-400 mt-0.5">
              <Radio className="w-4 h-4" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-[10px] sm:text-xs font-mono-tech font-bold tracking-widest text-red-400">
                [{viewerState.activeDialogue.speaker}]
              </div>
              <p
                className={`${
                  subtitleSize === 'large'
                    ? 'text-sm sm:text-base'
                    : subtitleSize === 'small'
                      ? 'text-[11px] sm:text-xs'
                      : 'text-xs sm:text-sm'
                } text-zinc-200 font-mono-tech leading-relaxed`}
              >
                "{viewerState.activeDialogue.text}"
              </p>
            </div>
          </div>
        )}

        <div className="w-full max-w-2xl flex items-center justify-between text-[9px] sm:text-[10px] font-mono-tech text-zinc-500 pt-1 tabular-nums">
          <span>{viewerState.elapsed.toFixed(1)}s</span>
          <div className="flex-1 mx-3 h-0.5 bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-red-600 transition-all duration-100"
              style={{ width: `${viewerState.progressPct}%` }}
            />
          </div>
          <span>{viewerState.totalDuration.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
};
