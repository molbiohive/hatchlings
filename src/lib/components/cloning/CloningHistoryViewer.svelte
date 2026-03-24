<script lang="ts">
	import type { CloningNode, CloningSource } from '../../types/cloning.js';
	import type { HoverInfo } from '../../types/utility.js';
	import { countLanes } from '../../util/coordinates.js';
	import { isPrimer } from '../../util/colors.js';
	import { FEATURE_H, PRIMER_H, LANE_GAP, ZONE_GAP, RULER_TICK, LABEL_ROW_H, CUT_SITE_LABEL_H } from '../../util/layout.js';
	import PlasmidViewer from '../plasmid/PlasmidViewer.svelte';

	interface Props {
		root: CloningNode;
		width?: number;
		height?: number;
		nodeSize?: number;
		nodeSpacing?: number;
		onnodeclick?: (node: CloningNode) => void;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		root,
		width = 900,
		height = 600,
		nodeSize = 140,
		nodeSpacing = 80,
		onnodeclick,
		onhoverinfo,
	}: Props = $props();

	const RENDER_SIZE = 500;
	let cssScale = $derived(nodeSize / RENDER_SIZE);

	/** Estimate LinearMap height at RENDER_SIZE width, mirroring its zone layout */
	function estimateLinearHeight(node: CloningNode): number {
		const parts = node.parts ?? [];
		const cs = node.cutSites ?? [];
		const RULER_H = RULER_TICK * 2; // TICK_UP + TICK_DOWN only (showTicks=false)
		const LABEL_ROW = LABEL_ROW_H + ZONE_GAP;

		const fwdFeat = parts.filter(p => !isPrimer(p) && p.strand !== -1);
		const revFeat = parts.filter(p => !isPrimer(p) && p.strand === -1);
		const fwdPrim = parts.filter(p => isPrimer(p) && p.strand !== -1);
		const revPrim = parts.filter(p => isPrimer(p) && p.strand === -1);

		const zoneH = (count: number, itemH: number) =>
			count > 0 ? count * (itemH + LANE_GAP) + ZONE_GAP : 0;

		let h = LABEL_ROW; // name label
		h += cs.length > 0 ? CUT_SITE_LABEL_H + ZONE_GAP : 0; // cut site labels
		h += zoneH(countLanes(fwdPrim), PRIMER_H);
		h += zoneH(countLanes(fwdFeat), FEATURE_H);
		h += RULER_H;
		h += ZONE_GAP;
		h += zoneH(countLanes(revFeat), FEATURE_H);
		h += zoneH(countLanes(revPrim), PRIMER_H);
		h += 4; // bottom padding
		return h;
	}

	function nodeH(node: CloningNode): number {
		if (node.topology !== 'linear') return nodeSize;
		return Math.round(estimateLinearHeight(node) * cssScale);
	}

	function renderH(node: CloningNode): number {
		if (node.topology !== 'linear') return RENDER_SIZE;
		return estimateLinearHeight(node);
	}

	// Spacing constants
	const LABEL_H = 36;
	const SINGLE_CONN_H = 50;
	const BUS_TOP_GAP = 16;
	const BUS_DROP_H = 40;
	const TEXT_GAP = 8;
	const CORNER_R = 8;
	const ARROW_H = 8;
	const ARROW_W = 4;

	// --- Layout ---

	interface PlacedNode {
		node: CloningNode;
		x: number;
		y: number;
	}

	interface SingleConn {
		type: 'single';
		x: number;
		y1: number;
		y2: number;
		opLabel: string;
		label: string;
		source: CloningSource;
	}

	interface BusDrop {
		cx: number;
		label: string;
		/** y-start of this drop line */
		dropY1: number;
	}

	interface BusConn {
		type: 'bus';
		parentCX: number;
		connTop: number;
		busY: number;
		childrenY: number;
		busPath: string;
		drops: BusDrop[];
		opLabel: string;
		source: CloningSource;
	}

	type Connector = SingleConn | BusConn;

	function getOpLabel(source: CloningSource): string {
		if (source.action.label) return source.action.label;
		const t = source.action.paradigm ?? 'operation';
		return t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ');
	}

	/** Compute pixel width of a subtree */
	function treeWidth(node: CloningNode): number {
		if (!node.source?.inputs?.length) return nodeSize;
		const inputs = node.source.inputs;
		if (inputs.length === 1) return Math.max(nodeSize, treeWidth(inputs[0].node));
		let w = 0;
		for (let i = 0; i < inputs.length; i++) {
			if (i > 0) w += nodeSpacing;
			w += treeWidth(inputs[i].node);
		}
		return Math.max(nodeSize, w);
	}

	let layout = $derived.by(() => {
		const nodes: PlacedNode[] = [];
		const connectors: Connector[] = [];

		function place(cnode: CloningNode, x: number, y: number): void {
			nodes.push({ node: cnode, x, y });

			if (!cnode.source?.inputs?.length) return;

			const h = nodeH(cnode);
			const parentCX = x + nodeSize / 2;
			const connTop = y + h + LABEL_H;
			const { inputs } = cnode.source;
			const opLabel = getOpLabel(cnode.source);

			if (inputs.length === 1) {
				const childY = connTop + SINGLE_CONN_H;
				connectors.push({
					type: 'single',
					x: parentCX,
					y1: connTop,
					y2: childY,
					opLabel,
					label: inputs[0].label ?? '',
					source: cnode.source,
				});
				place(inputs[0].node, x, childY);
			} else {
				const busY = connTop + BUS_TOP_GAP;
				const childrenY = busY + BUS_DROP_H;

				// Compute drop positions
				const drops: BusDrop[] = [];
				let childX = x;
				for (let i = 0; i < inputs.length; i++) {
					const childCX = childX + nodeSize / 2;
					const isLast = i === inputs.length - 1;
					drops.push({
						cx: childCX,
						label: inputs[i].label ?? '',
						dropY1: isLast ? busY + CORNER_R : busY,
					});
					place(inputs[i].node, childX, childrenY);
					childX += treeWidth(inputs[i].node) + nodeSpacing;
				}

				// Precompute bus SVG path (horizontal + rounded right end)
				const lastCX = drops[drops.length - 1].cx;
				const r = Math.min(CORNER_R, Math.abs(lastCX - parentCX) / 2);
				const busPath = `M${parentCX},${busY} L${lastCX - r},${busY} Q${lastCX},${busY} ${lastCX},${busY + r}`;

				connectors.push({
					type: 'bus',
					parentCX,
					connTop,
					busY,
					childrenY,
					busPath,
					drops,
					opLabel,
					source: cnode.source,
				});
			}
		}

		place(root, 0, 0);
		return { nodes, connectors };
	});

	let viewBox = $derived.by(() => {
		if (layout.nodes.length === 0) return `0 0 ${width} ${height}`;
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const n of layout.nodes) {
			minX = Math.min(minX, n.x);
			maxX = Math.max(maxX, n.x + nodeSize);
			minY = Math.min(minY, n.y);
			maxY = Math.max(maxY, n.y + nodeH(n.node) + LABEL_H);
		}
		// Extra horizontal room for text labels
		const textPadLeft = 100;
		const textPadRight = 160;
		const pad = 24;
		return `${minX - textPadLeft} ${minY - pad} ${maxX - minX + textPadLeft + textPadRight} ${maxY - minY + 2 * pad}`;
	});

	// Hover handlers
	function handleNodeEnter(e: MouseEvent, node: CloningNode) {
		const items: { label: string; value: string | number; unit?: string }[] = [
			{ label: 'Size', value: node.size, unit: 'bp' },
		];
		if (node.topology) items.push({ label: 'Topology', value: node.topology });
		if (node.parts) items.push({ label: 'Features', value: node.parts.length });
		if (node.description) items.push({ label: 'Note', value: node.description });
		onhoverinfo?.({ title: node.name, items, position: { x: e.clientX, y: e.clientY } });
	}

	function handleConnEnter(e: MouseEvent, source: CloningSource) {
		const a = source.action;
		const items: { label: string; value: string | number; unit?: string }[] = [
			{ label: 'Type', value: a.paradigm },
		];
		if (a.enzymes) items.push({ label: 'Enzymes', value: a.enzymes.join(', ') });
		if (a.primers) items.push({ label: 'Primers', value: a.primers.join(', ') });
		if (a.temperature) items.push({ label: 'Temp', value: a.temperature });
		if (a.duration) items.push({ label: 'Duration', value: a.duration });
		if (a.notes) items.push({ label: 'Notes', value: a.notes });
		const label = getOpLabel(source);
		onhoverinfo?.({ title: label, items, position: { x: e.clientX, y: e.clientY } });
	}

	function handleMouseLeave() { onhoverinfo?.(null); }
