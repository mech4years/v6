import * as THREE from 'three';
import { CHARACTERS } from './data';
import { ProceduralTextureSet } from './textures';
import { FullBodyArmourRefs, getArmourCrackTextures } from './armourSystem';
import { ArmourPieceId, CharacterId, EnemyType, WeaponId } from './types';

export interface FirstPersonRigRefs {
  root: THREE.Group;
  weaponPivot: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  magazine: THREE.Mesh;
  muzzleFlash: THREE.Mesh;
  muzzleLight: THREE.PointLight;
  flashlightMountPos: THREE.Vector3;
  flashlightLensMat: THREE.MeshStandardMaterial;
  wearMat?: THREE.MeshStandardMaterial;
  accentMat?: THREE.MeshStandardMaterial;
}

export interface FullBodyCharacterRig {
  headGroup: THREE.Group;
  torsoGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  weaponGroup: THREE.Group;
  armorMat: THREE.MeshStandardMaterial;
  trimMat: THREE.MeshStandardMaterial;
  visorMat: THREE.MeshStandardMaterial;
  stealthMaterials: THREE.MeshStandardMaterial[];
  armourRig?: FullBodyArmourRefs;
}

export interface ArticulatedLegRig {
  hip: THREE.Object3D;
  knee: THREE.Object3D;
  phaseOffset: number;
  baseHipX: number;
  baseKneeX: number;
  hipAxis?: 'x' | 'z';
}

export interface ArticulatedArmRig {
  shoulder: THREE.Object3D;
  elbow: THREE.Object3D;
  phaseOffset: number;
  baseShoulderX: number;
  baseElbowX: number;
}

export interface TendrilRig {
  mesh: THREE.Object3D;
  phaseOffset: number;
  baseRotX: number;
  baseRotZ: number;
}

export interface DestructibleArmorPart {
  mesh: THREE.Mesh;
  hpThreshold: number;
  broken: boolean;
  exposedMesh?: THREE.Object3D;
}

export interface TentacleChainRig {
  pivots: THREE.Group[];
  tendons: THREE.Object3D[];
  veinRings: THREE.Object3D[];
  secondaryTips: THREE.Object3D[];
  baseRotEuler: THREE.Euler;
  segLen: number;
  baseRadius: number;
  maxAngle: number;
  role: 'sensory' | 'balance' | 'stabilizer' | 'attack' | 'tether' | 'colossus';
  phaseOffset: number;
  speedMult: number;
  amplitude: number;
  sideSign: number;
  chestTetherSide?: number;
}

export interface NeckJointRig {
  pivot: THREE.Group;
  muscleMesh: THREE.Mesh;
  tendonL: THREE.Mesh;
  tendonR: THREE.Mesh;
  veinRing: THREE.Mesh;
  vertebraSteel: THREE.Mesh;
  restPos: THREE.Vector3;
  restRotX: number;
}

export interface EyeAssemblyRig {
  root: THREE.Group;
  eyeballPivot: THREE.Group;
  irisMesh: THREE.Mesh;
  upperLid?: THREE.Mesh;
  lowerLid?: THREE.Mesh;
  shutterRing?: THREE.Group;
  mat: THREE.MeshStandardMaterial;
  baseColor: number;
  baseEmissive: number;
  baseIntensity: number;
  baseScale: number;
  blinkPhase: number;
  nextBlinkTime: number;
  doubleBlinkPending: boolean;
  saccadeTimer: number;
  saccadeYaw: number;
  saccadePitch: number;
  asymmetryOffset: number;
  isMech: boolean;
}

export interface EnemyModelRefs {
  group: THREE.Group;
  hitMeshes: THREE.Mesh[];
  limbs: THREE.Object3D[];
  legRigs: ArticulatedLegRig[];
  armRigs: ArticulatedArmRig[];
  tendrils: TendrilRig[];
  tentacleChains: TentacleChainRig[];
  neckJoints?: NeckJointRig[];
  innerThroatRing?: THREE.Mesh;
  toothRings?: THREE.Group[];
  neckMaterials?: THREE.MeshStandardMaterial[];
  torsoExclusionRadius: number;
  mandibleFlaps: { mesh: THREE.Object3D; axis: 'x' | 'y' | 'z'; dir: number; baseRot: number }[];
  destructibleArmor: DestructibleArmorPart[];
  torsoPulse?: THREE.Object3D;
  headGroup?: THREE.Object3D;
  wormSegments?: THREE.Group[];
  jawTeethRing?: THREE.Group;
  chestHatchLeft?: THREE.Mesh;
  chestHatchRight?: THREE.Mesh;
  hollowCavity?: THREE.Group;
  hollowDweller?: THREE.Group;
  armParts?: THREE.Mesh[];
  screamerSac?: THREE.Mesh;
  carrierSac?: THREE.Mesh;
  shadowPlane: THREE.Mesh;
  flashMaterials?: THREE.MeshStandardMaterial[];
  flashBaseEmissives?: { hex: number; intensity: number }[];
  eyeMeshes?: THREE.Mesh[];
  eyeRigs?: EyeAssemblyRig[];
  facePlates?: THREE.Object3D[];
  jawGroup?: THREE.Object3D;
  rotatableArmor?: THREE.Object3D[];
  coreMaterials?: THREE.MeshStandardMaterial[];
  regenNodes?: THREE.Mesh[];
  regenMat?: THREE.MeshStandardMaterial;
  formerRig?: FormerModelRig;
}

export interface FormerSlitherTendril {
  root: THREE.Group;
  segments: THREE.Group[];
  phaseOffset: number;
  baseRotX: number;
  baseRotY: number;
  baseRotZ: number;
  convergeAxis: 'x' | 'z';
}

export interface CorpseSkeletonBones {
  pelvis: THREE.Bone;
  spineLower: THREE.Bone;
  spineUpper: THREE.Bone;
  neck: THREE.Bone;
  head: THREE.Bone;
  jaw: THREE.Bone;
  clavicleL: THREE.Bone;
  clavicleR: THREE.Bone;
  upperArmL: THREE.Bone;
  upperArmR: THREE.Bone;
  forearmL: THREE.Bone;
  forearmR: THREE.Bone;
  handL: THREE.Bone;
  handR: THREE.Bone;
  thighL: THREE.Bone;
  thighR: THREE.Bone;
  shinL: THREE.Bone;
  shinR: THREE.Bone;
  footL: THREE.Bone;
  footR: THREE.Bone;
}

export interface FormerModelRig {
  bodyRoot: THREE.Group;
  skeleton: THREE.Skeleton;
  bones: CorpseSkeletonBones;
  skinMat: THREE.MeshStandardMaterial;
  healthySkinColor: THREE.Color;
  necroticSkinColor: THREE.Color;
  armorMat: THREE.MeshStandardMaterial;
  trimMat: THREE.MeshStandardMaterial;
  visorMat: THREE.MeshStandardMaterial;
  veinMat: THREE.MeshStandardMaterial;
  eyeGlowMat: THREE.MeshStandardMaterial;
  tumorMat: THREE.MeshPhysicalMaterial;
  tumorMeshes: THREE.Mesh[];
  veinMeshes: THREE.Mesh[];
  slitherTendrils: FormerSlitherTendril[];
  sporePoints: THREE.Points;
  sporeMat: THREE.PointsMaterial;
  sporeBaseOffsets: Float32Array;
  leftFingerGroups: THREE.Object3D[];
  rightFingerGroups: THREE.Object3D[];
  primaryWeaponGroup: THREE.Group;
  secondaryWeaponGroup: THREE.Group;
  corruptedMuzzleFlash: THREE.Mesh;
  activeWeaponSlot: 0 | 1;
  limpSide: -1 | 1;
}

function makeContactShadow(textures: ProceduralTextureSet, radius: number): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    map: textures.contactShadowMap,
    transparent: true,
    depthWrite: false,
    opacity: 0.65,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  return mesh;
}

function createMuscleBellyGeometry(radius: number, length: number, segs = 10): THREE.LatheGeometry {
  const safeSegs = Math.max(6, Math.round(segs));
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const y = (t - 0.5) * length;
    const profile = Math.max(0, Math.sin(t * Math.PI));
    const bulge = 0.38 + 0.62 * Math.pow(profile, 0.72);
    pts.push(new THREE.Vector2(Math.max(0.01, radius * bulge), y));
  }
  const geo = new THREE.LatheGeometry(pts, safeSegs);
  geo.computeVertexNormals();
  if (geo.index) geo.computeTangents();
  return geo;
}

function createOrganicTumorGeometry(radius: number, seed = 1, detail = 2): THREE.IcosahedronGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const len = Math.hypot(x, y, z) || 1;
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;
    const n1 = Math.sin(nx * 4.3 + seed * 1.7) * Math.cos(ny * 3.9 - seed * 0.9);
    const n2 = Math.sin(nz * 6.1 + ny * 3.1 + seed * 2.3) * 0.5;
    const disp = 1 + n1 * 0.16 + n2 * 0.1;
    pos.setXYZ(i, x * disp, y * disp, z * disp);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  if (geo.index) geo.computeTangents();
  return geo;
}

function createBeveledPlateGeometry(
  width: number,
  height: number,
  depth: number,
  taperTop = 0.78
): THREE.ExtrudeGeometry {
  const hw = width / 2;
  const tw = hw * taperTop;
  const hh = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw * 0.88, -hh);
  shape.lineTo(hw * 0.88, -hh);
  shape.lineTo(hw, -hh * 0.45);
  shape.lineTo(tw, hh * 0.82);
  shape.lineTo(tw * 0.7, hh);
  shape.lineTo(-tw * 0.7, hh);
  shape.lineTo(-tw, hh * 0.82);
  shape.lineTo(-hw, -hh * 0.45);
  shape.closePath();

  const bevel = Math.min(width, height, depth) * 0.14;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.02, depth - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    steps: 1,
  });
  geo.center();
  geo.computeVertexNormals();
  if (geo.index) geo.computeTangents();
  return geo;
}

function createCurvedFangGeometry(baseRadius: number, length: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(baseRadius, 0),
    new THREE.Vector2(baseRadius * 0.82, length * 0.25),
    new THREE.Vector2(baseRadius * 0.52, length * 0.58),
    new THREE.Vector2(baseRadius * 0.22, length * 0.85),
    new THREE.Vector2(0.002, length),
  ];
  const geo = new THREE.LatheGeometry(pts, 7);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const ratio = y / (length || 1);
    pos.setZ(i, pos.getZ(i) + ratio * ratio * length * 0.26);
  }
  geo.computeVertexNormals();
  if (geo.index) geo.computeTangents();
  return geo;
}

function createVeinTube(points: [number, number, number][], radius: number): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return new THREE.TubeGeometry(curve, 14, radius, 6, false);
}

export function buildWeaponMesh(weaponId: WeaponId, textures: ProceduralTextureSet): {
  group: THREE.Group;
  magazine: THREE.Mesh;
  muzzlePoint: THREE.Vector3;
  flashlightPoint: THREE.Vector3;
  flashlightLensMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  const gunMetal = new THREE.MeshStandardMaterial({
    color: 0x222730,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughnessMap: textures.metalRoughness,
    metalnessMap: textures.metalMetalness,
    metalness: 0.9,
    roughness: 0.4,
  });
  const darkSteel = new THREE.MeshStandardMaterial({
    color: 0x15181e,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.7, 0.7),
    metalness: 0.92,
    roughness: 0.34,
  });
  const polymer = new THREE.MeshStandardMaterial({
    color: 0x101216,
    metalness: 0.16,
    roughness: 0.78,
  });
  const accentRed = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0xdc2626,
    emissiveIntensity: 1.15,
    metalness: 0.5,
    roughness: 0.25,
  });
  const opticCyan = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.8,
    metalness: 0.15,
    roughness: 0.1,
  });
  const opticGlass = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    transmission: 0.45,
    transparent: true,
    opacity: 0.7,
    roughness: 0.08,
    metalness: 0.1,
    ior: 1.5,
  });

  const addPicatinnyRail = (y: number, zStart: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const notch = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.006, 0.014), darkSteel);
      notch.position.set(0, y, zStart - i * 0.024);
      group.add(notch);
    }
  };

  let magazine: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.145, 0.062), polymer);
  let muzzleZ = -0.58;

  if (weaponId === 'assault_rifle') {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.088, 0.43), gunMetal);
    const upperReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.03, 0.38), darkSteel);
    upperReceiver.position.set(0, 0.05, -0.02);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.015, 0.36, 12), darkSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, -0.37);
    const compensator = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.034, 0.065), gunMetal);
    compensator.position.set(0, 0.015, -0.54);
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.066, 0.25), polymer);
    shroud.position.set(0, 0.01, -0.25);
    const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.04, 0.04), darkSteel);
    gasBlock.position.set(0, 0.035, -0.36);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.085, 0.19), polymer);
    stock.position.set(0, -0.012, 0.25);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.11, 0.048), polymer);
    grip.position.set(0, -0.09, 0.08);
    grip.rotation.x = 0.26;
    const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.075, 0.036), polymer);
    foregrip.position.set(0, -0.06, -0.26);
    const sightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.038, 0.095), darkSteel);
    sightFrame.position.set(0, 0.075, -0.02);
    const sightGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.028, 0.024), opticGlass);
    sightGlass.position.set(0, 0.08, 0.029);
    const reticleDot = new THREE.Mesh(new THREE.CircleGeometry(0.003, 8), accentRed);
    reticleDot.position.set(0, 0.08, 0.03);
    const chargeLed = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.014, 0.06), accentRed);
    chargeLed.position.set(-0.033, 0.02, -0.06);
    magazine.position.set(0, -0.105, -0.085);
    magazine.rotation.x = -0.15;
    addPicatinnyRail(0.068, 0.12, 14);
    group.add(
      receiver,
      upperReceiver,
      barrel,
      compensator,
      shroud,
      gasBlock,
      stock,
      grip,
      foregrip,
      sightFrame,
      sightGlass,
      reticleDot,
      chargeLed,
      magazine
    );
    muzzleZ = -0.57;
  } else if (weaponId === 'sniper_rifle') {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.088, 0.5), gunMetal);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.6, 12), darkSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.018, -0.5);
    const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.032, 0.085), gunMetal);
    muzzleBrake.position.set(0, 0.018, -0.78);
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.056, 0.32), polymer);
    shroud.position.set(0, 0.008, -0.3);
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.025, 0.3, 14), darkSteel);
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 0.092, -0.04);
    const scopeBell = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.024, 0.08, 14), gunMetal);
    scopeBell.rotation.x = Math.PI / 2;
    scopeBell.position.set(0, 0.092, -0.19);
    const scopeLens = new THREE.Mesh(new THREE.CircleGeometry(0.019, 14), opticCyan);
    scopeLens.position.set(0, 0.092, 0.112);
    const bipodL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), darkSteel);
    bipodL.position.set(-0.035, -0.03, -0.42);
    bipodL.rotation.x = 1.25;
    const bipodR = bipodL.clone();
    bipodR.position.x = 0.035;
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.09, 0.24), polymer);
    stock.position.set(0, -0.012, 0.29);
    magazine = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.092, 0.084), darkSteel);
    magazine.position.set(0, -0.082, -0.06);
    addPicatinnyRail(0.05, 0.1, 14);
    group.add(
      receiver,
      barrel,
      muzzleBrake,
      shroud,
      scopeTube,
      scopeBell,
      scopeLens,
      bipodL,
      bipodR,
      stock,
      magazine
    );
    muzzleZ = -0.82;
  } else if (weaponId === 'heavy_mg') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.135, 0.46), gunMetal);
    const barrelCluster = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.013, 0.48, 8), darkSteel);
      b.rotation.x = Math.PI / 2;
      b.position.set(Math.cos(a) * 0.03, Math.sin(a) * 0.03, -0.44);
      barrelCluster.add(b);
    }
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.055, 14), polymer);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0, -0.58);
    const heatVent = new THREE.Mesh(new THREE.BoxGeometry(0.122, 0.02, 0.22), accentRed);
    heatVent.position.set(0, 0.035, -0.05);
    const topHandle = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.025, 0.2), darkSteel);
    topHandle.position.set(0, 0.098, -0.05);
    magazine = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.12), polymer);
    magazine.position.set(-0.072, -0.1, -0.05);
    const beltLink = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.08), gunMetal);
    beltLink.position.set(-0.065, -0.02, -0.05);
    group.add(body, barrelCluster, collar, heatVent, topHandle, magazine, beltLink);
    muzzleZ = -0.68;
  } else if (weaponId === 'tactical_rifle') {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.084, 0.34), polymer);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.028, 0.32), darkSteel);
    upper.position.set(0, 0.048, -0.01);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.017, 0.24, 12), darkSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.012, -0.26);
    const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 12), gunMetal);
    suppressor.rotation.x = Math.PI / 2;
    suppressor.position.set(0, 0.012, -0.34);
    const holo = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.04, 0.075), darkSteel);
    holo.position.set(0, 0.072, -0.02);
    const holoDot = new THREE.Mesh(new THREE.CircleGeometry(0.003, 8), accentRed);
    holoDot.position.set(0, 0.075, 0.019);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.18), accentRed);
    stripe.position.set(0, 0.01, -0.05);
    magazine = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.155, 0.046), darkSteel);
    magazine.position.set(0, -0.11, -0.06);
    magazine.rotation.x = -0.1;
    addPicatinnyRail(0.064, 0.1, 10);
    group.add(receiver, upper, barrel, suppressor, holo, holoDot, stripe, magazine);
    muzzleZ = -0.41;
  } else if (weaponId === 'energy_rifle') {
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.105, 0.46), polymer);
    const upperRail = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.03, 0.5), darkSteel);
    upperRail.position.set(0, 0.052, -0.15);
    const lowerRail = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.028, 0.48), gunMetal);
    lowerRail.position.set(0, -0.03, -0.15);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      emissive: 0xe11d48,
      emissiveIntensity: 2.5,
      roughness: 0.15,
      metalness: 0.2,
    });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 12), coreMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.01, -0.19);
    for (let r = 0; r < 4; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.005, 6, 12), darkSteel);
      ring.position.set(0, 0.01, -0.08 - r * 0.075);
      group.add(ring);
    }
    magazine = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.12, 10), coreMat);
    magazine.position.set(0, -0.08, -0.04);
    group.add(chassis, upperRail, lowerRail, core, magazine);
    muzzleZ = -0.45;
  } else if (weaponId === 'shotgun') {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.092, 0.36), gunMetal);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.48, 12), darkSteel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.025, -0.34);
    const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.42, 10), gunMetal);
    magTube.rotation.x = Math.PI / 2;
    magTube.position.set(0, -0.015, -0.31);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.052, 0.19), polymer);
    pump.position.set(0, -0.018, -0.27);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.22), polymer);
    stock.position.set(0, -0.015, 0.24);
    const shellRack = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.036, 0.14), accentRed);
    shellRack.position.set(-0.038, 0.015, -0.02);
    magazine = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.04, 0.09), darkSteel);
    magazine.position.set(0, -0.04, -0.04);
    group.add(receiver, barrel, magTube, pump, stock, shellRack, magazine);
    muzzleZ = -0.59;
  } else if (weaponId === 'plasma_lance') {
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.115, 0.56), darkSteel);
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.026, 0.66), gunMetal);
    railTop.position.set(0, 0.06, -0.22);
    const railBot = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.026, 0.64), gunMetal);
    railBot.position.set(0, -0.042, -0.21);
    const plasmaTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.52, 12), opticCyan);
    plasmaTube.rotation.x = Math.PI / 2;
    plasmaTube.position.set(0, 0.01, -0.24);
    for (let r = 0; r < 5; r++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.008, 6, 14), darkSteel);
      coil.position.set(0, 0.01, -0.06 - r * 0.11);
      group.add(coil);
    }
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.2, 12), polymer);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.096, -0.02);
    magazine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 10), opticCyan);
    magazine.position.set(0, -0.09, 0.0);
    group.add(chassis, railTop, railBot, plasmaTube, scope, magazine);
    muzzleZ = -0.58;
  } else {
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.046, 0.23), gunMetal);
    slide.position.set(0, 0.02, -0.04);
    const sightFront = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.01, 0.012), accentRed);
    sightFront.position.set(0, 0.046, -0.14);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.03, 0.19), polymer);
    frame.position.set(0, -0.015, -0.02);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.044), polymer);
    grip.position.set(0, -0.065, 0.045);
    grip.rotation.x = 0.22;
    magazine = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.08, 0.034), darkSteel);
    magazine.position.set(0, -0.075, 0.045);
    group.add(slide, sightFront, frame, grip, magazine);
    muzzleZ = -0.17;
  }

  // Tactical Gun-Mounted Underbarrel Flashlight Housing + Glowing Lens
  const flashlightLensMat = new THREE.MeshStandardMaterial({
    color: 0xfff8eb,
    emissive: 0xffedd5,
    emissiveIntensity: 2.8,
    roughness: 0.1,
    metalness: 0.15,
  });
  const flashMountPos =
    weaponId === 'pistol'
      ? new THREE.Vector3(0, -0.029, -0.085)
      : weaponId === 'heavy_mg'
        ? new THREE.Vector3(0.056, -0.028, -0.34)
        : new THREE.Vector3(0.028, -0.024, Math.min(-0.18, muzzleZ * 0.64));

  const torchBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.018, 0.04),
    darkSteel
  );
  torchBracket.position.copy(flashMountPos).add(new THREE.Vector3(weaponId === 'pistol' ? 0 : -0.008, 0.008, 0.015));

  const torchBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.082, 12),
    gunMetal
  );
  torchBody.rotation.x = Math.PI / 2;
  torchBody.position.copy(flashMountPos);

  const torchBezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0145, 0.0125, 0.02, 12),
    darkSteel
  );
  torchBezel.rotation.x = Math.PI / 2;
  torchBezel.position.copy(flashMountPos).add(new THREE.Vector3(0, 0, -0.044));

  const torchLens = new THREE.Mesh(new THREE.CircleGeometry(0.0115, 12), flashlightLensMat);
  torchLens.rotation.y = Math.PI;
  torchLens.position.copy(flashMountPos).add(new THREE.Vector3(0, 0, -0.055));

  group.add(torchBracket, torchBody, torchBezel, torchLens);

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  const flashlightPoint = flashMountPos.clone().add(new THREE.Vector3(0, 0, -0.06));
  return {
    group,
    magazine,
    muzzlePoint: new THREE.Vector3(0, 0.018, muzzleZ),
    flashlightPoint,
    flashlightLensMat,
  };
}

