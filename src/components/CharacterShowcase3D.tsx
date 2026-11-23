import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CHARACTERS } from '../game/data';
import { buildFullBodyCharacter, FullBodyCharacterRig } from '../game/models';
import { createProceduralTextures, ProceduralTextureSet } from '../game/textures';
import { CharacterId } from '../game/types';

interface Props {
  characterId: CharacterId;
  cameraMode?: 'full' | 'face';
}

export const CharacterShowcase3D: React.FC<Props> = ({ characterId, cameraMode = 'full' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const texturesRef = useRef<ProceduralTextureSet | null>(null);
  const charGroupRef = useRef<THREE.Group | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);
  const pedRingMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const cameraModeRef = useRef<'full' | 'face'>(cameraMode);
  const charIdRef = useRef<CharacterId>(characterId);
  const swapPulseRef = useRef(0);
  const dragYawRef = useRef(0.35);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);

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
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    const w = container.clientWidth || 500;
    const h = container.clientHeight || 560;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = !isSoftwareGl;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090d);
    scene.fog = new THREE.FogExp2(0x07090d, 0.08);
    sceneRef.current = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 50);
    camera.position.set(0, 1.38, 3.8);
    camera.lookAt(0, 1.05, 0);

    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.3, 0.4, 0.8);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    const textures = createProceduralTextures(renderer);
    texturesRef.current = textures;

    // 3-Point Studio Rig
    const hemi = new THREE.HemisphereLight(0x64748b, 0x1f2430, 0.9);
    const keyLight = new THREE.DirectionalLight(0xfff1e6, 1.9);
    keyLight.position.set(3, 4.5, 4);
    keyLight.castShadow = !isSoftwareGl;
    const fillLight = new THREE.PointLight(0x94a3b8, 3.6, 10, 1.4);
    fillLight.position.set(-1.6, 1.2, 3.4);
    const rimLight = new THREE.PointLight(0xef4444, 8.5, 12, 1.6);
    rimLight.position.set(-2.2, 2.2, -2.0);
    rimLightRef.current = rimLight;
    scene.add(hemi, keyLight, fillLight, rimLight);

    // Armored Turntable Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.18, 0.16, 32),
      new THREE.MeshStandardMaterial({
        color: 0x181b21,
        map: textures.metalPlateMap,
        normalMap: textures.metalNormal,
        normalScale: new THREE.Vector2(1.1, 1.1),
        roughnessMap: textures.metalRoughness,
        metalnessMap: textures.metalMetalness,
        metalness: 0.85,
        roughness: 0.36,
      })
    );
    pedestal.position.y = -0.08;
    pedestal.receiveShadow = true;
    const pedRingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(CHARACTERS[characterId].visorColor) });
    pedRingMatRef.current = pedRingMat;
    const pedRing = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.02, 8, 40), pedRingMat);
    pedRing.rotation.x = Math.PI / 2;
    pedRing.position.y = 0.01;
    scene.add(pedestal, pedRing);

    // Build initial character
    const initialGroup = buildFullBodyCharacter(characterId, textures);
    scene.add(initialGroup);
    charGroupRef.current = initialGroup;
    if (rimLightRef.current) {
      rimLightRef.current.color.set(CHARACTERS[characterId].visorColor);
    }

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

    const camLookTarget = new THREE.Vector3(0, 1.05, 0);
    const desiredCamPos = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      if (!isDraggingRef.current) {
        dragYawRef.current += dt * (cameraModeRef.current === 'face' ? 0.16 : 0.42);
      }
      if (charGroupRef.current) {
        charGroupRef.current.rotation.y = dragYawRef.current;
        charGroupRef.current.position.y = Math.sin(elapsed * 2.0) * 0.012;

        const rig = charGroupRef.current.userData.rig as FullBodyCharacterRig | undefined;
        if (rig) {
          const breath = Math.sin(elapsed * 2.3);
          rig.torsoGroup.scale.y = 1 + breath * 0.014;
          rig.leftArmGroup.rotation.x = -0.18 + breath * 0.03;
          rig.rightArmGroup.rotation.x = -0.35 + breath * 0.025;
          rig.headGroup.rotation.y = Math.sin(elapsed * 0.9) * 0.07;
          rig.headGroup.rotation.x = Math.sin(elapsed * 1.4) * 0.03;
        }
      }

      if (swapPulseRef.current > 0) {
        swapPulseRef.current = Math.max(0, swapPulseRef.current - dt * 2.5);
      }
      if (rimLightRef.current) {
        rimLightRef.current.intensity = 8.5 + swapPulseRef.current * 6.0;
      }

      const cid = charIdRef.current;
      const hScale = cid === 'titan' || cid === 'brute' ? 1.12 : cid === 'ghost' || cid === 'phantom' ? 0.98 : 1.0;
      if (cameraModeRef.current === 'face') {
        desiredCamPos.set(0.05, 1.69 * hScale, 1.08);
        desiredLook.set(0, 1.65 * hScale, 0);
      } else {
        desiredCamPos.set(0, 1.38, 3.8);
        desiredLook.set(0, 1.05, 0);
      }
      camera.position.lerp(desiredCamPos, Math.min(1, dt * 7.5));
      camLookTarget.lerp(desiredLook, Math.min(1, dt * 7.5));
      camera.lookAt(camLookTarget);

      if (!contextLost) {
        if (!isSoftwareGl && composer) composer.render();
        else renderer.render(scene, camera);
      }
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastXRef.current = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      dragYawRef.current += dx * 0.012;
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
    };
    const onResize = () => {
      const nw = container.clientWidth || 500;
      const nh = container.clientHeight || 560;
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

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('webglcontextlost', onContextLost);
    dom.addEventListener('webglcontextrestored', onContextRestored);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onResize);

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('webglcontextlost', onContextLost);
      dom.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      textures.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      composer?.dispose();
      renderer.dispose();
      if (dom.parentElement === container) container.removeChild(dom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  // Swap full-body 3D character mesh when user selects a different operative
  useEffect(() => {
    charIdRef.current = characterId;
    const scene = sceneRef.current;
    const textures = texturesRef.current;
    if (!scene || !textures) return;

    if (charGroupRef.current) {
      scene.remove(charGroupRef.current);
      charGroupRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const nextGroup = buildFullBodyCharacter(characterId, textures);
    nextGroup.rotation.y = dragYawRef.current;
    scene.add(nextGroup);
    charGroupRef.current = nextGroup;
    swapPulseRef.current = 1;

    if (rimLightRef.current) {
      rimLightRef.current.color.set(CHARACTERS[characterId].visorColor);
    }
    if (pedRingMatRef.current) {
      pedRingMatRef.current.color.set(CHARACTERS[characterId].visorColor);
    }
  }, [characterId]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[380px] cursor-grab active:cursor-grabbing relative"
      title="Drag to rotate 3D operative model"
    />
  );
};
