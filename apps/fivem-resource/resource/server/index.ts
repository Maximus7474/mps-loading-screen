import Config, { type ServerConfig } from "common/config";

interface Deferrals {
	handover(data: { [key: string]: unknown }): void;
}

// Hide FiveM's default busy spinner for the duration of the loading screen.
// Mirrors `setr sv_showBusySpinnerOnLoadingScreen false` from within the resource.
SetConvarReplicated("sv_showBusySpinnerOnLoadingScreen", "false");

on(
	"playerConnecting",
	(name: string, _setKickReason: (reason: string) => void, deferrals: Deferrals) => {
		const data: Record<string, unknown> = {
			name,
			serverName: Config.serverName ?? "",
		};
		for (const key of ["gamemode", "motto", "statuses", "links", "maxPlayers"] as const) {
			const value: ServerConfig[typeof key] = Config[key];
			if (value !== undefined) data[key] = value;
		}
		deferrals.handover(data);
	},
);
