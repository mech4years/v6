import React, { useState } from 'react';
import { Film, Lock, Play, Sparkles, X, Radio, Eye, Compass, ChevronRight } from 'lucide-react';
import { CampaignState, CutsceneTargetId } from '../game/types';
import { LEVEL_CUTSCENE_DEFS } from '../game/levelCutscenes';

interface Props {
  campaign: CampaignState;
  onSelectCutscene: (targetId: CutsceneTargetId) => void;
  onClose: () => void;
}

interface ArchiveEntry {
  id: CutsceneTargetId;
  kind: 'intro' | 'outro' | 'prologue' | 'ending';
  label: string;
  tag: string;
  reqLevel: number;
  isSecret?: boolean;
}

const ARCHIVE_ENTRIES: ArchiveEntry[] = [
  // Prologue
  { id: 'cutscene_intro', kind: 'prologue', label: 'PROLOGUE: YEAR 3059', tag: 'ORBITAL IMPACT EVENT', reqLevel: 1 },

  // Level 1
  { id: 'level_01_intro', kind: 'intro', label: 'LVL 01 OPENING // THE FALLEN CITY', tag: 'QUARANTINE ZONE INFILTRATION & THE SCRAPPER', reqLevel: 1 },
  { id: 'level_01_outro', kind: 'outro', label: 'LVL 01 OUTRO // THE FALLEN CITY', tag: 'THE SIGNAL IS COMING FROM SOMEWHERE ELSE', reqLevel: 1 },

  // Level 2
  { id: 'level_02_intro', kind: 'intro', label: 'LVL 02 OPENING // THE SILENT ESTATES', tag: 'VILLA OVERGROWTH & THE CRAWLER AMBUSH', reqLevel: 2 },
  { id: 'level_02_outro', kind: 'outro', label: 'LVL 02 OUTRO // THE SILENT ESTATES', tag: 'THEY WERE TAKING SOMETHING WITH THEM', reqLevel: 2 },

  // Level 3
  { id: 'level_03_intro', kind: 'intro', label: 'LVL 03 OPENING // THE DEAD MALL', tag: 'RETAIL CONCOURSE & THE WATCHER RED SWEEP', reqLevel: 3 },
  { id: 'level_03_outro', kind: 'outro', label: 'LVL 03 OUTRO // THE DEAD MALL', tag: 'THE ANSWER IS ABOVE THE CITY', reqLevel: 3 },

  // Level 4
  { id: 'level_04_intro', kind: 'intro', label: 'LVL 04 OPENING // THE DEAD CONSTRUCTION ZONE', tag: '280M TOWER CRANE & THE HUNTER IN THE STORM', reqLevel: 4 },
  { id: 'level_04_outro', kind: 'outro', label: 'LVL 04 OUTRO // THE DEAD CONSTRUCTION ZONE', tag: 'THE CITY WAS BUILT OVER SOMETHING', reqLevel: 4 },

  // Level 5
  { id: 'level_05_intro', kind: 'intro', label: 'LVL 05 OPENING // THE UNDERGROUND', tag: 'MOLTEN SLAG CRUCIBLE & THE FORGEMASTER HAMMER', reqLevel: 5 },
  { id: 'level_05_outro', kind: 'outro', label: 'LVL 05 OUTRO // THE UNDERGROUND', tag: 'THE FIRST EXPERIMENT BEGAN HERE', reqLevel: 5 },

  // Level 6
  { id: 'level_06_intro', kind: 'intro', label: 'LVL 06 OPENING // THE FORGOTTEN LABORATORY', tag: 'CRYO CHAMBERS & THE SENTINEL AWAKENING', reqLevel: 6 },
  { id: 'level_06_outro', kind: 'outro', label: 'LVL 06 OUTRO // THE FORGOTTEN LABORATORY', tag: 'THEY HAVE REACHED OUR WEAPONS', reqLevel: 6 },

  // Level 7
  { id: 'level_07_intro', kind: 'intro', label: 'LVL 07 OPENING // THE IRON GRAVEYARD', tag: 'FLOODED TANKS & THE DROWNED MACHINE SONAR', reqLevel: 7 },
  { id: 'level_07_outro', kind: 'outro', label: 'LVL 07 OUTRO // THE IRON GRAVEYARD', tag: 'THE SOURCE IS STILL ALIVE', reqLevel: 7 },

  // Level 8
  { id: 'level_08_intro', kind: 'intro', label: 'LVL 08 OPENING // GROUND ZERO', tag: 'METEOR CALDERA & THE GUARDIAN ROOT WARDEN', reqLevel: 8 },
  { id: 'level_08_outro', kind: 'outro', label: 'LVL 08 OUTRO // GROUND ZERO', tag: 'THE LAST DEFENCE IS A MONSTER', reqLevel: 8 },

  // Level 9
  { id: 'level_09_intro', kind: 'intro', label: 'LVL 09 OPENING // THE TITANFORGED', tag: 'ARES-IX ARENA & 450-TON SIEGE LEVIATHAN', reqLevel: 9 },
  { id: 'level_09_outro', kind: 'outro', label: 'LVL 09 OUTRO // THE TITANFORGED', tag: 'THE SIGNAL MUST BE STOPPED', reqLevel: 9 },

  // Level 10
  { id: 'level_10_intro', kind: 'intro', label: 'LVL 10 OPENING // THE FINAL SIGNAL', tag: '18M PARABOLIC DISH & HELIOS SHIELD UNIT', reqLevel: 10 },
  { id: 'level_10_outro', kind: 'outro', label: 'LVL 10 OUTRO // THE FINAL SIGNAL', tag: 'THE SIGNAL WAS NOT THE ONLY MESSAGE', reqLevel: 10 },

  // Level 11
  { id: 'level_11_intro', kind: 'intro', label: 'LVL 11 OPENING // BEYOND EARTH', tag: 'ZERO-G OBSERVATORY & VOID WALKER CHERENKOV', reqLevel: 11 },
  { id: 'level_11_outro', kind: 'outro', label: 'LVL 11 OUTRO // BEYOND EARTH', tag: 'THEY WERE NOT INVADERS. THEY WERE FLEEING', reqLevel: 11 },

  // Level 12
  { id: 'level_12_intro', kind: 'intro', label: 'LVL 12 OPENING // THE BEGINNING', tag: 'SUBTERRANEAN ANCHOR CORE & THE ORIGIN', reqLevel: 12 },
  { id: 'level_12_outro', kind: 'outro', label: 'LVL 12 OUTRO // THE BEGINNING', tag: 'THE MASTER SPIRE HAS FALLEN', reqLevel: 12 },

  // Endings
  { id: 'ending_regular', kind: 'ending', label: 'CAMPAIGN FINALE: THE LAST SIGNAL', tag: 'THE WORLD HAS ROTTEN. BUT HUMANITY REMAINS', reqLevel: 12 },
  { id: 'ending_secret', kind: 'ending', label: 'SECRET FINALE: THE THING BEYOND THE STARS', tag: 'EASTER EGG // <THE ONE WHO SAW THE TRUTH>', reqLevel: 12, isSecret: true },
];

