import * as THREE from 'three';

export type FungusGrowthType = 'small' | 'large' | 'spreading' | 'mature';

export type FungusSurfaceMount =
  | 'floor'
  | 'wall_x_pos' // Mounted on wall facing +X (e.g., West wall at x = -W)
  | 'wall_x_neg' // Mounted on wall facing -X (e.g., East wall at x = +W)
  | 'wall_z_pos' // Mounted on wall facing +Z (e.g., North wall at z = -L)
  | 'wall_z_neg' // Mounted on wall facing -Z (e.g., South wall at z = +L)
  | 'ceiling';

export interface FungusColonyPlacement {
  id?: string;
  kind: FungusGrowthType;
  x: number;
  y: number;
  z: number;
  mount?: FungusSurfaceMount;
  scale?: number;
  rotationY?: number;
  seed?: number;
  /** Optional subtle crimson ambient fill light on mature colonies (default true for mature) */
  withGlowLight?: boolean;
  /** Optional decaying substrate hint (adds damp soil / decaying timber base margin) */
  substrate?: 'damp_soil' | 'decaying_wood' | 'damp_masonry' | 'meteor_rock' | 'none';
}

interface AnimatedLobeRef {
  mesh: THREE.Object3D;
  baseScale: THREE.Vector3;
  phase: number;
  speed: number;
  amp: number;
  /** 0 = inner fleshy contraction, 1 = outer drying/expanding rim */
  role: 'flesh' | 'rim' | 'tendril';
}

interface AnimatedSporeCloud {
  points: THREE.Points;
  basePositions: Float32Array;
  phases: Float32Array;
  center: THREE.Vector3;
  radius: number;
}

export interface FungusColonyRuntime {
  id: string;
  kind: FungusGrowthType;
  position: THREE.Vector3;
  radius: number;
  group: THREE.Group;
  phase: number;
  lobes: AnimatedLobeRef[];
  localLight?: THREE.PointLight;
  baseLightIntensity: number;
  sporeCloud?: AnimatedSporeCloud;
  /** Dynamic slow drying/wetting & flashlight reaction state (0..1) */
  flashlightReaction: number;
  dryCyclePhase: number;
}

export interface AlienFungusTexturePack {
  albedoMap: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  emissiveMap: THREE.Texture;
  sporeDotMap: THREE.Texture;
  crustMat: THREE.MeshPhysicalMaterial;
  fleshMat: THREE.MeshPhysicalMaterial;
  veinMat: THREE.MeshPhysicalMaterial;
  cavityMat: THREE.MeshStandardMaterial;
  substrateSoilMat: THREE.MeshStandardMaterial;
  substrateWoodMat: THREE.MeshStandardMaterial;
  disposeables: { dispose: () => void }[];
}

export interface AlienFungusSystem {
  colonies: FungusColonyRuntime[];
  pack: AlienFungusTexturePack;
  dispose: () => void;
}

