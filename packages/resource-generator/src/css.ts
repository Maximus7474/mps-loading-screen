import type { LoadScreenConfig, BlockInstance } from "@mps-loading-screen/shared";

function cssColor(value: string | undefined, fallback: string): string {
	return value?.trim() ? value : fallback;
}

function cssUrl(value: string | undefined): string {
	if (value && value.trim()) return `url("${cssColor(value, "").replace(/"/g, "&quot;")}")`;
	return "";
}

/** Build the complete <style> content for the generated loading screen. */
export function buildCss(config: LoadScreenConfig): string {
	const { theme } = config;
	const bg = config.blocks.find((b) => b.id === "background" && b.enabled);
	// Keep default geometry even without a background block.
	const background = bg ?? fallbackBackground();

	const kind = background.values.kind as string;
	const gradientLines = (background.values.gradient as string[]) ?? [];
	const gradientColors = gradientLines
		.map((line) => line.trim())
		.filter(Boolean)
		.join(", ");

	const imageUrl = cssUrl(background.values.imageUrl as string);
	const videoUrl = cssUrl(background.values.videoUrl as string);
	const overlay = clamp(Number(background.values.overlay) || 0.55, 0, 1);
	const blur = clamp(Number(background.values.blur) || 0, 0, 40);
	const animate = background.values.animate !== false;
	const imagePosition = (background.values.imagePosition as string) ?? "center";
	const align = theme.align === "left" ? "left" : "center";
	const thickness = clamp(Number(progressThickness(config)) || 3, 1, 12);

	return `
:root {
  --bg: ${cssColor(theme.bg, "#0b0d12")};
  --panel: ${cssColor(theme.panel, "#151a24")};
  --accent: ${cssColor(theme.accent, "#ff4d2e")};
  --accent2: ${cssColor(theme.accent2, "#5ee6eb")};
  --text: ${cssColor(theme.text, "#f2f4f8")};
  --muted: ${cssColor(theme.muted, "#9aa3b2")};
  --font-display: ${theme.displayFont || "sans-serif"};
  --font-body: ${theme.bodyFont || "sans-serif"};
  --font-mono: ${theme.monoFont || "monospace"};
  --scale: ${clamp(Number(theme.scale) || 1, 0.6, 1.4)};
  --outline: 2px dashed var(--accent);
  --track: ${thickness}px;
}

* { box-sizing: border-box; }

html, body { height: 100%; }

body.ls {
  margin: 0;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

/* ---- Background layer ---- */
.ls-bg {
  position: fixed;
  inset: 0;
  z-index: -2;
  background-color: var(--bg);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  transform-origin: center;
}

.ls-bg--anime {
  animation: ls-drift 28s ease-in-out infinite alternate;
}

.ls-bg--image { background-image: ${imageUrl || "none"}; }
.ls-bg--video { object-fit: cover; width: 100%; height: 100%; }

@keyframes ls-drift {
  from { transform: scale(1); }
  to   { transform: scale(1.08); }
}

.ls-scrim {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: radial-gradient(120% 90% at 50% 30%, rgba(0,0,0,0) 0%, rgba(5,7,13,${cssColor(String(overlay), "0.55")}) 78%);
  backdrop-filter: blur(${blur}px);
  -webkit-backdrop-filter: blur(${blur}px);
}

/* ---- Stage ---- */
.ls-stage {
  position: relative;
  height: 100vh;
  display: grid;
  place-items: ${align === "left" ? "start stretch" : "center"};
  padding: ${align === "left" ? "clamp(24px, 9vw, 96px)" : "6vw"};
}

.ls-stage--left > .ls-urn {
  justify-self: start;
  text-align: left;
  max-width: min(560px, 94vw);
}

.ls-urn {
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 3.2vh, 40px);
  width: min(720px, 90vw);
  transform: scale(var(--scale));
  transform-origin: center;
}

/* ---- Blocks ---- */
.blk { margin: 0; }

.blk-eyebrow {
  margin: 0 0 10px;
  font-family: var(--font-mono);
  font-size: clamp(11px, 1.4vw, 14px);
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--accent2);
  opacity: 0.9;
}

.blk-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(38px, 8.4vw, 92px);
  line-height: 0.96;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  text-shadow: 0 2px 24px rgba(0,0,0,0.45);
}

.blk-subtitle {
  margin: clamp(8px, 1.6vh, 16px) 0 0;
  font-size: clamp(15px, 2vw, 19px);
  color: var(--muted);
  text-shadow: 0 1px 8px rgba(0,0,0,0.5);
  max-width: 44ch;
}

/* ---- Status ticker ---- */
.blk-status {
  display: flex;
  align-items: baseline;
  gap: 0.5em;
  margin: 0;
  font-family: var(--font-mono);
  font-size: clamp(12px, 1.5vw, 14px);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}

.status-caret {
  width: 8px; height: 8px;
  border-radius: 999px;
  background: var(--accent);
  align-self: center;
  animation: ls-blink 1.1s steps(2, start) infinite;
}

@keyframes ls-blink { to { opacity: 0; } }

/* ---- Progress ---- */
.prog-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
  font-family: var(--font-mono);
  font-size: clamp(11px, 1.3vw, 13px);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
}

.prog-track {
  position: relative;
  height: var(--track);
  background: var(--panel);
  border: 1px solid rgba(255,255,255,0.08);
}

.prog-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0%;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  box-shadow: 0 0 14px rgba(255,77,46,0.5);
  transition: width 0.18s linear;
}

/* ---- Handover ---- */
.blk-greet, .blk-addr {
  margin: 0;
  font-family: var(--font-mono);
  font-size: clamp(13px, 1.6vw, 16px);
  letter-spacing: 0.06em;
  color: var(--muted);
}

.blk-greet .h-name { color: var(--text); font-weight: 600; }

.h-addr { color: var(--accent2); }

/* ---- Footer links ---- */
.blk-footer {
  display: flex;
  gap: clamp(10px, 1.6vw, 20px);
  flex-wrap: wrap;
  margin-top: 4px;
}

.link {
  font-family: var(--font-mono);
  font-size: clamp(11px, 1.3vw, 13px);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--muted);
  padding: 9px 16px;
  border: 1px solid rgba(255,255,255,0.14);
  transition: color 120ms ease, border-color 120ms ease, background 120ms ease;
}

.link:hover, .link:focus-visible {
  color: var(--bg);
  background: var(--accent);
  border-color: var(--accent);
}

.link.is-off { display: none; }

:focus-visible { outline: var(--outline); outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .ls-bg--anime { animation: none; }
  .status-caret { animation: none; opacity: 1; }
  .prog-fill { transition: none; }
}
`.trim();
}

function clamp(value: number, min: number, max: number): number {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, value));
}

function progressThickness(config: LoadScreenConfig): number {
	const block = config.blocks.find((b) => b.id === "progress" && b.enabled);
	return Number(block?.values.thickness) || 3;
}

function fallbackBackground(): BlockInstance {
	return {
		id: "background",
		enabled: true,
		order: 0,
		values: {
			kind: "gradient",
			gradient: ["#101320", "#05070d"],
			overlay: 0.55,
			blur: 0,
			animate: true,
		},
	};
}
