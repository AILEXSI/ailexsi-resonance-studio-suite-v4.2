/**
 * Visualz engine pattern (createVisualEngine + registry), mirrored into Studio.
 * Host owns the rAF loop; export calls renderVisualizerScene once per frame.
 */
import type { AudioFeatures, Scene, SceneParams } from "./types";
import { DEFAULT_VIZ_SCENE } from "./types";
import { builtinScenes } from "./scenes";

const registry = new Map<string, Scene>();
for (const s of builtinScenes) registry.set(s.id, s);

const SHORT_NAMES: Record<string, string> = {
  "resonance-wave": "Wave",
  "spectrum-bars": "Bars",
  "pulse-orb": "Orb",
  "particle-field": "Dust",
  "tunnel-spiral": "Tunnel",
  "lita-bloom": "Bloom",
};

export function listVisualizerScenes(): Array<{
  id: string;
  name: string;
  short: string;
  description?: string;
}> {
  return builtinScenes.map((s) => ({
    id: s.id,
    name: s.name,
    short: SHORT_NAMES[s.id] || s.name,
    description: s.description,
  }));
}

export function visualizerSceneShortName(id: string | undefined): string {
  const scene = getVisualizerScene(id);
  return SHORT_NAMES[scene.id] || scene.name;
}

export function nextVisualizerSceneId(current: string | undefined): string {
  const list = builtinScenes;
  const i = list.findIndex((s) => s.id === (current || DEFAULT_VIZ_SCENE));
  return list[(i + 1) % list.length]!.id;
}

export function getVisualizerScene(id: string | undefined): Scene {
  return registry.get(id || DEFAULT_VIZ_SCENE) ?? registry.get(DEFAULT_VIZ_SCENE) ?? builtinScenes[0]!;
}

export function renderVisualizerScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sceneId: string | undefined,
  features: AudioFeatures,
  dt: number,
) {
  const scene = getVisualizerScene(sceneId);
  const params: SceneParams = { ...scene.defaultParams };
  ctx.fillStyle = (params.colorSecondary as string) || "#0a0a12";
  ctx.fillRect(0, 0, width, height);
  scene.render({ width, height, ctx }, features, params, dt);
}
