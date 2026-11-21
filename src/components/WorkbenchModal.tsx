import React from 'react';
import { Check, Crosshair, HeartPulse, Lock, PackagePlus, ShieldCheck, Wrench, X } from 'lucide-react';
import { HorrorAudioEngine } from '../game/audio';
import {
  CHARACTERS,
  SECONDARY_WEAPON_IDS,
  WEAPONS,
  getUpgradeCost,
  getUpgradedWeaponStats,
  saveCampaignState,
} from '../game/data';
import { CampaignState, CharacterId, WeaponId, WeaponUpgradeState } from '../game/types';

interface Props {
  campaign: CampaignState;
  characterId: CharacterId;
  audio: HorrorAudioEngine | null;
  onUpdateCampaign: (next: CampaignState) => void;
  onClose: () => void;
}

export const WorkbenchModal: React.FC<Props> = ({
  campaign,
  characterId,
  audio,
  onUpdateCampaign,
  onClose,
}) => {
  const charDef = CHARACTERS[characterId];
  const primaryId = charDef.primaryWeapon;
  const activeWeapons: WeaponId[] = [primaryId, campaign.equippedSecondary || 'pistol'];

  const commit = (next: CampaignState) => {
    saveCampaignState(next);
    onUpdateCampaign(next);
  };

  const upgradeStat = (weaponId: WeaponId, field: keyof WeaponUpgradeState) => {
    const current = campaign.weaponUpgrades[weaponId] ?? {
      damageLevel: 0,
      capacityLevel: 0,
      handlingLevel: 0,
    };
    const lvl = current[field];
    if (lvl >= 3) return;
    const cost = getUpgradeCost(lvl);
    if (campaign.salvageCores < cost) return;
    audio?.playPuzzleSolve();
    const next: CampaignState = {
      ...campaign,
      salvageCores: campaign.salvageCores - cost,
      weaponUpgrades: {
        ...campaign.weaponUpgrades,
        [weaponId]: {
          ...current,
          [field]: lvl + 1,
        },
      },
    };
    commit(next);
  };

  const unlockOrEquipSecondary = (wId: WeaponId) => {
    const unlocked = campaign.unlockedWeapons.includes(wId);
    const cost = WEAPONS[wId].unlockCost ?? 0;
    if (!unlocked) {
      if (campaign.salvageCores < cost) return;
      audio?.playPuzzleSolve();
      commit({
        ...campaign,
        salvageCores: campaign.salvageCores - cost,
        unlockedWeapons: [...campaign.unlockedWeapons, wId],
        equippedSecondary: wId,
      });
    } else {
      audio?.playClick(true);
      commit({
        ...campaign,
        equippedSecondary: wId,
      });
    }
  };

  const craftMedkit = () => {
    if (campaign.salvageCores < 1) return;
    audio?.playClick(true);
    commit({
      ...campaign,
      salvageCores: campaign.salvageCores - 1,
      medkits: campaign.medkits + 1,
    });
  };

  const synthesizeAmmo = () => {
    if (campaign.salvageCores < 1) return;
    audio?.playReload();
    const nextAmmo = { ...campaign.weaponAmmo };
    activeWeapons.forEach((wId) => {
      const def = getUpgradedWeaponStats(wId, campaign.weaponUpgrades[wId]);
      const cur = nextAmmo[wId] ?? { mag: def.magSize, reserve: Math.floor(def.reserveMax * 0.75) };
      nextAmmo[wId] = {
        mag: def.magSize,
        reserve: Math.min(def.reserveMax, cur.reserve + def.magSize * 2),
      };
    });
    commit({
      ...campaign,
      salvageCores: campaign.salvageCores - 1,
      weaponAmmo: nextAmmo,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/88 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#090b10] border border-zinc-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono-tech text-amber-400">
              <Wrench className="w-4 h-4" />
              <span>FIELD ARMORY WORKBENCH · OPERATIVE {charDef.callsign}</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-wider text-zinc-100 mt-0.5">
              WEAPONS & HARDWARE SYNTHESIS
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#120e07] border border-amber-500/60 px-4 py-1.5 font-mono-tech text-xs text-amber-300 tabular-nums">
              SALVAGE CORES: <span className="text-base font-bold">{campaign.salvageCores}</span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-2 border border-zinc-700 hover:border-red-500 text-xs font-mono-tech text-zinc-200 flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>CLOSE</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Field Crafting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-zinc-800 bg-[#0d1017] p-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-display font-bold text-zinc-100">
                  <HeartPulse className="w-4 h-4 text-emerald-400" />
                  <span>SYNTHESIZE MEDKIT</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Current Stock: <span className="text-zinc-200 font-mono-tech">{campaign.medkits}</span> (+35 HP each)
                </p>
              </div>
              <button
                disabled={campaign.salvageCores < 1}
                onClick={craftMedkit}
                className={`px-4 py-2 font-mono-tech text-xs font-semibold border ${
                  campaign.salvageCores >= 1
                    ? 'bg-emerald-900/60 hover:bg-emerald-800 border-emerald-500 text-emerald-100 cursor-pointer'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                CRAFT (1 CORE)
              </button>
            </div>

            <div className="border border-zinc-800 bg-[#0d1017] p-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-display font-bold text-zinc-100">
                  <PackagePlus className="w-4 h-4 text-amber-400" />
                  <span>REFILL MAGAZINES</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Restores +2 full magazines to Primary & Secondary weapons.
                </p>
              </div>
              <button
                disabled={campaign.salvageCores < 1}
                onClick={synthesizeAmmo}
                className={`px-4 py-2 font-mono-tech text-xs font-semibold border ${
                  campaign.salvageCores >= 1
                    ? 'bg-amber-900/60 hover:bg-amber-800 border-amber-500 text-amber-100 cursor-pointer'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                }`}
              >
                RESTOCK (1 CORE)
              </button>
            </div>
          </div>

          {/* Unlock & Equip Secondary Weapons */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono-tech tracking-widest text-zinc-400">
              SECONDARY WEAPON HARDWARE
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SECONDARY_WEAPON_IDS.map((wId) => {
                const base = WEAPONS[wId];
                const unlocked = campaign.unlockedWeapons.includes(wId);
                const equipped = campaign.equippedSecondary === wId;
                const cost = base.unlockCost ?? 0;
                return (
                  <div
                    key={wId}
                    className={`border p-4 flex flex-col justify-between space-y-3 ${
                      equipped
                        ? 'border-amber-500 bg-[#14110b]'
                        : 'border-zinc-800 bg-[#0d1017]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono-tech">
                        <span className="text-zinc-400">{base.category}</span>
                        {equipped && <span className="text-amber-400 font-bold">EQUIPPED</span>}
                      </div>
                      <div className="font-display font-bold text-base text-zinc-100 mt-0.5">
                        {base.name}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {base.description}
                      </p>
                      <div className="text-[11px] font-mono-tech text-zinc-300 mt-2 tabular-nums">
                        DMG {base.damage}
                        {base.pellets ? `×${base.pellets}` : ''} · MAG {base.magSize}
                      </div>
                    </div>

                    <button
                      disabled={!unlocked && campaign.salvageCores < cost}
                      onClick={() => unlockOrEquipSecondary(wId)}
                      className={`w-full py-2 px-3 text-xs font-mono-tech font-semibold flex items-center justify-center gap-1.5 border ${
                        equipped
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300 cursor-default'
                          : unlocked
                            ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-zinc-100 cursor-pointer'
                            : campaign.salvageCores >= cost
                              ? 'bg-red-800 hover:bg-red-700 border-red-500 text-white cursor-pointer'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      {equipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>ACTIVE IN SLOT 2</span>
                        </>
                      ) : unlocked ? (
                        <>
                          <Crosshair className="w-3.5 h-3.5" />
                          <span>EQUIP IN SLOT 2</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>UNLOCK ({cost} CORES)</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upgrade Active Weapons */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono-tech tracking-widest text-zinc-400">
              ACTIVE LOADOUT UPGRADES (LV 0 → LV 3)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeWeapons.map((wId, slotIdx) => {
                const upg = campaign.weaponUpgrades[wId] ?? {
                  damageLevel: 0,
                  capacityLevel: 0,
                  handlingLevel: 0,
                };
                const eff = getUpgradedWeaponStats(wId, upg);
                const tracks: {
                  key: keyof WeaponUpgradeState;
                  label: string;
                  valText: string;
                  lvl: number;
                }[] = [
                  {
                    key: 'damageLevel',
                    label: 'BARREL / OUTPUT',
                    valText: `DMG ${eff.damage}${eff.pellets ? `×${eff.pellets}` : ''}`,
                    lvl: upg.damageLevel,
                  },
                  {
                    key: 'capacityLevel',
                    label: 'MAGAZINE FEED',
                    valText: `MAG ${eff.magSize} / MAX ${eff.reserveMax}`,
                    lvl: upg.capacityLevel,
                  },
                  {
                    key: 'handlingLevel',
                    label: 'RECOIL & RELOAD',
                    valText: `RELOAD ${eff.reloadTime}s`,
                    lvl: upg.handlingLevel,
                  },
                ];

                return (
                  <div key={wId} className="border border-zinc-800 bg-[#0d1017] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div>
                        <div className="text-[11px] font-mono-tech text-red-400">
                          SLOT {slotIdx + 1} · {eff.category}
                        </div>
                        <div className="font-display text-lg font-bold text-zinc-100">
                          {eff.name}
                        </div>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                    </div>

                    <div className="space-y-2.5 tabular-nums">
                      {tracks.map((tr) => {
                        const cost = getUpgradeCost(tr.lvl);
                        const maxed = tr.lvl >= 3;
                        const canBuy = !maxed && campaign.salvageCores >= cost;
                        return (
                          <div
                            key={tr.key}
                            className="flex items-center justify-between bg-[#080a0e] border border-zinc-800 px-3 py-2"
                          >
                            <div>
                              <div className="text-xs font-mono-tech text-zinc-200">
                                {tr.label} · LV {tr.lvl}/3
                              </div>
                              <div className="text-[11px] font-mono-tech text-sky-400">
                                {tr.valText}
                              </div>
                            </div>
                            <button
                              disabled={!canBuy}
                              onClick={() => upgradeStat(wId, tr.key)}
                              className={`px-3 py-1.5 text-[11px] font-mono-tech font-semibold border ${
                                maxed
                                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 cursor-default'
                                  : canBuy
                                    ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-black cursor-pointer'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                              }`}
                            >
                              {maxed ? 'MAXED' : `UPGRADE (${cost})`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
