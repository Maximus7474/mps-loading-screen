/** Escape a string for safe insertion into HTML text/attributes. */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/** Escape a url for an attribute; strips script-ish schemes defensively. */
export function escapeUrl(value: string): string {
	const trimmed = value.trim();
	if (/^(javascript|data|vbscript):/i.test(trimmed)) return "#";
	return escapeHtml(trimmed);
}

/** Convert an object to an attribute string, skipping null/undefined. */
export function attrs(record: Record<string, string | number | undefined | null>): string {
	const parts: string[] = [];
	for (const [key, value] of Object.entries(record)) {
		if (value === null || value === undefined) continue;
		parts.push(`${key}="${escapeHtml(String(value))}"`);
	}
	return parts.length ? ` ${parts.join(" ")}` : "";
}
