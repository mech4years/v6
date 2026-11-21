import * as THREE from 'three';
import { HorrorAudioEngine } from './audio';
import { CutsceneTargetId } from './types';
import { createProceduralTextures, ProceduralTextureSet } from './textures';

export interface CutsceneDialogueCue {
  time: number;
  duration: number;
  speaker: string;
  text: string;
  sfx?:
    | 'radio_squelch'
    | 'alien_shriek'
    | 'stinger'
    | 'signal_pulse'
    | 'mech_shutdown'
    | 'creak'
    | 'lab_flicker';
}

export interface CutsceneDefinition {
  id: CutsceneTargetId;
  kind: 'intro' | 'outro' | 'prologue' | 'ending';
  levelNumber: number;
  missionId: string;
  chapterTag: string;
  title: string;
  subtitle: string;
  nextLevelTitle: string;
  nextLocation: string;
  finalStatement: string;
  secondaryStatement?: string;
  audioDrone: 'ruins' | 'lab' | 'signal' | 'space' | 'apc' | 'normal';
  totalDuration: number;
  dialogue: CutsceneDialogueCue[];
}

export interface CutsceneViewerState {
  elapsed: number;
  totalDuration: number;
  progressPct: number;
  fadeOpacity: number;
  titleCard: { heading: string; subheading?: string } | null;
  activeDialogue: { speaker: string; text: string } | null;
  statement: string | null;
  secondaryStatement: string | null;
  glitchIntensity: number;
  cinemaBarsOpacity: number;
}

