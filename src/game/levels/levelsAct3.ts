import * as THREE from 'three';
import { ProceduralTextureSet } from '../textures';
import { BuiltWorld } from '../worldBuilder';
import {
  addAlienFungusColonies,
  addColossalDishAntenna,
  addConsoleInteractable,
  addDestructibleBarricade,
  addDetailedPillar,
  addDynamicDoor,
  addFireSpot,
  addFloorDecal,
  addInstancedGrassTufts,
  addLevelExitGate,
  addPerimeterWalls,
  addPickup,
  addPipeConduit,
  addRoomLighting,
  addSaveAndWorkbench,
  addSolidBox,
  addStandardFloor,
  addStructuralArchRibs,
  addVolumetricCone,
  addWallXWithDoor,
  addWallZWithDoor,
  createLevelContext,
  finalizeLevelWorld,
  makeTiledMat,
} from './levelShared';

// ============================================================================
// LEVEL 09 — ORBITAL LAUNCH FACILITY (Rocket Hangar + THE TITAN Boss)
// ============================================================================
export function buildLevel9World(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  const ctx = createLevelContext(scene, textures, 0x05070c, 0x090d16, 0.015);

  const tarmacMat = makeTiledMat(ctx, {
    map: textures.asphaltMap,
    normalMap: textures.asphaltNormal,
    roughnessMap: textures.asphaltRoughness,
    repeatX: 18,
    repeatY: 34,
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.32,
    normalScale: 1.4,
  });
  const apronMat = makeTiledMat(ctx, {
    map: textures.grateMap,
    normalMap: textures.grateNormal,
    roughnessMap: textures.grateRoughness,
    repeatX: 4,
    repeatY: 32,
    roughness: 0.76,
    metalness: 0.56,
    envMapIntensity: 0.44,
  });
  const hangarWall = makeTiledMat(ctx, {
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    roughnessMap: textures.metalRoughness,
    repeatX: 9,
    repeatY: 3,
    color: 0x334155,
    metalness: 0.62,
    roughness: 0.66,
    envMapIntensity: 0.46,
    normalScale: 1.3,
  });
  const darkTrim = makeTiledMat(ctx, {
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    repeatX: 2,
    repeatY: 2,
    color: 0x161d29,
    metalness: 0.76,
    roughness: 0.5,
    envMapIntensity: 0.52,
  });
  const rocketWhite = makeTiledMat(ctx, {
    map: textures.labTileMap,
    normalMap: textures.labTileNormal,
    repeatX: 4,
    repeatY: 8,
    color: 0xe2e8f0,
    metalness: 0.28,
    roughness: 0.44,
    envMapIntensity: 0.5,
  });
  const hazMat = makeTiledMat(ctx, {
    map: textures.hazardStripeMap,
    normalMap: textures.metalNormal,
    repeatX: 4,
    repeatY: 1,
    roughness: 0.68,
    metalness: 0.25,
    envMapIntensity: 0.36,
  });

  addStandardFloor(ctx, 76, 134, 0, -38, tarmacMat);
  const centralDeck = new THREE.Mesh(new THREE.PlaneGeometry(10, 128), apronMat);
  centralDeck.rotation.x = -Math.PI / 2;
  centralDeck.position.set(0, 0.015, -38);
  centralDeck.receiveShadow = true;
  scene.add(centralDeck);

  addPerimeterWalls(ctx, -36, 36, -102, 24, 16, hangarWall);
  addStructuralArchRibs(ctx, -35.2, 35.2, [10, -14, -42, -62, -84], 16, darkTrim, hangarWall);

  // Rocket Assembly Hangar divider & Launch Pad gate
  addWallXWithDoor(ctx, -28, -36, 36, 14, 1.2, 0, 8.0, 5.8, hangarWall);
  addDynamicDoor(ctx, 'door_l9_pad', 0, -28, 8.0, 5.8, 0.7, 0x1e293b, 0x38bdf8);

  // Colossal Multi-Stage Ares-IX Orbital Rocket + Twin SRBs + Launch Umbilical Gantry (Pad 01: 22, -76)
  const rocketGroup = new THREE.Group();
  const launchPlinth = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.2, 1.1, 16), hazMat);
  launchPlinth.position.y = 0.55;
  const coreStage = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.7, 21, 18), rocketWhite);
  coreStage.position.y = 12.2;
  coreStage.castShadow = true;
  const interstageRing = new THREE.Mesh(new THREE.CylinderGeometry(2.48, 2.48, 1.8, 18), darkTrim);
  interstageRing.position.y = 19.4;
  const upperStage = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 5.2, 18), rocketWhite);
  upperStage.position.y = 22.8;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(2.2, 6.5, 18), darkTrim);
  nose.position.y = 28.6;

  // Main Engine Thruster Bells
  for (let n = 0; n < 3; n++) {
    const ang = (n / 3) * Math.PI * 2;
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.88, 1.6, 12), darkTrim);
    bell.position.set(Math.cos(ang) * 1.1, 1.4, Math.sin(ang) * 1.1);
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.25, 0.4, 10),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    glow.position.set(Math.cos(ang) * 1.1, 0.85, Math.sin(ang) * 1.1);
    rocketGroup.add(bell, glow);
  }

  // Twin Strap-on Solid Rocket Boosters (SRBs)
  [-3.3, 3.3].forEach((sx) => {
    const srbBody = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 15.5, 14), rocketWhite);
    srbBody.position.set(sx, 9.6, 0);
    const srbCone = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.6, 14), hazMat);
    srbCone.position.set(sx, 18.6, 0);
    const srbNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.72, 1.2, 12), darkTrim);
    srbNozzle.position.set(sx, 1.3, 0);
    rocketGroup.add(srbBody, srbCone, srbNozzle);
  });

  // Umbilical Gantry Mast & Fuel Swing Arms
  const gantryTower = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 26, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x7f1d1d, metalness: 0.75, roughness: 0.4 })
  );
  gantryTower.position.set(5.6, 13, 0);
  [8, 15, 21].forEach((ay) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.55, 0.9), darkTrim);
    arm.position.set(3.4, ay, 0);
    rocketGroup.add(arm);
  });

  rocketGroup.add(launchPlinth, coreStage, interstageRing, upperStage, nose, gantryTower);
  rocketGroup.position.set(22, 0, -76);
  scene.add(rocketGroup);
  ctx.colliders.push(
    {
      minX: 15.8,
      maxX: 28.2,
      minY: 0,
      maxY: 28,
      minZ: -82.2,
      maxZ: -69.8,
      tag: 'ares_rocket_plinth',
    },
    {
      minX: 26.3,
      maxX: 28.9,
      minY: 0,
      maxY: 26,
      minZ: -77.3,
      maxZ: -74.7,
      tag: 'ares_gantry_tower',
    }
  );

  // Detailed Gantry Support Columns on Launch Apron
  [-18, 18].forEach((gx) => {
    [-48, -68].forEach((gz) => {
      addDetailedPillar(ctx, gx, gz, 3.2, 12, 3.2, hangarWall, darkTrim, 0x38bdf8);
    });
  });

  addPipeConduit(ctx, -28, 8.2, 20, -28, 8.2, -96, 0.36, darkTrim, hazMat);
  addPipeConduit(ctx, 28, 8.2, 20, 28, 8.2, -96, 0.36, darkTrim, hazMat);
  addFloorDecal(ctx, 22, -68, 9, 9, textures.scorchDecalMap, 0.9, 0.2);
  addFloorDecal(ctx, -29, 10, 5.5, 5.5, textures.mossDecalMap, 0.78, 0.4);
  addFloorDecal(ctx, 29, -12, 5.5, 5.5, textures.mossDecalMap, 0.78, -0.3);
  addInstancedGrassTufts(
    ctx,
    [
      { x: -30, y: 0.01, z: 12, spread: 2.2, count: 14 },
      { x: 30, y: 0.01, z: -10, spread: 2.2, count: 14 },
      { x: -30, y: 0.01, z: -48, spread: 2.2, count: 14 },
      { x: 30, y: 0.01, z: -48, spread: 2.2, count: 14 },
    ],
    99
  );
  addVolumetricCone(ctx, 22, 14, -76, 0x38bdf8, 6.0, 12.0, 0.045);

  // Secret Booster Assembly Cache (x: -36..-16.5, z: -20..-4)
  addSolidBox(ctx, -26.25, 3.5, -4, 19.5, 7, 0.8, hangarWall);
  addSolidBox(ctx, -26.25, 3.5, -20, 19.5, 7, 0.8, hangarWall);
  addWallZWithDoor(ctx, -16.5, -20, -4, 7, 0.8, -12, 4.0, 2.4, hangarWall);
  addSolidBox(ctx, -26.25, 7.2, -12, 19.5, 0.4, 16.5, hangarWall);
  addDestructibleBarricade(ctx, 'l9_secret_bay', -16.5, -12, 0.75, 2.4, 4.1, 0xf59e0b);
  addPickup(ctx, 'sec_09_stash', 'secret_cache', 'CLAIM LAUNCH BAY CORES (+2 SALVAGE)', -27, 0.5, -12, 0xf59e0b, {
    secretId: 'sec_09_pad',
    secretTitle: 'BOOSTER ASSEMBLY VAULT',
  });

  addConsoleInteractable(
    ctx,
    'l9_orbital_puzzle',
    'puzzle',
    'SOLVE ORBITAL IGNITION BUS (MATH PUZZLE)',
    12,
    -25,
    0xf59e0b,
    { puzzleId: 'puz_09_orbital', doorId: 'door_l9_pad' }
  );

  addSaveAndWorkbench(ctx, 'l9', 16, 8, 16, -8);
  addLevelExitGate(ctx, 'l9_exit', 'INFILTRATE THE HELIOS NETWORK (LEVEL 10)', 0, -96, 2);

  addPickup(ctx, 'l9_lore_1', 'lore', 'READ LAUNCH PAD 01 MANIFEST', -5, 0.5, 10, 0x60a5fa, {
    loreId: 'doc_orbital_launch',
  });
  addPickup(ctx, 'l9_lore_2', 'lore', 'READ HEAVY GANTRY MECH REPORT', 8, 0.5, -14, 0x60a5fa, {
    loreId: 'doc_titan_file',
  });
  addPickup(ctx, 'l9_lore_3', 'lore', 'PLAY FLIGHT DIRECTOR AUDIO', 0, 0.5, -86, 0xf87171, {
    loreId: 'audio_orbital_code',
  });
  addPickup(ctx, 'l9_med_1', 'medkit', 'COLLECT MEDKIT (+35 HP)', -24, 0.35, -58, 0x22c55e);
  addPickup(ctx, 'l9_ammo_1', 'ammo', 'COLLECT HEAVY AMMO CRATE', 24, 0.35, -58, 0xf59e0b);
  addPickup(ctx, 'l9_bat_1', 'battery', 'COLLECT REACTOR CELL', 0, 0.35, -36, 0x38bdf8);

  addRoomLighting(ctx, [
    [0, 10, 12, 0x38bdf8, false],
    [0, 10, -16, 0xf59e0b, true],
    [0, 12, -58, 0xef4444, true],
    [18, 10, -76, 0x38bdf8, false],
  ]);
  addFireSpot(ctx, 'l9_fire_1', 22, 0.5, -66, 1.3);

  ctx.enemySpawns.push(
    { id: 'l9_sentinel_1', type: 'sentinel', position: new THREE.Vector3(-4, 0, -10), patrolTarget: new THREE.Vector3(6, 0, -16), initiallyActive: true },
    { id: 'l9_scrapper_1', type: 'scrapper', position: new THREE.Vector3(10, 0, -18), patrolTarget: new THREE.Vector3(-6, 0, -20), initiallyActive: true },
    { id: 'l9_boss_titan', type: 'titan', position: new THREE.Vector3(0, 0, -70), patrolTarget: new THREE.Vector3(0, 0, -48), initiallyActive: true, isBoss: true }
  );

  return finalizeLevelWorld(ctx, new THREE.Vector3(0, 0, 19), 0, new THREE.Vector3(0, 0, -64));
}

