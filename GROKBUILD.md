# GrokBuild prompt for V4.2

Copy everything below the line into a new Grok chat.

---

GrokBuild — AILEXSI Resonance Studio Suite V4.2

FROZEN SOURCE (read/copy ONLY — never modify, never push to it):
- https://github.com/AILEXSI/ailexsi-resonance-studio
- Version Suite V4.01 / package 4.0.1
- You may clone, read, and copy files into the V4.2 repo.
- You must NOT commit, push, or rewrite history on the V4.01 repo.

ACTIVE TARGET (all writes go here):
- https://github.com/AILEXSI/ailexsi-resonance-studio-suite-v4.2
- Brand: AILEXSI Resonance Studio Suite V4.2
- package version: 4.2.0
- APP_VERSION in UI: 4.2.0

USER CONTEXT
- Windows; V4.01 may live in %USERPROFILE%\ResonanceStudio
- V4.2 MUST use a SEPARATE folder e.g. %USERPROFILE%\ResonanceStudio-V4.2
- Vite port 1421 only; never npm audit fix --force; pin Vite 5.4.x
- Deps: mediabunny@1.54.0, @tauri-apps/api@1.5.6

GOAL
Evolve frozen V4.01 multi-track local NLE. Close gaps in order:
1) Reliable export verification (real MP4, ftyp, video+audio)
2) Still-image paint in exporter
3) Pre-export media hydration (no missing blob after reload)
4) Remove or hard-isolate MediaRecorder so it never looks like success after WebCodecs fail
5) Tauri tree cleanup if nested src-tauri/src-tauri
6) Keep Cut=V, C free; logo Suite V4.2

BOOTSTRAP
1. Read V4.01 README + ARCHITECTURE.md from frozen repo
2. Copy full source into V4.2 repo / local V4.2 folder
3. Bump branding to V4.2 / 4.2.0
4. Implement P0 items with small commits
5. One success path = real MP4 only

SUCCESS
- localhost:1421 shows Suite V4.2
- Export → .mp4 or clear error (never silent .webm)
- Images on timeline render in export
- Dead media detected before encode
- V4.01 repo untouched
