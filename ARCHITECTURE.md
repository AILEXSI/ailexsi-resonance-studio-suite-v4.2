# Architecture — Resonance Studio Suite V4.2

**Version:** 4.2.0  
**Repo:** https://github.com/AILEXSI/ailexsi-resonance-studio-suite-v4.2

V4.01 (`ailexsi-resonance-studio`) is frozen and read-only.

## Intent

Efficient **local** multi-track timeline → **real MP4** (H.264 + AAC when possible).

Not a cloud renderer. Not ffmpeg.wasm as primary path. Not “WebM counts as done”.

## Milestone (reached)

MP4 export is solid: **smooth video + full-strength music**. Frames are decoded with Mediabunny / WebCodecs (not HTML `<video>` seeks). Audio is mixed in an `OfflineAudioContext` and encoded as AAC when the browser can do it.

## Layers

1. **UI / Timeline (`App.tsx`)**  
   Tracks V1/V2 (video), A1/A2 (audio), playhead, range (loop in/out), import, shortcuts. Logo shows **Suite V4.2** and `APP_VERSION` `4.2.0`.

2. **Persistence**  
   - Project JSON: `localStorage` via `project-store`  
   - Media binaries: IndexedDB via `media-store` (blob URLs at runtime)

3. **Export pipeline (`src/core/exporter`)**  
   - `jobFromProject` maps clips + asset URLs into an `ExportJob`  
   - `planTimeline` builds segments / frame count  
   - `frame-source` opens a Mediabunny `VideoSampleSink` and walks `samplesAtTimestamps` (GOP-accurate)  
   - Still images paint via `loadStillImage`  
   - `exportWithWebCodecs` encodes H.264, mixes audio → AAC, muxes MP4  
   - HTML `<video>` seek is **fallback only** if the decoder cannot open the file  
   - Watchdog in `exportTimeline` prevents hang-at-90%

4. **Desktop optional (`tauri-export`, `src-tauri`)**  
   Native window via `npm run tauri:dev`. Save dialog + system ffmpeg remux when needed. Browser builds still need `@tauri-apps/api` so Vite can resolve imports.

## Hard rules (do not break)

| Rule | Reason |
|------|--------|
| No silent WebM after plugin fail | User thought MP4 worked; got VP8 WebM |
| Cut = V only | C must stay free for Ctrl+C copy |
| Show `APP_VERSION` in logo | Detect partial applies; must be `4.2.0` |
| Pin Vite 5 + mediabunny | Major bumps broke installs |
| Kill only port 1421 | Other apps on machine |
| V4.2 folder only | Never write into a V4.01 tree |

## Data flow (export)

```
mediaAssets[].localPathOrUrl  (blob: / file: / http:)
        │
clips on VIDEO/AUDIO tracks (range + sourceRange)
        │
jobFromProject → ExportJob.timeline + options (1280x720@30, mp4)
        │
planTimeline → frameCount, segments, grouped clip runs
        │
per run: Mediabunny VideoSampleSink.samplesAtTimestamps
         → drawWithFit on canvas → CanvasSource.add
         stills: loadStillImage + contain-fit
audio: OfflineAudioContext mix (AUDIO tracks, else VIDEO sources) → AAC
        │
Mp4OutputFormat finalize → Blob → download / desktop save as .mp4
```

## Known limits (V4.2)

- After a full page reload, dead blob URLs may still need **Re-import** (IndexedDB hydration exists; mark `missing:` if the blob is gone)
- Long timelines: encode time ≈ duration × decode/encode factor; watchdog scales with duration
- MediaRecorder remains in `App.tsx` only when WebCodecs is **absent**; it must never look like success after a plugin failure
- AI command / Sensorics / dedicated AI video track are not in this host yet

## Resume checklist

1. Work in `%USERPROFILE%\ResonanceStudio-V4.2` (this repo)  
2. `npm install` (mediabunny + @tauri-apps/api + @tauri-apps/cli)  
3. `npm run dev` → logo **Suite V4.2** / **4.2.0**, shortcuts **V Cut · C free**  
4. Desktop: `npm run tauri:dev`  
5. Next features go here — never on the V4.01 repo
