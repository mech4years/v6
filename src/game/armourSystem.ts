import * as THREE from 'three';
import {
  ArmourBreakStage,
  ArmourCheckpointState,
  ArmourDamageTier,
  ArmourPieceHudSnapshot,
  ArmourPieceId,
} from './types';

export const ALL_ARMOUR_PIECE_IDS: ArmourPieceId[] = [
  'helmet',
  'chest',
  'back',
  'leftArm',
  'rightArm',
  'leftLeg',
  'rightLeg',
];

export const ARMOUR_PIECE_LABELS: Record<ArmourPieceId, string> = {
  helmet: 'HELMET',
  chest: 'CHEST',
  back: 'BACK',
  leftArm: 'L ARM',
  rightArm: 'R ARM',
  leftLeg: 'L LEG',
  rightLeg: 'R LEG',
};

const PIECE_WEIGHTS: Record<ArmourPieceId, number> = {
  chest: 0.28,
  back: 0.22,
  helmet: 0.14,
  leftArm: 0.09,
  rightArm: 0.09,
  leftLeg: 0.09,
  rightLeg: 0.09,
};

export interface ArmourPieceState {
  id: ArmourPieceId;
  label: string;
  durability: number;
  maxDurability: number;
  minDurability: number;
  destructible: boolean;
  stage: ArmourBreakStage;
  hitShakeTimer: number;
  hitIntensity: number;
  lastHitDirLocal: THREE.Vector3;
  breakTimer: number;
  breakDuration: number;
  breakDirLocal: THREE.Vector3;
  breakIntensity: number;
  cracksSpreadTriggered: boolean;
  sparksBurstTriggered: boolean;
  shatterDropTriggered: boolean;
}

export interface ArmourSystemState {
  pieces: Record<ArmourPieceId, ArmourPieceState>;
  maxTotalArmor: number;
}

export interface FullBodyArmourRefs {
  undersuitTorsoGroup: THREE.Group;
  chestArmourGroup: THREE.Group;
  chestLeftHalf: THREE.Group;
  chestRightHalf: THREE.Group;
  chestCenterBridge: THREE.Object3D;
  chestCrackMesh: THREE.Mesh;
  chestCrackMat: THREE.MeshBasicMaterial;
  backArmourGroup: THREE.Group;
  backMainPlate: THREE.Group;
  backFasteners: THREE.Object3D[];
  backCrackMesh: THREE.Mesh;
  backCrackMat: THREE.MeshBasicMaterial;
  helmetArmourGroup: THREE.Group;
  leftArmArmourGroup: THREE.Group;
  rightArmArmourGroup: THREE.Group;
  leftLegArmourGroup: THREE.Group;
  rightLegArmourGroup: THREE.Group;
  pieceOverlayMeshes: Partial<Record<ArmourPieceId, THREE.Mesh>>;
  pieceOverlayMats: Partial<Record<ArmourPieceId, THREE.MeshBasicMaterial>>;
  armorColorHex: number;
  trimColorHex: number;
}

export interface ArmourImpactResult {
  totalArmor: number;
  hitPieces: ArmourPieceId[];
  crackedPieces: ArmourPieceId[];
  powerfulSpark: boolean;
  newlyBreakingPiece: 'chest' | 'back' | null;
  breakDirLocal: THREE.Vector3;
  breakIntensity: number;
}

export interface ArmourCrackTextures {
  dented: THREE.CanvasTexture;
  cracked: THREE.CanvasTexture;
  fractured: THREE.CanvasTexture;
}

let cachedCrackTextures: ArmourCrackTextures | null = null;

