import * as THREE from 'three';
import { MONSTER_PROFILES } from './monsterAI';
import { EnemyModelRefs } from './models';
import {
  EnemyAIState,
  EnemyType,
  MonsterAnimStateName,
  MonsterAttackKind,
  MonsterWeightClass,
} from './types';

export interface MonsterAnimationState {
  animState: MonsterAnimStateName;
  stridePhase: number;
  lastStepIndex: number;
  smoothedSpeed: number;
  runBlend: number;
  attackKind: MonsterAttackKind;
  attackElapsed: number;
  attackDuration: number;
  attackWindupFired: boolean;
  attackHitFired: boolean;
  staggerTimer: number;
  staggerDuration: number;
  staggerZone: string;
  staggerSign: number;
  idleVariant: number;
  idleTimer: number;
  deathTimer: number;
  deathStarted: boolean;
  deathDir: number;
  sparkTimer: number;
  bodyBob: number;
  torsoPitch: number;
  torsoRoll: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  jawOpen: number;
  jawSnapFired: boolean;
  alertFlareTimer: number;
  hurtEyeTimer: number;
  prevTargetX: number;
  prevTargetZ: number;
  lastAiState: EnemyAIState;
  coreIntensity: number;
  lodTick: number;
  bossSpecialFlags: number;
  regenIntensity: number;
  muscleTension: number;
  smoothedSlopePitch: number;
}

export function createMonsterAnimState(): MonsterAnimationState {
  return {
    animState: 'IDLE',
    stridePhase: Math.random() * Math.PI * 2,
    lastStepIndex: 0,
    smoothedSpeed: 0,
    runBlend: 0,
    attackKind: 'claw',
    attackElapsed: 0,
    attackDuration: 0.9,
    attackWindupFired: false,
    attackHitFired: false,
    staggerTimer: 0,
    staggerDuration: 0.35,
    staggerZone: 'body',
    staggerSign: 1,
    idleVariant: Math.floor(Math.random() * 4),
    idleTimer: 2 + Math.random() * 3,
    deathTimer: 0,
    deathStarted: false,
    deathDir: Math.random() > 0.5 ? 1 : -1,
    sparkTimer: 0.5,
    bodyBob: 0,
    torsoPitch: 0,
    torsoRoll: 0,
    headYaw: 0,
    headPitch: 0,
    headRoll: 0,
    jawOpen: 0,
    jawSnapFired: false,
    alertFlareTimer: 0,
    hurtEyeTimer: 0,
    prevTargetX: 0,
    prevTargetZ: 0,
    lastAiState: 'PATROL',
    coreIntensity: 2.0,
    lodTick: 0,
    bossSpecialFlags: 0,
    regenIntensity: 0,
    muscleTension: 0.18,
    smoothedSlopePitch: 0,
  };
}

export function triggerMonsterAttack(
  anim: MonsterAnimationState,
  kind: MonsterAttackKind,
  weightClass: MonsterWeightClass
): void {
  anim.animState = 'ATTACK';
  anim.attackKind = kind;
  anim.attackElapsed = 0;
  anim.attackWindupFired = false;
  anim.attackHitFired = false;
  anim.bossSpecialFlags = 0;

  if (kind === 'titanic_stomp') {
    anim.attackDuration = 1.65;
    return;
  }
  if (kind === 'tentacle_sweep') {
    anim.attackDuration = 1.48;
    return;
  }
  if (kind === 'ground_crusher') {
    anim.attackDuration = 1.62;
    return;
  }
  if (kind === 'gravity_pulse') {
    anim.attackDuration = 1.88;
    return;
  }
  if (kind === 'parasite_regen') {
    anim.attackDuration = 2.25;
    return;
  }
  if (kind === 'tentacle_grab') {
    anim.attackDuration = 1.54;
    return;
  }
  if (kind === 'claw_strike') {
    anim.attackDuration = 0.84;
    return;
  }
  if (kind === 'tentacle_lash') {
    anim.attackDuration = 0.96;
    return;
  }
  if (kind === 'leap_attack') {
    anim.attackDuration = 1.12;
    return;
  }
  if (kind === 'grab_throw') {
    anim.attackDuration = 1.24;
    return;
  }
  if (kind === 'frenzied_attack') {
    anim.attackDuration = 1.16;
    return;
  }

  const weightScale =
    weightClass === 'boss'
      ? 1.38
      : weightClass === 'large'
        ? 1.18
        : weightClass === 'small'
          ? 0.78
          : 1.0;

  const baseDur =
    kind === 'heavy_slam'
      ? 1.15
      : kind === 'charge'
        ? 1.05
        : kind === 'grab'
          ? 1.08
          : kind === 'tendril'
            ? 0.92
            : kind === 'bite'
              ? 0.76
              : 0.82;

  anim.attackDuration = baseDur * weightScale;
}

export function triggerMonsterStagger(
  anim: MonsterAnimationState,
  hitZone: string,
  lateralSign: number,
  isHeavyHit: boolean
): void {
  anim.staggerZone = hitZone;
  anim.staggerSign = lateralSign >= 0 ? 1 : -1;
  anim.staggerDuration = isHeavyHit ? 0.56 : 0.36;
  anim.staggerTimer = anim.staggerDuration;
  anim.hurtEyeTimer = isHeavyHit ? 0.72 : 0.52;
  // Interrupt Titanforged parasite_regen cleanly if head/neck takes heavy stagger
  if (anim.animState === 'ATTACK' && anim.attackKind === 'parasite_regen' && (isHeavyHit || hitZone === 'head' || hitZone === 'neck')) {
    anim.animState = 'STAGGER';
    anim.attackElapsed = anim.attackDuration;
  }
}

export interface MonsterAnimUpdateParams {
  dt: number;
  time: number;
  type: EnemyType;
  aiState: EnemyAIState;
  position: THREE.Vector3;
  yaw: number;
  actualHorizMoved: number;
  turnRate: number;
  targetPos: THREE.Vector3;
  healthRatio: number;
  legDamaged: boolean;
  isScreaming: boolean;
  isVocalizing?: boolean;
  distToCam: number;
  bossPhase: number;
  onFootstep?: (weight: MonsterWeightClass, speedRatio: number) => void;
  onAttackWindup?: (kind: MonsterAttackKind) => void;
  onAttackHit?: (kind: MonsterAttackKind, damageMult: number, reachBonus: number) => void;
  onJawSnap?: () => void;
  onMechSpark?: (pos: THREE.Vector3) => void;
  onBossSpecialEffect?: (event: string, kind: MonsterAttackKind, worldPos: THREE.Vector3) => void;
  frozen?: boolean;
  slopePitch?: number;
  onStairs?: boolean;
  onEscalator?: boolean;
  escalatorSpeed?: number;
  verticalVel?: number;
  grounded?: boolean;
}