// ---------------------------------------------------------
// 12 DYNAMIC LEVEL INTRODUCTIONS (Opening Cutscenes)
// ---------------------------------------------------------
const LEVEL_INTRO_DEFS = {
  level_01_intro: {
    id: 'level_01_intro',
    kind: 'intro',
    levelNumber: 1,
    missionId: 'mission_01',
    chapterTag: 'LEVEL 01 // DYNAMIC MISSION INTRODUCTION',
    title: 'THE FALLEN CITY',
    subtitle: 'ARRIVAL IN QUARANTINE SECTOR 4',
    nextLevelTitle: 'QUARANTINE CHECKPOINT',
    nextLocation: 'BURNING COMMERCIAL BOULEVARD',
    finalStatement: 'OBJECTIVE: RESTORE POWER & LOCATE HELIOS KEY.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE SCRAPPER',
    audioDrone: 'ruins',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 3.8,
        speaker: 'VANGUARD INFILTRATION SQUAD',
        text: 'Drop pod touchdown confirmed. Sector 4 commercial boulevard is in ruins. Heavy biomechanical activity ahead.',
        sfx: 'radio_squelch',
      },
      {
        time: 5.0,
        duration: 4.2,
        speaker: 'COMMAND DISPATCH',
        text: 'Operative, scan the area. The checkpoint gates are locked under emergency quarantine. Locate the HELIOS access key.',
        sfx: 'signal_pulse',
      },
      {
        time: 9.4,
        duration: 4.0,
        speaker: 'RECON DRONE',
        text: 'A Scrapper combat unit is patrolling the industrial avenue. Keep your weapon ready and stay behind the barricades.',
        sfx: 'creak',
      },
    ],
  },
  level_02_intro: {
    id: 'level_02_intro',
    kind: 'intro',
    levelNumber: 2,
    missionId: 'mission_02',
    chapterTag: 'LEVEL 02 // DYNAMIC MISSION INTRODUCTION',
    title: 'THE SILENT ESTATES',
    subtitle: 'INFILTRATING SECTOR 7 VILLAS',
    nextLevelTitle: 'ESTATE SUBSTATION',
    nextLocation: 'ABANDONED LUXURY RESIDENTIAL VILLAS',
    finalStatement: 'OBJECTIVE: RESTORE VILLA SUBSTATION & RETRIEVE MASTER KEY.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE CRAWLER',
    audioDrone: 'ruins',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 3.8,
        speaker: 'OPERATIVE GHOST',
        text: 'Residential villas are silent. Cantilevered terraces are overgrown with black metallic vines. The air is thick with spores.',
        sfx: 'creak',
      },
      {
        time: 5.0,
        duration: 4.0,
        speaker: 'COMMAND DISPATCH',
        text: 'Grid relays B-2 and the substation are dark. Restore power to override the estate security gate.',
        sfx: 'signal_pulse',
      },
      {
        time: 9.2,
        duration: 4.2,
        speaker: 'ACOUSTIC WARNING',
        text: 'Movement on the upper balconies! The Crawler is stalking from the architectural eaves.',
        sfx: 'stinger',
      },
    ],
  },
  level_03_intro: {
    id: 'level_03_intro',
    kind: 'intro',
    levelNumber: 3,
    missionId: 'mission_03',
    chapterTag: 'LEVEL 03 // DYNAMIC MISSION INTRODUCTION',
    title: 'THE DEAD MALL',
    subtitle: 'ENTERING THE COMMERCIAL CONCOURSE',
    nextLevelTitle: 'ARCHIVIST TERMINALS',
    nextLocation: 'FUTURISTIC CONCOURSE & SHOPPING CENTRE',
    finalStatement: 'OBJECTIVE: SECURE 3 ARCHIVIST RESEARCH DRIVES.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE WATCHER',
    audioDrone: 'signal',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 3.8,
        speaker: 'OPERATIVE NYX',
        text: 'Concourse breached through the skylight. Escalators are crushed, glass everywhere. Holographic displays are flickering.',
        sfx: 'radio_squelch',
      },
      {
        time: 5.0,
        duration: 4.2,
        speaker: 'ARCHIVIST NETWORK',
        text: 'Three research drives contain classified telemetry on the infected machine migration. Extract all three.',
        sfx: 'signal_pulse',
      },
      {
        time: 9.4,
        duration: 4.0,
        speaker: 'OPTICAL ALERT',
        text: 'Red laser sweep detected from the mezzanine! The Watcher’s multi-lens array is tracking movement.',
        sfx: 'stinger',
      },
    ],
  },
  level_04_intro: {
    id: 'level_04_intro',
    kind: 'intro',
    levelNumber: 4,
    missionId: 'mission_04',
    chapterTag: 'LEVEL 04 // DYNAMIC MISSION INTRODUCTION',
    title: 'THE DEAD CONSTRUCTION ZONE',
    subtitle: 'CLIMBING THE 280-METER SKYSCRAPER',
    nextLevelTitle: 'TOWER CRANE GANTRY',
    nextLocation: 'UNFINISHED HIGH-RISE SUPERSTRUCTURE',
    finalStatement: 'OBJECTIVE: RESTORE GANTRY POWER & REACH TOWER CRANE.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE HUNTER',
    audioDrone: 'ruins',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 4.0,
        speaker: 'OPERATIVE BRUTE',
        text: 'We are 200 meters above the city. Hurricane winds are shearing through the steel rebar. Scaffolding is slick with rain.',
        sfx: 'creak',
      },
      {
        time: 5.2,
        duration: 4.0,
        speaker: 'COLONEL VANCE',
        text: 'A military transport vehicle is stranded on the tower crane deck. We need that comms gear.',
        sfx: 'radio_squelch',
      },
      {
        time: 9.4,
        duration: 4.0,
        speaker: 'PROXIMITY WARNING',
        text: 'High-speed signature leaping across structural girders! The Hunter is closing in fast.',
        sfx: 'stinger',
      },
    ],
  },
  level_05_intro: {
    id: 'level_05_intro',
    kind: 'intro',
    levelNumber: 5,
    missionId: 'mission_05',
    chapterTag: 'LEVEL 05 // DYNAMIC MISSION INTRODUCTION',
    title: 'THE UNDERGROUND',
    subtitle: 'DESCENT TO METRO CRUCIBLE',
    nextLevelTitle: 'SMELTING CRUCIBLE PLATFORMS',
    nextLocation: 'SUNKEN RAILWAY TRANSIT DELTA',
    finalStatement: 'OBJECTIVE: DEFEAT THE FORGEMASTER & BREACH THE LAB AIRLOCK.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE FORGEMASTER',
    audioDrone: 'lab',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 4.0,
        speaker: 'OPERATIVE ZERO',
        text: 'Metro tunnels are flooded with molten slag. Heat sensors reading critical. The rails lead directly into the crucible.',
        sfx: 'creak',
      },
      {
        time: 5.2,
        duration: 4.0,
        speaker: 'ENGINEERING DISPATCH',
        text: 'The automated foundry is converting raw iron into biomechanical monster husks. Shut down the crucible.',
        sfx: 'signal_pulse',
      },
      {
        time: 9.4,
        duration: 4.0,
        speaker: 'SEISMIC IMPACT',
        text: 'A massive hammer impact resonated through the rails! The Forgemaster has emerged.',
        sfx: 'stinger',
      },
    ],
  },
  level_06_intro: {
    id: 'level_06_intro',
    kind: 'intro',
    levelNumber: 6,
    missionId: 'mission_06',
    chapterTag: 'LEVEL 06 // DYNAMIC MISSION INTRODUCTION',
    title: 'THE FORGOTTEN LABORATORY',
    subtitle: 'BREACHING CLASSIFIED FACILITY 06',
    nextLevelTitle: 'CRYOGENIC SPECIMEN VAULT',
    nextLocation: 'HIGH SECURITY RESEARCH CLEANROOMS',
    finalStatement: 'OBJECTIVE: DESTROY THE SENTINEL COMBAT MECH & RETRIEVE INTEL.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE SENTINEL',
    audioDrone: 'lab',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 4.0,
        speaker: 'OPERATIVE RAVEN',
        text: 'Inside the subterranean cleanrooms. Specimen capsules are leaking liquid nitrogen vapor. Tendrils have fused into the servers.',
        sfx: 'lab_flicker',
      },
      {
        time: 5.2,
        duration: 4.0,
        speaker: 'DR. SYLVAN LOG',
        text: 'Automated defenses initiated purge protocols. The Sentinel combat rig is armed with twin energy cannons.',
        sfx: 'signal_pulse',
      },
      {
        time: 9.4,
        duration: 4.0,
        speaker: 'FIREWALL LOCK',
        text: 'Target acquisition confirmed! The Sentinel is cycling heavy weapon capacitors.',
        sfx: 'stinger',
      },
    ],
  },
  level_07_intro: {
    id: 'level_07_intro',
    kind: 'intro',
    levelNumber: 7,
    missionId: 'mission_07',
    chapterTag: 'LEVEL 07 // DYNAMIC MISSION INTRODUCTION',
    title: 'THE IRON GRAVEYARD',
    subtitle: 'CROSSING THE FLOODED PROVING GROUNDS',
    nextLevelTitle: 'DRAINAGE CONTROL CONSOLE',
    nextLocation: 'MILITARY PROVING GROUNDS & TANK WRECKS',
    finalStatement: 'OBJECTIVE: DRAIN SUBMERGED SECTORS & SLAY THE DROWNED MACHINE.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE DROWNED MACHINE',
    audioDrone: 'ruins',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 4.0,
        speaker: 'OPERATIVE GHOST',
        text: 'Rain is blinding. The entire armored proving ground has turned into a lake of diesel and mud. Tanks are buried up to their turrets.',
        sfx: 'creak',
      },
      {
        time: 5.2,
        duration: 4.0,
        speaker: 'LOGISTICS TRANSMISSION',
        text: 'Submersible pumps need manual calibration to reveal the dry path to the crater ridge.',
        sfx: 'signal_pulse',
      },
      {
        time: 9.4,
        duration: 4.0,
        speaker: 'HYDRO-TURBINE HUM',
        text: 'Hydro-acoustic sonar detected beneath the surface! The Drowned Machine is surfacing.',
        sfx: 'stinger',
      },
    ],
  },
  level_08_intro: {
    id: 'level_08_intro',
    kind: 'intro',
    levelNumber: 8,
    missionId: 'mission_08',
    chapterTag: 'LEVEL 08 // DYNAMIC MISSION INTRODUCTION',
    title: 'GROUND ZERO',
    subtitle: 'DESCENDING THE METEOR IMPACT CALDERA',
    nextLevelTitle: 'IMPACT CRATER EPICENTER',
    nextLocation: 'MASSIVE METEOR CRATER & OBSIDIAN SPIRES',
    finalStatement: 'OBJECTIVE: SEVER BIOMECHANICAL ROOT CONDUITS & DEFEAT THE GUARDIAN.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE GUARDIAN',
    audioDrone: 'ruins',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 4.0,
        speaker: 'OPERATIVE NYX',
        text: 'Standing at the edge of the crater. The meteor impact is kilometers wide. Obsidian spires pierce the red storm clouds like daggers.',
        sfx: 'creak',
      },
      {
        time: 5.2,
        duration: 4.0,
        speaker: 'HIGH COMMAND',
        text: 'The impact core isn’t dead rock—it’s pulsing with vitality. Biomechanical roots connect to every sector on Earth.',
        sfx: 'signal_pulse',
      },
      {
        time: 9.4,
        duration: 4.0,
        speaker: 'TERRA ROAR',
        text: 'The ground is buckling! The Guardian has risen to protect the central root conduits.',
        sfx: 'stinger',
      },
    ],
  },
  level_09_intro: {
    id: 'level_09_intro',
    kind: 'intro',
    levelNumber: 9,
    missionId: 'mission_09',
    chapterTag: 'LEVEL 09 // DYNAMIC MISSION INTRODUCTION',
    title: 'THE TITANFORGED',
    subtitle: 'BREACHING THE ARES-IX ARENA',
    nextLevelTitle: 'TITAN SIEGE PLATFORM',
    nextLocation: 'ROCKET GANTRY PROVING PROVING ARENA',
    finalStatement: 'OBJECTIVE: SHATTER TITAN ARMOR & EXPOSE THE HOLLOW DWELLER.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE TITAN',
    audioDrone: 'signal',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 4.0,
        speaker: 'OPERATIVE BRUTE',
        text: 'Arena blast doors breached! Massive rocket gantries surround the perimeter. Tremors are rattling my armor.',
        sfx: 'creak',
      },
      {
        time: 5.2,
        duration: 4.0,
        speaker: 'TACTICAL UPLINK',
        text: 'That’s the Ares-IX siege titan... our greatest warmachine, fully infected. Shatter the leg plates and crack the chest armor.',
        sfx: 'signal_pulse',
      },
      {
        time: 9.4,
        duration: 4.0,
        speaker: 'SEISMIC PULSE',
        text: '450 tons of hydraulic steel stepping into view! The Titanforged has targeted our squad.',
        sfx: 'stinger',
      },
    ],
  },
  level_10_intro: {
    id: 'level_10_intro',
    kind: 'intro',
    levelNumber: 10,
    missionId: 'mission_10',
    chapterTag: 'LEVEL 10 // DYNAMIC MISSION INTRODUCTION',
    title: 'THE FINAL SIGNAL',
    subtitle: 'STORMING THE MOUNTAIN ARRAY',
    nextLevelTitle: 'MASTER TRANSMITTER BUNKER',
    nextLocation: '18-METER PARABOLIC DISH MOUNTAIN SUMMIT',
    finalStatement: 'OBJECTIVE: DESTROY HELIOS DEFENCE UNIT & DEACTIVATE THE BROADCAST.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: HELIOS DEFENCE UNIT',
    audioDrone: 'space',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 4.0,
        speaker: 'OPERATIVE ZERO',
        text: 'Summit reached. Blizzard winds at 80 knots. The 18-meter parabolic dish is humming with megavolts of ionospheric power.',
        sfx: 'creak',
      },
      {
        time: 5.2,
        duration: 4.0,
        speaker: 'CENTRAL COMMAND',
        text: 'This array is the master uplink broadcasting the alien carrier wave to every infected machine on Earth. Shut it down!',
        sfx: 'signal_pulse',
      },
      {
        time: 9.4,
        duration: 4.0,
        speaker: 'SHIELD DEPLOY',
        text: 'The automated Helios Defence Unit has deployed energy barrier shields! Take down its power nodes.',
        sfx: 'stinger',
      },
    ],
  },
  level_11_intro: {
    id: 'level_11_intro',
    kind: 'intro',
    levelNumber: 11,
    missionId: 'mission_11',
    chapterTag: 'LEVEL 11 // DYNAMIC MISSION INTRODUCTION',
    title: 'BEYOND EARTH',
    subtitle: 'ORBITAL RESEARCH STATION HELIOS-1',
    nextLevelTitle: 'ZERO-G OBSERVATION CUPOLA',
    nextLocation: 'LOW EARTH ORBIT VOID PLATFORM',
    finalStatement: 'OBJECTIVE: RESTORE ORBITAL STATION POWER & RECOVER THE SECRET LOGS.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE VOID WALKER',
    audioDrone: 'space',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 4.0,
        speaker: 'OPERATIVE RAVEN',
        text: 'Airlock equalized. We are in orbit. Silence... zero gravity. Earth fills the viewport below, glowing with crimson scars.',
        sfx: 'signal_pulse',
      },
      {
        time: 5.2,
        duration: 4.0,
        speaker: 'ORBITAL TELEMETRY',
        text: 'Station systems are offline. Restore power to access the black box data archives containing the truth behind the meteors.',
        sfx: 'lab_flicker',
      },
      {
        time: 9.4,
        duration: 4.0,
        speaker: 'GRAVITY WARP',
        text: 'Spatial distortion in the observation module! The Void Walker is phasing through zero gravity.',
        sfx: 'stinger',
      },
    ],
  },
  level_12_intro: {
    id: 'level_12_intro',
    kind: 'intro',
    levelNumber: 12,
    missionId: 'mission_12',
    chapterTag: 'LEVEL 12 // DYNAMIC MISSION INTRODUCTION',
    title: 'THE BEGINNING',
    subtitle: 'THE CORE BENEATH THE EARTH',
    nextLevelTitle: 'MASTER HELIOS CONTROL SPIRE',
    nextLocation: 'SUBTERRANEAN ALIEN STRUCTURE',
    finalStatement: 'OBJECTIVE: CONFRONT THE ORIGIN & DECIDE THE FATE OF HELIOS.',
    secondaryStatement: 'PRIMARY HOSTILE THREAT: THE ORIGIN / THE FORGE',
    audioDrone: 'normal',
    totalDuration: 14.5,
    dialogue: [
      {
        time: 1.0,
        duration: 4.0,
        speaker: 'OPERATIVE RAVEN',
        text: 'Descent capsule landed. We are deep beneath Earth’s crust. The architecture here is impossible... non-human... metallic geometry.',
        sfx: 'stinger',
      },
      {
        time: 5.2,
        duration: 4.2,
        speaker: 'OPERATIVES IN UNISON',
        text: 'This is where it all started. The Master Spire is pulsing with the frequency of the cosmos. The Origin entity is descending.',
        sfx: 'signal_pulse',
      },
      {
        time: 9.6,
        duration: 4.0,
        speaker: 'FINAL BATTLE CALL',
        text: 'Lock and load, operatives! Defeat the Origin, reach the Control Spire, and take back our world!',
        sfx: 'radio_squelch',
      },
    ],
  },
} satisfies Record<string, CutsceneDefinition>;

