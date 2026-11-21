import * as THREE from 'three';

export interface ProceduralTextureSet {
  asphaltMap: THREE.CanvasTexture;
  asphaltNormal: THREE.CanvasTexture;
  asphaltRoughness: THREE.CanvasTexture;
  concreteMap: THREE.CanvasTexture;
  concreteNormal: THREE.CanvasTexture;
  concreteRoughness: THREE.CanvasTexture;
  metalPlateMap: THREE.CanvasTexture;
  metalNormal: THREE.CanvasTexture;
  metalRoughness: THREE.CanvasTexture;
  metalMetalness: THREE.CanvasTexture;
  hazardStripeMap: THREE.CanvasTexture;
  skyscraperMap: THREE.CanvasTexture;
  skyscraperNormal: THREE.CanvasTexture;
  skyscraperRoughness: THREE.CanvasTexture;
  skyscraperEmissive: THREE.CanvasTexture;
  infectedFleshMap: THREE.CanvasTexture;
  infectedFleshNormal: THREE.CanvasTexture;
  infectedFleshRoughness: THREE.CanvasTexture;
  infectedEmissiveMap: THREE.CanvasTexture;
  boneMap: THREE.CanvasTexture;
  boneNormal: THREE.CanvasTexture;
  terminalScreenMap: THREE.CanvasTexture;
  scorchDecalMap: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  fireSpriteMap: THREE.CanvasTexture;
  smokeSpriteMap: THREE.CanvasTexture;
  emberSpriteMap: THREE.CanvasTexture;
  grateMap: THREE.CanvasTexture;
  openGrateMap: THREE.CanvasTexture;
  grateNormal: THREE.CanvasTexture;
  grateRoughness: THREE.CanvasTexture;
  grateMetalness: THREE.CanvasTexture;
  labTileMap: THREE.CanvasTexture;
  labTileNormal: THREE.CanvasTexture;
  labTileRoughness: THREE.CanvasTexture;
  serverRackMap: THREE.CanvasTexture;
  serverRackNormal: THREE.CanvasTexture;
  serverRackEmissive: THREE.CanvasTexture;
  alienObsidianMap: THREE.CanvasTexture;
  alienObsidianNormal: THREE.CanvasTexture;
  alienObsidianEmissive: THREE.CanvasTexture;
  earthMap: THREE.CanvasTexture;
  earthNormal: THREE.CanvasTexture;
  earthRoughness: THREE.CanvasTexture;
  bloodDecalMap: THREE.CanvasTexture;
  waterNormalMap: THREE.CanvasTexture;
  mossDecalMap: THREE.CanvasTexture;
  foliageBarkMap: THREE.CanvasTexture;
  woodMap: THREE.CanvasTexture;
  woodNormal: THREE.CanvasTexture;
  woodRoughness: THREE.CanvasTexture;
  brickMap: THREE.CanvasTexture;
  brickNormal: THREE.CanvasTexture;
  brickRoughness: THREE.CanvasTexture;
  glassCrackedMap: THREE.CanvasTexture;
  glassCrackedNormal: THREE.CanvasTexture;
  dispose: () => void;
}

/**
 * Clones a CanvasTexture header with custom world-scale UV repeat while sharing the underlying GPU canvas image.
 */
