import * as THREE from 'three';
import { AlienFungusSystem, buildAlienFungusSystem } from './alienFungus';
import { SimpleFireHeatZone } from './animation';
import { FireEmitterDef, SparkEmitterDef } from './fireSystem';
import {
  addRotatedBoxCollider,
  buildClimbingVines,
  buildDetailedStorefront,
  buildHoloAdPylon,
  buildInstancedGrassTufts,
  buildMeteorCrater,
  buildRoadsideTree,
} from './levels/levelShared';
import { buildEnemyModel, EnemyModelRefs } from './models';
import { cloneTiledTexture, ProceduralTextureSet } from './textures';
import { EnemyType, EndingId, GravityZone, RadiationZone, SurfaceKind, WaterSectionState } from './types';

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  tag?: string;
}

export interface SurfaceZone {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  surface: SurfaceKind;
}

export interface RampZone {
  id?: string;
  kind?: 'ramp' | 'stairs' | 'escalator' | 'platform';
  axis?: 'z' | 'x';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  zStart: number;
  zEnd: number;
  xStart?: number;
  xEnd?: number;
  yStart: number;
  yEnd: number;
  stepCount?: number;
  /** Signed belt travel speed in m/s along ramp direction (positive = yStart->yEnd, negative = yEnd->yStart, 0 = stopped). */
  escalatorSpeed?: number;
  broken?: boolean;
  floorLevel?: number;
}

export interface DestructibleBarricade {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  colliderIndex: number;
  destroyed: boolean;
  kind?: 'barricade' | 'crate' | 'glass' | 'weak_door';
  health?: number;
  maxHealth?: number;
  minStrength?: number;
}

export type InteractableKind =
  | 'apc_hatch'
  | 'generator'
  | 'gate_panel'
  | 'terminal'
  | 'keycard'
  | 'medkit'
  | 'ammo'
  | 'battery'
  | 'lore'
  | 'comm_relay'
  | 'locked_container'
  | 'final_recording'
  | 'puzzle'
  | 'save_point'
  | 'workbench'
  | 'secret_cache'
  | 'level_exit'
  | 'vent_valve'
  | 'research_drive'
  | 'transport_console'
  | 'hazard_switch'
  | 'pump_switch'
  | 'ending_console'
  | 'educational_scan';

export interface InteractableObject {
  id: string;
  kind: InteractableKind;
  label: string;
  position: THREE.Vector3;
  radius: number;
  mesh: THREE.Object3D;
  consumed: boolean;
  loreId?: string;
  puzzleId?: string;
  educationId?: string;
  scannedOnce?: boolean;
  secretId?: string;
  secretTitle?: string;
  endingId?: EndingId;
  waterSectionId?: string;
  doorId?: string;
  stageReq?: number;
  highlightRing?: THREE.Mesh;
  hasTheBook?: boolean;
  bookCollected?: boolean;
}

export interface EnemySpawnDef {
  id: string;
  type: EnemyType;
  position: THREE.Vector3;
  patrolTarget: THREE.Vector3;
  initiallyActive: boolean;
  ambushTag?: string;
  isBoss?: boolean;
}

export interface DestructibleFireEvent {
  id: string;
  kind: 'falling_sign' | 'fuel_wreck';
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  triggered: boolean;
  fallProgress: number;
  emitterIndex?: number;
}

export interface WaterSectionRuntime {
  state: WaterSectionState;
  mesh: THREE.Mesh;
}

export interface DynamicDoorRuntime {
  id: string;
  mesh: THREE.Object3D;
  colliderIndex: number;
  openOffsetY: number;
  opened: boolean;
  currentOffsetY: number;
}

export interface SecretZoneDef {
  id: string;
  title: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  salvageReward: number;
  found?: boolean;
}

export interface AnimatedWorldProp {
  kind: 'spinY' | 'hoverSpin' | 'bobY' | 'uvScroll' | 'pulseEmissive';
  object?: THREE.Object3D;
  texture?: THREE.Texture;
  material?: THREE.MeshStandardMaterial;
  speed: number;
  speed2?: number;
  baseY?: number;
  amplitude?: number;
  phase?: number;
}

export interface BuiltWorld {
  colliders: ColliderBox[];
  ramps: RampZone[];
  interactables: InteractableObject[];
  enemySpawns: EnemySpawnDef[];
  destructibleBarricades: DestructibleBarricade[];
  apcHatchDoor?: THREE.Object3D;
  apcDoorLeft?: THREE.Object3D;
  apcDoorRight?: THREE.Object3D;
  checkpointGateLeft?: THREE.Object3D;
  checkpointGateRight?: THREE.Object3D;
  gateColliderIndex?: number;
  apcColliderIndex?: number;
  powerCableMesh?: THREE.Mesh;
  flickerLights: { light: THREE.PointLight; base: number; speed: number }[];
  distantTitan?: EnemyModelRefs;
  horizonColossus?: THREE.Group;
  horizonColossusRefs?: EnemyModelRefs;
  smokePoints?: THREE.Points;
  fireEmitters: FireEmitterDef[];
  sparkEmitters: SparkEmitterDef[];
  fireHazardZones: SimpleFireHeatZone[];
  destructibleFireEvents?: DestructibleFireEvent[];
  waterSections?: WaterSectionRuntime[];
  gravityZones?: GravityZone[];
  dynamicDoors?: DynamicDoorRuntime[];
  secretZones?: SecretZoneDef[];
  surfaceZones?: SurfaceZone[];
  radiationZones?: RadiationZone[];
  animatedProps?: AnimatedWorldProp[];
  alienFungus?: AlienFungusSystem;
  onUpdate?: (dt: number, elapsed: number, playerPos: THREE.Vector3) => void;
  spawnPosition?: THREE.Vector3;
  spawnYaw?: number;
  bossAreaCenter?: THREE.Vector3;
  disposeables: { dispose: () => void }[];
}

export interface SkyscraperMaterials {
  facadeMat: THREE.MeshStandardMaterial;
  lobbyMat: THREE.MeshStandardMaterial;
  concreteMat: THREE.MeshStandardMaterial;
  steelMat: THREE.MeshStandardMaterial;
  fleshMat: THREE.MeshPhysicalMaterial;
  beaconMat: THREE.MeshBasicMaterial;
  charredMat: THREE.MeshStandardMaterial;
  emberCoreMat: THREE.MeshStandardMaterial;
}

export function createSkyscraperMaterials(textures: ProceduralTextureSet): SkyscraperMaterials {
  return {
    facadeMat: new THREE.MeshStandardMaterial({
      map: textures.skyscraperMap,
      normalMap: textures.skyscraperNormal,
      normalScale: new THREE.Vector2(1.85, 1.85),
      roughnessMap: textures.skyscraperRoughness,
      emissive: 0xffffff,
      emissiveMap: textures.skyscraperEmissive,
      emissiveIntensity: 0.46,
      roughness: 0.78,
      metalness: 0.36,
    }),
    lobbyMat: new THREE.MeshStandardMaterial({
      color: 0x0b1018,
      normalMap: textures.metalNormal,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.24,
      metalness: 0.28,
      envMapIntensity: 0.65,
    }),
    concreteMat: new THREE.MeshStandardMaterial({
      color: 0x2b303a,
      map: textures.concreteMap,
      normalMap: textures.concreteNormal,
      normalScale: new THREE.Vector2(1.45, 1.45),
      roughnessMap: textures.concreteRoughness,
      roughness: 0.94,
      metalness: 0.02,
      envMapIntensity: 0.24,
    }),
    steelMat: new THREE.MeshStandardMaterial({
      color: 0x232934,
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      normalScale: new THREE.Vector2(1.25, 1.25),
      metalnessMap: textures.metalMetalness,
      roughnessMap: textures.metalRoughness,
      metalness: 0.72,
      roughness: 0.52,
      envMapIntensity: 0.5,
    }),
    fleshMat: new THREE.MeshPhysicalMaterial({
      color: 0x6b121d,
      map: textures.infectedFleshMap,
      normalMap: textures.infectedFleshNormal,
      normalScale: new THREE.Vector2(1.6, 1.6),
      emissive: 0x991b1b,
      emissiveMap: textures.infectedEmissiveMap,
      emissiveIntensity: 1.35,
      roughness: 0.4,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
    }),
    beaconMat: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
    charredMat: new THREE.MeshStandardMaterial({
      color: 0x110c0a,
      roughness: 0.96,
      metalness: 0.02,
      envMapIntensity: 0.14,
    }),
    emberCoreMat: new THREE.MeshStandardMaterial({
      color: 0x2b0a03,
      emissive: 0xff5a14,
      emissiveIntensity: 1.75,
      roughness: 0.85,
    }),
  };
}

/**
 * Constructs a multi-part ruined futuristic brutalist skyscraper with an open-colonnade
 * ground lobby, recessed curtain-wall shaft, hollowed structural floor breaches,
 * protruding concrete pilasters + horizontal spandrel ledges, exterior diagonal trusses,
 * rooftop mechanical tanks/HVAC/rebar, comm spires, biomechanical hives, and optional
 * multi-floor internal fire breaches & flickering orange lighting.
 */
