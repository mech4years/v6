import * as THREE from 'three';
import {
  AlienFungusSystem,
  buildAlienFungusSystem,
  FungusColonyPlacement,
} from '../alienFungus';
import { FireEmitterDef, SparkEmitterDef } from '../fireSystem';
import { cloneTiledTexture, ProceduralTextureSet } from '../textures';
import { EndingId, GravityZone } from '../types';
import { MAX_WATER_RIPPLES, WaterBodyRuntime } from '../waterSystem';
import {
  AnimatedWorldProp,
  BuiltWorld,
  ColliderBox,
  DestructibleBarricade,
  DynamicDoorRuntime,
  EnemySpawnDef,
  InteractableKind,
  InteractableObject,
  RampZone,
  SecretZoneDef,
  SurfaceZone,
  WaterSectionRuntime,
} from '../worldBuilder';

export interface LevelBuildContext {
  scene: THREE.Scene;
  textures: ProceduralTextureSet;
  colliders: ColliderBox[];
  ramps: RampZone[];
  interactables: InteractableObject[];
  enemySpawns: EnemySpawnDef[];
  destructibleBarricades: DestructibleBarricade[];
  flickerLights: { light: THREE.PointLight; base: number; speed: number }[];
  fireEmitters: FireEmitterDef[];
  sparkEmitters: SparkEmitterDef[];
  waterSections: WaterSectionRuntime[];
  waterBodies: WaterBodyRuntime[];
  waterRipples: THREE.Vector4[];
  gravityZones: GravityZone[];
  dynamicDoors: DynamicDoorRuntime[];
  secretZones: SecretZoneDef[];
  surfaceZones: SurfaceZone[];
  animatedProps: AnimatedWorldProp[];
  alienFungus?: AlienFungusSystem;
  onUpdate?: (dt: number, elapsed: number, playerPos: THREE.Vector3) => void;
  disposeables: { dispose: () => void }[];
}

export function createLevelContext(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  bgColor: number,
  fogColor: number,
  fogDensity: number
): LevelBuildContext {
  scene.background = new THREE.Color(bgColor);
  scene.fog = new THREE.FogExp2(fogColor, fogDensity);

  // Tinted atmospheric hemisphere fill
  const hemi = new THREE.HemisphereLight(0x526580, 0x0c0b10, 0.36);
  scene.add(hemi);

  // High-definition primary key light
  const dir = new THREE.DirectionalLight(0xd8e2f0, 0.54);
  dir.position.set(22, 40, 24);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 2;
  dir.shadow.camera.far = 140;
  dir.shadow.camera.left = -48;
  dir.shadow.camera.right = 48;
  dir.shadow.camera.top = 48;
  dir.shadow.camera.bottom = -48;
  dir.shadow.bias = -0.0004;
  dir.shadow.normalBias = 0.024;
  scene.add(dir);

  // Subtle rim light for dramatic silhouette separation against dark corridors
  const rim = new THREE.DirectionalLight(0x94a3b8, 0.18);
  rim.position.set(-24, 18, -32);
  scene.add(rim);

  return {
    scene,
    textures,
    colliders: [],
    ramps: [],
    interactables: [],
    enemySpawns: [],
    destructibleBarricades: [],
    flickerLights: [],
    fireEmitters: [],
    sparkEmitters: [],
    waterSections: [],
    waterBodies: [],
    waterRipples: Array.from({ length: MAX_WATER_RIPPLES }, () => new THREE.Vector4(0, 0, -999, 0)),
    gravityZones: [],
    dynamicDoors: [],
    secretZones: [],
    surfaceZones: [],
    animatedProps: [],
    disposeables: [],
  };
}

export function makeTiledMat(
  ctx: LevelBuildContext,
  opts: {
    map?: THREE.Texture;
    normalMap?: THREE.Texture;
    roughnessMap?: THREE.Texture;
    metalnessMap?: THREE.Texture;
    emissiveMap?: THREE.Texture;
    repeatX: number;
    repeatY: number;
    color?: number;
    roughness?: number;
    metalness?: number;
    envMapIntensity?: number;
    normalScale?: number;
    emissive?: number;
    emissiveIntensity?: number;
  }
): THREE.MeshStandardMaterial {
  const rx = opts.repeatX;
  const ry = opts.repeatY;
  const metalness = opts.metalness ?? 0.04;
  const params: THREE.MeshStandardMaterialParameters = {
    color: opts.color ?? 0xffffff,
    emissive: opts.emissive ?? (opts.emissiveMap ? 0xffffff : 0x000000),
    emissiveIntensity: opts.emissiveIntensity ?? (opts.emissiveMap ? 0.9 : 0),
    roughness: opts.roughness ?? 0.88,
    metalness,
    envMapIntensity: opts.envMapIntensity ?? (metalness < 0.25 ? 0.28 : 0.52),
  };
  if (opts.map) params.map = cloneTiledTexture(opts.map, rx, ry, ctx.disposeables);
  if (opts.normalMap) {
    params.normalMap = cloneTiledTexture(opts.normalMap, rx, ry, ctx.disposeables);
    params.normalScale = new THREE.Vector2(opts.normalScale ?? 1.25, opts.normalScale ?? 1.25);
  }
  if (opts.roughnessMap) {
    params.roughnessMap = cloneTiledTexture(opts.roughnessMap, rx, ry, ctx.disposeables);
  }
  if (opts.metalnessMap) {
    params.metalnessMap = cloneTiledTexture(opts.metalnessMap, rx, ry, ctx.disposeables);
  }
  if (opts.emissiveMap) {
    params.emissiveMap = cloneTiledTexture(opts.emissiveMap, rx, ry, ctx.disposeables);
  }
  const mat = new THREE.MeshStandardMaterial(params);
  ctx.disposeables.push(mat);
  return mat;
}

export function finalizeLevelWorld(
  ctx: LevelBuildContext,
  spawnPosition: THREE.Vector3,
  spawnYaw = 0,
  bossAreaCenter?: THREE.Vector3
): BuiltWorld {
  const fireHazardZones = ctx.fireEmitters.map((fe) => ({
    position: fe.position.clone(),
    heatRadius: fe.heatRadius,
    intensity: fe.intensity,
  }));
  return {
    colliders: ctx.colliders,
    ramps: ctx.ramps,
    interactables: ctx.interactables,
    enemySpawns: ctx.enemySpawns,
    destructibleBarricades: ctx.destructibleBarricades,
    flickerLights: ctx.flickerLights,
    fireEmitters: ctx.fireEmitters,
    sparkEmitters: ctx.sparkEmitters,
    fireHazardZones,
    waterSections: ctx.waterSections,
    gravityZones: ctx.gravityZones,
    dynamicDoors: ctx.dynamicDoors,
    secretZones: ctx.secretZones,
    surfaceZones: ctx.surfaceZones,
    animatedProps: ctx.animatedProps,
    alienFungus: ctx.alienFungus,
    onUpdate: ctx.onUpdate,
    spawnPosition,
    spawnYaw,
    bossAreaCenter,
    disposeables: ctx.disposeables,
  };
}

export function addAlienFungusColonies(
  ctx: LevelBuildContext,
  placements: FungusColonyPlacement[],
  levelSeed = 3059
): AlienFungusSystem {
  const sys = buildAlienFungusSystem(ctx.scene, placements, levelSeed);
  ctx.alienFungus = sys;
  ctx.disposeables.push({ dispose: () => sys.dispose() });
  return sys;
}

export function addRotatedBoxCollider(
  colliders: ColliderBox[],
  originX: number,
  originZ: number,
  rotY: number,
  localCx: number,
  localCz: number,
  w: number,
  d: number,
  minY: number,
  maxY: number,
  tag?: string
): void {
  const cos = Math.cos(rotY);
  const sin = Math.sin(rotY);
  const wx = originX + localCx * cos + localCz * sin;
  const wz = originZ - localCx * sin + localCz * cos;
  const worldW = Math.abs(w * cos) + Math.abs(d * sin);
  const worldD = Math.abs(w * sin) + Math.abs(d * cos);
  colliders.push({
    minX: wx - worldW * 0.5,
    maxX: wx + worldW * 0.5,
    minY,
    maxY,
    minZ: wz - worldD * 0.5,
    maxZ: wz + worldD * 0.5,
    tag,
  });
}

export function addSolidBox(
  ctx: LevelBuildContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  tag?: string
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  ctx.scene.add(mesh);
  ctx.colliders.push({
    minX: x - w * 0.5,
    maxX: x + w * 0.5,
    minY: y - h * 0.5,
    maxY: y + h * 0.5,
    minZ: z - d * 0.5,
    maxZ: z + d * 0.5,
    tag,
  });
  return mesh;
}

export function addDetailedPillar(
  ctx: LevelBuildContext,
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
  bodyMat: THREE.Material,
  trimMat: THREE.Material,
  emissiveColor?: number
): void {
  const grp = new THREE.Group();
  const core = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
  core.position.y = h * 0.5;
  core.castShadow = true;
  core.receiveShadow = true;
  grp.add(core);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.36, 0.45, d + 0.36), trimMat);
  plinth.position.y = 0.225;
  plinth.castShadow = true;
  plinth.receiveShadow = true;

  const capital = new THREE.Mesh(new THREE.BoxGeometry(w + 0.38, 0.5, d + 0.38), trimMat);
  capital.position.y = h - 0.25;
  capital.castShadow = true;
  grp.add(plinth, capital);

  // Corner vertical steel stiffeners
  const sx = w * 0.5 - 0.06;
  const sz = d * 0.5 - 0.06;
  const ribGeo = new THREE.BoxGeometry(0.18, h - 0.5, 0.18);
  [
    [-sx, -sz],
    [sx, -sz],
    [-sx, sz],
    [sx, sz],
  ].forEach(([rx, rz]) => {
    const rib = new THREE.Mesh(ribGeo, trimMat);
    rib.position.set(rx, h * 0.5, rz);
    grp.add(rib);
  });

  if (emissiveColor !== undefined) {
    const collar = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.14, 0.12, d + 0.14),
      new THREE.MeshStandardMaterial({
        color: emissiveColor,
        emissive: emissiveColor,
        emissiveIntensity: 1.5,
        roughness: 0.3,
      })
    );
    collar.position.y = 2.6;
    grp.add(collar);
  }

  grp.position.set(x, 0, z);
  ctx.scene.add(grp);
  ctx.colliders.push({
    minX: x - w * 0.5,
    maxX: x + w * 0.5,
    minY: 0,
    maxY: h,
    minZ: z - d * 0.5,
    maxZ: z + d * 0.5,
  });
}