export function cloneTiledTexture<T extends THREE.Texture>(
  source: T,
  repeatX: number,
  repeatY: number,
  disposeList?: { dispose: () => void }[]
): T {
  const cloned = source.clone();
  cloned.wrapS = THREE.RepeatWrapping;
  cloned.wrapT = THREE.RepeatWrapping;
  cloned.repeat.set(repeatX, repeatY);
  cloned.colorSpace = source.colorSpace;
  cloned.anisotropy = source.anisotropy;
  cloned.needsUpdate = true;
  if (disposeList) disposeList.push(cloned);
  return cloned as T;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeColorTex(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function finalizeDataTex(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Converts a grayscale height canvas into a crisp Tangent-Space Normal Map using a 3x3 Sobel filter.
 */
function heightCanvasToNormalTex(
  heightCanvas: HTMLCanvasElement,
  strength: number,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const hCtx = heightCanvas.getContext('2d')!;
  const src = hCtx.getImageData(0, 0, w, h).data;

  const [nCanvas, nCtx] = makeCanvas(w, h);
  const outImg = nCtx.createImageData(w, h);
  const dst = outImg.data;

  const sample = (x: number, y: number): number => {
    const wx = ((x % w) + w) % w;
    const wy = ((y % h) + h) % h;
    return src[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dX = tr + 2 * r + br - (tl + 2 * l + bl);
      const dY = bl + 2 * b + br - (tl + 2 * t + tr);

      let nx = -dX * strength;
      let ny = -dY * strength;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }

  nCtx.putImageData(outImg, 0, 0);
  return finalizeDataTex(nCanvas, maxAnisotropy, repeatX, repeatY);
}

export function createProceduralTextures(renderer: THREE.WebGLRenderer): ProceduralTextureSet {
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

  // 1. Cracked Wet Asphalt + Normal + Rain-Puddle Roughness
  const [aspCanvas, aspCtx] = makeCanvas(512, 512);
  const [aspHeightCanvas, aspHeightCtx] = makeCanvas(512, 512);
  const [aspRoughCanvas, aspRoughCtx] = makeCanvas(512, 512);

  aspCtx.fillStyle = '#111419';
  aspCtx.fillRect(0, 0, 512, 512);
  aspHeightCtx.fillStyle = '#808080';
  aspHeightCtx.fillRect(0, 0, 512, 512);
  aspRoughCtx.fillStyle = '#ececec';
  aspRoughCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 10 + Math.floor(Math.random() * 28);
    aspCtx.fillStyle = `rgb(${v},${v + 1},${v + 3})`;
    aspCtx.fillRect(x, y, 2, 2);

    const hv = 95 + Math.floor(Math.random() * 75);
    aspHeightCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    aspHeightCtx.fillRect(x, y, 2, 2);

    const rv = 224 + Math.floor(Math.random() * 31);
    aspRoughCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
    aspRoughCtx.fillRect(x, y, 3, 3);
  }
  // Decayed lane markings
  aspCtx.fillStyle = 'rgba(175, 130, 42, 0.32)';
  aspCtx.fillRect(248, 0, 14, 170);
  aspCtx.fillRect(248, 260, 14, 170);
  aspCtx.fillStyle = 'rgba(130, 135, 145, 0.16)';
  aspCtx.fillRect(24, 0, 6, 512);
  aspCtx.fillRect(482, 0, 6, 512);

  // Sparse localized damp puddles (subtle realistic wet sheen, never mirror-like)
  for (let p = 0; p < 3; p++) {
    const px = 72 + Math.random() * 368;
    const py = 72 + Math.random() * 368;
    const pr = 18 + Math.random() * 28;
    const rGrad = aspRoughCtx.createRadialGradient(px, py, 3, px, py, pr);
    rGrad.addColorStop(0, '#525252');
    rGrad.addColorStop(0.55, '#8a8a8a');
    rGrad.addColorStop(1, 'rgba(236,236,236,0)');
    aspRoughCtx.fillStyle = rGrad;
    aspRoughCtx.beginPath();
    aspRoughCtx.arc(px, py, pr, 0, Math.PI * 2);
    aspRoughCtx.fill();

    const hGrad = aspHeightCtx.createRadialGradient(px, py, 3, px, py, pr);
    hGrad.addColorStop(0, '#727272');
    hGrad.addColorStop(1, 'rgba(128,128,128,0)');
    aspHeightCtx.fillStyle = hGrad;
    aspHeightCtx.beginPath();
    aspHeightCtx.arc(px, py, pr, 0, Math.PI * 2);
    aspHeightCtx.fill();

    const aGrad = aspCtx.createRadialGradient(px, py, 3, px, py, pr);
    aGrad.addColorStop(0, 'rgba(5, 7, 10, 0.42)');
    aGrad.addColorStop(1, 'rgba(5, 7, 10, 0)');
    aspCtx.fillStyle = aGrad;
    aspCtx.beginPath();
    aspCtx.arc(px, py, pr, 0, Math.PI * 2);
    aspCtx.fill();
  }

  // Deep fractures & cracks
  aspCtx.strokeStyle = 'rgba(3, 4, 6, 0.92)';
  aspCtx.lineWidth = 2.2;
  aspHeightCtx.strokeStyle = '#141414';
  aspHeightCtx.lineWidth = 2.5;
  for (let c = 0; c < 22; c++) {
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    aspCtx.beginPath();
    aspHeightCtx.beginPath();
    aspCtx.moveTo(cx, cy);
    aspHeightCtx.moveTo(cx, cy);
    for (let s = 0; s < 7; s++) {
      cx += (Math.random() - 0.5) * 68;
      cy += (Math.random() - 0.5) * 68;
      aspCtx.lineTo(cx, cy);
      aspHeightCtx.lineTo(cx, cy);
    }
    aspCtx.stroke();
    aspHeightCtx.stroke();
  }
  const asphaltMap = finalizeColorTex(aspCanvas, maxAniso, 14, 14);
  const asphaltNormal = heightCanvasToNormalTex(aspHeightCanvas, 2.2, maxAniso, 14, 14);
  const asphaltRoughness = finalizeDataTex(aspRoughCanvas, maxAniso, 14, 14);

  // 2. Weathered Reinforced Concrete + Normal + Roughness
  const [concCanvas, concCtx] = makeCanvas(512, 512);
  const [concHeightCanvas, concHeightCtx] = makeCanvas(512, 512);
  const [concRoughCanvas, concRoughCtx] = makeCanvas(512, 512);

  concCtx.fillStyle = '#272b32';
  concCtx.fillRect(0, 0, 512, 512);
  concHeightCtx.fillStyle = '#888888';
  concHeightCtx.fillRect(0, 0, 512, 512);
  concRoughCtx.fillStyle = '#eaeaea';
  concRoughCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 9500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 24 + Math.floor(Math.random() * 34);
    concCtx.fillStyle = `rgb(${v},${v + 1},${v + 3})`;
    concCtx.fillRect(x, y, 3, 3);
    const hv = 100 + Math.floor(Math.random() * 60);
    concHeightCtx.fillStyle = `rgb(${hv},${hv},${hv})`;
    concHeightCtx.fillRect(x, y, 3, 3);
    const rv = 220 + Math.floor(Math.random() * 34);
    concRoughCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
    concRoughCtx.fillRect(x, y, 3, 3);
  }
  // Spalled concrete pits & rust-bleed streaks
  for (let p = 0; p < 20; p++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const pr = 6 + Math.random() * 14;
    concCtx.fillStyle = 'rgba(12, 13, 16, 0.72)';
    concCtx.beginPath();
    concCtx.arc(px, py, pr, 0, Math.PI * 2);
    concCtx.fill();
    concHeightCtx.fillStyle = '#282828';
    concHeightCtx.beginPath();
    concHeightCtx.arc(px, py, pr, 0, Math.PI * 2);
    concHeightCtx.fill();
  }
  for (let s = 0; s < 32; s++) {
    const sx = Math.random() * 512;
    const isRust = s % 4 === 0;
    const g = concCtx.createLinearGradient(sx, 0, sx, 220 + Math.random() * 250);
    g.addColorStop(0, isRust ? 'rgba(72, 30, 18, 0.45)' : 'rgba(8, 10, 13, 0.58)');
    g.addColorStop(1, 'rgba(8, 10, 13, 0)');
    concCtx.fillStyle = g;
    concCtx.fillRect(sx, 0, 4 + Math.random() * 10, 460);
    if (s % 4 === 0) {
      concRoughCtx.fillStyle = 'rgba(195, 195, 195, 0.32)';
      concRoughCtx.fillRect(sx, 0, 8, 420);
    }
  }
  // Formwork expansion seams & bolt tie holes
  concCtx.strokeStyle = 'rgba(9, 11, 14, 0.85)';
  concCtx.lineWidth = 3;
  concHeightCtx.strokeStyle = '#202020';
  concHeightCtx.lineWidth = 3;
  for (let y = 0; y < 512; y += 128) {
    concCtx.beginPath();
    concCtx.moveTo(0, y);
    concCtx.lineTo(512, y);
    concCtx.stroke();
    concHeightCtx.beginPath();
    concHeightCtx.moveTo(0, y);
    concHeightCtx.lineTo(512, y);
    concHeightCtx.stroke();
  }
  for (let x = 0; x < 512; x += 256) {
    concCtx.beginPath();
    concCtx.moveTo(x, 0);
    concCtx.lineTo(x, 512);
    concCtx.stroke();
    concHeightCtx.beginPath();
    concHeightCtx.moveTo(x, 0);
    concHeightCtx.lineTo(x, 512);
    concHeightCtx.stroke();
  }
  const concreteMap = finalizeColorTex(concCanvas, maxAniso, 2, 2);
  const concreteNormal = heightCanvasToNormalTex(concHeightCanvas, 2.4, maxAniso, 2, 2);
  const concreteRoughness = finalizeDataTex(concRoughCanvas, maxAniso, 2, 2);

  // 3. Corroded & Scratched Military Armor Plate + Normal + Roughness + Metalness
  const [metalCanvas, metalCtx] = makeCanvas(512, 512);
  const [metalHeightCanvas, metalHeightCtx] = makeCanvas(512, 512);
  const [metalRoughCanvas, metalRoughCtx] = makeCanvas(512, 512);
  const [metalMetCanvas, metalMetCtx] = makeCanvas(512, 512);

  metalCtx.fillStyle = '#252b34';
  metalCtx.fillRect(0, 0, 512, 512);
  metalHeightCtx.fillStyle = '#828282';
  metalHeightCtx.fillRect(0, 0, 512, 512);
  metalRoughCtx.fillStyle = '#9e9e9e';
  metalRoughCtx.fillRect(0, 0, 512, 512);
  metalMetCtx.fillStyle = '#dedede';
  metalMetCtx.fillRect(0, 0, 512, 512);

  // Brushed alloy grain
  for (let i = 0; i < 3800; i++) {
    const v = 30 + Math.floor(Math.random() * 28);
    metalCtx.fillStyle = `rgba(${v},${v + 4},${v + 10},0.46)`;
    const mx = Math.random() * 512;
    const my = Math.random() * 512;
    metalCtx.fillRect(mx, my, 34, 1);
    const rv = 138 + Math.floor(Math.random() * 62);
    metalRoughCtx.fillStyle = `rgb(${rv},${rv},${rv})`;
    metalRoughCtx.fillRect(mx, my, 24, 1);
  }
  // Oxidized rust patches (matte & dielectric)
  for (let r = 0; r < 18; r++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const rr = 14 + Math.random() * 34;
    const rg = metalCtx.createRadialGradient(rx, ry, 2, rx, ry, rr);
    rg.addColorStop(0, 'rgba(84, 34, 20, 0.72)');
    rg.addColorStop(0.7, 'rgba(56, 26, 18, 0.35)');
    rg.addColorStop(1, 'rgba(56, 26, 18, 0)');
    metalCtx.fillStyle = rg;
    metalCtx.beginPath();
    metalCtx.arc(rx, ry, rr, 0, Math.PI * 2);
    metalCtx.fill();

    const rrg = metalRoughCtx.createRadialGradient(rx, ry, 2, rx, ry, rr);
    rrg.addColorStop(0, '#f0f0f0');
    rrg.addColorStop(1, 'rgba(220,220,220,0)');
    metalRoughCtx.fillStyle = rrg;
    metalRoughCtx.beginPath();
    metalRoughCtx.arc(rx, ry, rr, 0, Math.PI * 2);
    metalRoughCtx.fill();

    const rmg = metalMetCtx.createRadialGradient(rx, ry, 2, rx, ry, rr);
    rmg.addColorStop(0, '#303030');
    rmg.addColorStop(1, 'rgba(220,220,220,0)');
    metalMetCtx.fillStyle = rmg;
    metalMetCtx.beginPath();
    metalMetCtx.arc(rx, ry, rr, 0, Math.PI * 2);
    metalMetCtx.fill();
  }
  // Deep ballistic scratches (controlled brushed steel glints)
  metalCtx.strokeStyle = 'rgba(188, 202, 222, 0.54)';
  metalHeightCtx.strokeStyle = '#323232';
  metalRoughCtx.strokeStyle = '#5c5c5c';
  metalMetCtx.strokeStyle = '#ffffff';
  for (let sc = 0; sc < 38; sc++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 512;
    const ex = sx + (Math.random() - 0.5) * 96;
    const ey = sy + (Math.random() - 0.5) * 48;
    [metalCtx, metalHeightCtx, metalRoughCtx, metalMetCtx].forEach((c) => {
      c.lineWidth = 1.1 + (sc % 3) * 0.45;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(ex, ey);
      c.stroke();
    });
  }
  // Heat scorch & blast carbonization patches
  for (let sp = 0; sp < 10; sp++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 512;
    const sr = 20 + Math.random() * 44;
    const sg = metalCtx.createRadialGradient(sx, sy, 3, sx, sy, sr);
    sg.addColorStop(0, 'rgba(6, 7, 10, 0.62)');
    sg.addColorStop(0.65, 'rgba(20, 14, 12, 0.28)');
    sg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    metalCtx.fillStyle = sg;
    metalCtx.beginPath();
    metalCtx.arc(sx, sy, sr, 0, Math.PI * 2);
    metalCtx.fill();

    const srg = metalRoughCtx.createRadialGradient(sx, sy, 3, sx, sy, sr);
    srg.addColorStop(0, 'rgba(230, 230, 230, 0.75)');
    srg.addColorStop(1, 'rgba(230, 230, 230, 0)');
    metalRoughCtx.fillStyle = srg;
    metalRoughCtx.beginPath();
    metalRoughCtx.arc(sx, sy, sr, 0, Math.PI * 2);
    metalRoughCtx.fill();
  }
  // Micro-pitting & battle shrapnel dents
  for (let pt = 0; pt < 140; pt++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const pr = 1.2 + Math.random() * 2.5;
    metalCtx.fillStyle = 'rgba(10, 12, 16, 0.72)';
    metalCtx.beginPath();
    metalCtx.arc(px, py, pr, 0, Math.PI * 2);
    metalCtx.fill();
    metalHeightCtx.fillStyle = '#222222';
    metalHeightCtx.beginPath();
    metalHeightCtx.arc(px, py, pr, 0, Math.PI * 2);
    metalHeightCtx.fill();
  }
  // Panel bevel seams & weld bead ridges
  metalCtx.strokeStyle = '#0e1116';
  metalCtx.lineWidth = 5;
  metalCtx.strokeRect(4, 4, 504, 504);
  metalCtx.strokeRect(20, 20, 224, 472);
  metalCtx.strokeRect(268, 20, 224, 472);
  metalHeightCtx.strokeStyle = '#151515';
  metalHeightCtx.lineWidth = 5;
  metalHeightCtx.strokeRect(4, 4, 504, 504);
  metalHeightCtx.strokeRect(20, 20, 224, 472);
  metalHeightCtx.strokeRect(268, 20, 224, 472);

  // Subtle welded seam ripples along vertical bulkhead center seam
  for (let wy = 16; wy < 496; wy += 10) {
    metalCtx.fillStyle = 'rgba(92, 102, 118, 0.42)';
    metalCtx.beginPath();
    metalCtx.arc(256, wy, 3.2, 0, Math.PI * 2);
    metalCtx.fill();
    metalHeightCtx.fillStyle = '#bcbcbc';
    metalHeightCtx.beginPath();
    metalHeightCtx.arc(256, wy, 3.0, 0, Math.PI * 2);
    metalHeightCtx.fill();
  }

  // Raised steel rivets with subtle AO grime halo
  for (let y = 32; y < 490; y += 64) {
    [30, 230, 278, 478].forEach((rx) => {
      metalCtx.fillStyle = 'rgba(8, 10, 14, 0.65)';
      metalCtx.beginPath();
      metalCtx.arc(rx + 2, y + 2, 6.2, 0, Math.PI * 2);
      metalCtx.fill();
      metalCtx.fillStyle = '#6c798c';
      metalCtx.beginPath();
      metalCtx.arc(rx + 2, y + 2, 4, 0, Math.PI * 2);
      metalCtx.fill();
      metalHeightCtx.fillStyle = '#f2f2f2';
      metalHeightCtx.beginPath();
      metalHeightCtx.arc(rx + 2, y + 2, 4, 0, Math.PI * 2);
      metalHeightCtx.fill();
      metalRoughCtx.fillStyle = '#242424';
      metalRoughCtx.fillRect(rx, y, 5, 5);
    });
  }
  const metalPlateMap = finalizeColorTex(metalCanvas, maxAniso, 1, 1);
  const metalNormal = heightCanvasToNormalTex(metalHeightCanvas, 2.6, maxAniso, 1, 1);
  const metalRoughness = finalizeDataTex(metalRoughCanvas, maxAniso, 1, 1);
  const metalMetalness = finalizeDataTex(metalMetCanvas, maxAniso, 1, 1);

  // 4. Hazard Stripe
  const [hazCanvas, hazCtx] = makeCanvas(256, 256);
  hazCtx.fillStyle = '#18181b';
  hazCtx.fillRect(0, 0, 256, 256);
  hazCtx.fillStyle = '#b45309';
  for (let i = -256; i < 512; i += 48) {
    hazCtx.beginPath();
    hazCtx.moveTo(i, 0);
    hazCtx.lineTo(i + 24, 0);
    hazCtx.lineTo(i + 24 + 256, 256);
    hazCtx.lineTo(i + 256, 256);
    hazCtx.closePath();
    hazCtx.fill();
  }
  hazCtx.fillStyle = 'rgba(10, 10, 12, 0.42)';
  for (let i = 0; i < 1000; i++) {
    hazCtx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  const hazardStripeMap = finalizeColorTex(hazCanvas, maxAniso, 2, 1);

  // 5. High-Res 1024px Architectural Brutalist Skyscraper Facade + Normal + Roughness + Emissive
  const [skyCanvas, skyCtx] = makeCanvas(1024, 1024);
  const [skyHeightCanvas, skyHeightCtx] = makeCanvas(1024, 1024);
  const [skyRoughCanvas, skyRoughCtx] = makeCanvas(1024, 1024);
  const [skyEmCanvas, skyEmCtx] = makeCanvas(1024, 1024);

  skyCtx.fillStyle = '#1b1f27';
  skyCtx.fillRect(0, 0, 1024, 1024);
  skyHeightCtx.fillStyle = '#c8c8c8'; // Raised concrete piers/spandrels
  skyHeightCtx.fillRect(0, 0, 1024, 1024);
  skyRoughCtx.fillStyle = '#dcdcdc'; // Concrete is matte
  skyRoughCtx.fillRect(0, 0, 1024, 1024);
  skyEmCtx.fillStyle = '#000000';
  skyEmCtx.fillRect(0, 0, 1024, 1024);

  // Concrete aggregate texture & weather streaks
  for (let i = 0; i < 16000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const v = 22 + Math.floor(Math.random() * 24);
    skyCtx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    skyCtx.fillRect(x, y, 3, 3);
  }
  for (let s = 0; s < 48; s++) {
    const sx = Math.random() * 1024;
    const g = skyCtx.createLinearGradient(sx, 0, sx, 380 + Math.random() * 480);
    g.addColorStop(0, 'rgba(6, 7, 10, 0.65)');
    g.addColorStop(1, 'rgba(6, 7, 10, 0)');
    skyCtx.fillStyle = g;
    skyCtx.fillRect(sx, 0, 6 + Math.random() * 14, 720);
  }

  // Deep recessed curtain wall bays (16 floors x 8 structural bays)
  for (let row = 0; row < 16; row++) {
    const floorY = row * 64;
    // Heavy horizontal spandrel ledge
    skyCtx.fillStyle = '#262b36';
    skyCtx.fillRect(0, floorY, 1024, 14);
    skyHeightCtx.fillStyle = '#f2f2f2';
    skyHeightCtx.fillRect(0, floorY, 1024, 14);

    for (let col = 0; col < 8; col++) {
      const bayX = 16 + col * 128;
      const winY = floorY + 18;
      const winW = 96;
      const winH = 38;

      // Deep window recess in heightmap
      skyHeightCtx.fillStyle = '#282828';
      skyHeightCtx.fillRect(bayX, winY, winW, winH);
      // Mullion crossbars
      skyHeightCtx.fillStyle = '#a0a0a0';
      skyHeightCtx.fillRect(bayX + winW / 2 - 2, winY, 4, winH);

      const stateRoll = Math.random();
      if (stateRoll < 0.38) {
        // Shattered dark interior void + jagged broken glass shards
        skyCtx.fillStyle = '#030406';
        skyCtx.fillRect(bayX, winY, winW, winH);
        skyRoughCtx.fillStyle = '#f0f0f0';
        skyCtx.fillStyle = '#1c2838';
        skyCtx.beginPath();
        skyCtx.moveTo(bayX, winY);
        skyCtx.lineTo(bayX + 26, winY);
        skyCtx.lineTo(bayX + 8, winY + 22);
        skyCtx.closePath();
        skyCtx.fill();
        skyRoughCtx.fillStyle = '#181818';
        skyRoughCtx.fillRect(bayX, winY, 18, 16);
      } else {
        // Intact darkened tempered glass (smooth & reflective)
        const gGrad = skyCtx.createLinearGradient(bayX, winY, bayX + winW, winY + winH);
        gGrad.addColorStop(0, '#0a1019');
        gGrad.addColorStop(0.5, '#131d2c');
        gGrad.addColorStop(1, '#070a0f');
        skyCtx.fillStyle = gGrad;
        skyCtx.fillRect(bayX, winY, winW, winH);
        skyRoughCtx.fillStyle = '#181818';
        skyRoughCtx.fillRect(bayX, winY, winW, winH);
      }

      // Mullion frame
      skyCtx.fillStyle = '#191d24';
      skyCtx.fillRect(bayX + winW / 2 - 2, winY, 4, winH);
      skyCtx.strokeStyle = '#333b48';
      skyCtx.lineWidth = 2;
      skyCtx.strokeRect(bayX, winY, winW, winH);

      // Fire-damaged soot / scorch marks on some broken windows
      if (stateRoll < 0.16) {
        const scorch = skyCtx.createRadialGradient(
          bayX + winW * 0.5,
          winY + 6,
          4,
          bayX + winW * 0.5,
          winY,
          46
        );
        scorch.addColorStop(0, 'rgba(3, 3, 4, 0.92)');
        scorch.addColorStop(1, 'rgba(3, 3, 4, 0)');
        skyCtx.fillStyle = scorch;
        skyCtx.fillRect(bayX - 18, floorY - 20, winW + 36, 62);
      }

      // Sparse emergency red beacon strip or dim interior amber light
      if (stateRoll > 0.962) {
        const isRed = stateRoll > 0.978;
        skyEmCtx.fillStyle = isRed ? '#7f1d1d' : '#78350f';
        skyEmCtx.fillRect(bayX + 6, winY + 5, winW * 0.42, winH - 10);
        skyEmCtx.fillStyle = isRed ? '#450a0a' : '#451a03';
        skyEmCtx.fillRect(bayX + winW * 0.52, winY + 7, winW * 0.38, winH - 14);
      }
    }
  }
  const skyscraperMap = finalizeColorTex(skyCanvas, maxAniso, 1, 1.5);
  const skyscraperNormal = heightCanvasToNormalTex(skyHeightCanvas, 3.2, maxAniso, 1, 1.5);
  const skyscraperRoughness = finalizeDataTex(skyRoughCanvas, maxAniso, 1, 1.5);
  const skyscraperEmissive = finalizeColorTex(skyEmCanvas, maxAniso, 1, 1.5);

  // 6. Anatomical Wet Striated Biomechanical Flesh + Normal + Roughness + Arterial Glow
  const [fleshCanvas, fleshCtx] = makeCanvas(512, 512);
  const [fleshHeightCanvas, fleshHeightCtx] = makeCanvas(512, 512);
  const [fleshRoughCanvas, fleshRoughCtx] = makeCanvas(512, 512);
  const [fleshEmCanvas, fleshEmCtx] = makeCanvas(512, 512);

  fleshCtx.fillStyle = '#190509';
  fleshCtx.fillRect(0, 0, 512, 512);
  fleshHeightCtx.fillStyle = '#626262';
  fleshHeightCtx.fillRect(0, 0, 512, 512);
  fleshRoughCtx.fillStyle = '#3c3c3c'; // Wet glistening membrane base
  fleshRoughCtx.fillRect(0, 0, 512, 512);
  fleshEmCtx.fillStyle = '#000000';
  fleshEmCtx.fillRect(0, 0, 512, 512);

  // Deep striated muscle bundles + taut pale tendons + dark inter-muscular sinew grooves
  for (let i = 0; i < 420; i++) {
    const isTendon = i % 9 === 0;
    const isGroove = i % 3 === 0;
    fleshCtx.strokeStyle = isTendon ? '#96474c' : isGroove ? '#0c0204' : '#580d18';
    fleshCtx.lineWidth = isTendon ? 1.8 : isGroove ? 3.2 + Math.random() * 5.0 : 2.8 + Math.random() * 7.2;
    fleshHeightCtx.strokeStyle = isTendon ? '#ededed' : isGroove ? '#1d1d1d' : '#c4c4c4';
    fleshHeightCtx.lineWidth = fleshCtx.lineWidth * 0.85;
    fleshRoughCtx.strokeStyle = isTendon ? '#848484' : isGroove ? '#161616' : '#262626';
    fleshRoughCtx.lineWidth = 2.8;

    const y0 = Math.random() * 512;
    const c1 = y0 + (Math.random() - 0.5) * 98;
    const c2 = y0 + (Math.random() - 0.5) * 98;
    const y1 = y0 + (Math.random() - 0.5) * 38;

    [fleshCtx, fleshHeightCtx, fleshRoughCtx].forEach((c) => {
      c.beginPath();
      c.moveTo(0, y0);
      c.bezierCurveTo(170, c1, 340, c2, 512, y1);
      c.stroke();
    });
  }
  // Necrotic scarred pockets, coagulated crusts & wet glossy mucus patches
  for (let n = 0; n < 26; n++) {
    const nx = Math.random() * 512;
    const ny = Math.random() * 512;
    const nr = 10 + Math.random() * 26;
    const ng = fleshCtx.createRadialGradient(nx, ny, 2, nx, ny, nr);
    ng.addColorStop(0, n % 3 === 0 ? 'rgba(6, 2, 4, 0.92)' : 'rgba(68, 10, 18, 0.72)');
    ng.addColorStop(1, 'rgba(10, 4, 6, 0)');
    fleshCtx.fillStyle = ng;
    fleshCtx.beginPath();
    fleshCtx.arc(nx, ny, nr, 0, Math.PI * 2);
    fleshCtx.fill();
    fleshHeightCtx.fillStyle = n % 3 === 0 ? 'rgba(28, 28, 28, 0.72)' : 'rgba(195, 195, 195, 0.45)';
    fleshHeightCtx.beginPath();
    fleshHeightCtx.arc(nx, ny, nr * 0.68, 0, Math.PI * 2);
    fleshHeightCtx.fill();
    fleshRoughCtx.fillStyle = n % 2 === 0 ? 'rgba(205, 205, 205, 0.58)' : 'rgba(14, 14, 14, 0.76)';
    fleshRoughCtx.beginPath();
    fleshRoughCtx.arc(nx, ny, nr * 0.74, 0, Math.PI * 2);
    fleshRoughCtx.fill();
  }
  // Pulsating deep arterial vessels & fine dark-crimson capillary networks
  for (let v = 0; v < 56; v++) {
    const bright = v % 3 === 0;
    fleshCtx.strokeStyle = bright ? '#b91c1c' : '#6b0f1b';
    fleshCtx.lineWidth = 1.3 + Math.random() * 2.3;
    fleshEmCtx.strokeStyle = bright ? '#dc2626' : '#7f1d1d';
    fleshEmCtx.lineWidth = 1.5 + Math.random() * 2.1;
    fleshHeightCtx.strokeStyle = '#f5f5f5';
    fleshHeightCtx.lineWidth = 2.0;

    let vx = Math.random() * 512;
    let vy = Math.random() * 512;
    [fleshCtx, fleshEmCtx, fleshHeightCtx].forEach((c) => {
      c.beginPath();
      c.moveTo(vx, vy);
    });
    for (let s = 0; s < 8; s++) {
      vx += (Math.random() - 0.5) * 78;
      vy += (Math.random() - 0.5) * 78;
      fleshCtx.lineTo(vx, vy);
      fleshEmCtx.lineTo(vx, vy);
      fleshHeightCtx.lineTo(vx, vy);
    }
    fleshCtx.stroke();
    fleshEmCtx.stroke();
    fleshHeightCtx.stroke();
  }
  const infectedFleshMap = finalizeColorTex(fleshCanvas, maxAniso, 1, 1);
  const infectedFleshNormal = heightCanvasToNormalTex(fleshHeightCanvas, 3.85, maxAniso, 1, 1);
  const infectedFleshRoughness = finalizeDataTex(fleshRoughCanvas, maxAniso, 1, 1);
  const infectedEmissiveMap = finalizeColorTex(fleshEmCanvas, maxAniso, 1, 1);

  // 7. Calcified Chitin / Bone + Normal Map (for fangs, ribs, crests, dorsal spines)
  const [boneCanvas, boneCtx] = makeCanvas(256, 256);
  const [boneHeightCanvas, boneHeightCtx] = makeCanvas(256, 256);
  boneCtx.fillStyle = '#c8bfb2';
  boneCtx.fillRect(0, 0, 256, 256);
  boneHeightCtx.fillStyle = '#808080';
  boneHeightCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 160; i++) {
    const x = Math.random() * 256;
    boneCtx.strokeStyle = i % 3 === 0 ? 'rgba(65, 22, 22, 0.42)' : 'rgba(84, 76, 65, 0.38)';
    boneCtx.lineWidth = 1 + Math.random() * 2;
    boneHeightCtx.strokeStyle = i % 2 === 0 ? '#bababa' : '#424242';
    boneHeightCtx.lineWidth = 1.5;
    boneCtx.beginPath();
    boneCtx.moveTo(x, 0);
    boneCtx.lineTo(x + (Math.random() - 0.5) * 14, 256);
    boneCtx.stroke();
    boneHeightCtx.beginPath();
    boneHeightCtx.moveTo(x, 0);
    boneHeightCtx.lineTo(x + (Math.random() - 0.5) * 14, 256);
    boneHeightCtx.stroke();
  }
  // Porous calcified fractures & marrow staining
  for (let p = 0; p < 80; p++) {
    const px = Math.random() * 256;
    const py = Math.random() * 256;
    boneCtx.fillStyle = 'rgba(55, 28, 24, 0.25)';
    boneCtx.fillRect(px, py, 2 + Math.random() * 3, 2 + Math.random() * 3);
    boneHeightCtx.fillStyle = '#363636';
    boneHeightCtx.fillRect(px, py, 2, 2);
  }
  const boneMap = finalizeColorTex(boneCanvas, maxAniso, 1, 1);
  const boneNormal = heightCanvasToNormalTex(boneHeightCanvas, 2.5, maxAniso, 1, 1);

  // 8. HELIOS Military Terminal Screen
  const [termCanvas, termCtx] = makeCanvas(512, 256);
  termCtx.fillStyle = '#05080d';
  termCtx.fillRect(0, 0, 512, 256);
  termCtx.strokeStyle = '#dc2626';
  termCtx.lineWidth = 3;
  termCtx.strokeRect(8, 8, 496, 240);
  termCtx.fillStyle = 'rgba(239, 68, 68, 0.05)';
  for (let y = 12; y < 244; y += 4) {
    termCtx.fillRect(10, y, 492, 1);
  }
  termCtx.fillStyle = '#ef4444';
  termCtx.font = 'bold 19px monospace';
  termCtx.fillText('HELIOS ORBITAL UPLINK // COMPROMISED', 24, 42);
  termCtx.fillStyle = '#fca5a5';
  termCtx.font = '14px monospace';
  termCtx.fillText('CARRIER: DEEP-SPACE BEACON ACTIVE', 24, 72);
  termCtx.fillText('TARGET: EXTRASOLAR VECTOR 09-KAPPA', 24, 94);
  termCtx.fillStyle = '#f87171';
  termCtx.fillText('WARNING: DO NOT LET THEM HEAR YOU', 24, 224);
  termCtx.strokeStyle = '#ef4444';
  termCtx.lineWidth = 2;
  termCtx.beginPath();
  for (let x = 24; x < 488; x += 4) {
    const amp = Math.sin(x * 0.08) * 28 + Math.cos(x * 0.23) * 14;
    const y = 152 + amp;
    if (x === 24) termCtx.moveTo(x, y);
    else termCtx.lineTo(x, y);
  }
  termCtx.stroke();
  const terminalScreenMap = finalizeColorTex(termCanvas, maxAniso, 1, 1);
  terminalScreenMap.wrapS = THREE.ClampToEdgeWrapping;
  terminalScreenMap.wrapT = THREE.ClampToEdgeWrapping;

  // 9. Asphalt Scorch & Crash Skid Decal
  const [scorchCanvas, scorchCtx] = makeCanvas(256, 256);
  const sGrad = scorchCtx.createRadialGradient(128, 128, 12, 128, 128, 118);
  sGrad.addColorStop(0, 'rgba(3, 4, 6, 0.92)');
  sGrad.addColorStop(0.55, 'rgba(12, 8, 8, 0.65)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  scorchCtx.fillStyle = sGrad;
  scorchCtx.fillRect(0, 0, 256, 256);
  scorchCtx.strokeStyle = 'rgba(0, 0, 0, 0.72)';
  scorchCtx.lineWidth = 10;
  scorchCtx.beginPath();
  scorchCtx.moveTo(96, 16);
  scorchCtx.lineTo(104, 240);
  scorchCtx.moveTo(152, 16);
  scorchCtx.lineTo(148, 240);
  scorchCtx.stroke();
  const scorchDecalMap = finalizeColorTex(scorchCanvas, maxAniso, 1, 1);
  scorchDecalMap.wrapS = THREE.ClampToEdgeWrapping;
  scorchDecalMap.wrapT = THREE.ClampToEdgeWrapping;

  // 10. Soft Radial Contact Shadow
  const [shadCanvas, shadCtx] = makeCanvas(128, 128);
  const grad = shadCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.86)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.38)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  shadCtx.fillStyle = grad;
  shadCtx.fillRect(0, 0, 128, 128);
  const contactShadowMap = new THREE.CanvasTexture(shadCanvas);
  contactShadowMap.needsUpdate = true;

  // 11. Volumetric Fire Tongue Sprite (multi-lobe hot core -> orange -> transparent)
  const [fireCanvas, fireCtx] = makeCanvas(128, 128);
  const fBase = fireCtx.createRadialGradient(64, 78, 4, 64, 66, 56);
  fBase.addColorStop(0, 'rgba(255, 252, 220, 1)');
  fBase.addColorStop(0.28, 'rgba(255, 190, 55, 0.95)');
  fBase.addColorStop(0.6, 'rgba(239, 68, 18, 0.55)');
  fBase.addColorStop(1, 'rgba(120, 18, 0, 0)');
  fireCtx.fillStyle = fBase;
  fireCtx.fillRect(0, 0, 128, 128);
  // Upward licking flame wisps
  for (let l = 0; l < 7; l++) {
    const lx = 44 + (l - 3) * 7 + (Math.random() - 0.5) * 8;
    const ly = 26 + Math.random() * 44;
    const lr = 16 + Math.random() * 18;
    const lg = fireCtx.createRadialGradient(lx, ly + 12, 2, lx, ly, lr);
    lg.addColorStop(0, 'rgba(255, 220, 110, 0.72)');
    lg.addColorStop(0.55, 'rgba(249, 115, 22, 0.35)');
    lg.addColorStop(1, 'rgba(180, 30, 0, 0)');
    fireCtx.fillStyle = lg;
    fireCtx.beginPath();
    fireCtx.arc(lx, ly, lr, 0, Math.PI * 2);
    fireCtx.fill();
  }
  const fireSpriteMap = new THREE.CanvasTexture(fireCanvas);
  fireSpriteMap.colorSpace = THREE.SRGBColorSpace;
  fireSpriteMap.needsUpdate = true;

  // 12. Billowing Soot / Smoke Puff Sprite
  const [smkCanvas, smkCtx] = makeCanvas(128, 128);
  for (let p = 0; p < 12; p++) {
    const ang = (p / 12) * Math.PI * 2;
    const dist = p < 4 ? 8 : 22 + Math.random() * 12;
    const sx = 64 + Math.cos(ang) * dist;
    const sy = 64 + Math.sin(ang) * dist;
    const sr = 26 + Math.random() * 16;
    const v = 50 + Math.floor(Math.random() * 48);
    const sg = smkCtx.createRadialGradient(sx - 4, sy - 6, 4, sx, sy, sr);
    sg.addColorStop(0, `rgba(${v + 18}, ${v + 18}, ${v + 22}, 0.45)`);
    sg.addColorStop(0.65, `rgba(${v}, ${v}, ${v + 4}, 0.22)`);
    sg.addColorStop(1, `rgba(${v}, ${v}, ${v}, 0)`);
    smkCtx.fillStyle = sg;
    smkCtx.beginPath();
    smkCtx.arc(sx, sy, sr, 0, Math.PI * 2);
    smkCtx.fill();
  }
  const smokeSpriteMap = new THREE.CanvasTexture(smkCanvas);
  smokeSpriteMap.colorSpace = THREE.SRGBColorSpace;
  smokeSpriteMap.needsUpdate = true;

  // 13. Hot Ember / Electrical Spark Sprite
  const [embCanvas, embCtx] = makeCanvas(64, 64);
  const eg = embCtx.createRadialGradient(32, 32, 1, 32, 32, 28);
  eg.addColorStop(0, 'rgba(255, 255, 240, 1)');
  eg.addColorStop(0.25, 'rgba(255, 200, 80, 0.92)');
  eg.addColorStop(0.6, 'rgba(234, 88, 12, 0.45)');
  eg.addColorStop(1, 'rgba(0, 0, 0, 0)');
  embCtx.fillStyle = eg;
  embCtx.fillRect(0, 0, 64, 64);
  const emberSpriteMap = new THREE.CanvasTexture(embCanvas);
  emberSpriteMap.colorSpace = THREE.SRGBColorSpace;
  emberSpriteMap.needsUpdate = true;

  // 14. Industrial Diamond-Plate / Slotted Steel Floor Grating PBR Set
  const [grateCanvas, grateCtx] = makeCanvas(512, 512);
  const [grateHeightCanvas, grateHeightCtx] = makeCanvas(512, 512);
  const [grateRoughCanvas, grateRoughCtx] = makeCanvas(512, 512);
  const [grateMetalCanvas, grateMetalCtx] = makeCanvas(512, 512);
  grateCtx.fillStyle = '#181e26';
  grateCtx.fillRect(0, 0, 512, 512);
  grateHeightCtx.fillStyle = '#363636';
  grateHeightCtx.fillRect(0, 0, 512, 512);
  grateRoughCtx.fillStyle = '#c4c4c4';
  grateRoughCtx.fillRect(0, 0, 512, 512);
  grateMetalCtx.fillStyle = '#d4d4d4';
  grateMetalCtx.fillRect(0, 0, 512, 512);

  // Grating rib grid + diamond studs + recessed dark slots
  const cell = 64;
  for (let gy = 0; gy < 512; gy += cell) {
    for (let gx = 0; gx < 512; gx += cell) {
      // Recessed dark vent slots inside cell
      grateCtx.fillStyle = '#07090c';
      grateHeightCtx.fillStyle = '#0c0c0c';
      grateRoughCtx.fillStyle = '#ebebeb';
      grateMetalCtx.fillStyle = '#404040';
      for (let s = 10; s <= 46; s += 12) {
        grateCtx.fillRect(gx + 10, gy + s, 44, 6);
        grateHeightCtx.fillRect(gx + 10, gy + s, 44, 6);
        grateRoughCtx.fillRect(gx + 10, gy + s, 44, 6);
        grateMetalCtx.fillRect(gx + 10, gy + s, 44, 6);
      }
      // Raised steel frame crossbars (worn satin metal, not mirror chrome)
      grateCtx.strokeStyle = '#364152';
      grateCtx.lineWidth = 5;
      grateCtx.strokeRect(gx + 2, gy + 2, cell - 4, cell - 4);
      grateHeightCtx.strokeStyle = '#d8d8d8';
      grateHeightCtx.lineWidth = 5;
      grateHeightCtx.strokeRect(gx + 2, gy + 2, cell - 4, cell - 4);
      grateRoughCtx.strokeStyle = '#929292';
      grateRoughCtx.lineWidth = 5;
      grateRoughCtx.strokeRect(gx + 2, gy + 2, cell - 4, cell - 4);

      // Corner rivets
      [6, cell - 6].forEach((rx) => {
        [6, cell - 6].forEach((ry) => {
          grateCtx.fillStyle = '#64748b';
          grateCtx.beginPath();
          grateCtx.arc(gx + rx, gy + ry, 2.2, 0, Math.PI * 2);
          grateCtx.fill();
          grateHeightCtx.fillStyle = '#ffffff';
          grateHeightCtx.beginPath();
          grateHeightCtx.arc(gx + rx, gy + ry, 2.2, 0, Math.PI * 2);
          grateHeightCtx.fill();
        });
      });
    }
  }
  // Oil & rust weathering streaks
  for (let i = 0; i < 18; i++) {
    const ox = Math.random() * 512;
    const oy = Math.random() * 512;
    const or = 24 + Math.random() * 44;
    const og = grateCtx.createRadialGradient(ox, oy, 2, ox, oy, or);
    og.addColorStop(0, i % 2 === 0 ? 'rgba(68, 32, 16, 0.35)' : 'rgba(6, 8, 10, 0.45)');
    og.addColorStop(1, 'rgba(0, 0, 0, 0)');
    grateCtx.fillStyle = og;
    grateCtx.beginPath();
    grateCtx.arc(ox, oy, or, 0, Math.PI * 2);
    grateCtx.fill();
  }
  const grateMap = finalizeColorTex(grateCanvas, maxAniso, 1, 1);
  const grateNormal = heightCanvasToNormalTex(grateHeightCanvas, 2.8, maxAniso, 1, 1);
  const grateRoughness = finalizeDataTex(grateRoughCanvas, maxAniso, 1, 1);
  const grateMetalness = finalizeDataTex(grateMetalCanvas, maxAniso, 1, 1);

  // 14B. Open Alpha-Cutout Industrial Floor Grate (for submerged drainage trenches)
  const [openGrateCanvas, openGrateCtx] = makeCanvas(256, 256);
  openGrateCtx.clearRect(0, 0, 256, 256);
  const ogCell = 64;
  for (let gy = 0; gy < 256; gy += ogCell) {
    for (let gx = 0; gx < 256; gx += ogCell) {
      openGrateCtx.strokeStyle = '#334155';
      openGrateCtx.lineWidth = 8;
      openGrateCtx.strokeRect(gx + 3, gy + 3, ogCell - 6, ogCell - 6);
      openGrateCtx.fillStyle = '#475569';
      for (let s = 14; s <= 50; s += 12) {
        openGrateCtx.fillRect(gx + 6, gy + s, ogCell - 12, 5);
      }
      openGrateCtx.fillStyle = '#1e293b';
      openGrateCtx.fillRect(gx + ogCell * 0.5 - 3, gy + 4, 6, ogCell - 8);
      openGrateCtx.fillStyle = '#64748b';
      [6, ogCell - 6].forEach((rx) => {
        [6, ogCell - 6].forEach((ry) => {
          openGrateCtx.beginPath();
          openGrateCtx.arc(gx + rx, gy + ry, 2.5, 0, Math.PI * 2);
          openGrateCtx.fill();
        });
      });
    }
  }
  const openGrateMap = finalizeColorTex(openGrateCanvas, maxAniso, 1, 1);

  // 15. Sterile/Aged Sci-Fi Lab Tile & Bulkhead Panels
  const [labCanvas, labCtx] = makeCanvas(512, 512);
  const [labHeightCanvas, labHeightCtx] = makeCanvas(512, 512);
  const [labRoughCanvas, labRoughCtx] = makeCanvas(512, 512);
  labCtx.fillStyle = '#2d3948';
  labCtx.fillRect(0, 0, 512, 512);
  labHeightCtx.fillStyle = '#b4b4b4';
  labHeightCtx.fillRect(0, 0, 512, 512);
  labRoughCtx.fillStyle = '#bcbcbc';
  labRoughCtx.fillRect(0, 0, 512, 512);

  for (let ty = 0; ty < 512; ty += 128) {
    for (let tx = 0; tx < 512; tx += 128) {
      const shade = 44 + ((tx + ty) % 3) * 4;
      labCtx.fillStyle = `rgb(${shade}, ${shade + 12}, ${shade + 26})`;
      labCtx.fillRect(tx + 3, ty + 3, 122, 122);
      const tileRough = 180 + (((tx * 7 + ty * 13) % 5) * 7);
      labRoughCtx.fillStyle = `rgb(${tileRough},${tileRough},${tileRough})`;
      labRoughCtx.fillRect(tx + 3, ty + 3, 122, 122);
      // Recessed bevel groove (matte grout)
      labCtx.strokeStyle = '#131a24';
      labCtx.lineWidth = 4;
      labCtx.strokeRect(tx + 2, ty + 2, 124, 124);
      labHeightCtx.strokeStyle = '#222222';
      labHeightCtx.lineWidth = 4;
      labHeightCtx.strokeRect(tx + 2, ty + 2, 124, 124);
      labRoughCtx.strokeStyle = '#ececec';
      labRoughCtx.lineWidth = 4;
      labRoughCtx.strokeRect(tx + 2, ty + 2, 124, 124);
      // Subtle satin center variation
      labCtx.fillStyle = 'rgba(148, 163, 184, 0.05)';
      labCtx.fillRect(tx + 12, ty + 12, 104, 104);
      // Corner fasteners
      [12, 116].forEach((fx) => {
        [12, 116].forEach((fy) => {
          labCtx.fillStyle = '#475569';
          labCtx.fillRect(tx + fx - 2, ty + fy - 2, 4, 4);
        });
      });
    }
  }
  for (let s = 0; s < 160; s++) {
    labCtx.fillStyle = 'rgba(15, 23, 42, 0.14)';
    labCtx.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 14, 1);
  }
  const labTileMap = finalizeColorTex(labCanvas, maxAniso, 1, 1);
  const labTileNormal = heightCanvasToNormalTex(labHeightCanvas, 2.2, maxAniso, 1, 1);
  const labTileRoughness = finalizeDataTex(labRoughCanvas, maxAniso, 1, 1);

  // 16. HELIOS Holographic Server Blade Array + Telemetry LEDs
  const [srvCanvas, srvCtx] = makeCanvas(512, 512);
  const [srvHeightCanvas, srvHeightCtx] = makeCanvas(512, 512);
  const [srvEmCanvas, srvEmCtx] = makeCanvas(512, 512);
  srvCtx.fillStyle = '#0c121e';
  srvCtx.fillRect(0, 0, 512, 512);
  srvHeightCtx.fillStyle = '#606060';
  srvHeightCtx.fillRect(0, 0, 512, 512);
  srvEmCtx.fillStyle = '#000000';
  srvEmCtx.fillRect(0, 0, 512, 512);

  for (let row = 8; row < 504; row += 32) {
    // Blade chassis
    srvCtx.fillStyle = '#182234';
    srvCtx.fillRect(10, row, 492, 26);
    srvCtx.strokeStyle = '#070b14';
    srvCtx.lineWidth = 2;
    srvCtx.strokeRect(10, row, 492, 26);
    srvHeightCtx.fillStyle = '#b0b0b0';
    srvHeightCtx.fillRect(12, row + 2, 488, 22);
    // Air vents
    srvCtx.fillStyle = '#060a10';
    srvHeightCtx.fillStyle = '#202020';
    for (let vx = 24; vx < 340; vx += 14) {
      srvCtx.fillRect(vx, row + 7, 8, 12);
      srvHeightCtx.fillRect(vx, row + 7, 8, 12);
    }
    // Optical status LEDs
    for (let lx = 368; lx < 488; lx += 16) {
      const r = Math.random();
      if (r > 0.25) {
        const col = r > 0.88 ? '#ef4444' : r > 0.7 ? '#38bdf8' : '#22d3ee';
        srvCtx.fillStyle = col;
        srvCtx.fillRect(lx, row + 9, 8, 6);
        srvEmCtx.fillStyle = col;
        srvEmCtx.fillRect(lx, row + 9, 8, 6);
      }
    }
  }
  const serverRackMap = finalizeColorTex(srvCanvas, maxAniso, 1, 1);
  const serverRackNormal = heightCanvasToNormalTex(srvHeightCanvas, 2.4, maxAniso, 1, 1);
  const serverRackEmissive = finalizeColorTex(srvEmCanvas, maxAniso, 1, 1);

  // 17. Alien Subterranean Obsidian / Pre-Human Carved Circuit Basalt
  const [obsCanvas, obsCtx] = makeCanvas(512, 512);
  const [obsHeightCanvas, obsHeightCtx] = makeCanvas(512, 512);
  const [obsEmCanvas, obsEmCtx] = makeCanvas(512, 512);
  obsCtx.fillStyle = '#0e0b18';
  obsCtx.fillRect(0, 0, 512, 512);
  obsHeightCtx.fillStyle = '#909090';
  obsHeightCtx.fillRect(0, 0, 512, 512);
  obsEmCtx.fillStyle = '#000000';
  obsEmCtx.fillRect(0, 0, 512, 512);

  // Basalt hexagonal & geometric stone fracturing
  for (let i = 0; i < 65; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const s = 22 + Math.random() * 55;
    obsCtx.fillStyle = i % 2 === 0 ? 'rgba(26, 20, 42, 0.55)' : 'rgba(10, 7, 18, 0.55)';
    obsCtx.fillRect(x, y, s, s * 0.7);
    obsHeightCtx.fillStyle = i % 2 === 0 ? '#a8a8a8' : '#6c6c6c';
    obsHeightCtx.fillRect(x, y, s, s * 0.7);
  }
  // Etched pre-human crimson/violet glowing channels
  for (let c = 0; c < 14; c++) {
    let cx = Math.floor(Math.random() * 8) * 64 + 32;
    let cy = Math.floor(Math.random() * 8) * 64 + 32;
    const col = c % 4 === 0 ? '#38bdf8' : '#f43f5e';
    [obsCtx, obsEmCtx, obsHeightCtx].forEach((ctx, idx) => {
      ctx.strokeStyle = idx === 2 ? '#181818' : col;
      ctx.lineWidth = idx === 1 ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
    });
    for (let seg = 0; seg < 4; seg++) {
      if (seg % 2 === 0) cx = ((cx + 64 * (Math.random() > 0.5 ? 1 : -1)) + 512) % 512;
      else cy = ((cy + 64 * (Math.random() > 0.5 ? 1 : -1)) + 512) % 512;
      obsCtx.lineTo(cx, cy);
      obsEmCtx.lineTo(cx, cy);
      obsHeightCtx.lineTo(cx, cy);
    }
    obsCtx.stroke();
    obsEmCtx.stroke();
    obsHeightCtx.stroke();
  }
  const alienObsidianMap = finalizeColorTex(obsCanvas, maxAniso, 1, 1);
  const alienObsidianNormal = heightCanvasToNormalTex(obsHeightCanvas, 2.8, maxAniso, 1, 1);
  const alienObsidianEmissive = finalizeColorTex(obsEmCanvas, maxAniso, 1, 1);

  // 18. Planet Earth (2048x1024 procedural continents, deep ocean, clouds & 3059 parasitic scars)
  const [earthCanvas, earthCtx] = makeCanvas(1024, 512);
  const [earthHeightCanvas, earthHeightCtx] = makeCanvas(1024, 512);
  const [earthRoughCanvas, earthRoughCtx] = makeCanvas(1024, 512);
  const oceanGrad = earthCtx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, '#0f2744');
  oceanGrad.addColorStop(0.5, '#0b3a6e');
  oceanGrad.addColorStop(1, '#0f2744');
  earthCtx.fillStyle = oceanGrad;
  earthCtx.fillRect(0, 0, 1024, 512);
  earthHeightCtx.fillStyle = '#404040';
  earthHeightCtx.fillRect(0, 0, 1024, 512);
  earthRoughCtx.fillStyle = '#383838'; // Glossy oceans
  earthRoughCtx.fillRect(0, 0, 1024, 512);

  // Polar ice caps
  earthCtx.fillStyle = '#dbeafe';
  earthCtx.fillRect(0, 0, 1024, 34);
  earthCtx.fillRect(0, 478, 1024, 34);
  earthRoughCtx.fillStyle = '#b4b4b4';
  earthRoughCtx.fillRect(0, 0, 1024, 34);
  earthRoughCtx.fillRect(0, 478, 1024, 34);

  // Procedurally sculpted continent landmasses
  for (let c = 0; c < 42; c++) {
    const cx = 80 + Math.random() * 864;
    const cy = 65 + Math.random() * 380;
    const rx = 28 + Math.random() * 76;
    const ry = 18 + Math.random() * 54;
    earthCtx.fillStyle = c % 3 === 0 ? '#3f5a36' : c % 3 === 1 ? '#574a38' : '#2d4732';
    earthCtx.beginPath();
    earthCtx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    earthCtx.fill();
    earthHeightCtx.fillStyle = '#b8b8b8';
    earthHeightCtx.beginPath();
    earthHeightCtx.ellipse(cx, cy, rx * 0.85, ry * 0.85, 0, 0, Math.PI * 2);
    earthHeightCtx.fill();
    earthRoughCtx.fillStyle = '#c8c8c8'; // Matte land
    earthRoughCtx.beginPath();
    earthRoughCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    earthRoughCtx.fill();
  }
  // 3059 AD Infected Red Scars across continents
  earthCtx.strokeStyle = 'rgba(239, 68, 68, 0.72)';
  earthCtx.lineWidth = 2.4;
  for (let s = 0; s < 16; s++) {
    let sx = 120 + Math.random() * 780;
    let sy = 90 + Math.random() * 330;
    earthCtx.beginPath();
    earthCtx.moveTo(sx, sy);
    for (let k = 0; k < 5; k++) {
      sx += (Math.random() - 0.5) * 65;
      sy += (Math.random() - 0.5) * 45;
      earthCtx.lineTo(sx, sy);
    }
    earthCtx.stroke();
  }
  // Swirling white atmospheric clouds
  for (let w = 0; w < 65; w++) {
    const wx = Math.random() * 1024;
    const wy = 40 + Math.random() * 432;
    const cg = earthCtx.createRadialGradient(wx, wy, 4, wx, wy, 44 + Math.random() * 42);
    cg.addColorStop(0, 'rgba(241, 245, 249, 0.48)');
    cg.addColorStop(1, 'rgba(241, 245, 249, 0)');
    earthCtx.fillStyle = cg;
    earthCtx.beginPath();
    earthCtx.ellipse(wx, wy, 72, 22, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
    earthCtx.fill();
  }
  const earthMap = finalizeColorTex(earthCanvas, maxAniso, 1, 1);
  const earthNormal = heightCanvasToNormalTex(earthHeightCanvas, 1.8, maxAniso, 1, 1);
  const earthRoughness = finalizeDataTex(earthRoughCanvas, maxAniso, 1, 1);

  // 19. Dried Blood & Biomechanical Oil Splatter Decal
  const [bloodCanvas, bloodCtx] = makeCanvas(256, 256);
  const bGrad = bloodCtx.createRadialGradient(128, 128, 8, 128, 128, 92);
  bGrad.addColorStop(0, 'rgba(48, 6, 8, 0.94)');
  bGrad.addColorStop(0.55, 'rgba(85, 10, 14, 0.72)');
  bGrad.addColorStop(1, 'rgba(30, 4, 6, 0)');
  bloodCtx.fillStyle = bGrad;
  bloodCtx.fillRect(0, 0, 256, 256);
  for (let b = 0; b < 22; b++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 24 + Math.random() * 84;
    const bx = 128 + Math.cos(ang) * dist;
    const by = 128 + Math.sin(ang) * dist;
    const br = 4 + Math.random() * 14;
    bloodCtx.fillStyle = b % 3 === 0 ? 'rgba(18, 14, 16, 0.78)' : 'rgba(92, 10, 14, 0.78)';
    bloodCtx.beginPath();
    bloodCtx.arc(bx, by, br, 0, Math.PI * 2);
    bloodCtx.fill();
  }
  const bloodDecalMap = finalizeColorTex(bloodCanvas, maxAniso, 1, 1);
  bloodDecalMap.wrapS = THREE.ClampToEdgeWrapping;
  bloodDecalMap.wrapT = THREE.ClampToEdgeWrapping;

  // 20. High-Detail Seamless 512x512 Multi-Octave Water Wave Normal Map
  const [watCanvas, watCtx] = makeCanvas(512, 512);
  const watImg = watCtx.createImageData(512, 512);
  const watData = watImg.data;
  const tau = Math.PI * 2;
  const waveComponents: [number, number, number, number, number][] = [
    [2, 1, 22, 0.3, 1.0],
    [-1, 3, 18, 1.2, 1.0],
    [3, -2, 14, 2.1, 1.0],
    [-4, -3, 10, 0.7, 1.0],
    [5, 2, 7.5, 1.9, 1.0],
    [-3, 6, 6.0, 2.8, 1.0],
    [7, -5, 4.2, 0.4, 1.0],
    [-8, -4, 3.4, 1.5, 1.0],
    [11, 6, 2.1, 2.4, 1.0],
    [-9, 12, 1.7, 0.9, 1.0],
  ];
  for (let y = 0; y < 512; y++) {
    const v = y / 512;
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      let h = 128;
      for (let k = 0; k < waveComponents.length; k++) {
        const [fx, fy, amp, phase] = waveComponents[k];
        const arg = (u * fx + v * fy) * tau + phase;
        // Slightly sharper Gerstner-style cresting on primary octaves
        const s = Math.sin(arg);
        const c = Math.cos(arg * 2.0) * 0.16;
        h += (s + c) * amp;
      }
      const val = Math.max(0, Math.min(255, Math.round(h)));
      const idx = (y * 512 + x) * 4;
      watData[idx] = val;
      watData[idx + 1] = val;
      watData[idx + 2] = val;
      watData[idx + 3] = 255;
    }
  }
  watCtx.putImageData(watImg, 0, 0);
  const waterNormalMap = heightCanvasToNormalTex(watCanvas, 2.4, maxAniso, 6, 6);

  // 21. Natural Healthy Moss & Soil Patch Decal (100% non-infected organic greens/browns)
  const [mossCanvas, mossCtx] = makeCanvas(256, 256);
  const mGrad = mossCtx.createRadialGradient(128, 128, 10, 128, 128, 118);
  mGrad.addColorStop(0, 'rgba(46, 86, 36, 0.88)');
  mGrad.addColorStop(0.55, 'rgba(58, 102, 42, 0.62)');
  mGrad.addColorStop(1, 'rgba(35, 58, 28, 0)');
  mossCtx.fillStyle = mGrad;
  mossCtx.fillRect(0, 0, 256, 256);
  for (let m = 0; m < 420; m++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.random() * 108;
    const mx = 128 + Math.cos(ang) * dist;
    const my = 128 + Math.sin(ang) * dist;
    const mr = 2 + Math.random() * 7;
    const gShade = 62 + Math.floor(Math.random() * 52);
    mossCtx.fillStyle = `rgba(${Math.floor(gShade * 0.56)}, ${gShade + 22}, ${Math.floor(gShade * 0.4)}, 0.55)`;
    mossCtx.beginPath();
    mossCtx.arc(mx, my, mr, 0, Math.PI * 2);
    mossCtx.fill();
  }
  const mossDecalMap = finalizeColorTex(mossCanvas, maxAniso, 1, 1);
  mossDecalMap.wrapS = THREE.ClampToEdgeWrapping;
  mossDecalMap.wrapT = THREE.ClampToEdgeWrapping;

  // 22. Natural Furrowed Tree Bark (healthy organic timber, zero parasite infection)
  const [barkCanvas, barkCtx] = makeCanvas(256, 256);
  barkCtx.fillStyle = '#3b2e23';
  barkCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 240; i++) {
    const bx = Math.random() * 256;
    const by = Math.random() * 256;
    const bw = 2 + Math.random() * 5;
    const bh = 22 + Math.random() * 75;
    const dark = i % 3 === 0;
    barkCtx.fillStyle = dark ? '#241b14' : i % 4 === 0 ? '#4d3d2f' : '#35291f';
    barkCtx.fillRect(bx, by, bw, bh);
  }
  for (let l = 0; l < 18; l++) {
    barkCtx.fillStyle = 'rgba(72, 108, 56, 0.35)';
    barkCtx.beginPath();
    barkCtx.ellipse(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 10, 14 + Math.random() * 16, 0, 0, Math.PI * 2);
    barkCtx.fill();
  }
  const foliageBarkMap = finalizeColorTex(barkCanvas, maxAniso, 1, 2);

  // 23. Weathered Architectural Timber & Furniture Wood (Walnut/Mahogany with Grain & Scratches)
  const [woodCanvas, woodCtx] = makeCanvas(512, 512);
  const [woodHeightCanvas, woodHeightCtx] = makeCanvas(512, 512);
  const [woodRoughCanvas, woodRoughCtx] = makeCanvas(512, 512);
  woodCtx.fillStyle = '#3a2517';
  woodCtx.fillRect(0, 0, 512, 512);
  woodHeightCtx.fillStyle = '#808080';
  woodHeightCtx.fillRect(0, 0, 512, 512);
  woodRoughCtx.fillStyle = '#d4d4d4';
  woodRoughCtx.fillRect(0, 0, 512, 512);

  // Flowing longitudinal grain rings with natural knotholes
  for (let x = 0; x < 512; x += 3) {
    const grainTone = 38 + Math.floor(Math.sin(x * 0.12) * 12 + Math.random() * 14);
    woodCtx.strokeStyle = `rgb(${grainTone + 22}, ${grainTone + 8}, ${grainTone})`;
    woodCtx.lineWidth = 1.8 + (x % 5 === 0 ? 1.2 : 0);
    woodHeightCtx.strokeStyle = (x % 6 === 0) ? '#404040' : '#a8a8a8';
    woodHeightCtx.lineWidth = woodCtx.lineWidth;
    woodCtx.beginPath();
    woodHeightCtx.beginPath();
    woodCtx.moveTo(x, 0);
    woodHeightCtx.moveTo(x, 0);
    for (let y = 0; y <= 512; y += 32) {
      const knotDist1 = Math.hypot(x - 180, y - 220);
      const knotWarp1 = knotDist1 < 75 ? Math.sin((75 - knotDist1) * 0.08) * 28 : 0;
      const knotDist2 = Math.hypot(x - 380, y - 390);
      const knotWarp2 = knotDist2 < 65 ? Math.cos((65 - knotDist2) * 0.09) * 24 : 0;
      const wave = Math.sin(y * 0.02 + x * 0.04) * 8 + knotWarp1 + knotWarp2;
      woodCtx.lineTo(x + wave, y);
      woodHeightCtx.lineTo(x + wave, y);
    }
    woodCtx.stroke();
    woodHeightCtx.stroke();
  }
  // Knotholes
  [[180, 220, 18], [380, 390, 15]].forEach(([kx, ky, kr]) => {
    const kg = woodCtx.createRadialGradient(kx, ky, 2, kx, ky, kr);
    kg.addColorStop(0, '#1c1008');
    kg.addColorStop(0.7, '#2e190e');
    kg.addColorStop(1, 'rgba(58, 37, 23, 0)');
    woodCtx.fillStyle = kg;
    woodCtx.beginPath();
    woodCtx.arc(kx, ky, kr, 0, Math.PI * 2);
    woodCtx.fill();
    woodHeightCtx.fillStyle = '#202020';
    woodHeightCtx.beginPath();
    woodHeightCtx.arc(kx, ky, kr, 0, Math.PI * 2);
    woodHeightCtx.fill();
    woodRoughCtx.fillStyle = '#dedede';
    woodRoughCtx.beginPath();
    woodRoughCtx.arc(kx, ky, kr, 0, Math.PI * 2);
    woodRoughCtx.fill();
  });
  // Surface scratches & weathered water-stain rings
  woodCtx.strokeStyle = 'rgba(18, 12, 8, 0.65)';
  woodCtx.lineWidth = 1.2;
  for (let sc = 0; sc < 28; sc++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 512;
    woodCtx.beginPath();
    woodCtx.moveTo(sx, sy);
    woodCtx.lineTo(sx + (Math.random() - 0.5) * 80, sy + (Math.random() - 0.5) * 35);
    woodCtx.stroke();
  }
  const woodMap = finalizeColorTex(woodCanvas, maxAniso, 2, 2);
  const woodNormal = heightCanvasToNormalTex(woodHeightCanvas, 2.0, maxAniso, 2, 2);
  const woodRoughness = finalizeDataTex(woodRoughCanvas, maxAniso, 2, 2);

  // 24. Weathered Urban Brickwork & Masonry
  const [brickCanvas, brickCtx] = makeCanvas(512, 512);
  const [brickHeightCanvas, brickHeightCtx] = makeCanvas(512, 512);
  const [brickRoughCanvas, brickRoughCtx] = makeCanvas(512, 512);
  brickCtx.fillStyle = '#3d3a36'; // Recessed gray mortar bed
  brickCtx.fillRect(0, 0, 512, 512);
  brickHeightCtx.fillStyle = '#303030';
  brickHeightCtx.fillRect(0, 0, 512, 512);
  brickRoughCtx.fillStyle = '#f2f2f2';
  brickRoughCtx.fillRect(0, 0, 512, 512);

  const rowHeight = 32;
  const brickWidth = 80;
  for (let r = 0; r < 16; r++) {
    const y = r * rowHeight + 3;
    const offset = (r % 2) * (brickWidth * 0.5);
    for (let c = -1; c < 8; c++) {
      const x = c * brickWidth + offset + 3;
      const bw = brickWidth - 6;
      const bh = rowHeight - 6;
      const bHue = 45 + Math.floor(Math.random() * 22);
      brickCtx.fillStyle = `rgb(${bHue + 60}, ${Math.floor(bHue * 0.65)}, ${Math.floor(bHue * 0.45)})`;
      brickCtx.fillRect(x, y, bw, bh);
      brickHeightCtx.fillStyle = '#c5c5c5';
      brickHeightCtx.fillRect(x, y, bw, bh);
      const brRough = 212 + Math.floor(Math.random() * 28);
      brickRoughCtx.fillStyle = `rgb(${brRough},${brRough},${brRough})`;
      brickRoughCtx.fillRect(x, y, bw, bh);

      // Chipped corners & granular clay pits
      if (Math.random() < 0.35) {
        brickCtx.fillStyle = 'rgba(25, 18, 15, 0.65)';
        brickCtx.fillRect(x + (Math.random() < 0.5 ? 0 : bw - 6), y, 6, 6);
        brickHeightCtx.fillStyle = '#454545';
        brickHeightCtx.fillRect(x + (Math.random() < 0.5 ? 0 : bw - 6), y, 6, 6);
      }
    }
  }
  // White mineral efflorescence & damp moss bloom
  for (let e = 0; e < 18; e++) {
    const ex = Math.random() * 512;
    const ey = Math.random() * 512;
    const er = 16 + Math.random() * 38;
    const eg = brickCtx.createRadialGradient(ex, ey, 2, ex, ey, er);
    eg.addColorStop(0, e % 3 === 0 ? 'rgba(52, 85, 42, 0.45)' : 'rgba(225, 230, 235, 0.38)');
    eg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    brickCtx.fillStyle = eg;
    brickCtx.beginPath();
    brickCtx.arc(ex, ey, er, 0, Math.PI * 2);
    brickCtx.fill();
  }
  const brickMap = finalizeColorTex(brickCanvas, maxAniso, 3, 3);
  const brickNormal = heightCanvasToNormalTex(brickHeightCanvas, 2.5, maxAniso, 3, 3);
  const brickRoughness = finalizeDataTex(brickRoughCanvas, maxAniso, 3, 3);

  // 25. Tempered Cracked Glass (Shattered Spiderweb Fractures with Prismatic Normals)
  const [glassCanvas, glassCtx] = makeCanvas(512, 512);
  const [glassHeightCanvas, glassHeightCtx] = makeCanvas(512, 512);
  glassCtx.fillStyle = 'rgba(16, 26, 38, 0.28)';
  glassCtx.fillRect(0, 0, 512, 512);
  glassHeightCtx.fillStyle = '#808080';
  glassHeightCtx.fillRect(0, 0, 512, 512);

  // Radial impact epicenters with jagged spiderweb fracture branches
  [[210, 190], [370, 340]].forEach(([cx, cy]) => {
    // Center shattered hole
    glassCtx.clearRect(cx - 16, cy - 16, 32, 32);
    glassHeightCtx.fillStyle = '#101010';
    glassHeightCtx.fillRect(cx - 16, cy - 16, 32, 32);

    glassCtx.strokeStyle = 'rgba(240, 248, 255, 0.95)';
    glassHeightCtx.strokeStyle = '#f8f8f8';
    // Concentric stress rings
    for (let r = 24; r < 180; r += 28) {
      glassCtx.lineWidth = 1.4;
      glassHeightCtx.lineWidth = 2.2;
      glassCtx.beginPath();
      glassHeightCtx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.35) {
        const rad = r + (Math.sin(a * 7) * 9);
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad;
        if (a === 0) {
          glassCtx.moveTo(px, py);
          glassHeightCtx.moveTo(px, py);
        } else {
          glassCtx.lineTo(px, py);
          glassHeightCtx.lineTo(px, py);
        }
      }
      glassCtx.stroke();
      glassHeightCtx.stroke();
    }
    // Radial crack spokes
    for (let s = 0; s < 18; s++) {
      const ang = (s / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      let px = cx;
      let py = cy;
      glassCtx.beginPath();
      glassHeightCtx.beginPath();
      glassCtx.moveTo(px, py);
      glassHeightCtx.moveTo(px, py);
      for (let seg = 0; seg < 6; seg++) {
        px += Math.cos(ang + (Math.random() - 0.5) * 0.35) * 36;
        py += Math.sin(ang + (Math.random() - 0.5) * 0.35) * 36;
        glassCtx.lineTo(px, py);
        glassHeightCtx.lineTo(px, py);
      }
      glassCtx.stroke();
      glassHeightCtx.stroke();
    }
  });
  const glassCrackedMap = finalizeColorTex(glassCanvas, maxAniso, 1, 1);
  const glassCrackedNormal = heightCanvasToNormalTex(glassHeightCanvas, 3.5, maxAniso, 1, 1);

  const all = [
    asphaltMap,
    asphaltNormal,
    asphaltRoughness,
    concreteMap,
    concreteNormal,
    concreteRoughness,
    metalPlateMap,
    metalNormal,
    metalRoughness,
    metalMetalness,
    hazardStripeMap,
    skyscraperMap,
    skyscraperNormal,
    skyscraperRoughness,
    skyscraperEmissive,
    infectedFleshMap,
    infectedFleshNormal,
    infectedFleshRoughness,
    infectedEmissiveMap,
    boneMap,
    boneNormal,
    terminalScreenMap,
    scorchDecalMap,
    contactShadowMap,
    fireSpriteMap,
    smokeSpriteMap,
    emberSpriteMap,
    grateMap,
    openGrateMap,
    grateNormal,
    grateRoughness,
    grateMetalness,
    labTileMap,
    labTileNormal,
    labTileRoughness,
    serverRackMap,
    serverRackNormal,
    serverRackEmissive,
    alienObsidianMap,
    alienObsidianNormal,
    alienObsidianEmissive,
    earthMap,
    earthNormal,
    earthRoughness,
    bloodDecalMap,
    waterNormalMap,
    mossDecalMap,
    foliageBarkMap,
    woodMap,
    woodNormal,
    woodRoughness,
    brickMap,
    brickNormal,
    brickRoughness,
    glassCrackedMap,
    glassCrackedNormal,
  ];

  return {
    asphaltMap,
    asphaltNormal,
    asphaltRoughness,
    concreteMap,
    concreteNormal,
    concreteRoughness,
    metalPlateMap,
    metalNormal,
    metalRoughness,
    metalMetalness,
    hazardStripeMap,
    skyscraperMap,
    skyscraperNormal,
    skyscraperRoughness,
    skyscraperEmissive,
    infectedFleshMap,
    infectedFleshNormal,
    infectedFleshRoughness,
    infectedEmissiveMap,
    boneMap,
    boneNormal,
    terminalScreenMap,
    scorchDecalMap,
    contactShadowMap,
    fireSpriteMap,
    smokeSpriteMap,
    emberSpriteMap,
    grateMap,
    openGrateMap,
    grateNormal,
    grateRoughness,
    grateMetalness,
    labTileMap,
    labTileNormal,
    labTileRoughness,
    serverRackMap,
    serverRackNormal,
    serverRackEmissive,
    alienObsidianMap,
    alienObsidianNormal,
    alienObsidianEmissive,
    earthMap,
    earthNormal,
    earthRoughness,
    bloodDecalMap,
    waterNormalMap,
    mossDecalMap,
    foliageBarkMap,
    woodMap,
    woodNormal,
    woodRoughness,
    brickMap,
    brickNormal,
    brickRoughness,
    glassCrackedMap,
    glassCrackedNormal,
    dispose: () => {
      all.forEach((t) => t.dispose());
    },
  };
}