export function buildFirstPersonRig(
  charId: CharacterId,
  weaponId: WeaponId,
  textures: ProceduralTextureSet
): FirstPersonRigRefs {
  const charDef = CHARACTERS[charId];
  const root = new THREE.Group();
  const weaponPivot = new THREE.Group();
  root.add(weaponPivot);

  const isHeavy = charId === 'brute' || charId === 'titan';
  const isStealth = charId === 'ghost' || charId === 'phantom';
  const isCloth = charId === 'wanderer' || charId === 'patch' || charId === 'engineer';

  const sleeveMat = new THREE.MeshStandardMaterial({
    color: charDef.armorColor,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(isCloth ? 0.55 : 0.85, isCloth ? 0.55 : 0.85),
    roughnessMap: textures.metalRoughness,
    metalness: isHeavy ? 0.82 : isCloth ? 0.18 : 0.42,
    roughness: isStealth || isCloth ? 0.8 : 0.46,
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: isHeavy ? 0x3b3f46 : charId === 'wanderer' ? 0x2c2018 : charId === 'patch' ? 0xe2e8f0 : 0x15181e,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    metalness: isHeavy ? 0.86 : 0.38,
    roughness: isHeavy ? 0.3 : 0.68,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: charDef.trimColor,
    emissive:
      charId === 'zero'
        ? 0xe11d48
        : charId === 'nyx'
          ? 0x991b1b
          : charId === 'phantom'
            ? 0x9333ea
            : charId === 'patch'
              ? 0x10b981
              : charId === 'engineer'
                ? 0xea580c
                : 0x000000,
    emissiveIntensity:
      charId === 'zero'
        ? 1.8
        : charId === 'phantom' || charId === 'patch' || charId === 'engineer'
          ? 1.15
          : charId === 'nyx'
            ? 0.85
            : 0,
    metalness: 0.72,
    roughness: 0.28,
  });

  // Dynamic grime / blood contamination overlay driven by suit & body wear
  const wearMat = new THREE.MeshStandardMaterial({
    color: 0x5c0d11,
    roughness: 0.28,
    metalness: 0.05,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });

  const armThickness = isHeavy ? 0.074 : isStealth ? 0.044 : 0.054;

  const rightArm = new THREE.Group();
  const rForearm = new THREE.Mesh(new THREE.BoxGeometry(armThickness, armThickness, 0.36), sleeveMat);
  rForearm.position.set(0.16, -0.17, -0.02);
  rForearm.rotation.set(0.18, 0.28, -0.15);
  const rWearPatch = new THREE.Mesh(
    new THREE.BoxGeometry(armThickness * 1.03, armThickness * 0.52, 0.16),
    wearMat
  );
  rWearPatch.position.set(0.14, -0.15, -0.06);
  rWearPatch.rotation.set(0.18, 0.28, -0.15);
  const rElbowPad = new THREE.Mesh(
    new THREE.BoxGeometry(armThickness * 1.18, armThickness * 1.12, 0.08),
    accentMat
  );
  rElbowPad.position.set(0.21, -0.2, 0.09);
  const rGlove = new THREE.Mesh(
    new THREE.BoxGeometry(armThickness * 1.14, armThickness * 1.04, 0.115),
    gloveMat
  );
  rGlove.position.set(0.06, -0.1, -0.14);
  const rThumb = new THREE.Mesh(
    new THREE.BoxGeometry(armThickness * 0.36, armThickness * 0.45, 0.06),
    gloveMat
  );
  rThumb.position.set(0.025, -0.08, -0.15);
  const rCuff = new THREE.Mesh(
    new THREE.BoxGeometry(armThickness * 1.2, armThickness * 1.2, 0.05),
    accentMat
  );
  rCuff.position.set(0.11, -0.13, -0.08);
  rightArm.add(rForearm, rWearPatch, rElbowPad, rGlove, rThumb, rCuff);

  const leftArm = new THREE.Group();
  const lForearm = new THREE.Mesh(new THREE.BoxGeometry(armThickness, armThickness, 0.38), sleeveMat);
  lForearm.position.set(-0.18, -0.18, -0.1);
  lForearm.rotation.set(0.24, -0.45, 0.18);
  const lWearPatch = new THREE.Mesh(
    new THREE.BoxGeometry(armThickness * 1.03, armThickness * 0.52, 0.18),
    wearMat
  );
  lWearPatch.position.set(-0.15, -0.15, -0.14);
  lWearPatch.rotation.set(0.24, -0.45, 0.18);
  const lCuff = new THREE.Mesh(
    new THREE.BoxGeometry(armThickness * 1.18, armThickness * 1.18, 0.05),
    accentMat
  );
  lCuff.position.set(-0.1, -0.11, -0.2);
  lCuff.rotation.y = -0.35;
  const lGlove = new THREE.Mesh(
    new THREE.BoxGeometry(armThickness * 1.12, armThickness * 1.05, 0.12),
    gloveMat
  );
  lGlove.position.set(-0.04, -0.08, -0.26);
  leftArm.add(lForearm, lWearPatch, lCuff, lGlove);

  // Unique first-person wrist & sleeve signatures per operative
  if (charId === 'nyx' || charId === 'engineer') {
    const wristScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.015, 0.068),
      new THREE.MeshStandardMaterial({
        color: charId === 'engineer' ? 0xc2410c : 0x991b1b,
        emissive: charId === 'engineer' ? 0xfb923c : 0xef4444,
        emissiveIntensity: 1.6,
      })
    );
    wristScreen.position.set(-0.12, -0.11, -0.2);
    wristScreen.rotation.y = -0.35;
    leftArm.add(wristScreen);
  } else if (charId === 'patch') {
    const stimVial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.07, 8),
      new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 1.9,
      })
    );
    stimVial.rotation.x = Math.PI / 2;
    stimVial.position.set(-0.12, -0.105, -0.2);
    leftArm.add(stimVial);
  } else if (charId === 'phantom') {
    const cloakBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.036, 0.007, 6, 16),
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x9333ea,
        emissiveIntensity: 2.0,
      })
    );
    cloakBand.position.set(-0.105, -0.115, -0.19);
    cloakBand.rotation.y = -0.35;
    leftArm.add(cloakBand);
  } else if (charId === 'reaper') {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.018, 0.03), accentMat);
    strap.position.set(-0.11, -0.105, -0.19);
    strap.rotation.y = -0.35;
    leftArm.add(strap);
  } else if (charId === 'wanderer') {
    // Shotgun shell holder strapped to forearm
    for (let s = 0; s < 3; s++) {
      const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.036, 8),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.3, roughness: 0.4 })
      );
      shell.position.set(-0.13 + s * 0.016, -0.12, -0.16 - s * 0.018);
      leftArm.add(shell);
    }
  } else if (charId === 'zero') {
    const veinR = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.24), accentMat);
    veinR.position.set(0.13, -0.13, -0.05);
    veinR.rotation.set(0.18, 0.28, 0);
    const veinL = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.24), accentMat);
    veinL.position.set(-0.13, -0.13, -0.16);
    veinL.rotation.set(0.24, -0.45, 0);
    rightArm.add(veinR);
    leftArm.add(veinL);
  } else if (isHeavy) {
    const knuckleR = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.032, 0.042), accentMat);
    knuckleR.position.set(0.06, -0.06, -0.16);
    rightArm.add(knuckleR);
  }

  const {
    group: weaponGroup,
    magazine,
    muzzlePoint,
    flashlightPoint,
    flashlightLensMat,
  } = buildWeaponMesh(weaponId, textures);
  weaponGroup.position.set(0.01, -0.02, -0.24);

  const flashColor =
    weaponId === 'plasma_lance' ? 0x38bdf8 : weaponId === 'energy_rifle' ? 0xfb7185 : 0xffcc66;
  const flashMat = new THREE.MeshBasicMaterial({
    color: flashColor,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  const muzzleFlash = new THREE.Mesh(new THREE.ConeGeometry(0.058, 0.18, 6), flashMat);
  muzzleFlash.rotation.x = -Math.PI / 2;
  muzzleFlash.position.copy(muzzlePoint).add(new THREE.Vector3(0.01, -0.02, -0.3));
  muzzleFlash.visible = false;

  const muzzleLight = new THREE.PointLight(flashColor, 0, 10, 2);
  muzzleLight.position.copy(muzzleFlash.position);

  weaponPivot.add(leftArm, rightArm, weaponGroup, muzzleFlash, muzzleLight);
  weaponPivot.position.set(0.2, -0.22, -0.28);

  const flashlightMountPos = flashlightPoint.clone().add(new THREE.Vector3(0.01, -0.02, -0.24));

  return {
    root,
    weaponPivot,
    leftArm,
    rightArm,
    magazine,
    muzzleFlash,
    muzzleLight,
    flashlightMountPos,
    flashlightLensMat,
    wearMat,
    accentMat,
  };
}

export function buildFullBodyCharacter(
  charId: CharacterId,
  textures: ProceduralTextureSet
): THREE.Group {
  const def = CHARACTERS[charId];
  const group = new THREE.Group();

  const isHeavy = charId === 'brute' || charId === 'titan';
  const isStealth = charId === 'ghost' || charId === 'phantom';
  const isMedic = charId === 'patch';
  const isTech = charId === 'engineer' || charId === 'nyx';
  const isWanderer = charId === 'wanderer';

  const armorMat = new THREE.MeshStandardMaterial({
    color: def.armorColor,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(1.05, 1.05),
    roughnessMap: textures.metalRoughness,
    metalnessMap: textures.metalMetalness,
    metalness: isHeavy ? 0.84 : isWanderer ? 0.25 : 0.56,
    roughness: isStealth || isWanderer ? 0.68 : 0.36,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: def.trimColor,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    metalness: isWanderer ? 0.22 : 0.72,
    roughness: isWanderer ? 0.65 : 0.32,
  });
  const undersuitMat = new THREE.MeshStandardMaterial({
    color: isMedic ? 0x1e293b : isWanderer ? 0x292019 : 0x222732,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    metalness: 0.2,
    roughness: 0.74,
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: isMedic ? 0xdbeafe : isHeavy ? 0x3b4048 : 0x14171c,
    roughness: 0.58,
    metalness: isHeavy ? 0.7 : 0.25,
  });
  const dirtMat = new THREE.MeshStandardMaterial({
    color: 0x3b2c1d,
    roughness: 0.92,
    metalness: 0.04,
    transparent: true,
    opacity: 0.55,
  });
  const bloodWearMat = new THREE.MeshStandardMaterial({
    color: 0x6b0f16,
    roughness: 0.34,
    metalness: 0.06,
    transparent: true,
    opacity: 0.45,
  });

  const skinTone =
    charId === 'reaper'
      ? 0xc99c80
      : charId === 'ghost'
        ? 0xd6b097
        : charId === 'titan'
          ? 0x8f6349
          : charId === 'patch'
            ? 0xdcb8a2
            : charId === 'phantom'
              ? 0xb8998c
              : charId === 'engineer'
                ? 0xc89572
                : charId === 'wanderer'
                  ? 0xb07c5b
                  : 0xb98d72;
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinTone,
    roughness: 0.58,
    metalness: 0.04,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: def.visorColor,
    emissive: def.visorColor,
    emissiveIntensity: 2.1,
    roughness: 0.14,
    metalness: 0.22,
  });
  const stealthMaterials: THREE.MeshStandardMaterial[] = [armorMat, trimMat, undersuitMat];

  const bulk = isHeavy ? 1.32 : isStealth ? 0.88 : isWanderer ? 0.98 : 1.0;
  const heightScale = charId === 'titan' ? 1.15 : charId === 'brute' ? 1.12 : charId === 'ghost' ? 0.99 : 1.0;

  const crackTextures = getArmourCrackTextures();
  const pieceOverlayMeshes: Partial<Record<ArmourPieceId, THREE.Mesh>> = {};
  const pieceOverlayMats: Partial<Record<ArmourPieceId, THREE.MeshBasicMaterial>> = {};
  const makeOverlayMat = (opacity = 0.0) =>
    new THREE.MeshBasicMaterial({
      map: crackTextures.dented,
      transparent: true,
      opacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });

  // Articulated Leg Groups (Leg Armour is NON-DESTRUCTIBLE)
  const leftLegGroup = new THREE.Group();
  const rightLegGroup = new THREE.Group();
  const leftLegArmourGroup = new THREE.Group();
  const rightLegArmourGroup = new THREE.Group();
  leftLegGroup.position.set(-0.135 * bulk, 0.92, 0);
  rightLegGroup.position.set(0.135 * bulk, 0.92, 0);
  leftLegGroup.add(leftLegArmourGroup);
  rightLegGroup.add(rightLegArmourGroup);

  [
    { legGrp: leftLegGroup, armGrp: leftLegArmourGroup, side: -1, pieceId: 'leftLeg' as ArmourPieceId },
    { legGrp: rightLegGroup, armGrp: rightLegArmourGroup, side: 1, pieceId: 'rightLeg' as ArmourPieceId },
  ].forEach(({ legGrp, armGrp, side, pieceId }) => {
    const thigh = new THREE.Mesh(
      createMuscleBellyGeometry(0.088 * bulk, 0.44, 10),
      undersuitMat
    );
    thigh.position.set(0, -0.2, 0);
    const shin = new THREE.Mesh(
      createMuscleBellyGeometry(0.068 * bulk, 0.42, 10),
      undersuitMat
    );
    shin.position.set(0, -0.6, 0);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.148 * bulk, 0.11, 0.27), trimMat);
    boot.position.set(0, -0.865, 0.035);
    const bootToe = new THREE.Mesh(new THREE.BoxGeometry(0.132 * bulk, 0.07, 0.09), armorMat);
    bootToe.position.set(0, -0.88, 0.17);
    const mudSplatter = new THREE.Mesh(new THREE.BoxGeometry(0.152 * bulk, 0.065, 0.28), dirtMat);
    mudSplatter.position.set(0, -0.885, 0.038);
    legGrp.add(thigh, shin, boot, bootToe, mudSplatter);

    // Leg Armour Plating (never removed)
    const thighPlate = new THREE.Mesh(new THREE.BoxGeometry(0.055 * bulk, 0.25, 0.15), trimMat);
    thighPlate.position.set(side * 0.088 * bulk, -0.2, 0.01);
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.065 * bulk, 0.16, 0.12), armorMat);
    holster.position.set(side * 0.105 * bulk, -0.24, 0.03);
    const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.125 * bulk, 0.115, 0.075), trimMat);
    kneePad.position.set(0, -0.4, 0.076 * bulk);
    kneePad.rotation.x = 0.12;
    const shinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.105 * bulk, 0.32, 0.06), armorMat);
    shinGuard.position.set(0, -0.6, 0.068 * bulk);
    shinGuard.rotation.x = -0.06;

    const legOvMat = makeOverlayMat();
    const legOv = new THREE.Mesh(new THREE.PlaneGeometry(0.115 * bulk, 0.28), legOvMat);
    legOv.position.set(0, -0.58, 0.102 * bulk);
    legOv.visible = false;
    pieceOverlayMeshes[pieceId] = legOv;
    pieceOverlayMats[pieceId] = legOvMat;

    armGrp.add(thighPlate, holster, kneePad, shinGuard, legOv);
    group.add(legGrp);
  });

  // Torso & Core Group:
  // 1) undersuitTorsoGroup -> ALWAYS visible clothed operative torso/tunic/vest/coat
  // 2) chestArmourGroup -> DESTRUCTIBLE chest ballistic plate assembly
  // 3) backArmourGroup -> DESTRUCTIBLE back plate + fasteners assembly
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.98, 0);

  const undersuitTorsoGroup = new THREE.Group();
  const chestArmourGroup = new THREE.Group();
  const chestLeftHalf = new THREE.Group();
  const chestRightHalf = new THREE.Group();
  const chestCenterBridge = new THREE.Group();
  chestArmourGroup.add(chestLeftHalf, chestRightHalf, chestCenterBridge);

  const backArmourGroup = new THREE.Group();
  const backMainPlate = new THREE.Group();
  const backFasteners: THREE.Object3D[] = [];
  backArmourGroup.add(backMainPlate);

  // Underlying clothed torso & tactical undersuit (exposed cleanly when chest/back plates shatter)
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.37 * bulk, 0.15, 0.23 * bulk), undersuitMat);
  pelvis.position.set(0, 0, 0);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.42 * bulk, 0.08, 0.29 * bulk), trimMat);
  belt.position.set(0, 0.09, 0);
  undersuitTorsoGroup.add(pelvis, belt);

  for (let p = -1; p <= 1; p += 2) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.095 * bulk, 0.1, 0.065), undersuitMat);
    pouch.position.set(p * 0.135 * bulk, 0.09, 0.155 * bulk);
    undersuitTorsoGroup.add(pouch);
  }

  const abdomen = new THREE.Mesh(createMuscleBellyGeometry(0.18 * bulk, 0.28, 12), undersuitMat);
  abdomen.scale.set(1.05, 1, 0.7);
  abdomen.position.set(0, 0.23, 0);

  // Clothed Tactical Undersuit Shirt / Tunic Core (always visible underneath outer chest/back armor)
  const undersuitCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.385 * bulk, 0.35, 0.225 * bulk),
    undersuitMat
  );
  undersuitCore.position.set(0, 0.41, 0);
  const undersuitRibs = new THREE.Mesh(
    new THREE.BoxGeometry(0.33 * bulk, 0.25, 0.238 * bulk),
    new THREE.MeshStandardMaterial({
      color: isWanderer ? 0x3b2f26 : isMedic ? 0x2a394a : 0x181c24,
      roughness: 0.78,
      metalness: 0.14,
    })
  );
  undersuitRibs.position.set(0, 0.4, 0);
  const shoulderHarnessL = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * bulk, 0.34, 0.245 * bulk),
    trimMat
  );
  shoulderHarnessL.position.set(-0.11 * bulk, 0.41, 0);
  const shoulderHarnessR = shoulderHarnessL.clone();
  shoulderHarnessR.position.x = 0.11 * bulk;
  const collarBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105 * bulk, 0.125 * bulk, 0.07, 12),
    undersuitMat
  );
  collarBase.position.set(0, 0.59, 0);
  undersuitTorsoGroup.add(undersuitCore, undersuitRibs, shoulderHarnessL, shoulderHarnessR, collarBase, abdomen);

  // Destructible Chest Armour Group (Center Sternum Bridge + Left/Right Pec Plates + Collar Guard)
  const chestUnderBacking = new THREE.Mesh(
    new THREE.BoxGeometry(0.41 * bulk, 0.31, 0.08 * bulk),
    armorMat
  );
  chestUnderBacking.position.set(0, 0.41, 0.095 * bulk);
  const sternumPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36 * bulk, 0.28, 0.13 * bulk), trimMat);
  sternumPlate.position.set(0, 0.42, 0.125 * bulk);
  sternumPlate.rotation.x = -0.06;
  const collarGuard = new THREE.Mesh(
    new THREE.TorusGeometry(0.14 * bulk, 0.04, 8, 18, Math.PI * 1.45),
    trimMat
  );
  collarGuard.rotation.x = Math.PI / 2;
  collarGuard.rotation.z = -Math.PI * 0.22;
  collarGuard.position.set(0, 0.58, -0.01);
  const chestScuff = new THREE.Mesh(new THREE.BoxGeometry(0.22 * bulk, 0.11, 0.015), bloodWearMat);
  chestScuff.position.set(-0.07 * bulk, 0.42, 0.195 * bulk);
  chestScuff.rotation.z = 0.28;
  chestCenterBridge.add(chestUnderBacking, sternumPlate, collarGuard, chestScuff);

  const leftPecPlate = new THREE.Mesh(new THREE.BoxGeometry(0.16 * bulk, 0.17, 0.07), armorMat);
  leftPecPlate.position.set(-0.11 * bulk, 0.45, 0.165 * bulk);
  leftPecPlate.rotation.y = 0.14;
  chestLeftHalf.add(leftPecPlate);

  const rightPecPlate = new THREE.Mesh(new THREE.BoxGeometry(0.16 * bulk, 0.17, 0.07), armorMat);
  rightPecPlate.position.set(0.11 * bulk, 0.45, 0.165 * bulk);
  rightPecPlate.rotation.y = -0.14;
  chestRightHalf.add(rightPecPlate);

  const chestCrackMat = makeOverlayMat(0);
  const chestCrackMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35 * bulk, 0.28),
    chestCrackMat
  );
  chestCrackMesh.position.set(0, 0.43, 0.205 * bulk);
  chestCrackMesh.visible = false;
  chestCenterBridge.add(chestCrackMesh);
  pieceOverlayMeshes.chest = chestCrackMesh;
  pieceOverlayMats.chest = chestCrackMat;

  // Destructible Back Armour Group (Rear Ballistic Plate + Spine Pack + 4 Snapping Fasteners)
  const rearBallisticPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.39 * bulk, 0.32, 0.1 * bulk),
    armorMat
  );
  rearBallisticPlate.position.set(0, 0.41, -0.115 * bulk);
  const spinePack = new THREE.Mesh(new THREE.BoxGeometry(0.24 * bulk, 0.35, 0.11), trimMat);
  spinePack.position.set(0, 0.4, -0.165 * bulk);
  backMainPlate.add(rearBallisticPlate, spinePack);

  const fastenerOffsets: [number, number][] = [
    [-0.14 * bulk, 0.52],
    [0.14 * bulk, 0.52],
    [-0.13 * bulk, 0.29],
    [0.13 * bulk, 0.29],
  ];
  fastenerOffsets.forEach(([fx, fy]) => {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.045, 6), trimMat);
    bolt.rotation.x = Math.PI / 2;
    const fz = -0.175 * bulk;
    bolt.position.set(fx, fy, fz);
    bolt.userData.restX = fx;
    bolt.userData.restY = fy;
    bolt.userData.restZ = fz;
    backFasteners.push(bolt);
    backArmourGroup.add(bolt);
  });

  const backCrackMat = makeOverlayMat(0);
  const backCrackMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32 * bulk, 0.32),
    backCrackMat
  );
  backCrackMesh.position.set(0, 0.41, -0.228 * bulk);
  backCrackMesh.rotation.y = Math.PI;
  backCrackMesh.visible = false;
  backMainPlate.add(backCrackMesh);
  pieceOverlayMeshes.back = backCrackMesh;
  pieceOverlayMats.back = backCrackMat;

  // Distinct operative armor / backpack / coat silhouettes placed cleanly in:
  // undersuitTorsoGroup (cloth/coats/undergarment) vs chestArmourGroup vs backArmourGroup
  if (charId === 'reaper') {
    for (let m = -1; m <= 1; m++) {
      const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.06), undersuitMat);
      magPouch.position.set(m * 0.095, 0.31, 0.165);
      undersuitTorsoGroup.add(magPouch);
    }
    const tallyPlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.025), visorMat);
    tallyPlate.position.set(0.11, 0.48, 0.195);
    chestRightHalf.add(tallyPlate);
  } else if (charId === 'ghost') {
    const shroudCape = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.04), undersuitMat);
    shroudCape.position.set(0, 0.28, -0.155);
    shroudCape.rotation.x = 0.12;
    const rangefinderPack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.12), armorMat);
    rangefinderPack.position.set(0, 0.44, -0.2);
    const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.052, 8, 16), undersuitMat);
    scarfCollar.rotation.x = Math.PI / 2;
    scarfCollar.position.set(0, 0.61, 0.01);
    undersuitTorsoGroup.add(shroudCape, scarfCollar);
    backMainPlate.add(rangefinderPack);
  } else if (charId === 'titan' || charId === 'brute') {
    const blastCollar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.34), armorMat);
    blastCollar.position.set(0, 0.57, 0.02);
    const reactorVent = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.22, 10), visorMat);
    reactorVent.rotation.x = Math.PI / 2;
    reactorVent.position.set(0, 0.45, -0.25);
    chestCenterBridge.add(blastCollar);
    backMainPlate.add(reactorVent);
  } else if (charId === 'patch') {
    const whiteMedMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.18 });
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.02), visorMat);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.02), visorMat);
    crossH.position.set(0, 0.45, 0.198);
    crossV.position.set(0, 0.45, 0.198);
    const bioTank = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.4, 12), whiteMedMat);
    bioTank.position.set(-0.08, 0.42, -0.22);
    const stimTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 8), visorMat);
    stimTube.position.set(0.09, 0.42, -0.22);
    chestCenterBridge.add(crossH, crossV);
    backMainPlate.add(bioTank, stimTube);
  } else if (charId === 'phantom') {
    const cloakDrape = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 0.72, 10, 1, true, 0.6, Math.PI * 1.4), undersuitMat);
    cloakDrape.position.set(0, 0.25, -0.08);
    cloakDrape.material.side = THREE.DoubleSide;
    const phaseHarness = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 8, 16), visorMat);
    phaseHarness.position.set(0, 0.44, 0.18);
    const bladeScabbard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.44, 0.05), trimMat);
    bladeScabbard.position.set(0.14, 0.42, -0.21);
    bladeScabbard.rotation.z = -0.35;
    undersuitTorsoGroup.add(cloakDrape);
    chestCenterBridge.add(phaseHarness);
    backMainPlate.add(bladeScabbard);
  } else if (charId === 'engineer' || charId === 'nyx') {
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.16), trimMat);
    backpack.position.set(0, 0.38, -0.23);
    const servoArm = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.36, 0.06), armorMat);
    servoArm.position.set(-0.15, 0.62, -0.21);
    servoArm.rotation.z = 0.28;
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.38, 8), visorMat);
    antenna.position.set(0.12, 0.68, -0.25);
    backMainPlate.add(backpack, servoArm, antenna);
  } else if (charId === 'wanderer') {
    const coatL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.05), trimMat);
    coatL.position.set(-0.14, -0.02, -0.14);
    coatL.rotation.z = -0.08;
    const coatR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.05), trimMat);
    coatR.position.set(0.14, -0.02, -0.14);
    coatR.rotation.z = 0.08;
    const bandolier = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.48, 0.28), trimMat);
    bandolier.position.set(0, 0.41, 0.01);
    bandolier.rotation.z = 0.52;
    undersuitTorsoGroup.add(coatL, coatR, bandolier);
  } else if (charId === 'zero') {
    const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 10, 20), visorMat);
    coreRing.position.set(0, 0.43, 0.14);
    const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), visorMat);
    coreGlow.position.set(0, 0.43, 0.13);
    undersuitTorsoGroup.add(coreRing, coreGlow);
  } else if (charId === 'raven') {
    const ammoRig = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.3), undersuitMat);
    ammoRig.position.set(0, 0.22, 0.02);
    undersuitTorsoGroup.add(ammoRig);
  }

  torsoGroup.add(undersuitTorsoGroup, chestArmourGroup, backArmourGroup);

  // Head Group with Sculpted Realistic Facial Anatomy + Unique Headgear (Helmet Armour is NON-DESTRUCTIBLE)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.64, 0);
  const helmetArmourGroup = new THREE.Group();

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.078, 0.14, 10), skinMat);
  neck.position.set(0, 0.01, 0);
  const headScale = isHeavy ? 1.12 : 1.0;

  // Sculpted Cranium, Face Plane, Jawline, Nose, Brow, Cheekbones & Expressive Eyes
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.118 * headScale, 16, 14), skinMat);
  cranium.scale.set(0.92, 1.06, 1.02);
  cranium.position.set(0, 0.14, -0.005);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.135 * headScale, 0.085, 0.135), skinMat);
  jaw.position.set(0, 0.078, 0.032);
  jaw.rotation.x = 0.1;

  const browRidge = new THREE.Mesh(new THREE.BoxGeometry(0.155 * headScale, 0.03, 0.06), skinMat);
  browRidge.position.set(0, 0.17, 0.095 * headScale);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.028 * headScale, 0.052, 0.042), skinMat);
  nose.position.set(0, 0.132, 0.118 * headScale);
  nose.rotation.x = -0.18;

  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22 });
  const irisMat = new THREE.MeshStandardMaterial({
    color: charId === 'zero' || charId === 'phantom' ? def.visorColor : 0x3b2f2f,
    emissive: charId === 'zero' || charId === 'phantom' ? def.visorColor : 0x000000,
    emissiveIntensity: charId === 'zero' || charId === 'phantom' ? 1.2 : 0,
    roughness: 0.15,
  });

  [-0.042 * headScale, 0.042 * headScale].forEach((ex) => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), scleraMat);
    eyeWhite.position.set(ex, 0.148, 0.1 * headScale);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 8, 8), irisMat);
    iris.position.set(ex, 0.148, 0.112 * headScale);
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.036, 0.045), skinMat);
    cheek.position.set(ex * 1.15, 0.115, 0.09 * headScale);
    headGroup.add(eyeWhite, iris, cheek);
  });

  if (charId === 'reaper' || charId === 'wanderer' || charId === 'titan') {
    const scar = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.052, 0.012), bloodWearMat);
    scar.position.set(0.048 * headScale, 0.135, 0.108 * headScale);
    scar.rotation.z = 0.35;
    headGroup.add(scar);
  }

  headGroup.add(neck, cranium, jaw, browRidge, nose, helmetArmourGroup);

  // Operative-Specific Helmet / Visor / Mask Assembly placed inside helmetArmourGroup (NON-DESTRUCTIBLE)
  if (charId === 'reaper') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.132, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), armorMat);
    cap.position.set(0, 0.15, -0.008);
    const halfMask = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.075, 0.12), trimMat);
    halfMask.position.set(0, 0.072, 0.065);
    const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.034, 0.045), visorMat);
    visorSlit.position.set(0, 0.152, 0.11);
    helmetArmourGroup.add(cap, halfMask, visorSlit);
  } else if (charId === 'ghost') {
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.138, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.72), undersuitMat);
    hood.position.set(0, 0.145, -0.015);
    const faceScarf = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.085, 0.14), undersuitMat);
    faceScarf.position.set(0, 0.07, 0.055);
    const monocle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.04, 12), visorMat);
    monocle.rotation.x = Math.PI / 2;
    monocle.position.set(0.045, 0.152, 0.122);
    helmetArmourGroup.add(hood, faceScarf, monocle);
  } else if (charId === 'titan' || charId === 'brute') {
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.142 * headScale, 16, 12), armorMat);
    helmet.scale.set(0.98, 1.05, 1.08);
    helmet.position.set(0, 0.155, -0.01);
    const browShield = new THREE.Mesh(new THREE.BoxGeometry(0.22 * headScale, 0.055, 0.22), trimMat);
    browShield.position.set(0, 0.215, 0.03);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.175 * headScale, 0.04, 0.055), visorMat);
    visor.position.set(0, 0.155, 0.125);
    const jawGrille = new THREE.Mesh(new THREE.BoxGeometry(0.18 * headScale, 0.07, 0.16), trimMat);
    jawGrille.position.set(0, 0.075, 0.05);
    helmetArmourGroup.add(helmet, browShield, visor, jawGrille);
  } else if (charId === 'patch') {
    const medCap = new THREE.Mesh(new THREE.SphereGeometry(0.132, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), trimMat);
    medCap.position.set(0, 0.155, -0.01);
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.042, 0.045), visorMat);
    goggles.position.set(0, 0.15, 0.112);
    const respMask = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.07, 10), armorMat);
    respMask.rotation.x = Math.PI / 2;
    respMask.position.set(0, 0.08, 0.105);
    helmetArmourGroup.add(medCap, goggles, respMask);
  } else if (charId === 'phantom') {
    const stealthHood = new THREE.Mesh(new THREE.SphereGeometry(0.136, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.68), armorMat);
    stealthHood.position.set(0, 0.148, -0.012);
    const shadowMask = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.075, 0.12), armorMat);
    shadowMask.position.set(0, 0.075, 0.062);
    [-0.04, 0.04].forEach((ox) => {
      const optic = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), visorMat);
      optic.position.set(ox, 0.15, 0.115);
      helmetArmourGroup.add(optic);
    });
    helmetArmourGroup.add(stealthHood, shadowMask);
  } else if (charId === 'engineer' || charId === 'nyx') {
    const hardhat = new THREE.Mesh(new THREE.SphereGeometry(0.134, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), armorMat);
    hardhat.position.set(0, 0.16, -0.005);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.024, 0.12), trimMat);
    brim.position.set(0, 0.195, 0.095);
    const multiLens = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.038, 0.048), visorMat);
    multiLens.position.set(0, 0.154, 0.112);
    const comms = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), trimMat);
    comms.position.set(0.13, 0.24, -0.02);
    helmetArmourGroup.add(hardhat, brim, multiLens, comms);
  } else if (charId === 'wanderer') {
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.128, 0.1, 12), trimMat);
    hatCrown.position.set(0, 0.23, -0.005);
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.23, 0.018, 16), trimMat);
    hatBrim.position.set(0, 0.19, 0.01);
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.036, 0.04), visorMat);
    goggles.position.set(0, 0.162, 0.112);
    const bandana = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.065, 0.125), undersuitMat);
    bandana.position.set(0, 0.068, 0.052);
    helmetArmourGroup.add(hatCrown, hatBrim, goggles, bandana);
  } else {
    const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(0.132 * headScale, 16, 14), armorMat);
    helmetDome.scale.set(0.95, 1.06, 1.08);
    helmetDome.position.set(0, 0.15, -0.01);
    const jawGuard = new THREE.Mesh(new THREE.BoxGeometry(0.19 * headScale, 0.11, 0.19), trimMat);
    jawGuard.position.set(0, 0.09, 0.045);
    jawGuard.rotation.x = 0.14;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.165 * headScale, 0.042, 0.055), visorMat);
    visor.position.set(0, 0.155, 0.118);
    helmetArmourGroup.add(helmetDome, jawGuard, visor);
  }

  const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 10), trimMat);
  earL.rotation.z = Math.PI / 2;
  earL.position.set(-0.125 * headScale, 0.145, 0);
  const earR = earL.clone();
  earR.position.x = -earL.position.x;

  const helmetOvMat = makeOverlayMat();
  const helmetOv = new THREE.Mesh(new THREE.PlaneGeometry(0.16 * headScale, 0.12), helmetOvMat);
  helmetOv.position.set(0, 0.21, 0.132 * headScale);
  helmetOv.rotation.x = -0.35;
  helmetOv.visible = false;
  pieceOverlayMeshes.helmet = helmetOv;
  pieceOverlayMats.helmet = helmetOvMat;

  helmetArmourGroup.add(earL, earR, helmetOv);
  torsoGroup.add(headGroup);

  // Articulated Shoulder Pauldrons, Upper Arms, Forearms & Detailed Gloves (Arm Armour is NON-DESTRUCTIBLE)
  const leftArmGroup = new THREE.Group();
  const rightArmGroup = new THREE.Group();
  const leftArmArmourGroup = new THREE.Group();
  const rightArmArmourGroup = new THREE.Group();
  leftArmGroup.position.set(-0.275 * bulk, 0.5, 0);
  rightArmGroup.position.set(0.275 * bulk, 0.5, 0);
  leftArmGroup.add(leftArmArmourGroup);
  rightArmGroup.add(rightArmArmourGroup);

  [
    { armGrp: leftArmGroup, armArmourGrp: leftArmArmourGroup, dir: -1, pieceId: 'leftArm' as ArmourPieceId },
    { armGrp: rightArmGroup, armArmourGrp: rightArmArmourGroup, dir: 1, pieceId: 'rightArm' as ArmourPieceId },
  ].forEach(({ armGrp, armArmourGrp, dir, pieceId }) => {
    const upperArm = new THREE.Mesh(createMuscleBellyGeometry(0.058 * bulk, 0.26, 10), undersuitMat);
    upperArm.position.set(-dir * 0.01, -0.14, 0.04);
    upperArm.rotation.x = -0.35;
    upperArm.rotation.z = -dir * 0.18;
    const glove = new THREE.Mesh(new THREE.BoxGeometry(0.085 * bulk, 0.09, 0.085), gloveMat);
    glove.position.set(-dir * 0.125, -0.32, 0.31);
    armGrp.add(upperArm, glove);

    const pauldronSize = isHeavy ? new THREE.BoxGeometry(0.22, 0.22, 0.3) : new THREE.BoxGeometry(0.145 * bulk, 0.16, 0.21);
    const pauldron = new THREE.Mesh(pauldronSize, trimMat);
    pauldron.position.set(isHeavy ? dir * 0.045 : dir * 0.01, isHeavy ? 0.03 : 0, 0);
    pauldron.rotation.z = -dir * 0.28;
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.095 * bulk, 0.26, 0.1), armorMat);
    forearm.position.set(-dir * 0.075, -0.29, 0.19);
    forearm.rotation.x = -1.25;
    forearm.rotation.z = -dir * 0.36;

    const armOvMat = makeOverlayMat();
    const armOv = new THREE.Mesh(new THREE.PlaneGeometry(0.12 * bulk, 0.14), armOvMat);
    armOv.position.set(dir * 0.085 * bulk, 0.02, 0);
    armOv.rotation.y = dir * (Math.PI / 2);
    armOv.visible = false;
    pieceOverlayMeshes[pieceId] = armOv;
    pieceOverlayMats[pieceId] = armOvMat;

    armArmourGrp.add(pauldron, forearm, armOv);
    torsoGroup.add(armGrp);
  });

  const { group: weapon } = buildWeaponMesh(def.primaryWeapon, textures);
  weapon.position.set(0.04, 0.21, 0.33);
  weapon.rotation.y = 1.28;
  weapon.rotation.x = 0.12;
  torsoGroup.add(weapon);

  group.add(torsoGroup);

  const shadow = makeContactShadow(textures, 0.55 * bulk);
  group.add(shadow);
  group.scale.setScalar(heightScale);

  const armorColorHex = new THREE.Color(def.armorColor).getHex();
  const trimColorHex = new THREE.Color(def.trimColor).getHex();

  const armourRig: FullBodyArmourRefs = {
    undersuitTorsoGroup,
    chestArmourGroup,
    chestLeftHalf,
    chestRightHalf,
    chestCenterBridge,
    chestCrackMesh,
    chestCrackMat,
    backArmourGroup,
    backMainPlate,
    backFasteners,
    backCrackMesh,
    backCrackMat,
    helmetArmourGroup,
    leftArmArmourGroup,
    rightArmArmourGroup,
    leftLegArmourGroup,
    rightLegArmourGroup,
    pieceOverlayMeshes,
    pieceOverlayMats,
    armorColorHex,
    trimColorHex,
  };

  const rig: FullBodyCharacterRig = {
    headGroup,
    torsoGroup,
    leftArmGroup,
    rightArmGroup,
    leftLegGroup,
    rightLegGroup,
    weaponGroup: weapon,
    armorMat,
    trimMat,
    visorMat,
    stealthMaterials,
    armourRig,
  };
  group.userData.rig = rig;

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj !== shadow) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}

