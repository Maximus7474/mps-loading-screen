# Loading Screen Builder

A **FiveM loading-screen studio** shipped as a monorepo (bun workspaces): a [Tauri](https://tauri.app) desktop app that assembles loading screens from visual **building blocks** into **pure vanilla HTML/CSS/JS**, plus the accompanying **FiveM resource** authored in TypeScript and bundled to plain JS on the [overextended `fivem-ts` boilerplate](https://github.com/overextended/fivem-ts).

## What you get

- **Builder app** (`apps/desktop`) — pick and configure blocks, tune the theme, and watch a **live preview** driven by simulated FiveM handover data and load events. Export produces a ready-to-drop resource `.zip`.
- **The block library** (`packages/shared` + `packages/resource-generator`) — the six initial blocks (Hero, Loading progress, Handover data, Status ticker, Footer links, Media background) plus the vanilla renderer that turns a design into a self-contained `load.html` + runtime `config.json`.
- **The resource** (`apps/fivem-resource`) — a TypeScript FiveM resource that sends your configured handover fields on `playerConnecting` and serves the generated loading screen.

## Layout

```
packages/
  shared/               Pure TS — config model, block registry, handover types
  resource-generator/   Pure TS — LoadScreenConfig → load.html + config.json
apps/
  desktop/              Tauri v2 + React + Vite builder (frontend + Rust backend)
  fivem-resource/       FiveM resource (overextended fivem-ts boilerplate)
```

## Requirements

- [Bun](https://bun.sh) 1.1+ (runtime + package manager)
- Node 22+ for the resource build
- Rust stable + OS build deps for the Tauri app (`cargo`, plus platform prerequisites)

## Develop

```bash
bun install                 # install all workspaces
bun run resource:build      # build the FiveM resource → apps/fivem-resource/dist/
bun run desktop:dev         # run the Tauri app (dev webview + HMR on :1420)
bun run typecheck           # typecheck shared, generator, and resource
```

Preferences:

- `bun run resource:dev` — rebuild the resource on file change (tsdown watch).
- `bun run seed` — regenerate `apps/fivem-resource/public/load.html` + `config.json` from generator defaults (so the resource builds standalone).

## End-user install (from an exported `.zip`)

1. In the app, click **Export .zip** and choose where to save it.
2. Unzip it into your server's `resources/` folder — the unzipped folder is named after your **Resource name** (set under _Resource_).
3. Add `ensure <resource-name>` to your `server.cfg`.

The zip is fully prebuilt: plain JavaScript + HTML/CSS/JS + a generated `fxmanifest.lua` (with `loadscreen`, `loadscreen_cursor 'yes'`, and runtime `config.json`). No build toolchain needed on the server.

Handy optional server tweaks:

- To also hide FiveM's busy spinner, run the resource (it already sets `sv_showBusySpinnerOnLoadingScreen false` server-side), or set it in `server.cfg`.

## How handover data works

The resource reads `config.json` at runtime and, on `playerConnecting`, calls `deferrals.handover(...)` with your fields plus the player's name. FiveM injects `serverAddress`. The loading screen reads all of it from `window.nuiHandoverData` (player names are inserted with `innerText`, never `innerHTML`, to stay XSS-safe).

## Building the desktop app

```bash
bun --cwd apps/desktop tauri build
```

Produces installers/app bundles under `apps/desktop/src-tauri/target/release/bundle/`.