// ============================================================================
// DETERMINISTIC SEEDED PRNG (zero repetitive clones across colonies)
// ============================================================================
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2D(ix: number, iy: number, seed: number): number {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  n = (n ^ (n >>> 13)) | 0;
  n = Math.imul(n, 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise2D(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const y0 = ((yi % period) + period) % period;
  const y1 = (y0 + 1) % period;
  const a = hash2D(x0, y0, seed);
  const b = hash2D(x1, y0, seed);
  const c = hash2D(x0, y1, seed);
  const d = hash2D(x1, y1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbmTileable(u: number, v: number, baseFreq: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = baseFreq;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise2D(u * freq, v * freq, freq, seed + o * 97) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

// ============================================================================
// PROCEDURAL PHOTOREALISTIC BLACK & BLOOD-RED ALIEN FUNGUS TEXTURE PACK
// ============================================================================
export function createAlienFungusTexturePack(seed = 3059): AlienFungusTexturePack {
  const disposeables: { dispose: () => void }[] = [];

  // Headless / Node fallback so automated world audits never fail
  if (typeof document === 'undefined') {
    const dummy = new THREE.DataTexture(new Uint8Array([14, 7, 9, 255]), 1, 1);
    dummy.needsUpdate = true;
    disposeables.push(dummy);
    const crustMat = new THREE.MeshPhysicalMaterial({ color: 0x0d090b, roughness: 0.72, metalness: 0.02 });
    const fleshMat = new THREE.MeshPhysicalMaterial({ color: 0x1e080c, roughness: 0.42, metalness: 0.02, clearcoat: 0.8 });
    const veinMat = new THREE.MeshPhysicalMaterial({ color: 0x4a0812, emissive: 0x5c0914, emissiveIntensity: 0.34, roughness: 0.32, clearcoat: 0.9 });
    const cavityMat = new THREE.MeshStandardMaterial({ color: 0x180407, emissive: 0x45060e, emissiveIntensity: 0.32, roughness: 0.48 });
    const substrateSoilMat = new THREE.MeshStandardMaterial({ color: 0x181310, roughness: 0.96, metalness: 0.0 });
    const substrateWoodMat = new THREE.MeshStandardMaterial({ color: 0x261c15, roughness: 0.93, metalness: 0.01 });
    disposeables.push(crustMat, fleshMat, veinMat, cavityMat, substrateSoilMat, substrateWoodMat);
    return {
      albedoMap: dummy,
      normalMap: dummy,
      roughnessMap: dummy,
      emissiveMap: dummy,
      sporeDotMap: dummy,
      crustMat,
      fleshMat,
      veinMat,
      cavityMat,
      substrateSoilMat,
      substrateWoodMat,
      disposeables,
    };
  }

  const size = 512;
  const rng = mulberry32(seed);

  // 1. Heightfield buffer + vein mask + pore cavity mask + wet patch mask
  const heightBuf = new Float32Array(size * size);
  const poreMask = new Float32Array(size * size);
  const veinMask = new Float32Array(size * size);
  const crackMask = new Float32Array(size * size);
  const wetMask = new Float32Array(size * size);

  // Generate tileable foamy irregular pores / cavities (like real slime mold + horror biology)
  const poreCount = 72;
  const pores: { x: number; y: number; r: number; depth: number; crimson: number }[] = [];
  for (let i = 0; i < poreCount; i++) {
    pores.push({
      x: rng() * size,
      y: rng() * size,
      r: 5 + Math.pow(rng(), 1.6) * 24,
      depth: 0.45 + rng() * 0.55,
      crimson: rng(),
    });
  }

  // Generate organic dendritic blood-red veins on an offscreen canvas (tileable wrap)
  const veinCanvas = document.createElement('canvas');
  veinCanvas.width = size;
  veinCanvas.height = size;
  const vCtx = veinCanvas.getContext('2d')!;
  vCtx.fillStyle = '#000000';
  vCtx.fillRect(0, 0, size, size);

  const drawWrappedBranch = (
    x0: number,
    y0: number,
    angle: number,
    len: number,
    width: number,
    depth: number
  ) => {
    if (depth <= 0 || width < 0.7) return;
    const steps = 10;
    let cx = x0;
    let cy = y0;
    let curAng = angle;
    const stepLen = len / steps;

    for (let s = 0; s < steps; s++) {
      curAng += (rng() - 0.5) * 0.52;
      const nx = cx + Math.cos(curAng) * stepLen;
      const ny = cy + Math.sin(curAng) * stepLen;
      const w = Math.max(0.8, width * (1 - (s / steps) * 0.36));

      // Draw wrapped across tile boundaries
      for (const ox of [-size, 0, size]) {
        for (const oy of [-size, 0, size]) {
          vCtx.strokeStyle = `rgba(255,255,255,${Math.min(1, 0.55 + width * 0.08)})`;
          vCtx.lineWidth = w;
          vCtx.lineCap = 'round';
          vCtx.beginPath();
          vCtx.moveTo(cx + ox, cy + oy);
          vCtx.lineTo(nx + ox, ny + oy);
          vCtx.stroke();
        }
      }

      if (s > 2 && s < steps - 1 && rng() < 0.32) {
        const forkDir = rng() < 0.5 ? 1 : -1;
        drawWrappedBranch(
          nx,
          ny,
          curAng + forkDir * (0.45 + rng() * 0.55),
          len * (0.55 + rng() * 0.25),
          w * 0.65,
          depth - 1
        );
      }
      cx = nx;
      cy = ny;
    }
  };

  for (let b = 0; b < 16; b++) {
    drawWrappedBranch(
      rng() * size,
      rng() * size,
      rng() * Math.PI * 2,
      85 + rng() * 110,
      3.0 + rng() * 2.8,
      3
    );
  }
  const veinPixels = vCtx.getImageData(0, 0, size, size).data;

  // Populate multi-layered organic fields
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const idx = y * size + x;

      // Domain-warped organic fleshy folds
      const warpX = fbmTileable(u, v, 4, 3, seed + 11) * 0.14;
      const warpY = fbmTileable(u + 0.37, v + 0.61, 4, 3, seed + 29) * 0.14;
      const folds = fbmTileable(u + warpX, v + warpY, 6, 4, seed + 53);
      const ridge = 1.0 - Math.abs(folds * 2.0 - 1.0); // Sharp organic folds
      const fineGrain = fbmTileable(u, v, 24, 3, seed + 101);

      // Dried cracked outer crust fissures (ridged voronoi-like cracks)
      const crackNoise = Math.abs(fbmTileable(u + warpX * 0.5, v + warpY * 0.5, 8, 3, seed + 199) * 2 - 1);
      const crack = crackNoise < 0.085 ? 1.0 - crackNoise / 0.085 : 0.0;
      crackMask[idx] = crack;

      // Wet glistening pockets
      const wet = fbmTileable(u, v, 5, 3, seed + 307);
      wetMask[idx] = Math.max(0, Math.min(1, (wet - 0.36) * 2.2));

      // Raised branching veins from canvas
      const vm = veinPixels[idx * 4] / 255;
      veinMask[idx] = vm;

      // Base organic height
      let h = folds * 0.45 + ridge * 0.32 + fineGrain * 0.12 - crack * 0.36 + vm * 0.38;
      heightBuf[idx] = h;
    }
  }

  // Stamp porous irregular sponge cavities into height & pore mask (wrapped seamlessly)
  for (const p of pores) {
    const rPad = Math.ceil(p.r * 1.45);
    const cx0 = Math.floor(p.x);
    const cy0 = Math.floor(p.y);
    for (let dy = -rPad; dy <= rPad; dy++) {
      const py = ((cy0 + dy) % size + size) % size;
      for (let dx = -rPad; dx <= rPad; dx++) {
        const px = ((cx0 + dx) % size + size) % size;
        const dist = Math.hypot(dx, dy);
        // Irregular deformed cavity radius
        const ang = Math.atan2(dy, dx);
        const deform = 1.0 + 0.22 * Math.sin(ang * 3 + p.x) + 0.14 * Math.cos(ang * 5 + p.y);
        const nr = dist / (p.r * deform);
        if (nr < 1.35) {
          const idx = py * size + px;
          if (nr < 1.0) {
            // Concave porous pit
            const pit = (1 - nr * nr) * p.depth;
            heightBuf[idx] -= pit * 0.65;
            poreMask[idx] = Math.max(poreMask[idx], pit);
          } else {
            // Raised foamy rim around cavity
            const rimT = 1 - Math.abs(nr - 1.15) / 0.2;
            if (rimT > 0) heightBuf[idx] += rimT * 0.14 * p.depth;
          }
        }
      }
    }
  }

  // Build Albedo, Roughness, Emissive, and Normal canvases
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const albedoCtx = albedoCanvas.getContext('2d')!;
  const albedoImg = albedoCtx.createImageData(size, size);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d')!;
  const roughImg = roughCtx.createImageData(size, size);

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = size;
  emissiveCanvas.height = size;
  const emissiveCtx = emissiveCanvas.getContext('2d')!;
  const emissiveImg = emissiveCtx.createImageData(size, size);

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext('2d')!;
  const normalImg = normalCtx.createImageData(size, size);

  const normalStrength = 4.6;

  for (let y = 0; y < size; y++) {
    const ym1 = (y - 1 + size) % size;
    const yp1 = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm1 = (x - 1 + size) % size;
      const xp1 = (x + 1) % size;
      const idx = y * size + x;
      const p4 = idx * 4;

      const h = heightBuf[idx];
      const pore = poreMask[idx];
      const vein = veinMask[idx];
      const crack = crackMask[idx];
      const wet = wetMask[idx];

      // --- ALBEDO: Deep black outer mass, dark burgundy/maroon folds, blood-red veins, crimson cavities ---
      // Base obsidian-black / soot-maroon crust
      let r = 11 + h * 15;
      let g = 7 + h * 7;
      let b = 9 + h * 9;

      // Subtle dark burgundy subcutaneous tint in wet fleshy folds
      const fleshTint = wet * (1 - crack) * 0.65;
      r += fleshTint * 28;
      g += fleshTint * 4;
      b += fleshTint * 7;

      // Dried cracked crust edge dust (ashy dark charcoal)
      if (crack > 0.05) {
        r = r * (1 - crack * 0.45) + 34 * crack * 0.45;
        g = g * (1 - crack * 0.5) + 12 * crack * 0.5;
        b = b * (1 - crack * 0.5) + 14 * crack * 0.5;
      }

      // Deep dark-crimson porous cavity interior with AO rim darkening
      if (pore > 0.02) {
        const rimDark = pore < 0.35 ? 1 - pore * 1.1 : 0.62;
        r *= rimDark;
        g *= rimDark;
        b *= rimDark;
        if (pore > 0.35) {
          const core = (pore - 0.35) / 0.65;
          r += core * 68; // Dark blood-red internal pore core
          g += core * 6;
          b += core * 10;
        }
      }

      // Raised blood-red / dark crimson branching veins (never cartoon neon red!)
      if (vein > 0.04) {
        const vBlend = Math.min(1, vein * 1.15);
        const vr = 88 + vein * 42; // Rich dark blood-red (#580812 .. #820e1b)
        const vg = 9 + vein * 8;
        const vb = 15 + vein * 11;
        r = r * (1 - vBlend) + vr * vBlend;
        g = g * (1 - vBlend) + vg * vBlend;
        b = b * (1 - vBlend) + vb * vBlend;
      }

      albedoImg.data[p4] = Math.max(0, Math.min(255, Math.round(r)));
      albedoImg.data[p4 + 1] = Math.max(0, Math.min(255, Math.round(g)));
      albedoImg.data[p4 + 2] = Math.max(0, Math.min(255, Math.round(b)));
      albedoImg.data[p4 + 3] = 255;

      // --- ROUGHNESS: Dry cracked outer crust (matte ~0.88) vs wet fleshy/vein patches (~0.18-0.36) ---
      let rough = 0.86 - wet * 0.54; // Dry outer patches matte, wet slime patches glossy
      rough += crack * 0.18; // Cracks stay very rough & dry
      rough = rough * (1 - vein * 0.72) + 0.22 * (vein * 0.72); // Veins are wet & catch flashlight
      if (pore > 0.45) rough = Math.min(rough, 0.34); // Wet cavity interiors
      const rByte = Math.max(38, Math.min(244, Math.round(rough * 255)));
      roughImg.data[p4] = rByte;
      roughImg.data[p4 + 1] = rByte;
      roughImg.data[p4 + 2] = rByte;
      roughImg.data[p4 + 3] = 255;

      // --- EMISSIVE: Subtle deep internal crimson glow ONLY in veins, deep cracks, and cavity cores ---
      const veinGlow = Math.pow(vein, 1.35) * 0.85;
      const cavityGlow = pore > 0.42 ? ((pore - 0.42) / 0.58) * 0.62 : 0;
      const fissureGlow = crack > 0.55 ? ((crack - 0.55) / 0.45) * 0.28 : 0;
      const glow = Math.min(1, Math.max(veinGlow, cavityGlow, fissureGlow));
      emissiveImg.data[p4] = Math.round(glow * 128); // Muted deep blood-crimson (#800912 max)
      emissiveImg.data[p4 + 1] = Math.round(glow * 8);
      emissiveImg.data[p4 + 2] = Math.round(glow * 16);
      emissiveImg.data[p4 + 3] = 255;

      // --- TANGENT-SPACE NORMAL MAP FROM HEIGHTFIELD ---
      const dX = (heightBuf[y * size + xp1] - heightBuf[y * size + xm1]) * normalStrength;
      const dY = (heightBuf[yp1 * size + x] - heightBuf[ym1 * size + x]) * normalStrength;
      let nx = -dX;
      let ny = -dY;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;
      normalImg.data[p4] = Math.round((nx * 0.5 + 0.5) * 255);
      normalImg.data[p4 + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalImg.data[p4 + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalImg.data[p4 + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoImg, 0, 0);
  roughCtx.putImageData(roughImg, 0, 0);
  emissiveCtx.putImageData(emissiveImg, 0, 0);
  normalCtx.putImageData(normalImg, 0, 0);

  const configureTex = (canvas: HTMLCanvasElement, isColor: boolean): THREE.CanvasTexture => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    disposeables.push(tex);
    return tex;
  };

  const albedoMap = configureTex(albedoCanvas, true);
  const normalMap = configureTex(normalCanvas, false);
  const roughnessMap = configureTex(roughCanvas, false);
  const emissiveMap = configureTex(emissiveCanvas, true);

  // Soft circular organic spore fleck sprite (ZERO square particles!)
  const dotCanvas = document.createElement('canvas');
  dotCanvas.width = 64;
  dotCanvas.height = 64;
  const dCtx = dotCanvas.getContext('2d')!;
  const grad = dCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(130, 18, 28, 0.85)');
  grad.addColorStop(0.45, 'rgba(54, 7, 14, 0.52)');
  grad.addColorStop(1, 'rgba(10, 4, 6, 0.0)');
  dCtx.fillStyle = grad;
  dCtx.fillRect(0, 0, 64, 64);
  const sporeDotMap = new THREE.CanvasTexture(dotCanvas);
  sporeDotMap.colorSpace = THREE.SRGBColorSpace;
  disposeables.push(sporeDotMap);

  // --- SHARED HIGH-DETAIL PHYSICAL MATERIALS ---
  // 1. Thick black outer crust with dried matte cracks + wet glistening pockets
  const crustMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: albedoMap,
    normalMap,
    normalScale: new THREE.Vector2(1.85, 1.85),
    roughnessMap,
    roughness: 0.92,
    metalness: 0.02,
    clearcoat: 0.58,
    clearcoatRoughness: 0.42,
    clearcoatRoughnessMap: roughnessMap,
    emissive: 0xffffff,
    emissiveMap,
    emissiveIntensity: 0.28,
    envMapIntensity: 0.55,
  });

  // 2. Wet fleshy inner lobes — dark maroon-black, higher clearcoat sheen for unsettling flashlight glint
  const fleshMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8b4ba,
    map: albedoMap,
    normalMap,
    normalScale: new THREE.Vector2(1.65, 1.65),
    roughnessMap,
    roughness: 0.58,
    metalness: 0.02,
    clearcoat: 0.84,
    clearcoatRoughness: 0.22,
    clearcoatRoughnessMap: roughnessMap,
    emissive: 0xffffff,
    emissiveMap,
    emissiveIntensity: 0.36,
    envMapIntensity: 0.62,
  });

  // 3. Raised blood-red / dark crimson branching arterial vein filaments
  const veinMat = new THREE.MeshPhysicalMaterial({
    color: 0x4d0913,
    normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughness: 0.3,
    metalness: 0.03,
    clearcoat: 0.92,
    clearcoatRoughness: 0.14,
    emissive: 0x6e0b16,
    emissiveIntensity: 0.34,
    envMapIntensity: 0.68,
  });

  // 4. Deep dark-red recessed cavity interiors
  const cavityMat = new THREE.MeshStandardMaterial({
    color: 0x160306,
    normalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
    emissive: 0x560710,
    emissiveIntensity: 0.42,
    roughness: 0.38,
    metalness: 0.02,
    envMapIntensity: 0.32,
  });

  // 5. Suitable organic substrate patches (damp soil & decaying wood) so colonies feel grounded
  const substrateSoilMat = new THREE.MeshStandardMaterial({
    color: 0x191411,
    normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.14,
  });

  const substrateWoodMat = new THREE.MeshStandardMaterial({
    color: 0x2b2017,
    normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughness: 0.93,
    metalness: 0.01,
    envMapIntensity: 0.16,
  });

  disposeables.push(crustMat, fleshMat, veinMat, cavityMat, substrateSoilMat, substrateWoodMat);

  return {
    albedoMap,
    normalMap,
    roughnessMap,
    emissiveMap,
    sporeDotMap,
    crustMat,
    fleshMat,
    veinMat,
    cavityMat,
    substrateSoilMat,
    substrateWoodMat,
    disposeables,
  };
}

// ============================================================================
// ORGANIC PROCEDURAL GEOMETRY HELPERS (Foamy irregular masses, craters, veins)
// ============================================================================
function createFoamyOrganicMassGeometry(
  radiusX: number,
  heightY: number,
  radiusZ: number,
  seed: number,
  detail = 3,
  withCentralCavity = false
): THREE.BufferGeometry {
  // Start from an icosahedron and sculpt into a grounded, irregular foamy slime-mold dome
  const geo = new THREE.IcosahedronGeometry(1.0, detail);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const rng = mulberry32(seed);
  const p1 = rng() * 10;
  const p2 = rng() * 10;
  const p3 = rng() * 10;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Flatten underside so it sits flush and organically hugs the surface without floating/clipping
    const isBottom = y < 0;
    const ny = isBottom ? y * 0.14 : Math.pow(y, 0.84);

    // Multi-frequency organic folds, irregular scalloping & foamy bumps
    const ang = Math.atan2(z, x);
    const radial = Math.hypot(x, z);
    const scallop =
      1.0 +
      0.24 * Math.sin(ang * 3.0 + p1) +
      0.16 * Math.cos(ang * 5.0 - p2) +
      0.11 * Math.sin(ang * 7.0 + p3);
    const lump =
      0.14 * Math.sin(x * 4.5 + p1) * Math.cos(z * 4.2 + p2) +
      0.09 * Math.cos(y * 6.0 + x * 5.1 - p3) +
      0.06 * Math.sin((x + z) * 9.5 + p2);

    let sx = x * scallop * (1 + lump) * radiusX;
    let sz = z * scallop * (1 + lump) * radiusZ;
    let sy = (ny + (isBottom ? 0 : lump * 0.42)) * heightY;

    // Optional deep irregular crater cavity in top of mature colonies
    if (withCentralCavity && !isBottom && radial < 0.56) {
      const cavFactor = 1.0 - radial / 0.56;
      const irregRim = 0.85 + 0.15 * Math.sin(ang * 4.0 + p2);
      sy -= cavFactor * cavFactor * heightY * 0.72 * irregRim;
    }

    // Clamp bottom near y = -0.02 so it anchors cleanly into floors/walls
    if (sy < -0.025) sy = -0.025;
    pos.setXYZ(i, sx, sy, sz);
  }

  geo.computeVertexNormals();
  return geo;
}

