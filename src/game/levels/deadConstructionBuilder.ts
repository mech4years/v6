import * as THREE from 'three';
import { ProceduralTextureSet } from '../textures';
import { BuiltWorld } from '../worldBuilder';
import {
  addAlienFungusColonies,
  addClimbingVines,
  addConsoleInteractable,
  addDestructibleBarricade,
  addDetailedPillar,
  addFireSpot,
  addFloorDecal,
  addInstancedGrassTufts,
  addLevelExitGate,
  addMeteorCrater,
  addPerimeterWalls,
  addPickup,
  addPipeConduit,
  addRoadsideTree,
  addRotatedBoxCollider,
  addSaveAndWorkbench,
  addSolidBox,
  addVolumetricCone,
  addWallZWithDoor,
  createLevelContext,
  finalizeLevelWorld,
  LevelBuildContext,
  makeTiledMat,
} from './levelShared';

// ============================================================================
// PROCEDURAL CANVAS TEXTURES FOR SECTOR-09 DEAD CONSTRUCTION ZONE (3059 AD)
// ============================================================================

function makeCanvasTex(
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
  opts?: { repeatX?: number; repeatY?: number; isColor?: boolean }
): THREE.Texture {
  if (typeof document === 'undefined') {
    const dt = new THREE.DataTexture(new Uint8Array([140, 134, 126, 255]), 1, 1);
    dt.needsUpdate = true;
    return dt;
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  if (g) draw(g, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = opts?.isColor === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(opts?.repeatX ?? 1, opts?.repeatY ?? 1);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function createConstructionGroundTexture(ctx: LevelBuildContext): THREE.Texture {
  const tex = makeCanvasTex(
    512,
    512,
    (g, w, h) => {
      // Unfinished raw poured concrete + compacted gravel aggregate base
      g.fillStyle = '#5e5b55';
      g.fillRect(0, 0, w, h);

      let seed = 4099;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      // Rough concrete slab pours & dusty dirt patches
      for (let i = 0; i < 48; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const r = 20 + rnd() * 68;
        const grad = g.createRadialGradient(x, y, 4, x, y, r);
        const muddy = rnd() > 0.45;
        grad.addColorStop(0, muddy ? 'rgba(84, 70, 52, 0.34)' : 'rgba(128, 125, 118, 0.25)');
        grad.addColorStop(1, 'rgba(70, 66, 60, 0)');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
      }

      // Gravel aggregate grit speckles
      for (let i = 0; i < 3600; i++) {
        const v = 65 + Math.floor(rnd() * 85);
        g.fillStyle = `rgb(${v + 4},${v},${v - 6})`;
        g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 2, 2 + rnd() * 2);
      }

      // Heavy excavator tread marks & muddy tire ruts along access direction
      g.strokeStyle = 'rgba(38, 34, 28, 0.35)';
      g.lineWidth = 10;
      [110, 155, 355, 400].forEach((rx) => {
        g.beginPath();
        g.moveTo(rx, 0);
        g.lineTo(rx + 6, h);
        g.stroke();
        // Cleat notches inside crawler track
        g.fillStyle = 'rgba(28, 25, 22, 0.42)';
        for (let ty = 0; ty < h; ty += 16) {
          g.fillRect(rx - 9, ty, 18, 5);
        }
      });

      // Raw poured concrete expansion joints & cracked edges
      g.strokeStyle = 'rgba(32, 30, 28, 0.65)';
      g.lineWidth = 2.5;
      for (let y = 0; y < h; y += 128) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
      }

      // Faded temporary yellow construction access striping
      g.fillStyle = 'rgba(217, 165, 32, 0.38)';
      g.fillRect(250, 16, 12, 92);
      g.fillRect(250, 148, 12, 92);
      g.fillRect(250, 280, 12, 92);
      g.fillRect(250, 412, 12, 84);
    },
    { repeatX: 7, repeatY: 14, isColor: true }
  );
  ctx.disposeables.push(tex);
  return tex;
}

function createExcavatedEarthTexture(ctx: LevelBuildContext): THREE.Texture {
  const tex = makeCanvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#4e3f30';
      g.fillRect(0, 0, w, h);
      let seed = 8821;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      for (let i = 0; i < 1800; i++) {
        const s = 1.5 + rnd() * 3.5;
        const c = rnd();
        g.fillStyle = c < 0.35 ? '#3a2d21' : c < 0.7 ? '#63513e' : '#786c5c';
        g.fillRect(rnd() * w, rnd() * h, s, s);
      }
      // Subtle muddy puddles
      for (let i = 0; i < 6; i++) {
        g.fillStyle = 'rgba(30, 26, 22, 0.35)';
        g.beginPath();
        g.ellipse(rnd() * w, rnd() * h, 18 + rnd() * 24, 10 + rnd() * 16, rnd(), 0, Math.PI * 2);
        g.fill();
      }
    },
    { repeatX: 6, repeatY: 10, isColor: true }
  );
  ctx.disposeables.push(tex);
  return tex;
}

function createConstructionSignTexture(
  ctx: LevelBuildContext,
  headline: string,
  subline: string,
  accentHex = '#f59e0b',
  bgHex = '#17191f',
  warningStripes = true
): THREE.Texture {
  const tex = makeCanvasTex(
    512,
    128,
    (g, w, h) => {
      g.fillStyle = bgHex;
      g.fillRect(0, 0, w, h);

      if (warningStripes) {
        g.fillStyle = accentHex;
        g.fillRect(0, 0, w, 14);
        g.fillRect(0, h - 14, w, 14);
        g.fillStyle = '#141414';
        for (let x = -20; x < w + 20; x += 28) {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x + 14, 0);
          g.lineTo(x + 6, 14);
          g.lineTo(x - 8, 14);
          g.closePath();
          g.fill();
          g.beginPath();
          g.moveTo(x, h - 14);
          g.lineTo(x + 14, h - 14);
          g.lineTo(x + 6, h);
          g.lineTo(x - 8, h);
          g.closePath();
          g.fill();
        }
      } else {
        g.strokeStyle = accentHex;
        g.lineWidth = 5;
        g.strokeRect(6, 6, w - 12, h - 12);
      }

      g.fillStyle = accentHex;
      g.font = 'bold 34px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(headline, w * 0.5, 52);

      g.fillStyle = '#e2e8f0';
      g.font = '600 18px monospace';
      g.fillText(subline, w * 0.5, 92);

      // Subtle grime / dust weathering
      g.fillStyle = 'rgba(40, 34, 28, 0.22)';
      g.fillRect(0, h * 0.58, w, h * 0.42);
    },
    { repeatX: 1, repeatY: 1, isColor: true }
  );
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  ctx.disposeables.push(tex);
  return tex;
}

function createBlueprintScreenTexture(ctx: LevelBuildContext): THREE.Texture {
  const tex = makeCanvasTex(
    512,
    256,
    (g, w, h) => {
      g.fillStyle = '#071a2f';
      g.fillRect(0, 0, w, h);

      // Blueprint grid
      g.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      g.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, h);
        g.stroke();
      }
      for (let y = 0; y < h; y += 24) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
      }

      // Wireframe elevation drawing of unfinished megatowers & bridge
      g.strokeStyle = '#38bdf8';
      g.lineWidth = 2.5;
      g.strokeRect(44, 52, 74, 174);
      g.strokeRect(148, 28, 92, 198);
      g.strokeRect(272, 68, 80, 158);
      g.strokeRect(382, 42, 82, 184);
      // Skybridge span
      g.strokeRect(118, 120, 30, 14);
      g.strokeRect(240, 106, 32, 14);
      // Crane silhouette line
      g.strokeStyle = '#fbbf24';
      g.beginPath();
      g.moveTo(256, 226);
      g.lineTo(256, 18);
      g.lineTo(356, 18);
      g.stroke();

      g.fillStyle = '#bae6fd';
      g.font = 'bold 16px monospace';
      g.fillText('SECTOR 09 MEGACITY // STRUCTURAL PHASE 42%', 22, 24);
      g.fillStyle = '#f87171';
      g.fillText('STATUS: WORK HALTED — METALLIC CONTAMINATION', 22, 244);
    },
    { repeatX: 1, repeatY: 1, isColor: true }
  );
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  ctx.disposeables.push(tex);
  return tex;
}

// ============================================================================
// MATERIAL PALETTE FOR CONSTRUCTION SITE
// ============================================================================

interface ConstructionMaterials {
  rawConcrete: THREE.MeshStandardMaterial;
  pouredSlab: THREE.MeshStandardMaterial;
  darkConcrete: THREE.MeshStandardMaterial;
  primerRedSteel: THREE.MeshStandardMaterial;
  galvSteel: THREE.MeshStandardMaterial;
  darkSteel: THREE.MeshStandardMaterial;
  rustSteel: THREE.MeshStandardMaterial;
  craneYellow: THREE.MeshStandardMaterial;
  craneOrange: THREE.MeshStandardMaterial;
  safetyOrange: THREE.MeshStandardMaterial;
  safetyNet: THREE.MeshStandardMaterial;
  timberPlank: THREE.MeshStandardMaterial;
  curtainGlass: THREE.MeshStandardMaterial;
  hazardMat: THREE.MeshStandardMaterial;
  infectedMetal: THREE.MeshStandardMaterial;
  containerBlue: THREE.MeshStandardMaterial;
  containerRed: THREE.MeshStandardMaterial;
  militaryArmor: THREE.MeshStandardMaterial;
  dirtMound: THREE.MeshStandardMaterial;
}

function addSiteSign(
  ctx: LevelBuildContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  rotY: number,
  headline: string,
  subline: string,
  accentHex = '#f59e0b',
  emissiveHex = 0xf59e0b,
  emissiveIntensity = 0.55
): void {
  const tex = createConstructionSignTexture(ctx, headline, subline, accentHex);
  const backMat = new THREE.MeshStandardMaterial({ color: 0x1e242c, metalness: 0.78, roughness: 0.45 });
  const faceMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: emissiveHex,
    emissiveMap: tex,
    emissiveIntensity,
    roughness: 0.42,
    metalness: 0.12,
  });
  ctx.disposeables.push(backMat, faceMat);
  const grp = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), backMat);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, h - 0.08), faceMat);
  face.position.z = 0.09;
  grp.add(box, face);
  grp.position.set(x, y, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);
}

// ============================================================================
// MASSIVE UNFINISHED SKYSCRAPER GENERATOR (3 DISTINCT CONSTRUCTION STAGES)
// ============================================================================

type TowerStage = 'steel_skeleton' | 'concrete_slabs' | 'partial_curtain';

