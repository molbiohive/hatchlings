<script lang="ts">
	import type { CloningNode } from '../../types/cloning.js';
	import type { HoverInfo } from '../../types/utility.js';
	import type { CutSite } from '../../types/sequence.js';

	interface Props {
		node: CloningNode;
		width?: number;
		height?: number;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let {
		node,
		width = 900,
		height = 200,
		onhoverinfo,
	}: Props = $props();

	// Dimensions
	const BODY_H = 44;
	const CAP_R = BODY_H / 2;
	const STROKE_W = 4;
	const OH_EXTEND = 18;
	const SYMBOL_W = 36;
	const SYMBOL_MARGIN = 14;
	const MIN_BODY_W = 80;
	const PAD_X = 20;
	const PAD_TOP = 48;

	// --- End configuration ---
	interface EndConfig {
		closed: boolean;
		enzyme?: string;
		overhang?: string;
		ohType: '5prime' | '3prime' | 'blunt';
	}

	interface ConstructLayout {
		node: CloningNode;
		isResult: boolean;
		x: number;
		bodyW: number;
		leftOH: number;
		rightOH: number;
		leftEnd: EndConfig;
		rightEnd: EndConfig;
	}

	function overhangType(cs: CutSite): '5prime' | '3prime' | 'blunt' {
		const cut = cs.cutPosition ?? 0;
		const comp = cs.complementCutPosition ?? 0;
		if (cut === comp) return 'blunt';
		return cut < comp ? '5prime' : '3prime';
	}

	function makeOpenEnd(cs: CutSite): EndConfig {
		return {
			closed: false,
			enzyme: cs.enzyme,
			overhang: cs.overhang,
			ohType: overhangType(cs),
		};
	}

	const closedEnd: EndConfig = { closed: true, ohType: 'blunt' };
	const bluntOpenEnd: EndConfig = { closed: false, ohType: 'blunt' };

	function getTerminalCutSites(cn: CloningNode): { fivePrime: CutSite | null; threePrime: CutSite | null } {
		if (!cn.cutSites?.length) return { fivePrime: null, threePrime: null };
		const threshold = Math.max(cn.size * 0.02, 10);
		let fivePrime: CutSite | null = null;
		let threePrime: CutSite | null = null;
		for (const cs of cn.cutSites) {
			if (cs.position <= threshold) fivePrime = cs;
			if (cs.position >= cn.size - threshold || (cs.end != null && cs.end >= cn.size - threshold)) threePrime = cs;
		}
		return { fivePrime, threePrime };
	}

	function getLinearizationSites(cn: CloningNode, actionEnzymes: string[]): { left: CutSite; right: CutSite } | null {
		if (cn.topology !== 'circular' || !actionEnzymes.length || !cn.cutSites?.length) return null;
		const matching = cn.cutSites
			.filter(cs => actionEnzymes.includes(cs.enzyme))
			.sort((a, b) => a.position - b.position);
		if (matching.length >= 2) return { left: matching[0], right: matching[1] };
		return null;
	}

	function ohExtend(end: EndConfig): number {
		if (end.closed || end.ohType === 'blunt') return 0;
		return OH_EXTEND;
	}

	let opLabel = $derived.by(() => {
		if (!node.source) return '';
		const a = node.source.action;
		if (a.label) return a.label;
		const t = a.type ?? 'operation';
		return t.charAt(0).toUpperCase() + t.slice(1);
	});

	let constructs = $derived.by((): ConstructLayout[] => {
		const actionEnzymes = node.source?.action.enzymes ?? [];

		// Build items with end configs
		const items: { node: CloningNode; isResult: boolean; leftEnd: EndConfig; rightEnd: EndConfig }[] = [];

		if (node.source?.inputs) {
			for (const inp of node.source.inputs) {
				const cn = inp.node;
				let leftEnd: EndConfig;
				let rightEnd: EndConfig;

				if (cn.topology === 'circular') {
					const linSites = getLinearizationSites(cn, actionEnzymes);
					if (linSites) {
						leftEnd = makeOpenEnd(linSites.left);
						rightEnd = makeOpenEnd(linSites.right);
					} else {
						leftEnd = closedEnd;
						rightEnd = closedEnd;
					}
				} else {
					const terminals = getTerminalCutSites(cn);
					leftEnd = terminals.fivePrime ? makeOpenEnd(terminals.fivePrime) : bluntOpenEnd;
					rightEnd = terminals.threePrime ? makeOpenEnd(terminals.threePrime) : bluntOpenEnd;
				}

				items.push({ node: cn, isResult: false, leftEnd, rightEnd });
			}
		}

		// Result
		const rn = node;
		if (rn.topology === 'circular') {
			items.push({ node: rn, isResult: true, leftEnd: closedEnd, rightEnd: closedEnd });
		} else {
			const terminals = getTerminalCutSites(rn);
			items.push({
				node: rn, isResult: true,
				leftEnd: terminals.fivePrime ? makeOpenEnd(terminals.fivePrime) : bluntOpenEnd,
				rightEnd: terminals.threePrime ? makeOpenEnd(terminals.threePrime) : bluntOpenEnd,
			});
		}

		// Layout: total width = sum(leftOH + bodyW + rightOH) + gaps for symbols + padding
		const nSymbols = items.length - 1;
		const gapW = SYMBOL_W + 2 * SYMBOL_MARGIN;
		const totalOH = items.reduce((s, it) => s + ohExtend(it.leftEnd) + ohExtend(it.rightEnd), 0);
		const availW = width - 2 * PAD_X - nSymbols * gapW - totalOH;

		const totalBp = items.reduce((s, c) => s + c.node.size, 0);
		let bodyWidths = items.map(c => Math.max(MIN_BODY_W, (c.node.size / totalBp) * availW));
		const totalBodyW = bodyWidths.reduce((s, w) => s + w, 0);
		if (totalBodyW > availW && availW > 0) {
			bodyWidths = bodyWidths.map(w => Math.max(MIN_BODY_W, (w / totalBodyW) * availW));
		}

		const result: ConstructLayout[] = [];
		let cx = PAD_X;
		for (let i = 0; i < items.length; i++) {
			const loh = ohExtend(items[i].leftEnd);
			const roh = ohExtend(items[i].rightEnd);
			result.push({
				...items[i],
				x: cx + loh,
				bodyW: bodyWidths[i],
				leftOH: loh,
				rightOH: roh,
			});
			cx += loh + bodyWidths[i] + roh + gapW;
		}
		return result;
	});

	// Symbol positions (centered in gap between constructs)
	let symbols = $derived.by(() => {
		const syms: { x: number; isArrow: boolean }[] = [];
		for (let i = 0; i < constructs.length - 1; i++) {
			const rightEdge = constructs[i].x + constructs[i].bodyW + constructs[i].rightOH;
			const leftEdge = constructs[i + 1].x - constructs[i + 1].leftOH;
			const mid = (rightEdge + leftEdge) / 2;
			syms.push({ x: mid, isArrow: i === constructs.length - 2 });
		}
		return syms;
	});

	// Hover
	function handleConstructHover(e: MouseEvent, cn: CloningNode) {
		const items: { label: string; value: string | number; unit?: string }[] = [
			{ label: 'Size', value: cn.size, unit: 'bp' },
		];
		if (cn.topology) items.push({ label: 'Topology', value: cn.topology });
		if (cn.parts?.length) items.push({ label: 'Features', value: cn.parts.length });
		if (cn.description) items.push({ label: 'Note', value: cn.description });
		onhoverinfo?.({ title: cn.name, items, position: { x: e.clientX, y: e.clientY } });
	}

	function handleEndHover(e: MouseEvent, end: EndConfig) {
		if (!end.enzyme) return;
		const items: { label: string; value: string | number; unit?: string }[] = [];
		if (end.overhang) items.push({ label: 'Overhang', value: end.overhang });
		const typeLabel = end.ohType === 'blunt' ? 'Blunt' : end.ohType === '5prime' ? "5' overhang" : "3' overhang";
		items.push({ label: 'End type', value: typeLabel });
		onhoverinfo?.({ title: end.enzyme, items, position: { x: e.clientX, y: e.clientY } });
	}

	function handleLeave() { onhoverinfo?.(null); }
</script>

<div class="cloning-step" style:width="{width}px" style:height="{height}px">
	<svg {width} {height} viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
		{#each constructs as c}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<g
				class="construct"
				transform="translate({c.x}, {PAD_TOP})"
				onmouseenter={(e) => handleConstructHover(e, c.node)}
				onmouseleave={handleLeave}
			>
				<!-- === Capsule body === -->
				{#if c.leftEnd.closed && c.rightEnd.closed}
					<!-- Full capsule (circular) -->
					<path
						d="M{CAP_R},0 L{c.bodyW - CAP_R},0 A{CAP_R},{CAP_R} 0 0 1 {c.bodyW - CAP_R},{BODY_H} L{CAP_R},{BODY_H} A{CAP_R},{CAP_R} 0 0 1 {CAP_R},0 Z"
						class="capsule-fill"
					/>
					<path
						d="M{CAP_R},0 L{c.bodyW - CAP_R},0 A{CAP_R},{CAP_R} 0 0 1 {c.bodyW - CAP_R},{BODY_H} L{CAP_R},{BODY_H} A{CAP_R},{CAP_R} 0 0 1 {CAP_R},0 Z"
						class="capsule-stroke"
					/>
				{:else if c.leftEnd.closed}
					<!-- Closed left, open right -->
					<rect x={CAP_R} y={1} width={c.bodyW - CAP_R} height={BODY_H - 2} class="body-fill" />
					<path
						d="M{CAP_R},{BODY_H} A{CAP_R},{CAP_R} 0 0 1 {CAP_R},0"
						class="capsule-stroke"
					/>
					<line x1={CAP_R} y1={0} x2={c.bodyW} y2={0} class="capsule-stroke-line" />
					<line x1={CAP_R} y1={BODY_H} x2={c.bodyW} y2={BODY_H} class="capsule-stroke-line" />
				{:else if c.rightEnd.closed}
					<!-- Open left, closed right -->
					<rect x={0} y={1} width={c.bodyW - CAP_R} height={BODY_H - 2} class="body-fill" />
					<path
						d="M{c.bodyW - CAP_R},0 A{CAP_R},{CAP_R} 0 0 1 {c.bodyW - CAP_R},{BODY_H}"
						class="capsule-stroke"
					/>
					<line x1={0} y1={0} x2={c.bodyW - CAP_R} y2={0} class="capsule-stroke-line" />
					<line x1={0} y1={BODY_H} x2={c.bodyW - CAP_R} y2={BODY_H} class="capsule-stroke-line" />
				{:else}
					<!-- Both ends open (linear fragment) — fill + two strands -->
					<rect x={0} y={1} width={c.bodyW} height={BODY_H - 2} class="body-fill" />
					<line x1={0} y1={0} x2={c.bodyW} y2={0} class="capsule-stroke-line" />
					<line x1={0} y1={BODY_H} x2={c.bodyW} y2={BODY_H} class="capsule-stroke-line" />
				{/if}

				<!-- === Left end: sticky end + enzyme === -->
				{#if !c.leftEnd.closed && c.leftEnd.ohType !== 'blunt'}
					{@const isTop = c.leftEnd.ohType === '5prime'}
					{@const ohText = c.leftEnd.overhang ?? ''}

					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<g
						class="sticky-end"
						onmouseenter={(e) => { e.stopPropagation(); handleEndHover(e, c.leftEnd); }}
						onmouseleave={handleLeave}
					>
						<!-- Extending strand -->
						<line
							x1={-OH_EXTEND} y1={isTop ? 0 : BODY_H}
							x2={0} y2={isTop ? 0 : BODY_H}
							class="strand-ext"
						/>
						<!-- Recessed strand stub -->
						<line
							x1={0} y1={isTop ? BODY_H : 0}
							x2={0} y2={isTop ? BODY_H : 0}
							class="strand-ext"
						/>

						<!-- Overhang bases along the extending strand -->
						{#if ohText}
							<text
								x={-OH_EXTEND / 2}
								y={isTop ? -8 : BODY_H + 13}
								text-anchor="middle"
								class="oh-bases"
							>{ohText}</text>
						{/if}
					</g>
				{/if}

				<!-- Enzyme label at left end -->
				{#if !c.leftEnd.closed && c.leftEnd.enzyme}
					<g class="enzyme-marker">
						<line x1={0} y1={-14} x2={0} y2={0} class="enzyme-tick" />
						<text x={0} y={-18} text-anchor="middle" class="enzyme-label">{c.leftEnd.enzyme}</text>
					</g>
				{/if}

				<!-- === Right end: sticky end + enzyme === -->
				{#if !c.rightEnd.closed && c.rightEnd.ohType !== 'blunt'}
					{@const isTop = c.rightEnd.ohType === '5prime'}
					{@const ohText = c.rightEnd.overhang ?? ''}

					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<g
						class="sticky-end"
						onmouseenter={(e) => { e.stopPropagation(); handleEndHover(e, c.rightEnd); }}
						onmouseleave={handleLeave}
					>
						<!-- Extending strand -->
						<line
							x1={c.bodyW} y1={isTop ? 0 : BODY_H}
							x2={c.bodyW + OH_EXTEND} y2={isTop ? 0 : BODY_H}
							class="strand-ext"
						/>
					</g>

					{#if ohText}
						<text
							x={c.bodyW + OH_EXTEND / 2}
							y={isTop ? -8 : BODY_H + 13}
							text-anchor="middle"
							class="oh-bases"
						>{ohText}</text>
					{/if}
				{/if}

				<!-- Enzyme label at right end -->
				{#if !c.rightEnd.closed && c.rightEnd.enzyme}
					<g class="enzyme-marker">
						<line x1={c.bodyW} y1={-14} x2={c.bodyW} y2={0} class="enzyme-tick" />
						<text x={c.bodyW} y={-18} text-anchor="middle" class="enzyme-label">{c.rightEnd.enzyme}</text>
					</g>
				{/if}

				<!-- Name + size below -->
				<text x={c.bodyW / 2} y={BODY_H + 18} text-anchor="middle" class="construct-name">{c.node.name}</text>
				<text x={c.bodyW / 2} y={BODY_H + 32} text-anchor="middle" class="construct-size">{c.node.size.toLocaleString()} bp</text>
			</g>
		{/each}

		<!-- Symbols between constructs -->
		{#each symbols as sym}
			<text
				x={sym.x}
				y={PAD_TOP + BODY_H / 2}
				text-anchor="middle"
				dominant-baseline="central"
				class="symbol"
				class:symbol-arrow={sym.isArrow}
			>{sym.isArrow ? '→' : '+'}</text>
			{#if sym.isArrow && opLabel}
				<text
					x={sym.x}
					y={PAD_TOP - 10}
					text-anchor="middle"
					class="op-label"
				>{opLabel}</text>
			{/if}
		{/each}
	</svg>
</div>

<style>
	.cloning-step {
		display: inline-block;
		background: var(--hatch-bg, #0c1018);
	}

	.construct {
		cursor: pointer;
	}

	/* Closed capsule (circular construct) */
	.capsule-fill {
		fill: color-mix(in srgb, var(--hatch-accent, #58a6ff) 8%, transparent);
	}

	.capsule-stroke {
		fill: none;
		stroke: var(--hatch-accent, #58a6ff);
		stroke-width: 4;
	}

	/* Open-ended construct body fill */
	.body-fill {
		fill: color-mix(in srgb, var(--hatch-accent, #58a6ff) 6%, transparent);
	}

	/* Top/bottom strand lines */
	.capsule-stroke-line {
		stroke: var(--hatch-accent, #58a6ff);
		stroke-width: 4;
	}

	/* Overhang strand extensions */
	.strand-ext {
		stroke: var(--hatch-accent, #58a6ff);
		stroke-width: 3;
		stroke-dasharray: none;
	}

	.sticky-end {
		cursor: pointer;
	}

	/* Overhang base text */
	.oh-bases {
		font-size: 10px;
		font-weight: 700;
		fill: var(--hatch-text, #c9d1d9);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	/* Enzyme tick + label */
	.enzyme-tick {
		stroke: var(--hatch-text-muted, #8a95a5);
		stroke-width: 1.5;
	}

	.enzyme-label {
		font-size: 10px;
		font-weight: 600;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	/* Name + size */
	.construct-name {
		font-size: 11px;
		font-weight: 600;
		fill: var(--hatch-text, #c9d1d9);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.construct-size {
		font-size: 10px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	/* + and → symbols */
	.symbol {
		font-size: 28px;
		font-weight: 300;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

	.symbol-arrow {
		fill: var(--hatch-accent, #58a6ff);
	}

	.op-label {
		font-size: 11px;
		font-weight: 600;
		fill: var(--hatch-text, #c9d1d9);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
</style>
