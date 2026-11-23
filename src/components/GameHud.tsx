import React, { useEffect, useRef } from 'react';
import {
  Activity,
  BookOpen,
  Camera,
  Flashlight,
  HeartPulse,
  Pause,
  Radio,
  Shield,
  User,
  Volume2,
  Zap,
} from 'lucide-react';
import { CHARACTERS, WEAPONS, normalizeCharacterId } from '../game/data';
import { computeLubDubPulse } from '../game/heartbeatCurve';
import {
  ArmourPieceId,
  CharacterId,
  GameSettings,
  HudSnapshot,
  TouchAction,
} from '../game/types';
import { GeigerCounterWidget } from './GeigerCounterWidget';
import { MobileTouchControls } from './MobileTouchControls';
import { OperativeFaceCam3D } from './OperativeFaceCam3D';

interface Props {
  hud: HudSnapshot;
  characterId: CharacterId;
  settings: GameSettings;
  faceCamOpen: boolean;
  onToggleFaceCam: () => void;
  onOpenFaceCamTab: () => void;
  onOpenSuitCheck: () => void;
  onToggleGeigerMute: () => void;
  onToggleThirdPerson?: () => void;
  onLockPointer: () => void;
  onPause: () => void;
  onOpenInventory: () => void;
  onOpenDatabase?: () => void;
  onOpenAdminMenu?: () => void;
  onTouchMove: (x: number, y: number) => void;
  onTouchLook: (dx: number, dy: number) => void;
  onTouchAction: (action: TouchAction) => void;
}

const COMPASS_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const ARMOUR_HUD_ORDER: { id: ArmourPieceId; short: string }[] = [
  { id: 'helmet', short: 'HELM' },
  { id: 'chest', short: 'CHST' },
  { id: 'back', short: 'BACK' },
  { id: 'leftArm', short: 'L.ARM' },
  { id: 'rightArm', short: 'R.ARM' },
  { id: 'leftLeg', short: 'L.LEG' },
  { id: 'rightLeg', short: 'R.LEG' },
];