export function buildRealisticSkyscraper(
  mats: SkyscraperMaterials,
  bw: number,
  bh: number,
  bd: number,
  seed: number,
  infected: boolean,
  fireOptions?: {
    burning: boolean;
    worldX: number;
    worldY: number;
    worldZ: number;
    facingSignX: number;
    fireEmitters: FireEmitterDef[];
    scene?: THREE.Scene;
    withLight?: boolean;
  }
): THREE.Group {
  const bGroup = new THREE.Group();
  const hasShadow = bh < 68;

  // 1. Open Street-Level Colonnade Lobby (Recessed Smoked-Glass Core + Steel Mullions + Structural Columns)
  const podiumH = Math.min(7.8, bh * 0.17);
  const lobbyCore = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.78, podiumH, bd * 0.78),
    mats.lobbyMat
  );
  lobbyCore.position.y = podiumH / 2;
  lobbyCore.receiveShadow = true;
  bGroup.add(lobbyCore);

  // Double-height lobby steel window mullions
  const mullionGeo = new THREE.BoxGeometry(0.18, podiumH, bd * 0.8);
  [-bw * 0.22, 0, bw * 0.22].forEach((mx) => {
    const m = new THREE.Mesh(mullionGeo, mats.steelMat);
    m.position.set(mx, podiumH / 2, 0);
    bGroup.add(m);
  });
  const mullionZGeo = new THREE.BoxGeometry(bw * 0.8, podiumH, 0.18);
  [-bd * 0.22, 0, bd * 0.22].forEach((mz) => {
    const m = new THREE.Mesh(mullionZGeo, mats.steelMat);
    m.position.set(0, podiumH / 2, mz);
    bGroup.add(m);
  });

  // 8 Free-standing brutalist structural lobby columns around perimeter
  const colW = Math.max(0.85, bw * 0.085);
  const colGeo = new THREE.BoxGeometry(colW, podiumH + 0.3, colW);
  [
    [-bw * 0.49, -bd * 0.49],
    [0, -bd * 0.49],
    [bw * 0.49, -bd * 0.49],
    [-bw * 0.49, 0],
    [bw * 0.49, 0],
    [-bw * 0.49, bd * 0.49],
    [0, bd * 0.49],
    [bw * 0.49, bd * 0.49],
  ].forEach(([cx, cz]) => {
    const col = new THREE.Mesh(colGeo, mats.concreteMat);
    col.position.set(cx, podiumH / 2, cz);
    bGroup.add(col);
  });

  // Subtle emergency exit/lobby lintel strip
  const lobbyStrip = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.28, 0.14, bd * 0.81),
    mats.beaconMat
  );
  lobbyStrip.position.y = podiumH * 0.56;
  bGroup.add(lobbyStrip);

  // Broken structural canopy overhang + protruding steel girders
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.14, 0.65, bd * 1.14), mats.concreteMat);
  canopy.position.y = podiumH + 0.25;
  canopy.rotation.z = ((seed % 3) - 1) * 0.03;
  bGroup.add(canopy);

  const canopyTrim = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.18, 0.25, bd * 1.18), mats.steelMat);
  canopyTrim.position.y = podiumH + 0.55;
  canopyTrim.rotation.z = canopy.rotation.z;
  bGroup.add(canopyTrim);

  // 2. Main Recessed Curtain-Wall Shaft with Hollowed Breach Gap
  const mainH = bh * 0.78;
  const breachY = podiumH + mainH * 0.44;
  const lowerShaftH = mainH * 0.4;
  const upperShaftH = mainH * 0.48;

  const lowerShaft = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.92, lowerShaftH, bd * 0.92),
    mats.facadeMat
  );
  lowerShaft.position.y = podiumH + lowerShaftH / 2;
  lowerShaft.castShadow = hasShadow;
  lowerShaft.receiveShadow = true;
  bGroup.add(lowerShaft);

  const upperShaft = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.92, upperShaftH, bd * 0.92),
    mats.facadeMat
  );
  upperShaft.position.y = breachY + mainH * 0.1 + upperShaftH / 2;
  upperShaft.castShadow = hasShadow;
  upperShaft.receiveShadow = true;
  bGroup.add(upperShaft);

  // Hollowed Structural Breach Zone (Recessed Interior Core + Tilted Broken Floor Slab + Emergency Glow)
  const breachCore = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.7, mainH * 0.13, bd * 0.7),
    mats.concreteMat
  );
  breachCore.position.y = breachY + mainH * 0.04;
  const collapsedSlab = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.96, 0.55, bd * 0.96),
    mats.concreteMat
  );
  collapsedSlab.position.set((seed % 2 === 0 ? 1 : -1) * 0.4, breachY, 0.2);
  collapsedSlab.rotation.z = (seed % 2 === 0 ? 1 : -1) * 0.09;
  const breachBeacon = new THREE.Mesh(
    new THREE.BoxGeometry(bw * 0.76, 0.18, bd * 0.76),
    mats.beaconMat
  );
  breachBeacon.position.y = breachY + mainH * 0.08;
  bGroup.add(breachCore, collapsedSlab, breachBeacon);

  // 3. Protruding Vertical Concrete Corner Piers, Center Pilasters & Steel Mullions
  const pierW = bw * 0.11;
  const pierD = bd * 0.11;
  const pierGeo = new THREE.BoxGeometry(pierW, mainH + 1.5, pierD);
  [
    [-bw * 0.47, -bd * 0.47],
    [bw * 0.47, -bd * 0.47],
    [-bw * 0.47, bd * 0.47],
    [bw * 0.47, bd * 0.47],
    [0, bd * 0.48],
    [0, -bd * 0.48],
    [-bw * 0.48, 0],
    [bw * 0.48, 0],
  ].forEach(([px, pz]) => {
    const pier = new THREE.Mesh(pierGeo, mats.concreteMat);
    pier.position.set(px, podiumH + mainH / 2 - 0.2, pz);
    bGroup.add(pier);
  });

  // Diagonal Exterior Steel Seismic X-Truss along lower shaft facade
  [-1, 1].forEach((dir) => {
    const trussLen = Math.hypot(bw * 0.88, lowerShaftH * 0.85);
    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.32, trussLen, 0.32), mats.steelMat);
    truss.position.set(0, podiumH + lowerShaftH * 0.48, bd * 0.485);
    truss.rotation.z = dir * Math.atan2(bw * 0.88, lowerShaftH * 0.85);
    const trussBack = truss.clone();
    trussBack.position.z = -bd * 0.485;
    bGroup.add(truss, trussBack);
  });

  // 4. Horizontal Structural Floor Slab Spandrel Ledges (3D Relief Rings)
  const corniceCount = 6;
  for (let c = 1; c <= corniceCount; c++) {
    const cy = podiumH + (mainH * c) / (corniceCount + 0.5);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.03, 0.58, bd * 1.03), mats.concreteMat);
    slab.position.y = cy;
    bGroup.add(slab);
  }

  // 5. Stepped Upper Setback + Jagged Ruined Roof Parapet & Protruding Steel Rebar
  const topY = podiumH + mainH - 0.5;
  const setbackH = bh * 0.2;
  const setback = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.68, setbackH, bd * 0.68), mats.facadeMat);
  setback.position.set((seed % 2 === 0 ? 1 : -1) * bw * 0.08, topY + setbackH / 2, 0);
  setback.castShadow = hasShadow;
  bGroup.add(setback);

  // Collapsed diagonal concrete parapet + jagged roof corner chunks
  const brokenRoof = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.58, 1.5, bd * 0.52), mats.concreteMat);
  brokenRoof.position.set((seed % 2 === 0 ? -1 : 1) * bw * 0.16, topY + 0.65, bd * 0.1);
  brokenRoof.rotation.z = (seed % 2 === 0 ? 1 : -1) * 0.3;
  brokenRoof.rotation.x = 0.16;
  bGroup.add(brokenRoof);

  // Rooftop HVAC mechanical chiller + cylindrical industrial coolant tank + bent I-beams
  const hvac = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.26, 2.2, bd * 0.26), mats.steelMat);
  hvac.position.set(-bw * 0.15, topY + setbackH + 1.0, -bd * 0.1);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(bw * 0.1, bw * 0.1, 2.8, 10), mats.steelMat);
  tank.position.set(bw * 0.18, topY + setbackH + 1.3, bd * 0.12);
  bGroup.add(hvac, tank);

  for (let r = 0; r < 5; r++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.4 + (r % 2) * 1.8, 0.24), mats.steelMat);
    beam.position.set(
      ((r - 2) * bw) * 0.18,
      topY + setbackH + 1.4,
      ((r % 2) - 0.5) * bd * 0.34
    );
    beam.rotation.z = ((r % 3) - 1) * 0.36;
    beam.rotation.x = ((r % 2) - 0.5) * 0.28;
    bGroup.add(beam);
  }

  // Tall Communication Antenna Lattice + Aviation Beacon
  if (bh >= 44) {
    const spireH = 9 + (seed % 5);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.38, spireH, 6), mats.steelMat);
    spire.position.set(0, topY + setbackH + spireH / 2, 0);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), mats.beaconMat);
    beacon.position.set(0, topY + setbackH + spireH + 0.2, 0);
    bGroup.add(spire, beacon);
  }

  // 6. Biomechanical Alien Infection Growths & Spore Hives Climbing & Splitting the Facade
  if (infected) {
    const side = seed % 2 === 0 ? 1 : -1;
    const faceX = side * (bw * 0.49);
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(faceX, 0.4, bd * 0.38),
      new THREE.Vector3(faceX + side * 0.42, bh * 0.22, bd * 0.1),
      new THREE.Vector3(faceX + side * 0.24, bh * 0.48, -bd * 0.22),
      new THREE.Vector3(faceX + side * 0.48, bh * 0.72, bd * 0.18),
    ]);
    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(faceX, podiumH * 0.8, -bd * 0.3),
      new THREE.Vector3(faceX + side * 0.32, bh * 0.34, bd * 0.08),
      new THREE.Vector3(faceX + side * 0.15, bh * 0.55, bd * 0.34),
    ]);
    const vine1 = new THREE.Mesh(new THREE.TubeGeometry(curve1, 16, 0.46, 6, false), mats.fleshMat);
    const vine2 = new THREE.Mesh(new THREE.TubeGeometry(curve2, 14, 0.32, 6, false), mats.fleshMat);
    bGroup.add(vine1, vine2);

    const sporeGeo = new THREE.IcosahedronGeometry(1.55, 1);
    const spPos = sporeGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < spPos.count; i++) {
      const n = 1 + Math.sin(i * 1.9 + seed) * 0.22;
      spPos.setXYZ(i, spPos.getX(i) * n, spPos.getY(i) * n, spPos.getZ(i) * n);
    }
    sporeGeo.computeVertexNormals();
    const spore = new THREE.Mesh(sporeGeo, mats.fleshMat);
    spore.scale.set(0.85, 1.45, 1.15);
    spore.position.set(faceX + side * 0.32, breachY, bd * 0.14);
    bGroup.add(spore);
  }

  // 7. Multi-Floor Building Fire: Charred Breached Rooms + Internal Ember Cores + Window/Breach/Roof Emitters
  if (fireOptions?.burning) {
    const dirX = fireOptions.facingSignX !== 0 ? fireOptions.facingSignX : seed % 2 === 0 ? 1 : -1;
    const faceX = dirX * (bw * 0.45);
    const windOut = new THREE.Vector3(dirX * 0.85, 0.35, 0.25).normalize();

    // Recessed glowing charred room bays on Floor 2, Mid Breach, and Upper Floor
    const fireFloors = [
      { y: podiumH + lowerShaftH * 0.42, z: (seed % 2 === 0 ? 1 : -1) * bd * 0.16, scale: 1.5, id: 'f2' },
      { y: breachY + 0.5, z: -bd * 0.12, scale: 2.1, id: 'breach' },
      { y: breachY + mainH * 0.1 + upperShaftH * 0.55, z: bd * 0.14, scale: 1.7, id: 'upper' },
    ];

    fireFloors.forEach((ff, fIdx) => {
      // Charred window surround & deep internal burning core box
      const scorchedFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 2.4, 3.2),
        mats.charredMat
      );
      scorchedFrame.position.set(faceX + dirX * 0.08, ff.y, ff.z);
      const interiorFireCore = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 1.95, 2.45),
        mats.emberCoreMat
      );
      interiorFireCore.position.set(faceX - dirX * 0.22, ff.y, ff.z);
      bGroup.add(scorchedFrame, interiorFireCore);

      const emitterWorldPos = new THREE.Vector3(
        fireOptions.worldX + faceX + dirX * 0.15,
        fireOptions.worldY + ff.y,
        fireOptions.worldZ + ff.z
      );

      let light: THREE.PointLight | undefined;
      let baseLightIntensity: number | undefined;
      if (fireOptions.withLight && fireOptions.scene && fIdx === 0) {
        light = new THREE.PointLight(0xff6b1a, 10, 34, 1.55);
        light.position.set(
          emitterWorldPos.x + dirX * 2.2,
          emitterWorldPos.y + 0.4,
          emitterWorldPos.z
        );
        fireOptions.scene.add(light);
        baseLightIntensity = 10;
      }

      fireOptions.fireEmitters.push({
        id: `sky_${seed}_${ff.id}`,
        position: emitterWorldPos,
        directionOut: windOut.clone(),
        scale: ff.scale,
        heatRadius: 4.5,
        intensity: 1.0,
        isStructural: true,
        smokeDensity: 1.15,
        light,
        baseLightIntensity,
      });
    });

    // Collapsed roof / industrial chimney column fire
    const roofFirePos = new THREE.Vector3(
      fireOptions.worldX + dirX * bw * 0.12,
      fireOptions.worldY + topY + setbackH * 0.45,
      fireOptions.worldZ
    );
    fireOptions.fireEmitters.push({
      id: `sky_${seed}_roof`,
      position: roofFirePos,
      directionOut: new THREE.Vector3(0, 1, 0),
      scale: 2.3,
      heatRadius: 5.0,
      intensity: 1.05,
      isStructural: true,
      smokeDensity: 1.35,
    });
  }

  return bGroup;
}

function addBoxCollider(
  colliders: ColliderBox[],
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  tag?: string
): number {
  colliders.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minY: y - h / 2,
    maxY: y + h / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
    tag,
  });
  return colliders.length - 1;
}

function createPickupBeacon(color: number): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.36, 16),
    new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  return ring;
}

export function buildInfectedVehicle(
  textures: ProceduralTextureSet,
  x: number,
  z: number,
  rotY: number,
  infected: boolean
): THREE.Group {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: infected ? 0x2d171c : 0x2a303b,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(1.25, 1.25),
    roughnessMap: textures.metalRoughness,
    metalnessMap: textures.metalMetalness,
    metalness: 0.84,
    roughness: 0.42,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0d1118,
    metalness: 0.72,
    roughness: 0.14,
  });

  // Sculpted beveled sedan/coupe silhouette via ExtrudeGeometry
  const carShape = new THREE.Shape();
  carShape.moveTo(-2.15, 0.32);
  carShape.lineTo(2.15, 0.32);
  carShape.lineTo(2.2, 0.72);
  carShape.lineTo(1.25, 0.88);
  carShape.lineTo(0.55, 1.38);
  carShape.lineTo(-0.85, 1.38);
  carShape.lineTo(-1.55, 0.92);
  carShape.lineTo(-2.15, 0.84);
  carShape.closePath();

  const carBodyGeo = new THREE.ExtrudeGeometry(carShape, {
    depth: 1.88,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  carBodyGeo.center();
  carBodyGeo.rotateY(Math.PI / 2);
  carBodyGeo.computeVertexNormals();
  if (carBodyGeo.index) carBodyGeo.computeTangents();

  const chassis = new THREE.Mesh(carBodyGeo, hullMat);
  chassis.position.y = 0.84;
  chassis.castShadow = true;
  chassis.receiveShadow = true;

  // Raked windshield & side window strips
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.48, 0.82), glassMat);
  windshield.position.set(0, 1.15, 0.82);
  windshield.rotation.x = 0.78;
  g.add(chassis, windshield);

  // Cracked crimson emergency headlights
  const lampMat = new THREE.MeshBasicMaterial({ color: infected ? 0xef4444 : 0x64748b });
  [-0.68, 0.68].forEach((hx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.08), lampMat);
    hl.position.set(hx, 0.68, 2.24);
    g.add(hl);
  });

  [
    [-1.02, 0.36, 1.35],
    [1.02, 0.36, 1.35],
    [-1.02, 0.36, -1.35],
    [1.02, 0.36, -1.35],
  ].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.26, 14),
      new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.9 })
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.28, 8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.3 })
    );
    rim.rotation.z = Math.PI / 2;
    rim.position.set(wx, wy, wz);
    g.add(wheel, rim);
  });

  if (infected) {
    const fleshMat = new THREE.MeshPhysicalMaterial({
      color: 0x6b121b,
      map: textures.infectedFleshMap,
      normalMap: textures.infectedFleshNormal,
      normalScale: new THREE.Vector2(1.5, 1.5),
      roughnessMap: textures.infectedFleshRoughness,
      emissive: 0x991b1b,
      emissiveMap: textures.infectedEmissiveMap,
      emissiveIntensity: 1.3,
      roughness: 0.4,
      clearcoat: 0.88,
      clearcoatRoughness: 0.15,
    });
    const tumorGeo = new THREE.IcosahedronGeometry(0.64, 2);
    const tPos = tumorGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < tPos.count; i++) {
      const s = 1 + Math.sin(i * 1.3) * 0.2;
      tPos.setXYZ(i, tPos.getX(i) * s, tPos.getY(i) * s, tPos.getZ(i) * s);
    }
    tumorGeo.computeVertexNormals();
    const growth = new THREE.Mesh(tumorGeo, fleshMat);
    growth.scale.set(1.25, 0.72, 1.45);
    growth.position.set(0.08, 1.05, 1.25);
    const vein = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.08, 1.05, 1.25),
          new THREE.Vector3(-0.35, 1.5, 0.35),
          new THREE.Vector3(-0.72, 0.88, -0.65),
        ]),
        12,
        0.1,
        6,
        false
      ),
      fleshMat
    );
    const tendril = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.15, 6), fleshMat);
    tendril.position.set(-0.38, 1.55, 1.28);
    tendril.rotation.z = 0.42;
    g.add(growth, vein, tendril);
  }

  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  return g;
}

