export type CharacterId = 'raven' | 'ghost' | 'brute' | 'nyx' | 'zero';

export type WeaponId =
  | 'assault_rifle'
  | 'sniper_rifle'
  | 'heavy_mg'
  | 'tactical_rifle'
  | 'energy_rifle'
  | 'pistol'
  | 'shotgun'
  | 'plasma_lance';

export type EnemyType =
  | 'crawler'
  | 'stalker'
  | 'brute_enemy'
  | 'sentinel'
  | 'screamer'
  | 'carrier'
  | 'titan'
  | 'titanforged'
  | 'hollow_dweller'
  | 'scrapper'
  | 'watcher'
  | 'hunter'
  | 'forgemaster'
  | 'drowned_machine'
  | 'broodmind'
  | 'guardian'
  | 'helios_unit'
  | 'void_walker'
  | 'origin';

export type Difficulty = 'survivor' | 'tactical' | 'nightmare';

export type EndingId = 'A' | 'B' | 'C' | 'regular' | 'secret';

export type CutsceneTargetId =
  | 'cutscene_intro'
  // 12 Level Dynamic Openings
  | 'level_01_intro'
  | 'level_02_intro'
  | 'level_03_intro'
  | 'level_04_intro'
  | 'level_05_intro'
  | 'level_06_intro'
  | 'level_07_intro'
  | 'level_08_intro'
  | 'level_09_intro'
  | 'level_10_intro'
  | 'level_11_intro'
  | 'level_12_intro'
  // 12 Level Dynamic Outros & Transitions
  | 'level_01_outro'
  | 'level_02_outro'
  | 'level_03_outro'
  | 'level_04_outro'
  | 'level_05_outro'
  | 'level_06_outro'
  | 'level_07_outro'
  | 'level_08_outro'
  | 'level_09_outro'
  | 'level_10_outro'
  | 'level_11_outro'
  | 'level_12_outro'
  // Direct level aliases
  | 'level_01'
  | 'level_02'
  | 'level_03'
  | 'level_04'
  | 'level_05'
  | 'level_06'
  | 'level_07'
  | 'level_08'
  | 'level_09'
  | 'level_10'
  | 'level_11'
  | 'level_12'
  // Endings
  | 'ending_regular'
  | 'ending_secret';

export type GameScreen =
  | 'cutscene'
  | 'level_cutscene'
  | 'menu'
  | 'characters'
  | 'missions'
  | 'settings'
  | 'credits'
  | 'playing'
  | 'paused'
  | 'dead'
  | 'mission_complete'
  | 'ending';

export type EnemyAIState =
  | 'PATROL'
  | 'HIDING'
  | 'SEARCH'
  | 'CHASE'
  | 'ATTACK'
  | 'RETREAT'
  | 'STUNNED'
  | 'BOSS_INTRO'
  | 'DEAD';

export type MonsterWeightClass = 'small' | 'medium' | 'large' | 'mech' | 'boss';

export type MonsterPersonality =
  | 'swarm_crawler'
  | 'ambush_stalker'
  | 'berserker_rusher'
  | 'tactical_sentinel'
  | 'acoustic_lurker'
  | 'juggernaut'
  | 'apex_boss';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra' | 'cinematic';

export type MonsterAttackKind =
  | 'claw'
  | 'bite'
  | 'charge'
  | 'heavy_slam'
  | 'grab'
  | 'tendril'
  | 'titanic_stomp'
  | 'tentacle_sweep'
  | 'ground_crusher'
  | 'gravity_pulse'
  | 'parasite_regen'
  | 'tentacle_grab'
  | 'claw_strike'
  | 'tentacle_lash'
  | 'leap_attack'
  | 'grab_throw'
  | 'frenzied_attack';

export type MonsterAnimStateName =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'TURN'
  | 'ATTACK'
  | 'RECOVERY'
  | 'STAGGER'
  | 'RETREAT'
  | 'HIDING'
  | 'BOSS_INTRO'
  | 'DEAD';

export type SurfaceKind =
  | 'concrete'
  | 'metal'
  | 'gravel'
  | 'dirt'
  | 'water'
  | 'glass'
  | 'industrial';

export type MonsterVocalCategory =
  | 'idle'
  | 'warning'
  | 'attack'
  | 'damage'
  | 'death';

export type SoundEventKind =
  | 'footstep_walk'
  | 'footstep_run'
  | 'gunshot'
  | 'door_open'
  | 'generator_on'
  | 'object_break'
  | 'shriek';

export interface SoundEvent {
  x: number;
  y: number;
  z: number;
  radius: number;
  kind: SoundEventKind;
  sourceId?: string;
  timestamp: number;
}

export interface CharacterStats {
  health: number;
  speed: number;
  armor: number;
  specialtyLabel: string;
  specialtyValue: number;
}

export interface CharacterAbility {
  name: string;
  description: string;
  duration: number;
  cooldown: number;
  accentColor: string;
}

