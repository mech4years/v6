export interface Coord {
  r: number;
  c: number;
}

export interface ChapterGeneratorProfile {
  gridSize: number;
  pairCount: number;
  blockerCount: number;
  needleSpeedDegPerSec: number;
  successArcDeg: number;
  greatArcDeg: number;
}

export interface PairPaletteStyle {
  label: 'A' | 'B' | 'C' | 'D' | 'E';
  name: string;
  color: string;
  glow: string;
  border: string;
  tintBg: string;
}

export interface ForsakenTerminalPair extends PairPaletteStyle {
  id: string;
  start: Coord;
  end: Coord;
}

export interface ForsakenBoard {
  size: number;
  pairs: ForsakenTerminalPair[];
  blocked: Set<string>;
  solutionPaths: Record<string, Coord[]>;
  profile: ChapterGeneratorProfile;
}

export interface SkillCheckZone {
  successStartDeg: number;
  successEndDeg: number;
  greatStartDeg: number;
  greatEndDeg: number;
}

export type SkillCheckOutcome = 'great' | 'good' | 'miss';

export const PAIR_PALETTES: PairPaletteStyle[] = [
  {
    label: 'A',
    name: 'AMBER',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.5)',
    border: '#fbbf24',
    tintBg: 'rgba(245, 158, 11, 0.18)',
  },
  {
    label: 'B',
    name: 'CYAN',
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.5)',
    border: '#22d3ee',
    tintBg: 'rgba(6, 182, 212, 0.18)',
  },
  {
    label: 'C',
    name: 'EMERALD',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.5)',
    border: '#34d399',
    tintBg: 'rgba(16, 185, 129, 0.18)',
  },
  {
    label: 'D',
    name: 'ROSE',
    color: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.5)',
    border: '#fb7185',
    tintBg: 'rgba(244, 63, 94, 0.18)',
  },
  {
    label: 'E',
    name: 'VIOLET',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
    border: '#c084fc',
    tintBg: 'rgba(168, 85, 247, 0.18)',
  },
];

export const coordKey = (r: number, c: number): string => `${r},${c}`;

export const isSameCoord = (a: Coord, b: Coord): boolean => a.r === b.r && a.c === b.c;

export const isOrthogonalAdjacent = (a: Coord, b: Coord): boolean =>
  Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

export function getGeneratorProfileForLevel(levelNumber: number): ChapterGeneratorProfile {
  if (levelNumber <= 4) {
    return {
      gridSize: 5,
      pairCount: 3,
      blockerCount: 3,
      needleSpeedDegPerSec: 205,
      successArcDeg: 58,
      greatArcDeg: 16,
    };
  }
  if (levelNumber <= 6) {
    return {
      gridSize: 5,
      pairCount: 4,
      blockerCount: 2,
      needleSpeedDegPerSec: 250,
      successArcDeg: 46,
      greatArcDeg: 12,
    };
  }
  if (levelNumber <= 8) {
    return {
      gridSize: 6,
      pairCount: 4,
      blockerCount: 4,
      needleSpeedDegPerSec: 265,
      successArcDeg: 42,
      greatArcDeg: 11,
    };
  }
  return {
    gridSize: 6,
    pairCount: 5,
    blockerCount: 3,
    needleSpeedDegPerSec: 305,
    successArcDeg: 34,
    greatArcDeg: 9,
  };
}

