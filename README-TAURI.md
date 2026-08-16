# AILEXSI Resonance Studio Suite V4.2 — Desktop (Tauri)

Standalone window. Primary encode is still **WebCodecs + Mediabunny → H.264/AAC MP4**. System **ffmpeg** is the native remux/save helper.

## Prerequisites (Windows)

1. **Node.js 20+**
2. **Rust** — https://rustup.rs/
   ```powershell
   winget install Rustlang.Rustup
   ```
3. **Microsoft C++ Build Tools** (Visual Studio Build Tools)
4. **WebView2** — usually already on Windows 10/11
5. **ffmpeg** on PATH:
   ```powershell
   winget install Gyan.FFmpeg
   ffmpeg -version
   ```

## Install & run (dev)

```powershell
cd $env:USERPROFILE\ResonanceStudio-V4.2
npm install
npm run tauri:dev
```

Opens the **desktop window** titled **AILEXSI Resonance Studio Suite V4.2**. Do not use a Firefox/Chrome tab for the “standalone” path.

## Production build

```powershell
npm run tauri:build
```

Installer / binary under:
`src-tauri/target/release/bundle/`

## Export behavior

| Runtime | Success output |
|---------|----------------|
| Desktop (`npm run tauri:dev`) | **`.mp4`** — WebCodecs H.264 + AAC; ffmpeg remux if the native helper is used |
| Browser (`npm run dev`) | **`.mp4`** via the same WebCodecs path, or a **clear error** |

WebM is **not** a success result. If ffmpeg is missing, the desktop helper must fail loudly — never pretend a `.webm` is the export.

## Commands (Rust)

- `check_ffmpeg` — path to ffmpeg
- `export_webm_to_mp4` — remux a temp file → MP4 (helper, not the success story)

## Notes

- First `tauri:dev` / `tauri:build` compiles Rust (can take several minutes).
- Work only in `ResonanceStudio-V4.2`. Never apply desktop updates into a V4.01 folder.