// ============================================================================
// LEVEL 10 — THE FINAL SIGNAL (Satellite Array Facility, 18m Dish Antenna + HELIOS DEFENCE UNIT)
// ============================================================================
export function buildLevel10World(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  const ctx = createLevelContext(scene, textures, 0x02060c, 0x050e1c, 0.018);

  const serverFloor = makeTiledMat(ctx, {
    map: textures.grateMap,
    normalMap: textures.grateNormal,
    roughnessMap: textures.grateRoughness,
    metalnessMap: textures.grateMetalness,
    repeatX: 16,
    repeatY: 32,
    color: 0x334155,
    metalness: 0.54,
    roughness: 0.72,
    envMapIntensity: 0.44,
    normalScale: 1.25,
  });
  const serverWall = makeTiledMat(ctx, {
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    repeatX: 10,
    repeatY: 3,
    color: 0x1e293b,
    metalness: 0.66,
    roughness: 0.58,
    envMapIntensity: 0.5,
    normalScale: 1.3,
  });
  const rackBladeMat = makeTiledMat(ctx, {
    map: textures.serverRackMap,
    normalMap: textures.serverRackNormal,
    emissiveMap: textures.serverRackEmissive,
    repeatX: 2,
    repeatY: 2,
    emissive: 0xffffff,
    emissiveIntensity: 1.35,
    metalness: 0.66,
    roughness: 0.46,
    envMapIntensity: 0.5,
  });
  const holoMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.85,
    transparent: true,
    opacity: 0.75,
  });
  ctx.disposeables.push(holoMat);

  addStandardFloor(ctx, 68, 128, 0, -35, serverFloor, 9.2, serverWall);
  addPerimeterWalls(ctx, -32, 32, -96, 24, 9.2, serverWall);
  addStructuralArchRibs(ctx, -31.2, 31.2, [10, -14, -40, -62, -84], 9.2, serverWall);

  // 1. COLOSSAL 18-METER PARABOLIC DISH ANTENNA IN HELIOS ARRAY FACILITY
  addColossalDishAntenna(ctx, 0, -62, 18);

  addWallXWithDoor(ctx, -28, -32, 32, 9.2, 1.0, 0, 7.0, 5.0, serverWall);
  addDynamicDoor(ctx, 'door_l10_core', 0, -28, 7.0, 5.0, 0.65, 0x0f172a, 0x38bdf8);

  // Optical Telemetry Server Racks flanking main corridor & AI Core Room
  [-12, 12].forEach((sx) => {
    [-6, -16, -48, -68].forEach((sz) => {
      addSolidBox(ctx, sx, 2.3, sz, 1.7, 4.6, 3.6, rackBladeMat);
      const crown = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.25, 3.75), serverWall);
      crown.position.set(sx, 4.72, sz);
      const led = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.14, 3.2), holoMat);
      led.position.set(sx, 3.55, sz);
      scene.add(crown, led);
    });
  });

  // Overhead optical fiber cable trays
  addPipeConduit(ctx, -12, 7.2, 18, -12, 7.2, -90, 0.24, serverWall);
  addPipeConduit(ctx, 12, 7.2, 18, 12, 7.2, -90, 0.24, serverWall);

  // Multi-Ring Rotating Holographic Orbital Satellite Array inside AI Core Room (0, 5.8, -62)
  const holoAssembly = new THREE.Group();
  const holoCore = new THREE.Mesh(new THREE.OctahedronGeometry(2.1, 1), holoMat);
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.1, 8, 32), holoMat);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.08, 8, 32), holoMat);
  ringB.rotation.x = Math.PI / 3;
  const ringC = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.07, 8, 32), holoMat);
  ringC.rotation.y = Math.PI / 3;
  holoAssembly.add(holoCore, ringA, ringB, ringC);
  holoAssembly.position.set(0, 6.2, -62);
  scene.add(holoAssembly);
  addVolumetricCone(ctx, 0, 8.8, -62, 0x38bdf8, 4.5, 8.6, 0.06);

  ctx.animatedProps.push(
    { kind: 'spinY', object: holoCore, speed: 0.9 },
    { kind: 'hoverSpin', object: ringA, speed: -1.1, baseY: 0, amplitude: 0.15 },
    { kind: 'spinY', object: ringB, speed: 0.75 },
    { kind: 'spinY', object: ringC, speed: -0.55 }
  );

  // Secret Server Core Vault (x: 15..32, z: -20..-6, clear of x=12 server racks)
  addSolidBox(ctx, 23.5, 4.6, -6, 17.5, 9.2, 0.8, serverWall);
  addSolidBox(ctx, 23.5, 4.6, -20, 17.5, 9.2, 0.8, serverWall);
  addWallZWithDoor(ctx, 15.0, -20, -6, 9.2, 0.8, -13, 4.0, 2.6, serverWall);
  addSolidBox(ctx, 23.5, 9.4, -13, 17.5, 0.4, 14.5, serverWall);
  addDestructibleBarricade(ctx, 'l10_secret_rack', 15.0, -13, 0.75, 2.6, 4.1, 0x38bdf8);
  addPickup(ctx, 'sec_10_stash', 'secret_cache', 'CLAIM HELIOS ENCRYPTED CORES (+2 SALVAGE)', 23, 0.5, -13, 0xf59e0b, {
    secretId: 'sec_10_server',
    secretTitle: 'ENCRYPTED MAINFRAME VAULT',
  });

  addConsoleInteractable(
    ctx,
    'l10_helios_puzzle',
    'puzzle',
    'SEVER DISH AZIMUTH LOCK (MATH PUZZLE)',
    0,
    -25.2,
    0x38bdf8,
    { puzzleId: 'puz_10_helios', doorId: 'door_l10_core' }
  );

  addSaveAndWorkbench(ctx, 'l10', -18, 8, -18, -16);
  addLevelExitGate(ctx, 'l10_exit', 'BOARD ORBITAL TRANSFER POD (LEVEL 11)', 0, -92, 2);

  addPickup(ctx, 'l10_lore_1', 'lore', 'READ HELIOS ARCHITECTURE FILE', -4, 0.5, 10, 0x60a5fa, {
    loreId: 'doc_helios_core',
  });
  addPickup(ctx, 'l10_lore_2', 'lore', 'READ 3059 METEOR SPECTROSCOPY', 6, 0.5, -14, 0x60a5fa, {
    loreId: 'doc_meteor_origin',
  });
  addPickup(ctx, 'l10_lore_3', 'lore', 'PLAY SERVER HALL OMEGA AUDIO', 0, 0.5, -84, 0xf87171, {
    loreId: 'audio_helios_defence',
  });
  addPickup(ctx, 'l10_med_1', 'medkit', 'COLLECT MEDKIT (+35 HP)', -22, 0.35, -56, 0x22c55e);
  addPickup(ctx, 'l10_ammo_1', 'ammo', 'COLLECT HEAVY AMMO CRATE', 22, 0.35, -56, 0xf59e0b);
  addPickup(ctx, 'l10_bat_1', 'battery', 'COLLECT HIGH-CAP CELL', 0, 0.35, -40, 0x38bdf8);

  addRoomLighting(ctx, [
    [0, 8.2, 10, 0x38bdf8, false],
    [0, 8.2, -16, 0x0ea5e9, false],
    [0, 8.2, -60, 0xef4444, true],
    [0, 8.2, -84, 0x22c55e, false],
  ]);

  ctx.enemySpawns.push(
    { id: 'l10_sentinel_1', type: 'sentinel', position: new THREE.Vector3(-4, 0, -10), patrolTarget: new THREE.Vector3(6, 0, -18), initiallyActive: true },
    { id: 'l10_watcher_1', type: 'watcher', position: new THREE.Vector3(8, 0, -18), patrolTarget: new THREE.Vector3(-6, 0, -18), initiallyActive: true },
    { id: 'l10_boss_helios', type: 'helios_unit', position: new THREE.Vector3(0, 0, -76), patrolTarget: new THREE.Vector3(0, 0, -48), initiallyActive: true, isBoss: true }
  );

  return finalizeLevelWorld(ctx, new THREE.Vector3(0, 0, 19), 0, new THREE.Vector3(0, 0, -62));
}