export function addStructuralArchRibs(
  ctx: LevelBuildContext,
  minX: number,
  maxX: number,
  zPositions: number[],
  height: number,
  ribMat: THREE.Material,
  accentMat?: THREE.Material
): void {
  const span = maxX - minX;
  const cx = (minX + maxX) * 0.5;
  const beamH = Math.min(0.85, height * 0.12);

  zPositions.forEach((z) => {
    // Wall pilasters with matching colliders
    [minX + 0.45, maxX - 0.45].forEach((px) => {
      const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.75, height, 0.9), ribMat);
      pilaster.position.set(px, height * 0.5, z);
      pilaster.castShadow = true;
      pilaster.receiveShadow = true;
      ctx.scene.add(pilaster);
      ctx.colliders.push({
        minX: px - 0.375,
        maxX: px + 0.375,
        minY: 0,
        maxY: height,
        minZ: z - 0.45,
        maxZ: z + 0.45,
        tag: 'arch_pilaster',
      });
    });

    // Overhead cross truss beam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(span, beamH, 0.85), ribMat);
    beam.position.set(cx, height - beamH * 0.5, z);
    beam.castShadow = true;
    ctx.scene.add(beam);

    // Angled corner haunches linking pilasters to overhead truss
    [
      [minX + 1.35, 1],
      [maxX - 1.35, -1],
    ].forEach(([hx, dir]) => {
      const haunch = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 2.2, 0.72),
        accentMat ?? ribMat
      );
      haunch.position.set(hx, height - 1.05, z);
      haunch.rotation.z = dir * -0.72;
      ctx.scene.add(haunch);
    });
  });
}

export function addPipeConduit(
  ctx: LevelBuildContext,
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number,
  radius: number,
  pipeMat: THREE.Material,
  collarMat?: THREE.Material
): void {
  const start = new THREE.Vector3(x1, y1, z1);
  const end = new THREE.Vector3(x2, y2, z2);
  const diff = new THREE.Vector3().subVectors(end, start);
  const len = diff.length();
  if (len < 0.05) return;

  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const pipeGeo = new THREE.CylinderGeometry(radius, radius, len, 10);
  const pipe = new THREE.Mesh(pipeGeo, pipeMat);
  pipe.position.copy(mid);
  pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.clone().normalize());
  pipe.castShadow = true;
  ctx.scene.add(pipe);

  const collarCount = Math.max(2, Math.floor(len / 8));
  const collarGeo = new THREE.CylinderGeometry(radius * 1.38, radius * 1.38, 0.24, 10);
  for (let i = 1; i < collarCount; i++) {
    const t = i / collarCount;
    const collar = new THREE.Mesh(collarGeo, collarMat ?? pipeMat);
    collar.position.lerpVectors(start, end, t);
    collar.quaternion.copy(pipe.quaternion);
    ctx.scene.add(collar);
  }
}

export function addFloorDecal(
  ctx: LevelBuildContext,
  x: number,
  z: number,
  w: number,
  d: number,
  map: THREE.Texture,
  opacity = 0.85,
  rotY = 0
): void {
  const mat = new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    opacity,
  });
  ctx.disposeables.push(mat);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rotY;
  mesh.position.set(x, 0.02, z);
  ctx.scene.add(mesh);
}

export function addVolumetricCone(
  ctx: LevelBuildContext,
  x: number,
  topY: number,
  z: number,
  color: number,
  bottomRadius = 2.6,
  height = 4.6,
  opacity = 0.055
): void {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  ctx.disposeables.push(mat);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(bottomRadius, height, 14, 1, true), mat);
  cone.position.set(x, topY - height * 0.5, z);
  ctx.scene.add(cone);
}

export function addWallXWithDoor(
  ctx: LevelBuildContext,
  z: number,
  minX: number,
  maxX: number,
  height: number,
  thickness: number,
  doorCenterX: number,
  doorWidth: number,
  doorHeight: number,
  mat: THREE.Material
): void {
  const doorLeft = doorCenterX - doorWidth * 0.5;
  const doorRight = doorCenterX + doorWidth * 0.5;
  if (doorLeft > minX + 0.1) {
    const w = doorLeft - minX;
    addSolidBox(ctx, minX + w * 0.5, height * 0.5, z, w, height, thickness, mat);
  }
  if (maxX > doorRight + 0.1) {
    const w = maxX - doorRight;
    addSolidBox(ctx, doorRight + w * 0.5, height * 0.5, z, w, height, thickness, mat);
  }
  if (height > doorHeight + 0.1) {
    const headerH = height - doorHeight;
    addSolidBox(
      ctx,
      doorCenterX,
      doorHeight + headerH * 0.5,
      z,
      doorWidth,
      headerH,
      thickness,
      mat
    );
  }
}

export function addWallZWithDoor(
  ctx: LevelBuildContext,
  x: number,
  minZ: number,
  maxZ: number,
  height: number,
  thickness: number,
  doorCenterZ: number,
  doorWidth: number,
  doorHeight: number,
  mat: THREE.Material
): void {
  const doorMin = doorCenterZ - doorWidth * 0.5;
  const doorMax = doorCenterZ + doorWidth * 0.5;
  if (doorMin > minZ + 0.1) {
    const d = doorMin - minZ;
    addSolidBox(ctx, x, height * 0.5, minZ + d * 0.5, thickness, height, d, mat);
  }
  if (maxZ > doorMax + 0.1) {
    const d = maxZ - doorMax;
    addSolidBox(ctx, x, height * 0.5, doorMax + d * 0.5, thickness, height, d, mat);
  }
  if (height > doorHeight + 0.1) {
    const headerH = height - doorHeight;
    addSolidBox(
      ctx,
      x,
      doorHeight + headerH * 0.5,
      doorCenterZ,
      thickness,
      headerH,
      doorWidth,
      mat
    );
  }
}

export function addDynamicDoor(
  ctx: LevelBuildContext,
  id: string,
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color = 0x1e293b,
  accentColor = 0xef4444
): void {
  // Stationary Heavy Armor Door Frame Pilasters & Threshold Sill
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    map: ctx.textures.metalPlateMap,
    normalMap: ctx.textures.metalNormal,
    metalness: 0.85,
    roughness: 0.36,
  });
  const hazMat = new THREE.MeshStandardMaterial({
    map: ctx.textures.hazardStripeMap,
    metalness: 0.5,
    roughness: 0.45,
  });
  const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.08, d + 1.1), hazMat);
  sill.position.set(x, 0.04, z);
  const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.45, h + 0.35, d + 0.55), frameMat);
  jambL.position.set(x - w * 0.5 - 0.15, (h + 0.35) * 0.5, z);
  const jambR = new THREE.Mesh(new THREE.BoxGeometry(0.45, h + 0.35, d + 0.55), frameMat);
  jambR.position.set(x + w * 0.5 + 0.15, (h + 0.35) * 0.5, z);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(w + 1.1, 0.55, d + 0.65), frameMat);
  lintel.position.set(x, h + 0.22, z);
  ctx.scene.add(sill, jambL, jambR, lintel);

  // Sliding Armored Blast Door Leaf
  const doorGroup = new THREE.Group();
  const leafMat = new THREE.MeshStandardMaterial({
    color,
    map: ctx.textures.metalPlateMap,
    normalMap: ctx.textures.metalNormal,
    roughnessMap: ctx.textures.metalRoughness,
    metalness: 0.82,
    roughness: 0.34,
  });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), leafMat);
  slab.castShadow = true;
  slab.receiveShadow = true;

  // Horizontal blast reinforcement ribs + recessed chevron warning stripe
  [-h * 0.25, h * 0.25].forEach((ry) => {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.22, d + 0.1), frameMat);
    rib.position.y = ry;
    doorGroup.add(rib);
  });
  const bottomHaz = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.24, d + 0.08), hazMat);
  bottomHaz.position.y = -h * 0.5 + 0.22;

  const stripMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 1.7,
  });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.14, d + 0.12), stripMat);
  strip.position.y = 0.05;
  const centerLock = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, d + 0.14, 8), frameMat);
  centerLock.rotation.x = Math.PI / 2;
  centerLock.position.y = 0.05;

  doorGroup.add(slab, bottomHaz, strip, centerLock);
  doorGroup.position.set(x, h * 0.5, z);
  doorGroup.userData.baseY = h * 0.5;
  ctx.scene.add(doorGroup);

  const colliderIndex = ctx.colliders.length;
  ctx.colliders.push({
    minX: x - w * 0.5,
    maxX: x + w * 0.5,
    minY: 0,
    maxY: h,
    minZ: z - d * 0.5,
    maxZ: z + d * 0.5,
    tag: `door_${id}`,
  });

  ctx.dynamicDoors.push({
    id,
    mesh: doorGroup,
    colliderIndex,
    openOffsetY: h + 0.3,
    opened: false,
    currentOffsetY: 0,
  });
}

export function addBeaconRing(color: number): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.44, 20),
    new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  return ring;
}

export function addPickup(
  ctx: LevelBuildContext,
  id: string,
  kind: 'medkit' | 'ammo' | 'battery' | 'lore' | 'keycard' | 'research_drive' | 'secret_cache',
  label: string,
  x: number,
  y: number,
  z: number,
  color: number,
  opts?: {
    loreId?: string;
    secretId?: string;
    secretTitle?: string;
  }
): void {
  const grp = new THREE.Group();
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.32 });
  const glowMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.15,
    roughness: 0.25,
    metalness: 0.4,
  });

  if (kind === 'medkit') {
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.22, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.35, metalness: 0.2 })
    );
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.06), glowMat);
    crossH.position.y = 0.12;
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.18), glowMat);
    crossV.position.y = 0.12;
    const claspL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), darkMetal);
    claspL.position.set(-0.14, 0.04, 0.19);
    const claspR = claspL.clone();
    claspR.position.x = 0.14;
    grp.add(shell, crossH, crossV, claspL, claspR);
  } else if (kind === 'ammo') {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.28, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x2f3b28, metalness: 0.6, roughness: 0.5 })
    );
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.06, 0.36), darkMetal);
    lid.position.y = 0.13;
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.53, 0.05, 0.35), glowMat);
    band.position.y = 0.04;
    grp.add(box, lid, band);
  } else if (kind === 'battery') {
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.07, 10), darkMetal);
    capTop.position.y = 0.16;
    const capBot = capTop.clone();
    capBot.position.y = -0.16;
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.28, 10), glowMat);
    grp.add(core, capTop, capBot);
  } else if (kind === 'research_drive') {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.44, 10), darkMetal);
    const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.14, 10), glowMat);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.08, 10), darkMetal);
    cap.position.y = 0.26;
    grp.add(pod, halo, cap);
  } else if (kind === 'secret_cache') {
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.44, 0.62),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.78, roughness: 0.35 })
    );
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.1, 0.66), darkMetal);
    lid.position.y = 0.22;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.06, 0.64), glowMat);
    strip.position.y = 0.12;
    grp.add(chest, lid, strip);
  } else {
    // Lore tablet or keycard
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.28), darkMetal);
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.22), glowMat);
    grp.add(pad, face);
  }

  grp.position.set(x, y, z);
  const ring = addBeaconRing(color);
  ring.position.y = -y + 0.04;
  grp.add(ring);
  ctx.scene.add(grp);

  ctx.interactables.push({
    id,
    kind,
    label,
    position: new THREE.Vector3(x, y, z),
    radius: 2.8,
    mesh: grp,
    consumed: false,
    loreId: opts?.loreId,
    secretId: opts?.secretId,
    secretTitle: opts?.secretTitle,
    highlightRing: ring,
  });
}