// ---------------------------------------------------------
// 12 DYNAMIC LEVEL ENDING & OUTRO TRANSITIONS
// ---------------------------------------------------------
const LEVEL_OUTRO_DEFS = {
  level_01_outro: {
    id: 'level_01_outro',
    kind: 'outro',
    levelNumber: 1,
    missionId: 'mission_01',
    chapterTag: 'LEVEL 01 OUTRO // THE CONNECTION',
    title: 'THE FALLEN CITY',
    subtitle: 'SECTOR 4 COMMERCIAL RUINS',
    nextLevelTitle: 'LEVEL 02 // THE SILENT ESTATES',
    nextLocation: 'ABANDONED LUXURY RESIDENTIAL VILLAS',
    finalStatement: 'THE SIGNAL IS COMING FROM SOMEWHERE ELSE.',
    audioDrone: 'ruins',
    totalDuration: 19.5,
    dialogue: [
      {
        time: 1.2,
        duration: 3.8,
        speaker: 'EMERGENCY BROADCAST',
        text: 'Mayday, mayday! Commercial boulevard breached. All perimeter defense lines collapsed.',
        sfx: 'radio_squelch',
      },
      {
        time: 5.4,
        duration: 4.2,
        speaker: 'SURVIVOR BRAVO-3',
        text: 'Command, can anyone hear this?! There are strange lights moving over the Silent Estates... rhythmic pulses!',
        sfx: 'radio_squelch',
      },
      {
        time: 10.0,
        duration: 3.6,
        speaker: 'CARRIER FREQUENCY',
        text: '<< UNKNOWN 4.18 HZ HARMONIC INTERFERENCE DETECTED >>',
        sfx: 'signal_pulse',
      },
      {
        time: 13.8,
        duration: 4.2,
        speaker: 'OPERATIVE RAVEN',
        text: 'The Scrapper is neutralised, but that frequency... it is being relayed straight into the residential sector.',
        sfx: 'creak',
      },
    ],
  },
  level_02_outro: {
    id: 'level_02_outro',
    kind: 'outro',
    levelNumber: 2,
    missionId: 'mission_02',
    chapterTag: 'LEVEL 02 OUTRO // THE CONNECTION',
    title: 'THE SILENT ESTATES',
    subtitle: 'ABANDONED RESIDENTIAL DISTRICT',
    nextLevelTitle: 'LEVEL 03 // THE DEAD MALL',
    nextLocation: 'FUTURISTIC CONCOURSE & SHOPPING CENTRE',
    finalStatement: 'THEY WERE TAKING SOMETHING WITH THEM.',
    audioDrone: 'ruins',
    totalDuration: 19.5,
    dialogue: [
      {
        time: 1.2,
        duration: 3.9,
        speaker: 'EVACUATION AUDIO TAPE',
        text: 'Military evacuation was halted at 21:00 hours. The armed drones were not protecting civilians...',
        sfx: 'radio_squelch',
      },
      {
        time: 5.5,
        duration: 4.5,
        speaker: 'WITNESS RECORDING',
        text: 'Hundreds of residents were herded down the grand avenue toward the shopping mall concourse in complete silence.',
        sfx: 'creak',
      },
      {
        time: 10.4,
        duration: 3.8,
        speaker: 'OPERATIVE GHOST',
        text: 'Look at the villas. Metallic tendrils are fusing into the furniture and drywall. Organic life was spared, but transformed.',
        sfx: 'stinger',
      },
      {
        time: 14.5,
        duration: 3.8,
        speaker: 'FIELD TELEMETRY',
        text: 'Subterranean power cables lead straight toward the commercial dome. The Dead Mall is live.',
        sfx: 'signal_pulse',
      },
    ],
  },
  level_03_outro: {
    id: 'level_03_outro',
    kind: 'outro',
    levelNumber: 3,
    missionId: 'mission_03',
    chapterTag: 'LEVEL 03 OUTRO // THE CONNECTION',
    title: 'THE DEAD MALL',
    subtitle: 'COMMERCIAL CONCOURSE SECURITY BUNKER',
    nextLevelTitle: 'LEVEL 04 // THE DEAD CONSTRUCTION ZONE',
    nextLocation: 'UNFINISHED SKYSCRAPERS & GANTRY CRANES',
    finalStatement: 'THE ANSWER IS ABOVE THE CITY.',
    audioDrone: 'signal',
    totalDuration: 19.0,
    dialogue: [
      {
        time: 1.2,
        duration: 3.8,
        speaker: 'SECURITY AI OVERRIDE',
        text: 'EMERGENCY POWER RESTORED. CCTV Feed 09 online: Hostile biomechanical unit sighted.',
        sfx: 'signal_pulse',
      },
      {
        time: 5.4,
        duration: 4.4,
        speaker: 'SURVEILLANCE LOG',
        text: 'An infected siege machine was tracked moving heavy alloy crates through the high-rise construction zone.',
        sfx: 'creak',
      },
      {
        time: 10.2,
        duration: 4.0,
        speaker: 'ENGINEERING SCHEMATIC',
        text: 'Classified broadcast spire detected at the top of the unfinished 280-meter skyscraper.',
        sfx: 'stinger',
      },
      {
        time: 14.4,
        duration: 3.6,
        speaker: 'OPERATIVE NYX',
        text: 'The mall was never the target. They are building something atop the skyline.',
        sfx: 'radio_squelch',
      },
    ],
  },
  level_04_outro: {
    id: 'level_04_outro',
    kind: 'outro',
    levelNumber: 4,
    missionId: 'mission_04',
    chapterTag: 'LEVEL 04 OUTRO // THE CONNECTION',
    title: 'THE DEAD CONSTRUCTION ZONE',
    subtitle: 'UNFINISHED SKYSCRAPER GANTRY',
    nextLevelTitle: 'LEVEL 05 // THE UNDERGROUND',
    nextLocation: 'METRO PLATFORMS & SMELTING CRUCIBLE',
    finalStatement: 'THE CITY WAS BUILT OVER SOMETHING.',
    audioDrone: 'ruins',
    totalDuration: 19.5,
    dialogue: [
      {
        time: 1.2,
        duration: 4.0,
        speaker: 'FOUNDATION TELEMETRY',
        text: 'Sub-level bedrock elevator shaft detected. Depth extends 400 meters beneath foundation pilings.',
        sfx: 'creak',
      },
      {
        time: 5.6,
        duration: 4.2,
        speaker: 'COLONEL VANCE',
        text: 'The skyscraper project was a camouflage cover. HELIOS was digging long before the first meteor shower.',
        sfx: 'radio_squelch',
      },
      {
        time: 10.2,
        duration: 4.0,
        speaker: 'ABANDONED DISPATCH',
        text: 'Classified research laboratory 06 confirmed beneath metro railway line Delta. Access restricted.',
        sfx: 'signal_pulse',
      },
      {
        time: 14.5,
        duration: 3.8,
        speaker: 'OPERATIVE BRUTE',
        text: 'The freight elevators go straight through the bedrock. New Eden was anchored to an ancient foundation.',
        sfx: 'stinger',
      },
    ],
  },
  level_05_outro: {
    id: 'level_05_outro',
    kind: 'outro',
    levelNumber: 5,
    missionId: 'mission_05',
    chapterTag: 'LEVEL 05 OUTRO // THE CONNECTION',
    title: 'THE UNDERGROUND',
    subtitle: 'CLASSIFIED TRANSIT SUB-LEVEL 06',
    nextLevelTitle: 'LEVEL 06 // THE FORGOTTEN LABORATORY',
    nextLocation: 'CLASSIFIED RESEARCH & CRYO CHAMBERS',
    finalStatement: 'THE FIRST EXPERIMENT BEGAN HERE.',
    audioDrone: 'lab',
    totalDuration: 20.0,
    dialogue: [
      {
        time: 1.2,
        duration: 4.0,
        speaker: 'PROJECT PROMETHEUS TERMINAL',
        text: 'RECOVERED METEOR LATTICE SAMPLE #001. Origin date: 3058. Metallic element self-replicates.',
        sfx: 'signal_pulse',
      },
      {
        time: 5.6,
        duration: 4.4,
        speaker: 'DR. SYLVAN AUDIO ARCHIVE',
        text: 'The alien organism has zero DNA. It is a crystalline neural alloy that feeds on conductive circuitry.',
        sfx: 'lab_flicker',
      },
      {
        time: 10.4,
        duration: 4.2,
        speaker: 'SECURITY ALARM',
        text: 'Containment breached in cryogenic cleanrooms. Sub-level laboratories sealed under emergency quarantine.',
        sfx: 'stinger',
      },
      {
        time: 15.0,
        duration: 4.0,
        speaker: 'OPERATIVE ZERO',
        text: 'The Forgemaster fell, but this entire station was built to cultivate it. The laboratory lies right through that bulkhead.',
        sfx: 'creak',
      },
    ],
  },
  level_06_outro: {
    id: 'level_06_outro',
    kind: 'outro',
    levelNumber: 6,
    missionId: 'mission_06',
    chapterTag: 'LEVEL 06 OUTRO // THE CONNECTION',
    title: 'THE FORGOTTEN LABORATORY',
    subtitle: 'RESEARCH CLEANROOM ARCHIVES',
    nextLevelTitle: 'LEVEL 07 // THE IRON GRAVEYARD',
    nextLocation: 'MILITARY PROVING GROUNDS & TANK WRECKS',
    finalStatement: 'THEY HAVE REACHED OUR WEAPONS.',
    audioDrone: 'lab',
    totalDuration: 20.0,
    dialogue: [
      {
        time: 1.2,
        duration: 4.2,
        speaker: 'CLASSIFIED MEMORANDUM',
        text: 'THEY do not infect flesh. They colonize silicon microprocessors, titanium hydraulics, and ballistic chassis.',
        sfx: 'lab_flicker',
      },
      {
        time: 5.8,
        duration: 4.4,
        speaker: 'CHIEF ENGINEER LOG',
        text: 'Our military mechs are growing synthetic muscle fibres between armor plates. They are turning into living weapons.',
        sfx: 'creak',
      },
      {
        time: 10.6,
        duration: 4.2,
        speaker: 'LOGISTICS CONVOY DISPATCH',
        text: 'Experimental mechanized divisions were relocated to the Ares-IX proving ground before evacuation.',
        sfx: 'signal_pulse',
      },
      {
        time: 15.2,
        duration: 3.8,
        speaker: 'OPERATIVE RAVEN',
        text: 'Every heavy tank and combat rig we manufactured is waiting out there... and THEY are driving.',
        sfx: 'stinger',
      },
    ],
  },
  level_07_outro: {
    id: 'level_07_outro',
    kind: 'outro',
    levelNumber: 7,
    missionId: 'mission_07',
    chapterTag: 'LEVEL 07 OUTRO // THE CONNECTION',
    title: 'THE IRON GRAVEYARD',
    subtitle: 'MILITARY PROVING GROUNDS',
    nextLevelTitle: 'LEVEL 08 // GROUND ZERO',
    nextLocation: 'MASSIVE METEOR CRATER & ALIEN STRUCTURES',
    finalStatement: 'THE SOURCE IS STILL ALIVE.',
    audioDrone: 'ruins',
    totalDuration: 20.5,
    dialogue: [
      {
        time: 1.2,
        duration: 4.0,
        speaker: 'DAMAGED MECH COCKPIT',
        text: 'EMERGENCY REBOOT. Optical sensors flickering... seismic shockwave detected at Crater Coordinates 0-0.',
        sfx: 'mech_shutdown',
      },
      {
        time: 5.6,
        duration: 4.4,
        speaker: 'DISTRESS RECORDING',
        text: 'Do not approach the impact crater! The main meteor did not shatter on impact... it opened.',
        sfx: 'radio_squelch',
      },
      {
        time: 10.4,
        duration: 4.4,
        speaker: 'ARMY COMMAND TRANSMISSION',
        text: 'A gargantuan construct is feeding directly off the subterranean power grid at Ground Zero.',
        sfx: 'stinger',
      },
      {
        time: 15.2,
        duration: 4.0,
        speaker: 'OPERATIVE GHOST',
        text: 'The Drowned Machine was just an outpost. The primary alien lifeform is beating in the central crater.',
        sfx: 'creak',
      },
    ],
  },
  level_08_outro: {
    id: 'level_08_outro',
    kind: 'outro',
    levelNumber: 8,
    missionId: 'mission_08',
    chapterTag: 'LEVEL 08 OUTRO // THE CONNECTION',
    title: 'GROUND ZERO',
    subtitle: 'PRIMARY METEOR IMPACT CALDERA',
    nextLevelTitle: 'LEVEL 09 // THE TITANFORGED',
    nextLocation: 'ARES-IX PROVING GROUNDS & TITAN ARENA',
    finalStatement: 'THE LAST DEFENCE IS A MONSTER.',
    audioDrone: 'ruins',
    totalDuration: 20.0,
    dialogue: [
      {
        time: 1.2,
        duration: 4.0,
        speaker: 'SEISMIC SENSOR GRID',
        text: 'Rhythmic sub-audible vibration detected: 32 beats per minute. Estimated mass: 450 metric tons.',
        sfx: 'creak',
      },
      {
        time: 5.6,
        duration: 4.6,
        speaker: 'HOLOGRAPHIC IDENTIFIER',
        text: 'SIEGE CONSTRUCT: ARES-IX TITANFORGED. Fused with subterranean biomechanical root network.',
        sfx: 'signal_pulse',
      },
      {
        time: 10.6,
        duration: 4.2,
        speaker: 'HIGH COMMAND RADIO',
        text: 'That unit was designed as our final orbital deterrent. The parasite has taken total control.',
        sfx: 'stinger',
      },
      {
        time: 15.2,
        duration: 3.8,
        speaker: 'OPERATIVE BRUTE',
        text: 'We armed them with our strongest shields and heaviest cannons. The last defence is a monster.',
        sfx: 'radio_squelch',
      },
    ],
  },
  level_09_outro: {
    id: 'level_09_outro',
    kind: 'outro',
    levelNumber: 9,
    missionId: 'mission_09',
    chapterTag: 'LEVEL 09 OUTRO // THE CONNECTION',
    title: 'THE TITANFORGED',
    subtitle: 'TITAN SIEGE PLATFORM WRECKAGE',
    nextLevelTitle: 'LEVEL 10 // THE FINAL SIGNAL',
    nextLocation: 'MASTER SATELLITE COMMUNICATIONS ARRAY',
    finalStatement: 'THE SIGNAL MUST BE STOPPED.',
    audioDrone: 'signal',
    totalDuration: 20.5,
    dialogue: [
      {
        time: 1.2,
        duration: 4.0,
        speaker: 'TITAN TELEMETRY CORE',
        text: 'ARMOR COMPROMISED. Core failure in progress... Encrypted transmission burst initiated.',
        sfx: 'mech_shutdown',
      },
      {
        time: 5.6,
        duration: 4.5,
        speaker: 'TACTICAL INTERCEPT',
        text: 'The Titan was not an autonomous hunter... it was a high-frequency orbital uplink transmitter.',
        sfx: 'signal_pulse',
      },
      {
        time: 10.5,
        duration: 4.4,
        speaker: 'NETWORK TRACE',
        text: 'SIGNAL ORIGIN IDENTIFIED: HELIOS Master Communications Array in the northern mountain sector.',
        sfx: 'stinger',
      },
      {
        time: 15.3,
        duration: 4.0,
        speaker: 'OPERATIVE NYX',
        text: 'It is broadcasting instructions to every infested machine on the continent. The signal must be stopped.',
        sfx: 'radio_squelch',
      },
    ],
  },
  level_10_outro: {
    id: 'level_10_outro',
    kind: 'outro',
    levelNumber: 10,
    missionId: 'mission_10',
    chapterTag: 'LEVEL 10 OUTRO // THE CONNECTION',
    title: 'THE FINAL SIGNAL',
    subtitle: 'MASTER HELIOS SATELLITE ARRAY',
    nextLevelTitle: 'LEVEL 11 // BEYOND EARTH',
    nextLocation: 'ORBITAL RESEARCH STATION & VOID PLATFORM',
    finalStatement: 'THE SIGNAL WAS NOT THE ONLY MESSAGE.',
    audioDrone: 'space',
    totalDuration: 21.0,
    dialogue: [
      {
        time: 1.2,
        duration: 4.2,
        speaker: 'SATELLITE ARRAY TERMINAL',
        text: 'Terrestrial array grid shutting down. Dish motors locked. Carrier wave decaying across New Eden.',
        sfx: 'signal_pulse',
      },
      {
        time: 5.8,
        duration: 4.6,
        speaker: 'DEEP SPACE SENSOR',
        text: 'Secondary hidden harmonic detected beneath carrier. Telemetry vector: Deep Space Sector 88.',
        sfx: 'stinger',
      },
      {
        time: 10.8,
        duration: 4.4,
        speaker: 'ORBITAL TELEMETRY',
        text: 'The satellites were not commanding Earth... they were transmitting coordinates outward into the black.',
        sfx: 'creak',
      },
      {
        time: 15.6,
        duration: 4.2,
        speaker: 'OPERATIVE RAVEN',
        text: 'A shadow just passed between the moon and the orbital station. The signal was not the only message.',
        sfx: 'radio_squelch',
      },
    ],
  },
  level_11_outro: {
    id: 'level_11_outro',
    kind: 'outro',
    levelNumber: 11,
    missionId: 'mission_11',
    chapterTag: 'LEVEL 11 OUTRO // THE CONNECTION',
    title: 'BEYOND EARTH',
    subtitle: 'LOW ORBIT RESEARCH PLATFORM',
    nextLevelTitle: 'LEVEL 12 // THE BEGINNING',
    nextLocation: 'SUBTERRANEAN ALIEN STRUCTURE & FORGE SPIRE',
    finalStatement: 'THEY WERE NOT INVADERS. THEY WERE FLEEING.',
    secondaryStatement: 'DESCENT TRAJECTORY LOCKED: THE CORE AT THE CENTER OF THE WORLD.',
    audioDrone: 'space',
    totalDuration: 21.5,
    dialogue: [
      {
        time: 1.2,
        duration: 4.2,
        speaker: 'ORBITAL BLACK BOX',
        text: 'DR. ARIS FINAL TESTAMENT: The meteors were never invasion dropships. They were escape pods.',
        sfx: 'signal_pulse',
      },
      {
        time: 5.8,
        duration: 4.6,
        speaker: 'ARCHIVE PLAYBACK',
        text: 'An entire star-faring civilization was annihilated at the galactic rim. THEY were their automated survival tools.',
        sfx: 'lab_flicker',
      },
      {
        time: 10.8,
        duration: 4.4,
        speaker: 'ORBITAL SENSORS',
        text: 'The planetary broadcast was a quarantine barrier screaming: DO NOT APPROACH EARTH.',
        sfx: 'stinger',
      },
      {
        time: 15.6,
        duration: 4.6,
        speaker: 'OPERATIVE ZERO',
        text: 'They infected our war machines to build a planetary shield. The root anchor is deep in the core below New Eden.',
        sfx: 'creak',
      },
    ],
  },
  level_12_outro: {
    id: 'level_12_outro',
    kind: 'outro',
    levelNumber: 12,
    missionId: 'mission_12',
    chapterTag: 'LEVEL 12 OUTRO // THE FINALE',
    title: 'THE BEGINNING',
    subtitle: 'SUBTERRANEAN ANCHOR CORE',
    nextLevelTitle: 'CAMPAIGN RESOLUTION',
    nextLocation: 'GLOBAL SATELLITE COMMUNICATIONS NETWORK',
    finalStatement: 'THE MASTER SPIRE HAS FALLEN.',
    audioDrone: 'normal',
    totalDuration: 18.0,
    dialogue: [
      {
        time: 1.2,
        duration: 4.0,
        speaker: 'CENTRAL CORE',
        text: 'THE ORIGIN construct dismantled. Bio-metallic root resonance collapsing across mantle plates.',
        sfx: 'stinger',
      },
      {
        time: 5.6,
        duration: 4.5,
        speaker: 'MASTER SPIRE',
        text: 'HELIOS network status: STANDBY. Awaiting authoritative operator command.',
        sfx: 'signal_pulse',
      },
      {
        time: 10.5,
        duration: 4.5,
        speaker: 'OPERATIVE RAVEN',
        text: 'The choice is ours now. Sever the link, redirect the wave, or listen to what is out there.',
        sfx: 'radio_squelch',
      },
    ],
  },
} satisfies Record<string, CutsceneDefinition>;

