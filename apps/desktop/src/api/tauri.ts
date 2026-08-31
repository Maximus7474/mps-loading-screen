/**
 * Thin wrappers over the Tauri backend commands. Each degrades gracefully when
 * the app is run in a plain browser (Vite dev) rather than the Tauri webview,
 * so the builder UI alone always works for design work.
 */

export interface ExportResult {
	zipPath: string;
	resourceDir: string;
}

/** Fixed identity of the bundled resource (from `apps/fivem-resource/package.json`). */
export interface ResourceMetaInfo {
	name: string;
	author: string;
	version: string;
}

const BROWSER_RESOURCE_META: ResourceMetaInfo = {
	name: "loadscreen-resource",
	author: "Your Studio",
	version: "1.0.0",
};

declare global {
	interface Window {
		__TAURI_INTERNALS__?: unknown;
	}
}

export const isTauri = typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);

async function invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
	if (!isTauri) {
		throw new Error("Tauri backend unavailable (running outside the desktop shell)");
	}
	const { invoke: call } = await import("@tauri-apps/api/core");
	return call<T>(command, args);
}

/** Open a native "pick project" dialog; resolves to a path or null. */
export async function openProjectDialog(): Promise<string | null> {
	if (!isTauri) return null;
	return invoke<string | null>("open_project_dialog", {});
}

/** Open a native "save" dialog for a new project path; path or null. */
export async function saveProjectDialog(defaultName?: string): Promise<string | null> {
	if (!isTauri) return null;
	return invoke<string | null>("save_project_dialog", {
		defaultName: defaultName ?? "loading-screen.loadscreen",
	});
}

export async function loadProject(path: string): Promise<string> {
	return invoke<string>("load_project", { path });
}

export async function saveProject(path: string, configJson: string): Promise<void> {
	return invoke<void>("save_project", { path, configJson });
}

/** The resource's fixed name/author/version, read from the bundled template. */
export async function getResourceMeta(): Promise<ResourceMetaInfo> {
	if (!isTauri) return BROWSER_RESOURCE_META;
	return invoke<ResourceMetaInfo>("resource_meta", {});
}

/** Build + zip the resource from the generated files. */
export async function exportResource(files: {
	"load.html": string;
	"config.json": string;
}): Promise<ExportResult> {
	if (!isTauri) {
		throw new Error("Export requires the desktop app (Tauri).");
	}
	return invoke<ExportResult>("export_resource", { files });
}
