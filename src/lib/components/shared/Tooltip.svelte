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
		let left = x + PAD;
		let top = y + PAD;

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

<div class="hatch-tooltip" style="{style} visibility: {visible ? 'visible' : 'hidden'}; opacity: {visible ? 1 : 0};">
	{#if title}
		<div class="tooltip-title">{title}</div>
	{/if}

	{#if items.length > 0}
		<div class="tooltip-items">
			{#each items as item}
				<div class="tooltip-row">
					<span class="tooltip-label">{item.label}</span>
					<span class="tooltip-value" style:color={item.color ?? undefined}>
						{item.value}{#if item.unit}&nbsp;{item.unit}{/if}
					</span>
				</div>
			{/each}
		</div>
	{/if}

	{#if children}
		<div class="tooltip-custom">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.hatch-tooltip {
		position: fixed;
		z-index: 9999;
		min-width: 180px;
		max-width: 280px;
		padding: 10px 14px;
		background: var(--hatch-tooltip-bg, #141c26);
		border: 1px solid var(--hatch-tooltip-border, #2a3848);
		border-radius: 6px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
		pointer-events: none;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.tooltip-title {
		font-size: 12px;
		font-weight: 700;
		color: var(--hatch-tooltip-text, var(--hatch-text, #d4dce6));
		margin-bottom: 6px;
		padding-bottom: 4px;
		border-bottom: 1px solid var(--hatch-tooltip-border, var(--hatch-border, #2a3848));
	}

	.tooltip-items {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.tooltip-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
	}

	.tooltip-label {
		font-size: 10px;
		color: var(--hatch-tooltip-label, var(--hatch-text-muted, #8a95a5));
		white-space: nowrap;
	}

	.tooltip-value {
		font-size: 11px;
		font-weight: 600;
		color: var(--hatch-tooltip-text, var(--hatch-text, #d4dce6));
		text-align: right;
	}

	.tooltip-custom {
		margin-top: 6px;
	}
</style>
