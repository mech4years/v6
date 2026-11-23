import { ALL_ARMOUR_PIECE_IDS } from './armourSystem';
import { ArmourBreakStage, ArmourPieceId, CharacterId, WeaponId } from './types';

export interface ArmourPieceNetState {
  durability: number;
  maxDurability: number;
  stage: ArmourBreakStage;
}

export interface PlayerNetSnapshot {
  playerId: string;
  callsign: string;
  characterId: CharacterId;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  isCrouching: boolean;
  isCrawling: boolean;
  isSprinting: boolean;
  isDead: boolean;
  activeWeaponId: WeaponId;
  armour: Record<ArmourPieceId, ArmourPieceNetState>;
  timestamp: number;
}

export interface ArmourBreakNetEvent {
  eventId: string;
  playerId: string;
  piece: 'chest' | 'back';
  hitDirX: number;
  hitDirY: number;
  hitDirZ: number;
  intensity: number;
  posX: number;
  posY: number;
  posZ: number;
  yaw: number;
  timestamp: number;
}

type SyncPacket =
  | { kind: 'player_state'; sessionId: string; snapshot: PlayerNetSnapshot }
  | { kind: 'armour_break'; sessionId: string; event: ArmourBreakNetEvent };

interface RemotePlayerBuffer {
  latest: PlayerNetSnapshot;
  receivedAt: number;
}

export class PlayerNetSyncController {
  private channel: BroadcastChannel | null = null;
  private sessionId = '';
  private localPlayerId = '';
  private enabled = false;
  private buffers = new Map<string, RemotePlayerBuffer>();
  private pendingBreakEvents: ArmourBreakNetEvent[] = [];
  private seenEventIds = new Set<string>();
  private lastSendAt = 0;

  public configure(sessionId: string, localPlayerId: string): void {
    this.dispose();
    this.sessionId = sessionId;
    this.localPlayerId = localPlayerId;
    this.enabled = true;

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(`twhr_player_sync_${sessionId}`);
        this.channel.onmessage = (ev: MessageEvent<SyncPacket>) => {
          const data = ev.data;
          if (!data || data.sessionId !== this.sessionId) return;
          if (data.kind === 'player_state') {
            this.ingestSnapshot(data.snapshot);
          } else if (data.kind === 'armour_break') {
            this.ingestBreakEvent(data.event);
          }
        };
      } catch {
        this.channel = null;
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public broadcastState(snapshot: PlayerNetSnapshot, force = false): void {
    if (!this.enabled) return;
    const now = performance.now();
    if (!force && now - this.lastSendAt < 50) return; // 20 Hz
    this.lastSendAt = now;
    if (this.channel) {
      try {
        this.channel.postMessage({
          kind: 'player_state',
          sessionId: this.sessionId,
          snapshot,
        } satisfies SyncPacket);
      } catch {
        // ignore channel closed errors
      }
    }
  }

  public broadcastArmourBreak(event: ArmourBreakNetEvent): void {
    if (!this.enabled) return;
    if (this.channel) {
      try {
        this.channel.postMessage({
          kind: 'armour_break',
          sessionId: this.sessionId,
          event,
        } satisfies SyncPacket);
      } catch {
        // ignore channel closed errors
      }
    }
  }

  public ingestSnapshot(snapshot: PlayerNetSnapshot): void {
    if (!snapshot || snapshot.playerId === this.localPlayerId) return;
    // Sanitize incoming armour pieces
    const safeArmour = {} as Record<ArmourPieceId, ArmourPieceNetState>;
    for (const id of ALL_ARMOUR_PIECE_IDS) {
      const src = snapshot.armour?.[id];
      const destructible = id === 'chest' || id === 'back';
      safeArmour[id] = src
        ? {
            durability: src.durability,
            maxDurability: Math.max(1, src.maxDurability),
            stage: destructible ? src.stage : 'intact',
          }
        : { durability: 10, maxDurability: 10, stage: 'intact' };
    }
    this.buffers.set(snapshot.playerId, {
      latest: { ...snapshot, armour: safeArmour },
      receivedAt: performance.now(),
    });
  }

  public ingestBreakEvent(event: ArmourBreakNetEvent): void {
    if (!event || event.playerId === this.localPlayerId) return;
    if (this.seenEventIds.has(event.eventId)) return;
    this.seenEventIds.add(event.eventId);
    if (this.seenEventIds.size > 64) {
      const first = this.seenEventIds.values().next().value;
      if (first) this.seenEventIds.delete(first);
    }
    this.pendingBreakEvents.push(event);
  }

  public getRemoteSnapshots(nowMs: number, maxStaleMs = 8000): PlayerNetSnapshot[] {
    const out: PlayerNetSnapshot[] = [];
    for (const [pid, buf] of this.buffers) {
      if (nowMs - buf.receivedAt > maxStaleMs) {
        this.buffers.delete(pid);
        continue;
      }
      out.push(buf.latest);
    }
    return out;
  }

  public consumePendingBreakEvents(): ArmourBreakNetEvent[] {
    if (this.pendingBreakEvents.length === 0) return [];
    const copy = [...this.pendingBreakEvents];
    this.pendingBreakEvents.length = 0;
    return copy;
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
    this.buffers.clear();
    this.pendingBreakEvents = [];
    this.seenEventIds.clear();
    this.enabled = false;
  }
}
