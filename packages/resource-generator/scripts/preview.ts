/**
 * Renders the live-preview HTML (with the simulator shim) to a file, so the
 * generated loading screen can be opened/inspected outside the app.
 *
 *   bun run packages/resource-generator/scripts/preview.ts [out.html]
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defaultConfig } from "@loadscreen/shared";
import { renderPreviewHtml } from "../src/index.ts";

const out = resolve(process.argv[3] ?? "interactive-preview.html");
await writeFile(out, renderPreviewHtml(defaultConfig()), "utf8");
console.log(`Wrote preview to ${out}`);
