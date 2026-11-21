import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Cpu,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { HorrorAudioEngine } from '../game/audio';
import { PUZZLES } from '../game/data';
import {
  createGeneratorChallenge,
  GeneratorChallengeState,
  QUESTIONS_PER_GENERATOR,
} from '../game/generatorMath';
import { GeneratorCircuitPuzzle } from './GeneratorCircuitPuzzle';

interface Props {
  puzzleId: string;
  levelNumber?: number;
  audio: HorrorAudioEngine | null;
  reducedMotion?: boolean;
  initialChallenge?: GeneratorChallengeState;
  onChallengeChange?: (next: GeneratorChallengeState) => void;
  onResolve: (solved: boolean) => void;
}

function inferLevelNumber(puzzleId: string): number {
  const m = puzzleId.match(/puz_(\d+)/);
  if (m) return Number.parseInt(m[1], 10);
  return 1;
}

export const PuzzleModal: React.FC<Props> = ({
  puzzleId,
  levelNumber,
  audio,
  reducedMotion = false,
  initialChallenge,
  onChallengeChange,
  onResolve,
}) => {
  const puzzle = PUZZLES[puzzleId];
  const effectiveLevel = levelNumber ?? inferLevelNumber(puzzleId);
  const [challenge, setChallenge] = useState<GeneratorChallengeState>(
    () => initialChallenge ?? createGeneratorChallenge(puzzleId)
  );
  const [circuitSolved, setCircuitSolved] = useState(false);
  const [phase2StabilizationPct, setPhase2StabilizationPct] = useState(
    () => initialChallenge?.stabilizationPct ?? 0
  );
  const [answerInput, setAnswerInput] = useState('');
  const [feedback, setFeedback] = useState<{
    kind: 'error' | 'success';
    text: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const initialChallengeRef = useRef(initialChallenge);
  initialChallengeRef.current = initialChallenge;
  const challengeRef = useRef(challenge);
  challengeRef.current = challenge;
  const onChallengeChangeRef = useRef(onChallengeChange);
  onChallengeChangeRef.current = onChallengeChange;

  useEffect(() => {
    const nextInit = initialChallengeRef.current ?? createGeneratorChallenge(puzzleId);
    setChallenge(nextInit);
    setCircuitSolved(false);
    setPhase2StabilizationPct(nextInit.stabilizationPct ?? 0);
    setAnswerInput('');
    setFeedback(null);
  }, [puzzleId]);

  useEffect(() => {
    if (!challenge.completed) {
      inputRef.current?.focus();
    }
  }, [challenge.currentIndex, challenge.completed, puzzleId]);

  const fullySolved = challenge.completed && circuitSolved;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onResolve(fullySolved);
      } else if (e.key === 'Enter' && fullySolved) {
        e.preventDefault();
        onResolve(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullySolved, onResolve]);

  if (!puzzle) return null;

  const solvedCount = Math.min(QUESTIONS_PER_GENERATOR, challenge.currentIndex);
  const progressPct = Math.round((solvedCount / QUESTIONS_PER_GENERATOR) * 100);
  const currentQuestion =
    !challenge.completed && solvedCount < challenge.questions.length
      ? challenge.questions[solvedCount]
      : null;

  const commitChallenge = (next: GeneratorChallengeState) => {
    setChallenge(next);
    onChallengeChangeRef.current?.(next);
  };

  const handleStabilizationChange = (pct: number) => {
    setPhase2StabilizationPct(pct);
    if (challengeRef.current.stabilizationPct !== pct) {
      const updated = { ...challengeRef.current, stabilizationPct: pct };
      challengeRef.current = updated;
      onChallengeChangeRef.current?.(updated);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    setAnswerInput(digitsOnly);
    if (feedback?.kind === 'error') {
      setFeedback(null);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (fullySolved) {
      onResolve(true);
      return;
    }

    if (!currentQuestion) return;

    const trimmed = answerInput.trim();
    if (!trimmed) {
      audio?.playPuzzleError();
      setFeedback({
        kind: 'error',
        text: `Type a whole number answer to continue. Your ${progressPct}% progress is safe!`,
      });
      inputRef.current?.focus();
      return;
    }

    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isInteger(parsed)) {
      audio?.playPuzzleError();
      setFeedback({
        kind: 'error',
        text: `Please enter a whole number. Your ${progressPct}% progress is safe!`,
      });
      inputRef.current?.focus();
      return;
    }

    if (parsed === currentQuestion.answer) {
      const nextIndex = solvedCount + 1;
      const isNowComplete = nextIndex >= QUESTIONS_PER_GENERATOR;
      const nextState: GeneratorChallengeState = {
        ...challenge,
        currentIndex: nextIndex,
        attemptsTotal: challenge.attemptsTotal + 1,
        wrongAttemptsOnCurrent: 0,
        completed: isNowComplete,
      };
      commitChallenge(nextState);
      setAnswerInput('');

      if (isNowComplete) {
        audio?.playPuzzleSolve();
        setFeedback({
          kind: 'success',
          text: 'Core charged to 100%! Complete Forsaken wiring and Skill Checks below to restore power.',
        });
      } else {
        audio?.playClick(true);
        const nextPct = Math.round((nextIndex / QUESTIONS_PER_GENERATOR) * 100);
        setFeedback({
          kind: 'success',
          text: `Nice! ${currentQuestion.promptText} = ${currentQuestion.answer} — Generator charged to ${nextPct}%!`,
        });
      }
      return;
    }

    audio?.playPuzzleError();
    const nextState: GeneratorChallengeState = {
      ...challenge,
      attemptsTotal: challenge.attemptsTotal + 1,
      wrongAttemptsOnCurrent: challenge.wrongAttemptsOnCurrent + 1,
    };
    commitChallenge(nextState);
    setAnswerInput('');
    setFeedback({
      kind: 'error',
      text: `${parsed} isn't right — try again! Unlimited attempts, and your ${progressPct}% progress is kept.`,
    });
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4">
      <div
        className={`w-full ${
          challenge.completed && !circuitSolved ? 'max-w-2xl' : 'max-w-xl'
        } bg-[#090c12] border border-zinc-700 p-5 sm:p-6 space-y-5 shadow-2xl max-h-[94vh] overflow-y-auto transition-all`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono-tech tracking-widest text-amber-400">
              <Cpu className="w-4 h-4" />
              <span>
                {puzzle.systemTag} ·{' '}
                {!challenge.completed
                  ? 'PHASE 1: MATH CALIBRATION'
                  : !circuitSolved
                    ? 'PHASE 2: FORSAKEN WIRING & SKILL CHECKS'
                    : 'ONLINE'}
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-wider text-zinc-100">
              {puzzle.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onResolve(fullySolved)}
            className="px-2.5 py-1.5 border border-zinc-700 hover:border-red-500 text-xs font-mono-tech text-zinc-300 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{fullySolved ? 'CLOSE' : 'ABORT'}</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {!challenge.completed
            ? puzzle.prompt
            : !circuitSolved
              ? 'Math calibration complete! Link every colored pair (A–E) on the Forsaken board and hit live Skill Checks to reach 100% stabilization.'
              : puzzle.successMessage ?? 'Generator energized!'}
        </p>

        {/* Progress from 0% to 100% */}
        <div className="bg-[#05070b] border border-zinc-800 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono-tech tabular-nums">
            <span className="flex items-center gap-2 text-zinc-300">
              <BatteryCharging
                className={`w-4 h-4 ${
                  fullySolved
                    ? 'text-emerald-400'
                    : challenge.completed
                      ? 'text-sky-400'
                      : 'text-amber-400'
                }`}
              />
              <span>GENERATOR CHARGE</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-zinc-400">
                {solvedCount} / {QUESTIONS_PER_GENERATOR} MATH ·{' '}
                {circuitSolved
                  ? '100% STABILIZED'
                  : challenge.completed
                    ? `STABILIZING ${phase2StabilizationPct}%`
                    : 'FORSAKEN CIRCUIT PENDING'}
              </span>
              <span
                className={`text-sm font-bold ${
                  fullySolved ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {progressPct}%
              </span>
            </div>
          </div>

          <div className="w-full h-2.5 bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                fullySolved
                  ? 'bg-emerald-500'
                  : challenge.completed
                    ? 'bg-sky-400'
                    : 'bg-gradient-to-r from-amber-600 to-amber-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: QUESTIONS_PER_GENERATOR }).map((_, idx) => {
              const filled = idx < solvedCount;
              const isCurrent = !challenge.completed && idx === solvedCount;
              return (
                <div
                  key={idx}
                  className={`h-2 transition-colors ${
                    filled
                      ? fullySolved
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                      : isCurrent
                        ? 'bg-amber-500/35 border border-amber-400/70'
                        : 'bg-zinc-900 border border-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Phase 1: Math Questions */}
        {!challenge.completed && currentQuestion ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#0d1118] border border-amber-500/40 p-6 text-center space-y-4">
              <div className="flex items-center justify-between text-[11px] font-mono-tech tracking-widest">
                <span className="px-2 py-0.5 bg-amber-950/70 border border-amber-600/50 text-amber-300">
                  {currentQuestion.operator === '×' ? 'MULTIPLICATION' : 'DIVISION'}
                </span>
                <span className="text-zinc-400 tabular-nums">
                  QUESTION {solvedCount + 1} OF {QUESTIONS_PER_GENERATOR}
                </span>
              </div>

              <div className="font-mono-tech text-4xl sm:text-5xl font-bold tracking-wider text-zinc-100 py-2 tabular-nums">
                {currentQuestion.promptText} <span className="text-amber-400">=</span>{' '}
                <span className="text-sky-300">?</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-sm mx-auto pt-1">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Enter answer..."
                  value={answerInput}
                  onChange={handleInputChange}
                  className="flex-1 bg-[#05070b] border-2 border-zinc-700 focus:border-amber-400 outline-none px-4 py-3 text-center font-mono-tech text-2xl font-bold text-sky-300 placeholder:text-zinc-600 placeholder:text-sm tabular-nums"
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono-tech text-xs font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>SUBMIT</span>
                </button>
              </div>
            </div>

            {feedback && (
              <div
                className={`flex items-center gap-2.5 px-3.5 py-2.5 border text-xs font-mono-tech ${
                  feedback.kind === 'error'
                    ? 'bg-red-950/55 border-red-700/80 text-red-200'
                    : 'bg-emerald-950/55 border-emerald-700/80 text-emerald-200'
                }`}
              >
                {feedback.kind === 'error' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                ) : (
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] font-mono-tech text-zinc-500">
              <span>WHOLE NUMBERS ONLY · UNLIMITED ATTEMPTS</span>
              <span>PROGRESS NEVER RESETS ON WRONG ANSWERS</span>
            </div>
          </form>
        ) : !circuitSolved ? (
          /* Phase 2: Forsaken Color-Link Circuit & Timed Skill Checks */
          <GeneratorCircuitPuzzle
            puzzleId={puzzleId}
            levelNumber={effectiveLevel}
            audio={audio}
            reducedMotion={reducedMotion}
            initialStabilizationPct={initialChallenge?.stabilizationPct ?? 0}
            onStabilizationChange={handleStabilizationChange}
            onComplete={() => setCircuitSolved(true)}
          />
        ) : (
          /* Both Phases Solved */
          <div className="bg-emerald-950/35 border border-emerald-500/60 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-mono-tech tracking-[0.22em] text-emerald-400">
                100% POWER RESTORED · FORSAKEN MATRIX STABILIZED
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-wider text-zinc-100">
                GENERATOR ACTIVATED!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                {puzzle.successMessage ??
                  'Calculations and circuit relay verified. The generator is now online!'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onResolve(true)}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono-tech text-xs font-bold tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>CONTINUE MISSION</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

