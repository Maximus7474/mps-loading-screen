import type { ThemeConfig } from "@mps-loading-screen/shared";

const FONT_PRESETS: Array<[string, string]> = [
	[
		"Oswald / Inter",
		"'Oswald','Rajdhani','Arial Narrow',sans-serif  ·  'Inter','Segoe UI',system-ui,sans-serif",
	],
	[
		"Archivo / Space Grotesk",
		"'Archivo','Arial Narrow',sans-serif  ·  'Space Grotesk',system-ui,sans-serif",
	],
	["Bebas / Fira", "'Bebas Neue','Bebas',sans-serif  ·  'Fira Sans','Segoe UI',sans-serif"],
];

const ALIGN_OPTIONS: Array<[ThemeConfig["align"], string]> = [
	["center", "Centered"],
	["left", "Left"],
];

export function ColorField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<label className="color-field">
			<span className="field-label">{label}</span>
			<span className="color-swatch">
				<input
					type="color"
					value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#0b0d12"}
					onChange={(e) => onChange(e.target.value)}
				/>
				<span className="swatch-hex">{value}</span>
			</span>
		</label>
	);
}

interface ThemePanelProps {
	theme: ThemeConfig;
	onSet: (patch: Partial<ThemeConfig>) => void;
}

export function ThemePanel({ theme, onSet }: ThemePanelProps) {
	return (
		<details className="panel" open>
			<summary>Theme</summary>
			<div className="panel-body">
				<div className="color-grid">
					<ColorField label="Base" value={theme.bg} onChange={(v) => onSet({ bg: v })} />
					<ColorField label="Panel" value={theme.panel} onChange={(v) => onSet({ panel: v })} />
					<ColorField label="Accent" value={theme.accent} onChange={(v) => onSet({ accent: v })} />
					<ColorField
						label="Accent 2"
						value={theme.accent2}
						onChange={(v) => onSet({ accent2: v })}
					/>
					<ColorField label="Text" value={theme.text} onChange={(v) => onSet({ text: v })} />
					<ColorField label="Muted" value={theme.muted} onChange={(v) => onSet({ muted: v })} />
				</div>

				<div className="field">
					<label className="field-label" htmlFor="theme-align">
						Alignment
					</label>
					<select
						id="theme-align"
						value={theme.align}
						onChange={(e) => onSet({ align: e.target.value as ThemeConfig["align"] })}
					>
						{ALIGN_OPTIONS.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</div>

				<div className="field">
					<label className="field-label" htmlFor="theme-scale">
						Size scale — {Number(theme.scale ?? 1).toFixed(2)}
					</label>
					<input
						id="theme-scale"
						type="range"
						min={0.6}
						max={1.4}
						step={0.05}
						value={theme.scale ?? 1}
						onChange={(e) => onSet({ scale: Number(e.target.value) })}
					/>
				</div>

				<div className="font-stack">
					<div className="field">
						<label className="field-label" htmlFor="theme-display">
							Display font
						</label>
						<input
							id="theme-display"
							value={theme.displayFont}
							onChange={(e) => onSet({ displayFont: e.target.value })}
							list="display-fonts"
						/>
						<datalist id="display-fonts">
							<option value={FONT_PRESETS[0]?.[0]?.split(" ")[0]} />
							<option value={FONT_PRESETS[1]?.[0]?.split(" ")[0]} />
							<option value={FONT_PRESETS[2]?.[0]?.split(" ")[0]} />
						</datalist>
					</div>
					<p className="field-help">
						Body &amp; mono inherit from the default stacks defined in the generated CSS.
					</p>
				</div>
			</div>
		</details>
	);
}
