import * as THREE from 'three';
import { EnemyModelRefs } from './models';
import { updateFormerInfectionVisuals } from './monsterAnimations';
import { CorpseInfectionStage } from './types';

export type CorpseBoneId =
  | 'pelvis'
  | 'spineLower'
  | 'spineUpper'
  | 'neck'
  | 'head'
  | 'jaw'
  | 'clavicleL'
  | 'clavicleR'
  | 'upperArmL'
  | 'upperArmR'
  | 'forearmL'
  | 'forearmR'
  | 'handL'
  | 'handR'
  | 'thighL'
  | 'thighR'
  | 'shinL'
  | 'shinR'
  | 'footL'
  | 'footR';

export type ConvulsionPhase =
  | 'still'
  | 'micro_twitches'
  | 'limb_snaps'
  | 'violent_seizures'
  | 'resurrection_threshold';

export interface BoneSpringAxisState {
  rx: number;
  ry: number;
  rz: number;
  vx: number;
  vy: number;
  vz: number;
  restX: number;
  restY: number;
  restZ: number;
  stiffness: number;
  damping: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface CorpseConvulsionCallbacks {
  onBoneCrack?: (boneId: CorpseBoneId, severity: number, worldPos: THREE.Vector3) => void;
  onSporeBurst?: (worldPos: THREE.Vector3, intensity: number) => void;
  onSeizureTremor?: (intensity: number) => void;
}

export interface CorpseConvulsionState {
  phase: ConvulsionPhase;
  nextImpulseTimer: number;
  burstRemaining: number;
  shiverPhase: number;
  crackCooldown: number;
  sporeBurstCooldown: number;
  tremorCooldown: number;
  rootYOffset: number;
  rootYVel: number;
  bones: Record<CorpseBoneId, BoneSpringAxisState>;
  fingerPosL: Float32Array;
  fingerVelL: Float32Array;
  fingerPosR: Float32Array;
  fingerVelR: Float32Array;
}

const _tmpBoneWorld = new THREE.Vector3();

function makeSpring(
  stiffness: number,
  damping: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minZ: number,
  maxZ: number,
  restX = 0,
  restY = 0,
  restZ = 0
): BoneSpringAxisState {
  return {
    rx: restX,
    ry: restY,
    rz: restZ,
    vx: 0,
    vy: 0,
    vz: 0,
    restX,
    restY,
    restZ,
    stiffness,
    damping,
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
  };
}

export function createCorpseConvulsionState(initialProgress = 0): CorpseConvulsionState {
  return {
    phase: resolveConvulsionPhase(initialProgress, 'still'),
    nextImpulseTimer: 0.45 + Math.random() * 0.65,
    burstRemaining: 0,
    shiverPhase: Math.random() * Math.PI * 2,
    crackCooldown: 0,
    sporeBurstCooldown: 0,
    tremorCooldown: 0,
    rootYOffset: 0,
    rootYVel: 0,
    bones: {
      pelvis: makeSpring(140, 14, -2.15, 0.38, -0.45, 0.45, -0.55, 0.55, -Math.PI / 2 + 0.08, 0, 0),
      spineLower: makeSpring(165, 13, -0.58, 0.62, -0.48, 0.48, -0.42, 0.42),
      spineUpper: makeSpring(185, 14, -0.52, 0.56, -0.45, 0.45, -0.38, 0.38),
      neck: makeSpring(210, 14, -0.62, 0.58, -0.68, 0.68, -0.52, 0.52),
      head: makeSpring(240, 15, -0.65, 0.52, -0.85, 0.85, -0.62, 0.62),
      jaw: makeSpring(260, 16, -0.05, 0.78, -0.1, 0.1, -0.1, 0.1, 0.08, 0, 0),
      clavicleL: makeSpring(200, 15, -0.38, 0.38, -0.35, 0.35, -0.32, 0.42),
      clavicleR: makeSpring(200, 15, -0.38, 0.38, -0.35, 0.35, -0.42, 0.32),
      upperArmL: makeSpring(155, 12, -1.65, 0.95, -0.85, 0.85, -1.15, 0.38),
      upperArmR: makeSpring(155, 12, -1.65, 0.95, -0.85, 0.85, -0.38, 1.15),
      forearmL: makeSpring(190, 13, -1.75, 0.18, -0.65, 0.65, -0.45, 0.45, -0.22, 0, 0),
      forearmR: makeSpring(190, 13, -1.75, 0.18, -0.65, 0.65, -0.45, 0.45, -0.26, 0, 0),
      handL: makeSpring(235, 14, -0.85, 0.85, -0.55, 0.55, -0.65, 0.65),
      handR: makeSpring(235, 14, -0.85, 0.85, -0.55, 0.55, -0.65, 0.65),
      thighL: makeSpring(150, 13, -1.35, 0.55, -0.52, 0.52, -0.58, 0.28),
      thighR: makeSpring(150, 13, -1.35, 0.55, -0.52, 0.52, -0.28, 0.58),
      shinL: makeSpring(175, 13, -0.12, 1.68, -0.25, 0.25, -0.25, 0.25, 0.12, 0, 0),
      shinR: makeSpring(175, 13, -0.12, 1.68, -0.25, 0.25, -0.25, 0.25, 0.15, 0, 0),
      footL: makeSpring(210, 15, -0.68, 0.72, -0.35, 0.35, -0.38, 0.38),
      footR: makeSpring(210, 15, -0.68, 0.72, -0.35, 0.35, -0.38, 0.38),
    },
    fingerPosL: new Float32Array([0.16, 0.2, 0.18, 0.22]),
    fingerVelL: new Float32Array(4),
    fingerPosR: new Float32Array([0.24, 0.28, 0.26, 0.22]),
    fingerVelR: new Float32Array(4),
  };
}

export function resolveConvulsionPhase(
  infectionProgress: number,
  stage: CorpseInfectionStage
): ConvulsionPhase {
  if (stage === 'screaming_rise' || infectionProgress >= 0.92) {
    return 'resurrection_threshold';
  }
  if (infectionProgress < 0.14) return 'still';
  if (infectionProgress < 0.42) return 'micro_twitches';
  if (infectionProgress < 0.76) return 'limb_snaps';
  return 'violent_seizures';
}

function injectBoneImpulse(
  b: BoneSpringAxisState,
  ix: number,
  iy: number,
  iz: number
): void {
  b.vx += ix;
  b.vy += iy;
  b.vz += iz;
}

function stepAxisSpring(
  val: number,
  vel: number,
  rest: number,
  k: number,
  c: number,
  minV: number,
  maxV: number,
  dt: number
): [number, number] {
  const force = -k * (val - rest) - c * vel;
  let nv = vel + force * dt;
  let np = val + nv * dt;
  if (np < minV) {
    np = minV;
    if (nv < 0) nv = -nv * 0.25;
  } else if (np > maxV) {
    np = maxV;
    if (nv > 0) nv = -nv * 0.25;
  }
  return [np, nv];
}

function stepBoneSpring(b: BoneSpringAxisState, dt: number): void {
  [b.rx, b.vx] = stepAxisSpring(b.rx, b.vx, b.restX, b.stiffness, b.damping, b.minX, b.maxX, dt);
  [b.ry, b.vy] = stepAxisSpring(b.ry, b.vy, b.restY, b.stiffness, b.damping, b.minY, b.maxY, dt);
  [b.rz, b.vz] = stepAxisSpring(b.rz, b.vz, b.restZ, b.stiffness, b.damping, b.minZ, b.maxZ, dt);
}

export function stepCorpseBoneConvulsionSequence(
  refs: EnemyModelRefs,
  state: CorpseConvulsionState,
  infectionProgress: number,
  stage: CorpseInfectionStage,
  stageLocalProgress: number,
  time: number,
  dt: number,
  illuminated: boolean,
  callbacks?: CorpseConvulsionCallbacks
): void {
  const rig = refs.formerRig;
  if (!rig) return;

  const p = THREE.MathUtils.clamp(infectionProgress, 0, 1);
  const phase = resolveConvulsionPhase(p, stage);
  state.phase = phase;

  const isThreshold = phase === 'resurrection_threshold';
  updateFormerInfectionVisuals(refs, p, time, isThreshold || phase === 'violent_seizures', illuminated);

  if (state.crackCooldown > 0) state.crackCooldown = Math.max(0, state.crackCooldown - dt);
  if (state.sporeBurstCooldown > 0) state.sporeBurstCooldown = Math.max(0, state.sporeBurstCooldown - dt);
  if (state.tremorCooldown > 0) state.tremorCooldown = Math.max(0, state.tremorCooldown - dt);

  // Non-linear seizure violence curve (subtle early twitches -> sudden violent late convulsions)
  const violence = Math.pow(THREE.MathUtils.clamp((p - 0.12) / 0.88, 0, 1), 1.85);
  state.shiverPhase += dt * (18 + violence * 44);

  // Update resting targets for axial threshold rise vs supine floor slump
  const riseEase =
    isThreshold
      ? Math.pow(
          THREE.MathUtils.clamp(
            stage === 'screaming_rise' ? stageLocalProgress : (p - 0.92) / 0.08,
            0,
            1
          ),
          1.25
        )
      : 0;

  state.bones.pelvis.restX = THREE.MathUtils.lerp(-Math.PI / 2 + 0.08, 0.09, riseEase);
  state.bones.pelvis.restZ = 0.07 * rig.limpSide * (1 - riseEase * 0.3) + 0.1 * rig.limpSide * riseEase;
  state.bones.spineLower.restX = THREE.MathUtils.lerp(0.02, 0.24, riseEase);
  state.bones.spineUpper.restX = THREE.MathUtils.lerp(0.03, 0.18, riseEase);
  state.bones.neck.restX = THREE.MathUtils.lerp(0.08, -0.32, riseEase);
  state.bones.head.restX = THREE.MathUtils.lerp(0.06, -0.38, riseEase);
  state.bones.jaw.restX = THREE.MathUtils.lerp(0.08 + violence * 0.18, 0.68, riseEase);
  state.bones.upperArmL.restX = THREE.MathUtils.lerp(-0.08, -0.35, riseEase);
  state.bones.upperArmR.restX = THREE.MathUtils.lerp(-0.18, -0.82, riseEase);
  state.bones.forearmL.restX = THREE.MathUtils.lerp(-0.22, -0.52, riseEase);
  state.bones.forearmR.restX = THREE.MathUtils.lerp(-0.26, -0.78, riseEase);
  state.bones.thighL.restX = THREE.MathUtils.lerp(0, -0.25 * (1 - riseEase), riseEase);
  state.bones.thighR.restX = THREE.MathUtils.lerp(0, -0.18 * (1 - riseEase), riseEase);

  // Stochastic neuromuscular impulse scheduler
  state.nextImpulseTimer -= dt;
  if (state.nextImpulseTimer <= 0 && phase !== 'still') {
    let triggeredBone: CorpseBoneId = 'handR';
    let crackSeverity = 0;

    if (phase === 'micro_twitches') {
      state.nextImpulseTimer = 0.42 + Math.random() * 0.78;
      // Isolated finger snaps, wrist flutter, jaw quiver
      const leftSide = Math.random() < 0.5;
      const fIdx = Math.floor(Math.random() * 4);
      const kick = (14 + Math.random() * 18) * (Math.random() < 0.7 ? 1 : -1);
      if (leftSide) state.fingerVelL[fIdx] += kick;
      else state.fingerVelR[fIdx] += kick;

      const handBone = leftSide ? state.bones.handL : state.bones.handR;
      injectBoneImpulse(handBone, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 8);
      if (Math.random() < 0.32) {
        injectBoneImpulse(state.bones.jaw, 4.5 + Math.random() * 5, 0, 0);
      }
      if (Math.random() < 0.25) {
        injectBoneImpulse(leftSide ? state.bones.footL : state.bones.footR, (Math.random() - 0.5) * 7, 0, (Math.random() - 0.5) * 5);
      }
    } else if (phase === 'limb_snaps') {
      state.nextImpulseTimer = 0.2 + Math.random() * 0.36;
      const roll = Math.random();
      const sign = Math.random() < 0.5 ? 1 : -1;

      if (roll < 0.26) {
        // Sudden cervical neck/head snap + jaw gasp
        triggeredBone = 'head';
        injectBoneImpulse(state.bones.neck, (Math.random() - 0.4) * 11, sign * (13 + Math.random() * 11), sign * 9);
        injectBoneImpulse(state.bones.head, -5 + Math.random() * 8, sign * (16 + Math.random() * 12), sign * 11);
        injectBoneImpulse(state.bones.jaw, 9 + Math.random() * 6, 0, 0);
        crackSeverity = 0.48;
      } else if (roll < 0.58) {
        // Asymmetric leg kick & shin whip
        const isL = Math.random() < 0.5;
        triggeredBone = isL ? 'shinL' : 'shinR';
        injectBoneImpulse(isL ? state.bones.thighL : state.bones.thighR, -12 - Math.random() * 9, sign * 6, (isL ? -1 : 1) * 6);
        injectBoneImpulse(isL ? state.bones.shinL : state.bones.shinR, 16 + Math.random() * 12, 0, 0);
        injectBoneImpulse(isL ? state.bones.footL : state.bones.footR, (Math.random() - 0.5) * 14, 0, sign * 8);
        crackSeverity = 0.42;
      } else {
        // Arm wrench + hand clench
        const isL = Math.random() < 0.5;
        triggeredBone = isL ? 'forearmL' : 'forearmR';
        injectBoneImpulse(isL ? state.bones.clavicleL : state.bones.clavicleR, 0, sign * 5, (isL ? 1 : -1) * 7);
        injectBoneImpulse(isL ? state.bones.upperArmL : state.bones.upperArmR, -12 - Math.random() * 10, sign * 9, (isL ? -1 : 1) * 10);
        injectBoneImpulse(isL ? state.bones.forearmL : state.bones.forearmR, -16 - Math.random() * 11, sign * 8, 0);
        for (let f = 0; f < 4; f++) {
          if (isL) state.fingerVelL[f] += 18 + Math.random() * 12;
          else state.fingerVelR[f] += 18 + Math.random() * 12;
        }
        crackSeverity = 0.45;
      }
    } else {
      // Phase 4 & 5: Violent full-body seizure clusters!
      if (state.burstRemaining <= 0) {
        state.burstRemaining = 2 + Math.floor(Math.random() * 4);
      }
      state.burstRemaining -= 1;
      state.nextImpulseTimer =
        state.burstRemaining > 0 ? 0.055 + Math.random() * 0.075 : 0.16 + Math.random() * 0.22;

      const s1 = Math.random() < 0.5 ? 1 : -1;
      const s2 = Math.random() < 0.5 ? 1 : -1;
      const amp = 0.85 + violence * 0.65;

      // Violent spinal arch lifts mid-torso off the floor & whips extremities
      triggeredBone = 'spineUpper';
      injectBoneImpulse(state.bones.pelvis, -6 * amp, s1 * 7 * amp, s2 * 8 * amp);
      injectBoneImpulse(state.bones.spineLower, -17 * amp, s1 * 12 * amp, s2 * 11 * amp);
      injectBoneImpulse(state.bones.spineUpper, -19 * amp, s2 * 15 * amp, -s1 * 13 * amp);
      state.rootYVel += (1.15 + Math.random() * 0.85) * amp;

      // Neck & head thrash in counter-phase
      injectBoneImpulse(state.bones.neck, (Math.random() - 0.5) * 20 * amp, -s1 * 18 * amp, s2 * 15 * amp);
      injectBoneImpulse(state.bones.head, -12 * amp, s1 * 24 * amp, -s2 * 18 * amp);
      injectBoneImpulse(state.bones.jaw, 14 * amp, 0, 0);

      // Simultaneous violent bilateral arm & leg convulsions
      injectBoneImpulse(state.bones.upperArmL, -18 * amp, s1 * 14 * amp, -12 * amp);
      injectBoneImpulse(state.bones.upperArmR, -16 * amp, s2 * 14 * amp, 12 * amp);
      injectBoneImpulse(state.bones.forearmL, -22 * amp, s2 * 11 * amp, 0);
      injectBoneImpulse(state.bones.forearmR, -20 * amp, s1 * 11 * amp, 0);
      injectBoneImpulse(state.bones.thighL, -18 * amp, s1 * 9 * amp, -8 * amp);
      injectBoneImpulse(state.bones.thighR, -15 * amp, s2 * 9 * amp, 8 * amp);
      injectBoneImpulse(state.bones.shinL, 22 * amp, 0, 0);
      injectBoneImpulse(state.bones.shinR, 20 * amp, 0, 0);

      for (let f = 0; f < 4; f++) {
        state.fingerVelL[f] += (Math.random() - 0.25) * 32 * amp;
        state.fingerVelR[f] += (isThreshold ? 28 : (Math.random() - 0.25) * 32) * amp;
      }

      crackSeverity = 0.72 + Math.random() * 0.28;

      if (callbacks?.onSporeBurst && state.sporeBurstCooldown <= 0) {
        state.sporeBurstCooldown = 0.22 + Math.random() * 0.18;
        rig.bones.spineUpper.getWorldPosition(_tmpBoneWorld);
        callbacks.onSporeBurst(_tmpBoneWorld, Math.min(1, amp * 0.85));
      }
      if (callbacks?.onSeizureTremor && state.tremorCooldown <= 0) {
        state.tremorCooldown = 0.14;
        callbacks.onSeizureTremor(Math.min(1, amp * 0.9));
      }
    }

    if (crackSeverity > 0.35 && callbacks?.onBoneCrack && state.crackCooldown <= 0) {
      state.crackCooldown = phase === 'limb_snaps' ? 0.36 : 0.16;
      rig.bones[triggeredBone].getWorldPosition(_tmpBoneWorld);
      callbacks.onBoneCrack(triggeredBone, crackSeverity, _tmpBoneWorld);
    }
  }

  // Sub-stepped damped spring integration for crisp, non-exploding violent snaps
  const steps = dt > 0.014 ? 2 : 1;
  const subDt = dt / steps;
  for (let step = 0; step < steps; step++) {
    stepBoneSpring(state.bones.pelvis, subDt);
    stepBoneSpring(state.bones.spineLower, subDt);
    stepBoneSpring(state.bones.spineUpper, subDt);
    stepBoneSpring(state.bones.neck, subDt);
    stepBoneSpring(state.bones.head, subDt);
    stepBoneSpring(state.bones.jaw, subDt);
    stepBoneSpring(state.bones.clavicleL, subDt);
    stepBoneSpring(state.bones.clavicleR, subDt);
    stepBoneSpring(state.bones.upperArmL, subDt);
    stepBoneSpring(state.bones.upperArmR, subDt);
    stepBoneSpring(state.bones.forearmL, subDt);
    stepBoneSpring(state.bones.forearmR, subDt);
    stepBoneSpring(state.bones.handL, subDt);
    stepBoneSpring(state.bones.handR, subDt);
    stepBoneSpring(state.bones.thighL, subDt);
    stepBoneSpring(state.bones.thighR, subDt);
    stepBoneSpring(state.bones.shinL, subDt);
    stepBoneSpring(state.bones.shinR, subDt);
    stepBoneSpring(state.bones.footL, subDt);
    stepBoneSpring(state.bones.footR, subDt);

    // Root body slap vertical bounce when spine arches violently against floor
    const yForce = -190 * state.rootYOffset - 16 * state.rootYVel;
    state.rootYVel += yForce * subDt;
    state.rootYOffset += state.rootYVel * subDt;
    if (state.rootYOffset < 0) {
      state.rootYOffset = 0;
      if (state.rootYVel < -0.6 && phase === 'violent_seizures' && callbacks?.onSeizureTremor && state.tremorCooldown <= 0) {
        state.tremorCooldown = 0.16;
        callbacks.onSeizureTremor(0.65);
      }
      state.rootYVel = Math.max(0, -state.rootYVel * 0.22);
    } else if (state.rootYOffset > 0.22) {
      state.rootYOffset = 0.22;
      state.rootYVel = Math.min(0, state.rootYVel);
    }

    const fingerRestL = isThreshold ? 1.12 : 0.16 + violence * 0.55;
    const fingerRestR = isThreshold ? 1.28 : 0.24 + violence * 0.6;
    for (let f = 0; f < 4; f++) {
      const [pl, vl] = stepAxisSpring(
        state.fingerPosL[f],
        state.fingerVelL[f],
        fingerRestL + (f % 2) * 0.08,
        240,
        14,
        -0.18,
        1.55,
        subDt
      );
      state.fingerPosL[f] = pl;
      state.fingerVelL[f] = vl;

      const [pr, vr] = stepAxisSpring(
        state.fingerPosR[f],
        state.fingerVelR[f],
        fingerRestR + (f % 2) * 0.08,
        240,
        14,
        -0.18,
        1.55,
        subDt
      );
      state.fingerPosR[f] = pr;
      state.fingerVelR[f] = vr;
    }
  }

  // High-frequency muscular fibrillation overlay scaling cleanly with infection severity
  const tremorAmt = phase === 'still' ? 0 : (0.008 + violence * 0.068) * (1 - riseEase * 0.35);
  const sA = Math.sin(state.shiverPhase);
  const sB = Math.cos(state.shiverPhase * 1.37);

  const applyBone = (bone: THREE.Bone, bState: BoneSpringAxisState, jitX = 0, jitY = 0, jitZ = 0) => {
    bone.rotation.set(bState.rx + jitX, bState.ry + jitY, bState.rz + jitZ);
  };

  // Keep bodyRoot neutral while Pelvis bone drives full-body ground slump -> standing rise
  rig.bodyRoot.rotation.set(0, 0, 0);
  rig.bodyRoot.position.y = THREE.MathUtils.lerp(0.24, 0.0, riseEase) + state.rootYOffset;

  applyBone(rig.bones.pelvis, state.bones.pelvis, sA * tremorAmt * 0.35, 0, sB * tremorAmt * 0.45);
  applyBone(rig.bones.spineLower, state.bones.spineLower, sB * tremorAmt * 0.55, sA * tremorAmt * 0.4, 0);
  applyBone(rig.bones.spineUpper, state.bones.spineUpper, -sA * tremorAmt * 0.65, 0, sB * tremorAmt * 0.55);
  applyBone(rig.bones.neck, state.bones.neck, sA * tremorAmt * 0.9, sB * tremorAmt * 0.7, 0);
  applyBone(rig.bones.head, state.bones.head, sB * tremorAmt * 1.15, sA * tremorAmt * 1.1, sB * tremorAmt * 0.85);
  applyBone(rig.bones.jaw, state.bones.jaw, Math.abs(sA) * tremorAmt * 0.9, 0, 0);

  applyBone(rig.bones.clavicleL, state.bones.clavicleL, 0, 0, sA * tremorAmt * 0.45);
  applyBone(rig.bones.clavicleR, state.bones.clavicleR, 0, 0, -sA * tremorAmt * 0.45);
  applyBone(rig.bones.upperArmL, state.bones.upperArmL, sA * tremorAmt * 0.8, 0, sB * tremorAmt * 0.5);
  applyBone(rig.bones.upperArmR, state.bones.upperArmR, -sB * tremorAmt * 0.8, 0, sA * tremorAmt * 0.5);
  applyBone(rig.bones.forearmL, state.bones.forearmL, sB * tremorAmt * 0.95, 0, 0);
  applyBone(rig.bones.forearmR, state.bones.forearmR, -sA * tremorAmt * 0.95, 0, 0);
  applyBone(rig.bones.handL, state.bones.handL, sA * tremorAmt * 1.2, sB * tremorAmt * 0.8, 0);
  applyBone(rig.bones.handR, state.bones.handR, -sB * tremorAmt * 1.2, sA * tremorAmt * 0.8, 0);

  applyBone(rig.bones.thighL, state.bones.thighL, sA * tremorAmt * 0.7, 0, sB * tremorAmt * 0.35);
  applyBone(rig.bones.thighR, state.bones.thighR, -sB * tremorAmt * 0.7, 0, -sA * tremorAmt * 0.35);
  applyBone(rig.bones.shinL, state.bones.shinL, sB * tremorAmt * 0.95, 0, 0);
  applyBone(rig.bones.shinR, state.bones.shinR, -sA * tremorAmt * 0.95, 0, 0);
  applyBone(rig.bones.footL, state.bones.footL, sA * tremorAmt * 1.1, 0, 0);
  applyBone(rig.bones.footR, state.bones.footR, -sB * tremorAmt * 1.1, 0, 0);

  // Muscle tension ribcage heave on upper spine bone
  const heaveFreq = phase === 'still' ? 1.5 : 4.2 + violence * 10.5;
  const heaveAmp = phase === 'still' ? 0.008 : 0.02 + violence * 0.055;
  const heave = 1 + Math.sin(time * heaveFreq) * heaveAmp;
  rig.bones.spineUpper.scale.set(heave, 1, heave);

  // Articulated finger bones
  for (let f = 0; f < rig.leftFingerGroups.length; f++) {
    const jit = Math.sin(state.shiverPhase * 1.6 + f * 1.4) * tremorAmt * 1.3;
    rig.leftFingerGroups[f].rotation.x = -state.fingerPosL[f] + jit;
  }
  for (let f = 0; f < rig.rightFingerGroups.length; f++) {
    const jit = Math.cos(state.shiverPhase * 1.6 + f * 1.4) * tremorAmt * 1.3;
    rig.rightFingerGroups[f].rotation.x = -state.fingerPosR[f] + jit;
  }
}