function buildUnfinishedSkyscraper(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  opts: {
    x: number;
    z: number;
    width: number;
    depth: number;
    floors: number;
    floorHeight: number;
    stage: TowerStage;
    facingXSign: 1 | -1;
    bridgeStubY?: number;
    infectedBase?: boolean;
  }
): THREE.Group {
  const grp = new THREE.Group();
  const { width: w, depth: d, floors, floorHeight: fh, stage, facingXSign } = opts;
  const totalH = floors * fh;

  // 1. Concrete Foundation Podium + Central Reinforced Elevator Core Shaft
  const coreW = w * 0.34;
  const coreD = d * 0.34;
  const coreH = totalH + fh * 0.8; // Elevator core rises slightly above working floor!
  const core = new THREE.Mesh(new THREE.BoxGeometry(coreW, coreH, coreD), mats.rawConcrete);
  core.position.y = coreH * 0.5;
  grp.add(core);

  // Exterior structural column grid (3 x 3 perimeter columns running full height!)
  const colGeo = new THREE.BoxGeometry(0.95, totalH + 1.8, 0.95);
  const colMat = stage === 'steel_skeleton' ? mats.primerRedSteel : mats.rawConcrete;
  const xCols = [-w * 0.46, 0, w * 0.46];
  const zCols = [-d * 0.46, 0, d * 0.46];
  xCols.forEach((cx) => {
    zCols.forEach((cz) => {
      if (cx === 0 && cz === 0) return;
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cx, (totalH + 1.8) * 0.5, cz);
      grp.add(col);
    });
  });

  // 2. Floor-by-floor unfinished slabs, exposed perimeter I-beams, partial curtain glass & safety netting
  const slabFloors =
    stage === 'steel_skeleton'
      ? Math.floor(floors * 0.45)
      : stage === 'concrete_slabs'
      ? Math.floor(floors * 0.85)
      : floors - 1;
  const glassFloors = stage === 'partial_curtain' ? Math.floor(floors * 0.56) : 0;

  for (let f = 1; f <= floors; f++) {
    const fy = f * fh;

    // Concrete floor slab on lower/completed working floors, exposed steel girders on upper skeletal levels!
    if (f <= slabFloors) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.52, d), mats.pouredSlab);
      slab.position.y = fy;
      grp.add(slab);
    } else {
      // Exposed steel framework girders around perimeter & cross-span
      const beamN = new THREE.Mesh(new THREE.BoxGeometry(w, 0.48, 0.44), mats.primerRedSteel);
      beamN.position.set(0, fy, -d * 0.46);
      const beamS = beamN.clone();
      beamS.position.z = d * 0.46;
      const beamW = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, d), mats.primerRedSteel);
      beamW.position.set(-w * 0.46, fy, 0);
      const beamE = beamW.clone();
      beamE.position.x = w * 0.46;
      const beamMid = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, 0.36), mats.primerRedSteel);
      beamMid.position.set(0, fy, 0);
      grp.add(beamN, beamS, beamW, beamE, beamMid);
    }

    // Diagonal structural steel X-bracing on skeletal floors facing the avenue
    if (f > slabFloors && f % 2 === 0) {
      const braceLen = Math.hypot(w * 0.46, fh);
      const ang = Math.atan2(fh, w * 0.46);
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, braceLen), mats.primerRedSteel);
      brace.position.set(facingXSign * w * 0.46, fy - fh * 0.5, 0);
      brace.rotation.x = ang;
      grp.add(brace);
    }

    // Partial Futuristic Curtain-Wall Glass Installation (with missing window bays!)
    if (f <= glassFloors) {
      const glassPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, fh - 0.55, d * 0.68),
        mats.curtainGlass
      );
      // Offset panel so part of the floor remains visibly open/unfinished!
      glassPanel.position.set(facingXSign * (w * 0.48), fy - fh * 0.5, (f % 2 === 0 ? 1 : -1) * d * 0.12);
      grp.add(glassPanel);

      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, d * 0.94), mats.darkSteel);
      mullion.position.set(facingXSign * (w * 0.48), fy - 0.2, 0);
      grp.add(mullion);
    }

    // Orange construction safety netting & edge guardrails on active working floors
    if (f === slabFloors || f === slabFloors - 1) {
      const net = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, fh * 0.85, d * 0.96),
        mats.safetyNet
      );
      net.position.set(facingXSign * (w * 0.49), fy + fh * 0.42, 0);
      grp.add(net);
    }
  }

  // 3. Exterior Construction Hoist / Industrial Elevator Track climbing the avenue-facing facade!
  const hoistX = facingXSign * (w * 0.54);
  const hoistMast = new THREE.Mesh(new THREE.BoxGeometry(0.7, totalH * 0.82, 0.7), mats.galvSteel);
  hoistMast.position.set(hoistX, totalH * 0.41, d * 0.26);
  const hoistCab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 3.0), mats.craneOrange);
  hoistCab.position.set(hoistX + facingXSign * 0.7, totalH * 0.36, d * 0.26);
  const hoistRoof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.18, 3.1), mats.darkSteel);
  hoistRoof.position.set(hoistX + facingXSign * 0.7, totalH * 0.36 + 1.48, d * 0.26);
  grp.add(hoistMast, hoistCab, hoistRoof);

  // 4. Protruding rooftop rebar starter bars & unfinished roof beams
  for (let r = -2; r <= 2; r++) {
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 5), mats.rustSteel);
    stub.position.set(r * (w * 0.18), totalH + 1.6, r % 2 === 0 ? d * 0.3 : -d * 0.3);
    grp.add(stub);
  }

  // 5. Optional Partially Completed Skybridge Stub cantilevering out toward opposite tower!
  if (opts.bridgeStubY) {
    const stubLen = 11.5;
    const bx = facingXSign * (w * 0.5 + stubLen * 0.48);
    const girderL = new THREE.Mesh(new THREE.BoxGeometry(stubLen, 0.9, 0.45), mats.primerRedSteel);
    girderL.position.set(bx, opts.bridgeStubY, -2.2);
    const girderR = girderL.clone();
    girderR.position.z = 2.2;
    const halfDeck = new THREE.Mesh(new THREE.BoxGeometry(stubLen * 0.65, 0.35, 4.8), mats.pouredSlab);
    halfDeck.position.set(facingXSign * (w * 0.5 + stubLen * 0.3), opts.bridgeStubY + 0.45, 0);
    grp.add(girderL, girderR, halfDeck);
  }

  // 6. Optional THEY metallic tendrils climbing ONLY the steel exterior hoist/beams
  if (opts.infectedBase) {
    const tendril = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(hoistX, 0.4, d * 0.26),
          new THREE.Vector3(hoistX + facingXSign * 0.8, 6.5, d * 0.22),
          new THREE.Vector3(hoistX + facingXSign * 0.3, 14.0, d * 0.3),
        ]),
        14,
        0.24,
        6,
        false
      ),
      mats.infectedMetal
    );
    grp.add(tendril);
  }

  grp.position.set(opts.x, 0, opts.z);
  ctx.scene.add(grp);
  return grp;
}

// ============================================================================
// COLOSSAL TOWER CRANE WITH SWAYING SUSPENDED LOAD & AVIATION BEACON
// ============================================================================

interface AnimatedCraneHook {
  jibGroup: THREE.Group;
  loadGroup: THREE.Group;
  baseYaw: number;
  phase: number;
}

function addAnimatedTowerCrane(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  x: number,
  z: number,
  height: number,
  jibYaw: number,
  colorVariant: 'yellow' | 'orange',
  loadKind: 'beams' | 'panel' | 'none',
  withCollider: boolean,
  animatedCranes: AnimatedCraneHook[],
  beacons: { mat: THREE.MeshBasicMaterial; phase: number }[]
): void {
  const grp = new THREE.Group();
  const bodyMat = colorVariant === 'yellow' ? mats.craneYellow : mats.craneOrange;

  // Heavy Reinforced Concrete Ballast Foundation Pad (physically grounded at y = 0!)
  const pad = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.9, 4.6), mats.rawConcrete);
  pad.position.y = 0.45;
  pad.receiveShadow = true;
  grp.add(pad);

  // Vertical Lattice Mast (4 heavy steel chord legs + horizontal & diagonal lacing)
  const mastW = 2.1;
  const colGeo = new THREE.BoxGeometry(0.22, height, 0.22);
  [-mastW * 0.5, mastW * 0.5].forEach((mx) => {
    [-mastW * 0.5, mastW * 0.5].forEach((mz) => {
      const col = new THREE.Mesh(colGeo, bodyMat);
      col.position.set(mx, height * 0.5 + 0.9, mz);
      grp.add(col);
    });
  });
  for (let ly = 2.2; ly < height; ly += 3.0) {
    const bandA = new THREE.Mesh(new THREE.BoxGeometry(mastW, 0.14, 0.14), bodyMat);
    bandA.position.set(0, ly + 0.9, mastW * 0.5);
    const bandB = bandA.clone();
    bandB.position.z = -mastW * 0.5;
    const bandC = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, mastW), bodyMat);
    bandC.position.set(mastW * 0.5, ly + 0.9, 0);
    const bandD = bandC.clone();
    bandD.position.x = -mastW * 0.5;
    grp.add(bandA, bandB, bandC, bandD);
  }

  // Rotating Upper Slewing Unit, Operator Cab, Working Jib, Counter-Jib & Suspended Load
  const jibGroup = new THREE.Group();
  jibGroup.position.y = height + 1.0;

  const slewing = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.45, 1.1, 14), mats.darkSteel);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.3, 2.4), bodyMat);
  cab.position.set(1.65, 1.1, 0.2);
  const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(1.96, 1.1, 1.8), mats.curtainGlass);
  cabGlass.position.set(1.65, 1.35, 0.55);

  const apex = new THREE.Mesh(new THREE.ConeGeometry(1.35, 5.2, 4), bodyMat);
  apex.position.set(0, 4.4, 0);
  apex.rotation.y = Math.PI / 4;

  // Working Jib Boom (+Z direction in local jib space, 28m long)
  const jibLen = 28;
  const jib = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.35, jibLen), bodyMat);
  jib.position.set(0, 1.9, jibLen * 0.5 - 1.5);
  // Counter-Jib (-Z direction) with stacked concrete counterweight blocks
  const cJib = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.15, 10.5), bodyMat);
  cJib.position.set(0, 1.8, -6.5);
  const cWeight = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.1, 3.8), mats.rawConcrete);
  cWeight.position.set(0, 2.0, -9.8);

  // Diagonal tension stay rods from apex to jib & counter-jib
  const stayF = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 20.5, 6), mats.darkSteel);
  stayF.position.set(0, 4.4, 9.5);
  stayF.rotation.x = Math.PI / 2 + 0.24;
  const stayB = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 10.8, 6), mats.darkSteel);
  stayB.position.set(0, 4.4, -4.8);
  stayB.rotation.x = Math.PI / 2 - 0.42;

  // Blinking Red Aviation Warning Strobe on top of apex & jib tip
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  ctx.disposeables.push(beaconMat);
  const topLamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), beaconMat);
  topLamp.position.set(0, 7.1, 0);
  const tipLamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), beaconMat);
  tipLamp.position.set(0, 2.6, jibLen - 1.6);
  beacons.push({ mat: beaconMat, phase: x * 0.13 + z * 0.09 });

  // Trolley & Suspended Construction Load Group
  const loadZ = 16.5;
  const cableLen = Math.max(8, height * 0.44);
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 1.4), mats.darkSteel);
  trolley.position.set(0, 1.05, loadZ);

  const loadGroup = new THREE.Group();
  loadGroup.position.set(0, 1.0, loadZ);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, cableLen, 6), mats.darkSteel);
  cable.position.y = -cableLen * 0.5;
  const hookBlock = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.45), mats.hazardMat);
  hookBlock.position.y = -cableLen;
  loadGroup.add(cable, hookBlock);

  if (loadKind === 'beams') {
    // Suspended bundle of 3 giant red-oxide structural steel I-beams!
    [-0.55, 0, 0.55].forEach((bx) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.45, 8.6), mats.primerRedSteel);
      beam.position.set(bx, -cableLen - 0.95, 0);
      loadGroup.add(beam);
    });
  } else if (loadKind === 'panel') {
    // Suspended precast futuristic concrete facade panel!
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 6.2), mats.pouredSlab);
    panel.position.set(0, -cableLen - 2.6, 0);
    loadGroup.add(panel);
  }

  jibGroup.add(slewing, cab, cabGlass, apex, jib, cJib, cWeight, stayF, stayB, topLamp, tipLamp, trolley, loadGroup);
  jibGroup.rotation.y = jibYaw;
  grp.add(jibGroup);

  grp.position.set(x, 0, z);
  ctx.scene.add(grp);

  animatedCranes.push({
    jibGroup,
    loadGroup,
    baseYaw: jibYaw,
    phase: x * 0.11 + z * 0.07,
  });

  if (withCollider) {
    ctx.colliders.push({
      minX: x - 2.3,
      maxX: x + 2.3,
      minY: 0,
      maxY: height + 4,
      minZ: z - 2.3,
      maxZ: z + 2.3,
      tag: 'tower_crane_base',
    });
  }
}

