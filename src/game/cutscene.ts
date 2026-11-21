import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HorrorAudioEngine } from './audio';
import {
  createTentaclePhysicsState,
  createTitanforgedNeckState,
  TentaclePhysicsState,
  TitanforgedNeckState,
  updateMonsterTentacles,
  updateTitanforgedNeckAnimation,
} from './animation';
import { VolumetricFireSystem } from './fireSystem';
import { FireEmitterDef, SparkEmitterDef } from './fireSystem';
import { buildEnemyModel, EnemyModelRefs } from './models';
import { createProceduralTextures, ProceduralTextureSet } from './textures';
import {
  buildInfectedVehicle,
  buildRealisticSkyscraper,
  createSkyscraperMaterials,
} from './worldBuilder';

export interface CutsceneOverlayState {
  elapsed: number;
  totalDuration: number;
  sceneIndex: number; // 1..5
  fadeOpacity: number; // 0..1 black fade
  titleCard: { heading: string; subheading?: string } | null;
  statementLines: string[] | null;
  radioBanner: { speaker: string; text: string; disconnected?: boolean } | null;
  damageFlash: number;
}

interface MeteorItem {
  group: THREE.Group;
  trailPts: THREE.Points;
  trailPositions: Float32Array;
  startPos: THREE.Vector3;
  impactPos: THREE.Vector3;
  startTime: number;
  impactTime: number;
  impacted: boolean;
  entryPlayed: boolean;
  shockRing: THREE.Mesh;
  explosionSphere: THREE.Mesh;
  scarMesh: THREE.Mesh;
  smokeCloud: THREE.Points;
}

interface LabFlickerLight {
  light: THREE.PointLight;
  bulbMat: THREE.MeshStandardMaterial;
  base: number;
  phase: number;
}

const _tmpV1 = new THREE.Vector3();
const _tmpV2 = new THREE.Vector3();
const _tmpLook = new THREE.Vector3();

export const CUTSCENE_TOTAL_DURATION = 68.6;

export class OpeningCutsceneEngine {
  private container: HTMLElement;
  private audio: HorrorAudioEngine;
  private onOverlayUpdate: (state: CutsceneOverlayState) => void;
  private onComplete: () => void;

  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private camera: THREE.PerspectiveCamera;
  private textures: ProceduralTextureSet;
  private envTex: THREE.Texture;
  private isSoftwareGl: boolean;

  private scenes: THREE.Scene[] = [];
  private activeSceneIdx = 0;
  private elapsed = 0;
  private lastTime = performance.now();
  private frameId = 0;
  private disposed = false;
  private completed = false;
  private contextLost = false;

  // Scene 1 (Space / Meteors)
  private earthGroup1!: THREE.Group;
  private earthClouds1!: THREE.Mesh;
  private meteors: MeteorItem[] = [];

  // Scene 2 (Ruined Megacity + Fused Biomechanical Machinery)
  private fireSystem2!: VolumetricFireSystem;
  private fusedOrgans2: THREE.Mesh[] = [];
  private emergencyLights2: { light: THREE.PointLight; base: number; speed: number }[] = [];

  // Scene 3 (Underground Laboratory)
  private labFlickers: LabFlickerLight[] = [];
  private labMonitorCtx!: CanvasRenderingContext2D;
  private labMonitorTex!: THREE.CanvasTexture;
  private labSilhouette!: EnemyModelRefs;
  private labSilhouetteTentacles!: TentaclePhysicsState;
  private labSilhouetteNeck!: TitanforgedNeckState;
  private labContainmentLight!: THREE.PointLight;
  private labContainmentFill!: THREE.PointLight;
  private labStingerPlayed = false;
  private lastLabFlickerAudio = 0;
  private lastSilhouetteStepIdx = -1;

  // Scene 4 (HELIOS Satellites)
  private earthGroup4!: THREE.Group;
  private heroSatellite!: THREE.Group;
  private heroDishPivot!: THREE.Group;
  private secondarySats: THREE.Group[] = [];
  private signalBeam!: THREE.Mesh;
  private signalRings: THREE.Mesh[] = [];
  private lastSignalPulseAudio = 0;

  // Scene 5 (Damaged APC Interior)
  private apcStrobeLight!: THREE.PointLight;
  private apcSparkLight!: THREE.PointLight;
  private apcSparks!: THREE.Points;
  private apcSparkVel: Float32Array = new Float32Array(0);
  private apcRadioLedMat!: THREE.MeshBasicMaterial;
  private apcClawShadow!: THREE.Mesh;
  private apcImpactTriggered = false;
  private apcImpactShake = 0;
  private lastAlarmTime = 0;
  private radioCueFired = new Set<number>();

  private currentDroneMode = '';
  private disposables: { dispose: () => void }[] = [];