export function addConsoleInteractable(
  ctx: LevelBuildContext,
  id: string,
  kind: InteractableKind,
  label: string,
  x: number,
  z: number,
  color: number,
  opts?: {
    puzzleId?: string;
    doorId?: string;
    waterSectionId?: string;
    endingId?: EndingId;
    stageReq?: number;
  }
): THREE.Group {
  const grp = new THREE.Group();
  const metalChassis = new THREE.MeshStandardMaterial({
    color: 0x182230,
    map: ctx.textures.metalPlateMap,
    normalMap: ctx.textures.metalNormal,
    metalness: 0.82,
    roughness: 0.34,
  });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.16, 0.84), metalChassis);
  plinth.position.y = 0.08;
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.86, 0.58), metalChassis);
  pedestal.position.y = 0.59;
  pedestal.castShadow = true;

  // Angled operator keyboard shelf
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.1, 0.44), metalChassis);
  deck.position.set(0, 0.98, 0.24);
  deck.rotation.x = 0.28;

  // Monitor hood & terminal telemetry screen
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.64, 0.24), metalChassis);
  hood.position.set(0, 1.36, -0.04);
  hood.rotation.x = -0.18;

  const screenMat = new THREE.MeshStandardMaterial({
    map: ctx.textures.terminalScreenMap,
    color,
    emissive: color,
    emissiveMap: ctx.textures.terminalScreenMap,
    emissiveIntensity: 1.45,
    roughness: 0.15,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.48), screenMat);
  screen.position.set(0, 1.35, 0.09);
  screen.rotation.x = -0.18;

  // Status beacon dome
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.07, 0.12, 8),
    new THREE.MeshBasicMaterial({ color })
  );
  beacon.position.set(0.42, 1.72, -0.06);

  const light = new THREE.PointLight(color, 3.6, 11, 1.8);
  light.position.set(0, 1.6, 0.8);
  grp.add(plinth, pedestal, deck, hood, screen, beacon, light);
  grp.position.set(x, 0, z);
  ctx.scene.add(grp);
  ctx.colliders.push({
    minX: x - 0.62,
    maxX: x + 0.62,
    minY: 0,
    maxY: 1.65,
    minZ: z - 0.48,
    maxZ: z + 0.48,
  });

  ctx.interactables.push({
    id,
    kind,
    label,
    position: new THREE.Vector3(x, 1.15, z),
    radius: 3.1,
    mesh: grp,
    consumed: false,
    puzzleId: opts?.puzzleId,
    doorId: opts?.doorId,
    waterSectionId: opts?.waterSectionId,
    endingId: opts?.endingId,
    stageReq: opts?.stageReq,
  });
  return grp;
}

export function addSaveAndWorkbench(
  ctx: LevelBuildContext,
  prefix: string,
  saveX: number,
  saveZ: number,
  wbX: number,
  wbZ: number
): void {
  addConsoleInteractable(
    ctx,
    `${prefix}_save`,
    'save_point',
    'SAVE PROGRESS AT TERMINAL',
    saveX,
    saveZ,
    0x38bdf8
  );

  const wb = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({
    color: 0x222730,
    map: ctx.textures.metalPlateMap,
    normalMap: ctx.textures.metalNormal,
    metalness: 0.84,
    roughness: 0.36,
  });
  const hazMat = new THREE.MeshStandardMaterial({
    map: ctx.textures.hazardStripeMap,
    metalness: 0.45,
    roughness: 0.45,
  });
  const topSlab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.94), steel);
  topSlab.position.y = 0.94;
  topSlab.castShadow = true;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.08, 0.96), hazMat);
  trim.position.y = 0.84;
  const lowerShelf = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.08, 0.76), steel);
  lowerShelf.position.y = 0.28;

  // Four corner legs
  [
    [-0.84, -0.38],
    [0.84, -0.38],
    [-0.84, 0.38],
    [0.84, 0.38],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.92, 0.12), steel);
    leg.position.set(lx, 0.46, lz);
    wb.add(leg);
  });

  // Pegboard tool wall & glowing overhead arm light
  const pegboard = new THREE.Mesh(new THREE.BoxGeometry(1.86, 1.05, 0.08), steel);
  pegboard.position.set(0, 1.48, -0.4);
  const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.55), steel);
  lampArm.position.set(0, 2.02, -0.15);
  const lampBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.06, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.8 })
  );
  lampBar.position.set(0, 1.98, 0.1);
  const vise = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.28), steel);
  vise.position.set(-0.62, 1.08, 0.22);
  const wbLight = new THREE.PointLight(0xf59e0b, 3.5, 9, 1.8);
  wbLight.position.set(0, 1.8, 0.4);

  wb.add(topSlab, trim, lowerShelf, pegboard, lampArm, lampBar, vise, wbLight);
  wb.position.set(wbX, 0, wbZ);
  ctx.scene.add(wb);
  ctx.colliders.push({
    minX: wbX - 0.96,
    maxX: wbX + 0.96,
    minY: 0,
    maxY: 1.8,
    minZ: wbZ - 0.5,
    maxZ: wbZ + 0.5,
  });
  ctx.interactables.push({
    id: `${prefix}_workbench`,
    kind: 'workbench',
    label: 'OPEN WEAPON UPGRADE WORKBENCH',
    position: new THREE.Vector3(wbX, 1.0, wbZ),
    radius: 2.9,
    mesh: wb,
    consumed: false,
  });
}

export function addDestructibleBarricade(
  ctx: LevelBuildContext,
  id: string,
  x: number,
  z: number,
  w = 3.8,
  h = 1.6,
  d = 0.65,
  color = 0x7c2d12
): void {
  const grp = new THREE.Group();
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color,
      map: ctx.textures.metalPlateMap,
      normalMap: ctx.textures.metalNormal,
      metalness: 0.62,
      roughness: 0.55,
    })
  );
  slab.castShadow = true;
  slab.receiveShadow = true;
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.94, 0.18, d + 0.05),
    new THREE.MeshStandardMaterial({
      map: ctx.textures.hazardStripeMap,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.25,
      roughness: 0.45,
    })
  );
  strip.position.y = 0.15;
  grp.add(slab, strip);
  grp.position.set(x, h * 0.5, z);
  ctx.scene.add(grp);
  const colIdx = ctx.colliders.length;
  ctx.colliders.push({
    minX: x - w * 0.5,
    maxX: x + w * 0.5,
    minY: 0,
    maxY: h + 0.3,
    minZ: z - d * 0.5,
    maxZ: z + d * 0.5,
    tag: `destructible_${id}`,
  });
  ctx.destructibleBarricades.push({
    id,
    mesh: grp,
    position: new THREE.Vector3(x, h * 0.5, z),
    colliderIndex: colIdx,
    destroyed: false,
    kind: 'barricade',
    health: 110,
    maxHealth: 110,
    minStrength: 3,
  });
}

export function addLevelExitGate(
  ctx: LevelBuildContext,
  id: string,
  label: string,
  x: number,
  z: number,
  stageReq = 2
): void {
  const grp = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    map: ctx.textures.metalPlateMap,
    normalMap: ctx.textures.metalNormal,
    metalness: 0.86,
    roughness: 0.3,
  });
  const hazMat = new THREE.MeshStandardMaterial({
    map: ctx.textures.hazardStripeMap,
    metalness: 0.5,
    roughness: 0.45,
  });

  // Airlock surround stanchions & top bulkhead instead of a flat single box
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.1, 1.3), hull);
  leftPillar.position.set(-1.95, 2.05, 0);
  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.1, 1.3), hull);
  rightPillar.position.set(1.95, 2.05, 0);
  const header = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.9, 1.4), hull);
  header.position.set(0, 3.65, 0);
  const backSeal = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 0.35), hull);
  backSeal.position.set(0, 1.6, -0.35);
  const apron = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 1.8), hazMat);
  apron.position.set(0, 0.04, 0.4);

  const portal = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 3.15),
    new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.85 })
  );
  portal.position.set(0, 1.62, 0.42);

  // Twin side beacons
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
  [-1.95, 1.95].forEach((bx) => {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 0.2), beaconMat);
    lamp.position.set(bx, 2.8, 0.68);
    grp.add(lamp);
  });

  const light = new THREE.PointLight(0x22c55e, 6.5, 18, 1.6);
  light.position.set(0, 2.5, 1.8);
  grp.add(leftPillar, rightPillar, header, backSeal, apron, portal, light);
  grp.position.set(x, 0, z);
  ctx.scene.add(grp);
  ctx.colliders.push({
    minX: x - 2.35,
    maxX: x + 2.35,
    minY: 0,
    maxY: 4.0,
    minZ: z - 0.65,
    maxZ: z + 0.65,
  });
  ctx.interactables.push({
    id,
    kind: 'level_exit',
    label,
    position: new THREE.Vector3(x, 1.5, z + 1.4),
    radius: 3.6,
    mesh: grp,
    consumed: false,
    stageReq,
  });
}

export function addRoomLighting(
  ctx: LevelBuildContext,
  positions: [number, number, number, number, boolean][]
): void {
  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x181c24,
    metalness: 0.8,
    roughness: 0.4,
  });
  positions.forEach(([x, y, z, color, flicker], i) => {
    const light = new THREE.PointLight(color, 4.8, 24, 1.55);
    light.position.set(x, y, z);
    ctx.scene.add(light);

    const shroud = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.56), housingMat);
    shroud.position.set(x, y + 0.32, z);
    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.08, 0.36),
      new THREE.MeshBasicMaterial({ color })
    );
    diffuser.position.set(x, y + 0.24, z);
    ctx.scene.add(shroud, diffuser);

    // Soft additive volumetric ceiling beam cone
    addVolumetricCone(ctx, x, y + 0.2, z, color, 2.4, Math.min(4.8, y), flicker ? 0.03 : 0.04);

    if (flicker) {
      ctx.flickerLights.push({ light, base: 4.8, speed: 4 + (i % 4) * 2.2 });
    }
  });
}

export function addStandardFloor(
  ctx: LevelBuildContext,
  width: number,
  depth: number,
  cx: number,
  cz: number,
  floorMat: THREE.Material,
  ceilY?: number,
  ceilMat?: THREE.Material
): void {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0, cz);
  floor.receiveShadow = true;
  ctx.scene.add(floor);

  if (ceilY && ceilMat) {
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(cx, ceilY, cz);
    ctx.scene.add(ceil);
  }
}

export function addPerimeterWalls(
  ctx: LevelBuildContext,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  height: number,
  mat: THREE.Material
): void {
  const w = maxX - minX;
  const d = maxZ - minZ;
  const cx = (minX + maxX) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  addSolidBox(ctx, cx, height * 0.5, minZ, w + 1.2, height, 1.2, mat);
  addSolidBox(ctx, cx, height * 0.5, maxZ, w + 1.2, height, 1.2, mat);
  addSolidBox(ctx, minX, height * 0.5, cz, 1.2, height, d + 1.2, mat);
  addSolidBox(ctx, maxX, height * 0.5, cz, 1.2, height, d + 1.2, mat);
}

export function addFireSpot(
  ctx: LevelBuildContext,
  id: string,
  x: number,
  y: number,
  z: number,
  scale = 1.0
): void {
  const light = new THREE.PointLight(0xff6b1a, 8.5, 22, 1.55);
  light.position.set(x, y + 1.1, z);
  ctx.scene.add(light);
  ctx.fireEmitters.push({
    id,
    position: new THREE.Vector3(x, y, z),
    directionOut: new THREE.Vector3(0, 1, 0),
    scale,
    heatRadius: 3.4 * scale,
    intensity: 0.9,
    isStructural: false,
    smokeDensity: 0.85,
    light,
    baseLightIntensity: 8.5,
  });
}