// ============================================================================
// COMPOSITE CONSTRUCTION MACHINERY (EXCAVATOR, MIXER, BULLDOZER, FORKLIFT, ROBOTS)
// ============================================================================

function addTrackedExcavator(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  x: number,
  z: number,
  rotY: number,
  infected = false
): void {
  const grp = new THREE.Group();
  // Heavy twin steel crawler tracks
  [-1.15, 1.15].forEach((tx) => {
    const track = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 4.2), mats.darkSteel);
    track.position.set(tx, 0.36, 0);
    grp.add(track);
  });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 3.4), mats.darkSteel);
  chassis.position.y = 0.72;
  // Upper rotating yellow engine deck & operator cab
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.05, 3.2), mats.craneYellow);
  deck.position.set(0, 1.42, -0.2);
  deck.castShadow = true;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.35, 1.55), mats.craneYellow);
  cab.position.set(-0.62, 2.35, 0.35);
  const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.82, 1.2), mats.curtainGlass);
  cabGlass.position.set(-0.62, 2.45, 0.45);
  // Articulated Hydraulic Boom, Dipper Stick & Toothed Steel Bucket resting on dirt
  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 4.4), mats.craneYellow);
  boom.position.set(0.55, 2.75, 2.35);
  boom.rotation.x = -0.62;
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 3.2), mats.craneYellow);
  stick.position.set(0.55, 2.45, 4.45);
  stick.rotation.x = 1.12;
  const bucket = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.75, 0.95), mats.rustSteel);
  bucket.position.set(0.55, 0.72, 4.95);
  bucket.rotation.x = 0.4;
  grp.add(chassis, deck, cab, cabGlass, boom, stick, bucket);

  if (infected) {
    const tendril = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.55, 0.3, 4.8),
          new THREE.Vector3(0.7, 1.8, 4.2),
          new THREE.Vector3(0.45, 3.0, 2.4),
          new THREE.Vector3(0.1, 1.9, 0.2),
        ]),
        12,
        0.11,
        6,
        false
      ),
      mats.infectedMetal
    );
    grp.add(tendril);
    ctx.sparkEmitters.push({ position: new THREE.Vector3(x, 2.2, z), interval: 2.2, timer: 0.6 });
  }

  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);

  addRotatedBoxCollider(ctx.colliders, x, z, rotY, 0, 0, 2.8, 4.4, 0, 2.8, 'excavator_body');
  addRotatedBoxCollider(ctx.colliders, x, z, rotY, 0.55, 4.5, 1.4, 1.4, 0, 1.8, 'excavator_bucket');
}

function addConcreteMixerTruck(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  x: number,
  z: number,
  rotY: number
): void {
  const grp = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 6.4), mats.darkSteel);
  bed.position.y = 0.82;
  // 3059 armored truck cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.8, 2.1), mats.craneOrange);
  cab.position.set(0, 1.95, 2.15);
  cab.castShadow = true;
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.78, 0.14), mats.curtainGlass);
  windshield.position.set(0, 2.25, 3.2);
  // Tilted ribbed concrete mixing drum
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.18, 3.8, 12), mats.pouredSlab);
  drum.position.set(0, 2.05, -0.95);
  drum.rotation.x = Math.PI / 2 - 0.24;
  drum.castShadow = true;
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.45, 12), mats.hazardMat);
  stripe.position.set(0, 2.05, -0.95);
  stripe.rotation.x = Math.PI / 2 - 0.24;
  const chute = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 1.6), mats.darkSteel);
  chute.position.set(0, 1.25, -3.25);
  chute.rotation.x = 0.5;
  // 6 heavy wheels
  const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.36, 12);
  [-1.18, 1.18].forEach((wx) => {
    [-2.1, -0.7, 2.05].forEach((wz) => {
      const w = new THREE.Mesh(wheelGeo, mats.darkSteel);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.52, wz);
      grp.add(w);
    });
  });
  // Hardened spilled concrete pour mound behind chute
  const spill = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 0.18, 10), mats.pouredSlab);
  spill.position.set(0, 0.09, -4.1);
  grp.add(bed, cab, windshield, drum, stripe, chute, spill);

  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);

  [-1.6, 1.6].forEach((lz) => {
    addRotatedBoxCollider(ctx.colliders, x, z, rotY, 0, lz, 2.65, 3.3, 0, 3.1, 'concrete_mixer');
  });
}

function addHeavyBulldozer(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  x: number,
  z: number,
  rotY: number,
  infected = false
): void {
  const grp = new THREE.Group();
  [-1.25, 1.25].forEach((tx) => {
    const track = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.85, 3.8), mats.darkSteel);
    track.position.set(tx, 0.425, 0);
    grp.add(track);
  });
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.15, 2.6), mats.craneYellow);
  hood.position.set(0, 1.35, 0.35);
  hood.castShadow = true;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.35, 1.45), mats.darkSteel);
  cab.position.set(0, 2.25, -0.85);
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.16, 1.65), mats.craneYellow);
  cabRoof.position.set(0, 2.98, -0.85);
  // Wide Heavy Steel Dozer Blade pushing excavated dirt
  const blade = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.25, 0.32), mats.rustSteel);
  blade.position.set(0, 0.72, 2.45);
  blade.rotation.x = -0.22;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 2.1), mats.craneYellow);
  armL.position.set(-1.35, 0.65, 1.4);
  const armR = armL.clone();
  armR.position.x = 1.35;
  const dirt = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05, 0), mats.dirtMound);
  dirt.position.set(0, 0.42, 3.15);
  dirt.scale.set(1.5, 0.55, 0.8);
  grp.add(hood, cab, cabRoof, blade, armL, armR, dirt);

  if (infected) {
    const tendril = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.3, 0.5, 2.4),
          new THREE.Vector3(-0.3, 1.3, 2.1),
          new THREE.Vector3(0.6, 1.95, 0.8),
        ]),
        10,
        0.1,
        6,
        false
      ),
      mats.infectedMetal
    );
    grp.add(tendril);
  }

  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);
  addRotatedBoxCollider(ctx.colliders, x, z, rotY, 0, 0.4, 3.3, 4.6, 0, 2.9, 'bulldozer');
}

function addForklift(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  x: number,
  z: number,
  rotY: number
): void {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.95, 2.0), mats.craneOrange);
  body.position.set(0, 0.65, -0.2);
  const cage = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 1.25), mats.darkSteel);
  cage.position.set(0, 1.65, -0.15);
  const mastL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.14), mats.darkSteel);
  mastL.position.set(-0.42, 1.35, 0.92);
  const mastR = mastL.clone();
  mastR.position.x = 0.42;
  const forkL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 1.15), mats.galvSteel);
  forkL.position.set(-0.34, 0.28, 1.48);
  const forkR = forkL.clone();
  forkR.position.x = 0.34;
  // Pallet of cinderblocks resting on forks!
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 1.1), mats.timberPlank);
  pallet.position.set(0, 0.36, 1.5);
  const blocks = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.72, 0.98), mats.rawConcrete);
  blocks.position.set(0, 0.78, 1.5);
  grp.add(body, cage, mastL, mastR, forkL, forkR, pallet, blocks);

  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);
  addRotatedBoxCollider(ctx.colliders, x, z, rotY, 0, 0.45, 1.45, 3.2, 0, 2.4, 'forklift');
}

function addRoboticWelderArm(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  x: number,
  z: number,
  rotY: number,
  sparking = true
): void {
  const grp = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.55, 10), mats.darkSteel);
  base.position.y = 0.275;
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.7, 10), mats.craneYellow);
  turret.position.y = 0.88;
  const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.2, 0.36), mats.craneOrange);
  lowerArm.position.set(0, 2.0, 0.45);
  lowerArm.rotation.x = 0.42;
  const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.8, 0.28), mats.galvSteel);
  upperArm.position.set(0, 2.6, 1.55);
  upperArm.rotation.x = 1.25;
  const emitter = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  emitter.position.set(0, 2.25, 2.35);
  grp.add(base, turret, lowerArm, upperArm, emitter);

  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);

  if (sparking) {
    ctx.sparkEmitters.push({ position: new THREE.Vector3(x, 2.2, z), interval: 1.9, timer: 0.4 });
  }
  ctx.colliders.push({
    minX: x - 1.05,
    maxX: x + 1.05,
    minY: 0,
    maxY: 2.6,
    minZ: z - 1.05,
    maxZ: z + 1.05,
    tag: 'robot_welder',
  });
}

function addPortableFloodlightGenerator(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  x: number,
  z: number,
  rotY: number,
  lightColor = 0xe0f0ff,
  flicker = false
): void {
  const grp = new THREE.Group();
  const unit = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 1.65), mats.craneYellow);
  unit.position.y = 0.62;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.16, 1.75), mats.darkSteel);
  frame.position.y = 0.22;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 5.2, 8), mats.galvSteel);
  mast.position.set(0, 3.4, -0.35);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.18), mats.darkSteel);
  cross.position.set(0, 6.0, -0.35);
  const lampMat = new THREE.MeshBasicMaterial({ color: lightColor });
  ctx.disposeables.push(lampMat);
  [-0.42, 0.42].forEach((lx) => {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.18), lampMat);
    head.position.set(lx, 5.95, -0.2);
    grp.add(head);
  });
  grp.add(unit, frame, mast, cross);
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);

  const pt = new THREE.PointLight(lightColor, 4.6, 24, 1.6);
  pt.position.set(x, 5.8, z);
  ctx.scene.add(pt);
  if (flicker) {
    ctx.flickerLights.push({ light: pt, base: 4.6, speed: 4.5 });
  }
  addVolumetricCone(ctx, x, 5.85, z, lightColor, 3.4, 5.6, 0.04);

  ctx.colliders.push({
    minX: x - 0.72,
    maxX: x + 0.72,
    minY: 0,
    maxY: 1.5,
    minZ: z - 0.9,
    maxZ: z + 0.9,
    tag: 'floodlight_gen',
  });
}

function addMilitaryEvacTransport(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  x: number,
  z: number,
  rotY: number
): void {
  const grp = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.65, 6.8), mats.militaryArmor);
  hull.position.y = 1.45;
  hull.castShadow = true;
  const upperCab = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.85, 4.4), mats.militaryArmor);
  upperCab.position.set(0, 2.55, -0.2);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.45, 0.16), mats.curtainGlass);
  visor.position.set(0, 2.55, 2.02);
  const roofBeacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 0.22, 8),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  roofBeacon.position.set(0, 3.1, 0.8);
  // 8 armored off-road tires
  const tireGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.42, 12);
  [-1.65, 1.65].forEach((tx) => {
    [-2.4, -0.8, 0.8, 2.4].forEach((tz) => {
      const tire = new THREE.Mesh(tireGeo, mats.darkSteel);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(tx, 0.58, tz);
      grp.add(tire);
    });
  });
  grp.add(hull, upperCab, visor, roofBeacon);
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);

  [-1.8, 1.8].forEach((lz) => {
    addRotatedBoxCollider(ctx.colliders, x, z, rotY, 0, lz, 3.6, 3.6, 0, 3.0, 'mil_transport');
  });
}

