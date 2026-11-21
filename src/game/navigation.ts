import * as THREE from 'three';
import { ColliderBox, DestructibleBarricade, RampZone } from './worldBuilder';

const CELL_FREE = 0;
const CELL_BLOCKED = 1;
const CELL_DESTRUCTIBLE = 2;

export interface RampSampleResult {
  y: number;
  ramp: RampZone | null;
  slopeX: number;
  slopeZ: number;
  onStairs: boolean;
  onEscalator: boolean;
  escalatorSpeed: number;
  brokenEscalator: boolean;
}

/**
 * Evaluates exact vertical elevation and surface gradient of a single RampZone at (x, z).
 */
export function evaluateRampZoneAt(
  ramp: RampZone,
  x: number,
  z: number
): { y: number; slopeX: number; slopeZ: number; t: number } {
  if (ramp.axis === 'x' && ramp.xStart !== undefined && ramp.xEnd !== undefined && ramp.xStart !== ramp.xEnd) {
    const span = ramp.xEnd - ramp.xStart;
    const t = THREE.MathUtils.clamp((x - ramp.xStart) / span, 0, 1);
    const y = THREE.MathUtils.lerp(ramp.yStart, ramp.yEnd, t);
    const slopeX = (ramp.yEnd - ramp.yStart) / span;
    return { y, slopeX, slopeZ: 0, t };
  }
  if (ramp.zStart === ramp.zEnd) {
    return { y: ramp.yEnd, slopeX: 0, slopeZ: 0, t: 0.5 };
  }
  const span = ramp.zEnd - ramp.zStart;
  const t = THREE.MathUtils.clamp((z - ramp.zStart) / span, 0, 1);
  const y = THREE.MathUtils.lerp(ramp.yStart, ramp.yEnd, t);
  const slopeZ = (ramp.yEnd - ramp.yStart) / span;
  return { y, slopeX: 0, slopeZ, t };
}

/**
 * Resolves the physically valid floor surface underneath (x, z) relative to an entity's currentY.
 * Strictly prevents upward teleportation onto overhead balconies/rooftops by rejecting surfaces
 * higher than `currentY + maxStepUp`.
 */
export function sampleFloorHeight(
  ramps: RampZone[],
  x: number,
  z: number,
  currentY?: number,
  maxStepUp = 0.65
): RampSampleResult {
  let bestY = 0;
  let bestRamp: RampZone | null = null;
  let bestSlopeX = 0;
  let bestSlopeZ = 0;
  let found = false;

  for (let i = 0; i < ramps.length; i++) {
    const ramp = ramps[i];
    if (x < ramp.minX || x > ramp.maxX || z < ramp.minZ || z > ramp.maxZ) continue;
    const ev = evaluateRampZoneAt(ramp, x, z);
    if (currentY !== undefined && ev.y > currentY + maxStepUp) continue;
    if (!found || ev.y > bestY) {
      bestY = ev.y;
      bestRamp = ramp;
      bestSlopeX = ev.slopeX;
      bestSlopeZ = ev.slopeZ;
      found = true;
    }
  }

  const kind = bestRamp?.kind;
  const isInclined = bestRamp !== null && Math.abs(bestRamp.yEnd - bestRamp.yStart) >= 0.45;
  return {
    y: found ? bestY : 0,
    ramp: bestRamp,
    slopeX: bestSlopeX,
    slopeZ: bestSlopeZ,
    onStairs: Boolean(bestRamp && (kind === 'stairs' || (isInclined && kind === 'ramp'))),
    onEscalator: Boolean(bestRamp && kind === 'escalator'),
    escalatorSpeed: bestRamp && kind === 'escalator' && !bestRamp.broken ? bestRamp.escalatorSpeed ?? 0 : 0,
    brokenEscalator: Boolean(bestRamp && kind === 'escalator' && bestRamp.broken),
  };
}

/**
 * Exact 3D slab test for line segment A -> B against an AABB.
 */
export function segmentIntersectsAABB(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  box: ColliderBox
): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;

  let tmin = 0;
  let tmax = 1;

  if (Math.abs(dx) < 1e-6) {
    if (ax < box.minX || ax > box.maxX) return false;
  } else {
    const inv = 1 / dx;
    let t1 = (box.minX - ax) * inv;
    let t2 = (box.maxX - ax) * inv;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }

  if (Math.abs(dy) < 1e-6) {
    if (ay < box.minY || ay > box.maxY) return false;
  } else {
    const inv = 1 / dy;
    let t1 = (box.minY - ay) * inv;
    let t2 = (box.maxY - ay) * inv;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }

  if (Math.abs(dz) < 1e-6) {
    if (az < box.minZ || az > box.maxZ) return false;
  } else {
    const inv = 1 / dz;
    let t1 = (box.minZ - az) * inv;
    let t2 = (box.maxZ - az) * inv;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }

  return tmax >= 0 && tmin <= 1;
}

/**
 * Checks whether a 3D line of sight exists between two world points against solid colliders,
 * including solid upper floor/balcony slabs so monsters cannot see through floors or ceilings.
 */