export function buildEnemyModel(
  type: EnemyType,
  textures: ProceduralTextureSet
): EnemyModelRefs {
  if (type === 'the_former') {
    return buildFormerAndCorpseModel('reaper', 'assault_rifle', 'pistol', 0.55, textures);
  }
  const group = new THREE.Group();
  const hitMeshes: THREE.Mesh[] = [];
  const limbs: THREE.Object3D[] = [];
  const legRigs: ArticulatedLegRig[] = [];
  const armRigs: ArticulatedArmRig[] = [];
  const tendrils: TendrilRig[] = [];
  const tentacleChains: TentacleChainRig[] = [];
  const mandibleFlaps: { mesh: THREE.Object3D; axis: 'x' | 'y' | 'z'; dir: number; baseRot: number }[] = [];
  const destructibleArmor: DestructibleArmorPart[] = [];

  // AAA Layered Biomechanical Horror PBR Materials (preserving every monster's silhouette & color identity)
  const darkSteel = new THREE.MeshStandardMaterial({
    color: 0x252c38,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(1.75, 1.75),
    roughnessMap: textures.metalRoughness,
    metalnessMap: textures.metalMetalness,
    metalness: 0.9,
    roughness: 0.42,
    envMapIntensity: 1.25,
  });

  const corrodedArmor = new THREE.MeshStandardMaterial({
    color: 0x35221f,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(1.85, 1.85),
    roughnessMap: textures.metalRoughness,
    metalnessMap: textures.metalMetalness,
    metalness: 0.76,
    roughness: 0.56,
    envMapIntensity: 1.15,
  });

  const chromePiston = new THREE.MeshStandardMaterial({
    color: 0x9aa8bc,
    metalness: 0.95,
    roughness: 0.2,
    envMapIntensity: 1.35,
  });

  const infectedFlesh = new THREE.MeshPhysicalMaterial({
    color: 0x74101c,
    map: textures.infectedFleshMap,
    normalMap: textures.infectedFleshNormal,
    normalScale: new THREE.Vector2(2.1, 2.1),
    roughnessMap: textures.infectedFleshRoughness,
    emissive: 0xb91c1c,
    emissiveMap: textures.infectedEmissiveMap,
    emissiveIntensity: 1.58,
    metalness: 0.06,
    roughness: 0.34,
    clearcoat: 0.96,
    clearcoatRoughness: 0.09,
    sheen: 0.72,
    sheenRoughness: 0.34,
    sheenColor: new THREE.Color(0xf97316),
  });

  const scarredTissue = new THREE.MeshPhysicalMaterial({
    color: 0x1a080c,
    map: textures.infectedFleshMap,
    normalMap: textures.infectedFleshNormal,
    normalScale: new THREE.Vector2(1.75, 1.75),
    roughnessMap: textures.infectedFleshRoughness,
    emissive: 0x5c0a14,
    emissiveIntensity: 0.42,
    roughness: 0.72,
    metalness: 0.06,
    clearcoat: 0.32,
    clearcoatRoughness: 0.38,
    sheen: 0.34,
    sheenColor: new THREE.Color(0xb91c1c),
  });

  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xbfb3a3,
    map: textures.boneMap,
    normalMap: textures.boneNormal,
    normalScale: new THREE.Vector2(1.35, 1.35),
    roughness: 0.38,
    metalness: 0.1,
  });

  const glowingVein = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xea580c,
    emissiveIntensity: 2.85,
    roughness: 0.16,
    metalness: 0.05,
  });

  const eggSacMat = new THREE.MeshPhysicalMaterial({
    color: 0x991b1b,
    emissive: 0xea580c,
    emissiveIntensity: 1.38,
    roughness: 0.18,
    metalness: 0.05,
    clearcoat: 0.95,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.88,
  });

  const flashMaterials: THREE.MeshStandardMaterial[] = [darkSteel, corrodedArmor, infectedFlesh];
  const flashBaseEmissives = flashMaterials.map((m) => ({
    hex: m.emissive.getHex(),
    intensity: m.emissiveIntensity,
  }));
  const eyeRigs: EyeAssemblyRig[] = [];
  const facePlates: THREE.Object3D[] = [];
  const eyeMeshes: THREE.Mesh[] = [];
  const rotatableArmor: THREE.Object3D[] = [];
  const coreMaterials: THREE.MeshStandardMaterial[] = [glowingVein];
  let jawGroup: THREE.Object3D | undefined;

  const scleraDarkMat = new THREE.MeshStandardMaterial({
    color: 0x0b0a0d,
    roughness: 0.14,
    metalness: 0.12,
  });

  const addHitMesh = (mesh: THREE.Mesh, zone: string) => {
    mesh.userData.hitZone = zone;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    hitMeshes.push(mesh);
    return mesh;
  };

  // Helper to construct a recessed 3D orbital eye with socket, eyeball pivot, iris/pupil, and eyelids/shutter
  const createSocketedEye = (opts: {
    parent: THREE.Object3D;
    pos: [number, number, number];
    radius: number;
    isMech?: boolean;
    color?: number;
    emissive?: number;
    intensity?: number;
    rotY?: number;
    rotX?: number;
    slitPupil?: boolean;
    asymmetry?: number;
  }): EyeAssemblyRig => {
    const r = opts.radius;
    const isMech = Boolean(opts.isMech);
    const root = new THREE.Group();
    root.position.set(opts.pos[0], opts.pos[1], opts.pos[2]);
    if (opts.rotY) root.rotation.y = opts.rotY;
    if (opts.rotX) root.rotation.x = opts.rotX;

    // Socket bezel / fleshy orbital ridge
    const socketRim = new THREE.Mesh(
      new THREE.TorusGeometry(r * 1.12, r * 0.28, 7, 14),
      isMech ? darkSteel : scarredTissue
    );
    socketRim.scale.z = 0.72;
    root.add(socketRim);

    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(r * 2.15, r * 0.48, r * 0.85),
      isMech ? corrodedArmor : scarredTissue
    );
    brow.position.set(0, r * 0.96, r * 0.15);
    brow.rotation.x = 0.25;
    root.add(brow);
    facePlates.push(brow);

    // Dark recessed eye backing
    const socketBack = new THREE.Mesh(
      new THREE.SphereGeometry(r * 0.98, 10, 8),
      scleraDarkMat
    );
    socketBack.position.z = -r * 0.18;
    root.add(socketBack);

    // Pivoting eyeball + glowing iris + dark pupil slit/aperture
    const eyeballPivot = new THREE.Group();
    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(r * 0.88, 12, 10),
      isMech ? chromePiston : scleraDarkMat
    );
    sclera.scale.set(1, 1, 0.92);
    eyeballPivot.add(sclera);

    const baseColor = opts.color ?? 0xef4444;
    const baseEmissive = opts.emissive ?? 0xdc2626;
    const baseIntensity = opts.intensity ?? 2.6;
    const eyeMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseEmissive,
      emissiveIntensity: baseIntensity,
      roughness: 0.12,
      metalness: isMech ? 0.25 : 0.05,
    });
    const irisMesh = new THREE.Mesh(
      new THREE.SphereGeometry(r * 0.52, 10, 8),
      eyeMat
    );
    irisMesh.scale.set(1, 1, 0.45);
    irisMesh.position.z = r * 0.68;
    eyeballPivot.add(irisMesh);
    eyeMeshes.push(irisMesh);

    const pupil = new THREE.Mesh(
      opts.slitPupil
        ? new THREE.BoxGeometry(r * 0.16, r * 0.56, r * 0.12)
        : new THREE.SphereGeometry(r * 0.24, 8, 8),
      scleraDarkMat
    );
    pupil.position.z = r * 0.84;
    eyeballPivot.add(pupil);
    root.add(eyeballPivot);

    // Upper & lower articulated eyelids (or mechanical aperture shutters)
    const upperLid = new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.03, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
      isMech ? darkSteel : scarredTissue
    );
    upperLid.rotation.x = -0.78;
    const lowerLid = new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.01, 10, 8, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52),
      isMech ? corrodedArmor : infectedFlesh
    );
    lowerLid.rotation.x = 0.72;
    root.add(upperLid, lowerLid);

    let shutterRing: THREE.Group | undefined;
    if (isMech) {
      shutterRing = new THREE.Group();
      for (let b = 0; b < 4; b++) {
        const ang = (b / 4) * Math.PI * 2;
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(r * 0.62, r * 0.22, r * 0.14),
          chromePiston
        );
        blade.position.set(Math.cos(ang) * r * 0.85, Math.sin(ang) * r * 0.85, r * 0.72);
        blade.rotation.z = ang + 0.5;
        shutterRing.add(blade);
      }
      root.add(shutterRing);
    }

    opts.parent.add(root);

    const rig: EyeAssemblyRig = {
      root,
      eyeballPivot,
      irisMesh,
      upperLid,
      lowerLid,
      shutterRing,
      mat: eyeMat,
      baseColor,
      baseEmissive,
      baseIntensity,
      baseScale: 1,
      blinkPhase: 0,
      nextBlinkTime: 1.4 + Math.random() * 3.8,
      doubleBlinkPending: false,
      saccadeTimer: 0.4 + Math.random() * 1.6,
      saccadeYaw: 0,
      saccadePitch: 0,
      asymmetryOffset: opts.asymmetry ?? (Math.random() - 0.5) * 0.08,
      isMech,
    };
    eyeRigs.push(rig);
    return rig;
  };

  // Helper to attach curved rib bones along a spine
  const addRibcageSet = (
    parent: THREE.Object3D,
    count: number,
    yBase: number,
    yStep: number,
    width: number,
    depth: number,
    zOff: number
  ) => {
    for (let r = 0; r < count; r++) {
      const y = yBase + r * yStep;
      [-1, 1].forEach((side) => {
        const ribCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, y, zOff - depth * 0.45),
          new THREE.Vector3(side * width * 0.65, y - 0.04, zOff),
          new THREE.Vector3(side * width * 0.28, y - 0.09, zOff + depth * 0.42),
        ]);
        const rib = new THREE.Mesh(
          new THREE.TubeGeometry(ribCurve, 8, width * 0.055, 6, false),
          boneMat
        );
        parent.add(rib);
      });
    }
  };

  // Helper to construct a hierarchical multi-segment anatomical tentacle attached cleanly outside body geometry
  const createArticulatedTentacle = (opts: {
    parent: THREE.Object3D;
    anchor: [number, number, number];
    rot: [number, number, number];
    segments: number;
    segLen: number;
    baseRadius: number;
    role: TentacleChainRig['role'];
    phaseOffset: number;
    speedMult?: number;
    amplitude?: number;
    maxAngle?: number;
    sideSign?: number;
    cybernetic?: boolean;
    hookTip?: boolean;
    sensorTip?: boolean;
    chestTetherSide?: number;
    hitZone?: string;
  }): TentacleChainRig => {
    const pivots: THREE.Group[] = [];
    const tendons: THREE.Object3D[] = [];
    const veinRings: THREE.Object3D[] = [];
    const secondaryTips: THREE.Object3D[] = [];

    let currentParent = opts.parent;
    const baseRotEuler = new THREE.Euler(opts.rot[0], opts.rot[1], opts.rot[2]);

    for (let s = 0; s < opts.segments; s++) {
      const t = s / Math.max(1, opts.segments - 1);
      const r = opts.baseRadius * (1 - t * 0.64);
      const pivot = new THREE.Group();
      if (s === 0) {
        pivot.position.set(opts.anchor[0], opts.anchor[1], opts.anchor[2]);
        pivot.rotation.copy(baseRotEuler);
      } else {
        pivot.position.set(0, 0, opts.segLen);
      }

      // Root biomechanical socket collar on segment 0 (metallic flange + muscular cuff)
      if (s === 0) {
        const cuff = new THREE.Mesh(
          new THREE.SphereGeometry(r * 1.32, 9, 8),
          scarredTissue
        );
        const flange = new THREE.Mesh(
          new THREE.TorusGeometry(r * 1.18, r * 0.24, 6, 12),
          opts.cybernetic ? corrodedArmor : darkSteel
        );
        flange.position.z = opts.segLen * 0.08;
        pivot.add(cuff, flange);
      }

      // Sculpted muscular segment oriented along +Z
      const segGeo = createMuscleBellyGeometry(r, opts.segLen * 1.12, 8);
      segGeo.rotateX(Math.PI / 2);
      const segMesh = new THREE.Mesh(
        segGeo,
        s % 2 === 0 ? infectedFlesh : scarredTissue
      );
      segMesh.position.z = opts.segLen * 0.5;
      if (opts.hitZone && s < 2) {
        addHitMesh(segMesh, opts.hitZone);
      }
      pivot.add(segMesh);

      // Visible lateral contracting tendon cords
      [-1, 1].forEach((ts) => {
        const cord = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.24, r * 0.17, opts.segLen * 0.98, 6),
          scarredTissue
        );
        cord.rotation.x = Math.PI / 2;
        cord.position.set(ts * r * 0.88, 0, opts.segLen * 0.5);
        pivot.add(cord);
        tendons.push(cord);
      });

      // Dorsal armored ridge plate on thick heavy tentacles
      if (s < opts.segments - 1 && s % 2 === 0) {
        const dorsalPlate = new THREE.Mesh(
          createBeveledPlateGeometry(r * 1.35, r * 0.48, opts.segLen * 0.58, 0.7),
          opts.cybernetic ? darkSteel : corrodedArmor
        );
        dorsalPlate.position.set(0, r * 0.72, opts.segLen * 0.5);
        pivot.add(dorsalPlate);
      }

      // Pulsating arterial vein ring
      if (s % 2 === 0 || s === opts.segments - 1) {
        const vRing = new THREE.Mesh(
          new THREE.TorusGeometry(r * 0.96, Math.max(0.01, r * 0.19), 5, 10),
          glowingVein
        );
        vRing.position.z = opts.segLen * 0.68;
        pivot.add(vRing);
        veinRings.push(vRing);
      }

      // Fused metallic cable collars for cybernetic appendages
      if (opts.cybernetic && s % 2 === 1) {
        const collar = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 1.2, r * 1.1, opts.segLen * 0.3, 8),
          darkSteel
        );
        collar.rotation.x = Math.PI / 2;
        collar.position.z = opts.segLen * 0.28;
        pivot.add(collar);
      }

      // Tip structures: gripping organic hooks, optical scanner tip, and secondary cilia tendrils
      if (s === opts.segments - 1) {
        const tipCone = new THREE.Mesh(
          createCurvedFangGeometry(r * 0.92, opts.segLen * 1.05),
          opts.hookTip ? boneMat : infectedFlesh
        );
        tipCone.rotation.x = Math.PI / 2;
        tipCone.position.z = opts.segLen * 0.88;
        pivot.add(tipCone);

        if (opts.sensorTip) {
          const opt = new THREE.Mesh(
            new THREE.SphereGeometry(r * 0.88, 8, 8),
            glowingVein
          );
          opt.position.z = opts.segLen * 1.0;
          pivot.add(opt);
        }

        [-1, 1].forEach((side) => {
          const sec = new THREE.Mesh(
            createCurvedFangGeometry(r * 0.38, opts.segLen * 0.74),
            infectedFlesh
          );
          sec.rotation.x = Math.PI / 2 + 0.24;
          sec.rotation.y = side * 0.38;
          sec.position.set(side * r * 0.48, 0, opts.segLen * 0.78);
          pivot.add(sec);
          secondaryTips.push(sec);
        });
      }

      currentParent.add(pivot);
      pivots.push(pivot);
      currentParent = pivot;
    }

    const rig: TentacleChainRig = {
      pivots,
      tendons,
      veinRings,
      secondaryTips,
      baseRotEuler,
      segLen: opts.segLen,
      baseRadius: opts.baseRadius,
      maxAngle: opts.maxAngle ?? 0.42,
      role: opts.role,
      phaseOffset: opts.phaseOffset,
      speedMult: opts.speedMult ?? 1.0,
      amplitude: opts.amplitude ?? 0.28,
      sideSign: opts.sideSign ?? 1,
      chestTetherSide: opts.chestTetherSide,
    };
    tentacleChains.push(rig);
    return rig;
  };

  const builtRefs: EnemyModelRefs = (() => {
  // ---------------------------------------------------------------------------
  // 1. CRAWLER — Hunched Agile Humanoid Biomechanical Scout Frame (~1.8m)
  // ---------------------------------------------------------------------------
  if (type === 'crawler') {
    const pelvis = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.28), darkSteel), 'body');
    pelvis.position.set(0, 0.92, 0);

    const thoraxGroup = new THREE.Group();
    thoraxGroup.position.set(0, 1.32, 0.08);
    thoraxGroup.rotation.x = 0.34;

    const muscleCore = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.24, 0.72, 10), infectedFlesh),
      'body'
    );
    const chestPlate = addHitMesh(
      new THREE.Mesh(createBeveledPlateGeometry(0.56, 0.44, 0.32, 0.72), corrodedArmor),
      'armor'
    );
    chestPlate.position.set(0, 0.08, 0.08);
    chestPlate.rotation.z = 0.08;
    destructibleArmor.push({ mesh: chestPlate, hpThreshold: 0.6, broken: false });

    const bioCore = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), glowingVein);
    bioCore.position.set(-0.06, 0.06, 0.22);
    coreMaterials.push(glowingVein);

    // Exposed wiring harness & spinal hydraulic pistons
    [-0.14, 0.14].forEach((wx, idx) => {
      const wire = new THREE.Mesh(
        createVeinTube([[wx, 0.26, -0.18], [wx * 1.3, 0.02, -0.26], [wx * 0.8, -0.26, -0.14]], 0.022),
        idx === 0 ? glowingVein : darkSteel
      );
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.48, 6), chromePiston);
      piston.position.set(wx * 1.4, 0.04, -0.18);
      thoraxGroup.add(wire, piston);
    });
    thoraxGroup.add(muscleCore, chestPlate, bioCore);
    addRibcageSet(thoraxGroup, 4, -0.14, 0.11, 0.46, 0.34, 0.04);

    // Asymmetrical Distorted Biomechanical Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0.02, 1.78, 0.28);
    const skull = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.17, 0.3, 9), scarredTissue),
      'head'
    );
    const visorPlate = new THREE.Mesh(createBeveledPlateGeometry(0.28, 0.16, 0.24, 0.7), darkSteel);
    visorPlate.position.set(-0.02, 0.05, 0.05);
    visorPlate.rotation.z = -0.12;
    facePlates.push(visorPlate);

    createSocketedEye({ parent: headGroup, pos: [-0.085, 0.04, 0.16], radius: 0.048, isMech: true, rotY: -0.16, slitPupil: true, asymmetry: -0.06 });
    createSocketedEye({ parent: headGroup, pos: [0.09, 0.02, 0.15], radius: 0.036, isMech: false, rotY: 0.2, slitPupil: true, asymmetry: 0.08 });

    const lowerJaw = new THREE.Group();
    lowerJaw.position.set(0, -0.08, 0.05);
    const jawPlate = new THREE.Mesh(createBeveledPlateGeometry(0.22, 0.08, 0.2, 0.72), corrodedArmor);
    jawPlate.position.set(0, -0.02, 0.08);
    lowerJaw.add(jawPlate);
    jawGroup = lowerJaw;
    headGroup.add(skull, visorPlate, lowerJaw);

    group.add(pelvis, thoraxGroup, headGroup);

    // 2 Articulated Humanoid Biomechanical Legs
    [-0.19, 0.19].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 0.88, 0);
      const thigh = addHitMesh(new THREE.Mesh(createMuscleBellyGeometry(0.085, 0.44, 8), infectedFlesh), 'leg');
      thigh.position.y = -0.22;
      const thighPlate = new THREE.Mesh(createBeveledPlateGeometry(0.14, 0.32, 0.12, 0.75), corrodedArmor);
      thighPlate.position.set(lx > 0 ? 0.03 : -0.03, -0.2, 0.05);
      const knee = new THREE.Group();
      knee.position.y = -0.44;
      const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 7, 7), darkSteel);
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.44, 7), darkSteel);
      shin.position.y = -0.22;
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.38, 6), chromePiston);
      piston.position.set(lx > 0 ? 0.06 : -0.06, -0.21, -0.05);
      knee.add(kneeCap, shin, piston);
      hip.add(thigh, thighPlate, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: -0.12, baseKneeX: 0.24 });
    });

    // 2 Articulated Weaponized Salvage-Claw Arms
    [-0.36, 0.36].forEach((ax, i) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 1.56, 0.14);
      const pauldron = new THREE.Mesh(createBeveledPlateGeometry(0.18, 0.16, 0.2, 0.7), corrodedArmor);
      const upper = new THREE.Mesh(createMuscleBellyGeometry(0.065, 0.38, 7), infectedFlesh);
      upper.position.y = -0.2;
      const elbow = new THREE.Group();
      elbow.position.y = -0.38;
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.42, 7), darkSteel);
      forearm.position.y = -0.2;
      const claw = new THREE.Mesh(createCurvedFangGeometry(0.03, 0.28), boneMat);
      claw.rotation.x = Math.PI;
      claw.position.set(0, -0.46, 0.04);
      elbow.add(forearm, claw);
      shoulder.add(pauldron, upper, elbow);
      group.add(shoulder);
      limbs.push(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI + 0.5, baseShoulderX: -0.35, baseElbowX: -0.55 });
    });

    // 2 Compact Dorsal Conduit Tendrils
    [-0.24, 0.24].forEach((tx, idx) => {
      createArticulatedTentacle({
        parent: thoraxGroup,
        anchor: [tx, 0.18, -0.22],
        rot: [-0.25, Math.PI + tx * 1.4, 0],
        segments: 4,
        segLen: 0.26,
        baseRadius: 0.062,
        role: 'sensory',
        phaseOffset: idx * 1.8,
        sideSign: tx > 0 ? 1 : -1,
        cybernetic: true,
        hookTip: true,
      });
    });

    const shadowPlane = makeContactShadow(textures, 0.85);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.46,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: thoraxGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. STALKER — Digitigrade Ribbed Predator with Exposed Bio-Core & Scythes
  // ---------------------------------------------------------------------------
  if (type === 'stalker') {
    const pelvis = addHitMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.28, 8), darkSteel),
      'body'
    );
    pelvis.position.set(0, 1.18, 0);

    const torsoPivot = new THREE.Group();
    torsoPivot.position.set(0, 1.55, 0.05);
    torsoPivot.rotation.x = 0.24;

    // Muscular abdomen + glowing exposed thoracic heart
    const abdomen = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.24, 0.72, 10), infectedFlesh),
      'body'
    );
    const bioHeart = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), glowingVein);
    bioHeart.position.set(0, 0.14, 0.06);
    torsoPivot.add(abdomen, bioHeart);
    addRibcageSet(torsoPivot, 5, -0.05, 0.1, 0.56, 0.42, 0);

    // Segmented protruding steel+bone spinal vertebrae + dorsal spikes
    for (let v = 0; v < 5; v++) {
      const vert = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 6), boneMat);
      vert.position.set(0, -0.1 + v * 0.14, -0.2);
      const dorsalSpur = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.26, 5), darkSteel);
      dorsalSpur.position.set(0, -0.08 + v * 0.14, -0.28);
      dorsalSpur.rotation.x = -0.9;
      torsoPivot.add(vert, dorsalSpur);
    }

    const armorShoulder = addHitMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.2, 0.36), corrodedArmor),
      'armor'
    );
    armorShoulder.position.set(0, 0.44, 0.02);
    torsoPivot.add(armorShoulder);
    destructibleArmor.push({ mesh: armorShoulder, hpThreshold: 0.55, broken: false });

    // Elongated Predator Skull + Asymmetrical Socketed Eyes & Articulated Fang Jaw
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.26, 0.26);
    const cranium = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.18, 0.48, 8), scarredTissue),
      'head'
    );
    cranium.rotation.x = 1.15;
    const steelPlate = new THREE.Mesh(createBeveledPlateGeometry(0.24, 0.12, 0.42, 0.72), darkSteel);
    steelPlate.position.set(0, 0.11, -0.02);
    steelPlate.rotation.x = -0.35;
    facePlates.push(steelPlate);

    createSocketedEye({ parent: headGroup, pos: [-0.095, 0.04, 0.18], radius: 0.046, rotY: -0.18, slitPupil: true, asymmetry: -0.04 });
    createSocketedEye({ parent: headGroup, pos: [0.095, 0.055, 0.18], radius: 0.04, rotY: 0.18, slitPupil: true, asymmetry: 0.05 });

    const stalkerJaw = new THREE.Group();
    stalkerJaw.position.set(0, -0.08, 0.08);
    const sJawBone = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.24), darkSteel);
    sJawBone.position.set(0, -0.02, 0.1);
    const sFangL = new THREE.Mesh(createCurvedFangGeometry(0.022, 0.14), boneMat);
    sFangL.position.set(-0.06, 0.02, 0.18);
    const sFangR = sFangL.clone();
    sFangR.position.x = 0.06;
    stalkerJaw.add(sJawBone, sFangL, sFangR);
    jawGroup = stalkerJaw;
    headGroup.add(cranium, steelPlate, stalkerJaw);

    group.add(pelvis, torsoPivot, headGroup);

    // Digitigrade 2-Joint Predator Legs (Thigh -> Knee -> Reverse Shin -> Claw Foot)
    [-0.22, 0.22].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 1.16, 0);
      const thigh = addHitMesh(
        new THREE.Mesh(createMuscleBellyGeometry(0.11, 0.56, 8), infectedFlesh),
        'leg'
      );
      thigh.position.set(0, -0.25, 0.08);
      thigh.rotation.x = -0.32;

      const knee = new THREE.Group();
      knee.position.set(0, -0.5, 0.18);
      const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), darkSteel);
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.038, 0.64, 7), darkSteel);
      shin.position.set(0, -0.32, -0.09);
      shin.rotation.x = 0.28;
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), chromePiston);
      piston.position.set(0, -0.3, -0.15);
      piston.rotation.x = 0.28;
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 5), boneMat);
      claw.rotation.x = Math.PI / 2;
      claw.position.set(0, -0.62, 0.02);
      knee.add(kneeCap, shin, piston, claw);
      hip.add(thigh, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0, baseKneeX: 0.2 });
    });

    // Twin Mantis-Blade Articulated Scythe Arms
    [-0.44, 0.44].forEach((ax, i) => {
      const side = ax > 0 ? 1 : -1;
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 1.98, 0.14);
      const upperArm = new THREE.Mesh(createMuscleBellyGeometry(0.08, 0.46, 8), infectedFlesh);
      upperArm.position.y = -0.22;

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.44, 0);
      const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), darkSteel);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.14), darkSteel);
      blade.position.set(0, -0.38, 0.06);
      const edge = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.42, 4), boneMat);
      edge.rotation.x = Math.PI;
      edge.position.set(0, -0.92, 0.08);
      const vein = new THREE.Mesh(createVeinTube([[0, 0, 0.04], [side * 0.04, -0.35, 0.08], [0, -0.7, 0.05]], 0.018), glowingVein);
      elbow.add(elbowJoint, blade, edge, vein);
      shoulder.add(upperArm, elbow);
      shoulder.userData.phaseOffset = i * Math.PI + 0.6;
      group.add(shoulder);
      limbs.push(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI + 0.6, baseShoulderX: -0.2, baseElbowX: -0.45 });
    });

    // Stalker ~2x Larger & Thicker Dorsal/Shoulder Sensory & Attack Tentacles anchored outside ribs/shoulders
    [
      [-0.36, 0.46, -0.18, -0.46, -0.45, -0.22, 'sensory', 5, 0.36, 0.088, -1],
      [0.36, 0.46, -0.18, -0.46, 0.45, 0.22, 'sensory', 5, 0.36, 0.088, 1],
      [-0.46, 0.38, 0.08, 0.08, -0.78, 0.08, 'attack', 5, 0.42, 0.1, -1],
      [0.46, 0.38, 0.08, 0.08, 0.78, -0.08, 'attack', 5, 0.42, 0.1, 1],
      [-0.22, -0.22, -0.3, 0.32, Math.PI - 0.36, 0, 'balance', 6, 0.4, 0.094, -1],
      [0.22, -0.22, -0.3, 0.32, Math.PI + 0.36, 0, 'balance', 6, 0.4, 0.094, 1],
    ].forEach(([ax, ay, az, rx, ry, rz, role, segs, slen, rad, side], idx) => {
      createArticulatedTentacle({
        parent: torsoPivot,
        anchor: [ax as number, ay as number, az as number],
        rot: [rx as number, ry as number, rz as number],
        segments: segs as number,
        segLen: slen as number,
        baseRadius: rad as number,
        role: role as TentacleChainRig['role'],
        phaseOffset: idx * 1.63,
        speedMult: 1.05 + (idx % 3) * 0.24,
        amplitude: role === 'balance' ? 0.34 : 0.28,
        maxAngle: 0.44,
        sideSign: side as number,
        hookTip: role === 'attack',
        sensorTip: role === 'sensory',
        hitZone: role === 'attack' ? 'body' : undefined,
      });
    });

    const shadowPlane = makeContactShadow(textures, 0.95);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.55,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoPivot,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. BRUTE — Asymmetrical Armored Siege Juggernaut over Striated Muscle
  // ---------------------------------------------------------------------------
  if (type === 'brute_enemy') {
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.65, 0);

    // Massive striated organic muscle core + swollen dorsal hump
    const chestMuscle = addHitMesh(
      new THREE.Mesh(createOrganicTumorGeometry(0.62, 3.1, 2), infectedFlesh),
      'body'
    );
    chestMuscle.scale.set(1.25, 1.08, 0.95);
    const trapHump = new THREE.Mesh(createOrganicTumorGeometry(0.46, 5.4, 2), scarredTissue);
    trapHump.position.set(0, 0.52, -0.18);
    torsoGroup.add(chestMuscle, trapHump);
    addRibcageSet(torsoGroup, 4, -0.22, 0.2, 1.15, 0.85, 0.14);

    // Welded asymmetrical beveled armored chest ram (destructible)
    const armorChest = addHitMesh(
      new THREE.Mesh(createBeveledPlateGeometry(1.18, 0.72, 0.34, 0.75), corrodedArmor),
      'armor'
    );
    armorChest.position.set(0, 0.18, 0.45);
    armorChest.rotation.x = -0.18;
    torsoGroup.add(armorChest);
    destructibleArmor.push({ mesh: armorChest, hpThreshold: 0.55, broken: false });

    // Glowing dorsal cooling turbine stacks
    [-0.34, 0.34].forEach((sx) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.78, 8), darkSteel);
      pipe.position.set(sx, 0.62, -0.36);
      pipe.rotation.x = -0.28;
      const ember = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 8), glowingVein);
      ember.position.set(sx, 0.98, -0.46);
      torsoGroup.add(pipe, ember);
    });

    // Exposed reactor heart inside chest
    const reactorVent = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.055, 8, 16), glowingVein);
    reactorVent.position.set(0, 0.2, 0.62);
    const reactorCore = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), glowingVein);
    reactorCore.position.set(0, 0.2, 0.58);
    torsoGroup.add(reactorVent, reactorCore);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.38, 0.38);
    const headMaw = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.28, 0.48, 10), scarredTissue),
      'head'
    );
    headMaw.rotation.x = 0.75;
    const helmBrow = new THREE.Mesh(createBeveledPlateGeometry(0.52, 0.18, 0.34, 0.72), corrodedArmor);
    helmBrow.position.set(0, 0.18, 0.08);
    facePlates.push(helmBrow);

    // 3 Asymmetrical glowing socketed Brute eyes
    createSocketedEye({ parent: headGroup, pos: [-0.14, 0.07, 0.22], radius: 0.062, rotY: -0.15, slitPupil: true, asymmetry: -0.05 });
    createSocketedEye({ parent: headGroup, pos: [0.13, 0.05, 0.22], radius: 0.055, isMech: true, rotY: 0.15, asymmetry: 0.04 });
    createSocketedEye({ parent: headGroup, pos: [-0.03, 0.14, 0.2], radius: 0.042, rotY: -0.04, asymmetry: 0.08 });

    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.08, 0.06);
    const jawGuard = new THREE.Mesh(createBeveledPlateGeometry(0.42, 0.18, 0.24, 0.65), darkSteel);
    jawGuard.position.set(0, -0.04, 0.14);
    jawGuard.rotation.x = 0.25;
    jawPivot.add(jawGuard);
    jawGroup = jawPivot;
    const fangGeo = createCurvedFangGeometry(0.032, 0.18);
    for (let f = -2; f <= 2; f++) {
      const fang = new THREE.Mesh(fangGeo, boneMat);
      fang.position.set(f * 0.068, 0.04, 0.18);
      fang.rotation.x = 0.25;
      jawPivot.add(fang);
    }
    headGroup.add(headMaw, helmBrow, jawPivot);
    group.add(torsoGroup, headGroup);

    // Digitigrade Hydraulic + Muscle Legs
    [-0.38, 0.38].forEach((lx, i) => {
      const side = lx > 0 ? 1 : -1;
      const hip = new THREE.Group();
      hip.position.set(lx, 1.12, 0);
      const thigh = addHitMesh(
        new THREE.Mesh(createMuscleBellyGeometry(0.19, 0.58, 9), infectedFlesh),
        'leg'
      );
      thigh.position.set(0, -0.25, 0.08);
      thigh.rotation.x = -0.22;
      const thighCowl = new THREE.Mesh(createBeveledPlateGeometry(0.3, 0.44, 0.22, 0.78), corrodedArmor);
      thighCowl.position.set(side * 0.06, -0.24, 0.18);
      thighCowl.rotation.x = -0.22;

      const knee = new THREE.Group();
      knee.position.set(0, -0.52, 0.12);
      const kneeShield = new THREE.Mesh(createBeveledPlateGeometry(0.3, 0.26, 0.24, 0.7), darkSteel);
      kneeShield.position.set(0, 0, 0.12);
      const shin = addHitMesh(
        new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.56, 8), corrodedArmor),
        'leg'
      );
      shin.position.set(0, -0.3, -0.06);
      shin.rotation.x = 0.16;
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.52, 8), chromePiston);
      piston.position.set(side * 0.16, -0.28, -0.18);
      knee.add(kneeShield, shin, piston);
      hip.add(thigh, thighCowl, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0, baseKneeX: 0.12 });
    });

    // Pile-Driver Hydraulic Siege Arms
    [-0.78, 0.78].forEach((ax, i) => {
      const side = ax > 0 ? 1 : -1;
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 2.02, 0.05);
      const pauldron = addHitMesh(
        new THREE.Mesh(createBeveledPlateGeometry(0.46, 0.44, 0.42, 0.65), corrodedArmor),
        'armor'
      );
      pauldron.rotation.y = side * 0.4;
      pauldron.rotation.z = side * -0.25;
      const bicep = new THREE.Mesh(createMuscleBellyGeometry(0.17, 0.52, 9), infectedFlesh);
      bicep.position.y = -0.28;
      shoulder.add(pauldron, bicep);
      destructibleArmor.push({ mesh: pauldron, hpThreshold: 0.75, broken: false });

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.54, 0);
      const forearmMuscle = new THREE.Mesh(createMuscleBellyGeometry(0.15, 0.5, 9), infectedFlesh);
      forearmMuscle.position.y = -0.25;
      const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.5, 8), darkSteel);
      ram.position.set(0, -0.32, 0.04);
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.45, 8), chromePiston);
      piston.position.set(side * 0.15, -0.24, -0.1);
      for (let c = -1; c <= 1; c++) {
        const claw = new THREE.Mesh(createCurvedFangGeometry(0.045, 0.34), boneMat);
        claw.rotation.x = Math.PI;
        claw.position.set(c * 0.08, -0.66, 0.08);
        elbow.add(claw);
      }
      elbow.add(forearmMuscle, ram, piston);
      shoulder.add(elbow);
      shoulder.userData.phaseOffset = i * Math.PI;
      group.add(shoulder);
      limbs.push(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI, baseShoulderX: -0.12, baseElbowX: -0.35 });
    });

    // Brute ~2x Larger Thick Heavy Muscular Siege Tentacles anchored clearly outside torso/trap hump
    [
      [-0.72, 0.52, -0.22, -0.28, -0.62, -0.15, 'stabilizer', 4, 0.52, 0.22, -1],
      [0.72, 0.52, -0.22, -0.28, 0.62, 0.15, 'stabilizer', 4, 0.52, 0.22, 1],
      [0, 0.72, -0.52, -0.55, Math.PI, 0, 'stabilizer', 4, 0.48, 0.205, 1],
      [-0.64, 0.22, 0.34, 0.16, -0.45, 0, 'attack', 4, 0.54, 0.195, -1],
    ].forEach(([ax, ay, az, rx, ry, rz, role, segs, slen, rad, side], idx) => {
      createArticulatedTentacle({
        parent: torsoGroup,
        anchor: [ax as number, ay as number, az as number],
        rot: [rx as number, ry as number, rz as number],
        segments: segs as number,
        segLen: slen as number,
        baseRadius: rad as number,
        role: role as TentacleChainRig['role'],
        phaseOffset: idx * 2.1,
        speedMult: 0.62 + (idx % 2) * 0.14,
        amplitude: 0.22,
        maxAngle: 0.36,
        sideSign: side as number,
        hookTip: true,
        hitZone: 'body',
      });
    });

    const shadowPlane = makeContactShadow(textures, 1.4);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.82,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. SENTINEL — Corrupted Autonomous Weapon Walker with Pulsing Bio-Brain
  // ---------------------------------------------------------------------------
  if (type === 'sentinel') {
    const chassisGroup = new THREE.Group();
    chassisGroup.position.set(0, 1.75, 0);

    const chassisPlate = addHitMesh(
      new THREE.Mesh(createBeveledPlateGeometry(1.18, 0.92, 0.76, 0.72), corrodedArmor),
      'armor'
    );
    const fleshCore = addHitMesh(
      new THREE.Mesh(createOrganicTumorGeometry(0.52, 7.2, 2), infectedFlesh),
      'body'
    );
    fleshCore.position.set(0, -0.02, 0.26);
    chassisGroup.add(chassisPlate, fleshCore);
    destructibleArmor.push({ mesh: chassisPlate, hpThreshold: 0.5, broken: false });

    // Severed dangling biomechanical conduits
    [[-0.38, -0.45, 0.2], [0.32, -0.45, -0.1], [-0.15, -0.45, 0.35]].forEach(([cx, cy, cz], idx) => {
      const cable = new THREE.Mesh(
        createVeinTube([[cx, cy, cz], [cx + 0.06, cy - 0.35, cz + 0.08], [cx - 0.04, cy - 0.65, cz]], 0.032),
        idx % 2 === 0 ? glowingVein : scarredTissue
      );
      chassisGroup.add(cable);
      tendrils.push({ mesh: cable, phaseOffset: idx * 1.4, baseRotX: 0, baseRotZ: 0 });
    });

    // Sweeping Tri-Lens Shuttered Optical Turret Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.38, 0.16);
    const sensorPod = addHitMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.34, 8), darkSteel),
      'head'
    );
    const bioBrain = new THREE.Mesh(createOrganicTumorGeometry(0.24, 2.1, 2), eggSacMat);
    bioBrain.position.set(0, 0.12, -0.05);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 6), chromePiston);
    antenna.position.set(-0.22, 0.42, -0.08);
    [
      [-0.16, 0, 0.3, 0.068, -0.2],
      [0, 0.02, 0.33, 0.098, 0],
      [0.16, 0, 0.3, 0.068, 0.2],
    ].forEach(([ex, ey, ez, er, ry]) => {
      createSocketedEye({
        parent: headGroup,
        pos: [ex, ey, ez],
        radius: er,
        isMech: true,
        rotY: ry,
      });
    });
    headGroup.add(sensorPod, bioBrain, antenna);

    // Rotary Autocannon Arm wrapped in arterial sinew
    const cannonArm = new THREE.Group();
    cannonArm.position.set(0.76, 1.85, 0.15);
    rotatableArmor.push(cannonArm, chassisPlate);
    const gunHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.56, 8), darkSteel);
    gunHousing.rotation.x = Math.PI / 2;
    for (let b = 0; b < 3; b++) {
      const a = (b / 3) * Math.PI * 2;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.05, 8), chromePiston);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0.48);
      cannonArm.add(barrel);
    }
    const fleshWrap = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 12), infectedFlesh);
    fleshWrap.position.z = 0.25;
    cannonArm.add(gunHousing, fleshWrap);
    group.add(chassisGroup, headGroup, cannonArm);

    [-0.42, 0.42].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 1.28, 0);
      const upper = new THREE.Mesh(createMuscleBellyGeometry(0.14, 0.62, 8), infectedFlesh);
      upper.position.set(0, -0.3, 0.06);
      upper.rotation.x = -0.18;
      const upperGuard = new THREE.Mesh(createBeveledPlateGeometry(0.24, 0.48, 0.16, 0.8), darkSteel);
      upperGuard.position.set(0, -0.3, 0.16);
      upperGuard.rotation.x = -0.18;
      const knee = new THREE.Group();
      knee.position.set(0, -0.6, 0.12);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.66, 8), corrodedArmor);
      lower.position.set(0, -0.32, -0.06);
      lower.rotation.x = 0.14;
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.58, 6), chromePiston);
      piston.position.set(lx > 0 ? 0.12 : -0.12, -0.28, -0.14);
      knee.add(lower, piston);
      hip.add(upper, upperGuard, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0, baseKneeX: 0.1 });
    });

    // Sentinel ~2x Larger Cybernetic Optical Sensor Tentacles anchored cleanly outside chassis
    [
      [-0.64, 0.36, 0.18, -0.2, -0.65, 0.12, -1],
      [0.64, 0.36, 0.18, -0.2, 0.65, -0.12, 1],
      [-0.5, -0.3, -0.36, 0.3, -0.95, 0, -1],
      [0.5, -0.3, -0.36, 0.3, 0.95, 0, 1],
    ].forEach(([ax, ay, az, rx, ry, rz, side], idx) => {
      createArticulatedTentacle({
        parent: chassisGroup,
        anchor: [ax, ay, az],
        rot: [rx, ry, rz],
        segments: 5,
        segLen: 0.36,
        baseRadius: 0.105,
        role: idx < 2 ? 'attack' : 'sensory',
        phaseOffset: idx * 1.75,
        speedMult: 0.85 + (idx % 3) * 0.25,
        amplitude: 0.28,
        maxAngle: 0.4,
        sideSign: side,
        cybernetic: true,
        sensorTip: true,
        hookTip: true,
      });
    });

    const shadowPlane = makeContactShadow(textures, 1.35);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.72,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: chassisGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. SCREAMER — Distended Acoustic Resonator Sentinel that Alerts Nearby Hordes
  // ---------------------------------------------------------------------------
  if (type === 'screamer') {
    const pelvis = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.28), darkSteel), 'body');
    pelvis.position.set(0, 1.05, 0);

    const torsoPivot = new THREE.Group();
    torsoPivot.position.set(0, 1.5, 0);
    const spine = addHitMesh(new THREE.Mesh(createMuscleBellyGeometry(0.2, 0.85, 8), scarredTissue), 'body');
    torsoPivot.add(spine);

    // Distended translucent glowing acoustic lung sac framed by steel megaphone ribs
    const screamerSac = addHitMesh(new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 14), eggSacMat), 'body');
    screamerSac.scale.set(1.05, 1.35, 0.9);
    screamerSac.position.set(0, 0.05, 0.18);
    torsoPivot.add(screamerSac);
    addRibcageSet(torsoPivot, 4, -0.12, 0.11, 0.65, 0.45, 0.06);

    // Metallic acoustic amplifier horns behind shoulders
    [-0.36, 0.36].forEach((hx) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.46, 8, 1, true), darkSteel);
      horn.position.set(hx, 0.34, 0.1);
      horn.rotation.x = Math.PI / 2 - 0.3;
      horn.rotation.z = hx > 0 ? -0.35 : 0.35;
      torsoPivot.add(horn);
    });

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.15, 0.16);
    const throatMaw = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.38, 10), infectedFlesh), 'head');
    throatMaw.rotation.x = 0.8;
    const acousticEye = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 14), glowingVein);
    acousticEye.position.set(0, 0.04, 0.2);

    // Dual socketed trembling eyes + articulated wide-opening sonic jaw
    createSocketedEye({ parent: headGroup, pos: [-0.11, 0.13, 0.18], radius: 0.048, rotY: -0.22, slitPupil: true });
    createSocketedEye({ parent: headGroup, pos: [0.11, 0.13, 0.18], radius: 0.048, rotY: 0.22, slitPupil: true });
    const sonicJaw = new THREE.Group();
    sonicJaw.position.set(0, -0.06, 0.08);
    const sonicJawArch = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.22), darkSteel);
    sonicJawArch.position.set(0, -0.03, 0.11);
    sonicJaw.add(sonicJawArch);
    jawGroup = sonicJaw;

    headGroup.add(throatMaw, acousticEye, sonicJaw);
    group.add(pelvis, torsoPivot, headGroup);

    // 2 Articulated Humanoid Screamer Legs with Hydraulic Shins
    [-0.18, 0.18].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 1.0, 0);
      const thigh = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.52, 7), infectedFlesh), 'leg');
      thigh.position.y = -0.25;
      const knee = new THREE.Group();
      knee.position.y = -0.5;
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.52, 6), darkSteel);
      shin.position.y = -0.25;
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6), chromePiston);
      piston.position.set(lx > 0 ? 0.05 : -0.05, -0.24, -0.04);
      knee.add(shin, piston);
      hip.add(thigh, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0, baseKneeX: 0.15 });
    });

    // 2 Articulated Humanoid Biomechanical Arms (Acoustic Spike Manipulators)
    [-0.4, 0.4].forEach((ax, i) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 1.84, 0.04);
      const upper = new THREE.Mesh(createMuscleBellyGeometry(0.06, 0.42, 7), scarredTissue);
      upper.position.y = -0.2;
      const elbow = new THREE.Group();
      elbow.position.y = -0.42;
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.44, 7), corrodedArmor);
      forearm.position.y = -0.21;
      const wire = new THREE.Mesh(createVeinTube([[0, 0, 0.04], [ax > 0 ? 0.03 : -0.03, -0.2, 0.06], [0, -0.4, 0.03]], 0.016), glowingVein);
      elbow.add(forearm, wire);
      shoulder.add(upper, elbow);
      group.add(shoulder);
      limbs.push(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI + 0.4, baseShoulderX: -0.18, baseElbowX: -0.45 });
    });

    for (let st = 0; st < 4; st++) {
      const side = st % 2 === 0 ? -1 : 1;
      const tier = Math.floor(st / 2);
      createArticulatedTentacle({
        parent: torsoPivot,
        anchor: [side * (0.36 + tier * 0.07), 0.18 + tier * 0.16, -0.14],
        rot: [-0.22 + tier * 0.12, Math.PI + side * (0.45 + tier * 0.2), 0],
        segments: 4,
        segLen: 0.28,
        baseRadius: 0.065,
        role: 'sensory',
        phaseOffset: st * 1.18,
        speedMult: 1.35 + (st % 3) * 0.22,
        amplitude: 0.26,
        maxAngle: 0.42,
        sideSign: side,
        sensorTip: st < 2,
        hookTip: true,
      });
    }

    const shadowPlane = makeContactShadow(textures, 0.85);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.45,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoPivot,
      headGroup,
      screamerSac,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 6. CARRIER — Upright Armored Biomechanical Hazmat Rig with Exposed Bio-Sac
  // ---------------------------------------------------------------------------
  if (type === 'carrier') {
    const pelvis = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.36), darkSteel), 'body');
    pelvis.position.set(0, 1.05, 0);

    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.56, 0);
    const armorFrame = addHitMesh(
      new THREE.Mesh(createBeveledPlateGeometry(0.84, 0.82, 0.48, 0.72), corrodedArmor),
      'armor'
    );
    destructibleArmor.push({ mesh: armorFrame, hpThreshold: 0.6, broken: false });

    const carrierSac = addHitMesh(new THREE.Mesh(createOrganicTumorGeometry(0.46, 7.2, 2), eggSacMat), 'body');
    carrierSac.scale.set(1.02, 1.12, 0.96);
    carrierSac.position.set(0, 0.04, 0.16);
    torsoGroup.add(armorFrame, carrierSac);

    for (let l = 0; l < 3; l++) {
      const larva = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), glowingVein);
      larva.position.set((l - 1) * 0.16, 0.08 + (l === 1 ? 0.1 : -0.05), 0.44);
      torsoGroup.add(larva);
    }

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.2, 0.14);
    const helm = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.34), darkSteel), 'head');
    createSocketedEye({ parent: headGroup, pos: [-0.09, 0.03, 0.18], radius: 0.052, isMech: true, rotY: -0.15, slitPupil: true });
    createSocketedEye({ parent: headGroup, pos: [0.1, 0.01, 0.17], radius: 0.042, rotY: 0.18, slitPupil: true });
    const carrierJaw = new THREE.Group();
    carrierJaw.position.set(0, -0.1, 0.05);
    const cJawMesh = new THREE.Mesh(createBeveledPlateGeometry(0.24, 0.08, 0.2, 0.7), corrodedArmor);
    cJawMesh.position.set(0, -0.02, 0.1);
    carrierJaw.add(cJawMesh);
    jawGroup = carrierJaw;
    headGroup.add(helm, carrierJaw);

    group.add(pelvis, torsoGroup, headGroup);

    // 2 Heavy Bipedal Hydraulic Legs
    [-0.25, 0.25].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 1.0, 0);
      const upper = addHitMesh(new THREE.Mesh(createMuscleBellyGeometry(0.12, 0.5, 8), infectedFlesh), 'leg');
      upper.position.y = -0.25;
      const knee = new THREE.Group();
      knee.position.y = -0.5;
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.5, 8), darkSteel);
      lower.position.y = -0.25;
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.44, 6), chromePiston);
      piston.position.set(lx > 0 ? 0.08 : -0.08, -0.24, -0.06);
      knee.add(lower, piston);
      hip.add(upper, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0, baseKneeX: 0.1 });
    });

    // 2 Grapple Manipulator Arms
    [-0.54, 0.54].forEach((ax, i) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 1.88, 0.05);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.46, 8), corrodedArmor);
      upper.position.y = -0.23;
      const elbow = new THREE.Group();
      elbow.position.y = -0.46;
      const fore = new THREE.Mesh(createMuscleBellyGeometry(0.08, 0.44, 8), infectedFlesh);
      fore.position.y = -0.22;
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.18), darkSteel);
      clamp.position.y = -0.46;
      elbow.add(fore, clamp);
      shoulder.add(upper, elbow);
      group.add(shoulder);
      limbs.push(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI, baseShoulderX: -0.15, baseElbowX: -0.35 });
    });

    // Dorsal Bio-Tank Cables
    [-0.3, 0.3].forEach((tx, idx) => {
      createArticulatedTentacle({
        parent: torsoGroup,
        anchor: [tx, 0.16, -0.26],
        rot: [-0.2, Math.PI + tx, 0],
        segments: 4,
        segLen: 0.3,
        baseRadius: 0.09,
        role: 'stabilizer',
        phaseOffset: idx * 1.4,
        sideSign: tx > 0 ? 1 : -1,
        cybernetic: true,
        hookTip: true,
      });
    });

    const shadowPlane = makeContactShadow(textures, 1.05);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.62,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoGroup,
      headGroup,
      carrierSac,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 7. HOLLOW DWELLER (Independent Emerged Phase 4 Boss Organism)
  // ---------------------------------------------------------------------------
  if (type === 'hollow_dweller') {
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 1.35, 0);
    const brainSac = addHitMesh(new THREE.Mesh(createMuscleBellyGeometry(0.55, 1.0, 12), glowingVein), 'hollow_dweller');
    brainSac.rotation.x = Math.PI / 2;
    const outerMembrane = addHitMesh(new THREE.Mesh(new THREE.SphereGeometry(0.65, 14, 14), eggSacMat), 'body');
    coreGroup.add(brainSac, outerMembrane);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.42, 0.65);
    const maw = addHitMesh(new THREE.Mesh(createMuscleBellyGeometry(0.28, 0.32, 10), infectedFlesh), 'head');
    maw.rotation.x = Math.PI / 2;
    const mawLip = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.095, 8, 16), scarredTissue);
    headGroup.add(maw, mawLip);
    const fangGeo = createCurvedFangGeometry(0.032, 0.24);
    for (let f = 0; f < 10; f++) {
      const a = (f / 10) * Math.PI * 2;
      const tooth = new THREE.Mesh(fangGeo, boneMat);
      tooth.position.set(Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.08);
      tooth.rotation.z = a + Math.PI / 2;
      tooth.rotation.x = 0.7;
      headGroup.add(tooth);
    }
    // 5 Asymmetrical Parasitic Eyes ringed around Hollow Dweller skull
    for (let e = 0; e < 5; e++) {
      const ang = (e / 5) * Math.PI * 1.35 - Math.PI * 0.18;
      createSocketedEye({
        parent: headGroup,
        pos: [Math.cos(ang) * 0.34, Math.abs(Math.sin(ang)) * 0.26 + 0.04, 0.02],
        radius: 0.042 + (e % 2) * 0.015,
        rotY: Math.cos(ang) * 0.32,
        slitPupil: true,
      });
    }

    group.add(coreGroup, headGroup);

    // 6 Long Whip-like Spider/Parasite Tendril Legs (front pair tipped with curved chitin talons)
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const zOff = (Math.floor(i / 2) - 1) * 0.45;
      const hip = new THREE.Group();
      hip.position.set(side * 0.48, 1.25, zOff);
      const upper = new THREE.Mesh(createMuscleBellyGeometry(0.09, 0.85, 8), infectedFlesh);
      upper.rotation.z = side * -1.0;
      upper.position.set(side * 0.35, 0.22, 0);
      const knee = new THREE.Group();
      knee.position.set(side * 0.72, 0.42, 0);
      const lower = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.75, 6), boneMat);
      lower.rotation.z = Math.PI + side * 0.18;
      lower.position.set(side * 0.18, -0.82, 0);
      knee.add(lower);
      if (i < 2) {
        const raptorClaw = new THREE.Mesh(createCurvedFangGeometry(0.045, 0.44), boneMat);
        raptorClaw.position.set(side * 0.3, -1.62, 0.06);
        raptorClaw.rotation.x = Math.PI * 0.75;
        knee.add(raptorClaw);
      }
      hip.add(upper, knee);
      hip.userData.phaseOffset = i * 1.05;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * 1.05, baseHipX: 0, baseKneeX: 0 });
    }

    // Hollow Dweller ~2x Larger Writhing Parasitic Whip Tentacles anchored cleanly outside membrane
    for (let ht = 0; ht < 6; ht++) {
      const a = (ht / 6) * Math.PI * 2;
      createArticulatedTentacle({
        parent: coreGroup,
        anchor: [Math.cos(a) * 0.64, Math.sin(a) * 0.38, -0.45],
        rot: [Math.sin(a) * 0.35, Math.PI + Math.cos(a) * 0.55, 0],
        segments: 5,
        segLen: 0.4,
        baseRadius: 0.11,
        role: ht % 2 === 0 ? 'attack' : 'balance',
        phaseOffset: ht * 1.12,
        speedMult: 1.25 + (ht % 3) * 0.2,
        amplitude: 0.35,
        maxAngle: 0.46,
        sideSign: Math.cos(a) >= 0 ? 1 : -1,
        hookTip: true,
        hitZone: 'body',
      });
    }

    const shadowPlane = makeContactShadow(textures, 1.6);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.62,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: coreGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 7B. THE SCRAPPER — Industrial Machinery, Cables & Twisted Mechanical Limbs
  // ---------------------------------------------------------------------------
  if (type === 'scrapper') {
    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.65,
      roughness: 0.55,
    });
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.35, 0);
    const winchCore = addHitMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.92, 10), darkSteel),
      'body'
    );
    const fleshBinding = addHitMesh(
      new THREE.Mesh(createOrganicTumorGeometry(0.45, 5.2, 2), infectedFlesh),
      'body'
    );
    fleshBinding.position.set(0.06, 0.08, 0.14);
    const hazardChest = addHitMesh(
      new THREE.Mesh(createBeveledPlateGeometry(0.88, 0.68, 0.42, 0.72), hazardMat),
      'armor'
    );
    hazardChest.position.set(0, 0.1, 0.25);
    destructibleArmor.push({ mesh: hazardChest, hpThreshold: 0.6, broken: false });

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.98, 0.22);
    const craneSensor = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.42), corrodedArmor), 'head');
    createSocketedEye({ parent: headGroup, pos: [0, 0.04, 0.22], radius: 0.1, isMech: true });
    createSocketedEye({ parent: headGroup, pos: [-0.14, 0.08, 0.2], radius: 0.042, isMech: true, rotY: -0.2 });
    const scrapperJaw = new THREE.Group();
    scrapperJaw.position.set(0, -0.1, 0.06);
    const crusherJaw = new THREE.Mesh(createBeveledPlateGeometry(0.32, 0.1, 0.24, 0.72), darkSteel);
    crusherJaw.position.set(0, -0.02, 0.14);
    scrapperJaw.add(crusherJaw);
    jawGroup = scrapperJaw;
    headGroup.add(craneSensor, scrapperJaw);
    torsoGroup.add(winchCore, fleshBinding, hazardChest);
    group.add(torsoGroup, headGroup);

    // Saw-arm & Hydraulic claw arm
    [-0.64, 0.64].forEach((ax, idx) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 1.62, 0.05);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.78, 8), corrodedArmor);
      upper.position.y = -0.35;
      const elbow = new THREE.Group();
      elbow.position.y = -0.72;
      const tip =
        idx === 0
          ? new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 12), chromePiston)
          : new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.72, 6), darkSteel);
      tip.rotation.z = idx === 0 ? Math.PI / 2 : 0;
      tip.rotation.x = idx === 1 ? Math.PI / 2 : 0;
      tip.position.set(0, -0.25, 0.26);
      elbow.add(tip);
      shoulder.add(upper, elbow);
      group.add(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: idx * Math.PI, baseShoulderX: -0.25, baseElbowX: -0.5 });
    });

    // Asymmetric twisted legs
    [-0.36, 0.36].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 0.92, 0);
      const thigh = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.5, 8), darkSteel), 'leg');
      thigh.position.y = -0.24;
      const knee = new THREE.Group();
      knee.position.y = -0.48;
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.5, 8), chromePiston);
      shin.position.y = -0.24;
      knee.add(shin);
      hip.add(thigh, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0, baseKneeX: 0.1 });
    });

    // ~2x Larger Cable whip tentacles anchored outside winch core
    for (let t = 0; t < 4; t++) {
      const side = t % 2 === 0 ? -1 : 1;
      createArticulatedTentacle({
        parent: torsoGroup,
        anchor: [side * 0.5, 0.22 - Math.floor(t / 2) * 0.28, -0.34],
        rot: [0.15, Math.PI + side * 0.55, 0],
        segments: 4,
        segLen: 0.38,
        baseRadius: 0.108,
        role: 'attack',
        phaseOffset: t * 1.4,
        sideSign: side,
        cybernetic: true,
        hookTip: true,
      });
    }

    const shadowPlane = makeContactShadow(textures, 1.05);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.6,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 7C. THE WATCHER — Tall Acoustic & Optical Biomechanical Stalker (3.1m)
  // ---------------------------------------------------------------------------
  if (type === 'watcher') {
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.95, 0);
    const spine = addHitMesh(new THREE.Mesh(createMuscleBellyGeometry(0.24, 1.35, 9), scarredTissue), 'body');
    torsoGroup.add(spine);
    addRibcageSet(torsoGroup, 5, -0.35, 0.16, 0.68, 0.5, 0.04);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.82, 0.16);
    const headDish = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.14, 0.34, 12), darkSteel), 'head');
    headDish.rotation.x = Math.PI / 2;
    createSocketedEye({ parent: headGroup, pos: [0, 0.02, 0.18], radius: 0.16, isMech: true, slitPupil: true });
    const acousticEarL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.46, 8, 1, true), corrodedArmor);
    acousticEarL.position.set(-0.38, 0.14, -0.04);
    acousticEarL.rotation.z = 0.65;
    const acousticEarR = acousticEarL.clone();
    acousticEarR.position.x = 0.38;
    acousticEarR.rotation.z = -0.65;
    const watcherJaw = new THREE.Group();
    watcherJaw.position.set(0, -0.18, 0.05);
    const wJawMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.2), darkSteel);
    wJawMesh.position.set(0, -0.02, 0.1);
    watcherJaw.add(wJawMesh);
    jawGroup = watcherJaw;
    headGroup.add(headDish, acousticEarL, acousticEarR, watcherJaw);
    group.add(torsoGroup, headGroup);

    [-0.26, 0.26].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 1.44, 0);
      const thigh = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.74, 8), infectedFlesh), 'leg');
      thigh.position.y = -0.36;
      const knee = new THREE.Group();
      knee.position.y = -0.72;
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.72, 8), darkSteel);
      shin.position.y = -0.36;
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.6, 6), chromePiston);
      piston.position.set(lx > 0 ? 0.07 : -0.07, -0.34, -0.06);
      knee.add(shin, piston);
      hip.add(thigh, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0, baseKneeX: 0.12 });
    });

    // Long Spindly Humanoid Biomechanical Sniper Arms
    [-0.44, 0.44].forEach((ax, i) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 2.38, 0.04);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.56, 7), corrodedArmor);
      upper.position.y = -0.28;
      const elbow = new THREE.Group();
      elbow.position.y = -0.56;
      const fore = new THREE.Mesh(createMuscleBellyGeometry(0.05, 0.56, 7), scarredTissue);
      fore.position.y = -0.28;
      const probe = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.34, 5), darkSteel);
      probe.rotation.x = Math.PI;
      probe.position.y = -0.62;
      elbow.add(fore, probe);
      shoulder.add(upper, elbow);
      group.add(shoulder);
      limbs.push(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI + 0.5, baseShoulderX: -0.15, baseElbowX: -0.4 });
    });

    for (let t = 0; t < 2; t++) {
      const side = t === 0 ? -1 : 1;
      createArticulatedTentacle({
        parent: torsoGroup,
        anchor: [side * 0.34, 0.25, -0.18],
        rot: [-0.2, Math.PI + side * 0.4, 0],
        segments: 4,
        segLen: 0.32,
        baseRadius: 0.072,
        role: 'sensory',
        phaseOffset: t * 1.5,
        sideSign: side,
        sensorTip: true,
        hookTip: true,
      });
    }

    const shadowPlane = makeContactShadow(textures, 0.95);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.5,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 7D. THE HUNTER — Sleek Humanoid Cybernetic Pursuit Assassin (~2.1m)
  // ---------------------------------------------------------------------------
  if (type === 'hunter') {
    const pelvis = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.3), darkSteel), 'body');
    pelvis.position.set(0, 1.05, 0);

    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.54, 0.06);
    torsoGroup.rotation.x = 0.22;

    const chestArmor = addHitMesh(
      new THREE.Mesh(createBeveledPlateGeometry(0.68, 0.66, 0.38, 0.7), corrodedArmor),
      'armor'
    );
    const organicReactor = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.24, 0.6, 9), infectedFlesh),
      'body'
    );
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glowingVein);
    core.position.set(0, 0.08, 0.2);
    destructibleArmor.push({ mesh: chestArmor, hpThreshold: 0.55, broken: false });
    torsoGroup.add(chestArmor, organicReactor, core);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.08, 0.18);
    const grilleMaw = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.32), darkSteel), 'head');
    createSocketedEye({ parent: headGroup, pos: [-0.09, 0.04, 0.16], radius: 0.055, isMech: true, rotY: -0.15, slitPupil: true });
    createSocketedEye({ parent: headGroup, pos: [0.09, 0.02, 0.16], radius: 0.048, isMech: true, rotY: 0.18, slitPupil: true });
    const hunterJaw = new THREE.Group();
    hunterJaw.position.set(0, -0.1, 0.04);
    const bumperJaw = new THREE.Mesh(createBeveledPlateGeometry(0.26, 0.08, 0.2, 0.72), corrodedArmor);
    bumperJaw.position.set(0, -0.02, 0.08);
    hunterJaw.add(bumperJaw);
    jawGroup = hunterJaw;
    headGroup.add(grilleMaw, hunterJaw);
    group.add(pelvis, torsoGroup, headGroup);

    // Reverse-joint High-Speed Pursuit Legs
    [-0.21, 0.21].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 1.0, 0);
      const thigh = addHitMesh(new THREE.Mesh(createMuscleBellyGeometry(0.095, 0.5, 8), infectedFlesh), 'leg');
      thigh.position.y = -0.24;
      const knee = new THREE.Group();
      knee.position.y = -0.48;
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.52, 8), darkSteel);
      shin.position.y = -0.26;
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.44, 6), chromePiston);
      piston.position.set(lx > 0 ? 0.065 : -0.065, -0.24, -0.05);
      knee.add(shin, piston);
      hip.add(thigh, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: -0.1, baseKneeX: 0.22 });
    });

    // Twin Forearm Hunter Blade Arms
    [-0.44, 0.44].forEach((ax, i) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 1.82, 0.08);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.42, 7), corrodedArmor);
      upper.position.y = -0.2;
      const elbow = new THREE.Group();
      elbow.position.y = -0.4;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.14), chromePiston);
      blade.position.set(0, -0.32, 0.06);
      elbow.add(blade);
      shoulder.add(upper, elbow);
      group.add(shoulder);
      limbs.push(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI + 0.5, baseShoulderX: -0.3, baseElbowX: -0.55 });
    });

    const shadowPlane = makeContactShadow(textures, 0.95);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.52,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 7E. THE DROWNED MACHINE — Submerged Turbine & Hydro-Arc Horror
  // ---------------------------------------------------------------------------
  if (type === 'drowned_machine') {
    const aquaGlow = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    coreMaterials.push(aquaGlow);
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.85, 0);
    const bellTank = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.96, 1.45, 12), corrodedArmor), 'armor');
    const organicReactor = addHitMesh(new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 12), infectedFlesh), 'body');
    organicReactor.position.z = 0.22;
    const arcRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 8, 20), aquaGlow);
    arcRing.rotation.x = Math.PI / 2;
    rotatableArmor.push(arcRing);
    torsoGroup.add(bellTank, organicReactor, arcRing);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.85, 0.2);
    const diverHelm = addHitMesh(new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), darkSteel), 'head');
    createSocketedEye({
      parent: headGroup,
      pos: [0, 0.03, 0.38],
      radius: 0.16,
      isMech: true,
      color: 0x38bdf8,
      emissive: 0x0284c7,
      intensity: 2.3,
    });
    const drownedJaw = new THREE.Group();
    drownedJaw.position.set(0, -0.22, 0.14);
    const respGrate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.24), corrodedArmor);
    respGrate.position.set(0, -0.02, 0.14);
    drownedJaw.add(respGrate);
    jawGroup = drownedJaw;
    headGroup.add(diverHelm, drownedJaw);
    group.add(torsoGroup, headGroup);

    [-0.65, 0.65].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 1.15, 0);
      const leg = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 1.15, 8), darkSteel), 'leg');
      leg.position.y = -0.58;
      const knee = new THREE.Group();
      knee.position.y = -0.6;
      hip.add(leg, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0, baseKneeX: 0 });
    });

    // Drowned Machine ~2x Larger Hydro-Cable Tentacles anchored around bell rim
    for (let t = 0; t < 6; t++) {
      const a = (t / 6) * Math.PI * 2;
      createArticulatedTentacle({
        parent: torsoGroup,
        anchor: [Math.cos(a) * 0.94, -0.35, Math.sin(a) * 0.94],
        rot: [0.22, a, 0],
        segments: 5,
        segLen: 0.48,
        baseRadius: 0.165,
        role: 'attack',
        phaseOffset: t * 1.1,
        sideSign: Math.cos(a) >= 0 ? 1 : -1,
        cybernetic: true,
        hookTip: true,
      });
    }

    const shadowPlane = makeContactShadow(textures, 1.8);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.95,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 7F. THE BROODMIND — Command Android Overrun by Neural Bio-Core (~2.25m)
  // ---------------------------------------------------------------------------
  if (type === 'broodmind') {
    const pelvis = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.32), darkSteel), 'body');
    pelvis.position.set(0, 1.08, 0);

    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.58, 0);
    const frame = addHitMesh(new THREE.Mesh(createBeveledPlateGeometry(0.68, 0.72, 0.38, 0.72), corrodedArmor), 'armor');
    const brain = addHitMesh(new THREE.Mesh(createOrganicTumorGeometry(0.32, 6.2, 2), infectedFlesh), 'body');
    brain.position.set(0, 0.1, 0.14);
    const core = addHitMesh(new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 1), glowingVein), 'body');
    core.position.set(0, 0.12, 0.34);
    destructibleArmor.push({ mesh: frame, hpThreshold: 0.6, broken: false });
    torsoGroup.add(frame, brain, core);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.18, 0.08);
    const skull = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), darkSteel), 'head');
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), glowingVein);
    crystal.position.set(0.05, 0.22, 0);
    createSocketedEye({ parent: headGroup, pos: [-0.09, 0.04, 0.17], radius: 0.05, isMech: true, rotY: -0.15 });
    createSocketedEye({ parent: headGroup, pos: [0.09, 0.02, 0.17], radius: 0.056, rotY: 0.15, slitPupil: true });
    headGroup.add(skull, crystal);
    group.add(pelvis, torsoGroup, headGroup);

    [-0.22, 0.22].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 1.04, 0);
      const thigh = addHitMesh(new THREE.Mesh(createMuscleBellyGeometry(0.09, 0.5, 8), scarredTissue), 'leg');
      thigh.position.y = -0.24;
      const knee = new THREE.Group();
      knee.position.y = -0.48;
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.52, 8), darkSteel);
      shin.position.y = -0.26;
      knee.add(shin);
      hip.add(thigh, knee);
      hip.userData.phaseOffset = i * Math.PI;
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0, baseKneeX: 0.1 });
    });

    [-0.46, 0.46].forEach((ax, i) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 1.88, 0.04);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.44, 7), corrodedArmor);
      upper.position.y = -0.22;
      const elbow = new THREE.Group();
      elbow.position.y = -0.44;
      const fore = new THREE.Mesh(createMuscleBellyGeometry(0.06, 0.44, 7), infectedFlesh);
      fore.position.y = -0.22;
      elbow.add(fore);
      shoulder.add(upper, elbow);
      group.add(shoulder);
      limbs.push(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI + 0.4, baseShoulderX: -0.2, baseElbowX: -0.4 });
    });

    for (let r = 0; r < 3; r++) {
      const a = Math.PI + (r - 1) * 0.55;
      createArticulatedTentacle({
        parent: torsoGroup,
        anchor: [Math.sin(a) * 0.3, 0.15, -0.26],
        rot: [-0.2, a, 0],
        segments: 4,
        segLen: 0.34,
        baseRadius: 0.085,
        role: r === 1 ? 'attack' : 'sensory',
        phaseOffset: r * 1.15,
        sideSign: r === 0 ? -1 : 1,
        sensorTip: true,
        hookTip: true,
      });
    }

    const shadowPlane = makeContactShadow(textures, 1.0);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.58,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 7G. HELIOS DEFENCE UNIT — Automated Corrupted Orbital Turret Platform
  // ---------------------------------------------------------------------------
  if (type === 'helios_unit') {
    const holoCyan = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 2.6,
      roughness: 0.15,
    });
    coreMaterials.push(holoCyan);
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.9, 0);
    const chassis = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.65, 1.35, 8), darkSteel), 'armor');
    const core = addHitMesh(new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), holoCyan), 'head');
    core.position.set(0, 0.15, 0.68);
    const wingL = addHitMesh(new THREE.Mesh(createBeveledPlateGeometry(1.1, 0.85, 0.26, 0.65), corrodedArmor), 'armor');
    wingL.position.set(-1.35, 0.2, -0.1);
    wingL.rotation.z = 0.28;
    const wingR = wingL.clone();
    wingR.position.x = 1.35;
    wingR.rotation.z = -0.28;
    rotatableArmor.push(wingL, wingR);
    const gunL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.25, 8), chromePiston);
    gunL.rotation.x = Math.PI / 2;
    gunL.position.set(-1.05, -0.18, 0.45);
    const gunR = gunL.clone();
    gunR.position.x = 1.05;
    torsoGroup.add(chassis, core, wingL, wingR, gunL, gunR);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.05, 0.72);
    createSocketedEye({ parent: headGroup, pos: [0, 0.04, 0.22], radius: 0.22, isMech: true, slitPupil: true });
    createSocketedEye({ parent: headGroup, pos: [-0.34, 0.18, 0.05], radius: 0.075, isMech: true, rotY: -0.35 });
    createSocketedEye({ parent: headGroup, pos: [0.34, 0.18, 0.05], radius: 0.075, isMech: true, rotY: 0.35 });
    group.add(torsoGroup, headGroup);

    const shadowPlane = makeContactShadow(textures, 1.7);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 1.0,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 7H. THE VOID WALKER — Zero-G Ruptured EVA Biomechanical Apparition
  // ---------------------------------------------------------------------------
  if (type === 'void_walker') {
    const evaWhite = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.45,
      roughness: 0.48,
    });
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.55, 0);
    const suitTorso = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.86, 0.44), evaWhite), 'body');
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.28), darkSteel);
    pack.position.set(0, 0.05, -0.34);
    const chestTear = addHitMesh(new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), glowingVein), 'body');
    chestTear.position.set(0, 0.04, 0.2);
    torsoGroup.add(suitTorso, pack, chestTear);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.2, 0.08);
    const helm = addHitMesh(new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 12), evaWhite), 'head');
    const crackedVisor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.1), scleraDarkMat);
    crackedVisor.position.set(0, 0.02, 0.2);
    createSocketedEye({ parent: headGroup, pos: [-0.08, 0.03, 0.23], radius: 0.044, rotY: -0.1, asymmetry: -0.05 });
    createSocketedEye({ parent: headGroup, pos: [0.08, 0.01, 0.23], radius: 0.038, rotY: 0.12, asymmetry: 0.06 });
    const voidJaw = new THREE.Group();
    voidJaw.position.set(0, -0.12, 0.08);
    const helmChin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.18), evaWhite);
    helmChin.position.set(0, -0.03, 0.1);
    voidJaw.add(helmChin);
    jawGroup = voidJaw;
    headGroup.add(helm, crackedVisor, voidJaw);
    group.add(torsoGroup, headGroup);

    [-0.24, 0.24].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 1.08, 0);
      const leg = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.5, 8), evaWhite), 'leg');
      leg.position.y = -0.25;
      const knee = new THREE.Group();
      knee.position.y = -0.5;
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.5, 8), darkSteel);
      shin.position.y = -0.25;
      knee.add(shin);
      hip.add(leg, knee);
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0.14, baseKneeX: 0.12 });
    });

    // Articulated Ruptured EVA Hydraulic Arms
    [-0.46, 0.46].forEach((ax, i) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 1.88, 0.04);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.44, 8), evaWhite);
      upper.position.y = -0.22;
      const elbow = new THREE.Group();
      elbow.position.y = -0.44;
      const fore = new THREE.Mesh(createMuscleBellyGeometry(0.065, 0.44, 8), infectedFlesh);
      fore.position.y = -0.22;
      const clamp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 6), chromePiston);
      clamp.rotation.x = Math.PI;
      clamp.position.y = -0.48;
      elbow.add(fore, clamp);
      shoulder.add(upper, elbow);
      group.add(shoulder);
      limbs.push(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI + 0.5, baseShoulderX: -0.22, baseElbowX: -0.45 });
    });

    for (let u = 0; u < 3; u++) {
      createArticulatedTentacle({
        parent: torsoGroup,
        anchor: [(u - 1) * 0.22, -0.06, -0.42],
        rot: [0.22, Math.PI + (u - 1) * 0.35, 0],
        segments: 4,
        segLen: 0.32,
        baseRadius: 0.076,
        role: 'balance',
        phaseOffset: u * 1.15,
        sideSign: u % 2 === 0 ? -1 : 1,
        hookTip: true,
      });
    }

    const shadowPlane = makeContactShadow(textures, 0.95);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 0.55,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 7I. THE HARVESTER — Mutated-Machine Reclamation Boss (Rotary Saw & Biomass Core)
  // ---------------------------------------------------------------------------
  if (type === 'harvester') {
    const furnaceGlow = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 2.8,
      roughness: 0.2,
    });
    coreMaterials.push(furnaceGlow);
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 2.05, 0);

    const chassis = addHitMesh(
      new THREE.Mesh(createBeveledPlateGeometry(1.45, 1.32, 0.96, 0.72), corrodedArmor),
      'armor'
    );
    const biomassCore = addHitMesh(
      new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 12), furnaceGlow),
      'head'
    );
    biomassCore.position.set(0, 0.05, 0.36);

    const shredderCage = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.06, 8, 16), darkSteel);
    shredderCage.position.set(0, 0.05, 0.44);
    const sawLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 12), chromePiston);
    sawLeft.rotation.z = Math.PI / 2;
    sawLeft.position.set(-1.12, -0.05, 0.55);
    const sawRight = sawLeft.clone();
    sawRight.position.x = 1.12;
    rotatableArmor.push(shredderCage, sawLeft, sawRight);

    const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.85, 8), darkSteel);
    exhaustL.position.set(-0.56, 0.82, -0.35);
    exhaustL.rotation.x = -0.24;
    const exhaustR = exhaustL.clone();
    exhaustR.position.x = 0.56;

    torsoGroup.add(chassis, biomassCore, shredderCage, sawLeft, sawRight, exhaustL, exhaustR);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.95, 0.28);
    const skullCage = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 0.54), darkSteel), 'head');
    createSocketedEye({ parent: headGroup, pos: [-0.14, 0.06, 0.26], radius: 0.085, color: 0xf97316, emissive: 0xea580c, isMech: true });
    createSocketedEye({ parent: headGroup, pos: [0.14, 0.06, 0.26], radius: 0.085, color: 0xf97316, emissive: 0xea580c, isMech: true });
    const harvJaw = new THREE.Group();
    harvJaw.position.set(0, -0.18, 0.14);
    for (let t = -2; t <= 2; t++) {
      const tusk = new THREE.Mesh(createCurvedFangGeometry(0.032, 0.2), chromePiston);
      tusk.position.set(t * 0.09, -0.02, 0.18);
      harvJaw.add(tusk);
    }
    jawGroup = harvJaw;
    headGroup.add(skullCage, harvJaw);

    [-0.58, 0.58].forEach((lx, i) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 1.45, 0);
      const upper = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.78, 8), darkSteel), 'leg');
      upper.position.y = -0.38;
      const knee = new THREE.Group();
      knee.position.y = -0.76;
      const lower = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.72, 8), corrodedArmor), 'leg');
      lower.position.y = -0.35;
      knee.add(lower);
      hip.add(upper, knee);
      group.add(hip);
      limbs.push(hip);
      legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0.12, baseKneeX: 0.16 });
    });

    [-0.95, 0.95].forEach((ax, i) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(ax, 2.38, 0.08);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.28), corrodedArmor);
      upper.position.y = -0.36;
      const elbow = new THREE.Group();
      elbow.position.y = -0.72;
      const fore = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.26), darkSteel);
      fore.position.y = -0.34;
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 6), chromePiston);
      claw.rotation.x = Math.PI;
      claw.position.y = -0.78;
      elbow.add(fore, claw);
      shoulder.add(upper, elbow);
      group.add(shoulder);
      limbs.push(shoulder);
      armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI + 0.4, baseShoulderX: -0.25, baseElbowX: -0.45 });
    });

    for (let t = 0; t < 4; t++) {
      createArticulatedTentacle({
        parent: torsoGroup,
        anchor: [(t - 1.5) * 0.34, 0.2, -0.5],
        rot: [0.3, Math.PI + (t - 1.5) * 0.3, 0],
        segments: 5,
        segLen: 0.38,
        baseRadius: 0.1,
        role: 'attack',
        phaseOffset: t * 1.1,
        sideSign: t % 2 === 0 ? -1 : 1,
        hookTip: true,
      });
    }

    group.add(torsoGroup, headGroup);
    const shadowPlane = makeContactShadow(textures, 1.85);
    group.add(shadowPlane);
    return {
      group,
      hitMeshes,
      limbs,
      legRigs,
      armRigs,
      tendrils,
      tentacleChains,
      torsoExclusionRadius: 1.25,
      mandibleFlaps,
      destructibleArmor,
      torsoPulse: torsoGroup,
      headGroup,
      shadowPlane,
      flashMaterials,
    };
  }

  // ---------------------------------------------------------------------------
  // 8. TITAN / FORGEMASTER / GUARDIAN / ORIGIN / TITANFORGED (Colossal Biomechanical Bosses)
  // ---------------------------------------------------------------------------
  const scale =
    type === 'titan'
      ? 0.72
      : type === 'forgemaster'
        ? 0.92
        : type === 'guardian'
          ? 0.84
          : type === 'origin'
            ? 1.18
            : 1.0;
  const bossRoot = group;

  // Digitigrade Reverse-Joint Heavy Hydraulic + Striated Muscle Legs
  [-1.38, 1.38].forEach((lx, i) => {
    const side = lx > 0 ? 1 : -1;
    const hip = new THREE.Group();
    hip.position.set(lx * scale, 2.95 * scale, 0);

    const thighMuscle = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.5 * scale, 1.65 * scale, 11), infectedFlesh),
      'leg'
    );
    thighMuscle.position.set(0, -0.72 * scale, 0.2 * scale);
    thighMuscle.rotation.x = -0.26;
    const thighArmor = addHitMesh(
      new THREE.Mesh(createBeveledPlateGeometry(0.92 * scale, 1.32 * scale, 0.52 * scale, 0.72), corrodedArmor),
      'armor'
    );
    thighArmor.position.set(side * 0.1 * scale, -0.68 * scale, 0.42 * scale);
    thighArmor.rotation.x = -0.26;
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.11 * scale, 1.45 * scale, 8), chromePiston);
    piston.position.set(side * 0.52 * scale, -0.76 * scale, -0.15 * scale);
    piston.rotation.x = -0.22;
    hip.add(thighMuscle, thighArmor, piston);

    const knee = new THREE.Group();
    knee.position.set(0, -1.42 * scale, 0.36 * scale);
    const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.42 * scale, 10, 10), darkSteel);
    const kneeArmor = new THREE.Mesh(createBeveledPlateGeometry(0.84 * scale, 0.62 * scale, 0.4 * scale, 0.65), darkSteel);
    kneeArmor.position.set(0, 0.08 * scale, 0.36 * scale);
    kneeArmor.rotation.x = 0.25;
    const shinSteel = addHitMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(0.42 * scale, 0.56 * scale, 1.48 * scale, 10), darkSteel),
      'leg'
    );
    shinSteel.position.set(0, -0.75 * scale, -0.26 * scale);
    shinSteel.rotation.x = 0.22;
    const shinGuard = new THREE.Mesh(createBeveledPlateGeometry(0.86 * scale, 1.25 * scale, 0.34 * scale, 0.7), corrodedArmor);
    shinGuard.position.set(0, -0.72 * scale, 0.06 * scale);
    shinGuard.rotation.x = 0.22;
    const calfTendon = new THREE.Mesh(
      createVeinTube([[0, -0.08 * scale, -0.28 * scale], [0, -0.75 * scale, -0.65 * scale], [0, -1.35 * scale, -0.45 * scale]], 0.14 * scale),
      infectedFlesh
    );
    knee.add(kneeJoint, kneeArmor, shinSteel, shinGuard, calfTendon);

    // 3 Splayed Armored Foot Talons + Bone Spurs + Hydraulic Ankle Piston
    const ankleJoint = new THREE.Mesh(new THREE.SphereGeometry(0.4 * scale, 10, 10), darkSteel);
    ankleJoint.position.set(0, -1.36 * scale, -0.22 * scale);
    knee.add(ankleJoint);
    [-0.36, 0, 0.36].forEach((tx, tIdx) => {
      const talon = new THREE.Mesh(
        createBeveledPlateGeometry(0.36 * scale, 0.32 * scale, 1.02 * scale, 0.5),
        corrodedArmor
      );
      talon.position.set(tx * scale, -1.44 * scale, (tIdx === 1 ? 0.16 : 0) * scale);
      talon.rotation.y = tx * -0.5;
      const clawTip = new THREE.Mesh(createCurvedFangGeometry(0.09 * scale, 0.42 * scale), boneMat);
      clawTip.position.set(0, -0.06 * scale, 0.48 * scale);
      clawTip.rotation.x = Math.PI / 2.2;
      talon.add(clawTip);
      knee.add(talon);
    });

    hip.add(knee);
    hip.userData.phaseOffset = i * Math.PI;
    bossRoot.add(hip);
    limbs.push(hip);
    legRigs.push({ hip, knee, phaseOffset: i * Math.PI, baseHipX: 0, baseKneeX: 0.08 });
  });

  // Hulking Biomechanical Torso + Hunched Organic Trapezius + Beveled Dorsal Carapace
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 4.45 * scale, 0);

  const abdomenCore = addHitMesh(
    new THREE.Mesh(createMuscleBellyGeometry(1.15 * scale, 1.9 * scale, 12), scarredTissue),
    'body'
  );
  abdomenCore.position.set(0, -0.75 * scale, 0.05 * scale);
  torsoGroup.add(abdomenCore);

  const fleshTorso = addHitMesh(
    new THREE.Mesh(createOrganicTumorGeometry(1.58 * scale, 4.2, 2), infectedFlesh),
    'body'
  );
  fleshTorso.scale.set(1.16, 1.0, 0.86);
  fleshTorso.position.set(0, 0.12 * scale, 0.06 * scale);
  torsoGroup.add(fleshTorso);

  const hunchedCarapace = addHitMesh(
    new THREE.Mesh(createBeveledPlateGeometry(3.25 * scale, 2.75 * scale, 1.45 * scale, 0.68), corrodedArmor),
    'armor'
  );
  hunchedCarapace.position.set(0, 0.35 * scale, -0.55 * scale);
  hunchedCarapace.rotation.x = 0.24;
  torsoGroup.add(hunchedCarapace);

  // Dorsal Vertebral Bone Spines + Glowing Heat Exhaust Turbines
  for (let v = 0; v < 5; v++) {
    const spineCone = new THREE.Mesh(createCurvedFangGeometry(0.18 * scale, 0.85 * scale), boneMat);
    spineCone.position.set(0, (-0.7 + v * 0.56) * scale, -1.25 * scale);
    spineCone.rotation.x = -0.95;
    torsoGroup.add(spineCone);
  }
  [-0.95, 0.95].forEach((sx) => {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.26 * scale, 0.38 * scale, 2.0 * scale, 10), darkSteel);
    stack.position.set(sx * scale, 2.0 * scale, -0.95 * scale);
    stack.rotation.x = -0.25;
    const stackGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.22 * scale, 0.22 * scale, 10), glowingVein);
    stackGlow.position.set(sx * scale, 2.95 * scale, -1.18 * scale);
    torsoGroup.add(stack, stackGlow);
  });

  addRibcageSet(torsoGroup, 5, -0.82 * scale, 0.38 * scale, 2.85 * scale, 1.55 * scale, 0.22 * scale);

  // Creeping biomechanical arteries across boss shoulders/back
  [
    [[-1.6 * scale, 1.2 * scale, 0.4 * scale], [-0.8 * scale, 1.45 * scale, 0.85 * scale], [0, 1.1 * scale, 0.95 * scale]],
    [[1.6 * scale, 1.2 * scale, 0.4 * scale], [0.8 * scale, 1.45 * scale, 0.85 * scale], [0, 1.1 * scale, 0.95 * scale]],
  ].forEach((pts) => {
    torsoGroup.add(new THREE.Mesh(createVeinTube(pts as [number, number, number][], 0.095 * scale), glowingVein));
  });

  bossRoot.add(torsoGroup);

  // Articulated Massive Arms + Curved Shoulder Cowls + Hydraulic Claws
  const armParts: THREE.Mesh[] = [];
  [-2.35, 2.35].forEach((ax, i) => {
    const side = ax > 0 ? 1 : -1;
    const shoulder = new THREE.Group();
    shoulder.position.set(ax * scale, 5.45 * scale, 0.2 * scale);

    const exposedDeltoid = new THREE.Mesh(
      createOrganicTumorGeometry(0.64 * scale, 2.2 + i, 2),
      infectedFlesh
    );
    exposedDeltoid.scale.set(1.0, 1.25, 1.0);
    exposedDeltoid.position.y = -0.35 * scale;
    const pauldron = addHitMesh(
      new THREE.Mesh(createBeveledPlateGeometry(1.48 * scale, 1.32 * scale, 1.05 * scale, 0.6), corrodedArmor),
      'arm_armor'
    );
    pauldron.rotation.y = side * 0.45;
    pauldron.rotation.z = side * -0.28;
    const shoulderSpike = new THREE.Mesh(createCurvedFangGeometry(0.22 * scale, 1.15 * scale), boneMat);
    shoulderSpike.position.set(side * 0.32 * scale, 0.65 * scale, 0);
    shoulderSpike.rotation.z = side * -0.35;
    pauldron.add(shoulderSpike);
    shoulder.add(exposedDeltoid, pauldron);
    destructibleArmor.push({ mesh: pauldron, hpThreshold: 0.75, broken: false });

    const elbow = new THREE.Group();
    elbow.position.set(0, -1.15 * scale, 0);
    const elbowSocket = new THREE.Mesh(new THREE.SphereGeometry(0.38 * scale, 10, 10), darkSteel);
    const forearm = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.48 * scale, 1.85 * scale, 10), infectedFlesh),
      'arm_armor'
    );
    forearm.position.y = -0.85 * scale;
    const gauntlet = new THREE.Mesh(createBeveledPlateGeometry(0.86 * scale, 0.94 * scale, 0.78 * scale, 0.72), darkSteel);
    gauntlet.position.y = -1.35 * scale;
    const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 1.3 * scale, 8), chromePiston);
    piston.position.set(side * 0.38 * scale, -0.7 * scale, -0.25 * scale);
    for (let f = -1; f <= 1; f++) {
      const talon = new THREE.Mesh(createCurvedFangGeometry(0.11 * scale, 0.98 * scale), boneMat);
      talon.rotation.x = Math.PI;
      talon.position.set(f * 0.24 * scale, -1.85 * scale, 0.25 * scale);
      elbow.add(talon);
    }
    elbow.add(elbowSocket, forearm, gauntlet, piston);
    shoulder.add(elbow);
    shoulder.userData.phaseOffset = i * Math.PI;
    bossRoot.add(shoulder);
    limbs.push(shoulder);
    armRigs.push({ shoulder, elbow, phaseOffset: i * Math.PI, baseShoulderX: -0.1, baseElbowX: -0.28 });
    armParts.push(pauldron, forearm);
  });

  // Angled Beveled Hydraulic Blast Chest Hatch Doors + Bolted Seam Trim
  const chestHatchLeft = addHitMesh(
    new THREE.Mesh(createBeveledPlateGeometry(1.36 * scale, 2.25 * scale, 0.42 * scale, 0.8), corrodedArmor),
    'chest_armor'
  );
  chestHatchLeft.position.set(-0.72 * scale, 4.48 * scale, 1.12 * scale);
  chestHatchLeft.rotation.y = 0.16;
  const chestHatchRight = addHitMesh(
    new THREE.Mesh(createBeveledPlateGeometry(1.36 * scale, 2.25 * scale, 0.42 * scale, 0.8), corrodedArmor),
    'chest_armor'
  );
  chestHatchRight.position.set(0.72 * scale, 4.48 * scale, 1.12 * scale);
  chestHatchRight.rotation.y = -0.16;
  [chestHatchLeft, chestHatchRight].forEach((hatch, hIdx) => {
    const latchBrace = new THREE.Mesh(
      new THREE.BoxGeometry(0.24 * scale, 1.65 * scale, 0.14 * scale),
      darkSteel
    );
    latchBrace.position.set((hIdx === 0 ? 0.48 : -0.48) * scale, 0, 0.2 * scale);
    hatch.add(latchBrace);
  });
  bossRoot.add(chestHatchLeft, chestHatchRight);

  // Parasite Regeneration Tissue Nodes nestled in chest seam, neck collar & shoulder seams
  const regenMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0xdc2626,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    metalness: 0.05,
  });
  const regenNodes: THREE.Mesh[] = [];
  if (type === 'titanforged') {
    const nodePositions: [number, number, number, number][] = [
      [0, 0.45 * scale, 1.05 * scale, 0.32 * scale],
      [-0.78 * scale, 0.98 * scale, 0.72 * scale, 0.26 * scale],
      [0.78 * scale, 0.98 * scale, 0.72 * scale, 0.26 * scale],
      [-1.35 * scale, 0.75 * scale, 0.35 * scale, 0.28 * scale],
      [1.35 * scale, 0.75 * scale, 0.35 * scale, 0.28 * scale],
      [0, 1.38 * scale, 0.35 * scale, 0.3 * scale],
    ];
    nodePositions.forEach(([nx, ny, nz, nr], nIdx) => {
      const nodeMesh = new THREE.Mesh(
        createOrganicTumorGeometry(nr, 3.1 + nIdx * 1.4, 1),
        regenMat
      );
      nodeMesh.position.set(nx, ny, nz);
      torsoGroup.add(nodeMesh);
      regenNodes.push(nodeMesh);
    });
  }

  // THE HOLLOW & INNER HOLLOW DWELLER ORGANISM
  const hollowCavity = new THREE.Group();
  hollowCavity.position.set(0, 4.45 * scale, 0.85 * scale);
  const cavityGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.0 * scale, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x3b070c,
      emissive: 0x991b1b,
      emissiveIntensity: 1.75,
      roughness: 0.35,
    })
  );
  hollowCavity.add(cavityGlow);
  addRibcageSet(hollowCavity, 4, -0.65 * scale, 0.42 * scale, 1.8 * scale, 0.9 * scale, 0.1 * scale);

  const hollowDweller = new THREE.Group();
  hollowDweller.position.set(0, 0, 0.28 * scale);
  const dwellerCore = addHitMesh(
    new THREE.Mesh(new THREE.DodecahedronGeometry(0.62 * scale, 1), glowingVein),
    'hollow_dweller'
  );
  const dwellerSac = new THREE.Mesh(new THREE.SphereGeometry(0.74 * scale, 12, 12), eggSacMat);
  hollowDweller.add(dwellerCore, dwellerSac);
  for (let t = 0; t < 6; t++) {
    const ang = (t / 6) * Math.PI * 2;
    const tendon = new THREE.Mesh(
      createMuscleBellyGeometry(0.09 * scale, 1.2 * scale, 7),
      infectedFlesh
    );
    tendon.position.set(Math.cos(ang) * 0.58 * scale, Math.sin(ang) * 0.58 * scale, -0.1 * scale);
    tendon.rotation.z = ang + Math.PI / 2;
    hollowDweller.add(tendon);
  }
  hollowCavity.add(hollowDweller);
  hollowCavity.visible = false;
  bossRoot.add(hollowCavity);

  // Distinct Boss Silhouette Attachments for Titan / Forgemaster / Guardian / Origin
  if (type === 'titan') {
    const hazardYellow = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.7, roughness: 0.45 });
    const gantryFrame = new THREE.Mesh(new THREE.BoxGeometry(2.8 * scale, 1.1 * scale, 0.55 * scale), hazardYellow);
    gantryFrame.position.set(0, 1.95 * scale, -0.75 * scale);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.24 * scale, 8, 8), glowingVein);
    beacon.position.set(1.15 * scale, 2.55 * scale, -0.75 * scale);
    torsoGroup.add(gantryFrame, beacon);
  } else if (type === 'forgemaster') {
    const forgeEmissive = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xff5500,
      emissiveIntensity: 2.8,
      roughness: 0.22,
    });
    coreMaterials.push(forgeEmissive);
    const furnaceCore = new THREE.Mesh(new THREE.CylinderGeometry(0.85 * scale, 0.95 * scale, 0.65 * scale, 10), forgeEmissive);
    furnaceCore.rotation.x = Math.PI / 2;
    furnaceCore.position.set(0, -0.05 * scale, 0.85 * scale);
    torsoGroup.add(furnaceCore);
  } else if (type === 'guardian') {
    [-1.1, 1.1].forEach((sx) => {
      const sporePod = new THREE.Mesh(createOrganicTumorGeometry(0.68 * scale, sx > 0 ? 4.2 : 1.9, 2), eggSacMat);
      sporePod.position.set(sx * scale, 1.65 * scale, -0.35 * scale);
      torsoGroup.add(sporePod);
    });
  } else if (type === 'origin') {
    const originCrimson = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 3.0,
      roughness: 0.14,
    });
    coreMaterials.push(originCrimson);
    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(2.35 * scale, 0.18 * scale, 8, 24), darkSteel);
    haloRing.position.set(0, 1.55 * scale, -0.85 * scale);
    rotatableArmor.push(haloRing);
    for (let s = 0; s < 5; s++) {
      const a = (s / 5) * Math.PI - Math.PI * 0.5;
      const shard = new THREE.Mesh(createCurvedFangGeometry(0.18 * scale, 1.35 * scale), boneMat);
      shard.position.set(Math.sin(a) * 2.35 * scale, Math.cos(a) * 2.35 * scale, 0);
      shard.rotation.z = -a;
      haloRing.add(shard);
    }
    const prismCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.62 * scale, 0), originCrimson);
    prismCore.position.set(0, 0.25 * scale, 1.12 * scale);
    torsoGroup.add(haloRing, prismCore);
  }

  // Enormous Biomechanical Tentacles (~2x larger & thicker, anchored clearly outside carapace/shoulders):
  // 1) Shoulder / Dorsal Reaching & Attack Tentacles
  [
    [-2.02 * scale, 1.32 * scale, 0.28 * scale, -0.22, -0.62, -0.15, 'attack', 6, 0.9 * scale, 0.4 * scale, -1, true],
    [2.02 * scale, 1.32 * scale, 0.28 * scale, -0.22, 0.62, 0.15, 'attack', 6, 0.9 * scale, 0.4 * scale, 1, true],
    [-1.42 * scale, 1.82 * scale, -0.58 * scale, -0.56, -0.42, -0.1, 'stabilizer', 5, 0.8 * scale, 0.34 * scale, -1, true],
    [1.42 * scale, 1.82 * scale, -0.58 * scale, -0.56, 0.42, 0.1, 'stabilizer', 5, 0.8 * scale, 0.34 * scale, 1, true],
    [-1.65 * scale, -0.45 * scale, -1.02 * scale, 0.26, Math.PI - 0.58, 0, 'balance', 6, 0.94 * scale, 0.38 * scale, -1, false],
    [1.65 * scale, -0.45 * scale, -1.02 * scale, 0.26, Math.PI + 0.58, 0, 'balance', 6, 0.94 * scale, 0.38 * scale, 1, false],
  ].forEach(([ax, ay, az, rx, ry, rz, role, segs, slen, rad, side, cyber], idx) => {
    createArticulatedTentacle({
      parent: torsoGroup,
      anchor: [ax as number, ay as number, az as number],
      rot: [rx as number, ry as number, rz as number],
      segments: segs as number,
      segLen: slen as number,
      baseRadius: rad as number,
      role: role as TentacleChainRig['role'],
      phaseOffset: idx * 1.53,
      speedMult: 0.72 + (idx % 3) * 0.18,
      amplitude: role === 'balance' ? 0.3 : 0.24,
      maxAngle: 0.36,
      sideSign: side as number,
      cybernetic: cyber as boolean,
      hookTip: true,
    });
  });

  // 2) Chest-Cavity Hollow Dweller Tether Tendons (pull apart during Phase 3 chest opening)
  [-1, 1].forEach((side, idx) => {
    createArticulatedTentacle({
      parent: torsoGroup,
      anchor: [side * 0.72 * scale, 0.05 * scale, 1.12 * scale],
      rot: [0.12, side * 0.35, 0],
      segments: 4,
      segLen: 0.48 * scale,
      baseRadius: 0.22 * scale,
      role: 'tether',
      phaseOffset: idx * 2.2,
      speedMult: 0.9,
      amplitude: 0.16,
      maxAngle: 0.34,
      sideSign: side,
      chestTetherSide: side,
      hookTip: false,
    });
  });

  // THE BLOOD WORM NECK & HEAD (True 7-Joint Nested Hierarchical Kinematic Spine)
  const neckMuscleMat = infectedFlesh.clone();
  const neckSteelMat = darkSteel.clone();
  const neckMaterials: THREE.MeshStandardMaterial[] = [neckMuscleMat, neckSteelMat];

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 5.85 * scale, 0.18 * scale);
  const neckCollar = new THREE.Mesh(new THREE.TorusGeometry(1.02 * scale, 0.25 * scale, 8, 18), neckSteelMat);
  neckCollar.rotation.x = 0.38;
  headGroup.add(neckCollar);

  const neckJoints: NeckJointRig[] = [];
  const wormSegments: THREE.Group[] = [];
  let parentJoint: THREE.Object3D = headGroup;

  for (let s = 0; s < 7; s++) {
    const t = s / 6;
    const radius = (0.76 - s * 0.036) * scale;
    const segStepY = s === 0 ? 0.28 * scale : (0.28 - t * 0.08) * scale;
    const segStepZ = s === 0 ? 0.16 * scale : (0.46 + t * 0.08) * scale;
    const restPos = new THREE.Vector3(0, segStepY, segStepZ);
    const restRotX = s === 0 ? -0.32 : s < 4 ? 0.05 : 0.1;

    const pivot = new THREE.Group();
    pivot.position.copy(restPos);
    pivot.rotation.x = restRotX;

    // Deep red-black striated muscular barrel + connective tissue collar
    const muscleMesh = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(radius, 0.78 * scale, 12), neckMuscleMat),
      'neck'
    );
    muscleMesh.rotation.x = Math.PI / 2;
    muscleMesh.position.z = 0.22 * scale;

    // Contracting lateral thick tendons + hydraulic bridge supports
    const tendonL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11 * scale, 0.13 * scale, 0.68 * scale, 6),
      scarredTissue
    );
    tendonL.rotation.x = Math.PI / 2;
    tendonL.position.set(-radius * 0.88, -0.06 * scale, 0.24 * scale);
    const tendonR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11 * scale, 0.13 * scale, 0.68 * scale, 6),
      scarredTissue
    );
    tendonR.rotation.x = Math.PI / 2;
    tendonR.position.set(radius * 0.88, -0.06 * scale, 0.24 * scale);

    const hydL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.56 * scale, 6),
      chromePiston
    );
    hydL.rotation.x = Math.PI / 2;
    hydL.position.set(-radius * 0.68, radius * 0.52, 0.2 * scale);
    const hydR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.56 * scale, 6),
      chromePiston
    );
    hydR.rotation.x = Math.PI / 2;
    hydR.position.set(radius * 0.68, radius * 0.52, 0.2 * scale);

    // Fused metallic vertebra ring + dorsal chitin spine
    const vertebraSteel = addHitMesh(
      new THREE.Mesh(new THREE.TorusGeometry(radius * 0.96, 0.11 * scale, 6, 12, Math.PI * 1.35), neckSteelMat),
      'neck'
    );
    vertebraSteel.rotation.z = -Math.PI * 0.18;
    vertebraSteel.position.set(0, 0.08 * scale, 0.14 * scale);
    const dorsalFin = new THREE.Mesh(createCurvedFangGeometry(0.11 * scale, 0.52 * scale), boneMat);
    dorsalFin.position.set(0, radius * 0.92, 0.14 * scale);
    dorsalFin.rotation.x = -0.62;

    // Pulsating arterial vein collar
    const veinRing = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.92, 0.058 * scale, 7, 16),
      glowingVein
    );
    veinRing.position.z = 0.34 * scale;

    pivot.add(muscleMesh, tendonL, tendonR, hydL, hydR, vertebraSteel, dorsalFin, veinRing);
    parentJoint.add(pivot);
    parentJoint = pivot;

    wormSegments.push(pivot);
    neckJoints.push({
      pivot,
      muscleMesh,
      tendonL,
      tendonR,
      veinRing,
      vertebraSteel,
      restPos,
      restRotX,
    });
  }

  // Faceless Concentric Blood-Worm Expandable Maw mounted at tip of neckJoints[6]
  const jawTeethRing = new THREE.Group();
  jawTeethRing.position.set(0, 0, 0.46 * scale);
  const mawOuterLip = addHitMesh(
    new THREE.Mesh(new THREE.TorusGeometry(0.62 * scale, 0.17 * scale, 10, 20), scarredTissue),
    'head'
  );
  const innerThroatRing = addHitMesh(
    new THREE.Mesh(new THREE.TorusGeometry(0.32 * scale, 0.12 * scale, 8, 16), glowingVein),
    'head'
  );
  innerThroatRing.position.z = -0.14 * scale;
  const gulletCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16 * scale, 0.34 * scale, 0.52 * scale, 12),
    infectedFlesh
  );
  gulletCore.rotation.x = Math.PI / 2;
  gulletCore.position.z = -0.22 * scale;
  jawTeethRing.add(mawOuterLip, innerThroatRing, gulletCore);

  const toothRings: THREE.Group[] = [];
  const outerFangGeo = createCurvedFangGeometry(0.068 * scale, 0.42 * scale);
  const midFangGeo = createCurvedFangGeometry(0.048 * scale, 0.32 * scale);
  const innerFangGeo = createCurvedFangGeometry(0.034 * scale, 0.22 * scale);
  [
    { count: 16, r: 0.58 * scale, geo: outerFangGeo, pitch: 0.56, z: 0.08 * scale },
    { count: 12, r: 0.41 * scale, geo: midFangGeo, pitch: 0.44, z: 0.04 * scale },
    { count: 8, r: 0.26 * scale, geo: innerFangGeo, pitch: 0.32, z: -0.02 * scale },
  ].forEach((spec) => {
    const ringGrp = new THREE.Group();
    for (let i = 0; i < spec.count; i++) {
      const a = (i / spec.count) * Math.PI * 2;
      const tooth = new THREE.Mesh(spec.geo, boneMat);
      tooth.position.set(Math.cos(a) * spec.r, Math.sin(a) * spec.r, spec.z);
      tooth.rotation.z = a + Math.PI / 2;
      tooth.rotation.x = spec.pitch;
      ringGrp.add(tooth);
    }
    jawTeethRing.add(ringGrp);
    toothRings.push(ringGrp);
  });

  // 4 Expandable Muscular Mandible Flaps
  for (let f = 0; f < 4; f++) {
    const a = (f / 4) * Math.PI * 2;
    const flapPivot = new THREE.Group();
    flapPivot.position.set(Math.cos(a) * 0.58 * scale, Math.sin(a) * 0.58 * scale, 0.08 * scale);
    flapPivot.rotation.z = a;
    const flapMesh = new THREE.Mesh(createCurvedFangGeometry(0.22 * scale, 0.72 * scale), infectedFlesh);
    flapMesh.rotation.x = Math.PI / 2;
    flapMesh.position.z = 0.04 * scale;
    flapPivot.add(flapMesh);
    jawTeethRing.add(flapPivot);
    mandibleFlaps.push({ mesh: flapPivot, axis: 'x', dir: 1, baseRot: 0 });
  }

  // 8 Writhing Jaw Tendrils
  for (let t = 0; t < 8; t++) {
    const a = (t / 8) * Math.PI * 2;
    const tendril = new THREE.Mesh(
      createVeinTube([[0, 0, 0], [0.16 * scale, 0, 0.38 * scale], [0.05 * scale, 0.12 * scale, 0.86 * scale]], 0.058 * scale),
      infectedFlesh
    );
    tendril.position.set(Math.cos(a) * 0.66 * scale, Math.sin(a) * 0.66 * scale, 0.08 * scale);
    tendril.rotation.z = a;
    jawTeethRing.add(tendril);
    tendrils.push({ mesh: tendril, phaseOffset: t * 0.78, baseRotX: 0, baseRotZ: a });
  }

  neckJoints[neckJoints.length - 1].pivot.add(jawTeethRing);

  // Distinct Boss Heads + Socketed Eyes + Jaws mounted at tip of neck for Titan, Forgemaster, Guardian, Origin
  // (Titanforged keeps its iconic faceless concentric Blood-Worm maw!)
  if (type !== 'titanforged') {
    const bossHead = new THREE.Group();
    bossHead.position.set(0, 0.14 * scale, 0.35 * scale);
    const skullBase = addHitMesh(
      new THREE.Mesh(createBeveledPlateGeometry(1.15 * scale, 0.95 * scale, 1.05 * scale, 0.7), darkSteel),
      'head'
    );
    bossHead.add(skullBase);

    const bossJaw = new THREE.Group();
    bossJaw.position.set(0, -0.36 * scale, 0.15 * scale);
    const jawPlate = new THREE.Mesh(createBeveledPlateGeometry(0.92 * scale, 0.32 * scale, 0.78 * scale, 0.68), corrodedArmor);
    jawPlate.position.set(0, -0.06 * scale, 0.28 * scale);
    bossJaw.add(jawPlate);
    for (let jf = -2; jf <= 2; jf++) {
      const bFang = new THREE.Mesh(createCurvedFangGeometry(0.065 * scale, 0.36 * scale), boneMat);
      bFang.position.set(jf * 0.17 * scale, 0.1 * scale, 0.56 * scale);
      bossJaw.add(bFang);
    }
    jawGroup = bossJaw;
    bossHead.add(bossJaw);

    if (type === 'titan') {
      const hazardVisor = new THREE.Mesh(new THREE.BoxGeometry(1.05 * scale, 0.24 * scale, 0.34 * scale), corrodedArmor);
      hazardVisor.position.set(0, 0.26 * scale, 0.44 * scale);
      bossHead.add(hazardVisor);
      [-0.3, 0, 0.3].forEach((ex, i) => {
        createSocketedEye({
          parent: bossHead,
          pos: [ex * scale, 0.08 * scale, 0.54 * scale],
          radius: (i === 1 ? 0.14 : 0.1) * scale,
          isMech: true,
          rotY: ex * 0.4,
        });
      });
    } else if (type === 'forgemaster') {
      const grate = new THREE.Mesh(new THREE.BoxGeometry(0.96 * scale, 0.55 * scale, 0.24 * scale), darkSteel);
      grate.position.set(0, 0.18 * scale, 0.48 * scale);
      bossHead.add(grate);
      [-0.28, 0.28].forEach((ex) => {
        createSocketedEye({
          parent: bossHead,
          pos: [ex * scale, 0.14 * scale, 0.58 * scale],
          radius: 0.14 * scale,
          isMech: true,
          color: 0xf97316,
          emissive: 0xff5500,
          intensity: 3.0,
          rotY: ex > 0 ? 0.2 : -0.2,
        });
      });
    } else if (type === 'guardian') {
      [-1, 1].forEach((side) => {
        const antler = new THREE.Mesh(createCurvedFangGeometry(0.14 * scale, 1.35 * scale), boneMat);
        antler.position.set(side * 0.45 * scale, 0.48 * scale, 0);
        antler.rotation.z = side * -0.42;
        bossHead.add(antler);
      });
      [
        [-0.3, 0.16, 0.52, 0.12],
        [0.3, 0.16, 0.52, 0.12],
        [-0.14, 0.3, 0.48, 0.09],
        [0.14, 0.3, 0.48, 0.09],
        [0, 0.08, 0.56, 0.11],
      ].forEach(([ex, ey, ez, er]) => {
        createSocketedEye({
          parent: bossHead,
          pos: [ex * scale, ey * scale, ez * scale],
          radius: er * scale,
          slitPupil: true,
          rotY: ex * 0.5,
        });
      });
    } else if (type === 'origin') {
      for (let h = -1; h <= 1; h++) {
        const crownHorn = new THREE.Mesh(createCurvedFangGeometry(0.16 * scale, 1.55 * scale), boneMat);
        crownHorn.position.set(h * 0.36 * scale, 0.58 * scale, -0.08 * scale);
        crownHorn.rotation.z = h * -0.28;
        bossHead.add(crownHorn);
      }
      [
        [-0.28, 0.12, 0.56, 0.14],
        [0.28, 0.12, 0.56, 0.14],
        [0, 0.34, 0.54, 0.16],
      ].forEach(([ex, ey, ez, er]) => {
        createSocketedEye({
          parent: bossHead,
          pos: [ex * scale, ey * scale, ez * scale],
          radius: er * scale,
          color: 0xf43f5e,
          emissive: 0xe11d48,
          intensity: 3.1,
          slitPupil: true,
          rotY: ex * 0.4,
        });
      });
    }

    neckJoints[neckJoints.length - 1].pivot.add(bossHead);
  }

  bossRoot.add(headGroup);

  const shadowPlane = makeContactShadow(textures, 3.3 * scale);
  bossRoot.add(shadowPlane);

  return {
    group: bossRoot,
    hitMeshes,
    limbs,
    legRigs,
    armRigs,
    tendrils,
    tentacleChains,
    neckJoints,
    innerThroatRing,
    toothRings,
    neckMaterials,
    torsoExclusionRadius: 1.85 * scale,
    mandibleFlaps,
    destructibleArmor,
    torsoPulse: torsoGroup,
    headGroup,
    wormSegments,
    jawTeethRing,
    chestHatchLeft,
    chestHatchRight,
    hollowCavity,
    hollowDweller,
    armParts,
    shadowPlane,
    flashMaterials,
    regenNodes,
    regenMat,
  };
  })();

  if (builtRefs.headGroup) {
    builtRefs.headGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh && coreMaterials.includes(obj.material as THREE.MeshStandardMaterial)) {
        if (!eyeMeshes.includes(obj)) eyeMeshes.push(obj);
      }
    });
  }
  builtRefs.flashBaseEmissives = flashBaseEmissives;
  builtRefs.eyeMeshes = eyeMeshes;
  builtRefs.eyeRigs = eyeRigs;
  builtRefs.facePlates = facePlates;
  builtRefs.rotatableArmor = rotatableArmor;
  builtRefs.coreMaterials = coreMaterials;
  if (jawGroup) builtRefs.jawGroup = jawGroup;
  return builtRefs;
}