export const GameHud: React.FC<Props> = ({
  hud,
  characterId,
  settings,
  faceCamOpen,
  onToggleFaceCam,
  onOpenFaceCamTab,
  onOpenSuitCheck,
  onToggleGeigerMute,
  onToggleThirdPerson,
  onLockPointer,
  onPause,
  onOpenInventory,
  onOpenDatabase,
  onOpenAdminMenu,
  onTouchMove,
  onTouchLook,
  onTouchAction,
}) => {
  const charDef = CHARACTERS[normalizeCharacterId(characterId)];
  const activeWeapon = hud.weapons[hud.activeSlot];
  const weaponDef = WEAPONS[activeWeapon.id];
  const secondarySlot = hud.activeSlot === 0 ? 1 : 0;
  const secondaryWeapon = hud.weapons[secondarySlot];

  const cardinalIdx = Math.round(hud.compassHeading / 45) % 8;
  const cardinal = COMPASS_LABELS[cardinalIdx];

  const prongGap = hud.isAiming
    ? Math.round(3 + hud.moveSpread * 4)
    : Math.round(7 + hud.moveSpread * 12);

  let objDirArrow = '';
  let objGuideText = '';
  if (hud.objectiveBearingDeg !== null) {
    if (Math.abs(hud.objectiveBearingDeg) <= 18) {
      objDirArrow = '▲';
      objGuideText = 'AHEAD';
    } else if (hud.objectiveBearingDeg > 18 && hud.objectiveBearingDeg <= 135) {
      objDirArrow = '▶';
      objGuideText = 'RIGHT';
    } else if (hud.objectiveBearingDeg < -18 && hud.objectiveBearingDeg >= -135) {
      objDirArrow = '◀';
      objGuideText = 'LEFT';
    } else {
      objDirArrow = '▼';
      objGuideText = 'BEHIND';
    }
  }

  const heartbeatVignetteRef = useRef<HTMLDivElement>(null);
  const heartbeatRingRef = useRef<HTMLDivElement>(null);
  const heartIconRef = useRef<HTMLSpanElement>(null);
  const threatVignetteRef = useRef<HTMLDivElement>(null);
  const threatEdgeFlashRef = useRef<HTMLDivElement>(null);
  const threatBannerRef = useRef<HTMLDivElement>(null);
  const threatBarFillRef = useRef<HTMLDivElement>(null);
  const smoothedThreatRef = useRef(0);
  const threatPhaseRef = useRef(0);

  const hudRef = useRef(hud);
  hudRef.current = hud;
  const reducedMotionRef = useRef(settings.reducedMotion);
  reducedMotionRef.current = settings.reducedMotion;

  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const frameDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      const h = hudRef.current;
      const intensity = h.heartbeatIntensity;
      const reduced = reducedMotionRef.current;
      const pulse = reduced
        ? intensity * 0.35
        : computeLubDubPulse(now, h.lastHeartbeatAt, h.heartbeatBpm, intensity);

      if (heartbeatVignetteRef.current) {
        if (intensity <= 0.1) {
          heartbeatVignetteRef.current.style.opacity = '0';
        } else {
          const baseAlpha = Math.max(0, (intensity - 0.14) * 0.24);
          const peakAlpha = pulse * (0.36 + intensity * 0.34);
          const totalOpacity = Math.min(0.82, baseAlpha + peakAlpha);
          const scale = reduced ? 1 : 1.035 - pulse * 0.035;
          heartbeatVignetteRef.current.style.opacity = totalOpacity.toFixed(3);
          heartbeatVignetteRef.current.style.transform = `scale(${scale.toFixed(4)})`;
        }
      }

      if (heartbeatRingRef.current) {
        if (intensity <= 0.22 || reduced) {
          heartbeatRingRef.current.style.opacity = '0';
        } else {
          const ringOpacity = Math.min(0.42, pulse * intensity * 0.45);
          const ringScale = 1.015 - pulse * 0.015;
          heartbeatRingRef.current.style.opacity = ringOpacity.toFixed(3);
          heartbeatRingRef.current.style.transform = `scale(${ringScale.toFixed(4)})`;
        }
      }

      if (heartIconRef.current) {
        const iconPulse = reduced
          ? 0
          : computeLubDubPulse(
              now,
              h.lastHeartbeatAt,
              h.heartbeatBpm,
              Math.max(0.22, intensity)
            );
        const iconScale = 1 + iconPulse * (0.16 + intensity * 0.24);
        heartIconRef.current.style.transform = `scale(${iconScale.toFixed(3)})`;
      }

      // Smoothly ramp proximity threat intensity in/out for seamless entry & exit fades
      const targetThreat =
        h.health > 0 && !h.activePuzzleId ? h.proximityThreatIntensity : 0;
      const dampSpeed = targetThreat > smoothedThreatRef.current ? 10.5 : 3.4;
      smoothedThreatRef.current +=
        (targetThreat - smoothedThreatRef.current) * Math.min(1, frameDt * dampSpeed);
      if (targetThreat === 0 && smoothedThreatRef.current < 0.008) {
        smoothedThreatRef.current = 0;
      }

      const threatLvl = smoothedThreatRef.current;
      threatPhaseRef.current = (threatPhaseRef.current + frameDt * (1.7 + threatLvl * 3.4)) % 1;
      const wave = 0.5 + 0.5 * Math.sin(threatPhaseRef.current * Math.PI * 2);
      const sharpFlash = Math.pow(Math.max(0, Math.sin(threatPhaseRef.current * Math.PI * 2)), 4);

      if (threatVignetteRef.current) {
        if (threatLvl <= 0.01) {
          threatVignetteRef.current.style.opacity = '0';
        } else {
          const vOpacity = reduced
            ? threatLvl * 0.42
            : Math.min(0.74, threatLvl * (0.34 + wave * 0.36));
          const vScale = reduced ? 1 : 1.02 - wave * 0.02 * threatLvl;
          threatVignetteRef.current.style.opacity = vOpacity.toFixed(3);
          threatVignetteRef.current.style.transform = `scale(${vScale.toFixed(4)})`;
        }
      }

      if (threatEdgeFlashRef.current) {
        if (threatLvl <= 0.01 || reduced) {
          threatEdgeFlashRef.current.style.opacity = '0';
        } else {
          const flashOp = Math.min(0.58, sharpFlash * (0.22 + threatLvl * 0.42));
          threatEdgeFlashRef.current.style.opacity = flashOp.toFixed(3);
        }
      }

      if (threatBannerRef.current) {
        if (threatLvl <= 0.01) {
          threatBannerRef.current.style.opacity = '0';
          threatBannerRef.current.style.visibility = 'hidden';
        } else {
          threatBannerRef.current.style.visibility = 'visible';
          const bannerOpacity = reduced
            ? Math.min(0.95, threatLvl * 1.1)
            : Math.min(1, (0.58 + wave * 0.42) * Math.min(1, threatLvl * 1.65));
          const bannerScale = reduced ? 1 : 0.985 + wave * 0.025 * Math.min(1, threatLvl * 1.3);
          threatBannerRef.current.style.opacity = bannerOpacity.toFixed(3);
          threatBannerRef.current.style.transform = `translate3d(-50%, 0, 0) scale(${bannerScale.toFixed(4)})`;
        }
      }

      if (threatBarFillRef.current) {
        const barScale = Math.max(0.06, Math.min(1, threatLvl));
        threatBarFillRef.current.style.transform = `scaleX(${barScale.toFixed(3)})`;
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none [text-shadow:0_1px_4px_rgba(0,0,0,0.95)]">
      {/* Audio-Synced Heartbeat Screen Vignette */}
      <div
        ref={heartbeatVignetteRef}
        className="fixed inset-0 pointer-events-none will-change-[transform,opacity]"
        style={{
          opacity: 0,
          background:
            'radial-gradient(ellipse at center, transparent 48%, rgba(127, 29, 29, 0.42) 78%, rgba(185, 28, 28, 0.85) 100%)',
        }}
      />
      <div
        ref={heartbeatRingRef}
        className="fixed inset-0 pointer-events-none will-change-[transform,opacity]"
        style={{
          opacity: 0,
          boxShadow: 'inset 0 0 130px 28px rgba(220, 38, 38, 0.72)',
        }}
      />
      {/* Proximity Threat Warning Pulsating Perimeter Overlay & Edge Flashes */}
      <div
        ref={threatVignetteRef}
        className="fixed inset-0 pointer-events-none will-change-[transform,opacity]"
        style={{
          opacity: 0,
          background:
            'radial-gradient(ellipse at center, transparent 54%, rgba(127, 29, 29, 0.36) 80%, rgba(153, 27, 27, 0.88) 100%)',
        }}
      />
      <div
        ref={threatEdgeFlashRef}
        className="fixed inset-0 pointer-events-none will-change-opacity"
        style={{
          opacity: 0,
          boxShadow: 'inset 0 0 90px 20px rgba(239, 68, 68, 0.78)',
        }}
      />

      {/* Prominent Upper-Center Threat Detected Alert (Non-Obstructive) */}
      <div
        ref={threatBannerRef}
        role="status"
        aria-live="assertive"
        className={`fixed left-1/2 z-30 pointer-events-none will-change-[transform,opacity] ${
          hud.boss.active || hud.missionBanner
            ? 'top-36 sm:top-40'
            : hud.radioBanner
              ? 'top-28 sm:top-32'
              : 'top-20 sm:top-24'
        }`}
        style={{
          opacity: 0,
          visibility: 'hidden',
          transform: 'translate3d(-50%, 0, 0)',
        }}
      >
        <div className="relative bg-[#090203]/88 border border-red-600/85 shadow-[0_0_28px_rgba(153,27,27,0.55)] px-6 sm:px-9 py-2.5 text-center backdrop-blur-[2px]">
          {/* Angular Military-Industrial Corner Brackets */}
          <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 border-t-2 border-l-2 border-red-400" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 border-t-2 border-r-2 border-red-400" />
          <span className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 border-b-2 border-l-2 border-red-400" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-b-2 border-r-2 border-red-400" />

          {/* Distressed Hazard Caution Header Strip */}
          <div
            className="h-1 w-full mb-1.5 opacity-85"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-45deg, rgba(220,38,38,0.85) 0 6px, rgba(15,4,5,0.95) 6px 12px)',
            }}
          />

          <div
            className={`font-display font-bold tracking-[0.22em] text-red-100 whitespace-nowrap ${
              settings.largeHudText ? 'text-xl sm:text-3xl' : 'text-lg sm:text-2xl'
            }`}
          >
            ⚠ THREAT DETECTED
          </div>

          <div className="mt-1 flex items-center justify-center gap-2 text-[11px] font-mono-tech tracking-[0.16em] text-red-300/95 tabular-nums whitespace-nowrap">
            <span>PROXIMITY &lt; 5.0M</span>
            {hud.nearestThreatDistance !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-red-100 font-semibold">
                  {hud.nearestThreatDistance.toFixed(1)}M
                </span>
              </>
            )}
            {hud.proximityThreatCount > 1 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300 font-semibold">
                  {hud.proximityThreatCount} HOSTILES
                </span>
              </>
            )}
          </div>

          <div className="mt-1.5 w-full h-1 bg-black/75 border border-red-900/70 overflow-hidden">
            <div
              ref={threatBarFillRef}
              className="h-full w-full origin-left bg-gradient-to-r from-red-700 via-red-500 to-amber-400 will-change-transform"
              style={{ transform: 'scaleX(0.3)' }}
            />
          </div>
        </div>
      </div>
      {/* Sniper Scope Optical Overlay during ADS */}
      {hud.isSniperAds && (
        <div
          className="fixed inset-0 pointer-events-none flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at center, transparent 29%, rgba(3,4,6,0.92) 34%, rgba(2,3,5,0.98) 65%)',
          }}
        >
          <div className="relative w-[min(62vw,62vh)] h-[min(62vw,62vh)] rounded-full border border-sky-400/35 flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 h-px bg-sky-300/35" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-sky-300/35" />
            <div className="w-2 h-2 rounded-full bg-red-500/90" />
            <div className="absolute bottom-5 text-[10px] font-mono-tech tracking-widest text-sky-300/80">
              4.5X BALLISTIC OPTIC · M99 LONGBOW
            </div>
          </div>
        </div>
      )}

      {/* Damage Vignette */}
      {hud.damageFlash > 0.02 && (
        <div
          className="fixed inset-0 pointer-events-none transition-opacity duration-75"
          style={{
            opacity: Math.min(0.85, hud.damageFlash),
            boxShadow: 'inset 0 0 110px 45px rgba(185, 28, 28, 0.85)',
          }}
        />
      )}

      {/* Top Row: Objective + Geiger Counter (Left), Compass & Alerts (Center), Quick Actions & Minimap (Right) */}
      <div className="flex items-start justify-between p-4 sm:p-5 gap-4">
        {/* Top-Left Column: Minimalist Objective + Geiger Dosimeter */}
        <div className="flex flex-col items-start gap-2.5 max-w-xs sm:max-w-sm">
          <div className="border-l-2 border-sky-400/80 pl-3 py-0.5">
            <div className="flex items-center gap-2 text-[11px] font-mono-tech tracking-widest text-sky-300">
              <span>OBJECTIVE</span>
              <span aria-hidden="true">·</span>
              <span className="text-zinc-300">{charDef.callsign}</span>
              {hud.objectiveDistance !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-300 tabular-nums">{hud.objectiveDistance}M</span>
                </>
              )}
            </div>
            <div
              className={`font-display font-semibold text-zinc-100 mt-0.5 tracking-wide ${
                settings.largeHudText ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
              }`}
            >
              {hud.objectiveTitle}
            </div>
            <div
              className={`text-zinc-200/90 mt-0.5 leading-snug ${
                settings.largeHudText ? 'text-sm' : 'text-xs'
              }`}
            >
              {hud.objectiveDetail}
            </div>
            {hud.subObjectiveProgress && (
              <div className="text-[11px] font-mono-tech text-sky-300 mt-1 tabular-nums">
                {hud.subObjectiveProgress}
              </div>
            )}
            <div className="flex items-center gap-2.5 text-[11px] font-mono-tech text-zinc-300/85 mt-1 tabular-nums">
              <span className="text-amber-300">SALVAGE {hud.salvageCores}</span>
              {hud.secretsTotalInLevel > 0 && (
                <>
                  <span className="text-zinc-500">·</span>
                  <span>
                    SECRETS {hud.secretsFoundInLevel}/{hud.secretsTotalInLevel}
                  </span>
                </>
              )}
              {hud.inZeroG && <span className="text-sky-300 font-semibold">· ZERO-G</span>}
              {hud.inWater && <span className="text-cyan-300 font-semibold">· SUBMERGED</span>}
            </div>
            {hud.checkpointSavedTimer > 0 && (
              <div className="text-[11px] font-mono-tech text-amber-300 mt-1">
                CHECKPOINT SAVED
              </div>
            )}
          </div>

          <GeigerCounterWidget
            hud={hud}
            reducedMotion={settings.reducedMotion}
            onToggleMute={onToggleGeigerMute}
          />
        </div>

        {/* Top-Center Transparent Compass & Tactical Alerts */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="px-3 py-1 flex items-center gap-3 text-xs font-mono-tech text-zinc-200 tabular-nums border-b border-zinc-400/25">
            <span>{String(hud.compassHeading).padStart(3, '0')}°</span>
            <span className="text-red-400 font-semibold">{cardinal}</span>
            {hud.objectiveDistance !== null && settings.navigationAssist && (
              <>
                <span className="text-zinc-500">·</span>
                <span className="text-amber-300 font-semibold">
                  {objDirArrow} {objGuideText} {hud.objectiveDistance}m
                </span>
              </>
            )}
            <span className="text-zinc-500">·</span>
            <span>KILLS {hud.enemiesDefeated}</span>
          </div>

          {hud.boss.active && (
            <div className="w-[300px] sm:w-[460px] px-2 py-1">
              <div className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold tracking-wider text-red-400">
                    {hud.boss.name}
                  </span>
                  {hud.boss.isEnraged && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono-tech font-bold border border-red-500/80 text-red-200">
                      ENRAGED
                    </span>
                  )}
                </div>
                <span className="font-mono-tech text-[11px] text-zinc-200">
                  {hud.boss.subtitle}
                </span>
              </div>
              <div className="w-full h-2 bg-black/45 border border-red-500/40 mt-1 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-100"
                  style={{ width: `${Math.max(0, (hud.boss.health / hud.boss.maxHealth) * 100)}%` }}
                />
              </div>
              {hud.boss.activeWarning && (
                <div className="mt-1 text-center text-[11px] font-mono-tech font-bold tracking-[0.16em] text-amber-300">
                  ⚠ {hud.boss.activeWarning}
                </div>
              )}
            </div>
          )}

          {hud.formerAlert && (
            <div
              className={`max-w-lg px-5 py-2.5 text-center border bg-black/82 transition-opacity duration-300 ${
                hud.formerAlert.stageKind === 'recognition'
                  ? hud.formerAlert.threatLevel === 'CRITICAL'
                    ? 'border-red-500/90'
                    : 'border-amber-500/85'
                  : 'border-red-600/80'
              }`}
              style={{ opacity: Math.min(1, hud.formerAlert.timer / 0.55) }}
            >
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono-tech tracking-[0.24em] text-red-400">
                <span>⚠</span>
                <span>{hud.formerAlert.tag}</span>
              </div>
              <div className="font-display text-sm sm:text-base font-bold tracking-[0.16em] text-zinc-100 mt-0.5">
                {hud.formerAlert.identityLine}
              </div>
              <div className="text-[11px] font-mono-tech tracking-wider text-zinc-300 mt-0.5">
                {hud.formerAlert.subtitle}
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] font-mono-tech tracking-[0.18em]">
                <span className="text-red-300 font-semibold">{hud.formerAlert.classification}</span>
                <span className="text-zinc-500">·</span>
                <span
                  className={`font-bold ${
                    hud.formerAlert.threatLevel === 'CRITICAL'
                      ? 'text-red-400'
                      : hud.formerAlert.threatLevel === 'HIGH'
                        ? 'text-amber-300'
                        : 'text-zinc-200'
                  }`}
                >
                  THREAT LEVEL: {hud.formerAlert.threatLevel}
                </span>
              </div>
            </div>
          )}

          {hud.armourBanner && (
            <div
              role="status"
              aria-live="assertive"
              className={`max-w-lg px-6 py-2.5 text-center border bg-[#090304]/90 shadow-[0_0_24px_rgba(185,28,28,0.45)] transition-opacity duration-200 ${
                hud.armourBanner.critical
                  ? 'border-red-500 text-red-100'
                  : 'border-amber-500/90 text-amber-100'
              }`}
              style={{ opacity: Math.min(1, hud.armourBanner.timer / 0.45) }}
            >
              <div
                className={`font-display text-sm sm:text-base font-bold tracking-[0.22em] ${
                  hud.armourBanner.critical ? 'text-red-400' : 'text-amber-300'
                }`}
              >
                ⚠ {hud.armourBanner.title}
              </div>
              <div className="text-[11px] font-mono-tech tracking-wider text-zinc-200 mt-0.5">
                {hud.armourBanner.subtitle}
              </div>
            </div>
          )}

          {hud.radioBanner && (
            <div className="max-w-lg px-4 py-1.5 text-center border-b border-red-400/35">
              <div className="flex items-center justify-center gap-2 text-[11px] font-mono-tech text-red-300">
                <Radio className="w-3.5 h-3.5" />
                <span>{hud.radioBanner.speaker}</span>
              </div>
              <p
                className={`text-zinc-100 mt-0.5 leading-snug ${
                  settings.largeHudText ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                }`}
              >
                {hud.radioBanner.text}
              </p>
            </div>
          )}

          {hud.secretToast && (
            <div className="max-w-md border-y border-amber-400/75 px-5 py-1.5 text-center">
              <div className="text-[11px] font-mono-tech tracking-widest text-amber-300">
                SECRET DISCOVERED · +{hud.secretToast.salvage} SALVAGE CORES
              </div>
              <div className="font-display text-sm font-bold text-zinc-100 mt-0.5">
                {hud.secretToast.title}
              </div>
            </div>
          )}

          {hud.missionBanner && (
            <div
              className="mt-4 max-w-xl border-y border-red-500/70 px-8 py-3 text-center transition-opacity duration-300"
              style={{ opacity: Math.min(1, hud.missionBanner.timer / 1.2) }}
            >
              <div className="font-display text-lg sm:text-2xl font-bold tracking-[0.22em] text-zinc-100">
                {hud.missionBanner.title}
              </div>
              <div className="text-xs sm:text-sm font-mono-tech tracking-wider text-red-300 mt-1">
                {hud.missionBanner.objective}
              </div>
            </div>
          )}

          {hud.chapterIntro && !hud.missionBanner && (
            <div
              className="mt-6 max-w-xl border-y border-red-500/70 px-8 py-3 text-center transition-opacity duration-300"
              style={{ opacity: Math.min(1, hud.chapterIntro.timer / 1.0) }}
            >
              <div className="text-[11px] font-mono-tech tracking-[0.26em] text-red-300">
                CHAPTER {String(hud.chapterIntro.number).padStart(2, '0')} · {hud.chapterIntro.region}
              </div>
              <div className="font-display text-xl sm:text-2xl font-bold tracking-[0.18em] text-zinc-100 mt-1">
                {hud.chapterIntro.title}
              </div>
              <div className="text-xs font-mono-tech tracking-wider text-amber-300 mt-1">
                {hud.chapterIntro.subtitle}
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Quick Actions, Minimalist Radar & Face Cam Tab */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-1.5 pointer-events-auto">
            {onToggleThirdPerson && (
              <button
                onClick={onToggleThirdPerson}
                className={`px-2.5 py-1 text-[11px] font-mono-tech flex items-center gap-1.5 transition-colors cursor-pointer border-b ${
                  hud.thirdPersonView
                    ? 'bg-sky-950/70 border-sky-400 text-sky-100'
                    : 'bg-black/25 hover:bg-black/50 border-zinc-400/40 text-zinc-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{hud.thirdPersonView ? '[T] 3RD' : '[T] 1ST'}</span>
              </button>
            )}
            <button
              onClick={onToggleFaceCam}
              className={`px-2.5 py-1 text-[11px] font-mono-tech flex items-center gap-1.5 transition-colors cursor-pointer border-b ${
                faceCamOpen
                  ? 'bg-red-950/70 border-red-400 text-red-100'
                  : 'bg-black/25 hover:bg-black/50 border-zinc-400/40 text-zinc-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>[G] CAM</span>
            </button>
            <button
              onClick={onOpenSuitCheck}
              className={`bg-black/25 hover:bg-black/50 border-b px-2.5 py-1 text-[11px] font-mono-tech flex items-center gap-1.5 transition-colors cursor-pointer tabular-nums ${
                hud.suitIntegrity < 55
                  ? 'border-red-400/70 text-red-200'
                  : 'border-emerald-400/50 text-emerald-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>[B] SUIT {hud.suitIntegrity}%</span>
            </button>
            {onOpenDatabase && (
              <button
                onClick={onOpenDatabase}
                className="bg-black/25 hover:bg-black/50 border-b border-sky-400/50 px-2.5 py-1 text-[11px] font-mono-tech text-sky-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>[K] DB</span>
              </button>
            )}
            {onOpenAdminMenu && (
              <button
                onClick={onOpenAdminMenu}
                className="bg-amber-950/70 hover:bg-amber-900 border-b border-amber-400 px-2.5 py-1 text-[11px] font-mono-tech text-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
              >
                <span>[V] ADMIN</span>
              </button>
            )}
            <button
              onClick={onOpenInventory}
              className="bg-black/25 hover:bg-black/50 border-b border-zinc-400/40 px-2.5 py-1 text-[11px] font-mono-tech text-zinc-200 transition-colors cursor-pointer"
            >
              [TAB] LOGS
            </button>
            <button
              onClick={onPause}
              className="bg-black/25 hover:bg-black/50 border-b border-zinc-400/40 px-2.5 py-1 text-[11px] font-mono-tech text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>ESC</span>
            </button>
          </div>

          {settings.showMinimap && (
            <div className="w-28 h-28 rounded-full bg-black/25 border border-zinc-400/30 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-25">
                <div className="w-16 h-16 rounded-full border border-zinc-400" />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-100 rotate-45" />
              {hud.minimapBlips.map((b, idx) => {
                const dx = b.x - hud.minimapPlayer.x;
                const dz = b.z - hud.minimapPlayer.z;
                const cosY = Math.cos(hud.minimapPlayer.yaw);
                const sinY = Math.sin(hud.minimapPlayer.yaw);
                const rx = dx * cosY - dz * sinY;
                const rz = dx * sinY + dz * cosY;
                const scale = 1.4;
                const px = Math.max(-48, Math.min(48, rx * scale));
                const py = Math.max(-48, Math.min(48, rz * scale));
                const color =
                  b.kind === 'objective'
                    ? 'bg-sky-400 w-2.5 h-2.5'
                    : b.kind === 'boss'
                      ? 'bg-red-500 w-3 h-3'
                      : 'bg-red-400 w-2 h-2';
                return (
                  <div
                    key={idx}
                    className={`absolute rounded-full ${color}`}
                    style={{
                      left: `calc(50% + ${px}px)`,
                      top: `calc(50% + ${py}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                );
              })}
            </div>
          )}

          {faceCamOpen && (
            <div className="pointer-events-auto">
              <OperativeFaceCam3D
                characterId={characterId}
                hud={hud}
                compact
                reducedMotion={settings.reducedMotion}
                onOpenFullTab={onOpenFaceCamTab}
                onClose={onToggleFaceCam}
              />
            </div>
          )}
        </div>
      </div>

      {/* Directional Damage Indicator & Center Dynamic Reticle */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        {hud.damageFlash > 0.04 &&
          hud.hurtDirectionDeg !== null &&
          hud.hurtDirectionDeg !== undefined && (
            <div
              className="absolute w-32 h-32 pointer-events-none"
              style={{
                opacity: Math.min(0.95, hud.damageFlash * 1.45),
                transform: `rotate(${hud.hurtDirectionDeg}deg)`,
              }}
            >
              <div
                className="mx-auto w-8 h-3 bg-gradient-to-b from-red-500 to-transparent border-t-2 border-red-300 shadow-[0_0_12px_rgba(239,68,68,0.85)]"
                style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}
              />
            </div>
          )}

        {!hud.isSniperAds && (
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-zinc-100/90" />
            <div
              className="absolute w-[1.5px] h-2 bg-zinc-100/85"
              style={{ transform: `translateY(-${prongGap}px)` }}
            />
            <div
              className="absolute w-[1.5px] h-2 bg-zinc-100/85"
              style={{ transform: `translateY(${prongGap}px)` }}
            />
            <div
              className="absolute h-[1.5px] w-2 bg-zinc-100/85"
              style={{ transform: `translateX(-${prongGap}px)` }}
            />
            <div
              className="absolute h-[1.5px] w-2 bg-zinc-100/85"
              style={{ transform: `translateX(${prongGap}px)` }}
            />

            {hud.hitMarkerTimer > 0 && (
              <div
                className={`absolute w-7 h-7 border-2 rotate-45 pointer-events-none ${
                  hud.hitMarkerCrit ? 'border-amber-400 scale-110' : 'border-red-500'
                }`}
              />
            )}
          </div>
        )}

        {hud.hitMarkerTimer > 0 && hud.hitMarkerCrit && (
          <div className="mt-0.5 text-[10px] font-mono-tech tracking-widest text-amber-400 font-bold">
            CRIT
          </div>
        )}

        {hud.isReloading && (
          <div className="mt-3 w-28 bg-black/45 border border-zinc-500/40 p-0.5">
            <div
              className="h-1 bg-amber-400 transition-all duration-75"
              style={{ width: `${Math.round(hud.reloadProgress * 100)}%` }}
            />
          </div>
        )}

        {(hud.knockdownTimer ?? 0) > 0 && (
          <div className="mt-4 px-2.5 py-0.5 bg-red-950/85 border border-red-500/80 text-[10px] font-mono-tech tracking-[0.2em] text-red-200 font-semibold">
            KNOCKDOWN STAGGER
          </div>
        )}
      </div>

      {/* Floating Near-Object Interact Prompt */}
      {hud.interactPrompt && (
        <div
          className="fixed z-25 pointer-events-none"
          style={
            hud.interactScreenPos
              ? {
                  left: `${hud.interactScreenPos.x * 100}%`,
                  top: `${hud.interactScreenPos.y * 100}%`,
                  transform: 'translate(-50%, -120%)',
                }
              : {
                  left: '50%',
                  bottom: '5.5rem',
                  transform: 'translateX(-50%)',
                }
          }
        >
          <div
            className={`px-3 py-1 bg-black/45 border-b-2 ${
              hud.interactEducationId
                ? 'border-sky-400 text-sky-200'
                : 'border-amber-400 text-amber-200'
            } font-mono-tech tracking-wider whitespace-nowrap ${
              settings.largeHudText ? 'text-sm sm:text-base' : 'text-xs'
            }`}
          >
            {hud.interactEducationId && (
              <span className="text-[10px] text-sky-400 mr-2 font-semibold">FIELD SCAN</span>
            )}
            <span>{hud.interactPrompt}</span>
          </div>
        </div>
      )}

      {/* Bottom-Center Mouse Lock & Minimalist Key Hints */}
      {!settings.touchControls && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20">
          {!hud.pointerLocked && (
            <button
              onClick={onLockPointer}
              className="pointer-events-auto bg-red-950/75 hover:bg-red-900/90 border border-red-500/80 px-4 py-1 text-[11px] font-mono-tech tracking-widest text-zinc-100 cursor-pointer transition-colors"
            >
              CLICK VIEWPORT TO ENGAGE MOUSE LOOK
            </button>
          )}
          <div className="hidden xl:flex items-center gap-2.5 text-[10px] font-mono-tech text-zinc-300/70 whitespace-nowrap">
            <span>WASD</span>
            <span>·</span>
            <span>SHIFT SPRINT</span>
            <span>·</span>
            <span>C CROUCH</span>
            <span>·</span>
            <span>X CRAWL</span>
            <span>·</span>
            <span>SPACE VAULT</span>
            <span>·</span>
            <span>E INTERACT</span>
            <span>·</span>
            <span>R RELOAD</span>
            <span>·</span>
            <span>V MELEE</span>
            <span>·</span>
            <span>Q ABILITY</span>
          </div>
        </div>
      )}

      {/* Bottom HUD Corners: Minimalist Vitals (Left) & Weapon/Ability (Right) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-5 flex items-end justify-between gap-4 pointer-events-none">
        {/* Bottom-Left Transparent Vitals + Operative Quip + Stance */}
        <div className="w-60 sm:w-72 space-y-2 tabular-nums">
          {hud.operativeQuip && (
            <div
              className="bg-[#07090d]/85 border border-zinc-700/80 border-l-2 px-3 py-2 shadow-[0_4px_18px_rgba(0,0,0,0.65)]"
              style={{ borderLeftColor: hud.operativeQuip.accentColor || charDef.visorColor }}
            >
              <div
                className="text-[10px] font-mono-tech font-bold tracking-[0.18em]"
                style={{ color: hud.operativeQuip.accentColor || charDef.visorColor }}
              >
                {hud.operativeQuip.speaker} // VOICE COMMS
              </div>
              <p
                className={`text-zinc-100 mt-0.5 leading-snug ${
                  settings.largeHudText ? 'text-sm' : 'text-xs'
                }`}
              >
                "{hud.operativeQuip.text}"
              </p>
            </div>
          )}

          <div className="w-56 sm:w-64 space-y-1.5 border-l-2 border-red-500/75 pl-3">
            {(hud.isVaulting || hud.isCrawling || hud.isCrouching || (hud.playerWear ?? 0) >= 0.2) && (
              <div className="flex items-center gap-2 text-[10px] font-mono-tech tracking-wider">
                {hud.isVaulting ? (
                  <span className="px-1.5 py-0.5 bg-sky-950/80 border border-sky-500/70 text-sky-200 font-semibold">
                    VAULTING
                  </span>
                ) : hud.isCrawling ? (
                  <span className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/70 text-amber-200 font-semibold">
                    PRONE CRAWL [X]
                  </span>
                ) : hud.isCrouching ? (
                  <span className="px-1.5 py-0.5 bg-zinc-900/85 border border-zinc-600/70 text-zinc-200">
                    CROUCH [C]
                  </span>
                ) : null}
                {(hud.playerWear ?? 0) >= 0.2 && (
                  <span className="text-red-300/85">
                    SUIT WEAR {Math.round((hud.playerWear ?? 0) * 100)}%
                  </span>
                )}
              </div>
            )}
          <div className="flex items-center justify-between text-xs font-mono-tech">
            <span className="flex items-center gap-1.5 text-zinc-200">
              <span ref={heartIconRef} className="inline-flex">
                <HeartPulse
                  className={`w-3.5 h-3.5 ${
                    hud.heartbeatIntensity >= 0.65
                      ? 'text-red-400'
                      : hud.heartbeatIntensity >= 0.3
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }`}
                />
              </span>
              <span>HP</span>
              <span
                className={`text-[10px] ${
                  hud.heartbeatIntensity >= 0.65
                    ? 'text-red-400 font-semibold'
                    : hud.heartbeatIntensity >= 0.28
                      ? 'text-amber-300'
                      : 'text-zinc-400'
                }`}
              >
                {hud.heartbeatBpm} BPM
              </span>
            </span>
            <span className="text-zinc-100 font-bold text-sm">
              {hud.health} <span className="text-zinc-400 font-normal text-xs">/ {hud.maxHealth}</span>
            </span>
          </div>
          <div className="w-full h-1.5 bg-black/45 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                hud.health < 30 ? 'bg-red-500' : 'bg-red-600'
              }`}
              style={{ width: `${Math.max(0, (hud.health / hud.maxHealth) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono-tech">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Shield className={`w-3 h-3 ${hud.bodyArmourLost ? 'text-red-500' : 'text-sky-400'}`} />
              <span>ARMOR</span>
              {hud.bodyArmourLost && (
                <span className="px-1 py-0.2 bg-red-950/90 border border-red-500/80 text-[9px] text-red-300 font-bold tracking-wider">
                  BODY ARMOUR LOST
                </span>
              )}
            </span>
            <span className="text-zinc-200">
              {hud.armor} / {hud.maxArmor}
            </span>
          </div>
          <div className="w-full h-1 bg-black/45 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                hud.bodyArmourLost ? 'bg-red-500' : 'bg-sky-400'
              }`}
              style={{ width: `${Math.max(0, (hud.armor / Math.max(1, hud.maxArmor)) * 100)}%` }}
            />
          </div>

          {hud.armourPieces && (
            <div className="grid grid-cols-7 gap-1 pt-0.5 tabular-nums">
              {ARMOUR_HUD_ORDER.map(({ id, short }) => {
                const p = hud.armourPieces?.[id];
                if (!p) return null;
                const broken = p.destructible && p.stage !== 'intact';
                const boxColor = broken
                  ? 'border-red-600/85 bg-red-950/70 text-red-300'
                  : p.damageTier === 'cracked'
                    ? 'border-orange-500/70 bg-orange-950/40 text-orange-300'
                    : p.damageTier === 'dented'
                      ? 'border-amber-500/60 bg-amber-950/35 text-amber-200'
                      : 'border-zinc-700/70 bg-black/45 text-sky-200';
                return (
                  <div
                    key={id}
                    className={`border px-0.5 py-0.5 text-center leading-tight ${boxColor}`}
                    title={`${p.label}: ${broken ? 'DESTROYED' : `${p.pct}%`}`}
                  >
                    <div className="text-[8px] font-mono-tech opacity-80 truncate">{short}</div>
                    <div className="text-[9px] font-mono-tech font-bold">
                      {broken ? 'LOST' : `${p.pct}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono-tech text-zinc-300/90">
            <span>STAMINA {hud.stamina}%</span>
            <span className="flex items-center gap-2.5">
              <span className="flex items-center gap-1">
                <Flashlight className={`w-3 h-3 ${hud.flashlightOn ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span>[F] {hud.flashlightBattery}%</span>
              </span>
              <span>[H] ×{hud.medkits}</span>
            </span>
          </div>
          <div className="w-full h-0.5 bg-black/40 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                hud.stamina < 25 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, hud.stamina))}%` }}
            />
          </div>
          </div>
        </div>

        {/* Bottom-Right Transparent Weapon & Ability */}
        <div className="w-56 sm:w-64 space-y-1 text-right tabular-nums border-r-2 border-amber-400/70 pr-3">
          {hud.turretActive && (
            <div className="inline-block px-2 py-0.5 mb-0.5 bg-orange-950/80 border border-orange-500/80 text-[10px] font-mono-tech text-orange-200 font-semibold">
              SENTRY TURRET · {(hud.turretRemaining ?? 0).toFixed(1)}s
            </div>
          )}
          <div className="text-[10px] font-mono-tech text-zinc-300 tracking-wider">
            {weaponDef.category} · SLOT {hud.activeSlot + 1}
          </div>
          <div className="font-display text-sm font-semibold text-zinc-100 tracking-wide">
            {weaponDef.name}
          </div>

          <div className="flex items-baseline justify-end gap-1.5 font-mono-tech">
            <span className={`text-3xl font-bold leading-none ${activeWeapon.ammoInMag <= 4 ? 'text-red-400' : 'text-zinc-100'}`}>
              {String(activeWeapon.ammoInMag).padStart(2, '0')}
            </span>
            <span className="text-sm text-zinc-300">/ {activeWeapon.reserveAmmo}</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-0.5 text-[10px] font-mono-tech">
            <span className="text-zinc-300/80 truncate max-w-[115px]">
              [{secondarySlot + 1}] {WEAPONS[secondaryWeapon.id].name}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-red-400" />
              {hud.abilityActive ? (
                <span className="text-amber-300">
                  {charDef.ability.name} {hud.abilityActiveRemaining.toFixed(1)}s
                </span>
              ) : hud.abilityCooldownRemaining > 0 ? (
                <span className="text-zinc-300">
                  [Q] {hud.abilityCooldownRemaining.toFixed(0)}s
                </span>
              ) : (
                <span className="text-red-300 font-semibold">[Q] {charDef.ability.name}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Touch Controls Overlay */}
      {settings.touchControls && (
        <MobileTouchControls
          hud={hud}
          onTouchMove={onTouchMove}
          onTouchLook={onTouchLook}
          onTouchAction={onTouchAction}
        />
      )}

      <div className="sr-only">
        <Volume2 />
      </div>
    </div>
  );
};
