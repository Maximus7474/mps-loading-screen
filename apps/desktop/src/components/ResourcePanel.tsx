import type { ResourceMeta, ResourceGlobals } from "@loadscreen/shared";
import type { ResourceMetaInfo } from "../api/tauri";

function linesToArray(v: unknown): string[] {
	return (Array.isArray(v) ? (v as unknown[]) : [])
		.map(String)
		.map((s) => s.trim())
		.filter(Boolean);
}
function arrayToLines(v: unknown): string {
	return Array.isArray(v) ? (v as unknown[]).map(String).join("\n") : "";
}

interface ResourcePanelProps {
	meta: ResourceMeta;
	globals: ResourceGlobals;
	resourceMeta: ResourceMetaInfo | null;
	onMeta: (patch: Partial<ResourceMeta>) => void;
	onGlobals: (patch: Partial<ResourceGlobals>) => void;
}

export function ResourcePanel({
	meta,
	globals,
	resourceMeta,
	onMeta,
	onGlobals,
}: ResourcePanelProps) {
	return (
		<>
			<details className="panel">
				<summary>Handover / connecting data</summary>
				<div className="panel-body">
					<div className="field">
						<label className="field-label" htmlFor="globals-server">
							Server name
						</label>
						<input
							id="globals-server"
							value={globals.serverName ?? ""}
							onChange={(e) => onGlobals({ serverName: e.target.value })}
						/>
					</div>
					<div className="field-row">
						<div className="field">
							<label className="field-label" htmlFor="globals-mode">
								Gamemode
							</label>
							<input
								id="globals-mode"
								value={globals.gamemode ?? ""}
								onChange={(e) => onGlobals({ gamemode: e.target.value })}
							/>
						</div>
						<div className="field">
							<label className="field-label" htmlFor="globals-max">
								Max players
							</label>
							<input
								id="globals-max"
								type="number"
								min={1}
								value={globals.maxPlayers ?? ""}
								onChange={(e) =>
									onGlobals({ maxPlayers: e.target.value ? Number(e.target.value) : undefined })
								}
							/>
						</div>
					</div>
					<div className="field">
						<label className="field-label" htmlFor="globals-motto">
							Motto
						</label>
						<input
							id="globals-motto"
							value={globals.motto ?? ""}
							onChange={(e) => onGlobals({ motto: e.target.value })}
						/>
					</div>
					<div className="field">
						<label className="field-label" htmlFor="globals-statuses">
							Status lines (handover ticker)
						</label>
						<textarea
							id="globals-statuses"
							rows={4}
							value={arrayToLines(globals.statuses)}
							onChange={(e) => onGlobals({ statuses: linesToArray(e.target.value.split(/\r?\n/)) })}
						/>
						<p className="field-help">
							Used by the Status block when its source is “Status lines from handover”.
						</p>
					</div>
				</div>
			</details>
		</>
	);
}
