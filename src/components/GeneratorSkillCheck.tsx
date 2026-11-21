import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flame, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import { HorrorAudioEngine } from '../game/audio';
import {
  ChapterGeneratorProfile,
  createSkillCheckZone,
  describeArcPath,
  evaluateSkillCheck,
  SkillCheckOutcome,
  SkillCheckZone,
} from '../game/forsakenPuzzle';

export type SkillCheckPhase = 'IDLE' | 'WARNING' | 'SWEEPING' | 'RESULT';

interface GeneratorSkillCheckProps {
  profile: ChapterGeneratorProfile;
  triggerNonce: number;
  disabled: boolean;
  reducedMotion?: boolean;
  audio: HorrorAudioEngine | null;
  onResult: (outcome: SkillCheckOutcome, deltaPct: number) => void;
  onActiveChange?: (isActive: boolean) => void;
}

const SPARK_OFFSETS = [
  { x1: 82, y1: 16, x2: 92, y2: 5, x3: 101, y3: 13 },
  { x1: 146, y1: 58, x2: 160, y2: 50, x3: 155, y3: 66 },
  { x1: 142, y1: 120, x2: 157, y2: 132, x3: 144, y3: 138 },
  { x1: 22, y1: 118, x2: 8, y2: 129, x3: 20, y3: 136 },
  { x1: 20, y1: 52, x2: 6, y2: 43, x3: 15, y3: 33 },
  { x1: 86, y1: 152, x2: 79, y2: 165, x3: 94, y3: 162 },
];

