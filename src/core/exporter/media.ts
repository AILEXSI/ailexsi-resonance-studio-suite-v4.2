const videoCache = new Map<string, HTMLVideoElement>();
const audioCache = new Map<string, AudioBuffer>();
const presentedAt = new WeakMap<HTMLVideoElement, number>();

const FRAME_EPS = 1 / 120;
const SEEK_TIMEOUT_MS = 1500;
const PRESENT_TIMEOUT_MS = 80;

export function isPlayableSource(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("missing:")) return false;
  const lower = url.slice(0, 16).toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return false;
  }
  return (
    url.startsWith("blob:") ||
    url.startsWith("file:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
}

export async function loadVideo(src: string): Promise<HTMLVideoElement> {
  if (!isPlayableSource(src)) throw new Error("Blocked non-local media source");
  const cached = videoCache.get(src);
  if (cached && cached.readyState >= 2) return cached;
  const el = cached ?? document.createElement("video");
  el.muted = true;
  el.playsInline = true;
  el.preload = "auto";
  el.crossOrigin = "anonymous";
  if (el.src !== src) el.src = src;
  videoCache.set(src, el);
  if (el.readyState >= 2) return el;
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => { cleanup(); reject(new Error("Video load timeout")); }, 8000);
    const onOk = () => { cleanup(); resolve(); };
    const onErr = () => { cleanup(); reject(new Error("Failed to load video")); };
    const cleanup = () => {
      window.clearTimeout(timer);
      el.removeEventListener("loadeddata", onOk);
      el.removeEventListener("error", onErr);
    };
    el.addEventListener("loadeddata", onOk);
    el.addEventListener("error", onErr);
    el.load();
  });
  return el;
}

/** Seek and wait until a frame is actually presented. Never treat timeout as a successful seek. */
export async function seekVideo(el: HTMLVideoElement, timeSec: number) {
  const cap = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : timeSec;
  const t = Math.max(0, Math.min(cap, timeSec));
  const lastPresented = presentedAt.get(el);
  if (
    lastPresented !== undefined &&
    Math.abs(lastPresented - t) < FRAME_EPS &&
    el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  ) {
    return;
  }

  if (Math.abs(el.currentTime - t) >= FRAME_EPS || el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        el.removeEventListener("seeked", done);
        el.removeEventListener("error", done);
        window.clearTimeout(timer);
        resolve();
      };
      el.addEventListener("seeked", done);
      el.addEventListener("error", done);
      const timer = window.setTimeout(done, SEEK_TIMEOUT_MS);
      el.currentTime = t;
    });
  }

  await waitForPresentedFrame(el);
  presentedAt.set(el, t);
}

function waitForPresentedFrame(el: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const rvfc = el.requestVideoFrameCallback?.bind(el);
    if (typeof rvfc === "function") {
      const id = rvfc(() => done());
      window.setTimeout(() => {
        try { el.cancelVideoFrameCallback?.(id); } catch { /* */ }
        done();
      }, PRESENT_TIMEOUT_MS);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => done()));
  });
}

export async function decodeAudio(src: string): Promise<AudioBuffer> {
  if (!isPlayableSource(src)) throw new Error("Blocked non-local audio source");
  const hit = audioCache.get(src);
  if (hit) return hit;
  const res = await fetch(src);
  if (!res.ok) throw new Error("Audio fetch failed");
  const buf = await res.arrayBuffer();
  const ctx = new OfflineAudioContext(2, 128, 48000);
  const decoded = await ctx.decodeAudioData(buf.slice(0));
  audioCache.set(src, decoded);
  return decoded;
}

export function clearMediaCache() {
  for (const v of videoCache.values()) {
    try { v.pause(); v.removeAttribute("src"); v.load(); } catch { /* */ }
  }
  videoCache.clear();
  audioCache.clear();
}