// ============================================================================
// PART 1 ENVIRONMENT KITS: NON-INFECTED VEGETATION, METEOR CRATERS & 3059 PROPS
// ============================================================================

export interface GrassPatchDef {
  x: number;
  y?: number;
  z: number;
  spread?: number;
  count?: number;
  scale?: number;
}

/**
 * Renders hundreds of natural un-infected grass/weed tufts in a single InstancedMesh draw call.
 * Uses strictly healthy olive/forest greens (THEY only infect metals & rare-earth elements).
 */
export function buildInstancedGrassTufts(
  scene: THREE.Scene,
  disposeables: { dispose: () => void }[],
  patches: GrassPatchDef[],
  seedOffset = 1
): void {
  let total = 0;
  patches.forEach((p) => {
    total += p.count ?? 8;
  });
  if (total === 0) return;

  // 3-blade tapered grass clump geometry in local space (height ~0.48m, base radius ~0.16m)
  const positions: number[] = [];
  const normals: number[] = [];
  for (let b = 0; b < 3; b++) {
    const ang = (b / 3) * Math.PI * 2 + 0.35;
    const dx = Math.cos(ang);
    const dz = Math.sin(ang);
    const px = -dz * 0.055;
    const pz = dx * 0.055;
    const tipX = dx * 0.14;
    const tipZ = dz * 0.14;
    const h = 0.44 + b * 0.05;
    positions.push(
      px, 0, pz,
      -px, 0, -pz,
      tipX, h, tipZ
    );
    for (let k = 0; k < 3; k++) {
      normals.push(0, 0.85, 0.52);
    }
  }
  const tuftGeo = new THREE.BufferGeometry();
  tuftGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  tuftGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  tuftGeo.computeVertexNormals();

  const tuftMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  disposeables.push(tuftGeo, tuftMat);

  const inst = new THREE.InstancedMesh(tuftGeo, tuftMat, total);
  inst.castShadow = false;
  inst.receiveShadow = true;

  const palette = [
    new THREE.Color(0x365c29),
    new THREE.Color(0x467332),
    new THREE.Color(0x2d4f24),
    new THREE.Color(0x557d36),
    new THREE.Color(0x3f662d),
  ];
  const dummy = new THREE.Object3D();
  let idx = 0;

  patches.forEach((p, pIdx) => {
    const count = p.count ?? 8;
    const spread = p.spread ?? 1.4;
    const baseScale = p.scale ?? 1.0;
    for (let i = 0; i < count; i++) {
      const h1 = Math.sin((pIdx + 1) * 19.31 + (i + seedOffset) * 43.17) * 43758.5453;
      const r1 = h1 - Math.floor(h1);
      const h2 = Math.sin((pIdx + 3) * 37.91 + (i + seedOffset) * 17.53) * 29431.1234;
      const r2 = h2 - Math.floor(h2);
      const h3 = Math.sin((pIdx + 7) * 11.73 + (i + seedOffset) * 53.29) * 18427.6712;
      const r3 = h3 - Math.floor(h3);

      const ang = r1 * Math.PI * 2;
      const dist = Math.sqrt(r2) * spread;
      dummy.position.set(p.x + Math.cos(ang) * dist, p.y ?? 0.01, p.z + Math.sin(ang) * dist);
      dummy.rotation.set((r3 - 0.5) * 0.2, r1 * Math.PI * 2, (r2 - 0.5) * 0.2);
      const s = baseScale * (0.65 + r3 * 0.7);
      dummy.scale.set(s, s * (0.8 + r2 * 0.5), s);
      dummy.updateMatrix();
      inst.setMatrixAt(idx, dummy.matrix);
      inst.setColorAt(idx, palette[idx % palette.length]);
      idx++;
    }
  });

  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  scene.add(inst);
}

/**
 * Multi-part natural roadside tree breaking through cracked pavement (healthy timber & green leaves).
 */
export function buildRoadsideTree(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  x: number,
  z: number,
  scale = 1.0,
  withCollider = true
): void {
  const grp = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({
    map: textures.foliageBarkMap,
    color: 0x73604e,
    roughness: 0.94,
    metalness: 0.02,
  });
  const leafMatA = new THREE.MeshStandardMaterial({
    color: 0x2f5e27,
    roughness: 0.88,
    metalness: 0.02,
  });
  const leafMatB = new THREE.MeshStandardMaterial({
    color: 0x3f7332,
    roughness: 0.86,
    metalness: 0.02,
  });
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x2a231c,
    roughness: 0.96,
  });
  disposeables.push(barkMat, leafMatA, leafMatB, soilMat);

  // Cracked pavement soil mound + exposed roots breaking sidewalk concrete
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 0.14, 9), soilMat);
  soil.position.y = 0.07;
  grp.add(soil);

  for (let r = 0; r < 4; r++) {
    const ang = (r / 4) * Math.PI * 2 + 0.4;
    const root = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 1.25, 6), barkMat);
    root.position.set(Math.cos(ang) * 0.58, 0.14, Math.sin(ang) * 0.58);
    root.rotation.z = -Math.cos(ang) * 1.18;
    root.rotation.x = Math.sin(ang) * 1.18;
    grp.add(root);
  }

  // Tapered main trunk & angled upper boughs
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 3.8, 8), barkMat);
  trunk.position.y = 1.9;
  trunk.rotation.z = 0.04;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  grp.add(trunk);

  const boughL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 2.2, 6), barkMat);
  boughL.position.set(-0.62, 3.6, 0.15);
  boughL.rotation.z = 0.62;
  const boughR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 2.0, 6), barkMat);
  boughR.position.set(0.55, 3.8, -0.2);
  boughR.rotation.z = -0.58;
  grp.add(boughL, boughR);

  // Multi-cluster organic natural green foliage canopy
  const lobes: [number, number, number, number, boolean][] = [
    [0, 4.9, 0, 1.45, false],
    [-1.05, 4.35, 0.35, 1.08, true],
    [1.02, 4.45, -0.28, 1.05, false],
    [0.15, 4.55, 0.95, 0.98, true],
    [-0.25, 4.6, -0.95, 0.95, false],
    [0.1, 5.75, 0.1, 0.92, true],
  ];
  lobes.forEach(([lx, ly, lz, rad, alt]) => {
    const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 1), alt ? leafMatB : leafMatA);
    foliage.position.set(lx, ly, lz);
    foliage.scale.set(1.12, 0.88, 1.08);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    grp.add(foliage);
  });

  grp.position.set(x, 0, z);
  grp.scale.setScalar(scale);
  scene.add(grp);

  if (withCollider) {
    colliders.push({
      minX: x - 0.55 * scale,
      maxX: x + 0.55 * scale,
      minY: 0,
      maxY: 4.5 * scale,
      minZ: z - 0.55 * scale,
      maxZ: z + 0.55 * scale,
      tag: 'natural_tree',
    });
  }
}

/**
 * Natural ivy & climbing green vines draping concrete piers, facades, and damp tunnels.
 */
export function buildClimbingVines(
  scene: THREE.Scene,
  disposeables: { dispose: () => void }[],
  wallX: number,
  baseY: number,
  wallZ: number,
  span: number,
  height: number,
  faceAxis: 'x' | 'z',
  faceSign: 1 | -1,
  seed = 1
): void {
  const vineGroup = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d4a22, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3b6e2c, roughness: 0.84 });
  disposeables.push(stemMat, leafMat);

  const strandCount = 4;
  const leafGeo = new THREE.IcosahedronGeometry(0.26, 0);
  disposeables.push(leafGeo);

  for (let s = 0; s < strandCount; s++) {
    const offset = ((s - 1.5) / Math.max(1, strandCount)) * span * 0.82;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      const sway = Math.sin(t * Math.PI * 2 + seed + s * 1.9) * (span * 0.22);
      const py = baseY + t * height;
      const out = faceSign * (0.06 + (k % 2) * 0.05);
      if (faceAxis === 'x') {
        pts.push(new THREE.Vector3(wallX + out, py, wallZ + offset + sway));
      } else {
        pts.push(new THREE.Vector3(wallX + offset + sway, py, wallZ + out));
      }
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.052, 6, false), stemMat);
    vineGroup.add(tube);

    for (let l = 1; l <= 7; l++) {
      const pt = curve.getPoint(l / 8);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.copy(pt);
      leaf.scale.set(1.3, 0.9, 1.2);
      vineGroup.add(leaf);
    }
  }
  scene.add(vineGroup);
}

/**
 * Dead and leafless tree with bare gnarled branches, broken stubs, and cracked bark.
 */
export function buildDeadLeaflessTree(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  x: number,
  z: number,
  scale = 1.0
): void {
  const grp = new THREE.Group();
  const deadBarkMat = new THREE.MeshStandardMaterial({
    map: textures.foliageBarkMap,
    color: 0x4a4038,
    roughness: 0.96,
    metalness: 0.05,
  });
  disposeables.push(deadBarkMat);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.45, 4.2, 8), deadBarkMat);
  trunk.position.y = 2.1;
  trunk.rotation.z = 0.08;
  trunk.castShadow = true;
  grp.add(trunk);

  [-0.55, 0.52].forEach((bx, idx) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 2.4, 6), deadBarkMat);
    branch.position.set(bx, 3.5 + idx * 0.4, (idx === 0 ? 1 : -1) * 0.2);
    branch.rotation.z = idx === 0 ? 0.82 : -0.76;
    branch.rotation.x = 0.25;
    grp.add(branch);
  });

  grp.position.set(x, 0, z);
  grp.scale.setScalar(scale);
  scene.add(grp);

  colliders.push({
    minX: x - 0.5 * scale,
    maxX: x + 0.5 * scale,
    minY: 0,
    maxY: 4.8 * scale,
    minZ: z - 0.5 * scale,
    maxZ: z + 0.5 * scale,
    tag: 'dead_tree',
  });
}

/**
 * Charred and actively burning tree with blackened wood, glowing orange ember hotspots,
 * and integrated volumetric fire emitter & point light.
 */
export function buildCharredBurningTree(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  fireEmitters: FireEmitterDef[],
  colliders: ColliderBox[],
  x: number,
  z: number,
  scale = 1.0
): void {
  const grp = new THREE.Group();
  const charredMat = new THREE.MeshStandardMaterial({
    color: 0x14100e,
    roughness: 0.95,
    metalness: 0.12,
  });
  const emberCoreMat = new THREE.MeshStandardMaterial({
    color: 0x2b0a03,
    emissive: 0xff5a14,
    emissiveIntensity: 2.2,
    roughness: 0.8,
  });
  disposeables.push(charredMat, emberCoreMat);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.48, 4.5, 8), charredMat);
  trunk.position.y = 2.25;
  trunk.castShadow = true;
  grp.add(trunk);

  const coreGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.8, 6), emberCoreMat);
  coreGlow.position.set(0.05, 2.2, 0);
  grp.add(coreGlow);

  grp.position.set(x, 0, z);
  grp.scale.setScalar(scale);
  scene.add(grp);

  colliders.push({
    minX: x - 0.52 * scale,
    maxX: x + 0.52 * scale,
    minY: 0,
    maxY: 4.8 * scale,
    minZ: z - 0.52 * scale,
    maxZ: z + 0.52 * scale,
    tag: 'burning_tree',
  });

  const fireLight = new THREE.PointLight(0xff6b1a, 6.5, 14, 1.8);
  fireLight.position.set(x, 3.2, z);
  scene.add(fireLight);

  fireEmitters.push({
    id: `tree_fire_${x}_${z}`,
    position: new THREE.Vector3(x, 2.5, z),
    directionOut: new THREE.Vector3(0.2, 1, 0.1).normalize(),
    scale: 1.2 * scale,
    heatRadius: 3.2,
    intensity: 1.0,
    isStructural: false,
    smokeDensity: 1.1,
    light: fireLight,
    baseLightIntensity: 6.5,
  });
}