function createCreepingVeinTube(
  points: THREE.Vector3[],
  radiusStart: number,
  radiusEnd: number,
  tubularSegments: number,
  radialSegments = 6
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, tubularSegments, 1.0, radialSegments, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const ringVerts = radialSegments + 1;

  for (let s = 0; s <= tubularSegments; s++) {
    const t = s / tubularSegments;
    const center = curve.getPointAt(t);
    // Natural organic tapering + slight peristaltic node swelling along vein
    const swell = 1.0 + 0.18 * Math.sin(t * Math.PI * 5.0);
    const r = THREE.MathUtils.lerp(radiusStart, radiusEnd, Math.pow(t, 0.8)) * swell;
    for (let k = 0; k < ringVerts; k++) {
      const idx = s * ringVerts + k;
      const vx = pos.getX(idx) - center.x;
      const vy = pos.getY(idx) - center.y;
      const vz = pos.getZ(idx) - center.z;
      pos.setXYZ(idx, center.x + vx * r, center.y + vy * r, center.z + vz * r);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

function addSurfaceVeinBranch(
  parent: THREE.Group,
  pack: AlienFungusTexturePack,
  disposeables: { dispose: () => void }[],
  lobes: AnimatedLobeRef[],
  rng: () => number,
  startX: number,
  startZ: number,
  baseY: number,
  angle: number,
  length: number,
  radiusStart: number,
  depth: number,
  isVeinMaterial: boolean,
  climbHeight = 0
): void {
  if (depth <= 0 || length < 0.14 || radiusStart < 0.008) return;

  const steps = Math.max(4, Math.min(10, Math.round(length * 4.5)));
  const pts: THREE.Vector3[] = [];
  let cx = startX;
  let cz = startZ;
  let cy = baseY;
  let ang = angle;
  const stepLen = length / steps;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const yLift =
      climbHeight > 0
        ? t * climbHeight
        : baseY * (1 - t * 0.72) + Math.max(0.008, radiusStart * (1 - t * 0.6)) + Math.sin(t * Math.PI * 2 + rng()) * 0.012;
    pts.push(new THREE.Vector3(cx, Math.max(0.008, yLift), cz));
    ang += (rng() - 0.5) * 0.55;
    cx += Math.cos(ang) * stepLen;
    cz += Math.sin(ang) * stepLen;
    cy = yLift;
  }

  const geo = createCreepingVeinTube(pts, radiusStart, Math.max(0.007, radiusStart * 0.24), steps * 2, 5);
  disposeables.push(geo);
  const mesh = new THREE.Mesh(geo, isVeinMaterial ? pack.veinMat : pack.crustMat);
  mesh.castShadow = radiusStart > 0.035;
  mesh.receiveShadow = true;
  parent.add(mesh);

  if (depth === 1) {
    lobes.push({
      mesh,
      baseScale: mesh.scale.clone(),
      phase: rng() * Math.PI * 2,
      speed: 0.18 + rng() * 0.16,
      amp: 0.028 + rng() * 0.018,
      role: 'tendril',
    });
  }

  // Spawn irregular secondary sub-branches along the vein like real Physarum slime mold networks
  if (depth > 1) {
    const branchCount = depth >= 3 ? 2 : 1;
    for (let b = 0; b < branchCount; b++) {
      const splitIdx = Math.min(pts.length - 2, Math.max(1, Math.floor(pts.length * (0.38 + b * 0.28 + rng() * 0.14))));
      const sp = pts[splitIdx];
      const forkSign = b % 2 === 0 ? 1 : -1;
      addSurfaceVeinBranch(
        parent,
        pack,
        disposeables,
        lobes,
        rng,
        sp.x,
        sp.z,
        sp.y,
        ang + forkSign * (0.42 + rng() * 0.58),
        length * (0.52 + rng() * 0.22),
        radiusStart * 0.58,
        depth - 1,
        isVeinMaterial || rng() < 0.72,
        climbHeight * 0.55
      );
    }

    // Small fleshy nodal swelling at primary junctions
    if (rng() < 0.65) {
      const jPt = pts[Math.floor(pts.length * 0.5)];
      const nodeGeo = createFoamyOrganicMassGeometry(
        radiusStart * 2.1,
        radiusStart * 1.4,
        radiusStart * 1.9,
        Math.floor(rng() * 100000),
        1
      );
      disposeables.push(nodeGeo);
      const node = new THREE.Mesh(nodeGeo, rng() < 0.55 ? pack.fleshMat : pack.crustMat);
      node.position.set(jPt.x, Math.max(0.005, jPt.y - radiusStart * 0.3), jPt.z);
      node.receiveShadow = true;
      parent.add(node);
    }
  }

  // Keep reference to final cy to avoid unused var
  void cy;
}

function addSubstrateBase(
  parent: THREE.Group,
  pack: AlienFungusTexturePack,
  disposeables: { dispose: () => void }[],
  rng: () => number,
  substrate: FungusColonyPlacement['substrate'],
  radius: number
): void {
  if (!substrate || substrate === 'none' || substrate === 'damp_masonry' || substrate === 'meteor_rock') return;

  if (substrate === 'damp_soil') {
    const moundGeo = createFoamyOrganicMassGeometry(
      radius * 1.28,
      0.065,
      radius * 1.18,
      Math.floor(rng() * 99999),
      2
    );
    disposeables.push(moundGeo);
    const mound = new THREE.Mesh(moundGeo, pack.substrateSoilMat);
    mound.position.y = -0.012;
    mound.receiveShadow = true;
    parent.add(mound);
  } else if (substrate === 'decaying_wood') {
    // 2–3 rotted, splintered timber planks partially consumed by the fungal colony
    const plankCount = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < plankCount; i++) {
      const len = radius * (1.2 + rng() * 0.7);
      const plankGeo = new THREE.BoxGeometry(len, 0.045, 0.22 + rng() * 0.1);
      disposeables.push(plankGeo);
      const plank = new THREE.Mesh(plankGeo, pack.substrateWoodMat);
      plank.position.set((rng() - 0.5) * radius * 0.5, 0.022, (rng() - 0.5) * radius * 0.5);
      plank.rotation.y = rng() * Math.PI;
      plank.rotation.z = (rng() - 0.5) * 0.05;
      plank.receiveShadow = true;
      plank.castShadow = true;
      parent.add(plank);
    }
  }
}

// ============================================================================
// BUILD THE FOUR VARIATIONS: SMALL, LARGE, SPREADING, MATURE
// ============================================================================
function buildSmallColony(
  root: THREE.Group,
  pack: AlienFungusTexturePack,
  disposeables: { dispose: () => void }[],
  lobes: AnimatedLobeRef[],
  rng: () => number,
  scale: number
): number {
  const r = 0.48 * scale;

  // Irregular low-profile black organic patch with scalloped fleshy edges
  const baseGeo = createFoamyOrganicMassGeometry(r, 0.11 * scale, r * (0.8 + rng() * 0.35), Math.floor(rng() * 1e6), 2);
  disposeables.push(baseGeo);
  const baseMesh = new THREE.Mesh(baseGeo, pack.crustMat);
  baseMesh.receiveShadow = true;
  baseMesh.castShadow = true;
  root.add(baseMesh);
  lobes.push({
    mesh: baseMesh,
    baseScale: baseMesh.scale.clone(),
    phase: rng() * Math.PI * 2,
    speed: 0.32 + rng() * 0.14,
    amp: 0.018,
    role: 'rim',
  });

  // 2–3 wet fleshy raised foam nodules
  const nodCount = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < nodCount; i++) {
    const a = rng() * Math.PI * 2;
    const d = r * (0.18 + rng() * 0.42);
    const nr = r * (0.28 + rng() * 0.22);
    const geo = createFoamyOrganicMassGeometry(nr, 0.095 * scale, nr * 0.9, Math.floor(rng() * 1e6), 2);
    disposeables.push(geo);
    const m = new THREE.Mesh(geo, i === 0 ? pack.fleshMat : pack.crustMat);
    m.position.set(Math.cos(a) * d, 0.015 * scale, Math.sin(a) * d);
    m.receiveShadow = true;
    m.castShadow = true;
    root.add(m);
    lobes.push({
      mesh: m,
      baseScale: m.scale.clone(),
      phase: rng() * Math.PI * 2,
      speed: 0.4 + rng() * 0.2,
      amp: 0.024,
      role: 'flesh',
    });
  }

  // 4–5 thin crimson veins branching outward onto the surrounding surface
  const veinCount = 4 + Math.floor(rng() * 2);
  for (let v = 0; v < veinCount; v++) {
    const ang = (v / veinCount) * Math.PI * 2 + (rng() - 0.5) * 0.55;
    addSurfaceVeinBranch(
      root,
      pack,
      disposeables,
      lobes,
      rng,
      Math.cos(ang) * r * 0.45,
      Math.sin(ang) * r * 0.45,
      0.04 * scale,
      ang,
      (0.45 + rng() * 0.45) * scale,
      0.02 * scale,
      2,
      true
    );
  }

  return r * 1.9;
}