export const CinematicArchiveModal: React.FC<Props> = ({ campaign, onSelectCutscene, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'intros' | 'outros' | 'finales'>('all');

  const viewedIds = campaign.cinematicsViewedIds || ['cutscene_intro'];
  const unlockAll = campaign.unlockAllChapters;

  const isUnlocked = (entry: ArchiveEntry) => {
    if (unlockAll) return true;
    if (entry.isSecret) {
      return !!campaign.secretEndingUnlocked || viewedIds.includes('ending_secret');
    }
    if (viewedIds.includes(entry.id)) return true;
    if (entry.id === 'cutscene_intro') return true;
    // An intro is unlocked if the level is unlocked
    if (entry.kind === 'intro') {
      return campaign.unlockedLevel >= entry.reqLevel;
    }
    // An outro is unlocked if the level was completed
    const missionKey = `mission_${String(entry.reqLevel).padStart(2, '0')}`;
    return campaign.completedMissionIds.includes(missionKey) || campaign.unlockedLevel > entry.reqLevel;
  };

  const filteredEntries = ARCHIVE_ENTRIES.filter((entry) => {
    if (filter === 'intros') return entry.kind === 'intro';
    if (filter === 'outros') return entry.kind === 'outro';
    if (filter === 'finales') return entry.kind === 'ending' || entry.kind === 'prologue';
    return true;
  });

  const totalUnlocked = ARCHIVE_ENTRIES.filter(isUnlocked).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div className="bg-[#090d14] border border-zinc-800 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-[#06080d]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-950/70 border border-red-800/80 text-red-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-wider text-zinc-100">
                  CINEMATIC ARCHIVE // STORY THEATRE
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono-tech bg-red-950/80 border border-red-800 text-red-300">
                  {totalUnlocked} / {ARCHIVE_ENTRIES.length} UNLOCKED
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono-tech mt-0.5">
                Dynamic Level Introductions, Ending Connections, and the Secret Cosmic Easter Egg.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-2 border border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-900 bg-[#0a0f18] text-xs font-mono-tech overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 border transition-colors cursor-pointer shrink-0 ${
              filter === 'all'
                ? 'border-red-600 bg-red-950/60 text-red-300'
                : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ALL CINEMATICS ({ARCHIVE_ENTRIES.length})
          </button>
          <button
            onClick={() => setFilter('intros')}
            className={`px-3 py-1 border transition-colors cursor-pointer shrink-0 ${
              filter === 'intros'
                ? 'border-red-600 bg-red-950/60 text-red-300'
                : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            LEVEL OPENINGS (12)
          </button>
          <button
            onClick={() => setFilter('outros')}
            className={`px-3 py-1 border transition-colors cursor-pointer shrink-0 ${
              filter === 'outros'
                ? 'border-red-600 bg-red-950/60 text-red-300'
                : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            LEVEL OUTROS & CONNECTIONS (12)
          </button>
          <button
            onClick={() => setFilter('finales')}
            className={`px-3 py-1 border transition-colors cursor-pointer shrink-0 ${
              filter === 'finales'
                ? 'border-red-600 bg-red-950/60 text-red-300'
                : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            PROLOGUE & FINALES (3)
          </button>
        </div>

        {/* Cutscenes Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const unlocked = isUnlocked(entry);
            const def = LEVEL_CUTSCENE_DEFS[entry.id];

            return (
              <div
                key={entry.id}
                className={`relative p-4 border transition-all flex flex-col justify-between ${
                  entry.isSecret
                    ? unlocked
                      ? 'border-amber-600/80 bg-gradient-to-br from-amber-950/30 to-zinc-950/90 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'border-amber-900/40 bg-zinc-950/50 opacity-60'
                    : unlocked
                    ? 'border-zinc-800 bg-[#0d121a] hover:border-red-800/80'
                    : 'border-zinc-900 bg-zinc-950/40 opacity-55'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono-tech tracking-wider text-red-500 uppercase">
                      {def?.chapterTag || entry.id}
                    </span>
                    {entry.isSecret && (
                      <span className="px-1.5 py-0.5 text-[9px] font-mono-tech font-bold bg-amber-950 border border-amber-600 text-amber-300 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        SECRET EASTER EGG
                      </span>
                    )}
                    {!entry.isSecret && (
                      <span className="text-[9px] font-mono-tech uppercase text-zinc-500">
                        {entry.kind === 'intro' ? 'MISSION BRIEFING' : entry.kind === 'outro' ? 'STORY TRANSITION' : 'CINEMATIC'}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-base font-bold text-zinc-100 tracking-wide">
                    {def?.title || entry.label}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono-tech mt-1 line-clamp-1">
                    "{entry.tag}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono-tech text-zinc-500">
                    DURATION: {def?.totalDuration ? `${def.totalDuration}s` : '15s'}
                  </span>

                  {unlocked ? (
                    <button
                      onClick={() => onSelectCutscene(entry.id)}
                      className="px-3.5 py-1.5 bg-red-700 hover:bg-red-600 text-white font-mono-tech text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>PLAY SCENE</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono-tech">
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {entry.isSecret
                          ? 'Defeat The Forge with < 6 hits'
                          : entry.kind === 'intro'
                          ? `Reach Level ${entry.reqLevel}`
                          : `Complete Level ${entry.reqLevel}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#06080d] flex items-center justify-between text-xs font-mono-tech text-zinc-400">
          <span>Continuous Science-Fiction Horror Cinematic Chronicle (26 Scenes)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-200 cursor-pointer"
          >
            CLOSE THEATRE
          </button>
        </div>
      </div>
    </div>
  );
};
