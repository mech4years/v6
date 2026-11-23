import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Flashlight,
  HeartPulse,
  Radar,
  ScanLine,
  Shield,
  Sparkles,
} from 'lucide-react';
import { CHARACTERS } from '../game/data';
import { computeLubDubPulse } from '../game/heartbeatCurve';
import { ArmourPieceId, ArmourPieceHudSnapshot, CharacterId, HudSnapshot } from '../game/types';

interface Props {
  characterId: CharacterId;
  hud: HudSnapshot;
  reducedMotion?: boolean;
  onUseMedkit?: () => void;
  onOpenFaceCam?: () => void;
}

type ZoneKey = 'head' | 'torso' | 'arms' | 'legs';

function getZoneStatus(pct: number): {
  label: 'NOMINAL' | 'ABRADED' | 'COMPROMISED' | 'CRITICAL';
  textClass: string;
  barClass: string;
  fillHex: string;
  strokeHex: string;
} {
  if (pct >= 80) {
    return {
      label: 'NOMINAL',
      textClass: 'text-emerald-400',
      barClass: 'bg-emerald-500',
      fillHex: 'rgba(16, 185, 129, 0.22)',
      strokeHex: '#34d399',
    };
  }
  if (pct >= 55) {
    return {
      label: 'ABRADED',
      textClass: 'text-amber-300',
      barClass: 'bg-amber-400',
      fillHex: 'rgba(251, 191, 36, 0.24)',
      strokeHex: '#fbbf24',
    };
  }
  if (pct >= 30) {
    return {
      label: 'COMPROMISED',
      textClass: 'text-orange-400',
      barClass: 'bg-orange-500',
      fillHex: 'rgba(249, 115, 22, 0.28)',
      strokeHex: '#fb923c',
    };
  }
  return {
    label: 'CRITICAL',
    textClass: 'text-red-400',
    barClass: 'bg-red-500',
    fillHex: 'rgba(239, 68, 68, 0.34)',
    strokeHex: '#f87171',
  };
}

