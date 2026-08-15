# V4.2 Roadmap

## Frozen: V4.01

Repo: https://github.com/AILEXSI/ailexsi-resonance-studio  
Do **not** push feature work there. Read and copy only.

### Already done in V4.01

- Multi-track V1/V2 + A1/A2
- Cut = V, C free
- Suite V4.01 logo
- WebCodecs + mediabunny H.264 MP4
- AAC probe + video-only fallback
- No silent WebM fallthrough
- Export watchdog
- Audio from AUDIO tracks else VIDEO sources
- mediabunny 1.54.0, @tauri-apps/api 1.5.6, Vite 5.4.21

## P0

1. Export E2E test — short range, video+audio, `.mp4` with ftyp
2. Still-image paint in exporter (`type: image`)
3. Pre-export hydration — no `missing:` / dead blob mid-encode
4. MediaRecorder never counts as success after WebCodecs fail (prefer remove)

## P1

5. Long-timeline encode performance / cancel UX
6. Normalize Tauri folder (avoid nested src-tauri/src-tauri)
7. Branding V4.2 / 4.2.0 everywhere

## P2

8. Overlap / gap edge cases
9. Waveform / beats polish
10. AI command reliability
11. Clean Windows APPLY from this repo only