export function hasLineOfSight(
  from: THREE.Vector3,
  to: THREE.Vector3,
  colliders: ColliderBox[],
  minOccluderHeight = 0.85
): boolean {
  const minX = Math.min(from.x, to.x);
  const maxX = Math.max(from.x, to.x);
  const minY = Math.min(from.y, to.y);
  const maxY = Math.max(from.y, to.y);
  const minZ = Math.min(from.z, to.z);
  const maxZ = Math.max(from.z, to.z);

  for (let i = 0; i < colliders.length; i++) {
    const b = colliders[i];
    if (b.maxY < 0.2) continue;
    const isFloorSlab =
      b.tag === 'balcony_slab' ||
      b.tag === 'scaffold_slab' ||
      (b.minY >= 1.5 && b.maxY - b.minY >= 0.16 && b.maxX - b.minX >= 2.0 && b.maxZ - b.minZ >= 2.0);
    if (!isFloorSlab && b.maxY - b.minY < minOccluderHeight) continue;
    if (b.maxX < minX || b.minX > maxX || b.maxZ < minZ || b.minZ > maxZ || b.maxY < minY || b.minY > maxY) {
      continue;
    }
    if (segmentIntersectsAABB(from.x, from.y, from.z, to.x, to.y, to.z, b)) {
      return false;
    }
  }
  return true;
}

/**
 * Counts how many solid walls/barriers/floors intersect the acoustic path between source and listener.
 * Used for realistic wall & multi-floor acoustic muffling.
 */
export function countSoundOcclusions(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  colliders: ColliderBox[],
  fromY = 0,
  toY = 0
): number {
  let hits = 0;
  const minX = Math.min(fromX, toX);
  const maxX = Math.max(fromX, toX);
  const minZ = Math.min(fromZ, toZ);
  const maxZ = Math.max(fromZ, toZ);
  const ay = fromY + 1.4;
  const by = toY + 1.4;
  const minY = Math.min(ay, by);
  const maxY = Math.max(ay, by);

  for (let i = 0; i < colliders.length; i++) {
    const b = colliders[i];
    if (b.maxY < 1.2) continue;
    if (b.maxX < minX || b.minX > maxX || b.maxZ < minZ || b.minZ > maxZ || b.maxY < minY || b.minY > maxY) {
      continue;
    }
    if (segmentIntersectsAABB(fromX, ay, fromZ, toX, by, toZ, b)) {
      hits += 1;
      if (hits >= 4) return 4;
    }
  }

  // Additional structural ceiling/floor muffling when sound comes from another vertical floor
  const vertSep = Math.abs(toY - fromY);
  if (vertSep >= 2.4) {
    hits = Math.min(4, hits + 1);
  }
  return hits;
}

interface FloorNavLayer {
  index: number;
  elevation: number;
  cells: Uint8Array;
}

export interface NavVerticalLink {
  id: string;
  ramp: RampZone;
  kind: 'ramp' | 'stairs' | 'escalator';
  fromLayer: number;
  toLayer: number;
  bottomPos: THREE.Vector3;
  topPos: THREE.Vector3;
  climbWaypoints: THREE.Vector3[];
  length: number;
  upCostMult: number;
  downCostMult: number;
  escalatorSpeed: number;
  broken: boolean;
}

interface AStarResult {
  points: THREE.Vector3[];
  cost: number;
}

/**
 * Multi-floor 2.5D navigation grid with vertical traversal portals (staircases, escalators, ramps).
 * Enables monsters to hunt across ground floors, elevated balconies, scaffolding decks, stairs,
 * and powered/broken escalators without ever teleporting.
 */
export class NavGrid {
  public readonly cellSize: number;
  public readonly minX: number;
  public readonly maxX: number;
  public readonly minZ: number;
  public readonly maxZ: number;
  public readonly cols: number;
  public readonly rows: number;

  private cells: Uint8Array;
  private layers: FloorNavLayer[] = [];
  private verticalLinks: NavVerticalLink[] = [];
  private ramps: RampZone[] = [];

  // Pre-allocated scratch buffers for zero-GC A* queries
  private gScore: Float32Array;
  private fScore: Float32Array;
  private cameFrom: Int32Array;
  private closedStamp: Uint32Array;
  private openStamp: Uint32Array;
  private currentStamp = 1;
  private openHeap: number[] = [];

  constructor(
    colliders: ColliderBox[],
    destructibles: DestructibleBarricade[],
    ramps: RampZone[] = [],
    cellSize = 1.15
  ) {
    this.cellSize = cellSize;

    let minX = -40;
    let maxX = 40;
    let minZ = -100;
    let maxZ = 52;
    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      if (b.maxY < 0.2) continue;
      if (b.minX < minX) minX = b.minX;
      if (b.maxX > maxX) maxX = b.maxX;
      if (b.minZ < minZ) minZ = b.minZ;
      if (b.maxZ > maxZ) maxZ = b.maxZ;
    }
    for (let i = 0; i < ramps.length; i++) {
      const r = ramps[i];
      if (r.minX < minX) minX = r.minX;
      if (r.maxX > maxX) maxX = r.maxX;
      if (r.minZ < minZ) minZ = r.minZ;
      if (r.maxZ > maxZ) maxZ = r.maxZ;
    }
    this.minX = Math.floor(minX) - 4;
    this.maxX = Math.ceil(maxX) + 4;
    this.minZ = Math.floor(minZ) - 4;
    this.maxZ = Math.ceil(maxZ) + 4;
    this.cols = Math.max(12, Math.ceil((this.maxX - this.minX) / cellSize));
    this.rows = Math.max(12, Math.ceil((this.maxZ - this.minZ) / cellSize));

