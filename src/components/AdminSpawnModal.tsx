import React, { useState } from 'react';
import { Compass, Shield, Sparkles, Wand2, X, Zap } from 'lucide-react';
import { WEAPONS } from '../game/data';
import { EnemyType, WeaponId } from '../game/types';

interface Props {
  isGodChar: boolean;
  noclipActive: boolean;
  godModeActive: boolean;
  onToggleNoclip: () => void;
  onToggleGodMode: () => void;
  onSpawnEnemy: (type: EnemyType) => void;
  onSpawnWeapon: (id: WeaponId) => void;
  onSpawnItem: (kind: 'medkit' | 'salvage' | 'battery', count: number) => void;
  onInstantCompleteObjective: () => void;
  onTeleport: (x: number, y: number, z: number) => void;
  onClose: () => void;
}

const SPAWNABLE_ENEMIES: { type: EnemyType; label: string }[] = [
  { type: 'crawler', label: 'Infected Crawler' },
  { type: 'stalker', label: 'Mutant Stalker' },
  { type: 'brute_enemy', label: 'Biomechanical Brute' },
  { type: 'screamer', label: 'Sonic Screamer' },
  { type: 'carrier', label: 'Spore Carrier' },
  { type: 'titan', label: 'Titan Behemoth' },
  { type: 'the_former', label: 'The Former (Corpse)' },
];

const SPAWNABLE_WEAPONS: WeaponId[] = [
  'vaporiser',
  'plasma_lance',
  'sniper_rifle',
  'heavy_mg',
  'shotgun',
  'assault_rifle',
  'energy_rifle',
];

const PRESET_WAYPOINTS: { label: string; x: number; y: number; z: number; desc: string }[] = [
  { label: 'Sector Spawn / Start', x: 0, y: 0, z: 0, desc: 'Initial sector entry point' },
  { label: 'East Checkpoint & Generator', x: 20, y: 0, z: -16, desc: 'Breaker B-2 & power junction' },
  { label: 'West Substation Relay', x: -20, y: 0, z: -26, desc: 'Substation substation & terminal' },
  { label: 'Villa Gate & Objective', x: 0, y: 0, z: -48, desc: 'Quarantine gate & courtyard' },
  { label: 'Boss Arena Chamber', x: 0, y: 0, z: -96, desc: 'Master HELIOS & Origin nexus' },
];

