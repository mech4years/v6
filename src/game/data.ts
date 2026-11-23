import {
  CampaignState,
  CharacterDef,
  CharacterId,
  FactionDef,
  GameSettings,
  LoreEntry,
  MissionDef,
  PuzzleDef,
  StoryCharacterDef,
  WeaponDef,
  WeaponId,
  WeaponUpgradeState,
  WorldRegionDef,
} from './types';

export function normalizeCharacterId(id?: string | null): CharacterId {
  if (
    id === 'reaper' ||
    id === 'ghost' ||
    id === 'titan' ||
    id === 'patch' ||
    id === 'phantom' ||
    id === 'engineer' ||
    id === 'wanderer' ||
    id === 'raven' ||
    id === 'brute' ||
    id === 'nyx' ||
    id === 'zero' ||
    id === 'god'
  ) {
    return id;
  }
  return 'reaper';
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  reaper: {
    id: 'reaper',
    callsign: 'REAPER',
    classification: 'ASSAULT SPECIALIST',
    role: 'Assault Specialist',
    bio: 'Former Black-Sector breach sergeant carrying scarred composite plate and an overclocked VX-47 carbine. Excels at sustained frontline suppression.',
    backstory:
      'After the 3059 HELIOS orbital collapse, Reaper led three evacuation corridors through New Eden before his platoon fell to the infected steel plague. He fights with cold precision and zero hesitation.',
    appearanceSummary:
      'Scarred tactical half-mask & ballistic skull visor, weathered olive-charcoal plate carrier, twin magazine chest pouches, mud-stained combat boots.',
    primaryWeapon: 'assault_rifle',
    equipmentList: [
      'VX-47 Assault Rifle (32-rd Mag)',
      'P-2025 Tactical Sidearm',
      'Composite Trauma Rig + Bandolier',
      'Stim-Overdrive Autoinjector',
    ],
    stats: {
      health: 115,
      speed: 78,
      armor: 80,
      damage: 88,
      specialtyLabel: 'Weapon Handling',
      specialtyValue: 92,
    },
    ability: {
      name: 'OVERDRIVE',
      description:
        'Adrenal tactical surge increases movement speed by 45%, boosts weapon damage by 15%, and cuts reload duration by 40% for 8 seconds.',
      duration: 8,
      cooldown: 21,
      accentColor: '#ef4444',
    },
    voiceProfile: { pitchHz: 112, timbre: 'gravel', personalityTag: 'Disciplined Tactician' },
    damageMult: 1.1,
    critMult: 1.15,
    damageResist: 0.05,
    isPrimaryRoster: true,
    armorColor: '#1f2329',
    trimColor: '#4c1d24',
    visorColor: '#ef4444',
  },
  ghost: {
    id: 'ghost',
    callsign: 'GHOST',
    classification: 'SNIPER SPECIALIST',
    role: 'Sniper Specialist',
    bio: 'Long-range quarantine hunter equipped with ballistic rangefinder optics and cryo-dampened ghillie weaves for lethal precision shots.',
    backstory:
      'Stationed atop the ruined New Eden spires for fourteen months, Ghost tracked infected packs across rusted rooftops without firing a single wasted round.',
    appearanceSummary:
      'Matte graphite tactical shroud, multi-optic thermal sniper monocle, open lower face scarf, silenced rangefinder rig.',
    primaryWeapon: 'sniper_rifle',
    equipmentList: [
      'M99 Longbow Anti-Materiel Rifle',
      'Optic Shroud Cloaking Weave',
      'Ballistic Rangefinder Visor',
      'P-2025 Suppressed Sidearm',
    ],
    stats: {
      health: 90,
      speed: 96,
      armor: 50,
      damage: 98,
      specialtyLabel: 'Critical Precision',
      specialtyValue: 100,
    },
    ability: {
      name: 'SHADOW',
      description:
        'Engages acoustic and optical dampening for 10s: reduces enemy detection radius by 75%, silences gunshots, and amplifies weakpoint critical damage by 30%.',
      duration: 10,
      cooldown: 23,
      accentColor: '#38bdf8',
    },
    voiceProfile: { pitchHz: 138, timbre: 'calm', personalityTag: 'Detached Marksman' },
    damageMult: 1.05,
    critMult: 1.32,
    damageResist: 0,
    isPrimaryRoster: true,
    armorColor: '#14171c',
    trimColor: '#293445',
    visorColor: '#38bdf8',
  },
  titan: {
    id: 'titan',
    callsign: 'TITAN',
    classification: 'HEAVY ASSAULT',
    role: 'Heavy Tank',
    bio: 'Powered siege-frame juggernaut built to anchor collapsing choke points and absorb brutal impacts that shred lighter squads.',
    backstory:
      'A veteran of the Iron Wilds industrial front, Titan refused to abandon his powered siege chassis even after the infected steel swarm tore through Reactor 7.',
    appearanceSummary:
      'Massive gunmetal exoskeleton, layered ceramic-steel pauldrons, heavy blast visor with open reinforced jaw grille, hydraulic gauntlets.',
    primaryWeapon: 'heavy_mg',
    equipmentList: [
      'M240 Vulcan Heavy Machine Gun',
      'Mk-IV Hydraulic Siege Pauldrons',
      'Blast-Lock Servo Stabilizers',
      'Reinforced Ceramic Chestplate',
    ],
    stats: {
      health: 165,
      speed: 52,
      armor: 120,
      damage: 86,
      specialtyLabel: 'Blast Resistance',
      specialtyValue: 100,
    },
    ability: {
      name: 'FORTRESS',
      description:
        'Locks heavy servo plating for 9s: absorbs 70% of all incoming damage, prevents knockdown stagger, and bolsters armor by +25.',
      duration: 9,
      cooldown: 23,
      accentColor: '#f59e0b',
    },
    voiceProfile: { pitchHz: 86, timbre: 'heavy', personalityTag: 'Stoic Juggernaut' },
    damageMult: 1.05,
    critMult: 1.0,
    damageResist: 0.18,
    isPrimaryRoster: true,
    armorColor: '#262930',
    trimColor: '#6b5335',
    visorColor: '#f59e0b',
  },
  patch: {
    id: 'patch',
    callsign: 'PATCH',
    classification: 'COMBAT MEDIC',
    role: 'Combat Medic',
    bio: 'Quarantine triage specialist carrying aerosol nanite canisters, trauma defibrillators, and limb-stabilizing bio-gel dispensers.',
    backstory:
      'When Field Hospital 12 went dark, Patch kept twenty-two wounded survivors alive for six days using improvised power cells and antimicrobial nanites.',
    appearanceSummary:
      'Crimson-and-white field trauma armor, illuminated medical visor goggles, shoulder bio-gel tank, sterile gauntlet injector.',
    primaryWeapon: 'tactical_rifle',
    equipmentList: [
      'T-19 Pulse Tactical Carbine',
      'Biotic Nanite Field Projector',
      'Trauma Limb-Repair Stim Pack',
      'Diagnostic Cardiac Telemetry Link',
    ],
    stats: {
      health: 110,
      speed: 82,
      armor: 70,
      damage: 74,
      specialtyLabel: 'Trauma Recovery',
      specialtyValue: 100,
    },
    ability: {
      name: 'BIOTIC FIELD',
      description:
        'Deploys a glowing nanite restoration field for 9s: immediately restores +45 HP, repairs damaged suit limbs (+40%), and continuously regenerates health.',
      duration: 9,
      cooldown: 22,
      accentColor: '#10b981',
    },
    voiceProfile: { pitchHz: 175, timbre: 'clinical', personalityTag: 'Focused Field Medic' },
    damageMult: 0.96,
    critMult: 1.1,
    damageResist: 0.08,
    isPrimaryRoster: true,
    armorColor: '#1c2426',
    trimColor: '#0f766e',
    visorColor: '#34d399',
  },
  phantom: {
    id: 'phantom',
    callsign: 'PHANTOM',
    classification: 'STEALTH OPERATIVE',
    role: 'Stealth Operative',
    bio: 'Infiltration specialist wrapped in light-bending phase fibers. Vanishes between shadows to flank and execute unaware infected.',
    backstory:
      'Trained inside Orbital Black-Wing projects, Phantom was presumed KIA in Sector 4 until corrupted HELIOS cameras caught a shadow dismantling whole patrols.',
    appearanceSummary:
      'Sleek obsidian stealth weave, violet phase-emitter harness, hooded half-mask with twin cybernetic optics.',
    primaryWeapon: 'tactical_rifle',
    equipmentList: [
      'Suppressed T-19 Tactical Rifle',
      'Phase-Veil Optical Cloak',
      'Acoustic Nullifier Boots',
      'Monomolecular Combat Blade',
    ],
    stats: {
      health: 95,
      speed: 100,
      armor: 55,
      damage: 90,
      specialtyLabel: 'Stealth Infiltration',
      specialtyValue: 100,
    },
    ability: {
      name: 'PHASE VEIL',
      description:
        'Bends light around your rig for 8.5s: drops enemy detection radius by 88%, boosts sprint speed by 35%, and adds +45% ambush damage.',
      duration: 8.5,
      cooldown: 22,
      accentColor: '#a855f7',
    },
    voiceProfile: { pitchHz: 152, timbre: 'whisper', personalityTag: 'Silent Infiltrator' },
    damageMult: 1.06,
    critMult: 1.25,
    damageResist: 0.04,
    isPrimaryRoster: true,
    armorColor: '#12121b',
    trimColor: '#4c1d95',
    visorColor: '#c084fc',
  },
  engineer: {
    id: 'engineer',
    callsign: 'ENGINEER',
    classification: 'TECHNICAL SPECIALIST',
    role: 'Technical Specialist',
    bio: 'Robotics and power-grid architect who fabricates automated sentry turrets and overrides encrypted HELIOS quarantine locks.',
    backstory:
      'Formerly chief maintenance lead on HELIOS Sector 9, Engineer rewired corrupted defense servos into lethal automated turrets to hold back the horde.',
    appearanceSummary:
      'Industrial hazard-slate jacket over kevlar plating, folding welding visor goggles, twin servo tool-pack, glowing orange telemetry cuff.',
    primaryWeapon: 'shotgun',
    equipmentList: [
      'SG-88 Combat Trench Shotgun',
      'Deployable Mk-II Sentry Turret',
      'HELIOS Encryption Bypass Deck',
      'Arc-Welder Diagnostics Gauntlet',
    ],
    stats: {
      health: 105,
      speed: 80,
      armor: 75,
      damage: 84,
      specialtyLabel: 'Robotics & Grid Tech',
      specialtyValue: 100,
    },
    ability: {
      name: 'AUTOMATED TURRET',
      description:
        'Deploys an autonomous heavy sentry turret for 14s that tracks and fires high-velocity rounds at infected within 19m while repairing +15 armor.',
      duration: 14,
      cooldown: 24,
      accentColor: '#fb923c',
    },
    voiceProfile: { pitchHz: 146, timbre: 'raspy', personalityTag: 'Pragmatic Systems Tech' },
    damageMult: 1.0,
    critMult: 1.12,
    damageResist: 0.06,
    isPrimaryRoster: true,
    armorColor: '#23201c',
    trimColor: '#9a3412',
    visorColor: '#fb923c',
  },
  wanderer: {
    id: 'wanderer',
    callsign: 'THE WANDERER',
    classification: 'FIREARMS EXPERT',
    role: 'Lone Survivor',
    bio: 'Hardened wasteland drifter and unmatched firearms savant who survived three winters inside the Quarantine Zone on pure grit and gunsmoke.',
    backstory:
      'Nobody knows which convoy the Wanderer walked away from in 3060 AD—only that wherever the deadliest packs hunt, spent brass and dead biomechanical husks mark his trail.',
    appearanceSummary:
      'Dust-caked armored trench duster, scarred jawline beneath ballistic goggles, leather shell bandolier, mismatched salvaged knee guards.',
    primaryWeapon: 'shotgun',
    equipmentList: [
      'SG-88 Custom Trench Shotgun',
      'Quick-Draw Twin Holster Rig',
      'Hand-Loaded High-Brass Shells',
      'P-2025 Match-Grade Sidearm',
    ],
    stats: {
      health: 110,
      speed: 86,
      armor: 70,
      damage: 96,
      specialtyLabel: 'Firearms Mastery',
      specialtyValue: 100,
    },
    ability: {
      name: 'DEADEYE BARRAGE',
      description:
        'Instantly reloads your equipped weapon and enters bottomless-chamber overdrive for 6s with +35% fire rate and +20% all ballistic damage.',
      duration: 6,
      cooldown: 21,
      accentColor: '#eab308',
    },
    voiceProfile: { pitchHz: 118, timbre: 'gravel', personalityTag: 'Hardened Drifter' },
    damageMult: 1.16,
    critMult: 1.2,
    damageResist: 0.05,
    isPrimaryRoster: true,
    armorColor: '#29221c',
    trimColor: '#713f12',
    visorColor: '#facc15',
  },
  raven: {
    id: 'raven',
    callsign: 'RAVEN',
    classification: 'VANGUARD BREACHER',
    role: 'Assault Vanguard',
    bio: 'Veteran breach squad leader from the 4th Orbital Vanguard. Outfitted for sustained firefights inside fallen megacity sectors.',
    backstory:
      'Commander of Vanguard Squad Zero-Alpha during the initial orbital drop into New Eden.',
    appearanceSummary:
      'Heavy black tactical military armor, reinforced steel chest plates, enclosed helmet with narrow crimson visor.',
    primaryWeapon: 'assault_rifle',
    equipmentList: ['VX-47 Assault Rifle', 'Vanguard Breacher Plate', 'Neural Combat Stim'],
    stats: {
      health: 105,
      speed: 78,
      armor: 75,
      damage: 85,
      specialtyLabel: 'Weapon Handling',
      specialtyValue: 90,
    },
    ability: {
      name: 'OVERDRIVE',
      description:
        'Neural combat stim surges movement speed by 45% and accelerates weapon cycling and reload speed for 8 seconds.',
      duration: 8,
      cooldown: 22,
      accentColor: '#ef4444',
    },
    voiceProfile: { pitchHz: 124, timbre: 'gravel', personalityTag: 'Vanguard Leader' },
    damageMult: 1.05,
    critMult: 1.1,
    damageResist: 0.04,
    armorColor: '#1b1e24',
    trimColor: '#3f4654',
    visorColor: '#ef4444',
  },
  brute: {
    id: 'brute',
    callsign: 'BRUTE',
    classification: 'VANGUARD SIEGE',
    role: 'Heavy Assault',
    bio: 'Exo-frame shock trooper tasked with holding perimeter chokepoints against corrupted military platforms.',
    backstory: 'Heavy suppression specialist built for frontline breach corridors.',
    appearanceSummary:
      'Massive powered exoskeleton, heavy armored gauntlets, thick blast plating, oversized shoulder hydraulics.',
    primaryWeapon: 'heavy_mg',
    equipmentList: ['M240 Heavy Machine Gun', 'Shock Exoskeleton Frame', 'Fortress Blast Locks'],
    stats: {
      health: 150,
      speed: 48,
      armor: 100,
      damage: 85,
      specialtyLabel: 'Firepower',
      specialtyValue: 100,
    },
    ability: {
      name: 'FORTRESS',
      description:
        'Locks exoskeleton blast plates, reducing all incoming physical and biomechanical damage by 65% for 9 seconds.',
      duration: 9,
      cooldown: 24,
      accentColor: '#f59e0b',
    },
    voiceProfile: { pitchHz: 88, timbre: 'heavy', personalityTag: 'Siege Enforcer' },
    damageMult: 1.04,
    critMult: 1.0,
    damageResist: 0.14,
    armorColor: '#24272d',
    trimColor: '#57534e',
    visorColor: '#f59e0b',
  },
  nyx: {
    id: 'nyx',
    callsign: 'NYX',
    classification: 'VANGUARD TECH',
    role: 'Combat Engineer',
    bio: 'Former HELIOS grid systems specialist carrying field-repair hardware capable of bypassing dead military networks.',
    backstory: 'Survived the orbital grid hijack and turned HELIOS subroutines against the swarm.',
    appearanceSummary:
      'Medium-weight black and dark-crimson armor, multi-lens optical helmet, mechanical utility backpack, wrist uplink.',
    primaryWeapon: 'tactical_rifle',
    equipmentList: ['T-19 Tactical Rifle', 'Autonomous Support Drone', 'Grid Bypass Deck'],
    stats: {
      health: 100,
      speed: 82,
      armor: 65,
      damage: 80,
      specialtyLabel: 'Technical Ability',
      specialtyValue: 100,
    },
    ability: {
      name: 'REBOOT',
      description:
        'Deploys an autonomous support drone that repairs suit armor/health, draws enemy attention, and arcs targets for 10 seconds.',
      duration: 10,
      cooldown: 24,
      accentColor: '#dc2626',
    },
    voiceProfile: { pitchHz: 184, timbre: 'clinical', personalityTag: 'Grid Specialist' },
    damageMult: 1.0,
    critMult: 1.12,
    damageResist: 0.05,
    armorColor: '#1a1518',
    trimColor: '#7f1d1d',
    visorColor: '#f87171',
  },
  zero: {
    id: 'zero',
    callsign: 'ZERO',
    classification: 'SECTOR ZERO SUBJECT',
    role: 'Experimental Operative',
    bio: 'Classified Sector Zero test subject equipped with a prototype chest reactor designed to sever alien metallic links.',
    backstory:
      'Broke out of Dr. Zero’s subterranean chamber carrying unstable reactor implants capable of shattering biomechanical armor.',
    appearanceSummary:
      'Experimental black composite suit, glowing crimson energy veins, sealed prototype helmet, chest reactor core.',
    primaryWeapon: 'energy_rifle',
    equipmentList: ['HEL-9 Prototype Energy Rifle', 'Chest Arc Reactor Core', 'EMP Shockwave Capacitor'],
    stats: {
      health: 110,
      speed: 85,
      armor: 75,
      damage: 94,
      specialtyLabel: 'Energy Damage',
      specialtyValue: 100,
    },
    ability: {
      name: 'PULSE',
      description:
        'Discharges a 16-meter electromagnetic shockwave that disrupts, damages, and stuns infected machinery for 4 seconds.',
      duration: 4,
      cooldown: 20,
      accentColor: '#fb7185',
    },
    voiceProfile: { pitchHz: 105, timbre: 'synthetic', personalityTag: 'Unstable Reactor Subject' },
    damageMult: 1.08,
    critMult: 1.18,
    damageResist: 0.06,
    armorColor: '#101014',
    trimColor: '#991b1b',
    visorColor: '#fb7185',
  },
  god: {
    id: 'god',
    callsign: 'GOD',
    classification: 'DEVELOPER & SYSTEM ADMIN',
    role: 'System Administrator',
    bio: 'Omnipotent quarantine system authority possessing unconstrained administrative privileges, unlimited thermal shielding, noclip flight, and the Vaporiser disintegration rail.',
    backstory: 'System administrator entity created to oversee all simulation sectors, purge infected anomalies instantly, and manipulate quarantine parameters at will.',
    appearanceSummary: 'Golden radiant tactical command chassis, crystalline neural visor, infinite energy matrix, admin designation crest.',
    primaryWeapon: 'vaporiser',
    equipmentList: [
      'Omni Vaporiser 3062 Disintegration Rail',
      'Admin Spawn Matrix Deck',
      'Infinite Shield Generator',
      'Noclip Flight Array',
    ],
    stats: {
      health: 9999,
      speed: 130,
      armor: 9999,
      damage: 9999,
      specialtyLabel: 'Omnipotence',
      specialtyValue: 100,
    },
    ability: {
      name: 'ADMIN SUPREMACY',
      description: 'Instantly vaporises all hostiles in the sector, restores full health/armor, and completes active objectives.',
      duration: 10,
      cooldown: 1,
      accentColor: '#fbbf24',
    },
    voiceProfile: { pitchHz: 120, timbre: 'synthetic', personalityTag: 'System Administrator' },
    damageMult: 5.0,
    critMult: 3.0,
    damageResist: 0.99,
    isPrimaryRoster: true,
    armorColor: '#09090b',
    trimColor: '#eab308',
    visorColor: '#fef08a',
  },
};

