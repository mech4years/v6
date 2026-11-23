import React, { useRef, useState } from 'react';
import {
  ArrowUp,
  Crosshair,
  Flashlight,
  Hand,
  HeartPulse,
  RefreshCw,
  Repeat,
  Shield,
  Swords,
  Zap,
} from 'lucide-react';
import { WEAPONS } from '../game/data';
import { HudSnapshot, TouchAction } from '../game/types';

interface Props {
  hud: HudSnapshot;
  onTouchMove: (x: number, y: number) => void;
  onTouchLook: (dx: number, dy: number) => void;
  onTouchAction: (action: TouchAction) => void;
}

const STICK_RADIUS = 52;

export const MobileTouchControls: React.FC<Props> = ({
  hud,
  onTouchMove,
  onTouchLook,
  onTouchAction,
}) => {
  const stickBaseRef = useRef<HTMLDivElement>(null);
  const stickTouchIdRef = useRef<number | null>(null);
  const stickCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const lookTouchIdRef = useRef<number | null>(null);
  const lookLastRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const fireTouchIdRef = useRef<number | null>(null);
  const fireLastRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [stickOffset, setStickOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [firingActive, setFiringActive] = useState(false);

  const activeWeapon = hud.weapons[hud.activeSlot];
  const secondarySlot = hud.activeSlot === 0 ? 1 : 0;
  const secondaryWeapon = hud.weapons[secondarySlot];

  const updateStickFromClient = (clientX: number, clientY: number) => {
    const dxRaw = clientX - stickCenterRef.current.x;
    const dyRaw = clientY - stickCenterRef.current.y;
    const dist = Math.hypot(dxRaw, dyRaw);
    const clampedDist = Math.min(STICK_RADIUS, dist);
    const angle = Math.atan2(dyRaw, dxRaw);
    const px = dist > 0 ? Math.cos(angle) * clampedDist : 0;
    const py = dist > 0 ? Math.sin(angle) * clampedDist : 0;

    setStickOffset({ x: px, y: py });
    onTouchMove(px / STICK_RADIUS, py / STICK_RADIUS);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none">
      {/* Right-Half Camera Look Pad */}
      <div
        className="fixed top-16 right-0 w-[56%] h-[72%] pointer-events-auto touch-none"
        onTouchStart={(e) => {
          if (lookTouchIdRef.current !== null) return;
          const t = e.changedTouches[0];
          if (!t) return;
          lookTouchIdRef.current = t.identifier;
          lookLastRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchMove={(e) => {
          if (lookTouchIdRef.current === null) return;
          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === lookTouchIdRef.current) {
              const dx = t.clientX - lookLastRef.current.x;
              const dy = t.clientY - lookLastRef.current.y;
              onTouchLook(dx, dy);
              lookLastRef.current = { x: t.clientX, y: t.clientY };
              break;
            }
          }
        }}
        onTouchEnd={(e) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
              lookTouchIdRef.current = null;
              break;
            }
          }
        }}
        onTouchCancel={() => {
          lookTouchIdRef.current = null;
        }}
      />

      {/* Left Side: Utility Quick-Strip + Dynamic Analog Thumbstick */}
      <div className="fixed bottom-36 left-4 sm:left-6 flex flex-col items-start gap-2.5 pointer-events-none">
        {/* Quick Utility Strip (Switch Weapon, Med-Gel, Flashlight) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => onTouchAction('switch')}
            className="px-2.5 py-2 bg-black/55 active:bg-zinc-800 border border-zinc-600/80 text-[10px] font-mono-tech text-zinc-100 flex items-center gap-1 touch-manipulation"
          >
            <Repeat className="w-3.5 h-3.5 text-amber-400" />
            <span className="max-w-[68px] truncate">
              {WEAPONS[secondaryWeapon.id].name.split(' ')[0]}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTouchAction('heal')}
            disabled={hud.medkits <= 0}
            className={`px-2.5 py-2 border text-[10px] font-mono-tech flex items-center gap-1 tabular-nums touch-manipulation ${
              hud.health < 45 && hud.medkits > 0
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                : 'bg-black/55 border-zinc-600/80 text-zinc-200 disabled:opacity-40'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
            <span>×{hud.medkits}</span>
          </button>

          <button
            type="button"
            onClick={() => onTouchAction('flashlight')}
            className={`px-2.5 py-2 border text-[10px] font-mono-tech flex items-center gap-1 tabular-nums touch-manipulation ${
              hud.flashlightOn
                ? 'bg-amber-950/75 border-amber-400 text-amber-200'
                : 'bg-black/55 border-zinc-600/80 text-zinc-300'
            }`}
          >
            <Flashlight className="w-3.5 h-3.5" />
            <span>{hud.flashlightBattery}%</span>
          </button>
        </div>

        {/* Multi-Touch Dynamic Movement Joystick */}
        <div
          ref={stickBaseRef}
          className={`relative w-32 h-32 rounded-full border-2 pointer-events-auto touch-none flex items-center justify-center transition-colors ${
            hud.isSprinting
              ? 'bg-emerald-950/35 border-emerald-400/85'
              : 'bg-black/45 border-zinc-500/75'
          }`}
          onTouchStart={(e) => {
            if (stickTouchIdRef.current !== null) return;
            const t = e.changedTouches[0];
            if (!t || !stickBaseRef.current) return;
            stickTouchIdRef.current = t.identifier;
            const rect = stickBaseRef.current.getBoundingClientRect();
            stickCenterRef.current = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            };
            updateStickFromClient(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            if (stickTouchIdRef.current === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
              const t = e.changedTouches[i];
              if (t.identifier === stickTouchIdRef.current) {
                updateStickFromClient(t.clientX, t.clientY);
                break;
              }
            }
          }}
          onTouchEnd={(e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === stickTouchIdRef.current) {
                stickTouchIdRef.current = null;
                setStickOffset({ x: 0, y: 0 });
                onTouchMove(0, 0);
                break;
              }
            }
          }}
          onTouchCancel={() => {
            stickTouchIdRef.current = null;
            setStickOffset({ x: 0, y: 0 });
            onTouchMove(0, 0);
          }}
        >
          {/* Outer Sprint Lock Indicator */}
          <div
            className={`absolute top-1.5 text-[8px] font-mono-tech tracking-widest pointer-events-none ${
              hud.isSprinting ? 'text-emerald-300 font-bold' : 'text-zinc-400/70'
            }`}
          >
            ▲ SPRINT
          </div>
          {/* Inner Crosshair Ring */}
          <div className="w-16 h-16 rounded-full border border-zinc-500/30 pointer-events-none" />
          {/* Live Movable Thumbstick Puck */}
          <div
            className={`w-12 h-12 rounded-full border-2 pointer-events-none ${
              hud.isSprinting
                ? 'bg-emerald-400/45 border-emerald-300'
                : 'bg-zinc-200/35 border-zinc-100/80'
            }`}
            style={{
              transform: `translate3d(${stickOffset.x.toFixed(1)}px, ${stickOffset.y.toFixed(1)}px, 0)`,
            }}
          />
        </div>
      </div>

      {/* Contextual Interact Trigger when near usable world object */}
      {hud.interactPrompt && (
        <div className="fixed bottom-64 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            onClick={() => onTouchAction('interact')}
            className="px-4 py-2.5 bg-amber-900/85 active:bg-amber-700 border-2 border-amber-400 text-xs font-mono-tech font-bold text-amber-100 flex items-center gap-2 shadow-lg touch-manipulation"
          >
            <Hand className="w-4 h-4 text-amber-300" />
            <span>{hud.interactPrompt}</span>
          </button>
        </div>
      )}

      {/* Right Side: Ergonomic Combat & Stance Cluster */}
      <div className="fixed bottom-36 right-4 sm:right-6 flex flex-col items-end gap-2.5 pointer-events-none">
        {/* Secondary Stance & Skill Row */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => onTouchAction('ability')}
            className={`h-11 px-3 border text-[10px] font-mono-tech flex items-center gap-1 tabular-nums touch-manipulation ${
              hud.abilityActive
                ? 'bg-amber-900/80 border-amber-400 text-amber-100'
                : hud.abilityCooldownRemaining > 0
                  ? 'bg-black/55 border-zinc-700 text-zinc-400'
                  : 'bg-red-950/75 border-red-500 text-red-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {hud.abilityActive
                ? `${hud.abilityActiveRemaining.toFixed(0)}S`
                : hud.abilityCooldownRemaining > 0
                  ? `${hud.abilityCooldownRemaining.toFixed(0)}S`
                  : 'SKILL'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTouchAction('crouch')}
            className={`w-12 h-11 border text-[10px] font-mono-tech flex flex-col items-center justify-center touch-manipulation ${
              hud.isCrouching
                ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                : 'bg-black/55 border-zinc-600/80 text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{hud.isCrouching ? 'LOW' : 'CROUCH'}</span>
          </button>

          <button
            type="button"
            onClick={() => onTouchAction('crawl')}
            className={`w-12 h-11 border text-[10px] font-mono-tech flex flex-col items-center justify-center touch-manipulation ${
              hud.isCrawling
                ? 'bg-purple-950/80 border-purple-400 text-purple-200'
                : 'bg-black/55 border-zinc-600/80 text-zinc-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>{hud.isCrawling ? 'PRONE' : 'CRAWL'}</span>
          </button>

          <button
            type="button"
            onClick={() => onTouchAction('jump')}
            className="w-12 h-11 bg-black/55 active:bg-zinc-700 border border-zinc-600/80 text-[10px] font-mono-tech text-zinc-100 flex flex-col items-center justify-center touch-manipulation"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>JUMP</span>
          </button>
        </div>

        {/* Combat Arc: Reload, Melee, Aim, and Primary Fire (Drag-to-Aim while firing) */}
        <div className="flex items-end gap-2.5 pointer-events-auto">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onTouchAction('reload')}
              className={`w-13 h-12 border text-[10px] font-mono-tech flex flex-col items-center justify-center touch-manipulation ${
                hud.isReloading
                  ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                  : activeWeapon.ammoInMag <= 4
                    ? 'bg-red-950/75 border-red-500 text-red-200'
                    : 'bg-black/55 border-zinc-600/80 text-zinc-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${hud.isReloading ? 'animate-spin' : ''}`} />
              <span>RELOAD</span>
            </button>

            <button
              type="button"
              onClick={() => onTouchAction('melee')}
              className="w-13 h-12 bg-black/55 active:bg-zinc-700 border border-zinc-600/80 text-[10px] font-mono-tech text-zinc-200 flex flex-col items-center justify-center touch-manipulation"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>MELEE</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 items-center">
            <button
              type="button"
              onClick={() => onTouchAction('aim')}
              className={`w-14 h-12 border text-[10px] font-mono-tech flex flex-col items-center justify-center touch-manipulation ${
                hud.isAiming
                  ? 'bg-sky-950/85 border-sky-400 text-sky-200'
                  : 'bg-black/55 border-zinc-600/80 text-zinc-200'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span>AIM</span>
            </button>

            {/* Primary Trigger: supports continuous fire + micro drag aiming */}
            <button
              type="button"
              className={`w-20 h-20 rounded-full border-2 font-mono-tech text-xs font-bold flex flex-col items-center justify-center touch-none transition-transform ${
                firingActive
                  ? 'bg-red-600/90 border-red-200 text-white scale-95'
                  : 'bg-red-900/75 border-red-400 text-red-50'
              }`}
              onTouchStart={(e) => {
                e.stopPropagation();
                const t = e.changedTouches[0];
                if (!t) return;
                fireTouchIdRef.current = t.identifier;
                fireLastRef.current = { x: t.clientX, y: t.clientY };
                setFiringActive(true);
                onTouchAction('shoot_start');
              }}
              onTouchMove={(e) => {
                if (fireTouchIdRef.current === null) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                  const t = e.changedTouches[i];
                  if (t.identifier === fireTouchIdRef.current) {
                    const dx = t.clientX - fireLastRef.current.x;
                    const dy = t.clientY - fireLastRef.current.y;
                    onTouchLook(dx, dy);
                    fireLastRef.current = { x: t.clientX, y: t.clientY };
                    break;
                  }
                }
              }}
              onTouchEnd={(e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                  if (e.changedTouches[i].identifier === fireTouchIdRef.current) {
                    fireTouchIdRef.current = null;
                    setFiringActive(false);
                    onTouchAction('shoot_end');
                    break;
                  }
                }
              }}
              onTouchCancel={() => {
                fireTouchIdRef.current = null;
                setFiringActive(false);
                onTouchAction('shoot_end');
              }}
            >
              <Crosshair className="w-5 h-5 mb-0.5" />
              <span>FIRE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
