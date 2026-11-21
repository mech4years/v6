import React, { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  Camera,
  FileText,
  Globe,
  HeartPulse,
  Package,
  Shield,
  ShieldAlert,
  Volume2,
  X,
} from 'lucide-react';
import { CHARACTERS, FACTIONS, LORE_ENTRIES, WORLD_REGIONS } from '../game/data';
import { CharacterId, HudSnapshot } from '../game/types';
import { OperativeFaceCam3D } from './OperativeFaceCam3D';
import { SuitBodyCheckPanel } from './SuitBodyCheckPanel';

export type DatapadTab = 'inventory' | 'facecam' | 'suit' | 'lore' | 'world' | 'factions';

interface Props {
  hud: HudSnapshot;
  characterId: CharacterId;
  initialTab?: DatapadTab;
  reducedMotion?: boolean;
  onClose: () => void;
  onOpenDatabase?: () => void;
  onUseMedkit?: () => void;
}

export const InventoryDrawer: React.FC<Props> = ({
  hud,
  characterId,
  initialTab = 'inventory',
  reducedMotion = false,
  onClose,
  onOpenDatabase,
  onUseMedkit,
}) => {
  const [tab, setTab] = useState<DatapadTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const charDef = CHARACTERS[characterId];

  return (
    <div className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-[#0b0d12] border border-zinc-800 flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-wider text-zinc-100">
              FIELD DATAPAD &amp; BIOMETRIC MONITOR
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Equipment, live operative face cam, suit &amp; body integrity check, HELIOS logs, and intel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenDatabase && (
              <button
                onClick={onOpenDatabase}
                className="px-3 py-1.5 border border-sky-700/80 bg-sky-950/40 hover:bg-sky-900/50 text-xs font-mono-tech text-sky-200 flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>SCIENTIFIC DATABASE</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-zinc-700 hover:border-red-500 text-xs font-mono-tech text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>CLOSE</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 px-6 py-3 border-b border-zinc-800 bg-[#080a0e]">
          <button
            onClick={() => setTab('inventory')}
            className={`px-3.5 py-2 text-xs font-mono-tech flex items-center gap-2 cursor-pointer transition-colors ${
              tab === 'inventory'
                ? 'bg-red-950 text-red-200 border border-red-700'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>INVENTORY ({hud.inventory.length})</span>
          </button>
          <button
            onClick={() => setTab('facecam')}
            className={`px-3.5 py-2 text-xs font-mono-tech flex items-center gap-2 cursor-pointer transition-colors ${
              tab === 'facecam'
                ? 'bg-red-950 text-red-200 border border-red-700'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>FACE CAM</span>
          </button>
          <button
            onClick={() => setTab('suit')}
            className={`px-3.5 py-2 text-xs font-mono-tech flex items-center gap-2 cursor-pointer transition-colors tabular-nums ${
              tab === 'suit'
                ? 'bg-red-950 text-red-200 border border-red-700'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>SUIT &amp; BODY CHECK ({hud.suitIntegrity}%)</span>
          </button>
          <button
            onClick={() => setTab('lore')}
            className={`px-3.5 py-2 text-xs font-mono-tech flex items-center gap-2 cursor-pointer transition-colors ${
              tab === 'lore'
                ? 'bg-red-950 text-red-200 border border-red-700'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>DOCUMENTS &amp; AUDIO ({hud.collectedLoreIds.length}/36)</span>
          </button>
          <button
            onClick={() => setTab('world')}
            className={`px-3.5 py-2 text-xs font-mono-tech flex items-center gap-2 cursor-pointer transition-colors ${
              tab === 'world'
                ? 'bg-red-950 text-red-200 border border-red-700'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>WORLD SECTORS</span>
          </button>
          <button
            onClick={() => setTab('factions')}
            className={`px-3.5 py-2 text-xs font-mono-tech flex items-center gap-2 cursor-pointer transition-colors ${
              tab === 'factions'
                ? 'bg-red-950 text-red-200 border border-red-700'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>FACTIONS</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {tab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hud.inventory.map((item) => (
                <div key={item.id} className="border border-zinc-800 bg-[#080a0e] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-zinc-100">{item.name}</span>
                    <span className="font-mono-tech text-xs text-amber-400 tabular-nums">
                      QTY {item.quantity}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5">{item.description}</p>
                </div>
              ))}
              <div className="border border-zinc-800 bg-[#080a0e] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-zinc-100">
                    Sector Grid &amp; Secrets
                  </span>
                  <span
                    className={`font-mono-tech text-xs ${
                      hud.powerRestored ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {hud.powerRestored ? 'POWER ONLINE' : 'AUXILIARY'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1.5 tabular-nums">
                  Hidden caches found in current chapter: {hud.secretsFoundInLevel}/
                  {hud.secretsTotalInLevel}
                </p>
              </div>
            </div>
          )}

          {tab === 'facecam' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <OperativeFaceCam3D
                  characterId={characterId}
                  hud={hud}
                  reducedMotion={reducedMotion}
                />
              </div>
              <div className="lg:col-span-5 flex flex-col justify-between gap-4 border border-zinc-800 bg-[#080a0e] p-4">
                <div className="space-y-3">
                  <div className="border-b border-zinc-800 pb-2.5">
                    <div className="text-[11px] font-mono-tech text-sky-400">
                      LIVE HELMET UPLINK · {charDef.id.toUpperCase()}
                    </div>
                    <h3 className="font-display text-lg font-bold text-zinc-100 mt-0.5">
                      {charDef.callsign}
                    </h3>
                    <p className="text-xs text-zinc-400">{charDef.role}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 tabular-nums text-xs font-mono-tech">
                    <div className="border border-zinc-800 bg-[#0b0d12] p-3">
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <HeartPulse className="w-3 h-3 text-red-400" />
                        <span>PULSE</span>
                      </div>
                      <div className="text-lg font-bold text-zinc-100 mt-1">
                        {hud.heartbeatBpm} BPM
                      </div>
                    </div>
                    <div className="border border-zinc-800 bg-[#0b0d12] p-3">
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-sky-400" />
                        <span>SUIT SEAL</span>
                      </div>
                      <div className="text-lg font-bold text-zinc-100 mt-1">
                        {hud.suitIntegrity}%
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-800 bg-[#0b0d12] p-3 text-xs space-y-1.5">
                    <div className="font-mono-tech text-[11px] text-zinc-300 font-semibold">
                      SENSOR DIAGNOSTIC
                    </div>
                    <p className="text-zinc-400 leading-relaxed">
                      Toggle <span className="text-zinc-200 font-mono-tech">LIVE CAM</span> inside the
                      viewport to switch between the operative 3D visor feed and your local optical camera,
                      or press <span className="text-zinc-200 font-mono-tech">[G]</span> during gameplay
                      to pin a compact Face Cam onto the HUD.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTab('suit')}
                  className="w-full py-2.5 border border-sky-700/80 bg-sky-950/40 hover:bg-sky-900/50 text-xs font-mono-tech text-sky-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>OPEN FULL SUIT &amp; BODY CHECK</span>
                </button>
              </div>
            </div>
          )}

          {tab === 'suit' && (
            <SuitBodyCheckPanel
              characterId={characterId}
              hud={hud}
              reducedMotion={reducedMotion}
              onUseMedkit={onUseMedkit}
              onOpenFaceCam={() => setTab('facecam')}
            />
          )}

          {tab === 'lore' && (
            <div className="space-y-4">
              {hud.collectedLoreIds.length === 0 ? (
                <div className="border border-zinc-800 bg-[#080a0e] p-6 text-center text-sm text-zinc-400">
                  No documents or audio recordings recovered yet. Search vehicles, laboratories, checkpoints, and alien chambers.
                </div>
              ) : (
                hud.collectedLoreIds.map((id) => {
                  const entry = LORE_ENTRIES[id];
                  if (!entry) return null;
                  return (
                    <div key={id} className="border border-zinc-800 bg-[#080a0e] p-4 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-display font-semibold text-zinc-100 flex items-center gap-2">
                          {entry.kind === 'audio' ? (
                            <Volume2 className="w-4 h-4 text-red-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-amber-400" />
                          )}
                          <span>{entry.title}</span>
                        </h3>
                        <span className="font-mono-tech text-[11px] text-zinc-400">
                          CH.{String(entry.levelNumber).padStart(2, '0')} · {entry.faction} · {entry.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{entry.content}</p>
                      {entry.transcript && (
                        <p className="text-xs font-mono-tech text-red-300 bg-black/50 p-3 border border-red-900/40">
                          {entry.transcript}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'world' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WORLD_REGIONS.map((region) => (
                <div key={region.id} className="border border-zinc-800 bg-[#080a0e] p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-zinc-100">{region.name}</span>
                    <span className="font-mono-tech text-[11px] text-red-400">{region.status}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{region.description}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'factions' && (
            <div className="space-y-3">
              {FACTIONS.map((fac) => (
                <div key={fac.id} className="border border-zinc-800 bg-[#080a0e] p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-zinc-100">{fac.name}</span>
                    <span className="text-xs italic text-red-400">"{fac.motto}"</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{fac.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
