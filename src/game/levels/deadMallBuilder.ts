import * as THREE from 'three';
import { ProceduralTextureSet } from '../textures';
import { BuiltWorld } from '../worldBuilder';
import {
  addAlienFungusColonies,
  addConsoleInteractable,
  addDestructibleBarricade,
  addDynamicDoor,
  addFloorDecal,
  addInstancedGrassTufts,
  addLevelExitGate,
  addPerimeterWalls,
  addPickup,
  addPipeConduit,
  addRoadsideTree,
  addRotatedBoxCollider,
  addSaveAndWorkbench,
  addSolidBox,
  addVolumetricCone,
  addWallXWithDoor,
  addWallZWithDoor,
  addClimbingVines,
  createLevelContext,
  finalizeLevelWorld,
  LevelBuildContext,
  makeTiledMat,
} from './levelShared';

// ============================================================================
// PROCEDURAL CANVAS TEXTURES FOR AETHELION GRAND GALLERIA (3059 AD)
// ============================================================================

function makeCanvasTex(
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
  opts?: { repeatX?: number; repeatY?: number; isColor?: boolean }
): THREE.Texture {
  if (typeof document === 'undefined') {
    const dt = new THREE.DataTexture(new Uint8Array([185, 180, 172, 255]), 1, 1);
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

function createTerrazzoFloorTextures(ctx: LevelBuildContext): {
  map: THREE.Texture;
  roughnessMap: THREE.Texture;
} {
  const map = makeCanvasTex(
    512,
    512,
    (g, w, h) => {
      // Aged warm limestone-terrazzo base (decades of dust & foot traffic)
      g.fillStyle = '#9b9589';
      g.fillRect(0, 0, w, h);

      // Subtle tile checkerboard tonal variation (4x4 large architectural slabs)
      const tiles = 4;
      const ts = w / tiles;
      for (let ty = 0; ty < tiles; ty++) {
        for (let tx = 0; tx < tiles; tx++) {
          const shade = ((tx + ty) % 2 === 0 ? 4 : -5) + (((tx * 17 + ty * 31) % 9) - 4);
          const r = 152 + shade;
          const gr = 146 + shade;
          const b = 135 + shade;
          g.fillStyle = `rgb(${r},${gr},${b})`;
          g.fillRect(tx * ts + 2, ty * ts + 2, ts - 4, ts - 4);
        }
      }

      // Terrazzo mineral aggregate chips (warm ochre, charcoal, ivory, quartz)
      const chipColors = ['#d6cfc2', '#64615b', '#b8ab96', '#4a4d52', '#c8c2b4', '#7e7668'];
      let seed = 1337;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      for (let i = 0; i < 2400; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const s = 1.5 + rnd() * 3.8;
        g.fillStyle = chipColors[Math.floor(rnd() * chipColors.length)];
        g.fillRect(x, y, s, s * (0.6 + rnd() * 0.7));
      }

      // Dark grout lines & recessed tarnished brass mall inlay strips
      g.strokeStyle = 'rgba(42, 40, 38, 0.75)';
      g.lineWidth = 3;
      for (let i = 0; i <= tiles; i++) {
        const p = i * ts;
        g.beginPath();
        g.moveTo(p, 0);
        g.lineTo(p, h);
        g.stroke();
        g.beginPath();
        g.moveTo(0, p);
        g.lineTo(w, p);
        g.stroke();
      }
      // Subtle brass accent border on major seam
      g.strokeStyle = 'rgba(148, 125, 78, 0.45)';
      g.lineWidth = 2;
      g.strokeRect(4, 4, w - 8, h - 8);

      // Grime, dust patches & hairline cracks from centuries of abandonment
      for (let i = 0; i < 16; i++) {
        const cx = rnd() * w;
        const cy = rnd() * h;
        const rad = 24 + rnd() * 56;
        const grad = g.createRadialGradient(cx, cy, 4, cx, cy, rad);
        grad.addColorStop(0, 'rgba(54, 49, 42, 0.24)');
        grad.addColorStop(1, 'rgba(54, 49, 42, 0)');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(cx, cy, rad, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = 'rgba(32, 30, 28, 0.55)';
      g.lineWidth = 1.4;
      for (let c = 0; c < 8; c++) {
        let px = rnd() * w;
        let py = rnd() * h;
        g.beginPath();
        g.moveTo(px, py);
        for (let s = 0; s < 5; s++) {
          px += (rnd() - 0.5) * 44;
          py += (rnd() - 0.5) * 44;
          g.lineTo(px, py);
        }
        g.stroke();
      }
    },
    { repeatX: 14, repeatY: 28, isColor: true }
  );

  const roughnessMap = makeCanvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#d4d4d4'; // Dusty abandoned terrazzo stone (matte with slight worn sheen)
      g.fillRect(0, 0, w, h);
      let seed = 4201;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      for (let i = 0; i < 36; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const rad = 12 + rnd() * 34;
        const v = Math.floor(195 + rnd() * 55);
        g.fillStyle = `rgba(${v},${v},${v},0.42)`;
        g.beginPath();
        g.arc(x, y, rad, 0, Math.PI * 2);
        g.fill();
      }
      // Subtle matte grout seams matching 4x4 slabs
      g.strokeStyle = '#f0f0f0';
      g.lineWidth = 2;
      const ts = w / 4;
      for (let i = 0; i <= 4; i++) {
        const p = i * ts;
        g.beginPath();
        g.moveTo(p, 0);
        g.lineTo(p, h);
        g.stroke();
        g.beginPath();
        g.moveTo(0, p);
        g.lineTo(w, p);
        g.stroke();
      }
    },
    { repeatX: 14, repeatY: 28, isColor: false }
  );

  ctx.disposeables.push(map, roughnessMap);
  return { map, roughnessMap };
}

function createMallPlasterWallTexture(ctx: LevelBuildContext): THREE.Texture {
  const tex = makeCanvasTex(
    512,
    512,
    (g, w, h) => {
      // Architectural warm-grey travertine/stucco mall paneling
      g.fillStyle = '#8b877f';
      g.fillRect(0, 0, w, h);

      // Vertical architectural panel seams
      for (let x = 0; x < w; x += 64) {
        g.fillStyle = x % 128 === 0 ? 'rgba(255,250,240,0.06)' : 'rgba(25,25,28,0.06)';
        g.fillRect(x, 0, 64, h);
        g.fillStyle = 'rgba(30, 32, 36, 0.45)';
        g.fillRect(x, 0, 2, h);
      }
      // Horizontal floor-slab banding
      g.fillStyle = 'rgba(42, 46, 52, 0.35)';
      g.fillRect(0, h - 42, w, 42);
      g.fillRect(0, 0, w, 24);

      // Water seepage streaks from leaking roof/skylights
      let seed = 9187;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      for (let i = 0; i < 42; i++) {
        const sx = rnd() * w;
        const sh = 60 + rnd() * 240;
        const sw = 4 + rnd() * 14;
        const grad = g.createLinearGradient(sx, 0, sx, sh);
        grad.addColorStop(0, 'rgba(38, 42, 36, 0.34)');
        grad.addColorStop(1, 'rgba(38, 42, 36, 0)');
        g.fillStyle = grad;
        g.fillRect(sx, 0, sw, sh);
      }
      // Subtle plaster speckle
      for (let i = 0; i < 1200; i++) {
        g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(20,20,20,0.07)';
        g.fillRect(rnd() * w, rnd() * h, 2, 2);
      }
    },
    { repeatX: 6, repeatY: 2, isColor: true }
  );
  ctx.disposeables.push(tex);
  return tex;
}

function createStoreSignTexture(
  ctx: LevelBuildContext,
  title: string,
  subtitle: string,
  accentHex: string,
  bgHex = '#101620',
  damaged = false
): THREE.Texture {
  const tex = makeCanvasTex(
    512,
    128,
    (g, w, h) => {
      g.fillStyle = bgHex;
      g.fillRect(0, 0, w, h);

      // Brushed metal trim frame
      g.strokeStyle = accentHex;
      g.lineWidth = 6;
      g.strokeRect(5, 5, w - 10, h - 10);

      // Subtle scanline / futuristic fascia bar
      g.fillStyle = 'rgba(255,255,255,0.04)';
      for (let y = 10; y < h - 10; y += 6) {
        g.fillRect(10, y, w - 20, 2);
      }

      // Main brand title
      g.fillStyle = accentHex;
      g.font = 'bold 42px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(title, w * 0.5, 52);

      // Subtitle
      g.fillStyle = '#d8dee9';
      g.font = '600 18px monospace';
      g.fillText(subtitle, w * 0.5, 96);

      if (damaged) {
        // Burned-out dead letters / grime smear on part of sign
        g.fillStyle = 'rgba(10, 12, 16, 0.72)';
        g.fillRect(w * 0.62, 14, w * 0.24, h - 28);
        g.strokeStyle = 'rgba(15, 18, 22, 0.9)';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(w * 0.62, 12);
        g.lineTo(w * 0.71, h * 0.55);
        g.lineTo(w * 0.66, h - 12);
        g.stroke();
      }
    },
    { repeatX: 1, repeatY: 1, isColor: true }
  );
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  ctx.disposeables.push(tex);
  return tex;
}

function createHoloAdTexture(
  ctx: LevelBuildContext,
  headline: string,
  subline: string,
  accentHex: string
): THREE.Texture {
  const tex = makeCanvasTex(
    512,
    256,
    (g, w, h) => {
      g.fillStyle = '#07131f';
      g.fillRect(0, 0, w, h);

      // Holographic scanlines & diagonal grid
      g.fillStyle = 'rgba(180, 235, 255, 0.08)';
      for (let y = 0; y < h; y += 6) {
        g.fillRect(0, y, w, 2);
      }

      // Outer border
      g.strokeStyle = accentHex;
      g.lineWidth = 8;
      g.strokeRect(10, 10, w - 20, h - 20);

      // Futuristic geometric emblem
      g.strokeStyle = accentHex;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(84, h * 0.5, 42, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(84, h * 0.5, 24, 0.4, Math.PI * 1.7);
      g.stroke();

      g.fillStyle = accentHex;
      g.font = 'bold 40px sans-serif';
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(headline, 148, 96);

      g.fillStyle = '#e2f1ff';
      g.font = '600 21px monospace';
      g.fillText(subline, 148, 152);

      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.font = '14px monospace';
      g.fillText('AETHELION GALLERIA // EST. 3041 // SECTOR 03', 148, 206);

      // Glitch tear bar across hologram
      g.fillStyle = 'rgba(255, 255, 255, 0.18)';
      g.fillRect(0, 118, w, 7);
      g.fillStyle = 'rgba(0, 0, 0, 0.55)';
      g.fillRect(0, 125, w, 5);
    },
    { repeatX: 1, repeatY: 1, isColor: true }
  );
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  ctx.disposeables.push(tex);
  return tex;
}

function createMallDirectoryTexture(ctx: LevelBuildContext): THREE.Texture {
  const tex = makeCanvasTex(
    512,
    512,
    (g, w, h) => {
      g.fillStyle = '#0c1624';
      g.fillRect(0, 0, w, h);

      g.strokeStyle = '#38bdf8';
      g.lineWidth = 6;
      g.strokeRect(10, 10, w - 20, h - 20);

      g.fillStyle = '#38bdf8';
      g.font = 'bold 28px sans-serif';
      g.textAlign = 'center';
      g.fillText('AETHELION GRAND GALLERIA', w * 0.5, 52);
      g.fillStyle = '#94a3b8';
      g.font = '16px monospace';
      g.fillText('DIRECTORY // LEVEL 1 - 3 // YEAR 3059', w * 0.5, 82);

      // Stylized architectural floor plan diagram
      g.strokeStyle = '#64748b';
      g.lineWidth = 3;
      g.strokeRect(56, 110, 120, 220); // West shops
      g.strokeRect(336, 110, 120, 220); // East shops
      g.strokeStyle = '#38bdf8';
      g.strokeRect(184, 110, 144, 220); // Central atrium
      g.beginPath();
      g.arc(256, 220, 32, 0, Math.PI * 2); // Fountain
      g.stroke();

      // You are here marker
      g.fillStyle = '#ef4444';
      g.beginPath();
      g.arc(256, 314, 9, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#e2e8f0';
      g.font = '15px monospace';
      g.textAlign = 'left';
      g.fillText('W: VELOUR • SYNAPSE TECH • WONDERBOTS', 36, 376);
      g.fillText('E: SOLARIS LUXE • HYPER-MART • FOOD COURT', 36, 408);
      g.fillText('L2: APEX GALLERIA • NEON ARCADE • BISTRO', 36, 440);
      g.fillStyle = '#f59e0b';
      g.fillText('N: SECURITY LOADING BAY & ROOFTOP LIFT', 36, 472);
    },
    { repeatX: 1, repeatY: 1, isColor: true }
  );
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  ctx.disposeables.push(tex);
  return tex;
}

// ============================================================================
// COMPOSITE MALL PROPS (HERO OBJECTS WITH GROUND PIVOTS & MATCHING COLLIDERS)
// ============================================================================

interface MallMaterials {
  terrazzo: THREE.MeshStandardMaterial;
  plasterWall: THREE.MeshStandardMaterial;
  warmMarble: THREE.MeshStandardMaterial;
  darkBronze: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  darkSteel: THREE.MeshStandardMaterial;
  rustedShutter: THREE.MeshStandardMaterial;
  woodWarm: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  velvetBurgundy: THREE.MeshStandardMaterial;
  velvetNavy: THREE.MeshStandardMaterial;
  crackedGlass: THREE.MeshStandardMaterial;
  clearGlass: THREE.MeshStandardMaterial;
  dirtyConcrete: THREE.MeshStandardMaterial;
  infectedTendril: THREE.MeshStandardMaterial;
  mossMat: THREE.MeshStandardMaterial;
  foliageGreen: THREE.MeshStandardMaterial;
  foliageLight: THREE.MeshStandardMaterial;
  hazardMat: THREE.MeshStandardMaterial;
}

function addSignBoard(
  ctx: LevelBuildContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  rotY: number,
  title: string,
  subtitle: string,
  accentHex: string,
  bgHex: string,
  emissiveHex: number,
  flickerList: { mat: THREE.MeshStandardMaterial; base: number; phase: number; broken: boolean }[],
  opts?: { broken?: boolean; tiltZ?: number; emissiveIntensity?: number }
): THREE.Mesh {
  const tex = createStoreSignTexture(ctx, title, subtitle, accentHex, bgHex, opts?.broken);
  const backingMat = new THREE.MeshStandardMaterial({
    color: 0x161b24,
    metalness: 0.78,
    roughness: 0.38,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: emissiveHex,
    emissiveMap: tex,
    emissiveIntensity: opts?.emissiveIntensity ?? 0.92,
    roughness: 0.3,
    metalness: 0.12,
  });
  ctx.disposeables.push(backingMat, faceMat);

  const grp = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.22), backingMat);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, h - 0.08), faceMat);
  face.position.z = 0.12;
  grp.add(housing, face);
  grp.position.set(x, y, z);
  grp.rotation.y = rotY;
  if (opts?.tiltZ) grp.rotation.z = opts.tiltZ;
  ctx.scene.add(grp);

  if (opts?.broken || (opts?.emissiveIntensity ?? 0.92) > 0.5) {
    flickerList.push({
      mat: faceMat,
      base: opts?.emissiveIntensity ?? 0.92,
      phase: x * 0.37 + z * 0.21,
      broken: Boolean(opts?.broken),
    });
  }
  return face;
}

