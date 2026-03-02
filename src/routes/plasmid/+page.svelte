<script lang="ts">
	import { PlasmidViewer } from '../../lib/components/plasmid/index.js';
	import type { Feature, Primer, CutSite } from '../../lib/types/index.js';

	// pUC19 plasmid data
	const plasmidName = 'pUC19';
	const plasmidSize = 2686;
	const topology: 'circular' | 'linear' = 'circular';

	const features: Feature[] = [
		{
			name: 'lacZ-alpha',
			type: 'CDS',
			start: 2495,
			end: 2686,
			strand: 1,
			color: '#ff6b6b',
		},
		{
			name: 'AmpR',
			type: 'CDS',
			start: 1629,
			end: 2489,
			strand: -1,
			color: '#4dc3ff',
		},
		{
			name: 'ori',
			type: 'rep_origin',
			start: 1158,
			end: 1764,
			strand: 1,
			color: '#9467bd',
		},
		{
			name: 'lacP',
			type: 'promoter',
			start: 2393,
			end: 2479,
			strand: 1,
			color: '#31a354',
		},
	];

	const primers: Primer[] = [
		{
			name: 'M13F',
			start: 391,
			end: 408,
			strand: 1,
			tm: 55.2,
		},
		{
			name: 'M13R',
			start: 488,
			end: 505,
			strand: -1,
			tm: 55.4,
		},
	];

	const cutSites: CutSite[] = [
		{
			enzyme: 'EcoRI',
			position: 396,
			strand: 1,
		},
		{
			enzyme: 'HindIII',
			position: 447,
			strand: 1,
		},
		{
			enzyme: 'BamHI',
			position: 417,
			strand: 1,
		},
	];

	let showLabels = $state(true);
	let showTicks = $state(true);

	function handleFeatureClick(feature: Feature) {
		console.log('Feature clicked:', feature.name, feature);
	}
</script>

<h1>PlasmidViewer</h1>
<p class="description">Circular plasmid map of pUC19 with features, primers, and restriction sites.</p>

<div class="controls">
	<label class="toggle">
		<input type="checkbox" bind:checked={showLabels} />
		Show labels
	</label>
	<label class="toggle">
		<input type="checkbox" bind:checked={showTicks} />
		Show tick marks
	</label>
</div>

<div class="viewer-container">
	<PlasmidViewer
		name={plasmidName}
		size={plasmidSize}
		{topology}
		{features}
		{primers}
		{cutSites}
		{showLabels}
		{showTicks}
		width={550}
		height={550}
		onfeatureclick={handleFeatureClick}
	/>
</div>

<div class="legend">
	<h3>Features</h3>
	<div class="legend-items">
		{#each features as feature}
			<div class="legend-item">
				<span class="legend-swatch" style:background={feature.color}></span>
				<span class="legend-name">{feature.name}</span>
				<span class="legend-type">{feature.type}</span>
				<span class="legend-range">{feature.start}..{feature.end}</span>
				<span class="legend-strand">{feature.strand === 1 ? '+' : '-'}</span>
			</div>
		{/each}
	</div>

	<h3>Primers</h3>
	<div class="legend-items">
		{#each primers as primer}
			<div class="legend-item">
				<span class="legend-swatch dashed"></span>
				<span class="legend-name">{primer.name}</span>
				<span class="legend-range">{primer.start}..{primer.end}</span>
				<span class="legend-strand">{primer.strand === 1 ? '+' : '-'}</span>
				{#if primer.tm}
					<span class="legend-tm">Tm: {primer.tm}&deg;C</span>
				{/if}
			</div>
		{/each}
	</div>

	<h3>Cut Sites</h3>
	<div class="legend-items">
		{#each cutSites as cutSite}
			<div class="legend-item">
				<span class="legend-swatch cut"></span>
				<span class="legend-name">{cutSite.enzyme}</span>
				<span class="legend-range">pos {cutSite.position}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	h1 {
		color: #7dd3fc;
		font-size: 28px;
		margin-bottom: 4px;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	.description {
		color: #888;
		font-size: 14px;
		margin-bottom: 20px;
	}

	.controls {
		display: flex;
		gap: 20px;
		margin-bottom: 16px;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #ccc;
		font-size: 14px;
		cursor: pointer;
		user-select: none;
	}

	.toggle input[type='checkbox'] {
		accent-color: #7dd3fc;
		width: 16px;
		height: 16px;
	}

	.viewer-container {
		margin-bottom: 24px;
	}

	.legend {
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 8px;
		padding: 16px 20px;
		max-width: 550px;
	}

	.legend h3 {
		color: #aaa;
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 1px;
		margin: 12px 0 8px;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	.legend h3:first-child {
		margin-top: 0;
	}

	.legend-items {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: #ccc;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	.legend-swatch {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.legend-swatch.dashed {
		background: none;
		border: 2px dashed #bcbd22;
		width: 10px;
		height: 10px;
	}

	.legend-swatch.cut {
		background: none;
		border-left: 3px solid #e74c3c;
		width: 0;
		height: 14px;
		border-radius: 0;
	}

	.legend-name {
		font-weight: 600;
		color: #e0e0e0;
	}

	.legend-type {
		color: #777;
		font-size: 11px;
	}

	.legend-range {
		color: #666;
		font-size: 11px;
	}

	.legend-strand {
		color: #555;
		font-size: 11px;
	}

	.legend-tm {
		color: #888;
		font-size: 11px;
	}
</style>
