import * as THREE from 'three';
import { EnemyAIState, EnemyType, MonsterAnimStateName, MonsterAttackKind } from './types';

/**
 * Authoritative network snapshot for a single monster entity in co-op/multiplayer sessions.
 * Designed for smooth velocity-assisted interpolation without network snapping or vertical teleportation.
 */
export interface MonsterNetSnapshot {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  state: EnemyAIState;
  animState: MonsterAnimStateName;
  attackKind: MonsterAttackKind;
  health: number;
  maxHealth: number;
  grounded: boolean;
  onStairs: boolean;
  onEscalator: boolean;
  slopePitch: number;
  dead: boolean;
  active: boolean;
  timestamp: number;
}

export interface MonsterNetTarget {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  state: EnemyAIState;
  animState: MonsterAnimStateName;
  attackKind: MonsterAttackKind;
  health: number;
  maxHealth: number;
  grounded: boolean;
  onStairs: boolean;
  onEscalator: boolean;
  slopePitch: number;
  dead: boolean;
  active: boolean;
  receivedAt: number;
}

/**
 * Computes smooth, anti-teleportation reconciliation of a remote monster's world position & yaw
 * toward its authoritative host snapshot.
 *
 * Key guarantees:
 * - Predicts forward using authoritative velocity (capped to 0.16s extrapolation to prevent overshoot).
 * - Smoothly damps horizontal and vertical errors without abrupt vertical snapping or roof teleportation.
 * - Caps per-frame vertical correction so stair/escalator movement always looks physically continuous.
 */
export function reconcileRemoteMonsterPose(
  currentPos: THREE.Vector3,
  currentYaw: number,
  target: MonsterNetTarget,
  nowMs: number,
  dt: number
): { x: number; y: number; z: number; yaw: number; actualHorizMoved: number } {
  const clampedDt = Math.min(0.05, Math.max(0.001, dt));
  const extrapSec = Math.min(0.16, Math.max(0, (nowMs - target.receivedAt) / 1000));

  const predX = target.x + target.vx * extrapSec;
  const predY = target.y + target.vy * extrapSec;
  const predZ = target.z + target.vz * extrapSec;

  const dx = predX - currentPos.x;
  const dy = predY - currentPos.y;
  const dz = predZ - currentPos.z;
  const horizErr = Math.hypot(dx, dz);

  // Smooth exponential damping with velocity-proportional catch-up (never teleports instantaneously)
  const horizDamp = horizErr > 2.5 ? 14 : 10;
  const nextX = THREE.MathUtils.damp(currentPos.x, predX, horizDamp, clampedDt);
  const nextZ = THREE.MathUtils.damp(currentPos.z, predZ, horizDamp, clampedDt);

  // Vertical reconciliation: strictly rate-limited so monsters smoothly ascend/descend stairs/escalators
  const maxVertStep = Math.max(0.14, (Math.abs(target.vy) + 4.8) * clampedDt);
  const rawNextY = THREE.MathUtils.damp(currentPos.y, predY, 12, clampedDt);
  const clampedDeltaY = THREE.MathUtils.clamp(rawNextY - currentPos.y, -maxVertStep, maxVertStep);
  const nextY = currentPos.y + clampedDeltaY;

  // Shortest-angle yaw damping
  let yawDiff = target.yaw - currentYaw;
  while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
  while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
  const nextYaw = currentYaw + yawDiff * Math.min(1, clampedDt * 12);

  const actualHorizMoved = Math.hypot(nextX - currentPos.x, nextZ - currentPos.z);

  return {
    x: nextX,
    y: nextY,
    z: nextZ,
    yaw: nextYaw,
    actualHorizMoved,
  };
}

/**
 * Lightweight host/client replication bridge using BroadcastChannel when available (local co-op tabs)
 * and direct snapshot export/ingest hooks for external network transports.
 */
export class MonsterNetSyncController {
  private channel: BroadcastChannel | null = null;
  private role: 'host' | 'client' = 'host';
  private sessionId = '';
  private remoteTargets = new Map<string, MonsterNetTarget>();
  private broadcastAccum = 0;

  public configure(sessionId: string, role: 'host' | 'client'): void {
    this.dispose();
    this.sessionId = sessionId;
    this.role = role;
    if (typeof BroadcastChannel !== 'undefined' && sessionId) {
      try {
        this.channel = new BroadcastChannel(`twhr_monster_sync_${sessionId}`);
        this.channel.onmessage = (ev: MessageEvent) => {
          if (this.role !== 'client') return;
          const payload = ev.data;
          if (payload && payload.kind === 'monster_batch' && Array.isArray(payload.snapshots)) {
            this.ingestSnapshots(payload.snapshots as MonsterNetSnapshot[]);
          }
        };
      } catch {
        this.channel = null;
      }
    }
  }

  public getRole(): 'host' | 'client' {
    return this.role;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public shouldBroadcast(dt: number, hz = 20): boolean {
    if (this.role !== 'host') return false;
    this.broadcastAccum += dt;
    const interval = 1 / Math.max(5, hz);
    if (this.broadcastAccum >= interval) {
      this.broadcastAccum -= interval;
      return true;
    }
    return false;
  }

  public broadcastSnapshots(snapshots: MonsterNetSnapshot[]): void {
    if (!this.channel || this.role !== 'host') return;
    try {
      this.channel.postMessage({ kind: 'monster_batch', snapshots });
    } catch {
      // Ignore closed channel
    }
  }

  public ingestSnapshots(snapshots: MonsterNetSnapshot[], nowMs = performance.now()): void {
    for (let i = 0; i < snapshots.length; i++) {
      const s = snapshots[i];
      this.remoteTargets.set(s.id, {
        x: s.x,
        y: s.y,
        z: s.z,
        vx: s.vx,
        vy: s.vy,
        vz: s.vz,
        yaw: s.yaw,
        state: s.state,
        animState: s.animState,
        attackKind: s.attackKind,
        health: s.health,
        maxHealth: s.maxHealth,
        grounded: s.grounded,
        onStairs: s.onStairs,
        onEscalator: s.onEscalator,
        slopePitch: s.slopePitch,
        dead: s.dead,
        active: s.active,
        receivedAt: nowMs,
      });
    }
  }

  public getTarget(monsterId: string): MonsterNetTarget | undefined {
    return this.remoteTargets.get(monsterId);
  }

  public clearTargets(): void {
    this.remoteTargets.clear();
  }

  public dispose(): void {
    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // ignore
      }
      this.channel = null;
    }
    this.remoteTargets.clear();
  }
}
