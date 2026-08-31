import type { ResourceGlobals, ResourceMeta } from "./handover";
import { BLOCK_BY_ID, normalizeValues } from "./blocks";
import type { BlockInstance, BlockValues } from "./blocks";

/**
 * The full design surface of a loading screen. This is exactly what the Tauri
 * app edits and what the generator serialises into load.html + config.json.
 */

export interface ThemeConfig {
	bg: string;
	panel: string;
	accent: string;
	accent2: string;
	text: string;
	muted: string;

	/** CSS font-family stacks. */
	displayFont: string;
	bodyFont: string;
	monoFont: string;

	/** Layout: centered column by default. */
	align: "center" | "left";

	/** Overall vertical size factor of the stage (0.6 – 1.4). */
	scale: number;
}

export interface LoadScreenConfig {
	meta: ResourceMeta;
	theme: ThemeConfig;
	/** Insertion-ordered, editable block instances. */
	blocks: BlockInstance[];
	/** Runtime handover fields the server sends on connect. */
	globals: ResourceGlobals;
}

/** The default, opinionated starting theme (see frontend-design skill). */
export const DEFAULT_THEME: ThemeConfig = {
	bg: "#0b0d12",
	panel: "#151a24",
	accent: "#ff4d2e",
	accent2: "#5ee6eb",
	text: "#f2f4f8",
	muted: "#9aa3b2",
	displayFont: "'Oswald','Rajdhani','Arial Narrow',sans-serif",
	bodyFont: "'Inter','Segoe UI',system-ui,sans-serif",
	monoFont: "'JetBrains Mono','SFMono-Regular',Consolas,monospace",
	align: "center",
	scale: 1,
};

const DEFAULT_BLOCK_ORDER = ["hero", "status", "progress", "handover", "footer", "background"];

export function defaultBlocks(): BlockInstance[] {
	return DEFAULT_BLOCK_ORDER.map<BlockInstance>((id, order) => {
		const definition = BLOCK_BY_ID[id]!; // DEFAULT_BLOCK_ORDER only holds defined ids
		return {
			id,
			enabled: true,
			order,
			values: { ...definition.defaultValues },
		};
	});
}

export function defaultConfig(): LoadScreenConfig {
	const blocks = defaultBlocks();
	return {
		meta: {
			name: "loadscreen-builder",
			author: "Your Studio",
			version: "1.0.0",
			description: "A custom loading screen built with Loading Screen Builder.",
		},
		theme: { ...DEFAULT_THEME },
		blocks,
		globals: {
			serverName: "Loading Screen RP",
			gamemode: "Roleplay",
			motto: "A server with only a loading screen.",
			statuses: [
				"Watching the loading screen",
				"Analyzing the loading screen",
				"Just the loading screen",
			],
			links: [
				{ label: "Discord", url: "https://discord.gg/example" },
				{ label: "fxManager", url: "https://fxmanager.dev" },
			],
			maxPlayers: 128,
		},
	};
}

/**
 * Deep-clean a block's values against its definition: drop unknown keys and
 * restore defaults, so stale/malformed projects still render.
 */
export function sanitizeBlockValues(id: string, values: BlockValues): BlockValues {
	const definition = BLOCK_BY_ID[id];
	if (!definition) return {};
	return normalizeValues(definition, values);
}

export function createBlockInstance(id: string, order = 0): BlockInstance {
	const definition = BLOCK_BY_ID[id];
	if (!definition) {
		throw new Error(`Unknown block id "${id}"`);
	}
	return { id, enabled: true, order, values: { ...definition.defaultValues } };
}

/** Serialise a config for storage / transport. */
export function serializeConfig(config: LoadScreenConfig): string {
	return JSON.stringify(config, null, 2);
}

export function deserializeConfig(input: string): LoadScreenConfig {
	const raw = JSON.parse(input) as Partial<LoadScreenConfig>;
	const base = defaultConfig();
	const meta = { ...base.meta, ...raw.meta };
	const theme = { ...base.theme, ...raw.theme };
	const blocks: BlockInstance[] = Array.isArray(raw.blocks)
		? raw.blocks
				.map((instance, i) => {
					const definition = BLOCK_BY_ID[instance.id];
					if (!definition) return null;
					return {
						id: instance.id,
						enabled: instance.enabled !== false,
						order: instance.order ?? i,
						values: normalizeValues(definition, instance.values),
					};
				})
				.filter((block): block is BlockInstance => block !== null)
		: base.blocks;
	const globals = { ...base.globals, ...raw.globals };
	return { meta, theme, blocks, globals };
}
