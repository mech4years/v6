/**
 * Shared lub-dub cardiac pulse envelope locked to FirstPersonGameEngine timestamps
 * and WebAudioEngine.playHeartbeatPulse (lub at +0ms, dub at +145ms).
 */
export function computeLubDubPulse(
  nowMs: number,
  lastHeartbeatAtMs: number,
  heartbeatBpm: number,
  heartbeatIntensity: number
): number {
  if (heartbeatIntensity <= 0.04) return 0;

  const beatPeriodMs = 60000 / Math.max(55, heartbeatBpm || 70);
  // Fall back to deterministic modulo phase if no beat timestamp yet
  const elapsedMs =
    lastHeartbeatAtMs > 0
      ? Math.max(0, (nowMs - lastHeartbeatAtMs) % beatPeriodMs)
      : nowMs % beatPeriodMs;

  // Primary "lub" peak centered near 35ms (matches 0..120ms audio envelope)
  const lub = Math.exp(-Math.pow((elapsedMs - 34) / 38, 2));
  // Secondary "dub" peak centered near 172ms (matches +145ms audio onset)
  const dub = 0.72 * Math.exp(-Math.pow((elapsedMs - 172) / 42, 2));

  const raw = Math.min(1, Math.max(lub, dub));
  return raw * Math.min(1, 0.25 + heartbeatIntensity * 0.85);
}
