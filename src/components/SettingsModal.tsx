import React from 'react';
import { X } from 'lucide-react';
import { Difficulty, GameSettings, GraphicsQuality } from '../game/types';

interface Props {
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ settings, onChange, onClose }) => {
  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0b0d12] border border-zinc-800 flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="font-display text-xl font-bold tracking-wider text-zinc-100">
            SYSTEM SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-zinc-700 hover:border-red-500 text-xs font-mono-tech text-zinc-200 flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>CLOSE</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-xs font-mono-tech text-zinc-400">DIFFICULTY</label>
            <div className="grid grid-cols-3 gap-2">
              {(['survivor', 'tactical', 'nightmare'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => update('difficulty', diff)}
                  className={`py-2 px-3 text-xs font-mono-tech uppercase border cursor-pointer transition-colors ${
                    settings.difficulty === diff
                      ? 'bg-red-950 border-red-600 text-red-200'
                      : 'bg-[#080a0e] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono-tech text-zinc-400">GRAPHICS QUALITY</label>
              <span className="text-[11px] font-mono-tech text-zinc-500 uppercase">
                SHADOWS · POST-FX · PARTICLES · LOD
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {(['low', 'medium', 'high', 'ultra', 'cinematic'] as GraphicsQuality[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => update('graphicsQuality', preset)}
                  className={`py-2 px-2 text-[11px] font-mono-tech uppercase border cursor-pointer transition-colors ${
                    settings.graphicsQuality === preset
                      ? 'bg-red-950 border-red-600 text-red-200'
                      : 'bg-[#080a0e] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Brightness / Exposure */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono-tech">
              <span className="text-zinc-400">SCENE BRIGHTNESS</span>
              <span className="text-zinc-200">{Math.round((settings.brightness ?? 1.0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={settings.brightness ?? 1.0}
              onChange={(e) => update('brightness', parseFloat(e.target.value))}
              className="w-full accent-red-600"
            />
          </div>

          {/* Mouse Sensitivity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono-tech">
              <span className="text-zinc-400">MOUSE SENSITIVITY</span>
              <span className="text-zinc-200">{settings.mouseSensitivity.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.05"
              value={settings.mouseSensitivity}
              onChange={(e) => update('mouseSensitivity', parseFloat(e.target.value))}
              className="w-full accent-red-600"
            />
          </div>

          {/* Field of View */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono-tech">
              <span className="text-zinc-400">FIELD OF VIEW</span>
              <span className="text-zinc-200">{settings.fov}°</span>
            </div>
            <input
              type="range"
              min="60"
              max="95"
              step="1"
              value={settings.fov}
              onChange={(e) => update('fov', parseInt(e.target.value, 10))}
              className="w-full accent-red-600"
            />
          </div>

          {/* Volumes */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono-tech">
                <span className="text-zinc-400">MASTER VOLUME</span>
                <span className="text-zinc-200">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => update('masterVolume', parseFloat(e.target.value))}
                className="w-full accent-red-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono-tech">
                <span className="text-zinc-400">SFX VOLUME</span>
                <span className="text-zinc-200">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => update('sfxVolume', parseFloat(e.target.value))}
                className="w-full accent-red-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono-tech">
                <span className="text-zinc-400">MUSIC & AMBIENCE VOLUME</span>
                <span className="text-zinc-200">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => update('musicVolume', parseFloat(e.target.value))}
                className="w-full accent-red-600"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-800">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-xs font-mono-tech text-zinc-300">INVERT Y AXIS</span>
              <input
                type="checkbox"
                checked={settings.invertY}
                onChange={(e) => update('invertY', e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-xs font-mono-tech text-zinc-300">SHOW TACTICAL MINIMAP</span>
              <input
                type="checkbox"
                checked={settings.showMinimap}
                onChange={(e) => update('showMinimap', e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-xs font-mono-tech text-zinc-300">MOBILE TOUCHSCREEN CONTROLS</span>
              <input
                type="checkbox"
                checked={settings.touchControls}
                onChange={(e) => update('touchControls', e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
            </label>
          </div>

          {/* Accessibility & Comfort */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-800">
            <div className="text-xs font-mono-tech text-zinc-400">ACCESSIBILITY &amp; COMFORT</div>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-xs font-mono-tech text-zinc-300">
                NAVIGATION ASSIST (WAYPOINT GUIDE)
              </span>
              <input
                type="checkbox"
                checked={settings.navigationAssist}
                onChange={(e) => update('navigationAssist', e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-xs font-mono-tech text-zinc-300">
                REDUCED CAMERA MOTION (NO HEAD-BOB)
              </span>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => update('reducedMotion', e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-xs font-mono-tech text-zinc-300">
                LARGE READABLE HUD TEXT
              </span>
              <input
                type="checkbox"
                checked={settings.largeHudText}
                onChange={(e) => update('largeHudText', e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
            </label>
          </div>

          {/* Cinematic Story & Subtitles */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-800">
            <div className="text-xs font-mono-tech text-zinc-400">CINEMATICS &amp; SUBTITLES</div>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-xs font-mono-tech text-zinc-300">
                DYNAMIC LEVEL OPENINGS (ON/OFF)
              </span>
              <input
                type="checkbox"
                checked={settings.cinematicIntros ?? true}
                onChange={(e) => update('cinematicIntros', e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
            </label>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-mono-tech text-zinc-300">
                SUBTITLE FONT SIZE
              </span>
              <div className="flex gap-1.5">
                {(['small', 'medium', 'large'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => update('subtitleSize', sz)}
                    className={`px-2.5 py-1 text-[11px] font-mono-tech uppercase border cursor-pointer ${
                      (settings.subtitleSize || 'medium') === sz
                        ? 'bg-red-950 border-red-600 text-red-200'
                        : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-mono-tech text-zinc-300">
                EDUCATION READER TEXT SIZE
              </span>
              <div className="flex gap-1.5">
                {(['small', 'medium', 'large', 'xlarge'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => update('eduTextSize', sz)}
                    className={`px-2 py-1 text-[11px] font-mono-tech uppercase border cursor-pointer ${
                      (settings.eduTextSize || 'medium') === sz
                        ? 'bg-sky-950 border-sky-500 text-sky-200'
                        : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {sz === 'xlarge' ? 'XL' : sz.slice(0, 1)}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-xs font-mono-tech text-zinc-300">
                EDUCATIONAL NARRATION VOICE
              </span>
              <input
                type="checkbox"
                checked={settings.narrationEnabled ?? true}
                onChange={(e) => update('narrationEnabled', e.target.checked)}
                className="w-4 h-4 accent-sky-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
