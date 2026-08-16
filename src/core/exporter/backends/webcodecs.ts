/**
 * Browser H.264/AAC MP4 via WebCodecs + Mediabunny.
 * AAC probed; fallback video-only MP4. Timeouts, abort, ftyp check.
 */
import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  QUALITY_MEDIUM,
  Quality,
  canEncodeAudio,
  canEncodeVideo,
} from "mediabunny";
import { clearMediaCache, decodeAudio, isPlayableSource, loadVideo, seekVideo } from "../media";
import {
  clearFrameSources,
  drawContain,
  getDecoder,
  isImageClip,
  loadStillImage,
  sourceTimeSec,
} from "../frame-source";
import { planTimeline } from "../planner";
import type { ExportClip, ExportHooks, ExportJob, ExportResult } from "../types";

let h264Probe: boolean | null = null;

export type AacConfig = {
  sampleRate: number;
  channels: number;
  useQuality?: boolean;
  bitrate?: number;
};

export function canUseWebCodecs(): boolean {
  return (
    typeof VideoEncoder !== "undefined" &&
    typeof VideoFrame !== "undefined" &&
    typeof OffscreenCanvas !== "undefined"
  );
}

export async function probeH264(): Promise<boolean> {
  if (h264Probe !== null) return h264Probe;
  try {
    h264Probe = await canEncodeVideo("avc", { width: 1280, height: 720 });
  } catch {
    h264Probe = canUseWebCodecs();
  }
  return h264Probe;
}

export async function probeAac(): Promise<AacConfig | null> {
  const candidates: AacConfig[] = [
    { sampleRate: 44100, channels: 2, useQuality: true },
    { sampleRate: 48000, channels: 2, useQuality: true },
    { sampleRate: 44100, channels: 2, bitrate: 128_000 },
    { sampleRate: 48000, channels: 2, bitrate: 128_000 },
    { sampleRate: 44100, channels: 1, bitrate: 96_000 },
  ];
  for (const c of candidates) {
    try {
      const ok = await canEncodeAudio("aac", {
        numberOfChannels: c.channels,
        sampleRate: c.sampleRate,
        ...(c.useQuality ? { quality: QUALITY_MEDIUM } : { bitrate: c.bitrate }),
      });
      if (ok) return c;
    } catch {
      /* next */
    }
  }
  return null;
}

function parseBitrateBps(raw?: string): number | null {
  if (!raw) return null;
  const m = String(raw).trim().match(/^(\d+(?:\.\d+)?)\s*([kKmMgG])?$/);
  if (!m) return null;
  const n = Number(m[1]);
  const u = (m[2] || "").toUpperCase();
  const mul = u === "G" ? 1e9 : u === "M" ? 1e6 : u === "K" ? 1e3 : 1;
  const bps = n * mul;
  if (!Number.isFinite(bps) || bps < 100_000 || bps > 80_000_000) return null;
  return Math.round(bps);
}

function resolveVideoQuality(bitrate?: string) {
  const bps = parseBitrateBps(bitrate);
  if (bps) {
    try {
      return new Quality({ bitrate: bps });
    } catch {
      /* QUALITY_HIGH */
    }
  }
  return QUALITY_HIGH;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

function isValidMp4(data: ArrayBuffer | Uint8Array): boolean {
  const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (u8.byteLength < 16) return false;
  const tag = String.fromCharCode(u8[4]!, u8[5]!, u8[6]!, u8[7]!);
  return tag === "ftyp";
}

export async function exportWithWebCodecs(
  job: ExportJob,
  hooks: ExportHooks = {},
): Promise<ExportResult> {
  try {
    return await renderMp4(job, hooks, job.options.includeAudio !== false);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/aac|mp4a|audio|encoder configuration/i.test(msg) && job.options.includeAudio !== false) {
      hooks.onProgress?.({ percent: 8, stage: "Retrying without audio" });
      return await renderMp4(job, hooks, false);
    }
    throw e;
  }
}

