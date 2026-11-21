import * as THREE from 'three';
import { ProceduralTextureSet } from './textures';

export interface FireEmitterDef {
  id: string;
  position: THREE.Vector3;
  directionOut: THREE.Vector3;
  scale: number;
  heatRadius: number;
  intensity: number;
  isStructural: boolean;
  smokeDensity: number;
  light?: THREE.PointLight;
  baseLightIntensity?: number;
}

export interface SparkEmitterDef {
  position: THREE.Vector3;
  interval: number;
  timer: number;
}

interface FlameSlot {
  active: boolean;
  emitterIdx: number;
  life: number;
  maxLife: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  seed: number;
}

interface FallingDebrisChunk {
  mesh: THREE.Mesh;
  active: boolean;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

export class VolumetricFireSystem {
  private scene: THREE.Scene;
  private emitters: FireEmitterDef[] = [];
  private sparkEmitters: SparkEmitterDef[] = [];

  // Pooled particle arrays
  private readonly flameCap = 320;
  private readonly smokeCap = 360;
  private readonly emberCap = 240;

  private flameSlots: FlameSlot[] = [];
  private smokeSlots: FlameSlot[] = [];
  private emberSlots: FlameSlot[] = [];

  private flameGeo: THREE.BufferGeometry;
  private smokeGeo: THREE.BufferGeometry;
  private emberGeo: THREE.BufferGeometry;

  private flamePoints: THREE.Points;
  private smokePoints: THREE.Points;
  private emberPoints: THREE.Points;
  private rainPoints: THREE.Points | null = null;
  private dustPoints!: THREE.Points;
  private ashPoints!: THREE.Points;

  private fallingChunks: FallingDebrisChunk[] = [];
  private debrisSpawnTimer = 2.5;
  private flareTimer = 4.2;

  public windVec = new THREE.Vector3(2.4, 0, 1.1);
  public rainIntensity = 0.35; // 0..1 atmospheric drizzle / rain
  private qualityScale = 1.0;
  private flameCursor = 0;
  private smokeCursor = 0;
  private emberCursor = 0;

