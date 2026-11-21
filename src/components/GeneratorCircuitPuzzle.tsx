import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ban, CheckCircle2, Flame, Lightbulb, RotateCcw, Zap } from 'lucide-react';
import { HorrorAudioEngine } from '../game/audio';
import {
  bfsPairRoute,
  buildForsakenBoard,
  Coord,
  coordKey,
  ForsakenTerminalPair,
  isOrthogonalAdjacent,
  isSameCoord,
  SkillCheckOutcome,
} from '../game/forsakenPuzzle';
import { GeneratorSkillCheck } from './GeneratorSkillCheck';

interface GeneratorCircuitPuzzleProps {
  puzzleId: string;
  levelNumber: number;
  audio: HorrorAudioEngine | null;
  reducedMotion?: boolean;
  initialStabilizationPct?: number;
  onStabilizationChange?: (pct: number) => void;
  onSkillCheckMiss?: () => void;
  onComplete: () => void;
}

type PathsMap = Record<string, Coord[]>;

function isPairLinked(pair: ForsakenTerminalPair, path: Coord[] | undefined): boolean {
  if (!path || path.length < 2) return false;
  const first = path[0];
  const last = path[path.length - 1];
  return (
    (isSameCoord(first, pair.start) && isSameCoord(last, pair.end)) ||
    (isSameCoord(first, pair.end) && isSameCoord(last, pair.start))
  );
}

