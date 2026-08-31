/**
 * Writes the default generated loading screen into the resource's `public/`
 * folder so `bun run build` works standalone (and so the repo ships a working
 * resource out of the box, before the Tauri app is even used).
 *
 *   bun run packages/resource-generator/scripts/seed.ts
 */
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defaultConfig } from "@mps-loading-screen/shared";
import { render } from "../src/index.ts";

const outputDir = resolve(
	process.argv[2] ?? import.meta.dir,
	"../../../apps/fivem-resource/public",
);
const files = render(defaultConfig());

await mkdir(outputDir, { recursive: true });
await Promise.all(
	Object.entries(files).map(([name, content]) =>
		writeFile(resolve(outputDir, name), content, "utf8"),
	),
);

console.log(`Seeded default loading screen into ${outputDir}`);
console.log(`  ${Object.keys(files).join("\n  ")}`);
