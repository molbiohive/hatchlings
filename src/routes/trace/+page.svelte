<script lang="ts">
	import type { TraceChannel, TraceAlignment } from '../../lib/types/index.js';
	import { TraceViewer } from '../../lib/components/trace/index.js';

	// --- Generate realistic mock Sanger sequencing data ---

	const baseCalls = 'ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG';
	const numBases = baseCalls.length;
	const pointsPerBase = 10;
	const totalPoints = numBases * pointsPerBase;

	// Quality scores: mostly 30-45 with a few dips to simulate low-quality regions
	const qualityScores: number[] = [];
	for (let i = 0; i < numBases; i++) {
		// Good quality baseline
		let q = 32 + Math.floor(Math.random() * 14); // 32-45
		// Introduce dips at positions 8, 22, 37, 51
		if (i === 8 || i === 22 || i === 37 || i === 51) {
			q = 10 + Math.floor(Math.random() * 8); // 10-17
		}
		// Slight quality decline at the ends (typical for Sanger reads)
		if (i < 4) q = Math.max(15, q - (4 - i) * 5);
		if (i > numBases - 5) q = Math.max(12, q - (i - numBases + 5) * 4);
		qualityScores.push(q);
	}

	// Peak positions: evenly spaced every 10 data points, starting at 5
	const peakPositions: number[] = [];
	for (let i = 0; i < numBases; i++) {
		peakPositions.push(5 + i * pointsPerBase);
	}

	/**
	 * Generate a Gaussian-like peak centered at `center` with given `amplitude`.
	 * sigma controls peak width.
	 */
	function gaussian(x: number, center: number, amplitude: number, sigma: number): number {
		const dx = x - center;
		return amplitude * Math.exp(-(dx * dx) / (2 * sigma * sigma));
	}

	// Generate 4-channel chromatogram data
	const channelA: number[] = new Array(totalPoints).fill(0);
	const channelC: number[] = new Array(totalPoints).fill(0);
	const channelG: number[] = new Array(totalPoints).fill(0);
	const channelT: number[] = new Array(totalPoints).fill(0);

	const channelMap: Record<string, number[]> = {
		A: channelA,
		C: channelC,
		G: channelG,
		T: channelT,
	};

	const sigma = 2.2; // Peak width (data points)
	const baseAmplitude = 800;

	for (let i = 0; i < numBases; i++) {
		const base = baseCalls[i];
		const center = peakPositions[i];
		// Scale amplitude somewhat by quality
		const qFactor = 0.6 + (qualityScores[i] / 60) * 0.4;
		const mainAmplitude = baseAmplitude * qFactor * (0.85 + Math.random() * 0.3);

		// Generate the main peak in the called channel
		for (let x = Math.max(0, center - 12); x < Math.min(totalPoints, center + 12); x++) {
			channelMap[base][x] += gaussian(x, center, mainAmplitude, sigma);

			// Add small noise peaks in other channels for realism
			for (const otherBase of ['A', 'C', 'G', 'T']) {
				if (otherBase === base) continue;
				const noiseFactor = 0.03 + Math.random() * 0.07; // 3-10% of main
				channelMap[otherBase][x] += gaussian(x, center, mainAmplitude * noiseFactor, sigma * 1.3);
			}
		}
	}

	// Add a small amount of baseline noise everywhere
	for (let x = 0; x < totalPoints; x++) {
		for (const ch of [channelA, channelC, channelG, channelT]) {
			ch[x] += Math.random() * 8;
			ch[x] = Math.max(0, Math.round(ch[x]));
		}
	}

	const channels: TraceChannel = {
		A: channelA,
		C: channelC,
		G: channelG,
		T: channelT,
	};

	// --- Mock alignment with 2 mismatches and 1 deletion ---

	// Create a reference that mostly matches, with differences at positions 12 and 30
	const refChars = baseCalls.split('');
	const queryChars = baseCalls.split('');

	// Substitution at position 12: change ref to a different base
	refChars[12] = refChars[12] === 'A' ? 'G' : 'A';
	// Substitution at position 30: change ref to a different base
	refChars[30] = refChars[30] === 'T' ? 'C' : 'T';

	const alignment: TraceAlignment = {
		refSeq: refChars.join(''),
		querySeq: queryChars.join(''),
		mismatches: [
			{ pos: 12, type: 'substitution', refBase: refChars[12], queryBase: queryChars[12] },
			{ pos: 30, type: 'substitution', refBase: refChars[30], queryBase: queryChars[30] },
		],
		identity: (numBases - 2) / numBases,
	};

	// --- UI state ---

	let zoom = $state(2);
	let trimQuality = $state(20);
	let showQuality = $state(true);
	let selectedBase: number | null = $state(null);

	function handleSelect(index: number) {
		selectedBase = index;
	}