export function buildMissionOneWorld(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  const colliders: ColliderBox[] = [];
  const ramps: RampZone[] = [];
  const interactables: InteractableObject[] = [];
  const enemySpawns: EnemySpawnDef[] = [];
  const destructibleBarricades: DestructibleBarricade[] = [];
  const flickerLights: { light: THREE.PointLight; base: number; speed: number }[] = [];
  const fireEmitters: FireEmitterDef[] = [];
  const sparkEmitters: SparkEmitterDef[] = [];
  const fireHazardZones: SimpleFireHeatZone[] = [];
  const destructibleFireEvents: DestructibleFireEvent[] = [];
  const m1Disposeables: { dispose: () => void }[] = [];

  scene.background = new THREE.Color(0x050609);
  scene.fog = new THREE.FogExp2(0x07090e, 0.02);

  const hemi = new THREE.HemisphereLight(0x364966, 0x160a0d, 0.34);
  scene.add(hemi);

  const moonKey = new THREE.DirectionalLight(0x88a4cc, 0.55);
  moonKey.position.set(28, 46, 22);
  moonKey.castShadow = true;
  moonKey.shadow.mapSize.set(2048, 2048);
  moonKey.shadow.camera.near = 2;
  moonKey.shadow.camera.far = 140;
  moonKey.shadow.camera.left = -45;
  moonKey.shadow.camera.right = 45;
  moonKey.shadow.camera.top = 45;
  moonKey.shadow.camera.bottom = -45;
  moonKey.shadow.bias = -0.0004;
  moonKey.shadow.normalBias = 0.02;
  scene.add(moonKey);

  const horizonRim = new THREE.DirectionalLight(0xef4444, 0.16);
  horizonRim.position.set(-22, 16, -65);
  scene.add(horizonRim);

  // Extended Horizon Ground
  const outerGround = new THREE.Mesh(
    new THREE.PlaneGeometry(380, 380),
    new THREE.MeshStandardMaterial({ color: 0x090b0f, roughness: 0.97, metalness: 0.0, envMapIntensity: 0.15 })
  );
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.05;
  scene.add(outerGround);

  // Main Asphalt Street with Rough Matte Dry Aggregate + Subtle Localized Damp Puddles
  const roadMat = new THREE.MeshStandardMaterial({
    map: cloneTiledTexture(textures.asphaltMap, 10, 30, m1Disposeables),
    normalMap: cloneTiledTexture(textures.asphaltNormal, 10, 30, m1Disposeables),
    normalScale: new THREE.Vector2(1.45, 1.45),
    roughnessMap: cloneTiledTexture(textures.asphaltRoughness, 10, 30, m1Disposeables),
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.34,
  });
  m1Disposeables.push(roadMat);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(54, 170), roadMat);
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0, -32);
  street.receiveShadow = true;
  scene.add(street);

  // Faded Yellow Highway Center Dashes
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x8a6d1c, roughness: 0.92, metalness: 0.02, envMapIntensity: 0.2 });
  for (let dz = 30; dz >= -88; dz -= 7.5) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 3.2), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.012, dz);
    scene.add(dash);
  }

  // Crash Skid & Scorch Decal behind the APC + blood/scorch storytelling
  const scorchMat = new THREE.MeshBasicMaterial({
    map: textures.scorchDecalMap,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    opacity: 0.9,
  });
  const bloodMat = new THREE.MeshBasicMaterial({
    map: textures.bloodDecalMap,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    opacity: 0.78,
  });
  const apcScorch = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 15), scorchMat);
  apcScorch.rotation.x = -Math.PI / 2;
  apcScorch.position.set(0, 0.015, 36.5);
  scene.add(apcScorch);
  [
    [-8.5, -36, 5.2, scorchMat],
    [4.5, 18, 4.0, bloodMat],
    [-6.0, -56, 4.5, bloodMat],
    [0, -70, 6.5, scorchMat],
  ].forEach(([dx, dz, sz, mat]) => {
    const dec = new THREE.Mesh(new THREE.PlaneGeometry(sz as number, sz as number), mat as THREE.Material);
    dec.rotation.x = -Math.PI / 2;
    dec.rotation.z = (dx as number) * 0.2;
    dec.position.set(dx as number, 0.016, dz as number);
    scene.add(dec);
  });

  // Sidewalks & Granite Curbs
  const concMat = new THREE.MeshStandardMaterial({
    map: cloneTiledTexture(textures.concreteMap, 3, 28, m1Disposeables),
    normalMap: cloneTiledTexture(textures.concreteNormal, 3, 28, m1Disposeables),
    normalScale: new THREE.Vector2(1.35, 1.35),
    roughnessMap: cloneTiledTexture(textures.concreteRoughness, 3, 28, m1Disposeables),
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.22,
  });
  m1Disposeables.push(concMat);
  [-20, 20].forEach((sx) => {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 165), concMat);
    walk.position.set(sx, 0.1, -32);
    walk.receiveShadow = true;
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.24, 165), concMat);
    curb.position.set(sx > 0 ? 12.8 : -12.8, 0.12, -32);
    curb.receiveShadow = true;
    scene.add(walk, curb);
  });

  // Elevated Military Catwalk + Walkable Ramp
  const catwalk = new THREE.Mesh(new THREE.BoxGeometry(8, 0.35, 10), concMat);
  catwalk.position.set(-16, 1.5, -22);
  catwalk.castShadow = true;
  catwalk.receiveShadow = true;
  scene.add(catwalk);

  const rampMesh = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 6.2), concMat);
  rampMesh.position.set(-16, 0.78, -14.1);
  rampMesh.rotation.x = -0.25;
  rampMesh.castShadow = true;
  rampMesh.receiveShadow = true;
  scene.add(rampMesh);

  ramps.push({
    id: 'm01_catwalk_ramp',
    kind: 'ramp',
    minX: -17.8,
    maxX: -14.2,
    minZ: -17.2,
    maxZ: -11.0,
    zStart: -11.0,
    zEnd: -17.2,
    yStart: 0.15,
    yEnd: 1.68,
  });
  ramps.push({
    id: 'm01_catwalk_deck',
    kind: 'platform',
    floorLevel: 1,
    minX: -20.0,
    maxX: -12.0,
    minZ: -27.0,
    maxZ: -17.2,
    zStart: -17.2,
    zEnd: -27.0,
    yStart: 1.68,
    yEnd: 1.68,
  });
  colliders.push({
    minX: -20.0,
    maxX: -12.0,
    minY: 0,
    maxY: 1.5,
    minZ: -27.0,
    maxZ: -17.3,
    tag: 'catwalk_under_deck',
  });
  // Sidewalk top-surface height zones (registered after catwalk/ramp so catwalk takes precedence)
  ramps.push(
    {
      id: 'm01_sidewalk_w',
      kind: 'platform',
      floorLevel: 0,
      minX: -26.5,
      maxX: -12.6,
      minZ: -95,
      maxZ: 48,
      zStart: 0,
      zEnd: 0,
      yStart: 0.2,
      yEnd: 0.2,
    },
    {
      id: 'm01_sidewalk_e',
      kind: 'platform',
      floorLevel: 0,
      minX: 12.6,
      maxX: 26.5,
      minZ: -95,
      maxZ: 48,
      zStart: 0,
      zEnd: 0,
      yStart: 0.2,
      yEnd: 0.2,
    }
  );

  // Perimeter Boundary Colliders (East wall meets burning ruin north/south walls seamlessly at z=4.0 and z=12.0)
  addBoxCollider(colliders, -25.5, 4, -32, 2, 10, 165);
  addBoxCollider(colliders, 25.5, 4, -45.5, 2, 10, 99);
  addBoxCollider(colliders, 25.5, 4, 30.5, 2, 10, 37);
  addBoxCollider(colliders, 0, 4, 48, 56, 10, 2);
  addBoxCollider(colliders, 0, 4, -95, 56, 10, 2);

  // Photorealistic Ruined Brutalist Skyscrapers Flanking the Avenue (with real Multi-Floor Fires!)
  const skyMats = createSkyscraperMaterials(textures);
  const buildingSpecs: [number, number, number, number, number, boolean, boolean, boolean][] = [
    [-34, 22, 18, 42, 20, false, true, true],
    [-35, -8, 20, 56, 22, true, false, false],
    [-34, -44, 18, 48, 22, true, true, true],
    [-36, -80, 22, 64, 24, true, false, false],
    [34, 24, 18, 38, 20, false, false, false],
    [35, -12, 20, 54, 22, false, true, true],
    [34, -48, 18, 44, 20, true, false, false],
    [36, -82, 22, 60, 24, false, true, false],
    [-20, -120, 24, 70, 20, true, true, false],
    [20, -124, 24, 76, 20, false, false, false],
    [0, -140, 32, 84, 22, true, true, false],
  ];
  buildingSpecs.forEach(([bx, bz, bw, bh, bd, inf, burning, withLight], idx) => {
    const facingSignX = bx < 0 ? 1 : bx > 0 ? -1 : 0;
    const skyGroup = buildRealisticSkyscraper(skyMats, bw, bh, bd, idx + 1, inf, {
      burning,
      worldX: bx,
      worldY: -0.1,
      worldZ: bz,
      facingSignX,
      fireEmitters,
      scene,
      withLight,
    });
    skyGroup.position.set(bx, -0.1, bz);
    scene.add(skyGroup);
  });

  // 0B. ENTERABLE BURNING GROUND-FLOOR BUILDING RUIN (East Storefront: x = 16..24, z = 4..12)
  const ruinGroup = new THREE.Group();
  const burntWallMat = new THREE.MeshStandardMaterial({
    color: 0x1a1514,
    map: textures.concreteMap,
    normalMap: textures.concreteNormal,
    normalScale: new THREE.Vector2(1.4, 1.4),
    roughness: 0.92,
  });
  const ruinBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.2, 8.4), burntWallMat);
  ruinBack.position.set(24.0, 2.1, 8.0);
  const ruinNorth = new THREE.Mesh(new THREE.BoxGeometry(9.0, 4.2, 0.55), burntWallMat);
  ruinNorth.position.set(20.5, 2.1, 3.8);
  const ruinSouth = new THREE.Mesh(new THREE.BoxGeometry(9.0, 4.2, 0.55), burntWallMat);
  ruinSouth.position.set(20.5, 2.1, 12.2);
  const ruinFrontN = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.2, 2.5), burntWallMat);
  ruinFrontN.position.set(16.1, 2.1, 5.05);
  const ruinFrontS = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.2, 2.5), burntWallMat);
  ruinFrontS.position.set(16.1, 2.1, 10.95);
  const ruinLintel = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.25, 3.6), skyMats.charredMat);
  ruinLintel.position.set(16.1, 3.55, 8.0);
  const ruinRoof = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.4, 8.6), burntWallMat);
  ruinRoof.position.set(20.3, 4.15, 8.0);
  // Charred interior furniture & fallen roof beam
  const fallenBeam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 5.4), skyMats.charredMat);
  fallenBeam.position.set(21.4, 1.55, 5.4);
  fallenBeam.rotation.x = 0.58;
  fallenBeam.rotation.z = 0.28;
  const burntDesk = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 2.1), skyMats.charredMat);
  burntDesk.position.set(22.4, 0.45, 9.6);
  burntDesk.rotation.y = 0.25;
  const breakerPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 1.15, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.78, roughness: 0.35 })
  );
  breakerPanel.position.set(23.55, 1.65, 10.4);

  // 3059 AD Café / Clinic Shelter storytelling props (toppled table, upturned chair, medical cot frame)
  const cafeTable = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 12), skyMats.steelMat);
  cafeTable.position.set(19.0, 0.48, 10.6);
  cafeTable.rotation.z = 0.65;
  const chairA = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.45), burntWallMat);
  chairA.position.set(18.1, 0.28, 10.8);
  chairA.rotation.x = 1.25;
  const cotFrame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.24, 0.88), skyMats.steelMat);
  cotFrame.position.set(22.2, 0.36, 7.2);

  ruinGroup.add(
    ruinBack,
    ruinNorth,
    ruinSouth,
    ruinFrontN,
    ruinFrontS,
    ruinLintel,
    ruinRoof,
    fallenBeam,
    burntDesk,
    breakerPanel,
    cafeTable,
    chairA,
    cotFrame
  );
  scene.add(ruinGroup);

  addBoxCollider(colliders, 24.0, 2.1, 8.0, 0.8, 4.2, 8.4);
  addBoxCollider(colliders, 20.5, 2.1, 3.8, 9.0, 4.2, 0.7);
  addBoxCollider(colliders, 20.5, 2.1, 12.2, 9.0, 4.2, 0.7);
  addBoxCollider(colliders, 16.1, 2.1, 5.05, 0.7, 4.2, 2.5);
  addBoxCollider(colliders, 16.1, 2.1, 10.95, 0.7, 4.2, 2.5);
  addBoxCollider(colliders, 16.1, 3.55, 8.0, 0.7, 1.25, 3.6, 'ruin_lintel');
  addBoxCollider(colliders, 22.4, 0.5, 9.6, 1.2, 0.9, 2.1, 'ruin_desk');
  addBoxCollider(colliders, 22.2, 0.38, 7.2, 1.85, 0.45, 0.9, 'ruin_cot');
  addBoxCollider(colliders, 19.0, 0.48, 10.6, 1.0, 0.75, 1.0, 'ruin_cafe_table');

  const ruinFireLight = new THREE.PointLight(0xff6b1a, 8, 16, 1.7);
  ruinFireLight.position.set(21.4, 2.0, 5.4);
  scene.add(ruinFireLight);
  fireEmitters.push({
    id: 'interior_ruin_fire',
    position: new THREE.Vector3(21.4, 0.35, 5.4),
    directionOut: new THREE.Vector3(-0.35, 1, 0.1).normalize(),
    scale: 1.05,
    heatRadius: 3.1,
    intensity: 0.95,
    isStructural: false,
    smokeDensity: 0.85,
    light: ruinFireLight,
    baseLightIntensity: 8,
  });
  sparkEmitters.push({
    position: new THREE.Vector3(23.4, 1.65, 10.4),
    interval: 1.35,
    timer: 0.4,
  });

  // Hanging Burning Storefront Sign (Controlled Destruction Event #1)
  const fallingSign = new THREE.Group();
  const signPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.1, 3.4), skyMats.steelMat);
  const signNeon = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.36, 2.8),
    new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.9,
    })
  );
  fallingSign.add(signPlate, signNeon);
  fallingSign.position.set(15.65, 4.35, 8.0);
  fallingSign.rotation.x = 0.18;
  scene.add(fallingSign);
  destructibleFireEvents.push({
    id: 'event_falling_sign',
    kind: 'falling_sign',
    mesh: fallingSign,
    position: new THREE.Vector3(15.65, 4.35, 8.0),
    triggered: false,
    fallProgress: 0,
  });

  // Interior Emergency Medkit & Lore Note inside Burning Ruin
  const ruinMed = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.24, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.55 })
  );
  ruinMed.position.set(22.3, 1.02, 9.5);
  const ruinMedRing = createPickupBeacon(0x22c55e);
  ruinMed.add(ruinMedRing);
  scene.add(ruinMed);
  interactables.push({
    id: 'ruin_interior_medkit',
    kind: 'medkit',
    label: 'SALVAGE SHELTER MEDKIT (+35 HP)',
    position: new THREE.Vector3(22.3, 1.02, 9.5),
    radius: 2.6,
    mesh: ruinMed,
    consumed: false,
    highlightRing: ruinMedRing,
  });

  // 1. CRASHED MILITARY APC TRANSPORT
  const apcGroup = new THREE.Group();
  const apcHullMat = new THREE.MeshStandardMaterial({
    color: 0x222730,
    map: textures.metalPlateMap,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(1.2, 1.2),
    roughnessMap: textures.metalRoughness,
    metalnessMap: textures.metalMetalness,
    metalness: 0.84,
    roughness: 0.42,
  });
  const apcInteriorMat = new THREE.MeshStandardMaterial({
    color: 0x15181e,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.78,
    metalness: 0.48,
  });

  const apcFloor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 8.2), apcInteriorMat);
  apcFloor.position.set(0, 0.12, 38);
  const apcRoof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 8.2), apcHullMat);
  apcRoof.position.set(0, 3.0, 38);
  const apcLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.9, 8.2), apcHullMat);
  apcLeft.position.set(-2.05, 1.5, 38);
  const apcRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.9, 8.2), apcHullMat);
  apcRight.position.set(2.05, 1.5, 38);
  const apcBack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.9, 0.3), apcHullMat);
  apcBack.position.set(0, 1.5, 42.0);

  [-1.45, 1.45].forEach((bx) => {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 6.2), apcInteriorMat);
    bench.position.set(bx, 0.45, 38.2);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 6.4, 8), apcHullMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(bx * 0.65, 2.68, 38.2);
    apcGroup.add(bench, rail);
  });
  const strobeDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xef4444, emissiveIntensity: 2.2 })
  );
  strobeDome.position.set(0, 2.86, 37.5);
  [-2.18, 2.18].forEach((wx) => {
    [35.4, 38.0, 40.6].forEach((wz) => {
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 0.42, 14),
        new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.9 })
      );
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wx, 0.62, wz);
      apcGroup.add(tire);
    });
  });
  const turretCupola = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.5, 12), apcHullMat);
  turretCupola.position.set(0, 3.35, 37.2);
  // Interior military tactical radio transceiver mounted on left bulkhead
  const radioHousing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.72), apcHullMat);
  radioHousing.position.set(-1.74, 1.35, 35.6);
  const radioScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.24),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  radioScreen.rotation.y = Math.PI / 2;
  radioScreen.position.set(-1.57, 1.42, 35.6);
  apcGroup.add(radioHousing, radioScreen);

  apcGroup.add(apcFloor, apcRoof, apcLeft, apcRight, apcBack, strobeDome, turretCupola);
  scene.add(apcGroup);

  addBoxCollider(colliders, -2.05, 1.5, 38, 0.4, 3, 8.2);
  addBoxCollider(colliders, 2.05, 1.5, 38, 0.4, 3, 8.2);
  addBoxCollider(colliders, 0, 1.5, 42.0, 4.2, 3, 0.4);

  const hazardMat = new THREE.MeshStandardMaterial({
    map: textures.hazardStripeMap,
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.8, 0.8),
    metalness: 0.58,
    roughness: 0.46,
  });
  const apcHatchDoor = new THREE.Group();
  apcHatchDoor.position.set(0, 1.5, 33.9);

  const apcDoorLeft = new THREE.Group();
  apcDoorLeft.position.set(-1.85, 0, 0);
  const doorLeafL = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.6, 0.28), hazardMat);
  doorLeafL.position.set(0.95, 0, 0);
  const strutL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.34), apcHullMat);
  strutL.position.set(0.95, 0.4, 0);
  apcDoorLeft.add(doorLeafL, strutL);

  const apcDoorRight = new THREE.Group();
  apcDoorRight.position.set(1.85, 0, 0);
  const doorLeafR = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.6, 0.28), hazardMat);
  doorLeafR.position.set(-0.95, 0, 0);
  const strutR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.34), apcHullMat);
  strutR.position.set(-0.95, -0.4, 0);
  apcDoorRight.add(doorLeafR, strutR);

  apcHatchDoor.add(apcDoorLeft, apcDoorRight);
  scene.add(apcHatchDoor);
  const apcColliderIndex = addBoxCollider(colliders, 0, 1.5, 33.9, 3.8, 2.8, 0.5, 'apc_hatch');

  const apcRedLight = new THREE.PointLight(0xef4444, 4.5, 13, 2);
  apcRedLight.position.set(0, 2.6, 37.5);
  scene.add(apcRedLight);
  flickerLights.push({ light: apcRedLight, base: 4.5, speed: 6.5 });

  interactables.push({
    id: 'apc_hatch',
    kind: 'apc_hatch',
    label: 'OPEN APC BREACH HATCH',
    position: new THREE.Vector3(0, 1.85, 33.9),
    radius: 3.8,
    mesh: apcHatchDoor,
    consumed: false,
  });

  const doc1Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.04, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, emissive: 0x334155, emissiveIntensity: 0.5 })
  );
  doc1Mesh.position.set(-1.4, 1.0, 37.8);
  const doc1Ring = createPickupBeacon(0xfbbf24);
  doc1Mesh.add(doc1Ring);
  scene.add(doc1Mesh);
  interactables.push({
    id: 'lore_apc_manifest',
    kind: 'lore',
    label: 'READ EVACUATION ORDER',
    position: new THREE.Vector3(-1.4, 1.0, 37.8),
    radius: 2.5,
    mesh: doc1Mesh,
    consumed: false,
    loreId: 'doc_apc_manifest',
    highlightRing: doc1Ring,
  });

  // 2. STREET PROPS, INFECTED VEHICLES & DESTRUCTIBLE / REINFORCED BARRICADES
  const vehiclePlacements: [number, number, number, boolean][] = [
    [-7.5, 22, 0.35, true],
    [8.5, 14, -0.5, false],
    [-6.5, 2, -0.25, true],
    [10.0, -6, 0.8, true],
    [-9.5, -42, 0.4, false],
    [11.0, -58, -0.6, true],
  ];
  vehiclePlacements.forEach(([vx, vz, ry, inf], idx) => {
    const car = buildInfectedVehicle(textures, vx, vz, ry, inf);
    scene.add(car);
    [-1.15, 1.15].forEach((lz) => {
      addRotatedBoxCollider(colliders, vx, vz, ry, 0, lz, 2.15, 2.25, 0, 2.0, 'infected_vehicle');
    });

    // Street-level car engine fires + fuel leak wreck event
    if (idx === 0 || idx === 3 || idx === 5) {
      const carFireLight = idx === 0 || idx === 3 ? new THREE.PointLight(0xff6b1a, 7.5, 18, 1.6) : undefined;
      if (carFireLight) {
        carFireLight.position.set(vx, 1.8, vz);
        scene.add(carFireLight);
      }
      const emIdx = fireEmitters.length;
      fireEmitters.push({
        id: `car_fire_${idx}`,
        position: new THREE.Vector3(vx, 1.05, vz),
        directionOut: new THREE.Vector3(0, 1, 0),
        scale: idx === 3 ? 1.0 : 1.15,
        heatRadius: 3.6,
        intensity: 0.9,
        isStructural: false,
        smokeDensity: 1.0,
        light: carFireLight,
        baseLightIntensity: carFireLight ? 7.5 : undefined,
      });
      if (idx === 3) {
        destructibleFireEvents.push({
          id: 'event_fuel_wreck',
          kind: 'fuel_wreck',
          mesh: car,
          position: new THREE.Vector3(vx, 0.8, vz),
          triggered: false,
          fallProgress: 0,
          emitterIndex: emIdx,
        });
      }
    }
  });

  const barricadeCoords: [number, number, number, boolean][] = [
    [-4.5, 18, 0.1, false],
    [5.0, 4, -0.2, true],
    [-8.0, -25, 0, false],
    [8.0, -25, 0, false],
    [-6.0, -50, 0.15, true],
    [5.5, -62, -0.15, true],
  ];
  barricadeCoords.forEach(([bx, bz, ry, isDestructible], idx) => {
    const bGroup = new THREE.Group();
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 1.25, 0.8),
      isDestructible ? hazardMat : concMat
    );
    slab.castShadow = true;
    slab.receiveShadow = true;
    bGroup.add(slab);
    bGroup.position.set(bx, 0.625, bz);
    bGroup.rotation.y = ry;
    scene.add(bGroup);
    addRotatedBoxCollider(
      colliders,
      bx,
      bz,
      ry,
      0,
      0,
      3.8,
      0.85,
      0,
      1.3,
      isDestructible ? `destructible_barricade_${idx}` : 'street_barricade'
    );
    const colIdx = colliders.length - 1;
    if (isDestructible) {
      destructibleBarricades.push({
        id: `barricade_${idx}`,
        mesh: bGroup,
        position: new THREE.Vector3(bx, 0.625, bz),
        colliderIndex: colIdx,
        destroyed: false,
        kind: 'barricade',
        health: 120,
        maxHealth: 120,
        minStrength: 3,
      });
    }
  });

  // Destructible Supply Crates & Partition Glass along street flanks (breakable by bullets, melee, or medium/large monsters)
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.85,
    metalness: 0.15,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.36,
    roughness: 0.12,
    metalness: 0.1,
  });
  [
    [-9.5, 9.0],
    [10.2, -16.0],
    [-8.5, -56.0],
  ].forEach(([cx, cz], idx) => {
    const cGrp = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.25, 1.35), crateMat);
    box.castShadow = true;
    box.receiveShadow = true;
    cGrp.add(box);
    cGrp.position.set(cx, 0.625, cz);
    scene.add(cGrp);
    const colIdx = addBoxCollider(colliders, cx, 0.65, cz, 1.4, 1.3, 1.4, `destructible_crate_${idx}`);
    destructibleBarricades.push({
      id: `m1_crate_${idx}`,
      mesh: cGrp,
      position: new THREE.Vector3(cx, 0.625, cz),
      colliderIndex: colIdx,
      destroyed: false,
      kind: 'crate',
      health: 55,
      maxHealth: 55,
      minStrength: 2,
    });
  });

  [
    [12.2, 2.5],
    [-12.2, -36.0],
  ].forEach(([gx, gz], idx) => {
    const gGrp = new THREE.Group();
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.1, 2.8), glassMat);
    gGrp.add(pane);
    gGrp.position.set(gx, 1.05, gz);
    scene.add(gGrp);
    const colIdx = addBoxCollider(colliders, gx, 1.05, gz, 0.3, 2.1, 2.8, `destructible_glass_${idx}`);
    destructibleBarricades.push({
      id: `m1_glass_${idx}`,
      mesh: gGrp,
      position: new THREE.Vector3(gx, 1.05, gz),
      colliderIndex: colIdx,
      destroyed: false,
      kind: 'glass',
      health: 20,
      maxHealth: 20,
      minStrength: 1,
    });
  });

  // Ruined Highway Overpass Gantry with Exposed Rebar
  const overpassDeck = new THREE.Mesh(new THREE.BoxGeometry(44, 1.2, 6.5), concMat);
  overpassDeck.position.set(0, 8.8, -10);
  overpassDeck.rotation.z = 0.04;
  overpassDeck.castShadow = true;
  const overpassBeam = new THREE.Mesh(new THREE.BoxGeometry(44, 0.65, 1.4), hazardMat);
  overpassBeam.position.set(0, 7.9, -6.9);
  overpassBeam.rotation.z = 0.04;
  scene.add(overpassDeck, overpassBeam);
  [-21, 21].forEach((px) => {
    const pierH = px < 0 ? 8.4 : 9.6;
    const pier = new THREE.Mesh(new THREE.BoxGeometry(2.2, pierH, 3.2), concMat);
    pier.position.set(px, pierH * 0.5, -10);
    pier.castShadow = true;
    scene.add(pier);
    addBoxCollider(colliders, px, pierH * 0.5, -10, 2.2, pierH, 3.2, 'overpass_pier');
  });

  // Streetlights with atmospheric red/amber pools
  [-12, 12].forEach((lx) => {
    [24, 0, -24, -52, -78].forEach((lz, idx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 6.2, 8), apcHullMat);
      pole.position.set(lx, 3.1, lz);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.12), apcHullMat);
      arm.position.set(lx > 0 ? lx - 0.7 : lx + 0.7, 6.1, lz);
      scene.add(pole, arm);
      if (idx % 2 === 0) {
        const lampColor = idx === 2 ? 0xef4444 : 0xd97706;
        const lamp = new THREE.PointLight(lampColor, 2.6, 24, 1.75);
        lamp.position.set(lx * 0.85, 5.6, lz);
        const bulbX = lx > 0 ? lx - 1.3 : lx + 1.3;
        const bulb = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.08, 0.22),
          new THREE.MeshBasicMaterial({ color: idx === 2 ? 0xef4444 : 0xf59e0b })
        );
        bulb.position.set(bulbX, 6.02, lz);
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(2.8, 5.6, 12, 1, true),
          new THREE.MeshBasicMaterial({
            color: lampColor,
            transparent: true,
            opacity: 0.035,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        );
        cone.position.set(bulbX, 3.15, lz);
        scene.add(lamp, bulb, cone);
        flickerLights.push({ light: lamp, base: 2.6, speed: 2.5 + idx });
      }
    });
  });

  // 3. POWER GENERATOR PUZZLE & MILITARY CHECKPOINT GATE (walls flush to +/-25 perimeter!)
  const gateWallL = new THREE.Mesh(new THREE.BoxGeometry(19.0, 5.5, 1.6), concMat);
  gateWallL.position.set(-15.5, 2.75, -28);
  const gateWallR = new THREE.Mesh(new THREE.BoxGeometry(19.0, 5.5, 1.6), concMat);
  gateWallR.position.set(15.5, 2.75, -28);
  const gateArch = new THREE.Mesh(new THREE.BoxGeometry(12, 1.6, 1.8), hazardMat);
  gateArch.position.set(0, 4.9, -28);
  scene.add(gateWallL, gateWallR, gateArch);
  addBoxCollider(colliders, -15.5, 2.75, -28, 19.0, 5.5, 1.8);
  addBoxCollider(colliders, 15.5, 2.75, -28, 19.0, 5.5, 1.8);

  const checkpointGateLeft = new THREE.Mesh(new THREE.BoxGeometry(6.0, 4.1, 0.45), apcHullMat);
  checkpointGateLeft.position.set(-3.0, 2.05, -28);
  const checkpointGateRight = new THREE.Mesh(new THREE.BoxGeometry(6.0, 4.1, 0.45), apcHullMat);
  checkpointGateRight.position.set(3.0, 2.05, -28);
  scene.add(checkpointGateLeft, checkpointGateRight);
  const gateColliderIndex = addBoxCollider(colliders, 0, 2.0, -28, 12.0, 4.2, 0.9, 'checkpoint_gate');

  const gatePanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.4, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
  );
  gatePanel.position.set(6.4, 1.1, -26.8);
  scene.add(gatePanel);
  addBoxCollider(colliders, 6.4, 0.85, -26.8, 0.7, 1.7, 0.5, 'gate_panel');
  interactables.push({
    id: 'gate_panel',
    kind: 'gate_panel',
    label: 'OVERRIDE CHECKPOINT GATE',
    position: new THREE.Vector3(6.4, 1.2, -26.8),
    radius: 2.8,
    mesh: gatePanel,
    consumed: false,
  });

  const genGroup = new THREE.Group();
  const genBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 1.2), hazardMat);
  genBody.position.y = 0.75;
  const genCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.8, 10),
    new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      emissive: 0xef4444,
      emissiveIntensity: 1.4,
    })
  );
  genCore.position.set(0, 1.5, 0);
  genGroup.add(genBody, genCore);
  genGroup.position.set(-16, 1.68, -22);
  scene.add(genGroup);
  addBoxCollider(colliders, -16, 2.4, -22, 1.9, 1.8, 1.3);

  interactables.push({
    id: 'power_generator',
    kind: 'generator',
    label: 'SOLVE GENERATOR BUS & RESTORE POWER',
    position: new THREE.Vector3(-16, 2.5, -22),
    radius: 3.0,
    mesh: genGroup,
    consumed: false,
    puzzleId: 'puz_01_gen',
  });

  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-16, 1.7, -22),
    new THREE.Vector3(-12, 0.1, -24),
    new THREE.Vector3(0, 0.1, -26.2),
    new THREE.Vector3(6.4, 0.5, -26.8),
  ]);
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x3f3f46,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.4,
  });
  const powerCableMesh = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 24, 0.08, 6, false), cableMat);
  scene.add(powerCableMesh);

  const guardShack = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.8, 3.6), concMat);
  guardShack.position.set(15.5, 1.4, -14);
  scene.add(guardShack);
  addBoxCollider(colliders, 15.5, 1.4, -14, 3.9, 2.9, 3.7);

  const keycardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.04, 0.22),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.8,
    })
  );
  keycardMesh.position.set(12.8, 0.65, -14);
  const keyRing = createPickupBeacon(0x38bdf8);
  keycardMesh.add(keyRing);
  scene.add(keycardMesh);
  interactables.push({
    id: 'checkpoint_keycard',
    kind: 'keycard',
    label: 'TAKE CHECKPOINT ACCESS KEYCARD',
    position: new THREE.Vector3(12.8, 0.8, -14),
    radius: 2.5,
    mesh: keycardMesh,
    consumed: false,
    highlightRing: keyRing,
  });

  // 4. SCATTERED SUPPLIES & LORE RECORDINGS
  const addSupply = (
    id: string,
    kind: 'medkit' | 'ammo' | 'battery' | 'lore',
    label: string,
    x: number,
    y: number,
    z: number,
    color: number,
    loreId?: string
  ) => {
    const geo =
      kind === 'medkit'
        ? new THREE.BoxGeometry(0.45, 0.24, 0.34)
        : kind === 'ammo'
          ? new THREE.BoxGeometry(0.5, 0.3, 0.32)
          : kind === 'battery'
            ? new THREE.CylinderGeometry(0.12, 0.12, 0.36, 10)
            : new THREE.BoxGeometry(0.38, 0.06, 0.28);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.45,
      roughness: 0.4,
      metalness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    const ring = createPickupBeacon(color);
    mesh.add(ring);
    scene.add(mesh);
    interactables.push({
      id,
      kind,
      label,
      position: new THREE.Vector3(x, y, z),
      radius: 2.6,
      mesh,
      consumed: false,
      loreId,
      highlightRing: ring,
    });
  };

  addSupply('med_1', 'medkit', 'COLLECT MEDKIT (+35 HP)', 6.2, 0.35, 16, 0x22c55e);
  addSupply('ammo_1', 'ammo', 'COLLECT AMMUNITION CRATE', -5.5, 0.35, 8, 0xf59e0b);
  addSupply('bat_1', 'battery', 'COLLECT FLASHLIGHT CELL', 11.5, 0.35, -18, 0x38bdf8);
  addSupply('lore_archivist', 'lore', 'READ ARCHIVIST FIELD MEMO', -16, 1.95, -24.8, 0xfbbf24, 'doc_archivist_note');
  addSupply('med_2', 'medkit', 'COLLECT MEDKIT (+35 HP)', -9.0, 0.35, -45, 0x22c55e);
  addSupply('ammo_2', 'ammo', 'COLLECT AMMUNITION CRATE', 8.0, 0.35, -52, 0xf59e0b);
  addSupply('lore_choir', 'lore', 'INSPECT SCRATCHED WARNING', 13.2, 0.4, -52.5, 0xef4444, 'doc_choir_scribble');

  const relayGroup = new THREE.Group();
  const relayBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.9), apcHullMat);
  relayBase.position.y = 0.75;
  const relayDish = new THREE.Mesh(
    new THREE.ConeGeometry(0.65, 0.45, 10),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 })
  );
  relayDish.position.set(0, 1.9, 0);
  relayDish.rotation.x = 0.85;
  const relaySpark = new THREE.PointLight(0xf59e0b, 2.2, 7, 2);
  relaySpark.position.set(0, 1.5, 0.5);
  relayGroup.add(relayBase, relayDish, relaySpark);
  relayGroup.position.set(-7.5, 0, -18);
  scene.add(relayGroup);
  addBoxCollider(colliders, -7.5, 1, -18, 1.2, 2.2, 1.1);
  flickerLights.push({ light: relaySpark, base: 2.2, speed: 9 });
  interactables.push({
    id: 'dead_comm_relay',
    kind: 'comm_relay',
    label: 'INSPECT DAMAGED COMM RELAY',
    position: new THREE.Vector3(-7.5, 1.1, -18),
    radius: 2.8,
    mesh: relayGroup,
    consumed: false,
    loreId: 'audio_comm_relay',
  });

  const crateGroup = new THREE.Group();
  const crateBox = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.2), hazardMat);
  crateBox.position.y = 0.55;
  const crateLock = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.25, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.5 })
  );
  crateLock.position.set(0, 0.65, 0.62);
  crateGroup.add(crateBox, crateLock);
  crateGroup.position.set(11.5, 0, -42);
  scene.add(crateGroup);
  addBoxCollider(colliders, 11.5, 0.6, -42, 1.9, 1.2, 1.3);
  interactables.push({
    id: 'locked_supply_crate',
    kind: 'locked_container',
    label: 'UNLOCK MILITARY SUPPLY CONTAINER',
    position: new THREE.Vector3(11.5, 0.9, -42),
    radius: 2.8,
    mesh: crateGroup,
    consumed: false,
    loreId: 'doc_scrapborn_cache',
  });

  // 5. MYSTERIOUS ALIEN STRUCTURE & CREEPING BIOMECHANICAL VEINS
  const alienGroup = new THREE.Group();
  const spireMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a090d,
    map: textures.infectedFleshMap,
    normalMap: textures.infectedFleshNormal,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: textures.infectedFleshRoughness,
    emissive: 0x991b1b,
    emissiveMap: textures.infectedEmissiveMap,
    emissiveIntensity: 1.65,
    roughness: 0.35,
    metalness: 0.65,
    clearcoat: 0.85,
    clearcoatRoughness: 0.16,
  });
  for (let i = 0; i < 5; i++) {
    const shard = new THREE.Mesh(
      new THREE.ConeGeometry(0.65 - i * 0.08, 4.8 - i * 0.4, 5),
      spireMat
    );
    shard.position.set((i - 2) * 0.7, 2.1, (i % 2) * 0.5);
    shard.rotation.z = (i - 2) * 0.16;
    alienGroup.add(shard);
  }
  const alienGlow = new THREE.PointLight(0xdc2626, 4.8, 18, 2);
  alienGlow.position.set(0, 2.8, 0);
  alienGroup.add(alienGlow);
  alienGroup.position.set(16, 0, -56);
  scene.add(alienGroup);
  addBoxCollider(colliders, 16, 2, -56, 3.8, 4, 3.8);

  [
    [new THREE.Vector3(15.5, 0.12, -56), new THREE.Vector3(10, 0.18, -62), new THREE.Vector3(4, 0.14, -67), new THREE.Vector3(0.4, 0.16, -71.5)],
    [new THREE.Vector3(15.2, 0.14, -55), new THREE.Vector3(7, 0.12, -51), new THREE.Vector3(-4, 0.16, -55), new THREE.Vector3(-12, 0.14, -60)],
    [new THREE.Vector3(16.2, 0.12, -57), new THREE.Vector3(20, 0.2, -59), new THREE.Vector3(23.5, 3.5, -58)],
  ].forEach((pts) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const veinTube = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.14, 7, false), spireMat);
    scene.add(veinTube);
  });

  // 6. WORKING HELIOS MILITARY TERMINAL
  const termGroup = new THREE.Group();
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 1.2), apcHullMat);
  desk.position.y = 0.55;
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 1.05, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x111318, metalness: 0.8, roughness: 0.3 })
  );
  monitor.position.set(0, 1.55, -0.2);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 0.9),
    new THREE.MeshBasicMaterial({ map: textures.terminalScreenMap })
  );
  screen.position.set(0, 1.55, -0.12);
  const termLight = new THREE.PointLight(0xef4444, 3.0, 10, 2);
  termLight.position.set(0, 2.0, 0.8);
  termGroup.add(desk, monitor, screen, termLight);
  termGroup.position.set(0, 0, -72);
  scene.add(termGroup);
  addBoxCollider(colliders, 0, 1.0, -72, 2.9, 2.2, 1.4);

  interactables.push({
    id: 'helios_terminal',
    kind: 'terminal',
    label: 'ACCESS HELIOS COMMAND TERMINAL',
    position: new THREE.Vector3(0, 1.3, -71.2),
    radius: 3.0,
    mesh: termGroup,
    consumed: false,
  });

  const recMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.16, 0.32),
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.8,
    })
  );
  recMesh.position.set(1.8, 1.18, -72);
  recMesh.visible = false;
  scene.add(recMesh);
  interactables.push({
    id: 'final_blackbox',
    kind: 'final_recording',
    label: 'PLAY RECOVERED HELIOS BLACKBOX',
    position: new THREE.Vector3(1.8, 1.2, -72),
    radius: 3.0,
    mesh: recMesh,
    consumed: false,
    loreId: 'audio_sentinel_blackbox',
  });

  // Level 1 Save Terminal, Armory Workbench, Secret Cache Alcove, and Underground Entrance
  const saveTerm = new THREE.Group();
  const savePedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.35, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.35 })
  );
  savePedestal.position.y = 0.68;
  const saveScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 0.45),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  saveScreen.position.set(0, 1.15, 0.36);
  saveTerm.add(savePedestal, saveScreen);
  saveTerm.position.set(-10.5, 0, -24.5);
  scene.add(saveTerm);
  addBoxCollider(colliders, -10.5, 0.75, -24.5, 0.95, 1.5, 0.75, 'm1_save_terminal');
  interactables.push({
    id: 'm1_save_point',
    kind: 'save_point',
    label: 'SAVE PROGRESS AT FIELD TERMINAL',
    position: new THREE.Vector3(-10.5, 1.1, -24.5),
    radius: 2.6,
    mesh: saveTerm,
    consumed: false,
  });

  const wbGroup = new THREE.Group();
  const wbTable = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.95, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.4 })
  );
  wbTable.position.y = 0.48;
  const wbTrim = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.08, 0.95),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 })
  );
  wbTrim.position.y = 0.96;
  wbGroup.add(wbTable, wbTrim);
  wbGroup.position.set(11.5, 0, -34);
  scene.add(wbGroup);
  addBoxCollider(colliders, 11.5, 0.5, -34, 1.9, 1.0, 1.0);
  interactables.push({
    id: 'm1_workbench',
    kind: 'workbench',
    label: 'OPEN ARMORY WORKBENCH (UPGRADE WEAPONS)',
    position: new THREE.Vector3(11.5, 1.0, -34),
    radius: 2.8,
    mesh: wbGroup,
    consumed: false,
  });

  // Hidden Secret Room Alcove on East flank sealed seamlessly into x=24.5 East perimeter
  const secretWallL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.2, 6.4), concMat);
  secretWallL.position.set(14.5, 1.6, -42);
  const secretFrontR = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.2, 0.65), concMat);
  secretFrontR.position.set(22.0, 1.6, -39);
  const secretBack = new THREE.Mesh(new THREE.BoxGeometry(10.5, 3.2, 0.65), concMat);
  secretBack.position.set(19.75, 1.6, -45);
  const secretLintel = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.9, 0.65), concMat);
  secretLintel.position.set(17.0, 2.75, -39);
  const secretRoof = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.35, 6.6), concMat);
  secretRoof.position.set(19.75, 3.35, -42);
  scene.add(secretWallL, secretFrontR, secretBack, secretLintel, secretRoof);
  addBoxCollider(colliders, 14.5, 1.6, -42, 0.7, 3.2, 6.4);
  addBoxCollider(colliders, 22.0, 1.6, -39, 5.6, 3.2, 0.7);
  addBoxCollider(colliders, 19.75, 1.6, -45, 10.5, 3.2, 0.7);
  addBoxCollider(colliders, 17.0, 2.75, -39, 4.8, 0.9, 0.7, 'secret_lintel');

  const secretDoorBar = new THREE.Group();
  const barSlab = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.3, 0.65), hazardMat);
  secretDoorBar.add(barSlab);
  secretDoorBar.position.set(17, 1.15, -39);
  scene.add(secretDoorBar);
  const secBarIdx = addBoxCollider(colliders, 17, 1.15, -39, 4.6, 2.4, 0.8);
  destructibleBarricades.push({
    id: 'm1_secret_barricade',
    mesh: secretDoorBar,
    position: new THREE.Vector3(17, 1.15, -39),
    colliderIndex: secBarIdx,
    destroyed: false,
  });

  const secretCacheMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.55, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 1.2 })
  );
  secretCacheMesh.position.set(18.5, 0.48, -42.5);
  const secRing = createPickupBeacon(0xf59e0b);
  secretCacheMesh.add(secRing);
  scene.add(secretCacheMesh);
  addBoxCollider(colliders, 18.5, 0.45, -42.5, 0.95, 0.65, 0.65, 'secret_stash_box');
  interactables.push({
    id: 'secret_m1_cache',
    kind: 'secret_cache',
    label: 'CLAIM HIDDEN SCRAPBORN SUPPLY STASH (+2 SALVAGE)',
    position: new THREE.Vector3(18.5, 0.6, -42.5),
    radius: 2.8,
    mesh: secretCacheMesh,
    consumed: false,
    secretId: 'sec_01_bunker',
    secretTitle: 'QUARANTINE HIDDEN STASH',
    highlightRing: secRing,
  });

  // Underground Entrance Vault Hatch north of HELIOS terminal
  const hatchGroup = new THREE.Group();
  const hatchFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 3.4, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.82, roughness: 0.34 })
  );
  hatchFrame.position.y = 1.7;
  const hatchGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.5),
    new THREE.MeshBasicMaterial({ color: 0x22c55e })
  );
  hatchGlow.position.set(0, 1.5, 0.63);
  hatchGroup.add(hatchFrame, hatchGlow);
  hatchGroup.position.set(0, 0, -82);
  scene.add(hatchGroup);
  addBoxCollider(colliders, 0, 1.7, -82, 4.2, 3.4, 1.2);
  interactables.push({
    id: 'm1_underground_exit',
    kind: 'level_exit',
    label: 'DESCEND INTO UNDERGROUND FACILITY (LEVEL 02)',
    position: new THREE.Vector3(0, 1.4, -80.4),
    radius: 3.4,
    mesh: hatchGroup,
    consumed: false,
    stageReq: 3,
  });

  // 7. COMPLETE BIOMECHANICAL ENEMY ROSTER FOR MISSION 1 (INCLUDING THE SCRAPPER)
  enemySpawns.push(
    {
      id: 'm1_crawler_1',
      type: 'crawler',
      position: new THREE.Vector3(-4, 0, 12),
      patrolTarget: new THREE.Vector3(6, 0, 10),
      initiallyActive: true,
    },
    {
      id: 'm1_screamer_1',
      type: 'screamer',
      position: new THREE.Vector3(-10, 0, -2),
      patrolTarget: new THREE.Vector3(-4, 0, -5),
      initiallyActive: true,
    },
    {
      id: 'm1_stalker_1',
      type: 'stalker',
      position: new THREE.Vector3(6.2, 0, -2.5),
      patrolTarget: new THREE.Vector3(-5, 0, -8),
      initiallyActive: true,
    },
    {
      id: 'm1_scrapper_1',
      type: 'scrapper',
      position: new THREE.Vector3(-4.5, 0, -18),
      patrolTarget: new THREE.Vector3(4, 0, -18),
      initiallyActive: true,
    },
    {
      id: 'm1_crawler_2',
      type: 'crawler',
      position: new THREE.Vector3(-6.0, 0, -40),
      patrolTarget: new THREE.Vector3(6, 0, -44),
      initiallyActive: true,
    },
    {
      id: 'm1_carrier_1',
      type: 'carrier',
      position: new THREE.Vector3(9, 0, -46),
      patrolTarget: new THREE.Vector3(-2, 0, -46),
      initiallyActive: true,
    },
    {
      id: 'm1_brute_1',
      type: 'brute_enemy',
      position: new THREE.Vector3(4, 0, -56),
      patrolTarget: new THREE.Vector3(-6, 0, -54),
      initiallyActive: true,
    },
    {
      id: 'm1_scrapper_2',
      type: 'scrapper',
      position: new THREE.Vector3(-11, 0, -64),
      patrolTarget: new THREE.Vector3(2, 0, -60),
      initiallyActive: true,
    },
    {
      id: 'm1_ambush_sentinel',
      type: 'sentinel',
      position: new THREE.Vector3(-8, 0, -76),
      patrolTarget: new THREE.Vector3(0, 0, -70),
      initiallyActive: false,
      ambushTag: 'terminal_ambush',
    },
    {
      id: 'm1_ambush_crawler',
      type: 'crawler',
      position: new THREE.Vector3(9, 0, -76),
      patrolTarget: new THREE.Vector3(0, 0, -70),
      initiallyActive: false,
      ambushTag: 'terminal_ambush',
    }
  );

  // Distant colossal Titanforged shadow for Mission 1 ending
  const distantTitan = buildEnemyModel('titanforged', textures);
  distantTitan.group.scale.setScalar(1.45);
  distantTitan.group.position.set(-28, 0, -104);
  distantTitan.group.rotation.y = Math.PI / 2;
  distantTitan.group.visible = false;
  scene.add(distantTitan.group);

  // Towering Background Colossus Silhouette Beyond the Perimeter Skyline
  const colossus = buildEnemyModel('titanforged', textures);
  colossus.tentacleChains.forEach((c) => {
    c.role = 'colossus';
    c.amplitude *= 1.15;
  });
  colossus.group.scale.setScalar(3.8);
  colossus.group.position.set(-55, 0, -162);
  colossus.group.rotation.y = Math.PI / 2.2;
  scene.add(colossus.group);

  // Additional Mission 1 street barrel/debris fire + overpass electrical sparks
  fireEmitters.push({
    id: 'overpass_wreck_fire',
    position: new THREE.Vector3(-8.5, 0.35, -36),
    directionOut: new THREE.Vector3(0.2, 1, 0).normalize(),
    scale: 1.25,
    heatRadius: 3.8,
    intensity: 0.95,
    isStructural: false,
    smokeDensity: 1.0,
  });
  sparkEmitters.push(
    { position: new THREE.Vector3(-7.5, 1.5, -17.5), interval: 2.1, timer: 0.7 },
    { position: new THREE.Vector3(6.4, 1.3, -26.5), interval: 2.6, timer: 1.1 }
  );

  // 8. PART 1 WORLD STORYTELLING: METEOR IMPACT CRATER, 3059 HOLO PYLONS & NATURAL RECLAIMING FLORA
  // Note: THEY infect metals/rare-earth elements ONLY; all vegetation stays 100% healthy green.
  buildMeteorCrater(
    scene,
    textures,
    m1Disposeables,
    fireEmitters,
    flickerLights,
    colliders,
    -17.5,
    18.0,
    3.1,
    'm1_plaza'
  );

  buildHoloAdPylon(scene, m1Disposeables, -13.6, 4.0, 0.65, 0x38bdf8);
  buildHoloAdPylon(scene, m1Disposeables, 13.6, -4.0, -0.7, 0xf59e0b);
  buildHoloAdPylon(scene, m1Disposeables, -13.6, -34.0, 0.5, 0x38bdf8);

  // Photorealistic ruined commercial storefronts facing the avenue flush inside perimeter walls
  buildDetailedStorefront(scene, textures, m1Disposeables, colliders, -22.2, 9.5, Math.PI / 2, 'SUB-MART 24/7', 0x22c55e);
  buildDetailedStorefront(scene, textures, m1Disposeables, colliders, -22.2, -48.0, Math.PI / 2, 'CYBER-DINER & FUEL', 0xf97316);
  buildDetailedStorefront(scene, textures, m1Disposeables, colliders, 22.2, -34.0, -Math.PI / 2, 'NEO-PHARMA TECH', 0x06b6d4);

  // Abandoned commercial shopping carts and scattered goods
  const cartWireMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.35, wireframe: true });
  const cartRedGrip = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
  m1Disposeables.push(cartWireMat, cartRedGrip);
  const cartLocations: [number, number, number, boolean][] = [
    [-15.2, 12.0, 0.45, false],
    [-16.0, 14.5, -0.6, true],
    [14.8, -34.0, 1.2, false],
    [15.5, -36.5, -1.8, true],
  ];
  cartLocations.forEach(([cx, cz, rot, tipped]) => {
    const cart = new THREE.Group();
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 1.0), cartWireMat);
    basket.position.set(0, 0.45, 0);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8), cartRedGrip);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 0.72, -0.48);
    cart.add(basket, handle);
    if (tipped) {
      cart.rotation.z = 1.35;
      cart.position.set(cx, 0.22, cz);
    } else {
      cart.position.set(cx, 0.12, cz);
    }
    cart.rotation.y = rot;
    scene.add(cart);
  });

  // Roadside trees breaking through sidewalk cracks (positioned clear of ramps, doors & lanes)
  buildRoadsideTree(scene, textures, m1Disposeables, colliders, -20.5, 31.5, 1.05, true);
  buildRoadsideTree(scene, textures, m1Disposeables, colliders, 20.5, 24.0, 1.15, true);
  buildRoadsideTree(scene, textures, m1Disposeables, colliders, -20.5, -4.0, 1.0, true);
  buildRoadsideTree(scene, textures, m1Disposeables, colliders, -20.5, -34.5, 1.12, true);
  buildRoadsideTree(scene, textures, m1Disposeables, colliders, -20.5, -62.0, 1.18, true);
  buildRoadsideTree(scene, textures, m1Disposeables, colliders, 20.5, -66.0, 1.08, true);

  // Climbing green vines on overpass piers, checkpoint gate walls & ruin exterior
  buildClimbingVines(scene, m1Disposeables, -19.8, 0.2, -10.0, 2.4, 8.2, 'x', 1, 1);
  buildClimbingVines(scene, m1Disposeables, 19.8, 0.2, -10.0, 2.4, 8.2, 'x', -1, 2);
  buildClimbingVines(scene, m1Disposeables, -16.0, 0.2, -27.1, 6.0, 4.8, 'z', 1, 3);
  buildClimbingVines(scene, m1Disposeables, 16.0, 0.2, -27.1, 6.0, 4.8, 'z', 1, 4);
  buildClimbingVines(scene, m1Disposeables, 15.8, 0.2, 11.2, 2.0, 3.6, 'x', -1, 5);

  // Damp organic moss patches on sidewalks & abandoned interiors
  const mossMat = new THREE.MeshBasicMaterial({
    map: textures.mossDecalMap,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    opacity: 0.84,
  });
  m1Disposeables.push(mossMat);
  [
    [-16.5, 28, 4.8],
    [17.5, 22, 4.5],
    [-15.0, -3.5, 4.2],
    [22.4, 4.8, 3.2],
    [-16.0, -60, 5.2],
    [16.0, -66, 4.6],
  ].forEach(([mx, mz, sz]) => {
    const moss = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), mossMat);
    moss.rotation.x = -Math.PI / 2;
    moss.rotation.z = mx * 0.4;
    moss.position.set(mx, 0.21, mz);
    scene.add(moss);
  });

  // Single-draw-call instanced green grass tufts sprouting along curbs, cars, trees & ruin corner
  buildInstancedGrassTufts(
    scene,
    m1Disposeables,
    [
      { x: -12.6, y: 0.12, z: 26, spread: 1.5, count: 16 },
      { x: 12.6, y: 0.12, z: 20, spread: 1.6, count: 16 },
      { x: -7.5, y: 0.01, z: 22, spread: 2.8, count: 18 },
      { x: 8.5, y: 0.01, z: 14, spread: 2.8, count: 18 },
      { x: -6.5, y: 0.01, z: 2, spread: 2.6, count: 16 },
      { x: 10.0, y: 0.01, z: -6, spread: 2.6, count: 16 },
      { x: -9.5, y: 0.01, z: -42, spread: 2.6, count: 16 },
      { x: 11.0, y: 0.01, z: -58, spread: 2.6, count: 16 },
      { x: 22.8, y: 0.12, z: 4.8, spread: 1.2, count: 14 },
      { x: -20.5, y: 0.2, z: 31.5, spread: 1.8, count: 18 },
      { x: 20.5, y: 0.2, z: 24.0, spread: 1.8, count: 18 },
      { x: -20.5, y: 0.2, z: -4.0, spread: 1.8, count: 16 },
      { x: -20.5, y: 0.2, z: -34.5, spread: 1.8, count: 16 },
      { x: -12.6, y: 0.12, z: -50, spread: 1.8, count: 18 },
      { x: 12.6, y: 0.12, z: -62, spread: 1.8, count: 18 },
      { x: -20.5, y: 0.2, z: -62.0, spread: 1.8, count: 16 },
    ],
    11
  );

  fireEmitters.forEach((fe) => {
    fireHazardZones.push({
      position: fe.position.clone(),
      heatRadius: fe.heatRadius,
      intensity: fe.intensity,
    });
  });

  const ashCount = 420;
  const ashPos = new Float32Array(ashCount * 3);
  for (let i = 0; i < ashCount; i++) {
    ashPos[i * 3] = (Math.random() - 0.5) * 65;
    ashPos[i * 3 + 1] = Math.random() * 16;
    ashPos[i * 3 + 2] = 35 - Math.random() * 130;
  }
  const ashGeo = new THREE.BufferGeometry();
  ashGeo.setAttribute('position', new THREE.BufferAttribute(ashPos, 3));
  const smokePoints = new THREE.Points(
    ashGeo,
    new THREE.PointsMaterial({ color: 0x9ca3af, size: 0.14, transparent: true, opacity: 0.42 })
  );
  scene.add(smokePoints);

  const surfaceZones: SurfaceZone[] = [
    { minX: -22, maxX: -12, minZ: -26, maxZ: -14, surface: 'metal' }, // West catwalk & generator deck
    { minX: -15, maxX: 15, minZ: -31, maxZ: -23, surface: 'industrial' }, // Checkpoint Kestrel
    { minX: -14, maxX: 14, minZ: -78, maxZ: -64, surface: 'metal' }, // HELIOS terminal plaza
    { minX: 11, maxX: 13.5, minZ: -39, maxZ: -33, surface: 'glass' }, // Shattered booth glass
    { minX: -16, maxX: -8, minZ: 4, maxZ: 24, surface: 'gravel' }, // Collapsed rubble shoulder
  ];

  // 9. BLACK & BLOOD-RED ALIEN FUNGUS (Localized near 3059 meteor crater & damp ruined corners)
  const alienFungus = buildAlienFungusSystem(
    scene,
    [
      { id: 'l1_fungus_crater_1', kind: 'small', x: -14.2, y: 0.14, z: 16.4, scale: 1.05, substrate: 'damp_soil', seed: 101 },
      { id: 'l1_fungus_crater_2', kind: 'spreading', x: -19.2, y: 0.14, z: 13.8, scale: 0.9, substrate: 'damp_soil', seed: 102 },
      { id: 'l1_fungus_wood_1', kind: 'small', x: 18.6, y: 0.14, z: 6.2, scale: 0.95, substrate: 'decaying_wood', seed: 103 },
      { id: 'l1_fungus_ruin_1', kind: 'large', x: -16.8, y: 0.14, z: -58.5, scale: 0.95, substrate: 'damp_soil', seed: 104 },
    ],
    1011
  );
  m1Disposeables.push({ dispose: () => alienFungus.dispose() });

  return {
    colliders,
    ramps,
    interactables,
    enemySpawns,
    destructibleBarricades,
    surfaceZones,
    apcHatchDoor,
    apcDoorLeft,
    apcDoorRight,
    checkpointGateLeft,
    checkpointGateRight,
    gateColliderIndex,
    apcColliderIndex,
    powerCableMesh,
    flickerLights,
    distantTitan,
    horizonColossus: colossus.group,
    horizonColossusRefs: colossus,
    smokePoints,
    fireEmitters,
    sparkEmitters,
    fireHazardZones,
    destructibleFireEvents,
    alienFungus,
    disposeables: m1Disposeables,
  };
}

