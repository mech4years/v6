import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Camera, HeartPulse, Maximize2, Shield, VideoOff, X } from 'lucide-react';
import { CHARACTERS } from '../game/data';
import { computeLubDubPulse } from '../game/heartbeatCurve';
import { buildFullBodyCharacter } from '../game/models';
import { createProceduralTextures, ProceduralTextureSet } from '../game/textures';
import { CharacterId, HudSnapshot } from '../game/types';

interface Props {
  characterId: CharacterId;
  hud: HudSnapshot;
  compact?: boolean;
  reducedMotion?: boolean;
  onOpenFullTab?: () => void;
  onClose?: () => void;
}

export const OperativeFaceCam3D: React.FC<Props> = ({
  characterId,
  hud,
  compact = false,
  reducedMotion = false,
  onOpenFullTab,
  onClose,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pulseOverlayRef = useRef<HTMLDivElement>(null);

  const [camMode, setCamMode] = useState<'visor3d' | 'webcam'>('visor3d');
  const [camError, setCamError] = useState<string | null>(null);
  const [camLoading, setCamLoading] = useState(false);

  const hudRef = useRef(hud);
  hudRef.current = hud;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const charDef = CHARACTERS[characterId];
  const stressCritical = hud.health <= 30 || hud.heartbeatIntensity >= 0.7;
  const stressElevated = !stressCritical && (hud.health <= 60 || hud.heartbeatIntensity >= 0.3);

  const feedStatus =
    hud.health <= 0
      ? 'SIGNAL FLATLINE'
      : stressCritical
        ? 'CRITICAL STRESS'
        : stressElevated
          ? 'ELEVATED BPM'
          : 'BIOLINK NOMINAL';

  // Sync visual red stress pulse inside the cam bezel when in webcam mode or reduced motion
  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      const el = pulseOverlayRef.current;
      if (el) {
        const h = hudRef.current;
        const pulse = reducedMotionRef.current
          ? h.heartbeatIntensity * 0.35
          : computeLubDubPulse(
              performance.now(),
              h.lastHeartbeatAt,
              h.heartbeatBpm,
              h.heartbeatIntensity
            );
        const dmg = Math.min(1, h.damageFlash);
        const alpha = Math.min(0.65, pulse * 0.34 + dmg * 0.45);
        el.style.opacity = String(alpha);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Optional opt-in physical camera stream
  useEffect(() => {
    if (camMode !== 'webcam') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;
    setCamLoading(true);
    setCamError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamLoading(false);
      setCamError('Camera API unavailable in this browser context.');
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCamLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setCamLoading(false);
        setCamError(
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Camera permission denied. Using Tactical 3D Visor.'
            : 'No optical camera detected. Using Tactical 3D Visor.'
        );
      });

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [camMode]);

  // 3D Tactical Helmet / Bust Cam Renderer
  useEffect(() => {
    if (camMode !== 'visor3d') return;
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const w = Math.max(120, container.clientWidth);
    const h = Math.max(120, container.clientHeight);
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const glCtx = renderer.getContext();
    const dbgInfo = glCtx.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbgInfo ? String(glCtx.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL)) : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|Software Rasterizer/i.test(rendererStr);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070b);
    scene.fog = new THREE.FogExp2(0x05070b, 0.28);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(compact ? 32 : 30, w / h, 0.1, 20);

    const hemi = new THREE.HemisphereLight(0x88a8c8, 0x101318, 0.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xeef6ff, 1.9);
    keyLight.position.set(1.2, 2.5, 2.2);
    scene.add(keyLight);

    const rimColor = new THREE.Color(charDef.visorColor);
    const rimLight = new THREE.PointLight(rimColor, 1.8, 5);
    rimLight.position.set(-0.9, 1.95, -0.75);
    scene.add(rimLight);

    const alertLight = new THREE.PointLight(0xef4444, 0, 4);
    alertLight.position.set(0.65, 1.75, 1.15);
    scene.add(alertLight);

    let textures: ProceduralTextureSet | null = createProceduralTextures(renderer);
    const operative = buildFullBodyCharacter(characterId, textures);
    const heightScale = characterId === 'brute' ? 1.12 : characterId === 'ghost' ? 0.98 : 1.0;
    const headY = 1.7 * heightScale;
    operative.rotation.y = -0.22;
    scene.add(operative);

    camera.position.set(0.1, headY + 0.01, compact ? 0.92 : 1.02);
    camera.lookAt(0, headY - 0.03, 0);

    let frameId = 0;
    const startMs = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
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

    const animate = () => {
      if (disposed) return;
      const now = performance.now();
      const t = (now - startMs) * 0.001;
      const snap = hudRef.current;

      const pulse = reducedMotionRef.current
        ? snap.heartbeatIntensity * 0.25
        : computeLubDubPulse(now, snap.lastHeartbeatAt, snap.heartbeatBpm, snap.heartbeatIntensity);

      const dmgRecoil = Math.min(1, snap.damageFlash);
      const breathSpeed = 1.4 + snap.heartbeatIntensity * 2.1;
      const breathAmp = reducedMotionRef.current ? 0.002 : 0.007 + snap.heartbeatIntensity * 0.006;

      operative.position.y = Math.sin(t * breathSpeed) * breathAmp;
      operative.rotation.y =
        -0.22 +
        (reducedMotionRef.current ? 0 : Math.sin(t * 0.72) * 0.14) +
        dmgRecoil * 0.18;
      operative.rotation.x =
        (reducedMotionRef.current ? 0 : Math.sin(t * 1.1) * 0.02) - dmgRecoil * 0.14;
      operative.rotation.z = dmgRecoil * -0.09;

      alertLight.intensity = pulse * 3.2 + dmgRecoil * 4.2;
      rimLight.intensity = 1.5 + pulse * 0.9;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    };

    animate();

    const ro = new ResizeObserver(() => {
      if (!container || disposed) return;
      const nw = Math.max(120, container.clientWidth);
      const nh = Math.max(120, container.clientHeight);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    return () => {
      disposed = true;
      ro.disconnect();
      if (isSoftwareGl) clearTimeout(frameId);
      else cancelAnimationFrame(frameId);

      operative.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      if (textures) {
        Object.values(textures).forEach((tex) => {
          if (tex && typeof (tex as THREE.Texture).dispose === 'function') {
            (tex as THREE.Texture).dispose();
          }
        });
        textures = null;
      }
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [camMode, characterId, charDef.visorColor, compact]);

  return (
    <div
      className={`relative bg-[#05070b] border overflow-hidden select-none ${
        stressCritical
          ? 'border-red-500/80'
          : stressElevated
            ? 'border-amber-500/60'
            : 'border-zinc-700/80'
      } ${compact ? 'w-48 sm:w-52' : 'w-full'}`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#090c12] border-b border-zinc-800/90 text-[10px] font-mono-tech">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              hud.health <= 0
                ? 'bg-zinc-500'
                : stressCritical
                  ? 'bg-red-500'
                  : stressElevated
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
            }`}
          />
          <span className="text-zinc-100 font-semibold truncate">{charDef.callsign} CAM</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setCamMode((m) => (m === 'visor3d' ? 'webcam' : 'visor3d'))}
            title={camMode === 'visor3d' ? 'Switch to Live Camera Feed' : 'Switch to 3D Visor Feed'}
            className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[9px] text-zinc-200 flex items-center gap-1 cursor-pointer"
          >
            <Camera className="w-2.5 h-2.5 text-sky-400" />
            <span>{camMode === 'visor3d' ? 'LIVE CAM' : '3D VISOR'}</span>
          </button>
          {compact && onOpenFullTab && (
            <button
              type="button"
              onClick={onOpenFullTab}
              title="Open Face Cam Tab"
              className="p-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 cursor-pointer"
            >
              <Maximize2 className="w-2.5 h-2.5" />
            </button>
          )}
          {compact && onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Hide Face Cam"
              className="p-0.5 bg-zinc-900 hover:bg-red-950 border border-zinc-700 text-zinc-300 cursor-pointer"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Optical Feed Viewport */}
      <div className={`relative w-full bg-[#05070b] ${compact ? 'h-32 sm:h-36' : 'h-64 sm:h-72'}`}>
        {camMode === 'visor3d' ? (
          <div ref={mountRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center bg-[#04060a]">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full h-full object-cover scale-x-[-1] ${camError ? 'hidden' : 'block'}`}
            />
            {camLoading && (
              <span className="text-[11px] font-mono-tech text-sky-300">
                INITIALIZING OPTICAL SENSOR...
              </span>
            )}
            {camError && (
              <div className="px-3 text-center space-y-2">
                <VideoOff className="w-5 h-5 text-amber-400 mx-auto" />
                <p className="text-[11px] font-mono-tech text-zinc-300">{camError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCamError(null);
                    setCamMode('visor3d');
                  }}
                  className="px-2.5 py-1 bg-zinc-900 border border-zinc-600 text-[10px] font-mono-tech text-zinc-100 cursor-pointer"
                >
                  RETURN TO 3D VISOR
                </button>
              </div>
            )}
          </div>
        )}

        {/* Synced cardiac pulse perimeter flash */}
        <div
          ref={pulseOverlayRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0,
            boxShadow: 'inset 0 0 36px 8px rgba(220, 38, 38, 0.85)',
          }}
        />

        {/* Corner targeting brackets */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-sky-400/70 pointer-events-none" />
        <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-sky-400/70 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-sky-400/70 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-sky-400/70 pointer-events-none" />

        {/* Status label */}
        <div className="absolute top-2 left-3 text-[9px] font-mono-tech tracking-wider pointer-events-none">
          <span
            className={`px-1 py-0.5 bg-black/75 border ${
              stressCritical
                ? 'border-red-500/70 text-red-300'
                : stressElevated
                  ? 'border-amber-500/70 text-amber-300'
                  : 'border-emerald-500/50 text-emerald-300'
            }`}
          >
            {feedStatus}
          </span>
        </div>
      </div>

      {/* Bottom Biometric Readout */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#090c12] border-t border-zinc-800/90 text-[10px] font-mono-tech tabular-nums">
        <span className="flex items-center gap-1 text-zinc-200">
          <HeartPulse
            className={`w-3 h-3 ${
              stressCritical ? 'text-red-400' : stressElevated ? 'text-amber-400' : 'text-emerald-400'
            }`}
          />
          <span>{hud.heartbeatBpm} BPM</span>
        </span>
        <span className="flex items-center gap-1 text-zinc-300">
          <Shield className="w-3 h-3 text-sky-400" />
          <span>SUIT {hud.suitIntegrity}%</span>
        </span>
      </div>
    </div>
  );
};
