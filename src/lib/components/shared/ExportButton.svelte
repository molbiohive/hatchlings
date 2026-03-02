<script lang="ts">
	import { downloadSVG, downloadPNG } from '../../util/export.js';

	interface Props {
		svgElement?: SVGSVGElement | null;
		filename?: string;
		formats?: ('svg' | 'png')[];
	}

	let { svgElement = null, filename = 'export', formats = ['svg', 'png'] }: Props = $props();

	let showMenu = $state(false);

	async function handleExport(format: 'svg' | 'png') {
		if (!svgElement) return;
		if (format === 'svg') {
			downloadSVG(svgElement, `${filename}.svg`);
		} else {
			await downloadPNG(svgElement, `${filename}.png`);
		}
		showMenu = false;
	}
</script>

<div class="hatch-export">
	{#if formats.length === 1}
		<button onclick={() => handleExport(formats[0])} title="Export {formats[0].toUpperCase()}">
			Export {formats[0].toUpperCase()}
		</button>
	{:else}
		<button onclick={() => showMenu = !showMenu} title="Export">
			Export
		</button>
		{#if showMenu}
			<div class="hatch-export-menu">
				{#each formats as format}
					<button onclick={() => handleExport(format)}>{format.toUpperCase()}</button>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.hatch-export {
		position: relative;
		display: inline-block;
	}

	button {
		background: var(--hatch-controls-bg, #2a2a3e);
		border: 1px solid var(--hatch-controls-border, #444);
		color: var(--hatch-controls-color, #ccc);
		cursor: pointer;
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-family: var(--hatch-font, sans-serif);
	}

	button:hover {
		background: var(--hatch-controls-hover, #3a3a5e);
	}

	.hatch-export-menu {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 4px;
		background: var(--hatch-controls-bg, #2a2a3e);
		border: 1px solid var(--hatch-controls-border, #444);
		border-radius: 4px;
		overflow: hidden;
		z-index: 100;
	}

	.hatch-export-menu button {
		display: block;
		width: 100%;
		border: none;
		border-radius: 0;
	}
</style>
