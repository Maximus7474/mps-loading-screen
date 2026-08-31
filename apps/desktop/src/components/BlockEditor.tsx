import type { BlockInstance, BlockValues, ResourceLink, ResourceGlobals } from "@loadscreen/shared";
import { BLOCK_BY_ID } from "@loadscreen/shared";
import { FieldControl } from "./FieldControl";

interface BlockEditorProps {
	block: BlockInstance;
	values: BlockValues;
	onValue: (key: string, value: unknown) => void;
	globals: ResourceGlobals;
	onChangeLinks: (links: ResourceLink[]) => void;
}

export function BlockEditor({ block, values, onValue, globals, onChangeLinks }: BlockEditorProps) {
	const definition = BLOCK_BY_ID[block.id];
	if (!definition) return null;

	const links = (globals.links ?? []).map((link) => ({
		label: String(link?.label ?? ""),
		url: String(link?.url ?? ""),
	}));

	return (
		<div className="block-fields">
			{definition.fields.map((field) => {
				const show = !field.when || values[field.when.key] === field.when.value;
				if (!show) return null;
				return (
					<div className="field" key={field.key}>
						{field.type === "boolean" ? (
							<FieldControl
								field={field}
								value={values[field.key]}
								onChange={(v) => onValue(field.key, v)}
							/>
						) : (
							<>
								<label className="field-label" htmlFor={`${block.id}-${field.key}`}>
									{field.label}
								</label>
								<FieldControl
									field={field}
									value={values[field.key]}
									onChange={(v) => onValue(field.key, v)}
								/>
								{field.help ? <p className="field-help">{field.help}</p> : null}
							</>
						)}
					</div>
				);
			})}

			{block.id === "footer" ? (
				<div className="block-fields block-fields--sub">
					<p className="field-label">Link targets (sent via handover)</p>
					<p className="field-help" style={{ marginTop: 0 }}>
						Add any buttons — Discord, Websites, stores, rules — each with its own label and URL.
					</p>

					{links.map((link, i) => (
						<div className="link-row" key={i}>
							<div className="field">
								<label className="field-label" htmlFor={`footer-link-label-${i}`}>
									Label
								</label>
								<input
									id={`footer-link-label-${i}`}
									value={link.label}
									onChange={(e) => onChangeLinks(setLink(links, i, { label: e.target.value }))}
								/>
							</div>
							<div className="field">
								<label className="field-label" htmlFor={`footer-link-url-${i}`}>
									URL
								</label>
								<div className="link-url-row">
									<input
										id={`footer-link-url-${i}`}
										type="url"
										placeholder="https://…"
										value={link.url}
										onChange={(e) => onChangeLinks(setLink(links, i, { url: e.target.value }))}
									/>
									<button
										type="button"
										className="list-remove"
										title="Remove link"
										onClick={() => onChangeLinks(links.filter((_, idx) => idx !== i))}
									>
										×
									</button>
								</div>
							</div>
							<div className="link-row-moves">
								<button
									type="button"
									onClick={() => onChangeLinks(moveLink(links, i, -1))}
									disabled={i === 0}
									title="Move up"
								>
									↑
								</button>
								<button
									type="button"
									onClick={() => onChangeLinks(moveLink(links, i, 1))}
									disabled={i === links.length - 1}
									title="Move down"
								>
									↓
								</button>
							</div>
						</div>
					))}

					<button type="button" onClick={() => onChangeLinks([...links, { label: "", url: "" }])}>
						+ Add link
					</button>
				</div>
			) : null}
		</div>
	);
}

function setLink(
	links: ResourceLink[],
	index: number,
	patch: Partial<ResourceLink>,
): ResourceLink[] {
	return links.map((link, i) => (i === index ? { ...link, ...patch } : link));
}

function moveLink(links: ResourceLink[], index: number, dir: -1 | 1): ResourceLink[] {
	const target = index + dir;
	if (target < 0 || target >= links.length) return links;
	const next = [...links];
	const [moving] = next.splice(index, 1);
	next.splice(target, 0, moving as ResourceLink);
	return next;
}
