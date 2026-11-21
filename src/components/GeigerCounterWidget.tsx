import React, { useEffect, useRef } from 'react';
import { Radiation, Volume2, VolumeX } from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface Props {
  hud: HudSnapshot;
  reducedMotion?: boolean;
  onToggleMute: () => void;
}

function getRadiationTier(level: number): {
  status: 'BACKGROUND' | 'ELEVATED' | 'HIGH RADIATION' | 'CRITICAL DOSE';
  textClass: string;
  borderClass: string;
  strokeHex: string;
  glowHex: string;
} {
  if (level >= 0.78) {
    return {
      status: 'CRITICAL DOSE',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/80',
      strokeHex: '#f87171',
      glowHex: 'rgba(248, 113, 113, 0.32)',
    };
  }
  if (level >= 0.45) {
    return {
      status: 'HIGH RADIATION',
      textClass: 'text-orange-400',
      borderClass: 'border-orange-500/75',
      strokeHex: '#fb923c',
      glowHex: 'rgba(251, 146, 60, 0.25)',
    };
  }
  if (level >= 0.14) {
    return {
      status: 'ELEVATED',
      textClass: 'text-amber-300',
      borderClass: 'border-amber-500/65',
      strokeHex: '#fbbf24',
      glowHex: 'rgba(251, 191, 36, 0.2)',
    };
  }
  return {
    status: 'BACKGROUND',
    textClass: 'text-emerald-400',
    borderClass: 'border-zinc-700/70',
    strokeHex: '#34d399',
    glowHex: 'rgba(52, 211, 153, 0.16)',
  };
}

const TRACE_LEN = 44;