</script>

<div class="cloning-history" style:width="{width}px" style:height="{height}px">
	<svg {width} {height} viewBox={viewBox} preserveAspectRatio="xMinYMin meet" xmlns="http://www.w3.org/2000/svg">

		<!-- Connectors (behind nodes) -->
		{#each layout.connectors as conn}
			{#if conn.type === 'single'}
				<!-- Single input: vertical line + text on each side -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<g
					class="connector"
					onmouseenter={(e) => handleConnEnter(e, conn.source)}
					onmouseleave={handleMouseLeave}
				>
					<line
						x1={conn.x} y1={conn.y1}
						x2={conn.x} y2={conn.y2}
						class="conn-line"
					/>
					<!-- Arrowhead pointing up -->
					<path
						d="M{conn.x - ARROW_W},{conn.y1 + ARROW_H} L{conn.x},{conn.y1} L{conn.x + ARROW_W},{conn.y1 + ARROW_H}"
						class="conn-arrow"
					/>
					<!-- Op label: right-aligned to line left -->
					<text
						x={conn.x - TEXT_GAP}
						y={(conn.y1 + conn.y2) / 2}
						text-anchor="end"
						dominant-baseline="central"
						class="op-text"
					>{conn.opLabel}</text>
					<!-- Conditions: left-aligned to line right -->
					{#if conn.label}
						<text
							x={conn.x + TEXT_GAP}
							y={(conn.y1 + conn.y2) / 2}
							dominant-baseline="central"
							class="cond-text"
						>{conn.label}</text>
					{/if}
				</g>

			{:else}
				<!-- Bus connector: vertical from parent, horizontal bus, drops -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<g
					class="connector"
					onmouseenter={(e) => handleConnEnter(e, conn.source)}
					onmouseleave={handleMouseLeave}
				>
					<!-- Vertical from parent to childrenY (first child = parent column) -->
					<line
						x1={conn.parentCX} y1={conn.connTop}
						x2={conn.parentCX} y2={conn.childrenY}
						class="conn-line"
					/>
					<!-- Arrowhead pointing up -->
					<path
						d="M{conn.parentCX - ARROW_W},{conn.connTop + ARROW_H} L{conn.parentCX},{conn.connTop} L{conn.parentCX + ARROW_W},{conn.connTop + ARROW_H}"
						class="conn-arrow"
					/>
					<!-- Horizontal bus with rounded right end -->
					<path d={conn.busPath} class="conn-line-path" />
					<!-- Last child drop (from rounded corner end) -->
					{#if conn.drops.length > 1}
						{@const last = conn.drops[conn.drops.length - 1]}
						<line
							x1={last.cx} y1={last.dropY1}
							x2={last.cx} y2={conn.childrenY}
							class="conn-line"
						/>
					{/if}
					<!-- Middle child drops -->
					{#each conn.drops as drop, i}
						{#if i > 0 && i < conn.drops.length - 1}
							<line
								x1={drop.cx} y1={conn.busY}
								x2={drop.cx} y2={conn.childrenY}
								class="conn-line"
							/>
						{/if}
					{/each}
					<!-- Op label: right-aligned to junction left -->
					<text
						x={conn.parentCX - TEXT_GAP}
						y={conn.busY}
						text-anchor="end"
						dominant-baseline="central"
						class="op-text"
					>{conn.opLabel}</text>
					<!-- Per-input labels: to the right of each drop -->
					{#each conn.drops as drop}
						{#if drop.label}
							<text
								x={drop.cx + TEXT_GAP}
								y={conn.busY + 16}
								class="cond-text"
							>{drop.label}</text>
						{/if}
					{/each}
				</g>
			{/if}
		{/each}

		<!-- Nodes (on top of connectors) -->
		{#each layout.nodes as pn (pn.node.id)}
			{@const nh = nodeH(pn.node)}
			{@const rh = renderH(pn.node)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<g
				class="node"
				transform="translate({pn.x}, {pn.y})"
				onclick={() => onnodeclick?.(pn.node)}
				onmouseenter={(e) => handleNodeEnter(e, pn.node)}
				onmouseleave={handleMouseLeave}
			>
				<foreignObject x="0" y="0" width={nodeSize} height={nh}>
					<div
						class="node-embed"
						style="width:{RENDER_SIZE}px;height:{rh}px;transform:scale({cssScale});transform-origin:top left;"
					>
						<PlasmidViewer
							name={pn.node.name}
							size={pn.node.size}
							parts={pn.node.parts ?? []}
							cutSites={pn.node.cutSites ?? []}
							topology={pn.node.topology ?? 'circular'}
							width={RENDER_SIZE}
							height={rh}
							showTicks={false}
							showInternalLabels={false}
							interactive={false}
							onhoverinfo={onhoverinfo}
						/>
					</div>
				</foreignObject>
				<!-- Name + size below node -->
				<text x={nodeSize / 2} y={nh + 14} text-anchor="middle" class="node-name">
					{pn.node.name}
				</text>
				<text x={nodeSize / 2} y={nh + 28} text-anchor="middle" class="node-size">
					{pn.node.size.toLocaleString()} bp
				</text>
			</g>
		{/each}
	</svg>
</div>

<style>
	.cloning-history {
		display: inline-block;
		background: var(--hatch-bg, #0c1018);
	}

	.node {
		cursor: pointer;
	}

	.node-embed {
		overflow: hidden;
	}

	.node-name {
		font-size: 11px;
		font-weight: 600;
		fill: var(--hatch-text, #c9d1d9);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.node-size {
		font-size: 10px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.conn-line {
		stroke: var(--hatch-border, #2a3444);
		stroke-width: 1.5;
	}

	.conn-line-path {
		fill: none;
		stroke: var(--hatch-border, #2a3444);
		stroke-width: 1.5;
	}

	.conn-arrow {
		fill: none;
		stroke: var(--hatch-border, #2a3444);
		stroke-width: 1.5;
	}

	.connector {
		cursor: default;
	}

	.op-text {
		font-size: 11px;
		font-weight: 600;
		fill: var(--hatch-text, #c9d1d9);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

	.cond-text {
		font-size: 10px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}
</style>
