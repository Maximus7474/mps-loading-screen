/**
 * Building blocks: the composable, user-configurable units the Tauri app
 * arranges into a loading screen. Each block is driven by a schema of typed
 * fields, and the UI renders a property panel directly from that schema.
 */

export type FieldType =
	| "text"
	| "textarea"
	| "boolean"
	| "color"
	| "colorStops"
	| "number"
	| "url"
	| "select";

export interface FieldOption {
	value: string;
	label: string;
}

export interface BlockField {
	/** Machine key, unique within the block. */
	key: string;
	/** Human label shown in the property panel. */
	label: string;
	type: FieldType;
	default: unknown;
	placeholder?: string;
	help?: string;
	options?: FieldOption[];
	min?: number;
	max?: number;
	step?: number;
	/** Hide the field unless `values[when.key]` deeply equals `when.value`. */
	when?: { key: string; value: unknown };
}

export type BlockValues = Record<string, unknown>;

/** Static declaration of a buildable block. */
export interface BlockDefinition {
	id: string;
	name: string;
	description: string;
	/** Short glyph used in the palette/legend. */
	icon: string;
	defaultValues: BlockValues;
	fields: BlockField[];
}

/** An instance of a block placed into the current design. */
export interface BlockInstance {
	id: string;
	/** Mirrors whether the block is switched on. */
	enabled: boolean;
	/** Lower number renders first. */
	order: number;
	values: BlockValues;
}

export const BLOCKS: BlockDefinition[] = [
	{
		id: "hero",
		name: "Hero / Title & Subtitle",
		icon: "H",
		description: "Server name headline with an optional eyebrow and subtitle.",
		defaultValues: {
			titleSource: "globals",
			customTitle: "",
			eyebrow: "",
			subtitle: "",
		},
		fields: [
			{
				key: "titleSource",
				label: "Title",
				type: "select",
				default: "globals",
				options: [
					{ value: "globals", label: "Server name (from handover)" },
					{ value: "custom", label: "Custom text" },
				],
			},
			{
				key: "customTitle",
				label: "Custom title",
				type: "text",
				default: "",
				placeholder: "Los Santos Roleplay",
				when: { key: "titleSource", value: "custom" },
			},
			{
				key: "eyebrow",
				label: "Eyebrow",
				type: "text",
				default: "",
				placeholder: "Season 2 · Whitelisted",
			},
			{
				key: "subtitle",
				label: "Subtitle",
				type: "text",
				default: "",
				placeholder: "A serious role-play community",
			},
		],
	},
	{
		id: "progress",
		name: "Loading Progress",
		icon: "▁",
		description: "A thin progress bar filled by the loadProgress message event.",
		defaultValues: {
			label: "LOADING",
			showPercent: true,
			thickness: 3,
		},
		fields: [
			{
				key: "label",
				label: "Label",
				type: "text",
				default: "LOADING",
				placeholder: "LOADING",
			},
			{
				key: "showPercent",
				label: "Show percentage readout",
				type: "boolean",
				default: true,
			},
			{
				key: "thickness",
				label: "Bar thickness (px)",
				type: "number",
				default: 3,
				min: 1,
				max: 12,
				step: 1,
			},
		],
	},
	{
		id: "handover",
		name: "Handover Data",
		icon: "◉",
		description: "Show the connecting player's name and the server address.",
		defaultValues: {
			welcomeLabel: "Welcome, ",
			connectingLabel: "Connecting to",
			showPlayerName: true,
			showServerAddress: true,
		},
		fields: [
			{
				key: "welcomeLabel",
				label: "Greeting prefix",
				type: "text",
				default: "Welcome, ",
			},
			{
				key: "showPlayerName",
				label: "Show player name",
				type: "boolean",
				default: true,
			},
			{
				key: "connectingLabel",
				label: "Address label",
				type: "text",
				default: "Connecting to",
			},
			{
				key: "showServerAddress",
				label: "Show server address",
				type: "boolean",
				default: true,
			},
		],
	},
	{
		id: "status",
		name: "Status / Ticker",
		icon: "⋯",
		description: "Rotates through a list of status lines while loading.",
		defaultValues: {
			source: "custom",
			customItems: ["Booting day one", "Calibrating traffic density", "Chasing the sunset"],
			interval: 2600,
		},
		fields: [
			{
				key: "source",
				label: "Ticker source",
				type: "select",
				default: "custom",
				options: [
					{ value: "custom", label: "My own lines" },
					{ value: "globals", label: "Status lines from handover" },
				],
			},
			{
				key: "customItems",
				label: "Status lines (one per line)",
				type: "textarea",
				default: [],
				help: "Each newline becomes a rotating status line.",
				when: { key: "source", value: "custom" },
			},
			{
				key: "interval",
				label: "Rotate every (ms)",
				type: "number",
				default: 2600,
				min: 500,
				max: 20000,
				step: 100,
			},
		],
	},
	{
		id: "footer",
		name: "Footer Links",
		icon: "↗",
		description: "Configurable link buttons. Labels and URLs are fully editable.",
		defaultValues: {},
		fields: [],
	},
	{
		id: "background",
		name: "Media Background",
		icon: "▦",
		description: "A gradient, image, or video layer behind the loading screen.",
		defaultValues: {
			kind: "gradient",
			gradient: ["#101320", "#05070d"],
			imageUrl: "",
			videoUrl: "",
			imagePosition: "center",
			overlay: 0.55,
			blur: 0,
			animate: true,
		},
		fields: [
			{
				key: "kind",
				label: "Background",
				type: "select",
				default: "gradient",
				options: [
					{ value: "gradient", label: "Gradient" },
					{ value: "image", label: "Image" },
					{ value: "video", label: "Video" },
				],
			},
			{
				key: "gradient",
				label: "Gradient stops",
				type: "colorStops",
				default: ["#101320", "#05070d"],
				help: "First colour is top, last is bottom. Add as many stops as you like.",
				when: { key: "kind", value: "gradient" },
			},
			{
				key: "imageUrl",
				label: "Image URL",
				type: "url",
				default: "",
				placeholder: "https://…/backdrop.jpg",
				when: { key: "kind", value: "image" },
			},
			{
				key: "videoUrl",
				label: "Video URL",
				type: "url",
				default: "",
				placeholder: "https://…/loop.mp4",
				when: { key: "kind", value: "video" },
			},
			{
				key: "imagePosition",
				label: "Image position",
				type: "select",
				default: "center",
				options: [
					{ value: "center", label: "Center" },
					{ value: "top", label: "Top" },
					{ value: "bottom", label: "Bottom" },
					{ value: "cover", label: "Stretched" },
				],
				when: { key: "kind", value: "image" },
			},
			{
				key: "overlay",
				label: "Dark overlay opacity",
				type: "number",
				default: 0.55,
				min: 0,
				max: 1,
				step: 0.05,
			},
			{
				key: "blur",
				label: "Blur (px)",
				type: "number",
				default: 0,
				min: 0,
				max: 20,
				step: 1,
			},
			{
				key: "animate",
				label: "Animate (zoom drift)",
				type: "boolean",
				default: true,
			},
		],
	},
];

export const BLOCK_BY_ID: Record<string, BlockDefinition> = Object.fromEntries(
	BLOCKS.map((block) => [block.id, block]),
);

/** Merge saved values over defaults so new fields get sensible fallbacks. */
export function normalizeValues(
	definition: BlockDefinition,
	values: BlockValues | undefined,
): BlockValues {
	return {
		...definition.defaultValues,
		...values,
	};
}
