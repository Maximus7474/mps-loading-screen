import type { LoadScreenConfig } from "@mps-loading-screen/shared";

/**
 * A self-contained script appended to the preview HTML that mimics FiveM's
 * `window.nuiHandoverData` and streams simulated load events, so users can see
 * the screen behave exactly as it will in-game.
 */
export function buildPreviewShim(config: LoadScreenConfig): string {
	const previewData = {
		name: "Maximus Prime",
		serverAddress: "Prime RP",
		...config.globals,
	};

	return `
<script>
(() => {
  "use strict";
  const data = ${JSON.stringify(previewData)};

  Object.defineProperty(window, "nuiHandoverData", {
    value: data,
    configurable: true,
    writable: true
  });

  const dispatch = (payload) => window.dispatchEvent(new MessageEvent("message", { data: payload }));

  window.addEventListener("load", () => {
    let fraction = 0;
    dispatch({ eventName: "startInitFunction", type: "LOADING_SCREEN", name: "init", idx: 0, count: 4 });
    const step = () => {
      fraction = Math.min(1, fraction + Math.random() * 0.16);
      dispatch({ eventName: "loadProgress", loadFraction: fraction });
      if (fraction < 1) setTimeout(step, 460 + Math.random() * 620);
    };
    setTimeout(step, 250);
  });
})();
</script>
`.trim();
}