export const LEVEL_CUTSCENE_DEFS: Record<CutsceneTargetId, CutsceneDefinition> = {
  // Prologue
  cutscene_intro: {
    id: 'cutscene_intro',
    kind: 'prologue',
    levelNumber: 0,
    missionId: 'prologue',
    chapterTag: 'PROLOGUE',
    title: 'THE FALL OF EARTH',
    subtitle: 'YEAR 3059 · ORBITAL IMPACT EVENT',
    nextLevelTitle: 'LEVEL 01 // THE FALLEN CITY',
    nextLocation: 'BURNING COMMERCIAL BOULEVARD',
    finalStatement: 'THE WORLD HAS ROTTEN.',
    audioDrone: 'space',
    totalDuration: 18,
    dialogue: [
      {
        time: 1.2,
        duration: 4.0,
        speaker: 'ORBITAL OBSERVATORY',
        text: 'Multiple Class-9 impactors detected entering upper atmosphere... trajectory confirmed.',
        sfx: 'radio_squelch',
      },
      {
        time: 5.6,
        duration: 4.2,
        speaker: 'PLANETARY DEFENCE',
        text: 'They are not typical meteors. Metallic lattice detected inside the impact cores.',
        sfx: 'signal_pulse',
      },
      {
        time: 10.2,
        duration: 5.0,
        speaker: 'CENTRAL COMMAND',
        text: 'All ground networks compromised. The infection has begun. Evacuate the cities!',
        sfx: 'stinger',
      },
    ],
  },

  // 12 Level Intros
  ...LEVEL_INTRO_DEFS,

  // 12 Level Outros
  ...LEVEL_OUTRO_DEFS,

  // Direct Level Aliases for backwards compatibility (mapping to outros)
  level_01: LEVEL_OUTRO_DEFS.level_01_outro,
  level_02: LEVEL_OUTRO_DEFS.level_02_outro,
  level_03: LEVEL_OUTRO_DEFS.level_03_outro,
  level_04: LEVEL_OUTRO_DEFS.level_04_outro,
  level_05: LEVEL_OUTRO_DEFS.level_05_outro,
  level_06: LEVEL_OUTRO_DEFS.level_06_outro,
  level_07: LEVEL_OUTRO_DEFS.level_07_outro,
  level_08: LEVEL_OUTRO_DEFS.level_08_outro,
  level_09: LEVEL_OUTRO_DEFS.level_09_outro,
  level_10: LEVEL_OUTRO_DEFS.level_10_outro,
  level_11: LEVEL_OUTRO_DEFS.level_11_outro,
  level_12: LEVEL_OUTRO_DEFS.level_12_outro,

  // Final Endings
  ending_regular: {
    id: 'ending_regular',
    kind: 'ending',
    levelNumber: 12,
    missionId: 'mission_12',
    chapterTag: 'REGULAR ENDING // THE LAST SIGNAL',
    title: 'THE LAST SIGNAL',
    subtitle: 'EARTH RECLAIMS THE SILENCE',
    nextLevelTitle: 'CAMPAIGN COMPLETE',
    nextLocation: 'NEW EDEN RESTORATION ZONE',
    finalStatement: 'THE WORLD HAS ROTTEN. BUT HUMANITY REMAINS.',
    audioDrone: 'normal',
    totalDuration: 24.0,
    dialogue: [
      {
        time: 1.2,
        duration: 4.4,
        speaker: 'GENERAL VANCE',
        text: 'To all surviving bunkers and civilian shelters... the alien carrier frequency has collapsed. The silence is ours again.',
        sfx: 'radio_squelch',
      },
      {
        time: 6.0,
        duration: 4.5,
        speaker: 'FIELD TRANSMISSION',
        text: 'Across every sector, infected war machines have slumped motionless. The red haze is breaking.',
        sfx: 'signal_pulse',
      },
      {
        time: 11.0,
        duration: 4.2,
        speaker: 'OPERATIVE RAVEN',
        text: 'I can see the sunrise over the commercial boulevard. The air smells like fresh rain again.',
        sfx: 'creak',
      },
      {
        time: 15.6,
        duration: 4.4,
        speaker: 'OPERATIVE GHOST',
        text: 'The invasion is stopped. Our world is ruined, but our hands are free to rebuild it.',
        sfx: 'stinger',
      },
      {
        time: 20.4,
        duration: 3.2,
        speaker: 'HIGH COMMAND',
        text: 'Welcome home, operatives. Stand down weapons. Earth has endured.',
        sfx: 'radio_squelch',
      },
    ],
  },
  ending_secret: {
    id: 'ending_secret',
    kind: 'ending',
    levelNumber: 12,
    missionId: 'mission_12',
    chapterTag: 'SECRET EASTER EGG // UNDER SIX HITS',
    title: 'THE THING BEYOND THE STARS',
    subtitle: 'ANOMALOUS HARMONIC RESONANCE',
    nextLevelTitle: 'THE ONE WHO SAW THE TRUTH',
    nextLocation: 'THE OORT CLOUD VOID',
    finalStatement: 'YOU HAVE DISCOVERED SOMETHING THAT WAS NEVER MEANT TO BE FOUND.',
    secondaryStatement: 'THEY WERE NOT INVADERS. THEY WERE THE PREY.',
    audioDrone: 'space',
    totalDuration: 26.0,
    dialogue: [
      {
        time: 1.2,
        duration: 4.5,
        speaker: 'FORGE CORE TELEMETRY',
        text: '<< CORE REACTION ABNORMAL. 0.001 HZ HARMONIC PULSE UNLOCKED >>',
        sfx: 'stinger',
      },
      {
        time: 6.0,
        duration: 4.8,
        speaker: 'OPERATIVE RAVEN',
        text: 'Wait... this is not the signal transmitted by THEY. Look at the core... an ancient cosmic glyph is burning through the metal.',
        sfx: 'signal_pulse',
      },
      {
        time: 11.2,
        duration: 4.8,
        speaker: 'DEEP SPACE RADAR',
        text: 'ANOMALY DETECTED BEYOND NEPTUNE. An incomprehensible silhouette is moving against the starfield.',
        sfx: 'creak',
      },
      {
        time: 16.4,
        duration: 5.0,
        speaker: 'OPERATIVE GHOST',
        text: 'They did not come to conquer us... THEY were building an armor shield around Earth to hide from that thing.',
        sfx: 'stinger',
      },
      {
        time: 21.8,
        duration: 3.8,
        speaker: 'INTERCEPTED VOID WHISPER',
        text: '<< THE HARVEST HAS COMMENCED. EARTH IS ILLUMINATED. >>',
        sfx: 'alien_shriek',
      },
    ],
  },
};

