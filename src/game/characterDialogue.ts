import { CHARACTERS } from './data';
import { CharacterId } from './types';

export type QuipCategory =
  | 'deploy'
  | 'threat_close'
  | 'low_ammo'
  | 'hurt'
  | 'low_hp'
  | 'generator_repair'
  | 'hazard'
  | 'boss_encounter'
  | 'ability_use'
  | 'kill_streak';

const QUIP_LINES: Record<CharacterId, Record<QuipCategory, string[]>> = {
  god: {
    deploy: [
      'Admin session initialized. Sector quarantine parameters cleared.',
      'Omnipotent authority online. Vaporise all anomalous entities.',
    ],
    threat_close: [
      'Insignificant bio-signature within range. Disintegration ready.',
      'Hostile approaching admin perimeter.',
    ],
    low_ammo: [
      'Magazines never deplete under admin privileges.',
      'Quantum feed nominal.',
    ],
    hurt: [
      'Shield matrix absorbs all trauma instantly.',
      'Zero damage sustained.',
    ],
    low_hp: [
      'HP locked at absolute infinity.',
      'Biometric failure impossible.',
    ],
    generator_repair: [
      'Power grid instantly synchronized.',
      'System node forced online.',
    ],
    hazard: [
      'Radiation neutralized by admin shielding.',
      'Fallout ignored.',
    ],
    boss_encounter: [
      'Apex anomaly detected. Initializing Omni Vaporiser beam.',
      'Boss entity marked for immediate sector purge.',
    ],
    ability_use: [
      'Admin supremacy asserted across all simulation coordinates!',
      'Omnipotent pulse active.',
    ],
    kill_streak: [
      'Sector purged.',
      'Anomalies cleansed from reality.',
    ],
  },
  reaper: {
    deploy: [
      'Magazine seated. Watch your corners—metal and flesh alike bleed tonight.',
      'Sector containment is dead. Sweep clear and keep moving.',
    ],
    threat_close: [
      'Contact inside five meters—stay sharp!',
      'Too close. Breaching firing stance!',
    ],
    low_ammo: [
      'Running dry—need a fresh mag!',
      'Last few rounds in the chamber!',
    ],
    hurt: [
      'Armor took a hit—still standing.',
      'Not enough to put me down.',
    ],
    low_hp: [
      'Trauma alarm flashing... patching up soon.',
      'Visor cracked. One mistake ends this.',
    ],
    generator_repair: [
      'Power grid online. Now let them come.',
      'Aux generator singing. Sector lights stabilizing.',
    ],
    hazard: [
      'Air’s thick with fallout—keep the seal tight.',
      'Radiation spiking. Move through fast.',
    ],
    boss_encounter: [
      'Big bastard ahead. Focus fire on the weak plating!',
      'Target classification: Apex horror. Empty every mag!',
    ],
    ability_use: [
      'Overdrive injected—pushing throttle to redline!',
      'Adrenal surge active. Let’s clear this corridor!',
    ],
    kill_streak: [
      'Corridor clear. Stay frosty.',
      'Another pack put in the dirt.',
    ],
  },
  ghost: {
    deploy: [
      'Optics calibrated. Wind zeroed. Nobody hears me first.',
      'Moving into the dark. Keep the noise down.',
    ],
    threat_close: [
      'Too close for a long gun—switching posture.',
      'Hostile in knife range. Backing out.',
    ],
    low_ammo: [
      'Magazine nearly spent. Make the last shot count.',
      'Need brass—clip’s almost empty.',
    ],
    hurt: [
      'Grazed—relocating.',
      'Caught my flank. Breaking line of sight.',
    ],
    low_hp: [
      'Vitals dropping. Disengaging immediately.',
      'Bleeding out won’t help the mission. Need med-gel.',
    ],
    generator_repair: [
      'Grid power back. Makes targets easier to spot.',
      'Circuit closed. Watch the lit doorways.',
    ],
    hazard: [
      'Geiger clicks rising—don’t linger in the hot zone.',
      'Radiation fog ahead. Skirt the perimeter.',
    ],
    boss_encounter: [
      'Heavy bio-mechanical signature. Aiming for ocular joints.',
      'Wait for its chest core to open—then strike.',
    ],
    ability_use: [
      'Shadow shroud active. Slipping off their sensors.',
      'Signature damped. Hunting blind targets.',
    ],
    kill_streak: [
      'Clean shots. Nothing left standing.',
      'Three down, zero wasted motion.',
    ],
  },
  titan: {
    deploy: [
      'Hydraulics pressurized. Let them break against the armor.',
      'Heavy plate locked. Point me at the breach.',
    ],
    threat_close: [
      'Come closer, monster—meet steel!',
      'Right in front of me. Bad mistake.',
    ],
    low_ammo: [
      'Belt’s running short—reloading soon!',
      'Ammo feed thin—cover while I swap drums!',
    ],
    hurt: [
      'Hah—just a dent in the ceramic!',
      'Armor holding. Hit harder!',
    ],
    low_hp: [
      'Even siege frames crack eventually... patching plates!',
      'Suit integrity failing—not retreating yet.',
    ],
    generator_repair: [
      'Heavy power’s up. Let the lights burn bright.',
      'Generator locked at max output.',
    ],
    hazard: [
      'Thermal and rad seals taxed—pushing forward anyway.',
      'Dosimeter screaming. Lead lining better earn its keep.',
    ],
    boss_encounter: [
      'Finally, something my size! Bring it on!',
      'Apex chassis ahead. Stand firm!',
    ],
    ability_use: [
      'FORTRESS LOCK ENGAGED! Nothing breaks this wall!',
      'Blast plates sealed—stand your ground!',
    ],
    kill_streak: [
      'Like mowing through scrap metal.',
      'Nothing left in this lane.',
    ],
  },
  patch: {
    deploy: [
      'Triage kit sealed. Stay alive and I’ll keep us breathing.',
      'Nanites primed, cardiac monitor linked. Moving out.',
    ],
    threat_close: [
      'Contaminated hostiles inside five meters—watching exposure!',
      'Back off! Spores right on top of us!',
    ],
    low_ammo: [
      'Clip’s nearly empty—need a breather to reload.',
      'Down to reserve rounds!',
    ],
    hurt: [
      'Laceration detected—stabilizing!',
      'Took trauma—checking suit seal.',
    ],
    low_hp: [
      'Cardiac rate critical! Administering med-gel ASAP!',
      'Severe blood loss—need Biotic Field now!',
    ],
    generator_repair: [
      'Power restored! Field sterilizers and lights coming back online.',
      'Generator humming—keeps the darkness off our backs.',
    ],
    hazard: [
      'Severe radiation exposure—cellular damage ticking up!',
      'Get out of this hot zone before the dosimeter maxes!',
    ],
    boss_encounter: [
      'Massive necrotic-metal hybrid! Watch for bleed-out hits!',
      'Target bio-mass off the charts. Keep distance and heal early!',
    ],
    ability_use: [
      'Biotic nanite cloud deployed—patching trauma!',
      'Medical field active—stabilizing tissue and suit seals!',
    ],
    kill_streak: [
      'Threat neutralized. Checking vitals.',
      'Area sanitized.',
    ],
  },
  phantom: {
    deploy: [
      'Phase cloak charged. Moving unseen through the rot.',
      'Shadows belong to me—not the swarm.',
    ],
    threat_close: [
      'Stalker at close quarters—silent takedown.',
      'Inside the veil... right where I want them.',
    ],
    low_ammo: [
      'Mag light. Switching to shadow discipline.',
      'Almost dry—vanishing to reload.',
    ],
    hurt: [
      'Tch—clipped my weave.',
      'They got lucky. Breaking contact.',
    ],
    low_hp: [
      'Cloak flickering with blood loss... need cover.',
      'Pulse racing—can’t slip up now.',
    ],
    generator_repair: [
      'Grid online. Even the blind relays are waking up.',
      'Power steady. Moving before the noise draws a crowd.',
    ],
    hazard: [
      'Ionizing dust interfering with cloak fibers.',
      'High rads—slipping through fast.',
    ],
    boss_encounter: [
      'Monster’s sensors are wide. Time to flank its blind spot.',
      'Heavy target ahead. Strike from the dark.',
    ],
    ability_use: [
      'Phase Veil engaged—now you see me, now you don’t.',
      'Disappearing into static. Flanking now.',
    ],
    kill_streak: [
      'Silent sweep complete.',
      'Never even heard the shot.',
    ],
  },
  engineer: {
    deploy: [
      'Diagnostics green, turret cores spun up. Let’s fix this wasteland.',
      'Every locked door’s just waiting for a bypass.',
    ],
    threat_close: [
      'Hostile in wrench range—get back!',
      'Perimeter breached at five meters!',
    ],
    low_ammo: [
      'Shells running thin—reloading!',
      'Tube’s almost empty!',
    ],
    hurt: [
      'Sparks off the rig—minor hull damage.',
      'Servo took a bruise. Still operational.',
    ],
    low_hp: [
      'Bio-monitor redlining! Patching suit!',
      'Too many leaks in this armor—need a medkit!',
    ],
    generator_repair: [
      'Hah! Clean circuit splice—100% output!',
      'That’s how you coax life back into a dead grid.',
    ],
    hazard: [
      'Isotope leak nearby—dosimeter spiking.',
      'Watch the radiation pocket—sensors are screaming.',
    ],
    boss_encounter: [
      'Look at all that corrupted servo armor—my turret’s gonna love it.',
      'Giant biomechanical rig incoming! Aim for exposed cores!',
    ],
    ability_use: [
      'Automated Sentry Turret deployed—let the machine earn its keep!',
      'Turret online and tracking targets!',
    ],
    kill_streak: [
      'Scrapheap cleared. Good telemetry.',
      'Efficiency rating: optimal.',
    ],
  },
  wanderer: {
    deploy: [
      'Two shells chambered, boots laced. Same wasteland, worse company.',
      'Three winters in the rot taught me one rule: shoot first.',
    ],
    threat_close: [
      'Breath’s on my neck—bad time to blink!',
      'Up close and ugly. Just how I like the scattergun.',
    ],
    low_ammo: [
      'Counting brass—almost out in this mag!',
      'Click’s coming soon—get ready to reload!',
    ],
    hurt: [
      'Just another scar for the collection.',
      'Stings like hell—still breathing.',
    ],
    low_hp: [
      'Seen worse... barely. Need a med-gel.',
      'Vision’s graying out. Hold it together.',
    ],
    generator_repair: [
      'Old turbine still has some kick left in her.',
      'Lights up. Doesn’t make the dark any friendlier.',
    ],
    hazard: [
      'Air tastes like copper and fallout—keep moving.',
      'Hot zone ahead. Don’t breathe deep.',
    ],
    boss_encounter: [
      'Now that’s a genuine nightmare. Load the heavy shells!',
      'Big ugly metal bastard. Let’s see what breaks first.',
    ],
    ability_use: [
      'Deadeye Barrage—lock and load, fast and loud!',
      'Nothing jams when my hands are moving this quick!',
    ],
    kill_streak: [
      'Quiet again. Good.',
      'Just brass and ashes left.',
    ],
  },
  raven: {
    deploy: ['Vanguard link live. Sweep the sector.'],
    threat_close: ['Close contact under five meters!'],
    low_ammo: ['Low magazine—reloading!'],
    hurt: ['Taking fire—armor damaged!'],
    low_hp: ['Critical vitals! Need medkit!'],
    generator_repair: ['Grid restored. Vanguard pushing forward.'],
    hazard: ['High radiation pocket detected.'],
    boss_encounter: ['Apex hostile detected—engage full firepower!'],
    ability_use: ['Overdrive engaged!'],
    kill_streak: ['Sector lane cleared.'],
  },
  brute: {
    deploy: ['Exoskeleton online. Ready for breach.'],
    threat_close: ['Hostile right in front of me!'],
    low_ammo: ['Heavy belt nearly empty!'],
    hurt: ['Plating hit—still advancing.'],
    low_hp: ['Hull integrity critical!'],
    generator_repair: ['Power grid restored.'],
    hazard: ['Radiation surging around chassis.'],
    boss_encounter: ['Heavy target ahead—bring the Vulcan!'],
    ability_use: ['Fortress lock active!'],
    kill_streak: ['Target crushed.'],
  },
  nyx: {
    deploy: ['Grid uplink synced. Drone standing by.'],
    threat_close: ['Infected proximity alert—five meters!'],
    low_ammo: ['Magazine low—cycling soon.'],
    hurt: ['Suit armor abraded!'],
    low_hp: ['Vitals redlining—stabilize!'],
    generator_repair: ['Grid circuit spliced cleanly.'],
    hazard: ['Fallout spike detected ahead.'],
    boss_encounter: ['Corrupted HELIOS platform ahead!'],
    ability_use: ['Support drone deployed—Reboot active!'],
    kill_streak: ['Hostiles cleared.'],
  },
  zero: {
    deploy: ['Reactor stable. Let’s sever their link.'],
    threat_close: ['Bio-signature inside five meters...'],
    low_ammo: ['Cell capacity low.'],
    hurt: ['Containment suit fractured!'],
    low_hp: ['Reactor pulse erratic—need trauma gel!'],
    generator_repair: ['Power surging back into the grid.'],
    hazard: ['Radiation resonates with the core—hurry.'],
    boss_encounter: ['Another creature forged in Sector Zero...'],
    ability_use: ['Discharging arc pulse!'],
    kill_streak: ['Links severed.'],
  },
};

