import React, { useState } from 'react';
import { EducationalDiagramType, EducationalPartDef } from '../game/types';

interface EducationalDiagramProps {
  diagramType: EducationalDiagramType;
  parts: EducationalPartDef[];
  compact?: boolean;
}

interface Callout {
  label: string;
  tx: number;
  ty: number;
  lx: number;
  ly: number;
  align?: 'start' | 'middle' | 'end';
  color?: string;
}

export const EducationalDiagram: React.FC<EducationalDiagramProps> = ({
  diagramType,
  parts,
  compact = false,
}) => {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const renderCallouts = (callouts: Callout[]) =>
    callouts.map((c) => {
      const active =
        hoveredLabel !== null && hoveredLabel.toLowerCase() === c.label.toLowerCase();
      const stroke = active ? '#fbbf24' : c.color ?? '#38bdf8';
      const anchor = c.align ?? (c.lx < c.tx ? 'end' : c.lx > c.tx ? 'start' : 'middle');
      const midX = c.lx + (c.tx - c.lx) * 0.35;
      const boxW = Math.max(92, c.label.length * 6.5 + 16);
      const boxX =
        anchor === 'end' ? c.lx - boxW : anchor === 'middle' ? c.lx - boxW / 2 : c.lx;

      return (
        <g
          key={c.label}
          className="cursor-pointer"
          onMouseEnter={() => setHoveredLabel(c.label)}
          onMouseLeave={() => setHoveredLabel(null)}
        >
          <polyline
            points={`${c.tx},${c.ty} ${midX},${c.ly} ${c.lx},${c.ly}`}
            fill="none"
            stroke={stroke}
            strokeWidth={active ? 2.2 : 1.4}
            strokeDasharray={active ? undefined : '3 2'}
          />
          <circle cx={c.tx} cy={c.ty} r={active ? 4.5 : 3.5} fill={stroke} />
          <rect
            x={boxX}
            y={c.ly - 11}
            width={boxW}
            height={21}
            rx={3}
            fill={active ? '#1e293b' : '#090d14'}
            stroke={stroke}
            strokeWidth={active ? 1.5 : 0.9}
            fillOpacity={0.94}
          />
          <text
            x={anchor === 'end' ? c.lx - 8 : anchor === 'middle' ? c.lx : c.lx + 8}
            y={c.ly + 3}
            textAnchor={anchor}
            fill={active ? '#fef08a' : '#e2e8f0'}
            fontSize="10.5"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight="600"
          >
            {c.label}
          </text>
        </g>
      );
    });

  const renderDiagramScene = () => {
    switch (diagramType) {
      case 'meteor': {
        const callouts: Callout[] = [
          { label: 'Meteoroid', tx: 140, ty: 68, lx: 198, ly: 42, align: 'start', color: '#94a3b8' },
          { label: 'Atmosphere', tx: 465, ty: 105, lx: 492, ly: 58, align: 'start', color: '#38bdf8' },
          { label: 'Atmospheric entry', tx: 266, ty: 128, lx: 165, ly: 152, align: 'end', color: '#f97316' },
          { label: 'Meteor', tx: 332, ty: 168, lx: 432, ly: 162, align: 'start', color: '#fbbf24' },
          { label: 'Meteorite', tx: 416, ty: 242, lx: 295, ly: 248, align: 'end', color: '#34d399' },
        ];
        return (
          <>
            <defs>
              <radialGradient id="earthGrad" cx="50%" cy="100%" r="85%">
                <stop offset="0%" stopColor="#1e3a5f" />
                <stop offset="65%" stopColor="#0f2537" />
                <stop offset="100%" stopColor="#08131d" />
              </radialGradient>
              <linearGradient id="plasmaTrail" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.1" />
                <stop offset="65%" stopColor="#f97316" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* Outer space */}
            <circle cx="80" cy="36" r="1.2" fill="#cbd5e1" />
            <circle cx="215" cy="24" r="1" fill="#94a3b8" />
            <circle cx="520" cy="32" r="1.3" fill="#cbd5e1" />
            <circle cx="585" cy="86" r="1" fill="#e2e8f0" />
            {/* Atmosphere Arc */}
            <path d="M 30 225 Q 320 60 610 225" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />
            <path d="M 10 245 Q 320 92 630 245 L 630 285 L 10 285 Z" fill="url(#earthGrad)" opacity="0.55" />
            {/* Ground horizon */}
            <path d="M 0 248 Q 320 222 640 248 L 640 290 L 0 290 Z" fill="#18222e" stroke="#334155" strokeWidth="1.5" />
            {/* Crater */}
            <path d="M 392 241 Q 416 254 440 241" fill="#0b1118" stroke="#64748b" strokeWidth="1.5" />
            {/* Meteoroid in Space */}
            <polygon points="124,62 140,56 154,66 146,78 128,76" fill="#64748b" stroke="#cbd5e1" strokeWidth="1.2" />
            {/* Trajectory */}
            <line x1="154" y1="72" x2="412" y2="236" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 4" opacity="0.55" />
            {/* Luminous Meteor Streak */}
            <path d="M 248 118 L 355 184 L 340 194 L 242 126 Z" fill="url(#plasmaTrail)" />
            <ellipse cx="348" cy="186" rx="16" ry="9" transform="rotate(32 348 186)" fill="#f97316" opacity="0.7" />
            <circle cx="348" cy="186" r="7" fill="#fef08a" />
            {/* Meteorite on Ground */}
            <polygon points="409,239 417,234 424,240 421,246 411,245" fill="#475569" stroke="#34d399" strokeWidth="1.5" />
            {renderCallouts(callouts)}
          </>
        );
      }

      case 'generator': {
        const callouts: Callout[] = [
          { label: 'Engine / energy source', tx: 145, ty: 150, lx: 158, ly: 52, align: 'end', color: '#f97316' },
          { label: 'Rotor', tx: 300, ty: 142, lx: 258, ly: 42, align: 'end', color: '#fbbf24' },
          { label: 'Stator', tx: 300, ty: 94, lx: 382, ly: 42, align: 'start', color: '#38bdf8' },
          { label: 'Cooling system', tx: 222, ty: 196, lx: 162, ly: 248, align: 'end', color: '#22d3ee' },
          { label: 'Control panel', tx: 424, ty: 136, lx: 492, ly: 86, align: 'start', color: '#a78bfa' },
          { label: 'Electrical output', tx: 468, ty: 186, lx: 492, ly: 234, align: 'start', color: '#34d399' },
        ];
        return (
          <>
            {/* Base Skid */}
            <rect x="78" y="206" width="415" height="16" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.4" />
            {/* Prime Mover Engine */}
            <rect x="92" y="108" width="110" height="94" rx="6" fill="#273244" stroke="#f97316" strokeWidth="1.5" />
            <line x1="106" y1="126" x2="188" y2="126" stroke="#64748b" strokeWidth="3" />
            <line x1="106" y1="144" x2="188" y2="144" stroke="#64748b" strokeWidth="3" />
            <line x1="106" y1="162" x2="188" y2="162" stroke="#64748b" strokeWidth="3" />
            {/* Drive Shaft */}
            <rect x="202" y="144" width="44" height="14" fill="#94a3b8" />
            {/* Stator Outer Housing + Copper Coils */}
            <rect x="242" y="88" width="122" height="122" rx="14" fill="#162231" stroke="#38bdf8" strokeWidth="2" />
            <rect x="256" y="96" width="94" height="18" rx="4" fill="#b45309" stroke="#f59e0b" strokeWidth="1" />
            <rect x="256" y="188" width="94" height="18" rx="4" fill="#b45309" stroke="#f59e0b" strokeWidth="1" />
            {/* Spinning Rotor Core */}
            <circle cx="303" cy="151" r="32" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
            <rect x="282" y="142" width="42" height="18" rx="3" fill="#fbbf24" fillOpacity="0.28" stroke="#fbbf24" />
            <text x="293" y="155" fill="#fef08a" fontSize="11" fontWeight="700">N</text>
            <text x="307" y="155" fill="#93c5fd" fontSize="11" fontWeight="700">S</text>
            {/* Cooling Fan */}
            <rect x="205" y="176" width="32" height="28" rx="4" fill="#0e7490" fillOpacity="0.45" stroke="#22d3ee" />
            <line x1="212" y1="183" x2="230" y2="197" stroke="#22d3ee" strokeWidth="2" />
            <line x1="230" y1="183" x2="212" y2="197" stroke="#22d3ee" strokeWidth="2" />
            {/* Control Panel */}
            <rect x="382" y="102" width="80" height="98" rx="5" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" />
            <rect x="394" y="114" width="56" height="28" rx="3" fill="#090d14" stroke="#38bdf8" />
            <polyline points="400,132 410,124 420,134 432,120 444,128" fill="none" stroke="#34d399" strokeWidth="1.8" />
            <circle cx="404" cy="160" r="5" fill="#34d399" />
            <circle cx="422" cy="160" r="5" fill="#fbbf24" />
            <circle cx="440" cy="160" r="5" fill="#ef4444" />
            {/* Output Bus */}
            <path d="M 462 178 L 488 178 L 488 196 L 462 196" fill="none" stroke="#34d399" strokeWidth="3" />
            {renderCallouts(callouts)}
          </>
        );
      }

      case 'tree': {
        const callouts: Callout[] = [
          { label: 'Crown', tx: 320, ty: 58, lx: 432, ly: 42, align: 'start', color: '#4ade80' },
          { label: 'Leaves', tx: 256, ty: 88, lx: 176, ly: 66, align: 'end', color: '#86efac' },
          { label: 'Branches', tx: 344, ty: 128, lx: 444, ly: 120, align: 'start', color: '#fbbf24' },
          { label: 'Bark', tx: 307, ty: 178, lx: 196, ly: 172, align: 'end', color: '#d97706' },
          { label: 'Trunk', tx: 332, ty: 198, lx: 438, ly: 198, align: 'start', color: '#f59e0b' },
          { label: 'Roots', tx: 300, ty: 248, lx: 194, ly: 252, align: 'end', color: '#38bdf8' },
        ];
        return (
          <>
            {/* Soil Strata */}
            <rect x="20" y="226" width="600" height="58" rx="4" fill="#1c1917" stroke="#44403c" />
            <line x1="20" y1="226" x2="620" y2="226" stroke="#22c55e" strokeWidth="2.5" opacity="0.7" />
            {/* Roots */}
            <path d="M 310 226 Q 285 245 245 262 M 315 226 Q 308 258 292 272 M 328 226 Q 355 248 395 264 M 322 226 Q 332 256 346 274" fill="none" stroke="#a16207" strokeWidth="4" strokeLinecap="round" />
            {/* Trunk + Bark texture */}
            <path d="M 304 228 L 308 136 L 332 136 L 336 228 Z" fill="#78350f" stroke="#d97706" strokeWidth="1.5" />
            <line x1="313" y1="152" x2="312" y2="215" stroke="#451a03" strokeWidth="2" />
            <line x1="326" y1="148" x2="327" y2="218" stroke="#451a03" strokeWidth="2" />
            {/* Branches */}
            <path d="M 316 146 L 270 105 M 324 142 L 368 106 M 320 138 L 320 88" fill="none" stroke="#92400e" strokeWidth="6" strokeLinecap="round" />
            {/* Leafy Crown */}
            <circle cx="272" cy="100" r="42" fill="#14532d" fillOpacity="0.88" stroke="#4ade80" strokeWidth="1.2" />
            <circle cx="366" cy="102" r="40" fill="#14532d" fillOpacity="0.88" stroke="#4ade80" strokeWidth="1.2" />
            <circle cx="320" cy="76" r="48" fill="#166534" fillOpacity="0.92" stroke="#86efac" strokeWidth="1.5" />
            {renderCallouts(callouts)}
          </>
        );
      }

      case 'satellite': {
        const callouts: Callout[] = [
          { label: 'Solar panels', tx: 162, ty: 146, lx: 152, ly: 52, align: 'end', color: '#38bdf8' },
          { label: 'Antenna', tx: 320, ty: 78, lx: 405, ly: 44, align: 'start', color: '#fbbf24' },
          { label: 'Communication equipment', tx: 344, ty: 112, lx: 432, ly: 92, align: 'start', color: '#a78bfa' },
          { label: 'Main body', tx: 316, ty: 154, lx: 440, ly: 148, align: 'start', color: '#f59e0b' },
          { label: 'Power system', tx: 292, ty: 174, lx: 192, ly: 224, align: 'end', color: '#34d399' },
          { label: 'Sensors', tx: 328, ty: 192, lx: 422, ly: 228, align: 'start', color: '#22d3ee' },
        ];
        return (
          <>
            {/* Stars */}
            <circle cx="65" cy="40" r="1.2" fill="#e2e8f0" />
            <circle cx="560" cy="48" r="1.2" fill="#e2e8f0" />
            <circle cx="595" cy="220" r="1" fill="#94a3b8" />
            {/* Left Solar Wing */}
            <rect x="86" y="114" width="160" height="64" rx="3" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="126" y1="114" x2="126" y2="178" stroke="#7dd3fc" strokeWidth="0.9" />
            <line x1="166" y1="114" x2="166" y2="178" stroke="#7dd3fc" strokeWidth="0.9" />
            <line x1="206" y1="114" x2="206" y2="178" stroke="#7dd3fc" strokeWidth="0.9" />
            <line x1="86" y1="146" x2="246" y2="146" stroke="#7dd3fc" strokeWidth="0.9" />
            <rect x="246" y="140" width="32" height="12" fill="#64748b" />
            {/* Right Solar Wing */}
            <rect x="394" y="114" width="160" height="64" rx="3" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="434" y1="114" x2="434" y2="178" stroke="#7dd3fc" strokeWidth="0.9" />
            <line x1="474" y1="114" x2="474" y2="178" stroke="#7dd3fc" strokeWidth="0.9" />
            <line x1="514" y1="114" x2="514" y2="178" stroke="#7dd3fc" strokeWidth="0.9" />
            <line x1="394" y1="146" x2="554" y2="146" stroke="#7dd3fc" strokeWidth="0.9" />
            <rect x="362" y="140" width="32" height="12" fill="#64748b" />
            {/* Main Bus */}
            <rect x="278" y="106" width="84" height="82" rx="6" fill="#78350f" stroke="#fbbf24" strokeWidth="1.8" />
            <rect x="288" y="160" width="32" height="20" rx="2" fill="#064e3b" stroke="#34d399" />
            {/* Comm Equipment Module */}
            <rect x="298" y="96" width="44" height="18" rx="2" fill="#312e81" stroke="#a78bfa" />
            {/* Parabolic Antenna */}
            <path d="M 288 84 Q 320 102 352 84" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <line x1="320" y1="93" x2="320" y2="66" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="320" cy="64" r="4" fill="#fbbf24" />
            {/* Optical Sensor Lens */}
            <circle cx="332" cy="192" r="10" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
            <circle cx="332" cy="192" r="4" fill="#22d3ee" />
            {renderCallouts(callouts)}
          </>
        );
      }

      case 'mech': {
        const callouts: Callout[] = [
          { label: 'Optical sensor head', tx: 320, ty: 68, lx: 416, ly: 48, align: 'start', color: '#ef4444' },
          { label: 'Armored chassis', tx: 300, ty: 122, lx: 196, ly: 86, align: 'end', color: '#94a3b8' },
          { label: 'Fictional organic core', tx: 320, ty: 132, lx: 422, ly: 122, align: 'start', color: '#fbbf24' },
          { label: 'Actuator joint', tx: 274, ty: 162, lx: 192, ly: 168, align: 'end', color: '#38bdf8' },
          { label: 'Power conduit', tx: 356, ty: 198, lx: 432, ly: 204, align: 'start', color: '#34d399' },
        ];
        return (
          <>
            {/* Humanoid Mech Silhouette */}
            <rect x="302" y="54" width="36" height="28" rx="6" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="314" cy="68" r="4.5" fill="#ef4444" />
            <circle cx="329" cy="68" r="3" fill="#fbbf24" />
            {/* Torso */}
            <polygon points="280,88 360,88 346,162 294,162" fill="#1e293b" stroke="#64748b" strokeWidth="1.8" />
            {/* Core */}
            <circle cx="320" cy="126" r="16" fill="#7f1d1d" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="320" cy="126" r="7" fill="#f97316" />
            {/* Arms */}
            <rect x="252" y="92" width="22" height="66" rx="6" fill="#334155" stroke="#64748b" />
            <rect x="366" y="92" width="22" height="66" rx="6" fill="#334155" stroke="#64748b" />
            <circle cx="274" cy="160" r="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            {/* Legs */}
            <rect x="292" y="166" width="22" height="86" rx="5" fill="#334155" stroke="#64748b" />
            <rect x="326" y="166" width="22" height="86" rx="5" fill="#334155" stroke="#64748b" />
            <path d="M 342 152 Q 362 178 352 214" fill="none" stroke="#34d399" strokeWidth="2.5" />
            {renderCallouts(callouts)}
          </>
        );
      }

      case 'vines': {
        const callouts: Callout[] = [
          { label: 'Host surface', tx: 224, ty: 120, lx: 162, ly: 66, align: 'end', color: '#94a3b8' },
          { label: 'Photosynthetic leaves', tx: 332, ty: 86, lx: 422, ly: 68, align: 'start', color: '#4ade80' },
          { label: 'Tendrils', tx: 282, ty: 132, lx: 424, ly: 132, align: 'start', color: '#fbbf24' },
          { label: 'Climbing stem', tx: 266, ty: 184, lx: 420, ly: 194, align: 'start', color: '#34d399' },
          { label: 'Root anchor', tx: 256, ty: 242, lx: 168, ly: 246, align: 'end', color: '#38bdf8' },
        ];
        return (
          <>
            <rect x="210" y="42" width="60" height="214" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <rect x="40" y="246" width="560" height="36" fill="#1c1917" stroke="#44403c" />
            <path d="M 256 248 Q 285 205 262 162 T 288 84 T 320 48" fill="none" stroke="#22c55e" strokeWidth="4" />
            <path d="M 272 146 Q 292 132 276 122 Q 264 116 282 108" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <ellipse cx="326" cy="84" rx="18" ry="9" transform="rotate(-24 326 84)" fill="#16a34a" stroke="#86efac" />
            <ellipse cx="304" cy="118" rx="16" ry="8" transform="rotate(20 304 118)" fill="#16a34a" stroke="#86efac" />
            <ellipse cx="294" cy="186" rx="16" ry="8" transform="rotate(-15 294 186)" fill="#15803d" stroke="#86efac" />
            {renderCallouts(callouts)}
          </>
        );
      }

      default: {
        // Clean, crisp dynamic schematic using exact mainParts of any remaining technical/scientific subject
        const positions: { tx: number; ty: number; lx: number; ly: number; align: 'start' | 'end' }[] = [
          { tx: 270, ty: 108, lx: 182, ly: 56, align: 'end' },
          { tx: 370, ty: 108, lx: 454, ly: 56, align: 'start' },
          { tx: 262, ty: 152, lx: 174, ly: 152, align: 'end' },
          { tx: 378, ty: 152, lx: 462, ly: 152, align: 'start' },
          { tx: 286, ty: 204, lx: 186, ly: 244, align: 'end' },
          { tx: 356, ty: 204, lx: 454, ly: 244, align: 'start' },
        ];
        const palette = ['#38bdf8', '#fbbf24', '#34d399', '#a78bfa', '#f97316', '#22d3ee'];
        const callouts: Callout[] = parts.slice(0, 6).map((p, idx) => ({
          label: p.label,
          ...positions[idx],
          color: palette[idx % palette.length],
        }));
        return (
          <>
            {/* Technical Modular Blueprint Core */}
            <rect x="236" y="76" width="168" height="148" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
            <rect x="256" y="96" width="128" height="108" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
            <circle cx="320" cy="150" r="34" fill="#090d14" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="5 3" />
            <circle cx="320" cy="150" r="14" fill="#0284c7" fillOpacity="0.45" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="256" y1="150" x2="286" y2="150" stroke="#34d399" strokeWidth="2" />
            <line x1="354" y1="150" x2="384" y2="150" stroke="#34d399" strokeWidth="2" />
            <line x1="320" y1="96" x2="320" y2="116" stroke="#a78bfa" strokeWidth="2" />
            <line x1="320" y1="184" x2="320" y2="204" stroke="#f97316" strokeWidth="2" />
            {renderCallouts(callouts)}
          </>
        );
      }
    }
  };

  const activePart = parts.find(
    (p) => hoveredLabel && p.label.toLowerCase() === hoveredLabel.toLowerCase()
  );

  return (
    <div className="rounded-lg border border-slate-700/80 bg-[#070b11] p-3">
      <div className="flex items-center justify-between text-[10px] font-mono-tech uppercase tracking-[0.2em] text-sky-400 mb-2">
        <span>LABELLED SCIENTIFIC DIAGRAM</span>
        <span className="text-slate-400">HOVER LABELS TO INSPECT PARTS</span>
      </div>
      <svg
        viewBox="0 0 640 290"
        className={`w-full ${compact ? 'max-h-[210px]' : 'max-h-[270px]'} select-none rounded bg-[#05080d] border border-slate-800`}
        role="img"
        aria-label={`Diagram for ${diagramType}`}
      >
        <defs>
          <pattern id="gridMinor" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1e293b" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="640" height="290" fill="url(#gridMinor)" />
        {renderDiagramScene()}
      </svg>
      {activePart && (
        <div className="mt-2 px-3 py-1.5 rounded bg-amber-950/35 border border-amber-500/40 text-xs text-amber-100">
          <span className="font-bold text-amber-300 uppercase mr-2">{activePart.label}:</span>
          {activePart.role}
        </div>
      )}
    </div>
  );
};