function buildLargeColony(
  root: THREE.Group,
  pack: AlienFungusTexturePack,
  disposeables: { dispose: () => void }[],
  lobes: AnimatedLobeRef[],
  rng: () => number,
  scale: number
): number {
  const r = 0.92 * scale;

  // Primary thick black folded organic mass
  const mainGeo = createFoamyOrganicMassGeometry(r, 0.32 * scale, r * (0.82 + rng() * 0.3), Math.floor(rng() * 1e6), 3);
  disposeables.push(mainGeo);
  const mainMesh = new THREE.Mesh(mainGeo, pack.crustMat);
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  root.add(mainMesh);
  lobes.push({
    mesh: mainMesh,
    baseScale: mainMesh.scale.clone(),
    phase: rng() * Math.PI * 2,
    speed: 0.26 + rng() * 0.12,
    amp: 0.017,
    role: 'rim',
  });

  // Wet fleshy inner folds protruding through outer crust
  for (let f = 0; f < 3; f++) {
    const fa = (f / 3) * Math.PI * 2 + rng() * 0.8;
    const fd = r * (0.24 + rng() * 0.28);
    const fr = r * (0.34 + rng() * 0.16);
    const fGeo = createFoamyOrganicMassGeometry(fr, 0.26 * scale, fr * 0.88, Math.floor(rng() * 1e6), 2);
    disposeables.push(fGeo);
    const fMesh = new THREE.Mesh(fGeo, pack.fleshMat);
    fMesh.position.set(Math.cos(fa) * fd, 0.06 * scale, Math.sin(fa) * fd);
    fMesh.castShadow = true;
    fMesh.receiveShadow = true;
    root.add(fMesh);
    lobes.push({
      mesh: fMesh,
      baseScale: fMesh.scale.clone(),
      phase: rng() * Math.PI * 2,
      speed: 0.36 + rng() * 0.16,
      amp: 0.025,
      role: 'flesh',
    });
  }

  // 2–3 connected satellite formations bridged by thick arterial crimson veins
  const satCount = 2 + Math.floor(rng() * 2);
  for (let s = 0; s < satCount; s++) {
    const sa = (s / satCount) * Math.PI * 2 + (rng() - 0.5) * 0.7;
    const sd = r * (1.05 + rng() * 0.45);
    const sx = Math.cos(sa) * sd;
    const sz = Math.sin(sa) * sd;
    const sr = r * (0.38 + rng() * 0.18);

    const satGeo = createFoamyOrganicMassGeometry(sr, 0.18 * scale, sr * 0.9, Math.floor(rng() * 1e6), 2);
    disposeables.push(satGeo);
    const satMesh = new THREE.Mesh(satGeo, s % 2 === 0 ? pack.crustMat : pack.fleshMat);
    satMesh.position.set(sx, 0, sz);
    satMesh.castShadow = true;
    satMesh.receiveShadow = true;
    root.add(satMesh);
    lobes.push({
      mesh: satMesh,
      baseScale: satMesh.scale.clone(),
      phase: rng() * Math.PI * 2,
      speed: 0.3 + rng() * 0.15,
      amp: 0.02,
      role: 'flesh',
    });

    // Connecting thick blood-red arterial vein bridge
    const midX = sx * 0.5 + (rng() - 0.5) * 0.22 * scale;
    const midZ = sz * 0.5 + (rng() - 0.5) * 0.22 * scale;
    const bridgeGeo = createCreepingVeinTube(
      [
        new THREE.Vector3(Math.cos(sa) * r * 0.55, 0.12 * scale, Math.sin(sa) * r * 0.55),
        new THREE.Vector3(midX, 0.055 * scale, midZ),
        new THREE.Vector3(sx, 0.08 * scale, sz),
      ],
      0.048 * scale,
      0.032 * scale,
      10,
      6
    );
    disposeables.push(bridgeGeo);
    const bridge = new THREE.Mesh(bridgeGeo, pack.veinMat);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    root.add(bridge);
  }

  // Dense radiating blood-red branching veins
  const veinCount = 7;
  for (let v = 0; v < veinCount; v++) {
    const ang = (v / veinCount) * Math.PI * 2 + (rng() - 0.5) * 0.45;
    addSurfaceVeinBranch(
      root,
      pack,
      disposeables,
      lobes,
      rng,
      Math.cos(ang) * r * 0.52,
      Math.sin(ang) * r * 0.52,
      0.13 * scale,
      ang,
      (0.85 + rng() * 0.65) * scale,
      0.036 * scale,
      3,
      v % 3 !== 0
    );
  }

  return r * 2.2;
}

