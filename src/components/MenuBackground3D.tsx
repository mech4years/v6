import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  createTentaclePhysicsState,
  createTitanforgedNeckState,
  updateMonsterTentacles,
  updateTitanforgedNeckAnimation,
} from '../game/animation';
import { FireEmitterDef, VolumetricFireSystem } from '../game/fireSystem';
import { buildEnemyModel } from '../game/models';
import { createProceduralTextures } from '../game/textures';
import { buildRealisticSkyscraper, createSkyscraperMaterials } from '../game/worldBuilder';

export const MenuBackground3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050406);
    scene.fog = new THREE.FogExp2(0x090507, 0.017);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 200);
    camera.position.set(0, 4.2, 24);
    camera.lookAt(2, 5.5, -24);

    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.36, 0.45, 0.78);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    const textures = createProceduralTextures(renderer);

    const hemi = new THREE.HemisphereLight(0x323b54, 0x1a080c, 0.65);
    const moon = new THREE.DirectionalLight(0x8fa4c4, 0.8);
    moon.position.set(15, 30, 12);
    const redBeacon1 = new THREE.PointLight(0xdc2626, 12, 48, 1.4);
    redBeacon1.position.set(-10, 8, -8);
    const redBeacon2 = new THREE.PointLight(0xef4444, 15, 55, 1.35);
    redBeacon2.position.set(6, 11, -24);
    const monsterRim = new THREE.PointLight(0xff4d4d, 18, 32, 1.3);
    monsterRim.position.set(-2, 7.5, -14);
    scene.add(hemi, moon, redBeacon1, redBeacon2, monsterRim);

    // Wet Ruined Road & Puddle Reflections
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({
        map: textures.asphaltMap,
        normalMap: textures.asphaltNormal,
        normalScale: new THREE.Vector2(1.3, 1.3),
        roughnessMap: textures.asphaltRoughness,
        roughness: 0.92,
        metalness: 0.22,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Destroyed Futuristic Brutalist Skyscrapers (Multi-Floor Flames & Rising Smoke Columns)
    const skyMats = createSkyscraperMaterials(textures);
    const fireEmitters: FireEmitterDef[] = [];
    const towers: [number, number, number, number, number, number, boolean, boolean, boolean][] = [
      [-18, -8, 10, 32, 10, 0.04, false, true, true],
      [19, -12, 11, 38, 11, -0.03, true, true, true],
      [-24, -34, 13, 46, 13, -0.02, true, false, false],
      [25, -38, 14, 52, 14, 0.03, false, true, false],
      [-12, -56, 15, 58, 14, 0.02, true, true, false],
      [14, -62, 16, 62, 16, -0.02, false, false, false],
      [0, -78, 22, 68, 18, 0, true, false, false],
    ];
    towers.forEach(([x, z, tw, th, td, tilt, inf, burning, withLight], idx) => {
      const facingSignX = x < 0 ? 1 : -1;
      const m = buildRealisticSkyscraper(skyMats, tw, th, td, idx + 1, inf, {
        burning,
        worldX: x,
        worldY: -0.2,
        worldZ: z,
        facingSignX,
        fireEmitters,
        scene,
        withLight,
      });
      m.position.set(x, -0.2, z);
      m.rotation.z = tilt;
      scene.add(m);
    });

    // Distant Massive Biomechanical Creature slowly stalking through the burning ruins
    const titan = buildEnemyModel('titanforged', textures);
    titan.group.scale.setScalar(1.22);
    titan.group.position.set(1.5, 0, -21);
    titan.group.rotation.y = Math.PI / 2.2;
    scene.add(titan.group);

    const titanNeckState = createTitanforgedNeckState();
    const titanTentacles = createTentaclePhysicsState(titan);
    const fireSystem = new VolumetricFireSystem(scene, textures, fireEmitters, [], true);
    const camInspectTarget = new THREE.Vector3(0, 3.8, 22);

    let frameId = 0;
    let disposed = false;
    let contextLost = false;
    let lastTime = performance.now();
    let elapsed = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
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

      // Slow ominous Titanforged silhouette stalk with full biomechanical neck & moving tentacles
      titan.group.position.x = 1.5 + ((elapsed * 1.15) % 14);
      titan.legRigs.forEach((leg) => {
        const s = Math.sin(elapsed * 2.2 + leg.phaseOffset);
        leg.hip.rotation.x = leg.baseHipX + s * 0.36;
        leg.knee.rotation.x = leg.baseKneeX + Math.max(0, -s) * 0.48;
      });
      titan.armRigs.forEach((arm) => {
        const s = Math.sin(elapsed * 2.2 + arm.phaseOffset);
        arm.shoulder.rotation.x = arm.baseShoulderX + s * 0.25;
        arm.elbow.rotation.x = arm.baseElbowX + Math.cos(elapsed * 2.2 + arm.phaseOffset) * 0.18;
      });
      if (titan.torsoPulse) {
        const br = 1 + Math.sin(elapsed * 2.1) * 0.025;
        titan.torsoPulse.scale.set(br, 1, br);
      }

      updateTitanforgedNeckAnimation(titan, titanNeckState, {
        dt,
        time: elapsed,
        ownerPos: titan.group.position,
        ownerYaw: titan.group.rotation.y,
        targetPos: camInspectTarget,
        lastKnownPos: camInspectTarget,
        targetOccluded: false,
        aiState: 'SEARCH',
        hollowExposed: false,
        bossPhase: 1,
      });

      updateMonsterTentacles(titan, titanTentacles, {
        dt,
        time: elapsed,
        enemyType: 'titanforged',
        aiState: 'CHASE',
        moveSpeed: 1.4,
        turnRate: 0,
        distToCam: 45,
      });

      // Red emergency pulse
      redBeacon1.intensity = 7 + Math.sin(elapsed * 3.8) * 3.5;
      redBeacon2.intensity = 9 + Math.cos(elapsed * 2.4) * 3.5;

      // Subtle camera breathing sway
      camera.position.x = Math.sin(elapsed * 0.25) * 1.2;
      camera.position.y = 4.2 + Math.cos(elapsed * 0.35) * 0.25;
      camera.lookAt(2, 5.4, -26);

      // Update multi-floor building flames, rising smoke plumes, embers & rain
      fireSystem.update(dt, elapsed, camera.position);

      if (!contextLost) {
        if (!isSoftwareGl && composer) composer.render();
        else renderer.render(scene, camera);
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
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
    };
    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    if (!isSoftwareGl) renderer.compile(scene, camera);
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      textures.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
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
  }, []);

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
};
