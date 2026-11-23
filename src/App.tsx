import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Backpack,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Eye,
  Film,
  HelpCircle,
  Lock,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Shield,
  Skull,
  Unlock,
  UserCheck,
  Users,
  Volume2,
  Wrench,
} from 'lucide-react';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';
import { CharacterShowcase3D } from './components/CharacterShowcase3D';
import { EducationalReaderModal } from './components/EducationalReaderModal';
import { EndingModal } from './components/EndingModal';
import { GameHud } from './components/GameHud';
import { DatapadTab, InventoryDrawer } from './components/InventoryDrawer';
import { MenuBackground3D } from './components/MenuBackground3D';
import { OpeningCutscene } from './components/OpeningCutscene';
import { OperativeIntroCutscene } from './components/OperativeIntroCutscene';
import { LevelCutsceneViewer } from './components/LevelCutsceneViewer';
import { CinematicArchiveModal } from './components/CinematicArchiveModal';
import { PuzzleModal } from './components/PuzzleModal';
import { ScientificDatabaseModal } from './components/ScientificDatabaseModal';
import { SettingsModal } from './components/SettingsModal';
import { TutorialHub } from './components/TutorialHub';
import { WorkbenchModal } from './components/WorkbenchModal';
import { AdminSpawnModal } from './components/AdminSpawnModal';
import { HorrorAudioEngine } from './game/audio';
import {
  CHARACTER_LIST,
  CHARACTERS,
  DEFAULT_SETTINGS,
  FACTIONS,
  MISSIONS,
  STORY_CHARACTERS,
  WEAPONS,
  WORLD_REGIONS,
  loadCampaignState,
  normalizeCharacterId,
  resetCampaignState,
  saveCampaignState,
} from './game/data';
import { FirstPersonGameEngine, SAVE_STORAGE_KEY } from './game/engine';
import {
  CampaignState,
  ChapterStats,
  CharacterId,
  CheckpointSave,
  CutsceneTargetId,
  GameScreen,
  GameSettings,
  HudSnapshot,
} from './game/types';

const SETTINGS_STORAGE_KEY = 'twhr_settings_v1';
const SELECTED_CHAR_STORAGE_KEY = 'twhr_selected_char_v1';
const VIEWED_OP_INTROS_KEY = 'twhr_viewed_op_intros_v1';

function loadSelectedCharacter(): CharacterId {
  try {
    return normalizeCharacterId(localStorage.getItem(SELECTED_CHAR_STORAGE_KEY));
  } catch {
    return 'reaper';
  }
}