function buildSpreadingNetwork(
  root: THREE.Group,
  pack: AlienFungusTexturePack,
  disposeables: { dispose: () => void }[],
  lobes: AnimatedLobeRef[],
  rng: () => number,
  scale: number
): number {
  // Compact dark origin hub + long sprawling slime-mold dendritic vein & tendril network
  const hubR = 0.42 * scale;
  const hubGeo = createFoamyOrganicMassGeometry(hubR, 0.14 * scale, hubR * 0.88, Math.floor(rng() * 1e6), 2);
  disposeables.push(hubGeo);
  const hubMesh = new THREE.Mesh(hubGeo, pack.fleshMat);
  hubMesh.receiveShadow = true;
  hubMesh.castShadow = true;
  root.add(hubMesh);
  lobes.push({
    mesh: hubMesh,
    baseScale: hubMesh.scale.clone(),
    phase: rng() * Math.PI * 2,
    speed: 0.34,
    amp: 0.022,
    role: 'flesh',
  });

  // 5–7 long spreading branching tendrils (intertwined black outer sheaths + blood-red inner veins)
  const armCount = 5 + Math.floor(rng() * 3);
  for (let a = 0; a < armCount; a++) {
    const ang = (a / armCount) * Math.PI * 2 + (rng() - 0.5) * 0.4;
    const armLen = (1.45 + rng() * 1.15) * scale;
    // Outer dark black organic tendril sheath
    addSurfaceVeinBranch(
      root,
      pack,
      disposeables,
      lobes,
      rng,
      Math.cos(ang) * hubR * 0.4,
      Math.sin(ang) * hubR * 0.4,
      0.05 * scale,
      ang,
      armLen,
      0.044 * scale,
      3,
      false
    );
    // Raised blood-red capillary vein running along/beside the sheath
    addSurfaceVeinBranch(
      root,
      pack,
      disposeables,
      lobes,
      rng,
      Math.cos(ang + 0.08) * hubR * 0.35,
      Math.sin(ang + 0.08) * hubR * 0.35,
      0.062 * scale,
      ang + (rng() - 0.5) * 0.14,
      armLen * 0.92,
      0.025 * scale,
      3,
      true
    );
  }

  return 2.4 * scale;
}

