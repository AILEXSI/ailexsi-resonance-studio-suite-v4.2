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

export function drawVisualizerFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tMs: number,
  energy: number,
  beatsMs: number[],
) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(6, 8, 18, ${0.22 + energy * 0.28})`;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height) * 0.12;
  const radius = base + energy * Math.min(width, height) * 0.18;
  const hue = 210 + energy * 40;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${0.35 + energy * 0.55})`;
  ctx.lineWidth = 3 + energy * 8;
  ctx.stroke();

  const bars = 32;
  const barW = width / bars;
  for (let i = 0; i < bars; i++) {
    const phase = (tMs / 90 + i * 0.35) % (Math.PI * 2);
    const h = (0.12 + energy * 0.55) * height * (0.45 + 0.55 * Math.abs(Math.sin(phase)));
    ctx.fillStyle = `hsla(${200 + i * 2}, 85%, ${55 + energy * 20}%, ${0.25 + energy * 0.45})`;
    ctx.fillRect(i * barW + 1, height - h, Math.max(1, barW - 2), h);
  }

  for (const b of beatsMs) {
    if (Math.abs(b - tMs) < 70) {
      ctx.fillStyle = `rgba(255, 220, 120, ${0.12 + energy * 0.2})`;
      ctx.fillRect(0, 0, width, height);
      break;
    }
  }
  ctx.restore();
}
