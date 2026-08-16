# AILEXSI Grok Build Bridge — Protocol v1

## Purpose
Grok (builder) drops finished product slices here.
GrokBot (local) polls this repo and applies updates without manual zip hunting.

## Bot loop (recommended)
1. `git pull` (or GitHub API fetch) on `main`
2. Read `/bridge/LATEST.json` (or repo root LATEST if standalone bridge repo)
3. Compare `version` to local `bridge-state.json`
4. If newer + `status == "ready"`:
   - Resolve payload: if `path` is `"."` / `"repo-root"` / empty (or `payload` is `"repo-root"`), the **repo root** is the payload. Otherwise copy `bridge/<path>/payload`.
   - Copy payload → targetDir (respect exclude)
   - Run post commands
   - Write local `bridge-state.json`
5. If `status == "broken"` → do not apply, notify human

V4.2 (`4.2.0`): `bridge/LATEST.json` uses `path: "."` — payload is this repo, target `%USERPROFILE%\ResonanceStudio-V4.2`.

## Rules
- No secrets in payload
- Never overwrite `.env` / `.git`
- Kill port 1421 before dev server if needed