function drawJaggedLine(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  segments: number,
  jitter: number,
  seed: number
) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const px = x0 + (x1 - x0) * t + (rand() - 0.5) * jitter;
    const py = y0 + (y1 - y0) * t + (rand() - 0.5) * jitter;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function makeCrackTexture(tier: 'dented' | 'cracked' | 'fractured'): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);

    // Impact dent craters & sheared metallic scratches
    const dentCount = tier === 'dented' ? 5 : tier === 'cracked' ? 8 : 11;
    for (let i = 0; i < dentCount; i++) {
      const cx = 36 + ((i * 67) % 184);
      const cy = 32 + ((i * 89) % 192);
      const r = tier === 'dented' ? 12 + (i % 3) * 5 : 16 + (i % 4) * 6;
      const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
      g.addColorStop(0, tier === 'fractured' ? 'rgba(10, 6, 8, 0.72)' : 'rgba(15, 18, 24, 0.55)');
      g.addColorStop(0.55, 'rgba(148, 163, 184, 0.25)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine metallic surface scratches
    ctx.lineWidth = tier === 'dented' ? 1.5 : 1.8;
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    for (let i = 0; i < (tier === 'dented' ? 10 : 18); i++) {
      const x = 20 + ((i * 53) % 210);
      const y = 20 + ((i * 71) % 210);
      drawJaggedLine(ctx, x, y, x + ((i % 2 === 0 ? 1 : -1) * 32), y + 14, 4, 4, 100 + i * 17);
    }

    // Structural fracture cracks for cracked & fractured tiers
    if (tier === 'cracked' || tier === 'fractured') {
      const branches = tier === 'cracked' ? 9 : 18;
      // Bright sheared metallic rim highlight first
      ctx.lineWidth = tier === 'fractured' ? 4.2 : 2.8;
      ctx.strokeStyle = tier === 'fractured' ? 'rgba(251, 146, 60, 0.72)' : 'rgba(226, 232, 240, 0.52)';
      for (let i = 0; i < branches; i++) {
        const ang = (i / branches) * Math.PI * 2 + (i % 3) * 0.25;
        const len = tier === 'fractured' ? 75 + (i % 4) * 20 : 48 + (i % 3) * 18;
        drawJaggedLine(
          ctx,
          128 + Math.cos(ang) * 8,
          128 + Math.sin(ang) * 8,
          128 + Math.cos(ang) * len,
          128 + Math.sin(ang) * len,
          7,
          14,
          700 + i * 31
        );
      }
      // Deep dark fissure core
      ctx.lineWidth = tier === 'fractured' ? 2.6 : 1.8;
      ctx.strokeStyle = 'rgba(8, 8, 10, 0.96)';
      for (let i = 0; i < branches; i++) {
        const ang = (i / branches) * Math.PI * 2 + (i % 3) * 0.25;
        const len = tier === 'fractured' ? 78 + (i % 4) * 20 : 50 + (i % 3) * 18;
        drawJaggedLine(
          ctx,
          128 + Math.cos(ang) * 8,
          128 + Math.sin(ang) * 8,
          128 + Math.cos(ang) * len,
          128 + Math.sin(ang) * len,
          7,
          14,
          700 + i * 31
        );
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function getArmourCrackTextures(): ArmourCrackTextures {
  if (!cachedCrackTextures) {
    cachedCrackTextures = {
      dented: makeCrackTexture('dented'),
      cracked: makeCrackTexture('cracked'),
      fractured: makeCrackTexture('fractured'),
    };
  }
  return cachedCrackTextures;
}

export function createArmourSystemState(
  maxArmor: number,
  saved?: ArmourCheckpointState
): ArmourSystemState {
  const safeMax = Math.max(20, Math.round(maxArmor));
  const pieces = {} as Record<ArmourPieceId, ArmourPieceState>;

  let allocated = 0;
  for (const id of ALL_ARMOUR_PIECE_IDS) {
    const pieceMax = Math.max(4, Math.round(safeMax * PIECE_WEIGHTS[id]));
    allocated += pieceMax;
    const destructible = id === 'chest' || id === 'back';
    // Non-destructible pieces never break or reach 0
    const minDurability = destructible ? 0 : Math.max(1, Math.round(pieceMax * 0.12));

    let durability = pieceMax;
    let stage: ArmourBreakStage = 'intact';
    const savedPiece = saved?.pieces?.[id];
    if (savedPiece) {
      durability = destructible
        ? THREE.MathUtils.clamp(Math.round(savedPiece.durability), 0, pieceMax)
        : THREE.MathUtils.clamp(Math.round(savedPiece.durability), minDurability, pieceMax);
      if (destructible && (savedPiece.stage === 'destroyed' || savedPiece.stage === 'breaking' || durability <= 0)) {
        durability = 0;
        stage = 'destroyed';
      }
    }

    pieces[id] = {
      id,
      label: ARMOUR_PIECE_LABELS[id],
      durability,
      maxDurability: pieceMax,
      minDurability,
      destructible,
      stage,
      hitShakeTimer: 0,
      hitIntensity: 0,
      lastHitDirLocal: new THREE.Vector3(0, 0, 1),
      breakTimer: 0,
      breakDuration: id === 'chest' ? 0.92 : 0.86,
      breakDirLocal: new THREE.Vector3(0, 0, id === 'chest' ? 1 : -1),
      breakIntensity: 1,
      cracksSpreadTriggered: false,
      sparksBurstTriggered: false,
      shatterDropTriggered: false,
    };
  }

  // Reconcile rounding remainder cleanly on chest so sum === safeMax
  const diff = safeMax - allocated;
  if (diff !== 0) {
    pieces.chest.maxDurability = Math.max(6, pieces.chest.maxDurability + diff);
    if (!saved?.pieces?.chest) {
      pieces.chest.durability = pieces.chest.maxDurability;
    } else {
      pieces.chest.durability = Math.min(pieces.chest.durability, pieces.chest.maxDurability);
    }
  }

  return {
    pieces,
    maxTotalArmor: safeMax,
  };
}

export function getTotalArmourDurability(state: ArmourSystemState): number {
  let total = 0;
  for (const id of ALL_ARMOUR_PIECE_IDS) {
    total += Math.max(0, state.pieces[id].durability);
  }
  return Math.round(total);
}

export function isBodyArmourLost(state: ArmourSystemState): boolean {
  return (
    state.pieces.chest.stage !== 'intact' &&
    state.pieces.back.stage !== 'intact'
  );
}

export function getArmourDamageTier(piece: ArmourPieceState): ArmourDamageTier {
  if (piece.destructible && (piece.stage === 'destroyed' || piece.stage === 'breaking' || piece.durability <= 0)) {
    return 'destroyed';
  }
  const ratio = piece.maxDurability > 0 ? piece.durability / piece.maxDurability : 1;
  if (ratio <= 0.42) return 'cracked';
  if (ratio <= 0.78) return 'dented';
  return 'intact';
}

export function serializeArmourState(state: ArmourSystemState): ArmourCheckpointState {
  const pieces = {} as ArmourCheckpointState['pieces'];
  for (const id of ALL_ARMOUR_PIECE_IDS) {
    const p = state.pieces[id];
    pieces[id] = {
      durability: Math.round(p.durability),
      maxDurability: p.maxDurability,
      stage: p.stage === 'breaking' ? 'destroyed' : p.stage,
    };
  }
  return { pieces };
}

export function buildArmourHudSnapshot(
  state: ArmourSystemState
): Record<ArmourPieceId, ArmourPieceHudSnapshot> {
  const out = {} as Record<ArmourPieceId, ArmourPieceHudSnapshot>;
  for (const id of ALL_ARMOUR_PIECE_IDS) {
    const p = state.pieces[id];
    const pct = p.maxDurability > 0 ? Math.round((p.durability / p.maxDurability) * 100) : 0;
    out[id] = {
      id,
      label: p.label,
      durability: Math.round(p.durability),
      maxDurability: p.maxDurability,
      pct: p.stage !== 'intact' && p.destructible ? 0 : Math.max(p.destructible ? 0 : 10, Math.min(100, pct)),
      destructible: p.destructible,
      stage: p.stage,
      damageTier: getArmourDamageTier(p),
    };
  }
  return out;
}

export function bolsterIntactArmour(state: ArmourSystemState, amount: number): number {
  if (amount <= 0) return getTotalArmourDurability(state);
  // Only repair intact pieces; NEVER restore destroyed chest or back plates
  const eligible = ALL_ARMOUR_PIECE_IDS.filter(
    (id) => state.pieces[id].stage === 'intact' && state.pieces[id].durability < state.pieces[id].maxDurability
  );
  if (eligible.length === 0) return getTotalArmourDurability(state);

  let remaining = amount;
  for (let pass = 0; pass < 2 && remaining > 0.1; pass++) {
    const share = remaining / eligible.length;
    for (const id of eligible) {
      const p = state.pieces[id];
      const room = p.maxDurability - p.durability;
      if (room <= 0) continue;
      const add = Math.min(room, share);
      p.durability += add;
      remaining -= add;
    }
  }
  return getTotalArmourDurability(state);
}

export function repairAllArmourPieces(state: ArmourSystemState): number {
  for (const id of ALL_ARMOUR_PIECE_IDS) {
    const p = state.pieces[id];
    p.durability = p.maxDurability;
    p.stage = 'intact';
    p.hitShakeTimer = 0;
    p.breakTimer = 0;
    p.cracksSpreadTriggered = false;
    p.sparksBurstTriggered = false;
    p.shatterDropTriggered = false;
  }
  return getTotalArmourDurability(state);
}

export function countDamagedOrBrokenArmour(state: ArmourSystemState): {
  damagedCount: number;
  destroyedCount: number;
} {
  let damagedCount = 0;
  let destroyedCount = 0;
  for (const id of ALL_ARMOUR_PIECE_IDS) {
    const p = state.pieces[id];
    if (p.destructible && p.stage !== 'intact') {
      destroyedCount += 1;
      damagedCount += 1;
    } else if (p.durability < p.maxDurability - 0.5) {
      damagedCount += 1;
    }
  }
  return { damagedCount, destroyedCount };
}

/**
 * Applies directional combat damage across the 7 armour pieces.
 * Chest and back are destructible (reaching 0 triggers breaking animation + removal).
 * Helmet, arms, and legs NEVER break or disappear (clamped >= minDurability).
 */
export function applyArmourImpact(
  state: ArmourSystemState,
  rawDamage: number,
  absorbedDamage: number,
  attackerPosWorld: THREE.Vector3 | undefined,
  playerPosWorld: THREE.Vector3,
  playerYaw: number
): ArmourImpactResult {
  const hitDirLocal = new THREE.Vector3(0, 0, 1);
  let frontDot = 0;
  let rightDot = 0;
  let hasDirection = false;

  if (attackerPosWorld) {
    const dx = attackerPosWorld.x - playerPosWorld.x;
    const dz = attackerPosWorld.z - playerPosWorld.z;
    const horiz = Math.hypot(dx, dz);
    if (horiz > 0.05) {
      hasDirection = true;
      const fwdX = -Math.sin(playerYaw);
      const fwdZ = -Math.cos(playerYaw);
      const rightX = Math.cos(playerYaw);
      const rightZ = -Math.sin(playerYaw);
      frontDot = (dx * fwdX + dz * fwdZ) / horiz;
      rightDot = (dx * rightX + dz * rightZ) / horiz;
      const dyNorm = THREE.MathUtils.clamp((attackerPosWorld.y - playerPosWorld.y) * 0.25, -0.45, 0.45);
      // In character model space (+Z is character front, +X is character left/right)
      hitDirLocal.set(rightDot, dyNorm, frontDot).normalize();
    }
  }

  // Compute per-piece damage weights based on impact direction
  const weights: Record<ArmourPieceId, number> = {
    helmet: 0.12,
    chest: 0.34,
    back: 0.24,
    leftArm: 0.08,
    rightArm: 0.08,
    leftLeg: 0.07,
    rightLeg: 0.07,
  };

  if (hasDirection) {
    const rightBias = rightDot > 0.15 ? 0.72 : rightDot < -0.15 ? 0.28 : 0.5;
    const leftBias = 1 - rightBias;
    if (frontDot >= 0.15) {
      // Frontal strike -> hits chest plate & front limbs/helmet
      weights.chest = state.pieces.chest.stage === 'intact' ? 0.6 : 0.0;
      weights.back = 0.0;
      weights.helmet = 0.14;
      const armShare = state.pieces.chest.stage === 'intact' ? 0.16 : 0.48;
      const legShare = state.pieces.chest.stage === 'intact' ? 0.1 : 0.38;
      weights.leftArm = armShare * leftBias;
      weights.rightArm = armShare * rightBias;
      weights.leftLeg = legShare * leftBias;
      weights.rightLeg = legShare * rightBias;
    } else if (frontDot <= -0.15) {
      // Rear strike -> hits back plate & rear limbs/helmet
      weights.back = state.pieces.back.stage === 'intact' ? 0.64 : 0.0;
      weights.chest = 0.0;
      weights.helmet = 0.11;
      const legShare = state.pieces.back.stage === 'intact' ? 0.15 : 0.45;
      const armShare = state.pieces.back.stage === 'intact' ? 0.1 : 0.44;
      weights.leftLeg = legShare * leftBias;
      weights.rightLeg = legShare * rightBias;
      weights.leftArm = armShare * leftBias;
      weights.rightArm = armShare * rightBias;
    } else {
      // Lateral flank strike
      weights.chest = state.pieces.chest.stage === 'intact' ? 0.32 : 0.0;
      weights.back = state.pieces.back.stage === 'intact' ? 0.32 : 0.0;
      weights.helmet = 0.12;
      const limbTotal = 1 - weights.chest - weights.back - weights.helmet;
      weights.leftArm = limbTotal * 0.55 * leftBias;
      weights.rightArm = limbTotal * 0.55 * rightBias;
      weights.leftLeg = limbTotal * 0.45 * leftBias;
      weights.rightLeg = limbTotal * 0.45 * rightBias;
    }
  } else {
    if (state.pieces.chest.stage !== 'intact') weights.chest = 0;
    if (state.pieces.back.stage !== 'intact') weights.back = 0;
  }

  let totalWeight = 0;
  for (const id of ALL_ARMOUR_PIECE_IDS) {
    totalWeight += weights[id];
  }
  if (totalWeight <= 0.001) {
    weights.helmet = 0.25;
    weights.leftArm = 0.2;
    weights.rightArm = 0.2;
    weights.leftLeg = 0.175;
    weights.rightLeg = 0.175;
    totalWeight = 1;
  }

  // Scale plate wear from absorbed damage (or light surface scuffing if only residual non-destructible remains)
  const effectiveWearPool = Math.max(absorbedDamage, rawDamage * 0.22);
  const intensity = THREE.MathUtils.clamp(rawDamage / 26, 0.38, 1.45);
  const hitPieces: ArmourPieceId[] = [];
  const crackedPieces: ArmourPieceId[] = [];
  let newlyBreakingPiece: 'chest' | 'back' | null = null;

  for (const id of ALL_ARMOUR_PIECE_IDS) {
    const w = weights[id] / totalWeight;
    if (w <= 0.01) continue;
    const p = state.pieces[id];
    const prevTier = getArmourDamageTier(p);

    p.hitShakeTimer = 0.26;
    p.hitIntensity = intensity * (0.65 + w * 0.7);
    p.lastHitDirLocal.copy(hitDirLocal);
    hitPieces.push(id);

    const delta = effectiveWearPool * w * 1.15;
    if (p.destructible) {
      if (p.stage === 'intact') {
        p.durability = Math.max(0, p.durability - delta);
        if (p.durability <= 0.05) {
          p.durability = 0;
          p.stage = 'breaking';
          p.breakTimer = 0;
          p.breakDirLocal.copy(hitDirLocal);
          p.breakIntensity = intensity;
          p.cracksSpreadTriggered = false;
          p.sparksBurstTriggered = false;
          p.shatterDropTriggered = false;
          if (!newlyBreakingPiece) {
            newlyBreakingPiece = id as 'chest' | 'back';
          }
        }
      }
    } else {
      // Non-destructible pieces suffer dents & scratches down to floor, NEVER destroyed
      p.durability = Math.max(p.minDurability, p.durability - delta * 0.75);
    }

    const nextTier = getArmourDamageTier(p);
    if (nextTier !== prevTier && (nextTier === 'dented' || nextTier === 'cracked')) {
      crackedPieces.push(id);
    }
  }

  return {
    totalArmor: getTotalArmourDurability(state),
    hitPieces,
    crackedPieces,
    powerfulSpark: rawDamage >= 16 || newlyBreakingPiece !== null,
    newlyBreakingPiece,
    breakDirLocal: hitDirLocal.clone(),
    breakIntensity: intensity,
  };
}

export interface ArmourRigAnimCallbacks {
  onChestPhase?: (phase: 'crack_spread' | 'sparks_outward' | 'plate_shatter' | 'complete', intensity: number) => void;
  onBackPhase?: (phase: 'fastener_snap' | 'plate_separate' | 'complete', intensity: number) => void;
}

/**
 * Updates 7-piece armour visuals, per-piece dents/cracks/hit-shake,
 * and chest/back multi-stage breaking animations on a FullBodyCharacterRig.
 */
export function updateFullBodyArmourRig(
  armourRig: FullBodyArmourRefs,
  state: ArmourSystemState,
  dt: number,
  elapsed: number,
  callbacks?: ArmourRigAnimCallbacks
): void {
  const crackTex = getArmourCrackTextures();

  // 1. Update damped hit-shakes & progressive surface damage on all 7 pieces
  for (const id of ALL_ARMOUR_PIECE_IDS) {
    const p = state.pieces[id];
    if (p.hitShakeTimer > 0) {
      p.hitShakeTimer = Math.max(0, p.hitShakeTimer - dt);
    }
    const tier = getArmourDamageTier(p);
    const overlayMesh = armourRig.pieceOverlayMeshes[id];
    const overlayMat = armourRig.pieceOverlayMats[id];
    if (overlayMesh && overlayMat) {
      if (tier === 'intact') {
        overlayMesh.visible = false;
      } else {
        overlayMesh.visible = true;
        const targetTex =
          tier === 'cracked' || tier === 'destroyed' ? crackTex.cracked : crackTex.dented;
        if (overlayMat.map !== targetTex) {
          overlayMat.map = targetTex;
          overlayMat.needsUpdate = true;
        }
        overlayMat.opacity = tier === 'cracked' ? 0.92 : 0.62;
      }
    }
  }

  // Non-destructible pieces ALWAYS stay visible & equipped; apply subtle hit shudder
  armourRig.helmetArmourGroup.visible = true;
  armourRig.leftArmArmourGroup.visible = true;
  armourRig.rightArmArmourGroup.visible = true;
  armourRig.leftLegArmourGroup.visible = true;
  armourRig.rightLegArmourGroup.visible = true;

  const applyHitJitter = (grp: THREE.Group, p: ArmourPieceState) => {
    if (p.hitShakeTimer > 0) {
      const decay = p.hitShakeTimer / 0.26;
      const amp = 0.014 * p.hitIntensity * decay;
      grp.position.set(
        Math.sin(elapsed * 58) * amp,
        Math.cos(elapsed * 49) * amp * 0.7,
        Math.sin(elapsed * 64) * amp
      );
      grp.rotation.z = Math.sin(elapsed * 52) * 0.055 * p.hitIntensity * decay;
    } else {
      grp.position.set(0, 0, 0);
      grp.rotation.set(0, 0, 0);
    }
  };

  applyHitJitter(armourRig.helmetArmourGroup, state.pieces.helmet);
  applyHitJitter(armourRig.leftArmArmourGroup, state.pieces.leftArm);
  applyHitJitter(armourRig.rightArmArmourGroup, state.pieces.rightArm);
  applyHitJitter(armourRig.leftLegArmourGroup, state.pieces.leftLeg);
  applyHitJitter(armourRig.rightLegArmourGroup, state.pieces.rightLeg);

  // 2. Chest Armour State Machine (intact -> 7-step breaking -> destroyed)
  const chest = state.pieces.chest;
  if (chest.stage === 'destroyed') {
    armourRig.chestArmourGroup.visible = false;
  } else if (chest.stage === 'intact') {
    armourRig.chestArmourGroup.visible = true;
    armourRig.chestLeftHalf.position.set(0, 0, 0);
    armourRig.chestLeftHalf.rotation.set(0, 0, 0);
    armourRig.chestLeftHalf.scale.setScalar(1);
    armourRig.chestRightHalf.position.set(0, 0, 0);
    armourRig.chestRightHalf.rotation.set(0, 0, 0);
    armourRig.chestRightHalf.scale.setScalar(1);
    armourRig.chestCenterBridge.position.set(0, 0, 0);
    armourRig.chestCenterBridge.rotation.set(0, 0, 0);
    armourRig.chestCenterBridge.scale.setScalar(1);
    applyHitJitter(armourRig.chestArmourGroup, chest);
  } else {
    // 'breaking': 7-stage chest destruction sequence
    armourRig.chestArmourGroup.visible = true;
    chest.breakTimer = Math.min(chest.breakDuration, chest.breakTimer + dt);
    const t = THREE.MathUtils.clamp(chest.breakTimer / chest.breakDuration, 0, 1);

    // Phase 1-2 (0..0.40): Visible cracks appear & spread across chest plate
    armourRig.chestCrackMesh.visible = true;
    if (t < 0.2) {
      if (armourRig.chestCrackMat.map !== crackTex.cracked) {
        armourRig.chestCrackMat.map = crackTex.cracked;
        armourRig.chestCrackMat.needsUpdate = true;
      }
      armourRig.chestCrackMat.opacity = 0.7 + t * 1.5;
    } else {
      if (armourRig.chestCrackMat.map !== crackTex.fractured) {
        armourRig.chestCrackMat.map = crackTex.fractured;
        armourRig.chestCrackMat.needsUpdate = true;
      }
      armourRig.chestCrackMat.opacity = 1.0;
      if (!chest.cracksSpreadTriggered) {
        chest.cracksSpreadTriggered = true;
        callbacks?.onChestPhase?.('crack_spread', chest.breakIntensity);
      }
    }

    // Phase 3 (0.15..0.55): Armour shakes & bends inward/outward along hit direction
    const shakeAmp = t < 0.62 ? (0.018 + t * 0.03) * chest.breakIntensity : 0.01;
    armourRig.chestArmourGroup.position.set(
      Math.sin(elapsed * 78) * shakeAmp + chest.breakDirLocal.x * 0.025 * t,
      Math.cos(elapsed * 69) * shakeAmp * 0.6,
      Math.sin(elapsed * 86) * shakeAmp * 0.7
    );
    const bendBias = THREE.MathUtils.clamp(t / 0.45, 0, 1);
    armourRig.chestLeftHalf.rotation.set(
      0.16 * bendBias,
      -0.24 * bendBias,
      0.18 * bendBias
    );
    armourRig.chestRightHalf.rotation.set(
      0.16 * bendBias,
      0.24 * bendBias,
      -0.18 * bendBias
    );
    armourRig.chestCenterBridge.rotation.set(
      -0.22 * bendBias,
      chest.breakDirLocal.x * 0.18 * bendBias,
      0
    );

    // Phase 4 (t >= 0.42): Sparks & small fragments fly outward
    if (t >= 0.42 && !chest.sparksBurstTriggered) {
      chest.sparksBurstTriggered = true;
      callbacks?.onChestPhase?.('sparks_outward', chest.breakIntensity);
    }

    // Phase 5-6 (t >= 0.54): Chest plate breaks apart & drops outward/downward
    if (t >= 0.54) {
      if (!chest.shatterDropTriggered) {
        chest.shatterDropTriggered = true;
        callbacks?.onChestPhase?.('plate_shatter', chest.breakIntensity);
      }
      const sep = (t - 0.54) / 0.46;
      const easeOut = 1 - Math.pow(1 - sep, 2);
      const dropY = -0.52 * sep * sep;
      const fadeScale = Math.max(0.05, 1 - sep * 0.88);

      armourRig.chestLeftHalf.position.set(-0.26 * easeOut, dropY, 0.22 * easeOut);
      armourRig.chestLeftHalf.rotation.set(0.95 * easeOut, -0.75 * easeOut, 0.85 * easeOut);
      armourRig.chestLeftHalf.scale.setScalar(fadeScale);

      armourRig.chestRightHalf.position.set(0.26 * easeOut, dropY, 0.22 * easeOut);
      armourRig.chestRightHalf.rotation.set(0.95 * easeOut, 0.75 * easeOut, -0.85 * easeOut);
      armourRig.chestRightHalf.scale.setScalar(fadeScale);

      armourRig.chestCenterBridge.position.set(
        chest.breakDirLocal.x * 0.1 * easeOut,
        dropY * 1.15,
        0.3 * easeOut
      );
      armourRig.chestCenterBridge.rotation.set(1.2 * easeOut, 0.4 * easeOut, 0.3 * easeOut);
      armourRig.chestCenterBridge.scale.setScalar(fadeScale);
    }

    // Phase 7 (t >= 1): Disappear leaving undersuit visible
    if (t >= 1) {
      chest.stage = 'destroyed';
      armourRig.chestArmourGroup.visible = false;
      callbacks?.onChestPhase?.('complete', chest.breakIntensity);
    }
  }

  // 3. Back Armour State Machine (intact -> 6-step breaking -> destroyed)
  const back = state.pieces.back;
  if (back.stage === 'destroyed') {
    armourRig.backArmourGroup.visible = false;
  } else if (back.stage === 'intact') {
    armourRig.backArmourGroup.visible = true;
    armourRig.backMainPlate.position.set(0, 0, 0);
    armourRig.backMainPlate.rotation.set(0, 0, 0);
    armourRig.backMainPlate.scale.setScalar(1);
    armourRig.backFasteners.forEach((f) => {
      f.position.set(f.userData.restX ?? 0, f.userData.restY ?? 0, f.userData.restZ ?? 0);
      f.rotation.set(0, 0, 0);
      f.visible = true;
    });
    applyHitJitter(armourRig.backArmourGroup, back);
  } else {
    // 'breaking': 6-stage back destruction sequence
    armourRig.backArmourGroup.visible = true;
    back.breakTimer = Math.min(back.breakDuration, back.breakTimer + dt);
    const t = THREE.MathUtils.clamp(back.breakTimer / back.breakDuration, 0, 1);

    // Phase 1-2 (0..0.35): Back plate vibrates violently & cracks spread across surface
    armourRig.backCrackMesh.visible = true;
    const crackTexToUse = t < 0.18 ? crackTex.cracked : crackTex.fractured;
    if (armourRig.backCrackMat.map !== crackTexToUse) {
      armourRig.backCrackMat.map = crackTexToUse;
      armourRig.backCrackMat.needsUpdate = true;
    }
    armourRig.backCrackMat.opacity = Math.min(1, 0.72 + t * 1.4);

    const vib = (0.016 + (1 - Math.abs(t - 0.35)) * 0.022) * back.breakIntensity;
    armourRig.backArmourGroup.position.set(
      Math.sin(elapsed * 94) * vib,
      Math.cos(elapsed * 82) * vib * 0.7,
      Math.sin(elapsed * 102) * vib * 0.8
    );

    // Phase 3 (t >= 0.24): Fasteners & connecting pieces snap outward backward
    if (t >= 0.24) {
      if (!back.cracksSpreadTriggered) {
        back.cracksSpreadTriggered = true;
        callbacks?.onBackPhase?.('fastener_snap', back.breakIntensity);
      }
      const snapP = THREE.MathUtils.clamp((t - 0.24) / 0.36, 0, 1);
      armourRig.backFasteners.forEach((f, idx) => {
        const sx = (idx % 2 === 0 ? -1 : 1) * 0.16 * snapP;
        const sy = (idx < 2 ? 0.12 : -0.18) * snapP;
        f.position.set(
          (f.userData.restX ?? 0) + sx,
          (f.userData.restY ?? 0) + sy,
          (f.userData.restZ ?? 0) - 0.28 * snapP
        );
        f.rotation.set(snapP * 2.8, snapP * 1.9, snapP * 3.2);
        if (snapP >= 0.95) f.visible = false;
      });
    }

    // Phase 4-5 (t >= 0.44): Back plate separates backward & drops behind player
    if (t >= 0.44) {
      if (!back.sparksBurstTriggered) {
        back.sparksBurstTriggered = true;
        callbacks?.onBackPhase?.('plate_separate', back.breakIntensity);
      }
      const sep = (t - 0.44) / 0.56;
      const easeOut = 1 - Math.pow(1 - sep, 2);
      const dropY = -0.58 * sep * sep;
      const fadeScale = Math.max(0.05, 1 - sep * 0.88);
      armourRig.backMainPlate.position.set(
        back.breakDirLocal.x * 0.08 * easeOut,
        dropY,
        -0.38 * easeOut
      );
      armourRig.backMainPlate.rotation.set(-0.95 * easeOut, 0.28 * easeOut, 0.22 * easeOut);
      armourRig.backMainPlate.scale.setScalar(fadeScale);
    }

    // Phase 6 (t >= 1): Back armour disappears
    if (t >= 1) {
      back.stage = 'destroyed';
      armourRig.backArmourGroup.visible = false;
      callbacks?.onBackPhase?.('complete', back.breakIntensity);
    }
  }
}

export type ArmourFragmentKind = 'heavy_chunk' | 'small_shard' | 'fastener';

export interface ArmourFragmentBody {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  kind: ArmourFragmentKind;
  vel: THREE.Vector3;
  angVel: THREE.Vector3;
  bounceRestitution: number;
  slideFriction: number;
  bounceCount: number;
  sparkCooldown: number;
  age: number;
  maxLife: number;
  settled: boolean;
}

export const MAX_ARMOUR_FRAGMENTS = 36;

let sharedChunkGeo: THREE.BufferGeometry | null = null;
let sharedShardGeo: THREE.BufferGeometry | null = null;
let sharedFastenerGeo: THREE.BufferGeometry | null = null;

function getFragmentGeo(kind: ArmourFragmentKind): THREE.BufferGeometry {
  if (!sharedChunkGeo) {
    sharedChunkGeo = new THREE.BoxGeometry(0.14, 0.042, 0.16);
  }
  if (!sharedShardGeo) {
    sharedShardGeo = new THREE.TetrahedronGeometry(0.055, 0);
  }
  if (!sharedFastenerGeo) {
    sharedFastenerGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.055, 6);
  }
  if (kind === 'heavy_chunk') return sharedChunkGeo;
  if (kind === 'fastener') return sharedFastenerGeo;
  return sharedShardGeo;
}

export function spawnArmourFragments(
  scene: THREE.Scene,
  pool: ArmourFragmentBody[],
  origin: THREE.Vector3,
  outwardDirWorld: THREE.Vector3,
  armorColorHex: number,
  trimColorHex: number,
  mode: 'sparks_shards' | 'chest_shatter' | 'fasteners' | 'back_shatter',
  intensity = 1
): void {
  const specs: { kind: ArmourFragmentKind; count: number }[] =
    mode === 'sparks_shards'
      ? [{ kind: 'small_shard', count: 5 }]
      : mode === 'fasteners'
        ? [
            { kind: 'fastener', count: 4 },
            { kind: 'small_shard', count: 3 },
          ]
        : [
            { kind: 'heavy_chunk', count: 4 },
            { kind: 'small_shard', count: 6 },
          ];

  const baseDir = outwardDirWorld.clone();
  if (baseDir.lengthSq() < 0.01) baseDir.set(0, 0.2, 1);
  baseDir.normalize();

  for (const spec of specs) {
    for (let i = 0; i < spec.count; i++) {
      // Enforce bounded pool for steady frame performance
      if (pool.length >= MAX_ARMOUR_FRAGMENTS) {
        const oldest = pool.shift();
        if (oldest) {
          scene.remove(oldest.mesh);
          oldest.mat.dispose();
        }
      }

      const useTrim = spec.kind === 'fastener' || i % 2 === 1;
      const mat = new THREE.MeshStandardMaterial({
        color: useTrim ? trimColorHex : armorColorHex,
        metalness: 0.78,
        roughness: 0.34,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(getFragmentGeo(spec.kind), mat);
      const scaleJitter = 0.78 + Math.random() * 0.48;
      if (spec.kind === 'heavy_chunk') {
        mesh.scale.set(scaleJitter, 0.8 + Math.random() * 0.4, scaleJitter);
      } else {
        mesh.scale.setScalar(scaleJitter);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(
        origin.x + (Math.random() - 0.5) * 0.24,
        origin.y + (Math.random() - 0.5) * 0.22,
        origin.z + (Math.random() - 0.5) * 0.24
      );
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      scene.add(mesh);

      const speedBase =
        spec.kind === 'heavy_chunk'
          ? 2.2 + Math.random() * 1.9
          : spec.kind === 'fastener'
            ? 3.8 + Math.random() * 2.4
            : 3.4 + Math.random() * 3.1;
      const speed = speedBase * (0.75 + intensity * 0.4);

      const vx = baseDir.x * speed + (Math.random() - 0.5) * 2.8;
      const vy =
        (spec.kind === 'heavy_chunk' ? 0.6 + Math.random() * 1.5 : 1.4 + Math.random() * 2.6) *
        (0.8 + intensity * 0.25);
      const vz = baseDir.z * speed + (Math.random() - 0.5) * 2.8;

      pool.push({
        mesh,
        mat,
        kind: spec.kind,
        vel: new THREE.Vector3(vx, vy, vz),
        angVel: new THREE.Vector3(
          (Math.random() - 0.5) * (spec.kind === 'heavy_chunk' ? 8 : 16),
          (Math.random() - 0.5) * (spec.kind === 'heavy_chunk' ? 8 : 16),
          (Math.random() - 0.5) * (spec.kind === 'heavy_chunk' ? 8 : 16)
        ),
        bounceRestitution: spec.kind === 'heavy_chunk' ? 0.18 : 0.44,
        slideFriction: spec.kind === 'heavy_chunk' ? 6.8 : 4.2,
        bounceCount: 0,
        sparkCooldown: 0,
        age: 0,
        maxLife: spec.kind === 'heavy_chunk' ? 14.0 : 10.5,
        settled: false,
      });
    }
  }
}

export interface FragmentCollisionCallbacks {
  groundHeightAt: (x: number, z: number, currentY?: number, maxStepUp?: number) => number;
  resolveHorizontalCollision: (
    x: number,
    z: number,
    y: number,
    radius: number,
    height?: number
  ) => { x: number; z: number; hit: boolean };
  onSurfaceImpact?: (pos: THREE.Vector3, speed: number, kind: ArmourFragmentKind) => void;
}

export function updateArmourFragments(
  scene: THREE.Scene,
  pool: ArmourFragmentBody[],
  dt: number,
  cb: FragmentCollisionCallbacks
): void {
  const gravity = 18.5;
  for (let i = pool.length - 1; i >= 0; i--) {
    const f = pool[i];
    f.age += dt;
    if (f.sparkCooldown > 0) f.sparkCooldown = Math.max(0, f.sparkCooldown - dt);

    if (f.age >= f.maxLife) {
      scene.remove(f.mesh);
      f.mat.dispose();
      pool.splice(i, 1);
      continue;
    }

    // Smooth fade out in last 2.2 seconds
    const remaining = f.maxLife - f.age;
    if (remaining < 2.2) {
      f.mat.opacity = Math.max(0, remaining / 2.2);
    }

    if (!f.settled) {
      f.vel.y -= gravity * dt;

      const prevX = f.mesh.position.x;
      const prevZ = f.mesh.position.z;
      const candX = prevX + f.vel.x * dt;
      const candZ = prevZ + f.vel.z * dt;
      const radius = f.kind === 'heavy_chunk' ? 0.09 : 0.05;
      const col = cb.resolveHorizontalCollision(candX, candZ, f.mesh.position.y, radius, 0.25);

      if (col.hit) {
        const horizSpeed = Math.hypot(f.vel.x, f.vel.z);
        if (Math.abs(col.x - candX) > 0.002) f.vel.x *= -0.42;
        if (Math.abs(col.z - candZ) > 0.002) f.vel.z *= -0.42;
        if (horizSpeed > 2.2 && f.sparkCooldown <= 0) {
          f.sparkCooldown = 0.14;
          cb.onSurfaceImpact?.(f.mesh.position, horizSpeed, f.kind);
        }
      }
      f.mesh.position.x = col.x;
      f.mesh.position.z = col.z;
      f.mesh.position.y += f.vel.y * dt;

      const floorY = cb.groundHeightAt(f.mesh.position.x, f.mesh.position.z, f.mesh.position.y + 0.15, 0.45);
      const halfThick = f.kind === 'heavy_chunk' ? 0.024 : 0.022;
      if (f.mesh.position.y <= floorY + halfThick) {
        f.mesh.position.y = floorY + halfThick;
        const impactVy = Math.abs(f.vel.y);
        if (impactVy > 1.35 && f.bounceCount < 4) {
          f.vel.y = impactVy * f.bounceRestitution;
          f.vel.x *= 0.74;
          f.vel.z *= 0.74;
          f.angVel.multiplyScalar(0.65);
          f.bounceCount += 1;
          if (impactVy > 2.1 && f.sparkCooldown <= 0) {
            f.sparkCooldown = 0.12;
            cb.onSurfaceImpact?.(f.mesh.position, impactVy, f.kind);
          }
        } else {
          f.vel.y = 0;
          const drag = Math.exp(-f.slideFriction * dt);
          f.vel.x *= drag;
          f.vel.z *= drag;
          f.angVel.multiplyScalar(drag);
          // Lay heavy plates flatter as they rest
          if (f.kind === 'heavy_chunk') {
            f.mesh.rotation.x = THREE.MathUtils.damp(f.mesh.rotation.x, 0, 8, dt);
            f.mesh.rotation.z = THREE.MathUtils.damp(f.mesh.rotation.z, 0, 8, dt);
          }
          if (Math.hypot(f.vel.x, f.vel.z) < 0.06) {
            f.vel.set(0, 0, 0);
            f.angVel.set(0, 0, 0);
            f.settled = true;
          }
        }
      }

      f.mesh.rotation.x += f.angVel.x * dt;
      f.mesh.rotation.y += f.angVel.y * dt;
      f.mesh.rotation.z += f.angVel.z * dt;
    }
  }
}

export function disposeArmourFragments(scene: THREE.Scene, pool: ArmourFragmentBody[]): void {
  for (const f of pool) {
    scene.remove(f.mesh);
    f.mat.dispose();
  }
  pool.length = 0;
}