export const CHARACTER_LIST: CharacterDef[] = [
  CHARACTERS.reaper,
  CHARACTERS.ghost,
  CHARACTERS.titan,
  CHARACTERS.patch,
  CHARACTERS.phantom,
  CHARACTERS.engineer,
  CHARACTERS.wanderer,
  CHARACTERS.raven,
  CHARACTERS.brute,
  CHARACTERS.nyx,
  CHARACTERS.zero,
  CHARACTERS.god,
];

export const STORY_CHARACTERS: StoryCharacterDef[] = [
  {
    id: 'wanderer',
    name: 'THE WANDERER',
    role: 'Playable Survivor & Firearms Expert',
    faction: 'Independent Quarantine Survivor',
    accentColor: '#facc15',
    summary:
      'Lone survivor who mastered every firearm platform across the fallen megacity. Selectable as a full playable operative with Deadeye Barrage.',
    dialogueStyle: 'Measured, laconic, battle-tested.',
  },
  {
    id: 'raven_09',
    name: 'RAVEN-09',
    role: 'Allied Hacking & Recon Companion Unit',
    faction: 'Uninfected Pre-Collapse Vanguard AI',
    accentColor: '#38bdf8',
    summary:
      'Autonomous hover-chassis droid immune to the spore pathogen via air-gapped optical cores. Assists operatives by hacking locks, marking infected, and relaying grid diagnostics.',
    dialogueStyle: 'Crisp synthetic telemetry mixed with dry tactical humor.',
  },
  {
    id: 'vex',
    name: 'VEX',
    role: 'Neutral Rooftop Sniper & Info Broker',
    faction: 'Free Roof-Runners',
    accentColor: '#a3e635',
    summary:
      'Elusive sharp-shooter watching the quarantine streets from collapsed overpasses. Trades encrypted patrol intel and high-caliber ammunition drops to operatives who survive her sectors.',
    dialogueStyle: 'Wry, watchful, brutally honest.',
  },
  {
    id: 'the_harvester',
    name: 'THE HARVESTER',
    role: 'Mutated-Machine Reclamation Boss',
    faction: 'Corrupted Reclamation Swarm',
    accentColor: '#f97316',
    summary:
      'A towering industrial salvage rig fused with pulsing crimson fungal tendrils and rotary bone-shears that strips alloy and living tissue to feed Chamber Zero.',
    dialogueStyle: 'Grinding hydraulic shrieks and corrupted PA broadcasts.',
  },
  {
    id: 'dr_zero',
    name: 'DR. ZERO',
    role: 'Chief Quarantine Architect & Antagonist',
    faction: 'HELIOS Black-Site Directorate',
    accentColor: '#fb7185',
    summary:
      'Lead xenometallurgist who weaponized the meteor pathogen inside Sector Zero and locked New Eden behind automated HELIOS kill-gates.',
    dialogueStyle: 'Clinical, calculating, chillingly detached.',
  },
];

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  assault_rifle: {
    id: 'assault_rifle',
    name: 'VX-47 ASSAULT RIFLE',
    category: 'Assault Rifle',
    damage: 24,
    fireRate: 8.5,
    magSize: 32,
    reserveMax: 160,
    reloadTime: 1.75,
    spread: 0.018,
    adsSpread: 0.004,
    recoilKick: 0.022,
    range: 110,
    automatic: true,
    adsFov: 52,
    muzzleColor: '#ffaa44',
    description: 'Standard-issue analog infantry rifle immune to HELIOS signal intrusion.',
  },
  sniper_rifle: {
    id: 'sniper_rifle',
    name: 'M99 LONGBOW SNIPER',
    category: 'Precision Rifle',
    damage: 96,
    fireRate: 1.15,
    magSize: 6,
    reserveMax: 36,
    reloadTime: 2.2,
    spread: 0.032,
    adsSpread: 0.0008,
    recoilKick: 0.065,
    range: 190,
    automatic: false,
    adsFov: 28,
    muzzleColor: '#7dd3fc',
    description: 'Armor-piercing anti-materiel rifle built to shatter infected mech optics.',
  },
  heavy_mg: {
    id: 'heavy_mg',
    name: 'GOLIATH HEAVY MG',
    category: 'Heavy Machine Gun',
    damage: 28,
    fireRate: 11.5,
    magSize: 80,
    reserveMax: 240,
    reloadTime: 2.8,
    spread: 0.032,
    adsSpread: 0.012,
    recoilKick: 0.026,
    range: 100,
    automatic: true,
    adsFov: 56,
    muzzleColor: '#f59e0b',
    description: 'Belt-fed suppression weapon calibrated for heavy biomechanical hulls.',
  },
  tactical_rifle: {
    id: 'tactical_rifle',
    name: 'KESTREL TACTICAL PDW',
    category: 'Compact Tactical Rifle',
    damage: 22,
    fireRate: 10.0,
    magSize: 36,
    reserveMax: 180,
    reloadTime: 1.45,
    spread: 0.016,
    adsSpread: 0.005,
    recoilKick: 0.016,
    range: 95,
    automatic: true,
    adsFov: 54,
    muzzleColor: '#f87171',
    description: 'High-cycle close-quarters carbine for tight tunnels and maintenance shafts.',
  },
  energy_rifle: {
    id: 'energy_rifle',
    name: 'AEGIS ARC PROJECTOR',
    category: 'Experimental Energy Weapon',
    damage: 36,
    fireRate: 5.5,
    magSize: 24,
    reserveMax: 144,
    reloadTime: 1.65,
    spread: 0.01,
    adsSpread: 0.002,
    recoilKick: 0.018,
    range: 120,
    automatic: true,
    adsFov: 50,
    muzzleColor: '#fb7185',
    isEnergy: true,
    description: 'Sector Zero arc emitter that disrupts alien metallic musculature.',
  },
  pistol: {
    id: 'pistol',
    name: 'P-3062 SIDEARM',
    category: 'Secondary Pistol',
    damage: 21,
    fireRate: 4.5,
    magSize: 15,
    reserveMax: 90,
    reloadTime: 1.2,
    spread: 0.014,
    adsSpread: 0.004,
    recoilKick: 0.02,
    range: 75,
    automatic: false,
    adsFov: 58,
    muzzleColor: '#fbbf24',
    description: 'Reliable mechanical backup pistol with hardened tungsten rounds.',
  },
  shotgun: {
    id: 'shotgun',
    name: 'M42 BREACHER SHOTGUN',
    category: 'Combat Shotgun',
    damage: 16,
    pellets: 7,
    fireRate: 1.45,
    magSize: 8,
    reserveMax: 48,
    reloadTime: 2.1,
    spread: 0.068,
    adsSpread: 0.042,
    recoilKick: 0.055,
    range: 42,
    automatic: false,
    adsFov: 60,
    muzzleColor: '#fb923c',
    unlockCost: 4,
    description: '12-gauge flechette pump shotgun devastating against Scrapper limbs and Stalkers.',
  },
  plasma_lance: {
    id: 'plasma_lance',
    name: 'HELIOS PLASMA LANCE',
    category: 'Heavy Rail-Plasma Cannon',
    damage: 128,
    fireRate: 1.6,
    magSize: 10,
    reserveMax: 50,
    reloadTime: 2.3,
    spread: 0.007,
    adsSpread: 0.0005,
    recoilKick: 0.042,
    range: 185,
    automatic: false,
    adsFov: 44,
    muzzleColor: '#38bdf8',
    isEnergy: true,
    unlockCost: 8,
    description: 'Blacksite orbital capacitor lance capable of punching through boss armor plates.',
  },
  vaporiser: {
    id: 'vaporiser',
    name: 'OMNI VAPORISER 3062',
    category: 'Admin Disintegration Weapon',
    damage: 99999,
    fireRate: 8.0,
    magSize: 999,
    reserveMax: 9999,
    reloadTime: 0.5,
    spread: 0.0,
    adsSpread: 0.0,
    recoilKick: 0.0,
    range: 350,
    automatic: true,
    adsFov: 46,
    muzzleColor: '#fbbf24',
    isEnergy: true,
    description: 'Admin-tier quantum disintegration beam. Insta-kills any enemy, instantly finishes generators/puzzles, and vaporises obstacles.',
  },
};

