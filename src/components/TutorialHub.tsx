import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Eye,
  Footprints,
  Gamepad2,
  Heart,
  HelpCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  Skull,
  Terminal,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
} from 'lucide-react';
import { HorrorAudioEngine } from '../game/audio';
import { EDUCATIONAL_BY_ID } from '../game/educationData';
import { EducationalDiagram } from './EducationalDiagram';
import { GeneratorCircuitPuzzle } from './GeneratorCircuitPuzzle';

export interface TutorialHubProps {
  onClose: () => void;
  onStartCampaign: () => void;
  audio: HorrorAudioEngine;
}

interface LessonDef {
  id: string;
  number: number;
  title: string;
  category: 'Movement' | 'Exploration' | 'Survival' | 'Stealth & Combat' | 'Engineering & Hazards' | 'Advanced & Co-op';
  summary: string;
  textExplanation: string;
  demonstrationDesc: string;
  trialObjective: string;
  successCondition: string;
}

const LESSONS: LessonDef[] = [
  {
    id: 'look',
    number: 1,
    title: 'LOOKING AROUND & CAMERA',
    category: 'Movement',
    summary: 'Master camera rotation and inspect your surroundings in 3059 AD.',
    textExplanation: 'Use mouse movement or the right thumbstick on controller to look around. Inspect suspicious geometry, doorways, and dropped equipment. Keeping your camera active prevents surprise ambushes from THE SCRAPPER or THE CRAWLER.',
    demonstrationDesc: 'An animated viewfinder sweeps 360 degrees across a wrecked railway station, highlighting interactive terminal consoles in cyan and hidden threats in red.',
    trialObjective: 'Look toward and inspect 3 highlighted military training markers inside the simulation bay.',
    successCondition: 'All 3 markers successfully scanned.',
  },
  {
    id: 'walk',
    number: 2,
    title: 'WALKING & POSITIONING',
    category: 'Movement',
    summary: 'Navigate standard corridors and maintain defensive posture.',
    textExplanation: 'Press W A S D or use the left thumbstick to walk. Walking is quiet and keeps your weapon stable for instant target acquisition. Always check corners before advancing.',
    demonstrationDesc: 'Character model strides smoothly across a metallic grille corridor, maintaining weapon ready-stance.',
    trialObjective: 'Navigate through the marked obstacle training corridor to checkpoint Bravo.',
    successCondition: 'Reach checkpoint Bravo within the time limit.',
  },
  {
    id: 'run',
    number: 3,
    title: 'SPRINTING & ESCAPE',
    category: 'Movement',
    summary: 'Evade immediate threats by sprinting, but beware of stamina and noise.',
    textExplanation: 'Hold Shift or press Left Stick while moving to sprint. Sprinting covers distance quickly when fleeing hostile machines, but generates loud footsteps that alert nearby monsters.',
    demonstrationDesc: 'Demonstrates a survivor sprinting away from a lunging predator across a crumbling highway overpass.',
    trialObjective: 'Sprint through the obstacle training track while avoiding simulated floor vents.',
    successCondition: 'Successfully cross the finish line.',
  },
  {
    id: 'crouch',
    number: 4,
    title: 'CROUCHING & LOW COVER',
    category: 'Movement',
    summary: 'Reduce your height and silences footsteps to remain undetected.',
    textExplanation: 'Press Ctrl or B/Circle to crouch. Crouch-walking allows you to pass beneath low structural debris, ventilation grates, and keeps you hidden behind low concrete barricades.',
    demonstrationDesc: 'Operative drops into a tactical crouch beneath a glowing security laser grid and low ventilation duct.',
    trialObjective: 'Crouch and navigate through the low-clearance obstacle tunnel.',
    successCondition: 'Emerge on the other side of the tunnel in crouching stance.',
  },
  {
    id: 'interact',
    number: 5,
    title: 'INTERACTING WITH OBJECTS',
    category: 'Exploration',
    summary: 'Open doors, activate consoles, and collect vital supplies.',
    textExplanation: 'Approach any glowing interactive object (doors, terminals, medkits, ammo crates) and press E or Action button when the prompt appears.',
    demonstrationDesc: 'Prompt [E - OPEN DOOR] appears as the player approaches a heavy steel blast bulkhead.',
    trialObjective: 'Open a sealed security door, collect a medkit, and activate a terminal.',
    successCondition: 'Complete all 3 interactions.',
  },
  {
    id: 'exploration',
    number: 6,
    title: 'EXPLORATION & LORE DISCOVERY',
    category: 'Exploration',
    summary: 'Search abandoned buildings, vehicles, and encrypted audio logs.',
    textExplanation: 'THE WORLD HAS ROTTEN rewards thorough exploration. Check vehicles, desks, and side rooms for salvage cores, encrypted documents, and audio logs that reveal the truth behind THEY.',
    demonstrationDesc: 'Player inspects a glowing datapad on a scorched desk, revealing classified research notes.',
    trialObjective: 'Locate 1 emergency supply crate, 1 communication terminal, and 1 hidden datapad.',
    successCondition: 'All 3 items successfully discovered and inspected.',
  },
  {
    id: 'inventory',
    number: 7,
    title: 'INVENTORY & WEAPON MANAGEMENT',
    category: 'Survival',
    summary: 'Manage weapons, ammunition, batteries, and medical supplies.',
    textExplanation: 'Press Tab or Inventory button to open your tactical backpack. Select weapons to equip, inspect lore documents, or use medical kits to restore integrity when injured.',
    demonstrationDesc: 'Inventory drawer slides open, showing weapon slots, ammo reserves, and green health injectors.',
    trialObjective: 'Open inventory, inspect a medkit, equip the assault rifle, and switch to secondary sidearm.',
    successCondition: 'All inventory operations executed correctly.',
  },
  {
    id: 'health',
    number: 8,
    title: 'HEALTH, DAMAGE & HEALING',
    category: 'Survival',
    summary: 'Monitor suit integrity and apply emergency medical supplies.',
    textExplanation: 'When taking damage from environmental hazards or monsters, suit integrity drops. If integrity reaches 0%, mission failure occurs. Locate medical kits and use them immediately.',
    demonstrationDesc: 'Health HUD flashes red under attack, then stabilizes after injecting a green medkit.',
    trialObjective: 'Receive controlled training damage, monitor health bar, find a medical kit, and heal to 100%.',
    successCondition: 'Health successfully restored to maximum.',
  },
  {
    id: 'stealth',
    number: 9,
    title: 'MONSTER AWARENESS & STEALTH',
    category: 'Stealth & Combat',
    summary: 'Understand monster sight, hearing, and line-of-sight mechanics.',
    textExplanation: 'Monsters (THE SCRAPPER, THE WATCHER, THE CRAWLER) detect you via sight and sound. Solid walls block vision. Running or firing unsuppressed weapons alerts them instantly. Break line of sight and hide behind cover.',
    demonstrationDesc: 'Monster patrols past a doorway; player crouches silently in dark shadow, remaining undetected.',
    trialObjective: 'Hide behind concrete cover while the training monster patrols past your position.',
    successCondition: 'Remain undetected until the monster returns to patrol.',
  },
  {
    id: 'combat',
    number: 10,
    title: 'COMBAT & TARGET ENGAGEMENT',
    category: 'Stealth & Combat',
    summary: 'Aim, fire, reload, and choose when to fight or flee.',
    textExplanation: 'Right-click to aim down sights for pinpoint accuracy. Left-click to fire. Press R to reload before your magazine empties. Remember: ammunition is scarce in 3059 AD—sometimes evasion is superior to combat.',
    demonstrationDesc: 'Operative aims down assault rifle sights, lands precise shots on a training dummy, and reloads tactically.',
    trialObjective: 'Equip rifle, aim down sights, hit 3 stationary targets, and reload.',
    successCondition: 'All 3 targets neutralized with successful reload.',
  },
  {
    id: 'generator',
    number: 11,
    title: 'GENERATOR PUZZLE ACTIVATION (2-STAGE)',
    category: 'Engineering & Hazards',
    summary: 'Restore power via 10 math calibrations followed by Connect-the-Dots circuit routing.',
    textExplanation: 'Generators use a two-phase safety interlock. Phase 1: Solve 10 whole-number multiplication and division equations (10% each, zero penalty on retries). Phase 2: Route an electrical power conduit grid from the yellow source node to the green terminal without crossing blocked nodes. Use RESET or HINT anytime.',
    demonstrationDesc: 'Terminal completes 10/10 math (100%), then opens a 3×3 orthogonal circuit board where clicking adjacent cells links Power Source to Ground Terminal.',
    trialObjective: 'Complete the Phase 1 equation trial and link the Phase 2 circuit board in the Simulator tab.',
    successCondition: 'Both generator phases synchronized to 100% power output.',
  },
  {
    id: 'hazards',
    number: 12,
    title: 'ENVIRONMENTAL HAZARDS & FIRES',
    category: 'Engineering & Hazards',
    summary: 'Avoid burning storefronts, electrical shorts, and structural debris.',
    textExplanation: 'The collapsed world is filled with fire hazards, ruptured gas pipes, and electrical arcs. Maintain safe distance from flames and falling debris zones.',
    demonstrationDesc: 'Player carefully navigates around a burst electrical conduit sparking across a wet floor.',
    trialObjective: 'Safely cross the hazard course avoiding electrical arcs and simulated fire zones.',
    successCondition: 'Reach the safe zone without taking hazard damage.',
  },
  {
    id: 'weather',
    number: 13,
    title: 'WEATHER SYSTEMS: DUST, ASH & ORBITAL STORMS',
    category: 'Engineering & Hazards',
    summary: 'Survive extreme weather that blinds sensors and drains suit batteries.',
    textExplanation: 'Dust storms and ash storms reduce visibility drastically. Orbital storms cause electromagnetic interference. Seek shelter in nearby buildings when storm warnings trigger.',
    demonstrationDesc: 'Wind whips thick grey ash across the screen as visibility drops to 3 meters.',
    trialObjective: 'Respond to incoming ash storm warning and reach designated fallout shelter.',
    successCondition: 'Enter shelter before storm intensity peaks.',
  },
  {
    id: 'multiplayer',
    number: 14,
    title: 'COOPERATIVE MULTIPLAYER & REVIVING',
    category: 'Advanced & Co-op',
    summary: 'Play with friends, share supplies, and revive downed teammates.',
    textExplanation: 'In cooperative multiplayer, survivors must coordinate. If a teammate’s integrity reaches 0%, they enter a downed state. Approach them and hold the interaction key to perform a combat revive.',
    demonstrationDesc: 'Two operatives side-by-side; one revives a downed companion while the other provides cover fire.',
    trialObjective: 'Simulate reviving a downed training teammate and complete a shared objective.',
    successCondition: 'Teammate successfully revived.',
  },
  {
    id: 'boss',
    number: 15,
    title: 'BOSS ENCOUNTER TACTICS',
    category: 'Advanced & Co-op',
    summary: 'Recognize boss wind-up animations, evade devastating attacks, and strike vulnerabilities.',
    textExplanation: 'Apex entities like THE FORGEMASTER, THE SENTINEL, and THE TITAN telegraph their heavy attacks with visual wind-ups and audio cues. Dodge away from impact zones and strike glowing weak points.',
    demonstrationDesc: 'Operative rolls backward just as a massive mechanical slam strikes the ground, then fires into the exposed core.',
    trialObjective: 'Observe boss attack telegraph, dodge away from the danger zone, and counterattack.',
    successCondition: 'Successfully evade and survive the practice boss trial.',
  },
  {
    id: 'science_scan',
    number: 16,
    title: 'SCIENTIFIC FIELD SCANNING & DATABASE',
    category: 'Exploration',
    summary: 'Inspect real-world science panels on meteors, machines, ecosystems, and satellites.',
    textExplanation: 'Yellow beacons highlight interactive Science Scanners across every chapter. Pressing E opens an interactive reader separating REAL SCIENCE (Easy or Advanced toggle, labelled diagrams, narration) from GAME LORE (FICTIONAL). In Solo mode, all monsters cleanly freeze while you read; in Co-op, teammates stay live. Every entry unlocks permanently in the Scientific Database ([K]).',
    demonstrationDesc: 'Interactive reader opens with a labelled diagram of a Generator and freezes patrolling units safely.',
    trialObjective: 'Inspect the diagram sample, toggle science depth, and confirm your Scientific Database scan.',
    successCondition: 'Field scan recorded cleanly into Scientific Database.',
  },
];

