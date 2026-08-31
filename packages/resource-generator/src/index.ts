import type { LoadScreenConfig } from "@mps-loading-screen/shared";
import { buildBody, buildTitle } from "./html";
import { buildCss } from "./css";
import { buildScript } from "./js";
import { buildPreviewShim } from "./preview";

export type GeneratedFile = "load.html" | "config.json";

export interface GeneratedFiles {
	"load.html": string;
	"config.json": string;
}

const DOC_HEAD = `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />`;

/**
 * Render a {@link LoadScreenConfig} into the deployable resource files:
 * a fully self-contained vanilla `load.html` (styles + runtime script inline)
 * and a `config.json` carrying the runtime handover fields for the server.
 */
export function render(config: LoadScreenConfig): GeneratedFiles {
	return {
		"load.html": renderHtml(config),
		"config.json": serializeGlobals(config),
	};
}

/**
 * The `load.html` for the live in-app preview: identical to the shipped file,
 * with a simulation shim appended so the screen animates like a real load.
 */
export function renderPreviewHtml(config: LoadScreenConfig): string {
	return `${renderHtml(config)}\n${buildPreviewShim(config)}`;
}

/** The `config.json` body read by the resource's server at runtime. */
export function serializeGlobals(config: LoadScreenConfig): string {
	return JSON.stringify(config.globals, null, 2);
}

function renderHtml(config: LoadScreenConfig): string {
	const css = buildCss(config);
	const body = buildBody(config);
	const script = buildScript(config);

	return [
		`<!doctype html>`,
		`<html lang="en">`,
		`<head>`,
		DOC_HEAD,
		`<title>${buildTitle(config)}</title>`,
		`<style>`,
		css,
		`</style>`,
		`</head>`,
		`<body class="ls">`,
		body,
		`<script>`,
		script,
		`</script>`,
		`</body>`,
		`</html>`,
	].join("\n");
}