export function buildSupportDrone(): THREE.Group {
  const drone = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22, 0),
    new THREE.MeshStandardMaterial({ color: 0x262932, metalness: 0.85, roughness: 0.25 })
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.03, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x7f1d1d, metalness: 0.7, roughness: 0.3 })
  );
  ring.rotation.x = Math.PI / 2;
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 2.0,
    })
  );
  eye.position.z = 0.2;
  const light = new THREE.PointLight(0xef4444, 2.5, 7, 2);
  drone.add(body, ring, eye, light);
  return drone;
}

export interface AutomatedTurretRefs {
  root: THREE.Group;
  headPivot: THREE.Group;
  muzzleFlash: THREE.Mesh;
  laserBeam: THREE.Mesh;
}

export function buildAutomatedTurret(textures: ProceduralTextureSet): AutomatedTurretRefs {
  const root = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x262930,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    metalness: 0.85,
    roughness: 0.35,
  });
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    emissive: 0x9a3412,
    emissiveIntensity: 0.8,
    metalness: 0.55,
    roughness: 0.4,
  });

  // Tripod legs
  for (let i = 0; i < 3; i++) {
    const ang = (i * Math.PI * 2) / 3;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.08), baseMat);
    leg.position.set(Math.cos(ang) * 0.24, 0.24, Math.sin(ang) * 0.24);
    leg.rotation.z = Math.cos(ang) * 0.45;
    leg.rotation.x = -Math.sin(ang) * 0.45;
    root.add(leg);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.28, 10), baseMat);
  hub.position.y = 0.52;
  root.add(hub);

  const headPivot = new THREE.Group();
  headPivot.position.y = 0.72;
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.48), baseMat);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.24, 10), orangeMat);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(0, -0.05, 0.06);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, 0.52, 8), baseMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, 0.42);
  const lens = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfb923c, emissive: 0xf97316, emissiveIntensity: 2.6 })
  );
  lens.position.set(0, 0.1, 0.24);
  const muzzleFlash = new THREE.Mesh(
    new THREE.ConeGeometry(0.065, 0.22, 6),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.9 })
  );
  muzzleFlash.rotation.x = Math.PI / 2;
  muzzleFlash.position.set(0, 0.02, 0.75);
  muzzleFlash.visible = false;

  const laserBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.35 })
  );
  laserBeam.rotation.x = Math.PI / 2;
  laserBeam.position.set(0, 0.1, 4.25);

  headPivot.add(housing, drum, barrel, lens, muzzleFlash, laserBeam);
  root.add(headPivot);

  return { root, headPivot, muzzleFlash, laserBeam };
}