function addEmergencyCommsSpire(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  x: number,
  z: number,
  beacons: { mat: THREE.MeshBasicMaterial; phase: number }[]
): void {
  const grp = new THREE.Group();
  // Concrete equipment pad & generator shed
  const bunker = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.6, 4.4), mats.rawConcrete);
  bunker.position.y = 1.3;
  bunker.castShadow = true;
  grp.add(bunker);

  // Tall 34m tapered steel lattice comms tower rising from bunker roof
  const h = 34;
  for (let c = 0; c < 4; c++) {
    const ang = (c / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, h, 6), mats.galvSteel);
    leg.position.set(Math.cos(ang) * 1.1, 2.6 + h * 0.5, Math.sin(ang) * 1.1);
    leg.rotation.z = Math.cos(ang) * 0.04;
    leg.rotation.x = -Math.sin(ang) * 0.04;
    grp.add(leg);
  }
  for (let y = 5; y < 34; y += 3.5) {
    const s = THREE.MathUtils.lerp(2.1, 0.65, (y - 5) / 29);
    const ring = new THREE.Mesh(new THREE.BoxGeometry(s, 0.14, s), mats.craneOrange);
    ring.position.y = y;
    grp.add(ring);
  }
  // Dual microwave comms dishes + blinking amber/red spire strobe
  [16, 23].forEach((dy, idx) => {
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.35, 0.4, 12), mats.galvSteel);
    dish.rotation.z = Math.PI / 2;
    dish.position.set(idx === 0 ? -1.4 : 1.2, dy, -0.4);
    grp.add(dish);
  });
  const strobeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  ctx.disposeables.push(strobeMat);
  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), strobeMat);
  strobe.position.y = 2.6 + h + 0.4;
  grp.add(strobe);
  beacons.push({ mat: strobeMat, phase: 1.4 });

  grp.position.set(x, 0, z);
  ctx.scene.add(grp);
  ctx.colliders.push({
    minX: x - 2.3,
    maxX: x + 2.3,
    minY: 0,
    maxY: 36,
    minZ: z - 2.3,
    maxZ: z + 2.3,
    tag: 'comms_tower_base',
  });
}

// ============================================================================
// WALKABLE MULTI-LEVEL SCAFFOLDING SYSTEM (RAMP + WORK DECK + SKYBRIDGE)
// ============================================================================

function addWalkableScaffoldingDeck(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  y: number,
  railEdges: ('N' | 'S' | 'E' | 'W')[]
): void {
  const w = maxX - minX;
  const d = maxZ - minZ;
  const cx = (minX + maxX) * 0.5;
  const cz = (minZ + maxZ) * 0.5;

  // Timber plank working deck + steel ledger sub-frame
  const planks = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), mats.timberPlank);
  planks.position.set(cx, y - 0.07, cz);
  planks.castShadow = true;
  planks.receiveShadow = true;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.18, d + 0.12), mats.galvSteel);
  frame.position.set(cx, y - 0.22, cz);
  ctx.scene.add(planks, frame);

  // Grounded vertical tubular scaffolding standards along perimeter down to y = 0!
  const stepZ = Math.max(4, Math.round(d / Math.max(1, Math.round(d / 6))));
  const zList: number[] = [];
  for (let z = minZ + 0.15; z <= maxZ - 0.15; z += stepZ) zList.push(z);
  if (zList[zList.length - 1] < maxZ - 1.0) zList.push(maxZ - 0.15);

  const postGeo = new THREE.CylinderGeometry(0.065, 0.065, y + 1.1, 6);
  const basePlateGeo = new THREE.BoxGeometry(0.28, 0.06, 0.28);
  [minX + 0.12, maxX - 0.12].forEach((px) => {
    zList.forEach((pz) => {
      const post = new THREE.Mesh(postGeo, mats.galvSteel);
      post.position.set(px, (y + 1.1) * 0.5, pz);
      const bp = new THREE.Mesh(basePlateGeo, mats.darkSteel);
      bp.position.set(px, 0.03, pz);
      ctx.scene.add(post, bp);
    });
  });

  // Diagonal X-bracing bays on non-walkable outer faces for authentic construction scaffold look
  for (let i = 0; i < zList.length - 1; i++) {
    const zA = zList[i];
    const zB = zList[i + 1];
    const dz = zB - zA;
    const braceLen = Math.hypot(dz, y * 0.78);
    const ang = Math.atan2(y * 0.78, dz);
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, braceLen, 5), mats.galvSteel);
    brace.position.set(minX < 0 ? minX + 0.12 : maxX - 0.12, y * 0.45, (zA + zB) * 0.5);
    brace.rotation.x = Math.PI / 2 - ang;
    ctx.scene.add(brace);
  }

  // Walkable RampZone at deck height y (works seamlessly with multi-level groundHeightAt!)
  ctx.ramps.push({
    kind: 'platform',
    floorLevel: y >= 3.0 ? 1 : 0,
    minX,
    maxX,
    minZ,
    maxZ,
    zStart: cz,
    zEnd: cz,
    yStart: y,
    yEnd: y,
  });
  if (y >= 3.0) {
    ctx.colliders.push({
      minX,
      maxX,
      minY: y - 0.28,
      maxY: y - 0.08,
      minZ,
      maxZ,
      tag: 'scaffold_slab',
    });
  }

  // Safety Guardrails + Toe-boards along specified edges (colliders start at y so ground underneath is free!)
  railEdges.forEach((edge) => {
    const isZ = edge === 'N' || edge === 'S';
    const rw = isZ ? w : 0.08;
    const rd = isZ ? 0.08 : d;
    const rx = edge === 'W' ? minX + 0.1 : edge === 'E' ? maxX - 0.1 : cx;
    const rz = edge === 'N' ? minZ + 0.1 : edge === 'S' ? maxZ - 0.1 : cz;

    const topRail = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.07, rd), mats.craneYellow);
    topRail.position.set(rx, y + 1.05, rz);
    const midRail = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.05, rd), mats.galvSteel);
    midRail.position.set(rx, y + 0.58, rz);
    const toe = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.22, rd), mats.timberPlank);
    toe.position.set(rx, y + 0.11, rz);
    ctx.scene.add(topRail, midRail, toe);

    ctx.colliders.push({
      minX: rx - (isZ ? w * 0.5 : 0.14),
      maxX: rx + (isZ ? w * 0.5 : 0.14),
      minY: y,
      maxY: y + 1.25,
      minZ: rz - (isZ ? 0.14 : d * 0.5),
      maxZ: rz + (isZ ? 0.14 : d * 0.5),
      tag: 'scaffold_railing',
    });
  });
}

function addWalkableScaffoldingRamp(
  ctx: LevelBuildContext,
  mats: ConstructionMaterials,
  x: number,
  width: number,
  zBottom: number,
  zTop: number,
  yTop: number
): void {
  const span = Math.abs(zTop - zBottom);
  const cz = (zBottom + zTop) * 0.5;
  const len = Math.hypot(span, yTop);
  const dirZ = zTop < zBottom ? -1 : 1;
  const ang = Math.atan2(yTop, span) * -dirZ;

  // Inclined timber/steel ramp plank + tubular side handrails
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, len), mats.timberPlank);
  deck.position.set(x, yTop * 0.5 - 0.06, cz);
  deck.rotation.x = ang;
  deck.castShadow = true;
  deck.receiveShadow = true;
  ctx.scene.add(deck);

  [-width * 0.5, width * 0.5].forEach((gx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, len), mats.craneYellow);
    rail.position.set(x + gx, yTop * 0.5 + 0.98, cz);
    rail.rotation.x = ang;
    ctx.scene.add(rail);
  });

  // Grounded support legs along the incline
  [0.35, 0.72, 0.98].forEach((t) => {
    const ly = t * yTop;
    const lz = THREE.MathUtils.lerp(zBottom, zTop, t);
    [-width * 0.45, width * 0.45].forEach((gx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, ly, 6), mats.galvSteel);
      leg.position.set(x + gx, ly * 0.5, lz);
      ctx.scene.add(leg);
    });
  });

  const minZ = Math.min(zBottom, zTop);
  const maxZ = Math.max(zBottom, zTop);
  [-width * 0.5, width * 0.5].forEach((gx) => {
    ctx.colliders.push({
      minX: x + gx - 0.12,
      maxX: x + gx + 0.12,
      minY: 0,
      maxY: yTop + 1.1,
      minZ,
      maxZ,
      tag: 'scaffold_ramp_rail',
    });
  });

  ctx.ramps.push({
    id: `scaffold_ramp_${x < 0 ? 'w' : 'e'}`,
    kind: 'stairs',
    stepCount: 14,
    minX: x - width * 0.45,
    maxX: x + width * 0.45,
    minZ: minZ - 0.4,
    maxZ: maxZ + 0.4,
    zStart: zBottom,
    zEnd: zTop,
    yStart: 0,
    yEnd: yTop,
  });
}

// ============================================================================
// MAIN CHAPTER 04 BUILDER — THE DEAD CONSTRUCTION ZONE (3059 AD)
// ============================================================================

