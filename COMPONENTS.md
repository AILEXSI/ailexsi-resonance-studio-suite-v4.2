# AILEXSI Resonance Studio Suite V4.2 — Component Blueprints

Standalone modules that plug into this host (and the Tauri desktop build).

All modules follow the same principles:

- Local-first
- AI proposes, Human decides
- Original media/timeline stays untouched
- Clean typed contracts between modules
- No AGPL / copyleft contamination

---

## Module Map

```
User imports videos + audio
        │
        ▼
┌─────────────────────┐
│  ailexsi-analyser   │  ← Sensorics: lanes + sound → AnalysisSnapshot
└─────────┬───────────┘
          │ Snapshot (JSON)
          ▼
┌─────────────────────┐
│  ailexsi-regisseur  │  ← builds Proposal for a *new* video track
└─────────┬───────────┘
          │ Proposal (pending)
          ▼
   Human Accept / Reject
          │
          ▼ (if accepted)
   New track appears in Studio
          │
          ▼
┌─────────────────────┐
│  host exporter      │  ← V4.2 milestone: timeline → real H.264/AAC MP4
└─────────────────────┘

Live visual layer (parallel):
┌─────────────────────┐
│  ailexsi-visualz    │  ← audio-reactive visuals (Canvas/WebGL from scratch)
└─────────────────────┘

Supporting native layer:
┌─────────────────────┐
│  ailexsi-decoder    │  ← Tauri/Rust media access (waveforms, frames, thumbs)
└─────────────────────┘
```

---

## Repositories

| Module | Repo | Role |
|--------|------|------|
| Host (this) | https://github.com/AILEXSI/ailexsi-resonance-studio-suite-v4.2 | Timeline + export + desktop shell |
| Analyser | https://github.com/AILEXSI/ailexsi-analyser | Feature extraction (beats, energy, scenes, motion) |
| Regisseur | https://github.com/AILEXSI/ailexsi-regisseur | Creative proposals (new video track + cut points) |
| Visualz | https://github.com/AILEXSI/ailexsi-visualz | Audio-reactive visualizer engine |
| Decoder | https://github.com/AILEXSI/ailexsi-decoder | Native media layer for Tauri |
| Exporter (legacy spec) | https://github.com/AILEXSI/ailexsi-exporter | Original contract — **host exporter in this repo is the live path** |

---

## Status (2026-08-16)

**Host V4.2.0**

- Exporter in this repo is live: Mediabunny decode → WebCodecs H.264 + AAC MP4
- Milestone: smooth video + full-strength music
- Desktop: `npm run tauri:dev`
- Cut = V, C free, logo Suite V4.2 / 4.2.0

**Host AI lanes (this repo)**

- AI Visualizer track — Visualz engine (resonance-wave, spectrum-bars, pulse-orb, …) driven by project audio / beat grid; Main Output fallback only
- AI Arrangement track — proposal from existing V1/V2 clips; Accept required

**Still external / next**

- Sensorics (Analyser) into the host
- More Visualz scenes
- Decoder sidecar beyond the current ffmpeg helper

---

## Integration Rule

Never let any module silently mutate the project.
Always go through Proposal → Human Decision → Apply.
