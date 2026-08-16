# V4.2 Roadmap

**Current version:** 4.2.0  
**Repo:** https://github.com/AILEXSI/ailexsi-resonance-studio-suite-v4.2

## Frozen: V4.01

Repo: https://github.com/AILEXSI/ailexsi-resonance-studio  
Do **not** push feature work there. Read and copy only.

Inherited from that baseline: multi-track V1/V2 + A1/A2, Cut = V / C free, WebCodecs + mediabunny, no silent WebM fallthrough, export watchdog, Vite 5.4.21, mediabunny 1.54.0, `@tauri-apps/api` 1.5.6.

## Done in V4.2

- Branding **Suite V4.2** / **4.2.0** in UI, `package.json`, Tauri product name
- Nested `src-tauri/src-tauri` removed
- Desktop scripts: `npm run tauri:dev` / `tauri:build`
- **MP4 export milestone:** frame-accurate Mediabunny decode → H.264 + AAC, smooth video, full-strength music
- Still-image paint in the exporter
- Cancel aborts the WebCodecs encode (`AbortSignal`)

## Next (host is ready)

1. **Sensorics** — real feature extraction (beats, energy, scenes) into the host
2. **AI video track** — Regisseur proposal → human accept → new VIDEO lane
3. Stronger pre-export hydration (no `missing:` / dead blob mid-encode)
4. Optional full removal of the MediaRecorder branch (already isolated: never a success after WebCodecs fail)
5. Waveform / beats polish
6. AI command reliability
7. Overlap / gap edge cases

Export itself is **not** an open P0 anymore.