export function buildDeadConstructionWorld(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  // Overcast hazy dusk industrial skyline (cool slate-blue mist — NO orange wash!)
  const ctx = createLevelContext(scene, textures, 0x0b121c, 0x101824, 0.0112);

  scene.children.forEach((child) => {
    if (child instanceof THREE.HemisphereLight) {
      child.color.setHex(0x88a2c2);
      child.groundColor.setHex(0x27231e);
      child.intensity = 0.4;
    } else if (child instanceof THREE.DirectionalLight && child.castShadow) {
      child.color.setHex(0xdae6f5);
      child.intensity = 0.58;
      child.position.set(28, 54, 18);
      child.shadow.camera.left = -52;
      child.shadow.camera.right = 52;
      child.shadow.camera.top = 72;
      child.shadow.camera.bottom = -72;
      child.shadow.camera.far = 180;
      child.shadow.camera.updateProjectionMatrix();
    }
  });

  const siteGroundTex = createConstructionGroundTexture(ctx);
  const dirtTex = createExcavatedEarthTexture(ctx);

  const mats: ConstructionMaterials = {
    rawConcrete: makeTiledMat(ctx, {
      map: textures.concreteMap,
      normalMap: textures.concreteNormal,
      roughnessMap: textures.concreteRoughness,
      repeatX: 4,
      repeatY: 4,
      color: 0x8f8c85,
      roughness: 0.94,
      metalness: 0.02,
      envMapIntensity: 0.22,
      normalScale: 1.15,
    }),
    pouredSlab: makeTiledMat(ctx, {
      map: textures.concreteMap,
      normalMap: textures.concreteNormal,
      repeatX: 3,
      repeatY: 3,
      color: 0xa6a299,
      roughness: 0.92,
      metalness: 0.02,
      envMapIntensity: 0.22,
      normalScale: 0.9,
    }),
    darkConcrete: makeTiledMat(ctx, {
      map: textures.concreteMap,
      normalMap: textures.concreteNormal,
      repeatX: 4,
      repeatY: 4,
      color: 0x4b4e54,
      roughness: 0.95,
      metalness: 0.02,
      envMapIntensity: 0.2,
    }),
    primerRedSteel: makeTiledMat(ctx, {
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0x7c2d21, // Classic structural steel red-oxide primer!
      metalness: 0.56,
      roughness: 0.62,
      envMapIntensity: 0.45,
    }),
    galvSteel: makeTiledMat(ctx, {
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0x9aa4b0,
      metalness: 0.76,
      roughness: 0.44,
      envMapIntensity: 0.58,
    }),
    darkSteel: makeTiledMat(ctx, {
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0x252c37,
      metalness: 0.74,
      roughness: 0.48,
      envMapIntensity: 0.52,
    }),
    rustSteel: makeTiledMat(ctx, {
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0x6b3a24,
      metalness: 0.48,
      roughness: 0.76,
      envMapIntensity: 0.36,
    }),
    craneYellow: makeTiledMat(ctx, {
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0xd99b16,
      metalness: 0.58,
      roughness: 0.52,
      envMapIntensity: 0.48,
    }),
    craneOrange: makeTiledMat(ctx, {
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0xc2541a,
      metalness: 0.56,
      roughness: 0.54,
      envMapIntensity: 0.48,
    }),
    safetyOrange: new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.74,
      metalness: 0.04,
      envMapIntensity: 0.25,
    }),
    safetyNet: new THREE.MeshStandardMaterial({
      color: 0xea580c,
      transparent: true,
      opacity: 0.48,
      roughness: 0.92,
      metalness: 0.0,
      envMapIntensity: 0.16,
      side: THREE.DoubleSide,
    }),
    timberPlank: makeTiledMat(ctx, {
      map: textures.woodMap,
      normalMap: textures.woodNormal,
      roughnessMap: textures.woodRoughness,
      repeatX: 2,
      repeatY: 2,
      color: 0x9c764e,
      roughness: 0.92,
      metalness: 0.01,
      envMapIntensity: 0.18,
    }),
    curtainGlass: new THREE.MeshStandardMaterial({
      color: 0x7ba5c4,
      map: textures.glassCrackedMap,
      normalMap: textures.glassCrackedNormal,
      transparent: true,
      opacity: 0.42,
      roughness: 0.14,
      metalness: 0.12,
      envMapIntensity: 0.8,
    }),
    hazardMat: new THREE.MeshStandardMaterial({
      map: textures.hazardStripeMap,
      roughness: 0.68,
      metalness: 0.22,
      envMapIntensity: 0.34,
    }),
    infectedMetal: new THREE.MeshStandardMaterial({
      color: 0x5c1119,
      map: textures.infectedFleshMap,
      normalMap: textures.infectedFleshNormal,
      emissive: 0x8a1824,
      emissiveMap: textures.infectedEmissiveMap,
      emissiveIntensity: 0.9,
      roughness: 0.54,
      metalness: 0.46,
      envMapIntensity: 0.42,
    }),
    containerBlue: makeTiledMat(ctx, {
      map: textures.grateMap,
      normalMap: textures.grateNormal,
      repeatX: 4,
      repeatY: 2,
      color: 0x264b73,
      metalness: 0.62,
      roughness: 0.58,
      envMapIntensity: 0.46,
    }),
    containerRed: makeTiledMat(ctx, {
      map: textures.grateMap,
      normalMap: textures.grateNormal,
      repeatX: 4,
      repeatY: 2,
      color: 0x7a2b2b,
      metalness: 0.62,
      roughness: 0.6,
      envMapIntensity: 0.46,
    }),
    militaryArmor: makeTiledMat(ctx, {
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0x334136,
      metalness: 0.64,
      roughness: 0.56,
      envMapIntensity: 0.46,
    }),
    dirtMound: new THREE.MeshStandardMaterial({
      map: dirtTex,
      roughness: 0.98,
      metalness: 0.0,
      envMapIntensity: 0.12,
    }),
  };

  const groundMat = new THREE.MeshStandardMaterial({
    map: siteGroundTex,
    normalMap: textures.concreteNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.95,
    metalness: 0.02,
    envMapIntensity: 0.22,
  });
  ctx.disposeables.push(
    groundMat,
    mats.safetyOrange,
    mats.safetyNet,
    mats.curtainGlass,
    mats.hazardMat,
    mats.infectedMetal,
    mats.dirtMound
  );

  const animatedCranes: AnimatedCraneHook[] = [];
  const aviationBeacons: { mat: THREE.MeshBasicMaterial; phase: number }[] = [];

  // ==========================================================================
  // 1. CONSTRUCTION SITE GROUND, EXCAVATED ZONES & DRAINAGE CHANNELS (ZERO HOLES!)
  // ==========================================================================
  // Extended dark industrial horizon earth apron
  const horizon = new THREE.Mesh(
    new THREE.PlaneGeometry(340, 340),
    new THREE.MeshStandardMaterial({ color: 0x12151b, roughness: 0.98, metalness: 0.0, envMapIntensity: 0.12 })
  );
  horizon.rotation.x = -Math.PI / 2;
  horizon.position.y = -0.08;
  scene.add(horizon);

  // Main continuous watertight construction site concrete/aggregate ground slab
  const mainFloor = new THREE.Mesh(new THREE.PlaneGeometry(78, 136), groundMat);
  mainFloor.rotation.x = -Math.PI / 2;
  mainFloor.position.set(0, 0, -38);
  mainFloor.receiveShadow = true;
  scene.add(mainFloor);

  // Excavated earth & mud foundation zones flanking the central temporary access road
  const addDirtPatch = (x: number, z: number, w: number, d: number) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mats.dirtMound);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, 0.015, z);
    p.receiveShadow = true;
    scene.add(p);
    ctx.surfaceZones.push({
      minX: x - w * 0.5,
      maxX: x + w * 0.5,
      minZ: z - d * 0.5,
      maxZ: z + d * 0.5,
      surface: 'dirt',
    });
  };
  addDirtPatch(-23.0, -4.0, 21.0, 42.0);
  addDirtPatch(23.5, -56.0, 20.0, 34.0);
  addDirtPatch(-22.0, -76.0, 22.0, 28.0);

  // Steel trench-cover plates spanning open drainage channels across the central access road!
  [6.0, -14.0, -46.0, -70.0].forEach((tz) => {
    const channel = new THREE.Mesh(new THREE.BoxGeometry(17.0, 0.03, 1.55), mats.darkSteel);
    channel.position.set(0, 0.015, tz);
    channel.receiveShadow = true;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.05, 1.85), mats.galvSteel);
    plate.position.set(0, 0.025, tz);
    plate.receiveShadow = true;
    scene.add(channel, plate);
  });

  // Temporary Perimeter Site Hoarding / Concrete Safety Wall (X[-35..35], Z[-100..24], H = 4.6m)
  addPerimeterWalls(ctx, -35, 35, -100, 24, 4.6, mats.rawConcrete);
  // Hazard stripe band along inner top of perimeter site wall
  const perimBandW = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 124), mats.hazardMat);
  perimBandW.position.set(-34.3, 4.1, -38);
  const perimBandE = perimBandW.clone();
  perimBandE.position.x = 34.3;
  scene.add(perimBandW, perimBandE);

  // ==========================================================================
  // 2. MASSIVE UNFINISHED SKYSCRAPERS AT DIFFERENT CONSTRUCTION STAGES
  //    (Replaces ALL finished city skyscrapers with skeletal & half-built megatowers!)
  // ==========================================================================
  const unfinishedTowers: {
    x: number;
    z: number;
    w: number;
    d: number;
    floors: number;
    fh: number;
    stage: TowerStage;
    facingXSign: 1 | -1;
    bridgeStubY?: number;
    infectedBase?: boolean;
  }[] = [
    // West skyline — diverse stages (steel skeleton, open concrete slabs, partial curtain glass)
    { x: -49, z: 10, w: 20, d: 22, floors: 11, fh: 4.4, stage: 'steel_skeleton', facingXSign: 1, infectedBase: false },
    { x: -49, z: -26, w: 22, d: 24, floors: 15, fh: 4.4, stage: 'concrete_slabs', facingXSign: 1, bridgeStubY: 22.0, infectedBase: true },
    { x: -49, z: -64, w: 20, d: 22, floors: 13, fh: 4.5, stage: 'partial_curtain', facingXSign: 1, infectedBase: true },
    { x: -49, z: -98, w: 22, d: 22, floors: 16, fh: 4.4, stage: 'steel_skeleton', facingXSign: 1, infectedBase: false },

    // East skyline — varied heights & stages
    { x: 49, z: 12, w: 20, d: 22, floors: 10, fh: 4.4, stage: 'concrete_slabs', facingXSign: -1, infectedBase: true },
    { x: 49, z: -26, w: 22, d: 24, floors: 14, fh: 4.4, stage: 'partial_curtain', facingXSign: -1, bridgeStubY: 22.0, infectedBase: false },
    { x: 49, z: -64, w: 20, d: 22, floors: 12, fh: 4.5, stage: 'steel_skeleton', facingXSign: -1, infectedBase: true },
    { x: 49, z: -98, w: 22, d: 22, floors: 15, fh: 4.5, stage: 'concrete_slabs', facingXSign: -1, infectedBase: false },

    // North Horizon Megastructures looming behind extraction gate
    { x: -20, z: -124, w: 24, d: 20, floors: 17, fh: 4.5, stage: 'steel_skeleton', facingXSign: 1, infectedBase: true },
    { x: 22, z: -126, w: 24, d: 20, floors: 18, fh: 4.5, stage: 'partial_curtain', facingXSign: -1, infectedBase: false },
  ];
  unfinishedTowers.forEach((t) =>
    buildUnfinishedSkyscraper(ctx, mats, {
      x: t.x,
      z: t.z,
      width: t.w,
      depth: t.d,
      floors: t.floors,
      floorHeight: t.fh,
      stage: t.stage,
      facingXSign: t.facingXSign,
      bridgeStubY: t.bridgeStubY,
      infectedBase: t.infectedBase,
    })
  );

  // ==========================================================================
  // 3. FIVE COLOSSAL TOWER CRANES (GROUNDED, VARIED HEIGHTS, SWAYING LOADS)
  // ==========================================================================
  // 1. Hero West Tower Crane rising directly above the playable West Construction Yard
  addAnimatedTowerCrane(ctx, mats, -27.2, -22.5, 36, 0.95, 'yellow', 'beams', true, animatedCranes, aviationBeacons);
  // 2. Hero East Tower Crane rising above East Yard & North Comms Zone
  addAnimatedTowerCrane(ctx, mats, 28.5, -52.5, 44, -1.95, 'orange', 'panel', true, animatedCranes, aviationBeacons);
  // 3. North-West Heavy Crane overlooking Military Transport Pad
  addAnimatedTowerCrane(ctx, mats, -31.0, -86.0, 48, 0.62, 'yellow', 'beams', true, animatedCranes, aviationBeacons);
  // 4 & 5. High-Rise Horizon Cranes anchored behind the unfinished skyscrapers
  addAnimatedTowerCrane(ctx, mats, -48.0, -44.0, 62, 1.35, 'orange', 'none', false, animatedCranes, aviationBeacons);
  addAnimatedTowerCrane(ctx, mats, 48.0, -46.0, 58, -1.25, 'yellow', 'none', false, animatedCranes, aviationBeacons);

  // ==========================================================================
  // 4. SITE ENTRY GANTRY, HALF-BUILT VIADUCT & UNFINISHED BUILDING GROUND CORES
  // ==========================================================================

  // Overhead Construction Site Entry Gantry directly ahead of player spawn (Z = +13.5, span X[-10..+10])
  addDetailedPillar(ctx, -9.8, 13.5, 0.9, 6.2, 0.9, mats.primerRedSteel, mats.hazardMat);
  addDetailedPillar(ctx, 9.8, 13.5, 0.9, 6.2, 0.9, mats.primerRedSteel, mats.hazardMat);
  const gantryTruss = new THREE.Mesh(new THREE.BoxGeometry(20.6, 0.9, 0.9), mats.primerRedSteel);
  gantryTruss.position.set(0, 6.0, 13.5);
  scene.add(gantryTruss);
  addSiteSign(
    ctx,
    0,
    5.8,
    14.0,
    13.2,
    1.55,
    0,
    'SECTOR 09 MEGACITY DEVELOPMENT',
    'ACTIVE CONSTRUCTION SITE  •  HARD HAT & RESPIRATOR REQUIRED',
    '#fbbf24',
    0xf59e0b,
    0.72
  );

  // Half-Built Elevated Transit Viaduct crossing the construction avenue at Z = -22, Y = 8.4m
  // (Clearly UNDER CONSTRUCTION: West span poured concrete, East span exposed red steel I-beams + shoring!)
  addDetailedPillar(ctx, -17.0, -22.0, 2.3, 8.8, 3.0, mats.rawConcrete, mats.primerRedSteel);
  addDetailedPillar(ctx, 17.0, -22.0, 2.3, 8.8, 3.0, mats.rawConcrete, mats.primerRedSteel);
  // Twin full-span steel box girders
  [-24.2, -19.8].forEach((gz) => {
    const girder = new THREE.Mesh(new THREE.BoxGeometry(44, 0.95, 0.72), mats.primerRedSteel);
    girder.position.set(0, 8.2, gz);
    girder.castShadow = true;
    scene.add(girder);
  });
  // Half-poured concrete deck on West half (X: -22..+2), leaving East half exposed steel ribs!
  const halfViaductDeck = new THREE.Mesh(new THREE.BoxGeometry(24, 0.75, 6.4), mats.pouredSlab);
  halfViaductDeck.position.set(-10, 8.95, -22);
  halfViaductDeck.castShadow = true;
  scene.add(halfViaductDeck);
  for (let rx = 2.5; rx <= 20; rx += 2.2) {
    const crossRib = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 5.4), mats.primerRedSteel);
    crossRib.position.set(rx, 8.75, -22);
    scene.add(crossRib);
  }
  // Exposed rebar bars protruding out of the incomplete East concrete pour edge!
  for (let rz = -24.5; rz <= -19.5; rz += 0.9) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 5), mats.rustSteel);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(3.2, 8.95, rz);
    scene.add(bar);
  }

  // --- WEST UNFINISHED BUILDING GROUND CORE & REINFORCED FOUNDATION WALLS (X: -34..-12.2, Z: -10..-58) ---
  // Preserves wide open passages for Hunter patrol (-20,-28 -> -18,-52), edu_m4_crane (-14,-24), l4_ammo_1 (-16,-28), l4_lore_3 (-20,-36)
  addWallZWithDoor(ctx, -12.6, -58, -10, 3.9, 0.75, -32, 10.0, 3.6, mats.rawConcrete);
  // Overhanging unfinished 2nd-floor concrete slab canopy over West back foundation (X: -34..-13, Z: -34..-58, Y = 5.4m)
  const westUpperSlab = new THREE.Mesh(new THREE.BoxGeometry(21.4, 0.45, 24.4), mats.pouredSlab);
  westUpperSlab.position.set(-23.5, 5.4, -46.0);
  westUpperSlab.castShadow = true;
  scene.add(westUpperSlab);
  // Exposed steel columns rising from the West unfinished slab up to 16m!
  [
    [-14.5, -36],
    [-14.5, -56],
    [-25.0, -36],
    [-25.0, -56],
  ].forEach(([cx, cz]) => {
    const steelCol = new THREE.Mesh(new THREE.BoxGeometry(0.55, 11.5, 0.55), mats.primerRedSteel);
    steelCol.position.set(cx, 11.1, cz);
    scene.add(steelCol);
  });
  // Overhead steel girders framing the unfinished West upper floor
  const westBeam1 = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.45, 0.45), mats.primerRedSteel);
  westBeam1.position.set(-19.8, 10.6, -36);
  const westBeam2 = westBeam1.clone();
  westBeam2.position.z = -56;
  scene.add(westBeam1, westBeam2);

  // Preserved Secret Contractor Vault / Foreman's Tool Bunker (X: -35..-17, Z: -48..-38)
  // Exact secret room position, destructible barricade l4_secret_toll (-17, -43) & sec_04_stash (-23, 0.5, -42)!
  addSolidBox(ctx, -26, 2.2, -48, 18.5, 4.4, 0.8, mats.rawConcrete, 'vault_n');
  addSolidBox(ctx, -26, 2.2, -38, 18.5, 4.4, 0.8, mats.rawConcrete, 'vault_s');
  addWallZWithDoor(ctx, -17, -48, -38, 4.4, 0.8, -43, 3.8, 2.4, mats.rawConcrete);
  addSolidBox(ctx, -26, 4.55, -43, 18.5, 0.35, 10.6, mats.pouredSlab, 'vault_roof');
  addDestructibleBarricade(ctx, 'l4_secret_toll', -17, -43, 0.75, 2.4, 3.9, 0xb45309);
  addPickup(ctx, 'sec_04_stash', 'secret_cache', 'CLAIM CONTRACTOR VAULT CACHE (+2 SALVAGE)', -23, 0.5, -42, 0xf59e0b, {
    secretId: 'sec_04_garage',
    secretTitle: 'FOREMAN EQUIPMENT VAULT',
  });

  // --- EAST SITE ENGINEERING COMPOUND, MODULAR CONTAINERS & HOLOGRAPHIC BLUEPRINT TABLE ---
  // Preserves wide open routes around l4_save (18,-16), l4_workbench (18,-36), l4_lore_2 (19,-26), edu_m4_weather (14,-28), l4_med_1 (16,-42), l4_screamer_1 (19,-22 -> 16,-40)
  addWallZWithDoor(ctx, 12.6, -50, -4, 3.9, 0.75, -28, 11.0, 3.6, mats.rawConcrete);

  // Stacked Corrugated Construction Site Office Containers along far East flank (X = 25..33)
  const addSiteContainer = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    withWindows: boolean,
    withCollider: boolean
  ) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    c.position.set(x, y + h * 0.5, z);
    c.castShadow = true;
    c.receiveShadow = true;
    scene.add(c);
    if (withWindows) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.05, d * 0.55), mats.curtainGlass);
      win.position.set(x - w * 0.5 - 0.02, y + h * 0.58, z);
      scene.add(win);
    }
    if (withCollider) {
      ctx.colliders.push({
        minX: x - w * 0.5,
        maxX: x + w * 0.5,
        minY: y,
        maxY: y + h,
        minZ: z - d * 0.5,
        maxZ: z + d * 0.5,
        tag: 'site_container',
      });
    }
  };
  // Lower & stacked upper site office cabins
  addSiteContainer(28.5, 0, -14.0, 4.2, 3.2, 10.5, mats.containerBlue, true, true);
  addSiteContainer(28.5, 3.2, -14.0, 4.2, 3.2, 10.5, mats.containerRed, true, false);
  addSiteContainer(28.5, 0, -32.0, 4.2, 3.2, 10.0, mats.containerRed, false, true);
  addSiteContainer(28.5, 3.2, -32.0, 4.2, 3.2, 10.0, mats.containerBlue, true, false);

  addSiteSign(
    ctx,
    26.25,
    5.4,
    -14.0,
    8.2,
    1.15,
    -Math.PI / 2,
    'SITE ENGINEERING HQ',
    'EVACUATION ALERT: ALL CREWS REPORT TO TRANSPORT PAD',
    '#38bdf8',
    0x38bdf8,
    0.72
  );

  // 3059 Holographic Architectural Blueprint Table & Structural Monitor in East Compound (X = 22.8, Z = -22.5)
  addSolidBox(ctx, 22.8, 0.52, -22.5, 2.2, 1.04, 3.4, mats.darkSteel, 'blueprint_table');
  const bpTex = createBlueprintScreenTexture(ctx);
  const bpScreenMat = new THREE.MeshStandardMaterial({
    map: bpTex,
    emissive: 0x38bdf8,
    emissiveMap: bpTex,
    emissiveIntensity: 0.95,
    roughness: 0.2,
  });
  ctx.disposeables.push(bpScreenMat);
  const bpTop = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 3.0), bpScreenMat);
  bpTop.rotation.x = -Math.PI / 2;
  bpTop.position.set(22.8, 1.06, -22.5);
  scene.add(bpTop);

  // Floating translucent 3D Holographic Megacity Wireframe Model above the blueprint table!
  const holoCityGrp = new THREE.Group();
  const holoWireMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.72,
  });
  ctx.disposeables.push(holoWireMat);
  [
    [-0.45, 0.48, -0.5, 0.34, 0.96, 0.34],
    [0.05, 0.65, 0.0, 0.42, 1.3, 0.42],
    [0.48, 0.42, 0.48, 0.32, 0.84, 0.32],
    [-0.35, 0.36, 0.55, 0.28, 0.72, 0.28],
  ].forEach(([hx, hy, hz, hw, hh, hd]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, hd), holoWireMat);
    b.position.set(hx, hy, hz);
    holoCityGrp.add(b);
  });
  holoCityGrp.position.set(22.8, 1.15, -22.5);
  scene.add(holoCityGrp);

  // ==========================================================================
  // 5. WALKABLE MULTI-LEVEL CONSTRUCTION SCAFFOLDING NETWORK (Y = 4.2m)
  //    Connected West & East Ramps -> Elevated Work Decks -> Avenue Skybridge!
  // ==========================================================================
  const SCAF_Y = 4.2;

  // West Scaffolding Access Ramp (X = -10.0, Z = -18 -> -28, rising 0 -> 4.2m)
  addWalkableScaffoldingRamp(ctx, mats, -10.0, 2.2, -18.0, -28.0, SCAF_Y);
  // East Scaffolding Access Ramp (X = +10.0, Z = -18 -> -28, rising 0 -> 4.2m)
  addWalkableScaffoldingRamp(ctx, mats, 10.0, 2.2, -18.0, -28.0, SCAF_Y);

  // West & East Elevated Scaffolding Work Decks (Z = -28..-42, Y = 4.2m)
  // Leave bridge opening on inner edge at Z = -34.2..-37.2!
  addWalkableScaffoldingDeck(ctx, mats, -11.3, -8.7, -42.0, -28.0, SCAF_Y, ['W', 'N']);
  addWalkableScaffoldingDeck(ctx, mats, 8.7, 11.3, -42.0, -28.0, SCAF_Y, ['E', 'N']);

  // Elevated Temporary Steel Scaffolding Skybridge spanning the entire central avenue at Z = -34.2..-37.2!
  addWalkableScaffoldingDeck(ctx, mats, -8.7, 8.7, -37.2, -34.2, SCAF_Y, ['N', 'S']);
  addSiteSign(
    ctx,
    0,
    SCAF_Y + 0.45,
    -34.0,
    6.4,
    0.72,
    0,
    'CAUTION: OVERHEAD WORK DECK',
    'MAX LOAD 4,000 KG  •  SECTOR 09',
    '#fbbf24',
    0xf59e0b,
    0.6
  );

  // Tall Decorative Multi-Tier Exterior Scaffolding Towers hugging the outer perimeter structures
  const addTallFacadeScaffolding = (x: number, z: number, spanZ: number, tiers: number) => {
    const totalH = tiers * 2.8;
    const w = 2.2;
    [-w * 0.5, w * 0.5].forEach((ox) => {
      [-spanZ * 0.5, 0, spanZ * 0.5].forEach((oz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, totalH, 6), mats.galvSteel);
        post.position.set(x + ox, totalH * 0.5, z + oz);
        scene.add(post);
      });
    });
    for (let t = 1; t <= tiers; t++) {
      const ty = t * 2.8;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, spanZ), mats.timberPlank);
      deck.position.set(x, ty, z);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, spanZ), mats.craneYellow);
      rail.position.set(x + (x < 0 ? w * 0.5 : -w * 0.5), ty + 1.0, z);
      scene.add(deck, rail);
    }
    ctx.colliders.push({
      minX: x - w * 0.55,
      maxX: x + w * 0.55,
      minY: 0,
      maxY: totalH,
      minZ: z - spanZ * 0.52,
      maxZ: z + spanZ * 0.52,
      tag: 'tall_scaffolding',
    });
  };
  addTallFacadeScaffolding(-32.2, 6.0, 12.0, 6);
  addTallFacadeScaffolding(32.2, 4.0, 12.0, 5);
  addTallFacadeScaffolding(32.2, -64.0, 10.0, 6);

  // ==========================================================================
  // 6. HEAVY CONSTRUCTION MACHINERY & 3059 FUTURISTIC EQUIPMENT
  //    (All grounded, scaled, clear of patrol paths, some corrupted by THEY metal infection!)
  // ==========================================================================
  // South Entrance Hydraulic Excavator (infected by THEY along its hydraulic arm!)
  addTrackedExcavator(ctx, mats, -7.2, 3.5, 0.55, true);
  // Abandoned Concrete Mixer Truck mid-pour on East Avenue flank
  addConcreteMixerTruck(ctx, mats, 7.2, -5.5, -0.35);
  // Infected Heavy Bulldozer pushing excavated dirt in Central-North Site
  addHeavyBulldozer(ctx, mats, -6.4, -55.0, 2.55, true);
  // Counterbalanced Construction Forklift holding cinderblock pallet near East Material Yard
  addForklift(ctx, mats, 16.5, -6.5, -0.75);
  // Autonomous 3059 Robotic Welding / Fabrication Arms
  addRoboticWelderArm(ctx, mats, -22.5, -18.5, 0.9, true);
  addRoboticWelderArm(ctx, mats, 23.0, -40.5, -1.2, true);

  // Portable Telescoping Construction Floodlight Generators illuminating key zones!
  addPortableFloodlightGenerator(ctx, mats, -8.5, -14.5, 0.4, 0xdceafb, false);
  addPortableFloodlightGenerator(ctx, mats, 8.8, -46.0, -0.5, 0xfde6c4, true);
  addPortableFloodlightGenerator(ctx, mats, -2.8, -62.5, 0.25, 0xdceafb, false);
  addPortableFloodlightGenerator(ctx, mats, 8.2, -84.0, -0.3, 0xf5d8a8, true);

  // Hero Mission Landmarks Integrated Naturally Into the Construction Site:
  // 1) Armored Military Evacuation Transport right beside l4_transport (-20, -68)
  addMilitaryEvacTransport(ctx, mats, -26.5, -68.0, 0.22);
  addSiteSign(
    ctx,
    -20.0,
    3.4,
    -73.2,
    6.4,
    0.95,
    0,
    'EVACUATION STAGING PAD',
    'MILITARY TRANSPORT ACCESS  •  KEEP LANE CLEAR',
    '#38bdf8',
    0x38bdf8,
    0.72
  );

  // 2) 36m Emergency Communications Lattice Spire right behind l4_comms_tower (18, -74)
  addEmergencyCommsSpire(ctx, mats, 24.0, -76.5, aviationBeacons);
  addSiteSign(
    ctx,
    18.0,
    3.5,
    -79.8,
    6.4,
    0.95,
    0,
    'EMERGENCY COMMS RELAY',
    'UPLINK CALIBRATION TERMINAL  •  HIGH VOLTAGE',
    '#fbbf24',
    0xf59e0b,
    0.72
  );

  // Site Weather Mast beside edu_m4_weather (14, -28) — slim grounded mast at (15.5, -28.0)
  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 8.5, 8), mats.galvSteel);
  mastPole.position.set(15.6, 4.25, -29.8);
  const mastCross = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), mats.craneOrange);
  mastCross.position.set(15.6, 7.6, -29.8);
  scene.add(mastPole, mastCross);

  // ==========================================================================
  // 7. ORGANIZED CONSTRUCTION MATERIALS YARDS, CONCRETE BARRIERS & INSTANCED DEBRIS
  // ==========================================================================

  // Concrete Jersey Barriers & Hazard Barricades framing temporary site lanes
  const addJerseyBarrier = (x: number, z: number, rotY: number) => {
    const grp = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.92, 0.62), mats.rawConcrete);
    base.position.y = 0.46;
    base.castShadow = true;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.18, 0.64), mats.hazardMat);
    stripe.position.y = 0.78;
    grp.add(base, stripe);
    grp.position.set(x, 0, z);
    grp.rotation.y = rotY;
    scene.add(grp);
    addRotatedBoxCollider(ctx.colliders, x, z, rotY, 0, 0, 2.65, 0.68, 0, 0.98, 'jersey_barrier');
  };
  addJerseyBarrier(-5.2, 14.2, 0.12);
  addJerseyBarrier(5.6, 14.2, -0.15);
  addJerseyBarrier(-7.2, -26.5, Math.PI / 2);
  addJerseyBarrier(7.2, -26.5, Math.PI / 2);
  addJerseyBarrier(-8.5, -66.0, 0.25);
  addJerseyBarrier(9.0, -64.5, -0.22);

  // Organized Material Storage Stacks: Steel I-Beams, Bundled Pipes, Cinderblocks, Timber & Cable Spools
  const addSteelBeamStack = (x: number, z: number, rotY: number) => {
    const grp = new THREE.Group();
    for (let row = 0; row < 2; row++) {
      for (let col = -1; col <= 1; col++) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 4.8), mats.primerRedSteel);
        beam.position.set(col * 0.46, 0.18 + row * 0.36, 0);
        beam.castShadow = true;
        grp.add(beam);
      }
    }
    grp.position.set(x, 0, z);
    grp.rotation.y = rotY;
    scene.add(grp);
    addRotatedBoxCollider(ctx.colliders, x, z, rotY, 0, 0, 1.45, 4.9, 0, 0.85, 'steel_beams');
  };
  addSteelBeamStack(-15.5, 4.5, 0.08);
  addSteelBeamStack(15.8, 3.0, -0.1);
  addSteelBeamStack(-15.2, -59.5, 0.14);

  // Bundled Metal Conduit Pipes & Exposed Rebar Stacks
  [
    [-15.5, -8.0],
    [16.2, -32.0],
    [22.5, -62.0],
  ].forEach(([px, pz]) => {
    const grp = new THREE.Group();
    [-0.28, 0, 0.28].forEach((ox) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.2, 8), mats.galvSteel);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(ox, 0.18, 0);
      grp.add(pipe);
    });
    const topPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.2, 8), mats.rustSteel);
    topPipe.rotation.x = Math.PI / 2;
    topPipe.position.set(0, 0.46, 0);
    grp.add(topPipe);
    grp.position.set(px, 0, pz);
    scene.add(grp);
    ctx.colliders.push({
      minX: px - 0.55,
      maxX: px + 0.55,
      minY: 0,
      maxY: 0.72,
      minZ: pz - 2.15,
      maxZ: pz + 2.15,
      tag: 'pipe_bundle',
    });
  });

  // Stacked Cement Bag & Cinderblock Pallets + Giant Wooden Cable Spools
  const addMaterialPallet = (x: number, z: number, kind: 'blocks' | 'timber' | 'glass_rack') => {
    const grp = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 1.5), mats.timberPlank);
    base.position.y = 0.07;
    grp.add(base);
    if (kind === 'blocks') {
      const stack = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.95, 1.36), mats.rawConcrete);
      stack.position.y = 0.62;
      stack.castShadow = true;
      grp.add(stack);
    } else if (kind === 'timber') {
      const boards = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.75, 2.6), mats.timberPlank);
      boards.position.y = 0.52;
      grp.add(boards);
    } else {
      // A-frame glass curtain-wall transport rack!
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.2, 2.2), mats.craneOrange);
      frame.position.y = 1.24;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(1.06, 2.0, 2.0), mats.curtainGlass);
      glass.position.y = 1.24;
      grp.add(frame, glass);
    }
    grp.position.set(x, 0, z);
    scene.add(grp);
    ctx.colliders.push({
      minX: x - 0.85,
      maxX: x + 0.85,
      minY: 0,
      maxY: kind === 'glass_rack' ? 2.35 : 1.15,
      minZ: z - 1.15,
      maxZ: z + 1.15,
      tag: `pallet_${kind}`,
    });
  };
  addMaterialPallet(-22.5, 6.0, 'blocks');
  addMaterialPallet(-26.0, -3.5, 'timber');
  addMaterialPallet(22.0, -4.5, 'glass_rack');
  addMaterialPallet(23.5, -48.5, 'blocks');
  addMaterialPallet(-15.5, -76.5, 'timber');
  addMaterialPallet(15.5, -86.5, 'glass_rack');

  // Giant Industrial Cable Reels
  [
    [-16.0, 12.5],
    [15.0, -56.0],
    [-12.5, -88.0],
  ].forEach(([rx, rz]) => {
    const reel = new THREE.Group();
    const flangeL = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 14), mats.timberPlank);
    flangeL.rotation.z = Math.PI / 2;
    flangeL.position.set(-0.42, 0.85, 0);
    const flangeR = flangeL.clone();
    flangeR.position.x = 0.42;
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.78, 12), mats.darkSteel);
    drum.rotation.z = Math.PI / 2;
    drum.position.y = 0.85;
    reel.add(flangeL, flangeR, drum);
    reel.position.set(rx, 0, rz);
    scene.add(reel);
    ctx.colliders.push({
      minX: rx - 0.55,
      maxX: rx + 0.55,
      minY: 0,
      maxY: 1.7,
      minZ: rz - 0.9,
      maxZ: rz + 0.9,
      tag: 'cable_reel',
    });
  });

  // Instanced Construction Debris: Orange Safety Cones, Concrete Rubble Chunks, Bricks & Loose Boards
  const coneGeo = new THREE.ConeGeometry(0.22, 0.62, 8);
  const rubbleGeo = new THREE.DodecahedronGeometry(0.28, 0);
  const brickGeo = new THREE.BoxGeometry(0.32, 0.14, 0.18);
  const brickMat = new THREE.MeshStandardMaterial({ color: 0x8b3e2f, roughness: 0.92 });
  ctx.disposeables.push(coneGeo, rubbleGeo, brickGeo, brickMat);

  const cones = new THREE.InstancedMesh(coneGeo, mats.safetyOrange, 36);
  const rubbles = new THREE.InstancedMesh(rubbleGeo, mats.rawConcrete, 85);
  const bricks = new THREE.InstancedMesh(brickGeo, brickMat, 64);
  const dummy = new THREE.Object3D();

  let seed = 30594;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Place safety cones neatly along construction lane edges & hazards
  for (let i = 0; i < 36; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const cx = side * (8.4 + (rnd() - 0.5) * 1.4);
    const cz = 16 - i * 2.9;
    dummy.position.set(cx, 0.31, cz);
    dummy.rotation.set(rnd() > 0.78 ? 1.4 : 0, rnd() * Math.PI * 2, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    cones.setMatrixAt(i, dummy.matrix);
  }
  cones.instanceMatrix.needsUpdate = true;
  cones.computeBoundingSphere();

  for (let i = 0; i < 85; i++) {
    const rx = (rnd() - 0.5) * 62;
    const rz = 20 - rnd() * 114;
    dummy.position.set(rx, 0.12, rz);
    dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    const s = 0.45 + rnd() * 1.15;
    dummy.scale.set(s * 1.2, s * 0.55, s);
    dummy.updateMatrix();
    rubbles.setMatrixAt(i, dummy.matrix);
  }
  rubbles.instanceMatrix.needsUpdate = true;
  rubbles.computeBoundingSphere();
  rubbles.receiveShadow = true;

  for (let i = 0; i < 64; i++) {
    const rx = (rnd() - 0.5) * 56;
    const rz = 16 - rnd() * 106;
    dummy.position.set(rx, 0.07, rz);
    dummy.rotation.set(0, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.2);
    dummy.scale.setScalar(0.85 + rnd() * 0.4);
    dummy.updateMatrix();
    bricks.setMatrixAt(i, dummy.matrix);
  }
  bricks.instanceMatrix.needsUpdate = true;
  bricks.computeBoundingSphere();
  scene.add(cones, rubbles, bricks);

  // Drifting airborne construction dust motes
  const dustCount = 170;
  const dustArr = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustArr[i * 3] = (rnd() - 0.5) * 64;
    dustArr[i * 3 + 1] = 0.5 + rnd() * 18;
    dustArr[i * 3 + 2] = 20 - rnd() * 116;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xcbd5e1,
    size: 0.14,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  ctx.disposeables.push(dustGeo, dustMat);
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  scene.add(dustPoints);

  // Overhead industrial conduit runs linking site power to North Extraction Tunnel
  addPipeConduit(ctx, -32, 4.2, -52, -32, 4.2, -96, 0.22, mats.darkSteel);
  addPipeConduit(ctx, 32, 4.2, -52, 32, 4.2, -96, 0.22, mats.darkSteel);

  // ==========================================================================
  // 8. PRESERVED METEOR CRATER, UNINFECTED NATURAL FLORA & WEATHERING
  //    (Lore-accurate: THEY infect metallic equipment ONLY, NEVER plants!)
  // ==========================================================================
  addMeteorCrater(ctx, -24, -12, 3.2, 'l4_lot');

  addRoadsideTree(ctx, -29, 14, 1.05, true);
  addRoadsideTree(ctx, 29, 14, 1.0, true);
  addRoadsideTree(ctx, -31, -60, 1.08, true);
  addRoadsideTree(ctx, 31, -86, 1.02, true);

  addClimbingVines(ctx, -17.0, 0.2, -22, 2.2, 7.6, 'x', 1, 14);
  addClimbingVines(ctx, 17.0, 0.2, -22, 2.2, 7.6, 'x', -1, 15);
  addClimbingVines(ctx, -34.2, 0.3, -30, 5.0, 4.2, 'x', 1, 17);

  addFloorDecal(ctx, -29, 14, 5.0, 5.0, textures.mossDecalMap, 0.72, 0.2);
  addFloorDecal(ctx, 29, 14, 5.0, 5.0, textures.mossDecalMap, 0.72, -0.4);
  addFloorDecal(ctx, -5, 8, 4.5, 4.5, textures.scorchDecalMap, 0.72, 0.3);
  addFloorDecal(ctx, 7, -64, 4.5, 4.5, textures.scorchDecalMap, 0.72, -0.6);

  addInstancedGrassTufts(
    ctx,
    [
      { x: -29, z: 14, spread: 2.2, count: 16 },
      { x: 29, z: 14, spread: 2.2, count: 16 },
      { x: -31, z: -60, spread: 2.4, count: 16 },
      { x: 31, z: -86, spread: 2.2, count: 14 },
      { x: -13.0, z: -12, spread: 1.8, count: 10 },
      { x: 13.0, z: -48, spread: 1.8, count: 10 },
      { x: -8.0, z: -72, spread: 2.2, count: 10 },
      { x: 9.0, z: -88, spread: 2.2, count: 10 },
    ],
    44
  );

  // ==========================================================================
  // 9. PRESERVED MISSION OBJECTIVES, INTERACTABLES, PICKUPS, FIRES & ENEMIES
  //    (100% preserved IDs, coordinates, mission progression & THE HUNTER routes!)
  // ==========================================================================
  addConsoleInteractable(
    ctx,
    'l4_transport',
    'transport_console',
    'SECURE MILITARY EVACUATION TRANSPORT',
    -20,
    -68,
    0x38bdf8
  );
  addConsoleInteractable(
    ctx,
    'l4_comms_tower',
    'puzzle',
    'ACTIVATE EMERGENCY COMMS TOWER (MATH PUZZLE)',
    18,
    -74,
    0xf59e0b,
    { puzzleId: 'puz_04_comms' }
  );

  addSaveAndWorkbench(ctx, 'l4', 18, -16, 18, -36);

  // Unfinished Concrete Tunnel Portal Ribs framing l4_exit (0, -96)
  [-4.4, 4.4].forEach((tx) => {
    addSolidBox(ctx, tx, 2.8, -95.2, 1.4, 5.6, 2.8, mats.rawConcrete, 'exit_tunnel_pier');
  });
  const tunnelArch = new THREE.Mesh(new THREE.BoxGeometry(10.6, 1.2, 3.0), mats.rawConcrete);
  tunnelArch.position.set(0, 5.6, -95.2);
  scene.add(tunnelArch);
  addSiteSign(
    ctx,
    0,
    5.6,
    -93.6,
    8.2,
    0.95,
    0,
    'HIGHWAY 9 EXTRACTION TUNNEL',
    'ROUTE TO IRON FACTORY SECTOR 05',
    '#4ade80',
    0x22c55e,
    0.72
  );
  addLevelExitGate(ctx, 'l4_exit', 'DEPART FOR THE IRON FACTORY (LEVEL 05)', 0, -96, 2);

  addPickup(ctx, 'l4_lore_1', 'lore', 'READ SITE EVACUATION ADVISORY', 4, 0.5, 12, 0x60a5fa, {
    loreId: 'doc_deadcity_grid',
  });
  addPickup(ctx, 'l4_lore_2', 'lore', 'PLAY SITE SCOUT AUDIO LOG', 19, 0.5, -26, 0xf87171, {
    loreId: 'audio_deadcity_scout',
  });
  addPickup(ctx, 'l4_lore_3', 'lore', 'READ STRUCTURAL SITE LEDGER', -20, 0.5, -36, 0x60a5fa, {
    loreId: 'doc_deadcity_garage',
  });
  addPickup(ctx, 'l4_med_1', 'medkit', 'COLLECT SITE FIRST-AID KIT (+35 HP)', 16, 0.35, -42, 0x22c55e);
  addPickup(ctx, 'l4_ammo_1', 'ammo', 'COLLECT HEAVY AMMO CRATE', -16, 0.35, -28, 0xf59e0b);
  addPickup(ctx, 'l4_bat_1', 'battery', 'COLLECT OPTIC BATTERY', 0, 0.35, -60, 0x38bdf8);

  // Bonus vertical exploration supplies atop the elevated walkable scaffolding decks!
  addPickup(ctx, 'l4_upper_med', 'medkit', 'COLLECT SCAFFOLD MEDKIT (+35 HP)', -10.0, SCAF_Y + 0.35, -39.5, 0x22c55e);
  addPickup(ctx, 'l4_upper_ammo', 'ammo', 'COLLECT SCAFFOLD AMMO', 10.0, SCAF_Y + 0.35, -39.5, 0xf59e0b);

  // Preserved construction site fires (burning fuel drum / wrecked generator debris)
  addFireSpot(ctx, 'l4_fire_1', -5, 1.0, 8, 1.0);
  addFireSpot(ctx, 'l4_fire_2', 7, 1.0, -64, 1.1);

  // Localized industrial work lights (controlled intensity, zero color-wash!)
  const siteWorkLights: [number, number, number, number, number, number, boolean][] = [
    [0, 6.2, 13.0, 0xdbe8f8, 6.5, 26, false],
    [20, 5.0, -24.0, 0x9ec8f5, 5.5, 22, false],
    [-20, 5.0, -32.0, 0xf2c98a, 5.2, 22, true],
    [-20, 5.8, -68.0, 0x7dd3fc, 5.8, 22, false],
    [18, 6.0, -74.0, 0xf5c97a, 5.8, 22, true],
  ];
  siteWorkLights.forEach(([lx, ly, lz, col, inten, dist, flick], idx) => {
    const scaledInten = inten * 0.65;
    const pt = new THREE.PointLight(col, scaledInten, dist, 1.65);
    pt.position.set(lx, ly, lz);
    scene.add(pt);
    if (flick) {
      ctx.flickerLights.push({ light: pt, base: scaledInten, speed: 3.4 + idx * 1.5 });
    }
  });

  // Exact Preserved Enemy Spawns (including THE HUNTER patrolling construction corridors & North Plaza!)
  ctx.enemySpawns.push(
    { id: 'l4_stalker_1', type: 'stalker', position: new THREE.Vector3(-4, 0, -8), patrolTarget: new THREE.Vector3(6, 0, -14), initiallyActive: true },
    { id: 'l4_hunter_1', type: 'hunter', position: new THREE.Vector3(-20, 0, -28), patrolTarget: new THREE.Vector3(-18, 0, -52), initiallyActive: true },
    { id: 'l4_screamer_1', type: 'screamer', position: new THREE.Vector3(19, 0, -22), patrolTarget: new THREE.Vector3(16, 0, -40), initiallyActive: true },
    { id: 'l4_scrapper_1', type: 'scrapper', position: new THREE.Vector3(4, 0, -48), patrolTarget: new THREE.Vector3(-6, 0, -44), initiallyActive: true },
    { id: 'l4_hunter_2', type: 'hunter', position: new THREE.Vector3(10, 0, -78), patrolTarget: new THREE.Vector3(-12, 0, -78), initiallyActive: true }
  );

  // ==========================================================================
  // 10. PER-FRAME CONSTRUCTION SITE ANIMATION (SWAYING CRANES, BEACONS, HOLOGRAM, DUST)
  // ==========================================================================
  ctx.onUpdate = (dt: number, elapsed: number) => {
    // Wind swaying crane booms & suspended steel I-beams / concrete wall panels
    for (let i = 0; i < animatedCranes.length; i++) {
      const c = animatedCranes[i];
      c.jibGroup.rotation.y = c.baseYaw + Math.sin(elapsed * 0.14 + c.phase) * 0.08;
      c.loadGroup.rotation.z = Math.sin(elapsed * 0.85 + c.phase) * 0.045;
      c.loadGroup.rotation.x = Math.cos(elapsed * 0.62 + c.phase) * 0.025;
    }

    // Blinking red/amber aviation beacons atop tower cranes & comms tower
    for (let i = 0; i < aviationBeacons.length; i++) {
      const b = aviationBeacons[i];
      const on = Math.sin(elapsed * 2.4 + b.phase) > 0.15;
      b.mat.color.setHex(on ? 0xef4444 : 0x3b0d0d);
    }

    // Slowly rotating 3D Holographic Megacity Blueprint on site office table
    holoCityGrp.rotation.y += dt * 0.42;
    bpScreenMat.emissiveIntensity =
      Math.sin(elapsed * 19.0) > 0.92 ? 0.35 : 0.85 + 0.12 * Math.sin(elapsed * 3.1);

    // Windblown airborne construction dust
    const pos = dustGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dustCount; i++) {
      let dx = pos.getX(i) + dt * 0.55;
      let dy = pos.getY(i) + Math.sin(elapsed * 0.7 + i) * dt * 0.14;
      if (dx > 34) dx = -34;
      if (dy < 0.4) dy = 16.0;
      if (dy > 18.5) dy = 1.0;
      pos.setXY(i, dx, dy);
    }
    pos.needsUpdate = true;
  };

  // Black & Blood-Red Alien Fungus — waterlogged excavation soil, decaying timber formwork & shaded sub-basements
  addAlienFungusColonies(
    ctx,
    [
      { id: 'l4_fungus_formwork', kind: 'small', x: -22.5, y: 0.01, z: -14.5, scale: 1.05, substrate: 'decaying_wood', seed: 401 },
      { id: 'l4_fungus_pit', kind: 'large', x: -24.0, y: 0.01, z: -56.0, scale: 1.1, substrate: 'damp_soil', seed: 402 },
      { id: 'l4_fungus_spread', kind: 'spreading', x: 26.5, y: 0.01, z: -44.0, scale: 1.0, substrate: 'damp_soil', seed: 403 },
      { id: 'l4_fungus_mature', kind: 'mature', x: 25.5, y: 0.01, z: -82.0, scale: 0.95, substrate: 'decaying_wood', seed: 404 },
    ],
    4044
  );
  addPickup(ctx, 'l4_lore_fungus', 'lore', 'INSPECT SUB-BASEMENT FUNGAL COLONY', -21.8, 0.45, -55.2, 0x991b1b, {
    loreId: 'doc_fungus_construction_pit',
  });

  return finalizeLevelWorld(ctx, new THREE.Vector3(0, 0, 19), 0);
}
