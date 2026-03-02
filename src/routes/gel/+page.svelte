<script lang="ts">
	import type { GelLane, GelBand, StainType } from '../../lib/types/index.js';
	import { GelViewer } from '../../lib/components/gel/index.js';

	/** Demo gel data: pUC19 restriction digest */
	const ladderLane: GelLane = {
		label: '1kb Ladder',
		isLadder: true,
		bands: [
			{ position: 0.08, intensity: 0.5, size: 10000 },
			{ position: 0.14, intensity: 0.3, size: 8000 },
			{ position: 0.18, intensity: 0.5, size: 6000 },
			{ position: 0.23, intensity: 0.3, size: 5000 },
			{ position: 0.28, intensity: 0.5, size: 4000 },
			{ position: 0.34, intensity: 0.8, size: 3000 },
			{ position: 0.42, intensity: 0.4, size: 2000 },
			{ position: 0.48, intensity: 0.3, size: 1500 },
			{ position: 0.55, intensity: 0.8, size: 1000 },
			{ position: 0.66, intensity: 0.3, size: 750 },
			{ position: 0.73, intensity: 0.8, size: 500 },
			{ position: 0.85, intensity: 0.3, size: 250 },
		],
	};

	const puc19Uncut: GelLane = {
		label: 'pUC19 Uncut',
		bands: [{ position: 0.35, intensity: 1.0, size: 2686, name: 'supercoiled' }],
	};

	const ecori: GelLane = {
		label: 'EcoRI',
		bands: [{ position: 0.38, intensity: 0.9, size: 2686, name: 'linear' }],
	};

	const ecoriHindiii: GelLane = {
		label: 'EcoRI + HindIII',
		bands: [
			{ position: 0.38, intensity: 0.6, size: 2635, name: 'Fragment 1' },
			{ position: 0.92, intensity: 0.4, size: 51, name: 'Fragment 2' },
		],
	};

	const bamhiHindiii: GelLane = {
		label: 'BamHI + HindIII',
		bands: [
			{ position: 0.39, intensity: 0.5, size: 2656, name: 'Fragment 1' },
			{ position: 0.95, intensity: 0.3, size: 30, name: 'Fragment 2' },
		],
	};

	const lanes: GelLane[] = [ladderLane, puc19Uncut, ecori, ecoriHindiii, bamhiHindiii];

	/** Controls */
	let bandStyle: 'realistic' | 'simple' = $state('realistic');
	let stain: StainType = $state('ethidium');
	let showSizeLabels = $state(true);

	const stainOptions: StainType[] = ['ethidium', 'sybr-safe', 'sybr-gold', 'coomassie', 'silver'];

	function handleBandClick(lane: GelLane, band: GelBand) {
		console.log(`Clicked: ${lane.label} - ${band.name ?? band.size + 'bp'}`);
	}
</script>

<div class="gel-demo">
	<h1>GelViewer</h1>
	<p class="subtitle">pUC19 restriction digest on 1% agarose gel</p>

	<div class="controls">
		<label class="control">
			<span>Band style</span>
			<select bind:value={bandStyle}>
				<option value="realistic">Realistic</option>
				<option value="simple">Simple</option>
			</select>
		</label>

		<label class="control">
			<span>Stain</span>
			<select bind:value={stain}>
				{#each stainOptions as s}
					<option value={s}>{s}</option>
				{/each}
			</select>
		</label>

		<label class="control">
			<span>Size labels</span>
			<input type="checkbox" bind:checked={showSizeLabels} />
		</label>
	</div>

	<div class="gel-container">
		<GelViewer
			{lanes}
			gelType="agarose"
			{stain}
			width={450}
			height={520}
			{showSizeLabels}
			showLaneLabels={true}
			{bandStyle}
			onbandclick={handleBandClick}
		/>
	</div>

	<div class="info">
		<h3>About this demo</h3>
		<p>
			This simulates a typical restriction digest analysis of pUC19 plasmid DNA.
			Lane 1 is a 1kb DNA ladder for size reference. The remaining lanes show
			uncut plasmid and various single/double digests. Hover over bands for details.
		</p>
	</div>
</div>

<style>
	.gel-demo {
		max-width: 600px;
	}

	h1 {
		font-size: 28px;
		color: #7dd3fc;
		margin: 0 0 4px;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	.subtitle {
		color: #888;
		font-size: 14px;
		margin: 0 0 20px;
	}

	.controls {
		display: flex;
		gap: 20px;
		margin-bottom: 16px;
		flex-wrap: wrap;
		align-items: center;
	}

	.control {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #aaa;
		font-size: 13px;
	}

	.control span {
		color: #999;
	}

	select {
		background: #1a1a2e;
		color: #e0e0e0;
		border: 1px solid #2a2a4a;
		border-radius: 4px;
		padding: 4px 8px;
		font-size: 13px;
		font-family: inherit;
	}

	select:focus {
		outline: none;
		border-color: #7dd3fc;
	}

	input[type='checkbox'] {
		accent-color: #7dd3fc;
		width: 16px;
		height: 16px;
	}

	.gel-container {
		background: #111122;
		border: 1px solid #2a2a4a;
		border-radius: 8px;
		padding: 16px;
		display: inline-block;
	}

	.info {
		margin-top: 20px;
	}

	.info h3 {
		color: #ccc;
		font-size: 16px;
		margin: 0 0 8px;
	}

	.info p {
		color: #888;
		font-size: 13px;
		line-height: 1.6;
		margin: 0;
	}
</style>