// ============================================================================
// LEVEL 11 — BEYOND EARTH (Orbital Station + Zero-G + Earth Vista + VOID WALKER)
// ============================================================================
export function buildLevel11World(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  const ctx = createLevelContext(scene, textures, 0x010206, 0x02040a, 0.009);

  const deckMat = makeTiledMat(ctx, {
    map: textures.labTileMap,
    normalMap: textures.labTileNormal,
    roughnessMap: textures.labTileRoughness,
    repeatX: 14,
    repeatY: 30,
    color: 0x64748b,
    metalness: 0.2,
    roughness: 0.76,
    envMapIntensity: 0.38,
    normalScale: 1.25,
  });
  const grateMat = makeTiledMat(ctx, {
    map: textures.grateMap,
    normalMap: textures.grateNormal,
    repeatX: 2,
    repeatY: 28,
    color: 0x475569,
    metalness: 0.58,
    roughness: 0.72,
    envMapIntensity: 0.44,
  });
  const hullWall = makeTiledMat(ctx, {
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    roughnessMap: textures.metalRoughness,
    repeatX: 10,
    repeatY: 2,
    color: 0x334155,
    metalness: 0.66,
    roughness: 0.58,
    envMapIntensity: 0.5,
    normalScale: 1.3,
  });

  // Multi-layered Starfield + Nebula Backdrops
  const starGeo = new THREE.BufferGeometry();
  const stars = new Float32Array(1200 * 3);
  for (let i = 0; i < 1200; i++) {
    stars[i * 3] = (Math.random() - 0.5) * 340;
    stars[i * 3 + 1] = 15 + Math.random() * 150;
    stars[i * 3 + 2] = -40 + (Math.random() - 0.5) * 340;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.55 })));

  // Photorealistic Procedural Planet Earth + Atmospheric Rim Glow Halo + Rotating Vein Lattice
  const earthGroup = new THREE.Group();
  const earthMat = new THREE.MeshStandardMaterial({
    map: textures.earthMap,
    normalMap: textures.earthNormal,
    normalScale: new THREE.Vector2(1.4, 1.4),
    roughnessMap: textures.earthRoughness,
    emissive: 0x0b162a,
    emissiveIntensity: 0.45,
    roughness: 0.55,
    metalness: 0.08,
  });
  const earthBody = new THREE.Mesh(new THREE.SphereGeometry(52, 48, 48), earthMat);
  const infectedVeins = new THREE.Mesh(
    new THREE.SphereGeometry(52.35, 28, 28),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    })
  );
  const atmoHalo = new THREE.Mesh(
    new THREE.SphereGeometry(54.8, 36, 36),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    })
  );
  earthGroup.add(earthBody, infectedVeins, atmoHalo);
  earthGroup.position.set(78, 12, -55);
  scene.add(earthGroup);
  ctx.animatedProps.push({ kind: 'spinY', object: earthGroup, speed: 0.035 });

  addStandardFloor(ctx, 56, 122, 0, -35, deckMat, 6.6, hullWall);
  const stationCatwalk = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 118), grateMat);
  stationCatwalk.rotation.x = -Math.PI / 2;
  stationCatwalk.position.set(0, 0.015, -35);
  scene.add(stationCatwalk);

  // Leave East wall open above waist height as panoramic Earth viewport!
  addSolidBox(ctx, -28, 3.3, -35, 1.2, 6.6, 120, hullWall);
  addSolidBox(ctx, 0, 3.3, 24, 58, 6.6, 1.2, hullWall);
  addSolidBox(ctx, 0, 3.3, -94, 58, 6.6, 1.2, hullWall);
  addSolidBox(ctx, 28, 0.75, -35, 1.2, 1.5, 120, hullWall);
  addSolidBox(ctx, 28, 5.8, -35, 1.2, 1.6, 120, hullWall);

  // Panoramic Viewport Structural Hull Mullions framing Earth
  for (let mz = 16; mz >= -88; mz -= 13) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.2, 0.7), hullWall);
    mullion.position.set(27.7, 3.3, mz);
    scene.add(mullion);
  }
  addStructuralArchRibs(ctx, -27.2, 27.2, [14, -8, -42, -62, -82], 6.6, hullWall);

  // Glass window pane facing Earth
  const spaceWindow = new THREE.Mesh(
    new THREE.PlaneGeometry(118, 3.8),
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      roughness: 0.06,
      metalness: 0.1,
    })
  );
  spaceWindow.rotation.y = -Math.PI / 2;
  spaceWindow.position.set(27.4, 3.3, -35);
  scene.add(spaceWindow);
  ctx.colliders.push({ minX: 27, maxX: 28.5, minY: 0, maxY: 6.6, minZ: -95, maxZ: 25 });

  addWallXWithDoor(ctx, -28, -28, 28, 6.6, 1.0, 0, 6.0, 4.2, hullWall);
  addDynamicDoor(ctx, 'door_l11_airlock', 0, -28, 6.0, 4.2, 0.6, 0x334155, 0x38bdf8);

  // Two Zero-Gravity Sections inside the ruptured orbital rings + Floating Zero-G Cargo Props
  ctx.gravityZones.push(
    { id: 'zg_ring_1', minX: -26, maxX: 26, minZ: -26, maxZ: 2, minY: 0, maxY: 8, gravityScale: 0.24 },
    { id: 'zg_ring_2', minX: -26, maxX: 26, minZ: -86, maxZ: -32, minY: 0, maxY: 8, gravityScale: 0.24 }
  );
  [
    [-12, 3.8, -10],
    [11, 4.2, -16],
    [-14, 4.0, -56],
    [13, 3.6, -70],
  ].forEach(([fx, fy, fz], idx) => {
    const floatCrate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.72, 0.85), hullWall);
    floatCrate.position.set(fx, fy, fz);
    floatCrate.rotation.set(idx * 0.4, idx * 0.7, idx * 0.3);
    scene.add(floatCrate);
    ctx.animatedProps.push({
      kind: 'hoverSpin',
      object: floatCrate,
      speed: 0.35 * (idx % 2 === 0 ? 1 : -1),
      baseY: fy,
      amplitude: 0.45,
      phase: idx * 1.4,
    });
  });

  // Secret Cupola Locker behind destructible airlock panel (x: -28..-11.5, z: -60..-44)
  addSolidBox(ctx, -19.75, 3.3, -44, 16.5, 6.6, 0.8, hullWall);
  addSolidBox(ctx, -19.75, 3.3, -60, 16.5, 6.6, 0.8, hullWall);
  addWallZWithDoor(ctx, -11.5, -60, -44, 6.6, 0.8, -52, 4.0, 2.4, hullWall);
  addSolidBox(ctx, -19.75, 6.8, -52, 16.5, 0.4, 16.5, hullWall);
  addDestructibleBarricade(ctx, 'l11_secret_panel', -11.5, -52, 0.75, 2.4, 4.1, 0x38bdf8);
  addPickup(ctx, 'sec_11_stash', 'secret_cache', 'CLAIM EVA CUPOLA STASH (+2 SALVAGE)', -21, 0.5, -52, 0xf59e0b, {
    secretId: 'sec_11_cupola',
    secretTitle: 'ORBITAL CUPOLA LOCKER',
  });

  addConsoleInteractable(
    ctx,
    'l11_reactor_puzzle',
    'puzzle',
    'RESTART STATION AETHER REACTOR (MATH PUZZLE)',
    0,
    -25.2,
    0x38bdf8,
    { puzzleId: 'puz_11_station', doorId: 'door_l11_airlock' }
  );

  addSaveAndWorkbench(ctx, 'l11', 16, 10, 16, -8);
  addLevelExitGate(ctx, 'l11_exit', 'DROP TO SUBTERRANEAN CHAMBER ZERO (LEVEL 12)', 0, -90, 2);

  addPickup(ctx, 'l11_lore_1', 'lore', 'READ ORBITAL STATION LOG', -5, 0.5, 10, 0x60a5fa, {
    loreId: 'doc_station_aether',
  });
  addPickup(ctx, 'l11_lore_2', 'lore', 'RECOVER DEEP-SPACE INTERFEROMETRY TAPE', 10, 0.5, -48, 0x38bdf8, {
    loreId: 'doc_signal_truth',
  });
  addPickup(ctx, 'l11_lore_3', 'lore', 'PLAY AIRLOCK 04 AUDIO LOG', -4, 0.5, -76, 0xf87171, {
    loreId: 'audio_void_walker',
  });
  addPickup(ctx, 'l11_med_1', 'medkit', 'COLLECT EVA MEDKIT (+35 HP)', -18, 0.35, -14, 0x22c55e);
  addPickup(ctx, 'l11_ammo_1', 'ammo', 'COLLECT ORBITAL AMMO CRATE', 18, 0.35, -42, 0xf59e0b);
  addPickup(ctx, 'l11_bat_1', 'battery', 'COLLECT EVA CELL', 0, 0.35, -66, 0x38bdf8);

  addRoomLighting(ctx, [
    [0, 5.8, 12, 0x38bdf8, false],
    [0, 5.8, -14, 0xef4444, true],
    [0, 5.8, -56, 0x38bdf8, false],
    [0, 5.8, -82, 0x22c55e, false],
  ]);

  ctx.enemySpawns.push(
    { id: 'l11_void_1', type: 'void_walker', position: new THREE.Vector3(-6, 0, -14), patrolTarget: new THREE.Vector3(8, 0, -14), initiallyActive: true },
    { id: 'l11_crawler_1', type: 'crawler', position: new THREE.Vector3(10, 0, -44), patrolTarget: new THREE.Vector3(-8, 0, -44), initiallyActive: true },
    { id: 'l11_void_2', type: 'void_walker', position: new THREE.Vector3(0, 0, -68), patrolTarget: new THREE.Vector3(-10, 0, -56), initiallyActive: true },
    { id: 'l11_sentinel_1', type: 'sentinel', position: new THREE.Vector3(8, 0, -76), patrolTarget: new THREE.Vector3(-8, 0, -76), initiallyActive: true }
  );

  return finalizeLevelWorld(ctx, new THREE.Vector3(0, 0, 19), 0);
}

