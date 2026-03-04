<script lang="ts">
	import type { Part } from '../../types/index.js';

	interface Props {
		/** Feature to edit, or null for creating a new feature */
		feature?: Part | null;
		/** Default start position (for new features) */
		defaultStart?: number;
		/** Default end position (for new features) */
		defaultEnd?: number;
		/** Save callback */
		onsave?: (feature: Part) => void;
		/** Cancel callback */
		oncancel?: () => void;
	}

	let {
		feature = null,
		defaultStart = 0,
		defaultEnd = 0,
		onsave,
		oncancel,
	}: Props = $props();

	const FEATURE_TYPES: string[] = [
		'CDS', 'promoter', 'terminator', 'rep_origin', 'gene',
		'primer_bind', 'misc_feature', 'regulatory', 'protein_bind',
		'RBS', 'enhancer', 'intron', 'exon',
	];

	let name = $state(feature?.name ?? '');
	let type: string = $state(feature?.type ?? 'CDS');
	let start = $state(feature?.start ?? defaultStart);
	let end = $state(feature?.end ?? defaultEnd);
	let strand: 1 | -1 = $state(feature?.strand ?? 1);
	let color = $state(feature?.color ?? '');

	let isEditing = $derived(feature !== null);
	let title = $derived(isEditing ? `Edit Feature: ${feature?.name}` : 'Create Feature');

	function handleSave() {
		const result: Part = {
			name,
			type,
			start,
			end,
			strand,
			...(color ? { color } : {}),
			...(feature?.id ? { id: feature.id } : {}),
			...(feature?.label ? { label: feature.label } : {}),
			...(feature?.note ? { note: feature.note } : {}),
		};
		onsave?.(result);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			oncancel?.();
		} else if (e.key === 'Enter' && name) {
			handleSave();
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="dialog-overlay" onclick={oncancel} onkeydown={handleKeydown}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog" onclick={(e) => e.stopPropagation()}>
		<div class="dialog-header">
			<h3>{title}</h3>
			<button class="close-btn" onclick={oncancel}>&times;</button>
		</div>

		<div class="dialog-body">
			<div class="field">
				<label for="feat-name">Name</label>
				<input id="feat-name" type="text" bind:value={name} placeholder="Feature name" />
			</div>

			<div class="field">
				<label for="feat-type">Type</label>
				<select id="feat-type" bind:value={type}>
					{#each FEATURE_TYPES as ft}
						<option value={ft}>{ft}</option>
					{/each}
				</select>
			</div>

			<div class="field-row">
				<div class="field">
					<label for="feat-start">Start</label>
					<input id="feat-start" type="number" bind:value={start} min="0" />
				</div>
				<div class="field">
					<label for="feat-end">End</label>
					<input id="feat-end" type="number" bind:value={end} min="0" />
				</div>
			</div>

			<div class="field-row">
				<div class="field">
					<label for="feat-strand">Strand</label>
					<select id="feat-strand" bind:value={strand}>
						<option value={1}>Forward (+)</option>
						<option value={-1}>Reverse (-)</option>
					</select>
				</div>
				<div class="field">
					<label for="feat-color">Color</label>
					<input id="feat-color" type="color" bind:value={color} />
				</div>
			</div>
		</div>

		<div class="dialog-footer">
			<button class="btn btn-cancel" onclick={oncancel}>Cancel</button>
			<button class="btn btn-save" onclick={handleSave} disabled={!name}>
				{isEditing ? 'Save' : 'Create'}
			</button>
		</div>
	</div>
</div>

<style>
	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--hatch-dialog-overlay, rgba(0, 0, 0, 0.5));
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
	}

	.dialog {
		background: var(--hatch-dialog-bg, #1e2a38);
		border: 1px solid var(--hatch-border, #2a3848);
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		width: 380px;
		max-width: 90vw;
		font-family: var(--hatch-font, -apple-system, sans-serif);
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid var(--hatch-border, #2a3848);
	}

	.dialog-header h3 {
		margin: 0;
		font-size: 14px;
		color: var(--hatch-text, #d4dce6);
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--hatch-text-muted, #8a95a5);
		font-size: 20px;
		cursor: pointer;
		padding: 0 4px;
		line-height: 1;
	}

	.close-btn:hover {
		color: var(--hatch-text, #d4dce6);
	}

	.dialog-body {
		padding: 16px;
	}

	.field {
		margin-bottom: 12px;
	}

	.field label {
		display: block;
		font-size: 12px;
		color: var(--hatch-text-muted, #8a95a5);
		margin-bottom: 4px;
	}

	.field input,
	.field select {
		width: 100%;
		padding: 6px 8px;
		background: var(--hatch-bg, #0c1018);
		border: 1px solid var(--hatch-border, #2a3848);
		border-radius: 4px;
		color: var(--hatch-text, #d4dce6);
		font-size: 13px;
		box-sizing: border-box;
	}

	.field input[type="color"] {
		padding: 2px;
		height: 32px;
		cursor: pointer;
	}

	.field-row {
		display: flex;
		gap: 12px;
	}

	.field-row .field {
		flex: 1;
	}

	.dialog-footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 12px 16px;
		border-top: 1px solid var(--hatch-border, #2a3848);
	}

	.btn {
		padding: 6px 16px;
		border: 1px solid var(--hatch-border, #2a3848);
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
	}

	.btn-cancel {
		background: transparent;
		color: var(--hatch-text-muted, #8a95a5);
	}

	.btn-cancel:hover {
		background: var(--hatch-controls-hover, #2a3848);
	}

	.btn-save {
		background: var(--hatch-highlight, #6ab8e0);
		color: #000;
		border-color: var(--hatch-highlight, #6ab8e0);
	}

	.btn-save:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.btn-save:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
