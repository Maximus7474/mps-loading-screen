import { join } from "node:path";

const rawVersion = process.argv[2];

if (!rawVersion) {
	console.error("❌ Error: Please provide a version number.");
	console.error("Usage: bun run scripts/bump-version.ts <version>");
	process.exit(1);
}

const version = rawVersion.replace(/^v/, "");
console.log(`🚀 Bumping monorepo files to version: ${version}\n`);

const packageGlob = new Bun.Glob("**/package.json");

for await (const path of packageGlob.scan({
	cwd: process.cwd(),
	onlyFiles: true,
})) {
	// Ignore any package.json files inside node_modules or dist folders
	if (path.includes("node_modules") || path.includes("dist")) continue;

	try {
		const file = Bun.file(path);
		const content = await file.json();
		content.version = version;

		// Write back with 2-space formatting and trailing newline
		await Bun.write(path, JSON.stringify(content, null, "\t") + "\n");
		console.log(`  ✓ Updated ${path}`);
	} catch (err) {
		console.error(`  ✕ Failed to update ${path}:`, err);
	}
}

const cargoGlob = new Bun.Glob("**/Cargo.toml");

for await (const path of cargoGlob.scan({
	cwd: process.cwd(),
	onlyFiles: true,
})) {
	if (path.includes("target") || path.includes("node_modules")) continue;

	try {
		const file = Bun.file(path);
		const text = await file.text();

		// Replaces only the first package `version = "..."` entry in the file
		const updated = text.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`);

		await Bun.write(path, updated);
		console.log(`  ✓ Updated ${path}`);
	} catch (err) {
		console.error(`  ✕ Failed to update ${path}:`, err);
	}
}

const tauriGlob = new Bun.Glob("**/tauri.conf.json");

for await (const path of tauriGlob.scan({
	cwd: process.cwd(),
	onlyFiles: true,
})) {
	if (path.includes("target") || path.includes("node_modules")) continue;

	try {
		const file = Bun.file(path);
		const content = await file.json();

		// Check Tauri v1 (package.version) or v2 (version) structure
		if (content.package?.version) {
			content.package.version = version;
		} else {
			content.version = version;
		}

		await Bun.write(path, JSON.stringify(content, null, "\t") + "\n");
		console.log(`  ✓ Updated ${path}`);
	} catch (err) {
		console.error(`  ✕ Failed to update ${path}:`, err);
	}
}

console.log("\n✨ All version tags successfully updated!");
