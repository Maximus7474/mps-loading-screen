import type { LoadScreenConfig, BlockInstance } from "@mps-loading-screen/shared";
import { escapeHtml, escapeUrl, attrs } from "./escape";

export function blockValues(config: LoadScreenConfig, id: string): BlockInstance | undefined {
	return config.blocks.find((b) => b.id === id && b.enabled);
}

function str(instance: BlockInstance | undefined, key: string): string {
	const value = instance?.values[key];
	return typeof value === "string" ? value : "";
}

function bool(instance: BlockInstance | undefined, key: string): boolean {
	return instance?.values[key] === true;
}

/** The <title> used in the generated document head. */
export function buildTitle(config: LoadScreenConfig): string {
	const hero = blockValues(config, "hero");
	const custom = str(hero, "customTitle");
	const title =
		hero?.values.titleSource === "custom" && custom
			? custom
			: config.globals.serverName || "Loading";
	return escapeHtml(title);
}

/** The fallback text baked into the hero title element. */
export function titleFallback(config: LoadScreenConfig): string {
	const hero = blockValues(config, "hero");
	const custom = str(hero, "customTitle");
	return hero?.values.titleSource === "custom"
		? custom || config.globals.serverName || ""
		: config.globals.serverName || "";
}

/** Markup for the fullscreen background and scrim. */
function backgroundMarkup(config: LoadScreenConfig): string {
	const bg = blockValues(config, "background");

	if (!bg) {
		return `<div class="ls-scrim"></div>`;
	}

	const kind = str(bg, "kind") || "gradient";
	const animate = bg.values.animate !== false;
	const animeClass = animate ? " ls-bg--anime" : "";
	const position = (str(bg, "imagePosition") || "center") === "cover" ? "center / cover" : "center";

	let layer = "";
	if (kind === "image") {
		const url = escapeUrl(str(bg, "imageUrl"));
		if (url) {
			layer = `<div class="ls-bg ls-bg--image${animeClass}" style="background-image:${url};background-position:${position}"></div>`;
		} else {
			layer = `<div class="ls-bg${animeClass}"></div>`;
		}
	} else if (kind === "video") {
		const url = escapeUrl(str(bg, "videoUrl"));
		layer = `<video class="ls-bg ls-bg--video${animeClass}" autoplay muted loop playsinline${url ? ` src="${url}"` : ""}></video>`;
	} else {
		const colors = (bg.values.gradient as string[]) ?? [];
		const list =
			colors
				.map((line) => line.trim())
				.filter(Boolean)
				.join(", ") || "rgba(0,0,0,0.2) 0%, #05070d 100%";
		layer = `<div class="ls-bg${animeClass}" style="background:linear-gradient(180deg, ${list})"></div>`;
	}

	return `${layer}\n  <div class="ls-scrim"></div>`;
}

function heroMarkup(config: LoadScreenConfig): string {
	const hero = blockValues(config, "hero");
	if (!hero) return "";

	const eyebrow = str(hero, "eyebrow");
	const subtitle = str(hero, "subtitle");
	const fallback = titleFallback(config);

	return [
		`  <section class="blk blk--hero">`,
		eyebrow ? `    <p class="blk-eyebrow">${escapeHtml(eyebrow)}</p>` : "",
		`    <h1 class="blk-title">${escapeHtml(fallback)}</h1>`,
		subtitle ? `    <p class="blk-subtitle">${escapeHtml(subtitle)}</p>` : "",
		`  </section>`,
	]
		.filter(Boolean)
		.join("\n");
}

function statusMarkup(config: LoadScreenConfig): string {
	const status = blockValues(config, "status");
	if (!status) return "";
	return [
		`  <section class="blk blk--status" data-status>`,
		`    <p class="blk-status"><span class="status-text"></span><span class="status-caret" aria-hidden="true"></span></p>`,
		`  </section>`,
	].join("\n");
}

function progressMarkup(config: LoadScreenConfig): string {
	const progress = blockValues(config, "progress");
	if (!progress) return "";

	const label = str(progress, "label") || "LOADING";
	const showPercent = bool(progress, "showPercent");

	return [
		`  <section class="blk blk--progress">`,
		`    <div class="prog-head">`,
		`      <span class="prog-label">${escapeHtml(label)}</span>`,
		showPercent ? `      <span class="prog-pct">0%</span>` : "",
		`    </div>`,
		`    <div class="prog-track"><div class="prog-fill"></div></div>`,
		`  </section>`,
	]
		.filter(Boolean)
		.join("\n");
}

function handoverMarkup(config: LoadScreenConfig): string {
	const handover = blockValues(config, "handover");
	if (!handover) return "";

	const welcomeLabel = str(handover, "welcomeLabel") || "Welcome, ";
	const connectingLabel = str(handover, "connectingLabel") || "Connecting to";
	const showPlayerName = bool(handover, "showPlayerName");
	const showAddress = bool(handover, "showServerAddress");

	const rows: string[] = [];
	if (showPlayerName) {
		rows.push(
			`    <p class="blk-greet"><span class="h-prefix">${escapeHtml(welcomeLabel)}</span><span class="h-name"></span></p>`,
		);
	}
	if (showAddress) {
		rows.push(
			`    <p class="blk-addr"><span class="h-prefix">${escapeHtml(connectingLabel)} </span><code class="h-addr"></code></p>`,
		);
	}
	if (!rows.length) return "";
	return [`  <section class="blk blk--handover">`, ...rows, `  </section>`].join("\n");
}

function footerMarkup(config: LoadScreenConfig): string {
	const footer = blockValues(config, "footer");
	if (!footer) return "";

	const links = config.globals.links ?? [];
	if (!links.length) return "";

	const items = links.map(
		(link, i) =>
			`      <a class="link" data-index="${i}"${attrs({ href: "#" })}><span class="link-label">${escapeHtml(
				String(link?.label ?? ""),
			)}</span></a>`,
	);

	return [`  <nav class="blk blk--footer">`, ...items, `  </nav>`].join("\n");
}

/** Body markup (inside <body class="ls">), minus the <script>. */
export function buildBody(config: LoadScreenConfig): string {
	const ordered = [...config.blocks]
		.filter((b) => b.enabled && b.id !== "background" && b.id !== "hero")
		.sort((a, b) => a.order - b.order);

	const heroHtml = heroMarkup(config);
	const sections: string[] = [];
	if (heroHtml) sections.push(heroHtml);
	for (const instance of ordered) {
		if (instance.id === "background" || instance.id === "hero") continue;
		const markup = sectionFor(config, instance.id);
		if (markup) sections.push(markup);
	}

	return [
		`  ${backgroundMarkup(config)}`,
		`  <main class="ls-stage ls-stage--${config.theme.align === "left" ? "left" : "right"}">`,
		`    <div class="ls-urn">`,
		...sections.map((section) => section.replace(/^  /, "    ")),
		`    </div>`,
		`  </main>`,
	].join("\n");
}

function sectionFor(config: LoadScreenConfig, id: string): string {
	switch (id) {
		case "hero":
			return heroMarkup(config);
		case "status":
			return statusMarkup(config);
		case "progress":
			return progressMarkup(config);
		case "handover":
			return handoverMarkup(config);
		case "footer":
			return footerMarkup(config);
		default:
			return "";
	}
}