function buildMatureColony(
  root: THREE.Group,
  pack: AlienFungusTexturePack,
  disposeables: { dispose: () => void }[],
  lobes: AnimatedLobeRef[],
  rng: () => number,
  scale: number
): { radius: number; sporeCloud: AnimatedSporeCloud } {
  const r = 1.28 * scale;

  // Layer 1: Massive thick cracked black outer shell with sculpted deep internal cavity
  const outerGeo = createFoamyOrganicMassGeometry(
    r,
    0.78 * scale,
    r * (0.86 + rng() * 0.24),
    Math.floor(rng() * 1e6),
    3,
    true
  );
  disposeables.push(outerGeo);
  const outerMesh = new THREE.Mesh(outerGeo, pack.crustMat);
  outerMesh.castShadow = true;
  outerMesh.receiveShadow = true;
  root.add(outerMesh);
  lobes.push({
    mesh: outerMesh,
    baseScale: outerMesh.scale.clone(),
    phase: rng() * Math.PI * 2,
    speed: 0.22,
    amp: 0.015,
    role: 'rim',
  });

  // Layer 2: Deep dark-crimson internal cavity lining visible inside the broken top hollow
  const cavGeo = createFoamyOrganicMassGeometry(r * 0.46, 0.22 * scale, r * 0.42, Math.floor(rng() * 1e6), 2);
  disposeables.push(cavGeo);
  const cavMesh = new THREE.Mesh(cavGeo, pack.cavityMat);
  cavMesh.position.y = 0.24 * scale;
  root.add(cavMesh);
  lobes.push({
    mesh: cavMesh,
    baseScale: cavMesh.scale.clone(),
    phase: rng() * Math.PI * 2,
    speed: 0.42,
    amp: 0.032,
    role: 'flesh',
  });

  // Layer 3: Terraced overhanging fleshy folds & dark bulbous shelves around the perimeter
  const terraceCount = 5;
  for (let t = 0; t < terraceCount; t++) {
    const ta = (t / terraceCount) * Math.PI * 2 + (rng() - 0.5) * 0.38;
    const td = r * (0.58 + rng() * 0.24);
    const tr = r * (0.36 + rng() * 0.18);
    const th = (0.34 + rng() * 0.28) * scale;
    const tGeo = createFoamyOrganicMassGeometry(tr, th, tr * 0.85, Math.floor(rng() * 1e6), 2);
    disposeables.push(tGeo);
    const tMesh = new THREE.Mesh(tGeo, t % 2 === 0 ? pack.fleshMat : pack.crustMat);
    tMesh.position.set(Math.cos(ta) * td, (0.04 + (t % 2) * 0.1) * scale, Math.sin(ta) * td);
    tMesh.castShadow = true;
    tMesh.receiveShadow = true;
    root.add(tMesh);
    lobes.push({
      mesh: tMesh,
      baseScale: tMesh.scale.clone(),
      phase: rng() * Math.PI * 2,
      speed: 0.3 + rng() * 0.14,
      amp: 0.022,
      role: 'flesh',
    });
  }

  // Layer 4: Secondary sculpted dark crimson pore cavities embedded in outer flanks
  for (let c = 0; c < 4; c++) {
    const ca = (c / 4) * Math.PI * 2 + rng() * 0.7;
    const poreGeo = new THREE.TorusGeometry(0.14 * scale, 0.048 * scale, 6, 12);
    disposeables.push(poreGeo);
    const rim = new THREE.Mesh(poreGeo, pack.fleshMat);
    const px = Math.cos(ca) * r * 0.72;
    const pz = Math.sin(ca) * r * 0.72;
    const py = (0.28 + rng() * 0.24) * scale;
    rim.position.set(px, py, pz);
    rim.lookAt(px * 2.2, py + 0.15 * scale, pz * 2.2);
    root.add(rim);

    const pitGeo = new THREE.CircleGeometry(0.125 * scale, 10);
    disposeables.push(pitGeo);
    const pit = new THREE.Mesh(pitGeo, pack.cavityMat);
    pit.position.copy(rim.position);
    pit.quaternion.copy(rim.quaternion);
    pit.translateZ(-0.015 * scale);
    root.add(pit);
  }

  // Layer 5: Thick gripping blood-red arterial root veins radiating across the surrounding structure
  const rootVeins = 9;
  for (let v = 0; v < rootVeins; v++) {
    const ang = (v / rootVeins) * Math.PI * 2 + (rng() - 0.5) * 0.32;
    addSurfaceVeinBranch(
      root,
      pack,
      disposeables,
      lobes,
      rng,
      Math.cos(ang) * r * 0.55,
      Math.sin(ang) * r * 0.55,
      0.34 * scale,
      ang,
      (1.15 + rng() * 0.85) * scale,
      0.052 * scale,
      3,
      v % 3 !== 1
    );
  }

  // Subtle slow-drifting dark crimson/black organic spore motes (strictly low count, round soft alpha sprite)
  const count = 18;
  const positions = new Float32Array(count * 3);
  const basePositions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const d = Math.sqrt(rng()) * r * 1.15;
    const py = 0.28 * scale + rng() * 1.15 * scale;
    const px = Math.cos(a) * d;
    const pz = Math.sin(a) * d;
    positions[i * 3] = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;
    basePositions[i * 3] = px;
    basePositions[i * 3 + 1] = py;
    basePositions[i * 3 + 2] = pz;
    phases[i] = rng() * Math.PI * 2;
  }
  const sporeGeo = new THREE.BufferGeometry();
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const sporeMat = new THREE.PointsMaterial({
    map: pack.sporeDotMap,
    color: 0x8f1a26,
    size: 0.085 * scale,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
  disposeables.push(sporeGeo, sporeMat);
  const points = new THREE.Points(sporeGeo, sporeMat);
  root.add(points);

  return {
    radius: r * 2.4,
    sporeCloud: {
      points,
      basePositions,
      phases,
      center: new THREE.Vector3(),
      radius: r,
    },
  };
}

// ============================================================================
// PUBLIC SYSTEM BUILDER
// ============================================================================
export function buildAlienFungusSystem(
  scene: THREE.Scene,
  placements: FungusColonyPlacement[],
  levelSeed = 3059
): AlienFungusSystem {
  const pack = createAlienFungusTexturePack(levelSeed);
  const disposeables: { dispose: () => void }[] = [...pack.disposeables];
  const colonies: FungusColonyRuntime[] = [];

  placements.forEach((p, idx) => {
    const rng = mulberry32((p.seed ?? levelSeed * 131 + idx * 7919) >>> 0);
    const scale = p.scale ?? 1.0;
    const mount = p.mount ?? 'floor';

    const outerGroup = new THREE.Group();
    outerGroup.position.set(p.x, p.y, p.z);

    // Orient local +Y axis along the host surface normal
    if (mount === 'wall_x_pos') {
      outerGroup.rotation.z = -Math.PI / 2;
    } else if (mount === 'wall_x_neg') {
      outerGroup.rotation.z = Math.PI / 2;
    } else if (mount === 'wall_z_pos') {
      outerGroup.rotation.x = Math.PI / 2;
    } else if (mount === 'wall_z_neg') {
      outerGroup.rotation.x = -Math.PI / 2;
    } else if (mount === 'ceiling') {
      outerGroup.rotation.x = Math.PI;
    }

    const innerGroup = new THREE.Group();
    innerGroup.rotation.y = p.rotationY ?? rng() * Math.PI * 2;
    outerGroup.add(innerGroup);

    const lobes: AnimatedLobeRef[] = [];
    let radius = 0.8 * scale;
    let sporeCloud: AnimatedSporeCloud | undefined;
    let localLight: THREE.PointLight | undefined;
    let baseLightIntensity = 0;

    // Optional organic substrate grounding (damp soil / decaying wood) on floor-mounted colonies
    if (mount === 'floor' && p.substrate && p.substrate !== 'none') {
      const subRadius = p.kind === 'mature' ? 1.35 * scale : p.kind === 'large' ? 1.0 * scale : 0.65 * scale;
      addSubstrateBase(innerGroup, pack, disposeables, rng, p.substrate, subRadius);
    }

    if (p.kind === 'small') {
      radius = buildSmallColony(innerGroup, pack, disposeables, lobes, rng, scale);
    } else if (p.kind === 'large') {
      radius = buildLargeColony(innerGroup, pack, disposeables, lobes, rng, scale);
    } else if (p.kind === 'spreading') {
      radius = buildSpreadingNetwork(innerGroup, pack, disposeables, lobes, rng, scale);
    } else {
      const mature = buildMatureColony(innerGroup, pack, disposeables, lobes, rng, scale);
      radius = mature.radius;
      sporeCloud = mature.sporeCloud;

      // Subtle localized deep crimson ambient fill (dark horror mood — never bright or washed out)
      if (p.withGlowLight !== false) {
        baseLightIntensity = 0.58 * Math.min(1.3, scale);
        localLight = new THREE.PointLight(0x7a0c18, baseLightIntensity, 6.8 * Math.max(0.85, scale), 1.85);
        localLight.position.set(0, 0.72 * scale, 0);
        innerGroup.add(localLight);
      }
    }

    scene.add(outerGroup);

    colonies.push({
      id: p.id ?? `fungus_${idx}_${p.kind}`,
      kind: p.kind,
      position: new THREE.Vector3(p.x, p.y, p.z),
      radius,
      group: outerGroup,
      phase: rng() * Math.PI * 2,
      lobes,
      localLight,
      baseLightIntensity,
      sporeCloud,
      flashlightReaction: 0,
      dryCyclePhase: rng() * Math.PI * 2,
    });
  });

  return {
    colonies,
    pack,
    dispose: () => {
      for (const d of disposeables) {
        try {
          d.dispose();
        } catch {
          // ignore cleanup errors
        }
      }
    },
  };
}

// ============================================================================
// SUBTLE ORGANIC ANIMATION, SLOW VEIN PULSE & FLASHLIGHT REACTION LOOP
// ============================================================================
const _toColony = new THREE.Vector3();

export function updateAlienFungusSystem(
  system: AlienFungusSystem | undefined,
  dt: number,
  elapsed: number,
  playerPos: THREE.Vector3,
  camForward?: THREE.Vector3,
  flashlightOn = false
): void {
  if (!system || system.colonies.length === 0) return;

  // 1. Ultra-slow global arterial vein peristaltic pulse (14–22 second organic cycle, never flashing neon)
  const slowWave =
    0.5 +
    0.34 * Math.sin(elapsed * 0.36) +
    0.16 * Math.sin(elapsed * 0.78 + 1.3);
  system.pack.veinMat.emissiveIntensity = 0.24 + slowWave * 0.28; // 0.24 .. 0.52 muted blood crimson
  system.pack.crustMat.emissiveIntensity = 0.18 + slowWave * 0.16;
  system.pack.fleshMat.emissiveIntensity = 0.26 + slowWave * 0.22;
  system.pack.cavityMat.emissiveIntensity = 0.3 + slowWave * 0.24;

  // Subtle slow moisture/drying cycle across wet patches
  const moistureCycle = 0.5 + 0.5 * Math.sin(elapsed * 0.085);
  system.pack.fleshMat.clearcoatRoughness = 0.19 + (1 - moistureCycle) * 0.12;

  // 2. Per-colony distance-culled micro-organic animation & flashlight reactivity
  let maxFlashlightHit = 0;

  for (let i = 0; i < system.colonies.length; i++) {
    const col = system.colonies[i];
    const distSq = col.position.distanceToSquared(playerPos);
    if (distSq > 38 * 38) continue;

    // Detect if the player's flashlight beam is illuminating this fungal growth
    let underFlashlight = false;
    if (flashlightOn && camForward && distSq < 25 * 25 && distSq > 0.01) {
      _toColony.subVectors(col.position, playerPos).normalize();
      const align = _toColony.dot(camForward);
      if (align > 0.83) {
        underFlashlight = true;
        const prox = 1 - Math.sqrt(distSq) / 25;
        maxFlashlightHit = Math.max(maxFlashlightHit, prox);
      }
    }

    // Extremely slow eerie recoil/contraction when stared at under flashlight
    const targetReact = underFlashlight ? 1.0 : 0.0;
    col.flashlightReaction = THREE.MathUtils.damp(col.flashlightReaction, targetReact, 0.85, dt);

    // Slow expansion/drying lifecycle (takes ~90 seconds per full breath)
    const dryCycle = Math.sin(elapsed * 0.07 + col.dryCyclePhase);

    // Animate individual lobes & creeping tendril tips
    for (let j = 0; j < col.lobes.length; j++) {
      const lobe = col.lobes[j];
      const w1 = Math.sin(elapsed * lobe.speed + lobe.phase);
      const w2 = Math.cos(elapsed * lobe.speed * 0.62 + lobe.phase * 1.4);

      if (lobe.role === 'flesh') {
        // Subtle organic surface contraction & breathing
        const recoil = 1.0 - col.flashlightReaction * 0.028;
        const sx = (1 + w1 * lobe.amp) * recoil;
        const sy = (1 + w2 * lobe.amp * 1.35) * (1 + col.flashlightReaction * 0.016);
        const sz = (1 - w1 * lobe.amp * 0.75) * recoil;
        lobe.mesh.scale.set(lobe.baseScale.x * sx, lobe.baseScale.y * sy, lobe.baseScale.z * sz);
      } else if (lobe.role === 'rim') {
        // Ultra-slow gradual expansion & drying/shrinking over time
        const grow = 1.0 + dryCycle * 0.022 + w1 * lobe.amp * 0.55;
        lobe.mesh.scale.set(
          lobe.baseScale.x * grow,
          lobe.baseScale.y * (1 + w2 * lobe.amp * 0.6),
          lobe.baseScale.z * grow
        );
      } else {
        // Fine creeping tendril tips — barely perceptible growth extension & recoil in light
        const creep = 1.0 + dryCycle * 0.032 + w1 * lobe.amp - col.flashlightReaction * 0.035;
        lobe.mesh.scale.set(lobe.baseScale.x * creep, lobe.baseScale.y, lobe.baseScale.z * creep);
      }
    }

    // Subtle localized crimson pulse on mature colony fill light
    if (col.localLight) {
      const lp = 0.8 + 0.2 * Math.sin(elapsed * 0.42 + col.phase);
      col.localLight.intensity = col.baseLightIntensity * lp;
    }

    // Gently drifting organic spore motes around mature colonies (within 22m only)
    if (col.sporeCloud && distSq < 22 * 22) {
      const sc = col.sporeCloud;
      const posAttr = sc.points.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let k = 0; k < sc.phases.length; k++) {
        const ph = sc.phases[k];
        const k3 = k * 3;
        arr[k3] = sc.basePositions[k3] + Math.sin(elapsed * 0.28 + ph) * 0.14;
        arr[k3 + 1] = sc.basePositions[k3 + 1] + Math.sin(elapsed * 0.22 + ph * 1.3) * 0.12;
        arr[k3 + 2] = sc.basePositions[k3 + 2] + Math.cos(elapsed * 0.26 + ph * 0.9) * 0.14;
      }
      posAttr.needsUpdate = true;
    }
  }

  // Slight glistening specular enhancement when directly inspected with the player's flashlight
  if (maxFlashlightHit > 0.01) {
    system.pack.fleshMat.clearcoat = 0.84 + maxFlashlightHit * 0.14;
    system.pack.veinMat.clearcoat = 0.92 + maxFlashlightHit * 0.08;
  } else {
    system.pack.fleshMat.clearcoat = 0.84;
    system.pack.veinMat.clearcoat = 0.92;
  }
}

