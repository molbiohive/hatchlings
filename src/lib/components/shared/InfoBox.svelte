<script lang="ts">
	import type { InfoItem } from '../../types/utility.js';
	import type { Snippet } from 'svelte';

	interface Props {
		visible?: boolean;
		x?: number;
		y?: number;
		title?: string;
		items?: InfoItem[];
		children?: Snippet;
	}

	let {
		visible = false,
		x = 0,
		y = 0,
		title,
		items = [],
		children,
	}: Props = $props();

	/** Clamp position to keep inside viewport */
	let style = $derived.by(() => {
		const BOX_W = 280;
		const BOX_H = 200;
		const PAD = 12;
		// Use fixed positioning relative to viewport
		let left = x + PAD;
		let top = y + PAD;

		// Clamp to viewport (approximate — we don't know viewport size in SSR)
		if (typeof window !== 'undefined') {
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			if (left + BOX_W > vw - PAD) left = x - BOX_W - PAD;
			if (top + BOX_H > vh - PAD) top = y - BOX_H - PAD;
			if (left < PAD) left = PAD;
			if (top < PAD) top = PAD;
		}

		return `left:${left}px;top:${top}px;`;
	});
</script>

{#if visible}
	<div class="hatch-infobox" style={style}>
		{#if title}
			<div class="infobox-title">{title}</div>
		{/if}

		{#if items.length > 0}
			<div class="infobox-items">
				{#each items as item}
					<div class="infobox-row">
						<span class="infobox-label">{item.label}</span>
						<span class="infobox-value" style:color={item.color ?? undefined}>
							{item.value}{#if item.unit}&nbsp;{item.unit}{/if}
						</span>
					</div>
				{/each}
			</div>
		{/if}

		{#if children}
			<div class="infobox-custom">
				{@render children()}
			</div>
		{/if}
	</div>
{/if}

<style>
	.hatch-infobox {
		position: fixed;
		z-index: 9999;
		min-width: 180px;
		max-width: 280px;
		padding: 10px 14px;
		background: var(--hatch-infobox-bg, var(--hatch-tooltip-bg, #141c26));
		border: 1px solid var(--hatch-infobox-border, var(--hatch-tooltip-border, #2a3848));
		border-radius: 6px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
		pointer-events: none;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.infobox-title {
		font-size: 12px;
		font-weight: 700;
		color: var(--hatch-infobox-text, var(--hatch-text, #d4dce6));
		margin-bottom: 6px;
		padding-bottom: 4px;
		border-bottom: 1px solid var(--hatch-infobox-border, var(--hatch-border, #2a3848));
	}

	.infobox-items {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.infobox-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
	}

	.infobox-label {
		font-size: 10px;
		color: var(--hatch-infobox-label, var(--hatch-text-muted, #8a95a5));
		white-space: nowrap;
	}

	.infobox-value {
		font-size: 11px;
		font-weight: 600;
		color: var(--hatch-infobox-text, var(--hatch-text, #d4dce6));
		text-align: right;
	}

	.infobox-custom {
		margin-top: 6px;
	}
</style>