  constructor(
    container: HTMLElement,
    audio: HorrorAudioEngine,
    onOverlayUpdate: (state: CutsceneOverlayState) => void,
    onComplete: () => void
  ) {
    this.container = container;
    this.audio = audio;
    this.onOverlayUpdate = onOverlayUpdate;
    this.onComplete = onComplete;

    this.isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.09).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 450);
    this.textures = createProceduralTextures(this.renderer);

    if (!this.isSoftwareGl) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(new THREE.Scene(), this.camera));
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.34, 0.46, 0.86);
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
    }

    this.buildScene1MeteorFall();
    this.buildScene2CollapseRuins();
    this.buildScene3Laboratory();
    this.buildScene4HeliosSignal();
    this.buildScene5DamagedAPC();

    if (!this.isSoftwareGl) {
      this.scenes.forEach((sc) => this.renderer.compile(sc, this.camera));
    }

    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored);
    window.addEventListener('resize', this.onResize);

    this.lastTime = performance.now();
    this.loop();
  }

  private createEarthTexturePair(scarred: boolean): {
    albedo: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    emissive: THREE.CanvasTexture;
    clouds: THREE.CanvasTexture;
  } {
    const w = 1024;
    const h = 512;

    // 1. Rasterize recognizable global continent silhouettes onto a mask canvas
    // U spans longitude -180..+180 (0..w); V spans latitude +90..-90 (0..h).
    // With Three.js SphereGeometry, u=0.25..0.55 faces +Z/+X toward the camera & sun.
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const mctx = maskCanvas.getContext('2d')!;
    mctx.fillStyle = '#000000';
    mctx.fillRect(0, 0, w, h);

    const drawPoly = (pts: [number, number][], blurPx = 14) => {
      mctx.save();
      mctx.filter = `blur(${blurPx}px)`;
      mctx.fillStyle = '#ffffff';
      mctx.beginPath();
      pts.forEach(([nx, ny], i) => {
        const px = nx * w;
        const py = ny * h;
        if (i === 0) mctx.moveTo(px, py);
        else mctx.lineTo(px, py);
      });
      mctx.closePath();
      mctx.fill();
      mctx.restore();
    };

    // North America
    drawPoly([
      [0.06, 0.2], [0.12, 0.16], [0.22, 0.15], [0.3, 0.18], [0.34, 0.25],
      [0.29, 0.33], [0.25, 0.37], [0.24, 0.43], [0.21, 0.44], [0.19, 0.37],
      [0.14, 0.31], [0.1, 0.26],
    ], 12);
    // Greenland
    drawPoly([
      [0.34, 0.08], [0.41, 0.07], [0.43, 0.14], [0.38, 0.19], [0.34, 0.15],
    ], 8);
    // South America
    drawPoly([
      [0.25, 0.46], [0.31, 0.48], [0.36, 0.56], [0.35, 0.66], [0.3, 0.77],
      [0.27, 0.82], [0.25, 0.72], [0.24, 0.58], [0.23, 0.5],
    ], 11);
    // Europe
    drawPoly([
      [0.46, 0.19], [0.51, 0.15], [0.58, 0.16], [0.6, 0.24], [0.55, 0.29],
      [0.48, 0.3], [0.45, 0.26],
    ], 9);
    // UK / Ireland
    drawPoly([
      [0.44, 0.21], [0.46, 0.2], [0.46, 0.25], [0.44, 0.25],
    ], 4);
    // Africa
    drawPoly([
      [0.45, 0.34], [0.53, 0.33], [0.59, 0.36], [0.63, 0.45], [0.6, 0.58],
      [0.56, 0.69], [0.52, 0.71], [0.49, 0.58], [0.46, 0.48], [0.43, 0.41],
    ], 11);
    // Madagascar
    drawPoly([
      [0.62, 0.61], [0.64, 0.6], [0.63, 0.68], [0.61, 0.67],
    ], 4);
    // Asia
    drawPoly([
      [0.58, 0.16], [0.7, 0.13], [0.85, 0.15], [0.93, 0.2], [0.89, 0.28],
      [0.83, 0.36], [0.78, 0.43], [0.72, 0.45], [0.67, 0.42], [0.61, 0.35],
      [0.58, 0.28],
    ], 13);
    // India & SE Asia peninsulas
    drawPoly([
      [0.68, 0.36], [0.73, 0.36], [0.71, 0.48], [0.68, 0.44],
    ], 6);
    // Japan
    drawPoly([
      [0.87, 0.26], [0.9, 0.25], [0.89, 0.33], [0.86, 0.32],
    ], 4);
    // Indonesia / Maritime Archipelago
    drawPoly([
      [0.77, 0.49], [0.86, 0.5], [0.87, 0.55], [0.78, 0.54],
    ], 6);
    // Australia
    drawPoly([
      [0.8, 0.6], [0.88, 0.59], [0.91, 0.67], [0.86, 0.74], [0.79, 0.71],
    ], 9);
    // Antarctica
    drawPoly([
      [0.0, 0.89], [0.25, 0.88], [0.5, 0.9], [0.75, 0.88], [1.0, 0.89],
      [1.0, 1.0], [0.0, 1.0],
    ], 10);

    const maskData = mctx.getImageData(0, 0, w, h).data;

    // Periodic 2D value noise + fBm for seamless wrap at u=0 / u=1
    const hash2 = (ix: number, iy: number, seed: number): number => {
      const n = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453123;
      return n - Math.floor(n);
    };
    const smoothNoise = (x: number, y: number, periodX: number, seed: number): number => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;
      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);
      const x0 = ((ix % periodX) + periodX) % periodX;
      const x1 = (x0 + 1) % periodX;
      const a = hash2(x0, iy, seed);
      const b = hash2(x1, iy, seed);
      const c = hash2(x0, iy + 1, seed);
      const d = hash2(x1, iy + 1, seed);
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    };
    const fbm = (u: number, v: number, baseFreq: number, octaves: number, seed: number): number => {
      let sum = 0;
      let amp = 0.5;
      let freq = baseFreq;
      let norm = 0;
      for (let o = 0; o < octaves; o++) {
        sum += smoothNoise(u * freq, v * freq * 0.5, Math.round(freq), seed + o * 13) * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2;
      }
      return sum / norm;
    };

    const albedoCanvas = document.createElement('canvas');
    albedoCanvas.width = w;
    albedoCanvas.height = h;
    const actx = albedoCanvas.getContext('2d')!;
    const albedoImg = actx.createImageData(w, h);
    const aDst = albedoImg.data;

    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = w;
    roughCanvas.height = h;
    const rctx = roughCanvas.getContext('2d')!;
    const roughImg = rctx.createImageData(w, h);
    const rDst = roughImg.data;

    const elevBuf = new Float32Array(w * h);

    for (let y = 0; y < h; y++) {
      const v = y / h;
      const latNorm = Math.abs(v - 0.5) * 2; // 0 at equator, 1 at poles
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const idx = y * w + x;
        const pIdx = idx * 4;

        const mask = maskData[pIdx] / 255;
        const nCoast = fbm(u, v, 10, 5, 1.3) - 0.5; // -0.5 .. +0.5
        const nDetail = fbm(u, v, 24, 3, 7.9) - 0.5;
        const nMoist = fbm(u, v, 8, 3, 3.7);
        const ridge = 1 - Math.abs(fbm(u, v, 14, 4, 11.2) * 2 - 1);

        // Elevation: negative = ocean, positive = continent
        const elev = mask * 0.92 - 0.24 + nCoast * 0.44 + nDetail * 0.14;
        const mountainBoost = elev > 0.1 ? Math.pow(ridge, 3) * 0.55 : 0;
        const finalElev = elev + mountainBoost;
        elevBuf[idx] = finalElev;

        let r = 0;
        let g = 0;
        let b = 0;
        let rough = 220;

        // Polar ice threshold
        const iceThresh = 0.84 + nCoast * 0.08;
        const isPolarIce = latNorm > iceThresh;

        if (finalElev < 0) {
          // Ocean water: deep abyssal blue -> turquoise continental shelf
          const depth = THREE.MathUtils.clamp(-finalElev / 0.55, 0, 1);
          const shelf = THREE.MathUtils.clamp(1 + finalElev / 0.11, 0, 1);
          if (scarred) {
            r = THREE.MathUtils.lerp(10, 22, shelf) + (1 - depth) * 6;
            g = THREE.MathUtils.lerp(32, 74, shelf) + (1 - depth) * 14;
            b = THREE.MathUtils.lerp(66, 118, shelf) + (1 - depth) * 22;
          } else {
            r = THREE.MathUtils.lerp(8, 24, shelf) + (1 - depth) * 8;
            g = THREE.MathUtils.lerp(36, 108, shelf) + (1 - depth) * 18;
            b = THREE.MathUtils.lerp(84, 158, shelf) + (1 - depth) * 28;
          }
          // Subtle sea-ice pack at poles
          if (isPolarIce) {
            r = scarred ? 148 : 205;
            g = scarred ? 160 : 224;
            b = scarred ? 174 : 240;
            rough = 125;
          } else {
            rough = Math.round(52 + shelf * 18); // glossy ocean water specular glint
          }
        } else {
          // Continents & islands
          if (isPolarIce || finalElev > 0.74) {
            // Polar caps & snow-capped peaks
            r = scarred ? 162 : 216;
            g = scarred ? 166 : 226;
            b = scarred ? 172 : 236;
            rough = 140;
          } else if (finalElev > 0.46) {
            // Mountain ranges
            const tM = (finalElev - 0.46) / 0.28;
            r = THREE.MathUtils.lerp(86, 134, tM);
            g = THREE.MathUtils.lerp(80, 126, tM);
            b = THREE.MathUtils.lerp(72, 118, tM);
            rough = 238;
          } else {
            // Terrestrial biomes by latitude & moisture
            const aridBand =
              Math.exp(-Math.pow((latNorm - 0.26) / 0.14, 2)) * (1 - nMoist * 0.85);
            const lush = THREE.MathUtils.clamp(nMoist * 1.15 - aridBand * 0.9, 0, 1);

            // Forest green vs savanna/desert tan
            let lr = THREE.MathUtils.lerp(156, 42, lush);
            let lg = THREE.MathUtils.lerp(132, 96, lush);
            let lb = THREE.MathUtils.lerp(90, 48, lush);

            // Equatorial rainforest deepening
            if (latNorm < 0.22 && lush > 0.45) {
              lr *= 0.78;
              lg *= 0.88;
              lb *= 0.78;
            }
            // Boreal cooling
            if (latNorm > 0.56) {
              const tB = (latNorm - 0.56) / 0.28;
              lr = THREE.MathUtils.lerp(lr, 78, tB);
              lg = THREE.MathUtils.lerp(lg, 92, tB);
              lb = THREE.MathUtils.lerp(lb, 74, tB);
            }
            if (scarred) {
              // Sooty post-meteor apocalypse tint while preserving clear continent color contrast
              lr = lr * 0.76 + 18;
              lg = lg * 0.66 + 14;
              lb = lb * 0.64 + 12;
            }
            r = lr;
            g = lg;
            b = lb;
            rough = Math.round(212 + (1 - lush) * 28);
          }
        }

        aDst[pIdx] = THREE.MathUtils.clamp(Math.round(r), 0, 255);
        aDst[pIdx + 1] = THREE.MathUtils.clamp(Math.round(g), 0, 255);
        aDst[pIdx + 2] = THREE.MathUtils.clamp(Math.round(b), 0, 255);
        aDst[pIdx + 3] = 255;

        rDst[pIdx] = rough;
        rDst[pIdx + 1] = rough;
        rDst[pIdx + 2] = rough;
        rDst[pIdx + 3] = 255;
      }
    }

    actx.putImageData(albedoImg, 0, 0);
    rctx.putImageData(roughImg, 0, 0);

    // 2. Normal Map from continental relief heightfield (oceans flat, land/mountains raised)
    const normCanvas = document.createElement('canvas');
    normCanvas.width = w;
    normCanvas.height = h;
    const nctx = normCanvas.getContext('2d')!;
    const normImg = nctx.createImageData(w, h);
    const nDst = normImg.data;
    const hSample = (sx: number, sy: number): number => {
      const wx = ((sx % w) + w) % w;
      const wy = THREE.MathUtils.clamp(sy, 0, h - 1);
      return Math.max(0, elevBuf[wy * w + wx]);
    };
    const strength = 4.5;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tl = hSample(x - 1, y - 1);
        const t = hSample(x, y - 1);
        const tr = hSample(x + 1, y - 1);
        const l = hSample(x - 1, y);
        const r = hSample(x + 1, y);
        const bl = hSample(x - 1, y + 1);
        const b = hSample(x, y + 1);
        const br = hSample(x + 1, y + 1);
        const dX = tr + 2 * r + br - (tl + 2 * l + bl);
        const dY = bl + 2 * b + br - (tl + 2 * t + tr);
        let nx = -dX * strength;
        let ny = -dY * strength;
        let nz = 1.0;
        const inv = 1 / Math.hypot(nx, ny, nz);
        nx *= inv;
        ny *= inv;
        nz *= inv;
        const pIdx = (y * w + x) * 4;
        nDst[pIdx] = Math.round((nx * 0.5 + 0.5) * 255);
        nDst[pIdx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        nDst[pIdx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        nDst[pIdx + 3] = 255;
      }
    }
    nctx.putImageData(normImg, 0, 0);

    // 3. Emissive Map: city lights clustered on continents (3059) vs meteor scars (3062)
    const ec = document.createElement('canvas');
    ec.width = w;
    ec.height = h;
    const ectx = ec.getContext('2d')!;
    ectx.fillStyle = '#000000';
    ectx.fillRect(0, 0, w, h);

    if (!scarred) {
      let placed = 0;
      let attempts = 0;
      while (placed < 1100 && attempts < 14000) {
        attempts++;
        const lx = Math.floor(Math.random() * w);
        const ly = Math.floor(h * 0.15 + Math.random() * h * 0.7);
        const ev = elevBuf[ly * w + lx];
        if (ev > 0.005 && ev < 0.42) {
          placed++;
          const coastal = ev < 0.14;
          ectx.fillStyle =
            placed % 6 === 0
              ? 'rgba(255, 224, 150, 0.92)'
              : coastal
                ? 'rgba(251, 172, 72, 0.72)'
                : 'rgba(245, 130, 50, 0.48)';
          ectx.fillRect(lx, ly, coastal ? 2 : 1.5, coastal ? 2 : 1.5);
        }
      }
    } else {
      const scars = [
        [260, 175],
        [520, 210],
        [710, 185],
        [295, 305],
        [565, 290],
        [835, 330],
      ];
      scars.forEach(([sx, sy]) => {
        const rg = ectx.createRadialGradient(sx, sy, 2, sx, sy, 28);
        rg.addColorStop(0, 'rgba(255, 115, 42, 0.95)');
        rg.addColorStop(0.42, 'rgba(185, 28, 28, 0.65)');
        rg.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ectx.fillStyle = rg;
        ectx.beginPath();
        ectx.arc(sx, sy, 28, 0, Math.PI * 2);
        ectx.fill();

        // Scorch char onto albedo around meteor craters
        const cg = actx.createRadialGradient(sx, sy, 2, sx, sy, 32);
        cg.addColorStop(0, 'rgba(18, 10, 8, 0.85)');
        cg.addColorStop(1, 'rgba(18, 10, 8, 0)');
        actx.fillStyle = cg;
        actx.beginPath();
        actx.arc(sx, sy, 32, 0, Math.PI * 2);
        actx.fill();
      });
    }

    // 4. Procedural swirling atmospheric cloud cover (semi-transparent so continents & oceans shine through)
    const cw = 512;
    const ch = 256;
    const cc = document.createElement('canvas');
    cc.width = cw;
    cc.height = ch;
    const cctx = cc.getContext('2d')!;
    const cloudImg = cctx.createImageData(cw, ch);
    const cDst = cloudImg.data;
    for (let y = 0; y < ch; y++) {
      const v = y / ch;
      for (let x = 0; x < cw; x++) {
        const u = x / cw;
        const warp = (fbm(u, v, 6, 3, 21.4) - 0.5) * 0.14;
        const cn = fbm(u + warp, v + warp * 0.6, 12, 4, 31.7);
        const alpha = THREE.MathUtils.clamp((cn - 0.51) * 3.1, 0, 1);
        const pIdx = (y * cw + x) * 4;
        const shade = scarred ? 165 : 244;
        cDst[pIdx] = shade;
        cDst[pIdx + 1] = scarred ? 158 : 248;
        cDst[pIdx + 2] = scarred ? 160 : 255;
        cDst[pIdx + 3] = Math.round(alpha * (scarred ? 165 : 195));
      }
    }
    cctx.putImageData(cloudImg, 0, 0);

    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy() || 1);
    const albedo = new THREE.CanvasTexture(albedoCanvas);
    albedo.colorSpace = THREE.SRGBColorSpace;
    albedo.anisotropy = maxAniso;
    const roughness = new THREE.CanvasTexture(roughCanvas);
    roughness.colorSpace = THREE.NoColorSpace;
    roughness.anisotropy = maxAniso;
    const normal = new THREE.CanvasTexture(normCanvas);
    normal.colorSpace = THREE.NoColorSpace;
    normal.anisotropy = maxAniso;
    const emissive = new THREE.CanvasTexture(ec);
    emissive.colorSpace = THREE.SRGBColorSpace;
    const clouds = new THREE.CanvasTexture(cc);
    clouds.colorSpace = THREE.SRGBColorSpace;
    this.disposables.push(albedo, roughness, normal, emissive, clouds);
    return { albedo, roughness, normal, emissive, clouds };
  }

  private createStarfield(count = 1600): THREE.Points {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 135 + Math.random() * 80;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xdbeafe,
      size: 0.42,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    this.disposables.push(geo, mat);
    return new THREE.Points(geo, mat);
  }

  private createAtmosphereShell(radius: number, tintHex: number): THREE.Mesh {
    const geo = new THREE.SphereGeometry(radius, 48, 36);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(tintHex) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vViewPos = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        void main() {
          vec3 viewDir = normalize(vViewPos);
          float rim = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 3.2);
          gl_FragColor = vec4(uColor, rim * 0.72);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    this.disposables.push(geo, mat);
    return new THREE.Mesh(geo, mat);
  }

  // =========================================================================
  // SCENE 1: THE METEOR FALL (3059)
  // =========================================================================
  private buildScene1MeteorFall(): void {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010205);
    scene.add(this.createStarfield(1800));

    const sun = new THREE.DirectionalLight(0xfff4e2, 3.1);
    sun.position.set(28, 12, 24);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x3b82f6, 0x0b1628, 0.55));
    scene.add(new THREE.AmbientLight(0x1e293b, 0.35));

    this.earthGroup1 = new THREE.Group();
    const { albedo, roughness, normal, emissive, clouds } = this.createEarthTexturePair(false);

    const earthGeo = new THREE.SphereGeometry(12, 64, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: albedo,
      roughnessMap: roughness,
      roughness: 1.0,
      normalMap: normal,
      normalScale: new THREE.Vector2(0.85, 0.85),
      emissiveMap: emissive,
      emissive: new THREE.Color(0xffb86c),
      emissiveIntensity: 0.78,
      metalness: 0.06,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.y = -0.35;

    const cloudGeo = new THREE.SphereGeometry(12.16, 48, 36);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: clouds,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      roughness: 0.92,
    });
    this.earthClouds1 = new THREE.Mesh(cloudGeo, cloudMat);

    const atmo = this.createAtmosphereShell(12.62, 0x38bdf8);
    this.earthGroup1.add(earthMesh, this.earthClouds1, atmo);
    scene.add(this.earthGroup1);
    this.disposables.push(earthGeo, earthMat, cloudGeo, cloudMat);

    // 5 Meteors entering atmosphere & impacting distinct geographic points
    const impactDirs = [
      new THREE.Vector3(0.45, 0.42, 0.78).normalize(),
      new THREE.Vector3(-0.32, 0.25, 0.91).normalize(),
      new THREE.Vector3(0.7, -0.18, 0.68).normalize(),
      new THREE.Vector3(-0.55, 0.55, 0.62).normalize(),
      new THREE.Vector3(0.15, -0.45, 0.88).normalize(),
    ];
    const startTimes = [3.6, 5.4, 7.2, 8.9, 10.6];
    const impactTimes = [6.3, 8.1, 9.9, 11.7, 13.3];

    impactDirs.forEach((dir, idx) => {
      const mGroup = new THREE.Group();
      const rockGeo = new THREE.IcosahedronGeometry(0.32, 1);
      const posAttr = rockGeo.attributes.position as THREE.BufferAttribute;
      for (let v = 0; v < posAttr.count; v++) {
        const s = 0.85 + Math.sin(v * 2.1 + idx) * 0.24;
        posAttr.setXYZ(v, posAttr.getX(v) * s, posAttr.getY(v) * s, posAttr.getZ(v) * s);
      }
      rockGeo.computeVertexNormals();
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x261a16,
        emissive: 0x9a3412,
        emissiveIntensity: 1.4,
        roughness: 0.8,
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);

      const comaGeo = new THREE.SphereGeometry(0.55, 14, 12);
      const comaMat = new THREE.MeshBasicMaterial({
        color: 0xff6b1a,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const coma = new THREE.Mesh(comaGeo, comaMat);
      const mLight = new THREE.PointLight(0xff5a14, 4.5, 14);
      mGroup.add(rock, coma, mLight);
      mGroup.visible = false;
      scene.add(mGroup);

      // Trail wake points
      const trailCount = 26;
      const trailPositions = new Float32Array(trailCount * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const trailMat = new THREE.PointsMaterial({
        map: this.textures.fireSpriteMap,
        size: 0.95,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const trailPts = new THREE.Points(trailGeo, trailMat);
      trailPts.visible = false;
      scene.add(trailPts);

      // Impact shockwave ring
      const impactPos = dir.clone().multiplyScalar(12.06);
      const ringGeo = new THREE.RingGeometry(0.25, 0.55, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff8a3d,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const shockRing = new THREE.Mesh(ringGeo, ringMat);
      shockRing.position.copy(impactPos);
      shockRing.lookAt(impactPos.clone().multiplyScalar(2));
      shockRing.visible = false;
      this.earthGroup1.add(shockRing);

      // Fireball sphere
      const expGeo = new THREE.SphereGeometry(0.65, 16, 12);
      const expMat = new THREE.MeshBasicMaterial({
        color: 0xffb347,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const explosionSphere = new THREE.Mesh(expGeo, expMat);
      explosionSphere.position.copy(impactPos);
      explosionSphere.visible = false;
      this.earthGroup1.add(explosionSphere);

      // Persistent glowing scar crater
      const scarGeo = new THREE.CircleGeometry(0.9, 20);
      const scarMat = new THREE.MeshBasicMaterial({
        map: this.textures.fireSpriteMap,
        color: 0xef4444,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const scarMesh = new THREE.Mesh(scarGeo, scarMat);
      scarMesh.position.copy(dir.clone().multiplyScalar(12.04));
      scarMesh.lookAt(dir.clone().multiplyScalar(24));
      scarMesh.visible = false;
      this.earthGroup1.add(scarMesh);

      // Smoke plume cloud
      const smkCount = 18;
      const smkArr = new Float32Array(smkCount * 3);
      for (let s = 0; s < smkCount; s++) {
        const spread = 0.35 + s * 0.04;
        const p = impactPos
          .clone()
          .addScaledVector(dir, 0.15 + s * 0.09)
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * spread,
              (Math.random() - 0.5) * spread,
              (Math.random() - 0.5) * spread
            )
          );
        smkArr[s * 3] = p.x;
        smkArr[s * 3 + 1] = p.y;
        smkArr[s * 3 + 2] = p.z;
      }
      const smkGeo = new THREE.BufferGeometry();
      smkGeo.setAttribute('position', new THREE.BufferAttribute(smkArr, 3));
      const smkMat = new THREE.PointsMaterial({
        map: this.textures.smokeSpriteMap,
        size: 1.65,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const smokeCloud = new THREE.Points(smkGeo, smkMat);
      smokeCloud.visible = false;
      this.earthGroup1.add(smokeCloud);

      const startPos = impactPos
        .clone()
        .addScaledVector(dir, 14)
        .add(new THREE.Vector3((idx % 2 === 0 ? 1 : -1) * 9, 4.5 - idx * 1.4, 4));

      this.meteors.push({
        group: mGroup,
        trailPts,
        trailPositions,
        startPos,
        impactPos,
        startTime: startTimes[idx],
        impactTime: impactTimes[idx],
        impacted: false,
        entryPlayed: false,
        shockRing,
        explosionSphere,
        scarMesh,
        smokeCloud,
      });

      this.disposables.push(
        rockGeo,
        rockMat,
        comaGeo,
        comaMat,
        trailGeo,
        trailMat,
        ringGeo,
        ringMat,
        expGeo,
        expMat,
        scarGeo,
        scarMat,
        smkGeo,
        smkMat
      );
    });

    this.scenes.push(scene);
  }

  // =========================================================================
  // SCENE 2: THE COLLAPSE (3062) — Ruined Megacity + Fused Machinery
  // =========================================================================
  private buildScene2CollapseRuins(): void {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050609);
    scene.fog = new THREE.FogExp2(0x07090e, 0.026);
    scene.environment = this.envTex;
    scene.environmentIntensity = 0.42;

    const hemi = new THREE.HemisphereLight(0x2e3b52, 0x160a0d, 0.55);
    const moon = new THREE.DirectionalLight(0x7c93b8, 0.85);
    moon.position.set(22, 38, 16);
    moon.castShadow = !this.isSoftwareGl;
    scene.add(hemi, moon);

    const roadMat = new THREE.MeshStandardMaterial({
      map: this.textures.asphaltMap,
      normalMap: this.textures.asphaltNormal,
      normalScale: new THREE.Vector2(1.3, 1.3),
      roughnessMap: this.textures.asphaltRoughness,
      roughness: 0.94,
      metalness: 0.02,
      envMapIntensity: 0.32,
    });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 160), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -25);
    road.receiveShadow = true;
    scene.add(road);

    const fireEmitters: FireEmitterDef[] = [];
    const sparkEmitters: SparkEmitterDef[] = [];
    const skyMats = createSkyscraperMaterials(this.textures);

    const buildings: [number, number, number, number, number, boolean, boolean][] = [
      [-26, 8, 18, 48, 20, true, true],
      [26, 4, 18, 52, 20, false, true],
      [-28, -32, 20, 62, 22, true, true],
      [28, -36, 20, 58, 22, true, false],
      [-16, -78, 24, 72, 20, true, true],
      [18, -82, 24, 78, 20, false, false],
      [0, -108, 30, 86, 22, true, true],
    ];
    buildings.forEach(([bx, bz, bw, bh, bd, inf, burn], idx) => {
      const grp = buildRealisticSkyscraper(skyMats, bw, bh, bd, idx + 12, inf, {
        burning: burn,
        worldX: bx,
        worldY: -0.1,
        worldZ: bz,
        facingSignX: bx < 0 ? 1 : -1,
        fireEmitters,
        scene,
        withLight: idx < 3,
      });
      grp.position.set(bx, -0.1, bz);
      scene.add(grp);
    });

    // Abandoned military vehicles & infected civilian wrecks
    scene.add(buildInfectedVehicle(this.textures, -5.8, 12, 0.35, true));
    scene.add(buildInfectedVehicle(this.textures, 6.4, -4, -0.45, true));
    scene.add(buildInfectedVehicle(this.textures, -7.2, -24, 0.18, false));

    // Wrecked military APC silhouette
    const apcHullMat = new THREE.MeshStandardMaterial({
      color: 0x1e242d,
      map: this.textures.metalPlateMap,
      normalMap: this.textures.metalNormal,
      metalness: 0.85,
      roughness: 0.44,
    });
    const wreckApc = new THREE.Group();
    const apcBody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.1, 6.8), apcHullMat);
    apcBody.position.y = 1.45;
    const apcTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.55, 10), apcHullMat);
    apcTurret.position.set(0, 2.75, 0.5);
    const apcBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 8), apcHullMat);
    apcBarrel.rotation.x = Math.PI / 2 - 0.18;
    apcBarrel.position.set(0, 2.85, 1.8);
    wreckApc.add(apcBody, apcTurret, apcBarrel);
    [-1.75, 1.75].forEach((wx) => {
      [-2.1, 0, 2.1].forEach((wz) => {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55, 0.55, 0.38, 12),
          new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.9 })
        );
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 0.55, wz);
        wreckApc.add(w);
      });
    });
    wreckApc.position.set(5.4, 0, 14);
    wreckApc.rotation.y = -0.35;
    wreckApc.rotation.z = 0.09;
    scene.add(wreckApc);

    // HERO SUBJECT: Industrial Machinery Fused with Alien Biomechanical Structures
    const machGroup = new THREE.Group();
    const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.1, 5.2), skyMats.concreteMat);
    basePlinth.position.y = 0.55;
    const turbineCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, 4.8, 16), skyMats.steelMat);
    turbineCyl.rotation.z = Math.PI / 2;
    turbineCyl.position.set(0, 2.55, 0);
    const gantryTower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 7.6, 1.4), skyMats.steelMat);
    gantryTower.position.set(-2.4, 3.8, -1.2);
    const pipeA = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 6.2, 10), apcHullMat);
    pipeA.position.set(2.1, 3.2, -0.6);
    pipeA.rotation.z = 0.18;

    // Fused biomechanical crimson muscle cords, rib struts, & pulsing spore sacs
    for (let t = 0; t < 5; t++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.6 + t * 1.1, 0.4, 1.8),
        new THREE.Vector3(-1.4 + t * 0.8, 2.6 + (t % 2) * 0.9, 0.6),
        new THREE.Vector3(-0.4 + t * 0.7, 4.2, -0.8),
        new THREE.Vector3(-2.2 + t * 0.9, 6.2, -1.3),
      ]);
      const tendril = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 18, 0.16 + (t % 2) * 0.08, 7, false),
        skyMats.fleshMat
      );
      machGroup.add(tendril);
    }

    const boneMat = new THREE.MeshStandardMaterial({
      map: this.textures.boneMap,
      normalMap: this.textures.boneNormal,
      roughness: 0.45,
      metalness: 0.25,
    });
    for (let r = 0; r < 6; r++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.14, 6, 12, Math.PI * 1.15), boneMat);
      rib.position.set(-1.5 + r * 0.62, 2.55, 0);
      rib.rotation.y = Math.PI / 2;
      rib.rotation.z = -0.3 + (r % 2) * 0.2;
      machGroup.add(rib);
    }

    for (let s = 0; s < 3; s++) {
      const sac = new THREE.Mesh(new THREE.IcosahedronGeometry(0.68, 2), skyMats.fleshMat);
      sac.position.set(-1.2 + s * 1.3, 3.2 + (s % 2) * 0.7, 1.15);
      this.fusedOrgans2.push(sac);
      machGroup.add(sac);
    }

    machGroup.add(basePlinth, turbineCyl, gantryTower, pipeA);
    machGroup.position.set(-1.2, 0, -6.5);
    machGroup.rotation.y = 0.28;
    scene.add(machGroup);

    // Red emergency lights + street fire
    [10, -6, -24, -46].forEach((lz, i) => {
      const redLight = new THREE.PointLight(0xef4444, 7.5, 24, 1.6);
      redLight.position.set(i % 2 === 0 ? -4.5 : 4.5, 4.8, lz);
      scene.add(redLight);
      this.emergencyLights2.push({ light: redLight, base: 7.5, speed: 4.5 + i * 1.7 });
    });

    fireEmitters.push({
      id: 'c2_car_fire',
      position: new THREE.Vector3(-5.8, 0.9, 12),
      directionOut: new THREE.Vector3(0, 1, 0),
      scale: 1.1,
      heatRadius: 3.5,
      intensity: 1.0,
      isStructural: false,
      smokeDensity: 1.1,
    });
    sparkEmitters.push({ position: new THREE.Vector3(-1.2, 3.5, -5.8), interval: 0.9, timer: 0.2 });

    this.fireSystem2 = new VolumetricFireSystem(scene, this.textures, fireEmitters, sparkEmitters, true);
    this.disposables.push(roadMat);
    this.scenes.push(scene);
  }

  // =========================================================================
  // SCENE 3: THE LABORATORY
  // =========================================================================
  private buildScene3Laboratory(): void {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020306);
    scene.fog = new THREE.FogExp2(0x030509, 0.052);
    scene.environment = this.envTex;
    scene.environmentIntensity = 0.42;

    scene.add(new THREE.HemisphereLight(0x1e293b, 0x090507, 0.32));

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e232b,
      map: this.textures.concreteMap,
      normalMap: this.textures.concreteNormal,
      roughness: 0.92,
      metalness: 0.03,
      envMapIntensity: 0.24,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x202630,
      map: this.textures.metalPlateMap,
      normalMap: this.textures.metalNormal,
      metalness: 0.55,
      roughness: 0.68,
      envMapIntensity: 0.42,
    });

    // Corridor & lab bay (width 9m, height 4.2m, length 26m)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 28), steelMat);
    floor.rotation.x = -Math.PI / 2;
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 28), wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4.2;
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 28), wallMat);
    wallL.position.set(-4.6, 2.1, 0);
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 28), wallMat);
    wallR.position.set(4.6, 2.1, 0);
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4.2, 0.5), wallMat);
    backWall.position.set(0, 2.1, -13.5);
    scene.add(floor, ceiling, wallL, wallR, backWall);

    // Observation glass partition separating lab console bay (z > -4.5) from containment chamber (z < -4.5)
    const dividerWallL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.2, 0.35), wallMat);
    dividerWallL.position.set(-3.4, 2.1, -4.6);
    const dividerWallR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.2, 0.35), wallMat);
    dividerWallR.position.set(3.4, 2.1, -4.6);
    const dividerLower = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.72, 0.35), wallMat);
    dividerLower.position.set(0, 0.36, -4.6);
    const dividerTop = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.66, 0.35), wallMat);
    dividerTop.position.set(0, 3.87, -4.6);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x8fb8cc,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.24 : 0.28,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
      depthWrite: false,
    });
    const obsGlass = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.82), glassMat);
    obsGlass.position.set(0, 2.13, -4.6);
    scene.add(dividerWallL, dividerWallR, dividerLower, dividerTop, obsGlass);

    // Flickering overhead fluorescent fixtures
    [5.5, 0.5, -2.8].forEach((lz, i) => {
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        emissive: 0x93c5fd,
        emissiveIntensity: 1.4,
      });
      const tube = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.24), bulbMat);
      tube.position.set(0, 4.05, lz);
      const pt = new THREE.PointLight(0x9ec5ff, 3.8, 12, 1.8);
      pt.position.set(0, 3.75, lz);
      scene.add(tube, pt);
      this.labFlickers.push({ light: pt, bulbMat, base: 3.8, phase: i * 2.7 });
    });

    // Damaged computer server racks along walls
    for (let r = 0; r < 4; r++) {
      const rack = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.6, 1.3), steelMat);
      body.position.y = 1.3;
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.08, 0.55),
        new THREE.MeshBasicMaterial({ color: r % 2 === 0 ? 0xef4444 : 0xf59e0b })
      );
      led.position.set(0.49, 1.85, 0);
      rack.add(body, led);
      rack.position.set(r % 2 === 0 ? -3.7 : 3.7, 0, 4.2 - r * 2.1);
      rack.rotation.y = r % 2 === 0 ? 0.08 : Math.PI - 0.14;
      if (r === 2) rack.rotation.z = 0.16; // damaged leaning rack
      scene.add(rack);
    }

    // Central Damaged Desk + HELIOS Monitor displaying exact text
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 1.15), steelMat);
    desk.position.set(-0.35, 0.45, -2.5);
    const monitorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.02, 0.12), steelMat);
    monitorFrame.position.set(-0.2, 1.48, -2.65);
    monitorFrame.rotation.y = 0.18;

    const monCanvas = document.createElement('canvas');
    monCanvas.width = 640;
    monCanvas.height = 360;
    this.labMonitorCtx = monCanvas.getContext('2d')!;
    this.labMonitorTex = new THREE.CanvasTexture(monCanvas);
    this.labMonitorTex.colorSpace = THREE.SRGBColorSpace;
    const screenMat = new THREE.MeshBasicMaterial({ map: this.labMonitorTex });
    const screenPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.88), screenMat);
    screenPlane.position.set(0, 0, 0.065);
    monitorFrame.add(screenPlane);

    const monGlow = new THREE.PointLight(0xef4444, 2.8, 6);
    monGlow.position.set(-0.2, 1.5, -2.1);
    scene.add(desk, monitorFrame, monGlow);

    // Containment Chamber Red Strobe Light + Rim Fill + Terrifying Silhouette Behind Glass
    this.labContainmentLight = new THREE.PointLight(0xdc2626, 0.1, 16, 1.5);
    this.labContainmentLight.position.set(0, 3.2, -9.2);
    this.labContainmentFill = new THREE.PointLight(0x991b1b, 0.05, 11, 1.6);
    this.labContainmentFill.position.set(0, 2.4, -5.9);
    scene.add(this.labContainmentLight, this.labContainmentFill);

    this.labSilhouette = buildEnemyModel('titan', this.textures);
    this.labSilhouette.group.scale.setScalar(0.82);
    this.labSilhouette.group.position.set(-3.8, 0, -7.8);
    this.labSilhouette.group.rotation.y = Math.PI / 2 - 0.22;
    scene.add(this.labSilhouette.group);
    this.labSilhouetteTentacles = createTentaclePhysicsState(this.labSilhouette);
    this.labSilhouetteNeck = createTitanforgedNeckState();

    this.disposables.push(wallMat, steelMat, glassMat, this.labMonitorTex, screenMat);
    this.scenes.push(scene);
  }

  private redrawLabMonitor(t: number): void {
    const ctx = this.labMonitorCtx;
    ctx.fillStyle = '#04060a';
    ctx.fillRect(0, 0, 640, 360);

    // Scanlines
    ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
    for (let y = 0; y < 360; y += 5) {
      ctx.fillRect(0, y, 640, 2);
    }
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 620, 340);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('HELIOS NETWORK: COMPROMISED', 34, 78);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('UNKNOWN SIGNAL DETECTED', 34, 134);

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('ORIGIN: DEEP SPACE', 34, 184);

    // Live carrier waveform
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 34; x < 606; x += 6) {
      const y = 278 + Math.sin(x * 0.045 + t * 9) * 24 + Math.cos(x * 0.13 - t * 5) * 11;
      if (x === 34) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    this.labMonitorTex.needsUpdate = true;
  }

  // =========================================================================
  // SCENE 4: THE HELIOS SIGNAL (Orbiting Satellites + Deep Space Beam)
  // =========================================================================
  private buildScene4HeliosSignal(): void {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010205);
    scene.environment = this.envTex;
    scene.add(this.createStarfield(1800));

    const sun = new THREE.DirectionalLight(0xfff4e0, 2.8);
    sun.position.set(24, 15, 18);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x3b82f6, 0x160a0d, 0.5));
    scene.add(new THREE.AmbientLight(0x1a263b, 0.35));

    // Scarred Earth below
    this.earthGroup4 = new THREE.Group();
    const { albedo, roughness, normal, emissive, clouds } = this.createEarthTexturePair(true);
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(18, 56, 42),
      new THREE.MeshStandardMaterial({
        map: albedo,
        roughnessMap: roughness,
        roughness: 1.0,
        normalMap: normal,
        normalScale: new THREE.Vector2(0.85, 0.85),
        emissiveMap: emissive,
        emissive: new THREE.Color(0xff5522),
        emissiveIntensity: 1.15,
        metalness: 0.06,
      })
    );
    earth.rotation.x = 0.22;
    earth.rotation.y = -0.35;
    const cloudLayer = new THREE.Mesh(
      new THREE.SphereGeometry(18.18, 40, 30),
      new THREE.MeshStandardMaterial({
        map: clouds,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    const atmo = this.createAtmosphereShell(18.65, 0x7f1d1d);
    this.earthGroup4.add(earth, cloudLayer, atmo);
    this.earthGroup4.position.set(0, -21, -8);
    scene.add(this.earthGroup4);

    const buildSatellite = (isHero: boolean): { root: THREE.Group; dishPivot: THREE.Group } => {
      const sat = new THREE.Group();
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xb48a2d,
        metalness: 0.9,
        roughness: 0.25,
      });
      const darkMetal = new THREE.MeshStandardMaterial({
        color: 0x222833,
        metalness: 0.85,
        roughness: 0.35,
      });
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x0e1d36,
        metalness: 0.7,
        roughness: 0.2,
      });

      const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.7, 8), goldMat);
      bus.rotation.z = Math.PI / 2;
      sat.add(bus);

      [-1, 1].forEach((side) => {
        const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 6), darkMetal);
        boom.position.set(0, 0, side * 2.2);
        boom.rotation.x = Math.PI / 2;
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 3.3), panelMat);
        wing.position.set(0, 0, side * 2.5);
        sat.add(boom, wing);
      });

      const dishPivot = new THREE.Group();
      dishPivot.position.set(0.9, 0.2, 0);
      const dish = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 0.45, 20, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0xcbd5e1,
          metalness: 0.78,
          roughness: 0.26,
          side: THREE.DoubleSide,
        })
      );
      dish.rotation.z = Math.PI / 2;
      dish.position.x = 0.2;
      const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.9, 8), darkMetal);
      feed.rotation.z = Math.PI / 2;
      feed.position.x = 0.55;
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: isHero ? 0xef4444 : 0xf59e0b })
      );
      beacon.position.set(0.95, 0, 0);
      dishPivot.add(dish, feed, beacon);
      sat.add(dishPivot);

      return { root: sat, dishPivot };
    };

    const hero = buildSatellite(true);
    this.heroSatellite = hero.root;
    this.heroDishPivot = hero.dishPivot;
    this.heroSatellite.position.set(0, 1.2, 0);
    // Initially pointed downward toward Earth
    this.heroDishPivot.rotation.z = -1.15;
    scene.add(this.heroSatellite);

    // Transmission beam + expanding wave rings attached to hero dish
    const beamGeo = new THREE.ConeGeometry(2.6, 26, 20, 1, true);
    beamGeo.translate(0, 13, 0);
    beamGeo.rotateZ(-Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.signalBeam = new THREE.Mesh(beamGeo, beamMat);
    this.signalBeam.position.set(0.95, 0, 0);
    this.heroDishPivot.add(this.signalBeam);

    for (let r = 0; r < 4; r++) {
      const rGeo = new THREE.RingGeometry(0.45, 0.56, 28);
      rGeo.rotateY(Math.PI / 2);
      const rMat = new THREE.MeshBasicMaterial({
        color: 0xfca5a5,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.position.set(1.0, 0, 0);
      this.heroDishPivot.add(rMesh);
      this.signalRings.push(rMesh);
      this.disposables.push(rGeo, rMat);
    }

    const sat2 = buildSatellite(false);
    sat2.root.position.set(-8.5, 3.2, -9.5);
    sat2.root.scale.setScalar(0.75);
    scene.add(sat2.root);
    this.secondarySats.push(sat2.root);

    const sat3 = buildSatellite(false);
    sat3.root.position.set(9.2, -1.8, -12.0);
    sat3.root.scale.setScalar(0.68);
    scene.add(sat3.root);
    this.secondarySats.push(sat3.root);

    this.disposables.push(beamGeo, beamMat);
    this.scenes.push(scene);
  }

  // =========================================================================
  // SCENE 5: THE PLAYER — Damaged Military Transport Interior
  // =========================================================================
  private buildScene5DamagedAPC(): void {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030406);
    scene.fog = new THREE.FogExp2(0x040508, 0.06);
    scene.environment = this.envTex;
    scene.environmentIntensity = 0.4;

    const apcHullMat = new THREE.MeshStandardMaterial({
      color: 0x222730,
      map: this.textures.metalPlateMap,
      normalMap: this.textures.metalNormal,
      metalness: 0.72,
      roughness: 0.52,
      envMapIntensity: 0.48,
    });
    const interiorMat = new THREE.MeshStandardMaterial({
      color: 0x15181e,
      normalMap: this.textures.metalNormal,
      roughness: 0.84,
      metalness: 0.36,
      envMapIntensity: 0.38,
    });
    const hazardMat = new THREE.MeshStandardMaterial({
      map: this.textures.hazardStripeMap,
      normalMap: this.textures.metalNormal,
      metalness: 0.58,
      roughness: 0.46,
    });

    // Exact APC proportions matching Mission 1
    const floor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 8.2), interiorMat);
    floor.position.set(0, 0.12, 38);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 8.2), apcHullMat);
    roof.position.set(0, 3.0, 38);
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.9, 8.2), apcHullMat);
    wallL.position.set(-2.05, 1.5, 38);
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.9, 8.2), apcHullMat);
    wallR.position.set(2.05, 1.5, 38);
    const back = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.9, 0.3), apcHullMat);
    back.position.set(0, 1.5, 42.0);
    scene.add(floor, roof, wallL, wallR, back);

    [-1.45, 1.45].forEach((bx) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 6.2), interiorMat);
      bench.position.set(bx, 0.45, 38.2);
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 6.4, 8), apcHullMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(bx * 0.65, 2.68, 38.2);
      scene.add(bench, rail);
    });

    // Closed twin rear blast doors
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.6, 0.28), hazardMat);
    doorL.position.set(-0.95, 1.5, 33.9);
    const doorR = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.6, 0.28), hazardMat);
    doorR.position.set(0.95, 1.5, 33.9);
    scene.add(doorL, doorR);

    // Military Radio Transceiver Console on left wall
    const radioBox = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.58, 0.78), apcHullMat);
    radioBox.position.set(-1.72, 1.35, 35.6);
    this.apcRadioLedMat = new THREE.MeshBasicMaterial({ color: 0x16a34a });
    const radioLed = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.22), this.apcRadioLedMat);
    radioLed.rotation.y = Math.PI / 2;
    radioLed.position.set(-1.54, 1.42, 35.6);
    scene.add(radioBox, radioLed);

    // Emergency Strobe Dome + Light
    const strobeDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    strobeDome.position.set(0, 2.86, 37.5);
    this.apcStrobeLight = new THREE.PointLight(0xef4444, 5.5, 13, 1.8);
    this.apcStrobeLight.position.set(0, 2.6, 37.5);
    scene.add(strobeDome, this.apcStrobeLight);

    // Sparks from impact damage
    this.apcSparkLight = new THREE.PointLight(0xffaa44, 0, 9);
    this.apcSparkLight.position.set(1.3, 2.2, 35.8);
    scene.add(this.apcSparkLight);

    const spCount = 48;
    const spPos = new Float32Array(spCount * 3);
    this.apcSparkVel = new Float32Array(spCount * 3);
    for (let i = 0; i < spCount; i++) {
      spPos[i * 3] = 1.4;
      spPos[i * 3 + 1] = 2.4;
      spPos[i * 3 + 2] = 35.8;
    }
    const spGeo = new THREE.BufferGeometry();
    spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
    const spMat = new THREE.PointsMaterial({
      map: this.textures.emberSpriteMap,
      size: 0.24,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.apcSparks = new THREE.Points(spGeo, spMat);
    this.apcSparks.visible = false;
    scene.add(this.apcSparks);

    // Brief colossal dent/claw protrusion mesh when monster strikes roof/side
    this.apcClawShadow = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.8, roughness: 0.3 })
    );
    this.apcClawShadow.position.set(1.65, 2.95, 35.8);
    this.apcClawShadow.rotation.z = 0.85;
    this.apcClawShadow.visible = false;
    scene.add(this.apcClawShadow);

    this.disposables.push(apcHullMat, interiorMat, hazardMat, this.apcRadioLedMat, spGeo, spMat);
    this.scenes.push(scene);
  }

  private setDrone(mode: 'space' | 'ruins' | 'lab' | 'signal' | 'apc'): void {
    if (this.currentDroneMode === mode) return;
    this.currentDroneMode = mode;
    this.audio.setCutsceneDrone(mode);
  }

  private updateTimeline(dt: number): void {
    const t = this.elapsed;
    let fadeOpacity = 0;
    let titleCard: CutsceneOverlayState['titleCard'] = null;
    let statementLines: string[] | null = null;
    let radioBanner: CutsceneOverlayState['radioBanner'] = null;
    let damageFlash = 0;

    // -----------------------------------------------------------------------
    // ACT 1: THE METEOR FALL (0.0s -> 15.5s)
    // -----------------------------------------------------------------------
    if (t < 15.5) {
      this.activeSceneIdx = 0;
      this.setDrone('space');

      if (t < 2.2) {
        fadeOpacity = 1;
        titleCard = { heading: 'YEAR 3059' };
      } else if (t < 3.4) {
        fadeOpacity = 1 - (t - 2.2) / 1.2;
        titleCard = { heading: 'YEAR 3059' };
      } else if (t > 14.3) {
        fadeOpacity = (t - 14.3) / 1.2;
      }

      // Camera sweeps majestically in Earth orbit
      const camAng = (t - 2.0) * 0.055;
      this.camera.fov = 52;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(Math.sin(camAng) * 24 - 6, 4.5 - t * 0.14, Math.cos(camAng) * 24 + 5);
      _tmpLook.set(0, 0, 0);
      this.camera.lookAt(_tmpLook);

      this.earthGroup1.rotation.y = t * 0.035;
      this.earthClouds1.rotation.y = t * 0.014;

      // Update meteors & impacts
      for (const m of this.meteors) {
        if (t >= m.startTime && t < m.impactTime) {
          if (!m.entryPlayed) {
            m.entryPlayed = true;
            this.audio.playMeteorEntry();
          }
          const p = (t - m.startTime) / (m.impactTime - m.startTime);
          const eased = p * p * 0.65 + p * 0.35;
          m.group.visible = true;
          m.trailPts.visible = true;
          m.group.position.lerpVectors(m.startPos, m.impactPos, eased);
          m.group.rotation.x += dt * 4;
          m.group.rotation.y += dt * 3;

          // Update wake trail behind meteor
          _tmpV1.copy(m.startPos).sub(m.impactPos).normalize();
          const posAttr = m.trailPts.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < posAttr.count; i++) {
            const back = (i / posAttr.count) * 4.5;
            posAttr.setXYZ(
              i,
              m.group.position.x + _tmpV1.x * back + Math.sin(t * 25 + i) * 0.08,
              m.group.position.y + _tmpV1.y * back + Math.cos(t * 21 + i) * 0.08,
              m.group.position.z + _tmpV1.z * back
            );
          }
          posAttr.needsUpdate = true;
        } else if (t >= m.impactTime) {
          m.group.visible = false;
          m.trailPts.visible = false;
          if (!m.impacted) {
            m.impacted = true;
            this.audio.playMeteorImpact(0.95);
          }
          const age = t - m.impactTime;
          m.scarMesh.visible = true;
          (m.scarMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(0.92, age * 1.4);

          if (age < 2.2) {
            m.shockRing.visible = true;
            const ringScale = 1 + age * 4.2;
            m.shockRing.scale.setScalar(ringScale);
            (m.shockRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - age * 0.45);

            m.explosionSphere.visible = true;
            const expScale = 0.6 + age * 1.8;
            m.explosionSphere.scale.setScalar(expScale);
            (m.explosionSphere.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 - age * 0.7);
          } else {
            m.shockRing.visible = false;
            m.explosionSphere.visible = false;
          }

          m.smokeCloud.visible = true;
          m.smokeCloud.scale.setScalar(1 + Math.min(2.2, age * 0.55));
          (m.smokeCloud.material as THREE.PointsMaterial).opacity = Math.max(0.15, 0.65 - age * 0.12);
        }
      }
    }
    // -----------------------------------------------------------------------
    // ACT 2: THE COLLAPSE (15.5s -> 30.5s)
    // -----------------------------------------------------------------------
    else if (t < 30.5) {
      this.activeSceneIdx = 1;
      this.setDrone('ruins');
      const lt = t - 15.5;

      if (lt < 2.0) {
        fadeOpacity = 1;
        titleCard = { heading: 'THREE YEARS LATER', subheading: '3062 AD · NEW EDEN QUARANTINE SECTOR' };
      } else if (lt < 3.2) {
        fadeOpacity = 1 - (lt - 2.0) / 1.2;
        titleCard = { heading: 'THREE YEARS LATER', subheading: '3062 AD · NEW EDEN QUARANTINE SECTOR' };
      } else if (lt > 13.8) {
        fadeOpacity = (lt - 13.8) / 1.2;
      }

      this.camera.fov = 58;
      this.camera.updateProjectionMatrix();
      // Low-angle cinematic push down the ruined street toward fused machinery & burning skyline
      this.camera.position.set(
        -2.2 + Math.sin(lt * 0.25) * 1.2,
        2.1 + lt * 0.14,
        20 - lt * 1.55
      );
      _tmpLook.set(-0.5, 3.2 + lt * 0.18, -12 - lt * 1.1);
      this.camera.lookAt(_tmpLook);

      this.emergencyLights2.forEach((el, i) => {
        const pulse = Math.sin(t * el.speed + i * 1.9);
        el.light.intensity = el.base * (pulse > 0.7 ? 0.22 : 0.9 + pulse * 0.15);
      });
      this.fusedOrgans2.forEach((sac, i) => {
        const b = 1 + Math.sin(t * 4.2 + i * 1.5) * 0.14;
        sac.scale.set(b, 1 + Math.cos(t * 4.2 + i) * 0.1, b);
      });
      this.fireSystem2.update(dt, t, this.camera.position);
    }
    // -----------------------------------------------------------------------
    // ACT 3: THE LABORATORY (30.5s -> 44.5s)
    // -----------------------------------------------------------------------
    else if (t < 44.5) {
      this.activeSceneIdx = 2;
      this.setDrone('lab');
      const lt = t - 30.5;

      if (lt < 1.1) fadeOpacity = 1 - lt / 1.1;
      else if (lt > 12.8) fadeOpacity = (lt - 12.8) / 1.2;

      this.redrawLabMonitor(t);

      // Flickering fluorescent lights
      let anyFlicker = false;
      this.labFlickers.forEach((fl) => {
        const n = Math.sin(t * 19 + fl.phase) * Math.cos(t * 7.3 + fl.phase);
        const on = n > -0.32 ? 1.0 : 0.12;
        fl.light.intensity = fl.base * on;
        fl.bulbMat.emissiveIntensity = on > 0.5 ? 1.4 : 0.15;
        if (on < 0.2) anyFlicker = true;
      });
      if (anyFlicker && t - this.lastLabFlickerAudio > 1.8) {
        this.lastLabFlickerAudio = t;
        this.audio.playLabFlicker();
      }

      // Slow push-in toward HELIOS monitor, then slight pan up to glass silhouette
      const focusShift = THREE.MathUtils.smoothstep(lt, 6.5, 10.5);
      this.camera.fov = THREE.MathUtils.lerp(56, 46, THREE.MathUtils.smoothstep(lt, 2.0, 7.5));
      this.camera.updateProjectionMatrix();
      this.camera.position.set(
        THREE.MathUtils.lerp(0.8, -0.05, THREE.MathUtils.smoothstep(lt, 0, 8.0)),
        THREE.MathUtils.lerp(1.55, 1.72, focusShift),
        THREE.MathUtils.lerp(4.2, -0.5, THREE.MathUtils.smoothstep(lt, 0, 9.5))
      );
      _tmpLook.set(
        THREE.MathUtils.lerp(-0.2, 0.05, focusShift),
        THREE.MathUtils.lerp(1.48, 2.15, focusShift),
        THREE.MathUtils.lerp(-2.65, -7.2, focusShift)
      );
      this.camera.lookAt(_tmpLook);

      // Terrifying silhouette stalking behind laboratory glass (lt = 7.0s -> 12.8s)
      if (lt >= 7.0 && lt <= 12.8) {
        if (!this.labStingerPlayed) {
          this.labStingerPlayed = true;
          this.audio.playSilhouetteStinger();
        }
        const passProg = Math.min(1, (lt - 7.0) / 5.4);
        const posX = THREE.MathUtils.lerp(-3.5, 3.7, passProg);
        const walkPhase = (lt - 7.0) * 4.8;
        const bodyYaw = Math.PI / 2 - 0.22 + Math.sin(walkPhase) * 0.055;

        // Heavy predatory stride bob, hip roll, and forward gait translation
        const strideBob = Math.abs(Math.sin(walkPhase)) * 0.13;
        this.labSilhouette.group.position.set(posX, strideBob, -7.6);
        this.labSilhouette.group.rotation.y = bodyYaw;
        this.labSilhouette.group.rotation.z = Math.sin(walkPhase) * 0.045;

        // Articulated reverse-joint leg walk cycle (thigh swing + knee lift on forward swing)
        this.labSilhouette.legRigs.forEach((leg) => {
          const s = Math.sin(walkPhase + leg.phaseOffset);
          const c = Math.cos(walkPhase + leg.phaseOffset);
          const lift = Math.max(0, c) * 0.44 + Math.max(0, -s) * 0.26;
          leg.hip.rotation.x = leg.baseHipX + s * 0.48;
          leg.knee.rotation.x = leg.baseKneeX + lift;
        });

        // Counter-swinging heavy biomechanical arms
        this.labSilhouette.armRigs.forEach((arm) => {
          const s = Math.sin(walkPhase + arm.phaseOffset);
          const c = Math.cos(walkPhase + arm.phaseOffset);
          arm.shoulder.rotation.x = arm.baseShoulderX - s * 0.34;
          arm.shoulder.rotation.z = Math.sin(walkPhase) * 0.05;
          arm.elbow.rotation.x = arm.baseElbowX - 0.16 - Math.max(0, -s) * 0.28 + c * 0.06;
        });

        if (this.labSilhouette.torsoPulse) {
          const br = 1 + Math.sin(t * 3.2) * 0.032;
          this.labSilhouette.torsoPulse.scale.set(br, 1, br);
          this.labSilhouette.torsoPulse.rotation.x = 0.08 + Math.cos(walkPhase * 2) * 0.03;
        }

        // Synced heavy footstep thuds as each foot plants
        const stepIdx = Math.floor(walkPhase / Math.PI);
        if (stepIdx !== this.lastSilhouetteStepIdx) {
          this.lastSilhouetteStepIdx = stepIdx;
          this.audio.playBossStomp(10, THREE.MathUtils.clamp(posX / 4, -0.85, 0.85));
        }

        // Blood-Worm neck tracks toward the observation window as it passes center
        const lookAtGlass = passProg > 0.25 && passProg < 0.82;
        _tmpV2.set(posX + 2.5, 2.2, -7.6);
        updateTitanforgedNeckAnimation(this.labSilhouette, this.labSilhouetteNeck, {
          dt,
          time: t,
          ownerPos: this.labSilhouette.group.position,
          ownerYaw: bodyYaw,
          targetPos: lookAtGlass ? this.camera.position : _tmpV2,
          lastKnownPos: this.camera.position,
          targetOccluded: false,
          aiState: lookAtGlass ? 'SEARCH' : 'PATROL',
          hollowExposed: false,
          bossPhase: 1,
        });

        const flash = Math.sin(lt * 22) > 0.15 ? 10.5 : 1.6;
        const envEnvelope = Math.sin(passProg * Math.PI);
        this.labContainmentLight.intensity = flash * envEnvelope;
        this.labContainmentFill.intensity = (1.1 + (flash > 5 ? 1.2 : 0)) * envEnvelope;

        updateMonsterTentacles(this.labSilhouette, this.labSilhouetteTentacles, {
          dt,
          time: t,
          enemyType: 'titan',
          aiState: 'PATROL',
          moveSpeed: 1.5,
          turnRate: 0,
          distToCam: 8,
        });
      } else {
        this.labContainmentLight.intensity = 0.05;
        this.labContainmentFill.intensity = 0.02;
      }
    }
    // -----------------------------------------------------------------------
    // ACT 4: THE HELIOS SIGNAL (44.5s -> 56.5s)
    // -----------------------------------------------------------------------
    else if (t < 56.5) {
      this.activeSceneIdx = 3;
      this.setDrone('signal');
      const lt = t - 44.5;

      if (lt < 1.1) fadeOpacity = 1 - lt / 1.1;
      else if (lt > 10.8) fadeOpacity = (lt - 10.8) / 1.2;

      this.camera.fov = 52;
      this.camera.updateProjectionMatrix();
      const orbitAng = lt * 0.09;
      this.camera.position.set(-4.5 + Math.sin(orbitAng) * 3.2, 2.3 - lt * 0.06, 6.2 - lt * 0.14);
      _tmpLook.set(0.5, 1.1, -0.5);
      this.camera.lookAt(_tmpLook);

      this.earthGroup4.rotation.y = t * 0.025;
      this.secondarySats.forEach((sat, idx) => {
        sat.position.x += dt * (idx === 0 ? 0.25 : -0.2);
        sat.rotation.y += dt * 0.08;
      });

      // Satellite rotates dish toward deep space (lt = 1.5 -> 5.5), then transmits!
      const rotAlpha = THREE.MathUtils.smoothstep(lt, 1.5, 5.2);
      this.heroDishPivot.rotation.z = THREE.MathUtils.lerp(-1.15, 0.38, rotAlpha);
      this.heroSatellite.rotation.y = THREE.MathUtils.lerp(0.2, -0.35, rotAlpha);

      const transmitting = lt > 4.6;
      const beamMat = this.signalBeam.material as THREE.MeshBasicMaterial;
      if (transmitting) {
        const pulse = 0.55 + 0.45 * Math.sin(lt * 10);
        beamMat.opacity = 0.26 * pulse;
        if (lt - this.lastSignalPulseAudio > 1.75) {
          this.lastSignalPulseAudio = lt;
          this.audio.playHeliosSignalPulse();
        }
        this.signalRings.forEach((ring, i) => {
          const cycle = ((lt - 4.6) * 1.1 + i * 0.25) % 1;
          ring.position.x = 1.1 + cycle * 18;
          ring.scale.setScalar(1 + cycle * 4.5);
          (ring.material as THREE.MeshBasicMaterial).opacity = (1 - cycle) * 0.8;
        });
      } else {
        beamMat.opacity = 0;
      }

      if (lt >= 2.8 && lt < 6.8) {
        statementLines = ['THE METEORS WERE NOT THE INVASION.'];
      } else if (lt >= 6.8 && lt < 11.4) {
        statementLines = ['THE METEORS WERE NOT THE INVASION.', 'THEY WERE THE BEGINNING.'];
      }
    }
    // -----------------------------------------------------------------------
    // ACT 5: THE PLAYER — Waking Inside Damaged Military Transport (56.5s -> 68.6s)
    // -----------------------------------------------------------------------
    else {
      this.activeSceneIdx = 4;
      this.setDrone('apc');
      const lt = t - 56.5;

      // Waking eye-blink fade-in from darkness
      if (lt < 1.8) {
        fadeOpacity = Math.max(0, 1 - lt / 1.8);
      } else if (lt > 11.1) {
        fadeOpacity = (lt - 11.1) / 1.0;
      }

      // Emergency alarm beeps every 1.4s
      if (lt > 0.8 && lt < 10.6 && lt - this.lastAlarmTime > 1.45) {
        this.lastAlarmTime = lt;
        this.audio.playAlarmBeep();
      }

      // Red emergency strobe
      const strobe = Math.sin(lt * 8.5) > 0 ? 6.0 : 1.0;
      this.apcStrobeLight.intensity = this.apcImpactTriggered ? (Math.sin(lt * 34) > 0 ? 2.5 : 0.2) : strobe;

      // First-person waking camera inside the APC (looking toward radio & rear doors)
      const wakeUp = THREE.MathUtils.smoothstep(lt, 0.8, 3.6);
      const lookToRadio = THREE.MathUtils.smoothstep(lt, 2.5, 4.8) * (1 - THREE.MathUtils.smoothstep(lt, 8.8, 10.2));
      this.camera.fov = 70;
      this.camera.updateProjectionMatrix();

      this.apcImpactShake = THREE.MathUtils.damp(this.apcImpactShake, 0, 7.5, dt);
      const sx = (Math.random() - 0.5) * this.apcImpactShake;
      const sy = (Math.random() - 0.5) * this.apcImpactShake;

      this.camera.position.set(
        THREE.MathUtils.lerp(-0.45, 0.0, wakeUp) + sx,
        THREE.MathUtils.lerp(0.82, 1.15, wakeUp) + sy,
        38.1
      );
      _tmpLook.set(
        THREE.MathUtils.lerp(0.2, -1.35, lookToRadio),
        THREE.MathUtils.lerp(0.95, 1.42, wakeUp),
        34.0
      );
      this.camera.lookAt(_tmpLook);
      this.camera.rotation.z += THREE.MathUtils.lerp(0.24, 0.02, wakeUp) + sx * 1.4;

      // Radio sequence
      if (lt >= 2.2 && lt < 4.1) {
        if (!this.radioCueFired.has(1)) {
          this.radioCueFired.add(1);
          this.audio.playRadioSquelch(false);
        }
        radioBanner = { speaker: 'COMMAND // ENCRYPTED', text: '"Unit 09, do you copy?"' };
      } else if (lt >= 4.1 && lt < 6.4) {
        if (!this.radioCueFired.has(2)) {
          this.radioCueFired.add(2);
          this.audio.playRadioStatic();
        }
        radioBanner = {
          speaker: 'COMMAND // ENCRYPTED',
          text: '"Your mission is to reach the underground HELIOS facility."',
        };
      } else if (lt >= 6.4 && lt < 8.1) {
        radioBanner = { speaker: 'COMMAND // ENCRYPTED', text: '"Find out what happened here."' };
      } else if (lt >= 8.1 && lt < 10.6) {
        if (!this.radioCueFired.has(3)) {
          this.radioCueFired.add(3);
          this.audio.playRadioStatic();
        }
        radioBanner = {
          speaker: 'COMMAND // ENCRYPTED',
          text: '"Whatever you do... stay away from the infected machinery."',
        };
      } else if (lt >= 10.6) {
        if (!this.apcImpactTriggered) {
          this.apcImpactTriggered = true;
          this.apcImpactShake = 0.24;
          this.apcRadioLedMat.color.setHex(0xef4444);
          this.apcClawShadow.visible = true;
          this.apcSparks.visible = true;
          this.audio.playVehicleImpact();
          this.audio.playRadioSquelch(true);
          const vel = this.apcSparkVel;
          for (let i = 0; i < vel.length / 3; i++) {
            vel[i * 3] = -1.5 - Math.random() * 3.5;
            vel[i * 3 + 1] = -0.5 - Math.random() * 3.0;
            vel[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
          }
        }
        damageFlash = Math.max(0, 0.72 - (lt - 10.6) * 0.55);
        this.apcSparkLight.intensity = Math.max(0, 7 - (lt - 10.6) * 4.5);
        radioBanner = {
          speaker: 'RADIO DISCONNECTED',
          text: '[CARRIER LOST — HULL BREACH IMPACT DETECTED]',
          disconnected: true,
        };

        // Update interior sparks
        const spAttr = this.apcSparks.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < spAttr.count; i++) {
          const px = spAttr.getX(i) + this.apcSparkVel[i * 3] * dt;
          const py = Math.max(0.25, spAttr.getY(i) + this.apcSparkVel[i * 3 + 1] * dt);
          const pz = spAttr.getZ(i) + this.apcSparkVel[i * 3 + 2] * dt;
          this.apcSparkVel[i * 3 + 1] -= 9.5 * dt;
          spAttr.setXYZ(i, px, py, pz);
        }
        spAttr.needsUpdate = true;
      }
    }

    this.onOverlayUpdate({
      elapsed: t,
      totalDuration: CUTSCENE_TOTAL_DURATION,
      sceneIndex: this.activeSceneIdx + 1,
      fadeOpacity: THREE.MathUtils.clamp(fadeOpacity, 0, 1),
      titleCard,
      statementLines,
      radioBanner,
      damageFlash,
    });
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private loop = (): void => {
    if (this.disposed) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.elapsed += dt;
    this.updateTimeline(dt);

    if (this.elapsed >= CUTSCENE_TOTAL_DURATION && !this.completed) {
      this.completed = true;
      this.audio.setCutsceneDrone('normal');
      this.onComplete();
      return;
    }

    const activeScene = this.scenes[this.activeSceneIdx] ?? this.scenes[0];
    if (!this.contextLost && activeScene) {
      if (!this.isSoftwareGl && this.composer) {
        const renderPass = this.composer.passes[0] as RenderPass;
        renderPass.scene = activeScene;
        renderPass.camera = this.camera;
        this.composer.render();
      } else {
        this.renderer.render(activeScene, this.camera);
      }
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.loop);
    } else {
      this.frameId = requestAnimationFrame(this.loop);
    }
  };

  private onResize = () => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) this.composer.setSize(w, h);
    if (this.bloomPass) this.bloomPass.resolution.set(w, h);
  };

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
  };

  private onContextRestored = () => {
    this.contextLost = false;
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored);

    this.fireSystem2?.dispose();
    this.textures.dispose();
    this.envTex.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.composer?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
