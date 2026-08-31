import { ResourceName } from "./resource";

/**
 * Load a file from the resource at runtime. Paths authored against `public/`
 * are rewritten to their built location under `dist/`.
 */
export function LoadFile<T = string>(path: string): T {
	const clean = path.replace("public/", "dist/");
	const file = LoadResourceFile(ResourceName, clean);
	if (!file) {
		throw new Error(`Failed to load file "${clean}" (file not found)`);
	}
	const ext = clean.slice(clean.lastIndexOf(".") + 1);
	switch (ext) {
		case "js":
			return new Function(file)() as T;
		case "json":
			return JSON.parse(file) as T;
		default:
			throw new Error(`Failed to load file "${clean}" (invalid extension type)`);
	}
}