/**
 * Builds a smoking Meteor Impact Crater landmark with glowing meteorite shards,
 * ejecta boulders, fire/smoke emission, and localized tendrils infecting adjacent metal scrap ONLY.
 */
export function buildMeteorCrater(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  fireEmitters: FireEmitterDef[],
  flickerLights: { light: THREE.PointLight; base: number; speed: number }[],
  colliders: ColliderBox[],
  x: number,
  z: number,
  radius: number,
  id: string
): void {
  const grp = new THREE.Group();

  // Charred impact scorch ring decal on ground
  const scorchMat = new THREE.MeshBasicMaterial({
    map: textures.scorchDecalMap,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    opacity: 0.94,
  });
  const scorch = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2.5, radius * 2.5), scorchMat);
  scorch.rotation.x = -Math.PI / 2;
  scorch.position.y = 0.025;
  grp.add(scorch);

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.94,
    metalness: 0.18,
  });
  const metCoreMat = new THREE.MeshStandardMaterial({
    color: 0x160a10,
    map: textures.alienObsidianMap,
    normalMap: textures.alienObsidianNormal,
    emissive: 0xef4444,
    emissiveMap: textures.alienObsidianEmissive,
    emissiveIntensity: 1.85,
    metalness: 0.78,
    roughness: 0.28,
  });
  const scrapSteelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    map: textures.metalPlateMap,
    metalness: 0.85,
    roughness: 0.42,
  });
  const infectMat = new THREE.MeshPhysicalMaterial({
    color: 0x6b121b,
    map: textures.infectedFleshMap,
    normalMap: textures.infectedFleshNormal,
    emissive: 0x991b1b,
    emissiveMap: textures.infectedEmissiveMap,
    emissiveIntensity: 1.4,
    roughness: 0.36,
    clearcoat: 0.85,
  });
  disposeables.push(scorchMat, rockMat, metCoreMat, scrapSteelMat, infectMat);

  // Crater ejecta rim boulders
  const rimCount = 12;
  for (let i = 0; i < rimCount; i++) {
    const ang = (i / rimCount) * Math.PI * 2 + (i % 2) * 0.14;
    const dist = radius * (0.82 + (i % 3) * 0.08);
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 + (i % 3) * 0.16, 0), rockMat);
    boulder.position.set(Math.cos(ang) * dist, 0.2, Math.sin(ang) * dist);
    boulder.scale.set(1.3, 0.55, 1.1);
    boulder.rotation.set(i * 0.5, ang, i * 0.3);
    boulder.receiveShadow = true;
    grp.add(boulder);
  }

  // Central jagged meteorite core shards
  for (let s = 0; s < 4; s++) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.42 - s * 0.06, 1.75 - s * 0.24, 5), metCoreMat);
    shard.position.set((s - 1.5) * 0.36, 0.78, (s % 2 === 0 ? 1 : -1) * 0.25);
    shard.rotation.z = (s - 1.5) * 0.28;
    shard.rotation.x = ((s % 3) - 1) * 0.2;
    shard.castShadow = true;
    grp.add(shard);
  }

  // Infected bent steel girders near rim showing THEY parasite colonizing metal ONLY
  const rebar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.6, 0.18), scrapSteelMat);
  rebar.position.set(radius * 0.55, 0.65, radius * 0.2);
  rebar.rotation.z = -0.52;
  const tendril = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.2, 0.15, 0.1),
        new THREE.Vector3(radius * 0.32, 0.22, radius * 0.14),
        new THREE.Vector3(radius * 0.58, 0.9, radius * 0.2),
      ]),
      10,
      0.08,
      6,
      false
    ),
    infectMat
  );
  grp.add(rebar, tendril);

  const glow = new THREE.PointLight(0xff4d1a, 7.5, 18, 1.6);
  glow.position.set(0, 1.35, 0);
  grp.add(glow);
  flickerLights.push({ light: glow, base: 7.5, speed: 5.5 });

  fireEmitters.push({
    id: `crater_fire_${id}`,
    position: new THREE.Vector3(x, 0.35, z),
    directionOut: new THREE.Vector3(0, 1, 0),
    scale: 1.05,
    heatRadius: Math.max(2.6, radius * 0.75),
    intensity: 0.9,
    isStructural: false,
    smokeDensity: 1.25,
    light: glow,
    baseLightIntensity: 7.5,
  });

  grp.position.set(x, 0, z);
  scene.add(grp);

  // Compact center core collider so actors route cleanly around the jagged shards
  colliders.push({
    minX: x - 1.15,
    maxX: x + 1.15,
    minY: 0,
    maxY: 2.2,
    minZ: z - 1.15,
    maxZ: z + 1.15,
    tag: `meteor_core_${id}`,
  });
}

/**
 * 3059 AD civilian holographic transit/ad pylon (flickering remnant of pre-collapse city life).
 */
export function buildHoloAdPylon(
  scene: THREE.Scene,
  disposeables: { dispose: () => void }[],
  x: number,
  z: number,
  rotY = 0,
  color = 0x38bdf8
): void {
  const grp = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.32 });
  const paneMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
  });
  disposeables.push(baseMat, paneMat);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.45), baseMat);
  plinth.position.y = 0.175;
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.7, 0.14), baseMat);
  postL.position.set(-0.42, 1.5, 0);
  const postR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.7, 0.14), baseMat);
  postR.position.set(0.42, 1.5, 0);
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.14, 0.24), baseMat);
  topCap.position.y = 2.88;

  const holoPane = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 2.15), paneMat);
  holoPane.position.y = 1.65;
  const scanBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.08, 0.04),
    new THREE.MeshBasicMaterial({ color })
  );
  scanBar.position.y = 2.15;

  grp.add(plinth, postL, postR, topCap, holoPane, scanBar);
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  scene.add(grp);
}

/**
 * Photorealistic destroyed 3059 AD luxury residential villa with multi-level architecture,
 * cantilevered balcony with cracked glass balustrades, collapsed roof with exposed timber joists,
 * sunken swimming pool with murky stagnant water, overgrown gardens, and burned interior furniture.
 */
export function buildDestroyedLuxuryVilla(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  fireEmitters: FireEmitterDef[],
  x: number,
  z: number,
  rotY = 0,
  includeSidePool = true,
  ramps?: RampZone[]
): THREE.Group {
  const grp = new THREE.Group();

  const concMat = new THREE.MeshStandardMaterial({
    map: textures.concreteMap,
    normalMap: textures.concreteNormal,
    roughnessMap: textures.concreteRoughness,
    color: 0x3e4450,
    roughness: 0.93,
    metalness: 0.02,
    envMapIntensity: 0.24,
    normalScale: new THREE.Vector2(1.3, 1.3),
  });
  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.brickMap,
    normalMap: textures.brickNormal,
    roughnessMap: textures.brickRoughness,
    roughness: 0.92,
    metalness: 0.02,
    envMapIntensity: 0.22,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    roughnessMap: textures.woodRoughness,
    roughness: 0.86,
    metalness: 0.02,
    envMapIntensity: 0.24,
  });
  const frameSteel = new THREE.MeshStandardMaterial({
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    color: 0x18202a,
    metalness: 0.78,
    roughness: 0.44,
    envMapIntensity: 0.55,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x94a3b8,
    map: textures.glassCrackedMap,
    normalMap: textures.glassCrackedNormal,
    normalScale: new THREE.Vector2(1.8, 1.8),
    transparent: true,
    opacity: 0.38,
    roughness: 0.14,
    metalness: 0.1,
    envMapIntensity: 0.75,
  });
  const poolWaterMat = new THREE.MeshStandardMaterial({
    color: 0x134e4a,
    normalMap: textures.waterNormalMap,
    roughness: 0.18,
    metalness: 0.06,
    envMapIntensity: 0.72,
    transparent: true,
    opacity: 0.82,
  });
  disposeables.push(concMat, brickMat, woodMat, frameSteel, glassMat, poolWaterMat);

  // 1. Raised Ground Terrace Plinth (18m x 14m x 0.3m)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 14), concMat);
  plinth.position.y = 0.15;
  plinth.receiveShadow = true;
  grp.add(plinth);

  // 2. Ground Floor Solid Exterior Walls with realistic 0.35m thickness
  // South facade with double-height entrance & picture window openings
  const wallS1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.8, 0.35), concMat);
  wallS1.position.set(-5.4, 1.9, 6.0);
  const wallS2 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.8, 0.35), concMat);
  wallS2.position.set(5.4, 1.9, 6.0);
  const lintelS = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.8, 0.35), frameSteel);
  lintelS.position.set(0, 3.4, 6.0);
  // East wall (brick accent)
  const wallE = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.8, 12.35), brickMat);
  wallE.position.set(8.0, 1.9, 0);
  // West wall
  const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.8, 12.35), concMat);
  wallW.position.set(-8.0, 1.9, 0);
  // North back wall
  const wallN = new THREE.Mesh(new THREE.BoxGeometry(16.35, 3.8, 0.35), concMat);
  wallN.position.set(0, 1.9, -6.0);
  grp.add(wallS1, wallS2, lintelS, wallE, wallW, wallN);

  // 3. Cantilevered Second Floor Balcony & Bedroom Wing
  const balconySlab = new THREE.Mesh(new THREE.BoxGeometry(10, 0.35, 7.5), concMat);
  balconySlab.position.set(0, 3.8, 2.5);
  balconySlab.castShadow = true;
  balconySlab.receiveShadow = true;
  // Glass balustrade along balcony edge
  const balustrade = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.05, 0.08), glassMat);
  balustrade.position.set(0, 4.45, 6.1);
  const railTop = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.08, 0.12), frameSteel);
  railTop.position.set(0, 4.95, 6.1);
  grp.add(balconySlab, balustrade, railTop);

  // Upper floor bedroom wing
  const upperWallN = new THREE.Mesh(new THREE.BoxGeometry(10, 3.2, 0.35), concMat);
  upperWallN.position.set(0, 5.5, -1.0);
  const upperWallW = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 7.0), concMat);
  upperWallW.position.set(-4.8, 5.5, 2.5);
  const upperWallE = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 7.0), concMat);
  upperWallE.position.set(4.8, 5.5, 2.5);
  grp.add(upperWallN, upperWallW, upperWallE);

  // 4. Partially Collapsed Roof with Exposed Timber Rafters
  const intactRoof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.35, 7.4), concMat);
  intactRoof.position.set(-2.4, 7.1, 2.5);
  grp.add(intactRoof);
  // Diagonal collapsed concrete slab hanging down
  const collapsedSlab = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.3, 5.2), concMat);
  collapsedSlab.position.set(2.4, 5.8, 2.2);
  collapsedSlab.rotation.z = -0.38;
  grp.add(collapsedSlab);
  // Exposed jagged timber roof rafters
  for (let r = 0; r < 5; r++) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 6.8), woodMat);
    rafter.position.set(-4.0 + r * 1.8, 7.0, 2.5);
    rafter.rotation.z = r > 2 ? -0.35 : 0;
    grp.add(rafter);
  }

  // 5. Optional Side Plunge Pool (low 0.45m coping rim so it doesn't protrude into perimeter walls when disabled)
  if (includeSidePool) {
    const poolBasin = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.45, 4.4), concMat);
    poolBasin.position.set(-13, 0.225, -1);
    const poolWater = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 3.8), poolWaterMat);
    poolWater.rotation.x = -Math.PI / 2;
    poolWater.position.set(-13, 0.46, -1);
    const ladder = new THREE.Group();
    [-0.4, 0.4].forEach((lx) => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8), frameSteel);
      rail.position.set(lx, 0.45, 0);
      ladder.add(rail);
    });
    [0.25, 0.55].forEach((ly) => {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8), frameSteel);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, ly, 0);
      ladder.add(rung);
    });
    ladder.position.set(-13, 0.15, 0.9);
    grp.add(poolBasin, poolWater, ladder);
  }

  // 6. Burned Luxury Furniture inside Ground Floor
  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.9), woodMat);
  coffeeTable.position.set(1.5, 0.45, 1.2);
  coffeeTable.rotation.y = 0.25;
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.95), frameSteel);
  sofaBase.position.set(1.5, 0.5, -2.4);
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 0.35), frameSteel);
  sofaBack.position.set(1.5, 0.95, -2.7);
  // Fallen floor lamp
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8), frameSteel);
  lampPole.position.set(-2.0, 0.34, -1.8);
  lampPole.rotation.z = 1.45;
  grp.add(coffeeTable, sofaBase, sofaBack, lampPole);

  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  scene.add(grp);

  // Rotated Colliders for solid villa boundaries & optional side pool
  addRotatedBoxCollider(colliders, x, z, rotY, -5.4, 6.0, 5.2, 0.45, 0, 4.0, 'villa_wall_s1');
  addRotatedBoxCollider(colliders, x, z, rotY, 5.4, 6.0, 5.2, 0.45, 0, 4.0, 'villa_wall_s2');
  addRotatedBoxCollider(colliders, x, z, rotY, 8.0, 0, 0.45, 12.4, 0, 4.0, 'villa_wall_e');
  addRotatedBoxCollider(colliders, x, z, rotY, -8.0, 0, 0.45, 12.4, 0, 4.0, 'villa_wall_w');
  addRotatedBoxCollider(colliders, x, z, rotY, 0, -6.0, 16.4, 0.45, 0, 4.0, 'villa_wall_n');
  addRotatedBoxCollider(colliders, x, z, rotY, 1.5, -2.5, 2.4, 1.1, 0.3, 1.3, 'villa_sofa');
  if (includeSidePool) {
    addRotatedBoxCollider(colliders, x, z, rotY, -13, -1, 6.4, 4.4, 0, 0.6, 'villa_pool');
  }
  if (ramps) {
    const hw = Math.abs(9.0 * Math.cos(rotY)) + Math.abs(7.0 * Math.sin(rotY));
    const hd = Math.abs(9.0 * Math.sin(rotY)) + Math.abs(7.0 * Math.cos(rotY));
    ramps.push({
      kind: 'platform',
      floorLevel: 0,
      minX: x - hw,
      maxX: x + hw,
      minZ: z - hd,
      maxZ: z + hd,
      zStart: z,
      zEnd: z,
      yStart: 0.3,
      yEnd: 0.3,
    });
  }

  return grp;
}

