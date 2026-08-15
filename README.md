# AILEXSI Resonance Studio Suite V4.2

**Status:** Bootstrap — evolves from frozen **V4.01**.

| | |
|--|--|
| **This repo** | All V4.2 work lives here |
| **Frozen baseline** | https://github.com/AILEXSI/ailexsi-resonance-studio (V4.01) |
| **Rule** | V4.01 is **read/copy only** — never modify that repo for V4.2 features |

## Branding

- UI: `AILEXSI Resonance Studio Suite V4.2`
- `package.json` version: `4.2.0`
- `APP_VERSION`: `4.2.0`

## Bootstrap from V4.01

```powershell
git clone https://github.com/AILEXSI/ailexsi-resonance-studio.git ResonanceStudio-V4.01-readonly
git clone https://github.com/AILEXSI/ailexsi-resonance-studio-suite-v4.2.git ResonanceStudio-V4.2
# copy source from readonly into V4.2 working tree, then bump version to 4.2.0
```

## Hard rules (from V4.01)

1. No silent WebM success after WebCodecs/plugin failure  
2. Cut = **V** only (C free)  
3. Never `npm audit fix --force`  
4. Vite **5.4.x** pinned  
5. Kill only port **1421**  
6. Real MP4 (ftyp) or clear error  

## V4.2 priorities

See [ROADMAP.md](./ROADMAP.md).

1. Export verification (video + audio → real MP4)  
2. Still-image frames in exporter  
3. Pre-export media hydration  
4. Isolate/remove MediaRecorder success path  
5. Tauri tree cleanup  

## License

UNLICENSED / AILEXSI private.