export interface FungusSpatialAudioQuery {
  distance: number;
  pan: number;
  yOffset: number;
  kind: FungusGrowthType;
  isLargeOrMature: boolean;
}

export function queryClosestFungusForAudio(
  system: AlienFungusSystem | undefined,
  playerPos: THREE.Vector3,
  camRight: THREE.Vector3,
  maxDistance = 24
): FungusSpatialAudioQuery | null {
  if (!system || system.colonies.length === 0) return null;

  let best: FungusColonyRuntime | null = null;
  let bestScore = Infinity;

  for (let i = 0; i < system.colonies.length; i++) {
    const col = system.colonies[i];
    const dist = col.position.distanceTo(playerPos);
    if (dist > maxDistance) continue;
    // Large and mature colonies project sound slightly further than small patches
    const sizeBonus = col.kind === 'mature' ? 0.65 : col.kind === 'large' ? 0.82 : 1.0;
    const score = dist * sizeBonus;
    if (score < bestScore) {
      bestScore = score;
      best = col;
    }
  }

  if (!best) return null;
  const dist = best.position.distanceTo(playerPos);
  const dx = best.position.x - playerPos.x;
  const dz = best.position.z - playerPos.z;
  const horiz = Math.hypot(dx, dz) || 1;
  const pan = THREE.MathUtils.clamp((dx * camRight.x + dz * camRight.z) / horiz, -1, 1);

  return {
    distance: dist,
    pan,
    yOffset: best.position.y - playerPos.y,
    kind: best.kind,
    isLargeOrMature: best.kind === 'large' || best.kind === 'mature',
  };
}
