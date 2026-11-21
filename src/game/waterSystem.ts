import * as THREE from 'three';

export const MAX_WATER_RIPPLES = 16;

export interface WaterTrenchRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  depthOffset: number; // Extra depth below y=0 (e.g., 1.15m for sunken sump pits)
}

export interface WaterShoreSlope {
  axis: 'x' | 'z';
  edgeCoord: number;
  slopeWidth: number;
  direction: 1 | -1; // +1 means depth goes to 0 moving toward +axis; -1 means toward -axis
  minSpan?: number;
  maxSpan?: number;
}

export interface WaterDoorwayRamp {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  shallowEdgeZ?: number;
  shallowEdgeX?: number;
  rampLen: number;
}

export interface WaterObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WaterObstacleCylinder {
  x: number;
  z: number;
  radius: number;
}

export interface WaterDepthProfile {
  baseDepth: number;
  maxBedDepth: number;
  trenches?: WaterTrenchRect[];
  shoreSlopes?: WaterShoreSlope[];
  doorwayRamps?: WaterDoorwayRamp[];
  obstacleBoxes?: WaterObstacleBox[];
  obstacleCylinders?: WaterObstacleCylinder[];
  shallowCenterGradient?: boolean; // Useful for pools with shallow steps at +Z end
  shallowStepMinZ?: number;
  shallowStepMaxZ?: number;
}

export interface WaterUniformSet {
  uTime: { value: number };
  uWaterLevel: { value: number };
  uInitialLevel: { value: number };
  uWindVec: { value: THREE.Vector2 };
  uRainIntensity: { value: number };
  uWaveScale: { value: number };
  uShallowColor: { value: THREE.Color };
  uDeepColor: { value: THREE.Color };
  uFoamColor: { value: THREE.Color };
  tWaterNormal: { value: THREE.Texture };
  tDepthMap: { value: THREE.DataTexture };
  uDepthBounds: { value: THREE.Vector4 };
  uMaxBedDepth: { value: number };
  uReflectMap: { value: THREE.Texture | null };
  uHasPlanarReflect: { value: number };
  uReflectMatrix: { value: THREE.Matrix4 };
  uRipples: { value: THREE.Vector4[] };
}

export interface WaterBodyRuntime {
  id: string;
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  depthMap: THREE.DataTexture;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  initialY: number;
  currentY: number;
  isIndoor: boolean;
  splashTint: number;
  uniforms: WaterUniformSet;
}

export interface CreatePhysicalWaterOptions {
  id: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  initialY: number;
  segmentsX: number;
  segmentsZ: number;
  waterNormalMap: THREE.Texture;
  depthProfile: WaterDepthProfile;
  shallowColor?: number;
  deepColor?: number;
  foamColor?: number;
  splashTint?: number;
  waveScale?: number;
  isIndoor?: boolean;
  sharedRipples?: THREE.Vector4[];
}

