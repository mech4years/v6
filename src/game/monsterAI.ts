import * as THREE from 'three';
import {
  countSoundOcclusions,
  hasLineOfSight,
  NavGrid,
} from './navigation';
import {
  EnemyAIState,
  EnemyType,
  MonsterAttackKind,
  MonsterPersonality,
  MonsterWeightClass,
  SoundEvent,
  SoundEventKind,
} from './types';
import { ColliderBox } from './worldBuilder';

export interface MonsterBehaviorProfile {
  weightClass: MonsterWeightClass;
  personality: MonsterPersonality;
  walkSpeed: number;
  runSpeed: number;
  accel: number;
  decel: number;
  turnRate: number;
  visionRange: number;
  fovCos: number;
  hearingMult: number;
  strength: number; // 1: glass, 2: crates, 3+: barricades/shields
  retreatHpRatio: number; // 0 = never retreats
  canHide: boolean;
  isMech: boolean;
  isBoss: boolean;
  collisionRadius: number;
  strideLength: number;
  preferredAttacks: MonsterAttackKind[];
  hasRanged: boolean;
  rangedMinDist: number;
  rangedMaxDist: number;
  flankBias: number;
}

export const MONSTER_PROFILES: Record<EnemyType, MonsterBehaviorProfile> = {
  crawler: {
    weightClass: 'small',
    personality: 'swarm_crawler',
    walkSpeed: 2.6,
    runSpeed: 6.4,
    accel: 16,
    decel: 14,
    turnRate: 11,
    visionRange: 21,
    fovCos: 0.25,
    hearingMult: 1.15,
    strength: 1,
    retreatHpRatio: 0.24,
    canHide: true,
    isMech: false,
    isBoss: false,
    collisionRadius: 0.45,
    strideLength: 1.05,
    preferredAttacks: ['bite', 'claw', 'charge'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0.45,
  },
  stalker: {
    weightClass: 'medium',
    personality: 'ambush_stalker',
    walkSpeed: 2.3,
    runSpeed: 5.5,
    accel: 13,
    decel: 11,
    turnRate: 9.5,
    visionRange: 25,
    fovCos: 0.35,
    hearingMult: 1.25,
    strength: 2,
    retreatHpRatio: 0.22,
    canHide: true,
    isMech: false,
    isBoss: false,
    collisionRadius: 0.5,
    strideLength: 1.65,
    preferredAttacks: ['claw', 'tendril', 'charge', 'grab'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0.85,
  },
  brute_enemy: {
    weightClass: 'large',
    personality: 'juggernaut',
    walkSpeed: 1.7,
    runSpeed: 3.7,
    accel: 6.5,
    decel: 6.0,
    turnRate: 5.2,
    visionRange: 20,
    fovCos: 0.42,
    hearingMult: 0.9,
    strength: 4,
    retreatHpRatio: 0,
    canHide: false,
    isMech: false,
    isBoss: false,
    collisionRadius: 0.82,
    strideLength: 2.1,
    preferredAttacks: ['heavy_slam', 'charge', 'grab', 'claw'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0,
  },
  sentinel: {
    weightClass: 'mech',
    personality: 'tactical_sentinel',
    walkSpeed: 2.0,
    runSpeed: 3.9,
    accel: 8.5,
    decel: 9.0,
    turnRate: 6.8,
    visionRange: 32,
    fovCos: 0.48,
    hearingMult: 1.2,
    strength: 3,
    retreatHpRatio: 0,
    canHide: false,
    isMech: true,
    isBoss: false,
    collisionRadius: 0.8,
    strideLength: 1.9,
    preferredAttacks: ['heavy_slam', 'tendril', 'claw'],
    hasRanged: true,
    rangedMinDist: 5.0,
    rangedMaxDist: 24.0,
    flankBias: 0.2,
  },
  screamer: {
    weightClass: 'medium',
    personality: 'acoustic_lurker',
    walkSpeed: 2.0,
    runSpeed: 4.5,
    accel: 11,
    decel: 10,
    turnRate: 8.5,
    visionRange: 26,
    fovCos: 0.15,
    hearingMult: 1.55,
    strength: 1,
    retreatHpRatio: 0.35,
    canHide: true,
    isMech: false,
    isBoss: false,
    collisionRadius: 0.48,
    strideLength: 1.55,
    preferredAttacks: ['tendril', 'claw', 'bite'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: -0.4,
  },
  carrier: {
    weightClass: 'large',
    personality: 'juggernaut',
    walkSpeed: 1.4,
    runSpeed: 2.6,
    accel: 5.5,
    decel: 5.5,
    turnRate: 4.6,
    visionRange: 21,
    fovCos: 0.3,
    hearingMult: 0.95,
    strength: 3,
    retreatHpRatio: 0,
    canHide: false,
    isMech: false,
    isBoss: false,
    collisionRadius: 0.88,
    strideLength: 1.9,
    preferredAttacks: ['tendril', 'heavy_slam', 'bite'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0,
  },
  scrapper: {
    weightClass: 'mech',
    personality: 'berserker_rusher',
    walkSpeed: 2.2,
    runSpeed: 4.6,
    accel: 10,
    decel: 9.5,
    turnRate: 8.2,
    visionRange: 24,
    fovCos: 0.38,
    hearingMult: 1.15,
    strength: 2,
    retreatHpRatio: 0.18,
    canHide: false,
    isMech: true,
    isBoss: false,
    collisionRadius: 0.62,
    strideLength: 1.65,
    preferredAttacks: ['claw', 'grab', 'charge', 'tendril'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0.35,
  },
  watcher: {
    weightClass: 'medium',
    personality: 'acoustic_lurker',
    walkSpeed: 1.9,
    runSpeed: 4.3,
    accel: 9.5,
    decel: 9.5,
    turnRate: 8.0,
    visionRange: 27,
    fovCos: 0.55,
    hearingMult: 1.85,
    strength: 2,
    retreatHpRatio: 0.2,
    canHide: true,
    isMech: false,
    isBoss: false,
    collisionRadius: 0.52,
    strideLength: 1.85,
    preferredAttacks: ['grab', 'claw', 'tendril', 'bite'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0.45,
  },
  hunter: {
    weightClass: 'large',
    personality: 'berserker_rusher',
    walkSpeed: 2.8,
    runSpeed: 6.2,
    accel: 9.0,
    decel: 7.5,
    turnRate: 6.5,
    visionRange: 30,
    fovCos: 0.45,
    hearingMult: 1.25,
    strength: 3,
    retreatHpRatio: 0,
    canHide: false,
    isMech: true,
    isBoss: false,
    collisionRadius: 0.9,
    strideLength: 2.4,
    preferredAttacks: ['charge', 'bite', 'heavy_slam'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0.15,
  },
  broodmind: {
    weightClass: 'large',
    personality: 'tactical_sentinel',
    walkSpeed: 1.3,
    runSpeed: 2.3,
    accel: 5.0,
    decel: 6.0,
    turnRate: 4.2,
    visionRange: 28,
    fovCos: 0.1,
    hearingMult: 1.3,
    strength: 3,
    retreatHpRatio: 0,
    canHide: false,
    isMech: false,
    isBoss: false,
    collisionRadius: 0.9,
    strideLength: 1.7,
    preferredAttacks: ['tendril', 'heavy_slam', 'grab'],
    hasRanged: true,
    rangedMinDist: 4.5,
    rangedMaxDist: 16.0,
    flankBias: 0,
  },
  void_walker: {
    weightClass: 'medium',
    personality: 'ambush_stalker',
    walkSpeed: 2.4,
    runSpeed: 5.0,
    accel: 10.5,
    decel: 9.0,
    turnRate: 8.8,
    visionRange: 30,
    fovCos: 0.25,
    hearingMult: 1.2,
    strength: 2,
    retreatHpRatio: 0.25,
    canHide: true,
    isMech: false,
    isBoss: false,
    collisionRadius: 0.54,
    strideLength: 1.75,
    preferredAttacks: ['tendril', 'grab', 'claw'],
    hasRanged: true,
    rangedMinDist: 5.5,
    rangedMaxDist: 18.0,
    flankBias: 0.75,
  },
  hollow_dweller: {
    weightClass: 'small',
    personality: 'berserker_rusher',
    walkSpeed: 3.4,
    runSpeed: 7.4,
    accel: 18,
    decel: 15,
    turnRate: 13.5,
    visionRange: 50,
    fovCos: -0.25,
    hearingMult: 1.5,
    strength: 3,
    retreatHpRatio: 0,
    canHide: false,
    isMech: false,
    isBoss: true,
    collisionRadius: 0.6,
    strideLength: 1.45,
    preferredAttacks: ['claw_strike', 'tentacle_lash', 'leap_attack', 'grab_throw', 'frenzied_attack'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0.75,
  },
  titan: {
    weightClass: 'boss',
    personality: 'apex_boss',
    walkSpeed: 1.9,
    runSpeed: 3.3,
    accel: 5.0,
    decel: 5.0,
    turnRate: 4.4,
    visionRange: 42,
    fovCos: 0.2,
    hearingMult: 1.15,
    strength: 5,
    retreatHpRatio: 0,
    canHide: false,
    isMech: true,
    isBoss: true,
    collisionRadius: 1.4,
    strideLength: 3.1,
    preferredAttacks: ['heavy_slam', 'charge', 'grab', 'tendril'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0,
  },
  titanforged: {
    weightClass: 'boss',
    personality: 'apex_boss',
    walkSpeed: 2.05,
    runSpeed: 3.6,
    accel: 5.4,
    decel: 5.2,
    turnRate: 4.6,
    visionRange: 58,
    fovCos: 0.12,
    hearingMult: 1.25,
    strength: 5,
    retreatHpRatio: 0,
    canHide: false,
    isMech: true,
    isBoss: true,
    collisionRadius: 1.45,
    strideLength: 3.4,
    preferredAttacks: ['titanic_stomp', 'tentacle_sweep', 'ground_crusher', 'gravity_pulse', 'tentacle_grab'],
    hasRanged: true,
    rangedMinDist: 5.0,
    rangedMaxDist: 28.0,
    flankBias: 0,
  },
  forgemaster: {
    weightClass: 'boss',
    personality: 'apex_boss',
    walkSpeed: 1.8,
    runSpeed: 3.1,
    accel: 4.8,
    decel: 4.8,
    turnRate: 4.2,
    visionRange: 44,
    fovCos: 0.2,
    hearingMult: 1.1,
    strength: 5,
    retreatHpRatio: 0,
    canHide: false,
    isMech: true,
    isBoss: true,
    collisionRadius: 1.4,
    strideLength: 3.2,
    preferredAttacks: ['heavy_slam', 'grab', 'charge', 'claw'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0,
  },
  drowned_machine: {
    weightClass: 'boss',
    personality: 'apex_boss',
    walkSpeed: 1.9,
    runSpeed: 3.2,
    accel: 5.5,
    decel: 5.5,
    turnRate: 4.6,
    visionRange: 44,
    fovCos: 0.15,
    hearingMult: 1.3,
    strength: 4,
    retreatHpRatio: 0,
    canHide: false,
    isMech: true,
    isBoss: true,
    collisionRadius: 1.1,
    strideLength: 2.6,
    preferredAttacks: ['tendril', 'heavy_slam', 'grab'],
    hasRanged: true,
    rangedMinDist: 5.5,
    rangedMaxDist: 22.0,
    flankBias: 0,
  },
  guardian: {
    weightClass: 'boss',
    personality: 'apex_boss',
    walkSpeed: 2.0,
    runSpeed: 3.4,
    accel: 5.4,
    decel: 5.2,
    turnRate: 4.6,
    visionRange: 46,
    fovCos: 0.15,
    hearingMult: 1.3,
    strength: 5,
    retreatHpRatio: 0,
    canHide: false,
    isMech: false,
    isBoss: true,
    collisionRadius: 1.35,
    strideLength: 3.0,
    preferredAttacks: ['tendril', 'heavy_slam', 'bite', 'grab'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0,
  },
  helios_unit: {
    weightClass: 'boss',
    personality: 'apex_boss',
    walkSpeed: 2.3,
    runSpeed: 3.6,
    accel: 6.5,
    decel: 6.5,
    turnRate: 5.5,
    visionRange: 48,
    fovCos: -0.1,
    hearingMult: 1.4,
    strength: 4,
    retreatHpRatio: 0,
    canHide: false,
    isMech: true,
    isBoss: true,
    collisionRadius: 1.1,
    strideLength: 2.4,
    preferredAttacks: ['heavy_slam', 'charge', 'tendril'],
    hasRanged: true,
    rangedMinDist: 4.8,
    rangedMaxDist: 26.0,
    flankBias: 0.2,
  },
  harvester: {
    weightClass: 'boss',
    personality: 'apex_boss',
    walkSpeed: 2.0,
    runSpeed: 3.4,
    accel: 5.5,
    decel: 5.5,
    turnRate: 4.8,
    visionRange: 44,
    fovCos: 0.1,
    hearingMult: 1.25,
    strength: 5,
    retreatHpRatio: 0,
    canHide: false,
    isMech: true,
    isBoss: true,
    collisionRadius: 1.25,
    strideLength: 2.7,
    preferredAttacks: ['heavy_slam', 'charge', 'claw_strike', 'grab'],
    hasRanged: false,
    rangedMinDist: 0,
    rangedMaxDist: 0,
    flankBias: 0.15,
  },
  origin: {
    weightClass: 'boss',
    personality: 'apex_boss',
    walkSpeed: 2.1,
    runSpeed: 3.6,
    accel: 5.8,
    decel: 5.4,
    turnRate: 4.8,
    visionRange: 54,
    fovCos: -0.15,
    hearingMult: 1.4,
    strength: 5,
    retreatHpRatio: 0,
    canHide: false,
    isMech: false,
    isBoss: true,
    collisionRadius: 1.5,
    strideLength: 3.6,
    preferredAttacks: ['heavy_slam', 'tendril', 'bite', 'charge', 'grab'],
    hasRanged: true,
    rangedMinDist: 7.0,
    rangedMaxDist: 28.0,
    flankBias: 0,
  },
};

export interface MonsterAIRuntime {
  waypoints: THREE.Vector3[];
  waypointIndex: number;
  repathTimer: number;
  currentSpeed: number;
  velX: number;
  velZ: number;
  losVisible: boolean;
  losLostTimer: number;
  investigatingSound: boolean;
  hideTarget: THREE.Vector3 | null;
  hideTimer: number;
  retreatCooldown: number;
  vocalCooldown: number;
  attackChoiceIdx: number;
  lastAttackKind: MonsterAttackKind;
  bossIntroDone: boolean;
  bossIntroTimer: number;
  stuckTimer: number;
  lastProgressPos: THREE.Vector3;
  searchSweepAngle: number;
  suspensePauseTimer: number;
  searchChecksDone: number;
  lastHeardTimestamp: number;
}

const _losFrom = new THREE.Vector3();
const _losTo = new THREE.Vector3();

export function createMonsterAIRuntime(startPos: THREE.Vector3, isBoss: boolean): MonsterAIRuntime {
  return {
    waypoints: [],
    waypointIndex: 0,
    repathTimer: Math.random() * 0.3,
    currentSpeed: 0,
    velX: 0,
    velZ: 0,
    losVisible: false,
    losLostTimer: 0,
    investigatingSound: false,
    hideTarget: null,
    hideTimer: 0,
    retreatCooldown: 0,
    vocalCooldown: 2.5 + Math.random() * 5,
    attackChoiceIdx: 0,
    lastAttackKind: 'claw',
    bossIntroDone: !isBoss,
    bossIntroTimer: 0,
    stuckTimer: 0,
    lastProgressPos: startPos.clone(),
    searchSweepAngle: Math.random() * Math.PI * 2,
    suspensePauseTimer: 0,
    searchChecksDone: 0,
    lastHeardTimestamp: -10,
  };
}

export class SoundEventBus {
  private events: SoundEvent[] = [];

  public emit(
    x: number,
    y: number,
    z: number,
    radius: number,
    kind: SoundEventKind,
    time: number,
    sourceId?: string
  ): void {
    this.events.push({ x, y, z, radius, kind, sourceId, timestamp: time });
    if (this.events.length > 48) {
      this.events.shift();
    }
  }

  public prune(time: number): void {
    while (this.events.length > 0 && time - this.events[0].timestamp > 2.6) {
      this.events.shift();
    }
  }

  public findBestHeardEvent(
    listenerX: number,
    listenerZ: number,
    hearingMult: number,
    colliders: ColliderBox[],
    selfId: string,
    listenerY = 0
  ): SoundEvent | null {
    let best: SoundEvent | null = null;
    let bestPriority = -1;

    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i];
      if (ev.sourceId && ev.sourceId === selfId) continue;
      const dx = ev.x - listenerX;
      const dy = (ev.y - listenerY) * 1.25;
      const dz = ev.z - listenerZ;
      const dist = Math.hypot(dx, dy, dz);
      const maxHear = ev.radius * hearingMult;
      if (dist > maxHear) continue;

      const walls = countSoundOcclusions(listenerX, listenerZ, ev.x, ev.z, colliders, listenerY, ev.y);
      const occludedRange = maxHear * Math.pow(0.76, walls);
      if (dist > occludedRange) continue;

      const baseWeight =
        ev.kind === 'gunshot'
          ? 4.2
          : ev.kind === 'generator_on' || ev.kind === 'shriek'
            ? 3.7
            : ev.kind === 'door_open' || ev.kind === 'object_break'
              ? 3.1
              : ev.kind === 'footstep_run'
                ? 2.3
                : 1.25;
      const score = baseWeight * (1 - dist / (occludedRange + 1));
      if (score > bestPriority) {
        bestPriority = score;
        best = ev;
      }
    }
    return best;
  }
}

export function selectNextAttackKind(
  type: EnemyType,
  distToTarget: number,
  ai: MonsterAIRuntime,
  opts?: { healthRatio?: number; bossPhase?: number; regenCooldown?: number }
): MonsterAttackKind {
  const profile = MONSTER_PROFILES[type];
  const pool = profile.preferredAttacks;
  if (pool.length === 1) {
    ai.lastAttackKind = pool[0];
    return pool[0];
  }

  // Titanforged conditional Parasite Regeneration when injured between Phase 1..3
  if (type === 'titanforged') {
    const hp = opts?.healthRatio ?? 1;
    const regenCd = opts?.regenCooldown ?? 99;
    if (hp < 0.78 && hp > 0.36 && regenCd <= 0 && ai.lastAttackKind !== 'parasite_regen') {
      ai.lastAttackKind = 'parasite_regen';
      return 'parasite_regen';
    }
    const distFiltered = pool.filter((k) => {
      if (distToTarget < 6.5) {
        return k === 'titanic_stomp' || k === 'ground_crusher' || k === 'tentacle_sweep' || k === 'tentacle_grab';
      }
      if (distToTarget <= 13.5) {
        return k === 'tentacle_sweep' || k === 'tentacle_grab' || k === 'gravity_pulse' || k === 'ground_crusher';
      }
      return k === 'gravity_pulse' || k === 'tentacle_grab' || k === 'tentacle_sweep';
    });
    const usable = distFiltered.length > 0 ? distFiltered : pool;
    ai.attackChoiceIdx = (ai.attackChoiceIdx + 1) % usable.length;
    let picked = usable[ai.attackChoiceIdx];
    if (picked === ai.lastAttackKind && usable.length > 1) {
      picked = usable[(ai.attackChoiceIdx + 1) % usable.length];
    }
    ai.lastAttackKind = picked;
    return picked;
  }

  // Hollow Dweller distance & Phase 5 Frenzy intelligent selection
  if (type === 'hollow_dweller') {
    const hp = opts?.healthRatio ?? 1;
    const isFrenzied = (opts?.bossPhase ?? 1) >= 5 || hp <= 0.4;
    const distFiltered = pool.filter((k) => {
      if (distToTarget < 3.8) {
        if (k === 'leap_attack') return false;
        return true;
      }
      if (distToTarget <= 11.5) {
        return k === 'leap_attack' || k === 'tentacle_lash' || (isFrenzied && k === 'frenzied_attack');
      }
      return k === 'leap_attack' || k === 'tentacle_lash';
    });
    let usable = distFiltered.length > 0 ? distFiltered : pool;
    if (isFrenzied && usable.includes('frenzied_attack') && ai.lastAttackKind !== 'frenzied_attack' && distToTarget < 6.5) {
      ai.lastAttackKind = 'frenzied_attack';
      return 'frenzied_attack';
    }
    ai.attackChoiceIdx = (ai.attackChoiceIdx + 1) % usable.length;
    let picked = usable[ai.attackChoiceIdx];
    if (picked === ai.lastAttackKind && usable.length > 1) {
      picked = usable[(ai.attackChoiceIdx + 1) % usable.length];
    }
    ai.lastAttackKind = picked;
    return picked;
  }

  // Filter based on range (e.g. charge favors mid-distance 3.6-8.5m)
  const candidates = pool.filter((k) => {
    if (k === 'charge' && distToTarget < 3.0) return false;
    if (k === 'bite' && distToTarget > 3.6 && !profile.isBoss) return false;
    return true;
  });
  const usable = candidates.length > 0 ? candidates : pool;
  ai.attackChoiceIdx = (ai.attackChoiceIdx + 1) % usable.length;
  let picked = usable[ai.attackChoiceIdx];
  if (picked === ai.lastAttackKind && usable.length > 1) {
    picked = usable[(ai.attackChoiceIdx + 1) % usable.length];
  }
  ai.lastAttackKind = picked;
  return picked;
}

export function evaluateMonsterVision(
  enemyPos: THREE.Vector3,
  enemyYaw: number,
  targetPos: THREE.Vector3,
  profile: MonsterBehaviorProfile,
  colliders: ColliderBox[],
  isPlayerCrouching: boolean,
  isFlashlightOn: boolean,
  ghostStealth: boolean,
  playerMovingFast: boolean,
  alreadyAlert: boolean
): boolean {
  const dx = targetPos.x - enemyPos.x;
  const dy = targetPos.y - enemyPos.y;
  const dz = targetPos.z - enemyPos.z;
  const horizDist = Math.hypot(dx, dz);
  const dist3D = Math.hypot(dx, dy, dz);

  let effectiveVision = profile.visionRange;
  if (ghostStealth) effectiveVision *= 0.24;
  else if (isPlayerCrouching) effectiveVision *= 0.62;
  if (isFlashlightOn) effectiveVision *= 1.32;
  if (profile.personality === 'acoustic_lurker') {
    effectiveVision *= playerMovingFast ? 1.28 : 0.68;
  }
  if (alreadyAlert) effectiveVision *= 1.18;

  if (dist3D > effectiveVision) return false;

  // Vertical elevation check: monsters cannot effortlessly spot players straight above/below steep angles unless alert
  const vertAngle = Math.atan2(Math.abs(dy), Math.max(0.5, horizDist));
  if (!alreadyAlert && vertAngle > 0.92 && dist3D > 3.5) return false;

  // FOV check (close 3D proximity < 3.2m on similar elevation triggers peripheral awareness if LOS clear)
  if (dist3D > 3.2 || Math.abs(dy) > 1.8) {
    const fx = Math.sin(enemyYaw);
    const fz = Math.cos(enemyYaw);
    const dot = (dx * fx + dz * fz) / (horizDist || 1);
    const reqCos = alreadyAlert ? Math.min(profile.fovCos, -0.25) : profile.fovCos;
    if (dot < reqCos) return false;
  }

  const eyeHeight = profile.weightClass === 'small' ? 0.65 : profile.weightClass === 'boss' ? 2.15 : 1.32;
  _losFrom.set(enemyPos.x, enemyPos.y + eyeHeight, enemyPos.z);
  _losTo.set(targetPos.x, targetPos.y + (isPlayerCrouching ? 0.72 : 1.38), targetPos.z);

  return hasLineOfSight(_losFrom, _losTo, colliders, isPlayerCrouching ? 0.85 : 1.05);
}

export function computeSteeredDirection(
  enemyPos: THREE.Vector3,
  goalPos: THREE.Vector3,
  ai: MonsterAIRuntime,
  navGrid: NavGrid | null,
  allowDestructible: boolean,
  outDir: THREE.Vector3,
  wideClearance = false
): boolean {
  if (!navGrid) {
    outDir.copy(goalPos).sub(enemyPos).setY(0);
    const d = outDir.length();
    if (d > 0.15) {
      outDir.divideScalar(d);
      return true;
    }
    return false;
  }

  if (ai.repathTimer <= 0 || ai.waypoints.length === 0) {
    ai.repathTimer = 0.42 + Math.random() * 0.18;
    const path = navGrid.findPath(
      enemyPos.x,
      enemyPos.z,
      goalPos.x,
      goalPos.z,
      allowDestructible,
      wideClearance,
      enemyPos.y,
      goalPos.y
    );
    ai.waypoints.length = 0;
    for (let i = 0; i < path.length; i++) {
      ai.waypoints.push(path[i]);
    }
    ai.waypointIndex = 0;
  }

  while (ai.waypointIndex < ai.waypoints.length) {
    const wp = ai.waypoints[ai.waypointIndex];
    const distWp = Math.hypot(wp.x - enemyPos.x, wp.z - enemyPos.z);
    const dyWp = Math.abs(wp.y - enemyPos.y);
    if (distWp < 1.05 && dyWp < 1.45 && ai.waypointIndex < ai.waypoints.length - 1) {
      ai.waypointIndex += 1;
    } else {
      break;
    }
  }

  const targetWp = ai.waypoints[ai.waypointIndex] ?? goalPos;
  outDir.set(targetWp.x - enemyPos.x, 0, targetWp.z - enemyPos.z);
  const d = outDir.length();
  if (d > 0.12) {
    outDir.divideScalar(d);
    return true;
  }
  return false;
}

export function determineDesiredAIState(opts: {
  currentState: EnemyAIState;
  type: EnemyType;
  healthRatio: number;
  distToTarget: number;
  losVisible: boolean;
  heardEvent: SoundEvent | null;
  ai: MonsterAIRuntime;
  enemyPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  lastKnownPlayerPos: THREE.Vector3;
  searchTimer: number;
  stunTimer: number;
  navGrid: NavGrid | null;
  colliders: ColliderBox[];
  dt: number;
}): {
  nextState: EnemyAIState;
  nextSearchTimer: number;
  justAlerted: boolean;
} {
  const {
    currentState,
    type,
    healthRatio,
    distToTarget,
    losVisible,
    heardEvent,
    ai,
    enemyPos,
    targetPos,
    lastKnownPlayerPos,
    searchTimer,
    stunTimer,
    navGrid,
    colliders,
    dt,
  } = opts;
  const profile = MONSTER_PROFILES[type];

  if (currentState === 'DEAD') return { nextState: 'DEAD', nextSearchTimer: 0, justAlerted: false };
  if (stunTimer > 0) return { nextState: 'STUNNED', nextSearchTimer: searchTimer, justAlerted: false };

  if (ai.retreatCooldown > 0) ai.retreatCooldown -= dt;
  if (ai.suspensePauseTimer > 0) ai.suspensePauseTimer = Math.max(0, ai.suspensePauseTimer - dt);

  // Boss Intro Cinematic trigger on first contact
  if (profile.isBoss && !ai.bossIntroDone && (losVisible || distToTarget < 26)) {
    ai.bossIntroDone = true;
    ai.bossIntroTimer = 1.65;
    lastKnownPlayerPos.copy(targetPos);
    return { nextState: 'BOSS_INTRO', nextSearchTimer: 0, justAlerted: true };
  }

  if (currentState === 'BOSS_INTRO') {
    ai.bossIntroTimer -= dt;
    if (ai.bossIntroTimer > 0) {
      return { nextState: 'BOSS_INTRO', nextSearchTimer: 0, justAlerted: false };
    }
    return { nextState: 'CHASE', nextSearchTimer: 0, justAlerted: false };
  }

  // Injured Retreat Logic (non-boss injured monsters back away behind cover on their floor)
  if (
    profile.retreatHpRatio > 0 &&
    healthRatio <= profile.retreatHpRatio &&
    ai.retreatCooldown <= 0 &&
    distToTarget < 14
  ) {
    if (currentState !== 'RETREAT') {
      ai.hideTarget = navGrid
        ? navGrid.findNearestCoverPoint(
            enemyPos.x,
            enemyPos.z,
            targetPos.x,
            targetPos.z,
            colliders,
            18,
            enemyPos.y
          )
        : null;
      ai.retreatCooldown = 4.2;
    }
    return { nextState: 'RETREAT', nextSearchTimer: 4.5, justAlerted: false };
  }

  if (currentState === 'RETREAT') {
    if (ai.retreatCooldown > 0 && distToTarget < 12) {
      return { nextState: 'RETREAT', nextSearchTimer: searchTimer, justAlerted: false };
    }
  }

  // Ambush Hiding State
  if (currentState === 'HIDING') {
    ai.hideTimer -= dt;
    if ((losVisible && distToTarget < 8.5) || (distToTarget < 5.2 && Math.abs(targetPos.y - enemyPos.y) < 1.8) || ai.hideTimer <= 0) {
      lastKnownPlayerPos.copy(targetPos);
      return { nextState: 'CHASE', nextSearchTimer: 0, justAlerted: true };
    }
    if (heardEvent && Math.hypot(heardEvent.x - enemyPos.x, heardEvent.y - enemyPos.y, heardEvent.z - enemyPos.z) < 6.5) {
      lastKnownPlayerPos.set(heardEvent.x, heardEvent.y, heardEvent.z);
      return { nextState: 'CHASE', nextSearchTimer: 0, justAlerted: true };
    }
    return { nextState: 'HIDING', nextSearchTimer: 0, justAlerted: false };
  }

  // Direct Visual Detection (requires genuine 3D LOS, never sees through walls or floors!)
  if (losVisible) {
    ai.losVisible = true;
    ai.losLostTimer = 0;
    ai.investigatingSound = false;
    ai.suspensePauseTimer = 0;
    ai.searchChecksDone = 0;
    lastKnownPlayerPos.copy(targetPos);
    const justAlerted = currentState === 'PATROL' || currentState === 'SEARCH';
    const engageRange = profile.hasRanged ? profile.rangedMaxDist : 2.9;
    const sameFloorEnough = Math.abs(targetPos.y - enemyPos.y) <= (profile.hasRanged ? 6.0 : 1.75);
    const nextState: EnemyAIState = distToTarget <= engageRange && sameFloorEnough ? 'ATTACK' : 'CHASE';
    return { nextState, nextSearchTimer: 8.5, justAlerted };
  }

  ai.losVisible = false;

  // Lost visual during combat -> remember lastKnownPlayerPos (with true floor Y) and search
  if (currentState === 'CHASE' || currentState === 'ATTACK') {
    ai.losLostTimer += dt;
    if (ai.losLostTimer < 1.15) {
      return { nextState: 'CHASE', nextSearchTimer: 8.5, justAlerted: false };
    }
    if (profile.canHide && Math.random() < 0.35 && navGrid) {
      const cover = navGrid.findNearestCoverPoint(
        enemyPos.x,
        enemyPos.z,
        lastKnownPlayerPos.x,
        lastKnownPlayerPos.z,
        colliders,
        12,
        enemyPos.y
      );
      if (cover) {
        ai.hideTarget = cover;
        ai.hideTimer = 5.5;
        return { nextState: 'HIDING', nextSearchTimer: 5.5, justAlerted: false };
      }
    }
    ai.repathTimer = 0;
    ai.searchChecksDone = 0;
    return { nextState: 'SEARCH', nextSearchTimer: 9.0, justAlerted: false };
  }

  // Acoustic Detection (clues, not omniscient tracking: preserves floor Y + realistic spatial uncertainty)
  if (heardEvent && heardEvent.timestamp > ai.lastHeardTimestamp + 0.35) {
    ai.lastHeardTimestamp = heardEvent.timestamp;
    const uncertainty =
      heardEvent.kind === 'gunshot' || heardEvent.kind === 'shriek'
        ? 1.4
        : heardEvent.kind === 'door_open' || heardEvent.kind === 'object_break'
          ? 2.1
          : 3.0;
    const seed = heardEvent.timestamp * 19.37 + enemyPos.x * 3.1;
    const ox = Math.cos(seed) * uncertainty * 0.65;
    const oz = Math.sin(seed * 1.3) * uncertainty * 0.65;
    lastKnownPlayerPos.set(heardEvent.x + ox, heardEvent.y, heardEvent.z + oz);
    ai.investigatingSound = true;
    ai.repathTimer = 0;
    ai.searchChecksDone = 0;
    const justAlerted = currentState === 'PATROL';
    // Suspenseful brief head-turn / listening freeze when an ambush predator first hears a clue!
    if (justAlerted && (profile.personality === 'ambush_stalker' || profile.personality === 'acoustic_lurker')) {
      ai.suspensePauseTimer = 0.72;
    }
    // Longer search time if the clue came from another floor so monster has time to climb stairs/escalator
    const multiFloorBonus = Math.abs(heardEvent.y - enemyPos.y) > 1.8 ? 6.5 : 0;
    return { nextState: 'SEARCH', nextSearchTimer: 8.5 + multiFloorBonus, justAlerted };
  }

  // Ongoing Multi-Room / Multi-Floor Search at Last Known Location
  if (currentState === 'SEARCH') {
    const nextSearch = searchTimer - dt;
    const distLast = Math.hypot(
      lastKnownPlayerPos.x - enemyPos.x,
      lastKnownPlayerPos.y - enemyPos.y,
      lastKnownPlayerPos.z - enemyPos.z
    );
    if (nextSearch <= 0 || (distLast < 1.8 && nextSearch < 1.6 && ai.searchChecksDone >= 2)) {
      ai.investigatingSound = false;
      ai.repathTimer = 0;
      return { nextState: 'PATROL', nextSearchTimer: 0, justAlerted: false };
    }
    return { nextState: 'SEARCH', nextSearchTimer: nextSearch, justAlerted: false };
  }

  return { nextState: 'PATROL', nextSearchTimer: 0, justAlerted: false };
}
