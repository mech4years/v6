import React from 'react';
import { Eye, Radio, ShieldOff, Sparkles } from 'lucide-react';
import { EndingId } from '../game/types';

interface Props {
  secretUnlocked: boolean;
  onSelectEnding: (ending: EndingId) => void;
}

export const EndingModal: React.FC<Props> = ({ secretUnlocked, onSelectEnding }) => {
  const options: {
    id: EndingId;
    title: string;
    tag: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
  }[] = [
    {
      id: 'regular',
      title: 'OPTION 1 — THE REGULAR ENDING: THE LAST SIGNAL',
      tag: 'REGULAR ENDING // THE SIGNAL SILENCED',
      description:
        'Silence the corrupted satellite network. The signal fades, monsters collapse, sunlight reaches the ruined streets, and humanity begins to rebuild under a fading red sky.',
      icon: <Radio className="w-5 h-5 text-sky-400" />,
      accent: 'border-sky-700/80 hover:border-sky-500 bg-[#091118]',
    },
    ...(secretUnlocked
      ? [
          {
            id: 'secret' as EndingId,
            title: 'OPTION 2 — THE SECRET ENDING: THE THING BEYOND THE STARS',
            tag: 'SECRET ENDING // <THE ONE WHO SAW THE TRUTH>',
            description:
              'THEY were never the invaders—they were running from something far worse. Discover the cosmic truth, the approaching gigantic silhouette, and the terrifying next threat.',
            icon: <Eye className="w-5 h-5 text-amber-400" />,
            accent: 'border-amber-600 hover:border-amber-400 bg-[#141008] animate-pulse',
          },
        ]
      : []),
    {
      id: 'A',
      title: 'SHUT DOWN HELIOS',
      tag: 'ENDING A // SEVER THE NETWORK',
      description:
        'Detonate the spire capacitors and permanently sever every satellite relay on Earth. The orbital signal dies—yet beneath the crust, the metallic roots remain alive.',
      icon: <ShieldOff className="w-5 h-5 text-red-400" />,
      accent: 'border-red-700/80 hover:border-red-500 bg-[#14090b]',
    },
    {
      id: 'B',
      title: 'REDIRECT THE SIGNAL',
      tag: 'ENDING B // PHASE INVERSION',
      description:
        'Invert the 4.18 Hz carrier frequency away from solar coordinates. The biomechanical infection enters dormancy, giving surviving bunkers time to reclaim the surface.',
      icon: <Radio className="w-5 h-5 text-sky-400" />,
      accent: 'border-sky-700/80 hover:border-sky-500 bg-[#091118]',
    },
    {
      id: 'C',
      title: 'ANSWER THE SIGNAL',
      tag: 'ENDING C // DEEP-SPACE SYNTHESIS',
      description:
        'Open the Master HELIOS Spire at full transmission power and broadcast humanity’s signature directly toward what waits beyond the Moon.',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      accent: 'border-amber-700/80 hover:border-amber-500 bg-[#141008]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl bg-[#080a0f] border border-zinc-700 p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-2 border-b border-zinc-800 pb-5">
          <div className="text-xs font-mono-tech tracking-[0.28em] text-red-400">
            LEVEL 12 // MASTER HELIOS CONTROL SPIRE
          </div>
          <h2 className="font-display text-3xl font-bold tracking-wider text-zinc-100">
            CHOOSE HUMANITY’S PROTOCOL
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            THE FORGE lies defeated with fewer than 6 qualifying hits recorded! Select your final ending protocol.
          </p>
          {secretUnlocked && (
            <div className="inline-block mt-2 px-3 py-1 bg-amber-950/80 border border-amber-600 text-amber-300 text-xs font-mono-tech tracking-widest">
              SECRET EASTER EGG UNLOCKED: THE THING BEYOND THE STARS
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelectEnding(opt.id)}
              className={`w-full text-left border p-5 transition-colors cursor-pointer space-y-1.5 ${opt.accent}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono-tech tracking-widest text-zinc-300">
                  {opt.tag}
                </span>
                {opt.icon}
              </div>
              <div className="font-display text-xl font-bold tracking-wide text-zinc-100">
                {opt.title}
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