export function buildTitanforgedArenaWorld(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  const colliders: ColliderBox[] = [];
  const ramps: RampZone[] = [];
  const interactables: InteractableObject[] = [];
  const enemySpawns: EnemySpawnDef[] = [];
  const destructibleBarricades: DestructibleBarricade[] = [];
  const flickerLights: { light: THREE.PointLight; base: number; speed: number }[] = [];
  const fireEmitters: FireEmitterDef[] = [];
  const sparkEmitters: SparkEmitterDef[] = [];
  const fireHazardZones: SimpleFireHeatZone[] = [];
  const crucibleDisposeables: { dispose: () => void }[] = [];

  scene.background = new THREE.Color(0x070406);
  scene.fog = new THREE.FogExp2(0x0a0507, 0.017);

  const hemi = new THREE.HemisphereLight(0x522a34, 0x160a0d, 0.42);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xffc2b0, 0.68);
  keyLight.position.set(22, 42, 24);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -40;
  keyLight.shadow.camera.right = 40;
  keyLight.shadow.camera.top = 40;
  keyLight.shadow.camera.bottom = -40;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.022;
  scene.add(keyLight);

  const bossRimLeft = new THREE.PointLight(0xff3b3b, 9.0, 38, 1.4);
  bossRimLeft.position.set(-10, 9, -24);
  const bossRimRight = new THREE.PointLight(0xf59e0b, 6.5, 36, 1.45);
  bossRimRight.position.set(10, 8, -22);
  const arenaFill = new THREE.PointLight(0x93c5fd, 3.2, 40, 1.6);
  arenaFill.position.set(0, 12, -8);
  scene.add(bossRimLeft, bossRimRight, arenaFill);

  const floorMat = new THREE.MeshStandardMaterial({
    map: cloneTiledTexture(textures.grateMap, 24, 24, crucibleDisposeables),
    normalMap: cloneTiledTexture(textures.grateNormal, 24, 24, crucibleDisposeables),
    normalScale: new THREE.Vector2(1.45, 1.45),
    roughnessMap: cloneTiledTexture(textures.grateRoughness, 24, 24, crucibleDisposeables),
    metalnessMap: cloneTiledTexture(textures.grateMetalness, 24, 24, crucibleDisposeables),
    color: 0xa1948c,
    roughness: 0.78,
    metalness: 0.56,
    envMapIntensity: 0.44,
  });
  crucibleDisposeables.push(floorMat);
  const arenaFloor = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), floorMat);
  arenaFloor.rotation.x = -Math.PI / 2;
  arenaFloor.receiveShadow = true;
  scene.add(arenaFloor);

  const concMat = new THREE.MeshStandardMaterial({
    map: cloneTiledTexture(textures.concreteMap, 3, 3, crucibleDisposeables),
    normalMap: cloneTiledTexture(textures.concreteNormal, 3, 3, crucibleDisposeables),
    normalScale: new THREE.Vector2(1.35, 1.35),
    roughnessMap: cloneTiledTexture(textures.concreteRoughness, 3, 3, crucibleDisposeables),
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.22,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    map: cloneTiledTexture(textures.hazardStripeMap, 3, 1, crucibleDisposeables),
    normalMap: textures.metalNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.68,
    metalness: 0.28,
    envMapIntensity: 0.38,
  });
  const crucibleSteel = new THREE.MeshStandardMaterial({
    map: cloneTiledTexture(textures.metalPlateMap, 4, 4, crucibleDisposeables),
    normalMap: cloneTiledTexture(textures.metalNormal, 4, 4, crucibleDisposeables),
    normalScale: new THREE.Vector2(1.3, 1.3),
    roughnessMap: cloneTiledTexture(textures.metalRoughness, 4, 4, crucibleDisposeables),
    metalnessMap: cloneTiledTexture(textures.metalMetalness, 4, 4, crucibleDisposeables),
    metalness: 0.68,
    roughness: 0.62,
    envMapIntensity: 0.48,
  });
  crucibleDisposeables.push(concMat, hazardMat, crucibleSteel);

  const slagMat = new THREE.MeshStandardMaterial({
    color: 0xff4518,
    emissive: 0xe11d48,
    emissiveIntensity: 2.0,
    roughness: 0.25,
  });
  [-24, 24].forEach((gx) => {
    const grateCurb = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.14, 49.0), crucibleSteel);
    grateCurb.position.set(gx, 0.04, 0);
    const grate = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 48), slagMat);
    grate.rotation.x = -Math.PI / 2;
    grate.position.set(gx, 0.12, 0);
    scene.add(grateCurb, grate);
  });

  // Central scorch decal & overhead crimson heat cone
  const centerScorch = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({
      map: textures.scorchDecalMap,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      opacity: 0.85,
    })
  );
  centerScorch.rotation.x = -Math.PI / 2;
  centerScorch.position.set(0, 0.018, -10);
  scene.add(centerScorch);

  [-16, 4].forEach((gz) => {
    const span = new THREE.Mesh(new THREE.BoxGeometry(68, 1.4, 2.2), crucibleSteel);
    span.position.set(0, 14.5, gz);
    span.castShadow = true;
    scene.add(span);
    [-33, 33].forEach((px) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(2.2, 15, 2.2), crucibleSteel);
      col.position.set(px, 7.5, gz);
      scene.add(col);
    });
  });

  // Visible brutalist foundry perimeter blast walls matching arena boundary colliders
  [
    [-34, 3.25, 0, 2, 6.5, 72],
    [34, 3.25, 0, 2, 6.5, 72],
    [0, 3.25, 34, 72, 6.5, 2],
    [0, 3.25, -34, 72, 6.5, 2],
  ].forEach(([wx, wy, wz, ww, wh, wd]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, wd), crucibleSteel);
    wall.position.set(wx, wy, wz);
    wall.receiveShadow = true;
    scene.add(wall);
  });
  addBoxCollider(colliders, -34, 4, 0, 2, 10, 72);
  addBoxCollider(colliders, 34, 4, 0, 2, 10, 72);
  addBoxCollider(colliders, 0, 4, 34, 72, 10, 2);
  addBoxCollider(colliders, 0, 4, -34, 72, 10, 2);

  [
    [-36, -24],
    [-36, 0],
    [-36, 24],
    [36, -24],
    [36, 0],
    [36, 24],
    [-22, -36],
    [0, -36],
    [22, -36],
  ].forEach(([sx, sz], i) => {
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5, 22, 12), crucibleSteel);
    silo.position.set(sx, 11, sz);
    scene.add(silo);
    if (i % 2 === 0) {
      const pl = new THREE.PointLight(0xef4444, 5.5, 28, 1.7);
      pl.position.set(sx * 0.75, 6, sz * 0.75);
      scene.add(pl);
      flickerLights.push({ light: pl, base: 5.5, speed: 3 + i });
    }
  });

  // Reinforced Chamfered Brutalist Blast Bunkers inside Arena
  const bunkerShape = new THREE.Shape();
  bunkerShape.moveTo(-1.35, -1.7);
  bunkerShape.lineTo(1.35, -1.7);
  bunkerShape.lineTo(1.7, -1.35);
  bunkerShape.lineTo(1.7, 1.35);
  bunkerShape.lineTo(1.35, 1.7);
  bunkerShape.lineTo(-1.35, 1.7);
  bunkerShape.lineTo(-1.7, 1.35);
  bunkerShape.lineTo(-1.7, -1.35);
  bunkerShape.closePath();
  const bunkerGeo = new THREE.ExtrudeGeometry(bunkerShape, {
    depth: 4.8,
    bevelEnabled: true,
    bevelThickness: 0.14,
    bevelSize: 0.12,
    bevelSegments: 2,
  });
  bunkerGeo.rotateX(-Math.PI / 2);

  [
    [-12, 10],
    [12, 10],
    [-14, -8],
    [14, -8],
  ].forEach(([px, pz]) => {
    const bunker = new THREE.Group();
    const core = new THREE.Mesh(bunkerGeo, concMat);
    core.castShadow = true;
    core.receiveShadow = true;
    const basePlinth = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.55, 0.65, 8), crucibleSteel);
    basePlinth.position.y = 0.32;
    basePlinth.rotation.y = Math.PI / 8;
    const capPlate = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.3, 0.45, 8), crucibleSteel);
    capPlate.position.y = 4.95;
    capPlate.rotation.y = Math.PI / 8;
    const hazardCollar = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.24, 8), hazardMat);
    hazardCollar.position.y = 1.15;
    hazardCollar.rotation.y = Math.PI / 8;
    bunker.add(core, basePlinth, capPlate, hazardCollar);
    [-1.55, 1.55].forEach((rx) => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.28, 4.9, 0.42), crucibleSteel);
      rib.position.set(rx, 2.45, 0);
      bunker.add(rib);
    });
    bunker.position.set(px, 0, pz);
    scene.add(bunker);
    addBoxCollider(colliders, px, 2.6, pz, 3.6, 5.2, 3.6);
  });

  // Destructible Sloped Military Jersey Blast Shields that the Titanforged can smash!
  const jerseyProfile = new THREE.Shape();
  jerseyProfile.moveTo(-0.46, 0);
  jerseyProfile.lineTo(0.46, 0);
  jerseyProfile.lineTo(0.42, 0.32);
  jerseyProfile.lineTo(0.2, 0.62);
  jerseyProfile.lineTo(0.16, 1.38);
  jerseyProfile.lineTo(-0.16, 1.38);
  jerseyProfile.lineTo(-0.2, 0.62);
  jerseyProfile.lineTo(-0.42, 0.32);
  jerseyProfile.closePath();
  const jerseyGeo = new THREE.ExtrudeGeometry(jerseyProfile, {
    depth: 3.4,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  jerseyGeo.center();
  jerseyGeo.rotateY(Math.PI / 2);

  [
    [-5.5, 2],
    [5.5, 2],
  ].forEach(([bx, bz], idx) => {
    const shieldGroup = new THREE.Group();
    const shield = new THREE.Mesh(jerseyGeo, concMat);
    shield.castShadow = true;
    shield.receiveShadow = true;
    const steelTop = new THREE.Mesh(new THREE.BoxGeometry(3.52, 0.14, 0.4), crucibleSteel);
    steelTop.position.y = 0.72;
    const hazTrim = new THREE.Mesh(new THREE.BoxGeometry(3.48, 0.16, 0.56), hazardMat);
    hazTrim.position.y = -0.18;
    shieldGroup.add(shield, steelTop, hazTrim);
    shieldGroup.position.set(bx, 0.72, bz);
    scene.add(shieldGroup);
    const colIdx = addBoxCollider(colliders, bx, 0.7, bz, 3.4, 1.4, 0.9);
    destructibleBarricades.push({
      id: `arena_shield_${idx}`,
      mesh: shieldGroup,
      position: new THREE.Vector3(bx, 0.7, bz),
      colliderIndex: colIdx,
      destroyed: false,
      kind: 'barricade',
      health: 140,
      maxHealth: 140,
      minStrength: 4,
    });
  });

  const addSupply = (
    id: string,
    kind: 'medkit' | 'ammo',
    label: string,
    x: number,
    z: number,
    color: number
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.3, 0.38),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.55,
      })
    );
    mesh.position.set(x, 0.35, z);
    const ring = createPickupBeacon(color);
    mesh.add(ring);
    scene.add(mesh);
    interactables.push({
      id,
      kind,
      label,
      position: new THREE.Vector3(x, 0.35, z),
      radius: 2.6,
      mesh,
      consumed: false,
      highlightRing: ring,
    });
  };
  addSupply('boss_med_1', 'medkit', 'COLLECT EMERGENCY MEDKIT (+35 HP)', -18, 16, 0x22c55e);
  addSupply('boss_med_2', 'medkit', 'COLLECT EMERGENCY MEDKIT (+35 HP)', 18, 16, 0x22c55e);
  addSupply('boss_ammo_1', 'ammo', 'COLLECT HEAVY AMMO CRATE', -18, -14, 0xf59e0b);
  addSupply('boss_ammo_2', 'ammo', 'COLLECT HEAVY AMMO CRATE', 18, -14, 0xf59e0b);

  // Boss Arena Furnace Fires & Overhead Gantry Electrical Sparks casting orange firelight onto The Titanforged
  [
    [-24, -12],
    [24, -12],
    [-24, 12],
    [24, 12],
  ].forEach(([fx, fz], idx) => {
    const furnaceLight = idx < 2 ? new THREE.PointLight(0xff6b1a, 14, 34, 1.4) : undefined;
    if (furnaceLight) {
      furnaceLight.position.set(fx * 0.72, 4.2, fz);
      scene.add(furnaceLight);
    }
    const pos = new THREE.Vector3(fx, 0.25, fz);
    fireEmitters.push({
      id: `arena_slag_fire_${idx}`,
      position: pos,
      directionOut: new THREE.Vector3(fx < 0 ? 0.25 : -0.25, 1, 0).normalize(),
      scale: 1.55,
      heatRadius: 4.8,
      intensity: 1.0,
      isStructural: true,
      smokeDensity: 1.1,
      light: furnaceLight,
      baseLightIntensity: furnaceLight ? 14 : undefined,
    });
    fireHazardZones.push({ position: pos, heatRadius: 4.8, intensity: 1.0 });
  });

  // Burning debris clusters on arena floor for Titanforged metallic spark interaction
  [
    [-10, -14],
    [10, -14],
  ].forEach(([dx, dz], idx) => {
    const pos = new THREE.Vector3(dx, 0.2, dz);
    fireEmitters.push({
      id: `arena_debris_fire_${idx}`,
      position: pos,
      directionOut: new THREE.Vector3(0, 1, 0),
      scale: 0.9,
      heatRadius: 3.4,
      intensity: 0.85,
      isStructural: false,
      smokeDensity: 0.75,
    });
    fireHazardZones.push({ position: pos, heatRadius: 3.4, intensity: 0.85 });
  });

  sparkEmitters.push(
    { position: new THREE.Vector3(-12, 13.8, -16), interval: 1.6, timer: 0.3 },
    { position: new THREE.Vector3(12, 13.8, 4), interval: 2.1, timer: 1.0 }
  );

  enemySpawns.push({
    id: 'boss_titanforged',
    type: 'titanforged',
    position: new THREE.Vector3(0, 0, -20),
    patrolTarget: new THREE.Vector3(0, 0, 0),
    initiallyActive: true,
  });

  const crucibleSurfaceZones: SurfaceZone[] = [
    { minX: -28, maxX: -20, minZ: -28, maxZ: 28, surface: 'metal' },
    { minX: 20, maxX: 28, minZ: -28, maxZ: 28, surface: 'metal' },
    { minX: -18, maxX: 18, minZ: -28, maxZ: 28, surface: 'industrial' },
  ];

  return {
    colliders,
    ramps,
    interactables,
    enemySpawns,
    destructibleBarricades,
    surfaceZones: crucibleSurfaceZones,
    flickerLights,
    fireEmitters,
    sparkEmitters,
    fireHazardZones,
    disposeables: crucibleDisposeables,
  };
}

