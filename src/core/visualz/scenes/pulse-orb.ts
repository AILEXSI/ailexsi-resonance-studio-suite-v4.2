import type { AudioFeatures, Scene, SceneContext, SceneParams } from "../types";
import { hexToRgba } from "../color";

export const pulseOrbScene: Scene = {
  id: "pulse-orb",
  name: "Pulse Orb",
  description: "Soft radial glow driven by bass + onset flash",
  defaultParams: {
    intensity: 0.75,
    colorPrimary: "#ff6b35",
    colorSecondary: "#0a0a12",
    speed: 1,
    complexity: 0.4,
  },
  render(ctxWrap: SceneContext, features: AudioFeatures, params: SceneParams) {
    const { ctx, width, height } = ctxWrap;
    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.18;
    const breath = 1 + features.bass * 0.55 * params.intensity;
    const flash = features.onset ? 1.35 : 1 + features.beatPulse * 0.45;
    const radius = baseRadius * breath * flash;

    for (let i = 4; i >= 1; i--) {
      const r = radius * (1 + i * 0.35);
      const alpha = (0.08 / i) * params.intensity * (0.6 + features.rms);
      const g = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, r);
      g.addColorStop(0, hexToRgba(params.colorPrimary as string, alpha * 1.5));
      g.addColorStop(1, hexToRgba(params.colorPrimary as string, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(0.25, params.colorPrimary as string);
    core.addColorStop(1, hexToRgba(params.colorPrimary as string, 0.15));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    if (features.beatPulse > 0.05) {
      ctx.strokeStyle = hexToRgba("#ffffff", features.beatPulse * 0.5);
      ctx.lineWidth = 2 + features.beatPulse * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * (1.15 + features.beatPulse * 0.3), 0, Math.PI * 2);
      ctx.stroke();
    }
  },
};
