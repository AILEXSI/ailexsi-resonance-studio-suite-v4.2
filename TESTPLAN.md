# AILEXSI Resonance Studio Suite V4.2 — Testplan

**Version:** 4.2.0

## Start

```powershell
cd $env:USERPROFILE\ResonanceStudio-V4.2
npm run dev
```

Open http://localhost:1421 — logo **Suite V4.2** / **4.2.0**.

Desktop: `npm run tauri:dev` (separate window, not the browser tab).

## 1. Media & Reload

1. New project → Import 1 video + 1 WAV
2. Place on V1 / A1, play
3. Hard refresh (F5) → media should still play (IndexedDB)
4. If missing: ↻ Re-import All → select same files by name

## 2. Timeline edit

1. Drag clip horizontally
2. Drag clip V1 → V2 (same kind)
3. Cut (**V**) at playhead — **C must stay free**
4. Ctrl+C / Ctrl+V paste
5. Ctrl+Z undo, Ctrl+Y redo
6. Snap ON (button or S) — drag near clip edge should stick

## 3. Zoom & frames

1. Set playhead on a cut
2. Zoom slider → zooms around playhead
3. ← → frame step
4. Fit resets view

## 4. IN / OUT / Loop

1. Zoom in
2. **Right-click** ruler → IN (green)
3. **Right-click** further → OUT (orange)
4. Green region shade visible
5. 🔁 Loop ON → Play → should cycle IN↔OUT
6. Left-click ruler only seeks (no new marker)

## 5. Waveform

1. Audio clips on A1/A2 show white peak bars inside the clip
2. Zoom in → waveform still visible

## 6. Export (success = real MP4 only)

1. Set IN/OUT range
2. Export → filename → Start
3. Result: `.mp4` with `ftyp`, H.264, AAC when available
4. Picture is smooth; music is full-strength
5. Cancel works mid-render
6. Without IN/OUT → full timeline
7. Failure must be a clear error — **never a silent .webm**

## 7. Master

1. Play → MAIN meter moves
2. Fader changes loudness

## Known limits (honest)

- After reload, dead blobs may need Re-import
- Undo is best-effort (not every micro-drag frame)
- AI Propose is still a rule-based stub
- Sensorics / AI video track are not in the host yet