/**
 * Photorealistic 3059 AD storefront with extruded door frames, hinges, handles,
 * tempered cracked glass display windows, buckled security shutter, flickering neon, and toppled display shelves.
 */
export function buildDetailedStorefront(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  x: number,
  z: number,
  rotY = 0,
  storeName = 'OMNI-PHARMA TECH',
  neonColor = 0x06b6d4
): THREE.Group {
  const grp = new THREE.Group();

  const concMat = new THREE.MeshStandardMaterial({
    map: textures.concreteMap,
    normalMap: textures.concreteNormal,
    color: 0x2d3440,
    roughness: 0.88,
    metalness: 0.15,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    color: 0x1f2937,
    metalness: 0.85,
    roughness: 0.35,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    map: textures.glassCrackedMap,
    normalMap: textures.glassCrackedNormal,
    normalScale: new THREE.Vector2(2.0, 2.0),
    transparent: true,
    opacity: 0.32,
    roughness: 0.08,
    metalness: 0.15,
  });
  const neonMat = new THREE.MeshStandardMaterial({
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 1.85,
    roughness: 0.2,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    roughness: 0.8,
  });
  disposeables.push(concMat, steelMat, glassMat, neonMat, woodMat);

  // 1. Concrete Portal Frame (width = 9m, height = 4.8m, depth = 0.45m)
  const pierL = new THREE.Mesh(new THREE.BoxGeometry(0.75, 4.8, 0.45), concMat);
  pierL.position.set(-4.1, 2.4, 0);
  const pierR = new THREE.Mesh(new THREE.BoxGeometry(0.75, 4.8, 0.45), concMat);
  pierR.position.set(4.1, 2.4, 0);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.85, 0.5), concMat);
  lintel.position.set(0, 4.35, 0);
  grp.add(pierL, pierR, lintel);

  // 2. Transom Fascia with Glowing Store Logo
  const signBacking = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.7, 0.15), steelMat);
  signBacking.position.set(0, 4.35, 0.22);
  const neonBar = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.28, 0.08), neonMat);
  neonBar.position.set(0, 4.35, 0.3);
  grp.add(signBacking, neonBar);

  // 3. Large Display Window Bay (left) with Tempered Cracked Glass Pane
  const winFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 0.16), steelMat);
  winFrame.position.set(-2.0, 2.0, 0);
  const winGlass = new THREE.Mesh(new THREE.BoxGeometry(3.3, 3.1, 0.06), glassMat);
  winGlass.position.set(-2.0, 2.0, 0);
  grp.add(winFrame, winGlass);

  // 4. Commercial Entrance Door (right) with Jambs, Hinges, Kickplate, and Steel Handle
  const doorJamb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.6, 0.2), steelMat);
  doorJamb.position.set(2.2, 1.85, 0);
  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.3, 0.08), steelMat);
  doorLeaf.position.set(2.2, 1.75, 0.2);
  doorLeaf.rotation.y = -0.45; // Ajar
  // Handle
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8), steelMat);
  handle.position.set(1.3, 1.6, 0.45);
  grp.add(doorJamb, doorLeaf, handle);

  // 5. Corrugated Rolling Security Shutter (partially jammed at top)
  const shutter = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.9, 0.12), steelMat);
  shutter.position.set(0, 3.45, 0.15);
  grp.add(shutter);

  // 6. Enclosed Interior Shop Shell (side walls, back wall, roof & floor slab)
  const shopSideL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.8, 2.6), concMat);
  shopSideL.position.set(-4.25, 2.4, -1.3);
  const shopSideR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.8, 2.6), concMat);
  shopSideR.position.set(4.25, 2.4, -1.3);
  const shopBack = new THREE.Mesh(new THREE.BoxGeometry(8.95, 4.8, 0.45), concMat);
  shopBack.position.set(0, 2.4, -2.4);
  const shopRoof = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.35, 2.8), concMat);
  shopRoof.position.set(0, 4.65, -1.25);
  const shopFloor = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.06, 2.3), concMat);
  shopFloor.position.set(0, 0.03, -1.2);
  grp.add(shopSideL, shopSideR, shopBack, shopRoof, shopFloor);

  // 7. Toppled Display Shelves inside shop
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.65), woodMat);
  shelf.position.set(-1.8, 0.4, -1.4);
  shelf.rotation.z = 0.38;
  grp.add(shelf);

  // 8. Abandoned Shopping Cart parked outside
  const cartGrp = new THREE.Group();
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.95), steelMat);
  basket.position.y = 0.7;
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.9), steelMat);
  chassis.position.y = 0.25;
  const cartHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), steelMat);
  cartHandle.rotation.z = Math.PI / 2;
  cartHandle.position.set(0, 0.95, 0.5);
  cartGrp.add(basket, chassis, cartHandle);
  cartGrp.position.set(3.4, 0, 1.8);
  cartGrp.rotation.y = 0.65;
  grp.add(cartGrp);

  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  scene.add(grp);

  // Rotated colliders for front piers, solid display window bay, and enclosed interior walls
  addRotatedBoxCollider(colliders, x, z, rotY, -4.1, 0, 0.8, 0.55, 0, 4.8, 'storefront_pier_l');
  addRotatedBoxCollider(colliders, x, z, rotY, 4.1, 0, 0.8, 0.55, 0, 4.8, 'storefront_pier_r');
  addRotatedBoxCollider(colliders, x, z, rotY, -2.0, 0, 3.7, 0.4, 0, 4.2, 'storefront_window');
  addRotatedBoxCollider(colliders, x, z, rotY, -4.25, -1.3, 0.5, 2.6, 0, 4.8, 'storefront_side_l');
  addRotatedBoxCollider(colliders, x, z, rotY, 4.25, -1.3, 0.5, 2.6, 0, 4.8, 'storefront_side_r');
  addRotatedBoxCollider(colliders, x, z, rotY, 0, -2.4, 8.95, 0.5, 0, 4.8, 'storefront_back');
  addRotatedBoxCollider(colliders, x, z, rotY, 3.4, 1.8, 0.9, 1.1, 0, 1.1, 'storefront_cart');

  return grp;
}

/**
 * Damaged commercial escalator with angled steel truss, step treads, yellow safety lines,
 * broken tempered glass balustrades, and rubber handrail.
 */
