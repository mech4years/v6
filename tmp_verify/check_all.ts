import * as THREE from 'three';
import { buildEnemyModel } from '../src/game/models';
import { createMonsterAnimState, triggerMonsterAttack, updateMonsterAnimations } from '../src/game/monsterAnimations';
import { createTentaclePhysicsState, updateMonsterTentacles } from '../src/game/animation';
import { createMonsterAIRuntime, MONSTER_PROFILES, selectNextAttackKind } from '../src/game/monsterAI';
import { DEFAULT_SETTINGS } from '../src/game/data';
import { EnemyType, MonsterAttackKind } from '../src/game/types';

// Minimal mock ProceduralTextureSet (2D textures not needed for geometry/anim transforms)
const dummyTex = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
const mockTextures: any = {
  metalPlateMap: dummyTex, metalPlateNormal: dummyTex, metalPlateRoughness: dummyTex, metalPlateMetalness: dummyTex,
  infectedFleshMap: dummyTex, infectedFleshNormal: dummyTex, infectedFleshRoughness: dummyTex, infectedFleshEmissive: dummyTex,
  boneMap: dummyTex, boneNormal: dummyTex,
  concreteMap: dummyTex, concreteNormal: dummyTex, concreteRoughness: dummyTex,
  rustedSteelMap: dummyTex, rustedSteelNormal: dummyTex, rustedSteelRoughness: dummyTex,
  grimeMap: dummyTex, glassMap: dummyTex, fireSpriteMap: dummyTex,
};

if (DEFAULT_SETTINGS.graphicsQuality !== 'high') {
  throw new Error('Expected DEFAULT_SETTINGS.graphicsQuality to be high');
}

const allTypes: EnemyType[] = [
  'crawler', 'stalker', 'brute_enemy', 'sentinel', 'screamer', 'carrier',
  'scrapper', 'watcher', 'hunter', 'broodmind', 'void_walker', 'hollow_dweller',
  'titan', 'titanforged', 'forgemaster', 'drowned_machine', 'guardian', 'helios_unit', 'origin'
];

for (const t of allTypes) {
  const refs = buildEnemyModel(t, mockTextures);
  if (t === 'titanforged') {
    if (!refs.regenNodes || refs.regenNodes.length < 4 || !refs.regenMat) {
      throw new Error('Titanforged missing regenNodes or regenMat');
    }
    if (refs.tentacleChains.length < 4) {
      throw new Error('Titanforged missing tentacleChains');
    }
  }
  if (t === 'hollow_dweller') {
    if (refs.tentacleChains.length !== 6) {
      throw new Error(`Expected 6 hollow_dweller tentacleChains, got ${refs.tentacleChains.length}`);
    }
  }
}

const titanAttacks: MonsterAttackKind[] = [
  'titanic_stomp', 'tentacle_sweep', 'ground_crusher', 'gravity_pulse', 'parasite_regen', 'tentacle_grab'
];
const hollowAttacks: MonsterAttackKind[] = [
  'claw_strike', 'tentacle_lash', 'leap_attack', 'grab_throw', 'frenzied_attack'
];

const firedEvents: string[] = [];
const titanRefs = buildEnemyModel('titanforged', mockTextures);
const titanAnim = createMonsterAnimState();
const titanTent = createTentaclePhysicsState(titanRefs);
const pos = new THREE.Vector3(0, 0, -18);
const targetPos = new THREE.Vector3(0, 0, 0);

for (const kind of titanAttacks) {
  triggerMonsterAttack(titanAnim, kind, 'boss');
  for (let s = 0; s < 30; s++) {
    updateMonsterAnimations(titanRefs, titanAnim, {
      dt: 0.1,
      time: s * 0.1,
      type: 'titanforged',
      aiState: 'ATTACK',
      position: pos,
      yaw: 0,
      actualHorizMoved: 0,
      turnRate: 0,
      targetPos,
      healthRatio: 0.6,
      legDamaged: false,
      isScreaming: false,
      distToCam: 18,
      bossPhase: 2,
      onBossSpecialEffect: (ev) => firedEvents.push(`${kind}:${ev}`),
    });
    updateMonsterTentacles(titanRefs, titanTent, {
      dt: 0.1,
      time: s * 0.1,
      enemyType: 'titanforged',
      aiState: 'ATTACK',
      moveSpeed: 0,
      turnRate: 0,
      distToCam: 18,
      activeAttackKind: kind,
      activeAttackProgress: Math.min(1, titanAnim.attackElapsed / titanAnim.attackDuration),
      targetPos,
    });
    if (!Number.isFinite(titanRefs.group.position.y)) throw new Error(`NaN in titanforged ${kind}`);
  }
}

const hollowRefs = buildEnemyModel('hollow_dweller', mockTextures);
const hollowAnim = createMonsterAnimState();
const hollowTent = createTentaclePhysicsState(hollowRefs);
for (const kind of hollowAttacks) {
  triggerMonsterAttack(hollowAnim, kind, 'small');
  for (let s = 0; s < 20; s++) {
    updateMonsterAnimations(hollowRefs, hollowAnim, {
      dt: 0.08,
      time: s * 0.08,
      type: 'hollow_dweller',
      aiState: 'ATTACK',
      position: pos,
      yaw: 0,
      actualHorizMoved: 0,
      turnRate: 0,
      targetPos,
      healthRatio: 0.3,
      legDamaged: false,
      isScreaming: false,
      distToCam: 6,
      bossPhase: 5,
      onBossSpecialEffect: (ev) => firedEvents.push(`${kind}:${ev}`),
    });
    updateMonsterTentacles(hollowRefs, hollowTent, {
      dt: 0.08,
      time: s * 0.08,
      enemyType: 'hollow_dweller',
      aiState: 'ATTACK',
      moveSpeed: 6,
      turnRate: 0,
      distToCam: 6,
      activeAttackKind: kind,
      activeAttackProgress: Math.min(1, hollowAnim.attackElapsed / hollowAnim.attackDuration),
      isFrenzied: true,
      targetPos,
    });
    if (!Number.isFinite(hollowRefs.group.position.y)) throw new Error(`NaN in hollow_dweller ${kind}`);
  }
}

// Verify AI distance selection & non-repeat
const aiT = createMonsterAIRuntime(pos, true);
const picks = [
  selectNextAttackKind('titanforged', 4, aiT, { healthRatio: 0.9, regenCooldown: 10 }),
  selectNextAttackKind('titanforged', 10, aiT, { healthRatio: 0.9, regenCooldown: 10 }),
  selectNextAttackKind('titanforged', 18, aiT, { healthRatio: 0.9, regenCooldown: 10 }),
  selectNextAttackKind('titanforged', 10, aiT, { healthRatio: 0.65, regenCooldown: 0 }),
];
if (picks[3] !== 'parasite_regen') {
  throw new Error(`Expected parasite_regen when injured & cooldown 0, got ${picks[3]}`);
}
console.log('ALL UNIT CHECKS PASSED. Events:', firedEvents.join(', '));
