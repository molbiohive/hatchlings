<script lang="ts">
	interface Props {
		zoom: number;
		minZoom?: number;
		maxZoom?: number;
		step?: number;
		onzoomchange?: (zoom: number) => void;
	}

	let { zoom = 1, minZoom = 0.1, maxZoom = 20, step = 0.25, onzoomchange }: Props = $props();

	function zoomIn() {
		const next = Math.min(zoom + step, maxZoom);
		onzoomchange?.(next);
	}

	function zoomOut() {
		const next = Math.max(zoom - step, minZoom);
		onzoomchange?.(next);
	}

	function reset() {
		onzoomchange?.(1);
	}
</script>

<div class="hatch-zoom-controls">
	<button onclick={zoomOut} title="Zoom out" disabled={zoom <= minZoom}>-</button>
	<button onclick={reset} title="Reset zoom" class="zoom-label">{Math.round(zoom * 100)}%</button>
	<button onclick={zoomIn} title="Zoom in" disabled={zoom >= maxZoom}>+</button>
</div>

<style>
	.hatch-zoom-controls {
		display: inline-flex;
		gap: 2px;
		background: var(--hatch-controls-bg, #2a2a3e);
		border-radius: 6px;
		padding: 2px;
		border: 1px solid var(--hatch-controls-border, #444);
	}

	button {
		background: transparent;
		border: none;
		color: var(--hatch-controls-color, #ccc);
		cursor: pointer;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		font-size: 14px;
		font-family: var(--hatch-font-mono, monospace);
	}

	button:hover:not(:disabled) {
		background: var(--hatch-controls-hover, #3a3a5e);
	}

	button:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.zoom-label {
		width: auto;
		padding: 0 8px;
		font-size: 11px;
	}
</style>
