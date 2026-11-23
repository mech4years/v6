import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FastForward } from 'lucide-react';
import { HorrorAudioEngine } from '../game/audio';
import { CHARACTERS } from '../game/data';
import {
  buildAutomatedTurret,
  buildEnemyModel,
  buildFullBodyCharacter,
  buildHealingBeacon,
  FullBodyCharacterRig,
} from '../game/models';
import { getOperativeIntroSpec } from '../game/operativeIntros';
import { createProceduralTextures } from '../game/textures';
import { CharacterId } from '../game/types';

interface Props {
  characterId: CharacterId;
  audio: HorrorAudioEngine;
  onComplete: () => void;
  onSkip: () => void;
}

const _camPos = new THREE.Vector3();
const _lookAt = new THREE.Vector3();

export const OperativeIntroCutscene: React.FC<Props> = ({
  characterId,
  audio,
  onComplete,
  onSkip,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const spec = getOperativeIntroSpec(characterId);
  const charDef = CHARACTERS[characterId];
  const [caption, setCaption] = useState(spec.beats[0]?.caption ?? '');
  const [showTitleCard, setShowTitleCard] = useState(false);
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        if (!doneRef.current) {
          doneRef.current = true;
          onSkip();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onSkip]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    doneRef.current = false;
    audio.unlock();
    audio.setCutsceneDrone(
      spec.environmentKind === 'hospital'
        ? 'lab'
        : spec.environmentKind === 'hangar'
          ? 'apc'
          : spec.environmentKind === 'skyscraper'
            ? 'ruins'
            : 'normal'
    );
    audio.playOperativeIntroCue(characterId);

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = !isSoftwareGl;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(spec.fogColor);
    scene.fog = new THREE.FogExp2(spec.fogColor, 0.052);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
    scene.environmentIntensity = 0.35;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 80);

    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.35, 0.45, 0.78);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    const textures = createProceduralTextures(renderer);

    // Cinematic Lighting Rig
    const hemi = new THREE.HemisphereLight(0x475569, 0x090b10, 0.65);
    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.2);
    keyLight.position.set(3.2, 5.4, 3.8);
    keyLight.castShadow = !isSoftwareGl;
    const rimLight = new THREE.PointLight(spec.accentHex, 9.5, 16, 1.5);
    rimLight.position.set(-2.4, 2.4, -2.6);
    const fillLight = new THREE.PointLight(0x64748b, 3.2, 12, 1.5);
    fillLight.position.set(2.4, 1.6, 2.5);
    scene.add(hemi, keyLight, rimLight, fillLight);

    // Ground & Atmospheric Set Pieces tailored by environmentKind
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x161920,
      map: textures.metalPlateMap,
      normalMap: textures.metalNormal,
      roughness: 0.48,
      metalness: 0.55,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x101218,
      map: textures.concreteMap,
      normalMap: textures.concreteNormal,
      roughness: 0.78,
      metalness: 0.25,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Build Hero Character
    const hero = buildFullBodyCharacter(characterId, textures);
    const rig = hero.userData.rig as FullBodyCharacterRig | undefined;
    scene.add(hero);

    // Prop references for dynamic environmental storytelling
    let turretRefs: ReturnType<typeof buildAutomatedTurret> | null = null;
    let hospitalLight: THREE.PointLight | null = null;
    let skyscraperPack: THREE.Group[] = [];

    if (spec.environmentKind === 'armory') {
      // Weapon racks & dark bunker walls
      for (let s = -1; s <= 1; s += 2) {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.6, 5.2), wallMat);
        rack.position.set(s * 2.6, 1.3, -0.8);
        const strip = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.08, 4.4),
          new THREE.MeshBasicMaterial({ color: spec.accentHex })
        );
        strip.position.set(s * 2.34, 2.25, -0.8);
        scene.add(rack, strip);
      }
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.72, 0.8), floorMat);
      crate.position.set(0.85, 0.36, 0.55);
      scene.add(crate);
    } else if (spec.environmentKind === 'skyscraper') {
      // Elevated rooftop parapet overlooking ruined towers & silhouettes of infected below
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(8, 0.78, 0.45), wallMat);
      parapet.position.set(0, 0.39, -1.35);
      scene.add(parapet);
      for (let b = -3; b <= 3; b++) {
        if (b === 0) continue;
        const spire = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8 + Math.abs(b) * 2.5, 2.4), wallMat);
        spire.position.set(b * 3.8, -5, -9 - Math.abs(b) * 2.2);
        scene.add(spire);
      }
      // Distant quarantine street silhouettes
      for (let e = 0; e < 3; e++) {
        const mob = buildEnemyModel(e === 0 ? 'stalker' : 'crawler', textures);
        mob.group.position.set(-2.4 + e * 2.2, -3.2, -6.2);
        mob.group.scale.setScalar(0.85);
        scene.add(mob.group);
        skyscraperPack.push(mob.group);
      }
    } else if (spec.environmentKind === 'hangar') {
      // Heavy deployment APC + hangar ribs
      const apcBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 5.2), wallMat);
      apcBody.position.set(2.4, 1.05, -3.8);
      const apcHeadlight = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.18, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xfde68a })
      );
      apcHeadlight.position.set(1.75, 1.15, -1.18);
      scene.add(apcBody, apcHeadlight);
      for (let r = -2; r <= 2; r++) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.35, 0.35), floorMat);
        rib.position.set(0, 4.4, r * 2.4);
        scene.add(rib);
      }
    } else if (spec.environmentKind === 'hospital') {
      // Field hospital gurney, medical table & flickering surgical lamp
      const table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 0.78), floorMat);
      table.position.set(-0.78, 0.425, 0.45);
      const beacon = buildHealingBeacon();
      beacon.position.set(-0.78, 0.85, 0.45);
      beacon.scale.setScalar(0.7);
      hospitalLight = new THREE.PointLight(0x34d399, 5.5, 11, 1.5);
      hospitalLight.position.set(0, 2.9, 0.5);
      scene.add(table, beacon, hospitalLight);
    } else if (spec.environmentKind === 'corridor') {
      for (let z = -6; z <= 4; z += 2.2) {
        const frame = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.14, 6, 16, Math.PI), floorMat);
        frame.position.set(0, 0.5, z);
        scene.add(frame);
      }
    } else if (spec.environmentKind === 'workshop') {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.82, 0.85), floorMat);
      bench.position.set(0.95, 0.41, 0.55);
      turretRefs = buildAutomatedTurret(textures);
      turretRefs.root.position.set(0.92, 0.82, 0.55);
      turretRefs.root.rotation.y = -0.35;
      scene.add(bench, turretRefs.root);
    } else {
      // highway barricade
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 0.5), wallMat);
      barrier.position.set(0, 0.45, -1.6);
      const flare = new THREE.PointLight(0xfacc15, 6.0, 12, 1.6);
      flare.position.set(-1.3, 0.4, -1.1);
      scene.add(barrier, flare);
    }

    // Subtle floating dust particles (pre-allocated Points)
    const dustCount = isSoftwareGl ? 60 : 150;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 9;
      dustPos[i * 3 + 1] = 0.2 + Math.random() * 3.5;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: spec.accentHex,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
    });
    const dustPts = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPts);

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;
    const firedCues = new Set<number>();

    const triggerCue = (cue?: string) => {
      if (!cue) return;
      if (cue === 'reload') audio.playReload();
      else if (cue === 'footstep') audio.playFootstep(false, false);
      else if (cue === 'turret') audio.playAbility('turret');
      else if (cue === 'stealth') audio.playAbility('veil');
      else if (cue === 'medic') audio.playMedicHeal();
      else if (cue === 'gunshot') audio.playTurretShot();
      else if (cue === 'ability') audio.playAbility('overdrive');
    };

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) frameId = window.setTimeout(poll, 5);
        else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 60);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      const t = elapsed;
      const p = Math.min(1, t / spec.durationSec);
      setProgress(p);

      // Update beat captions & SFX
      let activeBeatText = spec.beats[0]?.caption ?? '';
      spec.beats.forEach((b, idx) => {
        if (t >= b.atSec) {
          activeBeatText = b.caption;
          if (!firedCues.has(idx)) {
            firedCues.add(idx);
            triggerCue(b.cue);
          }
        }
      });
      setCaption(activeBeatText);
      if (p >= 0.68) setShowTitleCard(true);

      // Idle breathing & environment animations
      if (rig) {
        rig.torsoGroup.position.y = 0.98 + Math.sin(t * 2.2) * 0.012;
      }
      dustPts.rotation.y += dt * 0.06;

      // Tailored Cinematic Camera + Operative Animation Choreography
      if (characterId === 'reaper' || characterId === 'raven') {
        // Slowly approach dark armory -> rifle inspection -> reload dip -> close face/equipment focus
        _camPos.set(
          THREE.MathUtils.lerp(1.4, -0.35, p),
          THREE.MathUtils.lerp(1.35, 1.66, p),
          THREE.MathUtils.lerp(4.4, 1.35, p)
        );
        _lookAt.set(0, THREE.MathUtils.lerp(1.2, 1.62, p), 0);
        if (rig) {
          const reloadArc = Math.sin(Math.max(0, Math.min(1, (p - 0.25) / 0.35)) * Math.PI);
          rig.weaponGroup.rotation.x = 0.12 - reloadArc * 0.45;
          rig.leftArmGroup.rotation.x = -reloadArc * 0.55;
          rig.headGroup.rotation.y = THREE.MathUtils.lerp(-0.22, 0.08, p);
        }
      } else if (characterId === 'ghost') {
        // Starts high peering over ruined parapet -> slowly lowers sniper -> sweeps to full model reveal
        _camPos.set(
          THREE.MathUtils.lerp(-0.85, 1.35, p),
          THREE.MathUtils.lerp(1.75, 1.32, p),
          THREE.MathUtils.lerp(-0.4, 2.75, p)
        );
        _lookAt.set(0, THREE.MathUtils.lerp(1.55, 1.15, p), THREE.MathUtils.lerp(-2.5, 0, p));
        if (rig) {
          const lowerT = Math.min(1, Math.max(0, (p - 0.45) / 0.35));
          rig.weaponGroup.position.y = THREE.MathUtils.lerp(0.38, 0.18, lowerT);
          rig.weaponGroup.rotation.x = THREE.MathUtils.lerp(-0.18, 0.22, lowerT);
          rig.headGroup.rotation.x = THREE.MathUtils.lerp(0.18, 0, lowerT);
        }
        skyscraperPack.forEach((mob, idx) => {
          mob.position.x += Math.sin(t * 0.9 + idx) * dt * 0.45;
        });
      } else if (characterId === 'titan' || characterId === 'brute') {
        // Heavy steps echoing in hangar -> hefts heavy MG -> strides toward APC
        const walkProgress = Math.max(0, (p - 0.45) / 0.55);
        hero.position.z = THREE.MathUtils.lerp(0.8, -1.4, walkProgress);
        hero.position.x = THREE.MathUtils.lerp(0, 0.9, walkProgress);
        _camPos.set(
          THREE.MathUtils.lerp(-1.8, -0.5, p),
          THREE.MathUtils.lerp(1.1, 1.45, p),
          THREE.MathUtils.lerp(3.2, 2.4, p)
        );
        _lookAt.copy(hero.position).add(new THREE.Vector3(0, 1.35, 0));
        if (rig) {
          const stride = walkProgress > 0 ? Math.sin(t * 5.2) * 0.42 : 0;
          rig.leftLegGroup.rotation.x = stride;
          rig.rightLegGroup.rotation.x = -stride;
        }
      } else if (characterId === 'patch') {
        // Field hospital flickering light -> sorting medical pack -> looking up at camera
        if (hospitalLight) {
          hospitalLight.intensity = Math.sin(t * 24) > 0.72 ? 2.2 : 5.8;
        }
        _camPos.set(THREE.MathUtils.lerp(-1.6, 0.55, p), THREE.MathUtils.lerp(1.4, 1.6, p), THREE.MathUtils.lerp(2.6, 1.5, p));
        _lookAt.set(-0.2 * (1 - p), 1.42, 0.1);
        if (rig) {
          rig.leftArmGroup.rotation.x = -0.35 + Math.sin(t * 4) * 0.12;
          rig.headGroup.rotation.y = THREE.MathUtils.lerp(-0.4, 0.12, p);
        }
      } else if (characterId === 'phantom') {
        // Emerges from corridor shadow -> fades invisible -> camera whips -> reappears behind!
        const cloakFade = p > 0.42 && p < 0.74 ? Math.max(0.06, 1 - Math.abs(p - 0.58) * 6.5) : 1.0;
        if (rig) {
          rig.stealthMaterials.forEach((m) => {
            m.transparent = cloakFade < 0.98;
            m.opacity = cloakFade;
          });
          rig.visorMat.emissiveIntensity = cloakFade < 0.5 ? 0.3 : 2.5;
        }
        if (p < 0.65) {
          hero.position.set(0, 0, THREE.MathUtils.lerp(-2.5, 0, p / 0.65));
          _camPos.set(0.4, 1.45, 2.5);
          _lookAt.set(0, 1.38, hero.position.z);
        } else {
          hero.position.set(0.15, 0, 2.15);
          hero.rotation.y = Math.PI;
          _camPos.set(0.4, 1.52, 0.4);
          _lookAt.set(0.15, 1.56, 2.15);
        }
      } else if (characterId === 'engineer' || characterId === 'nyx') {
        // Working on automated turret -> turret comes alive & fires test rounds
        hero.position.set(-0.25, 0, 0.2);
        hero.rotation.y = 0.55;
        _camPos.set(THREE.MathUtils.lerp(2.2, 0.1, p), 1.48, THREE.MathUtils.lerp(2.7, 2.2, p));
        _lookAt.set(0.35, 1.25, 0.35);
        if (turretRefs) {
          const activeT = Math.max(0, (p - 0.45) / 0.55);
          turretRefs.headPivot.rotation.y = Math.sin(t * 3.5) * 0.45 * activeT;
          turretRefs.muzzleFlash.visible = p > 0.58 && p < 0.72 && Math.sin(t * 48) > 0.3;
        }
      } else {
        // WANDERER / ZERO
        _camPos.set(THREE.MathUtils.lerp(-1.5, 0.65, p), 1.42, THREE.MathUtils.lerp(3.2, 1.65, p));
        _lookAt.set(0, 1.38, 0);
        if (rig) {
          rig.weaponGroup.rotation.x = 0.12 + Math.sin(t * 3.5) * 0.08;
        }
      }

      camera.position.copy(_camPos);
      camera.lookAt(_lookAt);

      if (!isSoftwareGl && composer) composer.render();
      else renderer.render(scene, camera);

      if (p >= 1) {
        if (!doneRef.current) {
          doneRef.current = true;
          onComplete();
        }
        return;
      }

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    const onResize = () => {
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      composer?.setSize(nw, nh);
      bloomPass?.resolution.set(nw, nh);
    };
    window.addEventListener('resize', onResize);

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      textures.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [characterId, audio, onComplete, spec]);

  return (
    <div className="fixed inset-0 z-50 bg-black select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Classification Strip & Skip Button */}
      <div className="fixed top-0 inset-x-0 p-5 sm:p-8 flex items-start justify-between pointer-events-none">
        <div>
          <div className="text-[11px] font-mono-tech tracking-[0.28em] text-zinc-400">
            OPERATIVE BRIEFING // YEAR 3062 AD
          </div>
          <div
            className="font-display text-lg sm:text-xl font-bold tracking-wider mt-0.5"
            style={{ color: charDef.ability.accentColor }}
          >
            {charDef.callsign}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!doneRef.current) {
              doneRef.current = true;
              onSkip();
            }
          }}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-[#0b0d12] hover:bg-red-900/80 border border-zinc-700 hover:border-red-500 text-xs font-mono-tech text-zinc-100 tracking-wider cursor-pointer transition-colors"
        >
          <span>SKIP INTRO [SPACE]</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dramatic Operative Name & Classification Reveal */}
      {showTitleCard && (
        <div className="fixed inset-x-0 top-1/4 flex flex-col items-center text-center pointer-events-none px-6 animate-fade-in">
          <div className="bg-black/75 border-y border-zinc-700/80 px-8 py-4 max-w-2xl">
            <div className="text-[11px] font-mono-tech tracking-[0.35em] text-zinc-400">
              OPERATIVE DESIGNATION
            </div>
            <h1
              className="font-display text-2xl sm:text-4xl font-bold tracking-[0.18em] mt-1"
              style={{ color: charDef.ability.accentColor }}
            >
              {spec.classification}
            </h1>
          </div>
        </div>
      )}

      {/* Bottom Cinematic Letterbox & Caption */}
      <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-10 pb-6 px-6 sm:px-12 pointer-events-none">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="font-sans text-sm sm:text-base text-zinc-100 tracking-wide">
            {caption}
          </p>
          <div className="w-full h-1 bg-zinc-900 overflow-hidden">
            <div
              className="h-full transition-[width] duration-75"
              style={{
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: charDef.ability.accentColor,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