export const SECONDARY_WEAPON_IDS: WeaponId[] = ['pistol', 'shotgun', 'plasma_lance'];

export function createDefaultUpgrades(): Record<WeaponId, WeaponUpgradeState> {
  return {
    assault_rifle: { damageLevel: 0, capacityLevel: 0, handlingLevel: 0 },
    sniper_rifle: { damageLevel: 0, capacityLevel: 0, handlingLevel: 0 },
    heavy_mg: { damageLevel: 0, capacityLevel: 0, handlingLevel: 0 },
    tactical_rifle: { damageLevel: 0, capacityLevel: 0, handlingLevel: 0 },
    energy_rifle: { damageLevel: 0, capacityLevel: 0, handlingLevel: 0 },
    pistol: { damageLevel: 0, capacityLevel: 0, handlingLevel: 0 },
    shotgun: { damageLevel: 0, capacityLevel: 0, handlingLevel: 0 },
    plasma_lance: { damageLevel: 0, capacityLevel: 0, handlingLevel: 0 },
    vaporiser: { damageLevel: 0, capacityLevel: 0, handlingLevel: 0 },
  };
}

export function getUpgradeCost(currentLevel: number): number {
  return currentLevel === 0 ? 2 : currentLevel === 1 ? 4 : 6;
}

