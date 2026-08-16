import type { AudioFeatures } from "./types";
import { visualizerEnergyAt } from "../ai-visualizer";

const BINS = 64;

function syntheticSpectrum(energy: number, tMs: number): Float32Array {
  const spec = new Float32Array(BINS);
  for (let i = 0; i < BINS; i++) {
    const tilt = 1 - i / BINS;
    spec[i] = Math.min(1, energy * (0.35 + tilt * 0.8) * (0.55 + 0.45 * Math.abs(Math.sin(tMs / 180 + i * 0.18))));
  }
  return spec;
}

/** Offline / export: beat grid + energy proxy. */
export function featuresFromTimeline(tMs: number, beatsMs: number[], liveEnergy = 0): AudioFeatures {
  const energy = visualizerEnergyAt(tMs, beatsMs, liveEnergy);
  let nearest = Infinity;
  for (const b of beatsMs) {
    const d = Math.abs(b - tMs);
    if (d < nearest) nearest = d;
  }
  const onset = nearest < 40;
  return {
    timeMs: tMs,
    rms: energy,
    bass: Math.min(1, energy * 1.1),
    mid: energy * 0.75,
    treble: energy * 0.45,
    spectrum: syntheticSpectrum(energy, tMs),
    onset,
    beatPulse: energy,
    tempoBpm: null,
  };
}

/** Live: Web Audio analyser + beat grid pulse. */
export function featuresFromAnalyser(
  analyser: AnalyserNode | null,
  tMs: number,
  beatsMs: number[],
  liveEnergy = 0,
): AudioFeatures {
  const base = featuresFromTimeline(tMs, beatsMs, liveEnergy);
  if (!analyser) return base;

  const freq = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freq);
  const n = Math.min(BINS, freq.length);
  const spectrum = new Float32Array(BINS);
  for (let i = 0; i < BINS; i++) {
    const src = Math.floor((i / BINS) * Math.max(1, freq.length));
    spectrum[i] = (freq[Math.min(src, freq.length - 1)] ?? 0) / 255;
  }
  const avg = (a: number, b: number) => {
    let s = 0;
    const start = Math.floor((a / BINS) * n);
    const end = Math.max(start + 1, Math.floor((b / BINS) * n));
    for (let i = start; i < end; i++) s += spectrum[i] ?? 0;
    return s / Math.max(1, end - start);
  };
  const bass = avg(0, 8);
  const mid = avg(8, 24);
  const treble = avg(24, 64);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += spectrum[i] ?? 0;
  const rms = Math.min(1, Math.max(base.rms, (sum / n) * 1.4, liveEnergy));
  return {
    ...base,
    rms,
    bass: Math.max(base.bass, bass),
    mid: Math.max(base.mid, mid),
    treble: Math.max(base.treble, treble),
    spectrum,
    onset: base.onset || rms - liveEnergy > 0.18,
  };
}