interface EduPlacement {
  id: string;
  eduId: string;
  label: string;
  x: number;
  y?: number;
  z: number;
}

const LEVEL_EDU_PLACEMENTS: Record<string, EduPlacement[]> = {
  mission_01: [
    { id: 'edu_m1_tree', eduId: 'edu_tree', label: 'INSPECT FOREST REGROWTH (BIOLOGY)', x: -18.5, z: 29.0 },
    { id: 'edu_m1_meteor', eduId: 'edu_meteor', label: 'SCAN METEOR CRATER (ASTRONOMY)', x: -14.2, z: 18.0 },
    { id: 'edu_m1_vines', eduId: 'edu_vines', label: 'INSPECT CLIMBING VINES (ECOLOGY)', x: 14.0, z: 11.2 },
    { id: 'edu_m1_firewall', eduId: 'edu_neural_network', label: 'ANALYZE FIREWALL NODE (TECHNOLOGY)', x: 6.5, z: -8.0 },
    { id: 'edu_m1_gen', eduId: 'edu_generator', label: 'INSPECT GENERATOR SCIENCE (ENGINEERING)', x: -13.5, y: 1.68, z: -20.0 },
    { id: 'edu_m1_sat', eduId: 'edu_satellite', label: 'SCAN SATELLITE RELAY (SATELLITES)', x: -4.2, z: -66.0 },
  ],
  mission_02: [
    { id: 'edu_m2_tree', eduId: 'edu_tree', label: 'INSPECT GARDEN FLORA (BIOLOGY)', x: -10, z: 16 },
    { id: 'edu_m2_anat', eduId: 'edu_monster_anatomy', label: 'SCAN INFECTED REMAINS (ANATOMY)', x: 10, z: -12 },
    { id: 'edu_m2_gen', eduId: 'edu_generator', label: 'INSPECT SUBSTATION (ENGINEERING)', x: -16, z: -24 },
  ],
  mission_03: [
    { id: 'edu_m3_cryo', eduId: 'edu_cryo_lab', label: 'SCAN CRYO LAB POD (TECHNOLOGY)', x: -12, z: -16 },
    { id: 'edu_m3_mat', eduId: 'edu_rare_earth', label: 'INSPECT RARE-EARTH ORE (MATERIALS)', x: 14, z: -22 },
    { id: 'edu_m3_mech', eduId: 'edu_infected_mech', label: 'SCAN MECH CHASSIS (ROBOTICS)', x: 4, z: -42 },
  ],
  mission_04: [
    { id: 'edu_m4_crane', eduId: 'edu_tower_crane', label: 'INSPECT TOWER CRANE (ENGINEERING)', x: -14, z: -24 },
    { id: 'edu_m4_weather', eduId: 'edu_weather_station', label: 'SCAN WEATHER MAST (WEATHER)', x: 14, z: -28 },
    { id: 'edu_m4_sat', eduId: 'edu_satellite', label: 'SCAN COMMS TOWER (SATELLITES)', x: 14, z: -70 },
  ],
  mission_05: [
    { id: 'edu_m5_hydro', eduId: 'edu_hydro_pump', label: 'INSPECT SUMP TURBINE (PHYSICS)', x: -10, z: -18 },
    { id: 'edu_m5_geo', eduId: 'edu_deep_geology', label: 'SCAN CRUSTAL STRATA (ENV. SCIENCE)', x: 12, z: -38 },
    { id: 'edu_m5_gen', eduId: 'edu_generator', label: 'INSPECT SMELTER GENERATOR (ENGINEERING)', x: 4, z: -24 },
  ],
  mission_06: [
    { id: 'edu_m6_cryo', eduId: 'edu_cryo_lab', label: 'SCAN CRYO VAULT (TECHNOLOGY)', x: -10, z: -14 },
    { id: 'edu_m6_mat', eduId: 'edu_rare_earth', label: 'ANALYZE MAGNETIC ALLOY (MATERIALS)', x: 10, z: -18 },
    { id: 'edu_m6_mech', eduId: 'edu_infected_mech', label: 'SCAN SENTINEL SCHEMATIC (ROBOTICS)', x: 0, z: -42 },
  ],
  mission_07: [
    { id: 'edu_m7_hydro', eduId: 'edu_hydro_pump', label: 'INSPECT DRAIN PUMP (PHYSICS)', x: -9, z: 8 },
    { id: 'edu_m7_crane', eduId: 'edu_tower_crane', label: 'INSPECT GANTRY TRUSS (ENGINEERING)', x: 12, z: -22 },
    { id: 'edu_m7_env', eduId: 'edu_climate_biosphere', label: 'SCAN WATERSHED RECOVERY (ENV. SCIENCE)', x: -8, z: -38 },
  ],
  mission_08: [
    { id: 'edu_m8_geo', eduId: 'edu_deep_geology', label: 'SCAN IMPACT BRECCIA (ENV. SCIENCE)', x: -10, z: -14 },
    { id: 'edu_m8_eco', eduId: 'edu_climate_biosphere', label: 'INSPECT BIOSPHERE CANOPY (ECOLOGY)', x: 10, z: -18 },
    { id: 'edu_m8_anat', eduId: 'edu_monster_anatomy', label: 'ANALYZE BIO-TENDON FUSION (ANATOMY)', x: 4, z: -32 },
  ],
  mission_09: [
    { id: 'edu_m9_weather', eduId: 'edu_weather_station', label: 'SCAN LAUNCH WEATHER MAST (WEATHER)', x: -12, z: -16 },
    { id: 'edu_m9_sat', eduId: 'edu_satellite', label: 'INSPECT ORBITAL BOOSTER RELAY (SATELLITES)', x: 10, z: -22 },
    { id: 'edu_m9_math', eduId: 'edu_signal_math', label: 'ANALYZE TELEMETRY MATH (MATHEMATICS)', x: 0, z: -40 },
  ],
  mission_10: [
    { id: 'edu_m10_sat', eduId: 'edu_satellite', label: 'SCAN PHASED-ARRAY DISH (SATELLITES)', x: -10, z: -16 },
    { id: 'edu_m10_math', eduId: 'edu_signal_math', label: 'INSPECT INVERSE-SQUARE GAIN (MATHEMATICS)', x: 10, z: -20 },
    { id: 'edu_m10_fw', eduId: 'edu_neural_network', label: 'ANALYZE HELIOS FIREWALL (TECHNOLOGY)', x: 0, z: -36 },
  ],
  mission_11: [
    { id: 'edu_m11_orb', eduId: 'edu_zero_g_station', label: 'INSPECT ZERO-G RING (PHYSICS)', x: -8, z: -16 },
    { id: 'edu_m11_reac', eduId: 'edu_reactor_core', label: 'SCAN AETHER REACTOR CORE (PHYSICS)', x: 4, z: -24 },
    { id: 'edu_m11_sat', eduId: 'edu_satellite', label: 'INSPECT INTERFEROMETRY ARRAY (SATELLITES)', x: 10, z: -34 },
  ],
  mission_12: [
    { id: 'edu_m12_meteor', eduId: 'edu_meteor', label: 'SCAN PRIMORDIAL METEORITE (ASTRONOMY)', x: -8, z: -14 },
    { id: 'edu_m12_mat', eduId: 'edu_rare_earth', label: 'ANALYZE RARE-EARTH VEIN (MATERIALS)', x: 8, z: -14 },
    { id: 'edu_m12_geo', eduId: 'edu_deep_geology', label: 'INSPECT CRUSTAL CRATER (ENV. SCIENCE)', x: 0, z: -28 },
  ],
};