// ============================================================================
// LEVEL 12 — THE BEGINNING (Alien Subterranean Megastructure + THE ORIGIN + 3 Endings)
// ============================================================================
export function buildLevel12World(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  const ctx = createLevelContext(scene, textures, 0x050106, 0x0c020c, 0.014);

  const obsidianMat = makeTiledMat(ctx, {
    map: textures.alienObsidianMap,
    normalMap: textures.alienObsidianNormal,
    emissiveMap: textures.alienObsidianEmissive,
    repeatX: 16,
    repeatY: 32,
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.62,
    metalness: 0.22,
    roughness: 0.68,
    envMapIntensity: 0.4,
    normalScale: 1.5,
  });
  const obsidianWall = makeTiledMat(ctx, {
    map: textures.alienObsidianMap,
    normalMap: textures.alienObsidianNormal,
    emissiveMap: textures.alienObsidianEmissive,
    repeatX: 8,
    repeatY: 3,
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.58,
    metalness: 0.26,
    roughness: 0.64,
    envMapIntensity: 0.42,
    normalScale: 1.5,
  });
  const alienVein = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 2.0,
    roughness: 0.18,
  });
  const cyanSpire = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.8,
    roughness: 0.18,
  });
  ctx.disposeables.push(alienVein, cyanSpire);
  ctx.animatedProps.push({
    kind: 'pulseEmissive',
    material: alienVein,
    speed: 1.9,
    amplitude: 0.7,
  });

  addStandardFloor(ctx, 78, 136, 0, -39, obsidianMat, 18.0, obsidianWall);
  addPerimeterWalls(ctx, -37, 37, -104, 24, 18.0, obsidianWall);
  addStructuralArchRibs(ctx, -36, 36, [10, -10, -36, -58, -80], 18.0, obsidianWall, alienVein);

  addWallXWithDoor(ctx, -22, -37, 37, 18.0, 1.5, 0, 8.0, 6.2, obsidianWall);
  addDynamicDoor(ctx, 'door_l12_sanctum', 0, -22, 8.0, 6.2, 0.8, 0x1e1b2e, 0xf43f5e);

  // Impossible Floating Geometric Alien Monoliths with Twin Counter-Rotating Energy Rings
  [
    [-18, 6.5, -42],
    [18, 6.5, -42],
    [-20, 7.2, -72],
    [20, 7.2, -72],
  ].forEach(([mx, my, mz], idx) => {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.7, 0.8, 8), obsidianWall);
    pedestal.position.set(mx, 0.4, mz);
    const pillar = new THREE.Mesh(new THREE.OctahedronGeometry(2.6, 0), obsidianWall);
    pillar.scale.set(0.9, 2.2, 0.9);
    pillar.position.set(mx, my, mz);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.14, 8, 24), alienVein);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(mx, 2.2, mz);
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(3.65, 0.08, 8, 24), cyanSpire);
    outerRing.rotation.x = Math.PI / 2.4;
    outerRing.position.set(mx, my, mz);
    scene.add(pedestal, pillar, ring, outerRing);

    ctx.animatedProps.push(
      { kind: 'hoverSpin', object: pillar, speed: 0.45 * (idx % 2 === 0 ? 1 : -1), baseY: my, amplitude: 0.45, phase: idx },
      { kind: 'spinY', object: outerRing, speed: -0.95 * (idx % 2 === 0 ? 1 : -1) }
    );
    ctx.colliders.push({
      minX: mx - 2.1,
      maxX: mx + 2.1,
      minY: 0,
      maxY: 16,
      minZ: mz - 2.1,
      maxZ: mz + 2.1,
    });
  });

  // Monumental Stepped Dais & Vertical Light Beam Framing Master HELIOS Control Spire
  const dais1 = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.2, 0.35, 8), obsidianWall);
  dais1.position.set(0, 0.17, -94);
  const spireBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.45, 17, 10), cyanSpire);
  spireBeam.position.set(0, 9.2, -94);
  scene.add(dais1, spireBeam);
  addVolumetricCone(ctx, 0, 16, -94, 0x38bdf8, 5.5, 15, 0.06);

  // Low-Gravity Anomaly across Central Alien Sanctum
  ctx.gravityZones.push({
    id: 'l12_anomaly',
    minX: -34,
    maxX: 34,
    minZ: -96,
    maxZ: -26,
    minY: 0,
    maxY: 16,
    gravityScale: 0.35,
  });

  // Secret Pre-Human Reliquary (x: -37..-16.5, z: -16..-2)
  addSolidBox(ctx, -26.75, 4.5, -2, 20.5, 9, 0.9, obsidianWall);
  addSolidBox(ctx, -26.75, 4.5, -16, 20.5, 9, 0.9, obsidianWall);
  addWallZWithDoor(ctx, -16.5, -16, -2, 9, 0.9, -9, 4.2, 2.6, obsidianWall);
  addSolidBox(ctx, -26.75, 9.2, -9, 20.5, 0.4, 14.6, obsidianWall);
  addDestructibleBarricade(ctx, 'l12_secret_seal', -16.5, -9, 0.8, 2.6, 4.3, 0xf43f5e);
  addPickup(ctx, 'sec_12_stash', 'secret_cache', 'CLAIM ANCIENT RELIQUARY (+3 SALVAGE)', -27, 0.5, -9, 0xf59e0b, {
    secretId: 'sec_12_vault',
    secretTitle: 'PRE-HUMAN RELIQUARY',
  });

  addConsoleInteractable(
    ctx,
    'l12_spire_puzzle',
    'puzzle',
    'ALIGN CHAMBER ZERO SPIRE KEY (MATH PUZZLE)',
    0,
    -19.2,
    0xf43f5e,
    { puzzleId: 'puz_12_origin', doorId: 'door_l12_sanctum' }
  );

  addConsoleInteractable(
    ctx,
    'l12_helios_spire',
    'ending_console',
    'ACCESS MASTER HELIOS CONTROL SPIRE (FINAL CHOICE)',
    0,
    -94,
    0x38bdf8,
    { stageReq: 2 }
  );

  addSaveAndWorkbench(ctx, 'l12', 18, 10, 18, -6);

  addPickup(ctx, 'l12_lore_1', 'lore', 'READ PRE-HUMAN STRATA LOG', -4, 0.5, 10, 0x60a5fa, {
    loreId: 'doc_origin_chamber',
  });
  addPickup(ctx, 'l12_lore_2', 'lore', 'READ FINAL ANALYSIS: THE ORIGIN', 6, 0.5, -10, 0x60a5fa, {
    loreId: 'doc_origin_boss',
  });
  addPickup(ctx, 'l12_lore_3', 'lore', 'PLAY LAST TRANSMISSION AUDIO', 0, 0.5, -34, 0xf87171, {
    loreId: 'audio_final_choice',
  });
  addPickup(ctx, 'l12_med_1', 'medkit', 'COLLECT TRAUMA KIT (+35 HP)', -24, 0.35, -52, 0x22c55e);
  addPickup(ctx, 'l12_med_2', 'medkit', 'COLLECT TRAUMA KIT (+35 HP)', 24, 0.35, -52, 0x22c55e);
  addPickup(ctx, 'l12_ammo_1', 'ammo', 'COLLECT HEAVY AMMO CRATE', -24, 0.35, -78, 0xf59e0b);
  addPickup(ctx, 'l12_ammo_2', 'ammo', 'COLLECT HEAVY AMMO CRATE', 24, 0.35, -78, 0xf59e0b);

  addRoomLighting(ctx, [
    [0, 12, 10, 0xf43f5e, true],
    [0, 13, -50, 0xef4444, true],
    [0, 14, -84, 0x38bdf8, false],
  ]);

  ctx.enemySpawns.push(
    { id: 'l12_void_guard', type: 'void_walker', position: new THREE.Vector3(-6, 0, -4), patrolTarget: new THREE.Vector3(6, 0, -12), initiallyActive: true },
    { id: 'l12_boss_origin', type: 'origin', position: new THREE.Vector3(0, 0, -68), patrolTarget: new THREE.Vector3(0, 0, -44), initiallyActive: true, isBoss: true }
  );

  // Black & Blood-Red Alien Fungus — deep ancient subterranean Chamber Zero crevices (absent in orbital/clean levels 09-11)
  addAlienFungusColonies(
    ctx,
    [
      { id: 'l12_fungus_wall_w', kind: 'spreading', x: -36.3, y: 2.3, z: -30.0, mount: 'wall_x_pos', scale: 1.15, seed: 1201 },
      { id: 'l12_fungus_wall_e', kind: 'spreading', x: 36.3, y: 2.5, z: -64.0, mount: 'wall_x_neg', scale: 1.15, seed: 1202 },
      { id: 'l12_fungus_mature_w', kind: 'mature', x: -28.0, y: 0.01, z: -72.0, scale: 1.25, substrate: 'meteor_rock', seed: 1203 },
      { id: 'l12_fungus_mature_e', kind: 'mature', x: 28.0, y: 0.01, z: -40.0, scale: 1.2, substrate: 'meteor_rock', seed: 1204 },
    ],
    1212
  );

  return finalizeLevelWorld(ctx, new THREE.Vector3(0, 0, 19), 0, new THREE.Vector3(0, 0, -62));
}