</script>

<svelte:head>
	<title>TraceViewer - hatchlings</title>
</svelte:head>

<div class="page">
	<a href="/" class="back">&larr; Back</a>
	<h1>TraceViewer</h1>
	<p class="subtitle">Sanger sequencing chromatogram viewer with quality scores and alignment</p>

	<!-- Controls -->
	<div class="controls">
		<label class="control">
			<span class="control-label">Zoom</span>
			<input type="range" min="0.5" max="10" step="0.1" bind:value={zoom} />
			<span class="control-value">{zoom.toFixed(1)}x</span>
		</label>

		<label class="control">
			<span class="control-label">Quality threshold</span>
			<input type="range" min="0" max="50" step="1" bind:value={trimQuality} />
			<span class="control-value">Q{trimQuality}</span>
		</label>

		<label class="control">
			<input type="checkbox" bind:checked={showQuality} />
			<span class="control-label">Show quality sidebar</span>
		</label>
	</div>

	<!-- Selected base info -->
	{#if selectedBase !== null}
		<div class="selection-info">
			Base {selectedBase + 1}: <strong>{baseCalls[selectedBase]}</strong>
			&mdash; Quality: <strong>Q{qualityScores[selectedBase]}</strong>
			{#if qualityScores[selectedBase] < trimQuality}
				<span class="low-quality">(low quality)</span>
			{/if}
		</div>
	{/if}

	<!-- TraceViewer component -->
	<div class="viewer-container">
		<TraceViewer
			{baseCalls}
			{qualityScores}
			{channels}
			{peakPositions}
			{alignment}
			width={900}
			height={300}
			{showQuality}
			{trimQuality}
			{zoom}
			onselect={handleSelect}
		/>
	</div>

	<div class="info-section">
		<h2>About</h2>
		<p>
			This viewer displays Sanger sequencing chromatogram data (AB1 format style).
			The four channels (A, C, G, T) are shown as overlapping colored peaks.
			Base calls are displayed below with quality score indicators.
			The alignment view shows comparison to a reference sequence with mismatches highlighted.
		</p>
		<p>
			<strong>Scroll:</strong> Mouse wheel or click-and-drag to pan horizontally.<br />
			<strong>Zoom:</strong> Ctrl/Cmd + scroll, or use the slider above.<br />
			<strong>Select:</strong> Click on a position to see base and quality details.
		</p>
	</div>
</div>

<style>
	.page {
		max-width: 960px;
		margin: 0 auto;
		padding: 32px 24px;
	}

	.back {
		color: #7dd3fc;
		text-decoration: none;
		font-size: 14px;
	}

	.back:hover {
		text-decoration: underline;
	}

	h1 {
		font-size: 32px;
		color: #e0e0e0;
		margin: 16px 0 4px;
	}

	h2 {
		font-size: 18px;
		color: #ccc;
		margin: 24px 0 8px;
	}

	.subtitle {
		color: #888;
		font-size: 14px;
		margin-bottom: 24px;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		margin-bottom: 16px;
		padding: 12px 16px;
		background: #161b22;
		border: 1px solid #21262d;
		border-radius: 6px;
	}

	.control {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #aaa;
		font-size: 13px;
	}

	.control-label {
		color: #888;
		font-size: 12px;
		white-space: nowrap;
	}

	.control-value {
		color: #7dd3fc;
		font-family: 'SF Mono', monospace;
		font-size: 12px;
		min-width: 36px;
	}

	.control input[type='range'] {
		width: 120px;
		accent-color: #7dd3fc;
	}

	.control input[type='checkbox'] {
		accent-color: #7dd3fc;
	}

	.selection-info {
		padding: 8px 12px;
		background: #161b22;
		border: 1px solid #21262d;
		border-radius: 4px;
		color: #ccc;
		font-size: 13px;
		font-family: 'SF Mono', monospace;
		margin-bottom: 12px;
	}

	.selection-info strong {
		color: #e0e0e0;
	}

	.low-quality {
		color: #e41a1c;
		font-size: 12px;
	}

	.viewer-container {
		margin-bottom: 24px;
	}

	.info-section p {
		color: #888;
		font-size: 14px;
		line-height: 1.6;
		margin: 8px 0;
	}

	.info-section strong {
		color: #aaa;
	}
</style>
