<script lang="ts">
	import type { ProteinSelection, ProteinLabel } from '../../types/index.js';

	interface Props {
		/** PDB/mmCIF/SDF data as a string */
		pdbData: string;
		/** Format of the structure data */
		format?: 'pdb' | 'mmcif' | 'sdf';
		/** Rendering style */
		style?: 'cartoon' | 'stick' | 'sphere' | 'line' | 'cross' | 'surface';
		/** Color scheme */
		colorScheme?: 'chain' | 'secondary' | 'residue' | 'element' | 'spectrum';
		/** Background color */
		backgroundColor?: string;
		/** Structure name */
		name?: string;
		/** Selection to highlight */
		selection?: ProteinSelection;
		/** Labels to add */
		labels?: ProteinLabel[];
		/** Width of the viewer */
		width?: number;
		/** Height of the viewer */
		height?: number;
		/** Auto-spin the structure */
		spin?: boolean;
		/** Callback when viewer is ready */
		onready?: (viewer: unknown) => void;
	}

	let {
		pdbData,
		format = 'pdb',
		style: viewStyle = 'cartoon',
		colorScheme = 'spectrum',
		backgroundColor = '#0c1018',
		name,
		selection,
		labels = [],
		width = 500,
		height = 400,
		spin = false,
		onready,
	}: Props = $props();

	let container: HTMLDivElement | undefined = $state(undefined);
	let loading = $state(true);
	let loadError = $state('');
	let viewer: any = $state(null);

	/** Map our color scheme names to 3Dmol specs */
	function getColorSpec(scheme: string): Record<string, unknown> {
		switch (scheme) {
			case 'chain': return { colorfunc: undefined, colorscheme: 'chainHetatm' };
			case 'secondary': return { colorscheme: 'ssJmol' };
			case 'residue': return { colorscheme: 'amino' };
			case 'element': return { colorscheme: 'default' };
			case 'spectrum': return { color: 'spectrum' };
			default: return { color: 'spectrum' };
		}
	}

	/** Map our style names to 3Dmol style specs */
	function getStyleSpec(s: string, colorSpec: Record<string, unknown>): Record<string, unknown> {
		switch (s) {
			case 'cartoon': return { cartoon: { ...colorSpec } };
			case 'stick': return { stick: { ...colorSpec } };
			case 'sphere': return { sphere: { ...colorSpec } };
			case 'line': return { line: { ...colorSpec } };
			case 'cross': return { cross: { ...colorSpec } };
			case 'surface': return { cartoon: { ...colorSpec } };
			default: return { cartoon: { ...colorSpec } };
		}
	}

	/** Module reference for 3Dmol — stored so style effect can use it */
	let mol3dRef: any = $state(null);

	/** Init effect (heavy): runs when pdbData/format/container change.
	 *  Creates viewer, adds model, applies initial style. */
	$effect(() => {
		if (!container || !pdbData) return;
		// Track only heavy dependencies
		const _pdb = pdbData;
		const _fmt = format;
		const _ctr = container;

		let destroyed = false;

		async function init() {
			try {
				loading = true;
				loadError = '';

				// Dynamic import for SSR safety — optional peer dependency
				// @ts-ignore
				const mol3d = await import(/* @vite-ignore */ '3dmol/build/3Dmol.js');

				if (destroyed) return;
				mol3dRef = mol3d;

				// Clear previous viewer
				if (viewer) {
					viewer.clear();
				}

				_ctr.innerHTML = '';

				const v = mol3d.createViewer(_ctr, {
					backgroundColor: backgroundColor,
					antialias: true,
				});

				v.addModel(_pdb, _fmt);

				const colorSpec = getColorSpec(colorScheme);
				const styleSpec = getStyleSpec(viewStyle, colorSpec);
				v.setStyle({}, styleSpec);

				if (viewStyle === 'surface') {
					v.addSurface(mol3d.SurfaceType.VDW, {
						opacity: 0.85,
						...colorSpec,
					});
				}

				if (selection) {
					const selSpec: Record<string, unknown> = {};
					if (selection.chain) selSpec.chain = selection.chain;
					if (selection.resi) selSpec.resi = selection.resi;
					if (selection.resn) selSpec.resn = selection.resn;
					if (selection.atom) selSpec.atom = selection.atom;

					const selStyleSpec: Record<string, unknown> = {};
					const selStyle = selection.style ?? 'stick';
					const selColor = selection.color ? { color: selection.color } : colorSpec;
					if (selStyle === 'stick') selStyleSpec.stick = { ...selColor, radius: 0.2 };
					else if (selStyle === 'sphere') selStyleSpec.sphere = { ...selColor };
					else selStyleSpec.cartoon = { ...selColor };

					v.setStyle(selSpec, { ...styleSpec, ...selStyleSpec });
				}

				for (const lbl of labels) {
					const labelSpec: Record<string, unknown> = {
						resi: lbl.resi,
					};
					if (lbl.chain) labelSpec.chain = lbl.chain;

					v.addLabel(lbl.text, {
						position: v.getModel().atoms.find(
							(a: any) => a.resi === lbl.resi && a.atom === 'CA' && (!lbl.chain || a.chain === lbl.chain)
						),
						backgroundColor: lbl.backgroundColor ?? 'rgba(0,0,0,0.7)',
						fontColor: lbl.color ?? '#ffffff',
						fontSize: 12,
					});
				}

				if (spin) {
					v.spin(true);
				}

				v.zoomTo();
				v.render();

				viewer = v;
				loading = false;
				onready?.(v);
			} catch (err) {
				if (!destroyed) {
					loading = false;
					loadError = err instanceof Error ? err.message : 'Failed to load 3Dmol.js';
				}
			}
		}

		init();

		return () => {
			destroyed = true;
			if (viewer) {
				viewer.clear();
				viewer = null;
			}
		};
	});

	/** Style effect (lightweight): runs when viewStyle/colorScheme/spin/selection/labels change.
	 *  Updates the existing viewer without destroying it. */
	$effect(() => {
		if (!viewer || !mol3dRef) return;
		// Track style dependencies
		const _style = viewStyle;
		const _color = colorScheme;
		const _spin = spin;
		const _sel = selection;
		const _labels = labels;

		const colorSpec = getColorSpec(_color);
		const styleSpec = getStyleSpec(_style, colorSpec);

		viewer.removeAllSurfaces();
		viewer.removeAllLabels();
		viewer.setStyle({}, styleSpec);

		if (_style === 'surface') {
			viewer.addSurface(mol3dRef.SurfaceType.VDW, {
				opacity: 0.85,
				...colorSpec,
			});
		}

		if (_sel) {
			const selSpec: Record<string, unknown> = {};
			if (_sel.chain) selSpec.chain = _sel.chain;
			if (_sel.resi) selSpec.resi = _sel.resi;
			if (_sel.resn) selSpec.resn = _sel.resn;
			if (_sel.atom) selSpec.atom = _sel.atom;

			const selStyleSpec: Record<string, unknown> = {};
			const selStyle = _sel.style ?? 'stick';
			const selColor = _sel.color ? { color: _sel.color } : colorSpec;
			if (selStyle === 'stick') selStyleSpec.stick = { ...selColor, radius: 0.2 };
			else if (selStyle === 'sphere') selStyleSpec.sphere = { ...selColor };
			else selStyleSpec.cartoon = { ...selColor };

			viewer.setStyle(selSpec, { ...styleSpec, ...selStyleSpec });
		}

		for (const lbl of _labels) {
			const labelSpec: Record<string, unknown> = {
				resi: lbl.resi,
			};
			if (lbl.chain) labelSpec.chain = lbl.chain;

			viewer.addLabel(lbl.text, {
				position: viewer.getModel().atoms.find(
					(a: any) => a.resi === lbl.resi && a.atom === 'CA' && (!lbl.chain || a.chain === lbl.chain)
				),
				backgroundColor: lbl.backgroundColor ?? 'rgba(0,0,0,0.7)',
				fontColor: lbl.color ?? '#ffffff',
				fontSize: 12,
			});
		}

		viewer.spin(_spin);
		viewer.render();
	});
