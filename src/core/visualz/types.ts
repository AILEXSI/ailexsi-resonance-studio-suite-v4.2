/** Mirrored from ailexsi-visualz (read-only reference). Canvas 2D, no AGPL. */

export interface AudioFeatures {
  timeMs: number;
  rms: number;
  bass: number;
  mid: number;
  treble: number;
  spectrum: Float32Array;
  onset: boolean;
  beatPulse: number;
  tempoBpm?: number | null;
}

export interface SceneParams {
  intensity: number;
  colorPrimary: string;
  colorSecondary: string;
  speed: number;
  complexity: number;
  [key: string]: number | string | boolean;
}

export interface SceneContext {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
}

export interface Scene {
  id: string;
  name: string;
  description?: string;
  defaultParams: SceneParams;
  render(
    context: SceneContext,
    features: AudioFeatures,
    params: SceneParams,
    dt: number,
  ): void;
  onEnter?(context: SceneContext, params: SceneParams): void;
  onExit?(): void;
}

export const DEFAULT_VIZ_SCENE = "resonance-wave";