function updateMonsterEyes(
  refs: EnemyModelRefs,
  anim: MonsterAnimationState,
  params: MonsterAnimUpdateParams
): void {
  const rigs = refs.eyeRigs;
  if (!rigs || rigs.length === 0) return;

  const { dt, time, aiState, position, yaw, targetPos, healthRatio } = params;
  const isDead = aiState === 'DEAD';
  const isAlert = aiState === 'CHASE' || aiState === 'ATTACK' || aiState === 'BOSS_INTRO';
  const isSearch = aiState === 'SEARCH';

  if (anim.alertFlareTimer > 0) anim.alertFlareTimer = Math.max(0, anim.alertFlareTimer - dt);
  if (anim.hurtEyeTimer > 0) anim.hurtEyeTimer = Math.max(0, anim.hurtEyeTimer - dt);

  // Target-switch rapid saccade detection
  const targetShift = Math.hypot(targetPos.x - anim.prevTargetX, targetPos.z - anim.prevTargetZ);
  const bigSwitch = targetShift > 3.5;
  anim.prevTargetX = targetPos.x;
  anim.prevTargetZ = targetPos.z;

  // Compute relative gaze direction toward target
  const dx = targetPos.x - position.x;
  const dz = targetPos.z - position.z;
  const horiz = Math.hypot(dx, dz) || 1;
  let relYaw = Math.atan2(dx, dz) - yaw - anim.headYaw;
  while (relYaw > Math.PI) relYaw -= Math.PI * 2;
  while (relYaw < -Math.PI) relYaw += Math.PI * 2;
  const estHeadY = position.y + 1.85;
  const targetPitch = Math.atan2(targetPos.y + 1.45 - estHeadY, horiz);

  for (let i = 0; i < rigs.length; i++) {
    const eye = rigs[i];

    // 1. Irregular randomized blinking + occasional double-blink
    if (!isDead) {
      if (eye.blinkPhase > 0) {
        eye.blinkPhase = Math.max(0, eye.blinkPhase - dt * (eye.isMech ? 8.2 : 6.4));
      } else {
        eye.nextBlinkTime -= dt;
        if (eye.nextBlinkTime <= 0) {
          eye.blinkPhase = 1;
          if (!eye.doubleBlinkPending && Math.random() < 0.22) {
            eye.doubleBlinkPending = true;
            eye.nextBlinkTime = 0.22;
          } else {
            eye.doubleBlinkPending = false;
            eye.nextBlinkTime = (isAlert ? 3.2 : 1.8) + Math.random() * 4.5;
          }
        }
      }
    }

    // 2. Micro-saccades & confused search darting
    eye.saccadeTimer -= dt;
    if (eye.saccadeTimer <= 0 || bigSwitch) {
      eye.saccadeTimer = isSearch ? 0.28 + Math.random() * 0.45 : 0.7 + Math.random() * 1.9;
      const spread = isSearch ? 0.36 : isAlert ? 0.08 : 0.26;
      eye.saccadeYaw = (Math.random() - 0.5) * spread + (i % 2 === 1 && healthRatio < 0.45 ? 0.12 : 0);
      eye.saccadePitch = (Math.random() - 0.5) * spread * 0.6;
    }

    // Desired eye pivot gaze
    let desiredYaw = eye.saccadeYaw;
    let desiredPitch = eye.saccadePitch;
    if (!isDead && (isAlert || isSearch)) {
      desiredYaw = THREE.MathUtils.clamp(relYaw + eye.saccadeYaw + eye.asymmetryOffset, -0.44, 0.44);
      desiredPitch = THREE.MathUtils.clamp(-targetPitch * 0.55 + eye.saccadePitch, -0.32, 0.32);
    } else if (isDead) {
      desiredYaw = eye.asymmetryOffset;
      desiredPitch = 0.26;
    }

    const trackSpeed = bigSwitch ? 26 : isAlert ? 18 : 9;
    eye.eyeballPivot.rotation.y = THREE.MathUtils.damp(eye.eyeballPivot.rotation.y, desiredYaw, trackSpeed, dt);
    eye.eyeballPivot.rotation.x = THREE.MathUtils.damp(eye.eyeballPivot.rotation.x, desiredPitch, trackSpeed, dt);

    // 3. Eyelids / Mechanical Shutters (open, aggressive squint, damaged squint, blink, dead shut)
    const blinkAmt = isDead ? 1 : Math.sin(eye.blinkPhase * Math.PI);
    const dmgSquint = !isDead && healthRatio < 0.45 && i % 2 === 1 ? 0.32 : 0;
    const rageSquint = !isDead && isAlert && anim.alertFlareTimer <= 0 ? 0.18 : 0;
    const hurtFlap = !isDead && anim.hurtEyeTimer > 0 ? 0.48 * (anim.hurtEyeTimer / 0.55) : 0;
    const flareWide = !isDead && anim.alertFlareTimer > 0 ? -0.24 : 0;
    const closeFactor = THREE.MathUtils.clamp(blinkAmt + dmgSquint + rageSquint + hurtFlap + flareWide, 0, 1);

    if (eye.upperLid) {
      const targetUpper = THREE.MathUtils.lerp(-0.88, -0.05, closeFactor);
      eye.upperLid.rotation.x = THREE.MathUtils.damp(eye.upperLid.rotation.x, targetUpper, isDead ? 4.5 : 24, dt);
    }
    if (eye.lowerLid) {
      const targetLower = THREE.MathUtils.lerp(0.82, 0.05, closeFactor);
      eye.lowerLid.rotation.x = THREE.MathUtils.damp(eye.lowerLid.rotation.x, targetLower, isDead ? 4.5 : 24, dt);
    }
    if (eye.shutterRing) {
      const targetShutterRot = (isDead ? 0.95 : closeFactor * 0.65) + (isAlert ? time * 0.45 : 0);
      eye.shutterRing.rotation.z = THREE.MathUtils.damp(eye.shutterRing.rotation.z, targetShutterRot, 14, dt);
      const shutterScale = isDead ? 0.65 : THREE.MathUtils.lerp(1.06, 0.72, closeFactor * 0.6);
      eye.shutterRing.scale.setScalar(shutterScale);
    }

    // 4. Eye Glow Intensity & Pupil Focus Reaction
    let targetIntensity = eye.baseIntensity;
    if (isDead) {
      targetIntensity = eye.isMech ? 0.02 : 0.08;
    } else if (anim.alertFlareTimer > 0) {
      targetIntensity = eye.baseIntensity * 1.65;
    } else if (isAlert) {
      targetIntensity = eye.baseIntensity * 1.28;
    } else if (isSearch) {
      targetIntensity = eye.baseIntensity * (0.95 + Math.sin(time * 8 + i) * 0.18);
    } else {
      targetIntensity = eye.baseIntensity * 0.75;
    }

    // Damaged malfunction flicker on low health
    if (!isDead && healthRatio < 0.45 && i % 2 === 1 && Math.sin(time * 29 + i * 3) > 0.68) {
      targetIntensity *= 0.2;
    }
    if (!isDead && anim.hurtEyeTimer > 0) {
      targetIntensity *= 0.4 + Math.abs(Math.sin(time * 40)) * 1.1;
    }

    eye.mat.emissiveIntensity = THREE.MathUtils.damp(
      eye.mat.emissiveIntensity,
      targetIntensity,
      isDead ? 3.5 : 16,
      dt
    );
    const irisScale = isDead ? 0.75 : anim.alertFlareTimer > 0 ? 1.22 : isAlert ? 1.1 : 0.96;
    eye.irisMesh.scale.set(irisScale, irisScale, 0.45 * irisScale);
  }
}

