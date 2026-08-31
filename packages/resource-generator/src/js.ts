import type { LoadScreenConfig } from "@loadscreen/shared";
import { blockValues, titleFallback } from "./html";

function jstr(value: unknown): string {
	return JSON.stringify(value ?? "");
}

/** Build the inline <script> body for the generated loading screen. */ export function buildScript(
	config: LoadScreenConfig,
): string {
	const status = blockValues(config, "status");
	const statusItems = statusItemsFor(config);

	const cfg = {
		titleFb: titleFallback(config),
		statusInterval: Number(status?.values.interval) || 2600,
		statuses: statusItems,
		statusFromGlobal: status?.values.source === "globals",
		links: config.globals.links ?? [],
	};

	return `
(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const setText = (el, v) => { if (el) el.textContent = v; };
  const clamp01 = (v) => { v = Number(v); if (!Number.isFinite(v)) return 0; return Math.min(1, Math.max(0, v)); };
  const isObj = (v) => v !== null && typeof v === "object";

  // window.nuiHandoverData is injected by FiveM; missing during a plain
  // file:// preview, so reconcile reads it lazily after DOMContentLoaded.
  const DATA = {};
  function captureData() { Object.assign(DATA, window.nuiHandoverData || {}); }

  function setProgress(fraction) {
    const fill = $(".prog-fill");
    const pct = $(".prog-pct");
    if (fill) fill.style.width = (fraction * 100) + "%";
    if (pct) pct.textContent = Math.round(fraction * 100) + "%";
  }

  function reconcile() {
    captureData();

    const title = $(".blk-title");
    if (title) setText(title, DATA.serverName || ${jstr(cfg.titleFb)});

    const name = $(".h-name");
    if (name) setText(name, DATA.name || "");
    const addr = $(".h-addr");
    if (addr) setText(addr, DATA.serverAddress || "");

    // Footer links resolve from handover first, statically baked as fallback.
    const bakedLinks = ${jstr(cfg.links)};
    document.querySelectorAll("[data-index]").forEach((a) => {
      const i = Number(a.getAttribute("data-index"));
      if (!Number.isInteger(i)) return;
      const list = Array.isArray(DATA.links) ? DATA.links : bakedLinks;
      const link = (Array.isArray(list) && list[i]) || bakedLinks[i] || null;
      const url = (link && link.url) || "";
      const labelEl = a.querySelector(".link-label") || a;
      setText(labelEl, (link && link.label) || "");
      a.setAttribute("href", url || "#");
      if (url) a.classList.remove("is-off");
      else a.classList.add("is-off");
    });		// Status ticker.
		const statusEl = $(".status-text");
		if (statusEl) {
			const fromGlobal = ${jstr(cfg.statusFromGlobal)};
			let lines = ${jstr(cfg.statuses)};
			if (fromGlobal && Array.isArray(DATA.statuses) && DATA.statuses.length) lines = DATA.statuses;
			if (!Array.isArray(lines) || !lines.length) lines = [];
			if (lines.length) {
				let i = 0;
				setText(statusEl, lines[0]);
				if (lines.length > 1) {
					setInterval(() => { i = (i + 1) % lines.length; setText(statusEl, lines[i]); }, ${cfg.statusInterval});
				}
			}
		}
	}

  // Keep the whole stage visible no matter the viewport (the app's preview
  // pane is not 16:9, and players run 4:3 / ultrawide / tiny windows): measure
  // the content and scale it down only when it would overflow.
  function fitToViewport() {
    const stage = $(".ls-stage");
    const urn = $(".ls-urn");
    if (!stage || !urn) return;
    const cs = getComputedStyle(stage);
    const padV = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const avail = Math.max(1, stage.clientHeight - padV);
    const natural = urn.offsetHeight; // layout height, ignores the transform
    if (!natural) return;
    const theme = parseFloat(getComputedStyle(urn).getPropertyValue("--scale")) || 1;
    const scale = Math.min(theme, avail / natural);
    urn.style.transformOrigin = stage.classList.contains("ls-stage--left") ? "top center" : "center";
    urn.style.transform = "scale(" + scale.toFixed(4) + ")";
  }

	window.addEventListener("message", (event) => {
		if (!isObj(event.data) || typeof event.data.eventName !== "string") return;
		if (event.data.eventName === "loadProgress") {
			setProgress(clamp01(event.data.loadFraction));
		}
	});

  function boot() {
    reconcile();
    fitToViewport();
  }

	captureData();
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
	else boot();
  window.addEventListener("resize", fitToViewport);
})();
`.trim();
}

function statusItemsFor(config: LoadScreenConfig): string[] {
	const status = blockValues(config, "status");
	if (!status) return [];
	const source = status.values.source ?? "custom";
	if (source === "globals") {
		return (config.globals.statuses ?? []).map(String);
	}
	const value = status.values.customItems;
	if (Array.isArray(value)) return (value as unknown[]).map(String).filter((s) => s.trim().length);
	if (typeof value === "string") {
		return value
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	}
	return [];
}
