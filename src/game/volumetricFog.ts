import * as THREE from 'three';
import { GraphicsQuality } from './types';

const MAX_FOG_SLICES = 28;
const FOG_RING_RADIUS = 30;

const VolumetricFogShader = {
  vertexShader: `
    attribute float aSeed;
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying float vViewDist;
    varying float vSeed;

    void main() {
      vUv = uv;
      vSeed = aSeed;

      vec3 center = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      float sliceScale = length(instanceMatrix[0].xyz);

      vec2 horiz = vec2(-(cameraPosition.z - center.z), cameraPosition.x - center.x);
      float hLen = length(horiz);
      vec2 r2 = hLen > 0.001 ? (horiz / hLen) : vec2(1.0, 0.0);
      vec3 right = vec3(r2.x, 0.0, r2.y);
      vec3 up = vec3(0.0, 1.0, 0.0);

      vec3 worldPos = center + right * (position.x * sliceScale) + up * (position.y * sliceScale * 0.56);
      vWorldPos = worldPos;
      vViewDist = length(cameraPosition - worldPos);

      gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uDarkness;
    uniform float uQualityDensity;
    uniform vec3 uFogColor;
    uniform vec3 uFlashlightPos;
    uniform vec3 uFlashlightDir;
    uniform float uFlashlightPower;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying float vViewDist;
    varying float vSeed;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 3; i++) {
        v += amp * noise2(p);
        p = p * 2.03 + vec2(17.1, 31.7);
        amp *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 p = (vUv - 0.5) * 2.0;
      float radial = 1.0 - smoothstep(0.18, 1.0, dot(p, p));
      if (radial <= 0.002) discard;

      float vertFade = smoothstep(-0.95, -0.15, p.y) * (1.0 - smoothstep(0.05, 1.0, p.y));
      float nearFade = smoothstep(1.8, 5.4, vViewDist);
      float farFade = 1.0 - smoothstep(17.0, 31.0, vViewDist);

      vec2 driftA = vWorldPos.xz * 0.13 + vec2(uTime * 0.042, -uTime * 0.024) + vec2(vSeed * 11.3, vSeed * 5.7);
      vec2 driftB = vec2(vWorldPos.x * 0.19 - uTime * 0.028, vWorldPos.y * 0.34 + uTime * 0.014);
      float n = fbm(driftA) * 0.68 + fbm(driftB) * 0.32;
      float wisps = smoothstep(0.24, 0.84, n);

      float darkCurve = pow(clamp(uDarkness, 0.0, 1.0), 1.15);
      float baseAlpha = mix(0.042, 0.25, darkCurve) * uQualityDensity;
      float alpha = wisps * radial * vertFade * nearFade * farFade * baseAlpha;

      // Volumetric Mie-like scattering when the flashlight cuts through dark fog
      vec3 toFrag = vWorldPos - uFlashlightPos;
      float fDist = length(toFrag);
      vec3 fDir = toFrag / max(fDist, 0.001);
      float cosA = dot(fDir, normalize(uFlashlightDir));
      float cone = smoothstep(0.83, 0.985, cosA);
      float atten = 1.0 / (1.0 + fDist * fDist * 0.022);
      float scatter = cone * atten * uFlashlightPower * (0.35 + 0.65 * darkCurve);

      vec3 baseMistCol = uFogColor * 1.45 + vec3(0.045, 0.058, 0.078);
      vec3 beamCol = vec3(0.96, 0.90, 0.78);
      vec3 mistCol = mix(baseMistCol, beamCol, clamp(scatter * 0.75, 0.0, 0.75));
      alpha = clamp(alpha + scatter * wisps * radial * nearFade * 0.15, 0.0, 0.44);

      if (alpha < 0.003) discard;
      gl_FragColor = vec4(mistCol, alpha);
    }
  `,
};

export class DynamicVolumetricFog {
  private scene: THREE.Scene;
  private geo: THREE.PlaneGeometry;
  private mat: THREE.ShaderMaterial;
  private mesh: THREE.InstancedMesh;
  private sliceCenters = new Float32Array(MAX_FOG_SLICES * 3);
  private sliceScales = new Float32Array(MAX_FOG_SLICES);
  private sliceBaseHeights = new Float32Array(MAX_FOG_SLICES);
  private dummy = new THREE.Object3D();
  private sampleGroundY: (x: number, z: number) => number;
  private activeCount = MAX_FOG_SLICES;

