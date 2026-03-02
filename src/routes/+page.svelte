<h1>hatchlings</h1>
<p class="subtitle">Svelte 5 molecular biology component library</p>

<div class="grid">
	<a href="/plasmid" class="card">
		<h2>PlasmidViewer</h2>
		<p>Circular plasmid maps with features, primers, and restriction sites</p>
	</a>
	<a href="/sequence" class="card">
		<h2>SequenceViewer</h2>
		<p>Linear sequence display with multi-track annotations</p>
	</a>
	<a href="/gel" class="card">
		<h2>GelViewer</h2>
		<p>Realistic gel electrophoresis visualization</p>
	</a>
	<a href="/trace" class="card">
		<h2>TraceViewer</h2>
		<p>Sanger sequencing chromatograms with quality scores</p>
	</a>
	<a href="/charts" class="card">
		<h2>Scientific Charts</h2>
		<p>Dose-response, chromatography, plate heatmaps, and more</p>
	</a>
</div>

<style>
	h1 {
		font-size: 36px;
		color: #7dd3fc;
		margin-bottom: 8px;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	.subtitle {
		color: #888;
		font-size: 16px;
		margin-bottom: 32px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
	}

	.card {
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 8px;
		padding: 20px;
		text-decoration: none;
		transition: border-color 0.15s, transform 0.15s;
	}

	.card:hover {
		border-color: #7dd3fc;
		transform: translateY(-2px);
	}

	.card h2 {
		color: #e0e0e0;
		font-size: 18px;
		margin: 0 0 8px;
	}

	.card p {
		color: #888;
		font-size: 14px;
		margin: 0;
		line-height: 1.4;
	}
</style>