export function buildDamagedEscalator(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  x: number,
  y: number,
  z: number,
  rotY = 0,
  ramps?: RampZone[]
): THREE.Group {
  const grp = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    color: 0x334155,
    metalness: 0.88,
    roughness: 0.32,
  });
  const treadMat = new THREE.MeshStandardMaterial({
    map: textures.grateMap,
    normalMap: textures.grateNormal,
    color: 0x1e293b,
    metalness: 0.82,
    roughness: 0.4,
  });
  const hazYellow = new THREE.MeshBasicMaterial({ color: 0xeab308 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x94a3b8,
    map: textures.glassCrackedMap,
    normalMap: textures.glassCrackedNormal,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
  });
  disposeables.push(steelMat, treadMat, hazYellow, glassMat);

  const span = 9.0;
  const height = 4.5;
  const width = 1.6;

  // Main inclined structural truss beam
  const trussLen = Math.hypot(span, height);
  const ang = Math.atan2(height, span);
  const truss = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, trussLen), steelMat);
  truss.position.set(0, height * 0.5, 0);
  truss.rotation.x = -ang;
  grp.add(truss);

  // Stepped stair steps
  const stepCount = 12;
  for (let s = 0; s < stepCount; s++) {
    const t = s / (stepCount - 1);
    const sy = t * (height - 0.3) + 0.15;
    const sz = (t - 0.5) * span;
    const step = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.28, 0.55), treadMat);
    step.position.set(0, sy, sz);
    // Yellow safety warning edge strip
    const strip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.04, 0.06), hazYellow);
    strip.position.set(0, sy + 0.14, sz + 0.25);
    grp.add(step, strip);
  }

  // Side glass balustrade with rubber handrail + top safety guard bar
  [-width * 0.5, width * 0.5].forEach((gx) => {
    const balustrade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, trussLen), glassMat);
    balustrade.position.set(gx, height * 0.5 + 0.55, 0);
    balustrade.rotation.x = -ang;
    const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, trussLen), steelMat);
    handrail.position.set(gx, height * 0.5 + 1.05, 0);
    handrail.rotation.x = -ang;
    grp.add(balustrade, handrail);
  });
  const topBarrier = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.16, 0.16), steelMat);
  topBarrier.position.set(0, height + 0.72, span * 0.5);
  grp.add(topBarrier);

  grp.position.set(x, y, z);
  grp.rotation.y = rotY;
  scene.add(grp);

  // Side balustrade colliders + top safety stop + walkable incline ramp
  addRotatedBoxCollider(colliders, x, z, rotY, -width * 0.5, 0, 0.18, span, y, y + height + 1.1, 'escalator_rail_l');
  addRotatedBoxCollider(colliders, x, z, rotY, width * 0.5, 0, 0.18, span, y, y + height + 1.1, 'escalator_rail_r');
  addRotatedBoxCollider(colliders, x, z, rotY, 0, span * 0.5, width, 0.28, y, y + height + 1.1, 'escalator_top_stop');

  if (ramps) {
    const cos = Math.cos(rotY);
    const zBot = z - span * 0.5 * cos;
    const zTop = z + span * 0.5 * cos;
    ramps.push({
      kind: 'escalator',
      stepCount: 14,
      escalatorSpeed: 0,
      broken: true,
      minX: x - width * 0.45,
      maxX: x + width * 0.45,
      minZ: Math.min(zBot, zTop),
      maxZ: Math.max(zBot, zTop),
      zStart: zBot,
      zEnd: zTop,
      yStart: y + 0.15,
      yEnd: y + height - 0.1,
    });
  }

  return grp;
}

/**
 * Colossal high-visibility construction tower crane with yellow lattice mast,
 * operator cab with glass panes, slewing unit, working jib, counter-jib with concrete counterweights, and hoist hook.
 */
export function buildTowerCrane(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  x: number,
  z: number,
  height = 28
): THREE.Group {
  const grp = new THREE.Group();

  const yellowSteel = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    metalness: 0.78,
    roughness: 0.38,
  });
  const darkSteel = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    metalness: 0.88,
    roughness: 0.3,
  });
  const concCounter = new THREE.MeshStandardMaterial({
    color: 0x334155,
    map: textures.concreteMap,
    roughness: 0.92,
  });
  disposeables.push(yellowSteel, darkSteel, concCounter);

  // 1. Concrete Ground Foundation Pad & Anchor Base
  const basePad = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.8, 6.4), concCounter);
  basePad.position.y = 0.4;
  grp.add(basePad);

  // 2. Vertical Lattice Mast (4 corner tubular posts + diagonal X-lacing)
  const mastW = 2.4;
  const colGeo = new THREE.BoxGeometry(0.24, height, 0.24);
  [-mastW * 0.5, mastW * 0.5].forEach((mx) => {
    [-mastW * 0.5, mastW * 0.5].forEach((mz) => {
      const col = new THREE.Mesh(colGeo, yellowSteel);
      col.position.set(mx, height * 0.5 + 0.8, mz);
      grp.add(col);
    });
  });
  // Cross lacing bands every 3m
  for (let ly = 2; ly < height; ly += 3.2) {
    const bandX = new THREE.Mesh(new THREE.BoxGeometry(mastW, 0.16, 0.16), yellowSteel);
    bandX.position.set(0, ly + 0.8, mastW * 0.5);
    const bandXBack = bandX.clone();
    bandXBack.position.z = -mastW * 0.5;
    grp.add(bandX, bandXBack);
  }

  // 3. Slewing Ring & Operator Cab (near top)
  const slewingUnit = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.2, 16), darkSteel);
  slewingUnit.position.y = height + 1.2;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.4, 2.6), yellowSteel);
  cab.position.set(1.8, height + 2.2, 0);
  grp.add(slewingUnit, cab);

  // 4. Horizontal Working Jib Boom (stretching 24m forward)
  const jib = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 26), yellowSteel);
  jib.position.set(0, height + 3.1, -11);
  // Counter-Jib (stretching 10m backward) with concrete counterweight blocks
  const counterJib = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 10), yellowSteel);
  counterJib.position.set(0, height + 3.0, 6.5);
  const counterWeights = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 3.8), concCounter);
  counterWeights.position.set(0, height + 3.2, 9.8);
  // Hoist Trolley Cable & Hook
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), darkSteel);
  trolley.position.set(0, height + 2.2, -14);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 12, 6), darkSteel);
  cable.position.set(0, height - 4.0, -14);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 6, 12), darkSteel);
  hook.position.set(0, height - 10.2, -14);
  grp.add(jib, counterJib, counterWeights, trolley, cable, hook);

  // Apex A-frame tower with steel guy wire tie rods
  const apex = new THREE.Mesh(new THREE.ConeGeometry(1.4, 5.5, 4), yellowSteel);
  apex.position.set(0, height + 5.8, 0);
  apex.rotation.y = Math.PI / 4;
  grp.add(apex);

  grp.position.set(x, 0, z);
  scene.add(grp);

  colliders.push({
    minX: x - 1.4,
    maxX: x + 1.4,
    minZ: z - 1.4,
    maxZ: z + 1.4,
    minY: 0,
    maxY: height + 6,
    tag: 'tower_crane',
  });

  return grp;
}

/**
 * Multi-tier steel construction scaffolding with galvanized clamp couplers,
 * timber plank working decks, kickboards, and safety railings.
 */
export function buildConstructionScaffolding(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  x: number,
  y: number,
  z: number,
  span = 8,
  height = 8.5,
  rotY = 0
): THREE.Group {
  const grp = new THREE.Group();

  const tubeSteel = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    metalness: 0.92,
    roughness: 0.28,
  });
  const plankWood = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    roughnessMap: textures.woodRoughness,
    roughness: 0.85,
  });
  disposeables.push(tubeSteel, plankWood);

  const depth = 2.0;
  const colGeo = new THREE.CylinderGeometry(0.06, 0.06, height, 8);

  // Upright vertical standards
  const xPosts = [-span * 0.5, 0, span * 0.5];
  const zPosts = [-depth * 0.5, depth * 0.5];
  xPosts.forEach((px) => {
    zPosts.forEach((pz) => {
      const col = new THREE.Mesh(colGeo, tubeSteel);
      col.position.set(px, height * 0.5, pz);
      grp.add(col);
    });
  });

  // Multi-tier decks every 2.4m
  const tiers = Math.floor(height / 2.4);
  for (let t = 1; t <= tiers; t++) {
    const dy = t * 2.4;
    // Wooden plank working deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(span, 0.12, depth * 0.88), plankWood);
    deck.position.set(0, dy, 0);
    // Tubular ledger rails & kickboards
    const guardrail = new THREE.Mesh(new THREE.BoxGeometry(span, 0.05, 0.05), tubeSteel);
    guardrail.position.set(0, dy + 1.0, depth * 0.5);
    const kickboard = new THREE.Mesh(new THREE.BoxGeometry(span, 0.22, 0.04), plankWood);
    kickboard.position.set(0, dy + 0.12, depth * 0.5);
    grp.add(deck, guardrail, kickboard);
  }

  grp.position.set(x, y, z);
  grp.rotation.y = rotY;
  scene.add(grp);

  addRotatedBoxCollider(colliders, x, z, rotY, 0, 0, span, depth, y, y + height, 'scaffolding');

  return grp;
}

/**
 * Underground Metro station passenger platform with tactile safety edge,
 * sunken track bed with dual steel T-rails, timber railroad ties, and stone ballast.
 */
export function buildMetroPlatform(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  sparkEmitters: SparkEmitterDef[],
  x: number,
  z: number,
  length = 36
): THREE.Group {
  const grp = new THREE.Group();

  const concMat = new THREE.MeshStandardMaterial({
    map: textures.concreteMap,
    normalMap: textures.concreteNormal,
    roughnessMap: textures.concreteRoughness,
    color: 0x475569,
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.24,
  });
  const railMat = new THREE.MeshStandardMaterial({
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.32,
    envMapIntensity: 0.65,
  });
  const tieMat = new THREE.MeshStandardMaterial({
    map: textures.woodMap,
    normalMap: textures.woodNormal,
    color: 0x271f18,
    roughness: 0.96,
    metalness: 0.01,
    envMapIntensity: 0.16,
  });
  const tactileYellow = new THREE.MeshBasicMaterial({ color: 0xeab308 });
  disposeables.push(concMat, railMat, tieMat, tactileYellow);

  // 1. Raised Passenger Platform (h = 1.1m, w = 8m)
  const plat = new THREE.Mesh(new THREE.BoxGeometry(8, 1.1, length), concMat);
  plat.position.set(4, 0.55, 0);
  plat.receiveShadow = true;
  // Tactile yellow safety edge strip
  const edgeStrip = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, length), tactileYellow);
  edgeStrip.position.set(0.18, 1.12, 0);
  grp.add(plat, edgeStrip);

  // 2. Sunken Track Bed (w = 6m, depth = 0m ground level)
  const trackBed = new THREE.Mesh(new THREE.BoxGeometry(6, 0.12, length), concMat);
  trackBed.position.set(-3.2, 0.06, 0);
  grp.add(trackBed);

  // Dual steel rails and timber ties
  const tieCount = Math.floor(length / 1.4);
  for (let i = 0; i < tieCount; i++) {
    const tz = (i / tieCount - 0.5) * length;
    const tie = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 0.32), tieMat);
    tie.position.set(-3.2, 0.15, tz);
    grp.add(tie);
  }
  // Left and Right steel T-rails
  [-4.0, -2.4].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, length), railMat);
    rail.position.set(rx, 0.32, 0);
    grp.add(rail);
  });

  // Shorted electrical junction box with sparks
  const jBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.65, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 })
  );
  jBox.position.set(7.8, 1.8, -4);
  grp.add(jBox);
  sparkEmitters.push({
    position: new THREE.Vector3(x + 7.8, 1.8, z - 4),
    interval: 1.6,
    timer: 0.5,
  });

  grp.position.set(x, 0, z);
  scene.add(grp);

  colliders.push({
    minX: x,
    maxX: x + 8,
    minZ: z - length * 0.5,
    maxZ: z + length * 0.5,
    minY: 0,
    maxY: 1.1,
    tag: 'metro_platform',
  });

  return grp;
}

/**
 * High-tech cylindrical cryogenic containment specimen pod with frosted glass,
 * interior silhouette, control console, and chilled coolant pipe conduits.
 */