export const TutorialHub: React.FC<TutorialHubProps> = ({ onClose, onStartCampaign, audio }) => {
  const [currentTab, setCurrentTab] = useState<'intro' | 'lessons' | 'simulator' | 'settings'>('intro');
  const [activeLessonId, setActiveLessonId] = useState<string>('look');
  const [lessonStep, setLessonStep] = useState<number>(1); // 1: Explain, 2: Demonstrate, 3: Practise, 4: Feedback, 5: Confirm
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'standard' | 'comfort' | 'assisted'>('standard');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [circuitMode, setCircuitMode] = useState<boolean>(false);
  const [circuitSolved, setCircuitSolved] = useState<boolean>(false);

  // Simulator trial specific states
  const [simProgress, setSimProgress] = useState<number>(0);
  const [genQuestionIndex, setGenQuestionIndex] = useState<number>(0);
  const [genInput, setGenInput] = useState<string>('');
  const [genFeedback, setGenFeedback] = useState<string>('');
  const [genCompleted, setGenCompleted] = useState<boolean>(false);

  // Generator questions (Multiplication & division only, easy, whole numbers)
  const generatorQuestions = [
    { q: '2 × 3', ans: 6 },
    { q: '4 × 2', ans: 8 },
    { q: '5 × 3', ans: 15 },
    { q: '10 ÷ 2', ans: 5 },
    { q: '20 ÷ 4', ans: 5 },
    { q: '3 × 4', ans: 12 },
    { q: '18 ÷ 3', ans: 6 },
    { q: '5 × 5', ans: 25 },
    { q: '16 ÷ 4', ans: 4 },
    { q: '6 × 2', ans: 12 },
  ];

  const activeLesson = LESSONS.find((l) => l.id === activeLessonId) || LESSONS[0];

  const handleNextStep = () => {
    audio.playClick(true);
    if (lessonStep < 5) {
      setLessonStep((prev) => prev + 1);
    } else {
      if (!completedLessons.includes(activeLessonId)) {
        setCompletedLessons((prev) => [...prev, activeLessonId]);
      }
    }
  };

  const handlePrevStep = () => {
    audio.playClick(true);
    if (lessonStep > 1) {
      setLessonStep((prev) => prev - 1);
    }
  };

  const handleSelectLesson = (id: string) => {
    audio.playClick(true);
    setActiveLessonId(id);
    setLessonStep(1);
    setSimProgress(0);
    setGenQuestionIndex(0);
    setGenInput('');
    setGenFeedback('');
    setGenCompleted(false);
  };

  const handleGeneratorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentQ = generatorQuestions[genQuestionIndex];
    const val = parseInt(genInput.trim(), 10);
    if (val === currentQ.ans) {
      audio.playClick(true);
      const nextIdx = genQuestionIndex + 1;
      if (nextIdx >= generatorQuestions.length) {
        setGenCompleted(true);
        setGenFeedback('GENERATOR ACTIVATED 100%!');
        setSimProgress(100);
      } else {
        setGenQuestionIndex(nextIdx);
        setSimProgress(nextIdx * 10);
        setGenFeedback('CORRECT! (+10% POWER)');
        setGenInput('');
      }
    } else {
      setGenFeedback('INCORRECT. TRY AGAIN (NO PENALTY).');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#040507] text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#080a0e] border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              audio.playClick(true);
              onClose();
            }}
            className="flex items-center gap-2 text-xs font-mono-tech text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>EXIT TRAINING HUB</span>
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <h1 className="font-display text-sm font-bold tracking-wider text-red-500">
            THE WORLD HAS ROTTEN — SURVIVAL TRAINING ACADEMY (3059 AD)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audio.playClick(true);
              setCurrentTab('intro');
            }}
            className={`px-3 py-1.5 text-xs font-mono-tech border cursor-pointer transition-colors ${
              currentTab === 'intro' ? 'bg-red-900/40 border-red-600 text-white' : 'bg-[#0b0d12] border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            STORY INTRO
          </button>
          <button
            onClick={() => {
              audio.playClick(true);
              setCurrentTab('lessons');
            }}
            className={`px-3 py-1.5 text-xs font-mono-tech border cursor-pointer transition-colors ${
              currentTab === 'lessons' ? 'bg-red-900/40 border-red-600 text-white' : 'bg-[#0b0d12] border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            LESSONS ({completedLessons.length}/{LESSONS.length})
          </button>
          <button
            onClick={() => {
              audio.playClick(true);
              setCurrentTab('simulator');
            }}
            className={`px-3 py-1.5 text-xs font-mono-tech border cursor-pointer transition-colors ${
              currentTab === 'simulator' ? 'bg-red-900/40 border-red-600 text-white' : 'bg-[#0b0d12] border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            SIMULATOR & GENERATOR
          </button>
          <button
            onClick={() => {
              audio.playClick(true);
              setCurrentTab('settings');
            }}
            className={`px-3 py-1.5 text-xs font-mono-tech border cursor-pointer transition-colors ${
              currentTab === 'settings' ? 'bg-red-900/40 border-red-600 text-white' : 'bg-[#0b0d12] border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ACCESSIBILITY
          </button>
          <button
            onClick={() => {
              audio.playClick(true);
              onStartCampaign();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-700 hover:bg-red-600 text-xs font-display font-semibold text-white cursor-pointer transition-colors ml-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>DEPLOY TO CAMPAIGN</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 overflow-hidden flex">
        {/* TAB 1: STORY CINEMATIC INTRO */}
        {currentTab === 'intro' && (
          <div className="flex-1 p-8 sm:p-12 overflow-y-auto flex flex-col items-center justify-center max-w-4xl mx-auto space-y-8">
            <div className="space-y-3 text-center">
              <span className="text-xs font-mono-tech tracking-[0.3em] text-red-500">YEAR 3059 AD · THE FALL OF CIVILISATION</span>
              <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">THE ARRIVAL OF THEY</h2>
              <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Humanity built towering futuristic cities, orbital satellite grids, and formidable military mechs.
                Then, the meteors fell. And THEY arrived.
              </p>
            </div>

            <div className="w-full bg-[#080a0e] border border-zinc-800 p-6 rounded space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-tech">
                <div className="bg-[#0b0d12] p-4 border border-zinc-800 space-y-2">
                  <div className="text-red-400 font-bold">01. ADVANCED CIVILISATION</div>
                  <p className="text-zinc-400">Earth operated orbital power stations, automated transit networks, and quantum communication hubs.</p>
                </div>
                <div className="bg-[#0b0d12] p-4 border border-zinc-800 space-y-2">
                  <div className="text-red-400 font-bold">02. THE CORRUPTION</div>
                  <p className="text-zinc-400">THEY exclusively infect metals and rare-earth elements, instantly twisting friendly machinery into hostile biomechanical horrors.</p>
                </div>
                <div className="bg-[#0b0d12] p-4 border border-zinc-800 space-y-2">
                  <div className="text-red-400 font-bold">03. THE SURVIVORS</div>
                  <p className="text-zinc-400">Humanity collapsed into underground bunkers and quarantine zones. You are an elite operative undergoing final military survival training.</p>
                </div>
              </div>

              <div className="flex items-center justify-center pt-4">
                <button
                  onClick={() => {
                    audio.playClick(true);
                    setCurrentTab('lessons');
                  }}
                  className="px-6 py-3 bg-red-700 hover:bg-red-600 text-sm font-display font-semibold tracking-wider text-white flex items-center gap-2 cursor-pointer"
                >
                  <span>BEGIN MILITARY TRAINING LESSONS</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LESSONS & 4-STEP SYSTEM */}
        {currentTab === 'lessons' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Lesson List */}
            <div className="w-80 border-r border-zinc-800 bg-[#06080c] flex flex-col overflow-y-auto">
              <div className="p-4 border-b border-zinc-800">
                <h3 className="text-xs font-mono-tech tracking-wider text-zinc-400">TRAINING CURRICULUM</h3>
                <p className="text-sm font-display font-bold text-zinc-100 mt-0.5">SELECT A LESSON</p>
              </div>
              <div className="p-2 space-y-1">
                {LESSONS.map((lesson) => {
                  const isSelected = lesson.id === activeLessonId;
                  const isDone = completedLessons.includes(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleSelectLesson(lesson.id)}
                      className={`w-full text-left p-3 border transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/50 border-red-600 text-zinc-100'
                          : 'bg-[#0b0d12] border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-mono-tech text-red-400">LESSON {lesson.number} · {lesson.category}</div>
                        <div className="text-xs font-display font-semibold">{lesson.title}</div>
                      </div>
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Lesson 4-Step Trainer */}
            <div className="flex-1 flex flex-col bg-[#05070a] overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto w-full space-y-8">
                {/* Lesson Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-xs font-mono-tech text-red-500 tracking-wider">
                      LESSON {activeLesson.number} OF {LESSONS.length} · {activeLesson.category.toUpperCase()}
                    </span>
                    <h2 className="font-display text-2xl font-bold mt-1">{activeLesson.title}</h2>
                    <p className="text-xs text-zinc-400 mt-1">{activeLesson.summary}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[
                      { num: 1, label: 'EXPLAIN' },
                      { num: 2, label: 'DEMO' },
                      { num: 3, label: 'PRACTISE' },
                      { num: 4, label: 'FEEDBACK' },
                      { num: 5, label: 'CONFIRM' },
                    ].map((st) => (
                      <button
                        key={st.num}
                        onClick={() => {
                          audio.playClick(true);
                          setLessonStep(st.num);
                        }}
                        className={`px-2.5 h-8 text-[10px] font-mono-tech font-bold border flex items-center justify-center cursor-pointer transition-colors ${
                          lessonStep === st.num
                            ? 'bg-red-600 border-red-500 text-white'
                            : lessonStep > st.num
                            ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                            : 'bg-[#0b0d12] border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {st.num}. {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 1: Explain */}
                {lessonStep === 1 && (
                  <div className="bg-[#080a0e] border border-zinc-800 p-6 rounded space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono-tech text-amber-400">
                      <Terminal className="w-4 h-4" />
                      <span>STEP 1: EXPLAIN &amp; TACTICAL CONTEXT</span>
                    </div>
                    <p className="text-sm text-zinc-200 leading-relaxed font-sans">{activeLesson.textExplanation}</p>
                    <div className="bg-[#0b0d12] p-4 border border-zinc-800/80 rounded space-y-2">
                      <span className="text-[11px] font-mono-tech text-zinc-400">PRACTICAL TRIAL OBJECTIVE:</span>
                      <p className="text-xs font-mono-tech text-zinc-100">{activeLesson.trialObjective}</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Demonstrate */}
                {lessonStep === 2 && (
                  <div className="bg-[#080a0e] border border-zinc-800 p-6 rounded space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono-tech text-cyan-400">
                      <Eye className="w-4 h-4" />
                      <span>STEP 2: DEMONSTRATE</span>
                    </div>
                    {activeLessonId === 'science_scan' ? (
                      <EducationalDiagram
                        diagramType={EDUCATIONAL_BY_ID.edu_generator.diagramType}
                        parts={EDUCATIONAL_BY_ID.edu_generator.mainParts}
                        compact
                      />
                    ) : (
                      <div className="w-full h-48 bg-[#030406] border border-zinc-800 flex flex-col items-center justify-center p-6 text-center space-y-3 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/20 to-transparent pointer-events-none" />
                        <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-600 flex items-center justify-center text-cyan-400">
                          <Gamepad2 className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-mono-tech text-cyan-300 max-w-md">{activeLesson.demonstrationDesc}</p>
                        <span className="text-[10px] font-mono-tech text-zinc-500">SIMULATED MILITARY TRAINING DEMO ACTIVE</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Practise */}
                {lessonStep === 3 && (
                  <div className="bg-[#080a0e] border border-zinc-800 p-6 rounded space-y-6">
                    <div className="flex items-center gap-2 text-xs font-mono-tech text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>STEP 3: PRACTISE</span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono-tech text-zinc-300">OBJECTIVE:</h4>
                      <p className="text-sm font-semibold text-zinc-100">{activeLesson.trialObjective}</p>
                    </div>

                    <div className="bg-[#0b0d12] p-6 border border-zinc-800 text-center space-y-4">
                      <div className="text-xs font-mono-tech text-zinc-400">SIMULATION READY IN SAFE TRAINING BAY</div>
                      <button
                        onClick={() => {
                          audio.playClick(true);
                          setSimProgress(100);
                        }}
                        className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-xs font-mono-tech font-bold text-white cursor-pointer transition-colors"
                      >
                        {simProgress === 100 ? 'PRACTICE ACTION RECORDED' : 'EXECUTE PRACTICE DRILL'}
                      </button>
                      {simProgress === 100 && (
                        <p className="text-xs font-mono-tech text-emerald-400">
                          Practice input verified. Advance to Feedback to review telemetry.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Feedback */}
                {lessonStep === 4 && (
                  <div className="bg-[#080a0e] border border-zinc-800 p-6 rounded space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono-tech text-sky-400">
                      <BookOpen className="w-4 h-4" />
                      <span>STEP 4: FEEDBACK &amp; PERFORMANCE REVIEW</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-tech">
                      <div className="border border-zinc-800 bg-[#0b0d12] p-4 space-y-1">
                        <div className="text-zinc-400">DRILL STATUS</div>
                        <div className={simProgress === 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {simProgress === 100 ? 'PASS · TELEMETRY CLEAN' : 'READY · REVIEW COMPLETE'}
                        </div>
                      </div>
                      <div className="border border-zinc-800 bg-[#0b0d12] p-4 space-y-1">
                        <div className="text-zinc-400">KEY TAKEAWAY</div>
                        <div className="text-zinc-200">{activeLesson.successCondition}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Confirm Completion */}
                {lessonStep === 5 && (
                  <div className="bg-[#080a0e] border border-zinc-800 p-6 rounded space-y-6 text-center">
                    <div className="w-16 h-16 bg-emerald-950 border border-emerald-600 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display text-xl font-bold text-emerald-400">STEP 5: CONFIRM COMPLETION</h3>
                      <p className="text-xs text-zinc-300 max-w-md mx-auto">
                        Lesson {activeLesson.number}: {activeLesson.title} — {activeLesson.successCondition}
                      </p>
                    </div>
                    <p className="text-xs font-mono-tech text-zinc-500">Click CONFIRM LESSON below to record completion.</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <button
                    disabled={lessonStep === 1}
                    onClick={handlePrevStep}
                    className={`px-4 py-2 border text-xs font-mono-tech flex items-center gap-2 transition-colors ${
                      lessonStep > 1 ? 'bg-[#0b0d12] border-zinc-700 text-zinc-200 cursor-pointer hover:bg-zinc-800' : 'bg-transparent border-zinc-900 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>PREVIOUS STEP</span>
                  </button>

                  <span className="text-xs font-mono-tech text-zinc-500">STEP {lessonStep} OF 5</span>

                  <button
                    onClick={handleNextStep}
                    className="px-6 py-2 bg-red-700 hover:bg-red-600 text-xs font-mono-tech font-bold text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>{lessonStep === 5 ? 'CONFIRM LESSON' : 'NEXT STEP'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SIMULATOR & GENERATOR 2-PHASE PUZZLE */}
        {currentTab === 'simulator' && (
          <div className="flex-1 p-8 sm:p-12 overflow-y-auto flex flex-col items-center justify-start max-w-3xl mx-auto space-y-6">
            <div className="space-y-2 text-center">
              <span className="text-xs font-mono-tech text-red-500 tracking-wider">SECTION 11 · GENERATOR ACTIVATION SYSTEM</span>
              <h2 className="font-display text-3xl font-bold">MILITARY GENERATOR TRIAL</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Practice Phase 1 (10 multiplication/division equations) and Phase 2 (Connect-the-Dots Circuit Board).
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setCircuitMode(false)}
                  className={`px-3 py-1 text-[11px] font-mono-tech border cursor-pointer ${
                    !circuitMode ? 'bg-red-950 border-red-600 text-white' : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  PHASE 1: MATH CALIBRATION
                </button>
                <button
                  onClick={() => setCircuitMode(true)}
                  className={`px-3 py-1 text-[11px] font-mono-tech border cursor-pointer ${
                    circuitMode ? 'bg-sky-950 border-sky-500 text-sky-200' : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  PHASE 2: CIRCUIT CONNECTION
                </button>
              </div>
            </div>

            {circuitMode ? (
              <div className="w-full bg-[#080a0e] border border-zinc-800 p-6 rounded space-y-4">
                {!circuitSolved ? (
                  <GeneratorCircuitPuzzle
                    puzzleId="tutorial_circuit"
                    levelNumber={1}
                    audio={audio}
                    onComplete={() => setCircuitSolved(true)}
                  />
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 bg-emerald-950 border border-emerald-600 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                      <Zap className="w-8 h-8" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-emerald-400">CIRCUIT GRID ONLINE</h3>
                    <p className="text-xs text-zinc-300">Conduit completed! Generator interlock ready for deployment.</p>
                    <button
                      onClick={() => setCircuitSolved(false)}
                      className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono-tech text-white cursor-pointer"
                    >
                      RESET CIRCUIT DEMO
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full bg-[#080a0e] border border-zinc-800 p-8 rounded space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4 text-xs font-mono-tech">
                  <span>QUESTION {genQuestionIndex + 1} / 10</span>
                  <span className="text-red-400">POWER LEVEL: {simProgress}%</span>
                </div>

                <div className="w-full h-3 bg-[#0b0d12] border border-zinc-800 overflow-hidden">
                  <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${simProgress}%` }} />
                </div>

                {!genCompleted ? (
                  <form onSubmit={handleGeneratorSubmit} className="space-y-6 text-center">
                    <div className="py-6 bg-[#0b0d12] border border-zinc-800 rounded">
                      <span className="text-xs font-mono-tech text-zinc-400">SOLVE EQUATION:</span>
                      <div className="font-display text-5xl font-bold tracking-wider text-red-500 mt-2">
                        {generatorQuestions[genQuestionIndex].q} = ?
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <input
                        type="number"
                        value={genInput}
                        onChange={(e) => setGenInput(e.target.value)}
                        placeholder="Enter whole number"
                        autoFocus
                        className="px-4 py-3 bg-[#0b0d12] border border-zinc-700 text-center text-lg font-mono-tech text-white focus:outline-none focus:border-red-600 w-48"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-red-700 hover:bg-red-600 font-display font-semibold text-white cursor-pointer transition-colors"
                      >
                        SUBMIT
                      </button>
                    </div>

                    {genFeedback && (
                      <p className={`text-xs font-mono-tech ${genFeedback.includes('CORRECT') ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {genFeedback}
                      </p>
                    )}
                  </form>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-emerald-950 border border-emerald-600 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                      <Zap className="w-8 h-8" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-emerald-400">PHASE 1 CALIBRATED (100%)</h3>
                    <p className="text-xs text-zinc-300">All 10 mathematical relays synchronized! Proceed to Phase 2 Circuit Connection.</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setCircuitSolved(false);
                          setCircuitMode(true);
                        }}
                        className="px-6 py-2.5 bg-sky-700 hover:bg-sky-600 text-xs font-mono-tech text-white cursor-pointer"
                      >
                        PROCEED TO PHASE 2 CIRCUIT
                      </button>
                      <button
                        onClick={() => {
                          audio.playClick(true);
                          setSimProgress(0);
                          setGenQuestionIndex(0);
                          setGenCompleted(false);
                          setGenFeedback('');
                        }}
                        className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono-tech text-white cursor-pointer"
                      >
                        RESET TRIAL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ACCESSIBILITY & SETTINGS */}
        {currentTab === 'settings' && (
          <div className="flex-1 p-8 sm:p-12 overflow-y-auto flex flex-col items-center justify-center max-w-2xl mx-auto space-y-8">
            <div className="space-y-2 text-center">
              <span className="text-xs font-mono-tech text-red-500 tracking-wider">SECTION 17 · DIFFICULTY & ACCESSIBILITY</span>
              <h2 className="font-display text-3xl font-bold">TRAINING ASSISTANCE SETTINGS</h2>
            </div>

            <div className="w-full bg-[#080a0e] border border-zinc-800 p-8 rounded space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-mono-tech text-zinc-300">DIFFICULTY PRESET</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['standard', 'comfort', 'assisted'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        audio.playClick(true);
                        setDifficulty(preset);
                      }}
                      className={`p-3 border text-left cursor-pointer transition-colors ${
                        difficulty === preset ? 'bg-red-950/60 border-red-600 text-white' : 'bg-[#0b0d12] border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <div className="text-xs font-display font-bold uppercase">{preset}</div>
                      <div className="text-[10px] text-zinc-500 mt-1">
                        {preset === 'standard' && 'Normal instructions & trials.'}
                        {preset === 'comfort' && 'Slower pace & more forgiving encounters.'}
                        {preset === 'assisted' && 'Step-by-step guidance & highlights.'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-display font-bold">AUDIO INSTRUCTIONS</div>
                  <div className="text-[11px] text-zinc-500">Read tutorial text aloud with synthetic voice.</div>
                </div>
                <button
                  onClick={() => {
                    audio.playClick(true);
                    setAudioEnabled(!audioEnabled);
                  }}
                  className={`px-4 py-2 text-xs font-mono-tech border cursor-pointer ${
                    audioEnabled ? 'bg-emerald-950 border-emerald-600 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  {audioEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
