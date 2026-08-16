/**
 * Frame-accurate source frames for export.
 * HTMLVideoElement.currentTime seeks snap to keyframes — that is what made
 * exported MP4s stutter (same picture for a GOP, then a jump). Decode with
 * Mediabunny + WebCodecs instead; keep HTML video only as a last resort.
 */
import {
  ALL_FORMATS,
  BlobSource,
  Input,
  UrlSource,
  VideoSampleSink,
} from "mediabunny";
import type { ExportClip } from "./types";
import { isPlayableSource } from "./media";

export type OpenedDecoder = {
  input: Input;
  sink: VideoSampleSink;
};

const decoderCache = new Map<string, Promise<OpenedDecoder | null>>();
const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i;

export function isImageClip(clip: ExportClip): boolean {
  if (clip.sourceKind === "image") return true;
  return IMAGE_EXT.test(clip.sourcePath) || IMAGE_EXT.test(clip.label || "");
}

/** Source media time (seconds) at the center of an output frame. */
export function sourceTimeSec(clip: ExportClip, timelineMs: number, fps: number): number {
  const srcIn = clip.sourceInMs ?? 0;
  const offset = Math.max(0, timelineMs - clip.startMs);
  let srcMs = srcIn + offset + 500 / Math.max(1, fps);
  if (clip.sourceOutMs != null && clip.sourceOutMs > srcIn) {
    srcMs = Math.min(srcMs, clip.sourceOutMs - 1);
  }
  return Math.max(0, srcMs / 1000);
}

async function sourceForUrl(src: string) {
  if (src.startsWith("blob:") || src.startsWith("file:")) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to read media (${res.status})`);
    return new BlobSource(await res.blob());
  }
  return new UrlSource(src);
}

export function getDecoder(src: string): Promise<OpenedDecoder | null> {
  if (!isPlayableSource(src)) return Promise.resolve(null);
  const hit = decoderCache.get(src);
  if (hit) return hit;
  const opened = (async (): Promise<OpenedDecoder | null> => {
    try {
      const input = new Input({
        source: await sourceForUrl(src),
        formats: ALL_FORMATS,
      });
      const track = await input.getPrimaryVideoTrack();
      if (!track) {
        input.dispose();
        return null;
      }
      if (!(await track.canDecode())) {
        input.dispose();
        return null;
      }
      return {
        input,
        sink: new VideoSampleSink(track),
      };
    } catch (e) {
      console.warn("[frame-source] decoder unavailable, will fall back", e);
      return null;
    }
  })();
  decoderCache.set(src, opened);
  return opened;
}

export async function loadStillImage(src: string): Promise<HTMLImageElement | null> {
  if (!isPlayableSource(src)) return null;
  const hit = imageCache.get(src);
  if (hit) return hit;
  const loaded = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.decoding = "sync";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  imageCache.set(src, loaded);
  return loaded;
}

export function drawContain(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  srcW: number,
  srcH: number,
  draw: (dx: number, dy: number, dw: number, dh: number) => void,
) {
  if (srcW < 2 || srcH < 2) return;
  const scale = Math.min(canvas.width / srcW, canvas.height / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  draw((canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}

export function clearFrameSources() {
  for (const pending of decoderCache.values()) {
    void pending.then((opened) => {
      try {
        opened?.input.dispose();
      } catch {
        /* already gone */
      }
    });
  }
  decoderCache.clear();
  imageCache.clear();
}
