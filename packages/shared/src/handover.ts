/**
 * Runtime data exchanged with the FiveM loading screen.
 */

/** Static, server-side configured handover fields. Mirrors what the resource
 *  reads from `config.json` and sends to the client on `playerConnecting`. */
export interface ResourceGlobals {
	/** Display name of the server (echoes the fxmanifest `name`). */
	serverName: string;
	/** Optional roles / gamemode label. */
	gamemode?: string;
	/** A short server motto shown under the title. */
	motto?: string;
	/** Rotating status/ticker lines, if the status block uses `globals`. */
	statuses?: string[];
	/** Outbound links surfaced by the footer block. */
	links?: ResourceLink[];
	maxPlayers?: number;
}

/**
 * The full handover payload delivered to the loading screen on
 * `window.nuiHandoverData`. FiveM injects `serverAddress` itself; the server
 * supplies `name` (per-player) plus the configured globals.
 */
export type HandoverData = ResourceGlobals & {
	/** Incoming player name, added by the server script. */
	name: string;
	/** Current IP/port, added by FiveM automatically. */
	serverAddress: string;
};

/** Project metadata that lands in the generated fxmanifest. */
export interface ResourceMeta {
	/** Also used as the resource folder + `ensure` name. */
	name: string;
	author: string;
	version: string;
	description: string;
}

/** A configurable footer link: an arbitrary label and URL. */
export interface ResourceLink {
	label: string;
	url: string;
}

/**
 * Message events FiveM dispatches to the loading screen. Used by the
 * generated vanilla runtime to drive progress/init UI.
 */
export const LoadEvents = [
	"loadProgress",
	"onLogLine",
	"startDataFileEntries",
	"onDataFileEntry",
	"endDataFileEntries",
	"performMapLoadFunction",
	"startInitFunction",
	"startInitFunctionOrder",
	"initFunctionInvoking",
	"initFunctionInvoked",
	"endInitFunction",
] as const;

export type LoadEvent = (typeof LoadEvents)[number];
