<script lang="ts">
	import { SequenceViewer } from '../../lib/components/sequence/index.js';
	import type { Feature, Primer, CutSite, Translation } from '../../lib/types/index.js';

	// pUC19 MCS region (~200bp)
	const sequence =
		'GAATTCGAGCTCGGTACCCGGGGATCCTCTAGAGTCGACCTGCAGGCATGCAAGCTTGGCGTAATCATGGTCATAGCTGTTTCCTGTGTGAAATTGTTATCCGCTCACAATTCCACACAACATACGAGCCGGAAGCATAAAGTGTAAAGCCTGGGGTGCCTAATGAGTGAGCTAACTCACATTAATTGCGTTGCGCTCACTGCCC';

	const features: Feature[] = [
		{
			name: 'lacZ-alpha',
			type: 'CDS',
			start: 0,
			end: 80,
			strand: 1,
			color: '#ff6b6b',
		},
		{
			name: 'MCS',
			type: 'misc_feature',
			start: 0,
			end: 48,
			strand: 1,
			color: '#bcbd22',
		},
	];

	const primers: Primer[] = [
		{
			name: 'M13F',
			start: 20,
			end: 37,
			strand: 1,
			tm: 55.2,
		},
	];

	const cutSites: CutSite[] = [
		{ enzyme: 'EcoRI', position: 0, strand: 1 },
		{ enzyme: 'BamHI', position: 26, strand: 1 },
		{ enzyme: 'HindIII', position: 50, strand: 1 },
	];

	// Translate first 60 bases (frame 1): EFELDPGDPLRVDLQACKL...
	// Simple codon table for demo
	function translateDNA(dna: string): string {
		const codonTable: Record<string, string> = {
			TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
			CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
			ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
			GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
			TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
			CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
			ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
			GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
			TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
			CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
			AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
			GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
			TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
			CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
			AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
			GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
		};
		let protein = '';
		for (let i = 0; i + 2 < dna.length; i += 3) {
			const codon = dna.slice(i, i + 3).toUpperCase();
			protein += codonTable[codon] ?? '?';
		}
		return protein;
	}

	const translationSeq = sequence.slice(0, 60);
	const aminoAcids = translateDNA(translationSeq);

	const translations: Translation[] = [
		{
			start: 0,
			end: 60,
			strand: 1,
			aminoAcids,
			frame: 0,
		},
	];

	let showAnnotations = $state(true);
	let showPrimers = $state(true);
	let showTranslations = $state(true);
	let showNumbers = $state(true);

	let selectedRegion = $state<{ start: number; end: number; sequence: string } | null>(null);

	function handleSelect(sel: { start: number; end: number; sequence: string }) {
		selectedRegion = sel;
	}
</script>

<h1>SequenceViewer</h1>
<p class="subtitle">Linear sequence display with multi-track annotations</p>

<div class="controls">
	<label>
		<input type="checkbox" bind:checked={showAnnotations} />
		Annotations
	</label>
	<label>
		<input type="checkbox" bind:checked={showPrimers} />
		Primers
	</label>
	<label>
		<input type="checkbox" bind:checked={showTranslations} />
		Translations
	</label>
	<label>
		<input type="checkbox" bind:checked={showNumbers} />
		Line Numbers
	</label>
</div>

<div class="viewer-container">
	<SequenceViewer
		seq={sequence}
		{features}
		{primers}
		{cutSites}
		{translations}
		{showAnnotations}
		{showPrimers}
		{showTranslations}
		{showNumbers}
		width={750}
		height={500}
		charsPerRow={60}
		charWidth={10}
		onselect={handleSelect}
	/>
</div>

{#if selectedRegion}
	<div class="selection-info">
		<h3>Selection</h3>
		<p>
			<strong>Range:</strong> {selectedRegion.start + 1}&ndash;{selectedRegion.end}
			({selectedRegion.end - selectedRegion.start} bp)
		</p>
		<p class="sel-seq">{selectedRegion.sequence}</p>
	</div>
{/if}

<div class="info">
	<h3>Demo Data</h3>
	<p>pUC19 MCS region ({sequence.length} bp) with:</p>
	<ul>
		<li><span class="swatch" style:background="#ff6b6b"></span> lacZ-alpha CDS (1&ndash;80)</li>
		<li><span class="swatch" style:background="#bcbd22"></span> MCS misc_feature (1&ndash;48)</li>
		<li><span class="primer-tag">M13F</span> primer (21&ndash;37, Tm 55.2&deg;C)</li>
		<li>Cut sites: EcoRI (1), BamHI (27), HindIII (51)</li>
		<li>Frame 1 translation of first 60 bp</li>
	</ul>
</div>

<style>
	h1 {
		font-size: 28px;
		color: #7dd3fc;
		margin-bottom: 4px;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	.subtitle {
		color: #888;
		font-size: 14px;
		margin-bottom: 20px;
	}

	.controls {
		display: flex;
		gap: 16px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.controls label {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #ccc;
		font-size: 13px;
		cursor: pointer;
		user-select: none;
	}

	.controls input[type='checkbox'] {
		accent-color: #7dd3fc;
	}

	.viewer-container {
		margin-bottom: 20px;
	}

	.selection-info {
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 6px;
		padding: 12px 16px;
		margin-bottom: 20px;
	}

	.selection-info h3 {
		color: #7dd3fc;
		font-size: 14px;
		margin: 0 0 8px;
	}

	.selection-info p {
		color: #ccc;
		font-size: 13px;
		margin: 4px 0;
	}

	.sel-seq {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 12px;
		word-break: break-all;
		color: #aaa;
		background: #0d0d1a;
		padding: 8px;
		border-radius: 4px;
		margin-top: 8px;
	}

	.info {
		background: #1a1a2e;
		border: 1px solid #2a2a4a;
		border-radius: 6px;
		padding: 16px;
	}

	.info h3 {
		color: #7dd3fc;
		font-size: 14px;
		margin: 0 0 8px;
	}

	.info p {
		color: #ccc;
		font-size: 13px;
		margin: 0 0 8px;
	}

	.info ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.info li {
		color: #aaa;
		font-size: 13px;
		padding: 3px 0;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.swatch {
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}

	.primer-tag {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 11px;
		color: #22d3ee;
		background: rgba(34, 211, 238, 0.1);
		padding: 1px 5px;
		border-radius: 3px;
	}
</style>