export class LevelCutsceneEngine {
  private container: HTMLElement;
  private audio: HorrorAudioEngine;
  private cutsceneDef: CutsceneDefinition;
  private onStateUpdate: (state: CutsceneViewerState) => void;
  private onComplete: () => void;

  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private textures: ProceduralTextureSet;
  private animFrameId = 0;
  private startTime = performance.now();
  private elapsed = 0;
  private isDisposed = false;
  private playedCues = new Set<number>();

  // Animated scene elements
  private dynamicLights: { light: THREE.Light; base: number; speed: number; pulse?: boolean }[] = [];
  private animatedMeshes: { mesh: THREE.Object3D; rotSpeed?: THREE.Vector3; floatSpeed?: number; basePos?: THREE.Vector3 }[] = [];
  private particleCloud: THREE.Points | null = null;
  private beamMesh: THREE.Mesh | null = null;
  private glyphMesh: THREE.Mesh | null = null;
  private spaceObject: THREE.Group | null = null;

  constructor(
    container: HTMLElement,
    targetId: CutsceneTargetId,
    audio: HorrorAudioEngine,
    onStateUpdate: (state: CutsceneViewerState) => void,
    onComplete: () => void
  ) {
    this.container = container;
    this.audio = audio;
    this.cutsceneDef = LEVEL_CUTSCENE_DEFS[targetId] || LEVEL_CUTSCENE_DEFS.level_01;
    this.onStateUpdate = onStateUpdate;
    this.onComplete = onComplete;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(54, w / h, 0.1, 800);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05080c, 0.012);
    this.textures = createProceduralTextures(this.renderer);

    this.buildSceneByTarget(targetId);

    // Audio setup
    try {
      this.audio.unlock();
      this.audio.setCutsceneDrone(this.cutsceneDef.audioDrone);
    } catch {
      // Audio unlock handled gracefully
    }

