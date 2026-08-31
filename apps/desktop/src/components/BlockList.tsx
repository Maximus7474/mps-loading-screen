import type { BlockInstance, ResourceGlobals, ResourceLink } from "@loadscreen/shared";
import { BLOCK_BY_ID } from "@loadscreen/shared";
import { BlockEditor } from "./BlockEditor";

interface BlockListProps {
	blocks: BlockInstance[];
	expandedId: string | null;
	onExpand: (id: string | null) => void;
	onToggle: (id: string) => void;
	onMove: (id: string, dir: -1 | 1) => void;
	onValue: (id: string, key: string, value: unknown) => void;
	globals: ResourceGlobals;
	onChangeLinks: (links: ResourceLink[]) => void;
}

export function BlockList({
	blocks,
	expandedId,
	onExpand,
	onToggle,
	onMove,
	onValue,
	globals,
	onChangeLinks,
}: BlockListProps) {
	return (
		<div className="block-list">
			{blocks.map((block, i) => {
				const definition = BLOCK_BY_ID[block.id];
				if (!definition) return null;
				const expanded = expandedId === block.id;
				return (
					<div className={`block-card${block.enabled ? "" : " block-card--off"}`} key={block.id}>
						<div className="block-head">
							<button
								className="block-toggle"
								aria-pressed={block.enabled}
								title={block.enabled ? "Disable" : "Enable"}
								onClick={() => onToggle(block.id)}
							>
								<span className="block-dot" />
							</button>
							<button className="block-name" onClick={() => onExpand(expanded ? null : block.id)}>
								<span className="block-icon" aria-hidden="true">
									{definition.icon}
								</span>
								{definition.name}
							</button>
							<div className="block-moves">
								<button onClick={() => onMove(block.id, -1)} disabled={i === 0} title="Move up">
									↑
								</button>
								<button
									onClick={() => onMove(block.id, 1)}
									disabled={i === blocks.length - 1}
									title="Move down"
								>
									↓
								</button>
							</div>
						</div>
						{expanded ? (
							<BlockEditor
								block={block}
								values={block.values}
								onValue={(key, value) => onValue(block.id, key, value)}
								globals={globals}
								onChangeLinks={onChangeLinks}
							/>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