export const SuitBodyCheckPanel: React.FC<Props> = ({
  characterId,
  hud,
  reducedMotion = false,
  onUseMedkit,
  onOpenFaceCam,
}) => {
  const charDef = CHARACTERS[characterId];
  const [selectedZone, setSelectedZone] = useState<ZoneKey>('torso');
  const [sweeping, setSweeping] = useState(false);
  const [lastSweepReport, setLastSweepReport] = useState<string | null>(null);

  const heartIconRef = useRef<HTMLSpanElement>(null);
  const hudRef = useRef(hud);
  hudRef.current = hud;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    let rafId = 0;
    const animate = () => {
      const el = heartIconRef.current;
      if (el) {
        const h = hudRef.current;
        const pulse = reducedMotionRef.current
          ? 0
          : computeLubDubPulse(
              performance.now(),
              h.lastHeartbeatAt,
              h.heartbeatBpm,
              Math.max(0.25, h.heartbeatIntensity)
            );
        const scale = 1 + pulse * 0.24;
        el.style.transform = `scale(${scale.toFixed(3)})`;
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const triggerDiagnosticSweep = () => {
    if (sweeping) return;
    setSweeping(true);
    setLastSweepReport(null);
    window.setTimeout(() => {
      setSweeping(false);
      const zoneScores: [string, number][] = [
        ['HEAD / VISOR', hud.bodyCondition.head],
        ['TORSO / CORE', hud.bodyCondition.torso],
        ['ARMS / GAUNTLETS', hud.bodyCondition.arms],
        ['LEGS / SERVOS', hud.bodyCondition.legs],
      ];
      const lowestEntry = zoneScores.sort((a, b) => a[1] - b[1])[0];

      const threatNote =
        hud.nearestThreatDistance !== null && hud.nearestThreatDistance <= 25
          ? `Hostile bio-signature detected at ${hud.nearestThreatDistance}m.`
          : 'Immediate perimeter free of close-range bio-signatures.';

      const brokenPlates: string[] = [];
      if (hud.armourPieces?.chest.stage !== 'intact' && hud.armourPieces?.chest) {
        brokenPlates.push('CHEST');
      }
      if (hud.armourPieces?.back.stage !== 'intact' && hud.armourPieces?.back) {
        brokenPlates.push('BACK');
      }

      const traumaNote =
        brokenPlates.length > 0
          ? `${brokenPlates.join(' & ')} armour plate(s) destroyed — replace at an Armory Workbench.`
          : lowestEntry[1] < 80
            ? `${lowestEntry[0]} shows highest wear (${lowestEntry[1]}%).`
            : 'All anatomical armor zones within nominal structural tolerances.';

      setLastSweepReport(`${traumaNote} ${threatNote}`);
    }, 1100);
  };

  const zones: {
    key: ZoneKey;
    name: string;
    subsystem: string;
    pct: number;
    note: string;
  }[] = [
    {
      key: 'head',
      name: 'HEAD / VISOR',
      subsystem: 'Ballistic Helmet & Ocular HUD',
      pct: hud.bodyCondition.head,
      note:
        hud.bodyCondition.head >= 80
          ? 'Optic seal intact; neural targeting link calibrated.'
          : hud.bodyCondition.head >= 50
            ? 'Micro-fractures on visor laminate; HUD contrast holding.'
            : 'Helmet seal compromised; spore filtration stressed.',
    },
    {
      key: 'torso',
      name: 'TORSO / CORE',
      subsystem: 'Chest Chassis & Cardiac Monitor',
      pct: hud.bodyCondition.torso,
      note:
        hud.bodyCondition.torso >= 80
          ? 'Thoracic plating nominal; bio-regulator stable.'
          : hud.bodyCondition.torso >= 50
            ? 'Sternum plating abraded; elevated cardiac output.'
            : 'Core armor breached; apply Med-Gel to stabilize trauma.',
    },
    {
      key: 'arms',
      name: 'ARMS / GAUNTLETS',
      subsystem: 'Recoil Dampeners & Grip Servos',
      pct: hud.bodyCondition.arms,
      note:
        hud.bodyCondition.arms >= 80
          ? 'Weapon stabilization servos responsive.'
          : hud.bodyCondition.arms >= 50
            ? 'Forearm armor scored; minor micro-hydraulic bleed.'
            : 'Gauntlet actuators strained under combat load.',
    },
    {
      key: 'legs',
      name: 'LEGS / SERVOS',
      subsystem: 'Kinetic Exoskeleton & Mag-Boots',
      pct: hud.bodyCondition.legs,
      note:
        hud.bodyCondition.legs >= 80
          ? 'Stride dampeners and sprint actuators at full torque.'
          : hud.bodyCondition.legs >= 50
            ? 'Knee articulation armor worn; mobility nominal.'
            : 'Lower servo pressure reduced; check stamina burn.',
    },
  ];

  const activeZone = zones.find((z) => z.key === selectedZone) ?? zones[1];
  const anyDamaged =
    hud.health < hud.maxHealth ||
    hud.bodyCondition.head < 100 ||
    hud.bodyCondition.torso < 100 ||
    hud.bodyCondition.arms < 100 ||
    hud.bodyCondition.legs < 100;
  const canUseMedkit = Boolean(onUseMedkit) && hud.medkits > 0 && anyDamaged;

  const headStyle = getZoneStatus(hud.bodyCondition.head);
  const torsoStyle = getZoneStatus(hud.bodyCondition.torso);
  const armsStyle = getZoneStatus(hud.bodyCondition.arms);
  const legsStyle = getZoneStatus(hud.bodyCondition.legs);

  const atmosphereStatus = hud.inWater
    ? 'SUBMERGED · POSITIVE SEAL'
    : hud.inZeroG
      ? 'ZERO-G · MAG-BOOTS ACTIVE'
      : 'STANDARD ATMOSPHERE';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Column: Anatomical Schematic */}
      <div className="lg:col-span-5 border border-zinc-800 bg-[#080a0e] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div>
            <h3 className="font-display font-bold text-sm tracking-wider text-zinc-100">
              OPERATIVE BIOMETRIC SCHEMATIC
            </h3>
            <p className="text-[11px] font-mono-tech text-zinc-400">
              {charDef.callsign} · {charDef.classification ?? charDef.role}
            </p>
          </div>
          <div className="text-right font-mono-tech text-xs tabular-nums">
            <div className="text-sky-300">SUIT {hud.suitIntegrity}%</div>
            <div className="text-[10px] text-amber-400/90">
              WEAR {Math.round((hud.playerWear ?? 0) * 100)}%
            </div>
          </div>
        </div>

        {/* Interactive Body Diagram */}
        <div className="relative my-3 flex items-center justify-center bg-[#05070b] border border-zinc-800/80 py-4 overflow-hidden">
          {sweeping && (
            <div
              className="absolute inset-x-0 h-0.5 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.95)] pointer-events-none animate-pulse"
              style={{ top: '48%' }}
            />
          )}

          <svg
            viewBox="0 0 220 300"
            className="w-52 h-64 select-none"
            role="img"
            aria-label="Suit and body zone integrity schematic"
          >
            {/* Subtle tactical grid lines */}
            <line x1="20" y1="68" x2="200" y2="68" stroke="#1e293b" strokeWidth="0.7" strokeDasharray="3 3" />
            <line x1="20" y1="158" x2="200" y2="158" stroke="#1e293b" strokeWidth="0.7" strokeDasharray="3 3" />
            <line x1="110" y1="12" x2="110" y2="288" stroke="#1e293b" strokeWidth="0.7" strokeDasharray="3 3" />

            {/* HEAD / VISOR */}
            <g
              onClick={() => setSelectedZone('head')}
              className="cursor-pointer"
            >
              <rect
                x="88"
                y="20"
                width="44"
                height="46"
                rx="12"
                fill={headStyle.fillHex}
                stroke={headStyle.strokeHex}
                strokeWidth={selectedZone === 'head' ? 2.4 : 1.3}
              />
              <rect x="95" y="34" width="30" height="10" rx="3" fill={headStyle.strokeHex} opacity="0.65" />
            </g>

            {/* TORSO / CORE */}
            <g
              onClick={() => setSelectedZone('torso')}
              className="cursor-pointer"
            >
              <path
                d="M72 74 L148 74 L140 164 L80 164 Z"
                fill={torsoStyle.fillHex}
                stroke={torsoStyle.strokeHex}
                strokeWidth={selectedZone === 'torso' ? 2.4 : 1.3}
              />
              {hud.armourPieces?.chest && hud.armourPieces.chest.stage !== 'intact' && (
                <>
                  <line x1="78" y1="80" x2="138" y2="154" stroke="#ef4444" strokeWidth="2.2" />
                  <line x1="142" y1="80" x2="82" y2="154" stroke="#ef4444" strokeWidth="2.2" />
                </>
              )}
              {hud.armourPieces?.back && hud.armourPieces.back.stage !== 'intact' && (
                <rect
                  x="76"
                  y="78"
                  width="68"
                  height="80"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              )}
              {/* Heart marker */}
              <circle cx="118" cy="106" r="6" fill={torsoStyle.strokeHex} opacity="0.85" />
            </g>

            {/* ARMS / GAUNTLETS */}
            <g
              onClick={() => setSelectedZone('arms')}
              className="cursor-pointer"
            >
              <rect
                x="44"
                y="76"
                width="22"
                height="94"
                rx="6"
                fill={armsStyle.fillHex}
                stroke={armsStyle.strokeHex}
                strokeWidth={selectedZone === 'arms' ? 2.4 : 1.3}
              />
              <rect
                x="154"
                y="76"
                width="22"
                height="94"
                rx="6"
                fill={armsStyle.fillHex}
                stroke={armsStyle.strokeHex}
                strokeWidth={selectedZone === 'arms' ? 2.4 : 1.3}
              />
            </g>

            {/* LEGS / SERVOS */}
            <g
              onClick={() => setSelectedZone('legs')}
              className="cursor-pointer"
            >
              <rect
                x="80"
                y="170"
                width="26"
                height="112"
                rx="6"
                fill={legsStyle.fillHex}
                stroke={legsStyle.strokeHex}
                strokeWidth={selectedZone === 'legs' ? 2.4 : 1.3}
              />
              <rect
                x="114"
                y="170"
                width="26"
                height="112"
                rx="6"
                fill={legsStyle.fillHex}
                stroke={legsStyle.strokeHex}
                strokeWidth={selectedZone === 'legs' ? 2.4 : 1.3}
              />
            </g>
          </svg>

          {/* Zone Callout Chips */}
          <div className="absolute top-3 right-3 text-right text-[10px] font-mono-tech tabular-nums space-y-1 pointer-events-none">
            <div className={headStyle.textClass}>HEAD {hud.bodyCondition.head}%</div>
            <div className={torsoStyle.textClass}>CORE {hud.bodyCondition.torso}%</div>
            <div className={armsStyle.textClass}>ARMS {hud.bodyCondition.arms}%</div>
            <div className={legsStyle.textClass}>LEGS {hud.bodyCondition.legs}%</div>
          </div>
        </div>

        {/* Selected Zone Diagnostic Detail */}
        <div className="border border-zinc-800 bg-[#0b0d12] p-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono-tech">
            <span className="text-zinc-100 font-semibold">{activeZone.name}</span>
            <span className={`${getZoneStatus(activeZone.pct).textClass} tabular-nums`}>
              {getZoneStatus(activeZone.pct).label} · {activeZone.pct}%
            </span>
          </div>
          <div className="text-[11px] font-mono-tech text-zinc-400">{activeZone.subsystem}</div>
          <p className="text-xs text-zinc-300 pt-0.5 leading-relaxed">{activeZone.note}</p>
        </div>
      </div>

      {/* Right Column: Telemetry, Subsystems, Actions */}
      <div className="lg:col-span-7 flex flex-col justify-between gap-4">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
          <div className="border border-zinc-800 bg-[#080a0e] p-3.5">
            <div className="flex items-center justify-between text-[11px] font-mono-tech text-zinc-400">
              <span>CARDIAC RATE</span>
              <span ref={heartIconRef} className="inline-flex">
                <HeartPulse
                  className={`w-4 h-4 ${
                    hud.heartbeatIntensity >= 0.65
                      ? 'text-red-400'
                      : hud.heartbeatIntensity >= 0.3
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                  }`}
                />
              </span>
            </div>
            <div className="mt-1.5 font-mono-tech text-2xl font-bold text-zinc-100">
              {hud.heartbeatBpm} <span className="text-xs font-normal text-zinc-400">BPM</span>
            </div>
            <div className="text-[10px] font-mono-tech text-zinc-400 mt-1">
              {hud.heartbeatIntensity >= 0.65
                ? 'ADRENALINE SPIKE'
                : hud.heartbeatIntensity >= 0.3
                  ? 'ELEVATED PULSE'
                  : 'RESTING RHYTHM'}
            </div>
          </div>

          <div className="border border-zinc-800 bg-[#080a0e] p-3.5">
            <div className="flex items-center justify-between text-[11px] font-mono-tech text-zinc-400">
              <span>VITALS / HP</span>
              <Activity className="w-4 h-4 text-red-400" />
            </div>
            <div className="mt-1.5 font-mono-tech text-2xl font-bold text-zinc-100">
              {hud.health}{' '}
              <span className="text-xs font-normal text-zinc-400">/ {hud.maxHealth}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 mt-2 overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-150"
                style={{ width: `${Math.max(0, (hud.health / hud.maxHealth) * 100)}%` }}
              />
            </div>
          </div>

          <div className="border border-zinc-800 bg-[#080a0e] p-3.5">
            <div className="flex items-center justify-between text-[11px] font-mono-tech text-zinc-400">
              <span>BALLISTIC ARMOR</span>
              <Shield className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-1.5 font-mono-tech text-2xl font-bold text-zinc-100">
              {hud.armor}{' '}
              <span className="text-xs font-normal text-zinc-400">/ {hud.maxArmor}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 mt-2 overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-150"
                style={{ width: `${Math.max(0, (hud.armor / Math.max(1, hud.maxArmor)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Zone Integrity Breakdown */}
        <div className="border border-zinc-800 bg-[#080a0e] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-xs tracking-wider text-zinc-200">
              ARMOR &amp; ANATOMICAL ZONE CHECK
            </span>
            <span className="text-[11px] font-mono-tech text-zinc-400">
              Click any zone to inspect
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {zones.map((zone) => {
              const st = getZoneStatus(zone.pct);
              const isSelected = selectedZone === zone.key;
              return (
                <button
                  key={zone.key}
                  type="button"
                  onClick={() => setSelectedZone(zone.key)}
                  className={`text-left p-3 border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-sky-500/80 bg-[#0d121a]'
                      : 'border-zinc-800 bg-[#0b0d12] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono-tech tabular-nums">
                    <span className="text-zinc-100 font-semibold">{zone.name}</span>
                    <span className={st.textClass}>
                      {st.label} {zone.pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${st.barClass}`}
                      style={{ width: `${Math.max(0, Math.min(100, zone.pct))}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {hud.armourPieces && (
            <div className="pt-3 border-t border-zinc-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display font-bold text-xs tracking-wider text-zinc-200">
                  7-PIECE BALLISTIC ARMOUR PLATING
                </span>
                {hud.bodyArmourLost ? (
                  <span className="px-2 py-0.5 bg-red-950/90 border border-red-500 text-[10px] font-mono-tech font-bold text-red-300">
                    BODY ARMOUR LOST · WORKBENCH REPLACEMENT REQUIRED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono-tech text-zinc-400">
                    CHEST &amp; BACK DESTRUCTIBLE · HELMET/LIMBS PERMANENT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 tabular-nums">
                {(
                  [
                    'helmet',
                    'chest',
                    'back',
                    'leftArm',
                    'rightArm',
                    'leftLeg',
                    'rightLeg',
                  ] as ArmourPieceId[]
                ).map((pieceId) => {
                  const piece: ArmourPieceHudSnapshot | undefined = hud.armourPieces?.[pieceId];
                  if (!piece) return null;
                  const broken = piece.destructible && piece.stage !== 'intact';
                  const tierColor = broken
                    ? 'text-red-400'
                    : piece.damageTier === 'cracked'
                      ? 'text-orange-400'
                      : piece.damageTier === 'dented'
                        ? 'text-amber-300'
                        : 'text-emerald-400';
                  const barColor = broken
                    ? 'bg-red-600'
                    : piece.damageTier === 'cracked'
                      ? 'bg-orange-500'
                      : piece.damageTier === 'dented'
                        ? 'bg-amber-400'
                        : 'bg-sky-400';
                  return (
                    <div
                      key={pieceId}
                      className={`border p-2.5 ${
                        broken
                          ? 'border-red-700/80 bg-red-950/25'
                          : 'border-zinc-800 bg-[#0b0d12]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono-tech">
                        <span className="text-zinc-200 font-semibold truncate">{piece.label}</span>
                        <span className={tierColor}>
                          {broken ? 'DESTROYED' : `${piece.pct}%`}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${barColor}`}
                          style={{ width: `${broken ? 0 : Math.max(0, Math.min(100, piece.pct))}%` }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[9px] font-mono-tech text-zinc-500">
                        <span>{piece.damageTier.toUpperCase()}</span>
                        <span>{piece.destructible ? 'BREAKABLE' : 'PERMANENT'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Suit Subsystems */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-tech">
          <div className="border border-zinc-800 bg-[#080a0e] p-3 space-y-1">
            <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>BIO-SEAL ENVIRONMENT</span>
            </div>
            <div className="text-zinc-100 font-semibold">{atmosphereStatus}</div>
          </div>

          <div className="border border-zinc-800 bg-[#080a0e] p-3 space-y-1 tabular-nums">
            <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
              <Flashlight className="w-3.5 h-3.5 text-amber-400" />
              <span>SUIT POWER CELL</span>
            </div>
            <div className="text-zinc-100 font-semibold">
              {hud.flashlightBattery}% · {hud.flashlightOn ? 'BEAM ACTIVE' : 'STANDBY'}
            </div>
          </div>

          <div className="border border-zinc-800 bg-[#080a0e] p-3 space-y-1 tabular-nums">
            <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5 text-red-400" />
              <span>THREAT PROXIMITY</span>
            </div>
            <div
              className={`font-semibold ${
                hud.nearestThreatDistance !== null && hud.nearestThreatDistance <= 18
                  ? 'text-red-400'
                  : 'text-zinc-100'
              }`}
            >
              {hud.nearestThreatDistance !== null
                ? `${hud.nearestThreatDistance}M CONTACT`
                : 'NO CONTACTS'}
            </div>
          </div>
        </div>

        {/* Sweep Output Banner */}
        {lastSweepReport && (
          <div className="border border-sky-700/60 bg-sky-950/30 px-3.5 py-2.5 text-xs font-mono-tech text-sky-200 flex items-start gap-2">
            {hud.suitIntegrity < 65 ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            )}
            <span>{lastSweepReport}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={triggerDiagnosticSweep}
              disabled={sweeping}
              className="px-3.5 py-2 border border-sky-600/80 bg-sky-950/40 hover:bg-sky-900/50 disabled:opacity-60 text-xs font-mono-tech text-sky-200 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ScanLine className="w-3.5 h-3.5 text-sky-400" />
              <span>{sweeping ? 'RUNNING BIOMETRIC SWEEP...' : 'RUN DIAGNOSTIC SWEEP'}</span>
            </button>

            {onOpenFaceCam && (
              <button
                type="button"
                onClick={onOpenFaceCam}
                className="px-3.5 py-2 border border-zinc-700 bg-[#0b0d12] hover:border-zinc-500 text-xs font-mono-tech text-zinc-200 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-zinc-300" />
                <span>OPEN FACE CAM</span>
              </button>
            )}
          </div>

          {onUseMedkit && (
            <button
              type="button"
              onClick={onUseMedkit}
              disabled={!canUseMedkit}
              className="px-4 py-2 border border-emerald-600/80 bg-emerald-950/50 hover:bg-emerald-900/60 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-mono-tech text-emerald-200 flex items-center gap-2 cursor-pointer transition-colors tabular-nums"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                APPLY MED-GEL [H] · ×{hud.medkits}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
