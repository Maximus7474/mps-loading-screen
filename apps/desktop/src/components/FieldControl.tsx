import type { BlockField } from "@loadscreen/shared";

interface FieldControlProps {
	field: BlockField;
	value: unknown;
	onChange: (value: unknown) => void;
}

function toText(field: BlockField, value: unknown): string {
	if (value == null) return "";
	if (field.type === "textarea" && Array.isArray(value)) return value.map(String).join("\n");
	return String(value);
}

function fromText(field: BlockField, raw: string): unknown {
	if (field.type === "textarea") {
		return raw
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	}
	if (field.type === "number") {
		const n = Number(raw);
		return Number.isFinite(n) ? n : field.default;
	}
	return raw;
}

export function FieldControl({ field, value, onChange }: FieldControlProps) {
	switch (field.type) {
		case "text":
		case "url": {
			return (
				<input
					type={field.type === "url" ? "url" : "text"}
					value={toText(field, value)}
					placeholder={field.placeholder}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
		}
		case "textarea": {
			return (
				<textarea
					rows={Math.min(6, ((value as string[] | undefined)?.length ?? 1) + 1)}
					value={toText(field, value)}
					placeholder={field.placeholder}
					onChange={(e) => onChange(fromText(field, e.target.value))}
				/>
			);
		}
		case "number": {
			return (
				<input
					type="number"
					value={typeof value === "number" ? value : (field.default as number)}
					min={field.min}
					max={field.max}
					step={field.step}
					onChange={(e) => onChange(Number(e.target.value))}
				/>
			);
		}
		case "boolean": {
			return (
				<label className="switch">
					<input
						type="checkbox"
						checked={value === true}
						onChange={(e) => onChange(e.target.checked)}
					/>
					<span className="switch-track">
						<i />
					</span>
					<span className="switch-text">{field.label}</span>
				</label>
			);
		}
		case "select": {
			return (
				<select value={toText(field, value)} onChange={(e) => onChange(e.target.value)}>
					{(field.options ?? []).map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			);
		}
		case "color": {
			return (
				<input
					type="color"
					value={typeof value === "string" ? value : "#000000"}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
		}
		case "colorStops": {
			const stops = (Array.isArray(value) ? value : []).map((v) =>
				typeof v === "string" ? v : "#000000",
			);
			const setAt = (index: number, color: string) => {
				onChange(stops.map((stop, i) => (i === index ? color : stop)));
			};
			const removeAt = (index: number) => {
				onChange(stops.length > 2 ? stops.filter((_, i) => i !== index) : stops);
			};
			return (
				<div className="color-stops">
					{stops.map((stop, i) => (
						<div className="color-stop-row" key={i}>
							<div className="color-swatch">
								<input
									type="color"
									value={isHex(stop) ? stop : "#000000"}
									onChange={(e) => setAt(i, e.target.value)}
									aria-label={`Gradient stop ${i + 1}`}
								/>
								<span className="swatch-hex">{stop}</span>
							</div>
							<button
								type="button"
								className="list-remove"
								title="Remove stop"
								onClick={() => removeAt(i)}
								disabled={stops.length <= 2}
							>
								×
							</button>
						</div>
					))}
					<button type="button" onClick={() => onChange([...stops, "#000000"])}>
						+ Add colour stop
					</button>
				</div>
			);
		}
	}
}

function isHex(value: string): boolean {
	return /^#[0-9a-fA-F]{6}$/.test(value);
}