    const total = this.cols * this.rows;
    this.cells = new Uint8Array(total);
    this.gScore = new Float32Array(total);
    this.fScore = new Float32Array(total);
    this.cameFrom = new Int32Array(total);
    this.closedStamp = new Uint32Array(total);
    this.openStamp = new Uint32Array(total);

    this.rebuild(colliders, destructibles, ramps);
  }

  public getFloorLayers(): { index: number; elevation: number }[] {
    return this.layers.map((l) => ({ index: l.index, elevation: l.elevation }));
  }

  public getVerticalLinks(): readonly NavVerticalLink[] {
    return this.verticalLinks;
  }

  public rebuild(
    colliders: ColliderBox[],
    destructibles: DestructibleBarricade[],
    ramps?: RampZone[]
  ): void {
    if (ramps !== undefined) {
      this.ramps = ramps;
    }
    const activeRamps = this.ramps;
    const total = this.cols * this.rows;

    const destructibleColliderSet = new Set<number>();
    for (let i = 0; i < destructibles.length; i++) {
      if (!destructibles[i].destroyed) {
        destructibleColliderSet.add(destructibles[i].colliderIndex);
      }
    }

    // 1. Discover distinct vertical elevation layers (Layer 0 = ground floor y=0, plus elevated decks/balconies)
    const elevations: number[] = [0];
    for (let i = 0; i < activeRamps.length; i++) {
      const r = activeRamps[i];
      const topY = Math.max(r.yStart, r.yEnd);
      if (topY < 1.2) continue;
      // Only register elevated layers for flat platforms or walkable upper landings
      const isFlatDeck = Math.abs(r.yEnd - r.yStart) < 0.25 || r.kind === 'platform';
      if (!isFlatDeck) continue;
      const existing = elevations.find((e) => Math.abs(e - topY) <= 0.65);
      if (existing === undefined) {
        elevations.push(topY);
      }
    }
    elevations.sort((a, b) => a - b);

    this.layers = elevations.map((elev, idx) => ({
      index: idx,
      elevation: elev,
      cells: new Uint8Array(total),
    }));

    const pad = 0.28;

    // 2. Populate Layer 0 (Ground Floor)
    const groundLayer = this.layers[0];
    groundLayer.cells.fill(CELL_FREE);
    for (let i = 0; i < colliders.length; i++) {
      const b = colliders[i];
      if (b.maxY < 0.35 || b.minY > 2.2) continue;
      if (b.tag === 'balcony_slab' || b.tag === 'scaffold_slab') continue;
      const cellVal = destructibleColliderSet.has(i) ? CELL_DESTRUCTIBLE : CELL_BLOCKED;
      this.stampColliderOntoCells(groundLayer.cells, b, pad, cellVal);
    }
    this.cells = groundLayer.cells;

    // 3. Populate Upper Floor Layers (walkable ONLY on platforms/landings at that elevation, minus railings/columns)
    for (let lIdx = 1; lIdx < this.layers.length; lIdx++) {
      const layer = this.layers[lIdx];
      layer.cells.fill(CELL_BLOCKED);

      // Carve walkable floor areas from matching elevated platforms
      for (let i = 0; i < activeRamps.length; i++) {
        const r = activeRamps[i];
        const isFlatDeck = Math.abs(r.yEnd - r.yStart) < 0.25 || r.kind === 'platform';
        if (!isFlatDeck) continue;
        if (Math.abs(r.yEnd - layer.elevation) > 0.65) continue;
        const c0 = this.clampCol(this.worldToCol(r.minX + 0.15));
        const c1 = this.clampCol(this.worldToCol(r.maxX - 0.15));
        const r0 = this.clampRow(this.worldToRow(r.minZ + 0.15));
        const r1 = this.clampRow(this.worldToRow(r.maxZ - 0.15));
        for (let row = r0; row <= r1; row++) {
          const rowOff = row * this.cols;
          for (let col = c0; col <= c1; col++) {
            layer.cells[rowOff + col] = CELL_FREE;
          }
        }
      }

      // Stamp upper-floor walls, railings, pillars & props intersecting [elevation + 0.2, elevation + 2.2]
      for (let i = 0; i < colliders.length; i++) {
        const b = colliders[i];
        if (b.tag === 'balcony_slab' || b.tag === 'scaffold_slab') continue;
        if (b.maxY < layer.elevation + 0.22 || b.minY > layer.elevation + 2.2) continue;
        const cellVal = destructibleColliderSet.has(i) ? CELL_DESTRUCTIBLE : CELL_BLOCKED;
        this.stampColliderOntoCells(layer.cells, b, 0.18, cellVal);
      }
    }

    // 4. Build Vertical Traversal Links (Staircases, Escalators, Walkable Ramps)
    this.verticalLinks = [];
    for (let i = 0; i < activeRamps.length; i++) {
      const r = activeRamps[i];
      const deltaY = Math.abs(r.yEnd - r.yStart);
      if (deltaY < 0.6) continue;

      const lowY = Math.min(r.yStart, r.yEnd);
      const highY = Math.max(r.yStart, r.yEnd);
      const fromLayer = this.findNearestLayerIndex(lowY);
      const toLayer = this.findNearestLayerIndex(highY);
      if (fromLayer === toLayer) continue;

      const cx = (r.minX + r.maxX) * 0.5;
      const cz = (r.minZ + r.maxZ) * 0.5;

      let bottomX = cx;
      let bottomZ = cz;
      let topX = cx;
      let topZ = cz;
      let dirX = 0;
      let dirZ = 0;

      if (r.axis === 'x' && r.xStart !== undefined && r.xEnd !== undefined && r.xStart !== r.xEnd) {
        const startIsLow = r.yStart <= r.yEnd;
        bottomX = startIsLow ? r.xStart : r.xEnd;
        topX = startIsLow ? r.xEnd : r.xStart;
        dirX = Math.sign(topX - bottomX);
      } else {
        const startIsLow = r.yStart <= r.yEnd;
        bottomZ = startIsLow ? r.zStart : r.zEnd;
        topZ = startIsLow ? r.zEnd : r.zStart;
        dirZ = Math.sign(topZ - bottomZ);
      }

      // Check if top exit is sealed by a dead-end barrier (e.g. broken decorative escalator with top stop)
      const topCheckX = topX + dirX * 0.2;
      const topCheckZ = topZ + dirZ * 0.2;
      let topBlocked = false;
      for (let c = 0; c < colliders.length; c++) {
        const b = colliders[c];
        if (b.tag === 'escalator_top_stop') {
          if (
            topCheckX >= b.minX - 0.5 &&
            topCheckX <= b.maxX + 0.5 &&
            topCheckZ >= b.minZ - 0.5 &&
            topCheckZ <= b.maxZ + 0.5 &&
            highY >= b.minY - 0.5 &&
            highY <= b.maxY + 0.5
          ) {
            topBlocked = true;
            break;
          }
        }
      }
      if (topBlocked) continue;

      // Entry point slightly before bottom step; exit point cleanly onto upper landing
      const entryRawX = bottomX - dirX * 0.95;
      const entryRawZ = bottomZ - dirZ * 0.95;
      const exitRawX = topX + dirX * 0.95;
      const exitRawZ = topZ + dirZ * 0.95;

      // Carve immediate ramp mouth cells on both layers so narrow balustrades never pinch off stair entry
      this.carvePortalMouth(this.layers[fromLayer], entryRawX, entryRawZ);
      this.carvePortalMouth(this.layers[toLayer], exitRawX, exitRawZ);

      const entrySnap = this.findNearestWalkableOnLayer(this.layers[fromLayer], entryRawX, entryRawZ, false, 4);
      const exitSnap = this.findNearestWalkableOnLayer(this.layers[toLayer], exitRawX, exitRawZ, false, 4);
      if (!entrySnap || !exitSnap) continue;

      const bottomPos = new THREE.Vector3(
        this.colToWorld(entrySnap.col),
        this.layers[fromLayer].elevation,
        this.rowToWorld(entrySnap.row)
      );
      const topPos = new THREE.Vector3(
        this.colToWorld(exitSnap.col),
        this.layers[toLayer].elevation,
        this.rowToWorld(exitSnap.row)
      );

      // Generate exact centerline 3D climb waypoints along the staircase/escalator/ramp
      const climbWaypoints: THREE.Vector3[] = [];
      const steps = 5;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const wx = THREE.MathUtils.lerp(bottomX, topX, t);
        const wz = THREE.MathUtils.lerp(bottomZ, topZ, t);
        const wy = THREE.MathUtils.lerp(lowY, highY, t);
        climbWaypoints.push(new THREE.Vector3(wx, wy, wz));
      }

      const horizLen = Math.hypot(topX - bottomX, topZ - bottomZ);
      const length = Math.hypot(horizLen, highY - lowY);
      const linkKind: 'ramp' | 'stairs' | 'escalator' =
        r.kind === 'escalator' ? 'escalator' : r.kind === 'stairs' ? 'stairs' : 'ramp';
      const escSpeed = linkKind === 'escalator' && !r.broken ? r.escalatorSpeed ?? 0 : 0;

      // Signed escalator direction relative to bottom->top climb
      const startIsLow = r.yStart <= r.yEnd;
      const climbBeltAssist = startIsLow ? escSpeed : -escSpeed;

      let upCostMult = linkKind === 'stairs' ? 1.18 : 1.12;
      let downCostMult = 1.08;
      if (linkKind === 'escalator') {
        if (r.broken || Math.abs(climbBeltAssist) < 0.05) {
          upCostMult = 1.95;
          downCostMult = 1.75;
        } else if (climbBeltAssist > 0) {
          // Moving UP: assists climbing, resists descending
          upCostMult = 0.82;
          downCostMult = 1.65;
        } else {
          // Moving DOWN: resists climbing, assists descending
          upCostMult = 1.65;
          downCostMult = 0.82;
        }
      }

      this.verticalLinks.push({
        id: r.id ?? `vlink_${i}`,
        ramp: r,
        kind: linkKind,
        fromLayer,
        toLayer,
        bottomPos,
        topPos,
        climbWaypoints,
        length,
        upCostMult,
        downCostMult,
        escalatorSpeed: climbBeltAssist,
        broken: Boolean(r.broken),
      });
    }
  }

  private stampColliderOntoCells(
    targetCells: Uint8Array,
    b: ColliderBox,
    pad: number,
    cellVal: number
  ): void {
    const c0 = this.clampCol(this.worldToCol(b.minX - pad));
    const c1 = this.clampCol(this.worldToCol(b.maxX + pad));
    const r0 = this.clampRow(this.worldToRow(b.minZ - pad));
    const r1 = this.clampRow(this.worldToRow(b.maxZ + pad));
    for (let r = r0; r <= r1; r++) {
      const rowOff = r * this.cols;
      for (let c = c0; c <= c1; c++) {
        if (targetCells[rowOff + c] !== CELL_BLOCKED) {
          targetCells[rowOff + c] = cellVal;
        }
      }
    }
  }

  private carvePortalMouth(layer: FloorNavLayer, wx: number, wz: number): void {
    const c = this.clampCol(this.worldToCol(wx));
    const r = this.clampRow(this.worldToRow(wz));
    layer.cells[r * this.cols + c] = CELL_FREE;
  }

  private findNearestLayerIndex(y: number): number {
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < this.layers.length; i++) {
      const diff = Math.abs(this.layers[i].elevation - y);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  public getLayerIndexAt(wx: number, wy: number, wz: number): number {
    if (this.layers.length <= 1) return 0;
    // If entity is mid-climb on an inclined ramp, resolve to whichever floor is closer
    const nearest = this.findNearestLayerIndex(wy);
    const layer = this.layers[nearest];
    const c = this.worldToCol(wx);
    const r = this.worldToRow(wz);
    if (this.isCellWalkableOnLayer(layer, c, r, true)) {
      return nearest;
    }
    // Check if there is a walkable cell near (wx, wz) on that layer
    if (this.findNearestWalkableOnLayer(layer, wx, wz, true, 3)) {
      return nearest;
    }
    return 0;
  }

  private worldToCol(x: number): number {
    return Math.floor((x - this.minX) / this.cellSize);
  }

  private worldToRow(z: number): number {
    return Math.floor((z - this.minZ) / this.cellSize);
  }

  private colToWorld(col: number): number {
    return this.minX + (col + 0.5) * this.cellSize;
  }

  private rowToWorld(row: number): number {
    return this.minZ + (row + 0.5) * this.cellSize;
  }

  private clampCol(c: number): number {
    return c < 0 ? 0 : c >= this.cols ? this.cols - 1 : c;
  }

  private clampRow(r: number): number {
    return r < 0 ? 0 : r >= this.rows ? this.rows - 1 : r;
  }

  private isCellWalkableOnLayer(
    layer: FloorNavLayer,
    c: number,
    r: number,
    canBreakObstacles: boolean
  ): boolean {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
    const v = layer.cells[r * this.cols + c];
    return v === CELL_FREE || (canBreakObstacles && v === CELL_DESTRUCTIBLE);
  }

  public isWorldWalkable(wx: number, wz: number, canBreakObstacles = false, wy = 0): boolean {
    const layerIdx = this.findNearestLayerIndex(wy);
    const layer = this.layers[layerIdx] ?? this.layers[0];
    if (!layer) return true;
    return this.isCellWalkableOnLayer(layer, this.worldToCol(wx), this.worldToRow(wz), canBreakObstacles);
  }

  private findNearestWalkableOnLayer(
    layer: FloorNavLayer,
    wx: number,
    wz: number,
    canBreakObstacles: boolean,
    maxRadius = 6
  ): { col: number; row: number } | null {
    const sc = this.clampCol(this.worldToCol(wx));
    const sr = this.clampRow(this.worldToRow(wz));
    if (this.isCellWalkableOnLayer(layer, sc, sr, canBreakObstacles)) {
      return { col: sc, row: sr };
    }
    for (let rad = 1; rad <= maxRadius; rad++) {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
          const nc = sc + dc;
          const nr = sr + dr;
          if (this.isCellWalkableOnLayer(layer, nc, nr, canBreakObstacles)) {
            return { col: nc, row: nr };
          }
        }
      }
    }
    return null;
  }

  /**
   * Multi-floor A* pathfinding across ground floor, elevated balconies/decks, staircases,
   * escalators (accounting for belt travel direction & broken states), and ramps.
   * Never teleports when unreachable — returns the best reachable partial path instead.
   */
  public findPath(
    startX: number,
    startZ: number,
    goalX: number,
    goalZ: number,
    canBreakObstacles = false,
    largeClearance = false,
    startY = 0,
    goalY = 0
  ): THREE.Vector3[] {
    if (this.layers.length === 0) return [];

    // Check if the monster is currently on an inclined ramp/stair/escalator and needs to finish traversing it
    const activeRampSample = sampleFloorHeight(this.ramps, startX, startZ, startY, 0.75);
    const startLayerIdx = this.getLayerIndexAt(startX, startY, startZ);
    const goalLayerIdx = this.getLayerIndexAt(goalX, goalY, goalZ);

    // Same-floor direct A*
    if (startLayerIdx === goalLayerIdx) {
      const sameFloor = this.findPathOnLayer(
        this.layers[startLayerIdx],
        startX,
        startZ,
        goalX,
        goalZ,
        canBreakObstacles,
        largeClearance
      );
      if (sameFloor && sameFloor.points.length > 0) {
        return sameFloor.points;
      }
      // If monster is on an upper floor trying to reach a disconnected wing on the same upper floor,
      // allow routing DOWN one stair/escalator and UP another!
      if (startLayerIdx > 0 && this.verticalLinks.length >= 2) {
        const bridgeRoute = this.findTwoHopSameLayerRoute(
          startLayerIdx,
          startX,
          startZ,
          goalX,
          goalZ,
          canBreakObstacles,
          largeClearance
        );
        if (bridgeRoute.length > 0) return bridgeRoute;
      }
      return [];
    }

    // Multi-floor pathfinding via staircases, escalators, and walkable ramps
    let bestRoute: THREE.Vector3[] = [];
    let bestCost = Infinity;

    for (let i = 0; i < this.verticalLinks.length; i++) {
      const link = this.verticalLinks[i];
      const goingUp = link.fromLayer === startLayerIdx && link.toLayer === goalLayerIdx;
      const goingDown = link.toLayer === startLayerIdx && link.fromLayer === goalLayerIdx;
      if (!goingUp && !goingDown) continue;

      const entryPos = goingUp ? link.bottomPos : link.topPos;
      const exitPos = goingUp ? link.topPos : link.bottomPos;
      const linkMult = goingUp ? link.upCostMult : link.downCostMult;

      // If monster is ALREADY partway along this exact ramp/stair/escalator, continue directly along remaining steps!
      if (activeRampSample.ramp && activeRampSample.ramp === link.ramp) {
        const orderedClimb = goingUp ? link.climbWaypoints : [...link.climbWaypoints].reverse();
        // Keep only climb waypoints ahead of current vertical progress
        const remainingClimb = orderedClimb.filter((wp) =>
          goingUp ? wp.y >= startY - 0.15 : wp.y <= startY + 0.15
        );
        const leg2 = this.findPathOnLayer(
          this.layers[goalLayerIdx],
          exitPos.x,
          exitPos.z,
          goalX,
          goalZ,
          canBreakObstacles,
          largeClearance
        );
        if (leg2) {
          const totalCost = link.length * 0.5 * linkMult + leg2.cost;
          if (totalCost < bestCost) {
            bestCost = totalCost;
            bestRoute = [...remainingClimb.map((p) => p.clone()), exitPos.clone(), ...leg2.points];
          }
        }
        continue;
      }

      const leg1 = this.findPathOnLayer(
        this.layers[startLayerIdx],
        startX,
        startZ,
        entryPos.x,
        entryPos.z,
        canBreakObstacles,
        largeClearance
      );
      if (!leg1) continue;

      const leg2 = this.findPathOnLayer(
        this.layers[goalLayerIdx],
        exitPos.x,
        exitPos.z,
        goalX,
        goalZ,
        canBreakObstacles,
        largeClearance
      );
      if (!leg2) continue;

      const totalCost = leg1.cost + link.length * linkMult + leg2.cost;
      if (totalCost < bestCost) {
        bestCost = totalCost;
        const orderedClimb = goingUp
          ? link.climbWaypoints.map((p) => p.clone())
          : [...link.climbWaypoints].reverse().map((p) => p.clone());
        bestRoute = [...leg1.points, entryPos.clone(), ...orderedClimb, exitPos.clone(), ...leg2.points];
      }
    }

    if (bestRoute.length > 0) {
      return this.dedupeWaypoints(bestRoute);
    }

    // Unreachable floor fallback: NEVER teleport! Walk to the closest reachable spot on current floor.
    const fallback = this.findPathOnLayer(
      this.layers[startLayerIdx],
      startX,
      startZ,
      goalX,
      goalZ,
      canBreakObstacles,
      largeClearance
    );
    return fallback ? fallback.points : [];
  }

  private findTwoHopSameLayerRoute(
    layerIdx: number,
    startX: number,
    startZ: number,
    goalX: number,
    goalZ: number,
    canBreakObstacles: boolean,
    largeClearance: boolean
  ): THREE.Vector3[] {
    let bestRoute: THREE.Vector3[] = [];
    let bestCost = Infinity;

    for (let i = 0; i < this.verticalLinks.length; i++) {
      const downLink = this.verticalLinks[i];
      if (downLink.toLayer !== layerIdx) continue;
      const leg1 = this.findPathOnLayer(
        this.layers[layerIdx],
        startX,
        startZ,
        downLink.topPos.x,
        downLink.topPos.z,
        canBreakObstacles,
        largeClearance
      );
      if (!leg1) continue;

      for (let j = 0; j < this.verticalLinks.length; j++) {
        if (i === j) continue;
        const upLink = this.verticalLinks[j];
        if (upLink.toLayer !== layerIdx || upLink.fromLayer !== downLink.fromLayer) continue;

        const midLayer = this.layers[downLink.fromLayer];
        const legMid = this.findPathOnLayer(
          midLayer,
          downLink.bottomPos.x,
          downLink.bottomPos.z,
          upLink.bottomPos.x,
          upLink.bottomPos.z,
          canBreakObstacles,
          largeClearance
        );
        if (!legMid) continue;

        const leg3 = this.findPathOnLayer(
          this.layers[layerIdx],
          upLink.topPos.x,
          upLink.topPos.z,
          goalX,
          goalZ,
          canBreakObstacles,
          largeClearance
        );
        if (!leg3) continue;

        const cost =
          leg1.cost +
          downLink.length * downLink.downCostMult +
          legMid.cost +
          upLink.length * upLink.upCostMult +
          leg3.cost;
        if (cost < bestCost) {
          bestCost = cost;
          bestRoute = [
            ...leg1.points,
            ...([...downLink.climbWaypoints].reverse().map((p) => p.clone())),
            ...legMid.points,
            ...upLink.climbWaypoints.map((p) => p.clone()),
            ...leg3.points,
          ];
        }
      }
    }
    return this.dedupeWaypoints(bestRoute);
  }

  private dedupeWaypoints(raw: THREE.Vector3[]): THREE.Vector3[] {
    if (raw.length <= 1) return raw;
    const out: THREE.Vector3[] = [raw[0]];
    for (let i = 1; i < raw.length; i++) {
      const prev = out[out.length - 1];
      if (prev.distanceToSquared(raw[i]) > 0.16) {
        out.push(raw[i]);
      }
    }
    return out;
  }

  private findPathOnLayer(
    layer: FloorNavLayer,
    startX: number,
    startZ: number,
    goalX: number,
    goalZ: number,
    canBreakObstacles: boolean,
    largeClearance: boolean
  ): AStarResult | null {
    const s = this.findNearestWalkableOnLayer(layer, startX, startZ, canBreakObstacles, 6);
    const g = this.findNearestWalkableOnLayer(layer, goalX, goalZ, canBreakObstacles, 6);
    if (!s || !g) return null;

    const startIdx = s.row * this.cols + s.col;
    const goalIdx = g.row * this.cols + g.col;
    const layerY = layer.elevation;

    if (startIdx === goalIdx) {
      return {
        points: [new THREE.Vector3(goalX, layerY, goalZ)],
        cost: Math.hypot(goalX - startX, goalZ - startZ),
      };
    }

    this.currentStamp += 1;
    if (this.currentStamp > 0xffffff00) {
      this.closedStamp.fill(0);
      this.openStamp.fill(0);
      this.currentStamp = 1;
    }
    const stamp = this.currentStamp;

    this.openHeap.length = 0;
    this.gScore[startIdx] = 0;
    this.fScore[startIdx] = Math.hypot(g.col - s.col, g.row - s.row);
    this.cameFrom[startIdx] = -1;
    this.openStamp[startIdx] = stamp;
    this.heapPush(startIdx);

    let bestNode = startIdx;
    let bestH = this.fScore[startIdx];
    let expansions = 0;
    const maxExpansions = 780;

    const dirs: [number, number, number][] = [
      [1, 0, 1],
      [-1, 0, 1],
      [0, 1, 1],
      [0, -1, 1],
      [1, 1, 1.414],
      [-1, 1, 1.414],
      [1, -1, 1.414],
      [-1, -1, 1.414],
    ];

    let reachedGoal = false;

    while (this.openHeap.length > 0 && expansions < maxExpansions) {
      const curr = this.heapPop();
      if (curr === goalIdx) {
        bestNode = curr;
        reachedGoal = true;
        break;
      }
      if (this.closedStamp[curr] === stamp) continue;
      this.closedStamp[curr] = stamp;
      expansions += 1;

      const cr = Math.floor(curr / this.cols);
      const cc = curr - cr * this.cols;
      const curG = this.gScore[curr];

      for (let d = 0; d < 8; d++) {
        const dc = dirs[d][0];
        const dr = dirs[d][1];
        const nc = cc + dc;
        const nr = cr + dr;
        if (!this.isCellWalkableOnLayer(layer, nc, nr, canBreakObstacles)) continue;

        if (dc !== 0 && dr !== 0) {
          if (
            !this.isCellWalkableOnLayer(layer, cc + dc, cr, canBreakObstacles) ||
            !this.isCellWalkableOnLayer(layer, cc, cr + dr, canBreakObstacles)
          ) {
            continue;
          }
        }

        const nIdx = nr * this.cols + nc;
        if (this.closedStamp[nIdx] === stamp) continue;

        let stepCost = dirs[d][2];
        if (layer.cells[nIdx] === CELL_DESTRUCTIBLE) {
          stepCost += 1.8;
        }
        if (largeClearance) {
          if (
            !this.isCellWalkableOnLayer(layer, nc + 1, nr, canBreakObstacles) ||
            !this.isCellWalkableOnLayer(layer, nc - 1, nr, canBreakObstacles) ||
            !this.isCellWalkableOnLayer(layer, nc, nr + 1, canBreakObstacles) ||
            !this.isCellWalkableOnLayer(layer, nc, nr - 1, canBreakObstacles)
          ) {
            stepCost += 0.9;
          }
        }

        const tentativeG = curG + stepCost;
        if (this.openStamp[nIdx] !== stamp || tentativeG < this.gScore[nIdx]) {
          this.cameFrom[nIdx] = curr;
          this.gScore[nIdx] = tentativeG;
          const h = Math.hypot(g.col - nc, g.row - nr);
          this.fScore[nIdx] = tentativeG + h * 1.15;
          if (h < bestH) {
            bestH = h;
            bestNode = nIdx;
          }
          if (this.openStamp[nIdx] !== stamp) {
            this.openStamp[nIdx] = stamp;
            this.heapPush(nIdx);
          }
        }
      }
    }

    // Reconstruct path from start -> bestNode
    const raw: THREE.Vector3[] = [];
    let cur = bestNode;
    let safety = 0;
    while (cur !== -1 && safety < 240) {
      const r = Math.floor(cur / this.cols);
      const c = cur - r * this.cols;
      const wx = this.colToWorld(c);
      const wz = this.rowToWorld(r);
      const sampledY =
        layer.index === 0
          ? sampleFloorHeight(this.ramps, wx, wz, layerY, 0.7).y
          : layerY;
      raw.push(new THREE.Vector3(wx, sampledY, wz));
      if (cur === startIdx) break;
      cur = this.cameFrom[cur];
      safety += 1;
    }
    raw.reverse();

    if (raw.length === 0) return null;
    if (reachedGoal) {
      raw[raw.length - 1].set(goalX, layerY, goalZ);
    }

    const smoothed = this.smoothPathOnLayer(layer, raw, canBreakObstacles);
    const totalMeters = this.gScore[bestNode] * this.cellSize;

    // For upper layers, if we didn't get close to the goal, treat as disconnected so two-hop can be considered
    if (!reachedGoal && bestH > 3.5 && layer.index > 0) {
      return null;
    }

    return {
      points: smoothed.length > 1 ? smoothed.slice(1) : smoothed,
      cost: reachedGoal ? totalMeters : totalMeters + bestH * this.cellSize * 2.5,
    };
  }

  private smoothPathOnLayer(
    layer: FloorNavLayer,
    pts: THREE.Vector3[],
    canBreakObstacles: boolean
  ): THREE.Vector3[] {
    if (pts.length <= 2) return pts;
    const out: THREE.Vector3[] = [pts[0]];
    let anchor = 0;
    while (anchor < pts.length - 1) {
      let farthest = anchor + 1;
      for (let test = pts.length - 1; test > anchor + 1; test--) {
        if (this.hasGridLOSOnLayer(layer, pts[anchor], pts[test], canBreakObstacles)) {
          farthest = test;
          break;
        }
      }
      out.push(pts[farthest]);
      anchor = farthest;
    }
    return out;
  }

  private hasGridLOSOnLayer(
    layer: FloorNavLayer,
    a: THREE.Vector3,
    b: THREE.Vector3,
    canBreakObstacles: boolean
  ): boolean {
    const dist = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(2, Math.ceil(dist / (this.cellSize * 0.45)));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const wx = a.x + (b.x - a.x) * t;
      const wz = a.z + (b.z - a.z) * t;
      if (!this.isCellWalkableOnLayer(layer, this.worldToCol(wx), this.worldToRow(wz), canBreakObstacles)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Finds a nearby walkable cover/ambush point on the monster's current floor occluded from the threat.
   */
  public findNearestCoverPoint(
    fromX: number,
    fromZ: number,
    threatX: number,
    threatZ: number,
    colliders: ColliderBox[],
    maxDist = 20,
    fromY = 0
  ): THREE.Vector3 | null {
    const layerIdx = this.getLayerIndexAt(fromX, fromY, fromZ);
    const layer = this.layers[layerIdx] ?? this.layers[0];
    if (!layer) return null;

    const threatEye = new THREE.Vector3(threatX, layer.elevation + 1.5, threatZ);
    const candEye = new THREE.Vector3();
    let bestPos: THREE.Vector3 | null = null;
    let bestScore = Infinity;

    const steps = 16;
    for (let r = 4; r <= maxDist; r += 4) {
      for (let a = 0; a < steps; a++) {
        const ang = (a / steps) * Math.PI * 2;
        const wx = fromX + Math.cos(ang) * r;
        const wz = fromZ + Math.sin(ang) * r;
        if (!this.isCellWalkableOnLayer(layer, this.worldToCol(wx), this.worldToRow(wz), false)) continue;

        candEye.set(wx, layer.elevation + 1.4, wz);
        if (!hasLineOfSight(candEye, threatEye, colliders, 1.1)) {
          const distToThreat = Math.hypot(wx - threatX, wz - threatZ);
          const score = r - Math.min(12, distToThreat) * 0.35;
          if (score < bestScore) {
            bestScore = score;
            bestPos = new THREE.Vector3(wx, layer.elevation, wz);
          }
        }
      }
      if (bestPos) break;
    }
    return bestPos;
  }

  private heapPush(node: number): void {
    this.openHeap.push(node);
    let idx = this.openHeap.length - 1;
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (this.fScore[this.openHeap[idx]] >= this.fScore[this.openHeap[parent]]) break;
      const tmp = this.openHeap[idx];
      this.openHeap[idx] = this.openHeap[parent];
      this.openHeap[parent] = tmp;
      idx = parent;
    }
  }

  private heapPop(): number {
    const top = this.openHeap[0];
    const last = this.openHeap.pop()!;
    if (this.openHeap.length > 0) {
      this.openHeap[0] = last;
      let idx = 0;
      const len = this.openHeap.length;
      while (true) {
        let smallest = idx;
        const left = idx * 2 + 1;
        const right = left + 1;
        if (left < len && this.fScore[this.openHeap[left]] < this.fScore[this.openHeap[smallest]]) {
          smallest = left;
        }
        if (right < len && this.fScore[this.openHeap[right]] < this.fScore[this.openHeap[smallest]]) {
          smallest = right;
        }
        if (smallest === idx) break;
        const tmp = this.openHeap[idx];
        this.openHeap[idx] = this.openHeap[smallest];
        this.openHeap[smallest] = tmp;
        idx = smallest;
      }
    }
    return top;
  }
}