export function getUpgradedWeaponStats(
  weaponId: WeaponId,
  upgrades?: WeaponUpgradeState
): WeaponDef {
  const base = WEAPONS[weaponId];
  if (!upgrades) return base;
  const dmgMult = 1 + upgrades.damageLevel * 0.16;
  const capMult = 1 + upgrades.capacityLevel * 0.25;
  const reloadMult = Math.max(0.62, 1 - upgrades.handlingLevel * 0.12);
  const spreadMult = Math.max(0.55, 1 - upgrades.handlingLevel * 0.14);
  return {
    ...base,
    damage: Math.round(base.damage * dmgMult),
    magSize: Math.max(base.magSize + upgrades.capacityLevel * 2, Math.round(base.magSize * capMult)),
    reserveMax: Math.round(base.reserveMax * capMult),
    reloadTime: Number((base.reloadTime * reloadMult).toFixed(2)),
    spread: base.spread * spreadMult,
    adsSpread: base.adsSpread * spreadMult,
    recoilKick: base.recoilKick * spreadMult,
  };
}

export const MISSIONS: MissionDef[] = [
  {
    number: 1,
    id: 'mission_01',
    title: 'THE FALLEN CITY',
    region: 'BURNING COMMERCIAL BOULEVARD',
    factionFocus: 'THE LAST DEFENCE',
    summary:
      'Explore ruined commercial streets, burning storefronts with shattered glass, crashed military transports, and scorched buildings while recovering the HELIOS access key and evading THE SCRAPPER.',
    playable: true,
    levelThreatMult: 1.0,
    primaryMonster: 'THE SCRAPPER',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 2,
    id: 'mission_02',
    title: 'THE SILENT ESTATES',
    region: 'ABANDONED LUXURY RESIDENTIAL VILLAS',
    factionFocus: 'THE LAST DEFENCE',
    summary:
      'Search decaying futuristic villas with cantilevered balconies, murky stagnant swimming pools, and overgrown gardens. Restore emergency power grid relays and evade THE CRAWLER.',
    playable: true,
    levelThreatMult: 1.12,
    primaryMonster: 'THE CRAWLER',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 3,
    id: 'mission_03',
    title: 'THE DEAD MALL',
    region: 'FUTURISTIC CONCOURSE & SHOPPING CENTRE',
    factionFocus: 'THE ARCHIVISTS',
    summary:
      'Infiltrate a vast ruined shopping concourse with broken glass storefronts, damaged escalators, fallen shelves, and emergency lighting. Retrieve 3 research drives while eluding THE WATCHER.',
    playable: true,
    levelThreatMult: 1.24,
    primaryMonster: 'THE WATCHER',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 4,
    id: 'mission_04',
    title: 'THE DEAD CONSTRUCTION ZONE',
    region: 'UNFINISHED SKYSCRAPERS & GANTRY CRANES',
    factionFocus: 'THE SCRAPBORN',
    summary:
      'Traverse colossal high-rises under construction, scaffolding, a 28-meter tower crane, and exposed reinforcement steel. Secure military transport and emergency comms while avoiding THE HUNTER.',
    playable: true,
    levelThreatMult: 1.36,
    primaryMonster: 'THE HUNTER',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 5,
    id: 'mission_05',
    title: 'THE UNDERGROUND',
    region: 'METRO PLATFORMS & SMELTING CRUCIBLE',
    factionFocus: 'THE UNBOUND',
    summary:
      'Fight across sunken metro platforms, railway tracks, damp pipes, and molten crucible machinery to defeat THE FORGEMASTER.',
    playable: true,
    isBossMission: true,
    bossName: 'THE FORGEMASTER',
    levelThreatMult: 1.5,
    primaryMonster: 'THE FORGEMASTER',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 6,
    id: 'mission_06',
    title: 'THE FORGOTTEN LABORATORY',
    region: 'CLASSIFIED RESEARCH & CRYO CHAMBERS',
    factionFocus: 'THE LAST DEFENCE',
    summary:
      'Breach high-security research laboratories with glass cleanrooms, cryogenic specimen pods, and damaged supercomputer arrays. Destroy THE SENTINEL combat mech.',
    playable: true,
    isBossMission: true,
    bossName: 'THE SENTINEL',
    levelThreatMult: 1.65,
    primaryMonster: 'THE SENTINEL',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 7,
    id: 'mission_07',
    title: 'THE IRON GRAVEYARD',
    region: 'MILITARY PROVING GROUNDS & TANK WRECKS',
    factionFocus: 'THE ARCHIVISTS',
    summary:
      'Navigate military fortifications, charred tank wrecks, and half-submerged flooded infrastructure. Drain flooded sectors and defeat THE DROWNED MACHINE.',
    playable: true,
    isBossMission: true,
    bossName: 'THE DROWNED MACHINE',
    hasFlooding: true,
    levelThreatMult: 1.78,
    primaryMonster: 'THE DROWNED MACHINE',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 8,
    id: 'mission_08',
    title: 'GROUND ZERO',
    region: 'MASSIVE METEOR CRATER & ALIEN STRUCTURES',
    factionFocus: 'THE CHOIR',
    summary:
      'Enter the smoking meteor impact crater surrounded by alien obsidian spires, fissures, and ash storm clouds. Neutralize the metallic root network and slay THE GUARDIAN.',
    playable: true,
    isBossMission: true,
    bossName: 'THE GUARDIAN',
    levelThreatMult: 1.92,
    primaryMonster: 'THE STALKER / BROODMIND / GUARDIAN',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 9,
    id: 'mission_09',
    title: 'THE TITANFORGED',
    region: 'ARES-IX PROVING GROUNDS & TITAN ARENA',
    factionFocus: 'THE UNBOUND',
    summary:
      'Endure a massive arena of epic scale, orbital rocket gantries, and seismic devastation against the corrupted TITAN siege construct.',
    playable: true,
    isBossMission: true,
    bossName: 'THE TITAN',
    levelThreatMult: 2.08,
    primaryMonster: 'THE TITAN',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 10,
    id: 'mission_10',
    title: 'THE FINAL SIGNAL',
    region: 'MASTER SATELLITE COMMUNICATIONS ARRAY',
    factionFocus: 'THE CHOIR',
    summary:
      'Storm the high-frequency satellite array facility, 18-meter parabolic dish antenna, control room bunker, and orbital storm conditions to shut down the HELIOS DEFENCE UNIT.',
    playable: true,
    isBossMission: true,
    bossName: 'HELIOS DEFENCE UNIT',
    levelThreatMult: 2.24,
    primaryMonster: 'HELIOS DEFENCE UNIT',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 11,
    id: 'mission_11',
    title: 'BEYOND EARTH',
    region: 'ORBITAL RESEARCH STATION',
    factionFocus: 'THE ARCHIVISTS',
    summary:
      'Navigate low-gravity sections aboard a ruptured orbital station overlooking Earth. Restore station power, retrieve original signal logs, and evade THE VOID WALKER as the real truth surfaces.',
    playable: true,
    hasZeroG: true,
    levelThreatMult: 2.4,
    primaryMonster: 'THE VOID WALKER',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 12,
    id: 'mission_12',
    title: 'THE BEGINNING',
    region: 'SUBTERRANEAN ALIEN STRUCTURE',
    factionFocus: 'ALL FACTIONS',
    summary:
      'Enter the impossible metallic chamber beneath Earth’s crust. Defeat THE ORIGIN and decide humanity’s fate at the master HELIOS control spire.',
    playable: true,
    isBossMission: true,
    bossName: 'THE ORIGIN',
    hasZeroG: true,
    levelThreatMult: 2.65,
    primaryMonster: 'THE ORIGIN',
    secretCount: 1,
    docCount: 3,
  },
  {
    number: 13,
    id: 'mission_crucible',
    title: 'CRUCIBLE: THE TITANFORGED',
    region: 'IRON WILDS — CRUCIBLE YARD',
    factionFocus: 'THE UNBOUND',
    summary:
      'Bonus Siege Encounter: Confront THE TITANFORGED and the creature inside The Hollow in the Iron Wilds Crucible arena.',
    playable: true,
    isBossMission: true,
    bossName: 'THE TITANFORGED',
    levelThreatMult: 1.75,
    primaryMonster: 'THE TITANFORGED & HOLLOW DWELLER',
    secretCount: 0,
    docCount: 0,
    isBonusArena: true,
  },
];