export const GeneratorCircuitPuzzle: React.FC<GeneratorCircuitPuzzleProps> = ({
  puzzleId,
  levelNumber,
  audio,
  reducedMotion = false,
  initialStabilizationPct = 0,
  onStabilizationChange,
  onSkillCheckMiss,
  onComplete,
}) => {
  const board = useMemo(
    () => buildForsakenBoard(puzzleId, levelNumber),
    [puzzleId, levelNumber]
  );

  const [paths, setPaths] = useState<PathsMap>({});
  const [activePairId, setActivePairId] = useState<string | null>(
    () => board.pairs[0]?.id ?? null
  );
  const [checkBonusPct, setCheckBonusPct] = useState<number>(
    () => Math.max(0, Math.min(100, initialStabilizationPct))
  );
  const [skillCheckNonce, setSkillCheckNonce] = useState<number>(0);
  const [skillCheckActive, setSkillCheckActive] = useState<boolean>(false);
  const [sparksFlash, setSparksFlash] = useState<boolean>(false);
  const [hintInfo, setHintInfo] = useState<{ pairId: string; coord: Coord } | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>(
    'Connect matching color terminals (A–E) and hit timed Skill Checks to reach 100%.'
  );
  const [solvedAnim, setSolvedAnim] = useState<boolean>(false);

  const isDraggingRef = useRef<boolean>(false);
  const lastTriggerTimeRef = useRef<number>(0);
  const completedFiredRef = useRef<boolean>(false);
  const initialStabilizationRef = useRef<number>(initialStabilizationPct);
  initialStabilizationRef.current = initialStabilizationPct;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reset board state cleanly if puzzleId or levelNumber changes
  useEffect(() => {
    setPaths({});
    setActivePairId(board.pairs[0]?.id ?? null);
    setCheckBonusPct(Math.max(0, Math.min(100, initialStabilizationRef.current)));
    setSkillCheckNonce(0);
    setSkillCheckActive(false);
    setSparksFlash(false);
    setHintInfo(null);
    setSolvedAnim(false);
    completedFiredRef.current = false;
    lastTriggerTimeRef.current = performance.now();
    setStatusMsg(
      `Link all ${board.pairs.length} colored pairs (${board.size}×${board.size}) and calibrate Skill Checks.`
    );
  }, [board]);

  // Global pointer release clears drag state cleanly
  useEffect(() => {
    const stopDrag = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    return () => {
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, []);

  // Map coordinate -> terminal pair (if cell is an endpoint)
  const terminalAtCoord = useMemo(() => {
    const map = new Map<string, { pair: ForsakenTerminalPair; end: 'start' | 'end' }>();
    board.pairs.forEach((pair) => {
      map.set(coordKey(pair.start.r, pair.start.c), { pair, end: 'start' });
      map.set(coordKey(pair.end.r, pair.end.c), { pair, end: 'end' });
    });
    return map;
  }, [board]);

  // Map coordinate -> occupying wire pairId (including terminals & drawn paths)
  const wireOwnerAtCoord = useMemo(() => {
    const map = new Map<string, { pairId: string; index: number }>();
    Object.entries(paths).forEach(([pairId, pts]) => {
      pts.forEach((pt, idx) => {
        map.set(coordKey(pt.r, pt.c), { pairId, index: idx });
      });
    });
    return map;
  }, [paths]);

  const linkedPairIds = useMemo(() => {
    const set = new Set<string>();
    board.pairs.forEach((pair) => {
      if (isPairLinked(pair, paths[pair.id])) {
        set.add(pair.id);
      }
    });
    return set;
  }, [board.pairs, paths]);

  const allPairsLinked = linkedPairIds.size === board.pairs.length;
  const baseLinkPct = Math.round((linkedPairIds.size / Math.max(1, board.pairs.length)) * 70);
  const stabilizationPct = Math.max(0, Math.min(100, baseLinkPct + checkBonusPct));

  useEffect(() => {
    onStabilizationChange?.(stabilizationPct);
  }, [stabilizationPct, onStabilizationChange]);

  const triggerSkillCheck = useCallback(() => {
    if (solvedAnim || skillCheckActive) return;
    lastTriggerTimeRef.current = performance.now();
    setSkillCheckNonce((n) => n + 1);
  }, [solvedAnim, skillCheckActive]);

  // Auto-schedule live Skill Checks while repairing (or rapidly when all pairs linked and < 100%)
  useEffect(() => {
    if (solvedAnim || skillCheckActive) return;
    if (allPairsLinked && stabilizationPct >= 100) return;

    const delayMs = allPairsLinked ? 850 : 4800;
    const timer = window.setTimeout(() => {
      triggerSkillCheck();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [solvedAnim, skillCheckActive, allPairsLinked, stabilizationPct, triggerSkillCheck]);

  // Completion detector: All pairs connected + 100% Stabilization
  useEffect(() => {
    if (!allPairsLinked || stabilizationPct < 100 || completedFiredRef.current) return;
    completedFiredRef.current = true;
    setSolvedAnim(true);
    audio?.playPuzzleSolve();
    setStatusMsg('ALL CONDUCTORS LINKED & 100% STABILIZED — GENERATOR ONLINE!');
    const timer = window.setTimeout(() => {
      onCompleteRef.current();
    }, 950);
    return () => window.clearTimeout(timer);
  }, [allPairsLinked, stabilizationPct, audio]);

  const handleSkillCheckResult = useCallback(
    (outcome: SkillCheckOutcome, deltaPct: number) => {
      const currentTotal = Math.max(0, Math.min(100, baseLinkPct + checkBonusPct));
      const nextTotal = Math.max(0, Math.min(100, currentTotal + deltaPct));
      const nextBonus = nextTotal - baseLinkPct;
      setCheckBonusPct(nextBonus);

      if (outcome === 'great') {
        setStatusMsg(`OVERCHARGE SURGE! Calibration locked (+28% charge -> ${nextTotal}%).`);
      } else if (outcome === 'good') {
        setStatusMsg(`Skill check calibrated (+16% charge -> ${nextTotal}%).`);
      } else {
        // Missed skill check: minor sparks + lose charge ONLY (never alert monsters or damage HP)
        setSparksFlash(true);
        setStatusMsg(
          `Minor electrical sparks! Lost 12% charge (${nextTotal}%). Suit intact, no noise alert.`
        );
        onSkillCheckMiss?.();
        window.setTimeout(() => setSparksFlash(false), 650);
      }
    },
    [baseLinkPct, checkBonusPct, onSkillCheckMiss]
  );

  const pairById = useMemo(() => {
    const map = new Map<string, ForsakenTerminalPair>();
    board.pairs.forEach((p) => map.set(p.id, p));
    return map;
  }, [board.pairs]);

  const stepIntoCell = useCallback(
    (r: number, c: number, isPointerDownOrigin: boolean) => {
      if (solvedAnim) return;
      const k = coordKey(r, c);
      const coord: Coord = { r, c };

      if (board.blocked.has(k)) {
        if (isPointerDownOrigin) {
          audio?.playPuzzleError();
          setStatusMsg('Burnt relay fault! Route conductors around blocked nodes.');
        }
        return;
      }

      const terminal = terminalAtCoord.get(k);
      const wireOwner = wireOwnerAtCoord.get(k);

      // Case 1: Initial click/press on any terminal starts/selects that pair cleanly
      if (isPointerDownOrigin && terminal) {
        const pair = terminal.pair;
        const existing = paths[pair.id];
        if (existing && existing.length >= 2 && isSameCoord(existing[existing.length - 1], coord) && !isPairLinked(pair, existing)) {
          // Clicking active tip keeps extending from here
          setActivePairId(pair.id);
          isDraggingRef.current = true;
          return;
        }
        setActivePairId(pair.id);
        setPaths((prev) => ({ ...prev, [pair.id]: [coord] }));
        setHintInfo(null);
        isDraggingRef.current = true;
        audio?.playClick(true);
        setStatusMsg(`Routing Line ${pair.label} (${pair.name}) — connect to matching ${pair.label} terminal.`);
        return;
      }

      // Case 2: Pressing on an existing wire node trims back to that node & continues dragging
      if (isPointerDownOrigin && wireOwner) {
        const pair = pairById.get(wireOwner.pairId);
        if (pair) {
          setActivePairId(pair.id);
          setPaths((prev) => ({
            ...prev,
            [pair.id]: (prev[pair.id] ?? []).slice(0, wireOwner.index + 1),
          }));
          setHintInfo(null);
          isDraggingRef.current = true;
          audio?.playClick(false);
          setStatusMsg(`Adjusted Line ${pair.label} junction.`);
          return;
        }
      }

      // Case 3: Extending the currently active wire (either via drag or orthogonal cell click)
      if (!activePairId) return;
      const activePair = pairById.get(activePairId);
      if (!activePair) return;

      const currentPath = paths[activePairId] ?? [activePair.start];
      if (isPairLinked(activePair, currentPath)) {
        // Already complete; clicking/dragging non-terminal doesn't extend past target
        return;
      }

      const head = currentPath[currentPath.length - 1];
      if (isSameCoord(head, coord)) return;

      // Backtrack smoothly if stepping onto immediately previous cell of active wire
      if (currentPath.length >= 2 && isSameCoord(currentPath[currentPath.length - 2], coord)) {
        setPaths((prev) => ({
          ...prev,
          [activePairId]: currentPath.slice(0, -1),
        }));
        setHintInfo(null);
        audio?.playClick(false);
        return;
      }

      if (!isOrthogonalAdjacent(head, coord)) {
        if (isPointerDownOrigin) {
          audio?.playPuzzleError();
          setStatusMsg(
            `Select an orthogonal node next to Line ${activePair.label}'s tip or click any terminal (${board.pairs.map((p) => p.label).join('/')}).`
          );
        }
        return;
      }

      // Prevent crossing another pair's terminal
      if (terminal && terminal.pair.id !== activePairId) {
        if (isPointerDownOrigin) {
          audio?.playPuzzleError();
          setStatusMsg(`That terminal belongs to Line ${terminal.pair.label}, not Line ${activePair.label}.`);
        }
        return;
      }

      // Prevent overlapping same wire earlier nodes or other pair's wires
      if (wireOwner) {
        if (wireOwner.pairId === activePairId) {
          // Trim active path back cleanly to that intersection
          setPaths((prev) => ({
            ...prev,
            [activePairId]: currentPath.slice(0, wireOwner.index + 1),
          }));
          audio?.playClick(false);
          return;
        }
        if (isPointerDownOrigin) {
          audio?.playPuzzleError();
          const other = pairById.get(wireOwner.pairId);
          setStatusMsg(`Blocked by Line ${other?.label ?? '?'} conductor! Route around or adjust it.`);
        }
        return;
      }

      const nextPath = [...currentPath, coord];
      setPaths((prev) => ({ ...prev, [activePairId]: nextPath }));
      setHintInfo(null);

      if (isPairLinked(activePair, nextPath)) {
        audio?.playClick(true);
        // Auto-select next incomplete pair for snappy workflow
        const nextIncomplete = board.pairs.find(
          (p) => p.id !== activePairId && !isPairLinked(p, paths[p.id])
        );
        if (nextIncomplete) {
          setActivePairId(nextIncomplete.id);
          setStatusMsg(`Line ${activePair.label} locked! Now wire Line ${nextIncomplete.label}.`);
        } else {
          setStatusMsg(
            stabilizationPct >= 100
              ? 'All lines linked! Energizing core...'
              : 'All lines linked! Complete the final Skill Check to reach 100%.'
          );
        }

        // Trigger a timed Skill Check on pair lock if cooldown elapsed
        const now = performance.now();
        if (!skillCheckActive && now - lastTriggerTimeRef.current > 2400) {
          window.setTimeout(() => {
            triggerSkillCheck();
          }, 280);
        }
      } else {
        audio?.playClick(true);
      }
    },
    [
      solvedAnim,
      board.blocked,
      board.pairs,
      terminalAtCoord,
      wireOwnerAtCoord,
      paths,
      activePairId,
      pairById,
      audio,
      stabilizationPct,
      skillCheckActive,
      triggerSkillCheck,
    ]
  );

  const handleGridPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || solvedAnim) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const btn = el?.closest('[data-coord]') as HTMLElement | null;
    if (!btn) return;
    const coordStr = btn.dataset.coord;
    if (!coordStr) return;
    const [rStr, cStr] = coordStr.split(',');
    const r = Number.parseInt(rStr, 10);
    const c = Number.parseInt(cStr, 10);
    if (Number.isInteger(r) && Number.isInteger(c)) {
      stepIntoCell(r, c, false);
    }
  };

  const handleReset = () => {
    if (solvedAnim) return;
    audio?.playClick(false);
    setPaths({});
    setActivePairId(board.pairs[0]?.id ?? null);
    setHintInfo(null);
    setStatusMsg('Conductors cleared. Stabilization Skill Check progress preserved.');
  };

  const handleHint = () => {
    if (solvedAnim) return;
    // Choose active pair if incomplete, otherwise first unlinked pair
    const targetPair =
      (activePairId && !linkedPairIds.has(activePairId) ? pairById.get(activePairId) : null) ??
      board.pairs.find((p) => !linkedPairIds.has(p.id));

    if (!targetPair) {
      setStatusMsg('All color terminals are linked! Hit incoming Skill Checks to reach 100%.');
      return;
    }

    setActivePairId(targetPair.id);
    const currentPath = paths[targetPair.id] ?? [targetPair.start];
    const head = currentPath[currentPath.length - 1];
    const destination = isSameCoord(currentPath[0], targetPair.end) ? targetPair.start : targetPair.end;

    const avoid = new Set<string>();
    board.pairs.forEach((p) => {
      if (p.id !== targetPair.id) {
        avoid.add(coordKey(p.start.r, p.start.c));
        avoid.add(coordKey(p.end.r, p.end.c));
      }
    });
    Object.entries(paths).forEach(([pid, pts]) => {
      if (pid === targetPair.id) {
        pts.slice(0, -1).forEach((pt) => avoid.add(coordKey(pt.r, pt.c)));
      } else {
        pts.forEach((pt) => avoid.add(coordKey(pt.r, pt.c)));
      }
    });

    const routeFromHead = bfsPairRoute(board.size, head, destination, board.blocked, avoid);
    if (routeFromHead && routeFromHead.length >= 2) {
      setHintInfo({ pairId: targetPair.id, coord: routeFromHead[1] });
      audio?.playClick(true);
      setStatusMsg(
        `Hint (${targetPair.label}): extend toward (${routeFromHead[1].r + 1}, ${routeFromHead[1].c + 1}).`
      );
      return;
    }

    // Try fresh route from targetPair.start avoiding other placed wires
    const avoidOther = new Set<string>();
    board.pairs.forEach((p) => {
      if (p.id !== targetPair.id) {
        avoidOther.add(coordKey(p.start.r, p.start.c));
        avoidOther.add(coordKey(p.end.r, p.end.c));
      }
    });
    Object.entries(paths).forEach(([pid, pts]) => {
      if (pid !== targetPair.id) {
        pts.forEach((pt) => avoidOther.add(coordKey(pt.r, pt.c)));
      }
    });
    const freshRoute = bfsPairRoute(board.size, targetPair.start, targetPair.end, board.blocked, avoidOther);
    if (freshRoute && freshRoute.length >= 2) {
      setPaths((prev) => ({ ...prev, [targetPair.id]: [targetPair.start] }));
      setHintInfo({ pairId: targetPair.id, coord: freshRoute[1] });
      audio?.playClick(true);
      setStatusMsg(
        `Dead-end cleared for Line ${targetPair.label}. Step toward (${freshRoute[1].r + 1}, ${freshRoute[1].c + 1}).`
      );
      return;
    }

    // Other wires are blocking Line targetPair; fall back to precomputed guaranteed solution start
    const sol = board.solutionPaths[targetPair.id];
    if (sol && sol.length >= 2) {
      setPaths((prev) => ({ ...prev, [targetPair.id]: [sol[0]] }));
      setHintInfo({ pairId: targetPair.id, coord: sol[1] });
      audio?.playClick(true);
      setStatusMsg(
        `Re-route blocking lines or follow Line ${targetPair.label}'s suggested path (${sol[1].r + 1}, ${sol[1].c + 1}).`
      );
    }
  };

  return (
    <div data-testid="generator-circuit-puzzle" className="space-y-4">
      {/* Repair Header & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0d1118] border border-sky-500/40 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono-tech uppercase tracking-[0.18em] text-sky-400">
            PHASE 2 · FORSAKEN WIRING ({board.size}×{board.size} · {board.pairs.length} PAIRS)
          </div>
          <p className="text-xs text-zinc-200 mt-0.5 leading-snug">{statusMsg}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="circuit-hint-btn"
            onClick={handleHint}
            disabled={solvedAnim}
            className="min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 border border-amber-500/60 bg-amber-950/50 hover:bg-amber-900/60 text-amber-200 text-xs font-mono-tech disabled:opacity-40 cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            HINT
          </button>
          <button
            type="button"
            data-testid="circuit-reset-btn"
            onClick={handleReset}
            disabled={solvedAnim}
            className="min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 border border-zinc-600 bg-zinc-900 hover:border-zinc-400 text-zinc-200 text-xs font-mono-tech disabled:opacity-40 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>
        </div>
      </div>

      {/* Stabilization Meter & Color Pair Strip */}
      <div className="bg-[#06090f] border border-zinc-800 px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono-tech tabular-nums">
          <span className="text-zinc-300 flex items-center gap-2">
            {sparksFlash ? (
              <Flame className="w-4 h-4 text-orange-400" />
            ) : (
              <Zap className="w-4 h-4 text-sky-400" />
            )}
            <span>CORE STABILIZATION</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">
              {linkedPairIds.size} / {board.pairs.length} PAIRS
            </span>
            <span
              data-testid="stabilization-pct-value"
              className={`font-bold ${
                solvedAnim
                  ? 'text-emerald-400'
                  : sparksFlash
                    ? 'text-orange-400'
                    : 'text-sky-300'
              }`}
            >
              {stabilizationPct}%
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-zinc-950 border border-zinc-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              solvedAnim
                ? 'bg-emerald-400'
                : sparksFlash
                  ? 'bg-orange-500'
                  : 'bg-gradient-to-r from-sky-600 via-cyan-400 to-emerald-400'
            }`}
            style={{ width: `${stabilizationPct}%` }}
          />
        </div>

        {/* Selectable Pair Legend */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {board.pairs.map((pair) => {
            const linked = linkedPairIds.has(pair.id);
            const isSelected = activePairId === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => {
                  setActivePairId(pair.id);
                  setStatusMsg(`Selected Line ${pair.label} (${pair.name}).`);
                }}
                className={`px-2.5 py-1 border text-[11px] font-mono-tech font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ${
                  linked
                    ? 'bg-emerald-950/50 border-emerald-500/80 text-emerald-200'
                    : isSelected
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
                style={
                  !linked && isSelected
                    ? { borderColor: pair.border, backgroundColor: pair.tintBg }
                    : undefined
                }
              >
                <span
                  className="inline-block w-2.5 h-2.5"
                  style={{ backgroundColor: pair.color }}
                />
                <span>
                  {pair.label} {linked ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Flow-Link Matrix + Live Skill Check Dial */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_214px] gap-4 items-start">
        {/* Forsaken Color-Link Grid */}
        <div
          onPointerMove={handleGridPointerMove}
          className={`relative mx-auto w-full max-w-[360px] aspect-square bg-[#06090f] border p-2.5 touch-none select-none transition-colors ${
            sparksFlash
              ? `border-orange-500 shadow-[0_0_24px_rgba(249,115,22,0.35)] ${
                  reducedMotion ? '' : 'animate-pulse'
                }`
              : solvedAnim
                ? 'border-emerald-400 shadow-[0_0_28px_rgba(52,211,153,0.4)]'
                : 'border-zinc-800'
          }`}
        >
          {/* SVG Cable Layer */}
          <svg
            viewBox={`0 0 ${board.size * 100} ${board.size * 100}`}
            className="absolute inset-2.5 w-[calc(100%-1.25rem)] h-[calc(100%-1.25rem)] pointer-events-none z-20"
          >
            {board.pairs.map((pair) => {
              const pts = paths[pair.id];
              if (!pts || pts.length < 2) return null;
              const pointsAttr = pts
                .map((pt) => `${pt.c * 100 + 50},${pt.r * 100 + 50}`)
                .join(' ');
              const linked = linkedPairIds.has(pair.id);
              return (
                <g key={pair.id}>
                  <polyline
                    points={pointsAttr}
                    fill="none"
                    stroke={linked ? pair.color : pair.border}
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={linked ? 0.38 : 0.24}
                  />
                  <polyline
                    points={pointsAttr}
                    fill="none"
                    stroke={solvedAnim ? '#6ee7b7' : pair.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </svg>

          {/* Grid Cells */}
          <div
            className="grid gap-1.5 w-full h-full relative z-10"
            style={{
              gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${board.size}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: board.size * board.size }).map((_, idx) => {
              const r = Math.floor(idx / board.size);
              const c = idx % board.size;
              const k = coordKey(r, c);
              const isBlocked = board.blocked.has(k);
              const terminal = terminalAtCoord.get(k);
              const wireOwner = wireOwnerAtCoord.get(k);
              const ownerPair = wireOwner ? pairById.get(wireOwner.pairId) : undefined;
              const isHead =
                Boolean(wireOwner && ownerPair) &&
                wireOwner!.index === (paths[wireOwner!.pairId]?.length ?? 0) - 1 &&
                !linkedPairIds.has(wireOwner!.pairId);
              const isHint = hintInfo?.coord.r === r && hintInfo?.coord.c === c;
              const isLinkedNode = Boolean(ownerPair && linkedPairIds.has(ownerPair.id));

              return (
                <button
                  key={k}
                  type="button"
                  data-coord={k}
                  data-testid={`circuit-node-${r}-${c}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    stepIntoCell(r, c, true);
                  }}
                  className={`relative border flex flex-col items-center justify-center font-mono-tech transition-colors cursor-pointer min-h-[44px] ${
                    isBlocked
                      ? 'bg-red-950/45 border-red-900/75 text-red-500/80 cursor-not-allowed'
                      : isHint
                        ? 'bg-amber-500/25 border-amber-300 text-amber-100 animate-pulse'
                        : terminal
                          ? 'text-white font-bold'
                          : ownerPair
                            ? 'text-zinc-100'
                            : 'bg-[#0a0f18] border-zinc-800 text-zinc-600 hover:border-zinc-500'
                  }`}
                  style={
                    terminal
                      ? {
                          backgroundColor: isLinkedNode ? terminal.pair.tintBg : '#0d1522',
                          borderColor: terminal.pair.border,
                          borderWidth: activePairId === terminal.pair.id || isLinkedNode ? '2px' : '1.5px',
                          boxShadow:
                            activePairId === terminal.pair.id || isLinkedNode
                              ? `0 0 12px ${terminal.pair.glow}`
                              : undefined,
                        }
                      : ownerPair
                        ? {
                            backgroundColor: ownerPair.tintBg,
                            borderColor: isHead ? '#ffffff' : ownerPair.border,
                          }
                        : undefined
                  }
                >
                  {isBlocked ? (
                    <Ban className="w-4 h-4 opacity-85" />
                  ) : terminal ? (
                    <div className="relative z-30 flex flex-col items-center justify-center leading-none">
                      <span
                        className="text-sm sm:text-base font-bold tracking-tight"
                        style={{ color: solvedAnim ? '#a7f3d0' : terminal.pair.border }}
                      >
                        {terminal.pair.label}
                      </span>
                      {isLinkedNode && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-300 mt-0.5" />
                      )}
                    </div>
                  ) : isHead && ownerPair ? (
                    <span
                      className="relative z-30 w-2.5 h-2.5 border border-white"
                      style={{ backgroundColor: ownerPair.color }}
                    />
                  ) : (
                    <span className="text-[10px] opacity-35">·</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Timed Skill Check Dial */}
        <GeneratorSkillCheck
          profile={board.profile}
          triggerNonce={skillCheckNonce}
          disabled={solvedAnim}
          reducedMotion={reducedMotion}
          audio={audio}
          onResult={handleSkillCheckResult}
          onActiveChange={setSkillCheckActive}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono-tech text-zinc-400">
        <span>DRAG OR CLICK TERMINALS (A–{board.pairs[board.pairs.length - 1]?.label}) TO LINK</span>
        <span>PRESS [SPACE] OR TAP CALIBRATE ON ACTIVE SKILL CHECK</span>
      </div>
    </div>
  );
};