export const AdminSpawnModal: React.FC<Props> = ({
  isGodChar,
  noclipActive,
  godModeActive,
  onToggleNoclip,
  onToggleGodMode,
  onSpawnEnemy,
  onSpawnWeapon,
  onSpawnItem,
  onInstantCompleteObjective,
  onTeleport,
  onClose,
}) => {
  const [tab, setTab] = useState<'spawn' | 'teleport'>('spawn');
  const [customX, setCustomX] = useState('0');
  const [customY, setCustomY] = useState('0');
  const [customZ, setCustomZ] = useState('-25');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#090b10] border border-amber-500/85 shadow-[0_0_35px_rgba(234,179,8,0.35)] flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#120f06]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tech text-amber-400">
              <Wand2 className="w-4 h-4" />
              <span>DEVELOPER ADMIN CONSOLE · OMNI SPAWN &amp; QUICK TELEPORT</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-wider text-zinc-100 mt-0.5">
              ADMINISTRATIVE CONTROL HUB [V]
            </h2>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-2 border border-zinc-700 hover:border-red-500 text-xs font-mono-tech text-zinc-200 flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>CLOSE</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-2.5 border-b border-zinc-800 bg-[#0d0f15] text-xs font-mono-tech">
          <button
            onClick={() => setTab('spawn')}
            className={`px-4 py-1.5 border cursor-pointer transition-colors ${
              tab === 'spawn'
                ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                : 'bg-black/40 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            SPAWN &amp; GOD TOOLS
          </button>
          <button
            onClick={() => setTab('teleport')}
            className={`px-4 py-1.5 border cursor-pointer transition-colors flex items-center gap-1.5 ${
              tab === 'teleport'
                ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                : 'bg-black/40 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>QUICK TELEPORT</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {tab === 'spawn' ? (
            <>
              {/* God & Noclip Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-amber-500/60 bg-[#120e06] p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-display font-bold text-amber-300">
                      <Shield className="w-4 h-4" />
                      <span>GOD MODE / INFINITE SHIELD</span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      {isGodChar ? 'Active (Native Operative Privilege)' : 'Infinite HP & Armor active'}
                    </p>
                  </div>
                  <button
                    onClick={onToggleGodMode}
                    className={`px-3 py-1.5 border text-xs font-mono-tech font-bold cursor-pointer ${
                      godModeActive || isGodChar
                        ? 'bg-amber-950 border-amber-400 text-amber-200'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    {godModeActive || isGodChar ? 'ACTIVE [ON]' : 'OFF'}
                  </button>
                </div>

                <div className="border border-sky-500/60 bg-[#070e14] p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-display font-bold text-sky-300">
                      <Zap className="w-4 h-4" />
                      <span>NOCLIP &amp; FLIGHT MODE</span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1">
                      Fly freely through space &amp; walls [Space/Shift]
                    </p>
                  </div>
                  <button
                    onClick={onToggleNoclip}
                    className={`px-3 py-1.5 border text-xs font-mono-tech font-bold cursor-pointer ${
                      noclipActive
                        ? 'bg-sky-950 border-sky-400 text-sky-200'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    {noclipActive ? 'ACTIVE [ON]' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Instant Objective / Puzzle Resolver */}
              <div className="border border-emerald-500/60 bg-[#06120d] p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-display font-bold text-emerald-300">
                    <Sparkles className="w-4 h-4" />
                    <span>INSTANT OBJECTIVE / FINISHER GENERATOR</span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1">
                    Instantly completes the current objective, solves active generator puzzles, or finishes the chapter.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onInstantCompleteObjective();
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 border border-emerald-400 font-mono-tech text-xs font-bold text-white cursor-pointer whitespace-nowrap"
                >
                  TRIGGER FINISHER
                </button>
              </div>

              {/* Spawn Enemies */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono-tech tracking-widest text-amber-400">
                  SPAWN HOSTILE ENTITIES
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SPAWNABLE_ENEMIES.map(({ type, label }) => (
                    <button
                      key={type}
                      onClick={() => onSpawnEnemy(type)}
                      className="px-3 py-2 bg-[#0c0e14] hover:bg-amber-950/40 border border-zinc-700 hover:border-amber-500 text-xs font-mono-tech text-zinc-200 text-left transition-colors cursor-pointer truncate"
                    >
                      + {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spawn Weapons */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono-tech tracking-widest text-amber-400">
                  EQUIP WEAPONS (VAPORISER &amp; LANCE)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SPAWNABLE_WEAPONS.map((wId) => {
                    const wDef = WEAPONS[wId];
                    return (
                      <button
                        key={wId}
                        onClick={() => {
                          onSpawnWeapon(wId);
                          onClose();
                        }}
                        className={`px-3 py-2 border text-xs font-mono-tech text-left transition-colors cursor-pointer truncate ${
                          wId === 'vaporiser'
                            ? 'bg-amber-950/60 border-amber-500 text-amber-200 hover:bg-amber-900'
                            : 'bg-[#0c0e14] border-zinc-700 text-zinc-200 hover:border-zinc-500'
                        }`}
                      >
                        {wDef.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spawn Items & Currency */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono-tech tracking-widest text-amber-400">
                  SPAWN RESOURCES &amp; SUPPLIES
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => onSpawnItem('salvage', 10)}
                    className="px-4 py-2.5 bg-[#0c0e14] hover:bg-zinc-800 border border-amber-500/70 text-xs font-mono-tech text-amber-300 cursor-pointer"
                  >
                    +10 SALVAGE CORES
                  </button>
                  <button
                    onClick={() => onSpawnItem('medkit', 5)}
                    className="px-4 py-2.5 bg-[#0c0e14] hover:bg-zinc-800 border border-emerald-500/70 text-xs font-mono-tech text-emerald-300 cursor-pointer"
                  >
                    +5 MED-GELS
                  </button>
                  <button
                    onClick={() => onSpawnItem('battery', 3)}
                    className="px-4 py-2.5 bg-[#0c0e14] hover:bg-zinc-800 border border-sky-500/70 text-xs font-mono-tech text-sky-300 cursor-pointer"
                  >
                    +3 POWER CELLS
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-zinc-100">QUICK TELEPORT WAYPOINTS</h3>
                <p className="text-xs text-zinc-400">
                  Instantly jump to key objective coordinates across the quarantine sector to bypass long travel times.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {PRESET_WAYPOINTS.map((wp, idx) => (
                  <div
                    key={idx}
                    className="border border-zinc-800 bg-[#0c0e14] p-3.5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-display font-bold text-zinc-100">{wp.label}</div>
                      <div className="text-xs font-mono-tech text-amber-400/90 mt-0.5">
                        X: {wp.x} · Y: {wp.y} · Z: {wp.z}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{wp.desc}</div>
                    </div>
                    <button
                      onClick={() => {
                        onTeleport(wp.x, wp.y, wp.z);
                        onClose();
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-mono-tech text-xs font-bold tracking-wider cursor-pointer whitespace-nowrap"
                    >
                      TELEPORT
                    </button>
                  </div>
                ))}
              </div>

              <div className="border border-zinc-800 bg-[#0c0e14] p-4 space-y-3 mt-4">
                <div className="text-xs font-mono-tech text-zinc-300">CUSTOM COORDINATE JUMP</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono-tech text-zinc-400 mb-1">X AXIS</label>
                    <input
                      type="number"
                      value={customX}
                      onChange={(e) => setCustomX(e.target.value)}
                      className="w-full bg-[#060709] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 font-mono-tech focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono-tech text-zinc-400 mb-1">Y AXIS</label>
                    <input
                      type="number"
                      value={customY}
                      onChange={(e) => setCustomY(e.target.value)}
                      className="w-full bg-[#060709] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 font-mono-tech focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono-tech text-zinc-400 mb-1">Z AXIS</label>
                    <input
                      type="number"
                      value={customZ}
                      onChange={(e) => setCustomZ(e.target.value)}
                      className="w-full bg-[#060709] border border-zinc-700 px-3 py-1.5 text-xs text-zinc-100 font-mono-tech focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const fx = parseFloat(customX) || 0;
                    const fy = parseFloat(customY) || 0;
                    const fz = parseFloat(customZ) || 0;
                    onTeleport(fx, fy, fz);
                    onClose();
                  }}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-mono-tech text-xs font-bold tracking-wider cursor-pointer"
                >
                  JUMP TO CUSTOM COORDINATES
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