export const FACTIONS: FactionDef[] = [
  {
    id: 'last_defence',
    name: 'THE LAST DEFENCE',
    motto: 'Hold the perimeter until no copper remains.',
    summary:
      'Splintered remnants of Earth orbital and mechanized infantry fighting with stripped-down analog firearms immune to remote hijacking.',
  },
  {
    id: 'archivists',
    name: 'THE ARCHIVISTS',
    motto: 'Record what we broke before the dark arrives.',
    summary:
      'Surviving xenometallurgists and orbital engineers cataloging how THEY rewrite rare-earth lattices into vascular tissue.',
  },
  {
    id: 'scrapborn',
    name: 'THE SCRAPBORN',
    motto: 'Bleed the dead metal, leave the living.',
    summary:
      'Nomadic scavengers navigating ruined megacities by wearing ceramic armor plates and avoiding active electronics.',
  },
  {
    id: 'choir',
    name: 'THE CHOIR',
    motto: 'Listen to the iron hymn.',
    summary:
      'Apocalyptic zealots who revere the HELIOS deep-space broadcast as an invitation to a higher biomechanical order.',
  },
  {
    id: 'unbound',
    name: 'THE UNBOUND',
    motto: 'No master. Only growth.',
    summary:
      'Former autonomous defense platforms reorganized by THEY into territorial apex predators.',
  },
];

export const WORLD_REGIONS: WorldRegionDef[] = [
  {
    id: 'new_eden',
    name: 'QUARANTINE & DEAD CITY',
    status: 'ACT I — CHAPTERS 01–04',
    description:
      'Destroyed industrial belts, subterranean military tunnels, Project Genesis laboratories, and shattered megacity highways.',
  },
  {
    id: 'iron_wilds',
    name: 'IRON FACTORY & BLACKSITE 09',
    status: 'ACT II — CHAPTERS 05–06 + CRUCIBLE',
    description:
      'Automated smelting complexes swallowed by living alloy tendons, molten crucibles, and classified military weapons vaults.',
  },
  {
    id: 'drowned_zone',
    name: 'FLOODED SECTOR & BIO-NEST',
    status: 'ACT II — CHAPTERS 07–08',
    description:
      'Submerged coastal infrastructure and cavernous alien ecosystems where dead metal grows metallic roots.',
  },
  {
    id: 'skyline',
    name: 'ORBITAL COMPLEX & HELIOS',
    status: 'ACT III — CHAPTERS 09–10',
    description:
      'Colossal launch pads, rocket hangars, and the master HELIOS satellite ground array.',
  },
  {
    id: 'beyond_earth',
    name: 'ORBITAL STATION & THE ORIGIN',
    status: 'ACT III FINALE — CHAPTERS 11–12',
    description:
      'Zero-gravity orbital laboratories and the impossible subterranean alien chamber beneath Earth.',
  },
];

