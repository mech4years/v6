import * as THREE from 'three';
import { ProceduralTextureSet } from '../textures';
import { BuiltWorld } from '../worldBuilder';
import { buildDeadMallWorld } from './deadMallBuilder';
import { buildDeadConstructionWorld } from './deadConstructionBuilder';
import {
  addAlienFungusColonies,
  addClimbingVines,
  addConsoleInteractable,
  addDestructibleBarricade,
  addDestroyedLuxuryVilla,
  addDynamicDoor,
  addFireSpot,
  addFloorDecal,
  addInstancedGrassTufts,
  addLevelExitGate,
  addPerimeterWalls,
  addPickup,
  addRoadsideTree,
  addRoomLighting,
  addSaveAndWorkbench,
  addSolidBox,
  addStandardFloor,
  addWallXWithDoor,
  addWallZWithDoor,
  createLevelContext,
  finalizeLevelWorld,
  makeTiledMat,
} from './levelShared';

// ============================================================================
// LEVEL 02 — THE SILENT ESTATES (Abandoned Luxury Residential Villas + THE CRAWLER)
// ============================================================================
export function buildLevel2World(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  const ctx = createLevelContext(scene, textures, 0x05080c, 0x0a1017, 0.022);

  const driveMat = makeTiledMat(ctx, {
    map: textures.asphaltMap,
    normalMap: textures.asphaltNormal,
    roughnessMap: textures.asphaltRoughness,
    repeatX: 12,
    repeatY: 26,
    color: 0x475569,
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.34,
    normalScale: 1.45,
  });
  const brickPaveMat = makeTiledMat(ctx, {
    map: textures.brickMap,
    normalMap: textures.brickNormal,
    roughnessMap: textures.brickRoughness,
    repeatX: 8,
    repeatY: 16,
    roughness: 0.92,
    metalness: 0.02,
    envMapIntensity: 0.22,
  });
  const estateWall = makeTiledMat(ctx, {
    map: textures.concreteMap,
    normalMap: textures.concreteNormal,
    roughnessMap: textures.concreteRoughness,
    repeatX: 6,
    repeatY: 2,
    color: 0x334155,
    roughness: 0.92,
    metalness: 0.03,
    envMapIntensity: 0.24,
    normalScale: 1.35,
  });
  const trimSteel = makeTiledMat(ctx, {
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    repeatX: 1,
    repeatY: 2,
    color: 0x1e293b,
    metalness: 0.78,
    roughness: 0.46,
    envMapIntensity: 0.52,
  });

  // Main residential access drive and flagstone grounds
  addStandardFloor(ctx, 60, 126, 0, -34, driveMat, 7.5, estateWall);

  // Central brick promenade strip leading between the estates
  const promStrip = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 114), brickPaveMat);
  promStrip.rotation.x = -Math.PI / 2;
  promStrip.position.set(0, 0.015, -34);
  promStrip.receiveShadow = true;
  scene.add(promStrip);

  addPerimeterWalls(ctx, -28, 28, -94, 22, 7.5, estateWall);

  // 1. DESTROYED LUXURY VILLA ALPHA (West Estate - Multi-Floor, Balcony, Broken Glass)
  addDestroyedLuxuryVilla(ctx, -17.5, -12, 0, false);

  // 2. DESTROYED LUXURY VILLA BETA (East Estate - Cantilevered Terraces)
  addDestroyedLuxuryVilla(ctx, 17.5, -42, Math.PI, false);

  // 3. MURKY STAGNANT SWIMMING POOL (East Courtyard at x=16, z=-14)
  const poolFloor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.06, 11.4), brickPaveMat);
  poolFloor.position.set(16, 0.03, -14);
  poolFloor.receiveShadow = true;
  scene.add(poolFloor);

  // Murky green stagnant water surface with subsurface algae tint
  const poolWaterMat = new THREE.MeshStandardMaterial({
    color: 0x115e59,
    roughness: 0.18,
    metalness: 0.06,
    envMapIntensity: 0.72,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  ctx.disposeables.push(poolWaterMat);
  const poolWater = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 11.0), poolWaterMat);
  poolWater.rotation.x = -Math.PI / 2;
  poolWater.position.set(16, 0.24, -14);
  scene.add(poolWater);

  // Pool border coping curb + collider
  const copingMat = makeTiledMat(ctx, {
    map: textures.concreteMap,
    normalMap: textures.concreteNormal,
    roughnessMap: textures.concreteRoughness,
    repeatX: 4,
    repeatY: 4,
    color: 0x94a3b8,
    roughness: 0.92,
    metalness: 0.02,
    envMapIntensity: 0.22,
  });
  const poolCurbNorth = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.44, 0.4), copingMat);
  poolCurbNorth.position.set(16, 0.22, -8.4);
  const poolCurbSouth = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.44, 0.4), copingMat);
  poolCurbSouth.position.set(16, 0.22, -19.6);
  const poolCurbWest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.44, 11.6), copingMat);
  poolCurbWest.position.set(12.3, 0.22, -14);
  const poolCurbEast = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.44, 11.6), copingMat);
  poolCurbEast.position.set(19.7, 0.22, -14);
  scene.add(poolCurbNorth, poolCurbSouth, poolCurbWest, poolCurbEast);
  ctx.colliders.push({
    minX: 12.1,
    maxX: 19.9,
    minY: 0,
    maxY: 0.48,
    minZ: -19.8,
    maxZ: -8.2,
    tag: 'pool_basin',
  });

  // Pool handrail ladder seated atop North coping curb
  const ladderGroup = new THREE.Group();
  [-0.3, 0.3].forEach((lx) => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8), trimSteel);
    rail.position.set(lx, 0.38, 0);
    ladderGroup.add(rail);
  });
  [0.25, 0.55].forEach((ry) => {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8), trimSteel);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, ry, 0);
    ladderGroup.add(rung);
  });
  ladderGroup.position.set(16, 0.15, -8.6);
  scene.add(ladderGroup);

  // Interconnected villa courtyards with wide archways
  addWallXWithDoor(ctx, 2, -28, 28, 7.5, 1.0, 0, 5.5, 4.0, estateWall);
  addWallXWithDoor(ctx, -32, -28, 28, 7.5, 1.0, 0, 6.0, 4.2, estateWall);
  addWallXWithDoor(ctx, -62, -28, 28, 7.5, 1.0, 0, 5.0, 3.8, estateWall);
  addDynamicDoor(ctx, 'door_l2_exit', 0, -62, 5.0, 3.8, 0.55, 0x1e293b, 0xef4444);

  // Dead & overgrown estate trees (completely natural, uninfected as per lore)
  addRoadsideTree(ctx, -22, 10, 1.15, true);
  addRoadsideTree(ctx, 22, 8, 1.05, true);
  addRoadsideTree(ctx, -22, -38, 1.2, true);
  addRoadsideTree(ctx, -22, -56, 1.1, true);

  // Natural climbing ivy & vines scaling the villa facades and stone walls
  addClimbingVines(ctx, -27.4, 0.2, 12.0, 3.2, 6.8, 'x', 1);
  addClimbingVines(ctx, 27.4, 0.2, -14.0, 3.4, 6.8, 'x', -1);
  addClimbingVines(ctx, -27.4, 0.2, -42.0, 3.8, 6.8, 'x', 1);
  addClimbingVines(ctx, 0, 0.2, -32.0, 4.2, 5.4, 'z', 1);

  // Damp natural moss and overgrown grass tufts in gardens and cracked pavers
  addFloorDecal(ctx, -15, -16, 4.8, 4.8, textures.mossDecalMap, 0.85, 0.4);
  addFloorDecal(ctx, 10.2, -14, 4.2, 4.2, textures.mossDecalMap, 0.82, -0.3);
  addFloorDecal(ctx, -21, 14, 4.6, 4.6, textures.mossDecalMap, 0.8, 0.2);
  addFloorDecal(ctx, 21, -28, 4.4, 4.4, textures.mossDecalMap, 0.78, -0.5);
  addInstancedGrassTufts(
    ctx,
    [
      { x: -22, y: 0.01, z: 16, spread: 2.2, count: 16 },
      { x: 22, y: 0.01, z: 14, spread: 2.0, count: 14 },
      { x: 16, y: 0.01, z: -7.0, spread: 1.8, count: 12 },
      { x: -16, y: 0.01, z: -34, spread: 2.2, count: 16 },
      { x: -18, y: 0.01, z: -54, spread: 2.0, count: 14 },
    ],
    28
  );

  // Secret Wine Cellar Stash cleanly enclosed at NE corner (x: 14..28, z: -62..-50) north of Villa Beta
  addSolidBox(ctx, 21.0, 3.1, -50.0, 14.2, 6.2, 0.8, estateWall);
  addWallZWithDoor(ctx, 14.0, -62.0, -50.0, 6.2, 0.8, -56.0, 4.0, 2.6, estateWall);
  addSolidBox(ctx, 21.0, 6.3, -56.0, 14.2, 0.4, 12.4, estateWall);
  addDestructibleBarricade(ctx, 'l2_secret_grate', 14.0, -56.0, 0.75, 2.6, 4.1, 0xb45309);
  addPickup(ctx, 'sec_02_stash', 'secret_cache', 'CLAIM VILLA WINE CELLAR STASH (+2 SALVAGE)', 21, 0.45, -56, 0xf59e0b, {
    secretId: 'sec_02_vault',
    secretTitle: 'ABANDONED VILLA WINE CELLAR',
  });

  // Objectives
  addConsoleInteractable(ctx, 'l2_vent_valve', 'vent_valve', 'RESTORE VENTILATION TURBINE B-2', -19.5, -6, 0x38bdf8);
  addConsoleInteractable(
    ctx,
    'l2_elec_puzzle',
    'puzzle',
    'CALIBRATE ELECTRICAL RELAY (MATH PUZZLE)',
    -20,
    -24,
    0xf59e0b,
    { puzzleId: 'puz_02_elec', doorId: 'door_l2_exit' }
  );
  addPickup(ctx, 'l2_maint_key', 'keycard', 'TAKE MAINTENANCE ACCESS KEY', 20, 0.8, -7, 0x38bdf8);
  addConsoleInteractable(
    ctx,
    'l2_blast_panel',
    'gate_panel',
    'UNLOCK RESEARCH COMPLEX BLAST DOOR',
    -4.5,
    -60.5,
    0x22c55e,
    { doorId: 'door_l2_exit' }
  );

  addSaveAndWorkbench(ctx, 'l2', 17, -24, 17, -21);
  addLevelExitGate(ctx, 'l2_exit', 'ENTER PROJECT GENESIS LAB (LEVEL 03)', 0, -88, 2);

  // Lore & Supplies
  addPickup(ctx, 'l2_lore_1', 'lore', 'READ SUB-LEVEL VENTILATION LOG', -4, 0.5, 10, 0x60a5fa, {
    loreId: 'doc_tunnel_collapse',
  });
  addPickup(ctx, 'l2_lore_2', 'lore', 'PLAY MAINTENANCE SHAFT AUDIO LOG', -15, 0.5, -16, 0xf87171, {
    loreId: 'audio_crawler_ambush',
  });
  addPickup(ctx, 'l2_lore_3', 'lore', 'READ SCRATCHED TUNNEL WALL NOTE', 18.5, 0.5, -58, 0x60a5fa, {
    loreId: 'doc_choir_scribble',
  });
  addPickup(ctx, 'l2_med_1', 'medkit', 'COLLECT MEDKIT (+35 HP)', 4, 0.35, -18, 0x22c55e);
  addPickup(ctx, 'l2_ammo_1', 'ammo', 'COLLECT AMMO CRATE', -4, 0.35, -40, 0xf59e0b);
  addPickup(ctx, 'l2_bat_1', 'battery', 'COLLECT FLASHLIGHT CELL', 5, 0.35, -54, 0x38bdf8);

  addRoomLighting(ctx, [
    [0, 5.4, 14, 0xef4444, true],
    [-16, 5.4, -14, 0x38bdf8, false],
    [16, 5.4, -14, 0xf59e0b, false],
    [0, 5.4, -46, 0xef4444, true],
    [0, 5.4, -76, 0x22c55e, false],
  ]);
  addFireSpot(ctx, 'l2_fire_1', -12, 0.2, -38, 0.9);

  ctx.enemySpawns.push(
    { id: 'l2_crawler_1', type: 'crawler', position: new THREE.Vector3(0, 0, -10), patrolTarget: new THREE.Vector3(0, 0, -24), initiallyActive: true },
    { id: 'l2_crawler_2', type: 'crawler', position: new THREE.Vector3(-14, 0, -21), patrolTarget: new THREE.Vector3(-14, 0, -24), initiallyActive: true },
    { id: 'l2_crawler_3', type: 'crawler', position: new THREE.Vector3(10, 0, -14), patrolTarget: new THREE.Vector3(10, 0, -24), initiallyActive: true },
    { id: 'l2_screamer_1', type: 'screamer', position: new THREE.Vector3(-5, 0, -44), patrolTarget: new THREE.Vector3(5, 0, -48), initiallyActive: true },
    { id: 'l2_stalker_1', type: 'stalker', position: new THREE.Vector3(0, 0, -54), patrolTarget: new THREE.Vector3(-6, 0, -40), initiallyActive: true },
    { id: 'l2_crawler_4', type: 'crawler', position: new THREE.Vector3(-8, 0, -72), patrolTarget: new THREE.Vector3(8, 0, -76), initiallyActive: true },
    { id: 'l2_scrapper_1', type: 'scrapper', position: new THREE.Vector3(4, 0, -78), patrolTarget: new THREE.Vector3(-4, 0, -72), initiallyActive: true }
  );

  // Black & Blood-Red Alien Fungus — damp villa corners, decaying timber & wine cellar
  addAlienFungusColonies(
    ctx,
    [
      { id: 'l2_fungus_wood', kind: 'small', x: -20.2, y: 0.01, z: 12.4, scale: 1.0, substrate: 'decaying_wood', seed: 201 },
      { id: 'l2_fungus_courtyard', kind: 'large', x: -16.5, y: 0.01, z: -34.5, scale: 1.05, substrate: 'damp_soil', seed: 202 },
      { id: 'l2_fungus_wall', kind: 'spreading', x: -27.4, y: 1.85, z: -14.0, mount: 'wall_x_pos', scale: 0.95, seed: 203 },
      { id: 'l2_fungus_cellar', kind: 'large', x: 23.5, y: 0.01, z: -54.0, scale: 0.9, substrate: 'decaying_wood', seed: 204 },
      { id: 'l2_fungus_east', kind: 'small', x: 17.2, y: 0.01, z: -40.5, scale: 0.95, substrate: 'damp_soil', seed: 205 },
    ],
    2022
  );
  addPickup(ctx, 'l2_lore_fungus', 'lore', 'INSPECT BLACK CRIMSON-VEINED GROWTH', -14.6, 0.45, -33.2, 0x991b1b, {
    loreId: 'doc_fungus_estate_basement',
  });

  return finalizeLevelWorld(ctx, new THREE.Vector3(0, 0, 17), 0);
}

// ============================================================================
// LEVEL 03 — THE DEAD MALL (Aethelion Grand Galleria 3059 AD + THE WATCHER)
// ============================================================================
export function buildLevel3World(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  return buildDeadMallWorld(scene, textures);
}

// ============================================================================
// LEVEL 04 — THE DEAD CONSTRUCTION ZONE (3059 AD Unfinished Megacity Construction Site + THE HUNTER)
// ============================================================================
export function buildLevel4World(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  return buildDeadConstructionWorld(scene, textures);
}
