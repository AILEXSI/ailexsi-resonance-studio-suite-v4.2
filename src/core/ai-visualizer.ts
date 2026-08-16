/**
 * Local beat-synchronous visual layer for the AI Visualizer track.
 * Preview + export share the same draw. No network, reversible via Mute / undo.
 */
import type { Project } from "./models";

export function collectBeatTimesMs(project: Project): number[] {
  const fromMarkers = project.markers
    .filter((m) => m.kind === "beat")
    .map((m) => m.timeMs);
  if (fromMarkers.length >= 2) return [...fromMarkers].sort((a, b) => a - b);

  for (const a of project.mediaAssets) {
    const beats = a.analysis?.beatPositionsMs;
    if (beats && beats.length >= 2) return [...beats].sort((a, b) => a - b);
  }

  const bpm = project.mediaAssets.find((a) => a.analysis?.bpm)?.analysis?.bpm ?? 120;
  const step = Math.max(200, Math.round(60_000 / bpm));
  const out: number[] = [];
  const end = Math.max(project.durationMs, step * 8);
  for (let t = 0; t <= end; t += step) out.push(t);
  return out;
}

export function visualizerEnergyAt(tMs: number, beatsMs: number[], liveEnergy = 0): number {
  let nearest = Infinity;
  for (const b of beatsMs) {
    const d = Math.abs(b - tMs);
    if (d < nearest) nearest = d;
  }
  const pulse = nearest < 90 ? 1 - nearest / 90 : 0;
  return Math.min(1, Math.max(liveEnergy, pulse));
}
