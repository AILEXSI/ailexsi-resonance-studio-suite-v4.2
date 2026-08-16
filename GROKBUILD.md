# GrokBuild — AILEXSI Resonance Studio Suite V4.2

Current-state card. Copy below the line into a new Grok chat when continuing this product.

---

GrokBuild — AILEXSI Resonance Studio Suite V4.2

ACTIVE TARGET (all writes here only):
- https://github.com/AILEXSI/ailexsi-resonance-studio-suite-v4.2
- Brand: AILEXSI Resonance Studio Suite V4.2
- package.json + APP_VERSION: 4.2.0
- Local folder: %USERPROFILE%\ResonanceStudio-V4.2

FROZEN / READ-ONLY (never modify, never push):
- https://github.com/AILEXSI/ailexsi-resonance-studio  (V4.01 baseline)

HARD RULES
1. Only real MP4 (H.264 + AAC when possible) counts as success. No silent WebM fallback.
2. Cut = V. C stays free (Ctrl+C = copy).
3. APP_VERSION and package.json must stay 4.2.0 and visible in the logo.
4. Pin Vite 5.4.x. Never `npm audit fix --force`.
5. Keep mediabunny@1.54.0 and @tauri-apps/api@1.5.6.
6. Port 1421 only. No nested src-tauri/src-tauri.
7. V4.01 repo stays untouched.

CURRENT REALITY
- MP4 export is a closed milestone: smooth video + full-strength music.
- Path: jobFromProject → exportTimeline → Mediabunny VideoSampleSink → WebCodecs H.264/AAC MP4.
- Desktop: `npm run tauri:dev` (Rust + ffmpeg on PATH).
- Host is ready for the next modules.

NEXT (do not reopen export unless it regresses)
1. Sensorics (beats / energy / scenes) into the host
2. One AI video track (proposal → human accept → new VIDEO lane)
3. Stronger pre-export media hydration
4. Keep Cut=V, C free, logo Suite V4.2 / 4.2.0

START
```powershell
cd %USERPROFILE%\ResonanceStudio-V4.2
npm install
npm run dev          # http://localhost:1421
# npm run tauri:dev  # standalone window
```

SUCCESS FOR NEW WORK
- localhost:1421 still shows Suite V4.2 / 4.2.0
- Export still ends in .mp4 or a clear error (never silent .webm)
- V4.01 repo untouched
