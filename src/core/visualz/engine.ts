/**
 * Visualz engine pattern (createVisualEngine + registry), mirrored into Studio.
 * Host owns the rAF loop; export calls renderVisualizerScene once per frame.
 */
import type { AudioFeatures, Scene, SceneParams } from "./types";
import { DEFAULT_VIZ_SCENE } from "./types";
import { builtinScenes } from "./scenes";

const registry = new Map<string, Scene>();
for (const s of builtinScenes) registry.set(s.id, s);

export function listVisualizerScenes(): Array<{ id: string; name: string; description?: string }> {
  return builtinScenes.map((s) => ({ id: s.id, name: s.name, description: s.description }));
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
