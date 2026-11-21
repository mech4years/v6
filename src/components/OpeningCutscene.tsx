import React, { useEffect, useRef, useState } from 'react';
import { Atom, BookOpen, Radio, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { HorrorAudioEngine } from '../game/audio';
import {
  CUTSCENE_TOTAL_DURATION,
  CutsceneOverlayState,
  OpeningCutsceneEngine,
} from '../game/cutscene';
import { EDUCATIONAL_BY_ID } from '../game/educationData';
import { EducationalDiagram } from './EducationalDiagram';

interface Props {
  audio: HorrorAudioEngine;
  onComplete: () => void;
  onSkip: () => void;
}

export const OpeningCutscene: React.FC<Props> = ({ audio, onComplete, onSkip }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const onSkipRef = useRef(onSkip);
  onCompleteRef.current = onComplete;
  onSkipRef.current = onSkip;

  const meteorEntry = EDUCATIONAL_BY_ID.edu_meteor;

  const [audioUnlocked, setAudioUnlocked] = useState(() => audio.isUnlocked());
  const [showScienceBriefing, setShowScienceBriefing] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [overlay, setOverlay] = useState<CutsceneOverlayState>({
    elapsed: 0,
    totalDuration: CUTSCENE_TOTAL_DURATION,
    sceneIndex: 1,
    fadeOpacity: 1,
    titleCard: { heading: 'YEAR 3059' },
    statementLines: null,
    radioBanner: null,
    damageFlash: 0,
  });

  const stopNarration = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setNarrating(false);
  };

  const toggleNarration = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (narrating) {
      stopNarration();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      'Real science briefing: What is a meteor? A meteoroid is a rocky or metallic fragment orbiting in space. When it enters Earth atmosphere at high speed, compressed air ahead of it heats into glowing plasma, forming a bright meteor streak. Any fragment that reaches the surface is called a meteorite. Asteroids are much larger rocky bodies, mostly orbiting between Mars and Jupiter. Fictional game lore: In the year 3059 AD, meteors carried alien organisms called THEY that infect metals and rare-earth elements only.'
    );
    u.rate = 0.96;
    u.pitch = 0.92;
    u.onend = () => setNarrating(false);
    u.onerror = () => setNarrating(false);
    setNarrating(true);
    window.speechSynthesis.speak(u);
  };

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const unlockNow = () => {
      audio.unlock();
      if (audio.isUnlocked()) setAudioUnlocked(true);
    };
    unlockNow();

    const engine = new OpeningCutsceneEngine(
      el,
      audio,
      (nextState) => setOverlay(nextState),
      () => {
        stopNarration();
        onCompleteRef.current();
      }
    );

    const onKeyDown = (e: KeyboardEvent) => {
      unlockNow();
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        stopNarration();
        audio.playClick(true);
        audio.setCutsceneDrone('normal');
        onSkipRef.current();
      }
    };

    const onPointerDown = () => {
      unlockNow();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
      stopNarration();
      engine.dispose();
    };
  }, [audio]);

  const progressPct = Math.min(100, (overlay.elapsed / overlay.totalDuration) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none">
      {/* Isolated 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Black Fade Overlay */}
      {overlay.fadeOpacity > 0.01 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: overlay.fadeOpacity }}
        />
      )}

      {/* Impact Damage Vignette */}
      {overlay.damageFlash > 0.02 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: Math.min(0.9, overlay.damageFlash),
            boxShadow: 'inset 0 0 130px 55px rgba(220, 38, 38, 0.85)',
          }}
        />
      )}

      {/* Top Cinema Letterbox Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 sm:h-14 bg-black/95 z-30 flex items-center justify-between px-4 sm:px-6 border-b border-zinc-900">
        <span className="text-[11px] font-mono-tech tracking-[0.22em] text-zinc-400">
          THE WORLD HAS ROTTEN
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowScienceBriefing((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-mono-tech tracking-wider transition-colors cursor-pointer ${
              showScienceBriefing
                ? 'border-sky-500/80 bg-sky-950/60 text-sky-200'
                : 'border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-sky-500/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>{showScienceBriefing ? 'HIDE METEOR SCIENCE' : 'WHAT IS A METEOR?'}</span>
          </button>
          {!audioUnlocked ? (
            <button
              onClick={() => {
                audio.unlock();
                setAudioUnlocked(true);
              }}
              className="flex items-center gap-1.5 text-[11px] font-mono-tech tracking-wider text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CLICK TO ENABLE AUDIO</span>
            </button>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono-tech tracking-wider text-zinc-500">
              <Volume2 className="w-3.5 h-3.5 text-red-500/80" />
              <span>AUDIO ACTIVE</span>
            </span>
          )}
        </div>
      </div>

      {/* Educational Meteor Briefing Card (Act 01 & Toggleable) */}
      {showScienceBriefing && meteorEntry && (
        <div className="absolute top-14 sm:top-16 right-3 sm:right-6 z-25 w-[min(94vw,430px)] bg-[#070a10]/92 border border-sky-800/70 p-4 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono-tech tracking-widest text-sky-300">
                <Atom className="w-3.5 h-3.5" />
                <span>REAL SCIENCE BRIEFING</span>
              </div>
              <h3 className="font-display text-sm sm:text-base font-bold text-zinc-100 mt-0.5">
                WHAT IS A METEOR?
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
            diagramType={meteorEntry.diagramType}
            parts={meteorEntry.mainParts}
            compact
          />

          <div className="space-y-1.5 text-[11px] sm:text-xs text-zinc-200 leading-relaxed">
            <p>
              <strong className="text-sky-300">Meteoroid:</strong> A rocky or metallic fragment orbiting in space.{' '}
              <strong className="text-amber-300">Meteor:</strong> The bright streak of light when it compresses and heats Earth’s atmosphere.{' '}
              <strong className="text-emerald-300">Meteorite:</strong> Any solid fragment that reaches Earth’s surface.
            </p>
            <p className="text-zinc-400">
              <strong className="text-zinc-200">Vs. Asteroids:</strong> Asteroids are much larger rocky bodies (meters to hundreds of km wide) orbiting mostly between Mars and Jupiter; meteoroids are smaller fragments broken off them.
            </p>
          </div>

          <div className="border-t border-red-900/60 pt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono-tech tracking-widest text-red-400">
              <Sparkles className="w-3 h-3" />
              <span>GAME FICTION (YEAR 3059 AD)</span>
            </div>
            <p className="text-[11px] text-red-200/90 mt-0.5 leading-snug">
              In THE WORLD HAS ROTTEN, fictional meteors carried alien organisms called THEY—which infect metals and rare-earth elements only, sparing living organisms.
            </p>
          </div>
        </div>
      )}

      {/* Center Title Card ("YEAR 3059", "THREE YEARS LATER") */}
      {overlay.titleCard && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-[0.3em] text-zinc-100">
            {overlay.titleCard.heading}
          </h2>
          {overlay.titleCard.subheading && (
            <p className="mt-3 text-xs sm:text-sm font-mono-tech tracking-[0.25em] text-red-400">
              {overlay.titleCard.subheading}
            </p>
          )}
        </div>
      )}

      {/* Statement Overlay */}
      {overlay.statementLines && (
        <div className="absolute inset-x-0 bottom-24 sm:bottom-28 z-20 flex flex-col items-center justify-center pointer-events-none px-6 text-center space-y-2.5">
          {overlay.statementLines.map((line, i) => (
            <p
              key={i}
              className={`font-display tracking-[0.2em] ${
                i === 0
                  ? 'text-lg sm:text-2xl font-semibold text-zinc-100'
                  : 'text-xl sm:text-3xl font-bold text-red-500'
              }`}
              style={{ textShadow: '0 2px 18px rgba(0,0,0,0.95)' }}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      {/* Military Radio Banner (Scene 5) */}
      {overlay.radioBanner && (
        <div className="absolute inset-x-0 bottom-20 sm:bottom-24 z-20 flex justify-center pointer-events-none px-4">
          <div
            className={`max-w-xl w-full px-5 py-3.5 border ${
              overlay.radioBanner.disconnected
                ? 'bg-[#170608]/95 border-red-600 text-red-300'
                : 'bg-[#080b10]/92 border-red-900/75 text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-[11px] font-mono-tech tracking-widest text-red-400">
              <Radio className="w-3.5 h-3.5" />
              <span>{overlay.radioBanner.speaker}</span>
            </div>
            <p className="text-sm sm:text-base font-medium text-center mt-1.5 leading-snug">
              {overlay.radioBanner.text}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Letterbox Bar with Progress + Skip */}
      <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-14 bg-black/95 z-30 flex items-center justify-between px-4 sm:px-6 border-t border-zinc-900/80">
        <div className="flex items-center gap-3 text-[11px] font-mono-tech text-zinc-500">
          <span>PROLOGUE · ACT 0{overlay.sceneIndex} / 05</span>
          <div className="hidden sm:block w-36 h-1 bg-zinc-900 overflow-hidden">
            <div className="h-full bg-red-600/85" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <button
          onClick={() => {
            stopNarration();
            audio.unlock();
            audio.playClick(true);
            audio.setCutsceneDrone('normal');
            onSkip();
          }}
          className="px-4 py-1.5 bg-zinc-900 hover:bg-red-800 border border-zinc-700 hover:border-red-500 text-[11px] font-mono-tech tracking-widest text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
        >
          SKIP INTRO [SPACE / ESC]
        </button>
      </div>
    </div>
  );
};