export interface CharacterDef {
  id: CharacterId;
  callsign: string;
  role: string;
  bio: string;
  appearanceSummary: string;
  primaryWeapon: WeaponId;
  stats: CharacterStats;
  ability: CharacterAbility;
  armorColor: string;
  trimColor: string;
  visorColor: string;
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
  category: string;
  damage: number;
  fireRate: number; // shots per second
  magSize: number;
  reserveMax: number;
  reloadTime: number; // seconds
  spread: number;
  adsSpread: number;
  recoilKick: number;
  range: number;
  automatic: boolean;
  adsFov: number;
  muzzleColor: string;
  isEnergy?: boolean;
  pellets?: number;
  unlockCost?: number;
  description?: string;
}

export interface WeaponUpgradeState {
  damageLevel: number; // 0..3
  capacityLevel: number; // 0..3
  handlingLevel: number; // 0..3
}

export interface WeaponRuntimeState {
  id: WeaponId;
  ammoInMag: number;
  reserveAmmo: number;
}

export interface LoreEntry {
  id: string;
  title: string;
  kind: 'document' | 'audio';
  author: string;
  faction: string;
  timestamp: string;
  levelNumber: number;
  content: string;
  transcript?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  kind: 'medkit' | 'battery' | 'keycard' | 'fuse' | 'intel' | 'salvage';
  description: string;
  quantity: number;
}

export interface MissionDef {
  number: number;
  id: string;
  title: string;
  region: string;
  factionFocus: string;
  summary: string;
  playable: boolean;
  isBossMission?: boolean;
  levelThreatMult: number;
  bossName?: string;
  primaryMonster: string;
  hasZeroG?: boolean;
  hasFlooding?: boolean;
  secretCount: number;
  docCount: number;
  isBonusArena?: boolean;
}

export interface FactionDef {
  id: string;
  name: string;
  motto: string;
  summary: string;
}

export interface WorldRegionDef {
  id: string;
  name: string;
  status: string;
  description: string;
}

export interface GameSettings {
  mouseSensitivity: number;
  invertY: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  fov: number;
  difficulty: Difficulty;
  graphicsQuality: GraphicsQuality;
  brightness?: number;
  showMinimap: boolean;
  touchControls: boolean;
  navigationAssist: boolean;
  reducedMotion: boolean;
  largeHudText: boolean;
  cinematicIntros?: boolean;
  subtitleSize?: 'small' | 'medium' | 'large';
  eduTextSize?: 'small' | 'medium' | 'large' | 'xlarge';
  narrationEnabled?: boolean;
}

export type EducationalCategory =
  | 'Astronomy'
  | 'Physics'
  | 'Mathematics'
  | 'Biology'
  | 'Anatomy'
  | 'Engineering'
  | 'Robotics'
  | 'Technology'
  | 'Satellites'
  | 'Environmental science'
  | 'Weather'
  | 'Ecology'
  | 'Materials science';

export type EducationalDiagramType =
  | 'meteor'
  | 'satellite'
  | 'generator'
  | 'tree'
  | 'vines'
  | 'mech'
  | 'anatomy'
  | 'cryo'
  | 'crane'
  | 'weather'
  | 'hydro'
  | 'materials'
  | 'orbital'
  | 'math_wave'
  | 'environment'
  | 'reactor'
  | 'geology'
  | 'firewall';

export interface EducationalPartDef {
  label: string;
  role: string;
}

export interface EducationalEntryDef {
  id: string;
  subjectName: string;
  category: EducationalCategory;
  diagramType: EducationalDiagramType;
  whatIsIt: string;
  whatDoesItDo: string;
  howDoesItWork: string;
  mainParts: EducationalPartDef[];
  whyImportant: string;
  importantFacts: string[];
  realScienceSimple: string;
  realScienceAdvanced: string;
  gameLoreFictional: string;
  narrationScript: string;
  relatedLevels: number[];
}

export interface PuzzleInputField {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  initial: number;
}

export interface PuzzleDef {
  id: string;
  title: string;
  systemTag: string;
  prompt: string;
  successMessage?: string;
  equationDisplay?: string;
  hint?: string;
  mode: 'inputs' | 'sequence' | 'generator_math';
  fields?: PuzzleInputField[];
  expectedValues?: Record<string, number>;
  sequenceChoices?: number[];
  expectedSequence?: number[];
}

