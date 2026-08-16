# AILEXSI Resonance Studio Suite V4.2

Local-first multi-track video/audio editor (NLE).

**Brand:** AILEXSI Resonance Studio Suite V4.2  
**Version:** `4.2.0` (`package.json` + `APP_VERSION` in the logo)  
**Repo:** https://github.com/AILEXSI/ailexsi-resonance-studio-suite-v4.2  
**Local folder (Windows):** `%USERPROFILE%\ResonanceStudio-V4.2`  
**Dev server:** `http://localhost:1421`

V4.01 is a **frozen, read-only** baseline:  
https://github.com/AILEXSI/ailexsi-resonance-studio — do not modify or push there.

## Milestone

**MP4 export works.** Timeline → real H.264 MP4 with AAC when the encoder allows it: smooth picture and full-strength music. That is the only success path. WebM is never treated as a successful export.

## Quick start (Windows)

```powershell
git clone https://github.com/AILEXSI/ailexsi-resonance-studio-suite-v4.2.git
cd ailexsi-resonance-studio-suite-v4.2
# or: cd %USERPROFILE%\ResonanceStudio-V4.2
npm install
npm run dev
```

Open **http://localhost:1421** — logo must read **Suite V4.2** / **4.2.0**.

### Desktop (standalone)

Browser WebCodecs can fail on some machines. The desktop shell uses WebView2 plus system ffmpeg:

```powershell
cd %USERPROFILE%\ResonanceStudio-V4.2
npm run tauri:dev
```

Needs Rust, MSVC build tools, WebView2, and `ffmpeg` on PATH (`winget install Gyan.FFmpeg`). See `README-TAURI.md`.

### Required packages

| Package | Why |
|---------|-----|
| `mediabunny@1.54.0` | H.264/AAC MP4 via WebCodecs |
| `@tauri-apps/api@1.5.6` | Desktop path (Vite must resolve imports) |
| `vite@5.4.21` | Do **not** force-upgrade |

**Never run** `npm audit fix --force` — it breaks Vite 5.

## Shortcuts

| Key | Action |
|-----|--------|
| **V** | Cut / razor at playhead |
| **C** | unbound (Ctrl+C = copy) |
| Space | Play / pause |
| M | Marker |
| Delete | Delete selected clip |

## Export architecture (success path)

```
Timeline (V1/V2 + A1/A2)
        │
        ▼
  jobFromProject()     src/core/exporter/from-project.ts
        │
        ▼
  exportTimeline()     src/core/exporter/index.ts  (watchdog)
        │
        ▼
  Mediabunny decode (frame-accurate samples)
        + canvas paint + still images
        │
        ▼
  WebCodecs encode H.264 (+ AAC if available) → MP4
        │
   success → download / save .mp4
   failure → STOP (no silent WebM fallback)
```

- Success = real MP4 (`ftyp`, H.264, AAC when possible)
- MediaRecorder WebM is **not** a success path when WebCodecs exists
- Desktop: `npm run tauri:dev`; system ffmpeg is the native remux helper

## Project layout

```
src/
  App.tsx                 UI + timeline + export dialog + shortcuts
  styles.css
  main.tsx
  core/
    models.ts             Project / Track / Clip types
    media-store.ts        IndexedDB blobs
    project-store.ts      localStorage project JSON
    tauri-export.ts       desktop save + ffmpeg remux
    exporter/
      index.ts            public API + watchdog
      from-project.ts     Studio project → ExportJob
      planner.ts          timeline segments
      media.ts            HTML media load (fallback only)
      frame-source.ts     Mediabunny frame decode + stills
      types.ts
      backends/
        webcodecs.ts      H.264/AAC MP4 (primary)
        ffmpeg.ts         system ffmpeg (Node/desktop)
        native.ts         future Rust stub
```

## Safe further development

1. **One export path** — do not reintroduce silent MediaRecorder success after plugin failure.
2. **Cut stays on V** — never bind bare C to cut.
3. **Version in UI** — `APP_VERSION` in `App.tsx` + `package.json` version stay `4.2.0`.
4. **Port 1421 only** when killing processes.
5. **Vite 5.4.x** — pin it; no major bumps without a dedicated branch.
6. **Blob media** — after reload, re-import if sources show `missing:`.
7. **Folder** — work only in `ResonanceStudio-V4.2`, never in a V4.01 tree.

## Next

See `ROADMAP.md`: Sensorics, an AI video track, stronger pre-export hydration. Export itself is a closed milestone.

## License

UNLICENSED / AILEXSI private.