export const LORE_ENTRIES: Record<string, LoreEntry> = {
  doc_the_book: {
    id: 'doc_the_book',
    levelNumber: 1,
    title: 'ANOMALOUS CODEX: THE BOOK',
    kind: 'document',
    author: 'Unknown Author',
    faction: 'THE CHOIR',
    timestamp: 'UNVERIFIED — RECOVERED FROM LOOT',
    content:
      'An anomalous codex bound in cold metallic leather. Pages writhe with unholy biomechanical text. Whoever picks this up while running invites the immediate gaze of the void.',
  },
  // LEVEL 01
  doc_apc_manifest: {
    id: 'doc_apc_manifest',
    levelNumber: 1,
    title: 'CONVOY 7-DELTA EVACUATION ORDER',
    kind: 'document',
    author: 'Cmdr. Halvorsen',
    faction: 'THE LAST DEFENCE',
    timestamp: '3062.11.04 — 03:14 UTC',
    content:
      'All high-grade lithium and neodymium vehicles on Perimeter Highway 4 have turned hostile. Do not power on digital optics near wreckages. THEY ignore flesh, bone, and polymer—THEY only hunger for refined alloys and rare-earth cores.',
  },
  audio_comm_relay: {
    id: 'audio_comm_relay',
    levelNumber: 1,
    title: 'AUDIO LOG: DEAD RELAY 04',
    kind: 'audio',
    author: 'Sgt. R. Kovács',
    faction: 'THE LAST DEFENCE',
    timestamp: '3062.11.11 — 22:17 UTC',
    content: 'Recovered burst from the communications relay outside Checkpoint Kestrel.',
    transcript:
      '"Relay 4 is fried! Choir saboteurs rerouted our emergency grid into the HELIOS dish. Something built out of cranes and hydraulic cables—we call it The Scrapper—just tore through Bravo bunker. Get underground!"',
  },
  doc_scrapborn_cache: {
    id: 'doc_scrapborn_cache',
    levelNumber: 1,
    title: 'SCRAPBORN CACHE MANIFEST',
    kind: 'document',
    author: 'Vex (Scrapborn Runner)',
    faction: 'THE SCRAPBORN',
    timestamp: '3062.11.09 — 04:50 UTC',
    content:
      'Left spare kinetic shells and Salvage Cores behind the collapsed barricade. Strip rare-earth batteries before sleeping, and never let The Scrapper corner you inside a dead alley.',
  },

  // LEVEL 02
  doc_tunnel_collapse: {
    id: 'doc_tunnel_collapse',
    levelNumber: 2,
    title: 'SUB-LEVEL VENTILATION LOG',
    kind: 'document',
    author: 'Eng. M. Takahashi',
    faction: 'THE LAST DEFENCE',
    timestamp: '3062.11.06 — 11:02 UTC',
    content:
      'We welded the blast doors shut, yet the Crawler still slips through 40-centimeter ducting. It folds its titanium ribs like an insect. Restore Turbine Bus B-2 before the spore density chokes the air handlers.',
  },
  audio_crawler_ambush: {
    id: 'audio_crawler_ambush',
    levelNumber: 2,
    title: 'AUDIO LOG: MAINTENANCE SHAFT 3',
    kind: 'audio',
    author: 'Cpl. D. Mercer',
    faction: 'THE LAST DEFENCE',
    timestamp: '3062.11.06 — 14:40 UTC',
    content: 'Distorted helmet recorder salvaged beside the ventilation grate.',
    transcript:
      '"It’s inside the vents! Check the grates above eye level—don’t look only at the hallway ahead! Wait—it’s coming out of the fuse alcove— [STATIC]"',
  },
  doc_choir_scribble: {
    id: 'doc_choir_scribble',
    levelNumber: 2,
    title: 'SCRATCHED MESSAGE ON TUNNEL WALL',
    kind: 'document',
    author: 'Unknown Witness',
    faction: 'THE CHOIR',
    timestamp: '3062.10.29 — UNVERIFIED',
    content:
      'We thought the meteors were the invasion. They were only the wiring crew. They turned our cities into antennas. DO NOT LET THEM HEAR YOU.',
  },

  // LEVEL 03
  doc_archivist_note: {
    id: 'doc_archivist_note',
    levelNumber: 3,
    title: 'PROJECT GENESIS: METALLIC NECROSIS',
    kind: 'document',
    author: 'Dr. S. Vance',
    faction: 'THE ARCHIVISTS',
    timestamp: '3061.08.19 — 19:42 UTC',
    content:
      'Synthetic mycelial threads infiltrate conductive crystal grain boundaries within 90 seconds of contact. Flesh is ignored because carbon-water tissue lacks lattice resonance. Refined alloys become nerves; circuits become synapses.',
  },
  doc_watcher_protocol: {
    id: 'doc_watcher_protocol',
    levelNumber: 3,
    title: 'SPECIMEN 07 — THE WATCHER',
    kind: 'document',
    author: 'Dr. H. Lin',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.02.14 — 08:11 UTC',
    content:
      'Specimen 07 grew to 3.2 meters after absorbing three laboratory optical arrays. It hunts strictly by acoustic triangulation and abrupt lateral motion. Crouch or hold still when its crimson lens sweeps a chamber.',
  },
  audio_sentinel_blackbox: {
    id: 'audio_sentinel_blackbox',
    levelNumber: 3,
    title: 'AUDIO LOG: GENESIS CONTAINMENT BREACH',
    kind: 'audio',
    author: 'Lt. K. Mercer',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.11.13 — 01:08 UTC',
    content: 'Final security room recording from Project Genesis Wing C.',
    transcript:
      '"Containment cylinder four just shattered! The glass held for three years—then the moment Drive Three spun up, something woke it from outside! Grab all three drives and run!"',
  },

  // LEVEL 04
  doc_deadcity_grid: {
    id: 'doc_deadcity_grid',
    levelNumber: 4,
    title: 'NEW EDEN TRANSIT ADVISORY',
    kind: 'document',
    author: 'Metro Civil Authority',
    faction: 'THE LAST DEFENCE',
    timestamp: '3060.03.11 — 06:00 UTC',
    content:
      'Elevated Highway 9 is compromised. Civilian autonomous cruisers now hunt in packs along the mall concourse. One armored quad-drive Hunter stalks the lower parking deck—its turbine chassis turns corners at lethal speed.',
  },
  audio_deadcity_scout: {
    id: 'audio_deadcity_scout',
    levelNumber: 4,
    title: 'AUDIO LOG: MALL ATRIUM BEACON',
    kind: 'audio',
    author: 'Runner T. Solis',
    faction: 'THE SCRAPBORN',
    timestamp: '3062.11.14 — 17:30 UTC',
    content: 'Short-range burst clipped to a shattered mannequin.',
    transcript:
      '"There’s a working military transport staged behind the west checkpoint, keys still in the console. Power the comms tower first so orbital defence stops jamming the highway gate."',
  },
  doc_deadcity_garage: {
    id: 'doc_deadcity_garage',
    levelNumber: 4,
    title: 'PARKING DECK SURVIVOR LEDGER',
    kind: 'document',
    author: 'Scrapborn Watch',
    faction: 'THE SCRAPBORN',
    timestamp: '3062.11.12 — 23:55 UTC',
    content:
      'Stored emergency Salvage Cores inside the sub-ramp alcove. The Hunter cannot squeeze behind the concrete pillars of the toll booth—use structural cover whenever its headlights flare.',
  },

  // LEVEL 05
  doc_factory_shift: {
    id: 'doc_factory_shift',
    levelNumber: 5,
    title: 'FOUNDRY OVERSEER SHIFT REPORT',
    kind: 'document',
    author: 'Foreman G. Bell',
    faction: 'THE UNBOUND',
    timestamp: '3061.04.07 — 16:20 UTC',
    content:
      'Line 4 stopped producing excavators last Tuesday. It began forging bipedal armor frames by itself. Something welded itself to the overhead gantry crane and drank straight from the slag trough.',
  },
  doc_forgemaster_weakness: {
    id: 'doc_forgemaster_weakness',
    levelNumber: 5,
    title: 'EMERGENCY CRUCIBLE PURGE MANUAL',
    kind: 'document',
    author: 'Safety Directorate',
    faction: 'THE LAST DEFENCE',
    timestamp: '3058.09.12 — ARCHIVED',
    content:
      'In the event of runaway furnace assembly, pull the two Crucible Purge Valves flanking the central foundry floor. Superheated slag discharge strips external alloy shielding and exposes molten internal cores.',
  },
  audio_factory_last: {
    id: 'audio_factory_last',
    levelNumber: 5,
    title: 'AUDIO LOG: SMELTER FLOOR 2',
    kind: 'audio',
    author: 'Tech. A. Okafor',
    faction: 'THE SCRAPBORN',
    timestamp: '3062.10.18 — 03:41 UTC',
    content: 'Recorded beneath an overturned slag cart.',
    transcript:
      '"That thing isn’t guarding the factory—it’s building an army for whatever is down below Blacksite 09. Use the foundry purge switches! Bullets alone take forever against its furnace plate!"',
  },

  // LEVEL 06
  doc_blacksite_clearance: {
    id: 'doc_blacksite_clearance',
    levelNumber: 6,
    title: 'BLACKSITE 09: EYES ONLY',
    kind: 'document',
    author: 'Gen. V. Thorne',
    faction: 'THE LAST DEFENCE',
    timestamp: '3054.05.22 — CLASSIFIED',
    content:
      'Five years before the 3059 meteor shower, deep-bore drilling beneath Trench 9 struck a dormant metallic lattice broadcasting at 4.18 Hz. HELIOS was not designed for weather monitoring—it was built as a global damper and relay.',
  },
  doc_sentinel_spec: {
    id: 'doc_sentinel_spec',
    levelNumber: 6,
    title: 'AEGIS-IX SENTINEL COMBAT DOSSIER',
    kind: 'document',
    author: 'Blacksite Armory',
    faction: 'THE LAST DEFENCE',
    timestamp: '3061.12.01 — RESTRICTED',
    content:
      'The Sentinel prototype combines reactive tungsten shielding with twin rotary cannons. Once THEY hijacked its neural core, it sealed Blacksite 09 from the inside and turned the automated defence grid against its creators.',
  },
  audio_blacksite_truth: {
    id: 'audio_blacksite_truth',
    levelNumber: 6,
    title: 'AUDIO LOG: DIRECTOR’S VAULT',
    kind: 'audio',
    author: 'Director E. Marlowe',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.01.19 — 00:12 UTC',
    content: 'Decrypted voice memo inside Blacksite Security Control.',
    transcript:
      '"We didn’t summon the meteors by accident. We woke the subterranean root first, and the meteors were repair packets dropped from orbit to reconnect it. God forgive us—Blacksite sits right above the Flooded Sector."',
  },

  // LEVEL 07
  doc_flooded_pumps: {
    id: 'doc_flooded_pumps',
    levelNumber: 7,
    title: 'HYDROLOGY SECTOR DRAIN PROTOCOL',
    kind: 'document',
    author: 'Chief Eng. R. Patel',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.04.03 — 09:15 UTC',
    content:
      'Three primary bulkheads hold back 40 million liters of contaminated runoff. Activate Pump Stations Alpha, Beta, and Gamma in sequence to expose the submerged research annex and dry out the electrical conduit.',
  },
  doc_drowned_machine: {
    id: 'doc_drowned_machine',
    levelNumber: 7,
    title: 'OBSERVATION NOTE: THE DROWNED MACHINE',
    kind: 'document',
    author: 'Dr. S. Vance',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.06.28 — 13:50 UTC',
    content:
      'Water conducts its bio-electric arc discharges, yet cooling turbines slow once the chamber is drained. Do not fight the Drowned Machine waist-deep in electrified coolant if you can purge the sump tanks first.',
  },
  audio_flooded_diver: {
    id: 'audio_flooded_diver',
    levelNumber: 7,
    title: 'AUDIO LOG: HIDDEN RESEARCH ANNEX',
    kind: 'audio',
    author: 'Diver K. Novak',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.07.02 — 21:04 UTC',
    content: 'Found sealed inside the drained lower laboratory vault.',
    transcript:
      '"Once the third pump clears the lower corridor, there’s a dry access alcove behind the east turbine. What’s growing below these pipes isn’t machinery anymore... it has roots."',
  },

  // LEVEL 08
  doc_nest_ecology: {
    id: 'doc_nest_ecology',
    levelNumber: 8,
    title: 'XENO-BOTANICAL FIELD REPORT',
    kind: 'document',
    author: 'Dr. S. Vance',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.08.15 — 07:45 UTC',
    content:
      'The underground cavern has ceased to resemble human architecture. Steel girders branch into crimson metallic roots feeding nutrients toward a central Broodmind node. THEY are not invaders—THEY are a planetary nervous system waking up.',
  },
  doc_choir_gospel: {
    id: 'doc_choir_gospel',
    levelNumber: 8,
    title: 'HYMN OF THE ROOT',
    kind: 'document',
    author: 'Prelate Voron',
    faction: 'THE CHOIR',
    timestamp: '3062.09.30 — UNVERIFIED',
    content:
      'Flesh rots and forgets. Iron remembers forever. Kneel before the Guardian of the Root, for the Broodmind weaves Earth’s dead steel into a choir that reaches the stars.',
  },
  audio_nest_guardian: {
    id: 'audio_nest_guardian',
    levelNumber: 8,
    title: 'AUDIO LOG: HEART CHAMBER',
    kind: 'audio',
    author: 'Operative Zero (Echo)',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.10.22 — 18:19 UTC',
    content: 'Telemetry loop pulled from an infected relay root.',
    transcript:
      '"Sever the Broodmind nodes before charging the Guardian! Its carapace draws power straight from the metallic roots. Look upward—the roots lead to the Orbital Launch Complex!"',
  },

  // LEVEL 09
  doc_orbital_launch: {
    id: 'doc_orbital_launch',
    levelNumber: 9,
    title: 'LAUNCH PAD 01 FLIGHT MANIFEST',
    kind: 'document',
    author: 'Col. H. Reyes',
    faction: 'THE LAST DEFENCE',
    timestamp: '3062.03.29 — 04:00 UTC',
    content:
      'The final Ares-IX shuttle remains fueled inside Hangar Bay 1, locked behind orbital clearance codes. Restore launch control power and solve the ignition bus override before The Titan tears through the gantry.',
  },
  doc_titan_file: {
    id: 'doc_titan_file',
    levelNumber: 9,
    title: 'HEAVY GANTRY MECH INCIDENT',
    kind: 'document',
    author: 'Pad Safety Log',
    faction: 'THE UNBOUND',
    timestamp: '3062.04.01 — 12:33 UTC',
    content:
      'The heavy orbital crane walker absorbed two booster casings during the storm. Its hydraulic claws crush armored personnel carriers in a single blow. Keep pillar cover between yourself and its charge lane.',
  },
  audio_orbital_code: {
    id: 'audio_orbital_code',
    levelNumber: 9,
    title: 'AUDIO LOG: FLIGHT DIRECTOR’S BOOTH',
    kind: 'audio',
    author: 'Flight Dir. N. Sato',
    faction: 'THE LAST DEFENCE',
    timestamp: '3062.04.02 — 02:11 UTC',
    content: 'Playback from the scorched launch control window.',
    transcript:
      '"We locked the orbital access codes inside the gantry safe. If anyone reaches the HELIOS Network facility north of the pad—cut the dish uplink before the orbital station finishes syncing!"',
  },

  // LEVEL 10
  doc_helios_core: {
    id: 'doc_helios_core',
    levelNumber: 10,
    title: 'HELIOS NETWORK ARCHITECTURE',
    kind: 'document',
    author: 'Chief Arch. L. Park',
    faction: 'THE ARCHIVISTS',
    timestamp: '3059.12.01 — DECLASSIFIED',
    content:
      'HELIOS was never hacked by human saboteurs. Every 3059 meteor contained resonant micro-transponders that rewrote orbital firmware to align all 64 dishes toward a single coordinate in deep space.',
  },
  doc_meteor_origin: {
    id: 'doc_meteor_origin',
    levelNumber: 10,
    title: 'ORIGINAL 3059 IMPACT SPECTROSCOPY',
    kind: 'document',
    author: 'Observatory Array 2',
    faction: 'THE ARCHIVISTS',
    timestamp: '3059.06.14 — 05:27 UTC',
    content:
      'Trajectories of the 3059 meteors did not originate from the asteroid belt. They decelerated artificially upon entering the heliosphere—targeted precision drops aimed directly at rare-earth industrial hubs.',
  },
  audio_helios_defence: {
    id: 'audio_helios_defence',
    levelNumber: 10,
    title: 'AUDIO LOG: SERVER HALL OMEGA',
    kind: 'audio',
    author: 'AI Core (Corrupted)',
    faction: 'THE CHOIR',
    timestamp: '3062.11.15 — LIVE BUFFER',
    content: 'Intercepted loop from the HELIOS Defence Unit.',
    transcript:
      '"CARRIER LOCK AT 99.4 PERCENT. UPLINK SOURCE VERIFIED: ORBITAL STATION AETHER AND SUBTERRANEAN NODE ZERO. AUTHORIZED PERSONNEL ONLY—ALL BIOLOGICAL UNITS WILL BE TERMINATED."',
  },

  // LEVEL 11
  doc_station_aether: {
    id: 'doc_station_aether',
    levelNumber: 11,
    title: 'ORBITAL STATION AETHER LOG',
    kind: 'document',
    author: 'Cmdr. I. Volkov',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.11.14 — ORBITAL',
    content:
      'Gravity stabilizers failed after metallic vines ruptured Ring B. Through the observation cupola, Earth’s night side glows with crimson veins converging at Ground Zero. And out beyond the Moon—something vast is decelerating.',
  },
  doc_signal_truth: {
    id: 'doc_signal_truth',
    levelNumber: 11,
    title: 'DEEP-SPACE INTERFEROMETRY TAPE',
    kind: 'document',
    author: 'Dr. A. Mercer',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.11.15 — ORBITAL',
    content:
      'CRITICAL REVELATION: THEY are not the origin of the signal. The biomechanical infection on Earth is merely an autonomous biological-metallic receiver—a beacon grown out of our own machines to guide a far older intelligence back to Earth.',
  },
  audio_void_walker: {
    id: 'audio_void_walker',
    levelNumber: 11,
    title: 'AUDIO LOG: AIRLOCK 04',
    kind: 'audio',
    author: 'Astronaut J. Morales',
    faction: 'THE LAST DEFENCE',
    timestamp: '3062.11.15 — 03:09 UTC',
    content: 'Final transmission from the zero-gravity laboratory ring.',
    transcript:
      '"Something wearing an EVA frame drifted through the hull breach—the Void Walker. It floats without sound in zero-G. Get the station power restored, grab the signal tape, and take the drop pod down to The Beginning!"',
  },

  // LEVEL 12
  doc_origin_chamber: {
    id: 'doc_origin_chamber',
    levelNumber: 12,
    title: 'CHAMBER ZERO: PRE-HUMAN STRATA',
    kind: 'document',
    author: 'Expedition Vanguard',
    faction: 'ALL FACTIONS',
    timestamp: 'TIMELESS — SUBTERRANEAN',
    content:
      'Four kilometers below the crust stands a non-human metallic cathedral predating multicellular life on Earth by 800 million years. The 3059 meteors did not invade Earth—they awakened an ancient buried seed.',
  },
  doc_origin_boss: {
    id: 'doc_origin_boss',
    levelNumber: 12,
    title: 'FINAL ANALYSIS: THE ORIGIN',
    kind: 'document',
    author: 'Dr. S. Vance',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.11.16 — FINAL',
    content:
      'THE ORIGIN is the first biomechanical core ever forged inside this chamber. Destroy its resonant crown and three irreversible commands become available on the master HELIOS spire: Shut down the network, redirect its carrier wave, or answer the call.',
  },
  audio_final_choice: {
    id: 'audio_final_choice',
    levelNumber: 12,
    title: 'AUDIO LOG: LAST TRANSMISSION',
    kind: 'audio',
    author: 'Unit 09 Command',
    faction: 'THE LAST DEFENCE',
    timestamp: '3062.11.16 — LIVE',
    content: 'Open channel across every surviving bunker on Earth.',
    transcript:
      '"Unit 09, if you can hear us—all orbital dishes are locked onto your chamber. Whatever you choose at that spire will decide whether humanity survives the night... or becomes part of what waits in the dark."',
  },

  // ENVIRONMENTAL DISCOVERY — BLACK & BLOOD-RED ALIEN FUNGUS (SEPARATE EXTRATERRESTRIAL ORGANISM)
  doc_fungus_estate_basement: {
    id: 'doc_fungus_estate_basement',
    levelNumber: 2,
    title: 'FIELD NOTE: CRIMSON-VEINED BLACK GROWTH',
    kind: 'document',
    author: 'Botanist E. Sato',
    faction: 'THE ARCHIVISTS',
    timestamp: '3061.09.14 — 21:05 UTC',
    content:
      'Found thick black foamy masses laced with dark blood-red veins spreading over rotted villa timber and damp soil. Tested nearby ferns, soil bacteria, and skin swabs: ZERO biological infection. THEY still target refined metals and rare-earth alloys exclusively—this organism is something completely separate, thriving silently in dark damp ruins.',
  },
  doc_fungus_construction_pit: {
    id: 'doc_fungus_construction_pit',
    levelNumber: 4,
    title: 'SITE SURVEY: SUB-BASEMENT COLONIES',
    kind: 'document',
    author: 'Site Geologist K. Okafor',
    faction: 'THE LAST DEFENCE',
    timestamp: '3061.11.02 — 04:48 UTC',
    content:
      'The black fungal networks ignore clean dry steel girders but colonize waterlogged excavation pits and decaying formwork planks. Under a handlamp the wet folds glisten and slowly shift by millimeters—too slow to notice at a glance, until you mark the edge with chalk and return an hour later.',
  },
  doc_fungus_lab_sample: {
    id: 'doc_fungus_lab_sample',
    levelNumber: 6,
    title: 'BIO-CONTAINMENT SPECIMEN: MYCO-X ("SANGUINE VEIL")',
    kind: 'document',
    author: 'Dr. H. Lin',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.01.19 — 16:30 UTC',
    content:
      'Classification: Non-terrestrial plasmodial fungus—distinct from THEY. Dormant spores likely hitchhiked inside porous silicate crusts of the 3059 meteors. It does not infect plants, animals, or human tissue, nor does it emit airborne toxins. Yet its raised dark-crimson capillary veins pulse with slow rhythmic pressure, as if quietly mapping every dark chamber it occupies.',
  },
  doc_fungus_tunnel_survey: {
    id: 'doc_fungus_tunnel_survey',
    levelNumber: 7,
    title: 'DRAINAGE CREW REPORT: ACOUSTIC ANOMALY',
    kind: 'document',
    author: 'Tech. R. Novak',
    faction: 'THE UNBOUND',
    timestamp: '3062.05.28 — 23:12 UTC',
    content:
      'Kill your engines in the lower tunnels and you can hear the mature black formations creaking and cracking as their outer crusts dry and split over wet red cavities. It has never attacked a worker—it just spreads along damp stone and listens in the dark. Nobody stays near the big colonies alone.',
  },
  doc_fungus_crater_origin: {
    id: 'doc_fungus_crater_origin',
    levelNumber: 8,
    title: 'IMPACT ZONE CORE SAMPLE: ANCIENT MATURE MASS',
    kind: 'document',
    author: 'Dr. S. Vance',
    faction: 'THE ARCHIVISTS',
    timestamp: '3062.08.09 — 09:40 UTC',
    content:
      'Mature terraced colonies near the subterranean impact fissures reach over two meters across, with cracked black shells hiding deep burgundy cavities. Unlike THEY, which hijack electronics and alloys, this ancient alien organism simply endures—older than the invasion, passively colonizing the rot left behind.',
  },
};