export const GeigerCounterWidget: React.FC<Props> = ({
  hud,
  reducedMotion = false,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ledRef = useRef<HTMLSpanElement>(null);
  const flashOverlayRef = useRef<HTMLDivElement>(null);

  const traceRef = useRef<Float32Array>(new Float32Array(TRACE_LEN));
  const lastSeenClickRef = useRef<number>(hud.lastGeigerClickAt);
  const hudRef = useRef(hud);
  hudRef.current = hud;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const tier = getRadiationTier(hud.radiationLevel);

  useEffect(() => {
    let rafId = 0;
    let lastShiftMs = performance.now();

    const draw = (now: number) => {
      const h = hudRef.current;
      const t = getRadiationTier(h.radiationLevel);
      const buf = traceRef.current;

      // Inject visual ionization spike whenever engine emitted an audible click
      if (h.lastGeigerClickAt > lastSeenClickRef.current) {
        lastSeenClickRef.current = h.lastGeigerClickAt;
        const spikeAmp = Math.min(1, 0.28 + h.radiationLevel * 0.72 + Math.random() * 0.18);
        buf[TRACE_LEN - 1] = Math.max(buf[TRACE_LEN - 1], spikeAmp);
      }

      if (now - lastShiftMs >= 38) {
        lastShiftMs = now;
        for (let i = 0; i < TRACE_LEN - 1; i++) {
          buf[i] = buf[i + 1] * 0.96;
        }
        buf[TRACE_LEN - 1] =
          h.radiationLevel > 0.14
            ? Math.min(0.28, h.radiationLevel * 0.22 * Math.random())
            : 0.03;
      }

      const clickAge = h.lastGeigerClickAt > 0 ? now - h.lastGeigerClickAt : 9999;
      const ledBrightness = reducedMotionRef.current
        ? h.radiationLevel > 0.25
          ? 0.75
          : 0.2
        : clickAge < 95
          ? 1
          : 0.18;

      if (ledRef.current) {
        ledRef.current.style.opacity = String(ledBrightness);
      }
      if (flashOverlayRef.current) {
        const flashAlpha =
          !reducedMotionRef.current && clickAge < 110 && h.radiationLevel >= 0.22
            ? ((110 - clickAge) / 110) * Math.min(0.32, h.radiationLevel * 0.35)
            : 0;
        flashOverlayRef.current.style.opacity = flashAlpha.toFixed(3);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const ch = canvas.height;
          ctx.clearRect(0, 0, w, ch);

          // Baseline grid line
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, ch - 3);
          ctx.lineTo(w, ch - 3);
          ctx.stroke();

          // Bar + spike waveform
          const barW = w / TRACE_LEN;
          for (let i = 0; i < TRACE_LEN; i++) {
            const val = Math.max(0.03, Math.min(1, buf[i]));
            const barH = val * (ch - 5);
            const x = i * barW;
            const y = ch - 3 - barH;
            ctx.fillStyle = val > 0.68 ? '#f87171' : val > 0.38 ? '#fbbf24' : t.strokeHex;
            ctx.globalAlpha = 0.35 + (i / TRACE_LEN) * 0.65;
            ctx.fillRect(x, y, Math.max(1.5, barW - 1.2), barH);
          }
          ctx.globalAlpha = 1;
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      className={`relative w-56 sm:w-64 bg-[#07090d]/85 border ${tier.borderClass} px-3 py-2 pointer-events-auto select-none transition-colors`}
      style={{
        boxShadow:
          hud.radiationLevel >= 0.25 ? `0 0 18px ${tier.glowHex}` : undefined,
      }}
    >
      {/* Click transient flash layer */}
      <div
        ref={flashOverlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0,
          backgroundColor: tier.strokeHex,
        }}
      />

      {/* Top Row: Label + Audible Click LED + Mute Toggle */}
      <div className="relative flex items-center justify-between gap-2 text-[10px] font-mono-tech">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            ref={ledRef}
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: tier.strokeHex, opacity: 0.25 }}
          />
          <Radiation className={`w-3.5 h-3.5 shrink-0 ${tier.textClass}`} />
          <span className="text-zinc-200 font-semibold tracking-wider truncate">
            GEIGER COUNTER
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleMute}
          title={hud.geigerMuted ? 'Unmute Geiger Clicks' : 'Mute Geiger Clicks'}
          className="px-1.5 py-0.5 bg-black/45 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 flex items-center gap-1 cursor-pointer shrink-0"
        >
          {hud.geigerMuted ? (
            <VolumeX className="w-3 h-3 text-zinc-400" />
          ) : (
            <Volume2 className={`w-3 h-3 ${tier.textClass}`} />
          )}
          <span className="text-[9px]">{hud.geigerMuted ? 'MUTED' : 'AUDIO'}</span>
        </button>
      </div>

      {/* Live Radiation Spike Oscilloscope */}
      <div className="relative mt-1.5 bg-[#040609]/90 border border-zinc-800/90 px-1.5 py-1">
        <canvas ref={canvasRef} width={220} height={30} className="w-full h-7 block" />
      </div>

      {/* Digital mSv/h, CPM & Status Readout */}
      <div className="relative mt-1.5 flex items-baseline justify-between gap-2 font-mono-tech tabular-nums">
        <div>
          <span className={`text-sm font-bold ${tier.textClass}`}>
            {hud.radiationMsv.toFixed(1)}
          </span>
          <span className="text-[10px] text-zinc-400 ml-1">mSv/h</span>
        </div>
        <div className="text-[10px] text-zinc-300">{hud.radiationCpm} CPM</div>
        <div className={`text-[10px] font-semibold ${tier.textClass}`}>{tier.status}</div>
      </div>

      {/* Active Radiation Source Warning */}
      {hud.radiationSourceLabel && (
        <div className="relative mt-1 pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[9px] font-mono-tech tracking-wider">
          <span className="text-zinc-400">SOURCE</span>
          <span className={`${tier.textClass} font-semibold truncate max-w-[165px]`}>
            {hud.radiationSourceLabel}
          </span>
        </div>
      )}
    </div>
  );
};