export interface StoryDialogueLine {
  speaker: string;
  text: string;
  accentColor: string;
  pitchHz: number;
  timbre: 'gravel' | 'calm' | 'heavy' | 'synthetic' | 'clinical' | 'whisper' | 'raspy';
}

export const STORY_NPC_LINES: Record<'raven_09' | 'vex' | 'dr_zero' | 'the_harvester', StoryDialogueLine[]> = {
  raven_09: [
    {
      speaker: 'RAVEN-09 // COMPANION UNIT',
      text: 'Air-gapped optical core intact. I have purged nearby lock telemetry and marked hostile heat pockets ahead.',
      accentColor: '#38bdf8',
      pitchHz: 230,
      timbre: 'synthetic',
    },
    {
      speaker: 'RAVEN-09 // COMPANION UNIT',
      text: 'Warning: Sub-grid voltage fluctuates whenever repair cells drop below 100%. Keep your gun light ready.',
      accentColor: '#38bdf8',
      pitchHz: 230,
      timbre: 'synthetic',
    },
    {
      speaker: 'RAVEN-09 // COMPANION UNIT',
      text: 'Bypass routine uploaded to your wrist deck. Good luck down there, operative.',
      accentColor: '#38bdf8',
      pitchHz: 230,
      timbre: 'synthetic',
    },
  ],
  vex: [
    {
      speaker: 'VEX // ROOFTOP SNIPER',
      text: 'Keep your head down in the crosswind. Dropped a spare reserve pack and marked the heavy patrol lanes below.',
      accentColor: '#a3e635',
      pitchHz: 196,
      timbre: 'calm',
    },
    {
      speaker: 'VEX // ROOFTOP SNIPER',
      text: 'Saw a Harvester rig dragging scrap down toward the foundry earlier. Don’t get cornered inside five meters.',
      accentColor: '#a3e635',
      pitchHz: 196,
      timbre: 'calm',
    },
    {
      speaker: 'VEX // ROOFTOP SNIPER',
      text: 'Dr. Zero’s still broadcasting on encrypted HELIOS bands. Whatever’s beneath Sector Zero—it’s waking up.',
      accentColor: '#a3e635',
      pitchHz: 196,
      timbre: 'calm',
    },
  ],
  dr_zero: [
    {
      speaker: 'DR. ZERO // SECTOR ZERO',
      text: 'You keep repairing dead generators as if light can stop evolution. The meteor metal simply remembers its true shape.',
      accentColor: '#fb7185',
      pitchHz: 102,
      timbre: 'clinical',
    },
    {
      speaker: 'DR. ZERO // SECTOR ZERO',
      text: 'Remarkable survival rate. Let us observe how your suit holds up once the Quarantine Swarm closes in.',
      accentColor: '#fb7185',
      pitchHz: 102,
      timbre: 'clinical',
    },
  ],
  the_harvester: [
    {
      speaker: 'PA INTERCEPT // THE HARVESTER',
      text: '[RECLAMATION PROTOCOL OVERRIDE — BIOMASS & ALLOY ACQUISITION IN PROGRESS]',
      accentColor: '#f97316',
      pitchHz: 72,
      timbre: 'heavy',
    },
  ],
};

export function pickOperativeQuip(
  charId: CharacterId,
  category: QuipCategory
): { speaker: string; text: string; accentColor: string; pitchHz: number; timbre: NonNullable<StoryDialogueLine['timbre']> } {
  const def = CHARACTERS[charId];
  const pool = QUIP_LINES[charId]?.[category] ?? QUIP_LINES.reaper[category];
  const text = pool[Math.floor(Math.random() * pool.length)];
  const vp = def.voiceProfile ?? { pitchHz: 120, timbre: 'gravel' as const, personalityTag: 'Operative' };
  return {
    speaker: `${def.callsign} // ${def.classification ?? def.role.toUpperCase()}`,
    text,
    accentColor: def.ability.accentColor,
    pitchHz: vp.pitchHz,
    timbre: vp.timbre,
  };
}