    window.addEventListener('resize', this.onResize);
    this.startTime = performance.now();
    this.loop();
  }

  private onResize = () => {
    if (this.isDisposed || !this.container) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private buildSceneByTarget(targetId: CutsceneTargetId) {
    // Determine level base from string
    const targetStr = String(targetId);
    const isIntro = targetStr.includes('_intro');

    if (targetStr.startsWith('level_01')) {
      this.buildLevel1City(isIntro);
    } else if (targetStr.startsWith('level_02')) {
      this.buildLevel2Estates(isIntro);
    } else if (targetStr.startsWith('level_03')) {
      this.buildLevel3Mall(isIntro);
    } else if (targetStr.startsWith('level_04')) {
      this.buildLevel4Construction(isIntro);
    } else if (targetStr.startsWith('level_05')) {
      this.buildLevel5Underground(isIntro);
    } else if (targetStr.startsWith('level_06')) {
      this.buildLevel6Lab(isIntro);
    } else if (targetStr.startsWith('level_07')) {
      this.buildLevel7Graveyard(isIntro);
    } else if (targetStr.startsWith('level_08')) {
      this.buildLevel8GroundZero(isIntro);
    } else if (targetStr.startsWith('level_09')) {
      this.buildLevel9Titanforged(isIntro);
    } else if (targetStr.startsWith('level_10')) {
      this.buildLevel10FinalSignal(isIntro);
    } else if (targetStr.startsWith('level_11')) {
      this.buildLevel11BeyondEarth(isIntro);
    } else if (targetStr === 'ending_secret') {
      this.buildEndingSecret();
    } else {
      this.buildEndingRegular();
    }
  }

  // LEVEL 1: RUINED FALLEN CITY BOULEVARD
  private buildLevel1City(isIntro = false) {
    this.scene.background = new THREE.Color(0x03060a);
    this.scene.fog = new THREE.FogExp2(0x04080e, isIntro ? 0.018 : 0.014);

    const ambient = new THREE.AmbientLight(0x0b1522, 1.2);
    this.scene.add(ambient);

    const moonLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    moonLight.position.set(20, 45, 30);
    this.scene.add(moonLight);

    // Ground road
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x11161d,
      roughness: 0.94,
      metalness: 0.02,
      map: this.textures.concreteMap,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // City Buildings
    for (let i = 0; i < 18; i++) {
      const bh = 30 + Math.random() * 50;
      const bw = 10 + Math.random() * 12;
      const bGeo = new THREE.BoxGeometry(bw, bh, bw);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x090e15,
        roughness: 0.8,
        metalness: 0.3,
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      const side = i % 2 === 0 ? 1 : -1;
      const x = side * (16 + Math.random() * 25);
      const z = -60 + i * 8;
      bMesh.position.set(x, bh / 2, z);
      this.scene.add(bMesh);

      // Broken glowing window panels
      if (Math.random() > 0.4) {
        const winGeo = new THREE.PlaneGeometry(bw * 0.7, bh * 0.4);
        const winMat = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.5 ? 0xef4444 : 0x0284c7,
          transparent: true,
          opacity: 0.35,
        });
        const winMesh = new THREE.Mesh(winGeo, winMat);
        winMesh.position.set(x - side * (bw / 2 + 0.1), bh * 0.4, z);
        winMesh.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.scene.add(winMesh);
      }
    }

    // Crashed APC Vehicle
    const apcGroup = new THREE.Group();
    const apcBody = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 11),
      new THREE.MeshStandardMaterial({ color: 0x182026, metalness: 0.7, roughness: 0.5 })
    );
    apcBody.position.y = 1.6;
    apcGroup.add(apcBody);
    apcGroup.position.set(-3, 0, -12);
    apcGroup.rotation.y = 0.35;
    apcGroup.rotation.z = 0.08;
    this.scene.add(apcGroup);

    // Fire Light on crashed APC
    const fireLight = new THREE.PointLight(0xff6600, 4.5, 30);
    fireLight.position.set(-2, 2.5, -11);
    this.scene.add(fireLight);
    this.dynamicLights.push({ light: fireLight, base: 4.5, speed: 18, pulse: true });

    // Distant warning beacon (Silent Estates)
    const estatesBeacon = new THREE.PointLight(0x22c55e, 5.0, 90);
    estatesBeacon.position.set(12, 18, -90);
    this.scene.add(estatesBeacon);
    this.dynamicLights.push({ light: estatesBeacon, base: 5.0, speed: 4, pulse: true });

    // Embers Particles
    this.createParticles(120, 0xff7722, new THREE.Vector3(0, 5, -20), 40);
  }

  // LEVEL 2: THE SILENT ESTATES (Abandoned luxury villas)
  private buildLevel2Estates(isIntro = false) {
    this.scene.background = new THREE.Color(0x020508);
    this.scene.fog = new THREE.FogExp2(0x03060a, isIntro ? 0.02 : 0.016);

    const ambient = new THREE.AmbientLight(0x0c131a, 1.0);
    this.scene.add(ambient);

    const moon = new THREE.DirectionalLight(0x60a5fa, 1.4);
    moon.position.set(-15, 30, 20);
    this.scene.add(moon);

    // Villa terrace & cantilevered balcony
    const terraceGeo = new THREE.BoxGeometry(32, 1, 24);
    const terraceMat = new THREE.MeshStandardMaterial({
      color: 0x1a2128,
      roughness: 0.88,
      metalness: 0.02,
    });
    const terrace = new THREE.Mesh(terraceGeo, terraceMat);
    terrace.position.set(0, 0, 0);
    this.scene.add(terrace);

    // Overhanging roof slab
    const roof = new THREE.Mesh(new THREE.BoxGeometry(34, 0.8, 18), terraceMat);
    roof.position.set(0, 7.5, -4);
    this.scene.add(roof);

    // Glass wall with cracks
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
    });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(28, 6.5), glassMat);
    glass.position.set(0, 3.8, -8);
    this.scene.add(glass);

    // Stagnant pool
    const poolGeo = new THREE.PlaneGeometry(16, 12);
    const poolMat = new THREE.MeshStandardMaterial({
      color: 0x041a1a,
      roughness: 0.16,
      metalness: 0.08,
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.52, 6);
    this.scene.add(pool);

    // Biomechanical metallic growths creeping up pillars
    for (let i = -2; i <= 2; i += 2) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 7.5, 12),
        new THREE.MeshStandardMaterial({ color: 0x222a33, roughness: 0.6 })
      );
      pillar.position.set(i * 6, 3.75, -7.8);
      this.scene.add(pillar);

      // Tendril spine
      const tendril = new THREE.Mesh(
        new THREE.TorusGeometry(1.6, 0.15, 8, 24, Math.PI * 1.5),
        new THREE.MeshStandardMaterial({
          color: 0x11161d,
          emissive: 0xef4444,
          emissiveIntensity: 0.8,
          roughness: 0.3,
        })
      );
      tendril.rotation.x = Math.PI / 2;
      tendril.position.set(i * 6, 3.0, -7.8);
      this.scene.add(tendril);
    }

    // Holographic terminal / photo evidence
    const holoLight = new THREE.PointLight(0xef4444, 3.8, 16);
    holoLight.position.set(0, 2.4, -4);
    this.scene.add(holoLight);
    this.dynamicLights.push({ light: holoLight, base: 3.8, speed: 6, pulse: true });

    // Distant Dead Mall neon dome
    const domeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(18, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.4 })
    );
    domeMesh.position.set(20, 6, -70);
    this.scene.add(domeMesh);
    this.animatedMeshes.push({ mesh: domeMesh, rotSpeed: new THREE.Vector3(0, 0.05, 0) });
  }

  // LEVEL 3: THE DEAD MALL (Security Command Room)
  private buildLevel3Mall(isIntro = false) {
    this.scene.background = new THREE.Color(0x010306);
    this.scene.fog = new THREE.FogExp2(0x020509, isIntro ? 0.024 : 0.02);

    const ambient = new THREE.AmbientLight(0x08101a, 1.2);
    this.scene.add(ambient);

    // Bunker Room Enclosure
    const room = new THREE.Mesh(
      new THREE.BoxGeometry(24, 10, 24),
      new THREE.MeshStandardMaterial({
        color: 0x131a22,
        roughness: 0.9,
        side: THREE.BackSide,
      })
    );
    room.position.set(0, 5, 0);
    this.scene.add(room);

    // Console Desk Array
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.4 })
    );
    desk.position.set(0, 0.9, -4);
    this.scene.add(desk);

    // Monitor Bank (Multiple glowing screens)
    const monitorGroup = new THREE.Group();
    for (let c = -2; c <= 2; c++) {
      for (let r = 0; r < 2; r++) {
        const mon = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 1.5, 0.2),
          new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            emissive: c === 0 && r === 1 ? 0xef4444 : 0x0284c7,
            emissiveIntensity: 1.4,
            roughness: 0.2,
          })
        );
        mon.position.set(c * 2.8, 2.6 + r * 1.8, -3.8);
        monitorGroup.add(mon);
      }
    }
    this.scene.add(monitorGroup);

    // Holographic skyscraper projection
    const holoWireframe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 1.8, 7.5, 8, 6, true),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.7 })
    );
    holoWireframe.position.set(0, 3.8, 0);
    this.scene.add(holoWireframe);
    this.animatedMeshes.push({ mesh: holoWireframe, rotSpeed: new THREE.Vector3(0, 0.4, 0) });

    const holoLight = new THREE.PointLight(0x38bdf8, 4.0, 18);
    holoLight.position.set(0, 4, 0);
    this.scene.add(holoLight);
    this.dynamicLights.push({ light: holoLight, base: 4.0, speed: 8, pulse: true });
  }

  // LEVEL 4: THE DEAD CONSTRUCTION ZONE (Skyscraper Gantry & Elevator Shaft)
  private buildLevel4Construction(isIntro = false) {
    this.scene.background = new THREE.Color(0x020408);
    this.scene.fog = new THREE.FogExp2(0x040810, isIntro ? 0.018 : 0.015);

    const ambient = new THREE.AmbientLight(0x0c1622, 1.0);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xf59e0b, 1.5);
    dirLight.position.set(15, 30, -10);
    this.scene.add(dirLight);

    // Steel Superstructure Girders
    const girderMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.35,
    });
    for (let x = -8; x <= 8; x += 8) {
      for (let z = -8; z <= 8; z += 8) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.8, 40, 0.8), girderMat);
        col.position.set(x, 15, z);
        this.scene.add(col);
      }
    }

    // Concrete Deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(24, 1.2, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
    );
    deck.position.set(0, 0, 0);
    this.scene.add(deck);

    // Tower Crane Arm
    const craneArm = new THREE.Mesh(new THREE.BoxGeometry(36, 1.2, 1.2), girderMat);
    craneArm.position.set(4, 22, -4);
    craneArm.rotation.y = 0.4;
    this.scene.add(craneArm);

    // Deep Freight Elevator Shaft plunging into bedrock
    const shaftHole = new THREE.Mesh(
      new THREE.BoxGeometry(7, 26, 7),
      new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 1.0, side: THREE.BackSide })
    );
    shaftHole.position.set(0, -12, 0);
    this.scene.add(shaftHole);

    // Red warning emergency light inside shaft
    const shaftLight = new THREE.PointLight(0xef4444, 4.5, 24);
    shaftLight.position.set(0, -6, 0);
    this.scene.add(shaftLight);
    this.dynamicLights.push({ light: shaftLight, base: 4.5, speed: 12, pulse: true });

    this.createParticles(90, 0xf59e0b, new THREE.Vector3(0, 10, 0), 25);
  }

  // LEVEL 5: THE UNDERGROUND (Subterranean Metro & Smelting Crucible)
  private buildLevel5Underground(isIntro = false) {
    this.scene.background = new THREE.Color(0x020305);
    this.scene.fog = new THREE.FogExp2(0x030508, isIntro ? 0.025 : 0.022);

    const ambient = new THREE.AmbientLight(0x0d1217, 0.8);
    this.scene.add(ambient);

    // Tunnel Tube
    const tunnel = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 60, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x141a22, roughness: 0.95, side: THREE.BackSide })
    );
    tunnel.rotation.x = Math.PI / 2;
    tunnel.position.set(0, 4, 0);
    this.scene.add(tunnel);

    // Railway tracks
    const railMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 58), railMat);
    rail1.position.set(-1.8, 0.2, 0);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 58), railMat);
    rail2.position.set(1.8, 0.2, 0);
    this.scene.add(rail1);
    this.scene.add(rail2);

    // Mag-train Carriage Wreck
    const train = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 4, 22),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 })
    );
    train.position.set(0, 2.2, -12);
    this.scene.add(train);

    // Project Prometheus Terminal glowing
    const termLight = new THREE.PointLight(0x06b6d4, 4.2, 16);
    termLight.position.set(2.8, 2.6, 2);
    this.scene.add(termLight);
    this.dynamicLights.push({ light: termLight, base: 4.2, speed: 9, pulse: true });

    // Crucible fire glow in distance
    const crucibleLight = new THREE.PointLight(0xf97316, 5.0, 35);
    crucibleLight.position.set(0, 3, -26);
    this.scene.add(crucibleLight);
    this.dynamicLights.push({ light: crucibleLight, base: 5.0, speed: 14, pulse: true });

    this.createParticles(80, 0xf97316, new THREE.Vector3(0, 2, -18), 20);
  }

  // LEVEL 6: THE FORGOTTEN LABORATORY (Cryo Specimen Chambers)
  private buildLevel6Lab(isIntro = false) {
    this.scene.background = new THREE.Color(0x010306);
    this.scene.fog = new THREE.FogExp2(0x020509, isIntro ? 0.024 : 0.02);

    const ambient = new THREE.AmbientLight(0x081522, 1.2);
    this.scene.add(ambient);

    // High security laboratory walls
    const labRoom = new THREE.Mesh(
      new THREE.BoxGeometry(26, 9, 26),
      new THREE.MeshStandardMaterial({ color: 0x141f2d, roughness: 0.82, metalness: 0.06, side: THREE.BackSide })
    );
    labRoom.position.set(0, 4.5, 0);
    this.scene.add(labRoom);

    // Cryo Pods in a row
    for (let i = -2; i <= 2; i++) {
      const pod = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 5.5, 16),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.35,
          roughness: 0.1,
          metalness: 0.2,
        })
      );
      pod.position.set(i * 4.2, 2.75, -7);
      this.scene.add(pod);

      // Alien metallic specimen core inside pod
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.7, 1),
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xef4444,
          emissiveIntensity: 1.2,
          roughness: 0.3,
        })
      );
      core.position.set(i * 4.2, 2.75, -7);
      this.scene.add(core);
      this.animatedMeshes.push({ mesh: core, rotSpeed: new THREE.Vector3(0.2, 0.3, 0) });
    }

    // Biomechanical tendrils creeping across mainframe servers
    const server = new THREE.Mesh(
      new THREE.BoxGeometry(3, 6, 2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    server.position.set(-6, 3, 2);
    this.scene.add(server);

    const labLight = new THREE.PointLight(0x38bdf8, 3.8, 22);
    labLight.position.set(0, 6, 0);
    this.scene.add(labLight);
    this.dynamicLights.push({ light: labLight, base: 3.8, speed: 7, pulse: true });
  }

  // LEVEL 7: THE IRON GRAVEYARD (Battlefield with Charred Mech Wrecks)
  private buildLevel7Graveyard(isIntro = false) {
    this.scene.background = new THREE.Color(0x020406);
    this.scene.fog = new THREE.FogExp2(0x03060a, isIntro ? 0.02 : 0.016);

    const ambient = new THREE.AmbientLight(0x0a1017, 1.0);
    this.scene.add(ambient);

    const stormLight = new THREE.DirectionalLight(0x64748b, 1.4);
    stormLight.position.set(-20, 35, 10);
    this.scene.add(stormLight);

    // Mud & Scorched Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({ color: 0x101720, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Fallen 15-meter Mech Chassis
    const mechTorso = new THREE.Mesh(
      new THREE.BoxGeometry(6, 8, 5),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 })
    );
    mechTorso.position.set(0, 4, -8);
    mechTorso.rotation.x = -0.3;
    mechTorso.rotation.z = 0.2;
    this.scene.add(mechTorso);

    // Cockpit screen flare
    const cockpitLight = new THREE.PointLight(0xef4444, 4.8, 18);
    cockpitLight.position.set(0, 5, -5.5);
    this.scene.add(cockpitLight);
    this.dynamicLights.push({ light: cockpitLight, base: 4.8, speed: 15, pulse: true });

    // Tank Wrecks around
    for (let i = 0; i < 4; i++) {
      const tank = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 2.2, 7),
        new THREE.MeshStandardMaterial({ color: 0x131920, metalness: 0.7, roughness: 0.6 })
      );
      const angle = (i * Math.PI) / 2;
      tank.position.set(Math.cos(angle) * 16, 1.1, Math.sin(angle) * 16 - 8);
      tank.rotation.y = angle + 0.4;
      this.scene.add(tank);
    }

    this.createParticles(100, 0xef4444, new THREE.Vector3(0, 5, -8), 35);
  }

  // LEVEL 8: GROUND ZERO (Massive Meteor Crater & Obsidian Spires)
  private buildLevel8GroundZero(isIntro = false) {
    this.scene.background = new THREE.Color(0x030306);
    this.scene.fog = new THREE.FogExp2(0x050409, isIntro ? 0.018 : 0.015);

    const ambient = new THREE.AmbientLight(0x130e1c, 1.0);
    this.scene.add(ambient);

    // Obsidian Spires
    for (let i = 0; i < 14; i++) {
      const spireH = 15 + Math.random() * 25;
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(2.5, spireH, 6),
        new THREE.MeshStandardMaterial({
          color: 0x09050d,
          roughness: 0.2,
          metalness: 0.9,
          emissive: 0x881337,
          emissiveIntensity: 0.4,
        })
      );
      const angle = (i / 14) * Math.PI * 2;
      const radius = 22 + Math.random() * 12;
      spire.position.set(Math.cos(angle) * radius, spireH / 2 - 2, Math.sin(angle) * radius - 15);
      spire.rotation.x = (Math.random() - 0.5) * 0.3;
      spire.rotation.z = (Math.random() - 0.5) * 0.3;
      this.scene.add(spire);
    }

    // Colossal Titanforged Chassis buried in the crater trench
    const titanChassis = new THREE.Mesh(
      new THREE.BoxGeometry(14, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x18101a, metalness: 0.85, roughness: 0.35 })
    );
    titanChassis.position.set(0, 5, -20);
    this.scene.add(titanChassis);

    // Pulsating Mechanical Heartbeat Core
    const heartMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xff0033,
        emissiveIntensity: 2.2,
      })
    );
    heartMesh.position.set(0, 8, -14);
    this.scene.add(heartMesh);
    this.animatedMeshes.push({ mesh: heartMesh, floatSpeed: 2.5 });

    const heartLight = new THREE.PointLight(0xff0033, 6.0, 35);
    heartLight.position.set(0, 8, -13);
    this.scene.add(heartLight);
    this.dynamicLights.push({ light: heartLight, base: 6.0, speed: 4, pulse: true });

    this.createParticles(140, 0xef4444, new THREE.Vector3(0, 8, -18), 35);
  }

  // LEVEL 9: THE TITANFORGED (Defeated Titan & High Uplink Beam)
  private buildLevel9Titanforged(isIntro = false) {
    this.scene.background = new THREE.Color(0x020408);
    this.scene.fog = new THREE.FogExp2(0x040812, isIntro ? 0.016 : 0.014);

    const ambient = new THREE.AmbientLight(0x0d1726, 1.2);
    this.scene.add(ambient);

    // Collapsed Titan Mech Body
    const collapsedTitan = new THREE.Mesh(
      new THREE.BoxGeometry(16, 6, 14),
      new THREE.MeshStandardMaterial({ color: 0x1c2430, metalness: 0.8, roughness: 0.5 })
    );
    collapsedTitan.position.set(0, 2, -10);
    collapsedTitan.rotation.z = -0.15;
    this.scene.add(collapsedTitan);

    // Splintered armor plates & sparks
    const armorPlate = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
    );
    armorPlate.position.set(7, 0.8, -8);
    armorPlate.rotation.y = 0.6;
    this.scene.add(armorPlate);

    // Vertical Satellite Uplink Beam projecting into clouds
    const beamGeo = new THREE.CylinderGeometry(0.8, 1.6, 120, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    this.beamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.beamMesh.position.set(0, 60, -10);
    this.scene.add(this.beamMesh);

    const beamLight = new THREE.PointLight(0x38bdf8, 6.0, 45);
    beamLight.position.set(0, 8, -10);
    this.scene.add(beamLight);
    this.dynamicLights.push({ light: beamLight, base: 6.0, speed: 10, pulse: true });

    this.createParticles(120, 0x38bdf8, new THREE.Vector3(0, 12, -10), 30);
  }

  // LEVEL 10: THE FINAL SIGNAL (18-meter Parabolic Dish Array)
  private buildLevel10FinalSignal(isIntro = false) {
    this.scene.background = new THREE.Color(0x010204);
    this.scene.fog = new THREE.FogExp2(0x020408, isIntro ? 0.015 : 0.012);

    const ambient = new THREE.AmbientLight(0x081320, 1.0);
    this.scene.add(ambient);

    // Dish Support Gantry
    const pylon = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 4, 18, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 })
    );
    pylon.position.set(0, 9, -20);
    this.scene.add(pylon);

    // 18-meter Parabolic Dish Antenna
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(14, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.9,
        roughness: 0.25,
        side: THREE.DoubleSide,
      })
    );
    dish.position.set(0, 20, -20);
    dish.rotation.x = -Math.PI * 0.65;
    this.scene.add(dish);
    this.animatedMeshes.push({ mesh: dish, rotSpeed: new THREE.Vector3(0.01, 0, 0) });

    // Dish Feed Horn with electrical sparks
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 4, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true })
    );
    horn.position.set(0, 24, -14);
    this.scene.add(horn);

    const hornLight = new THREE.PointLight(0x38bdf8, 5.0, 35);
    hornLight.position.set(0, 24, -14);
    this.scene.add(hornLight);
    this.dynamicLights.push({ light: hornLight, base: 5.0, speed: 16, pulse: true });

    this.createParticles(160, 0xffffff, new THREE.Vector3(0, 30, -50), 70);
  }

  // LEVEL 11: BEYOND EARTH (Orbital Station & Curved Planet Below)
  private buildLevel11BeyondEarth(isIntro = false) {
    this.scene.background = new THREE.Color(0x000102);
    this.scene.fog = new THREE.FogExp2(0x000204, 0.005);

    const ambient = new THREE.AmbientLight(0x081320, 1.2);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(40, 30, 20);
    this.scene.add(sun);

    // Planet Earth curved sphere below
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(60, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.6,
        metalness: 0.1,
        emissive: 0x0369a1,
        emissiveIntensity: 0.25,
      })
    );
    earth.position.set(0, -68, -40);
    this.scene.add(earth);
    this.animatedMeshes.push({ mesh: earth, rotSpeed: new THREE.Vector3(0, 0.015, 0) });

    // Red infection root lines across the planet
    const rootRing = new THREE.Mesh(
      new THREE.TorusGeometry(60.2, 0.4, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.6 })
    );
    rootRing.position.set(0, -68, -40);
    rootRing.rotation.x = 0.5;
    this.scene.add(rootRing);

    // Ruptured Orbital Station Cupola
    const cupola = new THREE.Mesh(
      new THREE.SphereGeometry(7, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.2,
        wireframe: true,
      })
    );
    cupola.position.set(0, 0, 0);
    this.scene.add(cupola);

    // Floating Solar Array debris
    for (let i = 0; i < 4; i++) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.1, 7),
        new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.9, roughness: 0.1 })
      );
      panel.position.set((i - 1.5) * 8, 4 + i * 2, -18 - i * 4);
      panel.rotation.set(0.3 * i, 0.5 * i, 0.2);
      this.scene.add(panel);
      this.animatedMeshes.push({
        mesh: panel,
        rotSpeed: new THREE.Vector3(0.01, 0.02, 0.01),
        floatSpeed: 0.4,
      });
    }

    this.createParticles(180, 0x38bdf8, new THREE.Vector3(0, 0, -25), 50);
  }

  // SECRET ENDING: THE THING BEYOND THE STARS
  private buildEndingSecret() {
    this.scene.background = new THREE.Color(0x000002);
    this.scene.fog = new THREE.FogExp2(0x000005, 0.003);

    const ambient = new THREE.AmbientLight(0x05040a, 0.8);
    this.scene.add(ambient);

    // Defeated Forge Core glowing cyan/violet
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.5, 2),
      new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x06b6d4,
        emissiveIntensity: 2.5,
        wireframe: true,
      })
    );
    core.position.set(0, 0, -12);
    this.scene.add(core);
    this.animatedMeshes.push({ mesh: core, rotSpeed: new THREE.Vector3(0.1, 0.15, 0.05) });

    // Ancient Cosmic Glyph flaring
    const glyphGeo = new THREE.RingGeometry(5, 5.6, 32);
    const glyphMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.glyphMesh = new THREE.Mesh(glyphGeo, glyphMat);
    this.glyphMesh.position.set(0, 0, -12);
    this.scene.add(this.glyphMesh);
    this.animatedMeshes.push({ mesh: this.glyphMesh, rotSpeed: new THREE.Vector3(0, 0, -0.2) });

    const coreLight = new THREE.PointLight(0x06b6d4, 6.5, 40);
    coreLight.position.set(0, 0, -10);
    this.scene.add(coreLight);
    this.dynamicLights.push({ light: coreLight, base: 6.5, speed: 6, pulse: true });

    // The Titanic Cosmic Shadow Entity lurking in deep space
    this.spaceObject = new THREE.Group();
    const shadowBody = new THREE.Mesh(
      new THREE.SphereGeometry(35, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x010103 })
    );
    this.spaceObject.add(shadowBody);

    for (let t = 0; t < 8; t++) {
      const tendril = new THREE.Mesh(
        new THREE.TorusGeometry(38 + t * 4, 1.2, 8, 36, Math.PI * 1.2),
        new THREE.MeshBasicMaterial({ color: 0x05000a, transparent: true, opacity: 0.7 })
      );
      tendril.rotation.set(t * 0.4, t * 0.7, 0);
      this.spaceObject.add(tendril);
    }
    this.spaceObject.position.set(0, 15, -160);
    this.scene.add(this.spaceObject);
    this.animatedMeshes.push({ mesh: this.spaceObject, rotSpeed: new THREE.Vector3(0.005, 0.008, 0) });

    this.createParticles(200, 0x8b5cf6, new THREE.Vector3(0, 0, -80), 90);
  }

  // REGULAR ENDING: THE LAST SIGNAL (Dawn over Earth)
  private buildEndingRegular() {
    this.scene.background = new THREE.Color(0x060c14);
    this.scene.fog = new THREE.FogExp2(0x0a1420, 0.01);

    const ambient = new THREE.AmbientLight(0x1a2634, 1.4);
    this.scene.add(ambient);

    // Warm Golden Morning Sun breaking through clouds
    const sunLight = new THREE.DirectionalLight(0xf59e0b, 2.8);
    sunLight.position.set(30, 25, 20);
    this.scene.add(sunLight);

    // City Skyline under morning sky
    for (let i = 0; i < 20; i++) {
      const bh = 25 + Math.random() * 40;
      const bw = 8 + Math.random() * 10;
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, bw),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
      );
      const x = (i - 10) * 11;
      const z = -45 - Math.random() * 25;
      bMesh.position.set(x, bh / 2, z);
      this.scene.add(bMesh);
    }

    // Peaceful Earth below
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({ color: 0x111e2e, roughness: 0.85 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Blue spire energy dissipating
    const spireLight = new THREE.PointLight(0x38bdf8, 3.5, 30);
    spireLight.position.set(0, 6, -15);
    this.scene.add(spireLight);
    this.dynamicLights.push({ light: spireLight, base: 3.5, speed: 2, pulse: true });

    this.createParticles(120, 0xfde047, new THREE.Vector3(0, 10, -25), 45);
  }

  private createParticles(count: number, colorHex: number, center: THREE.Vector3, range: number) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = center.x + (Math.random() - 0.5) * range;
      pos[i * 3 + 1] = center.y + (Math.random() - 0.5) * (range * 0.6);
      pos[i * 3 + 2] = center.z + (Math.random() - 0.5) * range;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.35,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.particleCloud = new THREE.Points(geo, mat);
    this.scene.add(this.particleCloud);
  }

  private updateCameraPath(t: number, totalDur: number) {
    const p = Math.min(1.0, Math.max(0.0, t / totalDur));
    const isIntro = this.cutsceneDef.kind === 'intro';

    if (isIntro) {
      // Intro camera: starts high/wide in the environment, swoops down and dollies toward the player spawn zone
      const camY = 9.0 * (1.0 - p) + 1.8 * p;
      const camZ = -28 * (1.0 - p) + 14 * p;
      const camX = Math.sin(p * Math.PI) * 4.0;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(0, 1.7, camZ - 12);
    } else {
      // Outro camera: dramatic cinematic dolly pulling away or rising into the air
      const targetZ = this.cutsceneDef.id === 'ending_secret' ? -50 * p : -15 * p;
      const camY = 3.5 + Math.sin(p * Math.PI) * 1.5;
      const camX = Math.sin(p * 2.0) * 1.8;
      this.camera.position.set(camX, camY, 14 - p * 8);
      this.camera.lookAt(0, 2.5 + Math.sin(p * 1.5) * 1.0, targetZ - 10);
    }
  }

  private loop = () => {
    if (this.isDisposed) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const now = performance.now();
    this.elapsed = (now - this.startTime) / 1000;
    const total = this.cutsceneDef.totalDuration;

    // Check completion
    if (this.elapsed >= total) {
      this.onComplete();
      this.dispose();
      return;
    }

    // Dynamic light pulsing
    for (const d of this.dynamicLights) {
      if (d.pulse) {
        const factor = 1.0 + Math.sin(this.elapsed * d.speed) * 0.45;
        d.light.intensity = d.base * factor;
      }
    }

    // Animated meshes rotation & float
    for (const m of this.animatedMeshes) {
      if (m.rotSpeed) {
        m.mesh.rotation.x += m.rotSpeed.x * 0.016;
        m.mesh.rotation.y += m.rotSpeed.y * 0.016;
        m.mesh.rotation.z += m.rotSpeed.z * 0.016;
      }
      if (m.floatSpeed) {
        m.mesh.position.y += Math.sin(this.elapsed * m.floatSpeed) * 0.008;
      }
    }

    // Particles gentle drift
    if (this.particleCloud) {
      this.particleCloud.rotation.y += 0.001;
    }

    // Camera animation
    this.updateCameraPath(this.elapsed, total);

    // Process dialogue cues & audio SFX
    let activeDialogue: { speaker: string; text: string } | null = null;
    for (let i = 0; i < this.cutsceneDef.dialogue.length; i++) {
      const cue = this.cutsceneDef.dialogue[i];
      if (this.elapsed >= cue.time && this.elapsed < cue.time + cue.duration) {
        activeDialogue = { speaker: cue.speaker, text: cue.text };
        if (!this.playedCues.has(i)) {
          this.playedCues.add(i);
          this.playSfx(cue.sfx);
        }
      }
    }

    // Fade and Statement timing
    const statementStartTime = total * 0.62;
    const isStatementActive = this.elapsed >= statementStartTime;

    const fadeOpacity =
      this.elapsed < 1.0
        ? 1.0 - this.elapsed / 1.0
        : this.elapsed > total - 1.0
        ? (this.elapsed - (total - 1.0)) / 1.0
        : 0;

    const glitchIntensity =
      this.cutsceneDef.id === 'ending_secret' && this.elapsed > 4.0 && this.elapsed < 7.5 ? 0.8 : 0;

    this.onStateUpdate({
      elapsed: this.elapsed,
      totalDuration: total,
      progressPct: (this.elapsed / total) * 100,
      fadeOpacity: Math.max(0, Math.min(1, fadeOpacity)),
      titleCard:
        this.elapsed < 4.5
          ? { heading: this.cutsceneDef.title, subheading: this.cutsceneDef.subtitle }
          : null,
      activeDialogue,
      statement: isStatementActive ? this.cutsceneDef.finalStatement : null,
      secondaryStatement: isStatementActive ? this.cutsceneDef.secondaryStatement ?? null : null,
      glitchIntensity,
      cinemaBarsOpacity: 1.0,
    });

    this.renderer.render(this.scene, this.camera);
  };

  private playSfx(sfx?: string) {
    if (!sfx) return;
    try {
      switch (sfx) {
        case 'radio_squelch':
          this.audio.playRadioSquelch(false);
          break;
        case 'signal_pulse':
          this.audio.playHeliosSignalPulse();
          break;
        case 'stinger':
          this.audio.playSilhouetteStinger();
          break;
        case 'creak':
          this.audio.playAmbientCreak(0);
          break;
        case 'mech_shutdown':
          this.audio.playTitanMechShutdown(8, 0);
          break;
        case 'alien_shriek':
          this.audio.playScreamerShriek(6, 0);
          break;
        case 'lab_flicker':
          this.audio.playLabFlicker();
          break;
      }
    } catch {
      // Audio fallback handled gracefully
    }
  }

  public skip() {
    this.onComplete();
    this.dispose();
  }

  public dispose() {
    if (this.isDisposed) return;
    this.isDisposed = true;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);

    try {
      this.renderer.dispose();
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    } catch {
      // Clean disposal
    }
  }
}