function addShoppingCart(
  ctx: LevelBuildContext,
  mats: MallMaterials,
  x: number,
  z: number,
  rotY: number,
  tipped = false,
  withCollider = true
): void {
  const grp = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.92), mats.chrome);
  frame.position.y = 0.2;
  const basketBottom = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, 0.88), mats.chrome);
  basketBottom.position.y = 0.52;
  // Open wire-frame look using slim perimeter rails
  const sideGeo = new THREE.BoxGeometry(0.04, 0.36, 0.88);
  const sideL = new THREE.Mesh(sideGeo, mats.chrome);
  sideL.position.set(-0.31, 0.72, 0);
  const sideR = new THREE.Mesh(sideGeo, mats.chrome);
  sideR.position.set(0.31, 0.72, 0);
  const front = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.36, 0.04), mats.chrome);
  front.position.set(0, 0.72, -0.43);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.42, 0.04), mats.chrome);
  back.position.set(0, 0.74, 0.43);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.66, 8), mats.velvetBurgundy);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 0.98, 0.48);

  // 4 caster legs + wheels
  const legGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.36, 6);
  const wheelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8);
  [
    [-0.26, -0.34],
    [0.26, -0.34],
    [-0.26, 0.34],
    [0.26, 0.34],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, mats.darkSteel);
    leg.position.set(lx, 0.34, lz);
    const wheel = new THREE.Mesh(wheelGeo, mats.darkSteel);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(lx, 0.06, lz);
    grp.add(leg, wheel);
  });

  grp.add(frame, basketBottom, sideL, sideR, front, back, handle);
  grp.position.set(x, tipped ? 0.34 : 0, z);
  grp.rotation.y = rotY;
  if (tipped) grp.rotation.z = Math.PI * 0.47;
  ctx.scene.add(grp);

  if (withCollider) {
    addRotatedBoxCollider(ctx.colliders, x, z, rotY, 0, 0, 0.78, 1.04, 0, 1.0, 'mall_cart');
  }
}

function addMannequin(
  ctx: LevelBuildContext,
  mats: MallMaterials,
  x: number,
  y: number,
  z: number,
  rotY: number,
  accentColor: number,
  broken = false
): void {
  const grp = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd6d3cb,
    roughness: 0.48,
    metalness: 0.06,
  });
  const outfitMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.84,
    metalness: 0.04,
  });
  ctx.disposeables.push(bodyMat, outfitMat);

  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.06, 12), mats.darkBronze);
  stand.position.y = 0.03;
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.82, 8), bodyMat);
  legL.position.set(-0.09, 0.44, 0);
  const legR = legL.clone();
  legR.position.x = 0.09;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.58, 10), outfitMat);
  torso.position.y = 1.12;
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.52, 6), outfitMat);
  armL.position.set(-0.24, 1.08, 0);
  armL.rotation.z = 0.18;
  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.52, 6), outfitMat);
  armR.position.set(0.24, 1.08, 0);
  armR.rotation.z = -0.22;

  grp.add(stand, legL, legR, torso, armL, armR);
  if (!broken) {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 10), bodyMat);
    head.position.y = 1.54;
    grp.add(head);
  }
  grp.position.set(x, y, z);
  grp.rotation.y = rotY;
  if (broken) {
    grp.rotation.x = 0.24;
    grp.rotation.z = -0.18;
  }
  ctx.scene.add(grp);
}

function addInactiveServiceRobot(
  ctx: LevelBuildContext,
  mats: MallMaterials,
  x: number,
  z: number,
  rotY: number,
  infected = false
): void {
  const grp = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({
    color: infected ? 0x3b2f35 : 0xcbd5e1,
    roughness: 0.42,
    metalness: 0.55,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: infected ? 0xef4444 : 0x0ea5e9,
    emissive: infected ? 0x991b1b : 0x0284c7,
    emissiveIntensity: infected ? 1.1 : 0.4,
    roughness: 0.2,
  });
  ctx.disposeables.push(shellMat, visorMat);

  // Wheeled dome base + torso + slumped sensor head
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.34, 12), mats.darkSteel);
  base.position.y = 0.17;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.62, 12), shellMat);
  body.position.y = 0.65;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), shellMat);
  head.position.set(0.06, 1.08, 0.04);
  head.rotation.z = -0.28;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.16), visorMat);
  visor.position.set(0.06, 1.1, 0.2);
  visor.rotation.z = -0.28;
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.05, 0.34), mats.chrome);
  tray.position.set(0, 0.74, 0.3);
  grp.add(base, body, head, visor, tray);

  if (infected) {
    // THEY metallic tendrils visibly wrapping ONLY the metal robot chassis
    const tendril = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.45, 0.05, 0.2),
          new THREE.Vector3(-0.22, 0.48, 0.28),
          new THREE.Vector3(0.25, 0.85, 0.14),
          new THREE.Vector3(0.14, 1.24, -0.05),
        ]),
        12,
        0.055,
        6,
        false
      ),
      mats.infectedTendril
    );
    grp.add(tendril);
  }

  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);
  ctx.colliders.push({
    minX: x - 0.44,
    maxX: x + 0.44,
    minY: 0,
    maxY: 1.35,
    minZ: z - 0.44,
    maxZ: z + 0.44,
    tag: 'mall_robot',
  });
}

function addMallBench(
  ctx: LevelBuildContext,
  mats: MallMaterials,
  x: number,
  y: number,
  z: number,
  rotY: number,
  overturned = false,
  withCollider = true
): void {
  const grp = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.62), mats.woodWarm);
  seat.position.y = 0.46;
  seat.castShadow = true;
  seat.receiveShadow = true;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.56), mats.darkBronze);
  legL.position.set(-0.96, 0.22, 0);
  const legR = legL.clone();
  legR.position.x = 0.96;
  const planterEnd = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.66), mats.warmMarble);
  planterEnd.position.set(0, 0.24, 0);
  grp.add(seat, legL, legR, planterEnd);

  grp.position.set(x, overturned ? y + 0.3 : y, z);
  grp.rotation.y = rotY;
  if (overturned) grp.rotation.x = 1.22;
  ctx.scene.add(grp);

  if (withCollider) {
    addRotatedBoxCollider(ctx.colliders, x, z, rotY, 0, 0, 2.45, 0.72, y, y + 0.7, 'mall_bench');
  }
}

function addMallPlanter(
  ctx: LevelBuildContext,
  mats: MallMaterials,
  x: number,
  y: number,
  z: number,
  w = 2.0,
  d = 1.4,
  withCollider = true
): void {
  const grp = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, 0.55, d), mats.warmMarble);
  box.position.y = 0.275;
  box.castShadow = true;
  box.receiveShadow = true;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.08, d + 0.14), mats.darkBronze);
  trim.position.y = 0.56;
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.2, 0.08, d - 0.2),
    mats.dirtyConcrete
  );
  soil.position.y = 0.52;
  grp.add(box, trim, soil);

  // Overgrown natural healthy green ferns & shrubs (uninfected!)
  for (let i = 0; i < 5; i++) {
    const lx = ((i % 3) - 1) * (w * 0.26);
    const lz = (Math.floor(i / 3) - 0.5) * (d * 0.28);
    const bush = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.32 + (i % 2) * 0.12, 1),
      i % 2 === 0 ? mats.foliageGreen : mats.foliageLight
    );
    bush.position.set(lx, 0.76 + (i % 2) * 0.12, lz);
    bush.scale.set(1.2, 0.85, 1.1);
    grp.add(bush);
  }

  grp.position.set(x, y, z);
  ctx.scene.add(grp);

  if (withCollider) {
    ctx.colliders.push({
      minX: x - w * 0.52,
      maxX: x + w * 0.52,
      minY: y,
      maxY: y + 0.75,
      minZ: z - d * 0.52,
      maxZ: z + d * 0.52,
      tag: 'mall_planter',
    });
  }
}

function addFoodCourtTable(
  ctx: LevelBuildContext,
  mats: MallMaterials,
  x: number,
  z: number,
  rotY: number,
  overturned = false
): void {
  const grp = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({ color: 0xd9d4c7, roughness: 0.42, metalness: 0.08 });
  const chairMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.55, metalness: 0.12 });
  ctx.disposeables.push(topMat, chairMat);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.06, 12), topMat);
  tableTop.position.y = 0.78;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.76, 8), mats.chrome);
  stem.position.y = 0.38;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.06, 10), mats.darkSteel);
  foot.position.y = 0.03;
  grp.add(tableTop, stem, foot);

  // 2 accompanying molded chairs
  [
    [-0.95, 0.15, 0.25],
    [0.92, -0.25, -0.8],
  ].forEach(([cx, cz, cr], idx) => {
    const ch = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.44), chairMat);
    seat.position.y = 0.44;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.06), chairMat);
    back.position.set(0, 0.66, -0.2);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.44, 6), mats.chrome);
    leg.position.y = 0.22;
    ch.add(seat, back, leg);
    ch.position.set(cx, idx === 1 && overturned ? 0.22 : 0, cz);
    ch.rotation.y = cr;
    if (idx === 1 && overturned) ch.rotation.z = 1.48;
    grp.add(ch);
  });

  if (overturned) {
    tableTop.position.set(0.3, 0.68, 0);
    tableTop.rotation.z = 1.42;
    stem.rotation.z = 1.42;
    stem.position.set(-0.08, 0.42, 0);
  }
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);

  ctx.colliders.push({
    minX: x - 0.75,
    maxX: x + 0.75,
    minY: 0,
    maxY: 0.9,
    minZ: z - 0.75,
    maxZ: z + 0.75,
    tag: 'food_table',
  });
}

function addSecurityCamera(
  ctx: LevelBuildContext,
  mats: MallMaterials,
  x: number,
  y: number,
  z: number,
  rotY: number,
  activeRed = true
): void {
  const grp = new THREE.Group();
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.35), mats.darkSteel);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.42), mats.chrome);
  body.position.set(0, -0.06, 0.24);
  body.rotation.x = 0.32;
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 6, 6),
    new THREE.MeshBasicMaterial({ color: activeRed ? 0xef4444 : 0x334155 })
  );
  led.position.set(0.06, -0.1, 0.46);
  grp.add(mount, body, led);
  grp.position.set(x, y, z);
  grp.rotation.y = rotY;
  ctx.scene.add(grp);
}

/**
 * Custom walkable mall escalator connecting Ground Floor (y=0) smoothly to the 2nd-Floor Balcony (y=4.8).
 * Deliberately leaves the top exit OPEN so players walk directly onto the upper mezzanine promenade!
 */
function addWalkableMallEscalator(
  ctx: LevelBuildContext,
  mats: MallMaterials,
  x: number,
  zBottom: number,
  zTop: number,
  yTop: number,
  escalatorSpeed = 0,
  id = 'mall_escalator'
): void {
  const span = Math.abs(zTop - zBottom);
  const cz = (zBottom + zTop) * 0.5;
  const width = 1.9;
  const trussLen = Math.hypot(span, yTop);
  const dirZ = zTop < zBottom ? -1 : 1; // -1 means ascending toward -Z
  const ang = Math.atan2(yTop, span) * -dirZ;

  const grp = new THREE.Group();
  const treadMat = makeTiledMat(ctx, {
    map: ctx.textures.grateMap,
    normalMap: ctx.textures.grateNormal,
    repeatX: 1,
    repeatY: 6,
    color: 0x334155,
    metalness: 0.82,
    roughness: 0.42,
  });
  const hazYellow = new THREE.MeshBasicMaterial({ color: 0xeab308 });
  ctx.disposeables.push(hazYellow);

  // Structural steel truss under-carriage
  const truss = new THREE.Mesh(new THREE.BoxGeometry(width, 0.48, trussLen), mats.darkBronze);
  truss.position.set(0, yTop * 0.5 - 0.18, 0);
  truss.rotation.x = ang;
  truss.castShadow = true;
  truss.receiveShadow = true;
  grp.add(truss);

  // Ribbed aluminum escalator steps with yellow safety comb lines
  const stepCount = 16;
  for (let i = 0; i < stepCount; i++) {
    const t = i / (stepCount - 1);
    const sy = t * (yTop - 0.18) + 0.12;
    const sz = THREE.MathUtils.lerp(zBottom - cz, zTop - cz, t);
    const step = new THREE.Mesh(new THREE.BoxGeometry(width - 0.24, 0.24, 0.64), treadMat);
    step.position.set(0, sy, sz);
    step.receiveShadow = true;
    const edge = new THREE.Mesh(new THREE.BoxGeometry(width - 0.26, 0.03, 0.06), hazYellow);
    edge.position.set(0, sy + 0.13, sz + (dirZ < 0 ? 0.28 : -0.28));
    grp.add(step, edge);
  }

  // Tempered cracked glass balustrades & black rubber handrails on both sides
  [-width * 0.5, width * 0.5].forEach((gx) => {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, trussLen), mats.crackedGlass);
    glass.position.set(gx, yTop * 0.5 + 0.52, 0);
    glass.rotation.x = ang;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, trussLen + 0.4), mats.darkSteel);
    rail.position.set(gx, yTop * 0.5 + 1.02, 0);
    rail.rotation.x = ang;
    grp.add(glass, rail);
  });

  // Top & bottom stainless entry comb plates
  const botPlate = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.9), mats.chrome);
  botPlate.position.set(0, 0.04, zBottom - cz - dirZ * 0.4);
  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, 0.9), mats.chrome);
  topPlate.position.set(0, yTop - 0.04, zTop - cz + dirZ * 0.4);
  grp.add(botPlate, topPlate);

  grp.position.set(x, 0, cz);
  ctx.scene.add(grp);

  // Side balustrade colliders (aligned along the escalator walls, keeping entry & top open)
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
      tag: 'mall_escalator_rail',
    });
  });

  // Smooth walkable incline RampZone (preserving existing escalator geometry)
  ctx.ramps.push({
    id,
    kind: 'escalator',
    stepCount,
    escalatorSpeed,
    broken: Math.abs(escalatorSpeed) < 0.01,
    minX: x - width * 0.44,
    maxX: x + width * 0.44,
    minZ: minZ - 0.4,
    maxZ: maxZ + 0.4,
    zStart: zBottom,
    zEnd: zTop,
    yStart: 0.0,
    yEnd: yTop,
  });
}