</script>

<div class="hatch-protein-viewer" style:width="{width}px" style:height="{height}px">
	{#if name}
		<div class="protein-title">{name}</div>
	{/if}

	<div
		class="viewer-container"
		bind:this={container}
		style:width="{width}px"
		style:height="{name ? height - 28 : height}px"
	>
		{#if loading}
			<div class="loading-overlay">
				<div class="loading-spinner"></div>
				<span>Loading structure...</span>
			</div>
		{/if}

		{#if loadError}
			<div class="error-overlay">
				<span class="error-icon">!</span>
				<span>{loadError}</span>
				<span class="error-hint">Ensure 3dmol is installed: npm i 3dmol</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.hatch-protein-viewer {
		background: var(--hatch-bg, #0c1018);
		border: 1px solid var(--hatch-border, #2a3848);
		border-radius: 6px;
		overflow: hidden;
		position: relative;
	}

	.protein-title {
		padding: 6px 12px;
		font-size: 13px;
		font-weight: 600;
		color: var(--hatch-title-color, #d4dce6);
		font-family: var(--hatch-font, -apple-system, sans-serif);
		border-bottom: 1px solid var(--hatch-border, #2a3848);
	}

	.viewer-container {
		position: relative;
	}

	.loading-overlay,
	.error-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: var(--hatch-bg, #0c1018);
		color: var(--hatch-text-muted, #8a95a5);
		font-size: 13px;
		font-family: var(--hatch-font, -apple-system, sans-serif);
		z-index: 1;
	}

	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--hatch-border, #2a3848);
		border-top-color: var(--hatch-highlight, #6ab8e0);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-icon {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--hatch-negative, #d45858);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 18px;
	}

	.error-hint {
		font-size: 11px;
		color: var(--hatch-text-dim, #566070);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
</style>