export interface WaterSectionState {
  id: string;
  label: string;
  currentY: number;
  targetY: number;
  drainedY: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface GravityZone {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  gravityScale: number; // e.g., 0.24 for zero/low-G
}

export interface CampaignState {
  unlockedLevel: number; // 1..12
  completedMissionIds: string[];
  salvageCores: number;
  medkits: number;
  batteries: number;
  unlockedWeapons: WeaponId[];
  equippedSecondary: WeaponId;
  weaponUpgrades: Record<WeaponId, WeaponUpgradeState>;
  weaponAmmo: Partial<Record<WeaponId, { mag: number; reserve: number }>>;
  collectedLoreIds: string[];
  secretsFoundIds: string[];
  endingsReached: EndingId[];
  unlockAllChapters: boolean;
  totalKills: number;
  secretEndingUnlocked?: boolean;
  minForgeHits?: number;
  cinematicsViewedIds?: string[];
  discoveredEducationIds: string[];
}

export interface ChapterStats {
  missionId: string;
  missionNumber: number;
  missionTitle: string;
  enemiesDefeated: number;
  elapsedSeconds: number;
  salvageEarned: number;
  docsFound: number;
  docsTotal: number;
  secretsFound: number;
  secretsTotal: number;
}

export interface MinimapBlip {
  x: number;
  z: number;
  kind: 'enemy' | 'boss' | 'objective' | 'interactable';
}

export interface BossHudState {
  active: boolean;
  name: string;
  subtitle: string;
  phase: number;
  health: number;
  maxHealth: number;
  hollowExposed: boolean;
  activeWarning?: string | null;
  isEnraged?: boolean;
}

export interface BodyCondition {
  head: number;
  torso: number;
  arms: number;
  legs: number;
}

export interface RadiationZone {
  id: string;
  label: string;
  position: { x: number; y: number; z: number };
  radius: number;
  peakMsv: number;
  kind: 'meteor' | 'reactor' | 'spores' | 'crucible' | 'anomaly';
}

export type TouchAction =
  | 'shoot_start'
  | 'shoot_end'
  | 'aim'
  | 'reload'
  | 'interact'
  | 'ability'
  | 'flashlight'
  | 'jump'
  | 'switch'
  | 'heal'
  | 'crouch'
  | 'melee'
  | 'sprint_toggle';

export interface HudSnapshot {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  stamina: number;
  flashlightOn: boolean;
  flashlightBattery: number;
  activeSlot: 0 | 1;
  weapons: [WeaponRuntimeState, WeaponRuntimeState];
  isReloading: boolean;
  reloadProgress: number;
  isAiming: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  abilityActive: boolean;
  abilityActiveRemaining: number;
  abilityCooldownRemaining: number;
  abilityCooldownTotal: number;
  medkits: number;
  salvageCores: number;
  keycards: string[];
  powerRestored: boolean;
  objectiveTitle: string;
  objectiveDetail: string;
  subObjectiveProgress: string | null;
  objectiveTarget: { x: number; z: number } | null;
  objectiveDistance: number | null;
  objectiveBearingDeg: number | null;
  compassHeading: number;
  interactPrompt: string | null;
  interactScreenPos?: { x: number; y: number } | null;
  interactEducationId?: string | null;
  monstersFrozen?: boolean;
  radioBanner: { speaker: string; text: string } | null;
  missionBanner: { title: string; objective: string; timer: number } | null;
  chapterIntro: {
    number: number;
    title: string;
    region: string;
    subtitle: string;
    timer: number;
  } | null;
  secretToast: { title: string; salvage: number; timer: number } | null;
  hitMarkerTimer: number;
  hitMarkerCrit: boolean;
  isSniperAds: boolean;
  moveSpread: number;
  damageFlash: number;
  heartbeatBpm: number;
  heartbeatIntensity: number;
  heartbeatPulse: number;
  lastHeartbeatAt: number;
  nearestThreatDistance: number | null;
  suitIntegrity: number;
  bodyCondition: BodyCondition;
  radiationLevel: number;
  radiationMsv: number;
  radiationCpm: number;
  radiationSourceLabel: string | null;
  lastGeigerClickAt: number;
  geigerMuted: boolean;
  pointerLocked: boolean;
  checkpointSavedTimer: number;
  boss: BossHudState;
  minimapPlayer: { x: number; z: number; yaw: number };
  minimapBlips: MinimapBlip[];
  collectedLoreIds: string[];
  secretsFoundInLevel: number;
  secretsTotalInLevel: number;
  inZeroG: boolean;
  inWater: boolean;
  activePuzzleId: string | null;
  workbenchOpen: boolean;
  endingChoiceOpen: boolean;
  inventory: InventoryItem[];
  enemiesDefeated: number;
  elapsedSeconds: number;
}

export interface CheckpointSave {
  missionId: string;
  characterId: CharacterId;
  checkpointId: string;
  playerPos: { x: number; y: number; z: number };
  playerYaw: number;
  health: number;
  armor: number;
  medkits: number;
  flashlightBattery: number;
  powerRestored: boolean;
  gateUnlocked: boolean;
  terminalAccessed: boolean;
  keycards: string[];
  collectedLoreIds: string[];
  solvedPuzzleIds: string[];
  activatedInteractables: string[];
  missionStage: number;
  savedAt: string;
}
