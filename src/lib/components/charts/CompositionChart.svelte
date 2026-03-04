<script lang="ts">
	import { nucleotideColors, aminoAcidColors } from '../../util/colors.js';

	interface Props {
		/** Residue counts, e.g. { A: 150, T: 120, G: 130, C: 100 } */
		counts: Record<string, number>;
		/** Sequence alphabet */
		alphabet?: 'dna' | 'rna' | 'protein';
		/** GC content (0-1) for DNA/RNA — if provided, shows donut */
		gc?: number;
		/** Total width */
		width?: number;
		/** Total height */
		height?: number;
	}

	let {
		counts,
		alphabet = 'dna',
		gc,
		width = 500,
		height = 250,
	}: Props = $props();

	let colorMap = $derived(alphabet === 'protein' ? aminoAcidColors : nucleotideColors);

	const aminoAcid3Letter: Record<string, string> = {
		A: 'Ala', R: 'Arg', N: 'Asn', D: 'Asp', C: 'Cys',
		E: 'Glu', Q: 'Gln', G: 'Gly', H: 'His', I: 'Ile',
		L: 'Leu', K: 'Lys', M: 'Met', F: 'Phe', P: 'Pro',
		S: 'Ser', T: 'Thr', W: 'Trp', Y: 'Tyr', V: 'Val',
		U: 'Sec', O: 'Pyl', B: 'Asx', Z: 'Glx', X: 'Xaa',
		'*': 'Ter',
	};

	let total = $derived(Object.values(counts).reduce((s, v) => s + v, 0));

	/** Sorted entries for bar chart */
	let entries = $derived.by(() => {
		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.map(([residue, count]) => ({
				residue,
				label: alphabet === 'protein' ? (aminoAcid3Letter[residue] ?? residue) : residue,
				count,
				fraction: total > 0 ? count / total : 0,
				color: colorMap[residue] ?? '#999',
			}));
	});

	/** Donut chart segments for GC content */
	let showDonut = $derived(gc !== undefined && (alphabet === 'dna' || alphabet === 'rna'));

	let donutCx = $derived(showDonut ? 80 : 0);
	let donutCy = $derived(height / 2);
	let donutR = 50;
	let donutWidth = 16;

	/** Bar chart layout */
	let barAreaX = $derived(showDonut ? 180 : (alphabet === 'protein' ? 45 : 30));
	let barAreaWidth = $derived(width - barAreaX - 20);
	let barHeight = $derived(Math.min(20, (height - 40) / Math.max(entries.length, 1) - 4));

	/** Donut arc path */
	function donutArc(startFrac: number, endFrac: number, r: number, cx: number, cy: number): string {
		const startAngle = startFrac * Math.PI * 2 - Math.PI / 2;
		const endAngle = endFrac * Math.PI * 2 - Math.PI / 2;
		const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
		const innerR = r - donutWidth / 2;
		const outerR = r + donutWidth / 2;

		const x1o = cx + outerR * Math.cos(startAngle);
		const y1o = cy + outerR * Math.sin(startAngle);
		const x2o = cx + outerR * Math.cos(endAngle);
		const y2o = cy + outerR * Math.sin(endAngle);
		const x1i = cx + innerR * Math.cos(endAngle);
		const y1i = cy + innerR * Math.sin(endAngle);
		const x2i = cx + innerR * Math.cos(startAngle);
		const y2i = cy + innerR * Math.sin(startAngle);

		return [
			`M ${x1o} ${y1o}`,
			`A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
			`L ${x1i} ${y1i}`,
			`A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
			'Z',
		].join(' ');
	}
</script>

<svg {width} {height} class="hatch-composition-chart" role="img" aria-label="Sequence composition chart">
	<!-- GC donut -->
	{#if showDonut && gc !== undefined}
		<path
			d={donutArc(0, gc, donutR, donutCx, donutCy)}
			fill="var(--hatch-positive, #58b56a)"
			fill-opacity="0.85"
		/>
		<path
			d={donutArc(gc, 1, donutR, donutCx, donutCy)}
			fill="var(--hatch-negative, #d45858)"
			fill-opacity="0.85"
		/>
		<text
			x={donutCx}
			y={donutCy - 6}
			text-anchor="middle"
			dominant-baseline="central"
			class="donut-label"
		>{(gc * 100).toFixed(1)}%</text>
		<text
			x={donutCx}
			y={donutCy + 10}
			text-anchor="middle"
			dominant-baseline="central"
			class="donut-sublabel"
		>GC</text>
	{/if}

	<!-- Horizontal bars -->
	{#each entries as entry, i}
		{@const by = 20 + i * (barHeight + 4)}
		{@const bw = entry.fraction * barAreaWidth}

		<text
			x={barAreaX - 6}
			y={by + barHeight / 2}
			text-anchor="end"
			dominant-baseline="middle"
			class="bar-label"
			font-size={alphabet === 'protein' ? '9' : '12'}
		>{entry.label}</text>

		<rect
			x={barAreaX}
			y={by}
			width={bw}
			height={barHeight}
			fill={entry.color}
			fill-opacity="0.85"
			rx="2"
		/>

		<text
			x={barAreaX + bw + 6}
			y={by + barHeight / 2}
			dominant-baseline="middle"
			class="bar-value"
		>{entry.count} ({(entry.fraction * 100).toFixed(1)}%)</text>
	{/each}
</svg>

<style>
	.hatch-composition-chart {
		background: var(--hatch-bg, #0c1018);
		border-radius: 6px;
	}

	.donut-label {
		font-size: 16px;
		font-weight: 700;
		fill: var(--hatch-text, #d4dce6);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.donut-sublabel {
		font-size: 11px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.bar-label {
		font-size: 12px;
		font-weight: 600;
		fill: var(--hatch-text, #d4dce6);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.bar-value {
		font-size: 10px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
</style>