export function updateMonsterAnimations(
  refs: EnemyModelRefs,
  anim: MonsterAnimationState,
  params: MonsterAnimUpdateParams
): void {
  const {
    dt,
    time,
    type,
    aiState,
    position,
    yaw,
    actualHorizMoved,
    turnRate,
    targetPos,
    healthRatio,
    legDamaged,
    isScreaming,
    distToCam,
    bossPhase,
  } = params;

  const profile = MONSTER_PROFILES[type];
  const weight = profile.weightClass;

  // Trigger detection flare when transitioning from patrol/hiding/search into active pursuit/attack
  if (
    (anim.lastAiState === 'PATROL' || anim.lastAiState === 'HIDING' || anim.lastAiState === 'SEARCH') &&
    (aiState === 'CHASE' || aiState === 'ATTACK' || aiState === 'BOSS_INTRO')
  ) {
    anim.alertFlareTimer = 0.65;
  }
  anim.lastAiState = aiState;

  // LOD cull for ultra-distant ambient monsters (bosses always update)
  if (!profile.isBoss && distToCam > 88) {
    anim.lodTick += 1;
    if (anim.lodTick % 4 !== 0) return;
  }

  // Solo Educational Reading Freeze: lock position/animations calmly in idle pose
  if (params.frozen && aiState !== 'DEAD') {
    anim.animState = 'IDLE';
    anim.smoothedSpeed = 0;
    anim.runBlend = 0;
    if (refs.group) {
      refs.group.position.y = position.y;
    }
    if (refs.torsoPulse) {
      refs.torsoPulse.rotation.x = THREE.MathUtils.damp(refs.torsoPulse.rotation.x, 0.06, 12, Math.max(dt, 0.016));
      refs.torsoPulse.rotation.z = THREE.MathUtils.damp(refs.torsoPulse.rotation.z, 0, 12, Math.max(dt, 0.016));
    }
    for (let i = 0; i < refs.legRigs.length; i++) {
      const leg = refs.legRigs[i];
      const axis = leg.hipAxis ?? 'x';
      leg.hip.rotation[axis] = THREE.MathUtils.damp(leg.hip.rotation[axis], leg.baseHipX, 12, Math.max(dt, 0.016));
      leg.knee.rotation.x = THREE.MathUtils.damp(leg.knee.rotation.x, leg.baseKneeX, 12, Math.max(dt, 0.016));
    }
    for (let i = 0; i < refs.armRigs.length; i++) {
      const arm = refs.armRigs[i];
      arm.shoulder.rotation.x = THREE.MathUtils.damp(arm.shoulder.rotation.x, arm.baseShoulderX, 12, Math.max(dt, 0.016));
      arm.elbow.rotation.x = THREE.MathUtils.damp(arm.elbow.rotation.x, arm.baseElbowX, 12, Math.max(dt, 0.016));
    }
    return;
  }

  // Always update 3D eyes/eyelids so death shutdown and nearby tracking look fluid
  if (distToCam < 60) {
    updateMonsterEyes(refs, anim, params);
  }

  // -------------------------------------------------------------------------
  // 1. DEATH ANIMATION SYSTEM (Weight, Species & Ramp-Ground Aware)
  // -------------------------------------------------------------------------
  if (aiState === 'DEAD') {
    anim.animState = 'DEAD';
    anim.deathTimer += dt;
    const t = Math.min(1, anim.deathTimer / (weight === 'boss' ? 1.7 : weight === 'large' ? 1.25 : 0.8));

    // Dim eyes, parasite cores & regen nodes on death (especially critical for Infected Mechs)
    if (refs.coreMaterials) {
      const targetGlow = profile.isMech ? 0.04 : 0.15;
      for (let i = 0; i < refs.coreMaterials.length; i++) {
        refs.coreMaterials[i].emissiveIntensity = THREE.MathUtils.damp(
          refs.coreMaterials[i].emissiveIntensity,
          targetGlow,
          profile.isMech ? 5.5 : 3.5,
          dt
        );
      }
    }
    if (refs.regenMat) {
      refs.regenMat.emissiveIntensity = THREE.MathUtils.damp(refs.regenMat.emissiveIntensity, 0.03, 5.0, dt);
    }

    // Mech death spark burst during power failure
    if (profile.isMech && t < 0.72) {
      anim.sparkTimer -= dt;
      if (anim.sparkTimer <= 0) {
        anim.sparkTimer = 0.18 + Math.random() * 0.15;
        params.onMechSpark?.(position);
      }
    }

    // Smoothly settle corpse cleanly onto the actual current ground/stair slope (zero floating or floor clipping)
    const slopeOffset = THREE.MathUtils.clamp(params.slopePitch ?? 0, -0.42, 0.42) * 0.45;
    if (weight === 'small') {
      refs.group.rotation.x = THREE.MathUtils.damp(refs.group.rotation.x, Math.PI * 0.48 + slopeOffset, 10, dt);
      refs.group.rotation.z = THREE.MathUtils.damp(refs.group.rotation.z, anim.deathDir * 0.5, 9, dt);
      refs.group.position.y = THREE.MathUtils.damp(refs.group.position.y, position.y + 0.18, 10, dt);
      refs.legRigs.forEach((leg, i) => {
        const curl = Math.sin(anim.deathTimer * 24 + i) * (1 - t) * 0.4;
        leg.hip.rotation.x = THREE.MathUtils.damp(leg.hip.rotation.x, 0.8 + curl, 12, dt);
        leg.knee.rotation.x = THREE.MathUtils.damp(leg.knee.rotation.x, -0.9, 12, dt);
      });
    } else if (weight === 'large' || weight === 'boss') {
      const phase1 = Math.min(1, t / 0.45);
      const phase2 = Math.max(0, (t - 0.42) / 0.58);
      const dropY = THREE.MathUtils.lerp(0, -0.45, phase1);
      const mechShutdownJitter =
        (type === 'titanforged' || profile.isMech) && t < 0.62 ? Math.sin(anim.deathTimer * 34) * 0.045 * (1 - t) : 0;
      refs.group.position.y = THREE.MathUtils.damp(
        refs.group.position.y,
        phase2 > 0.1 ? position.y + 0.32 : position.y + dropY,
        6,
        dt
      );
      refs.group.rotation.x = THREE.MathUtils.damp(
        refs.group.rotation.x,
        phase2 * (Math.PI * 0.48 + slopeOffset) + mechShutdownJitter,
        5.5,
        dt
      );
      refs.group.rotation.z = THREE.MathUtils.damp(
        refs.group.rotation.z,
        anim.deathDir * phase2 * 0.24,
        5,
        dt
      );
      refs.legRigs.forEach((leg) => {
        leg.hip.rotation.x = THREE.MathUtils.damp(leg.hip.rotation.x, -0.75 * phase1, 7, dt);
        leg.knee.rotation.x = THREE.MathUtils.damp(leg.knee.rotation.x, 1.15 * phase1, 7, dt);
      });
    } else {
      const jitter = profile.isMech && t < 0.5 ? Math.sin(anim.deathTimer * 36) * 0.08 * (1 - t) : 0;
      refs.group.rotation.x = THREE.MathUtils.damp(
        refs.group.rotation.x,
        Math.PI * 0.47 + slopeOffset + jitter,
        profile.isMech ? 5 : 7.5,
        dt
      );
      refs.group.rotation.z = THREE.MathUtils.damp(refs.group.rotation.z, anim.deathDir * 0.25, 6, dt);
      refs.group.position.y = THREE.MathUtils.damp(refs.group.position.y, position.y + 0.22, 7, dt);
      refs.armRigs.forEach((arm) => {
        arm.shoulder.rotation.x = THREE.MathUtils.damp(arm.shoulder.rotation.x, 0.55, 6, dt);
      });
    }

    if (refs.torsoPulse) {
      // Relax chest contraction completely after death spasm fades
      const spasm = t < 0.65 ? Math.sin(anim.deathTimer * 28) * 0.025 * (1 - t) : 0;
      refs.torsoPulse.scale.set(1 + spasm, 1 - spasm * 0.5, 1 + spasm);
    }
    if (refs.jawGroup) {
      refs.jawGroup.rotation.x = THREE.MathUtils.damp(refs.jawGroup.rotation.x, 0.22, 5, dt);
    }
    refs.mandibleFlaps.forEach((mf) => {
      mf.mesh.rotation[mf.axis] = THREE.MathUtils.damp(mf.mesh.rotation[mf.axis], mf.baseRot, 6, dt);
    });
    return;
  }

  // -------------------------------------------------------------------------
  // 2. DETERMINE ACTIVE ANIMATION STATE
  // -------------------------------------------------------------------------
  const instSpeed = dt > 0.0005 ? actualHorizMoved / dt : 0;
  anim.smoothedSpeed = THREE.MathUtils.damp(anim.smoothedSpeed, instSpeed, 11, dt);
  const isMoving = anim.smoothedSpeed > 0.25;
  const runNorm = THREE.MathUtils.clamp(
    (anim.smoothedSpeed - profile.walkSpeed) / Math.max(0.5, profile.runSpeed - profile.walkSpeed),
    0,
    1
  );
  anim.runBlend = THREE.MathUtils.damp(anim.runBlend, runNorm, 8, dt);

  if (anim.staggerTimer > 0) {
    anim.staggerTimer = Math.max(0, anim.staggerTimer - dt);
  }

  let attackProgress = 0;
  let attackActive = false;
  if (anim.animState === 'ATTACK') {
    anim.attackElapsed += dt;
    attackProgress = anim.attackElapsed / Math.max(0.1, anim.attackDuration);
    if (!anim.attackWindupFired && attackProgress >= 0.04) {
      anim.attackWindupFired = true;
      anim.jawSnapFired = false;
      params.onAttackWindup?.(anim.attackKind);
    }
    if (!anim.jawSnapFired && anim.attackKind === 'bite' && attackProgress >= 0.54) {
      anim.jawSnapFired = true;
      params.onJawSnap?.();
    }

    // Specialized 3-stage Titanforged & Hollow Dweller event triggers
    if (params.onBossSpecialEffect) {
      const k = anim.attackKind;
      if (k === 'titanic_stomp' && (anim.bossSpecialFlags & 1) === 0 && attackProgress >= 0.42) {
        anim.bossSpecialFlags |= 1;
        params.onBossSpecialEffect('stomp_impact', k, position);
      } else if (k === 'tentacle_sweep' && (anim.bossSpecialFlags & 1) === 0 && attackProgress >= 0.45) {
        anim.bossSpecialFlags |= 1;
        params.onBossSpecialEffect('sweep_hit', k, position);
      } else if (k === 'ground_crusher' && (anim.bossSpecialFlags & 1) === 0 && attackProgress >= 0.44) {
        anim.bossSpecialFlags |= 1;
        params.onBossSpecialEffect('crusher_impact', k, position);
      } else if (k === 'gravity_pulse') {
        if ((anim.bossSpecialFlags & 1) === 0 && attackProgress >= 0.12) {
          anim.bossSpecialFlags |= 1;
          params.onBossSpecialEffect('gravity_charge', k, position);
        }
        if ((anim.bossSpecialFlags & 2) === 0 && attackProgress >= 0.52) {
          anim.bossSpecialFlags |= 2;
          params.onBossSpecialEffect('gravity_release', k, position);
        }
      } else if (k === 'parasite_regen') {
        if ((anim.bossSpecialFlags & 1) === 0 && attackProgress >= 0.15) {
          anim.bossSpecialFlags |= 1;
          params.onBossSpecialEffect('regen_pulse', k, position);
        }
        if ((anim.bossSpecialFlags & 2) === 0 && attackProgress >= 0.78) {
          anim.bossSpecialFlags |= 2;
          params.onBossSpecialEffect('regen_heal', k, position);
        }
      } else if (k === 'tentacle_grab' || k === 'grab_throw') {
        if ((anim.bossSpecialFlags & 1) === 0 && attackProgress >= 0.4) {
          anim.bossSpecialFlags |= 1;
          params.onBossSpecialEffect('grab_reach', k, position);
        }
        if ((anim.bossSpecialFlags & 2) === 0 && attackProgress >= 0.64) {
          anim.bossSpecialFlags |= 2;
          params.onBossSpecialEffect('grab_release', k, position);
        }
      } else if (k === 'leap_attack') {
        if ((anim.bossSpecialFlags & 1) === 0 && attackProgress >= 0.3) {
          anim.bossSpecialFlags |= 1;
          params.onBossSpecialEffect('hollow_leap_launch', k, position);
        }
        if ((anim.bossSpecialFlags & 2) === 0 && attackProgress >= 0.66) {
          anim.bossSpecialFlags |= 2;
          params.onBossSpecialEffect('hollow_leap_land', k, position);
        }
      } else if (k === 'frenzied_attack') {
        if ((anim.bossSpecialFlags & 1) === 0 && attackProgress >= 0.36) {
          anim.bossSpecialFlags |= 1;
          params.onBossSpecialEffect('hollow_frenzy_slash', k, position);
        }
        if ((anim.bossSpecialFlags & 2) === 0 && attackProgress >= 0.54) {
          anim.bossSpecialFlags |= 2;
          params.onBossSpecialEffect('hollow_frenzy_slash', k, position);
        }
        if ((anim.bossSpecialFlags & 4) === 0 && attackProgress >= 0.72) {
          anim.bossSpecialFlags |= 4;
          params.onBossSpecialEffect('hollow_frenzy_slash', k, position);
        }
      }
    }

    if (!anim.attackHitFired && attackProgress >= 0.46) {
      anim.attackHitFired = true;
      const isSpecialHandled =
        anim.attackKind === 'titanic_stomp' ||
        anim.attackKind === 'ground_crusher' ||
        anim.attackKind === 'gravity_pulse' ||
        anim.attackKind === 'parasite_regen' ||
        anim.attackKind === 'tentacle_grab' ||
        anim.attackKind === 'grab_throw' ||
        anim.attackKind === 'leap_attack' ||
        anim.attackKind === 'frenzied_attack';

      if (!isSpecialHandled) {
        const dmgMult =
          anim.attackKind === 'heavy_slam'
            ? 1.38
            : anim.attackKind === 'charge'
              ? 1.25
              : anim.attackKind === 'grab'
                ? 1.15
                : anim.attackKind === 'claw_strike'
                  ? 1.12
                  : anim.attackKind === 'tentacle_lash'
                    ? 1.05
                    : anim.attackKind === 'tentacle_sweep'
                      ? 1.28
                      : anim.attackKind === 'tendril'
                        ? 0.92
                        : 1.0;
        const reachBonus =
          anim.attackKind === 'tentacle_sweep'
            ? 3.8
            : anim.attackKind === 'tentacle_lash'
              ? 2.2
              : anim.attackKind === 'claw_strike'
                ? 1.25
                : anim.attackKind === 'tendril'
                  ? 1.55
                  : anim.attackKind === 'charge'
                    ? 1.25
                    : anim.attackKind === 'heavy_slam'
                      ? 1.1
                      : 0.75;
        params.onAttackHit?.(anim.attackKind, dmgMult, reachBonus);
      }
    }
    if (attackProgress >= 1) {
      anim.animState = 'RECOVERY';
    } else {
      attackActive = true;
    }
  }

  if (!attackActive) {
    if (aiState === 'BOSS_INTRO') anim.animState = 'BOSS_INTRO';
    else if (anim.staggerTimer > 0 || aiState === 'STUNNED') anim.animState = 'STAGGER';
    else if (aiState === 'HIDING') anim.animState = 'HIDING';
    else if (aiState === 'RETREAT') anim.animState = 'RETREAT';
    else if (isMoving) anim.animState = anim.runBlend > 0.42 ? 'RUN' : 'WALK';
    else if (Math.abs(turnRate) > 0.85) anim.animState = 'TURN';
    else anim.animState = 'IDLE';
  }

  // Cycle idle behaviors naturally
  if (anim.animState === 'IDLE') {
    anim.idleTimer -= dt;
    if (anim.idleTimer <= 0) {
      anim.idleTimer = 2.6 + Math.random() * 3.4;
      anim.idleVariant = (anim.idleVariant + 1 + Math.floor(Math.random() * 2)) % 4;
    }
  }

  // -------------------------------------------------------------------------
  // 3. ZERO-SLIDE STRIDE PHASE & SYNCHRONIZED FOOTSTEP EMISSION
  // -------------------------------------------------------------------------
  const strideLen = profile.strideLength * (legDamaged ? 0.72 : 1.0);
  if (actualHorizMoved > 0.002) {
    anim.stridePhase += (actualHorizMoved / Math.max(0.4, strideLen)) * Math.PI * 2;
    const stepIdx = Math.floor(anim.stridePhase / Math.PI);
    if (stepIdx !== anim.lastStepIndex) {
      anim.lastStepIndex = stepIdx;
      params.onFootstep?.(weight, THREE.MathUtils.clamp(anim.smoothedSpeed / profile.runSpeed, 0.25, 1.3));
    }
  } else if (anim.animState === 'TURN') {
    // Stepping in place during rapid turns so feet don't slide!
    anim.stridePhase += Math.abs(turnRate) * dt * 2.2;
  }

  // -------------------------------------------------------------------------
  // 4. LOCOMOTION, SLOPE/STAIR/ESCALATOR POSTURE, & MUSCLE TENSION SYNTHESIS
  // -------------------------------------------------------------------------
  const targetTension =
    aiState === 'ATTACK' || anim.animState === 'ATTACK' || anim.animState === 'BOSS_INTRO'
      ? 1.0
      : aiState === 'CHASE' || anim.staggerTimer > 0
        ? 0.78
        : aiState === 'SEARCH' || aiState === 'HIDING'
          ? 0.48
          : 0.18;
  anim.muscleTension = THREE.MathUtils.damp(
    anim.muscleTension,
    targetTension,
    targetTension > anim.muscleTension ? 6.5 : 2.2,
    dt
  );

  const rawSlope = THREE.MathUtils.clamp(params.slopePitch ?? 0, -0.52, 0.52);
  anim.smoothedSlopePitch = THREE.MathUtils.damp(anim.smoothedSlopePitch, rawSlope, 9, dt);
  const onStairs = Boolean(params.onStairs);
  const onEscalator = Boolean(params.onEscalator);
  const airborne = params.grounded === false && Math.abs(params.verticalVel ?? 0) > 1.2;

  const moveFactor = THREE.MathUtils.clamp(anim.smoothedSpeed / Math.max(1, profile.walkSpeed), 0, 1.35);
  let targetTorsoPitch = 0;
  let targetTorsoRoll = 0;
  let targetBodyBob = 0;
  let targetJawOpen = 0.08 + Math.sin(time * 2.2) * 0.05;

  if (anim.animState === 'BOSS_INTRO') {
    targetTorsoPitch = -0.26;
    targetBodyBob = 0.14;
    targetJawOpen = 0.88;
  } else if (anim.animState === 'HIDING') {
    targetTorsoPitch = 0.42;
    targetBodyBob = -0.24;
    targetJawOpen = 0.22;
  } else if (anim.animState === 'RETREAT') {
    targetTorsoPitch = 0.18;
    targetTorsoRoll = Math.sin(anim.stridePhase) * 0.08;
    targetJawOpen = 0.45;
  } else if (anim.animState === 'WALK' || anim.animState === 'RUN') {
    const leanBase =
      weight === 'small'
        ? 0.22
        : weight === 'medium'
          ? 0.16 + anim.runBlend * 0.26
          : weight === 'large' || weight === 'boss'
            ? 0.12 + anim.runBlend * 0.14
            : 0.08 + anim.runBlend * 0.12;
    // Lean forward when ascending stairs/ramps/escalators; brace backward slightly when descending
    const slopeLean = anim.smoothedSlopePitch * (anim.smoothedSlopePitch > 0 ? 0.58 : 0.42);
    targetTorsoPitch = leanBase + slopeLean;
    const rollMag = weight === 'large' || weight === 'boss' ? 0.095 : weight === 'medium' ? 0.065 : 0.04;
    const stairBalanceRoll = onStairs || onEscalator ? 1.22 : 1.0;
    targetTorsoRoll = Math.sin(anim.stridePhase) * rollMag * stairBalanceRoll * Math.min(1, moveFactor);
    const bobMag = weight === 'boss' ? 0.12 : weight === 'large' ? 0.075 : 0.045;
    targetBodyBob =
      Math.abs(Math.sin(anim.stridePhase)) *
      bobMag *
      Math.min(1, moveFactor) *
      (1 + anim.runBlend * 0.4 + (onStairs ? 0.3 : 0));
    if (legDamaged) {
      targetTorsoRoll += 0.16;
      targetBodyBob -= 0.08;
    }
    targetJawOpen = 0.15 + anim.runBlend * 0.35;
  } else {
    // Idle / Escalator ride breathing + subtle disturbing muscular twitches
    const breathAmp = (weight === 'large' || weight === 'boss' ? 0.038 : 0.026) * (1 + anim.muscleTension * 0.55);
    targetBodyBob = Math.sin(time * (2.0 + anim.muscleTension * 2.2)) * breathAmp;
    if (onEscalator) {
      // Natural balance posture while riding escalator steps
      targetTorsoPitch = anim.smoothedSlopePitch * 0.48;
      targetTorsoRoll = Math.sin(time * 2.6) * 0.03;
    } else if (anim.idleVariant === 3) {
      targetTorsoPitch = 0.14;
      targetBodyBob -= 0.08;
    } else if (weight === 'small' && anim.idleVariant === 2) {
      targetTorsoRoll = Math.sin(time * 18) * 0.05;
    }
  }
  if (airborne) {
    targetTorsoPitch += 0.22;
  }

  // -------------------------------------------------------------------------
  // 5. DISTINCT 3-STAGE ATTACK ANIMATION CHOREOGRAPHIES
  // -------------------------------------------------------------------------
  let armAttackL = 0;
  let armAttackR = 0;
  let elbowAttackL = 0;
  let elbowAttackR = 0;
  let armSpread = 0;
  let headStrikePitch = 0;
  let stompLegLift = 0;
  let leapLegBend = 0;

  if (attackActive) {
    const p = attackProgress;
    const windup = p < 0.38 ? Math.sin((p / 0.38) * (Math.PI / 2)) : 0;
    const strike = p >= 0.38 && p < 0.68 ? Math.sin(((p - 0.38) / 0.3) * Math.PI) : 0;
    const recov = p >= 0.68 ? 1 - (p - 0.68) / 0.32 : 0;

    if (anim.attackKind === 'titanic_stomp') {
      // Stage 1 (Prep 0..0.38): raise colossal leg high & lean torso back; Stage 2 (Exec): thunderous stomp; Stage 3: weight settle
      const prepHold = p < 0.38 ? windup : p < 0.45 ? 1 - (p - 0.38) / 0.07 : 0;
      const slamCurve = p >= 0.38 && p < 0.56 ? Math.sin(((p - 0.38) / 0.18) * Math.PI) : 0;
      stompLegLift = prepHold;
      targetTorsoPitch += -0.28 * prepHold + 0.38 * slamCurve + 0.08 * recov;
      targetTorsoRoll += 0.16 * prepHold - 0.14 * slamCurve;
      targetBodyBob += 0.24 * prepHold - 0.32 * slamCurve;
      armAttackL = -0.85 * prepHold + 0.55 * slamCurve;
      armAttackR = -0.55 * prepHold + 0.45 * slamCurve;
      targetJawOpen = 0.78;
    } else if (anim.attackKind === 'tentacle_sweep') {
      targetTorsoPitch += -0.22 * windup + 0.32 * strike;
      targetTorsoRoll += Math.sin(p * Math.PI * 2) * 0.28;
      armSpread = 0.68 * windup - 0.35 * strike;
      targetJawOpen = 0.7;
    } else if (anim.attackKind === 'ground_crusher') {
      armAttackL = -1.95 * windup + 1.65 * strike + 0.45 * recov;
      armAttackR = -1.95 * windup + 1.65 * strike + 0.45 * recov;
      elbowAttackL = -0.6 * windup + 0.5 * strike;
      elbowAttackR = -0.6 * windup + 0.5 * strike;
      targetTorsoPitch += -0.34 * windup + 0.66 * strike + 0.14 * recov;
      targetBodyBob += 0.26 * windup - 0.36 * strike;
      targetJawOpen = 0.92;
    } else if (anim.attackKind === 'gravity_pulse') {
      const charge = p < 0.52 ? Math.sin((p / 0.52) * Math.PI * 0.5) : 0;
      const burst = p >= 0.52 && p < 0.76 ? Math.sin(((p - 0.52) / 0.24) * Math.PI) : 0;
      targetTorsoPitch += -0.32 * charge + 0.28 * burst;
      armSpread = 0.85 * charge + 0.45 * burst;
      armAttackL = -0.65 * charge + 0.45 * burst;
      armAttackR = -0.65 * charge + 0.45 * burst;
      headStrikePitch = -0.36 * charge + 0.24 * burst;
      targetJawOpen = 0.4 + 0.55 * (charge + burst);
    } else if (anim.attackKind === 'parasite_regen') {
      const pulse = Math.sin(p * Math.PI);
      targetTorsoPitch += -0.18 * pulse;
      targetBodyBob += -0.14 * pulse;
      armSpread = -0.38 * pulse;
      armAttackL = -0.45 * pulse;
      armAttackR = -0.45 * pulse;
      targetJawOpen = 0.28 + Math.sin(p * Math.PI * 4) * 0.14;
    } else if (anim.attackKind === 'tentacle_grab' || anim.attackKind === 'grab_throw') {
      armSpread = 0.82 * windup - 0.65 * strike;
      armAttackL = -1.1 * windup + 0.95 * strike;
      armAttackR = -1.1 * windup + 0.95 * strike;
      targetTorsoPitch += -0.16 * windup + 0.38 * strike;
      targetJawOpen = 0.72;
    } else if (anim.attackKind === 'claw_strike') {
      const slash = Math.sin(p * Math.PI * 2);
      armAttackR = -1.48 * windup + 1.55 * strike + 0.3 * recov;
      armAttackL = -0.9 * windup - 1.25 * Math.min(0, slash) + 1.2 * Math.max(0, slash);
      elbowAttackR = -0.92 * windup + 0.72 * strike;
      targetTorsoRoll += -0.26 * windup + 0.38 * strike;
      targetTorsoPitch += 0.32 * strike;
      targetJawOpen = 0.84;
    } else if (anim.attackKind === 'tentacle_lash') {
      targetTorsoPitch += -0.2 * windup + 0.38 * strike;
      targetTorsoRoll += 0.32 * Math.sin(p * Math.PI * 2.5);
      armSpread = 0.52 * windup;
      targetJawOpen = 0.76;
    } else if (anim.attackKind === 'leap_attack') {
      const crouch = p < 0.3 ? Math.sin((p / 0.3) * Math.PI * 0.5) : 0;
      const air = p >= 0.3 && p < 0.68 ? Math.sin(((p - 0.3) / 0.38) * Math.PI) : 0;
      leapLegBend = crouch * 0.85 - air * 0.55;
      targetTorsoPitch += 0.44 * crouch + 0.55 * air;
      targetBodyBob += -0.28 * crouch + 0.58 * air;
      armAttackL = -1.15 * air;
      armAttackR = -1.15 * air;
      armSpread = 0.55 * air;
      targetJawOpen = 0.9;
    } else if (anim.attackKind === 'frenzied_attack') {
      const wave = Math.sin(p * Math.PI * 6);
      armAttackL = wave * 1.45;
      armAttackR = -wave * 1.45;
      elbowAttackL = -0.55 + Math.abs(wave) * 0.65;
      elbowAttackR = -0.55 + Math.abs(wave) * 0.65;
      targetTorsoRoll += wave * 0.34;
      targetTorsoPitch += 0.38;
      targetJawOpen = 0.94;
    } else if (anim.attackKind === 'claw') {
      armAttackR = -1.35 * windup + 1.45 * strike + 0.35 * recov;
      elbowAttackR = -0.85 * windup + 0.65 * strike;
      targetTorsoRoll += -0.22 * windup + 0.34 * strike;
      targetTorsoPitch += -0.1 * windup + 0.35 * strike;
      targetJawOpen = 0.5 + 0.35 * strike;
    } else if (anim.attackKind === 'bite') {
      targetTorsoPitch += -0.25 * windup + 0.52 * strike;
      headStrikePitch = -0.45 * windup + 0.7 * strike;
      targetJawOpen = 0.85 * windup + 0.95 * (1 - strike * 0.8);
      armSpread = 0.35 * windup;
    } else if (anim.attackKind === 'charge') {
      targetTorsoPitch += 0.48 * (windup * 0.4 + strike + recov * 0.3);
      targetBodyBob = -0.14 * windup + 0.08 * strike;
      armAttackL = -0.6 * windup + 0.9 * strike;
      armAttackR = -0.6 * windup + 0.9 * strike;
      targetJawOpen = 0.72;
    } else if (anim.attackKind === 'heavy_slam') {
      armAttackL = -1.75 * windup + 1.55 * strike + 0.4 * recov;
      armAttackR = -1.75 * windup + 1.55 * strike + 0.4 * recov;
      elbowAttackL = -0.5 * windup + 0.45 * strike;
      elbowAttackR = -0.5 * windup + 0.45 * strike;
      targetTorsoPitch += -0.28 * windup + 0.58 * strike;
      targetBodyBob += 0.22 * windup - 0.28 * strike;
      targetJawOpen = 0.85;
    } else if (anim.attackKind === 'grab') {
      armSpread = 0.75 * windup - 0.55 * strike;
      armAttackL = -0.95 * windup + 0.85 * strike;
      armAttackR = -0.95 * windup + 0.85 * strike;
      targetTorsoPitch += 0.26 * strike;
      targetJawOpen = 0.65;
    } else {
      // tendril whip
      targetTorsoPitch += -0.18 * windup + 0.28 * strike;
      targetTorsoRoll += 0.25 * Math.sin(p * Math.PI * 2);
      armSpread = 0.45 * windup;
      targetJawOpen = 0.6;
    }
  }

  // -------------------------------------------------------------------------
  // 6. HIT-ZONE DAMAGE FLINCH / STAGGER OVERLAY
  // -------------------------------------------------------------------------
  let headStrikeYaw = 0;
  let armRecoilL = 0;
  let armRecoilR = 0;
  let legBuckle = 0;

  if (anim.staggerTimer > 0) {
    const sEnv = anim.staggerTimer / Math.max(0.1, anim.staggerDuration);
    const snap = Math.sin(Math.min(1, sEnv) * Math.PI * 0.85) + sEnv * 0.35;
    targetJawOpen = Math.max(targetJawOpen, 0.72 * Math.min(1, sEnv * 1.4));

    if (anim.staggerZone === 'head' || anim.staggerZone === 'neck') {
      headStrikePitch -= 0.78 * snap;
      headStrikeYaw += anim.staggerSign * 0.48 * snap;
      targetTorsoPitch -= 0.34 * snap;
      targetTorsoRoll += anim.staggerSign * 0.24 * snap;
      armRecoilL -= 0.45 * snap;
      armRecoilR -= 0.45 * snap;
    } else if (anim.staggerZone === 'leg') {
      targetBodyBob -= 0.34 * snap;
      targetTorsoRoll += anim.staggerSign * 0.46 * snap;
      targetTorsoPitch += 0.24 * snap;
      legBuckle = 0.68 * snap;
    } else {
      targetTorsoRoll += anim.staggerSign * 0.42 * snap;
      targetTorsoPitch -= 0.28 * snap;
      headStrikePitch -= 0.28 * snap;
      headStrikeYaw += anim.staggerSign * 0.24 * snap;
      if (anim.staggerSign > 0) {
        armRecoilR += 0.72 * snap;
        armRecoilL -= 0.32 * snap;
      } else {
        armRecoilL += 0.72 * snap;
        armRecoilR -= 0.32 * snap;
      }
    }
  }

  // Apply smoothed posture transforms + vocal jaw sync
  const dampRate = profile.isMech ? 15 : 10;
  anim.torsoPitch = THREE.MathUtils.damp(anim.torsoPitch, targetTorsoPitch, dampRate, dt);
  anim.torsoRoll = THREE.MathUtils.damp(anim.torsoRoll, targetTorsoRoll, dampRate, dt);
  anim.bodyBob = THREE.MathUtils.damp(anim.bodyBob, targetBodyBob, dampRate, dt);
  const vocalTarget = params.isVocalizing ? 0.78 + Math.sin(time * 22) * 0.14 : targetJawOpen;
  anim.jawOpen = THREE.MathUtils.damp(anim.jawOpen, isScreaming ? 0.96 : vocalTarget, 15, dt);

  // Subtle vertical weight bob without drifting away from world Y
  if (type !== 'void_walker') {
    refs.group.position.y = position.y + anim.bodyBob;
    // Reset root tilt cleanly while alive (death sequence sets rotation.x/z)
    refs.group.rotation.x = THREE.MathUtils.damp(refs.group.rotation.x, 0, 12, dt);
    refs.group.rotation.z = THREE.MathUtils.damp(refs.group.rotation.z, 0, 12, dt);
  }
  const breathRate = isScreaming ? 12.0 : 2.1 + anim.muscleTension * 3.6;
  const breathWave = Math.sin(time * breathRate);
  if (refs.torsoPulse) {
    refs.torsoPulse.rotation.x = anim.torsoPitch;
    refs.torsoPulse.rotation.z = anim.torsoRoll;
    // Layered biological chest/ribcage breathing + combat muscle contraction ripple
    const baseBreath = type === 'titanforged' ? 0.044 : type === 'hollow_dweller' ? 0.054 : 0.036;
    const tensionFlex = Math.sin(time * (breathRate * 2.3 + 1.1)) * 0.018 * anim.muscleTension;
    const hitTremor = anim.staggerTimer > 0 ? Math.sin(time * 42) * 0.032 : 0;
    const radialScale = 1 + breathWave * (isScreaming ? 0.14 : baseBreath * (1 + anim.muscleTension * 0.65)) + tensionFlex + hitTremor;
    const vertScale = 1 - breathWave * 0.018 * (0.5 + anim.muscleTension) + tensionFlex * 0.6;
    refs.torsoPulse.scale.set(radialScale, vertScale, radialScale);
  }

  // -------------------------------------------------------------------------
  // 7. LEGS & ARMS (HYDRAULIC MECH VS STAIR STEPPING VS ORGANIC MUSCLE)
  // -------------------------------------------------------------------------
  const maxAmp = (legDamaged ? 0.28 : 0.42 + anim.runBlend * 0.22) * THREE.MathUtils.clamp(moveFactor, 0, 1);
  const legDamp = profile.isMech ? 16 : 12;
  const stairLiftBonus = onStairs || onEscalator ? 1.42 : 1.0;

  for (let i = 0; i < refs.legRigs.length; i++) {
    const leg = refs.legRigs[i];
    const phase = anim.stridePhase + leg.phaseOffset;
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const gaitWave = profile.isMech
      ? Math.tanh(s * 1.65)
      : type === 'crawler' || type === 'hollow_dweller'
        ? s * (1 + anim.runBlend * 0.25)
        : s;
    const limpFactor = legDamaged && i % 2 === 1 ? 0.55 : 1.0;

    let targetHip =
      anim.animState === 'HIDING'
        ? leg.baseHipX - 0.35
        : leg.baseHipX + gaitWave * maxAmp * limpFactor + (onStairs && anim.smoothedSlopePitch > 0.08 ? -0.14 : 0);
    const kneeLift =
      Math.max(0, -c) * maxAmp * (type === 'crawler' ? 1.85 : 1.48) * stairLiftBonus * limpFactor;
    let targetKnee =
      anim.animState === 'HIDING'
        ? leg.baseKneeX + 0.65
        : leg.baseKneeX + kneeLift + (onStairs ? 0.12 : 0);

    if (airborne) {
      targetHip = leg.baseHipX - 0.24;
      targetKnee = leg.baseKneeX + 0.45;
    }
    if (stompLegLift > 0 && i === 0) {
      targetHip -= stompLegLift * 0.92;
      targetKnee += stompLegLift * 0.98;
    }
    if (leapLegBend !== 0 || legBuckle > 0) {
      targetHip -= leapLegBend * 0.55 + legBuckle * 0.42;
      targetKnee += leapLegBend * 0.85 + legBuckle * 0.75;
    }

    const axis = leg.hipAxis ?? 'x';
    leg.hip.rotation[axis] = THREE.MathUtils.damp(leg.hip.rotation[axis], targetHip, legDamp, dt);
    leg.knee.rotation.x = THREE.MathUtils.damp(leg.knee.rotation.x, targetKnee, legDamp, dt);
  }

  const malfunc = profile.isMech && healthRatio < 0.55 ? Math.sin(time * 28) * 0.14 : 0;
  const shoulderBreathHeave = breathWave * 0.045 * (0.4 + anim.muscleTension);
  const clawTwitch =
    !profile.isMech && anim.muscleTension > 0.35 && Math.sin(time * 11.3 + position.z) > 0.86
      ? Math.sin(time * 38) * 0.09 * anim.muscleTension
      : 0;
  for (let i = 0; i < refs.armRigs.length; i++) {
    const arm = refs.armRigs[i];
    const side = i % 2 === 0 ? -1 : 1;
    const swing = Math.sin(anim.stridePhase + arm.phaseOffset) * maxAmp * (0.65 + anim.runBlend * 0.35);
    const atkS = i % 2 === 0 ? armAttackL : armAttackR;
    const atkE = i % 2 === 0 ? elbowAttackL : elbowAttackR;
    const dmgRecoil = i % 2 === 0 ? armRecoilL : armRecoilR;
    const bossIntroLift = anim.animState === 'BOSS_INTRO' ? -0.9 : 0;
    const jitter = (i === 1 ? malfunc : 0) + clawTwitch * side;
    const stairBrace = onStairs || onEscalator ? -0.14 : 0;

    const targetShoulderX =
      arm.baseShoulderX + swing + atkS + dmgRecoil + bossIntroLift + jitter + shoulderBreathHeave + stairBrace;
    const targetElbowX =
      arm.baseElbowX +
      Math.cos(anim.stridePhase + arm.phaseOffset) * maxAmp * 0.35 +
      atkE -
      Math.abs(dmgRecoil) * 0.35 -
      anim.muscleTension * 0.12;

    arm.shoulder.rotation.x = THREE.MathUtils.damp(arm.shoulder.rotation.x, targetShoulderX, 13, dt);
    arm.shoulder.rotation.z = THREE.MathUtils.damp(
      arm.shoulder.rotation.z,
      side * (armSpread + anim.muscleTension * 0.08 + (anim.staggerTimer > 0 ? 0.14 : 0)),
      12,
      dt
    );
    arm.elbow.rotation.x = THREE.MathUtils.damp(arm.elbow.rotation.x, targetElbowX, 13, dt);
  }

  // -------------------------------------------------------------------------
  // 8. INFECTED MECH ROTATING ARMOR, REGEN NODES & CORE INTENSITY
  // -------------------------------------------------------------------------
  if (distToCam < 65) {
    if (refs.rotatableArmor && refs.rotatableArmor.length > 0) {
      for (let i = 0; i < refs.rotatableArmor.length; i++) {
        const part = refs.rotatableArmor[i];
        if (type === 'drowned_machine' || type === 'origin') {
          part.rotation.z += dt * (aiState === 'ATTACK' ? 2.6 : 0.9);
        } else if (type === 'helios_unit') {
          part.rotation.z =
            (i === 0 ? 0.28 : -0.28) + Math.sin(time * 3.5 + i * Math.PI) * (aiState === 'ATTACK' ? 0.16 : 0.05);
        } else if (type === 'sentinel' && i === 0) {
          part.rotation.x = THREE.MathUtils.damp(
            part.rotation.x,
            aiState === 'ATTACK' ? -0.15 : Math.sin(time * 1.4) * 0.12,
            8,
            dt
          );
        }
      }
    }

    if (profile.isMech && healthRatio < 0.55) {
      anim.sparkTimer -= dt;
      if (anim.sparkTimer <= 0) {
        anim.sparkTimer = 0.8 + Math.random() * 1.4;
        params.onMechSpark?.(position);
      }
    }

    // Titanforged organic parasite regeneration nodes pulse & grow visually during parasite_regen
    const targetRegen =
      attackActive && anim.attackKind === 'parasite_regen'
        ? 1.0
        : healthRatio < 0.72
          ? 0.35
          : 0.08;
    anim.regenIntensity = THREE.MathUtils.damp(anim.regenIntensity, targetRegen, 7, dt);
    if (refs.regenMat) {
      const pulse = 0.85 + Math.sin(time * (anim.attackKind === 'parasite_regen' && attackActive ? 11 : 4)) * 0.35;
      refs.regenMat.emissiveIntensity = (0.4 + anim.regenIntensity * 2.8) * pulse;
    }
    if (refs.regenNodes && refs.regenNodes.length > 0) {
      for (let r = 0; r < refs.regenNodes.length; r++) {
        const sc = 0.9 + anim.regenIntensity * 0.48 + Math.sin(time * 7 + r * 1.1) * 0.12 * anim.regenIntensity;
        refs.regenNodes[r].scale.setScalar(sc);
      }
    }

    if (refs.coreMaterials && refs.coreMaterials.length > 0) {
      const isChargingGravity = attackActive && anim.attackKind === 'gravity_pulse';
      const hurtBoost = anim.staggerTimer > 0 ? 1.35 : 0;
      const organicPulse = 0.88 + Math.sin(time * (aiState === 'ATTACK' ? 7.5 : 3.2) + position.x) * 0.16;
      const targetCore =
        (isChargingGravity
          ? 4.8
          : anim.animState === 'BOSS_INTRO' || aiState === 'ATTACK'
            ? 3.45 + (bossPhase >= 5 ? 1.0 : 0)
            : aiState === 'CHASE'
              ? 2.95 + bossPhase * 0.28
              : aiState === 'SEARCH'
                ? 2.35
                : 1.75) *
          organicPulse +
        hurtBoost;
      const flicker =
        profile.isMech && healthRatio < 0.5 && Math.sin(time * 31) > 0.72 ? 0.35 : 1.0;
      anim.coreIntensity = THREE.MathUtils.damp(anim.coreIntensity, targetCore * flicker, 11, dt);
      for (let i = 0; i < refs.coreMaterials.length; i++) {
        refs.coreMaterials[i].emissiveIntensity = anim.coreIntensity;
      }
    }

    // -----------------------------------------------------------------------
    // 9. MONSTER FACES, EYE TRACKING, HEAD TILT & JAW ANIMATION
    // -----------------------------------------------------------------------
    if (refs.headGroup) {
      let desiredLocalYaw = headStrikeYaw;
      let desiredPitch = headStrikePitch;
      let desiredRoll = 0;

      if (aiState === 'CHASE' || aiState === 'ATTACK' || aiState === 'SEARCH') {
        const dx = targetPos.x - position.x;
        const dz = targetPos.z - position.z;
        let relYaw = Math.atan2(dx, dz) - yaw;
        while (relYaw > Math.PI) relYaw -= Math.PI * 2;
        while (relYaw < -Math.PI) relYaw += Math.PI * 2;
        desiredLocalYaw = THREE.MathUtils.clamp(relYaw + headStrikeYaw, -0.78, 0.78);
        if (aiState === 'SEARCH') {
          desiredLocalYaw += Math.sin(time * 1.9) * 0.35;
          desiredRoll = Math.sin(time * 1.4) * 0.18;
        }
      } else if (anim.animState === 'IDLE') {
        // Subtle unnatural biomechanical servo head twitch
        const mechJitter = Math.sin(time * 13.7 + position.x) > 0.88 ? Math.sin(time * 47) * 0.14 : 0;
        if (anim.idleVariant === 1) {
          desiredLocalYaw += Math.sin(time * 1.2) * 0.42 + mechJitter;
          desiredRoll = Math.sin(time * 1.2) * 0.12 + mechJitter * 0.7;
        } else if (anim.idleVariant === 2) {
          const pulse = Math.sin(time * 7.5);
          desiredLocalYaw += (pulse > 0.78 ? 0.38 * anim.deathDir : 0) + mechJitter;
          desiredRoll = (pulse > 0.78 ? -0.22 * anim.deathDir : 0) + mechJitter * 0.6;
        } else {
          desiredLocalYaw += mechJitter;
          desiredRoll = 0.06 * anim.deathDir + mechJitter * 0.5;
        }
      } else if (anim.animState === 'BOSS_INTRO') {
        desiredPitch = -0.35;
      }

      const headDamp = anim.staggerTimer > 0 ? 22 : weight === 'small' ? 16 : 9;
      anim.headYaw = THREE.MathUtils.damp(anim.headYaw, desiredLocalYaw, headDamp, dt);
      anim.headPitch = THREE.MathUtils.damp(anim.headPitch, desiredPitch, headDamp, dt);
      anim.headRoll = THREE.MathUtils.damp(anim.headRoll, desiredRoll, headDamp, dt);

      refs.headGroup.rotation.y = anim.headYaw;
      refs.headGroup.rotation.x = anim.headPitch;
      refs.headGroup.rotation.z = anim.headRoll;
    }

    if (refs.jawGroup) {
      refs.jawGroup.rotation.x = 0.24 + anim.jawOpen * 0.6;
    }

    if (refs.facePlates && refs.facePlates.length > 0) {
      const browAnger = aiState === 'ATTACK' || aiState === 'CHASE' ? 0.36 : 0.22;
      const vocalTremor = params.isVocalizing ? Math.sin(time * 28) * 0.05 : 0;
      for (let i = 0; i < refs.facePlates.length; i++) {
        refs.facePlates[i].rotation.x = browAnger + vocalTremor;
      }
    }

    if (refs.mandibleFlaps.length > 0) {
      const flare = 0.14 + anim.jawOpen * 0.52 + Math.sin(time * 5.2) * 0.08;
      for (let i = 0; i < refs.mandibleFlaps.length; i++) {
        const mf = refs.mandibleFlaps[i];
        mf.mesh.rotation[mf.axis] = mf.baseRot + flare * mf.dir;
      }
    }

    if (refs.eyeMeshes && refs.eyeMeshes.length > 0 && (!refs.eyeRigs || refs.eyeRigs.length === 0)) {
      const eyeScale = aiState === 'ATTACK' || aiState === 'CHASE' ? 1.15 : 0.95;
      for (let i = 0; i < refs.eyeMeshes.length; i++) {
        refs.eyeMeshes[i].scale.setScalar(eyeScale);
      }
    }

    if (refs.screamerSac) {
      const sPulse = 1 + Math.sin(time * (isScreaming ? 16 : 6)) * (isScreaming ? 0.28 : 0.06);
      refs.screamerSac.scale.set(1.05 * sPulse, 1.35 * sPulse, 0.9 * sPulse);
    }

    refs.tendrils.forEach((td) => {
      td.mesh.rotation.x = td.baseRotX + Math.sin(time * 5.2 + td.phaseOffset) * 0.24;
    });
  }
}
