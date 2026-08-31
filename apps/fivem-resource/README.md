# FiveM Loading Screen Resource

A TypeScript FiveM resource (based on the [overextended `fivem-ts`](https://github.com/overextended/fivem-ts) boilerplate) that:

- serves a generated loading screen (`loadscreen 'dist/load.html'`, `loadscreen_cursor 'yes'`);
- sends your handover fields to the client on `playerConnecting`;
- hides FiveM's default busy spinner (`sv_showBusySpinnerOnLoadingScreen false`).

## Build

```bash
bun install
bun run build      # → dist/ with dist/server.js, dist/load.html, dist/config.json, fxmanifest.lua
bun run dev        # watch mode
bun run typecheck  # tsc for server + client entries
bun run lint       # oxlint
```

## Runtime config

`public/config.json` holds the static handover fields the server sends on connect.
Rebuild after editing, or let the desktop builder app generate both files for you.

## Install on a server

Drop the built **`dist/`** (or the full export) as a folder in `resources/`, then:

```
ensure loadscreen-builder
```

## Layout

- `resource/server/index.ts` — `playerConnecting` handover handler.
- `resource/server/tsconfig.json` / `resource/client/tsconfig.json` — per-entry tsdown project configs.
- `resource/common/*` — shared loader/context helpers.
- `public/` — static files copied into `dist/` (the loading screen + config).
- `scripts/` — `typegen` + `postBuild` (generates `fxmanifest.lua`).