  constructor(
    scene: THREE.Scene,
    initialCenter: THREE.Vector3,
    sampleGroundY: (x: number, z: number) => number
  ) {
    this.scene = scene;
    this.sampleGroundY = sampleGroundY;

    this.geo = new THREE.PlaneGeometry(15, 7.5);
    const seeds = new Float32Array(MAX_FOG_SLICES);
    for (let i = 0; i < MAX_FOG_SLICES; i++) {
      seeds[i] = Math.random() * 100;
    }
    this.geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));

    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDarkness: { value: 0.5 },
        uQualityDensity: { value: 1.0 },
        uFogColor: { value: new THREE.Color(0x07090e) },
        uFlashlightPos: { value: new THREE.Vector3() },
        uFlashlightDir: { value: new THREE.Vector3(0, 0, -1) },
        uFlashlightPower: { value: 1.0 },
      },
      vertexShader: VolumetricFogShader.vertexShader,
      fragmentShader: VolumetricFogShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, MAX_FOG_SLICES);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;

    for (let i = 0; i < MAX_FOG_SLICES; i++) {
      const angle = (i / MAX_FOG_SLICES) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const dist = 4.5 + Math.random() * (FOG_RING_RADIUS - 5.5);
      const wx = initialCenter.x + Math.cos(angle) * dist;
      const wz = initialCenter.z + Math.sin(angle) * dist;
      const hOff = 1.3 + Math.random() * 3.1;
      const wy = this.sampleGroundY(wx, wz) + hOff;
      const scale = 0.85 + Math.random() * 0.7;

      this.sliceCenters[i * 3] = wx;
      this.sliceCenters[i * 3 + 1] = wy;
      this.sliceCenters[i * 3 + 2] = wz;
      this.sliceBaseHeights[i] = hOff;
      this.sliceScales[i] = scale;

      this.dummy.position.set(wx, wy, wz);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.mesh);
  }

  public setQualityPreset(quality: GraphicsQuality, isSoftwareGl: boolean): void {
    if (quality === 'low') {
      this.activeCount = isSoftwareGl ? 12 : 16;
      this.mat.uniforms.uQualityDensity.value = 0.65;
    } else if (quality === 'medium') {
      this.activeCount = isSoftwareGl ? 16 : 22;
      this.mat.uniforms.uQualityDensity.value = 0.82;
    } else if (quality === 'high') {
      this.activeCount = isSoftwareGl ? 20 : MAX_FOG_SLICES;
      this.mat.uniforms.uQualityDensity.value = 1.0;
    } else {
      this.activeCount = isSoftwareGl ? 22 : MAX_FOG_SLICES;
      this.mat.uniforms.uQualityDensity.value = 1.14;
    }
    this.mesh.count = this.activeCount;
  }

  public update(
    dt: number,
    elapsedSeconds: number,
    playerPos: THREE.Vector3,
    darknessFactor: number,
    fogColor: THREE.Color,
    flashlightPos: THREE.Vector3,
    flashlightDir: THREE.Vector3,
    flashlightPower: number
  ): void {
    this.mat.uniforms.uTime.value = elapsedSeconds;
    this.mat.uniforms.uDarkness.value = darknessFactor;
    this.mat.uniforms.uFogColor.value.copy(fogColor);
    this.mat.uniforms.uFlashlightPos.value.copy(flashlightPos);
    this.mat.uniforms.uFlashlightDir.value.copy(flashlightDir);
    this.mat.uniforms.uFlashlightPower.value = flashlightPower;

    const windX = 0.36;
    const windZ = 0.18;
    const maxDistSq = FOG_RING_RADIUS * FOG_RING_RADIUS;
    let dirty = false;

    for (let i = 0; i < this.activeCount; i++) {
      const idx = i * 3;
      let cx = this.sliceCenters[idx] + windX * dt;
      let cz = this.sliceCenters[idx + 2] + windZ * dt;
      let cy = this.sliceCenters[idx + 1];

      const dx = cx - playerPos.x;
      const dz = cz - playerPos.z;
      if (dx * dx + dz * dz > maxDistSq) {
        // Wrap smoothly to the opposite perimeter relative to player
        cx = playerPos.x - dx * 0.86 + (Math.random() - 0.5) * 4.0;
        cz = playerPos.z - dz * 0.86 + (Math.random() - 0.5) * 4.0;
        cy = this.sampleGroundY(cx, cz) + this.sliceBaseHeights[i];
      }

      this.sliceCenters[idx] = cx;
      this.sliceCenters[idx + 1] = cy;
      this.sliceCenters[idx + 2] = cz;

      this.dummy.position.set(cx, cy, cz);
      this.dummy.scale.setScalar(this.sliceScales[i]);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      dirty = true;
    }

    if (dirty) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.scene.remove(this.mesh);
    this.geo.dispose();
    this.mat.dispose();
  }
}
