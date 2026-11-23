import { CHARACTERS } from './data';
import {
  CharacterId,
  CorpseInfectionStage,
  FormerCorpseRecord,
  WeaponId,
  WeaponLoadoutSnapshot,
  WeaponRuntimeState,
  WeaponUpgradeState,
} from './types';

const PLAYER_ID_KEY = 'twhr_player_id_v1';
const FORMER_CORPSES_KEY = 'twhr_former_corpses_v1';

export const MAX_ACTIVE_FORMERS_PER_MISSION = 4;

export const FORMER_STAGE_TIMINGS = {
  stillDuration: 2.5,
  twitchDuration: 5.0,
  infectDuration: 6.5,
  screamRiseDuration: 3.2,
};

export const FORMER_TOTAL_TRANSFORM_SECONDS =
  FORMER_STAGE_TIMINGS.stillDuration +
  FORMER_STAGE_TIMINGS.twitchDuration +
  FORMER_STAGE_TIMINGS.infectDuration +
  FORMER_STAGE_TIMINGS.screamRiseDuration;

export interface LocalPlayerIdentity {
  playerId: string;
  callsign: string;
}

export function getLocalPlayerIdentity(characterId: CharacterId): LocalPlayerIdentity {
  let playerId = 'op_local_unit09';
  try {
    const existing = window.localStorage.getItem(PLAYER_ID_KEY);
    if (existing && existing.length >= 6) {
      playerId = existing;
    } else {
      playerId = `op_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36).slice(-4)}`;
      window.localStorage.setItem(PLAYER_ID_KEY, playerId);
    }
  } catch {
    // fallback if storage unavailable
  }
  const callsign = CHARACTERS[characterId]?.callsign ?? characterId.toUpperCase();
  return { playerId, callsign };
}

function readAllCorpseRecords(): FormerCorpseRecord[] {
  try {
    const raw = window.localStorage.getItem(FORMER_CORPSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is FormerCorpseRecord =>
        Boolean(r && typeof r === 'object' && typeof (r as FormerCorpseRecord).corpseId === 'string')
    );
  } catch {
    return [];
  }
}

function writeAllCorpseRecords(records: FormerCorpseRecord[]): void {
  try {
    window.localStorage.setItem(FORMER_CORPSES_KEY, JSON.stringify(records));
  } catch {
    // ignore storage quota errors
  }
}

export function computeStageFromElapsed(elapsed: number): {
  stage: CorpseInfectionStage;
  infectionProgress: number;
  stageLocalProgress: number;
} {
  const tStill = FORMER_STAGE_TIMINGS.stillDuration;
  const tTwitch = tStill + FORMER_STAGE_TIMINGS.twitchDuration;
  const tInfect = tTwitch + FORMER_STAGE_TIMINGS.infectDuration;
  const tRise = FORMER_TOTAL_TRANSFORM_SECONDS;

  if (elapsed < tStill) {
    return {
      stage: 'still',
      infectionProgress: Math.min(0.06, (elapsed / tStill) * 0.06),
      stageLocalProgress: Math.max(0, Math.min(1, elapsed / tStill)),
    };
  }
  if (elapsed < tTwitch) {
    const local = (elapsed - tStill) / FORMER_STAGE_TIMINGS.twitchDuration;
    return {
      stage: 'twitching',
      infectionProgress: 0.06 + local * 0.28,
      stageLocalProgress: Math.max(0, Math.min(1, local)),
    };
  }
  if (elapsed < tInfect) {
    const local = (elapsed - tTwitch) / FORMER_STAGE_TIMINGS.infectDuration;
    return {
      stage: 'infecting',
      infectionProgress: 0.34 + local * 0.46,
      stageLocalProgress: Math.max(0, Math.min(1, local)),
    };
  }
  if (elapsed < tRise) {
    const local = (elapsed - tInfect) / FORMER_STAGE_TIMINGS.screamRiseDuration;
    return {
      stage: 'screaming_rise',
      infectionProgress: 0.8 + local * 0.2,
      stageLocalProgress: Math.max(0, Math.min(1, local)),
    };
  }
  return {
    stage: 'resurrected',
    infectionProgress: 1,
    stageLocalProgress: 1,
  };
}

