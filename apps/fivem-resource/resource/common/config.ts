import { LoadFile } from "./utils";

/**
 * Mirrors the `ResourceGlobals` shape in @loadscreen/shared — the static
 * handover fields the app writes into `public/config.json`. Keeping a local
 * copy here keeps the shipped resource self-contained (no cross-package
 * dependency at build/runtime time).
 */
export interface ServerConfig {
	serverName: string;
	gamemode?: string;
	motto?: string;
	statuses?: string[];
	links?: {
		label: string;
		url: string;
	}[];
	maxPlayers?: number;
}

export const Config: ServerConfig = LoadFile<ServerConfig>("public/config.json");
export default Config;