function loadViewedOperativeIntros(): CharacterId[] {
  try {
    const raw = localStorage.getItem(VIEWED_OP_INTROS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((id) => normalizeCharacterId(String(id)));
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function loadStoredSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  const isTouch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  return { ...DEFAULT_SETTINGS, touchControls: isTouch && window.innerWidth < 900 };
}

function loadCheckpointSave(): CheckpointSave | null {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CheckpointSave;
  } catch {
    // ignore
  }
  return null;
}

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('cutscene');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>(loadSelectedCharacter);
  const [viewedOperativeIntros, setViewedOperativeIntros] = useState<CharacterId[]>(
    loadViewedOperativeIntros
  );
  const [showcaseCamMode, setShowcaseCamMode] = useState<'full' | 'face'>('full');
  const [selectionConfirmText, setSelectionConfirmText] = useState<string | null>(null);
  const [activeMissionId, setActiveMissionId] = useState<string>('mission_01');
  const [settings, setSettings] = useState<GameSettings>(loadStoredSettings);
  const [campaign, setCampaign] = useState<CampaignState>(loadCampaignState);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [multiplayerModalOpen, setMultiplayerModalOpen] = useState(false);
  const [menuWorkbenchOpen, setMenuWorkbenchOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<DatapadTab>('inventory');
  const [faceCamOpen, setFaceCamOpen] = useState(false);
  const [savedCheckpoint, setSavedCheckpoint] = useState<CheckpointSave | null>(loadCheckpointSave);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [finaleInfo, setFinaleInfo] = useState<{
    title: string;
    summary: string;
    stats?: ChapterStats;
  } | null>(null);
  const [missionTab, setMissionTab] = useState<'missions' | 'world' | 'factions'>('missions');
  const [activeCutsceneTarget, setActiveCutsceneTarget] = useState<CutsceneTargetId>('level_01');
  const [cinemaArchiveOpen, setCinemaArchiveOpen] = useState(false);
  const [isArchiveReplay, setIsArchiveReplay] = useState(false);
  const [isCoopSession, setIsCoopSession] = useState(false);
  const [activeEducationId, setActiveEducationId] = useState<string | null>(null);
  const [databaseOpen, setDatabaseOpen] = useState(false);
  const [adminSpawnModalOpen, setAdminSpawnModalOpen] = useState(false);

  const gameMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FirstPersonGameEngine | null>(null);
  const audioRef = useRef<HorrorAudioEngine | null>(null);
  const pendingRestoreRef = useRef<CheckpointSave | null>(null);
  const introModeRef = useRef<'none' | 'cutscene_end' | 'cutscene_skip'>('none');
  const pendingMissionRef = useRef<{ missionId: string; charId: CharacterId } | null>(null);
  const pendingOpIntroRef = useRef<
    | {
        mode: 'launch';
        missionId: string;
        charId: CharacterId;
        introMode: 'none' | 'cutscene_end' | 'cutscene_skip';
        coopMode?: boolean;
      }
    | { mode: 'replay'; returnScreen: GameScreen }
    | null
  >(null);
  const confirmTimerRef = useRef<number | null>(null);
  const isCoopSessionRef = useRef(isCoopSession);
  isCoopSessionRef.current = isCoopSession;
  const coopSessionInfoRef = useRef<{ sessionId: string; role: 'host' | 'client' }>({
    sessionId: 'coop_local',
    role: 'host',
  });

  if (!audioRef.current) {
    audioRef.current = new HorrorAudioEngine();
  }

  const selectCharacter = useCallback((rawId: CharacterId, showConfirm = false) => {
    const id = normalizeCharacterId(rawId);
    setSelectedCharacter(id);
    try {
      localStorage.setItem(SELECTED_CHAR_STORAGE_KEY, id);
    } catch {
      // ignore
    }
    if (showConfirm) {
      setSelectionConfirmText(`OPERATIVE LOCKED IN // ${CHARACTERS[id].callsign}`);
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = window.setTimeout(() => setSelectionConfirmText(null), 2200);
    }
  }, []);

  const markOperativeIntroViewed = useCallback((charId: CharacterId) => {
    setViewedOperativeIntros((prev) => {
      if (prev.includes(charId)) return prev;
      const next = [...prev, charId];
      try {
        localStorage.setItem(VIEWED_OP_INTROS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const updateCampaign = useCallback((next: CampaignState) => {
    saveCampaignState(next);
    setCampaign(next);
    engineRef.current?.refreshCampaignState(next);
  }, []);

  const recordEducationDiscovery = useCallback((entryId: string) => {
    const cur = loadCampaignState();
    const existing = cur.discoveredEducationIds || ['edu_meteor'];
    if (!existing.includes(entryId)) {
      const next: CampaignState = {
        ...cur,
        discoveredEducationIds: [...existing, entryId],
      };
      saveCampaignState(next);
      setCampaign(next);
      engineRef.current?.refreshCampaignState(next);
    }
  }, []);

  const handleSettingsChange = useCallback((next: GameSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    engineRef.current?.updateSettings(next);
    audioRef.current?.applySettings(next);
  }, []);

  const stopGameEngine = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    audioRef.current?.setBossMusic(false);
    setHud(null);
    setInventoryOpen(false);
    setFaceCamOpen(false);
    setActiveEducationId(null);
    setDatabaseOpen(false);
  }, []);

  const continueLaunchAfterOpIntro = useCallback(
    (
      missionId: string,
      charId: CharacterId,
      introMode: 'none' | 'cutscene_end' | 'cutscene_skip' = 'none'
    ) => {
      // Trigger dynamic level introduction cutscene if starting fresh and setting is on
      if (introMode === 'none' && settings.cinematicIntros !== false) {
        const curDef = MISSIONS.find((m) => m.id === missionId);
        const mNum = curDef?.number ?? 1;
        const introTarget: CutsceneTargetId = `level_${String(mNum).padStart(2, '0')}_intro` as CutsceneTargetId;

        const currentCamp = loadCampaignState();
        const existing = currentCamp.cinematicsViewedIds || ['cutscene_intro'];
        if (!existing.includes(introTarget)) {
          currentCamp.cinematicsViewedIds = Array.from(new Set([...existing, introTarget]));
          saveCampaignState(currentCamp);
          setCampaign(currentCamp);
        }

        pendingMissionRef.current = { missionId, charId };
        setActiveCutsceneTarget(introTarget);
        setIsArchiveReplay(false);
        setScreen('level_cutscene');
        return;
      }

      setScreen('playing');
    },
    [settings.cinematicIntros]
  );

  const launchMission = useCallback(
    (
      missionId: string,
      charIdRaw: CharacterId,
      restore: CheckpointSave | null = null,
      introMode: 'none' | 'cutscene_end' | 'cutscene_skip' = 'none',
      coopMode?: boolean
    ) => {
      const charId = normalizeCharacterId(charIdRaw);
      audioRef.current?.unlock();
      audioRef.current?.playClick(true);
      stopGameEngine();
      if (coopMode !== undefined) {
        setIsCoopSession(coopMode);
        isCoopSessionRef.current = coopMode;
      }
      setActiveMissionId(missionId);
      selectCharacter(charId, false);
      pendingRestoreRef.current = restore;
      introModeRef.current = introMode;
      setFinaleInfo(null);
      setMenuWorkbenchOpen(false);

      // Play personalized operative intro cinematic on first fresh campaign launch with this operative
      if (
        !restore &&
        settings.cinematicIntros !== false &&
        !viewedOperativeIntros.includes(charId)
      ) {
        markOperativeIntroViewed(charId);
        pendingOpIntroRef.current = {
          mode: 'launch',
          missionId,
          charId,
          introMode,
          coopMode,
        };
        setScreen('operative_intro');
        return;
      }

      continueLaunchAfterOpIntro(missionId, charId, introMode);
    },
    [
      stopGameEngine,
      settings.cinematicIntros,
      viewedOperativeIntros,
      markOperativeIntroViewed,
      selectCharacter,
      continueLaunchAfterOpIntro,
    ]
  );

  const replayOperativeIntro = useCallback(
    (charIdRaw: CharacterId) => {
      const charId = normalizeCharacterId(charIdRaw);
      audioRef.current?.unlock();
      audioRef.current?.playClick(true);
      stopGameEngine();
      selectCharacter(charId, false);
      pendingOpIntroRef.current = { mode: 'replay', returnScreen: 'characters' };
      setScreen('operative_intro');
    },
    [stopGameEngine, selectCharacter]
  );

  const launchOpeningCutscene = useCallback(
    (charIdRaw: CharacterId) => {
      const charId = normalizeCharacterId(charIdRaw);
      audioRef.current?.unlock();
      audioRef.current?.playClick(true);
      stopGameEngine();
      setIsCoopSession(false);
      isCoopSessionRef.current = false;
      setActiveMissionId('mission_01');
      selectCharacter(charId, false);
      pendingRestoreRef.current = null;
      setFinaleInfo(null);
      setScreen('cutscene');
    },
    [stopGameEngine, selectCharacter]
  );

  const handleCutsceneComplete = useCallback(() => {
    audioRef.current?.unlock();
    stopGameEngine();
    setActiveMissionId('mission_01');
    pendingRestoreRef.current = null;
    introModeRef.current = 'cutscene_end';
    setFinaleInfo(null);
    if (
      settings.cinematicIntros !== false &&
      !viewedOperativeIntros.includes(selectedCharacter)
    ) {
      markOperativeIntroViewed(selectedCharacter);
      pendingOpIntroRef.current = {
        mode: 'launch',
        missionId: 'mission_01',
        charId: selectedCharacter,
        introMode: 'cutscene_end',
      };
      setScreen('operative_intro');
      return;
    }
    setScreen('playing');
  }, [stopGameEngine, settings.cinematicIntros, viewedOperativeIntros, selectedCharacter, markOperativeIntroViewed]);

  const handleCutsceneSkip = useCallback(() => {
    audioRef.current?.unlock();
    stopGameEngine();
    setActiveMissionId('mission_01');
    pendingRestoreRef.current = null;
    introModeRef.current = 'cutscene_skip';
    setFinaleInfo(null);
    if (
      settings.cinematicIntros !== false &&
      !viewedOperativeIntros.includes(selectedCharacter)
    ) {
      markOperativeIntroViewed(selectedCharacter);
      pendingOpIntroRef.current = {
        mode: 'launch',
        missionId: 'mission_01',
        charId: selectedCharacter,
        introMode: 'cutscene_skip',
      };
      setScreen('operative_intro');
      return;
    }
    setScreen('playing');
  }, [stopGameEngine, settings.cinematicIntros, viewedOperativeIntros, selectedCharacter, markOperativeIntroViewed]);

  useEffect(() => {
    const isGameplay =
      screen === 'playing' ||
      screen === 'paused' ||
      screen === 'dead' ||
      screen === 'mission_complete';

    if (!isGameplay) {
      stopGameEngine();
      setSavedCheckpoint(loadCheckpointSave());
      setCampaign(loadCampaignState());
      return;
    }

    if (engineRef.current || !gameMountRef.current || !audioRef.current) return;

    const introMode = introModeRef.current;
    introModeRef.current = 'none';

    const engine = new FirstPersonGameEngine(
      gameMountRef.current,
      selectedCharacter,
      activeMissionId,
      settings,
      audioRef.current,
      {
        onHudUpdate: (snapshot) => setHud(snapshot),
        onLoreCollected: () => {
          setSavedCheckpoint(loadCheckpointSave());
          setCampaign(loadCampaignState());
        },
        onCampaignSync: (nextCamp) => setCampaign(nextCamp),
        onOpenEducation: (entryId) => {
          recordEducationDiscovery(entryId);
          setActiveEducationId(entryId);
        },
        onOpenAdminMenu: () => setAdminSpawnModalOpen(true),
        onPauseRequested: () => setScreen('paused'),
        onPlayerDied: () => setScreen('dead'),
        onMissionComplete: (title, summary, stats, endingChoice) => {
          const nextCamp = loadCampaignState();
          setCampaign(nextCamp);
          setFinaleInfo({ title, summary, stats });

          let cutsceneTarget: CutsceneTargetId = 'level_01_outro';
          if (activeMissionId === 'mission_12') {
            if (
              endingChoice === 'secret' ||
              (nextCamp.secretEndingUnlocked && endingChoice !== 'regular')
            ) {
              cutsceneTarget = 'ending_secret';
            } else {
              cutsceneTarget = 'ending_regular';
            }
          } else {
            const curDef = MISSIONS.find((m) => m.id === activeMissionId);
            const mNum = curDef?.number ?? 1;
            cutsceneTarget = `level_${String(mNum).padStart(2, '0')}_outro` as CutsceneTargetId;
          }

          const existingViewed = nextCamp.cinematicsViewedIds || ['cutscene_intro'];
          if (!existingViewed.includes(cutsceneTarget)) {
            nextCamp.cinematicsViewedIds = Array.from(new Set([...existingViewed, cutsceneTarget]));
            saveCampaignState(nextCamp);
            setCampaign(nextCamp);
          }

          setActiveCutsceneTarget(cutsceneTarget);
          setIsArchiveReplay(false);
          setScreen('level_cutscene');
        },
      },
      pendingRestoreRef.current,
      introMode,
      campaign
    );
    engine.setCoopSession(
      isCoopSessionRef.current,
      coopSessionInfoRef.current.sessionId,
      coopSessionInfoRef.current.role
    );
    pendingRestoreRef.current = null;
    engineRef.current = engine;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'playing') return;
      if (hud?.activePuzzleId || hud?.workbenchOpen || hud?.endingChoiceOpen) {
        return;
      }
      if (e.code === 'Tab' && !activeEducationId && !databaseOpen) {
        e.preventDefault();
        setInventoryOpen((prev) => {
          const next = !prev;
          if (next) setInventoryTab('inventory');
          engineRef.current?.setPaused(next);
          if (!next) engineRef.current?.requestPointerLock();
          return next;
        });
      } else if (e.code === 'KeyB' && !activeEducationId && !databaseOpen) {
        e.preventDefault();
        if (inventoryOpen && inventoryTab === 'suit') {
          setInventoryOpen(false);
          engineRef.current?.setPaused(false);
          engineRef.current?.requestPointerLock();
        } else {
          setInventoryTab('suit');
          setInventoryOpen(true);
          engineRef.current?.setPaused(true);
        }
      } else if (e.code === 'KeyG' && !activeEducationId && !databaseOpen && !inventoryOpen) {
        e.preventDefault();
        setFaceCamOpen((prev) => !prev);
      } else if (e.code === 'KeyK' && !activeEducationId && !inventoryOpen) {
        e.preventDefault();
        setDatabaseOpen((prev) => {
          const next = !prev;
          engineRef.current?.setPaused(next);
          if (!next) {
            engineRef.current?.requestPointerLock();
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    screen,
    hud?.activePuzzleId,
    hud?.workbenchOpen,
    hud?.endingChoiceOpen,
    activeEducationId,
    databaseOpen,
    inventoryOpen,
    inventoryTab,
  ]);

  useEffect(() => {
    return () => {
      stopGameEngine();
      audioRef.current?.dispose();
    };
  }, [stopGameEngine]);

  const resumeGame = () => {
    setInventoryOpen(false);
    setScreen('playing');
    engineRef.current?.setPaused(false);
    engineRef.current?.requestPointerLock();
  };

  const activeChar = CHARACTERS[normalizeCharacterId(selectedCharacter)];
  const primaryOperatives = CHARACTER_LIST.filter((c) => c.isPrimaryRoster);
  const reserveOperatives = CHARACTER_LIST.filter((c) => !c.isPrimaryRoster);
  const mainChapters = MISSIONS.filter((m) => !m.isBonusArena);
  const completedMainCount = mainChapters.filter((m) =>
    campaign.completedMissionIds.includes(m.id)
  ).length;
  const currentMissionDef = MISSIONS.find((m) => m.id === activeMissionId);
  const nextMissionDef =
    currentMissionDef && !currentMissionDef.isBonusArena && currentMissionDef.number < 12
      ? MISSIONS.find((m) => m.number === currentMissionDef.number + 1 && !m.isBonusArena)
      : undefined;

  const finishOperativeIntro = () => {
    const pending = pendingOpIntroRef.current;
    pendingOpIntroRef.current = null;
    if (!pending) {
      setScreen('menu');
      return;
    }
    if (pending.mode === 'replay') {
      setScreen(pending.returnScreen);
      return;
    }
    continueLaunchAfterOpIntro(pending.missionId, pending.charId, pending.introMode);
  };

  return (
    <div className="relative w-full h-full bg-[#060709] text-zinc-100 overflow-hidden">
      {/* Opening 3D Cinematic Cutscene */}
      {screen === 'cutscene' && audioRef.current && (
        <OpeningCutscene
          audio={audioRef.current}
          onComplete={handleCutsceneComplete}
          onSkip={handleCutsceneSkip}
        />
      )}

      {/* Personalized Operative 3D Intro Cinematic */}
      {screen === 'operative_intro' && audioRef.current && (
        <OperativeIntroCutscene
          characterId={normalizeCharacterId(selectedCharacter)}
          audio={audioRef.current}
          onComplete={finishOperativeIntro}
          onSkip={finishOperativeIntro}
        />
      )}

      {/* Dynamic 3D Cinematic Cutscene (Level Intros & Level Outros / Finales) */}
      {screen === 'level_cutscene' && audioRef.current && (
        <LevelCutsceneViewer
          targetId={activeCutsceneTarget}
          audio={audioRef.current}
          subtitleSize={settings.subtitleSize}
          onComplete={() => {
            if (isArchiveReplay) {
              setScreen('menu');
              setCinemaArchiveOpen(true);
            } else if (activeCutsceneTarget.endsWith('_intro')) {
              if (pendingMissionRef.current) {
                launchMission(
                  pendingMissionRef.current.missionId,
                  pendingMissionRef.current.charId,
                  null,
                  'cutscene_end'
                );
              } else {
                setScreen('playing');
              }
            } else {
              setScreen('mission_complete');
            }
          }}
          onSkip={() => {
            if (isArchiveReplay) {
              setScreen('menu');
              setCinemaArchiveOpen(true);
            } else if (activeCutsceneTarget.endsWith('_intro')) {
              if (pendingMissionRef.current) {
                launchMission(
                  pendingMissionRef.current.missionId,
                  pendingMissionRef.current.charId,
                  null,
                  'cutscene_skip'
                );
              } else {
                setScreen('playing');
              }
            } else {
              setScreen('mission_complete');
            }
          }}
          onDiscoverEducation={recordEducationDiscovery}
          isMultiplayer={isCoopSession}
          partySize={isCoopSession ? 2 : 1}
        />
      )}

      {/* Live 3D Background for Menu / Sub-menus */}
      {(screen === 'menu' ||
        screen === 'missions' ||
        screen === 'credits' ||
        screen === 'settings') && <MenuBackground3D />}

      {/* Main Menu */}
      {screen === 'menu' && (
        <div className="relative z-10 w-full h-full overflow-y-auto flex flex-col justify-between p-5 sm:p-8 lg:px-12 lg:py-7 bg-gradient-to-r from-black/85 via-black/45 to-transparent">
          <div className="flex items-center justify-between text-xs font-mono-tech text-zinc-400">
            <span>YEAR 3062 AD · 12-CHAPTER SURVIVAL HORROR CAMPAIGN</span>
            <span>OPERATIVE: {activeChar.callsign}</span>
          </div>

          <div className="max-w-xl space-y-4 my-auto py-3">
            <div className="space-y-2">
              <p className="text-xs font-mono-tech tracking-[0.25em] text-red-500">
                THE METEORS WERE ONLY THE BEGINNING
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-zinc-100 leading-[0.98]">
                THE WORLD HAS ROTTEN
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-md leading-relaxed">
                Three years after THEY infected Earth’s metals and hijacked the HELIOS satellite grid,
                descend from the ruined Quarantine Zone to the alien chamber beneath the crust.
              </p>
            </div>

            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              <button
                onClick={() => launchOpeningCutscene(selectedCharacter)}
                className="sm:col-span-2 w-full flex items-center justify-between px-4 py-2.5 text-sm bg-red-700 hover:bg-red-600 text-white font-display font-semibold tracking-wider transition-colors cursor-pointer"
              >
                <span>NEW CAMPAIGN (CH.01)</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  audioRef.current?.playClick(true);
                  setMultiplayerModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-zinc-900 hover:bg-zinc-800 border border-red-700/60 text-red-300 font-display font-semibold tracking-wider transition-colors cursor-pointer"
              >
                <span>MULTIPLAYER CO-OP</span>
                <Users className="w-4 h-4 text-red-400 shrink-0" />
              </button>

              <button
                onClick={() => {
                  audioRef.current?.playClick(true);
                  setTutorialOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-display font-semibold tracking-wider transition-colors cursor-pointer"
              >
                <span>INTERACTIVE TUTORIAL</span>
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              </button>

              <button
                disabled={!savedCheckpoint}
                onClick={() => {
                  if (savedCheckpoint) {
                    launchMission(
                      savedCheckpoint.missionId,
                      savedCheckpoint.characterId,
                      savedCheckpoint,
                      'none',
                      false
                    );
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm border font-display font-semibold tracking-wider transition-colors ${
                  savedCheckpoint
                    ? 'bg-[#0b0d12]/90 hover:bg-zinc-900 border-zinc-700 text-zinc-100 cursor-pointer'
                    : 'bg-[#0b0d12]/50 border-zinc-900 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <span>CONTINUE SAVE</span>
                <span className="font-mono-tech text-[10px]">
                  {savedCheckpoint ? savedCheckpoint.missionId.toUpperCase() : 'NO SAVE'}
                </span>
              </button>

              <button
                onClick={() => {
                  audioRef.current?.playClick(true);
                  setScreen('missions');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-[#0b0d12]/90 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-display font-semibold tracking-wider transition-colors cursor-pointer"
              >
                <span>CHAPTERS ({completedMainCount}/12)</span>
                <Crosshair className="w-4 h-4 text-red-400 shrink-0" />
              </button>

              <button
                onClick={() => {
                  audioRef.current?.playClick(true);
                  setCinemaArchiveOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-[#0b0d12]/90 hover:bg-zinc-900 border border-red-900/60 hover:border-red-600 text-red-200 font-display font-semibold tracking-wider transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Film className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="truncate">CINEMATIC ARCHIVE</span>
                </div>
                <span className="font-mono-tech text-[10px] text-red-400 shrink-0">
                  {campaign.cinematicsViewedIds?.length || 1}/14
                </span>
              </button>

              <button
                onClick={() => {
                  audioRef.current?.playClick(true);
                  setScreen('characters');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-[#0b0d12]/90 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-display font-semibold tracking-wider transition-colors cursor-pointer"
              >
                <span>CHARACTERS</span>
                <UserCheck className="w-4 h-4 text-zinc-400 shrink-0" />
              </button>

              <button
                onClick={() => {
                  audioRef.current?.playClick(true);
                  setMenuWorkbenchOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-[#0b0d12]/90 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-display font-semibold tracking-wider transition-colors cursor-pointer"
              >
                <span>WORKBENCH</span>
                <span className="font-mono-tech text-[10px] text-amber-400 tabular-nums shrink-0">
                  {campaign.salvageCores} CORES
                </span>
              </button>

              <button
                onClick={() => {
                  audioRef.current?.playClick(true);
                  setDatabaseOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-[#0b0d12]/90 hover:bg-zinc-900 border border-sky-900/60 hover:border-sky-600 text-sky-200 font-display font-semibold tracking-wider transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">SCIENTIFIC DATABASE</span>
                </div>
                <span className="font-mono-tech text-[10px] text-sky-400 tabular-nums shrink-0">
                  {campaign.discoveredEducationIds?.length || 1}/18
                </span>
              </button>

              <button
                onClick={() => {
                  audioRef.current?.playClick(true);
                  setSettingsOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-[#0b0d12]/90 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-display font-semibold tracking-wider transition-colors cursor-pointer"
              >
                <span>SETTINGS</span>
                <SettingsIcon className="w-4 h-4 text-zinc-400 shrink-0" />
              </button>

              <button
                onClick={() => {
                  audioRef.current?.playClick(true);
                  setScreen('credits');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-[#0b0d12]/90 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-display font-semibold tracking-wider transition-colors cursor-pointer"
              >
                <span>CREDITS</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>
            </nav>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono-tech text-zinc-500 tabular-nums pt-2">
            <span>
              PROGRESS: {completedMainCount}/12 CHAPTERS · {campaign.collectedLoreIds.length}/36 LOGS ·{' '}
              {campaign.secretsFoundIds.length}/12 SECRETS
            </span>
            <span>SALVAGE CORES: {campaign.salvageCores}</span>
          </div>
        </div>
      )}

      {/* 3D Personnel Dossier & Character Selection Screen */}
      {screen === 'characters' && (
        <div className="relative z-10 w-full h-full bg-[#06070a] flex flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-zinc-800 bg-[#080a0e]">
            <button
              onClick={() => setScreen('menu')}
              className="flex items-center gap-2 text-xs font-mono-tech text-zinc-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK TO MENU</span>
            </button>
            <div className="text-center">
              <div className="text-[10px] font-mono-tech tracking-[0.25em] text-red-400">
                3062 AD // BLACK-SECTOR ROSTER
              </div>
              <h2 className="font-display text-lg font-bold tracking-wider">
                PERSONNEL DOSSIER & OPERATIVE SELECTION
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => replayOperativeIntro(activeChar.id)}
                className="px-3.5 py-2 border border-zinc-700 hover:border-amber-500 bg-[#0b0d12] text-xs font-mono-tech text-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>REPLAY INTRO</span>
              </button>
              <button
                onClick={() => launchMission('mission_01', activeChar.id, null, 'none', false)}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-xs font-mono-tech font-semibold text-white cursor-pointer"
              >
                DEPLOY AS {activeChar.callsign}
              </button>
            </div>
          </header>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left Roster Column */}
            <div className="lg:col-span-3 border-r border-zinc-800 p-4 space-y-4 overflow-y-auto bg-[#080a0e]">
              <div className="space-y-2">
                <div className="text-[10px] font-mono-tech tracking-[0.22em] text-red-400 border-b border-zinc-800 pb-1">
                  PRIMARY OPERATIVES (7)
                </div>
                {primaryOperatives.map((char) => {
                  const selected = char.id === activeChar.id;
                  return (
                    <button
                      key={char.id}
                      onClick={() => {
                        audioRef.current?.playClick(true);
                        selectCharacter(char.id, true);
                      }}
                      className={`w-full text-left p-3 border transition-colors cursor-pointer relative ${
                        selected
                          ? 'bg-red-950/60 border-red-500 text-zinc-100'
                          : 'bg-[#0b0d12] border-zinc-800/90 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                      style={selected ? { borderLeftWidth: '3px', borderLeftColor: char.visorColor } : undefined}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold tracking-wider text-sm">
                          {char.callsign}
                        </span>
                        <span className="font-mono-tech text-[10px] text-red-400 tabular-nums">
                          HP {char.stats.health}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono-tech text-zinc-400 mt-0.5 flex items-center justify-between">
                        <span>{char.role}</span>
                        {selected && <span className="text-emerald-400 font-semibold">ACTIVE</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-mono-tech tracking-[0.22em] text-zinc-400 border-b border-zinc-800 pb-1">
                  VANGUARD RESERVES (4)
                </div>
                {reserveOperatives.map((char) => {
                  const selected = char.id === activeChar.id;
                  return (
                    <button
                      key={char.id}
                      onClick={() => {
                        audioRef.current?.playClick(true);
                        selectCharacter(char.id, true);
                      }}
                      className={`w-full text-left p-2.5 border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-red-950/60 border-red-500 text-zinc-100'
                          : 'bg-[#0b0d12] border-zinc-800/90 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                      style={selected ? { borderLeftWidth: '3px', borderLeftColor: char.visorColor } : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-bold tracking-wider text-sm">
                          {char.callsign}
                        </span>
                        <span className="font-mono-tech text-[10px] text-zinc-400 tabular-nums">
                          HP {char.stats.health}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{char.role}</div>
                    </button>
                  );
                })}
              </div>

              {/* Story Roster Intel Box */}
              <div className="border border-zinc-800 bg-[#0b0d12] p-3 space-y-2">
                <div className="text-[10px] font-mono-tech tracking-[0.2em] text-sky-400">
                  FIELD ALLIES & THREATS
                </div>
                {STORY_CHARACTERS.filter((s) => s.id !== 'wanderer').map((s) => (
                  <div key={s.id} className="text-[11px] border-t border-zinc-800/80 pt-1.5">
                    <div className="font-display font-semibold text-zinc-200 flex items-center justify-between">
                      <span>{s.name}</span>
                      <span className="text-[9px] font-mono-tech" style={{ color: s.accentColor }}>
                        {s.role.split(' ')[0].toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-snug mt-0.5">{s.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Center 3D Model Showcase */}
            <div className="lg:col-span-5 relative bg-[#07090d] flex flex-col min-h-[340px]">
              <CharacterShowcase3D characterId={activeChar.id} cameraMode={showcaseCamMode} />

              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <button
                  onClick={() => setShowcaseCamMode('full')}
                  className={`px-3 py-1.5 border text-[11px] font-mono-tech flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showcaseCamMode === 'full'
                      ? 'bg-red-950/90 border-red-500 text-red-100'
                      : 'bg-black/80 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>FULL BODY</span>
                </button>
                <button
                  onClick={() => setShowcaseCamMode('face')}
                  className={`px-3 py-1.5 border text-[11px] font-mono-tech flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showcaseCamMode === 'face'
                      ? 'bg-red-950/90 border-red-500 text-red-100'
                      : 'bg-black/80 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>FACE CLOSE-UP</span>
                </button>
              </div>

              {selectionConfirmText && (
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-950/90 border border-emerald-500 text-[11px] font-mono-tech text-emerald-200 tracking-wider">
                  {selectionConfirmText}
                </div>
              )}

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-mono-tech text-zinc-300 bg-black/80 px-3.5 py-1 border border-zinc-800 whitespace-nowrap">
                DRAG TO ROTATE · {activeChar.classification || activeChar.role.toUpperCase()}
              </div>
            </div>

            {/* Right Personnel Dossier Panel */}
            <div className="lg:col-span-4 border-l border-zinc-800 p-5 overflow-y-auto space-y-4 bg-[#080a0e]">
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tech">
                  <span style={{ color: activeChar.ability.accentColor }}>
                    {activeChar.classification || activeChar.role.toUpperCase()}
                  </span>
                  {activeChar.voiceProfile && (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Volume2 className="w-3 h-3" />
                      <span>{activeChar.voiceProfile.personalityTag}</span>
                    </span>
                  )}
                </div>
                <h3 className="font-display text-3xl font-bold tracking-wide text-zinc-100 mt-0.5">
                  {activeChar.callsign}
                </h3>
                <p className="text-xs text-zinc-200 mt-2 leading-relaxed">{activeChar.bio}</p>
                {activeChar.backstory && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed border-l-2 border-zinc-700 pl-3">
                    {activeChar.backstory}
                  </p>
                )}
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                  Gear: {activeChar.appearanceSummary}
                </p>
              </div>

              {/* 5 Stat Bars */}
              <div className="space-y-2 pt-3 border-t border-zinc-800 tabular-nums">
                {[
                  { label: 'Health', value: activeChar.stats.health, max: 170 },
                  { label: 'Speed', value: activeChar.stats.speed, max: 100 },
                  { label: 'Armor', value: activeChar.stats.armor, max: 120 },
                  { label: 'Damage', value: activeChar.stats.damage ?? 82, max: 100 },
                  {
                    label: activeChar.stats.specialtyLabel,
                    value: activeChar.stats.specialtyValue,
                    max: 100,
                  },
                ].map((s) => (
                  <div key={s.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono-tech">
                      <span className="text-zinc-400">{s.label}</span>
                      <span className="text-zinc-200">{s.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900">
                      <div
                        className="h-full transition-all duration-200"
                        style={{
                          width: `${Math.min(100, (s.value / s.max) * 100)}%`,
                          backgroundColor: activeChar.ability.accentColor,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Equipment List */}
              {activeChar.equipmentList && activeChar.equipmentList.length > 0 && (
                <div className="border border-zinc-800 bg-[#0b0d12] p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono-tech text-zinc-400">
                    <Backpack className="w-3.5 h-3.5 text-amber-400" />
                    <span>TACTICAL EQUIPMENT MANIFEST</span>
                  </div>
                  <ul className="space-y-1 text-xs text-zinc-300">
                    {activeChar.equipmentList.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 shrink-0"
                          style={{ backgroundColor: activeChar.ability.accentColor }}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Primary Weapon */}
              <div className="border border-zinc-800 bg-[#0b0d12] p-3.5 space-y-1">
                <div className="text-[11px] font-mono-tech text-zinc-400">PRIMARY WEAPON</div>
                <div className="font-display font-semibold text-zinc-100">
                  {WEAPONS[activeChar.primaryWeapon].name}
                </div>
                <div className="text-xs text-zinc-400 tabular-nums">
                  DMG {WEAPONS[activeChar.primaryWeapon].damage} · MAG{' '}
                  {WEAPONS[activeChar.primaryWeapon].magSize} · SIDEARM{' '}
                  {WEAPONS[campaign.equippedSecondary].name}
                </div>
              </div>

              {/* Special Ability */}
              <div
                className="border bg-[#100b0d] p-3.5 space-y-1.5"
                style={{ borderColor: `${activeChar.ability.accentColor}66` }}
              >
                <div
                  className="flex items-center justify-between text-[11px] font-mono-tech"
                  style={{ color: activeChar.ability.accentColor }}
                >
                  <span>SPECIAL ABILITY [Q]</span>
                  <span>CD {activeChar.ability.cooldown}s</span>
                </div>
                <div className="font-display font-bold text-lg text-zinc-100">
                  {activeChar.ability.name}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {activeChar.ability.description}
                </p>
              </div>

              {/* Dossier Action Footer */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => selectCharacter(activeChar.id, true)}
                  className="py-2.5 px-3 border border-emerald-600/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-xs font-mono-tech font-semibold text-emerald-200 cursor-pointer"
                >
                  CONFIRM OPERATIVE
                </button>
                <button
                  onClick={() => replayOperativeIntro(activeChar.id)}
                  className="py-2.5 px-3 border border-amber-600/80 bg-amber-950/40 hover:bg-amber-900/60 text-xs font-mono-tech font-semibold text-amber-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>WATCH INTRO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12-Chapter Campaign Map & Missions Screen */}
      {screen === 'missions' && (
        <div className="relative z-10 w-full h-full bg-black/88 flex flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-zinc-800 bg-[#080a0e]">
            <button
              onClick={() => setScreen('menu')}
              className="flex items-center gap-2 text-xs font-mono-tech text-zinc-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK TO MENU</span>
            </button>
            <div className="flex items-center gap-2">
              {(['missions', 'world', 'factions'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMissionTab(t)}
                  className={`px-3 py-1.5 text-xs font-mono-tech uppercase cursor-pointer ${
                    missionTab === t
                      ? 'bg-red-900 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCinemaArchiveOpen(true)}
                className="px-3 py-1.5 border border-red-800/80 bg-red-950/40 hover:bg-red-900/50 text-xs font-mono-tech text-red-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>THEATRE ({campaign.cinematicsViewedIds?.length || 1}/14)</span>
              </button>
              <button
                onClick={() => setMenuWorkbenchOpen(true)}
                className="px-3 py-1.5 border border-amber-600/70 bg-amber-950/40 hover:bg-amber-900/50 text-xs font-mono-tech text-amber-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>WORKBENCH ({campaign.salvageCores})</span>
              </button>
              <button
                onClick={() =>
                  updateCampaign({
                    ...campaign,
                    unlockAllChapters: !campaign.unlockAllChapters,
                  })
                }
                className={`px-3 py-1.5 border text-xs font-mono-tech flex items-center gap-1.5 cursor-pointer ${
                  campaign.unlockAllChapters
                    ? 'border-emerald-600 bg-emerald-950/50 text-emerald-300'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                {campaign.unlockAllChapters ? (
                  <Unlock className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>{campaign.unlockAllChapters ? 'ALL UNLOCKED' : 'UNLOCK ALL CHAPTERS'}</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 max-w-6xl w-full mx-auto space-y-5">
            {missionTab === 'missions' && (
              <>
                {/* Campaign Progress Tracker Bar */}
                <div className="border border-zinc-800 bg-[#090b10] p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-mono-tech tabular-nums">
                  <div>
                    <div className="text-zinc-500">CHAPTERS CLEARED</div>
                    <div className="text-base font-bold text-zinc-100 mt-0.5">
                      {completedMainCount} / 12
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500">ARCHIVES RECOVERED</div>
                    <div className="text-base font-bold text-sky-400 mt-0.5">
                      {campaign.collectedLoreIds.length} / 36
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500">SECRET CACHES</div>
                    <div className="text-base font-bold text-amber-400 mt-0.5">
                      {campaign.secretsFoundIds.length} / 12
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500">SALVAGE CORES</div>
                    <div className="text-base font-bold text-amber-300 mt-0.5">
                      {campaign.salvageCores}
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => {
                        const fresh = resetCampaignState();
                        setCampaign(fresh);
                        localStorage.removeItem(SAVE_STORAGE_KEY);
                        setSavedCheckpoint(null);
                      }}
                      className="px-3 py-1.5 border border-zinc-800 hover:border-red-600 text-[11px] text-zinc-400 hover:text-red-300 cursor-pointer"
                    >
                      RESET CAMPAIGN
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MISSIONS.map((m) => {
                    const isUnlocked =
                      m.isBonusArena ||
                      campaign.unlockAllChapters ||
                      m.number <= campaign.unlockedLevel;
                    const isCleared = campaign.completedMissionIds.includes(m.id);

                    return (
                      <div
                        key={m.id}
                        className={`border p-4 flex flex-col justify-between space-y-4 ${
                          m.isBonusArena
                            ? 'border-amber-700/80 bg-[#120e08]'
                            : isUnlocked
                              ? 'border-red-800/80 bg-[#0d0a0c]'
                              : 'border-zinc-800/80 bg-[#090b0f]/90 opacity-65'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono-tech">
                            <span className={m.isBonusArena ? 'text-amber-400' : 'text-red-400'}>
                              {m.isBonusArena
                                ? 'BONUS ARENA'
                                : `LEVEL ${String(m.number).padStart(2, '0')}`}
                            </span>
                            <span className="text-zinc-400 truncate max-w-[170px]">{m.region}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-lg font-bold text-zinc-100">
                              {m.title}
                            </h3>
                            {isCleared && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{m.summary}</p>
                          <div className="pt-1 text-[11px] font-mono-tech text-zinc-500">
                            THREAT: <span className="text-zinc-300">{m.primaryMonster}</span>
                            {m.hasZeroG && ' · ZERO-G'}
                            {m.hasFlooding && ' · FLOODED'}
                          </div>
                        </div>

                        {isUnlocked ? (
                          <button
                            onClick={() => launchMission(m.id, selectedCharacter, null, 'none', false)}
                            className={`w-full py-2 px-3 text-xs font-mono-tech font-semibold text-white flex items-center justify-center gap-2 cursor-pointer ${
                              m.isBonusArena
                                ? 'bg-amber-700 hover:bg-amber-600'
                                : 'bg-red-700 hover:bg-red-600'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>
                              {m.isBossMission ? 'DEPLOY · BOSS CHAPTER' : 'DEPLOY CHAPTER'}
                            </span>
                          </button>
                        ) : (
                          <div className="w-full py-2 px-3 border border-zinc-800 text-xs font-mono-tech text-zinc-500 flex items-center justify-center gap-2">
                            <Lock className="w-3.5 h-3.5" />
                            <span>COMPLETE LEVEL {String(m.number - 1).padStart(2, '0')}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {missionTab === 'world' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WORLD_REGIONS.map((r) => (
                  <div key={r.id} className="border border-zinc-800 bg-[#090b0f] p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-bold text-zinc-100">{r.name}</h3>
                      <span className="text-xs font-mono-tech text-red-400">{r.status}</span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{r.description}</p>
                  </div>
                ))}
              </div>
            )}

            {missionTab === 'factions' && (
              <div className="space-y-4">
                {FACTIONS.map((f) => (
                  <div key={f.id} className="border border-zinc-800 bg-[#090b0f] p-5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-bold text-zinc-100">{f.name}</h3>
                      <span className="text-xs italic text-red-400">"{f.motto}"</span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{f.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credits Screen */}
      {screen === 'credits' && (
        <div className="relative z-10 w-full h-full bg-black/85 flex items-center justify-center p-6">
          <div className="max-w-xl w-full border border-zinc-800 bg-[#0b0d12] p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-mono-tech text-red-500">3062 AD // ARCHIVE</p>
              <h2 className="font-display text-3xl font-bold tracking-wider">
                THE WORLD HAS ROTTEN
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                A 12-chapter first-person 3D sci-fi survival horror campaign built with procedural
                WebGL geometry, physically-based materials, spatial Web Audio synthesis, and
                real-time biomechanical AI.
              </p>
            </div>
            <div className="border-t border-zinc-800 pt-4 space-y-2 text-xs text-zinc-400 font-mono-tech">
              <div className="flex justify-between">
                <span>CAMPAIGN</span>
                <span className="text-zinc-200">12 CHAPTERS + TITANFORGED CRUCIBLE</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>OPERATIVES</span>
                <span className="text-zinc-200 text-right">
                  REAPER · GHOST · TITAN · PATCH · PHANTOM · ENGINEER · WANDERER
                </span>
              </div>
              <div className="flex justify-between">
                <span>ENDINGS UNLOCKED</span>
                <span className="text-zinc-200">
                  {campaign.endingsReached.length > 0
                    ? campaign.endingsReached.join(', ')
                    : 'NONE YET'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setScreen('menu')}
              className="w-full py-3 bg-red-700 hover:bg-red-600 text-xs font-mono-tech font-semibold text-white cursor-pointer"
            >
              RETURN TO MAIN MENU
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Isolated 3D Gameplay Canvas Mount */}
      <div
        ref={gameMountRef}
        className={`fixed inset-0 z-10 ${
          screen === 'playing' ||
          screen === 'paused' ||
          screen === 'dead' ||
          screen === 'mission_complete'
            ? 'block'
            : 'hidden'
        }`}
      />

      {/* Active HUD */}
      {screen === 'playing' &&
        hud &&
        !inventoryOpen &&
        !databaseOpen &&
        !activeEducationId &&
        !hud.activePuzzleId &&
        !hud.workbenchOpen &&
        !hud.endingChoiceOpen && (
          <GameHud
            hud={hud}
            characterId={selectedCharacter}
            settings={settings}
            faceCamOpen={faceCamOpen}
            onToggleFaceCam={() => setFaceCamOpen((prev) => !prev)}
            onOpenFaceCamTab={() => {
              engineRef.current?.setPaused(true);
              setInventoryTab('facecam');
              setInventoryOpen(true);
            }}
            onOpenSuitCheck={() => {
              engineRef.current?.setPaused(true);
              setInventoryTab('suit');
              setInventoryOpen(true);
            }}
            onToggleGeigerMute={() => engineRef.current?.toggleGeigerMute()}
            onToggleThirdPerson={() => engineRef.current?.toggleThirdPersonView()}
            onOpenAdminMenu={() => {
              engineRef.current?.setPaused(true);
              setAdminSpawnModalOpen(true);
            }}
            onLockPointer={() => engineRef.current?.requestPointerLock()}
            onPause={() => {
              engineRef.current?.setPaused(true);
              setScreen('paused');
            }}
            onOpenInventory={() => {
              engineRef.current?.setPaused(true);
              setInventoryTab('inventory');
              setInventoryOpen(true);
            }}
            onOpenDatabase={() => {
              engineRef.current?.setPaused(true);
              setDatabaseOpen(true);
            }}
            onTouchMove={(x, y) => engineRef.current?.setTouchMove(x, y)}
            onTouchLook={(dx, dy) => engineRef.current?.addTouchLook(dx, dy)}
            onTouchAction={(act) => engineRef.current?.triggerTouchAction(act)}
          />
        )}

      {/* Engineering Math Puzzle Modal */}
      {screen === 'playing' && hud?.activePuzzleId && (
        <PuzzleModal
          puzzleId={hud.activePuzzleId}
          levelNumber={currentMissionDef?.number ?? 1}
          audio={audioRef.current}
          reducedMotion={settings.reducedMotion}
          initialChallenge={engineRef.current?.getGeneratorChallenge(hud.activePuzzleId)}
          onChallengeChange={(next) => {
            if (hud.activePuzzleId) {
              engineRef.current?.updateGeneratorChallenge(hud.activePuzzleId, next);
            }
          }}
          onSkillCheckMiss={() => engineRef.current?.triggerPowerBrownoutDip(1.0)}
          onResolve={(solved) => {
            if (hud.activePuzzleId) {
              engineRef.current?.solvePuzzle(hud.activePuzzleId, solved);
            }
          }}
        />
      )}

      {/* In-Game Armory Workbench Modal */}
      {screen === 'playing' && hud?.workbenchOpen && (
        <WorkbenchModal
          campaign={campaign}
          characterId={selectedCharacter}
          audio={audioRef.current}
          armourPieces={hud.armourPieces}
          onRepairArmour={() => engineRef.current?.repairBodyArmour()}
          onUpdateCampaign={updateCampaign}
          onClose={() => engineRef.current?.closeWorkbench(loadCampaignState())}
        />
      )}

      {/* Admin Spawn & Developer Console Modal */}
      {screen === 'playing' && adminSpawnModalOpen && (
        <AdminSpawnModal
          isGodChar={selectedCharacter === 'god'}
          noclipActive={engineRef.current?.noclipActive || false}
          godModeActive={engineRef.current?.godModeActive || false}
          onToggleNoclip={() => engineRef.current?.toggleNoclip()}
          onToggleGodMode={() => engineRef.current?.toggleGodMode()}
          onSpawnEnemy={(type) => engineRef.current?.spawnEnemy(type)}
          onSpawnWeapon={(wId) => engineRef.current?.spawnWeapon(wId)}
          onSpawnItem={(kind, count) => engineRef.current?.spawnItem(kind, count)}
          onInstantCompleteObjective={() => engineRef.current?.instantCompleteObjective()}
          onTeleport={(x, y, z) => engineRef.current?.teleportTo(x, y, z)}
          onClose={() => {
            setAdminSpawnModalOpen(false);
            engineRef.current?.setPaused(false);
            engineRef.current?.requestPointerLock();
          }}
        />
      )}

      {/* Level 12 Master HELIOS Control Spire Ending Choice Modal */}
      {screen === 'playing' && hud?.endingChoiceOpen && (
        <EndingModal
          secretUnlocked={!!campaign.secretEndingUnlocked || (campaign.minForgeHits !== undefined && campaign.minForgeHits < 6)}
          onSelectEnding={(endingId) => {
            engineRef.current?.selectEnding(endingId);
          }}
        />
      )}

      {/* Menu / Chapter Complete Workbench Modal */}
      {menuWorkbenchOpen && (
        <WorkbenchModal
          campaign={campaign}
          characterId={selectedCharacter}
          audio={audioRef.current}
          onUpdateCampaign={updateCampaign}
          onClose={() => setMenuWorkbenchOpen(false)}
        />
      )}

      {/* Inventory & Lore Drawer */}
      {screen === 'playing' && hud && inventoryOpen && (
        <InventoryDrawer
          hud={hud}
          characterId={selectedCharacter}
          initialTab={inventoryTab}
          reducedMotion={settings.reducedMotion}
          onUseMedkit={() => engineRef.current?.triggerMedkit()}
          onOpenDatabase={() => {
            setInventoryOpen(false);
            setDatabaseOpen(true);
          }}
          onClose={() => {
            setInventoryOpen(false);
            engineRef.current?.setPaused(false);
            engineRef.current?.requestPointerLock();
          }}
        />
      )}

      {/* Pause Menu */}
      {screen === 'paused' && (
        <div className="fixed inset-0 z-30 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0b0d12] border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="font-display text-xl font-bold tracking-wider">SIMULATION PAUSED</h2>
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div className="space-y-2.5">
              <button
                onClick={resumeGame}
                className="w-full py-2.5 bg-red-700 hover:bg-red-600 text-xs font-mono-tech font-semibold text-white cursor-pointer"
              >
                RESUME GAME
              </button>
              <button
                onClick={() => setDatabaseOpen(true)}
                className="w-full py-2.5 bg-[#080a0e] hover:bg-zinc-900 border border-sky-800/80 text-xs font-mono-tech text-sky-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>SCIENTIFIC DATABASE</span>
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-full py-2.5 bg-[#080a0e] hover:bg-zinc-900 border border-zinc-700 text-xs font-mono-tech text-zinc-200 cursor-pointer"
              >
                SETTINGS
              </button>
              <button
                onClick={() => launchMission(activeMissionId, selectedCharacter, null)}
                className="w-full py-2.5 bg-[#080a0e] hover:bg-zinc-900 border border-zinc-700 text-xs font-mono-tech text-zinc-200 cursor-pointer"
              >
                RESTART CHAPTER
              </button>
              <button
                onClick={() => {
                  stopGameEngine();
                  setScreen('menu');
                }}
                className="w-full py-2.5 bg-[#080a0e] hover:bg-zinc-900 border border-zinc-800 text-xs font-mono-tech text-zinc-400 cursor-pointer"
              >
                EXIT TO MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Death Screen */}
      {screen === 'dead' && (
        <div className="fixed inset-0 z-30 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-red-900/70 bg-[#0e0708] p-8 text-center space-y-5">
            <Skull className="w-12 h-12 text-red-500 mx-auto" />
            <div>
              <h2 className="font-display text-3xl font-bold tracking-wider text-red-500">
                SIGNAL LOST
              </h2>
              <p className="text-sm text-zinc-400 mt-2">
                {activeChar.callsign} fell in {currentMissionDef?.title ?? 'the quarantine zone'}.
                Biometric telemetry confirms the body remains in the sector under active infection.
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              {savedCheckpoint && savedCheckpoint.missionId === activeMissionId && (
                <button
                  onClick={() =>
                    launchMission(activeMissionId, selectedCharacter, savedCheckpoint)
                  }
                  className="w-full py-3 bg-red-700 hover:bg-red-600 text-xs font-mono-tech font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RELOAD LAST CHECKPOINT</span>
                </button>
              )}
              <button
                onClick={() => launchMission(activeMissionId, selectedCharacter, null)}
                className="w-full py-3 bg-[#080a0e] hover:bg-zinc-900 border border-zinc-700 text-xs font-mono-tech text-zinc-200 cursor-pointer"
              >
                RESTART CHAPTER
              </button>
              <button
                onClick={() => {
                  stopGameEngine();
                  setScreen('menu');
                }}
                className="w-full py-3 bg-[#080a0e] hover:bg-zinc-900 border border-zinc-800 text-xs font-mono-tech text-zinc-400 cursor-pointer"
              >
                RETURN TO MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Complete / Level 12 Ending Cut-to-Black Screen */}
      {screen === 'mission_complete' && (
        <div className="fixed inset-0 z-40 bg-black flex items-center justify-center p-6">
          <div className="max-w-2xl w-full text-center space-y-6">
            <p className="text-xs font-mono-tech tracking-[0.3em] text-red-500">
              {activeMissionId === 'mission_12'
                ? 'CAMPAIGN FINALE'
                : `CHAPTER ${String(currentMissionDef?.number ?? 1).padStart(2, '0')} COMPLETE`}
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-wider text-zinc-100">
              {finaleInfo?.title || 'THE WORLD HAS ROTTEN'}
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-xl mx-auto">
              {finaleInfo?.summary}
            </p>

            {activeMissionId === 'mission_12' && (
              <div className="border-y border-red-900/70 py-5 space-y-1.5">
                <div className="font-display text-2xl sm:text-3xl font-bold tracking-[0.22em] text-zinc-100">
                  THE WORLD HAS ROTTEN.
                </div>
                <div className="font-mono-tech text-xs sm:text-sm tracking-[0.25em] text-red-400">
                  BUT SOMETHING IS STILL GROWING.
                </div>
              </div>
            )}

            {finaleInfo?.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-zinc-800 bg-[#090b10] p-4 text-xs font-mono-tech tabular-nums">
                <div>
                  <div className="text-zinc-500">TIME</div>
                  <div className="text-zinc-100 font-bold mt-0.5">
                    {Math.floor(finaleInfo.stats.elapsedSeconds / 60)}m{' '}
                    {finaleInfo.stats.elapsedSeconds % 60}s
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">HOSTILES</div>
                  <div className="text-red-400 font-bold mt-0.5">
                    {finaleInfo.stats.enemiesDefeated}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">SALVAGE EARNED</div>
                  <div className="text-amber-400 font-bold mt-0.5">
                    +{finaleInfo.stats.salvageEarned}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500">SECRETS / LOGS</div>
                  <div className="text-sky-400 font-bold mt-0.5">
                    {finaleInfo.stats.secretsFound}/{finaleInfo.stats.secretsTotal} ·{' '}
                    {finaleInfo.stats.docsFound}/{finaleInfo.stats.docsTotal}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {nextMissionDef && (
                <button
                  onClick={() => launchMission(nextMissionDef.id, selectedCharacter, null)}
                  className="px-6 py-3 bg-red-700 hover:bg-red-600 text-xs font-mono-tech font-semibold text-white cursor-pointer flex items-center gap-2"
                >
                  <span>
                    PROCEED TO LEVEL {String(nextMissionDef.number).padStart(2, '0')}:{' '}
                    {nextMissionDef.title}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setMenuWorkbenchOpen(true)}
                className="px-5 py-3 border border-amber-600/80 bg-amber-950/40 hover:bg-amber-900/50 text-xs font-mono-tech text-amber-300 cursor-pointer flex items-center gap-2"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>ARMORY WORKBENCH ({campaign.salvageCores})</span>
              </button>
              <button
                onClick={() => setDatabaseOpen(true)}
                className="px-5 py-3 border border-sky-700/80 bg-sky-950/40 hover:bg-sky-900/50 text-xs font-mono-tech text-sky-200 cursor-pointer flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>SCIENTIFIC DATABASE</span>
              </button>
              <button
                onClick={() => launchMission(activeMissionId, selectedCharacter, null)}
                className="px-5 py-3 border border-zinc-700 hover:border-zinc-500 text-xs font-mono-tech text-zinc-200 cursor-pointer"
              >
                REPLAY CHAPTER
              </button>
              <button
                onClick={() => {
                  setActiveCutsceneTarget(
                    activeMissionId === 'mission_12'
                      ? campaign.secretEndingUnlocked
                        ? 'ending_secret'
                        : 'ending_regular'
                      : (`level_${String(currentMissionDef?.number ?? 1).padStart(2, '0')}_outro` as CutsceneTargetId)
                  );
                  setIsArchiveReplay(false);
                  setScreen('level_cutscene');
                }}
                className="px-5 py-3 border border-red-800/80 bg-red-950/40 hover:bg-red-900/50 text-xs font-mono-tech text-red-300 cursor-pointer flex items-center gap-2"
              >
                <Film className="w-3.5 h-3.5 text-red-400" />
                <span>REPLAY STORY CUTSCENE</span>
              </button>
              <button
                onClick={() => {
                  stopGameEngine();
                  setScreen('missions');
                }}
                className="px-5 py-3 border border-zinc-800 hover:border-zinc-600 text-xs font-mono-tech text-zinc-400 cursor-pointer"
              >
                CAMPAIGN MAP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Interactive Tutorial Hub */}
      {tutorialOpen && audioRef.current && (
        <TutorialHub
          onClose={() => setTutorialOpen(false)}
          onStartCampaign={() => {
            setTutorialOpen(false);
            launchOpeningCutscene(selectedCharacter);
          }}
          audio={audioRef.current}
        />
      )}

      {/* Multiplayer Co-op Lobby Modal */}
      {multiplayerModalOpen && (
        <MultiplayerLobbyModal
          selectedCharacter={selectedCharacter}
          onSelectCharacter={(c) => selectCharacter(c, false)}
          settings={settings}
          onClose={() => setMultiplayerModalOpen(false)}
          onStartCoopMission={(missionId, charId, sessionId, role) => {
            coopSessionInfoRef.current = { sessionId, role };
            setMultiplayerModalOpen(false);
            launchMission(missionId, charId, null, 'none', true);
          }}
        />
      )}

      {/* Cinematic Archive // Story Theatre Modal */}
      {cinemaArchiveOpen && (
        <CinematicArchiveModal
          campaign={campaign}
          onSelectCutscene={(targetId) => {
            setCinemaArchiveOpen(false);
            setActiveCutsceneTarget(targetId);
            setIsArchiveReplay(true);
            setScreen('level_cutscene');
          }}
          onClose={() => setCinemaArchiveOpen(false)}
        />
      )}

      {/* Permanent Scientific Database Modal */}
      {databaseOpen && (
        <ScientificDatabaseModal
          discoveredIds={campaign.discoveredEducationIds || ['edu_meteor']}
          onSelectEntry={(entryId) => {
            setDatabaseOpen(false);
            recordEducationDiscovery(entryId);
            setActiveEducationId(entryId);
            if (screen === 'playing') {
              engineRef.current?.setPaused(false);
              engineRef.current?.setEducationModalOpen(entryId);
            }
          }}
          onClose={() => {
            setDatabaseOpen(false);
            if (screen === 'playing' && !inventoryOpen && !activeEducationId) {
              engineRef.current?.setPaused(false);
              engineRef.current?.requestPointerLock();
            }
          }}
        />
      )}

      {/* Educational Investigation Reader Modal */}
      {activeEducationId && (
        <EducationalReaderModal
          entryId={activeEducationId}
          settings={settings}
          isMultiplayer={isCoopSession && screen === 'playing'}
          discoveredIds={campaign.discoveredEducationIds || ['edu_meteor']}
          onChangeEntry={(entryId) => {
            recordEducationDiscovery(entryId);
            setActiveEducationId(entryId);
            if (screen === 'playing') {
              engineRef.current?.setEducationModalOpen(entryId);
            }
          }}
          onUpdateSettings={(partial) => handleSettingsChange({ ...settings, ...partial })}
          onClose={() => {
            setActiveEducationId(null);
            if (screen === 'playing') {
              engineRef.current?.setEducationModalOpen(null);
            }
          }}
        />
      )}
    </div>
  );
}