// ============================================================================
// MAIN DEAD MALL BUILDER (LEVEL 03 — AETHELION GRAND GALLERIA, 3059 AD)
// ============================================================================

export function buildDeadMallWorld(
  scene: THREE.Scene,
  textures: ProceduralTextureSet
): BuiltWorld {
  // Cool twilight overcast sky visible through shattered roof skylights (no orange wash!)
  const ctx = createLevelContext(scene, textures, 0x0a111c, 0x0d1521, 0.0135);

  // Balance existing default directional light for crisp skylight shadows across the 116m mall
  scene.children.forEach((child) => {
    if (child instanceof THREE.HemisphereLight) {
      child.color.setHex(0x7c97b8);
      child.groundColor.setHex(0x232026);
      child.intensity = 0.4;
    } else if (child instanceof THREE.DirectionalLight && child.castShadow) {
      child.color.setHex(0xdbe8f8);
      child.intensity = 0.6;
      child.position.set(16, 46, -18);
      child.shadow.camera.left = -46;
      child.shadow.camera.right = 46;
      child.shadow.camera.top = 64;
      child.shadow.camera.bottom = -64;
      child.shadow.camera.far = 150;
      child.shadow.camera.updateProjectionMatrix();
    }
  });

  const terrazzoTex = createTerrazzoFloorTextures(ctx);
  const plasterTex = createMallPlasterWallTexture(ctx);

  const mats: MallMaterials = {
    terrazzo: new THREE.MeshStandardMaterial({
      map: terrazzoTex.map,
      roughnessMap: terrazzoTex.roughnessMap,
      roughness: 0.84,
      metalness: 0.02,
      envMapIntensity: 0.3,
    }),
    plasterWall: new THREE.MeshStandardMaterial({
      map: plasterTex,
      normalMap: textures.concreteNormal,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.9,
      metalness: 0.02,
      envMapIntensity: 0.2,
    }),
    warmMarble: makeTiledMat(ctx, {
      map: textures.concreteMap,
      normalMap: textures.concreteNormal,
      repeatX: 3,
      repeatY: 2,
      color: 0xb9b0a1,
      roughness: 0.7,
      metalness: 0.03,
      envMapIntensity: 0.36,
      normalScale: 0.6,
    }),
    darkBronze: makeTiledMat(ctx, {
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0x3b3530,
      metalness: 0.72,
      roughness: 0.5,
      envMapIntensity: 0.52,
    }),
    chrome: makeTiledMat(ctx, {
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0x9aa4b2,
      metalness: 0.84,
      roughness: 0.32,
      envMapIntensity: 0.72,
    }),
    darkSteel: makeTiledMat(ctx, {
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0x222934,
      metalness: 0.74,
      roughness: 0.5,
      envMapIntensity: 0.5,
    }),
    rustedShutter: makeTiledMat(ctx, {
      map: textures.grateMap,
      normalMap: textures.grateNormal,
      repeatX: 4,
      repeatY: 2,
      color: 0x4b423c,
      metalness: 0.62,
      roughness: 0.74,
      envMapIntensity: 0.4,
    }),
    woodWarm: makeTiledMat(ctx, {
      map: textures.woodMap,
      normalMap: textures.woodNormal,
      roughnessMap: textures.woodRoughness,
      repeatX: 2,
      repeatY: 2,
      color: 0x8a6443,
      roughness: 0.86,
      metalness: 0.02,
      envMapIntensity: 0.22,
    }),
    woodDark: makeTiledMat(ctx, {
      map: textures.woodMap,
      normalMap: textures.woodNormal,
      repeatX: 2,
      repeatY: 2,
      color: 0x463529,
      roughness: 0.88,
      metalness: 0.02,
      envMapIntensity: 0.22,
    }),
    velvetBurgundy: new THREE.MeshStandardMaterial({
      color: 0x6b1d2f,
      roughness: 0.94,
      metalness: 0.01,
      envMapIntensity: 0.16,
    }),
    velvetNavy: new THREE.MeshStandardMaterial({
      color: 0x1b2b44,
      roughness: 0.92,
      metalness: 0.01,
      envMapIntensity: 0.16,
    }),
    crackedGlass: new THREE.MeshStandardMaterial({
      color: 0xb8d4e8,
      map: textures.glassCrackedMap,
      normalMap: textures.glassCrackedNormal,
      transparent: true,
      opacity: 0.34,
      roughness: 0.16,
      metalness: 0.1,
      envMapIntensity: 0.75,
      depthWrite: false,
    }),
    clearGlass: new THREE.MeshStandardMaterial({
      color: 0xa7c5db,
      transparent: true,
      opacity: 0.24,
      roughness: 0.14,
      metalness: 0.08,
      envMapIntensity: 0.75,
      depthWrite: false,
    }),
    dirtyConcrete: makeTiledMat(ctx, {
      map: textures.concreteMap,
      normalMap: textures.concreteNormal,
      roughnessMap: textures.concreteRoughness,
      repeatX: 8,
      repeatY: 6,
      color: 0x575b61,
      roughness: 0.94,
      metalness: 0.02,
      envMapIntensity: 0.22,
    }),
    infectedTendril: new THREE.MeshStandardMaterial({
      color: 0x5c1119,
      map: textures.infectedFleshMap,
      normalMap: textures.infectedFleshNormal,
      emissive: 0x8a1824,
      emissiveMap: textures.infectedEmissiveMap,
      emissiveIntensity: 0.85,
      roughness: 0.45,
      metalness: 0.62,
    }),
    mossMat: new THREE.MeshStandardMaterial({
      color: 0x3b632d,
      roughness: 0.92,
      metalness: 0.02,
    }),
    foliageGreen: new THREE.MeshStandardMaterial({
      color: 0x2f5f28,
      roughness: 0.88,
      metalness: 0.02,
    }),
    foliageLight: new THREE.MeshStandardMaterial({
      color: 0x457a36,
      roughness: 0.86,
      metalness: 0.02,
    }),
    hazardMat: new THREE.MeshStandardMaterial({
      map: textures.hazardStripeMap,
      roughness: 0.52,
      metalness: 0.35,
    }),
  };
  ctx.disposeables.push(
    mats.terrazzo,
    mats.plasterWall,
    mats.velvetBurgundy,
    mats.velvetNavy,
    mats.crackedGlass,
    mats.clearGlass,
    mats.infectedTendril,
    mats.mossMat,
    mats.foliageGreen,
    mats.foliageLight,
    mats.hazardMat
  );

  // Track flickering storefront signs & glitching holographic ads for per-frame animation
  const signFlickers: { mat: THREE.MeshStandardMaterial; base: number; phase: number; broken: boolean }[] = [];
  const holoSpinners: { obj: THREE.Object3D; speed: number }[] = [];
  const glitchScreens: { mat: THREE.MeshStandardMaterial; base: number; phase: number }[] = [];

  // ==========================================================================
  // 1. WATERTIGHT ARCHITECTURAL SHELL & SOARING 16.4m VAULTED SKYLIGHT ROOF
  // ==========================================================================
  const MALL_H = 16.4;

  // Main ground terrazzo slab covering entire playable footprint X[-30..30], Z[-96..24] (zero gaps!)
  const mainFloor = new THREE.Mesh(new THREE.PlaneGeometry(60, 122), mats.terrazzo);
  mainFloor.rotation.x = -Math.PI / 2;
  mainFloor.position.set(0, 0, -35);
  mainFloor.receiveShadow = true;
  scene.add(mainFloor);

  // Distinct flooring zones (slightly raised 0.012m overlays so no z-fighting)
  const addFloorZoneOverlay = (
    x: number,
    z: number,
    w: number,
    d: number,
    mat: THREE.Material
  ) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, 0.014, z);
    p.receiveShadow = true;
    scene.add(p);
  };
  // Cinema burgundy carpet, Cafe warm timber floor, Loading bay dirty concrete
  addFloorZoneOverlay(-19.5, 13.0, 15.6, 16.2, mats.velvetBurgundy);
  addFloorZoneOverlay(19.5, 13.0, 15.6, 16.2, mats.woodWarm);
  addFloorZoneOverlay(0, -80.0, 55.2, 27.6, mats.dirtyConcrete);

  // Acoustic surface zones (metal for loading bay & escalator areas; concrete/terrazzo default)
  ctx.surfaceZones.push(
    { minX: -28, maxX: 28, minZ: -94, maxZ: -66, surface: 'industrial' }
  );

  // Full 16.4m watertight perimeter walls (X = ±28, Z = -94, Z = +22)
  addPerimeterWalls(ctx, -28, 28, -94, 22, MALL_H, mats.plasterWall);

  // Entrance Concourse lower ceiling (Z: +22 to +4, Y = 7.4m) with damaged dropped ceiling panels
  const entranceCeil = new THREE.Mesh(new THREE.PlaneGeometry(56.4, 18.4), mats.dirtyConcrete);
  entranceCeil.rotation.x = Math.PI / 2;
  entranceCeil.position.set(0, 7.4, 13.0);
  scene.add(entranceCeil);

  // North Loading Bay industrial ceiling (Z: -66 to -94, Y = 7.4m)
  const northCeil = new THREE.Mesh(new THREE.PlaneGeometry(56.4, 28.6), mats.dirtyConcrete);
  northCeil.rotation.x = Math.PI / 2;
  northCeil.position.set(0, 7.4, -80.0);
  scene.add(northCeil);

  // Grand Atrium side roof decks (X: -28..-10 and X: +10..+28, Z: +4..-66, Y = 15.8m)
  [-19, 19].forEach((rx) => {
    const sideRoof = new THREE.Mesh(new THREE.BoxGeometry(18.6, 0.5, 70.6), mats.darkSteel);
    sideRoof.position.set(rx, 15.9, -31);
    scene.add(sideRoof);
  });

  // Grand Vaulted Central Skylight Frame (X: -10..+10, Z: +4..-66, Y = 15.8m..17.4m)
  // Arched roof trusses every 10m across the entire 56m mall width
  for (let z = 0; z >= -60; z -= 10) {
    const mainTruss = new THREE.Mesh(new THREE.BoxGeometry(55.4, 0.55, 0.55), mats.darkBronze);
    mainTruss.position.set(0, 15.5, z);
    scene.add(mainTruss);
    // Angled skylight roof rafters creating vaulted apex above X[-10..10]
    [-5.2, 5.2].forEach((sx) => {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.32, 0.34), mats.darkBronze);
      rafter.position.set(sx, 16.5, z);
      rafter.rotation.z = sx < 0 ? 0.16 : -0.16;
      scene.add(rafter);
    });
  }
  // Longitudinal skylight ridge & purlins
  [-10, -5, 0, 5, 10].forEach((px) => {
    const py = px === 0 ? 17.3 : Math.abs(px) === 5 ? 16.5 : 15.8;
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 70.4), mats.darkBronze);
    purlin.position.set(px, py, -31);
    scene.add(purlin);
  });

  // Skylight glass bays (some intact cracked panes, several SHATTERED OPEN to let daylight & weather in!)
  const skylightBays = [
    { z: -5, brokenL: false, brokenR: true },
    { z: -15, brokenL: true, brokenR: false },
    { z: -25, brokenL: false, brokenR: false },
    { z: -35, brokenL: true, brokenR: true },
    { z: -45, brokenL: true, brokenR: true }, // Wide open broken skylight directly above Central Fountain & Tree!
    { z: -55, brokenL: false, brokenR: true },
  ];
  skylightBays.forEach((bay) => {
    if (!bay.brokenL) {
      const paneL = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.08, 9.4), mats.crackedGlass);
      paneL.position.set(-5.0, 16.55, bay.z);
      paneL.rotation.z = 0.16;
      scene.add(paneL);
    }
    if (!bay.brokenR) {
      const paneR = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.08, 9.4), mats.crackedGlass);
      paneR.position.set(5.0, 16.55, bay.z);
      paneR.rotation.z = -0.16;
      scene.add(paneR);
    }
  });

  // Sky glow backing panel above the broken skylights (cool overcast 3059 sky)
  const skyPanelMat = new THREE.MeshBasicMaterial({ color: 0x24344d });
  ctx.disposeables.push(skyPanelMat);
  const skyBack = new THREE.Mesh(new THREE.PlaneGeometry(24, 72), skyPanelMat);
  skyBack.rotation.x = Math.PI / 2;
  skyBack.position.set(0, 17.8, -31);
  scene.add(skyBack);

  // Volumetric natural daylight shafts pouring down through the broken skylights!
  addVolumetricCone(ctx, 2.5, 16.2, -15, 0xbfd8f5, 4.2, 15.8, 0.042);
  addVolumetricCone(ctx, -1.5, 16.2, -38, 0xc7dff7, 4.8, 15.8, 0.048);
  addVolumetricCone(ctx, 0.0, 16.2, -50, 0xd4e6fa, 5.6, 15.8, 0.056);

  // ==========================================================================
  // 2. MULTI-LEVEL MALL BALCONIES (WALKABLE 2ND FLOOR Y=4.8m, VISUAL 3RD Y=9.8m)
  // ==========================================================================
  const L2_Y = 4.8;
  const L3_Y = 9.8;

  const addBalconySlabAndRail = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    y: number,
    walkable: boolean,
    railEdges: ('N' | 'S' | 'E' | 'W')[]
  ) => {
    const w = maxX - minX;
    const d = maxZ - minZ;
    const cx = (minX + maxX) * 0.5;
    const cz = (minZ + maxZ) * 0.5;

    // Structural floor slab + warm marble fascia edge
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.42, d), mats.warmMarble);
    slab.position.set(cx, y - 0.21, cz);
    slab.castShadow = true;
    slab.receiveShadow = true;
    scene.add(slab);

    // Underside plaster soffit trim
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.14, d + 0.08), mats.darkBronze);
    trim.position.set(cx, y - 0.38, cz);
    scene.add(trim);

    if (walkable) {
      ctx.ramps.push({
        kind: 'platform',
        floorLevel: y >= 4.0 ? 1 : 0,
        minX,
        maxX,
        minZ,
        maxZ,
        zStart: cz,
        zEnd: cz,
        yStart: y,
        yEnd: y,
      });
      // Floor slab collider blocks vertical ceiling clipping and 3D LOS between ground & 2nd floor
      if (y >= 3.5) {
        ctx.colliders.push({
          minX,
          maxX,
          minY: y - 0.42,
          maxY: y - 0.08,
          minZ,
          maxZ,
          tag: 'balcony_slab',
        });
      }
    }

    // Tempered glass balustrades + brushed steel handrails along atrium drop-off edges
    railEdges.forEach((edge) => {
      const isZEdge = edge === 'N' || edge === 'S';
      const rw = isZEdge ? w : 0.08;
      const rd = isZEdge ? 0.08 : d;
      const rx = edge === 'W' ? minX + 0.12 : edge === 'E' ? maxX - 0.12 : cx;
      const rz = edge === 'N' ? minZ + 0.12 : edge === 'S' ? maxZ - 0.12 : cz;

      const glass = new THREE.Mesh(new THREE.BoxGeometry(rw, 1.05, rd), mats.crackedGlass);
      glass.position.set(rx, y + 0.54, rz);
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(isZEdge ? w : 0.14, 0.08, isZEdge ? 0.14 : d),
        mats.chrome
      );
      rail.position.set(rx, y + 1.08, rz);
      scene.add(glass, rail);

      // Vertical steel balustrade posts every ~4m
      const span = isZEdge ? w : d;
      const count = Math.max(2, Math.floor(span / 4));
      for (let i = 0; i <= count; i++) {
        const t = i / count - 0.5;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.08, 0.08), mats.darkBronze);
        post.position.set(
          isZEdge ? rx + t * (w - 0.2) : rx,
          y + 0.54,
          isZEdge ? rz : rz + t * (d - 0.2)
        );
        scene.add(post);
      }

      if (walkable) {
        ctx.colliders.push({
          minX: rx - (isZEdge ? w * 0.5 : 0.16),
          maxX: rx + (isZEdge ? w * 0.5 : 0.16),
          minY: y,
          maxY: y + 1.25,
          minZ: rz - (isZEdge ? 0.16 : d * 0.5),
          maxZ: rz + (isZEdge ? 0.16 : d * 0.5),
          tag: 'balcony_railing',
        });
      }
    });
  };

  // --- 2ND FLOOR WALKABLE BALCONIES (Y = 4.8m) ---
  // West Balcony Promenade (X: -27.4..-10.8, Z: -65.5..+3.5) with opening at Z: -32..-35.5 for Escalator Landing!
  addBalconySlabAndRail(-27.4, -10.8, -65.5, 3.5, L2_Y, true, []);
  // Split East edge railing of West Balcony around escalator landing (Z = -35.5 to -32.0)
  addBalconySlabAndRail(-11.2, -10.8, -32.0, -0.8, L2_Y, false, ['E']);
  addBalconySlabAndRail(-11.2, -10.8, -61.0, -35.5, L2_Y, false, ['E']);
  // Add matching collider rails on West Balcony East edge (leaving landing opening -35.5..-32.0 and skybridge openings free!)
  ctx.colliders.push(
    { minX: -11.05, maxX: -10.75, minY: L2_Y, maxY: L2_Y + 1.25, minZ: -32.0, maxZ: -0.8, tag: 'balcony_railing' },
    { minX: -11.05, maxX: -10.75, minY: L2_Y, maxY: L2_Y + 1.25, minZ: -61.0, maxZ: -35.5, tag: 'balcony_railing' }
  );
  // West Escalator Top Landing Bridge connecting X=-9.2 escalator cleanly to West Balcony
  addBalconySlabAndRail(-10.8, -8.1, -35.5, -31.8, L2_Y, true, ['N', 'E']);

  // East Balcony Promenade (X: +10.8..+27.4, Z: -65.5..+3.5)
  addBalconySlabAndRail(10.8, 27.4, -65.5, 3.5, L2_Y, true, []);
  addBalconySlabAndRail(10.8, 11.2, -32.0, -0.8, L2_Y, false, ['W']);
  addBalconySlabAndRail(10.8, 11.2, -61.0, -35.5, L2_Y, false, ['W']);
  ctx.colliders.push(
    { minX: 10.75, maxX: 11.05, minY: L2_Y, maxY: L2_Y + 1.25, minZ: -32.0, maxZ: -0.8, tag: 'balcony_railing' },
    { minX: 10.75, maxX: 11.05, minY: L2_Y, maxY: L2_Y + 1.25, minZ: -61.0, maxZ: -35.5, tag: 'balcony_railing' }
  );
  // East Escalator Top Landing Bridge
  addBalconySlabAndRail(8.1, 10.8, -35.5, -31.8, L2_Y, true, ['N', 'W']);

  // South & North Mezzanine Skybridges connecting West & East 2nd-floor balconies!
  addBalconySlabAndRail(-10.8, 10.8, -0.8, 3.5, L2_Y, true, ['N', 'S']);
  addBalconySlabAndRail(-10.8, 10.8, -65.5, -61.0, L2_Y, true, ['N', 'S']);

  // Walkable Twin Mall Escalators rising cleanly from Ground Floor (Z = -21) up to 2nd Floor Landing (Z = -32)
  // West escalator runs slowly upward (+1.05 m/s); East escalator runs slowly downward (-0.95 m/s) for realistic bidirectional traversal
  addWalkableMallEscalator(ctx, mats, -9.2, -21.0, -32.0, L2_Y, 1.05, 'mall_escalator_west_up');
  addWalkableMallEscalator(ctx, mats, 9.2, -21.0, -32.0, L2_Y, -0.95, 'mall_escalator_east_down');

  // --- 3RD FLOOR UPPER GALLERY BALCONIES (Y = 9.8m, visual depth & towering scale) ---
  addBalconySlabAndRail(-27.4, -12.6, -65.5, 3.5, L3_Y, false, ['E']);
  addBalconySlabAndRail(12.6, 27.4, -65.5, 3.5, L3_Y, false, ['W']);
  addBalconySlabAndRail(-12.6, 12.6, -65.5, -61.8, L3_Y, false, ['S']);
  addBalconySlabAndRail(-12.6, 12.6, 0.2, 3.5, L3_Y, false, ['N']);

  // Grand Full-Height Atrium Structural Columns (supporting L2, L3 & vaulted skylight trusses!)
  // Positioned cleanly along X = ±10.6 so they frame the retail concourse & skybridge corners without blocking walkways
  [-10.6, 10.6].forEach((cx) => {
    [-1.0, -10, -21.5, -35.5, -49, -60.6].forEach((cz) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 15.6, 12), mats.warmMarble);
      col.position.set(cx, 7.8, cz);
      col.castShadow = true;
      col.receiveShadow = true;
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.5, 12), mats.darkBronze);
      plinth.position.set(cx, 0.25, cz);
      const bandL2 = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.28, 12), mats.darkBronze);
      bandL2.position.set(cx, L2_Y - 0.15, cz);
      const bandL3 = bandL2.clone();
      bandL3.position.y = L3_Y - 0.15;
      scene.add(col, plinth, bandL2, bandL3);

      ctx.colliders.push({
        minX: cx - 0.55,
        maxX: cx + 0.55,
        minY: 0,
        maxY: 15.6,
        minZ: cz - 0.55,
        maxZ: cz + 0.55,
        tag: 'atrium_column',
      });
    });
  });

  // ==========================================================================
  // 3. ZONE A — GRAND MALL ENTRANCE CONCOURSE (Z: +22 to +4, Spawn at 0,0,17)
  // ==========================================================================

  // Shattered Automated Sliding Glass Entrance Doors at Z = +13.5 (leaving wide 6.2m center gap!)
  addSolidBox(ctx, -9.8, 2.2, 13.5, 6.4, 4.4, 0.35, mats.darkBronze, 'entry_frame_w');
  addSolidBox(ctx, 9.8, 2.2, 13.5, 6.4, 4.4, 0.35, mats.darkBronze, 'entry_frame_e');
  const entryHeader = new THREE.Mesh(new THREE.BoxGeometry(26.0, 1.6, 0.65), mats.darkBronze);
  entryHeader.position.set(0, 5.2, 13.5);
  scene.add(entryHeader);
  // Jammed half-open sliding glass doors flanking the central opening
  const doorSlideL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.8, 0.08), mats.crackedGlass);
  doorSlideL.position.set(-4.6, 1.9, 13.5);
  const doorSlideR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.8, 0.08), mats.crackedGlass);
  doorSlideR.position.set(4.8, 1.9, 13.6);
  doorSlideR.rotation.y = 0.22; // Knocked off track!
  scene.add(doorSlideL, doorSlideR);

  addSignBoard(
    ctx,
    0,
    5.35,
    13.86,
    11.4,
    1.15,
    0,
    'AETHELION GRAND GALLERIA',
    'LEVEL 1 RETAIL  •  LEVEL 2 GALLERIA  •  LEVEL 3 SKY LOUNGE',
    '#e0f2fe',
    '#0d1826',
    0x38bdf8,
    signFlickers,
    { emissiveIntensity: 0.95 }
  );

  // Abandoned Security Checkpoint Turnstiles & Metal Detectors at Z = +10.8 (flanks at X = ±5.4)
  [-5.4, 5.4].forEach((sx) => {
    const detL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.3, 0.55), mats.darkSteel);
    detL.position.set(sx - 0.6, 1.15, 10.8);
    const detR = detL.clone();
    detR.position.x = sx + 0.6;
    const detTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.58), mats.darkSteel);
    detTop.position.set(sx, 2.35, 10.8);
    const redLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.08, 0.6),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    redLed.position.set(sx, 2.48, 10.8);
    scene.add(detL, detR, detTop, redLed);
    ctx.colliders.push({
      minX: sx - 0.72,
      maxX: sx + 0.72,
      minY: 0,
      maxY: 2.5,
      minZ: 10.45,
      maxZ: 11.15,
      tag: 'security_gate',
    });
  });

  // Central Mall Information Desk & Illuminated Directory Kiosk (X = 0, Z = 7.6)
  // Compact 3.6m wide island leaving >3.5m clear walkways on both sides!
  const infoBase = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 1.05, 12), mats.warmMarble);
  infoBase.position.set(0, 0.525, 7.6);
  infoBase.castShadow = true;
  infoBase.receiveShadow = true;
  const infoTop = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.85, 0.1, 12), mats.woodDark);
  infoTop.position.set(0, 1.08, 7.6);
  scene.add(infoBase, infoTop);
  ctx.colliders.push({
    minX: -1.8,
    maxX: 1.8,
    minY: 0,
    maxY: 1.2,
    minZ: 5.8,
    maxZ: 9.4,
    tag: 'mall_info_desk',
  });

  // 3D Directory Map Screen mounted above the info desk
  const dirTex = createMallDirectoryTexture(ctx);
  const dirMat = new THREE.MeshStandardMaterial({
    map: dirTex,
    emissive: 0x38bdf8,
    emissiveMap: dirTex,
    emissiveIntensity: 0.75,
    roughness: 0.25,
  });
  ctx.disposeables.push(dirMat);
  const dirPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 8), mats.chrome);
  dirPole.position.set(0, 2.1, 7.6);
  const dirFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.3, 0.16), mats.darkSteel);
  dirFrame.position.set(0, 2.55, 7.6);
  const dirScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), dirMat);
  dirScreen.position.set(0, 2.55, 7.69);
  scene.add(dirPole, dirFrame, dirScreen);
  glitchScreens.push({ mat: dirMat, base: 0.75, phase: 0.7 });

  // Slumped inactive Mall Assistant Robot beside info desk
  addInactiveServiceRobot(ctx, mats, 2.5, 7.8, -0.65, false);
  addMallPlanter(ctx, mats, -7.8, 0, 16.5, 2.2, 1.4);
  addMallPlanter(ctx, mats, 7.8, 0, 16.5, 2.2, 1.4);
  addSecurityCamera(ctx, mats, -6.5, 4.4, 13.0, 0.5, true);
  addSecurityCamera(ctx, mats, 6.5, 4.4, 13.0, -0.5, true);

  // --- ENTRANCE WEST STORE: STARLIGHT HOLOCINEMA 3059 (X: -27.4..-12.5, Z: +21..+4.5) ---
  addWallZWithDoor(ctx, -12.5, 4.5, 21.4, 4.8, 0.45, 13.0, 5.2, 3.6, mats.velvetBurgundy);
  addSignBoard(
    ctx,
    -12.15,
    4.1,
    13.0,
    8.2,
    1.15,
    Math.PI / 2,
    'STARLIGHT HOLOCINEMA',
    'NOW SHOWING: EUROPA DRIFT  •  TICKETS & CONCESSIONS',
    '#fde047',
    '#2a0d16',
    0xf59e0b,
    signFlickers,
    { broken: false, emissiveIntensity: 0.9 }
  );
  // Cinema Ticket Counter Island + Popcorn Concession Bar
  addSolidBox(ctx, -17.5, 0.65, 13.0, 1.6, 1.3, 3.8, mats.woodDark, 'cinema_ticket_desk');
  const ticketGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 3.4), mats.crackedGlass);
  ticketGlass.position.set(-16.75, 1.9, 13.0);
  scene.add(ticketGlass);
  // Concession bar along north cinema wall
  addSolidBox(ctx, -20.5, 0.55, 6.0, 8.0, 1.1, 1.3, mats.velvetBurgundy, 'cinema_concession');
  // Illuminated movie poster boxes on west cinema wall
  [9.2, 13.0, 16.8].forEach((pz, idx) => {
    const posterColors = [0x38bdf8, 0xf43f5e, 0xa855f7];
    const pMat = new THREE.MeshStandardMaterial({
      color: posterColors[idx],
      emissive: posterColors[idx],
      emissiveIntensity: 0.55,
      roughness: 0.35,
    });
    ctx.disposeables.push(pMat);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.2, 1.5), mats.darkBronze);
    frame.position.set(-27.2, 2.2, pz);
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.95), pMat);
    poster.rotation.y = Math.PI / 2;
    poster.position.set(-27.1, 2.2, pz);
    scene.add(frame, poster);
  });

  // --- ENTRANCE EAST STORE: AETHER ROASTERY & CAFE (X: +12.5..+27.4, Z: +21..+4.5) ---
  addWallZWithDoor(ctx, 12.5, 4.5, 21.4, 4.8, 0.45, 13.0, 5.6, 3.6, mats.woodWarm);
  addSignBoard(
    ctx,
    12.15,
    4.1,
    13.0,
    7.8,
    1.1,
    -Math.PI / 2,
    'AETHER ROASTERY',
    'SYNTH-ESPRESSO  •  ARTISAN PASTRY  •  FREE HOLOWIFI',
    '#fed7aa',
    '#1f1510',
    0xf97316,
    signFlickers,
    { broken: true, emissiveIntensity: 0.85 }
  );
  // Espresso counter & stainless coffee machines
  addSolidBox(ctx, 24.4, 0.55, 13.0, 1.8, 1.1, 9.2, mats.woodDark, 'cafe_counter');
  [10.2, 12.6, 15.2].forEach((mz) => {
    const espresso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.9), mats.chrome);
    espresso.position.set(24.5, 1.42, mz);
    scene.add(espresso);
  });
  const pastryCase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.72, 2.0), mats.crackedGlass);
  pastryCase.position.set(23.8, 1.46, 16.5);
  scene.add(pastryCase);
  // Cafe bistro tables (two overturned!)
  addFoodCourtTable(ctx, mats, 17.2, 16.5, 0.4, false);
  addFoodCourtTable(ctx, mats, 18.0, 11.2, -0.3, true);
  addFoodCourtTable(ctx, mats, 16.5, 7.6, 0.8, false);

  // Grand Mall Portal dividing Entrance Concourse from the soaring 3-Story Central Atrium at Z = +4
  // Wide 14.4m open archway (X: -7.2..+7.2) so players immediately behold the massive 3-story atrium!
  addWallXWithDoor(ctx, 4.0, -27.4, 27.4, 4.55, 0.6, 0, 14.4, 4.45, mats.warmMarble);

  // ==========================================================================
  // 4. ZONE B — WEST RETAIL PROMENADE (X: -27.4..-11.2, Z: +3.5..-34)
  //    3 Unique Retail Shops: Clothing Boutique -> Electronics -> Toy Store
  // ==========================================================================

  // Open retail concourse glass storefront dividers along X = -11.4 (wide 6.5m entrances so movement & combat flow!)
  // Between shops: subtle partition stubs at Z = -8.0 and Z = -20.0 (leaving open aisle along X = -15..-11.5!)
  addSolidBox(ctx, -22.5, 2.275, -8.0, 9.8, 4.55, 0.35, mats.plasterWall, 'shop_w_div1');
  addSolidBox(ctx, -22.5, 2.275, -20.0, 9.8, 4.55, 0.35, mats.plasterWall, 'shop_w_div2');
  addSolidBox(ctx, -20.5, 2.275, -34.0, 13.8, 4.55, 0.55, mats.plasterWall, 'shop_w_end');

  // Glass storefront fascia pillars along X = -11.4
  const addStorefrontBayGlass = (
    x: number,
    zCenter: number,
    len: number,
    shattered: boolean
  ) => {
    const lowWall = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.65, len), mats.warmMarble);
    lowWall.position.set(x, 0.325, zCenter);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, len), mats.darkBronze);
    frameTop.position.set(x, 4.4, zCenter);
    scene.add(lowWall, frameTop);
    if (!shattered) {
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.55, len - 0.16), mats.crackedGlass);
      pane.position.set(x, 2.42, zCenter);
      scene.add(pane);
    } else {
      // Jagged leftover glass shard strip at top + half-jammed rusted shutter
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.35, len), mats.rustedShutter);
      shutter.position.set(x, 3.65, zCenter);
      scene.add(shutter);
    }
    ctx.colliders.push({
      minX: x - 0.24,
      maxX: x + 0.24,
      minY: 0,
      maxY: shattered ? 0.75 : 4.5,
      minZ: zCenter - len * 0.5,
      maxZ: zCenter + len * 0.5,
      tag: 'storefront_window',
    });
  };

  // --- SHOP W1 (Z: +3.5..-8.0): VELOUR & CHROME (Clothing Boutique) ---
  // Clear around l3_ammo_1 (-18, -4) and l3_watcher_1 patrol (-18, -4)
  addStorefrontBayGlass(-11.4, 1.0, 4.4, false);
  addSignBoard(
    ctx,
    -11.2,
    4.25,
    -2.2,
    8.6,
    0.95,
    Math.PI / 2,
    'VELOUR & CHROME',
    '3059 HAUTE COUTURE  •  SYNTH-SILK APPAREL',
    '#f5d0fe',
    '#1c1222',
    0xd946ef,
    signFlickers,
    { broken: true, emissiveIntensity: 0.82 }
  );
  // Display window mannequins (one broken & tilted!)
  addMannequin(ctx, mats, -13.0, 0.25, 1.8, 1.2, 0x991b1b, false);
  addMannequin(ctx, mats, -13.0, 0.25, 0.1, 1.7, 0x1d4ed8, true);
  addMannequin(ctx, mats, -24.8, 0.0, -5.5, 0.4, 0x0f766e, false);
  // Chrome clothing racks along west wall (X = -25..-22)
  [-0.5, -4.2].forEach((rz) => {
    const rackBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.0, 8), mats.chrome);
    rackBar.rotation.x = Math.PI / 2;
    rackBar.position.set(-24.2, 1.55, rz);
    const postA = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.55, 6), mats.chrome);
    postA.position.set(-24.2, 0.78, rz - 1.45);
    const postB = postA.clone();
    postB.position.z = rz + 1.45;
    // Draped garments hanging on rack
    const garmentColors = [0x475569, 0x7c2d12, 0x1e3a5f, 0x5b21b6, 0x374151];
    garmentColors.forEach((gc, gi) => {
      const gm = new THREE.MeshStandardMaterial({ color: gc, roughness: 0.9 });
      ctx.disposeables.push(gm);
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.18), gm);
      shirt.position.set(-24.2, 1.12, rz - 1.0 + gi * 0.5);
      scene.add(shirt);
    });
    scene.add(rackBar, postA, postB);
    ctx.colliders.push({
      minX: -24.6,
      maxX: -23.8,
      minY: 0,
      maxY: 1.6,
      minZ: rz - 1.55,
      maxZ: rz + 1.55,
      tag: 'clothing_rack',
    });
  });
  // Checkout counter tucked at north-west corner of boutique
  addSolidBox(ctx, -23.6, 0.55, 2.2, 3.2, 1.1, 1.1, mats.warmMarble, 'boutique_counter');

  // --- SHOP W2 (Z: -8.0..-20.0): SYNAPSE TECH // 3059 (Electronics Megastore) ---
  // Houses l3_drive_1 (-20, 0.9, -12), l3_watcher_1 (-18, 0, -12), edu_m3_cryo (-12, -16)
  addStorefrontBayGlass(-11.4, -10.5, 4.2, true);
  addSignBoard(
    ctx,
    -11.2,
    4.25,
    -14.0,
    9.2,
    0.98,
    Math.PI / 2,
    'SYNAPSE TECH // 3059',
    'HOLO-DISPLAYS  •  NEURAL DECKS  •  PERSONAL DRONES',
    '#38bdf8',
    '#091524',
    0x0ea5e9,
    signFlickers,
    { broken: false, emissiveIntensity: 1.0 }
  );
  // Wall of broken & glitching curved Holo-TV displays along X = -27.0
  [-10.2, -13.6, -17.0].forEach((tz, idx) => {
    const screenMat = new THREE.MeshStandardMaterial({
      map: textures.terminalScreenMap,
      color: idx === 1 ? 0x38bdf8 : 0x1e293b,
      emissive: idx === 1 ? 0x0ea5e9 : 0x09111d,
      emissiveIntensity: idx === 1 ? 1.15 : 0.2,
      roughness: 0.2,
    });
    ctx.disposeables.push(screenMat);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.85, 2.8), mats.darkSteel);
    bezel.position.set(-27.15, 2.35, tz);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.65), screenMat);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(-27.04, 2.35, tz);
    scene.add(bezel, glass);
    if (idx === 1) glitchScreens.push({ mat: screenMat, base: 1.15, phase: 2.3 });
  });
  // Shattered electronics showcase counters (keeping -20,-12 and -18,-12 clear!)
  addSolidBox(ctx, -24.2, 0.52, -12.0, 1.4, 1.04, 4.6, mats.darkSteel, 'elec_counter');
  const elecGlass = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 4.4), mats.crackedGlass);
  elecGlass.position.set(-24.2, 1.25, -12.0);
  scene.add(elecGlass);
  // Diagnostic pedestal directly beneath l3_drive_1 (-20, 0.9, -12) — low plinth height 0.58m so drive sits cleanly on top!
  const drivePed1 = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.56, 0.58, 10), mats.darkSteel);
  drivePed1.position.set(-20, 0.29, -12);
  scene.add(drivePed1);
  // Infected server demo rack in back corner showing THEY creeping over electronics ONLY
  addSolidBox(ctx, -25.8, 1.3, -18.2, 1.3, 2.6, 1.4, mats.darkSteel, 'elec_server_rack');
  const elecTendril = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-26.2, 0.1, -18.2),
        new THREE.Vector3(-25.1, 1.1, -17.6),
        new THREE.Vector3(-25.6, 2.3, -18.0),
      ]),
      10,
      0.08,
      6,
      false
    ),
    mats.infectedTendril
  );
  scene.add(elecTendril);
  ctx.sparkEmitters.push({ position: new THREE.Vector3(-25.2, 2.1, -18.0), interval: 2.4, timer: 0.7 });

  // --- SHOP W3 (Z: -20.0..-34.0): WONDERBOTS TOY EMPORIUM ---
  // Clear around l3_lore_1 (-18, 0.6, -24)
  addStorefrontBayGlass(-11.4, -29.5, 5.2, false);
  addSignBoard(
    ctx,
    -11.2,
    4.25,
    -26.5,
    8.8,
    0.96,
    Math.PI / 2,
    'WONDERBOTS TOYS',
    'ROBOT PETS  •  HOLO-PUZZLES  •  IMAGINATION',
    '#fde047',
    '#28102a',
    0xfacc15,
    signFlickers,
    { broken: true, tiltZ: -0.04, emissiveIntensity: 0.78 }
  );
  // Toy store colorful faded shelving & scattered oversized geometric display blocks
  addSolidBox(ctx, -25.4, 1.25, -24.5, 1.2, 2.5, 6.2, mats.woodWarm, 'toy_shelf_w');
  addSolidBox(ctx, -22.2, 1.1, -31.8, 5.4, 2.2, 1.1, mats.velvetNavy, 'toy_shelf_n');
  const toyPalette = [0xe11d48, 0x2563eb, 0xd97706, 0x16a34a, 0x9333ea];
  [
    [-22.5, 0.25, -22.2, 0.5, 0.4],
    [-23.1, 0.2, -26.8, 0.4, -0.5],
    [-16.2, 0.22, -30.5, 0.45, 0.7],
    [-19.8, 0.24, -29.4, 0.48, 1.1],
    [-14.5, 0.18, -26.2, 0.36, -0.3],
  ].forEach(([bx, by, bz, bs, br], idx) => {
    const tm = new THREE.MeshStandardMaterial({
      color: toyPalette[idx % toyPalette.length],
      roughness: 0.65,
      metalness: 0.08,
    });
    ctx.disposeables.push(tm);
    const cube = new THREE.Mesh(new THREE.BoxGeometry(bs, bs, bs), tm);
    cube.position.set(bx, by, bz);
    cube.rotation.y = br;
    scene.add(cube);
  });

  // ==========================================================================
  // 5. ZONE C — EAST RETAIL PROMENADE (X: +11.2..+27.4, Z: +3.5..-34)
  //    3 Unique Retail Shops: Jewelry Boutique -> Supermarket -> Hardware Annex
  // ==========================================================================
  addSolidBox(ctx, 22.5, 2.275, -10.0, 9.8, 4.55, 0.35, mats.plasterWall, 'shop_e_div1');
  addSolidBox(ctx, 22.5, 2.275, -24.0, 9.8, 4.55, 0.35, mats.plasterWall, 'shop_e_div2');
  addSolidBox(ctx, 20.5, 2.275, -34.0, 13.8, 4.55, 0.55, mats.plasterWall, 'shop_e_end');

  // --- SHOP E1 (Z: +3.5..-10.0): SOLARIS LUXE (Jewelry & Luxury Boutique) ---
  // Clear around l3_save (18, -6) and l3_crawler_1 patrol (14, -6)
  addStorefrontBayGlass(11.4, 0.5, 4.8, true);
  addSignBoard(
    ctx,
    11.2,
    4.25,
    -3.2,
    8.6,
    0.95,
    -Math.PI / 2,
    'SOLARIS LUXE',
    'FINE JEWELRY  •  CHRONOMETERS  •  DIAMOND VAULT',
    '#fde68a',
    '#141210',
    0xf59e0b,
    signFlickers,
    { broken: false, emissiveIntensity: 0.85 }
  );
  // Shattered glass jewelry display pedestals along north-east interior
  [
    [23.5, 1.4],
    [23.5, -2.0],
    [23.5, -5.8],
  ].forEach(([jx, jz]) => {
    const ped = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 1.1), mats.darkBronze);
    ped.position.set(jx, 0.5, jz);
    const vitrine = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.85, 1.02), mats.crackedGlass);
    vitrine.position.set(jx, 1.42, jz);
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.68), mats.velvetNavy);
    tray.position.set(jx, 1.04, jz);
    scene.add(ped, vitrine, tray);
    ctx.colliders.push({
      minX: jx - 0.58,
      maxX: jx + 0.58,
      minY: 0,
      maxY: 1.9,
      minZ: jz - 0.58,
      maxZ: jz + 0.58,
      tag: 'jewelry_case',
    });
  });

  // --- SHOP E2 (Z: -10.0..-24.0): HYPER-MART 24/7 (Abandoned Supermarket) ---
  // Clear around l3_lore_2 (18, -12), edu_m3_mat (14, -22), l3_crawler_1 (18, -22), l3_drive_2 (20, 0.9, -22)
  addStorefrontBayGlass(11.4, -13.0, 4.4, false);
  addSignBoard(
    ctx,
    11.2,
    4.25,
    -17.0,
    9.4,
    0.98,
    -Math.PI / 2,
    'HYPER-MART 24/7',
    'SYNTH-GROCERIES  •  FRESH PRODUCE  •  SELF-CHECKOUT',
    '#86efac',
    '#0d1f17',
    0x22c55e,
    signFlickers,
    { broken: true, emissiveIntensity: 0.92 }
  );
  // Supermarket metal gondola shelves along far East wall (X = 24.4..26.6)
  [-12.8, -17.4].forEach((gz) => {
    const gondola = new THREE.Group();
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.25, 3.6), mats.darkSteel);
    spine.position.y = 1.125;
    gondola.add(spine);
    [0.5, 1.05, 1.6, 2.15].forEach((sy) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 3.55), mats.chrome);
      shelf.position.y = sy;
      gondola.add(shelf);
    });
    gondola.position.set(24.8, 0, gz);
    scene.add(gondola);
    ctx.colliders.push({
      minX: 24.2,
      maxX: 25.45,
      minY: 0,
      maxY: 2.3,
      minZ: gz - 1.85,
      maxZ: gz + 1.85,
      tag: 'supermarket_shelf',
    });
  });
  // Broken Self-Checkout Conveyor Lane near front (X = 14.5, Z = -14.8)
  addSolidBox(ctx, 14.6, 0.48, -15.2, 1.1, 0.96, 3.2, mats.darkSteel, 'checkout_lane');
  const posScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.26, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x22c55e })
  );
  posScreen.position.set(14.6, 1.24, -14.0);
  scene.add(posScreen);
  // Abandoned Supermarket Shopping Carts (one tipped!)
  addShoppingCart(ctx, mats, 16.4, -17.5, 0.55, false);
  addShoppingCart(ctx, mats, 21.8, -14.2, -1.1, true);
  // Low stockroom crate directly beneath l3_drive_2 (20, 0.9, -22)
  const drivePed2 = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.58, 0.92), mats.darkBronze);
  drivePed2.position.set(20, 0.29, -22);
  scene.add(drivePed2);

  // --- SHOP E3 (Z: -24.0..-34.0): APEX HARDWARE & SERVICE ANNEX ---
  // Houses l3_workbench (18, -26)
  addStorefrontBayGlass(11.4, -30.5, 4.4, true);
  addSignBoard(
    ctx,
    11.2,
    4.25,
    -29.0,
    8.2,
    0.92,
    -Math.PI / 2,
    'APEX HARDWARE',
    'POWER TOOLS  •  FAB UNITS  •  REPAIR DESK',
    '#fdba74',
    '#1f1610',
    0xf97316,
    signFlickers,
    { broken: false, emissiveIntensity: 0.85 }
  );
  addSolidBox(ctx, 25.0, 1.2, -29.0, 1.2, 2.4, 6.2, mats.darkSteel, 'hardware_rack');

  // ==========================================================================
  // 6. ZONE D — GRAND CENTRAL MALL ATRIUM, FOUNTAIN, FOOD COURT & VAULT
  // ==========================================================================

  // South Atrium Central Retail Kiosk (X = 0, Z = -10.5) — compact 3.4m wide island leaving wide ±4.5m concourse lanes!
  addSolidBox(ctx, 0, 0.52, -10.5, 3.2, 1.04, 2.6, mats.woodWarm, 'atrium_kiosk');
  const kioskCase = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.45, 2.4), mats.crackedGlass);
  kioskCase.position.set(0, 1.26, -10.5);
  const kioskCanopy = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 3.0), mats.darkBronze);
  kioskCanopy.position.set(0, 3.05, -10.5);
  kioskCanopy.rotation.z = 0.08; // Tilted slightly!
  [-1.4, 1.4].forEach((kx) => {
    [-1.1, 1.1].forEach((kz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6), mats.chrome);
      post.position.set(kx, 2.05, -10.5 + kz);
      scene.add(post);
    });
  });
  scene.add(kioskCase, kioskCanopy);
  addSignBoard(
    ctx,
    0,
    3.42,
    -9.0,
    3.4,
    0.58,
    0,
    'ORBIT MOBILE',
    'SIMS • AR GLASSES',
    '#7dd3fc',
    '#0e1a2a',
    0x38bdf8,
    signFlickers,
    { broken: true, tiltZ: 0.08, emissiveIntensity: 0.78 }
  );

  // Public Mall Benches, Overgrown Planters & Abandoned Shopping Carts along South Atrium Concourse
  addMallBench(ctx, mats, -5.8, 0, -4.5, Math.PI / 2, false);
  addMallBench(ctx, mats, 5.8, 0, -4.5, -Math.PI / 2, false);
  addMallBench(ctx, mats, -5.8, 0, -17.5, Math.PI / 2, true); // Overturned bench
  addMallBench(ctx, mats, 5.8, 0, -17.5, -Math.PI / 2, false);
  addMallPlanter(ctx, mats, -5.8, 0, -10.5, 1.8, 2.2);
  addMallPlanter(ctx, mats, 5.8, 0, -10.5, 1.8, 2.2);
  addShoppingCart(ctx, mats, -4.4, -27.5, 0.9, false);
  addShoppingCart(ctx, mats, 4.6, -24.5, -0.7, true);
  addInactiveServiceRobot(ctx, mats, -6.2, -31.0, 0.85, false);

  // --- CENTERPIECE SHOWPIECE: SHATTERED MALL FOUNTAIN, KINETIC SCULPTURE & SKYLIGHT TREE (X = 0, Z = -50) ---
  const fountainGrp = new THREE.Group();
  const outerRim = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.65, 0.72, 10), mats.warmMarble);
  outerRim.position.y = 0.36;
  outerRim.castShadow = true;
  outerRim.receiveShadow = true;
  const rimCap = new THREE.Mesh(new THREE.CylinderGeometry(2.58, 2.58, 0.1, 10), mats.darkBronze);
  rimCap.position.y = 0.74;
  // Stagnant shallow green-teal rainwater pool inside the cracked fountain basin
  const basinWaterMat = new THREE.MeshStandardMaterial({
    color: 0x164e48,
    normalMap: textures.waterNormalMap,
    roughness: 0.16,
    metalness: 0.08,
    envMapIntensity: 0.72,
    transparent: true,
    opacity: 0.84,
  });
  ctx.disposeables.push(basinWaterMat);
  const basinWater = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.08, 10), basinWaterMat);
  basinWater.position.y = 0.56;
  // Center tiered broken sculpture pedestal & fallen kinetic bronze rings
  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 1.45, 10), mats.warmMarble);
  tier1.position.y = 1.0;
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.1, 8, 24), mats.darkBronze);
  ring1.position.set(0, 2.45, 0);
  ring1.rotation.set(0.45, 0.3, 0.2);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 8, 20), mats.chrome);
  ring2.position.set(0.35, 1.4, 0.6);
  ring2.rotation.set(1.25, -0.4, 0.8); // Collapsed & resting half-submerged!
  // Damp moss patches clinging to cracked marble fountain rim
  for (let m = 0; m < 6; m++) {
    const ang = (m / 6) * Math.PI * 2 + 0.3;
    const moss = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), mats.mossMat);
    moss.position.set(Math.cos(ang) * 2.25, 0.72, Math.sin(ang) * 2.25);
    moss.scale.set(1.3, 0.35, 1.1);
    fountainGrp.add(moss);
  }
  fountainGrp.add(outerRim, rimCap, basinWater, tier1, ring1, ring2);
  fountainGrp.position.set(0, 0, -50);
  scene.add(fountainGrp);

  // Compact fountain collider (leaves Z = -44 and Z = -56 completely clear for drive & Watcher!)
  ctx.colliders.push({
    minX: -2.4,
    maxX: 2.4,
    minY: 0,
    maxY: 2.6,
    minZ: -52.4,
    maxZ: -47.6,
    tag: 'atrium_fountain',
  });

  // Uninfected Natural Tree breaking right up through the cracked marble tiles beneath the shattered skylight!
  addRoadsideTree(ctx, -6.2, -49.5, 1.12, true);
  addRoadsideTree(ctx, 6.6, -51.5, 0.92, true);

  // --- ABANDONED SURVIVOR EMERGENCY SHELTER & INFECTED SECURITY HUB (around Z = -44) ---
  // Survivor crate holding l3_drive_3 (0, 0.9, -44) + overturned barricade tables & cots flanking X = ±3.8
  const driveCrate3 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.58, 0.75), mats.darkSteel);
  driveCrate3.position.set(0, 0.29, -44);
  scene.add(driveCrate3);
  // Overturned barricade benches & emergency sandbag stacks framing the shelter (wide walkways around Z = -44)
  addMallBench(ctx, mats, -3.4, 0, -45.6, 0.35, true);
  addMallBench(ctx, mats, 3.6, 0, -46.2, -0.4, true);
  // Destroyed Automated Mall Security Turret / Assistant Robot visibly infected by THEY metallic tendrils!
  // Located right beside edu_m3_mech (4, -42) for direct environmental storytelling!
  addInactiveServiceRobot(ctx, mats, 5.4, -41.5, -1.1, true);
  ctx.sparkEmitters.push({ position: new THREE.Vector3(5.4, 1.15, -41.5), interval: 2.1, timer: 0.4 });
  // Damp floor stains & scorch marks around the survivor barricade
  addFloorDecal(ctx, 0, -46.5, 4.8, 4.8, textures.mossDecalMap, 0.65, 0.3);
  addFloorDecal(ctx, 3.2, -43.5, 3.4, 3.4, textures.scorchDecalMap, 0.55, -0.5);
  addFloorDecal(ctx, -4.5, -51.0, 4.2, 4.2, textures.mossDecalMap, 0.72, 1.1);

  // --- HANGING MALFUNCTIONING HOLOGRAPHIC AD RING & BILLBOARDS OVER THE CENTRAL ATRIUM ---
  const holoRingGrp = new THREE.Group();
  const ringTruss = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.16, 8, 28), mats.darkBronze);
  ringTruss.rotation.x = Math.PI / 2;
  holoRingGrp.add(ringTruss);
  // 4 curved futuristic holographic advertisement banners hanging from the ring
  const holoAds: [string, string, string, number][] = [
    ['SYNTH-LIFE 3059', 'UPGRADE YOUR TOMORROW', '#38bdf8', 0x38bdf8],
    ['ORBITAL HOLIDAYS', 'DIRECT SHUTTLES FROM SECTOR 09', '#f472b6', 0xec4899],
    ['AETHER ENERGY', 'ZERO-POINT HOME CELLS', '#4ade80', 0x22c55e],
    ['SOLARIS LUXE', 'TIMELESS CHROME & GOLD', '#fbbf24', 0xf59e0b],
  ];
  holoAds.forEach(([hl, sub, hexStr, hexNum], i) => {
    const ang = (i / 4) * Math.PI * 2;
    const adTex = createHoloAdTexture(ctx, hl, sub, hexStr);
    const adMat = new THREE.MeshStandardMaterial({
      map: adTex,
      emissive: hexNum,
      emissiveMap: adTex,
      emissiveIntensity: 0.95,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
      roughness: 0.2,
    });
    ctx.disposeables.push(adMat);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.3), adMat);
    panel.position.set(Math.sin(ang) * 4.5, 0, Math.cos(ang) * 4.5);
    panel.rotation.y = ang;
    holoRingGrp.add(panel);
    glitchScreens.push({ mat: adMat, base: 0.95, phase: i * 1.7 });
  });
  holoRingGrp.position.set(0, 9.6, -48);
  holoRingGrp.rotation.z = 0.09; // Slightly crooked from a snapped ceiling cable!
  scene.add(holoRingGrp);
  holoSpinners.push({ obj: holoRingGrp, speed: 0.14 });

  // Suspension cables running up from the tilted ad ring to the skylight trusses
  [-4.2, 4.2].forEach((cx) => {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 6.2, 6), mats.chrome);
    cable.position.set(cx, 12.7, -48);
    scene.add(cable);
  });

  // Hanging fabric/vinyl mall banners descending along the South Atrium (Z = -16, -34)
  [
    [-7.5, -16, 0x1e3a8a],
    [7.5, -16, 0x7c2d12],
    [-7.5, -34, 0x115e59],
    [7.5, -34, 0x581c87],
  ].forEach(([bx, bz, col], idx) => {
    const bm = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.88,
      side: THREE.DoubleSide,
    });
    ctx.disposeables.push(bm);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 5.2), bm);
    banner.position.set(bx, 11.4, bz);
    banner.rotation.z = idx % 2 === 0 ? 0.06 : -0.11; // Slightly askew from age
    scene.add(banner);
  });

  // --- EAST FOOD COURT & RESTROOMS (X: +12..+27.4, Z: -34..-65) ---
  // Clear around l3_bat_1 (16, 0.35, -44.2) and l3_ambush_watcher (10, 0, -56)
  // Food court serving counter line along X = 23.6
  addSolidBox(ctx, 23.8, 0.56, -42.0, 1.5, 1.12, 11.0, mats.warmMarble, 'food_court_counter_1');
  addSolidBox(ctx, 23.8, 0.56, -55.0, 1.5, 1.12, 9.0, mats.woodDark, 'food_court_counter_2');
  // Neon Menu Fascia Signs above Food Court Stalls
  addSignBoard(
    ctx,
    23.4,
    3.8,
    -40.0,
    6.8,
    1.05,
    -Math.PI / 2,
    'NOODLE-9 RAMEN',
    'SYNTH-BROTH  •  SPICY MISO  •  GYOZA BOWLS',
    '#fda4af',
    '#240b12',
    0xf43f5e,
    signFlickers,
    { broken: false, emissiveIntensity: 0.96 }
  );
  addSignBoard(
    ctx,
    23.4,
    3.8,
    -48.5,
    6.8,
    1.05,
    -Math.PI / 2,
    'ORBIT BURGER',
    'DOUBLE STACK  •  SOLAR FRIES  •  SHAKES',
    '#fde047',
    '#1f1708',
    0xf59e0b,
    signFlickers,
    { broken: true, emissiveIntensity: 0.88 }
  );
  // Restrooms & Service Corridor Door Alcove on North-East Food Court wall
  addSignBoard(
    ctx,
    23.4,
    3.6,
    -60.5,
    4.2,
    0.72,
    -Math.PI / 2,
    'RESTROOMS  WC',
    'SERVICE CORRIDOR  →',
    '#bae6fd',
    '#0c1a2c',
    0x38bdf8,
    signFlickers,
    { broken: false, emissiveIntensity: 0.72 }
  );
  const wcDoor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 1.9), mats.darkBronze);
  wcDoor.position.set(27.2, 1.4, -60.5);
  scene.add(wcDoor);

  // Food Court Seating Tables (several overturned with fallen chairs; clear of 16, -44.2!)
  addFoodCourtTable(ctx, mats, 16.5, -39.2, 0.2, false);
  addFoodCourtTable(ctx, mats, 19.6, -41.8, -0.5, true);
  addFoodCourtTable(ctx, mats, 19.8, -48.6, 0.9, false);
  addFoodCourtTable(ctx, mats, 15.6, -51.5, -0.2, true);
  addFoodCourtTable(ctx, mats, 19.4, -56.4, 0.6, false);

  // --- WEST SEALED LUXURY VAULT / ARCHIVE (X: -27.4..-13, Z: -58..-36) ---
  // Preserves exact secret room geometry, destructible glass l3_secret_glass (-13, -42) & sec_03_cache (-22, 0.5, -47)
  addSolidBox(ctx, -20.2, 2.275, -36.0, 14.8, 4.55, 0.7, mats.warmMarble, 'vault_wall_s');
  addSolidBox(ctx, -20.2, 2.275, -58.0, 14.8, 4.55, 0.7, mats.warmMarble, 'vault_wall_n');
  addWallZWithDoor(ctx, -13.0, -58.0, -36.0, 4.55, 0.7, -42.0, 4.2, 2.8, mats.warmMarble);
  addDestructibleBarricade(ctx, 'l3_secret_glass', -13.0, -42.0, 0.75, 2.8, 4.3, 0x0284c7);
  addSignBoard(
    ctx,
    -12.55,
    4.1,
    -46.0,
    8.2,
    0.9,
    Math.PI / 2,
    'AURORA VAULT',
    'HIGH-SECURITY LUXURY STORAGE  •  RESTRICTED',
    '#fcd34d',
    '#14151c',
    0xf59e0b,
    signFlickers,
    { broken: false, emissiveIntensity: 0.8 }
  );
  // Vault interior luxury shelving & deposit boxes (clear of -22, -47)
  addSolidBox(ctx, -25.6, 1.3, -47.0, 1.4, 2.6, 12.0, mats.darkBronze, 'vault_shelf');

  // --- UPPER 2ND & 3RD FLOOR STOREFRONT FACADES & SIGNS (VISIBLE FROM EVERYWHERE!) ---
  // 2nd Floor West Balcony Shops (recessed at X = -25.8, Y = 4.8..9.6)
  const addUpperStoreFacade = (
    x: number,
    yBase: number,
    z: number,
    rotY: number,
    title: string,
    sub: string,
    accentHex: string,
    bgHex: string,
    emissiveHex: number,
    broken = false
  ) => {
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.4, 13.0), mats.darkSteel);
    back.position.set(x, yBase + 2.2, z);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 9.6), mats.crackedGlass);
    win.position.set(x + (rotY > 0 ? 0.35 : -0.35), yBase + 1.8, z);
    const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.4, 9.8), mats.rustedShutter);
    shutter.position.set(x + (rotY > 0 ? 0.38 : -0.38), yBase + 3.0, z);
    scene.add(back, win, shutter);

    addSignBoard(
      ctx,
      x + (rotY > 0 ? 0.55 : -0.55),
      yBase + 3.95,
      z,
      9.4,
      0.95,
      rotY,
      title,
      sub,
      accentHex,
      bgHex,
      emissiveHex,
      signFlickers,
      { broken, emissiveIntensity: 0.85 }
    );
  };

  // 2nd Floor West Shops (walkable promenade overlooks!)
  addUpperStoreFacade(-26.8, L2_Y, -6.0, Math.PI / 2, 'APEX GALLERIA', 'DEPARTMENT STORE • HOME & TECH', '#93c5fd', '#0e1726', 0x3b82f6, false);
  addUpperStoreFacade(-26.8, L2_Y, -24.0, Math.PI / 2, 'NEON ARCADE 3059', 'VR PODS • HOLO-PINBALL • LOUNGE', '#f0abfc', '#1f0d28', 0xd946ef, true);
  addUpperStoreFacade(-26.8, L2_Y, -46.0, Math.PI / 2, 'HORIZON BOOKS', 'ARCHIVE MEDIA • DATA PRINTS', '#fed7aa', '#1e1611', 0xf97316, false);

  // 2nd Floor East Shops
  addUpperStoreFacade(26.8, L2_Y, -6.0, -Math.PI / 2, 'SKYLINE BISTRO', 'PANORAMA DINING • COCKTAILS', '#fca5a5', '#211014', 0xef4444, false);
  addUpperStoreFacade(26.8, L2_Y, -24.0, -Math.PI / 2, 'ASTRO APPAREL', 'ZERO-G ATHLEISURE • GEAR', '#6ee7b7', '#0b1e18', 0x10b981, true);
  addUpperStoreFacade(26.8, L2_Y, -46.0, -Math.PI / 2, 'CHRONO STUDIO', 'LUXURY OPTICS • TIMEPIECES', '#fde68a', '#1c180f', 0xf59e0b, false);

  // 3rd Floor Upper Gallery Signs (visible soaring above!)
  addUpperStoreFacade(-26.8, L3_Y, -18.0, Math.PI / 2, 'HOLO-IMAX 3D', 'LEVEL 3 GRAND THEATERS', '#7dd3fc', '#0b1628', 0x0284c7, true);
  addUpperStoreFacade(-26.8, L3_Y, -44.0, Math.PI / 2, 'OMNI-HOMES', 'FURNITURE & LIVING 3059', '#d8b4fe', '#191124', 0xa855f7, false);
  addUpperStoreFacade(26.8, L3_Y, -18.0, -Math.PI / 2, 'GALLERIA SKY LOUNGE', 'OBSERVATION TERRACE', '#fde047', '#1c160b', 0xeab308, false);
  addUpperStoreFacade(26.8, L3_Y, -44.0, -Math.PI / 2, 'PULSE WELLNESS', 'CRYO-SPA & FITNESS', '#86efac', '#0d1f16', 0x22c55e, true);

  // 2nd Floor Walkable Balcony Props (benches, planters, mannequins)
  addMallBench(ctx, mats, -15.5, L2_Y, -12.0, Math.PI / 2, false, true);
  addMallBench(ctx, mats, -15.5, L2_Y, -48.0, Math.PI / 2, true, true);
  addMallBench(ctx, mats, 15.5, L2_Y, -12.0, -Math.PI / 2, false, true);
  addMallBench(ctx, mats, 15.5, L2_Y, -48.0, -Math.PI / 2, false, true);
  addMallPlanter(ctx, mats, -14.0, L2_Y, -24.0, 1.8, 1.4, true);
  addMallPlanter(ctx, mats, 14.0, L2_Y, -24.0, 1.8, 1.4, true);
  addMannequin(ctx, mats, -22.5, L2_Y, -8.5, 1.4, 0x3b82f6, false);
  addMannequin(ctx, mats, 22.5, L2_Y, -22.5, -1.3, 0x10b981, true);

  // ==========================================================================
  // 7. NORTH SECURITY BULKHEAD (Z = -66) & MAINTENANCE LOADING BAY (Z: -66..-94)
  // ==========================================================================
  addWallXWithDoor(ctx, -66.0, -27.4, 27.4, MALL_H, 0.9, 0, 5.2, 4.0, mats.dirtyConcrete);
  addDynamicDoor(ctx, 'door_l3_lab', 0, -66.0, 5.2, 4.0, 0.55, 0x1e293b, 0x38bdf8);

  addSignBoard(
    ctx,
    0,
    5.4,
    -65.35,
    10.4,
    1.05,
    0,
    'SECURITY & LOADING BAY',
    'AUTHORIZED STAFF ONLY  •  FREIGHT LIFT TO DEAD CITY',
    '#fbbf24',
    '#1a140b',
    0xf59e0b,
    signFlickers,
    { broken: false, emissiveIntensity: 0.9 }
  );

  // Loading Bay Industrial Pipes, Cargo Pallets, Freight Elevator Doors & Inactive Cargo Bot
  addPipeConduit(ctx, -18, 6.2, -68, -18, 6.2, -92, 0.24, mats.darkSteel);
  addPipeConduit(ctx, 18, 6.2, -68, 18, 6.2, -92, 0.24, mats.darkSteel);
  addPipeConduit(ctx, -26, 6.4, -76, 26, 6.4, -76, 0.2, mats.darkBronze);

  // Stacked shipping cargo pallets along West & East flanks (keeping center & Sentinel patrol clear!)
  [
    [-19.5, -73.0, 3.2, 2.2, 2.8],
    [-21.0, -83.5, 3.8, 1.8, 3.4],
    [19.5, -74.0, 3.4, 2.4, 3.0],
    [20.5, -84.0, 3.6, 1.9, 3.2],
    [-12.0, -86.5, 2.6, 1.4, 2.2],
    [12.5, -86.5, 2.8, 1.6, 2.4],
  ].forEach(([px, pz, pw, ph, pd], idx) => {
    addSolidBox(ctx, px, ph * 0.5, pz, pw, ph, pd, idx % 2 === 0 ? mats.woodWarm : mats.darkSteel, 'cargo_pallet');
    const haz = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.04, 0.14, pd + 0.04), mats.hazardMat);
    haz.position.set(px, 0.09, pz);
    scene.add(haz);
  });

  // Service Freight Elevator Doors on West & East Loading Bay walls
  [-27.15, 27.15].forEach((ex) => {
    const elev = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.6, 3.8), mats.rustedShutter);
    elev.position.set(ex, 1.8, -78.5);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.9, 4.2), mats.darkSteel);
    frame.position.set(ex + (ex < 0 ? -0.05 : 0.05), 1.95, -78.5);
    scene.add(frame, elev);
  });

  // Inactive Autonomous Cargo Delivery Bot + sparking electrical panel
  addInactiveServiceRobot(ctx, mats, -13.5, -72.0, 0.7, true);
  ctx.sparkEmitters.push({ position: new THREE.Vector3(14.0, 2.8, -68.5), interval: 2.0, timer: 0.3 });

  // ==========================================================================
  // 8. NATURAL UNINFECTED VEGETATION (VINES, GRASS TUFTS, ROOTS & MOSS)
  //    Lore-accurate: THEY infect metals ONLY — all flora is healthy natural green!
  // ==========================================================================
  addClimbingVines(ctx, -10.5, 0.2, -36.0, 3.8, 10.2, 'x', 1, 11);
  addClimbingVines(ctx, 10.5, 0.2, -49.0, 4.0, 11.4, 'x', -1, 23);
  addClimbingVines(ctx, -10.5, 4.8, -16.0, 4.4, 5.6, 'x', 1, 31);
  addClimbingVines(ctx, 10.5, 4.8, -28.0, 4.2, 5.8, 'x', -1, 47);
  addClimbingVines(ctx, -27.2, 0.4, -22.0, 5.0, 9.2, 'x', 1, 59);
  addClimbingVines(ctx, 27.2, 0.4, -52.0, 5.0, 9.6, 'x', -1, 67);
  addClimbingVines(ctx, -4.5, 4.6, -65.4, 6.2, 7.5, 'z', 1, 79);

  addInstancedGrassTufts(
    ctx,
    [
      { x: 0, z: -50, spread: 3.8, count: 24, scale: 1.05 },
      { x: -6.2, z: -49.5, spread: 2.6, count: 16, scale: 1.0 },
      { x: 6.6, z: -51.5, spread: 2.4, count: 14, scale: 0.95 },
      { x: -3.5, z: -43.0, spread: 2.2, count: 10, scale: 0.85 },
      { x: -5.8, z: -10.5, spread: 1.6, count: 8, scale: 0.8 },
      { x: 5.8, z: -10.5, spread: 1.6, count: 8, scale: 0.8 },
      { x: -14.0, z: -24.0, y: L2_Y + 0.02, spread: 2.0, count: 10, scale: 0.85 },
      { x: 14.0, z: -24.0, y: L2_Y + 0.02, spread: 2.0, count: 10, scale: 0.85 },
      { x: -8.0, z: 16.5, spread: 1.8, count: 8, scale: 0.8 },
      { x: 8.0, z: 16.5, spread: 1.8, count: 8, scale: 0.8 },
      { x: 14.0, z: -61.0, spread: 2.4, count: 10, scale: 0.85 },
    ],
    3059
  );

  // ==========================================================================
  // 9. INSTANCED ABANDONMENT DEBRIS (FALLEN CEILING TILES, SHATTERED GLASS, BOXES)
  // ==========================================================================
  const debrisGeo = new THREE.BoxGeometry(0.55, 0.06, 0.55);
  const debrisMat = new THREE.MeshStandardMaterial({
    color: 0xa39e93,
    roughness: 0.9,
    metalness: 0.05,
  });
  const glassShardGeo = new THREE.BoxGeometry(0.24, 0.02, 0.16);
  const boxGeo = new THREE.BoxGeometry(0.46, 0.34, 0.38);
  const boxMat = new THREE.MeshStandardMaterial({
    color: 0x8b6b4c,
    roughness: 0.88,
    metalness: 0.04,
  });
  ctx.disposeables.push(debrisGeo, debrisMat, glassShardGeo, boxGeo, boxMat);

  const ceilingDebris = new THREE.InstancedMesh(debrisGeo, debrisMat, 68);
  const glassShards = new THREE.InstancedMesh(glassShardGeo, mats.crackedGlass, 90);
  const scatteredBoxes = new THREE.InstancedMesh(boxGeo, boxMat, 48);
  const dummy = new THREE.Object3D();

  let dSeed = 7731;
  const drnd = () => {
    dSeed = (dSeed * 16807) % 2147483647;
    return (dSeed - 1) / 2147483646;
  };

  for (let i = 0; i < 68; i++) {
    const px = (drnd() - 0.5) * 48;
    const pz = 18 - drnd() * 102;
    dummy.position.set(px, 0.035, pz);
    dummy.rotation.set((drnd() - 0.5) * 0.18, drnd() * Math.PI * 2, (drnd() - 0.5) * 0.18);
    const s = 0.55 + drnd() * 1.15;
    dummy.scale.set(s, 1, s * (0.7 + drnd() * 0.5));
    dummy.updateMatrix();
    ceilingDebris.setMatrixAt(i, dummy.matrix);
  }
  ceilingDebris.instanceMatrix.needsUpdate = true;
  ceilingDebris.computeBoundingSphere();
  ceilingDebris.receiveShadow = true;

  // Shattered glass shards concentrated around entry doors, storefront windows & broken skylight floor!
  const shardZones = [
    [0, 13.5, 5.5],
    [-11.2, -10.5, 3.0],
    [11.2, 0.5, 3.0],
    [11.2, -30.5, 3.0],
    [0, -49.0, 6.5],
    [-13.0, -42.0, 2.5],
  ];
  for (let i = 0; i < 90; i++) {
    const zone = shardZones[i % shardZones.length];
    const ang = drnd() * Math.PI * 2;
    const rad = Math.sqrt(drnd()) * zone[2];
    dummy.position.set(zone[0] + Math.cos(ang) * rad, 0.018, zone[1] + Math.sin(ang) * rad);
    dummy.rotation.set(0, drnd() * Math.PI * 2, 0);
    const s = 0.5 + drnd() * 1.4;
    dummy.scale.set(s, 1, s);
    dummy.updateMatrix();
    glassShards.setMatrixAt(i, dummy.matrix);
  }
  glassShards.instanceMatrix.needsUpdate = true;
  glassShards.computeBoundingSphere();

  // Scattered retail merchandise boxes inside shops & loading bay
  const boxZones = [
    [-21.0, -2.0, 3.5],
    [-22.0, -15.0, 3.5],
    [-21.0, -27.0, 3.5],
    [21.0, -16.0, 3.5],
    [21.5, -28.0, 3.0],
    [-16.0, -76.0, 5.0],
    [16.0, -78.0, 5.0],
  ];
  for (let i = 0; i < 48; i++) {
    const zone = boxZones[i % boxZones.length];
    const bx = zone[0] + (drnd() - 0.5) * zone[2] * 2;
    const bz = zone[1] + (drnd() - 0.5) * zone[2] * 2;
    dummy.position.set(bx, 0.17, bz);
    dummy.rotation.set(0, drnd() * Math.PI * 2, (drnd() - 0.5) * 0.16);
    const s = 0.7 + drnd() * 0.7;
    dummy.scale.set(s, s * 0.85, s);
    dummy.updateMatrix();
    scatteredBoxes.setMatrixAt(i, dummy.matrix);
  }
  scatteredBoxes.instanceMatrix.needsUpdate = true;
  scatteredBoxes.computeBoundingSphere();
  scatteredBoxes.receiveShadow = true;

  scene.add(ceilingDebris, glassShards, scatteredBoxes);

  // Floating atmospheric dust & drifting skylight leaf motes (Points)
  const moteCount = 160;
  const motePositions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePositions[i * 3] = (drnd() - 0.5) * 26;
    motePositions[i * 3 + 1] = 0.6 + drnd() * 14.5;
    motePositions[i * 3 + 2] = 6 - drnd() * 70;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const moteMat = new THREE.PointsMaterial({
    color: 0xd8e4f2,
    size: 0.11,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  ctx.disposeables.push(moteGeo, moteMat);
  const dustMotes = new THREE.Points(moteGeo, moteMat);
  scene.add(dustMotes);

  // ==========================================================================
  // 10. PRESERVED MISSION OBJECTIVES, INTERACTABLES, PICKUPS & ENEMIES
  //     (All exact IDs, positions, secret rooms & ambush triggers preserved!)
  // ==========================================================================
  addPickup(ctx, 'sec_03_cache', 'secret_cache', 'CLAIM VAULT SALVAGE (+2 SALVAGE)', -22, 0.5, -47, 0xf59e0b, {
    secretId: 'sec_03_lab',
    secretTitle: 'AURORA LUXURY VAULT',
  });

  // 3 Research Drives + Security Cipher Puzzle
  addPickup(ctx, 'l3_drive_1', 'research_drive', 'RECOVER RESEARCH DRIVE 01 (SYNAPSE TECH)', -20, 0.9, -12, 0x38bdf8);
  addPickup(ctx, 'l3_drive_2', 'research_drive', 'RECOVER RESEARCH DRIVE 02 (HYPER-MART)', 20, 0.9, -22, 0x38bdf8);
  addPickup(ctx, 'l3_drive_3', 'research_drive', 'RECOVER RESEARCH DRIVE 03 (ATRIUM SHELTER)', 0, 0.9, -44, 0xef4444);

  addConsoleInteractable(
    ctx,
    'l3_lab_puzzle',
    'puzzle',
    'SOLVE SECURITY CIPHER TO UNLOCK LOADING BAY',
    -5.2,
    -64.2,
    0xf59e0b,
    { puzzleId: 'puz_03_lab', doorId: 'door_l3_lab' }
  );

  addSaveAndWorkbench(ctx, 'l3', 18, -6, 18, -26);
  addLevelExitGate(ctx, 'l3_exit', 'ASCEND TO THE DEAD CITY (LEVEL 04)', 0, -90, 2);

  addPickup(ctx, 'l3_lore_1', 'lore', 'READ METALLIC NECROSIS STUDY', -18, 0.6, -24, 0x60a5fa, {
    loreId: 'doc_archivist_note',
  });
  addPickup(ctx, 'l3_lore_2', 'lore', 'READ SPECIMEN 07: THE WATCHER', 18, 0.6, -12, 0x60a5fa, {
    loreId: 'doc_watcher_protocol',
  });
  addPickup(ctx, 'l3_lore_3', 'lore', 'PLAY CONTAINMENT BREACH AUDIO', -3, 0.6, -72, 0xf87171, {
    loreId: 'audio_sentinel_blackbox',
  });
  addPickup(ctx, 'l3_med_1', 'medkit', 'COLLECT MALL FIRST-AID KIT (+35 HP)', 0, 0.35, -18, 0x22c55e);
  addPickup(ctx, 'l3_ammo_1', 'ammo', 'COLLECT AMMO CACHE', -18, 0.35, -4, 0xf59e0b);
  addPickup(ctx, 'l3_bat_1', 'battery', 'COLLECT REACTOR CELL', 16, 0.35, -44.2, 0x38bdf8);

  // Bonus optional supplies on the walkable 2nd-floor balcony to reward vertical exploration!
  addPickup(ctx, 'l3_upper_med', 'medkit', 'COLLECT BALCONY MEDKIT (+35 HP)', -18.5, L2_Y + 0.35, -39.0, 0x22c55e);
  addPickup(ctx, 'l3_upper_ammo', 'ammo', 'COLLECT BALCONY AMMO', 18.5, L2_Y + 0.35, -39.0, 0xf59e0b);

  // ==========================================================================
  // 11. CONTROLLED MALL LIGHTING (BALANCED SKYLIGHTS + STOREFRONT POOLS + EMERGENCY)
  //     No orange wash, no over-bloom, dark moody corners with clean readability!
  // ==========================================================================
  const mallLights: [number, number, number, number, number, number, boolean][] = [
    // [x, y, z, color, intensity, distance, flicker]
    [0, 6.2, 14.0, 0xd8e8f8, 7.5, 26, false],        // Entrance concourse cool daylight
    [-19, 4.2, 13.0, 0xf5c27b, 4.2, 16, false],      // Starlight Cinema warm marquee glow
    [19, 4.2, 13.0, 0xf2ba85, 4.0, 16, true],        // Aether Cafe flickering warm bulb
    [-19, 4.1, -13.0, 0x38bdf8, 5.5, 20, true],      // Synapse Tech cyan neon spill
    [-19, 4.1, -26.0, 0xf3d478, 3.8, 16, true],      // Wonderbots dimmed ballast
    [19, 4.1, -16.0, 0x76e0a5, 5.2, 20, false],      // Hyper-Mart cool grocery fluorescent
    [0, 11.5, -18.0, 0xcbe0f7, 9.5, 34, false],      // South Atrium natural skylight bounce
    [0, 11.5, -48.0, 0xd4e6fa, 11.0, 38, false],     // Central Fountain broken skylight shaft
    [19, 4.2, -46.0, 0xf08c7a, 4.6, 20, true],       // Food Court Noodle-9 / Orbit Burger glow
    [0, 4.5, -62.5, 0xef4444, 4.8, 16, true],        // North Security Bulkhead emergency strobe
    [0, 6.0, -78.0, 0x86c5b8, 6.2, 26, false],       // Maintenance Loading Bay industrial light
  ];
  mallLights.forEach(([lx, ly, lz, col, inten, dist, flick], idx) => {
    const scaledInten = inten * 0.65;
    const pt = new THREE.PointLight(col, scaledInten, dist, 1.65);
    pt.position.set(lx, ly, lz);
    scene.add(pt);
    if (flick) {
      ctx.flickerLights.push({ light: pt, base: scaledInten, speed: 3.6 + (idx % 4) * 1.9 });
    }
  });

  // Preserved Enemy Spawns (exact IDs, types, patrol points & ambush tags)
  ctx.enemySpawns.push(
    { id: 'l3_watcher_1', type: 'watcher', position: new THREE.Vector3(-18, 0, -12), patrolTarget: new THREE.Vector3(-18, 0, -4), initiallyActive: true },
    { id: 'l3_crawler_1', type: 'crawler', position: new THREE.Vector3(18, 0, -22), patrolTarget: new THREE.Vector3(14, 0, -6), initiallyActive: true },
    { id: 'l3_watcher_2', type: 'watcher', position: new THREE.Vector3(0, 0, -56), patrolTarget: new THREE.Vector3(-8, 0, -44), initiallyActive: true },
    { id: 'l3_ambush_watcher', type: 'watcher', position: new THREE.Vector3(10, 0, -56), patrolTarget: new THREE.Vector3(0, 0, -44), initiallyActive: false, ambushTag: 'genesis_breach' },
    { id: 'l3_ambush_scrapper', type: 'scrapper', position: new THREE.Vector3(-10, 0, -56), patrolTarget: new THREE.Vector3(0, 0, -44), initiallyActive: false, ambushTag: 'genesis_breach' },
    { id: 'l3_sentinel_1', type: 'sentinel', position: new THREE.Vector3(0, 0, -78), patrolTarget: new THREE.Vector3(6, 0, -72), initiallyActive: true }
  );

  // ==========================================================================
  // 12. PER-FRAME DYNAMIC MALL ANIMATION (ZERO GC ALLOCATIONS)
  // ==========================================================================
  ctx.onUpdate = (dt: number, elapsed: number) => {
    // Slowly rotate the suspended holographic advertisement ring
    for (let i = 0; i < holoSpinners.length; i++) {
      holoSpinners[i].obj.rotation.y += holoSpinners[i].speed * dt;
    }

    // Intermittent malfunctioning flicker on damaged neon storefront signs
    for (let i = 0; i < signFlickers.length; i++) {
      const sf = signFlickers[i];
      if (!sf.broken) continue;
      const w = Math.sin(elapsed * 7.3 + sf.phase) * Math.sin(elapsed * 19.7 + sf.phase * 2.1);
      sf.mat.emissiveIntensity = w > 0.62 ? sf.base * 0.14 : sf.base * (0.78 + 0.22 * Math.sin(elapsed * 2.2 + sf.phase));
    }

    // Glitch pulse on holographic ads & directory screen
    for (let i = 0; i < glitchScreens.length; i++) {
      const gs = glitchScreens[i];
      const pulse = Math.sin(elapsed * 5.1 + gs.phase);
      const drop = Math.sin(elapsed * 23.0 + gs.phase * 3.1) > 0.91 ? 0.22 : 1.0;
      gs.mat.emissiveIntensity = gs.base * (0.86 + 0.14 * pulse) * drop;
    }

    // Gentle drift of atmospheric dust & skylight motes
    const posAttr = moteGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < moteCount; i++) {
      let my = posAttr.getY(i) - dt * 0.18;
      let mx = posAttr.getX(i) + Math.sin(elapsed * 0.6 + i) * dt * 0.12;
      if (my < 0.3) my = 15.2;
      if (mx > 13.5) mx = -13.5;
      if (mx < -13.5) mx = 13.5;
      posAttr.setXY(i, mx, my);
    }
    posAttr.needsUpdate = true;
  };

  // Black & Blood-Red Alien Fungus — strictly localized to wet cracked fountain masonry & dark damp service bay
  addAlienFungusColonies(
    ctx,
    [
      { id: 'l3_fungus_fountain', kind: 'small', x: -3.4, y: 0.01, z: -51.6, scale: 0.95, substrate: 'damp_masonry', seed: 301 },
      { id: 'l3_fungus_service_1', kind: 'large', x: -18.5, y: 0.01, z: -76.5, scale: 1.0, substrate: 'decaying_wood', seed: 302 },
      { id: 'l3_fungus_service_wall', kind: 'spreading', x: -27.4, y: 1.9, z: -78.0, mount: 'wall_x_pos', scale: 1.0, seed: 303 },
      { id: 'l3_fungus_service_2', kind: 'small', x: 18.5, y: 0.01, z: -82.0, scale: 1.05, substrate: 'damp_masonry', seed: 304 },
    ],
    3033
  );

  return finalizeLevelWorld(ctx, new THREE.Vector3(0, 0, 17), 0);
}