export const PUZZLES: Record<string, PuzzleDef> = {
  puz_01_gen: {
    id: 'puz_01_gen',
    title: 'CHECKPOINT GENERATOR BUS',
    systemTag: 'L01 // POWER RESTORATION',
    prompt:
      'Answer 10 easy maths questions to charge the checkpoint generator from 0% to 100% and restore grid power.',
    successMessage:
      'Generator activated at 100% power! Auxiliary current is now flowing to the Checkpoint Kestrel Gate.',
    mode: 'generator_math',
  },
  puz_02_elec: {
    id: 'puz_02_elec',
    title: 'SUB-LEVEL TURBINE RELAY',
    systemTag: 'L02 // VENTILATION GRID',
    prompt:
      'Answer 10 easy maths questions to bring the underground turbine relay up to 100% output.',
    successMessage:
      'Turbine relay activated at 100%! Electrical power has been restored to the ventilation grid.',
    mode: 'generator_math',
  },
  puz_03_lab: {
    id: 'puz_03_lab',
    title: 'GENESIS CONTAINMENT GENERATOR',
    systemTag: 'L03 // CENTRAL LAB SEAL',
    prompt:
      'Answer 10 easy maths questions to power the Central Laboratory containment seal to 100%.',
    successMessage:
      'Containment generator activated at 100%! The Central Laboratory blast door is now unlocked.',
    mode: 'generator_math',
  },
  puz_04_comms: {
    id: 'puz_04_comms',
    title: 'EMERGENCY COMMS GENERATOR',
    systemTag: 'L04 // CARRIER BYPASS',
    prompt:
      'Answer 10 easy maths questions to charge the emergency comms tower generator to 100%.',
    successMessage:
      'Comms tower generator activated at 100%! The Highway 9 jamming beacon is overridden.',
    mode: 'generator_math',
  },
  puz_05_furnace: {
    id: 'puz_05_furnace',
    title: 'FOUNDRY CRUCIBLE GENERATOR',
    systemTag: 'L05 // CRUCIBLE CONTROL',
    prompt:
      'Answer 10 easy maths questions to stabilize the foundry generator from 0% to 100%.',
    successMessage:
      'Crucible generator activated at 100%! The Foundry Boss Arena blast door is opening.',
    mode: 'generator_math',
  },
  puz_06_security: {
    id: 'puz_06_security',
    title: 'BLACKSITE 09 AUXILIARY GENERATOR',
    systemTag: 'L06 // AEGIS SECURITY',
    prompt:
      'Answer 10 easy maths questions to power the Blacksite armory override to 100%.',
    successMessage:
      'Blacksite generator activated at 100%! Armory security locks have disengaged.',
    mode: 'generator_math',
  },
  puz_07_pump: {
    id: 'puz_07_pump',
    title: 'SUMP DRAIN PUMP GENERATOR',
    systemTag: 'L07 // HYDROLOGY CONTROL',
    prompt:
      'Answer 10 easy maths questions to energize the flooded sector pump generator to 100%.',
    successMessage:
      'Pump generator activated at 100%! All Sector Drain Pump stations are now powered.',
    mode: 'generator_math',
  },
  puz_08_bio: {
    id: 'puz_08_bio',
    title: 'RESONANCE DAMPER GENERATOR',
    systemTag: 'L08 // BIO-ARRAY',
    prompt:
      'Answer 10 easy maths questions to charge the neural root damper generator to 100%.',
    successMessage:
      'Resonance generator activated at 100%! The Heart Chamber bio-root seal is opening.',
    mode: 'generator_math',
  },
  puz_09_orbital: {
    id: 'puz_09_orbital',
    title: 'ORBITAL IGNITION GENERATOR',
    systemTag: 'L09 // LAUNCH CONTROL',
    prompt:
      'Answer 10 easy maths questions to power the Launch Pad 01 ignition generator to 100%.',
    successMessage:
      'Ignition generator activated at 100%! Launch Pad 01 clamp locks are released.',
    mode: 'generator_math',
  },
  puz_10_helios: {
    id: 'puz_10_helios',
    title: 'HELIOS ARRAY GENERATOR',
    systemTag: 'L10 // MAINFRAME ROOT',
    prompt:
      'Answer 10 easy maths questions to charge the HELIOS override generator from 0% to 100%.',
    successMessage:
      'Override generator activated at 100%! Server Hall Omega vault access granted.',
    mode: 'generator_math',
  },
  puz_11_station: {
    id: 'puz_11_station',
    title: 'AETHER REACTOR GENERATOR',
    systemTag: 'L11 // ORBITAL POWER',
    prompt:
      'Answer 10 easy maths questions to restart the orbital station Aether generator to 100%.',
    successMessage:
      'Aether generator activated at 100%! Orbital Ring B airlock power is restored.',
    mode: 'generator_math',
  },
  puz_12_origin: {
    id: 'puz_12_origin',
    title: 'CHAMBER ZERO SPIRE GENERATOR',
    systemTag: 'L12 // THE BEGINNING',
    prompt:
      'Answer 10 easy maths questions to charge the Chamber Zero spire generator to 100%.',
    successMessage:
      'Spire generator activated at 100%! The Chamber Zero bridge is now open.',
    mode: 'generator_math',
  },
};