export function buildHealingBeacon(): THREE.Group {
  const grp = new THREE.Group();
  const canister = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 0.38, 12),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.45, roughness: 0.3 })
  );
  canister.position.y = 0.2;
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 2.4,
    })
  );
  core.position.y = 0.44;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 2.65, 36),
    new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.48,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  const light = new THREE.PointLight(0x10b981, 3.2, 8, 2);
  light.position.y = 0.6;
  grp.add(canister, core, ring, light);
  return grp;
}

export function buildStoryCharacterModel(
  id: 'raven_09' | 'vex' | 'dr_zero',
  textures: ProceduralTextureSet
): THREE.Group {
  const group = new THREE.Group();
  const armorMat = new THREE.MeshStandardMaterial({
    color: id === 'raven_09' ? 0x1e293b : id === 'vex' ? 0x1b241d : 0x17111a,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    metalness: id === 'raven_09' ? 0.85 : 0.45,
    roughness: 0.38,
  });

  if (id === 'raven_09') {
    const hoverCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 1), armorMat);
    hoverCore.position.y = 1.45;
    const shieldRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.05, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 1.6 })
    );
    shieldRing.rotation.x = Math.PI / 2;
    shieldRing.position.y = 1.42;
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x38bdf8, emissiveIntensity: 2.5 })
    );
    eye.position.set(0, 1.5, 0.36);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.14), armorMat);
    armL.position.set(-0.46, 1.25, 0.14);
    const armR = armL.clone();
    armR.position.x = 0.46;
    const beacon = new THREE.PointLight(0x38bdf8, 2.2, 6, 2);
    beacon.position.set(0, 1.6, 0.3);
    group.add(hoverCore, shieldRing, eye, armL, armR, beacon);
    return group;
  }

  if (id === 'vex') {
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x222b23, roughness: 0.78, metalness: 0.15 });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xa3e635, emissive: 0x84cc16, emissiveIntensity: 2.0 });
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.9, 10), armorMat);
    legs.position.y = 0.45;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.62, 0.24), coatMat);
    torso.position.y = 1.22;
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), coatMat);
    hood.position.y = 1.7;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.05), glowMat);
    visor.position.set(0, 1.7, 0.14);
    const { group: rifle } = buildWeaponMesh('sniper_rifle', textures);
    rifle.position.set(0.18, 1.28, 0.25);
    rifle.rotation.y = 1.1;
    group.add(legs, torso, hood, visor, rifle);
    return group;
  }

  // dr_zero
  const coatMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.6, metalness: 0.1 });
  const crimsonMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, emissive: 0xe11d48, emissiveIntensity: 2.2 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.1, 10), coatMat);
  body.position.y = 0.85;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 18), armorMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.48;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 }));
  head.position.y = 1.68;
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.045, 0.06), crimsonMat);
  goggles.position.set(0, 1.7, 0.11);
  group.add(body, collar, head, goggles);
  return group;
}

