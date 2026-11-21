import React, { useState } from 'react';
import {
  CheckCircle2,
  Globe,
  Lock,
  Plus,
  RefreshCw,
   Shield,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { CHARACTERS, MISSIONS } from '../game/data';
import { CharacterId, GameSettings } from '../game/types';

interface Props {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  settings: GameSettings;
  onClose: () => void;
  onStartCoopMission: (missionId: string, charId: CharacterId) => void;
}

interface LobbiesItem {
  id: string;
  name: string;
  host: string;
  mode: 'Co-op Campaign' | 'Survival Horde';
  stage: string;
  players: number;
  maxPlayers: number;
  ping: number;
  isPrivate: boolean;
}

const MOCK_LOBBIES: LobbiesItem[] = [
  {
    id: 'lobby_01',
    name: 'Vanguard Breach Squad',
    host: 'RAVEN-01',
    mode: 'Co-op Campaign',
    stage: 'Ch. 01: The Fallen City',
    players: 2,
    maxPlayers: 2,
    ping: 28,
    isPrivate: false,
  },
  {
    id: 'lobby_02',
    name: 'Silent Recon Hunt',
    host: 'GHOST-04',
    mode: 'Co-op Campaign',
    stage: 'Ch. 03: The Dead Mall',
    players: 1,
    maxPlayers: 2,
    ping: 42,
    isPrivate: false,
  },
  {
    id: 'lobby_03',
    name: 'Iron Wilds Siege Hold',
    host: 'BRUTE-99',
    mode: 'Survival Horde',
    stage: 'Crucible Arena',
    players: 2,
    maxPlayers: 4,
    ping: 18,
    isPrivate: true,
  },
];

export const MultiplayerLobbyModal: React.FC<Props> = ({
  selectedCharacter,
  onSelectCharacter,
  settings,
  onClose,
  onStartCoopMission,
}) => {
  const [tab, setTab] = useState<'browse' | 'host' | 'character'>('browse');
  const [selectedMissionId, setSelectedMissionId] = useState<string>('mission_01');
  const [gameMode, setGameMode] = useState<'campaign' | 'survival'>('campaign');
  const [lobbyName, setLobbyName] = useState('New Eden Co-op Session');
  const [isPrivateLobby, setIsPrivateLobby] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    id: string;
    name: string;
    isHost: boolean;
    players: { name: string; ready: boolean; char: CharacterId }[];
  } | null>(null);

  const charDef = CHARACTERS[selectedCharacter];
  const mainMissions = MISSIONS.filter((m) => !m.isBonusArena);

  const handleCreateLobby = () => {
    setActiveSession({
      id: `session_${Date.now()}`,
      name: lobbyName,
      isHost: true,
      players: [
        { name: 'Operative (You)', ready: true, char: selectedCharacter },
        { name: 'Vanguard_AI_Ally', ready: true, char: 'ghost' },
      ],
    });
  };

  const handleJoinLobby = (lobby: LobbiesItem) => {
    setActiveSession({
      id: lobby.id,
      name: lobby.name,
      isHost: false,
      players: [
        { name: lobby.host, ready: true, char: 'raven' },
        { name: 'Operative (You)', ready: true, char: selectedCharacter },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-[#0b0d12] border border-zinc-800 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#080a0e]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tech text-red-500">
              <Users className="w-4 h-4" />
              <span>ONLINE MULTIPLAYER ARCHITECTURE (PART 1 & 2)</span>
            </div>
            <h2 className="font-display text-xl font-bold tracking-wider text-zinc-100 mt-0.5">
              COOPERATIVE LOBBY & MATCHMAKING HUB
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-zinc-700 hover:border-red-500 text-xs font-mono-tech text-zinc-200 flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>CLOSE</span>
          </button>
        </div>

        {activeSession ? (
          /* Active Lobby Room View */
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="border border-zinc-800 bg-[#080a0e] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono-tech text-amber-400">
                    {activeSession.isHost ? 'HOSTED SESSION' : 'JOINED SESSION'}
                  </span>
                  <h3 className="font-display text-xl font-bold text-zinc-100 mt-1">
                    {activeSession.name}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSession(null)}
                  className="px-4 py-2 bg-red-950/80 hover:bg-red-900 border border-red-700 text-xs font-mono-tech text-red-200 cursor-pointer"
                >
                  LEAVE SESSION
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                {activeSession.players.map((p, idx) => {
                  const pChar = CHARACTERS[p.char];
                  return (
                    <div key={idx} className="border border-zinc-800 bg-black/60 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded flex items-center justify-center font-display font-bold text-sm"
                          style={{ backgroundColor: pChar.trimColor, color: pChar.visorColor }}
                        >
                          {pChar.callsign.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-display font-semibold text-zinc-100">{p.name}</div>
                          <div className="text-xs font-mono-tech text-zinc-400">
                            {pChar.callsign} · {pChar.role}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.ready ? (
                          <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-600/80 text-[11px] font-mono-tech text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>READY</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-600/80 text-[11px] font-mono-tech text-amber-300">
                            WAITING
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeSession.isHost && (
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      onStartCoopMission(selectedMissionId, selectedCharacter);
                    }}
                    className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-display font-semibold tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>START CO-OP MISSION</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center gap-1 px-6 py-3 border-b border-zinc-800 bg-[#080a0e]">
              <button
                onClick={() => setTab('browse')}
                className={`px-4 py-2 text-xs font-mono-tech flex items-center gap-2 cursor-pointer transition-colors ${
                  tab === 'browse'
                    ? 'bg-red-950 text-red-200 border border-red-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>PUBLIC MATCHMAKING</span>
              </button>
              <button
                onClick={() => setTab('host')}
                className={`px-4 py-2 text-xs font-mono-tech flex items-center gap-2 cursor-pointer transition-colors ${
                  tab === 'host'
                    ? 'bg-red-950 text-red-200 border border-red-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>HOST PRIVATE LOBBY</span>
              </button>
              <button
                onClick={() => setTab('character')}
                className={`px-4 py-2 text-xs font-mono-tech flex items-center gap-2 cursor-pointer transition-colors ${
                  tab === 'character'
                    ? 'bg-red-950 text-red-200 border border-red-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>OPERATIVE LOADOUT ({charDef.callsign})</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {tab === 'browse' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono-tech text-zinc-400">
                      ACTIVE AUTHORITATIVE SESSIONS FOUND: {MOCK_LOBBIES.length}
                    </span>
                    <button
                      onClick={() => {}}
                      className="px-3 py-1.5 border border-zinc-700 hover:border-zinc-500 text-xs font-mono-tech text-zinc-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>REFRESH</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {MOCK_LOBBIES.map((lobby) => (
                      <div
                        key={lobby.id}
                        className="border border-zinc-800 bg-[#080a0e] p-4 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-zinc-100">{lobby.name}</span>
                            {lobby.isPrivate && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="text-xs font-mono-tech text-zinc-400">
                            HOST: {lobby.host} · {lobby.mode} · {lobby.stage}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono-tech text-xs">
                            <div className="text-zinc-300">
                              PLAYERS {lobby.players}/{lobby.maxPlayers}
                            </div>
                            <div className="text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                              <Wifi className="w-3 h-3" />
                              <span>{lobby.ping}ms</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleJoinLobby(lobby)}
                            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-display text-xs font-semibold tracking-wider cursor-pointer"
                          >
                            JOIN
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'host' && (
                <div className="max-w-xl space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-zinc-100">CREATE CO-OP SESSION</h3>
                    <p className="text-xs text-zinc-400">
                      Configure parameters for your authoritative multiplayer lobby.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-mono-tech text-zinc-300 mb-1">
                        LOBBY NAME
                      </label>
                      <input
                        type="text"
                        value={lobbyName}
                        onChange={(e) => setLobbyName(e.target.value)}
                        className="w-full bg-[#060709] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500 font-mono-tech"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono-tech text-zinc-300 mb-1">
                        GAME MODE
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setGameMode('campaign')}
                          className={`py-2.5 px-4 text-xs font-mono-tech border cursor-pointer ${
                            gameMode === 'campaign'
                              ? 'bg-red-950 border-red-600 text-red-200'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                          }`}
                        >
                          CO-OP CAMPAIGN
                        </button>
                        <button
                          onClick={() => setGameMode('survival')}
                          className={`py-2.5 px-4 text-xs font-mono-tech border cursor-pointer ${
                            gameMode === 'survival'
                              ? 'bg-red-950 border-red-600 text-red-200'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                          }`}
                        >
                          SURVIVAL HORDE
                        </button>
                      </div>
                    </div>

                    {gameMode === 'campaign' && (
                      <div>
                        <label className="block text-xs font-mono-tech text-zinc-300 mb-1">
                          SELECT STAGE
                        </label>
                        <select
                          value={selectedMissionId}
                          onChange={(e) => setSelectedMissionId(e.target.value)}
                          className="w-full bg-[#060709] border border-zinc-700 px-3 py-2 text-sm text-zinc-100 font-mono-tech focus:outline-none focus:border-red-500"
                        >
                          {mainMissions.map((m) => (
                            <option key={m.id} value={m.id}>
                              Ch. {String(m.number).padStart(2, '0')}: {m.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={handleCreateLobby}
                        className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-display font-semibold tracking-wider cursor-pointer"
                      >
                        HOST LOBBY & INVITE
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'character' && (
                <div className="space-y-4">
                  <div className="text-xs font-mono-tech text-zinc-400">
                    SELECT YOUR OPERATIVE CALLSIGN FOR MULTIPLAYER SYNCHRONISATION
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.values(CHARACTERS).map((c) => {
                      const isSelected = selectedCharacter === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => onSelectCharacter(c.id)}
                          className={`border p-4 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-red-950/50 border-red-600 text-zinc-100'
                              : 'bg-[#080a0e] border-zinc-800 text-zinc-300 hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-display font-bold text-base text-zinc-100">
                              {c.callsign}
                            </span>
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: c.visorColor }}
                            />
                          </div>
                          <div className="text-xs font-mono-tech text-red-400 mt-0.5">{c.role}</div>
                          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{c.bio}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