export const DEFAULT_SETTINGS: GameSettings = {
  mouseSensitivity: 1.0,
  invertY: false,
  masterVolume: 0.75,
  sfxVolume: 0.85,
  musicVolume: 0.6,
  fov: 74,
  difficulty: 'tactical',
  graphicsQuality: 'high',
  brightness: 1.0,
  showMinimap: true,
  touchControls: false,
  navigationAssist: true,
  reducedMotion: false,
  largeHudText: false,
  cinematicIntros: true,
  subtitleSize: 'medium',
  eduTextSize: 'medium',
  narrationEnabled: true,
};

export const CAMPAIGN_STORAGE_KEY = 'twhr_campaign_v1';

export const DEFAULT_CAMPAIGN_STATE: CampaignState = {
  unlockedLevel: 1,
  completedMissionIds: [],
  salvageCores: 3,
  medkits: 2,
  batteries: 1,
  unlockedWeapons: [
    'assault_rifle',
    'sniper_rifle',
    'heavy_mg',
    'tactical_rifle',
    'energy_rifle',
    'pistol',
  ],
  equippedSecondary: 'pistol',
  weaponUpgrades: createDefaultUpgrades(),
  weaponAmmo: {},
  collectedLoreIds: [],
  secretsFoundIds: [],
  endingsReached: [],
  unlockAllChapters: false,
  totalKills: 0,
  cinematicsViewedIds: ['cutscene_intro'],
  discoveredEducationIds: ['edu_meteor'],
};

export function loadCampaignState(): CampaignState {
  try {
    const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CAMPAIGN_STATE, weaponUpgrades: createDefaultUpgrades() };
    const parsed = JSON.parse(raw) as Partial<CampaignState>;
    const upgrades = createDefaultUpgrades();
    if (parsed.weaponUpgrades) {
      for (const k of Object.keys(upgrades) as WeaponId[]) {
        if (parsed.weaponUpgrades[k]) {
          upgrades[k] = {
            damageLevel: Math.min(3, Math.max(0, parsed.weaponUpgrades[k].damageLevel ?? 0)),
            capacityLevel: Math.min(3, Math.max(0, parsed.weaponUpgrades[k].capacityLevel ?? 0)),
            handlingLevel: Math.min(3, Math.max(0, parsed.weaponUpgrades[k].handlingLevel ?? 0)),
          };
        }
      }
    }
    return {
      ...DEFAULT_CAMPAIGN_STATE,
      ...parsed,
      weaponUpgrades: upgrades,
      unlockedWeapons: Array.from(
        new Set([...DEFAULT_CAMPAIGN_STATE.unlockedWeapons, ...(parsed.unlockedWeapons ?? [])])
      ),
      completedMissionIds: parsed.completedMissionIds ?? [],
      collectedLoreIds: parsed.collectedLoreIds ?? [],
      secretsFoundIds: parsed.secretsFoundIds ?? [],
      endingsReached: parsed.endingsReached ?? [],
      cinematicsViewedIds: Array.from(
        new Set(['cutscene_intro', ...(parsed.cinematicsViewedIds ?? [])])
      ),
      discoveredEducationIds: Array.from(
        new Set(['edu_meteor', ...(parsed.discoveredEducationIds ?? [])])
      ),
    };
  } catch {
    return { ...DEFAULT_CAMPAIGN_STATE, weaponUpgrades: createDefaultUpgrades() };
  }
}

export function saveCampaignState(state: CampaignState): void {
  try {
    localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function resetCampaignState(): CampaignState {
  const fresh: CampaignState = {
    ...DEFAULT_CAMPAIGN_STATE,
    weaponUpgrades: createDefaultUpgrades(),
  };
  saveCampaignState(fresh);
  return fresh;
}