export function buildLabCryoChamber(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  x: number,
  z: number,
  rotY = 0
): THREE.Group {
  const grp = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.3,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.42,
    roughness: 0.15,
    metalness: 0.2,
  });
  const specimenMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b4b,
    roughness: 0.6,
  });
  disposeables.push(steelMat, glassMat, specimenMat);

  // Plinth and top dome
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.45, 16), steelMat);
  plinth.position.y = 0.225;
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.2, 0.5, 16), steelMat);
  topCap.position.y = 3.65;
  // Glass cylinder chamber
  const glassCylinder = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 3.0, 16, 1, true), glassMat);
  glassCylinder.position.y = 1.95;
  // Specimen silhouette inside
  const specimen = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.4, 8, 12), specimenMat);
  specimen.position.set(0, 1.95, 0);
  specimen.rotation.z = 0.15;

  grp.add(plinth, topCap, glassCylinder, specimen);
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  scene.add(grp);

  colliders.push({
    minX: x - 1.2,
    maxX: x + 1.2,
    minZ: z - 1.2,
    maxZ: z + 1.2,
    minY: 0,
    maxY: 4.0,
    tag: 'lab_cryo_chamber',
  });

  return grp;
}

/**
 * Destroyed futuristic Main Battle Tank with heavy composite armor, blown track wheels,
 * charred turret hatch, bent main cannon barrel, and smoke emitter.
 */
export function buildMilitaryTankWreck(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  fireEmitters: FireEmitterDef[],
  x: number,
  z: number,
  rotY = 0
): THREE.Group {
  const grp = new THREE.Group();

  const armorMat = new THREE.MeshStandardMaterial({
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    roughnessMap: textures.metalRoughness,
    metalnessMap: textures.metalMetalness,
    color: 0x283328, // Military Olive Drab
    metalness: 0.85,
    roughness: 0.45,
  });
  const charredMat = new THREE.MeshStandardMaterial({
    color: 0x141210,
    roughness: 0.94,
    metalness: 0.15,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    map: textures.metalPlateMap,
    color: 0x1c1917,
    metalness: 0.88,
  });
  disposeables.push(armorMat, charredMat, wheelMat);

  // 1. Lower Chassis Hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.4, 7.8), armorMat);
  hull.position.y = 1.0;
  hull.castShadow = true;
  grp.add(hull);

  // 2. Twin Track Assemblies (blown out on one side)
  [-2.2, 2.2].forEach((tx, idx) => {
    const trackSponson = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.2, 8.4), charredMat);
    trackSponson.position.set(tx, 0.8, 0);
    grp.add(trackSponson);
    for (let w = 0; w < 6; w++) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.35, 12), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(tx * 1.08, 0.65, -3.2 + w * 1.3);
      if (idx === 1 && w > 3) wheel.rotation.y = 0.45; // Blown track wheel
      grp.add(wheel);
    }
  });

  // 3. Angular Composite Armored Turret
  const turret = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.25, 4.2), armorMat);
  turret.position.set(0, 2.3, -0.4);
  turret.rotation.y = 0.35;
  // Scorched Commander Hatch (tilted open)
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 10), charredMat);
  hatch.position.set(0.65, 3.0, -0.6);
  hatch.rotation.x = -0.7;
  // Main Cannon Barrel (bent/damaged)
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 5.5, 10), charredMat);
  barrel.position.set(-0.6, 2.3, 3.6);
  barrel.rotation.x = Math.PI / 2 + 0.15;
  grp.add(turret, hatch, barrel);

  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  scene.add(grp);

  [-2.6, 0, 2.6].forEach((lz) => {
    addRotatedBoxCollider(colliders, x, z, rotY, 0, lz, 4.7, 3.1, 0, 3.2, 'tank_wreck');
  });

  const fireLight = new THREE.PointLight(0xff6b1a, 6.0, 14, 1.8);
  fireLight.position.set(x + 0.6, 2.8, z - 0.6);
  scene.add(fireLight);

  fireEmitters.push({
    id: `tank_fire_${x}_${z}`,
    position: new THREE.Vector3(x + 0.6, 2.8, z - 0.6),
    directionOut: new THREE.Vector3(0.1, 1, 0.2).normalize(),
    scale: 1.15,
    heatRadius: 3.2,
    intensity: 0.9,
    isStructural: false,
    smokeDensity: 1.3,
    light: fireLight,
    baseLightIntensity: 6.0,
  });

  return grp;
}

/**
 * Colossal 16m steerable parabolic satellite dish antenna with structural support truss,
 * quad focal feed struts, central feedhorn, geared elevation/azimuth drive, and red aviation beacons.
 */
export function buildColossalDishAntenna(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  disposeables: { dispose: () => void }[],
  colliders: ColliderBox[],
  x: number,
  z: number,
  dishRadius = 8
): THREE.Group {
  const grp = new THREE.Group();

  const dishMat = new THREE.MeshStandardMaterial({
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    color: 0xe2e8f0,
    metalness: 0.88,
    roughness: 0.28,
  });
  const trussMat = new THREE.MeshStandardMaterial({
    map: textures.metalPlateMap,
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.38,
  });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  disposeables.push(dishMat, trussMat, beaconMat);

  // 1. Reinforced Concrete Bunker Pedestal
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(dishRadius * 0.45, dishRadius * 0.55, 6.5, 16),
    trussMat
  );
  pedestal.position.y = 3.25;
  grp.add(pedestal);

  // 2. Geared Azimuth / Elevation Turntable
  const turntable = new THREE.Mesh(new THREE.CylinderGeometry(dishRadius * 0.32, dishRadius * 0.32, 1.8, 16), trussMat);
  turntable.position.y = 7.4;
  grp.add(turntable);

  // 3. Parabolic Reflector Dish (tilted skyward at 45 degrees)
  const dishGrp = new THREE.Group();
  const dishGeo = new THREE.SphereGeometry(dishRadius, 24, 14, 0, Math.PI * 2, 0, 0.75);
  const dish = new THREE.Mesh(dishGeo, dishMat);
  dish.rotation.x = Math.PI; // Inverted sphere creates concave parabolic bowl
  dishGrp.add(dish);

  // Quad Feedhorn Struts & Central Subreflector
  for (let s = 0; s < 4; s++) {
    const ang = (s / 4) * Math.PI * 2;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, dishRadius * 0.95, 8), trussMat);
    strut.position.set(Math.cos(ang) * (dishRadius * 0.45), (dishRadius * 0.45), Math.sin(ang) * (dishRadius * 0.45));
    strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.cos(ang), 1, -Math.sin(ang)).normalize());
    dishGrp.add(strut);
  }
  const feedHorn = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 12), trussMat);
  feedHorn.position.y = dishRadius * 0.72;
  feedHorn.rotation.x = Math.PI;
  // Red aviation warning strobe on dish rim
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), beaconMat);
  beacon.position.set(0, dishRadius * 0.75, dishRadius * 0.65);
  dishGrp.add(feedHorn, beacon);

  dishGrp.position.set(0, 8.5, 0);
  dishGrp.rotation.x = 0.52; // Tilted toward space
  grp.add(dishGrp);

  grp.position.set(x, 0, z);
  scene.add(grp);

  colliders.push({
    minX: x - dishRadius * 0.55,
    maxX: x + dishRadius * 0.55,
    minZ: z - dishRadius * 0.55,
    maxZ: z + dishRadius * 0.55,
    minY: 0,
    maxY: 16,
    tag: 'colossal_dish_antenna',
  });

  return grp;
}

// Thin LevelBuildContext wrappers for modular levelsAct1/2/3 builders
export function addInstancedGrassTufts(ctx: LevelBuildContext, patches: GrassPatchDef[], seedOffset = 1): void {
  buildInstancedGrassTufts(ctx.scene, ctx.disposeables, patches, seedOffset);
}
export function addDestroyedLuxuryVilla(
  ctx: LevelBuildContext,
  x: number,
  z: number,
  rotY = 0,
  includeSidePool = true
): THREE.Group {
  return buildDestroyedLuxuryVilla(ctx.scene, ctx.textures, ctx.disposeables, ctx.colliders, ctx.fireEmitters, x, z, rotY, includeSidePool, ctx.ramps);
}
export function addDetailedStorefront(
  ctx: LevelBuildContext,
  x: number,
  z: number,
  rotY = 0,
  storeName?: string,
  neonColor?: number
): THREE.Group {
  return buildDetailedStorefront(ctx.scene, ctx.textures, ctx.disposeables, ctx.colliders, x, z, rotY, storeName, neonColor);
}
export function addDamagedEscalator(
  ctx: LevelBuildContext,
  x: number,
  y: number,
  z: number,
  rotY = 0
): THREE.Group {
  return buildDamagedEscalator(ctx.scene, ctx.textures, ctx.disposeables, ctx.colliders, x, y, z, rotY, ctx.ramps);
}
export function addTowerCrane(
  ctx: LevelBuildContext,
  x: number,
  z: number,
  height = 28
): THREE.Group {
  return buildTowerCrane(ctx.scene, ctx.textures, ctx.disposeables, ctx.colliders, x, z, height);
}
export function addConstructionScaffolding(
  ctx: LevelBuildContext,
  x: number,
  y: number,
  z: number,
  span = 8,
  height = 8.5,
  rotY = 0
): THREE.Group {
  return buildConstructionScaffolding(ctx.scene, ctx.textures, ctx.disposeables, ctx.colliders, x, y, z, span, height, rotY);
}
export function addMetroPlatform(
  ctx: LevelBuildContext,
  x: number,
  z: number,
  length = 36
): THREE.Group {
  return buildMetroPlatform(ctx.scene, ctx.textures, ctx.disposeables, ctx.colliders, ctx.sparkEmitters, x, z, length);
}
export function addLabCryoChamber(
  ctx: LevelBuildContext,
  x: number,
  z: number,
  rotY = 0
): THREE.Group {
  return buildLabCryoChamber(ctx.scene, ctx.textures, ctx.disposeables, ctx.colliders, x, z, rotY);
}
export function addMilitaryTankWreck(
  ctx: LevelBuildContext,
  x: number,
  z: number,
  rotY = 0
): THREE.Group {
  return buildMilitaryTankWreck(ctx.scene, ctx.textures, ctx.disposeables, ctx.colliders, ctx.fireEmitters, x, z, rotY);
}
export function addColossalDishAntenna(
  ctx: LevelBuildContext,
  x: number,
  z: number,
  dishRadius = 8
): THREE.Group {
  return buildColossalDishAntenna(ctx.scene, ctx.textures, ctx.disposeables, ctx.colliders, x, z, dishRadius);
}
export function addRoadsideTree(
  ctx: LevelBuildContext,
  x: number,
  z: number,
  scale = 1.0,
  withCollider = true
): void {
  buildRoadsideTree(ctx.scene, ctx.textures, ctx.disposeables, ctx.colliders, x, z, scale, withCollider);
}
export function addClimbingVines(
  ctx: LevelBuildContext,
  wallX: number,
  baseY: number,
  wallZ: number,
  span: number,
  height: number,
  faceAxis: 'x' | 'z',
  faceSign: 1 | -1,
  seed = 1
): void {
  buildClimbingVines(ctx.scene, ctx.disposeables, wallX, baseY, wallZ, span, height, faceAxis, faceSign, seed);
}
export function addMeteorCrater(ctx: LevelBuildContext, x: number, z: number, radius: number, id: string): void {
  buildMeteorCrater(
    ctx.scene,
    ctx.textures,
    ctx.disposeables,
    ctx.fireEmitters,
    ctx.flickerLights,
    ctx.colliders,
    x,
    z,
    radius,
    id
  );
}
export function addHoloAdPylon(ctx: LevelBuildContext, x: number, z: number, rotY = 0, color = 0x38bdf8): void {
  buildHoloAdPylon(ctx.scene, ctx.disposeables, x, z, rotY, color);
}