export function buildFormerAndCorpseModel(
  charId: CharacterId,
  primaryWeaponId: WeaponId,
  secondaryWeaponId: WeaponId,
  suitWear: number,
  textures: ProceduralTextureSet,
  limpSide: -1 | 1 = 1,
  armourDamaged?: { destroyedChest?: boolean; destroyedBack?: boolean }
): EnemyModelRefs {
  const def = CHARACTERS[charId] ?? CHARACTERS.reaper;
  const group = new THREE.Group();
  const bodyRoot = new THREE.Group();
  group.add(bodyRoot);

  const hitMeshes: THREE.Mesh[] = [];
  const limbs: THREE.Object3D[] = [];
  const legRigs: ArticulatedLegRig[] = [];
  const armRigs: ArticulatedArmRig[] = [];
  const tendrils: TendrilRig[] = [];
  const tentacleChains: TentacleChainRig[] = [];
  const mandibleFlaps: { mesh: THREE.Object3D; axis: 'x' | 'y' | 'z'; dir: number; baseRot: number }[] = [];
  const destructibleArmor: DestructibleArmorPart[] = [];
  const eyeMeshes: THREE.Mesh[] = [];
  const tumorMeshes: THREE.Mesh[] = [];
  const veinMeshes: THREE.Mesh[] = [];
  const slitherTendrils: FormerSlitherTendril[] = [];
  const leftFingerGroups: THREE.Object3D[] = [];
  const rightFingerGroups: THREE.Object3D[] = [];

  const isHeavy = charId === 'brute' || charId === 'titan';
  const isStealth = charId === 'ghost' || charId === 'phantom';
  const isMedic = charId === 'patch';
  const isTech = charId === 'engineer' || charId === 'nyx';
  const isWanderer = charId === 'wanderer';

  const bulk = isHeavy ? 1.32 : isStealth ? 0.88 : isWanderer ? 0.98 : 1.0;
  const heightScale = charId === 'titan' ? 1.15 : charId === 'brute' ? 1.12 : charId === 'ghost' ? 0.99 : 1.0;

  const armorMat = new THREE.MeshStandardMaterial({
    color: def.armorColor,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(1.15, 1.15),
    roughnessMap: textures.metalRoughness,
    metalnessMap: textures.metalMetalness,
    metalness: isHeavy ? 0.8 : isWanderer ? 0.25 : 0.54,
    roughness: isStealth || isWanderer ? 0.72 : 0.44,
    emissive: 0x1a0305,
    emissiveIntensity: 0.08,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: def.trimColor,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    metalness: isWanderer ? 0.22 : 0.68,
    roughness: isWanderer ? 0.68 : 0.36,
    emissive: 0x160204,
    emissiveIntensity: 0.06,
  });
  const undersuitMat = new THREE.MeshStandardMaterial({
    color: isMedic ? 0x1e293b : isWanderer ? 0x292019 : 0x222732,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.5, 0.5),
    metalness: 0.2,
    roughness: 0.76,
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: isMedic ? 0xdbeafe : isHeavy ? 0x3b4048 : 0x14171c,
    roughness: 0.58,
    metalness: isHeavy ? 0.65 : 0.25,
  });
  const dirtMat = new THREE.MeshStandardMaterial({
    color: 0x3b2c1d,
    roughness: 0.92,
    metalness: 0.04,
    transparent: true,
    opacity: 0.42 + suitWear * 0.42,
  });
  const bloodWearMat = new THREE.MeshStandardMaterial({
    color: 0x6b0f16,
    roughness: 0.32,
    metalness: 0.06,
    transparent: true,
    opacity: 0.38 + suitWear * 0.48,
  });

  const skinToneHex =
    charId === 'reaper'
      ? 0xc99c80
      : charId === 'ghost'
        ? 0xd6b097
        : charId === 'titan'
          ? 0x8f6349
          : charId === 'patch'
            ? 0xdcb8a2
            : charId === 'phantom'
              ? 0xb8998c
              : charId === 'engineer'
                ? 0xc89572
                : charId === 'wanderer'
                  ? 0xb07c5b
                  : 0xb98d72;

  const healthySkinColor = new THREE.Color(skinToneHex);
  const necroticSkinColor = new THREE.Color(0x7c867a);
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinToneHex,
    roughness: 0.62,
    metalness: 0.04,
    emissive: 0x220407,
    emissiveIntensity: 0.0,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: def.visorColor,
    emissive: def.visorColor,
    emissiveIntensity: 1.5,
    roughness: 0.16,
    metalness: 0.22,
  });

  // Corrupted bioluminescent infection materials (crimson + toxic ember glow)
  const veinMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0xdc2626,
    emissiveIntensity: 0.15,
    roughness: 0.24,
    metalness: 0.06,
    transparent: true,
    opacity: 0.0,
  });
  const eyeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xea580c,
    emissiveIntensity: 0.0,
    roughness: 0.12,
    metalness: 0.08,
  });
  const tumorMat = new THREE.MeshPhysicalMaterial({
    color: 0x450a0a,
    map: textures.infectedFleshMap,
    normalMap: textures.infectedFleshNormal,
    normalScale: new THREE.Vector2(1.8, 1.8),
    emissive: 0xc2410c,
    emissiveMap: textures.infectedEmissiveMap,
    emissiveIntensity: 0.15,
    roughness: 0.34,
    metalness: 0.05,
    clearcoat: 0.85,
    clearcoatRoughness: 0.15,
  });
  const tendrilMat = new THREE.MeshPhysicalMaterial({
    color: 0x2b070c,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.85,
    roughness: 0.28,
    clearcoat: 0.9,
  });

  const flashMaterials: THREE.MeshStandardMaterial[] = [armorMat, trimMat, skinMat, veinMat];
  const flashBaseEmissives = flashMaterials.map((m) => ({
    hex: m.emissive.getHex(),
    intensity: m.emissiveIntensity,
  }));

  const addHitMesh = (mesh: THREE.Mesh, zone: string) => {
    mesh.userData.hitZone = zone;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    hitMeshes.push(mesh);
    return mesh;
  };

  const addGrowth = (parent: THREE.Object3D, pos: [number, number, number], r: number, seed: number) => {
    const m = new THREE.Mesh(createOrganicTumorGeometry(r, seed, 1), tumorMat);
    m.position.set(pos[0], pos[1], pos[2]);
    m.scale.setScalar(0.01);
    m.visible = false;
    parent.add(m);
    tumorMeshes.push(m);
    return m;
  };

  const addSlitherTendril = (
    parent: THREE.Object3D,
    anchor: [number, number, number],
    rot: [number, number, number],
    segLen: number,
    rad: number,
    phaseOffset: number,
    convergeAxis: 'x' | 'z'
  ) => {
    const root = new THREE.Group();
    root.position.set(anchor[0], anchor[1], anchor[2]);
    root.rotation.set(rot[0], rot[1], rot[2]);
    const segments: THREE.Group[] = [];
    let cur: THREE.Object3D = root;
    for (let s = 0; s < 3; s++) {
      const segPivot = new THREE.Group();
      if (s > 0) segPivot.position.set(0, segLen, 0);
      const r0 = rad * (1 - s * 0.25);
      const r1 = rad * (1 - (s + 1) * 0.26);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(0.004, r1), r0, segLen, 5), tendrilMat);
      mesh.position.y = segLen * 0.5;
      segPivot.add(mesh);
      cur.add(segPivot);
      segments.push(segPivot);
      cur = segPivot;
    }
    root.scale.setScalar(0.01);
    root.visible = false;
    parent.add(root);
    slitherTendrils.push({
      root,
      segments,
      phaseOffset,
      baseRotX: rot[0],
      baseRotY: rot[1],
      baseRotZ: rot[2],
      convergeAxis,
    });
  };

  // Articulated THREE.Bone Skeletal Hierarchy (Pelvis -> Spine -> Neck -> Head / Clavicles -> Limbs -> Fingers)
  const pelvisBone = new THREE.Bone();
  pelvisBone.name = 'Pelvis';
  pelvisBone.position.set(0, 0.98, 0);
  bodyRoot.add(pelvisBone);

  const spineLowerBone = new THREE.Bone();
  spineLowerBone.name = 'SpineLower';
  spineLowerBone.position.set(0, 0.14, 0);
  pelvisBone.add(spineLowerBone);

  const spineUpperBone = new THREE.Bone();
  spineUpperBone.name = 'SpineUpper';
  spineUpperBone.position.set(0, 0.16, 0);
  spineLowerBone.add(spineUpperBone);

  // Offset mount preserves exact chest-relative local coordinates while riding on SpineUpper bone
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, -0.3, 0);
  spineUpperBone.add(torsoGroup);

  const allBones: THREE.Bone[] = [pelvisBone, spineLowerBone, spineUpperBone];
  let thighBoneL!: THREE.Bone;
  let thighBoneR!: THREE.Bone;
  let shinBoneL!: THREE.Bone;
  let shinBoneR!: THREE.Bone;
  let footBoneL!: THREE.Bone;
  let footBoneR!: THREE.Bone;

  // Articulated Bone Legs with Thigh, Shin & Ankle/Foot Pivots
  [
    { x: -0.135 * bulk, side: -1, phase: 0 },
    { x: 0.135 * bulk, side: 1, phase: Math.PI },
  ].forEach(({ x, side, phase }) => {
    const hip = new THREE.Bone();
    hip.name = side < 0 ? 'ThighL' : 'ThighR';
    hip.position.set(x, -0.06, 0);

    const thigh = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.088 * bulk, 0.44, 10), undersuitMat),
      'leg'
    );
    thigh.position.set(0, -0.2, 0);
    const thighPlate = new THREE.Mesh(new THREE.BoxGeometry(0.055 * bulk, 0.25, 0.15), trimMat);
    thighPlate.position.set(side * 0.088 * bulk, -0.2, 0.01);
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.065 * bulk, 0.16, 0.12), armorMat);
    holster.position.set(side * 0.105 * bulk, -0.24, 0.03);
    const thighVein = new THREE.Mesh(
      createVeinTube([[0, -0.05, 0.07], [side * 0.04, -0.22, 0.09], [0, -0.38, 0.08]], 0.014),
      veinMat
    );
    veinMeshes.push(thighVein);
    hip.add(thigh, thighPlate, holster, thighVein);

    const knee = new THREE.Bone();
    knee.name = side < 0 ? 'ShinL' : 'ShinR';
    knee.position.set(0, -0.41, 0);
    const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.125 * bulk, 0.115, 0.075), trimMat);
    kneePad.position.set(0, 0.01, 0.076 * bulk);
    kneePad.rotation.x = 0.12;
    const shin = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.068 * bulk, 0.42, 10), armorMat),
      'leg'
    );
    shin.position.set(0, -0.2, 0);
    const shinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.105 * bulk, 0.32, 0.06), trimMat);
    shinGuard.position.set(0, -0.2, 0.068 * bulk);
    shinGuard.rotation.x = -0.06;

    const foot = new THREE.Bone();
    foot.name = side < 0 ? 'FootL' : 'FootR';
    foot.position.set(0, -0.455, 0.035);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.148 * bulk, 0.11, 0.27), trimMat);
    boot.position.set(0, 0, 0);
    const bootToe = new THREE.Mesh(new THREE.BoxGeometry(0.132 * bulk, 0.07, 0.09), armorMat);
    bootToe.position.set(0, -0.015, 0.135);
    const mudSplatter = new THREE.Mesh(new THREE.BoxGeometry(0.152 * bulk, 0.065, 0.28), dirtMat);
    mudSplatter.position.set(0, -0.02, 0.003);
    foot.add(boot, bootToe, mudSplatter);

    addGrowth(knee, [side * 0.055 * bulk, 0.02, 0.05], 0.048, side * 2.4 + 1.1);
    addSlitherTendril(knee, [0, -0.34, 0.07], [0.15, 0, side * 0.12], 0.14, 0.018, side * 1.4, 'x');
    knee.add(kneePad, shin, shinGuard, foot);
    hip.add(knee);

    pelvisBone.add(hip);
    limbs.push(hip);
    legRigs.push({ hip, knee, phaseOffset: phase, baseHipX: 0, baseKneeX: 0 });
    allBones.push(hip, knee, foot);
    if (side < 0) {
      thighBoneL = hip;
      shinBoneL = knee;
      footBoneL = foot;
    } else {
      thighBoneR = hip;
      shinBoneR = knee;
      footBoneR = foot;
    }
  });

  // Pelvis & Belt mount on PelvisBone; Abdomen mounts on SpineLowerBone
  const pelvis = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.37 * bulk, 0.15, 0.23 * bulk), undersuitMat), 'body');
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.42 * bulk, 0.08, 0.29 * bulk), trimMat);
  belt.position.set(0, 0.09, 0);
  pelvisBone.add(pelvis, belt);

  for (let p = -1; p <= 1; p += 2) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.095 * bulk, 0.1, 0.065), armorMat);
    pouch.position.set(p * 0.135 * bulk, 0.09, 0.155 * bulk);
    pelvisBone.add(pouch);
  }

  const abdomen = addHitMesh(
    new THREE.Mesh(createMuscleBellyGeometry(0.18 * bulk, 0.28, 12), undersuitMat),
    'body'
  );
  abdomen.scale.set(1.05, 1, 0.7);
  abdomen.position.set(0, 0.09, 0);
  spineLowerBone.add(abdomen);
  const torso = addHitMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.4 * bulk, 0.34, 0.24 * bulk),
      armourDamaged?.destroyedChest && armourDamaged?.destroyedBack ? undersuitMat : armorMat
    ),
    'body'
  );
  torso.position.set(0, 0.41, 0);
  const formerChestArmor = new THREE.Group();
  const formerBackArmor = new THREE.Group();
  formerChestArmor.visible = !armourDamaged?.destroyedChest;
  formerBackArmor.visible = !armourDamaged?.destroyedBack;
  torsoGroup.add(abdomen, torso, formerChestArmor, formerBackArmor);

  const sternumPlate = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.36 * bulk, 0.28, 0.31 * bulk), trimMat), 'armor');
  sternumPlate.position.set(0, 0.42, 0.015);
  sternumPlate.rotation.x = -0.06;
  formerChestArmor.add(sternumPlate);
  [-0.11 * bulk, 0.11 * bulk].forEach((cx) => {
    const pecPlate = new THREE.Mesh(new THREE.BoxGeometry(0.16 * bulk, 0.15, 0.06), armorMat);
    pecPlate.position.set(cx, 0.46, 0.16 * bulk);
    pecPlate.rotation.y = cx < 0 ? 0.14 : -0.14;
    formerChestArmor.add(pecPlate);
  });
  const spinePack = new THREE.Mesh(new THREE.BoxGeometry(0.24 * bulk, 0.36, 0.12), trimMat);
  spinePack.position.set(0, 0.4, -0.16 * bulk);
  const collarGuard = new THREE.Mesh(new THREE.TorusGeometry(0.14 * bulk, 0.04, 8, 18, Math.PI * 1.45), trimMat);
  collarGuard.rotation.x = Math.PI / 2;
  collarGuard.rotation.z = -Math.PI * 0.22;
  collarGuard.position.set(0, 0.58, -0.01);
  const chestScuff = new THREE.Mesh(new THREE.BoxGeometry(0.22 * bulk, 0.11, 0.015), bloodWearMat);
  chestScuff.position.set(-0.07 * bulk, 0.42, 0.185 * bulk);
  chestScuff.rotation.z = 0.28;
  formerChestArmor.add(chestScuff);
  formerBackArmor.add(spinePack);
  torsoGroup.add(collarGuard);

  // Corrupted Chest & Rib Veins + Growths + Slithering Tendrils converging toward chest/neck
  const chestVeinL = new THREE.Mesh(
    createVeinTube(
      [
        [-0.16 * bulk, 0.24, 0.14 * bulk],
        [-0.08 * bulk, 0.38, 0.18 * bulk],
        [-0.02 * bulk, 0.56, 0.14 * bulk],
      ],
      0.015
    ),
    veinMat
  );
  const chestVeinR = new THREE.Mesh(
    createVeinTube(
      [
        [0.16 * bulk, 0.26, 0.14 * bulk],
        [0.09 * bulk, 0.42, 0.18 * bulk],
        [0.03 * bulk, 0.57, 0.13 * bulk],
      ],
      0.015
    ),
    veinMat
  );
  veinMeshes.push(chestVeinL, chestVeinR);
  torsoGroup.add(chestVeinL, chestVeinR);
  addGrowth(torsoGroup, [-0.1 * bulk, 0.44, 0.17 * bulk], 0.068, 3.1);
  addGrowth(torsoGroup, [0.12 * bulk, 0.36, 0.16 * bulk], 0.058, 5.4);
  addGrowth(torsoGroup, [0.02, 0.48, -0.19 * bulk], 0.072, 7.2);
  addSlitherTendril(torsoGroup, [-0.15 * bulk, 0.22, 0.15 * bulk], [0.15, 0, -0.32], 0.13, 0.019, 0.5, 'z');
  addSlitherTendril(torsoGroup, [0.15 * bulk, 0.22, 0.15 * bulk], [0.15, 0, 0.32], 0.13, 0.019, 2.2, 'z');
  addSlitherTendril(torsoGroup, [-0.08 * bulk, 0.46, -0.17 * bulk], [-0.25, 0, -0.22], 0.14, 0.02, 4.1, 'x');
  addSlitherTendril(torsoGroup, [0.08 * bulk, 0.46, -0.17 * bulk], [-0.25, 0, 0.22], 0.14, 0.02, 5.7, 'x');

  // Preserve unique operative silhouettes
  if (charId === 'reaper') {
    for (let m = -1; m <= 1; m++) {
      const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.06), undersuitMat);
      magPouch.position.set(m * 0.095, 0.33, 0.175);
      torsoGroup.add(magPouch);
    }
    const tallyPlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.025), visorMat);
    tallyPlate.position.set(0.11, 0.48, 0.178);
    formerChestArmor.add(tallyPlate);
  } else if (charId === 'ghost') {
    const shroudCape = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.04), undersuitMat);
    shroudCape.position.set(0, 0.28, -0.18);
    shroudCape.rotation.x = 0.12;
    const rangefinderPack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.12), armorMat);
    rangefinderPack.position.set(0, 0.44, -0.19);
    const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.052, 8, 16), undersuitMat);
    scarfCollar.rotation.x = Math.PI / 2;
    scarfCollar.position.set(0, 0.61, 0.01);
    torsoGroup.add(shroudCape, scarfCollar);
    formerBackArmor.add(rangefinderPack);
  } else if (charId === 'titan' || charId === 'brute') {
    [-0.36, 0.36].forEach((sx) => {
      const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.34), trimMat);
      pauldron.position.set(sx, 0.54, 0);
      pauldron.rotation.z = sx < 0 ? 0.24 : -0.24;
      torsoGroup.add(pauldron);
    });
    const blastCollar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.34), armorMat);
    blastCollar.position.set(0, 0.57, 0.02);
    const reactorVent = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.22, 10), visorMat);
    reactorVent.rotation.x = Math.PI / 2;
    reactorVent.position.set(0, 0.45, -0.24);
    formerChestArmor.add(blastCollar);
    formerBackArmor.add(reactorVent);
  } else if (charId === 'patch') {
    const whiteMedMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45, metalness: 0.16 });
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.02), visorMat);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.02), visorMat);
    crossH.position.set(0, 0.45, 0.185);
    crossV.position.set(0, 0.45, 0.185);
    const bioTank = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.4, 12), whiteMedMat);
    bioTank.position.set(-0.08, 0.42, -0.21);
    const stimTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 8), visorMat);
    stimTube.position.set(0.09, 0.42, -0.21);
    formerChestArmor.add(crossH, crossV);
    formerBackArmor.add(bioTank, stimTube);
  } else if (charId === 'phantom') {
    const cloakDrape = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.28, 0.72, 10, 1, true, 0.6, Math.PI * 1.4),
      undersuitMat
    );
    cloakDrape.position.set(0, 0.25, -0.08);
    cloakDrape.material.side = THREE.DoubleSide;
    const phaseHarness = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 8, 16), visorMat);
    phaseHarness.position.set(0, 0.44, 0.16);
    const bladeScabbard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.44, 0.05), trimMat);
    bladeScabbard.position.set(0.14, 0.42, -0.19);
    bladeScabbard.rotation.z = -0.35;
    torsoGroup.add(cloakDrape);
    formerChestArmor.add(phaseHarness);
    formerBackArmor.add(bladeScabbard);
  } else if (charId === 'engineer' || charId === 'nyx') {
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.16), trimMat);
    backpack.position.set(0, 0.38, -0.22);
    const servoArm = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.36, 0.06), armorMat);
    servoArm.position.set(-0.15, 0.62, -0.2);
    servoArm.rotation.z = 0.28;
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.38, 8), visorMat);
    antenna.position.set(0.12, 0.68, -0.24);
    formerBackArmor.add(backpack, servoArm, antenna);
  } else if (charId === 'wanderer') {
    const coatL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.05), trimMat);
    coatL.position.set(-0.14, -0.02, -0.14);
    coatL.rotation.z = -0.08;
    const coatR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.05), trimMat);
    coatR.position.set(0.14, -0.02, -0.14);
    coatR.rotation.z = 0.08;
    const bandolier = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.48, 0.32), trimMat);
    bandolier.position.set(0, 0.41, 0.01);
    bandolier.rotation.z = 0.52;
    torsoGroup.add(coatL, coatR, bandolier);
  }

  // Articulated Neck -> Head -> Jaw Bone Hierarchy
  const neckBone = new THREE.Bone();
  neckBone.name = 'Neck';
  neckBone.position.set(0, 0.34, 0);
  spineUpperBone.add(neckBone);

  const headBone = new THREE.Bone();
  headBone.name = 'Head';
  headBone.position.set(0, 0.05, 0);
  neckBone.add(headBone);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, -0.05, 0);
  headBone.add(headGroup);

  const neck = addHitMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.078, 0.14, 10), skinMat), 'neck');
  neck.position.set(0, 0.01, 0);
  const headScale = isHeavy ? 1.12 : 1.0;

  const cranium = addHitMesh(new THREE.Mesh(new THREE.SphereGeometry(0.118 * headScale, 14, 12), skinMat), 'head');
  cranium.scale.set(0.92, 1.06, 1.02);
  cranium.position.set(0, 0.14, -0.005);

  const jawBone = new THREE.Bone();
  jawBone.name = 'Jaw';
  jawBone.position.set(0, 0.028, 0.032);
  headBone.add(jawBone);

  const jaw = addHitMesh(new THREE.Mesh(new THREE.BoxGeometry(0.135 * headScale, 0.085, 0.135), skinMat), 'head');
  jaw.rotation.x = 0.1;
  jawBone.add(jaw);

  const browRidge = new THREE.Mesh(new THREE.BoxGeometry(0.155 * headScale, 0.03, 0.06), skinMat);
  browRidge.position.set(0, 0.17, 0.095 * headScale);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.028 * headScale, 0.052, 0.042), skinMat);
  nose.position.set(0, 0.132, 0.118 * headScale);
  nose.rotation.x = -0.18;

  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25 });
  [-0.042 * headScale, 0.042 * headScale].forEach((ex) => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), scleraMat);
    eyeWhite.position.set(ex, 0.148, 0.1 * headScale);
    const infectedEye = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 10, 8), eyeGlowMat);
    infectedEye.position.set(ex, 0.148, 0.112 * headScale);
    eyeMeshes.push(infectedEye);
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.036, 0.045), skinMat);
    cheek.position.set(ex * 1.15, 0.115, 0.09 * headScale);
    headGroup.add(eyeWhite, infectedEye, cheek);
  });

  const neckVein = new THREE.Mesh(
    createVeinTube([[0.035, -0.04, 0.05], [0.055, 0.05, 0.06], [0.048, 0.13, 0.09 * headScale]], 0.012),
    veinMat
  );
  veinMeshes.push(neckVein);
  neckBone.add(neck, neckVein);
  addGrowth(headGroup, [-0.065 * headScale, 0.04, 0.055], 0.036, 2.7);
  addGrowth(headGroup, [0.065 * headScale, 0.125, 0.085 * headScale], 0.03, 6.3);
  headGroup.add(cranium, browRidge, nose);
  allBones.push(neckBone, headBone, jawBone);

  if (charId === 'reaper') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.132, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), armorMat);
    cap.position.set(0, 0.15, -0.008);
    const halfMask = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.075, 0.12), trimMat);
    halfMask.position.set(0, 0.072, 0.065);
    const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.034, 0.045), visorMat);
    visorSlit.position.set(0, 0.152, 0.11);
    headGroup.add(cap, halfMask, visorSlit);
  } else if (charId === 'ghost') {
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.138, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.72), undersuitMat);
    hood.position.set(0, 0.145, -0.015);
    const faceScarf = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.085, 0.14), undersuitMat);
    faceScarf.position.set(0, 0.07, 0.055);
    const monocle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.04, 12), visorMat);
    monocle.rotation.x = Math.PI / 2;
    monocle.position.set(0.045, 0.152, 0.122);
    headGroup.add(hood, faceScarf, monocle);
  } else if (charId === 'titan' || charId === 'brute') {
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.142 * headScale, 16, 12), armorMat);
    helmet.scale.set(0.98, 1.05, 1.08);
    helmet.position.set(0, 0.155, -0.01);
    const browShield = new THREE.Mesh(new THREE.BoxGeometry(0.22 * headScale, 0.055, 0.22), trimMat);
    browShield.position.set(0, 0.215, 0.03);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.175 * headScale, 0.04, 0.055), visorMat);
    visor.position.set(0, 0.155, 0.125);
    const jawGrille = new THREE.Mesh(new THREE.BoxGeometry(0.18 * headScale, 0.07, 0.16), trimMat);
    jawGrille.position.set(0, 0.075, 0.05);
    headGroup.add(helmet, browShield, visor, jawGrille);
  } else if (charId === 'patch') {
    const medCap = new THREE.Mesh(new THREE.SphereGeometry(0.132, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), trimMat);
    medCap.position.set(0, 0.155, -0.01);
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.042, 0.045), visorMat);
    goggles.position.set(0, 0.15, 0.112);
    const respMask = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.07, 10), armorMat);
    respMask.rotation.x = Math.PI / 2;
    respMask.position.set(0, 0.08, 0.105);
    headGroup.add(medCap, goggles, respMask);
  } else if (charId === 'phantom') {
    const stealthHood = new THREE.Mesh(new THREE.SphereGeometry(0.136, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.68), armorMat);
    stealthHood.position.set(0, 0.148, -0.012);
    const shadowMask = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.075, 0.12), armorMat);
    shadowMask.position.set(0, 0.075, 0.062);
    [-0.04, 0.04].forEach((ox) => {
      const optic = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), visorMat);
      optic.position.set(ox, 0.15, 0.115);
      headGroup.add(optic);
    });
    headGroup.add(stealthHood, shadowMask);
  } else if (charId === 'engineer' || charId === 'nyx') {
    const hardhat = new THREE.Mesh(new THREE.SphereGeometry(0.134, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), armorMat);
    hardhat.position.set(0, 0.16, -0.005);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.024, 0.12), trimMat);
    brim.position.set(0, 0.195, 0.095);
    const multiLens = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.038, 0.048), visorMat);
    multiLens.position.set(0, 0.154, 0.112);
    const comms = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), trimMat);
    comms.position.set(0.13, 0.24, -0.02);
    headGroup.add(hardhat, brim, multiLens, comms);
  } else if (charId === 'wanderer') {
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.128, 0.1, 12), trimMat);
    hatCrown.position.set(0, 0.23, -0.005);
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.23, 0.018, 16), trimMat);
    hatBrim.position.set(0, 0.19, 0.01);
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.036, 0.04), visorMat);
    goggles.position.set(0, 0.162, 0.112);
    const bandana = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.065, 0.125), undersuitMat);
    bandana.position.set(0, 0.068, 0.052);
    headGroup.add(hatCrown, hatBrim, goggles, bandana);
  } else {
    const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(0.132 * headScale, 16, 14), armorMat);
    helmetDome.scale.set(0.95, 1.06, 1.08);
    helmetDome.position.set(0, 0.15, -0.01);
    const jawGuard = new THREE.Mesh(new THREE.BoxGeometry(0.19 * headScale, 0.11, 0.19), trimMat);
    jawGuard.position.set(0, 0.09, 0.045);
    jawGuard.rotation.x = 0.14;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.165 * headScale, 0.042, 0.055), visorMat);
    visor.position.set(0, 0.155, 0.118);
    headGroup.add(helmetDome, jawGuard, visor);
  }

  // Articulated Arms (Shoulder + Elbow + Articulated Finger Hands) + Weapon Mount
  const buildInfectedWeapon = (wId: WeaponId) => {
    const built = buildWeaponMesh(wId, textures);
    built.group.traverse((obj) => {
      obj.userData.nonLootable = true;
      obj.userData.corruptedProp = true;
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
      }
    });
    // Add dark corrupted infection growth & glowing crimson vein onto weapon receiver
    const wepTumor = addGrowth(built.group, [0.02, 0.04, 0.04], 0.032, wId.length * 1.9);
    wepTumor.visible = true;
    wepTumor.scale.setScalar(1);
    const wepVein = new THREE.Mesh(
      createVeinTube([[-0.02, 0.03, -0.1], [0.025, 0.045, 0.04], [0.01, 0.02, 0.18]], 0.008),
      veinMat
    );
    veinMeshes.push(wepVein);
    built.group.add(wepVein);
    return built;
  };

  const primBuilt = buildInfectedWeapon(primaryWeaponId);
  const secBuilt = buildInfectedWeapon(secondaryWeaponId);
  const corruptedMuzzleFlash = new THREE.Mesh(
    new THREE.ConeGeometry(0.065, 0.22, 6),
    new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.92, depthWrite: false })
  );
  corruptedMuzzleFlash.rotation.x = Math.PI / 2;
  corruptedMuzzleFlash.position.set(0, 0.02, 0.55);
  corruptedMuzzleFlash.visible = false;

  // Holstered secondary on hip/back
  secBuilt.group.position.set(-0.22 * bulk, 0.22, -0.05);
  secBuilt.group.rotation.set(1.2, 0.2, 0.15);
  torsoGroup.add(secBuilt.group);

  let rightHandPivot: THREE.Bone | null = null;
  let clavicleBoneL!: THREE.Bone;
  let clavicleBoneR!: THREE.Bone;
  let upperArmBoneL!: THREE.Bone;
  let upperArmBoneR!: THREE.Bone;
  let forearmBoneL!: THREE.Bone;
  let forearmBoneR!: THREE.Bone;
  let handBoneL!: THREE.Bone;
  let handBoneR!: THREE.Bone;

  [
    { x: -0.275 * bulk, dir: -1, phase: Math.PI, fingers: leftFingerGroups },
    { x: 0.275 * bulk, dir: 1, phase: 0, fingers: rightFingerGroups },
  ].forEach(({ x, dir, phase, fingers }) => {
    const clavicle = new THREE.Bone();
    clavicle.name = dir < 0 ? 'ClavicleL' : 'ClavicleR';
    clavicle.position.set(dir * 0.12 * bulk, 0.2, 0);
    spineUpperBone.add(clavicle);

    const shoulder = new THREE.Bone();
    shoulder.name = dir < 0 ? 'UpperArmL' : 'UpperArmR';
    shoulder.position.set(x - dir * 0.12 * bulk, 0, 0);

    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.145 * bulk, 0.16, 0.21), trimMat);
    pauldron.position.set(dir * 0.01, 0, 0);
    pauldron.rotation.z = -dir * 0.28;
    const upperArm = addHitMesh(
      new THREE.Mesh(createMuscleBellyGeometry(0.058 * bulk, 0.26, 10), undersuitMat),
      'body'
    );
    upperArm.position.set(0, -0.14, 0);
    shoulder.add(pauldron, upperArm);

    const elbow = new THREE.Bone();
    elbow.name = dir < 0 ? 'ForearmL' : 'ForearmR';
    elbow.position.set(0, -0.26, 0);
    const forearm = addHitMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.095 * bulk, 0.25, 0.1), armorMat),
      'body'
    );
    forearm.position.set(0, -0.13, 0);
    const armVein = new THREE.Mesh(
      createVeinTube([[0, -0.03, 0.04], [dir * 0.025, -0.14, 0.055], [0, -0.24, 0.045]], 0.011),
      veinMat
    );
    veinMeshes.push(armVein);
    addGrowth(elbow, [dir * 0.04 * bulk, -0.02, 0.03], 0.036, dir * 3.2 + 2.0);
    addSlitherTendril(elbow, [0, -0.24, 0.045], [0.1, 0, dir * 0.1], 0.11, 0.015, phase + 0.7, 'x');

    const handPivot = new THREE.Bone();
    handPivot.name = dir < 0 ? 'HandL' : 'HandR';
    handPivot.position.set(0, -0.26, 0.01);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.075 * bulk, 0.07, 0.055), gloveMat);
    handPivot.add(palm);

    // 4 articulated finger THREE.Bones so digits twitch independently during infection
    for (let f = 0; f < 4; f++) {
      const fPivot = new THREE.Bone();
      fPivot.name = `${dir < 0 ? 'FingerL' : 'FingerR'}_${f}`;
      fPivot.position.set((f - 1.5) * 0.017 * bulk, -0.035, 0.018);
      const digit = new THREE.Mesh(new THREE.BoxGeometry(0.013 * bulk, 0.048, 0.014), skinMat);
      digit.position.y = -0.022;
      fPivot.add(digit);
      handPivot.add(fPivot);
      fingers.push(fPivot);
      allBones.push(fPivot);
    }

    if (dir === 1) {
      rightHandPivot = handPivot;
      primBuilt.group.position.set(-0.02, -0.02, 0.24);
      primBuilt.group.rotation.set(Math.PI / 2, Math.PI, 0);
      primBuilt.group.add(corruptedMuzzleFlash);
      handPivot.add(primBuilt.group);
    }

    elbow.add(forearm, armVein, handPivot);
    shoulder.add(elbow);
    clavicle.add(shoulder);
    limbs.push(shoulder);
    armRigs.push({
      shoulder,
      elbow,
      phaseOffset: phase,
      baseShoulderX: dir === 1 ? -0.45 : -0.18,
      baseElbowX: dir === 1 ? -0.65 : -0.32,
    });
    allBones.push(clavicle, shoulder, elbow, handPivot);
    if (dir < 0) {
      clavicleBoneL = clavicle;
      upperArmBoneL = shoulder;
      forearmBoneL = elbow;
      handBoneL = handPivot;
    } else {
      clavicleBoneR = clavicle;
      upperArmBoneR = shoulder;
      forearmBoneR = elbow;
      handBoneR = handPivot;
    }
  });

  if (!rightHandPivot) {
    torsoGroup.add(primBuilt.group);
  }

  const skeleton = new THREE.Skeleton(allBones);
  const bones: CorpseSkeletonBones = {
    pelvis: pelvisBone,
    spineLower: spineLowerBone,
    spineUpper: spineUpperBone,
    neck: neckBone,
    head: headBone,
    jaw: jawBone,
    clavicleL: clavicleBoneL,
    clavicleR: clavicleBoneR,
    upperArmL: upperArmBoneL,
    upperArmR: upperArmBoneR,
    forearmL: forearmBoneL,
    forearmR: forearmBoneR,
    handL: handBoneL,
    handR: handBoneR,
    thighL: thighBoneL,
    thighR: thighBoneR,
    shinL: shinBoneL,
    shinR: shinBoneR,
    footL: footBoneL,
    footR: footBoneR,
  };

  // Light-reactive black + dark-crimson spore particle cloud (capped at 32 particles for perf)
  const SPORE_COUNT = 32;
  const sporePositions = new Float32Array(SPORE_COUNT * 3);
  const sporeBaseOffsets = new Float32Array(SPORE_COUNT * 3);
  for (let i = 0; i < SPORE_COUNT; i++) {
    const a = (i / SPORE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const rad = 0.28 + Math.random() * 0.65;
    const y = 0.15 + Math.random() * 1.6;
    sporeBaseOffsets[i * 3] = Math.cos(a) * rad;
    sporeBaseOffsets[i * 3 + 1] = y;
    sporeBaseOffsets[i * 3 + 2] = Math.sin(a) * rad;
    sporePositions[i * 3] = sporeBaseOffsets[i * 3];
    sporePositions[i * 3 + 1] = y;
    sporePositions[i * 3 + 2] = sporeBaseOffsets[i * 3 + 2];
  }
  const sporeGeo = new THREE.BufferGeometry();
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
  const sporeMat = new THREE.PointsMaterial({
    color: 0x1c080b,
    size: 0.085,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const sporePoints = new THREE.Points(sporeGeo, sporeMat);
  sporePoints.visible = false;
  group.add(sporePoints);

  const shadowPlane = makeContactShadow(textures, 0.68 * bulk);
  group.add(shadowPlane);
  group.scale.setScalar(heightScale);

  const formerRig: FormerModelRig = {
    bodyRoot,
    skeleton,
    bones,
    skinMat,
    healthySkinColor,
    necroticSkinColor,
    armorMat,
    trimMat,
    visorMat,
    veinMat,
    eyeGlowMat,
    tumorMat,
    tumorMeshes,
    veinMeshes,
    slitherTendrils,
    sporePoints,
    sporeMat,
    sporeBaseOffsets,
    leftFingerGroups,
    rightFingerGroups,
    primaryWeaponGroup: primBuilt.group,
    secondaryWeaponGroup: secBuilt.group,
    corruptedMuzzleFlash,
    activeWeaponSlot: 0,
    limpSide,
  };

  return {
    group,
    hitMeshes,
    limbs,
    legRigs,
    armRigs,
    tendrils,
    tentacleChains,
    torsoExclusionRadius: 0.42 * bulk,
    mandibleFlaps,
    destructibleArmor,
    torsoPulse: spineLowerBone,
    headGroup: headBone,
    jawGroup: jawBone,
    shadowPlane,
    flashMaterials,
    flashBaseEmissives,
    eyeMeshes,
    coreMaterials: [veinMat, eyeGlowMat],
    formerRig,
  };
}
