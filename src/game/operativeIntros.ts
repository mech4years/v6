import { CHARACTERS } from './data';
import { CharacterId } from './types';

export interface OperativeIntroBeat {
  atSec: number;
  caption: string;
  cue?: 'reload' | 'footstep' | 'turret' | 'stealth' | 'medic' | 'gunshot' | 'ability';
}

export interface OperativeIntroSpec {
  charId: CharacterId;
  title: string;
  classification: string;
  durationSec: number;
  environmentKind: 'armory' | 'skyscraper' | 'hangar' | 'hospital' | 'corridor' | 'workshop' | 'highway';
  fogColor: number;
  accentHex: number;
  beats: OperativeIntroBeat[];
}

export const OPERATIVE_INTRO_SPECS: Record<CharacterId, OperativeIntroSpec> = {
  god: {
    charId: 'god',
    title: 'GOD',
    classification: 'GOD – SYSTEM ADMINISTRATOR',
    durationSec: 7.5,
    environmentKind: 'armory',
    fogColor: 0x050402,
    accentHex: 0xfbbf24,
    beats: [
      { atSec: 0.4, caption: 'DEVELOPER COMMAND NEXUS // 00:00 ADMIN' },
      { atSec: 1.9, caption: 'GOD inspects the Omni Vaporiser 3062 quantum disintegration rail.', cue: 'reload' },
      { atSec: 3.9, caption: 'Infinite shielding online. Noclip flight matrix engaged.', cue: 'ability' },
      { atSec: 5.4, caption: 'GOD – SYSTEM ADMINISTRATOR // OMNIPOTENT PRIVILEGES GRANTED', cue: 'gunshot' },
    ],
  },
  reaper: {
    charId: 'reaper',
    title: 'REAPER',
    classification: 'REAPER – ASSAULT SPECIALIST',
    durationSec: 7.5,
    environmentKind: 'armory',
    fogColor: 0x09070a,
    accentHex: 0xef4444,
    beats: [
      { atSec: 0.4, caption: 'SECTOR 01 MILITARY ARMORY // 03:42 LOCAL' },
      { atSec: 1.9, caption: 'REAPER inspects his VX-47 assault carbine and chambers a fresh round.', cue: 'reload' },
      { atSec: 3.9, caption: 'Magazine seated. Trauma plates locked. Eyes on the breach door.', cue: 'footstep' },
      { atSec: 5.4, caption: 'REAPER – ASSAULT SPECIALIST // READY FOR DEPLOYMENT', cue: 'ability' },
    ],
  },
  ghost: {
    charId: 'ghost',
    title: 'GHOST',
    classification: 'GHOST – SNIPER SPECIALIST',
    durationSec: 7.5,
    environmentKind: 'skyscraper',
    fogColor: 0x050912,
    accentHex: 0x38bdf8,
    beats: [
      { atSec: 0.4, caption: 'RUINED SKYSCRAPER OVERWATCH // QUARANTINE PERIMETER' },
      { atSec: 2.0, caption: 'Infected silhouettes stalk the burning avenues twelve stories below.', cue: 'stealth' },
      { atSec: 4.1, caption: 'GHOST zeros his M99 Longbow thermal optic and lowers the barrel.', cue: 'reload' },
      { atSec: 5.5, caption: 'GHOST – SNIPER SPECIALIST // TARGETS ACQUIRED', cue: 'ability' },
    ],
  },
  titan: {
    charId: 'titan',
    title: 'TITAN',
    classification: 'TITAN – HEAVY ASSAULT',
    durationSec: 7.8,
    environmentKind: 'hangar',
    fogColor: 0x0d0a07,
    accentHex: 0xf59e0b,
    beats: [
      { atSec: 0.4, caption: 'VANGUARD DEPLOYMENT HANGAR // BAY 07' },
      { atSec: 1.8, caption: 'Heavy hydraulic footsteps echo across steel deck plating.', cue: 'footstep' },
      { atSec: 3.6, caption: 'TITAN hefts the M240 Vulcan and locks ceramic blast pauldrons.', cue: 'reload' },
      { atSec: 5.4, caption: 'TITAN – HEAVY ASSAULT // MARCHING TO EXTRACTION APC', cue: 'ability' },
    ],
  },
  patch: {
    charId: 'patch',
    title: 'PATCH',
    classification: 'PATCH – COMBAT MEDIC',
    durationSec: 7.5,
    environmentKind: 'hospital',
    fogColor: 0x06100e,
    accentHex: 0x34d399,
    beats: [
      { atSec: 0.4, caption: 'FIELD HOSPITAL 12 // CONTAMINATED TRIAGE WING' },
      { atSec: 2.0, caption: 'PATCH primes nanite aerosol injectors beneath flickering surgical lamps.', cue: 'medic' },
      { atSec: 4.0, caption: 'Bio-gel canisters sealed. Cardiac telemetry synchronized.', cue: 'reload' },
      { atSec: 5.5, caption: 'PATCH – COMBAT MEDIC // NO ONE GETS LEFT BEHIND', cue: 'ability' },
    ],
  },
  phantom: {
    charId: 'phantom',
    title: 'PHANTOM',
    classification: 'PHANTOM – STEALTH OPERATIVE',
    durationSec: 7.6,
    environmentKind: 'corridor',
    fogColor: 0x090512,
    accentHex: 0xc084fc,
    beats: [
      { atSec: 0.4, caption: 'SUB-LEVEL CORRIDOR 4B // POWER FAILURE' },
      { atSec: 1.9, caption: 'PHANTOM steps out from the violet emergency haze...', cue: 'stealth' },
      { atSec: 3.7, caption: 'Phase-veil fibers bend the light—vanishing completely from sensors.', cue: 'ability' },
      { atSec: 5.4, caption: 'PHANTOM – STEALTH OPERATIVE // ALREADY BEHIND YOU', cue: 'stealth' },
    ],
  },
  engineer: {
    charId: 'engineer',
    title: 'ENGINEER',
    classification: 'ENGINEER – TECHNICAL SPECIALIST',
    durationSec: 7.8,
    environmentKind: 'workshop',
    fogColor: 0x0e0906,
    accentHex: 0xfb923c,
    beats: [
      { atSec: 0.4, caption: 'HELIOS MAINTENANCE BAY // WORKBENCH 09' },
      { atSec: 1.9, caption: 'ENGINEER arcs a welding torch across a salvaged Mk-II sentry turret.', cue: 'turret' },
      { atSec: 3.9, caption: 'Targeting laser locked. Automated barrels spin up for test fire.', cue: 'gunshot' },
      { atSec: 5.5, caption: 'ENGINEER – TECHNICAL SPECIALIST // SYSTEMS ONLINE', cue: 'ability' },
    ],
  },
  wanderer: {
    charId: 'wanderer',
    title: 'THE WANDERER',
    classification: 'THE WANDERER – FIREARMS EXPERT',
    durationSec: 7.5,
    environmentKind: 'highway',
    fogColor: 0x0c0a07,
    accentHex: 0xfacc15,
    beats: [
      { atSec: 0.4, caption: 'HIGHWAY 9 BARRICADE // ASH & RAIN' },
      { atSec: 2.0, caption: 'THE WANDERER racks high-brass shells into his custom SG-88 shotgun.', cue: 'reload' },
      { atSec: 4.0, caption: 'Three winters in the rot. Every round has a name on it.', cue: 'gunshot' },
      { atSec: 5.5, caption: 'THE WANDERER – FIREARMS EXPERT // LOCKED AND LOADED', cue: 'ability' },
    ],
  },
  raven: {
    charId: 'raven',
    title: 'RAVEN',
    classification: 'RAVEN – VANGUARD BREACHER',
    durationSec: 6.5,
    environmentKind: 'armory',
    fogColor: 0x08070a,
    accentHex: 0xef4444,
    beats: [
      { atSec: 0.5, caption: '4TH ORBITAL VANGUARD DROP READY ROOM' },
      { atSec: 2.4, caption: 'RAVEN locks his breach rifle and checks squad telemetry.', cue: 'reload' },
      { atSec: 4.4, caption: 'RAVEN – VANGUARD BREACHER // BREACH PROTOCOL ACTIVE', cue: 'ability' },
    ],
  },
  brute: {
    charId: 'brute',
    title: 'BRUTE',
    classification: 'BRUTE – VANGUARD SIEGE',
    durationSec: 6.5,
    environmentKind: 'hangar',
    fogColor: 0x0b0907,
    accentHex: 0xf59e0b,
    beats: [
      { atSec: 0.5, caption: 'HEAVY ARMORY LOCKUP // BAY 02' },
      { atSec: 2.3, caption: 'Exoskeleton servos lock as BRUTE shoulders the Vulcan M240.', cue: 'footstep' },
      { atSec: 4.4, caption: 'BRUTE – VANGUARD SIEGE // UNBREAKABLE', cue: 'ability' },
    ],
  },
  nyx: {
    charId: 'nyx',
    title: 'NYX',
    classification: 'NYX – COMBAT ENGINEER',
    durationSec: 6.5,
    environmentKind: 'workshop',
    fogColor: 0x0c0709,
    accentHex: 0xf87171,
    beats: [
      { atSec: 0.5, caption: 'ENCRYPTED TELEMETRY DECK // HELIOS RELAY' },
      { atSec: 2.3, caption: 'NYX synchronizes her autonomous drone and wrist bypass rig.', cue: 'turret' },
      { atSec: 4.4, caption: 'NYX – COMBAT ENGINEER // GRID OVERRIDE ARMED', cue: 'ability' },
    ],
  },
  zero: {
    charId: 'zero',
    title: 'ZERO',
    classification: 'ZERO – EXPERIMENTAL OPERATIVE',
    durationSec: 6.5,
    environmentKind: 'corridor',
    fogColor: 0x100509,
    accentHex: 0xfb7185,
    beats: [
      { atSec: 0.5, caption: 'SECTOR ZERO CONTAINMENT CORRIDOR // BREACHED' },
      { atSec: 2.3, caption: 'Chest reactor veins ignite as ZERO harnesses the arc pulse.', cue: 'ability' },
      { atSec: 4.4, caption: 'ZERO – EXPERIMENTAL OPERATIVE // CONTAINMENT SEVERED', cue: 'gunshot' },
    ],
  },
};

export function getOperativeIntroSpec(charId: CharacterId): OperativeIntroSpec {
  return OPERATIVE_INTRO_SPECS[charId] ?? {
    charId,
    title: CHARACTERS[charId].callsign,
    classification: `${CHARACTERS[charId].callsign} – ${CHARACTERS[charId].role.toUpperCase()}`,
    durationSec: 6.5,
    environmentKind: 'armory',
    fogColor: 0x09080c,
    accentHex: 0xef4444,
    beats: [{ atSec: 0.5, caption: `${CHARACTERS[charId].callsign} PREPARING FOR DEPLOYMENT` }],
  };
}