async function renderMp4(
  job: ExportJob,
  hooks: ExportHooks,
  wantAudio: boolean,
): Promise<ExportResult> {
  const { onProgress, signal } = hooks;
  const plan = planTimeline(job);
  const throwIfAborted = () => {
    if (signal?.aborted) throw new Error("Export cancelled");
  };

  onProgress?.({ percent: 2, stage: "Planning timeline" });
  if (plan.durationMs < 80) return fail(job, "Timeline too short to export");

  const ok = await probeH264();
  if (!ok) return fail(job, "H.264 encoder not available in this browser");

  onProgress?.({ percent: 6, stage: "Preparing H.264 encoder" });

  const canvas = document.createElement("canvas");
  canvas.width = plan.width % 2 === 0 ? plan.width : plan.width + 1;
  canvas.height = plan.height % 2 === 0 ? plan.height : plan.height + 1;
  // desynchronized:true can capture a stale canvas and drop frames in the MP4
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: false });
  if (!ctx) return fail(job, "Canvas 2D not available");

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target,
  });

  const videoSource = new CanvasSource(canvas, {
    codec: "avc",
    quality: resolveVideoQuality(job.options.videoBitrate),
    keyFrameInterval: 0.5,
    latencyMode: "quality",
    sizeChangeBehavior: "contain",
  });
  output.addVideoTrack(videoSource, { frameRate: plan.fps });

  const aac = wantAudio ? await probeAac() : null;
  let mixedAudio: AudioBuffer | null = null;
  if (aac) {
    onProgress?.({ percent: 10, stage: "Mixing audio" });
    mixedAudio = await mixAudio(job, plan.durationMs, aac, signal);
  }

  if (mixedAudio && aac) {
    const audioSource = new AudioBufferSource({
      codec: "aac",
      ...(aac.useQuality
        ? { quality: QUALITY_MEDIUM }
        : { bitrate: aac.bitrate ?? 128_000 }),
    });
    output.addAudioTrack(audioSource);
    await output.start();
    await audioSource.add(mixedAudio);
  } else {
    await output.start();
  }

  const frameDur = 1 / plan.fps;
  const total = plan.frameCount;
  const budget = Math.max(40_000, plan.durationMs * 10 + 20_000);

  const report = (i: number) => {
    if (i % 6 === 0 || i === total - 1) {
      onProgress?.({
        percent: Math.min(92, 14 + Math.round((i / Math.max(1, total)) * 78)),
        stage: "Encoding H.264",
        currentTimeMs: (i / plan.fps) * 1000,
      });
    }
  };

  try {
    await withTimeout(
      (async () => {
        const runs = groupFrameRuns(job, total, plan.fps);
        let lastEl: HTMLVideoElement | null = null;
        for (const run of runs) {
          throwIfAborted();
          lastEl = await encodeRun(
            run,
            {
              ctx,
              canvas,
              videoSource,
              frameDur,
              fps: plan.fps,
              throwIfAborted,
              report,
            },
            lastEl,
          );
        }
      })(),
      budget,
      "H.264 encode",
    );
    onProgress?.({ percent: 94, stage: "Muxing MP4" });
    await withTimeout(output.finalize(), 12_000, "MP4 mux");
  } catch (e) {
    try { await withTimeout(output.finalize(), 2_000, "mux abort"); } catch { /* */ }
    clearFrameSources();
    clearMediaCache();
    if (signal?.aborted) return fail(job, "Export cancelled");
    throw e;
  }

  clearFrameSources();
  clearMediaCache();
  const buffer = target.buffer;
  if (!buffer || buffer.byteLength < 800) return fail(job, "Encoder produced an empty file");
  if (!isValidMp4(buffer)) return fail(job, "Encoder did not produce a valid MP4 (ftyp missing)");

  const blob = new Blob([buffer], { type: "video/mp4" });
  onProgress?.({ percent: 100, stage: "Done" });
  return {
    outputPath: job.options.outputPath || "export.mp4",
    durationMs: plan.durationMs,
    fileSizeBytes: blob.size,
    success: true,
    blob,
    backend: "webcodecs",
  };
}

type FrameRun = {
  clip: ExportClip | null;
  startIndex: number;
  count: number;
};

type EncodeCtx = {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  videoSource: { add: (timestamp: number, duration?: number) => Promise<void> };
  frameDur: number;
  fps: number;
  throwIfAborted: () => void;
  report: (frameIndex: number) => void;
};

function topVideoAt(job: ExportJob, tMs: number): ExportClip | null {
  const videos = job.timeline.tracks.filter((t) => t.kind === "VIDEO");
  for (let i = videos.length - 1; i >= 0; i--) {
    const found = videos[i]!.clips.find((c) => tMs >= c.startMs && tMs < c.endMs);
    if (found) return found;
  }
  return null;
}

function groupFrameRuns(job: ExportJob, total: number, fps: number): FrameRun[] {
  const runs: FrameRun[] = [];
  let current: FrameRun | null = null;
  for (let i = 0; i < total; i++) {
    const clip = topVideoAt(job, (i / fps) * 1000);
    const id = clip?.id ?? "";
    if (current && (current.clip?.id ?? "") === id) {
      current.count++;
    } else {
      current = { clip, startIndex: i, count: 1 };
      runs.push(current);
    }
  }
  return runs;
}

function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.fillStyle = "#050608";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

async function addFrame(env: EncodeCtx, frameIndex: number) {
  await env.videoSource.add(frameIndex * env.frameDur, env.frameDur);
  env.report(frameIndex);
  if (frameIndex % 4 === 0) await new Promise((r) => setTimeout(r, 0));
}