export function addEducationalWorldObjects(
  missionId: string,
  scene: THREE.Scene,
  world: BuiltWorld
): void {
  const placements = LEVEL_EDU_PLACEMENTS[missionId];
  if (!placements || placements.length === 0) return;

  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.72,
    roughness: 0.35,
  });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.6,
    roughness: 0.2,
  });
  const holoRingMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  world.disposeables.push(pedestalMat, lensMat, holoRingMat);

  for (const item of placements) {
    const baseY = item.y ?? 0;
    const grp = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 1.05, 8), pedestalMat);
    post.position.y = 0.52;
    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), lensMat);
    head.position.y = 1.24;
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.36, 18), holoRingMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.06;
    grp.add(post, head, halo);
    grp.position.set(item.x, baseY, item.z);
    scene.add(grp);

    world.animatedProps?.push({
      kind: 'hoverSpin',
      object: head,
      speed: 1.4,
      baseY: 1.24,
      amplitude: 0.08,
      phase: item.x * 0.3,
    });

    world.interactables.push({
      id: item.id,
      kind: 'educational_scan',
      label: item.label,
      position: new THREE.Vector3(item.x, baseY + 1.15, item.z),
      radius: 3.1,
      mesh: grp,
      consumed: false,
      educationId: item.eduId,
      scannedOnce: false,
      highlightRing: halo,
    });
  }
}

