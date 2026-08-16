import type { AudioFeatures, Scene, SceneContext, SceneParams } from "../types";

export const spectrumBarsScene: Scene = {
  id: "spectrum-bars",
  name: "Spectrum Bars",
  description: "Mirrored modern frequency bars",
  defaultParams: {
    intensity: 0.85,
    colorPrimary: "#00e5a8",
    colorSecondary: "#0a0a12",
    speed: 1,
    complexity: 0.6,
    barCount: 48,
  },
  render(ctxWrap: SceneContext, features: AudioFeatures, params: SceneParams) {
    const { ctx, width, height } = ctxWrap;
    const barCount = Math.max(16, Math.min(96, Number(params.barCount) || 48));
    const spectrum = features.spectrum;
    const midY = height / 2;
    const gap = 2;
    const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);

    for (let i = 0; i < barCount; i++) {
      const t = i / (barCount - 1);
      const idx = Math.floor(t * Math.max(0, spectrum.length - 1));
      const raw = spectrum.length ? spectrum[idx] ?? 0 : 0;
      const v = Math.pow(raw, 0.85) * params.intensity;
      const barH = v * (height * 0.42);
      const x = i * (barWidth + gap);
      const grad = ctx.createLinearGradient(x, midY - barH, x, midY + barH);
      grad.addColorStop(0, params.colorPrimary as string);
      grad.addColorStop(0.5, "#ffffff");
      grad.addColorStop(1, params.colorPrimary as string);
      ctx.fillStyle = grad;
      ctx.fillRect(x, midY - barH, barWidth, barH);
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x, midY, barWidth, barH);
      ctx.globalAlpha = 1;
    }

    if (features.onset || features.beatPulse > 0.2) {
      ctx.strokeStyle = `rgba(255,255,255,${0.15 + features.beatPulse * 0.4})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();
    }
  },
};