function createSeededRng(puzzleId: string, levelNumber: number): () => number {
  let seed = 0x811c9dc5;
  const tag = `${puzzleId}::${levelNumber}`;
  for (let i = 0; i < tag.length; i++) {
    seed ^= tag.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const DIRS: Coord[] = [
  { r: -1, c: 0 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
  { r: 0, c: 1 },
];

function carveRandomDisjointPath(
  size: number,
  occupied: Set<string>,
  rand: () => number,
  minLen: number,
  maxLen: number
): Coord[] | null {
  const freeCells: Coord[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!occupied.has(coordKey(r, c))) {
        freeCells.push({ r, c });
      }
    }
  }
  if (freeCells.length < minLen) return null;

  for (let sTry = 0; sTry < 16; sTry++) {
    const start = freeCells[Math.floor(rand() * freeCells.length)];
    const path: Coord[] = [start];
    const localVisited = new Set<string>([coordKey(start.r, start.c)]);
    const targetLen = minLen + Math.floor(rand() * (maxLen - minLen + 1));

    while (path.length < targetLen) {
      const head = path[path.length - 1];
      const candidates = DIRS.map((d) => ({ r: head.r + d.r, c: head.c + d.c })).filter((n) => {
        if (n.r < 0 || n.r >= size || n.c < 0 || n.c >= size) return false;
        const k = coordKey(n.r, n.c);
        return !occupied.has(k) && !localVisited.has(k);
      });
      if (candidates.length === 0) break;

      // Slight bias toward cells with fewer occupied neighbors to keep grid navigable
      candidates.sort((a, b) => {
        const deg = (pt: Coord) =>
          DIRS.filter((d) => {
            const nr = pt.r + d.r;
            const nc = pt.c + d.c;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) return false;
            const k = coordKey(nr, nc);
            return !occupied.has(k) && !localVisited.has(k);
          }).length;
        return deg(a) - deg(b) + (rand() - 0.5) * 2.2;
      });

      const pick = candidates[Math.floor(rand() * Math.min(2, candidates.length))];
      path.push(pick);
      localVisited.add(coordKey(pick.r, pick.c));
    }

    const end = path[path.length - 1];
    const manhattan = Math.abs(start.r - end.r) + Math.abs(start.c - end.c);
    if (path.length >= minLen && manhattan >= 2) {
      return path;
    }
  }
  return null;
}

function buildFallbackBoard(profile: ChapterGeneratorProfile): ForsakenBoard {
  let rawPaths: Coord[][] = [];
  let rawBlockers: string[] = [];

  if (profile.gridSize === 5 && profile.pairCount === 3) {
    rawPaths = [
      [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }, { r: 3, c: 2 }],
      [{ r: 0, c: 3 }, { r: 0, c: 4 }, { r: 1, c: 4 }, { r: 1, c: 3 }, { r: 2, c: 3 }, { r: 3, c: 3 }],
      [{ r: 3, c: 0 }, { r: 4, c: 0 }, { r: 4, c: 1 }, { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 }],
    ];
    rawBlockers = ['0,2', '2,0', '3,4'];
  } else if (profile.gridSize === 5) {
    rawPaths = [
      [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }],
      [{ r: 0, c: 3 }, { r: 0, c: 4 }, { r: 1, c: 4 }, { r: 1, c: 3 }, { r: 2, c: 3 }],
      [{ r: 3, c: 0 }, { r: 4, c: 0 }, { r: 4, c: 1 }, { r: 4, c: 2 }, { r: 3, c: 2 }],
      [{ r: 2, c: 4 }, { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 4, c: 3 }, { r: 3, c: 3 }],
    ];
    rawBlockers = ['0,2', '2,0'];
  } else if (profile.pairCount === 4) {
    rawPaths = [
      [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }, { r: 3, c: 2 }],
      [{ r: 0, c: 3 }, { r: 0, c: 4 }, { r: 0, c: 5 }, { r: 1, c: 5 }, { r: 1, c: 4 }, { r: 2, c: 4 }, { r: 2, c: 3 }],
      [{ r: 3, c: 0 }, { r: 4, c: 0 }, { r: 5, c: 0 }, { r: 5, c: 1 }, { r: 5, c: 2 }, { r: 4, c: 2 }],
      [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 5, c: 4 }, { r: 5, c: 5 }, { r: 4, c: 5 }],
    ];
    rawBlockers = ['0,2', '2,0', '3,5', '5,3'];
  } else {
    rawPaths = [
      [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 0 }],
      [{ r: 0, c: 3 }, { r: 0, c: 4 }, { r: 0, c: 5 }, { r: 1, c: 5 }, { r: 1, c: 4 }, { r: 2, c: 4 }, { r: 2, c: 3 }],
      [{ r: 3, c: 0 }, { r: 4, c: 0 }, { r: 5, c: 0 }, { r: 5, c: 1 }, { r: 4, c: 1 }, { r: 4, c: 2 }],
      [{ r: 3, c: 5 }, { r: 4, c: 5 }, { r: 5, c: 5 }, { r: 5, c: 4 }, { r: 5, c: 3 }],
      [{ r: 1, c: 2 }, { r: 2, c: 2 }, { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 4, c: 3 }],
    ];
    rawBlockers = ['0,2', '2,5', '5,2'];
  }

  const pairs: ForsakenTerminalPair[] = [];
  const solutionPaths: Record<string, Coord[]> = {};
  rawPaths.slice(0, profile.pairCount).forEach((pts, idx) => {
    const palette = PAIR_PALETTES[idx];
    const id = `pair_${palette.label}`;
    pairs.push({
      ...palette,
      id,
      start: pts[0],
      end: pts[pts.length - 1],
    });
    solutionPaths[id] = pts;
  });

  return {
    size: profile.gridSize,
    pairs,
    blocked: new Set(rawBlockers.slice(0, profile.blockerCount)),
    solutionPaths,
    profile,
  };
}

