<script lang="ts">
	import type { Feature, Primer, CutSite } from '../../types/index.js';
	import { formatBp } from '../../util/coordinates.js';
	import { Tooltip } from '../shared/index.js';
	import PlasmidRing from './PlasmidRing.svelte';
	import FeatureArc from './FeatureArc.svelte';
	import PrimerArc from './PrimerArc.svelte';
	import CutSiteMarker from './CutSiteMarker.svelte';
	import PlasmidLabel from './PlasmidLabel.svelte';

	interface Props {
		name: string;
		size: number;
		topology?: 'circular' | 'linear';
		features?: Feature[];
		primers?: Primer[];
		cutSites?: CutSite[];
		selection?: { start: number; end: number } | null;
		mode?: 'view' | 'edit';
		width?: number;
		height?: number;
		showLabels?: boolean;
		showTicks?: boolean;
		onselect?: (selection: { start: number; end: number }) => void;
		onfeatureclick?: (feature: Feature) => void;
	}

	let {
		name,
		size,
		topology = 'circular',
		features = [],
		primers = [],
		cutSites = [],
		selection = null,
		mode = 'view',
		width = 500,
		height = 500,
		showLabels = true,
		showTicks = true,
		onselect,
		onfeatureclick,
	}: Props = $props();

	let svgElement: SVGSVGElement | undefined = $state(undefined);

	let cx = $derived(width / 2);
	let cy = $derived(height / 2);

	/** Base radius for the backbone ring */
	let baseRadius = $derived(Math.min(width, height) * 0.32);

	/** Feature arcs sit on a ring slightly outside the backbone */
	let featureRadius = $derived(baseRadius + 20);

	/** Primer arcs sit on a ring further out */
	let primerRadius = $derived(baseRadius + 42);

	/** Labels sit outside the feature arcs */
	let labelRadius = $derived(baseRadius + 44);

	/** Cut sites are marked on the backbone ring itself */
	let cutSiteRadius = $derived(baseRadius);

	// Tooltip state
	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipContent = $state('');

	let selectedFeature: Feature | null = $state(null);

	function handleFeatureMouseEnter(e: MouseEvent, feature: Feature) {
		const rect = svgElement?.getBoundingClientRect();
		if (!rect) return;
		tooltipX = e.clientX - rect.left;
		tooltipY = e.clientY - rect.top;
		tooltipContent = `${feature.name} (${feature.type})\n${feature.start}..${feature.end} [${feature.strand === 1 ? '+' : '-'}]`;
		tooltipVisible = true;
	}

	function handleFeatureMouseLeave() {
		tooltipVisible = false;
	}

	function handleFeatureClick(feature: Feature) {
		selectedFeature = feature;
		onfeatureclick?.(feature);
	}

	let sizeLabel = $derived(formatBp(size));
</script>

<div class="plasmid-viewer" style:width="{width}px" style:height="{height}px" style:position="relative">
	<svg
		bind:this={svgElement}
		{width}
		{height}
		viewBox="0 0 {width} {height}"
		xmlns="http://www.w3.org/2000/svg"
	>
		<!-- Backbone ring with tick marks -->
		<PlasmidRing {size} radius={baseRadius} {cx} {cy} {showTicks} />

		<!-- Feature arcs (outer ring) -->
		{#each features as feature (feature.name + feature.start)}
			<FeatureArc
				{feature}
				totalSize={size}
				radius={featureRadius}
				{cx}
				{cy}
				selected={selectedFeature === feature}
				onmouseenter={(e) => handleFeatureMouseEnter(e, feature)}
				onmouseleave={handleFeatureMouseLeave}
				onclick={() => handleFeatureClick(feature)}
			/>
		{/each}

		<!-- Primer arcs (further outer ring) -->
		{#each primers as primer (primer.name + primer.start)}
			<PrimerArc
				{primer}
				totalSize={size}
				radius={primerRadius}
				{cx}
				{cy}
			/>
		{/each}

		<!-- Cut site markers on the backbone ring -->
		{#each cutSites as cutSite (cutSite.enzyme + cutSite.position)}
			<CutSiteMarker
				{cutSite}
				totalSize={size}
				radius={cutSiteRadius}
				{cx}
				{cy}
			/>
		{/each}

		<!-- Feature labels -->
		{#if showLabels}
			{#each features as feature (feature.name + feature.start + '_label')}
				<PlasmidLabel
					name={feature.label ?? feature.name}
					startBp={feature.start}
					endBp={feature.end}
					totalSize={size}
					radius={labelRadius}
					{cx}
					{cy}
				/>
			{/each}
		{/if}

		<!-- Center text: plasmid name and size -->
		<text
			x={cx}
			y={cy - 10}
			text-anchor="middle"
			dominant-baseline="central"
			class="center-name"
		>
			{name}
		</text>
		<text
			x={cx}
			y={cy + 12}
			text-anchor="middle"
			dominant-baseline="central"
			class="center-size"
		>
			{sizeLabel} bp
		</text>
		{#if topology}
			<text
				x={cx}
				y={cy + 28}
				text-anchor="middle"
				dominant-baseline="central"
				class="center-topology"
			>
				{topology}
			</text>
		{/if}
	</svg>

	<Tooltip x={tooltipX} y={tooltipY} visible={tooltipVisible}>
		{#each tooltipContent.split('\n') as line}
			<div>{line}</div>
		{/each}
	</Tooltip>
</div>

<style>
	.plasmid-viewer {
		display: inline-block;
		background: var(--hatch-bg, #0d0d1a);
		border-radius: 8px;
		overflow: hidden;
	}

	.center-name {
		font-size: 16px;
		font-weight: 700;
		fill: var(--hatch-text, #e0e0e0);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.center-size {
		font-size: 12px;
		fill: var(--hatch-text-muted, #999);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.center-topology {
		font-size: 10px;
		fill: var(--hatch-text-dim, #666);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		text-transform: uppercase;
		letter-spacing: 1px;
	}
</style>