export function createWeaponLoadoutSnapshot(
  weaponStates: [WeaponRuntimeState, WeaponRuntimeState],
  upgrades: Partial<Record<WeaponId, WeaponUpgradeState>>,
  activeSlot: 0 | 1
): WeaponLoadoutSnapshot {
  const defaultUpgrade = (): WeaponUpgradeState => ({
    damageLevel: 0,
    capacityLevel: 0,
    handlingLevel: 0,
  });
  const prim = weaponStates[0];
  const sec = weaponStates[1];
  const pUp = upgrades[prim.id] ?? defaultUpgrade();
  const sUp = upgrades[sec.id] ?? defaultUpgrade();

  return {
    primaryId: prim.id,
    primaryAmmoInMag: Math.max(0, Math.round(prim.ammoInMag)),
    primaryReserveAmmo: Math.max(0, Math.round(prim.reserveAmmo)),
    primaryUpgrades: { ...pUp },
    secondaryId: sec.id,
    secondaryAmmoInMag: Math.max(0, Math.round(sec.ammoInMag)),
    secondaryReserveAmmo: Math.max(0, Math.round(sec.reserveAmmo)),
    secondaryUpgrades: { ...sUp },
    activeSlot,
  };
}

export function recordPlayerDeathCorpse(params: {
  ownerPlayerId: string;
  ownerCallsign: string;
  characterId: CharacterId;
  missionId: string;
  position: { x: number; y: number; z: number };
  yaw: number;
  suitWear: number;
  loadout: WeaponLoadoutSnapshot;
  destroyedChest?: boolean;
  destroyedBack?: boolean;
}): FormerCorpseRecord {
  const all = readAllCorpseRecords();

  const record: FormerCorpseRecord = {
    corpseId: `former_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    ownerPlayerId: params.ownerPlayerId,
    ownerCallsign: params.ownerCallsign,
    characterId: params.characterId,
    missionId: params.missionId,
    position: {
      x: Number(params.position.x.toFixed(3)),
      y: Number(params.position.y.toFixed(3)),
      z: Number(params.position.z.toFixed(3)),
    },
    yaw: Number(params.yaw.toFixed(4)),
    suitWear: Number(Math.max(0.18, Math.min(1, params.suitWear)).toFixed(3)),
    loadout: params.loadout,
    destroyedChest: Boolean(params.destroyedChest),
    destroyedBack: Boolean(params.destroyedBack),
    stage: 'still',
    stageElapsed: 0,
    infectionProgress: 0,
    createdAt: Date.now(),
    limpSide: Math.random() > 0.5 ? 1 : -1,
  };

  // Enforce per-mission cap cleanly so infinite death loops never degrade performance
  const otherMissions = all.filter((r) => r.missionId !== params.missionId);
  const sameMissionActive = all.filter(
    (r) => r.missionId === params.missionId && r.stage !== 'defeated'
  );
  // Keep defeated records trimmed to at most 2 historical traces
  const sameMissionDefeated = all
    .filter((r) => r.missionId === params.missionId && r.stage === 'defeated')
    .slice(-2);

  sameMissionActive.push(record);
  while (sameMissionActive.length > MAX_ACTIVE_FORMERS_PER_MISSION) {
    sameMissionActive.shift();
  }

  writeAllCorpseRecords([...otherMissions, ...sameMissionDefeated, ...sameMissionActive]);
  return record;
}

export function getActiveMissionCorpses(missionId: string): FormerCorpseRecord[] {
  const all = readAllCorpseRecords();
  return all.filter((r) => r.missionId === missionId && r.stage !== 'defeated');
}

export function updateCorpseRecordProgress(
  corpseId: string,
  stage: CorpseInfectionStage,
  stageElapsed: number,
  infectionProgress: number
): void {
  const all = readAllCorpseRecords();
  const idx = all.findIndex((r) => r.corpseId === corpseId);
  if (idx < 0) return;
  all[idx] = {
    ...all[idx],
    stage,
    stageElapsed: Number(stageElapsed.toFixed(2)),
    infectionProgress: Number(Math.max(0, Math.min(1, infectionProgress)).toFixed(3)),
  };
  writeAllCorpseRecords(all);
}

export function markCorpseResurrected(corpseId: string): void {
  const all = readAllCorpseRecords();
  const idx = all.findIndex((r) => r.corpseId === corpseId);
  if (idx < 0) return;
  all[idx] = {
    ...all[idx],
    stage: 'resurrected',
    stageElapsed: FORMER_TOTAL_TRANSFORM_SECONDS,
    infectionProgress: 1,
    resurrectedAt: Date.now(),
  };
  writeAllCorpseRecords(all);
}

export function markCorpseDefeated(corpseId: string): void {
  const all = readAllCorpseRecords();
  const idx = all.findIndex((r) => r.corpseId === corpseId);
  if (idx < 0) return;
  all[idx] = {
    ...all[idx],
    stage: 'defeated',
  };
  writeAllCorpseRecords(all);
}

export function clearMissionFormerRecords(missionId: string): void {
  const all = readAllCorpseRecords();
  writeAllCorpseRecords(all.filter((r) => r.missionId !== missionId));
}
