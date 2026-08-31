import { useMemo } from "react";
import type { LoadScreenConfig } from "@mps-loading-screen/shared";
import { renderPreviewHtml } from "@mps-loading-screen/resource-generator";

export function PreviewPane({ config }: { config: LoadScreenConfig }) {
	const srcDoc = useMemo(() => renderPreviewHtml(config), [config]);
	return (
		<div className="preview">
			<div className="preview-toolbar">
				<span className="preview-title">Live preview</span>
				<span className="preview-hint">simulated handover + load events</span>
			</div>
			<div className="preview-frame">
				<iframe
					title="Loading screen preview"
					className="preview-iframe"
					srcDoc={srcDoc}
					sandbox="allow-scripts"
				/>
			</div>
		</div>
	);
}