  constructor(
    scene: THREE.Scene,
    textures: ProceduralTextureSet,
    emitters: FireEmitterDef[],
    sparkEmitters: SparkEmitterDef[] = [],
    enableRain = true
  ) {
    this.scene = scene;
    this.emitters = emitters;
    this.sparkEmitters = sparkEmitters;

    const makeSlotPool = (cap: number): FlameSlot[] =>
      Array.from({ length: cap }, () => ({
        active: false,
        emitterIdx: 0,
        life: 0,
        maxLife: 1,
        x: 0,
        y: -200,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        seed: Math.random() * 10,
      }));

    this.flameSlots = makeSlotPool(this.flameCap);
    this.smokeSlots = makeSlotPool(this.smokeCap);
    this.emberSlots = makeSlotPool(this.emberCap);

    // 1. Volumetric Layered Flames (Additive + Color Ramp)
    this.flameGeo = new THREE.BufferGeometry();
    const fPos = new Float32Array(this.flameCap * 3);
    const fCol = new Float32Array(this.flameCap * 3);
    fPos.fill(-200);
    this.flameGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
    this.flameGeo.setAttribute('color', new THREE.BufferAttribute(fCol, 3));
    this.flamePoints = new THREE.Points(
      this.flameGeo,
      new THREE.PointsMaterial({
        size: 3.6,
        map: textures.fireSpriteMap,
        transparent: true,
        opacity: 0.9,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    this.flamePoints.frustumCulled = false;
    scene.add(this.flamePoints);

    // 2. Rising Black & Slate-Grey Smoke Columns
    this.smokeGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(this.smokeCap * 3);
    const sCol = new Float32Array(this.smokeCap * 3);
    sPos.fill(-200);
    this.smokeGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    this.smokeGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
    this.smokePoints = new THREE.Points(
      this.smokeGeo,
      new THREE.PointsMaterial({
        size: 5.4,
        map: textures.smokeSpriteMap,
        transparent: true,
        opacity: 0.55,
        vertexColors: true,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    this.smokePoints.frustumCulled = false;
    scene.add(this.smokePoints);

    // 3. Wind-Driven Embers & Electrical Sparks
    this.emberGeo = new THREE.BufferGeometry();
    const ePos = new Float32Array(this.emberCap * 3);
    const eCol = new Float32Array(this.emberCap * 3);
    ePos.fill(-200);
    this.emberGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    this.emberGeo.setAttribute('color', new THREE.BufferAttribute(eCol, 3));
    this.emberPoints = new THREE.Points(
      this.emberGeo,
      new THREE.PointsMaterial({
        size: 0.42,
        map: textures.emberSpriteMap,
        transparent: true,
        opacity: 0.95,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    this.emberPoints.frustumCulled = false;
    scene.add(this.emberPoints);

    // 4. Atmospheric Wind-Slanted Rain Sheet
    if (enableRain) {
      const rainCount = 360;
      const rPos = new Float32Array(rainCount * 3);
      for (let i = 0; i < rainCount; i++) {
        rPos[i * 3] = (Math.random() - 0.5) * 68;
        rPos[i * 3 + 1] = Math.random() * 24;
        rPos[i * 3 + 2] = 42 - Math.random() * 140;
      }
      const rGeo = new THREE.BufferGeometry();
      rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
      this.rainPoints = new THREE.Points(
        rGeo,
        new THREE.PointsMaterial({
          color: 0x94a3b8,
          size: 0.14,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        })
      );
      this.rainPoints.frustumCulled = false;
      scene.add(this.rainPoints);
    }

    // 4B. Ultra-Realistic Airborne Dust Storm Particles
    const dustCount = 280;
    const dPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 90;
      dPos[i * 3 + 1] = Math.random() * 14;
      dPos[i * 3 + 2] = 30 - Math.random() * 160;
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    this.dustPoints = new THREE.Points(
      dGeo,
      new THREE.PointsMaterial({
        color: 0xd4b596,
        size: 0.22,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.dustPoints.frustumCulled = false;
    scene.add(this.dustPoints);

    // 4C. New Grey/Black Combustion Ash Storm Particles
    const ashCount = 320;
    const aPos = new Float32Array(ashCount * 3);
    for (let i = 0; i < ashCount; i++) {
      aPos[i * 3] = (Math.random() - 0.5) * 95;
      aPos[i * 3 + 1] = Math.random() * 18;
      aPos[i * 3 + 2] = 35 - Math.random() * 160;
    }
    const aGeo = new THREE.BufferGeometry();
    aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
    this.ashPoints = new THREE.Points(
      aGeo,
      new THREE.PointsMaterial({
        color: 0x64748b,
        size: 0.18,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      })
    );
    this.ashPoints.frustumCulled = false;
    scene.add(this.ashPoints);

    // 5. Pooled Falling Burning Debris Chunks
    const chunkGeo = new THREE.BoxGeometry(0.24, 0.14, 0.42);
    const chunkMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(chunkGeo, chunkMat);
      mesh.visible = false;
      scene.add(mesh);
      this.fallingChunks.push({ mesh, active: false, vx: 0, vy: 0, vz: 0, life: 0 });
    }

    // Pre-seed particles so first rendered frame already displays burning buildings & smoke!
    for (let step = 0; step < 18; step++) {
      this.update(0.14, step * 0.14, new THREE.Vector3(0, 2, 10));
    }
  }

  public spawnBurst(origin: THREE.Vector3, isElectricalSpark = false, count = 20): void {
    for (let i = 0; i < count; i++) {
      const slot = this.emberSlots[this.emberCursor];
      this.emberCursor = (this.emberCursor + 1) % this.emberCap;
      slot.active = true;
      slot.emitterIdx = -1;
      slot.life = 0;
      slot.maxLife = isElectricalSpark ? 0.35 + Math.random() * 0.35 : 0.9 + Math.random() * 0.9;
      slot.x = origin.x + (Math.random() - 0.5) * 0.45;
      slot.y = origin.y + (Math.random() - 0.5) * 0.35;
      slot.z = origin.z + (Math.random() - 0.5) * 0.45;
      const spd = isElectricalSpark ? 6.5 : 4.2;
      slot.vx = (Math.random() - 0.5) * spd + this.windVec.x * 0.3;
      slot.vy = 1.5 + Math.random() * spd * 0.85;
      slot.vz = (Math.random() - 0.5) * spd + this.windVec.z * 0.3;
      slot.seed = isElectricalSpark ? 99 : Math.random() * 5;
    }
  }

  private spawnFlame(idx: number, em: FireEmitterDef): void {
    const slot = this.flameSlots[this.flameCursor];
    this.flameCursor = (this.flameCursor + 1) % this.flameCap;
    const spread = 0.55 * em.scale;
    slot.active = true;
    slot.emitterIdx = idx;
    slot.life = 0;
    slot.maxLife = (0.48 + Math.random() * 0.46) * (0.85 + em.scale * 0.18);
    slot.x = em.position.x + (Math.random() - 0.5) * spread;
    slot.y = em.position.y + Math.random() * 0.35 * em.scale;
    slot.z = em.position.z + (Math.random() - 0.5) * spread;
    // Flames lick outward from broken windows/openings and curl skyward
    slot.vx = em.directionOut.x * (1.8 + Math.random() * 1.4) + (Math.random() - 0.5) * 0.9;
    slot.vy = 2.6 + Math.random() * 2.8 * (0.7 + em.scale * 0.25);
    slot.vz = em.directionOut.z * (1.8 + Math.random() * 1.4) + (Math.random() - 0.5) * 0.9;
  }

  private spawnSmoke(idx: number, em: FireEmitterDef): void {
    const slot = this.smokeSlots[this.smokeCursor];
    this.smokeCursor = (this.smokeCursor + 1) % this.smokeCap;
    const spread = 0.7 * em.scale;
    slot.active = true;
    slot.emitterIdx = idx;
    slot.life = 0;
    slot.maxLife = (2.6 + Math.random() * 2.2) * (0.85 + em.scale * 0.16);
    slot.x = em.position.x + em.directionOut.x * 0.6 + (Math.random() - 0.5) * spread;
    slot.y = em.position.y + 0.8 * em.scale;
    slot.z = em.position.z + em.directionOut.z * 0.6 + (Math.random() - 0.5) * spread;
    slot.vx = em.directionOut.x * 1.1 + (Math.random() - 0.5) * 0.6;
    slot.vy = 2.2 + Math.random() * 2.2;
    slot.vz = em.directionOut.z * 1.1 + (Math.random() - 0.5) * 0.6;
  }

  private spawnEmberFromFire(em: FireEmitterDef): void {
    const slot = this.emberSlots[this.emberCursor];
    this.emberCursor = (this.emberCursor + 1) % this.emberCap;
    slot.active = true;
    slot.emitterIdx = 0;
    slot.life = 0;
    slot.maxLife = 1.4 + Math.random() * 1.4;
    slot.x = em.position.x + (Math.random() - 0.5) * em.scale;
    slot.y = em.position.y + 0.5 * em.scale;
    slot.z = em.position.z + (Math.random() - 0.5) * em.scale;
    slot.vx = em.directionOut.x * 1.5 + (Math.random() - 0.5) * 2.2;
    slot.vy = 2.0 + Math.random() * 2.6;
    slot.vz = em.directionOut.z * 1.5 + (Math.random() - 0.5) * 2.2;
    slot.seed = Math.random() * 4;
  }

  public setQualityScale(scale: number): void {
    this.qualityScale = THREE.MathUtils.clamp(scale, 0.25, 1.35);
    if (this.rainPoints) {
      (this.rainPoints.material as THREE.PointsMaterial).opacity = THREE.MathUtils.clamp(
        0.38 * this.qualityScale,
        0.15,
        0.52
      );
    }
  }

  public update(dt: number, elapsed: number, viewerPos: THREE.Vector3): void {
    // Shifting environmental wind gusts + subtle weather variation
    const gust = 1 + Math.sin(elapsed * 0.42) * 0.45 + Math.cos(elapsed * 0.91) * 0.25;
    this.windVec.set(Math.cos(elapsed * 0.14) * 2.8 * gust, 0, Math.sin(elapsed * 0.19) * 1.6 * gust);
    const rainDamp = 1 - this.rainIntensity * 0.28;

    // Periodic structural flare-ups + falling burning debris chunks from upper floors
    this.flareTimer -= dt;
    this.debrisSpawnTimer -= dt;
    const flareIdx =
      this.flareTimer <= 0 && this.emitters.length > 0
        ? Math.floor((elapsed * 7.3) % this.emitters.length)
        : -1;
    if (this.flareTimer <= 0) this.flareTimer = 3.2 + Math.random() * 3.0;

    for (let i = 0; i < this.emitters.length; i++) {
      const em = this.emitters[i];
      if (em.intensity <= 0.05) continue;
      const dist = em.position.distanceTo(viewerPos);
      // Distance LOD + Graphics Quality scaling
      const spawnChance = (dist < 48 ? 0.92 : dist < 85 ? 0.52 : 0.26) * this.qualityScale;
      const weatherMult = em.isStructural ? 1.0 : rainDamp;

      if (Math.random() < spawnChance * em.intensity * weatherMult) {
        this.spawnFlame(i, em);
        if (em.scale >= 1.5 && dist < 55 && this.qualityScale >= 0.75) this.spawnFlame(i, em);
      }
      if (Math.random() < spawnChance * 0.55 * em.smokeDensity) {
        this.spawnSmoke(i, em);
      }
      if (dist < 62 && Math.random() < 0.32 * em.intensity * weatherMult * this.qualityScale) {
        this.spawnEmberFromFire(em);
      }

      if (i === flareIdx && dist < 85) {
        this.spawnBurst(em.position, false, Math.max(3, Math.round(10 * this.qualityScale)));
      }

      // Dynamic flickering fire illumination on nearby buildings, streets & monsters
      if (em.light && em.baseLightIntensity !== undefined) {
        const flicker =
          0.74 +
          Math.sin(elapsed * 11.4 + i * 2.1) * 0.16 +
          Math.sin(elapsed * 23.7 + i) * 0.1 +
          (i === flareIdx ? 0.45 : 0);
        em.light.intensity = em.baseLightIntensity * flicker * weatherMult;
      }
    }

    // Spawn falling burning debris occasionally from elevated structural emitters
    if (this.debrisSpawnTimer <= 0 && this.emitters.length > 0) {
      this.debrisSpawnTimer = 3.5 + Math.random() * 3.5;
      const highEmitters = this.emitters.filter((e) => e.position.y > 6 && e.position.distanceTo(viewerPos) < 75);
      if (highEmitters.length > 0) {
        const chosen = highEmitters[Math.floor(Math.random() * highEmitters.length)];
        const chunk = this.fallingChunks.find((c) => !c.active);
        if (chunk) {
          chunk.active = true;
          chunk.life = 4.5;
          chunk.mesh.visible = true;
          chunk.mesh.position.copy(chosen.position);
          chunk.vx = chosen.directionOut.x * 2.4 + this.windVec.x * 0.25;
          chunk.vy = -1.2;
          chunk.vz = chosen.directionOut.z * 2.4 + this.windVec.z * 0.25;
        }
      }
    }

    // Damaged electrical spark emitters
    for (let i = 0; i < this.sparkEmitters.length; i++) {
      const sp = this.sparkEmitters[i];
      sp.timer -= dt;
      if (sp.timer <= 0) {
        sp.timer = sp.interval * (0.65 + Math.random() * 0.7);
        if (sp.position.distanceTo(viewerPos) < 42) {
          this.spawnBurst(sp.position, true, 12);
        }
      }
    }

    // Update Flames buffer
    const fPos = this.flameGeo.attributes.position as THREE.BufferAttribute;
    const fCol = this.flameGeo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < this.flameCap; i++) {
      const s = this.flameSlots[i];
      if (!s.active) {
        fPos.setXYZ(i, 0, -200, 0);
        continue;
      }
      s.life += dt;
      const t = s.life / s.maxLife;
      if (t >= 1) {
        s.active = false;
        fPos.setXYZ(i, 0, -200, 0);
        continue;
      }
      s.vx += (this.windVec.x * 0.55 - s.vx * 0.5) * dt;
      s.vz += (this.windVec.z * 0.55 - s.vz * 0.5) * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      fPos.setXYZ(i, s.x, s.y, s.z);
      // White-yellow hot core -> rich orange -> deep red fade
      const fade = 1 - t * t;
      fCol.setXYZ(i, 1.0 * fade, THREE.MathUtils.lerp(0.85, 0.16, t) * fade, THREE.MathUtils.lerp(0.32, 0.02, t) * fade);
    }
    fPos.needsUpdate = true;
    fCol.needsUpdate = true;

    // Update Smoke buffer (Black / Dark Slate / Light Ash)
    const sPos = this.smokeGeo.attributes.position as THREE.BufferAttribute;
    const sCol = this.smokeGeo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < this.smokeCap; i++) {
      const s = this.smokeSlots[i];
      if (!s.active) {
        sPos.setXYZ(i, 0, -200, 0);
        continue;
      }
      s.life += dt;
      const t = s.life / s.maxLife;
      if (t >= 1) {
        s.active = false;
        sPos.setXYZ(i, 0, -200, 0);
        continue;
      }
      // Wind-driven horizontal smoke plume drift
      s.vx += (this.windVec.x * 1.15 - s.vx) * 0.8 * dt;
      s.vz += (this.windVec.z * 1.15 - s.vz) * 0.8 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * (1 - t * 0.35) * dt;
      s.z += s.vz * dt;
      sPos.setXYZ(i, s.x, s.y, s.z);
      // Dark black soot near base -> thick grey -> lighter ash higher up (brighter slightly in rain)
      const shade = THREE.MathUtils.lerp(0.06, 0.24 + this.rainIntensity * 0.12, t) * (1 - Math.pow(t, 2.2));
      sCol.setXYZ(i, shade, shade, shade * 1.06);
    }
    sPos.needsUpdate = true;
    sCol.needsUpdate = true;

    // Update Embers & Electrical Sparks
    const ePos = this.emberGeo.attributes.position as THREE.BufferAttribute;
    const eCol = this.emberGeo.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < this.emberCap; i++) {
      const s = this.emberSlots[i];
      if (!s.active) {
        ePos.setXYZ(i, 0, -200, 0);
        continue;
      }
      s.life += dt;
      const t = s.life / s.maxLife;
      if (t >= 1) {
        s.active = false;
        ePos.setXYZ(i, 0, -200, 0);
        continue;
      }
      const isSpark = s.seed > 50;
      if (isSpark) {
        s.vy -= 12 * dt;
      } else {
        s.vx += (this.windVec.x * 1.35 + Math.sin(elapsed * 6 + s.seed) * 1.8 - s.vx) * dt;
        s.vz += (this.windVec.z * 1.35 + Math.cos(elapsed * 5 + s.seed) * 1.8 - s.vz) * dt;
        s.vy -= 0.4 * dt;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      if (s.y < 0.05) {
        s.y = 0.05;
        s.vy *= -0.35;
      }
      ePos.setXYZ(i, s.x, s.y, s.z);
      const fade = 1 - t;
      if (isSpark) {
        eCol.setXYZ(i, 0.85 * fade, 0.92 * fade, 1.0 * fade);
      } else {
        eCol.setXYZ(i, 1.0 * fade, 0.58 * fade, 0.14 * fade);
      }
    }
    ePos.needsUpdate = true;
    eCol.needsUpdate = true;

    // Update Falling Burning Debris
    for (let i = 0; i < this.fallingChunks.length; i++) {
      const c = this.fallingChunks[i];
      if (!c.active) continue;
      c.life -= dt;
      c.vy -= 14 * dt;
      c.mesh.position.x += c.vx * dt;
      c.mesh.position.y += c.vy * dt;
      c.mesh.position.z += c.vz * dt;
      c.mesh.rotation.x += dt * 4.5;
      c.mesh.rotation.z += dt * 3.1;
      if (c.mesh.position.y <= 0.1) {
        this.spawnBurst(c.mesh.position, false, 8);
        c.active = false;
        c.mesh.visible = false;
      } else if (c.life <= 0) {
        c.active = false;
        c.mesh.visible = false;
      }
    }

    // Update Rain Streaks Slanted with Wind
    if (this.rainPoints && this.rainIntensity > 0.05) {
      const rPos = this.rainPoints.geometry.attributes.position as THREE.BufferAttribute;
      const wx = this.windVec.x * 0.45 * dt;
      const wz = this.windVec.z * 0.45 * dt;
      const fallY = 22 * dt;
      for (let i = 0; i < rPos.count; i++) {
        let rx = rPos.getX(i) + wx;
        let ry = rPos.getY(i) - fallY;
        let rz = rPos.getZ(i) + wz;
        if (ry < 0) {
          ry = 22 + Math.random() * 4;
          rx = viewerPos.x + (Math.random() - 0.5) * 58;
          rz = viewerPos.z + (Math.random() - 0.5) * 68;
        }
        rPos.setXYZ(i, rx, ry, rz);
      }
      rPos.needsUpdate = true;
    }

    // Update Dust Storm Swirling Particles
    if (this.dustPoints) {
      const dPos = this.dustPoints.geometry.attributes.position as THREE.BufferAttribute;
      const wx = this.windVec.x * 0.85 * dt;
      const wz = this.windVec.z * 0.85 * dt;
      for (let i = 0; i < dPos.count; i++) {
        let dx = dPos.getX(i) + wx + (Math.random() - 0.5) * 0.2;
        let dy = dPos.getY(i) + (Math.sin(elapsed + i) * 0.1) * dt;
        let dz = dPos.getZ(i) + wz + (Math.random() - 0.5) * 0.2;
        if (Math.abs(dx - viewerPos.x) > 45) dx = viewerPos.x + (Math.random() - 0.5) * 80;
        if (dy < 0 || dy > 16) dy = Math.random() * 12;
        if (Math.abs(dz - viewerPos.z) > 45) dz = viewerPos.z + (Math.random() - 0.5) * 80;
        dPos.setXYZ(i, dx, dy, dz);
      }
      dPos.needsUpdate = true;
    }

    // Update Ash Storm Falling/Drifting Particles
    if (this.ashPoints) {
      const aPos = this.ashPoints.geometry.attributes.position as THREE.BufferAttribute;
      const wx = this.windVec.x * 0.6 * dt;
      const wz = this.windVec.z * 0.6 * dt;
      const fallY = 1.4 * dt;
      for (let i = 0; i < aPos.count; i++) {
        let ax = aPos.getX(i) + wx + (Math.random() - 0.5) * 0.3;
        let ay = aPos.getY(i) - fallY + Math.sin(elapsed * 2 + i) * 0.05;
        let az = aPos.getZ(i) + wz + (Math.random() - 0.5) * 0.3;
        if (ay < 0) {
          ay = 16 + Math.random() * 4;
          ax = viewerPos.x + (Math.random() - 0.5) * 70;
          az = viewerPos.z + (Math.random() - 0.5) * 70;
        }
        aPos.setXYZ(i, ax, ay, az);
      }
      aPos.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.flameGeo.dispose();
    (this.flamePoints.material as THREE.Material).dispose();
    this.smokeGeo.dispose();
    (this.smokePoints.material as THREE.Material).dispose();
    this.emberGeo.dispose();
    (this.emberPoints.material as THREE.Material).dispose();
    if (this.rainPoints) {
      this.rainPoints.geometry.dispose();
      (this.rainPoints.material as THREE.Material).dispose();
    }
    if (this.dustPoints) {
      this.dustPoints.geometry.dispose();
      (this.dustPoints.material as THREE.Material).dispose();
    }
    if (this.ashPoints) {
      this.ashPoints.geometry.dispose();
      (this.ashPoints.material as THREE.Material).dispose();
    }
    if (this.fallingChunks.length > 0) {
      this.fallingChunks[0].mesh.geometry.dispose();
      (this.fallingChunks[0].mesh.material as THREE.Material).dispose();
    }
  }
}