function hash2D(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function bakeWaterDepthTexture(
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  profile: WaterDepthProfile,
  size = 128
): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const w = Math.max(0.01, bounds.maxX - bounds.minX);
  const d = Math.max(0.01, bounds.maxZ - bounds.minZ);
  const maxBed = Math.max(0.5, profile.maxBedDepth);

  for (let py = 0; py < size; py++) {
    const v = py / (size - 1);
    const wz = bounds.minZ + v * d;
    for (let px = 0; px < size; px++) {
      const u = px / (size - 1);
      const wx = bounds.minX + u * w;

      let depth = profile.baseDepth;
      let obstacleMask = 0.0;

      // 1. Sunken sump trenches / deep basins
      if (profile.trenches) {
        for (let i = 0; i < profile.trenches.length; i++) {
          const tr = profile.trenches[i];
          const dx = Math.max(tr.minX - wx, 0, wx - tr.maxX);
          const dz = Math.max(tr.minZ - wz, 0, wz - tr.maxZ);
          const edgeDist = Math.hypot(dx, dz);
          if (edgeDist < 0.75) {
            const blend = 1.0 - edgeDist / 0.75;
            const smooth = blend * blend * (3.0 - 2.0 * blend);
            depth += tr.depthOffset * smooth;
          }
        }
      }

      // 2. Pool shallow steps / deep slope
      if (profile.shallowCenterGradient) {
        const zFrac = THREE.MathUtils.clamp((wz - bounds.minZ) / d, 0, 1);
        // Deep end toward -Z, shallower steps toward +Z
        depth = THREE.MathUtils.lerp(profile.baseDepth * 1.32, profile.baseDepth * 0.42, zFrac);
        if (
          profile.shallowStepMinZ !== undefined &&
          profile.shallowStepMaxZ !== undefined &&
          wz >= profile.shallowStepMinZ &&
          wz <= profile.shallowStepMaxZ
        ) {
          depth = Math.min(depth, 0.22);
          obstacleMask = Math.max(obstacleMask, 0.45);
        }
      }

      // 3. Perimeter wall / concrete shore slopes
      if (profile.shoreSlopes) {
        for (let i = 0; i < profile.shoreSlopes.length; i++) {
          const ss = profile.shoreSlopes[i];
          const spanCoord = ss.axis === 'x' ? wz : wx;
          if (ss.minSpan !== undefined && spanCoord < ss.minSpan) continue;
          if (ss.maxSpan !== undefined && spanCoord > ss.maxSpan) continue;

          const coord = ss.axis === 'x' ? wx : wz;
          const distFromWall = ss.direction === 1 ? ss.edgeCoord - coord : coord - ss.edgeCoord;
          if (distFromWall <= ss.slopeWidth) {
            const t = THREE.MathUtils.clamp(distFromWall / Math.max(0.05, ss.slopeWidth), 0, 1);
            const smooth = t * t * (3.0 - 2.0 * t);
            depth = Math.min(depth, profile.baseDepth * smooth);
            if (t > 0.04 && t < 0.55) {
              obstacleMask = Math.max(obstacleMask, (1.0 - t / 0.55) * 0.75);
            }
          }
        }
      }

      // 4. Doorway / flood-threshold ramps (taper depth smoothly to 0 at dry doorway edge)
      if (profile.doorwayRamps) {
        for (let i = 0; i < profile.doorwayRamps.length; i++) {
          const dr = profile.doorwayRamps[i];
          if (wx >= dr.minX && wx <= dr.maxX && wz >= dr.minZ && wz <= dr.maxZ) {
            let edgeDist = dr.rampLen;
            if (dr.shallowEdgeZ !== undefined) {
              edgeDist = Math.abs(wz - dr.shallowEdgeZ);
            } else if (dr.shallowEdgeX !== undefined) {
              edgeDist = Math.abs(wx - dr.shallowEdgeX);
            }
            const t = THREE.MathUtils.clamp(edgeDist / Math.max(0.1, dr.rampLen), 0, 1);
            const smooth = t * t * (3.0 - 2.0 * t);
            depth = Math.min(depth, profile.baseDepth * smooth);
            if (t > 0.03 && t < 0.48) {
              obstacleMask = Math.max(obstacleMask, (1.0 - t / 0.48) * 0.8);
            }
          }
        }
      }

      // 5. Box obstacles (walls, tank wrecks, pump plinths, annex walls)
      if (profile.obstacleBoxes) {
        for (let i = 0; i < profile.obstacleBoxes.length; i++) {
          const ob = profile.obstacleBoxes[i];
          const dx = Math.max(ob.minX - wx, 0, wx - ob.maxX);
          const dz = Math.max(ob.minZ - wz, 0, wz - ob.maxZ);
          const dist = Math.hypot(dx, dz);
          if (dist < 1.1) {
            const prox = 1.0 - dist / 1.1;
            obstacleMask = Math.max(obstacleMask, prox * 0.92);
            if (dist < 0.35) {
              depth = Math.min(depth, THREE.MathUtils.lerp(0.1, depth, dist / 0.35));
            }
          }
        }
      }

      // 6. Cylindrical obstacles (hydro-turbines, pillars)
      if (profile.obstacleCylinders) {
        for (let i = 0; i < profile.obstacleCylinders.length; i++) {
          const oc = profile.obstacleCylinders[i];
          const dist = Math.hypot(wx - oc.x, wz - oc.z) - oc.radius;
          if (dist < 1.35) {
            const prox = THREE.MathUtils.clamp(1.0 - Math.max(0, dist) / 1.35, 0, 1);
            obstacleMask = Math.max(obstacleMask, prox * 0.95);
            if (dist < 0.4) {
              const t = THREE.MathUtils.clamp(dist / 0.4, 0, 1);
              depth = Math.min(depth, THREE.MathUtils.lerp(0.08, depth, t));
            }
          }
        }
      }

      // Outer basin boundary contact meniscus
      const edgeProxX = Math.min(wx - bounds.minX, bounds.maxX - wx);
      const edgeProxZ = Math.min(wz - bounds.minZ, bounds.maxZ - wz);
      const minBoundDist = Math.min(edgeProxX, edgeProxZ);
      if (minBoundDist < 0.55) {
        obstacleMask = Math.max(obstacleMask, (1.0 - minBoundDist / 0.55) * 0.85);
      }

      const siltVar =
        0.35 +
        0.4 * hash2D(Math.floor(wx * 0.7), Math.floor(wz * 0.7)) +
        0.25 * (0.5 + 0.5 * Math.sin(wx * 0.45 + wz * 0.35));

      const idx = (py * size + px) * 4;
      data[idx] = Math.round(THREE.MathUtils.clamp(depth / maxBed, 0, 1) * 255);
      data[idx + 1] = Math.round(THREE.MathUtils.clamp(obstacleMask, 0, 1) * 255);
      data[idx + 2] = Math.round(THREE.MathUtils.clamp(siltVar, 0, 1) * 255);
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export function createDefaultRippleArray(): THREE.Vector4[] {
  return Array.from({ length: MAX_WATER_RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0));
}

export function createPhysicalWaterMesh(
  opts: CreatePhysicalWaterOptions,
  disposeables?: { dispose: () => void }[]
): WaterBodyRuntime {
  const width = opts.bounds.maxX - opts.bounds.minX;
  const depth = opts.bounds.maxZ - opts.bounds.minZ;
  const cx = (opts.bounds.minX + opts.bounds.maxX) * 0.5;
  const cz = (opts.bounds.minZ + opts.bounds.maxZ) * 0.5;

  const geo = new THREE.PlaneGeometry(width, depth, opts.segmentsX, opts.segmentsZ);
  geo.rotateX(-Math.PI / 2);

  const depthMap = bakeWaterDepthTexture(opts.bounds, opts.depthProfile, 128);
  const ripples = opts.sharedRipples ?? createDefaultRippleArray();

  const uniforms: WaterUniformSet = {
    uTime: { value: 0 },
    uWaterLevel: { value: opts.initialY },
    uInitialLevel: { value: opts.initialY },
    uWindVec: { value: new THREE.Vector2(1.2, 0.6) },
    uRainIntensity: { value: 0 },
    uWaveScale: { value: opts.waveScale ?? 1.0 },
    uShallowColor: { value: new THREE.Color(opts.shallowColor ?? 0x1a383a) },
    uDeepColor: { value: new THREE.Color(opts.deepColor ?? 0x051218) },
    uFoamColor: { value: new THREE.Color(opts.foamColor ?? 0x7d969c) },
    tWaterNormal: { value: opts.waterNormalMap },
    tDepthMap: { value: depthMap },
    uDepthBounds: {
      value: new THREE.Vector4(
        opts.bounds.minX,
        opts.bounds.minZ,
        1 / Math.max(0.01, width),
        1 / Math.max(0.01, depth)
      ),
    },
    uMaxBedDepth: { value: opts.depthProfile.maxBedDepth },
    uReflectMap: { value: null },
    uHasPlanarReflect: { value: 0 },
    uReflectMatrix: { value: new THREE.Matrix4() },
    uRipples: { value: ripples },
  };

  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.02,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  mat.customProgramCacheKey = () => 'twhr_physical_water_v1';

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uTime;
uniform float uWaterLevel;
uniform float uInitialLevel;
uniform vec2 uWindVec;
uniform float uWaveScale;
uniform vec4 uDepthBounds;
uniform float uMaxBedDepth;
uniform sampler2D tDepthMap;
uniform mat4 uReflectMatrix;
uniform vec4 uRipples[${MAX_WATER_RIPPLES}];

varying vec3 vWaterWorldPos;
varying vec4 vWaterReflectUv;
varying vec2 vWaterDepthUv;
varying float vWaveCrest;

float evalWaterHeight(vec2 xz, float time, vec2 wind, float scale) {
  vec2 wDir = length(wind) > 0.05 ? normalize(wind) : vec2(0.8, 0.5);
  float t = time;
  float h = 0.0;
  h += sin(dot(xz, vec2(0.55, 0.28) + wDir * 0.12) + t * 1.45) * 0.018;
  h += sin(dot(xz, vec2(-0.38, 0.72)) + t * 1.95) * 0.012;
  h += sin(dot(xz, vec2(1.15, -0.82)) - t * 2.45) * 0.007;
  h += cos(dot(xz, vec2(-1.65, -1.20)) + t * 3.15) * 0.004;
  return h * scale;
}
`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vec4 wPosBase = modelMatrix * vec4(transformed, 1.0);
vec2 dUv = clamp((wPosBase.xz - uDepthBounds.xy) * uDepthBounds.zw, vec2(0.0), vec2(1.0));
float encDepth = texture2D(tDepthMap, dUv).r * uMaxBedDepth;
float curDepth = max(0.0, encDepth - max(0.0, uInitialLevel - uWaterLevel));
float shoreDamp = smoothstep(0.02, 0.34, curDepth);

float wH = evalWaterHeight(wPosBase.xz, uTime, uWindVec, uWaveScale) * shoreDamp;
for (int i = 0; i < ${MAX_WATER_RIPPLES}; i++) {
  vec4 rp = uRipples[i];
  if (rp.w > 0.001) {
    float age = uTime - rp.z;
    if (age >= 0.0 && age < 2.8) {
      float dist = length(wPosBase.xz - rp.xy);
      float front = age * 4.2;
      float env = exp(-abs(dist - front * 0.65) * 0.55) * exp(-dist * 0.28) * exp(-age * 1.35);
      wH += sin(dist * 6.8 - age * 12.0) * env * rp.w * 0.042 * shoreDamp;
    }
  }
}

transformed.y += wH;
vec4 wPosMoved = modelMatrix * vec4(transformed, 1.0);
vWaterWorldPos = wPosMoved.xyz;
vWaterDepthUv = dUv;
vWaveCrest = clamp(wH / max(0.012, 0.032 * uWaveScale), -1.0, 1.0);
vWaterReflectUv = uReflectMatrix * wPosMoved;
`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uTime;
uniform float uWaterLevel;
uniform float uInitialLevel;
uniform vec2 uWindVec;
uniform float uRainIntensity;
uniform float uWaveScale;
uniform vec3 uShallowColor;
uniform vec3 uDeepColor;
uniform vec3 uFoamColor;
uniform sampler2D tWaterNormal;
uniform sampler2D tDepthMap;
uniform vec4 uDepthBounds;
uniform float uMaxBedDepth;
uniform sampler2D uReflectMap;
uniform float uHasPlanarReflect;
uniform vec4 uRipples[${MAX_WATER_RIPPLES}];

varying vec3 vWaterWorldPos;
varying vec4 vWaterReflectUv;
varying vec2 vWaterDepthUv;
varying float vWaveCrest;

float waterHash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float waterValueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = waterHash21(i);
  float b = waterHash21(i + vec2(1.0, 0.0));
  float c = waterHash21(i + vec2(0.0, 1.0));
  float d = waterHash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float waterCausticPattern(vec2 uv, float t) {
  vec2 p1 = uv * 0.65 + vec2(t * 0.14, -t * 0.11);
  vec2 p2 = uv * 0.85 + vec2(-t * 0.12, t * 0.17);
  float w1 = sin(p1.x * 3.1 + sin(p1.y * 2.7 + t)) * cos(p1.y * 2.9 - cos(p1.x * 2.4 - t));
  float w2 = sin(p2.x * 3.7 - cos(p2.y * 3.3 + t * 1.2)) * cos(p2.y * 3.1 + sin(p2.x * 2.8));
  float c = abs(w1 + w2) * 0.5;
  return pow(clamp(1.0 - c * 1.35, 0.0, 1.0), 3.0);
}

vec2 evalWaveGrad(vec2 xz, float t, vec2 wind, float scale) {
  vec2 wDir = length(wind) > 0.05 ? normalize(wind) : vec2(0.8, 0.5);
  vec2 k1 = vec2(0.55, 0.28) + wDir * 0.12;
  vec2 k2 = vec2(-0.38, 0.72);
  vec2 k3 = vec2(1.15, -0.82);
  vec2 k4 = vec2(-1.65, -1.20);
  vec2 grad = vec2(0.0);
  grad += k1 * cos(dot(xz, k1) + t * 1.45) * 0.018;
  grad += k2 * cos(dot(xz, k2) + t * 1.95) * 0.012;
  grad += k3 * cos(dot(xz, k3) - t * 2.45) * 0.007;
  grad -= k4 * sin(dot(xz, k4) + t * 3.15) * 0.004;
  return grad * scale;
}

vec2 evalRainGrad(vec2 xz, float t, float rainAmt) {
  if (rainAmt < 0.03) return vec2(0.0);
  vec2 scaled = xz * 1.65;
  vec2 cell = floor(scaled);
  vec2 f = fract(scaled);
  vec2 totalGrad = vec2(0.0);
  for (int oy = -1; oy <= 1; oy++) {
    for (int ox = -1; ox <= 1; ox++) {
      vec2 nb = cell + vec2(float(ox), float(oy));
      float rnd = waterHash21(nb);
      vec2 dropCenter = vec2(float(ox), float(oy)) + vec2(0.2 + 0.6 * rnd, 0.2 + 0.6 * fract(rnd * 17.3));
      float cycle = fract(t * (0.9 + rnd * 0.5) + rnd * 7.1);
      vec2 diff = f - dropCenter;
      float dist = length(diff);
      float ringR = cycle * 0.65;
      float band = exp(-pow((dist - ringR) * 11.0, 2.0)) * (1.0 - cycle);
      if (dist > 0.005) {
        totalGrad += (diff / dist) * sin((dist - ringR) * 28.0) * band * 0.085;
      }
    }
  }
  return totalGrad * rainAmt;
}
`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
vec4 wDepthData = texture2D(tDepthMap, vWaterDepthUv);
float waterDepthCur = max(0.0, wDepthData.r * uMaxBedDepth - max(0.0, uInitialLevel - uWaterLevel));
if (waterDepthCur <= 0.004) discard;

float waterObsMask = wDepthData.g;
float waterSiltVar = wDepthData.b;

// Analytical wave + interactive ripple gradient & energy
vec2 windNorm = length(uWindVec) > 0.05 ? uWindVec * 0.015 : vec2(0.016, 0.009);
vec2 nUv1 = vWaterWorldPos.xz * 0.11 + vec2(uTime * 0.022, uTime * 0.015) + windNorm * uTime;
vec2 nUv2 = vWaterWorldPos.xz * 0.24 + vec2(-uTime * 0.019, uTime * 0.026) - windNorm * (uTime * 0.5);
vec3 nTex1 = texture2D(tWaterNormal, nUv1).xyz * 2.0 - 1.0;
vec3 nTex2 = texture2D(tWaterNormal, nUv2).xyz * 2.0 - 1.0;
vec2 texSlope = (nTex1.xy * 0.22 + nTex2.xy * 0.14) * (0.65 + 0.35 * uWaveScale);
vec2 waveSlope = evalWaveGrad(vWaterWorldPos.xz, uTime, uWindVec, uWaveScale);
vec2 rainSlope = evalRainGrad(vWaterWorldPos.xz, uTime, uRainIntensity);

vec2 rippleSlope = vec2(0.0);
float rippleEnergy = 0.0;
for (int i = 0; i < ${MAX_WATER_RIPPLES}; i++) {
  vec4 rp = uRipples[i];
  if (rp.w > 0.001) {
    float age = uTime - rp.z;
    if (age >= 0.0 && age < 2.8) {
      vec2 toP = vWaterWorldPos.xz - rp.xy;
      float dist = length(toP);
      if (dist > 0.01 && dist < 12.0) {
        float front = age * 4.2;
        float env = exp(-abs(dist - front * 0.65) * 0.58) * exp(-dist * 0.26) * exp(-age * 1.35);
        float phase = dist * 7.2 - age * 12.5;
        float slopeMag = cos(phase) * env * rp.w * 0.28;
        rippleSlope += (toP / dist) * slopeMag;
        rippleEnergy += abs(sin(phase)) * env * rp.w;
      }
    }
  }
}

float depthSlopeDamp = smoothstep(0.01, 0.14, waterDepthCur);
vec2 totalSlopeXZ = (waveSlope + texSlope + rippleSlope + rainSlope) * depthSlopeDamp;
vec3 waterWorldNormal = normalize(vec3(-totalSlopeXZ.x, 1.0, -totalSlopeXZ.y));

// Beer-Lambert depth absorption & shallow underwater caustics
float wAbsorb = 1.0 - exp(-waterDepthCur * 1.85);
float wShoreNoise = waterValueNoise(vWaterWorldPos.xz * 2.1 + vec2(uTime * 0.06, -uTime * 0.04));
float wCaustic = waterCausticPattern(vWaterWorldPos.xz + waterWorldNormal.xz * 0.4, uTime);
wCaustic *= exp(-waterDepthCur * 1.25) * smoothstep(0.025, 0.14, waterDepthCur);

vec3 waterBodyRgb = mix(uShallowColor, uDeepColor, clamp(wAbsorb * (0.85 + 0.3 * waterSiltVar), 0.0, 1.0));
waterBodyRgb += vec3(0.11, 0.20, 0.22) * wCaustic;

// Organic dirty industrial shoreline contact meniscus + obstacle foam + impact ripple foam
float wShoreFoam = (1.0 - smoothstep(0.012, 0.14 + wShoreNoise * 0.055, waterDepthCur)) * smoothstep(0.004, 0.022, waterDepthCur);
float wObsFoam = smoothstep(0.32, 0.90, waterObsMask) * (0.35 + 0.65 * wShoreNoise) * smoothstep(0.02, 0.14, waterDepthCur);
float wRippleFoam = clamp((rippleEnergy - 0.18) * 0.85, 0.0, 0.55) * (0.5 + 0.5 * wShoreNoise);
float wCrestFoam = max(0.0, vWaveCrest) * smoothstep(0.55, 0.95, wShoreNoise) * 0.14;
float waterFoamMask = clamp(wShoreFoam * 0.48 + wObsFoam * 0.42 + wRippleFoam + wCrestFoam, 0.0, 0.65);

diffuseColor.rgb = mix(waterBodyRgb, uFoamColor, waterFoamMask);

// Depth-graded transparency (clear shallow edges revealing concrete/debris, deep murky sumps)
vec3 viewDirWorld = normalize(cameraPosition - vWaterWorldPos);
float viewGrazing = pow(1.0 - clamp(dot(waterWorldNormal, viewDirWorld), 0.0, 1.0), 4.0);
float depthAlpha = mix(0.24, 0.88, 1.0 - exp(-waterDepthCur * 1.65));
float edgeFeather = smoothstep(0.004, 0.055, waterDepthCur);
diffuseColor.a = clamp(mix(depthAlpha, 0.94, max(viewGrazing * 0.62, waterFoamMask * 0.55)) * edgeFeather, 0.0, 0.95);
`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float slickNoise = waterValueNoise(vWaterWorldPos.xz * 0.35 - uWindVec * (uTime * 0.025));
float roughnessFactor = clamp(0.08 + slickNoise * 0.14 + waterFoamMask * 0.52, 0.075, 0.78);
`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `normal = normalize((viewMatrix * vec4(waterWorldNormal, 0.0)).xyz);
`
      )
      .replace(
        '#include <opaque_fragment>',
        `float wNdotV = clamp(dot(waterWorldNormal, viewDirWorld), 0.0, 1.0);
float wFresnel = 0.025 + 0.72 * pow(1.0 - wNdotV, 4.4);
if (uHasPlanarReflect > 0.5 && vWaterReflectUv.w > 0.001) {
  vec2 projUv = vWaterReflectUv.xy / vWaterReflectUv.w;
  float distortScale = 0.046 + 0.024 * clamp(waterDepthCur, 0.0, 1.0);
  vec2 reflUv = clamp(projUv + waterWorldNormal.xz * distortScale, vec2(0.003), vec2(0.997));
  vec3 reflSample = texture2D(uReflectMap, reflUv).rgb;
  // Softly compress peak reflection HDR so bloom doesn't over-glow the surface
  reflSample = min(reflSample, vec3(1.25));
  float reflStrength = wFresnel * (1.0 - waterFoamMask * 0.85) * smoothstep(0.01, 0.12, waterDepthCur);
  outgoingLight = mix(outgoingLight, reflSample * 0.78 + outgoingLight * 0.24, clamp(reflStrength, 0.0, 0.68));
}
#include <opaque_fragment>
`
      );
  };

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, opts.initialY, cz);
  mesh.renderOrder = 3;
  mesh.receiveShadow = false;
  mesh.castShadow = false;

  if (disposeables) {
    disposeables.push(geo, mat, depthMap);
  }

  return {
    id: opts.id,
    mesh,
    material: mat,
    depthMap,
    bounds: { ...opts.bounds },
    initialY: opts.initialY,
    currentY: opts.initialY,
    isIndoor: Boolean(opts.isIndoor),
    splashTint: opts.splashTint ?? 0xb8d8e0,
    uniforms,
  };
}

interface SplashParticleSlot {
  active: boolean;
  life: number;
  maxLife: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  floorY: number;
  r: number;
  g: number;
  b: number;
}

function createWaterSplashSprite(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(235, 248, 255, 0.95)');
  grad.addColorStop(0.45, 'rgba(185, 222, 232, 0.55)');
  grad.addColorStop(0.8, 'rgba(140, 185, 198, 0.18)');
  grad.addColorStop(1, 'rgba(120, 165, 180, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class WaterController {
  private bodies: WaterBodyRuntime[];
  private ripples: THREE.Vector4[];
  private rippleCursor = 0;

  // Shared single planar reflection render target + mirrored camera
  private reflectRT: THREE.WebGLRenderTarget | null = null;
  private reflectRtSize = 0;
  private reflectCam = new THREE.PerspectiveCamera();
  private reflectEnabled = true;

  // Pre-allocated math objects for zero-GC planar reflection pass
  private readonly _reflectorPlane = new THREE.Plane();
  private readonly _normal = new THREE.Vector3(0, 1, 0);
  private readonly _reflectPos = new THREE.Vector3();
  private readonly _camWorldPos = new THREE.Vector3();
  private readonly _rotMat = new THREE.Matrix4();
  private readonly _lookAtPos = new THREE.Vector3();
  private readonly _clipPlane = new THREE.Vector4();
  private readonly _view = new THREE.Vector3();
  private readonly _target = new THREE.Vector3();
  private readonly _q = new THREE.Vector4();
  private readonly _texMatrix = new THREE.Matrix4();

  // Pooled soft circular droplet splash particles
  private readonly splashCap = 180;
  private splashSlots: SplashParticleSlot[] = [];
  private splashCursor = 0;
  private splashGeo: THREE.BufferGeometry;
  private splashMat: THREE.PointsMaterial;
  private splashPoints: THREE.Points;
  private splashSprite: THREE.CanvasTexture;
  private qualityScale = 1.0;

  // Periodic indoor pipe drip / ambient disturbance timer
  private dripTimer = 0.25;
  private readonly _tempCol = new THREE.Color();

  constructor(
    scene: THREE.Scene,
    bodies: WaterBodyRuntime[],
    sharedRipples: THREE.Vector4[],
    isSoftwareGl: boolean
  ) {
    this.bodies = bodies;
    this.ripples = sharedRipples;
    this.reflectEnabled = !isSoftwareGl && bodies.length > 0;

    if (this.reflectEnabled) {
      this.allocateReflectRT(512);
    }

    // Initialize pooled water splash particle system
    this.splashSlots = Array.from({ length: this.splashCap }, () => ({
      active: false,
      life: 0,
      maxLife: 0.5,
      x: 0,
      y: -200,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      floorY: 0,
      r: 0.72,
      g: 0.85,
      b: 0.9,
    }));

    this.splashGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(this.splashCap * 3);
    const colArr = new Float32Array(this.splashCap * 3);
    posArr.fill(-200);
    this.splashGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    this.splashGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    this.splashSprite = createWaterSplashSprite();
    this.splashMat = new THREE.PointsMaterial({
      size: 0.28,
      map: this.splashSprite,
      transparent: true,
      opacity: 0.78,
      vertexColors: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.splashPoints = new THREE.Points(this.splashGeo, this.splashMat);
    this.splashPoints.frustumCulled = false;
    this.splashPoints.renderOrder = 4;
    if (bodies.length > 0) {
      scene.add(this.splashPoints);
    }
  }

  private allocateReflectRT(size: number): void {
    if (this.reflectRT && this.reflectRtSize === size) return;
    if (this.reflectRT) {
      this.reflectRT.dispose();
    }
    this.reflectRtSize = size;
    this.reflectRT = new THREE.WebGLRenderTarget(size, size, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      samples: 0,
    });
  }

  public setGraphicsQuality(
    quality: 'low' | 'medium' | 'high' | 'ultra' | 'cinematic',
    isSoftwareGl: boolean
  ): void {
    if (this.bodies.length === 0) return;

    if (quality === 'low' || isSoftwareGl) {
      this.reflectEnabled = false;
      this.qualityScale = quality === 'low' ? 0.45 : 0.75;
      for (const b of this.bodies) {
        b.uniforms.uHasPlanarReflect.value = 0;
        b.uniforms.uReflectMap.value = null;
      }
      return;
    }

    this.reflectEnabled = true;
    const rtSize = quality === 'medium' ? 384 : quality === 'high' ? 512 : 768;
    this.qualityScale = quality === 'medium' ? 0.75 : quality === 'high' ? 1.0 : 1.25;
    this.allocateReflectRT(rtSize);
  }

  public findBodyAt(x: number, z: number, minWaterY = 0.08): WaterBodyRuntime | null {
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (!b.mesh.visible || b.currentY <= minWaterY) continue;
      if (x >= b.bounds.minX && x <= b.bounds.maxX && z >= b.bounds.minZ && z <= b.bounds.maxZ) {
        return b;
      }
    }
    return null;
  }

  public triggerRipple(x: number, z: number, strength: number, elapsedSeconds: number): void {
    const body = this.findBodyAt(x, z, 0.08);
    if (!body) return;
    const slot = this.ripples[this.rippleCursor];
    this.rippleCursor = (this.rippleCursor + 1) % MAX_WATER_RIPPLES;
    slot.set(x, z, elapsedSeconds, THREE.MathUtils.clamp(strength, 0.1, 2.2));
  }

  public spawnSplash(
    x: number,
    y: number,
    z: number,
    count: number,
    speed = 3.2,
    tintHex?: number
  ): void {
    const body = this.findBodyAt(x, z, 0.06);
    const colHex = tintHex ?? body?.splashTint ?? 0xb8d8e0;
    this._tempCol.setHex(colHex);
    const scaledCount = Math.max(1, Math.round(count * this.qualityScale));

    for (let i = 0; i < scaledCount; i++) {
      const s = this.splashSlots[this.splashCursor];
      this.splashCursor = (this.splashCursor + 1) % this.splashCap;
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * speed * 0.65;
      s.active = true;
      s.life = 0;
      s.maxLife = 0.28 + Math.random() * 0.34;
      s.x = x + (Math.random() - 0.5) * 0.22;
      s.y = y + 0.03;
      s.z = z + (Math.random() - 0.5) * 0.22;
      s.vx = Math.cos(ang) * rad;
      s.vy = speed * (0.55 + Math.random() * 0.75);
      s.vz = Math.sin(ang) * rad;
      s.floorY = y;
      s.r = this._tempCol.r;
      s.g = this._tempCol.g;
      s.b = this._tempCol.b;
    }
  }

  public raycastWaterSurface(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    maxDist: number,
    outPoint: THREE.Vector3
  ): { body: WaterBodyRuntime; dist: number } | null {
    if (this.bodies.length === 0 || Math.abs(dir.y) < 1e-5) return null;
    let bestDist = maxDist;
    let bestBody: WaterBodyRuntime | null = null;

    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (!b.mesh.visible || b.currentY <= 0.08) continue;
      // Only intersect from above the surface
      if (origin.y <= b.currentY + 0.02 || dir.y >= 0) continue;
      const t = (b.currentY - origin.y) / dir.y;
      if (t <= 0.05 || t >= bestDist) continue;
      const hx = origin.x + dir.x * t;
      const hz = origin.z + dir.z * t;
      if (hx >= b.bounds.minX && hx <= b.bounds.maxX && hz >= b.bounds.minZ && hz <= b.bounds.maxZ) {
        bestDist = t;
        bestBody = b;
      }
    }

    if (!bestBody) return null;
    outPoint.set(
      origin.x + dir.x * bestDist,
      bestBody.currentY,
      origin.z + dir.z * bestDist
    );
    return { body: bestBody, dist: bestDist };
  }

  public syncSectionHeight(id: string, currentY: number): void {
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (b.id === id) {
        b.currentY = currentY;
        b.mesh.position.y = currentY;
        b.uniforms.uWaterLevel.value = currentY;
        b.mesh.visible = currentY > 0.04;
      }
    }
  }

  public update(
    dt: number,
    elapsedSeconds: number,
    windVec: THREE.Vector3,
    rainIntensity: number,
    viewerPos: THREE.Vector3
  ): void {
    if (this.bodies.length === 0) return;

    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      b.uniforms.uTime.value = elapsedSeconds;
      b.uniforms.uWaterLevel.value = b.currentY;
      b.uniforms.uWindVec.value.set(windVec.x, windVec.z);
      b.uniforms.uRainIntensity.value = b.isIndoor ? Math.max(0.08, rainIntensity * 0.22) : rainIntensity;
    }

    // Subtle overhead pipe / ceiling condensation drips into flooded bays near the viewer
    this.dripTimer -= dt;
    if (this.dripTimer <= 0) {
      this.dripTimer = 0.35 + Math.random() * 0.55;
      const nearbyBody = this.findBodyAt(viewerPos.x, viewerPos.z, 0.14);
      if (nearbyBody) {
        const dx = (Math.random() - 0.5) * 18;
        const dz = (Math.random() - 0.5) * 18;
        const rx = THREE.MathUtils.clamp(viewerPos.x + dx, nearbyBody.bounds.minX + 1.5, nearbyBody.bounds.maxX - 1.5);
        const rz = THREE.MathUtils.clamp(viewerPos.z + dz, nearbyBody.bounds.minZ + 1.5, nearbyBody.bounds.maxZ - 1.5);
        this.triggerRipple(rx, rz, 0.32, elapsedSeconds);
      }
    }

    // Update pooled water splash particles
    const posAttr = this.splashGeo.attributes.position as THREE.BufferAttribute;
    const colAttr = this.splashGeo.attributes.color as THREE.BufferAttribute;
    let anyDirty = false;
    for (let i = 0; i < this.splashCap; i++) {
      const s = this.splashSlots[i];
      if (!s.active) {
        if (posAttr.getY(i) > -150) {
          posAttr.setXYZ(i, 0, -200, 0);
          anyDirty = true;
        }
        continue;
      }
      anyDirty = true;
      s.life += dt;
      const t = s.life / s.maxLife;
      if (t >= 1) {
        s.active = false;
        posAttr.setXYZ(i, 0, -200, 0);
        continue;
      }
      s.vy -= 14.5 * dt;
      s.vx *= Math.max(0, 1 - 1.8 * dt);
      s.vz *= Math.max(0, 1 - 1.8 * dt);
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      if (s.y < s.floorY) {
        s.active = false;
        posAttr.setXYZ(i, 0, -200, 0);
        continue;
      }
      const fade = 1 - t * t;
      posAttr.setXYZ(i, s.x, s.y, s.z);
      colAttr.setXYZ(i, s.r * fade, s.g * fade, s.b * fade);
    }
    if (anyDirty) {
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }
  }

  public renderReflection(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ): void {
    if (!this.reflectEnabled || !this.reflectRT || this.bodies.length === 0) return;

    // Pick closest visible non-drained water body within 70m
    let activeBody: WaterBodyRuntime | null = null;
    let bestDistSq = 70 * 70;
    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (!b.mesh.visible || b.currentY <= 0.08) continue;
      if (camera.position.y <= b.currentY + 0.06) continue;
      const cx = THREE.MathUtils.clamp(camera.position.x, b.bounds.minX, b.bounds.maxX);
      const cz = THREE.MathUtils.clamp(camera.position.z, b.bounds.minZ, b.bounds.maxZ);
      const dx = camera.position.x - cx;
      const dz = camera.position.z - cz;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        activeBody = b;
      }
    }

    if (!activeBody) {
      for (let i = 0; i < this.bodies.length; i++) {
        this.bodies[i].uniforms.uHasPlanarReflect.value = 0;
      }
      return;
    }

    const planeY = activeBody.currentY;

    // Mirror camera across horizontal plane y = planeY (zero-GC)
    this._reflectPos.set(0, planeY, 0);
    this._normal.set(0, 1, 0);
    this._camWorldPos.setFromMatrixPosition(camera.matrixWorld);

    this._view.subVectors(this._reflectPos, this._camWorldPos);
    this._view.reflect(this._normal).negate().add(this._reflectPos);

    this._rotMat.extractRotation(camera.matrixWorld);
    this._lookAtPos.set(0, 0, -1).applyMatrix4(this._rotMat).add(this._camWorldPos);

    this._target.subVectors(this._reflectPos, this._lookAtPos);
    this._target.reflect(this._normal).negate().add(this._reflectPos);

    this.reflectCam.position.copy(this._view);
    this.reflectCam.up.set(0, 1, 0).applyMatrix4(this._rotMat).reflect(this._normal);
    this.reflectCam.lookAt(this._target);
    this.reflectCam.fov = camera.fov;
    this.reflectCam.aspect = camera.aspect;
    this.reflectCam.near = camera.near;
    this.reflectCam.far = camera.far;
    this.reflectCam.updateMatrixWorld();
    this.reflectCam.projectionMatrix.copy(camera.projectionMatrix);

    // Mirror horizontal offset
    this.reflectCam.projectionMatrix.elements[8] *= -1;
    this.reflectCam.projectionMatrix.elements[12] *= -1;

    // World-space texture matrix (for vWaterReflectUv = uReflectMatrix * worldPos)
    this._texMatrix.set(
      0.5, 0.0, 0.0, 0.5,
      0.0, 0.5, 0.0, 0.5,
      0.0, 0.0, 0.5, 0.5,
      0.0, 0.0, 0.0, 1.0
    );
    this._texMatrix.multiply(this.reflectCam.projectionMatrix);
    this._texMatrix.multiply(this.reflectCam.matrixWorldInverse);

    // Lengyel oblique near-plane clipping at y = planeY
    this._reflectorPlane.setFromNormalAndCoplanarPoint(this._normal, this._reflectPos);
    this._reflectorPlane.applyMatrix4(this.reflectCam.matrixWorldInverse);
    this._clipPlane.set(
      this._reflectorPlane.normal.x,
      this._reflectorPlane.normal.y,
      this._reflectorPlane.normal.z,
      this._reflectorPlane.constant
    );

    const pm = this.reflectCam.projectionMatrix;
    this._q.x = (Math.sign(this._clipPlane.x) + pm.elements[8]) / pm.elements[0];
    this._q.y = (Math.sign(this._clipPlane.y) + pm.elements[9]) / pm.elements[5];
    this._q.z = -1.0;
    this._q.w = (1.0 + pm.elements[10]) / pm.elements[14];
    this._clipPlane.multiplyScalar(2.0 / this._clipPlane.dot(this._q));
    pm.elements[2] = this._clipPlane.x;
    pm.elements[6] = this._clipPlane.y;
    pm.elements[10] = this._clipPlane.z + 1.0 - 0.004;
    pm.elements[14] = this._clipPlane.w;

    // Hide all water surfaces & splash particles while rendering reflection RT
    const prevVisibility: boolean[] = [];
    for (let i = 0; i < this.bodies.length; i++) {
      prevVisibility.push(this.bodies[i].mesh.visible);
      this.bodies[i].mesh.visible = false;
    }
    const prevSplashVis = this.splashPoints.visible;
    this.splashPoints.visible = false;

    const currentTarget = renderer.getRenderTarget();
    const prevXr = renderer.xr.enabled;
    const prevShadowAuto = renderer.shadowMap.autoUpdate;
    renderer.xr.enabled = false;
    renderer.shadowMap.autoUpdate = false;

    renderer.setRenderTarget(this.reflectRT);
    renderer.state.buffers.depth.setMask(true);
    renderer.clear();
    renderer.render(scene, this.reflectCam);

    renderer.xr.enabled = prevXr;
    renderer.shadowMap.autoUpdate = prevShadowAuto;
    renderer.setRenderTarget(currentTarget);

    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i].mesh.visible = prevVisibility[i];
      const b = this.bodies[i];
      if (Math.abs(b.currentY - planeY) < 0.15) {
        b.uniforms.uReflectMap.value = this.reflectRT.texture;
        b.uniforms.uReflectMatrix.value.copy(this._texMatrix);
        b.uniforms.uHasPlanarReflect.value = 1;
      } else {
        b.uniforms.uHasPlanarReflect.value = 0;
      }
    }
    this.splashPoints.visible = prevSplashVis;
  }

  public dispose(): void {
    if (this.reflectRT) {
      this.reflectRT.dispose();
      this.reflectRT = null;
    }
    this.splashGeo.dispose();
    this.splashMat.dispose();
    this.splashSprite.dispose();
  }
}