export function buildForsakenBoard(puzzleId: string, levelNumber: number): ForsakenBoard {
  const profile = getGeneratorProfileForLevel(levelNumber);
  const rand = createSeededRng(puzzleId, levelNumber);
  const { gridSize, pairCount, blockerCount } = profile;

  const minLen = gridSize === 5 ? 4 : 5;
  const maxLen = gridSize === 5 ? 6 : 7;

  for (let attempt = 0; attempt < 110; attempt++) {
    const occupied = new Set<string>();
    const carved: Coord[][] = [];
    let failed = false;

    for (let p = 0; p < pairCount; p++) {
      const path = carveRandomDisjointPath(gridSize, occupied, rand, minLen, maxLen);
      if (!path) {
        failed = true;
        break;
      }
      carved.push(path);
      path.forEach((pt) => occupied.add(coordKey(pt.r, pt.c)));
    }

    if (failed) continue;

    // Gather unvisited cells for optional burnt relay fault blockers
    const spare: Coord[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!occupied.has(coordKey(r, c))) {
          spare.push({ r, c });
        }
      }
    }

    const blocked = new Set<string>();
    for (let i = spare.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [spare[i], spare[j]] = [spare[j], spare[i]];
    }
    for (let i = 0; i < Math.min(blockerCount, spare.length); i++) {
      blocked.add(coordKey(spare[i].r, spare[i].c));
    }

    const pairs: ForsakenTerminalPair[] = [];
    const solutionPaths: Record<string, Coord[]> = {};
    carved.forEach((pts, idx) => {
      const palette = PAIR_PALETTES[idx];
      const id = `pair_${palette.label}`;
      pairs.push({
        ...palette,
        id,
        start: pts[0],
        end: pts[pts.length - 1],
      });
      solutionPaths[id] = pts;
    });

    return {
      size: gridSize,
      pairs,
      blocked,
      solutionPaths,
      profile,
    };
  }

  return buildFallbackBoard(profile);
}

export function bfsPairRoute(
  size: number,
  from: Coord,
  to: Coord,
  blocked: Set<string>,
  avoid: Set<string>
): Coord[] | null {
  const queue: Coord[][] = [[from]];
  const visited = new Set<string>([coordKey(from.r, from.c)]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const head = path[path.length - 1];
    if (head.r === to.r && head.c === to.c) return path;

    for (const d of DIRS) {
      const nr = head.r + d.r;
      const nc = head.c + d.c;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      const k = coordKey(nr, nc);
      if (visited.has(k) || blocked.has(k)) continue;
      if (avoid.has(k) && !(nr === to.r && nc === to.c)) continue;
      visited.add(k);
      queue.push([...path, { r: nr, c: nc }]);
    }
  }
  return null;
}

export function normalizeDeg(deg: number): number {
  const m = deg % 360;
  return m < 0 ? m + 360 : m;
}

export function createSkillCheckZone(
  profile: ChapterGeneratorProfile,
  rand: () => number = Math.random
): SkillCheckZone {
  const minStart = 95;
  const maxStart = Math.max(minStart + 10, 315 - profile.successArcDeg);
  const successStartDeg = minStart + rand() * (maxStart - minStart);
  const successEndDeg = successStartDeg + profile.successArcDeg;

  // Place Great Arc near the leading third or middle of the Success Arc
  const greatOffsetMax = Math.max(2, profile.successArcDeg - profile.greatArcDeg - 4);
  const greatStartDeg = successStartDeg + 2 + rand() * greatOffsetMax;
  const greatEndDeg = greatStartDeg + profile.greatArcDeg;

  return {
    successStartDeg,
    successEndDeg,
    greatStartDeg,
    greatEndDeg,
  };
}

export function evaluateSkillCheck(angleDeg: number, zone: SkillCheckZone): SkillCheckOutcome {
  const deg = normalizeDeg(angleDeg);
  if (deg >= zone.greatStartDeg && deg <= zone.greatEndDeg) {
    return 'great';
  }
  if (deg >= zone.successStartDeg && deg <= zone.successEndDeg) {
    return 'good';
  }
  return 'miss';
}

export function describeArcPath(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number
): string {
  // 0 deg = 12 o'clock top, clockwise positive
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const startRad = toRad(startDeg);
  const endRad = toRad(endDeg);
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
