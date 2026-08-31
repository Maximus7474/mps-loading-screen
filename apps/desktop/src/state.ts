import type {
	LoadScreenConfig,
	ThemeConfig,
	ResourceMeta,
	ResourceGlobals,
	BlockValues,
} from "@loadscreen/shared";
import { BLOCK_BY_ID } from "@loadscreen/shared";

export type ConfigState = LoadScreenConfig;

export function setTheme(config: ConfigState, patch: Partial<ThemeConfig>): ConfigState {
	return { ...config, theme: { ...config.theme, ...patch } };
}

export function setMeta(config: ConfigState, patch: Partial<ResourceMeta>): ConfigState {
	return { ...config, meta: { ...config.meta, ...patch } };
}

export function setGlobals(config: ConfigState, patch: Partial<ResourceGlobals>): ConfigState {
	return { ...config, globals: { ...config.globals, ...patch } };
}

export function setLinks(
	config: ConfigState,
	links: NonNullable<ResourceGlobals["links"]>,
): ConfigState {
	return setGlobals(config, { links });
}

function withBlock(
	config: ConfigState,
	id: string,
	fn: (block: NonNullable<LoadScreenConfig["blocks"][number]>) => void,
): ConfigState {
	const index = config.blocks.findIndex((b) => b.id === id);
	if (index === -1) return config;
	const block = { ...config.blocks[index]!, values: { ...config.blocks[index]!.values } };
	fn(block);
	const blocks = [...config.blocks];
	blocks[index] = block;
	return { ...config, blocks };
}

export function toggleBlock(config: ConfigState, id: string): ConfigState {
	return withBlock(config, id, (block) => {
		block.enabled = !block.enabled;
	});
}

export function setBlockValues(config: ConfigState, id: string, patch: BlockValues): ConfigState {
	return withBlock(config, id, (block) => {
		block.values = { ...block.values, ...patch };
	});
}

export function setBlockValue(
	config: ConfigState,
	id: string,
	key: string,
	value: unknown,
): ConfigState {
	return setBlockValues(config, id, { [key]: value });
}

export function moveBlock(config: ConfigState, id: string, dir: -1 | 1): ConfigState {
	const sorted = [...config.blocks].sort((a, b) => a.order - b.order);
	const index = sorted.findIndex((b) => b.id === id);
	if (index === -1) return config;
	const target = index + dir;
	if (target < 0 || target >= sorted.length) return config;
	const [moving] = sorted.splice(index, 1);
	sorted.splice(target, 0, moving as NonNullable<(typeof sorted)[number]>);
	const orderMap = new Map(sorted.map((block, i) => [block.id, i]));
	const blocks = config.blocks.map((block) => ({ ...block, order: orderMap.get(block.id)! }));
	return { ...config, blocks };
}

export function addBlock(config: ConfigState, id: string): ConfigState {
	if (config.blocks.some((b) => b.id === id)) return config;
	const definition = BLOCK_BY_ID[id];
	if (!definition) return config;
	const order = Math.max(0, ...config.blocks.map((b) => b.order)) + 1;
	const blocks = [
		...config.blocks,
		{ id, enabled: true, order, values: { ...definition.defaultValues } },
	];
	return { ...config, blocks };
}

/** Re-sort block list by `order` (stable), used before rendering / export. */
export function sortedBlocks(config: ConfigState) {
	return [...config.blocks].sort((a, b) => a.order - b.order);
}