async function encodeRun(
  run: FrameRun,
  env: EncodeCtx,
  lastEl: HTMLVideoElement | null,
): Promise<HTMLVideoElement | null> {
  const { ctx, canvas, fps } = env;
  const clip = run.clip;
  if (!clip || !isPlayableSource(clip.sourcePath)) {
    clearCanvas(ctx, canvas);
    for (let k = 0; k < run.count; k++) {
      env.throwIfAborted();
      await addFrame(env, run.startIndex + k);
    }
    return lastEl;
  }

  if (isImageClip(clip)) {
    clearCanvas(ctx, canvas);
    const img = await loadStillImage(clip.sourcePath);
    if (img && img.naturalWidth > 1) {
      drawContain(ctx, canvas, img.naturalWidth, img.naturalHeight, (dx, dy, dw, dh) => {
        ctx.drawImage(img, dx, dy, dw, dh);
      });
    }
    for (let k = 0; k < run.count; k++) {
      env.throwIfAborted();
      await addFrame(env, run.startIndex + k);
    }
    return lastEl;
  }

  const timestamps = Array.from({ length: run.count }, (_, k) =>
    sourceTimeSec(clip, ((run.startIndex + k) / fps) * 1000, fps),
  );

  const decoded = await getDecoder(clip.sourcePath);
  if (decoded) {
    let k = 0;
    try {
      for await (const sample of decoded.sink.samplesAtTimestamps(timestamps)) {
        env.throwIfAborted();
        clearCanvas(ctx, canvas);
        if (sample) {
          sample.drawWithFit(ctx, { fit: "contain" });
          sample.close();
        } else {
          lastEl = await paintHtmlVideo(ctx, canvas, clip, timestamps[k] ?? 0, lastEl);
        }
        await addFrame(env, run.startIndex + k);
        k++;
      }
    } catch (e) {
      console.warn("[export] decoder run failed, falling back", e);
    }
    while (k < run.count) {
      env.throwIfAborted();
      lastEl = await paintHtmlVideo(ctx, canvas, clip, timestamps[k]!, lastEl);
      await addFrame(env, run.startIndex + k);
      k++;
    }
    return lastEl;
  }

  for (let k = 0; k < run.count; k++) {
    env.throwIfAborted();
    lastEl = await paintHtmlVideo(ctx, canvas, clip, timestamps[k]!, lastEl);
    await addFrame(env, run.startIndex + k);
  }
  return lastEl;
}

async function paintHtmlVideo(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  clip: ExportClip,
  targetSec: number,
  lastEl: HTMLVideoElement | null,
): Promise<HTMLVideoElement | null> {
  clearCanvas(ctx, canvas);
  try {
    const el = await loadVideo(clip.sourcePath);
    await seekVideo(el, targetSec);
    if (el.videoWidth < 2) return el;
    drawContain(ctx, canvas, el.videoWidth, el.videoHeight, (dx, dy, dw, dh) => {
      ctx.drawImage(el, dx, dy, dw, dh);
    });
    return el;
  } catch {
    return lastEl;
  }
}

async function mixAudio(
  job: ExportJob,
  durationMs: number,
  aac: AacConfig,
  signal?: AbortSignal,
): Promise<AudioBuffer | null> {
  const sampleRate = aac.sampleRate;
  const channels = aac.channels;
  const length = Math.max(1, Math.ceil((durationMs / 1000) * sampleRate));
  const ctx = new OfflineAudioContext(channels, length, sampleRate);
  const audioClips = job.timeline.tracks.filter((t) => t.kind === "AUDIO").flatMap((t) => t.clips);
  const clips: ExportClip[] =
    audioClips.length > 0
      ? audioClips
      : job.timeline.tracks.filter((t) => t.kind === "VIDEO").flatMap((t) => t.clips);
  let added = 0;
  for (const clip of clips) {
    if (signal?.aborted) throw new Error("Export cancelled");
    if (!isPlayableSource(clip.sourcePath)) continue;
    try {
      const decoded = await decodeAudio(clip.sourcePath);
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      src.connect(ctx.destination);
      src.start(
        Math.max(0, clip.startMs / 1000),
        (clip.sourceInMs ?? 0) / 1000,
        Math.max(0.01, (clip.endMs - clip.startMs) / 1000),
      );
      added++;
    } catch { /* skip */ }
  }
  if (!added) return null;
  return ctx.startRendering();
}

function fail(job: ExportJob, error: string): ExportResult {
  return {
    outputPath: job.options.outputPath,
    durationMs: job.timeline.durationMs,
    fileSizeBytes: 0,
    success: false,
    error,
    backend: "webcodecs",
  };
}