export const GeneratorSkillCheck: React.FC<GeneratorSkillCheckProps> = ({
  profile,
  triggerNonce,
  disabled,
  reducedMotion = false,
  audio,
  onResult,
  onActiveChange,
}) => {
  const [phase, setPhase] = useState<SkillCheckPhase>('IDLE');
  const [zone, setZone] = useState<SkillCheckZone>(() => createSkillCheckZone(profile));
  const [angleDeg, setAngleDeg] = useState(0);
  const [lastOutcome, setLastOutcome] = useState<{
    outcome: SkillCheckOutcome;
    deltaPct: number;
  } | null>(null);

  const phaseRef = useRef<SkillCheckPhase>('IDLE');
  const angleRef = useRef(0);
  const zoneRef = useRef<SkillCheckZone>(zone);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const handledNonceRef = useRef<number>(0);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    onActiveChange?.(phase === 'WARNING' || phase === 'SWEEPING');
  }, [phase, onActiveChange]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const finishAttempt = useCallback(
    (outcome: SkillCheckOutcome) => {
      clearTimers();
      phaseRef.current = 'RESULT';
      setPhase('RESULT');

      const deltaPct = outcome === 'great' ? 28 : outcome === 'good' ? 16 : -12;
      setLastOutcome({ outcome, deltaPct });

      if (outcome === 'great') {
        audio?.playSkillCheckSuccess(true);
      } else if (outcome === 'good') {
        audio?.playSkillCheckSuccess(false);
      } else {
        audio?.playGeneratorSparks();
      }

      onResultRef.current(outcome, deltaPct);

      timerRef.current = window.setTimeout(() => {
        phaseRef.current = 'IDLE';
        setPhase('IDLE');
        setAngleDeg(0);
        angleRef.current = 0;
      }, 950);
    },
    [audio, clearTimers]
  );

  // Start a new skill check whenever triggerNonce increments
  useEffect(() => {
    if (disabled) {
      clearTimers();
      phaseRef.current = 'IDLE';
      setPhase('IDLE');
      return;
    }
    if (triggerNonce <= 0 || triggerNonce === handledNonceRef.current) return;
    if (phaseRef.current === 'WARNING' || phaseRef.current === 'SWEEPING') return;

    handledNonceRef.current = triggerNonce;
    clearTimers();

    const nextZone = createSkillCheckZone(profile);
    zoneRef.current = nextZone;
    setZone(nextZone);
    angleRef.current = 0;
    setAngleDeg(0);
    setLastOutcome(null);

    phaseRef.current = 'WARNING';
    setPhase('WARNING');
    audio?.playSkillCheckCue();

    timerRef.current = window.setTimeout(() => {
      if (disabled) return;
      phaseRef.current = 'SWEEPING';
      setPhase('SWEEPING');
      lastFrameTimeRef.current = performance.now();

      const step = (now: number) => {
        if (phaseRef.current !== 'SWEEPING') return;
        const dtSec = Math.min(0.05, Math.max(0.001, (now - lastFrameTimeRef.current) / 1000));
        lastFrameTimeRef.current = now;

        const nextAngle = angleRef.current + dtSec * profile.needleSpeedDegPerSec;
        if (nextAngle >= 360) {
          angleRef.current = 360;
          setAngleDeg(360);
          finishAttempt('miss');
          return;
        }
        angleRef.current = nextAngle;
        setAngleDeg(nextAngle);
        rafRef.current = requestAnimationFrame(step);
      };

      rafRef.current = requestAnimationFrame(step);
    }, 540);
  }, [triggerNonce, disabled, profile, audio, clearTimers, finishAttempt]);

  const handleStrike = useCallback(() => {
    if (phaseRef.current !== 'SWEEPING') return;
    const outcome = evaluateSkillCheck(angleRef.current, zoneRef.current);
    finishAttempt(outcome);
  }, [finishAttempt]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.code === 'Space' || e.key === ' ') {
        if (phaseRef.current === 'WARNING' || phaseRef.current === 'SWEEPING') {
          e.preventDefault();
          e.stopPropagation();
        }
        if (phaseRef.current === 'SWEEPING') {
          handleStrike();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [disabled, handleStrike]);

  const successArc = useMemo(
    () => describeArcPath(82, 82, 58, zone.successStartDeg, zone.successEndDeg),
    [zone.successStartDeg, zone.successEndDeg]
  );
  const greatArc = useMemo(
    () => describeArcPath(82, 82, 58, zone.greatStartDeg, zone.greatEndDeg),
    [zone.greatStartDeg, zone.greatEndDeg]
  );

  const needleRad = ((angleDeg - 90) * Math.PI) / 180;
  const nx1 = 82 + 24 * Math.cos(needleRad);
  const ny1 = 82 + 24 * Math.sin(needleRad);
  const nx2 = 82 + 69 * Math.cos(needleRad);
  const ny2 = 82 + 69 * Math.sin(needleRad);

  const showSparks = phase === 'RESULT' && lastOutcome?.outcome === 'miss';
  const showGreat = phase === 'RESULT' && lastOutcome?.outcome === 'great';
  const showGood = phase === 'RESULT' && lastOutcome?.outcome === 'good';

  return (
    <div
      data-testid="generator-skill-check"
      className={`border p-3.5 transition-colors flex flex-col items-center justify-between gap-3 ${
        phase === 'SWEEPING'
          ? 'bg-[#101624] border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.28)]'
          : phase === 'WARNING'
            ? 'bg-[#0e131e] border-sky-400/80 shadow-[0_0_16px_rgba(56,189,248,0.22)]'
            : showSparks
              ? `bg-[#1a110a] border-orange-500 ${reducedMotion ? '' : 'animate-pulse'}`
              : showGreat
                ? 'bg-amber-950/35 border-amber-400'
                : showGood
                  ? 'bg-emerald-950/35 border-emerald-500'
                  : 'bg-[#070a10] border-zinc-800'
      }`}
    >
      {/* Top Status Header */}
      <div className="w-full flex items-center justify-between gap-2 text-[10px] font-mono-tech uppercase tracking-[0.16em]">
        <span className="text-zinc-400">SKILL CHECK RING</span>
        <span
          className={`font-bold tabular-nums ${
            phase === 'SWEEPING'
              ? 'text-amber-300'
              : phase === 'WARNING'
                ? 'text-sky-300'
                : showSparks
                  ? 'text-orange-400'
                  : showGreat
                    ? 'text-amber-300'
                    : showGood
                      ? 'text-emerald-300'
                      : 'text-zinc-500'
          }`}
        >
          {phase === 'IDLE'
            ? 'STANDBY'
            : phase === 'WARNING'
              ? 'ALERT — READY'
              : phase === 'SWEEPING'
                ? 'HIT [SPACE]!'
                : lastOutcome?.outcome === 'great'
                  ? 'OVERCHARGE +28%'
                  : lastOutcome?.outcome === 'good'
                    ? 'LOCKED +16%'
                    : 'SPARKS -12%'}
        </span>
      </div>

      {/* Radial Calibration Ring SVG */}
      <div className="relative w-[164px] h-[164px] flex items-center justify-center">
        <svg
          viewBox="0 0 164 164"
          className="w-full h-full overflow-visible"
          aria-label="Generator Skill Check Dial"
        >
          {/* Outer mechanical dial ring */}
          <circle
            cx="82"
            cy="82"
            r="68"
            fill="#04060a"
            stroke="#1e293b"
            strokeWidth="2"
          />
          {/* Base track */}
          <circle
            cx="82"
            cy="82"
            r="58"
            fill="none"
            stroke="#1f2937"
            strokeWidth="12"
          />

          {/* Tick markers around perimeter */}
          {[0, 90, 180, 270].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x1 = 82 + 65 * Math.cos(rad);
            const y1 = 82 + 65 * Math.sin(rad);
            const x2 = 82 + 71 * Math.cos(rad);
            const y2 = 82 + 71 * Math.sin(rad);
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#475569"
                strokeWidth="2"
              />
            );
          })}

          {/* Success Zone Arc */}
          {(phase === 'WARNING' || phase === 'SWEEPING' || phase === 'RESULT') && (
            <path
              d={successArc}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="12"
              strokeLinecap="butt"
              opacity={phase === 'WARNING' ? 0.65 : 0.92}
            />
          )}

          {/* Great Overcharge Zone Arc */}
          {(phase === 'WARNING' || phase === 'SWEEPING' || phase === 'RESULT') && (
            <path
              d={greatArc}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="14"
              strokeLinecap="butt"
            />
          )}

          {/* Sweeping Calibration Needle */}
          {(phase === 'WARNING' || phase === 'SWEEPING' || phase === 'RESULT') && (
            <line
              x1={nx1}
              y1={ny1}
              x2={nx2}
              y2={ny2}
              stroke={
                showSparks
                  ? '#fb923c'
                  : showGreat
                    ? '#fde047'
                    : showGood
                      ? '#34d399'
                      : '#f8fafc'
              }
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          )}

          {/* Minor Electrical Spark Jagged Arcs on Miss */}
          {showSparks &&
            SPARK_OFFSETS.map((sp, i) => (
              <polyline
                key={i}
                points={`${sp.x1},${sp.y1} ${sp.x2},${sp.y2} ${sp.x3},${sp.y3}`}
                fill="none"
                stroke={i % 2 === 0 ? '#fbbf24' : '#fb923c'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

          {/* Center hub */}
          <circle
            cx="82"
            cy="82"
            r="24"
            fill="#0b1019"
            stroke={
              phase === 'SWEEPING'
                ? '#f59e0b'
                : showSparks
                  ? '#f97316'
                  : '#334155'
            }
            strokeWidth="2"
          />
        </svg>

        {/* Center badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {showSparks ? (
            <Flame className="w-5 h-5 text-orange-400" />
          ) : showGreat ? (
            <Sparkles className="w-5 h-5 text-amber-300" />
          ) : (
            <Zap
              className={`w-5 h-5 ${
                phase === 'SWEEPING'
                  ? 'text-amber-300'
                  : phase === 'WARNING'
                    ? 'text-sky-300'
                    : 'text-zinc-600'
              }`}
            />
          )}
          <span className="text-[9px] font-mono-tech text-zinc-400 mt-0.5 tabular-nums">
            {profile.successArcDeg}°
          </span>
        </div>
      </div>

      {/* Tactile Calibration Trigger Button (>= 48px touch target for mouse & mobile) */}
      <button
        type="button"
        data-testid="skill-check-trigger-btn"
        onClick={handleStrike}
        disabled={phase !== 'SWEEPING' || disabled}
        className={`w-full min-h-[48px] px-3 py-2.5 border font-mono-tech text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
          phase === 'SWEEPING'
            ? 'bg-amber-500 hover:bg-amber-400 active:scale-[0.98] border-amber-300 text-black shadow-[0_0_16px_rgba(245,158,11,0.4)]'
            : phase === 'WARNING'
              ? 'bg-sky-950/60 border-sky-500/60 text-sky-200 cursor-wait'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 cursor-default'
        }`}
      >
        <Zap className="w-4 h-4 shrink-0" />
        <span>
          {phase === 'SWEEPING'
            ? 'CALIBRATE [SPACE]'
            : phase === 'WARNING'
              ? 'INCOMING CHECK...'
              : 'CALIBRATION READY'}
        </span>
      </button>

      {/* Penalty Guarantee Caption */}
      <div className="w-full text-[10px] font-mono-tech text-zinc-400 leading-snug border-t border-zinc-800/90 pt-2 flex items-start gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
        <span>
          {showSparks
            ? 'Minor sparks discharged (-12% charge). Suit intact & silent.'
            : 'Misses emit minor sparks & lose 12% charge only — silent.'}
        </span>
      </div>
    </div>
  );
};
