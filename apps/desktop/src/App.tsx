import { useCallback, useEffect, useMemo, useState } from "react";
import type { LoadScreenConfig } from "@mps-loading-screen/shared";
import { defaultConfig, deserializeConfig, serializeConfig } from "@mps-loading-screen/shared";
import { render } from "@mps-loading-screen/resource-generator";
import {
	isTauri,
	exportResource,
	loadProject,
	saveProject,
	getResourceMeta,
	type ResourceMetaInfo,
	openProjectDialog,
	saveProjectDialog,
} from "./api/tauri";
import {
	sortedBlocks,
	setMeta,
	setTheme,
	setGlobals,
	setLinks,
	toggleBlock,
	setBlockValue,
	moveBlock,
} from "./state";
import { BlockList } from "./components/BlockList";
import { ResourcePanel } from "./components/ResourcePanel";
import { ThemePanel } from "./components/ThemePanel";
import { PreviewPane } from "./components/PreviewPane";

export default function App() {
	const [config, setConfig] = useState<LoadScreenConfig>(() => defaultConfig());
	const [expandedId, setExpandedId] = useState<string | null>("hero");
	const [savedPath, setSavedPath] = useState<string | null>(null);
	const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
	const [busy, setBusy] = useState(false);
	const [resourceMeta, setResourceMeta] = useState<ResourceMetaInfo | null>(null);

	useEffect(() => {
		let alive = true;
		getResourceMeta().then((meta) => {
			if (alive) setResourceMeta(meta);
		});
		return () => {
			alive = false;
		};
	}, []);

	const blocks = useMemo(() => sortedBlocks(config), [config]);
	const previewHtml = useMemo(() => render(config)["load.html"], [config]);
	const resourceName = useMemo(
		() => sanitize(resourceMeta?.name || config.meta.name || "loadscreen-resource"),
		[resourceMeta, config.meta.name],
	);

	const patch = (next: LoadScreenConfig) => {
		if (savedPath) setSavedPath(null);
		setConfig(next);
		setStatus(null);
	};

	const onOpen = useCallback(async () => {
		try {
			const path = await openProjectDialog();
			if (!path) return;
			const text = await loadProject(path);
			setConfig(deserializeConfig(text));
			setSavedPath(path);
			setStatus({ kind: "ok", text: `Opened project` });
		} catch (e) {
			setStatus({ kind: "err", text: e instanceof Error ? e.message : String(e) });
		}
	}, []);

	const onSave = useCallback(async () => {
		try {
			let path = savedPath;
			if (!path) {
				path = await saveProjectDialog(`${resourceName}.loadscreen`);
				if (!path) return;
			}
			await saveProject(path, serializeConfig(config));
			setSavedPath(path);
			setStatus({ kind: "ok", text: "Saved project" });
		} catch (e) {
			setStatus({ kind: "err", text: e instanceof Error ? e.message : String(e) });
		}
	}, [config, savedPath, resourceName]);

	const onExport = useCallback(async () => {
		if (!isTauri) {
			// Browser fallback: download the generated HTML so the screen is inspectable.
			downloadHtml(previewHtml, `${resourceName}-load.html`);
			setStatus({ kind: "ok", text: "Downloaded load.html (desktop export needs the app)" });
			return;
		}
		setBusy(true);
		try {
			const files = render(config);
			const result = await exportResource(files);
			setStatus({ kind: "ok", text: `Exported → ${result.zipPath}` });
		} catch (e) {
			setStatus({ kind: "err", text: e instanceof Error ? e.message : String(e) });
		} finally {
			setBusy(false);
		}
	}, [config, previewHtml, resourceName]);

	return (
		<div className="app">
			<header className="app-header">
				<div className="brand">
					<span className="brand-mark" aria-hidden="true">
						▦
					</span>
					<div>
						<h1>Loading&nbsp;Screen&nbsp;Builder</h1>
					</div>
				</div>
				<div className="header-actions">
					<button
						onClick={() => {
							setConfig(defaultConfig());
							setSavedPath(null);
							setStatus(null);
						}}
					>
						New
					</button>
					<button onClick={onOpen}>Open…</button>
					<button onClick={onSave}>Save</button>
					<button className="primary" disabled={busy} onClick={onExport}>
						{busy ? "Building…" : "Export .zip"}
					</button>
				</div>
			</header>

			{status ? <div className={`toast toast--${status.kind}`}>{status.text}</div> : null}

			<div className="app-body">
				<aside className="sidebar sidebar--blocks">
					<div className="sidebar-title">Blocks</div>
					<BlockList
						blocks={blocks}
						expandedId={expandedId}
						onExpand={setExpandedId}
						onToggle={(id) => patch(toggleBlock(config, id))}
						onMove={(id, dir) => patch(moveBlock(config, id, dir))}
						onValue={(id, key, value) => patch(setBlockValue(config, id, key, value))}
						globals={config.globals}
						onChangeLinks={(links) => patch(setLinks(config, links))}
					/>
				</aside>

				<main className="stage">
					<PreviewPane config={config} />
				</main>

				<aside className="sidebar sidebar--inspector">
					<ResourcePanel
						meta={config.meta}
						globals={config.globals}
						resourceMeta={resourceMeta}
						onMeta={(p) => patch(setMeta(config, p))}
						onGlobals={(p) => patch(setGlobals(config, p))}
					/>
					<ThemePanel theme={config.theme} onSet={(p) => patch(setTheme(config, p))} />
				</aside>
			</div>
		</div>
	);
}

function sanitize(value: string): string {
	return (
		(value || "loading-screen")
			.toLowerCase()
			.replace(/[^a-z0-9-_]+/g, "-")
			.replace(/^-+|-+$/g, "") || "loading-screen"
	);
}

function downloadHtml(html: string, filename: string) {
	const blob = new Blob([html], { type: "text/html" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 0);
}
