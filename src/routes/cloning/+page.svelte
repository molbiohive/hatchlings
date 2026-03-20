<script lang="ts">
	import { CloningStrategyViewer } from '$lib/components/cloning/index.js';
	import Tooltip from '$lib/components/shared/Tooltip.svelte';
	import type { CloningNode } from '$lib/types/index.js';
	import type { HoverInfo } from '$lib/types/utility.js';

	// Helper: generate realistic random sequence
	function randSeq(n: number, seed = 0): string {
		const bases = 'ATGC';
		let s = '';
		let x = seed || 42;
		for (let i = 0; i < n; i++) {
			x = (x * 1103515245 + 12345) & 0x7fffffff;
			s += bases[x % 4];
		}
		return s;
	}

	// ────────────────────────────────────────────────────────────────
	// 1. Restriction / Ligation  (EcoRI + BamHI)
	// ────────────────────────────────────────────────────────────────
	// pUC19 — circular, with EcoRI (G^AATTC) and BamHI (G^GATCC) in MCS
	// EcoRI at pos 396: ...NNNNG|AATTCNNNN...  → 5' overhang AATT
	// BamHI at pos 418: ...NNNNG|GATCCNNNN...  → 5' overhang GATC
	const puc19Seq = (() => {
		const s = randSeq(2686, 19);
		// Place EcoRI site at pos 396: GAATTC
		const a = s.slice(0, 394) + 'GAATTC' + s.slice(400);
		// Place BamHI site at pos 418: GGATCC
		return a.slice(0, 416) + 'GGATCC' + a.slice(422);
	})();

	const reVector: CloningNode = {
		id: 're-vec', name: 'pUC19', size: 2686, topology: 'circular',
		sequence: puc19Seq,
		cutSites: [
			{ enzyme: 'EcoRI', position: 396, end: 402, strand: 1, cutPosition: 1, complementCutPosition: 5, overhang: 'AATT' },
			{ enzyme: 'BamHI', position: 418, end: 424, strand: 1, cutPosition: 1, complementCutPosition: 5, overhang: 'GATC' },
		],
	};

	// GFP insert: EcoRI-AATT...GFP...GATC-BamHI
	const gfpInsertSeq = 'AATTC' + randSeq(710, 55) + 'GGATC';
	const reInsert: CloningNode = {
		id: 're-ins', name: 'GFP fragment', size: 720, topology: 'linear',
		sequence: gfpInsertSeq,
		cutSites: [
			{ enzyme: 'EcoRI', position: 0, end: 6, strand: 1, cutPosition: 1, complementCutPosition: 5, overhang: 'AATT' },
			{ enzyme: 'BamHI', position: 714, end: 720, strand: 1, cutPosition: 1, complementCutPosition: 5, overhang: 'GATC' },
		],
	};

	const reResultSeq = randSeq(3400, 3400);
	const reResult: CloningNode = {
		id: 're-res', name: 'pUC19-GFP', size: 3400, topology: 'circular',
		sequence: reResultSeq,
		source: {
			action: { type: 'ligation', label: 'Ligate', enzymes: ['EcoRI', 'BamHI'], notes: 'T4 DNA Ligase, 16°C overnight' },
			inputs: [
				{ conditions: 'EcoRI + BamHI digest', node: reVector },
				{ conditions: 'EcoRI + BamHI ends', node: reInsert },
			],
		},
	};

	// ────────────────────────────────────────────────────────────────
	// 2. Gibson Assembly  (30bp overlaps)
	// ────────────────────────────────────────────────────────────────
	const overlapA = 'ATGCGATCGTACGATCGATCGATCGATCGA'; // 30bp overlap a
	const overlapB = 'TCGATCGATCGATCGTACGATCGATCGATG'; // 30bp overlap b

	const gibBbSeq = overlapA + randSeq(4760, 88) + overlapB;
	const gibsonBackbone: CloningNode = {
		id: 'gib-bb', name: 'pTK-Express (lin.)', size: 4820, topology: 'linear',
		sequence: gibBbSeq,
	};

	const gibInsSeq = overlapB + randSeq(720, 99) + overlapA;
	const gibsonInsert: CloningNode = {
		id: 'gib-ins', name: 'Cbln1 amplicon', size: 780, topology: 'linear',
		sequence: gibInsSeq,
	};

	const gibsonResult: CloningNode = {
		id: 'gib-res', name: 'Cbln1-mNG', size: 5510, topology: 'circular',
		sequence: randSeq(5510, 55),
		source: {
			action: { type: 'gibson', label: 'Gibson Assembly', temperature: '50°C', duration: '1 hr' },
			inputs: [
				{ conditions: 'Linearized backbone', node: gibsonBackbone },
				{ conditions: '30bp overlap arms', node: gibsonInsert },
			],
		},
	};

	// ────────────────────────────────────────────────────────────────
	// 3. Golden Gate  (BsaI, 3 parts, 4nt overhangs)
	// ────────────────────────────────────────────────────────────────
	// Overhangs: AATG → TTCG → GCAA → AATG (cycles back)
	const ggP1Seq = 'AATG' + randSeq(512, 31) + 'TTCG';
	const ggPart1: CloningNode = {
		id: 'gg-p1', name: 'Part1 (Pro)', size: 520, topology: 'linear',
		sequence: ggP1Seq,
		cutSites: [
			{ enzyme: 'BsaI', position: 0, end: 7, strand: 1, cutPosition: 4, complementCutPosition: 8, overhang: 'AATG' },
			{ enzyme: 'BsaI', position: 513, end: 520, strand: -1, cutPosition: 4, complementCutPosition: 8, overhang: 'TTCG' },
		],
	};

	const ggP2Seq = 'TTCG' + randSeq(832, 32) + 'GCAA';
	const ggPart2: CloningNode = {
		id: 'gg-p2', name: 'Part2 (CDS)', size: 840, topology: 'linear',
		sequence: ggP2Seq,
		cutSites: [
			{ enzyme: 'BsaI', position: 0, end: 7, strand: 1, cutPosition: 4, complementCutPosition: 8, overhang: 'TTCG' },
			{ enzyme: 'BsaI', position: 833, end: 840, strand: -1, cutPosition: 4, complementCutPosition: 8, overhang: 'GCAA' },
		],
	};

	const ggP3Seq = 'GCAA' + randSeq(272, 33) + 'AATG';
	const ggPart3: CloningNode = {
		id: 'gg-p3', name: 'Part3 (Ter)', size: 280, topology: 'linear',
		sequence: ggP3Seq,
		cutSites: [
			{ enzyme: 'BsaI', position: 0, end: 7, strand: 1, cutPosition: 4, complementCutPosition: 8, overhang: 'GCAA' },
			{ enzyme: 'BsaI', position: 273, end: 280, strand: -1, cutPosition: 4, complementCutPosition: 8, overhang: 'AATG' },
		],
	};

	const ggResult: CloningNode = {
		id: 'gg-res', name: 'pGG-T7sfGFP', size: 4200, topology: 'circular',
		sequence: randSeq(4200, 42),
		source: {
			action: { type: 'golden-gate', label: 'Golden Gate (BsaI)', enzymes: ['BsaI'], temperature: '37°C/16°C', notes: '30 cycles' },
			inputs: [
				{ conditions: 'BsaI flanked', node: ggPart1 },
				{ conditions: 'BsaI flanked', node: ggPart2 },
				{ conditions: 'BsaI flanked', node: ggPart3 },
			],
		},
	};

	// ────────────────────────────────────────────────────────────────
	// 4a. Cre-loxP Excision  (▷...▷)
	// ────────────────────────────────────────────────────────────────
	const LOXP_FWD = 'ATAACTTCGTATAATGTATGCTATACGAAGTTAT'; // 34bp loxP forward
	const LOXP_REV = 'ATAACTTCGTATAGCATACATTATACGAAGTTAT'; // 34bp loxP reverse complement
	const floxedSeq = randSeq(2400, 44) + LOXP_FWD + randSeq(1200, 45) + LOXP_FWD + randSeq(3332, 46);
	const floxedLocus: CloningNode = {
		id: 'cre-in', name: 'Floxed locus', size: 8000, topology: 'linear',
		sequence: floxedSeq,
	};

	const creLoxExcision: CloningNode = {
		id: 'cre-exc-res', name: 'KO locus', size: 6600, topology: 'linear',
		sequence: randSeq(6600, 66),
		source: {
			action: { type: 'cre-lox', label: 'Cre recombinase', subtype: 'excision', notes: '▷loxP...▷loxP → excision' },
			inputs: [{ conditions: '+ Cre recombinase', node: floxedLocus }],
			byproducts: [{
				id: 'cre-ex', name: 'Excised circle', size: 1400, topology: 'circular',
				sequence: randSeq(1400, 14),
			}],
		},
	};

	// ────────────────────────────────────────────────────────────────
	// 4b. Cre-loxP Inversion  (▷...◁)
	// ────────────────────────────────────────────────────────────────
	const invertSeq = randSeq(2000, 47) + LOXP_FWD + randSeq(800, 48) + LOXP_REV + randSeq(2000, 49);
	const invertLocus: CloningNode = {
		id: 'cre-inv-in', name: 'Flanked locus', size: 4868, topology: 'linear',
		sequence: invertSeq,
	};

	const creLoxInversion: CloningNode = {
		id: 'cre-inv-res', name: 'Inverted locus', size: 4868, topology: 'linear',
		sequence: randSeq(4868, 68),
		source: {
			action: { type: 'cre-lox', label: 'Cre recombinase', subtype: 'inversion', notes: '▷loxP...◁loxP → inversion' },
			inputs: [{ conditions: '+ Cre recombinase', node: invertLocus }],
		},
	};

	// ────────────────────────────────────────────────────────────────
	// 4c. Cre-loxP Insertion  (target + donor circle)
	// ────────────────────────────────────────────────────────────────
	const insertTargetSeq = randSeq(3000, 50) + LOXP_FWD + randSeq(3000, 51);
	const insertTarget: CloningNode = {
		id: 'cre-ins-tgt', name: 'Target locus', size: 6034, topology: 'linear',
		sequence: insertTargetSeq,
	};

	const insertDonorSeq = randSeq(1400, 52) + LOXP_FWD + randSeq(1400, 53);
	const insertDonor: CloningNode = {
		id: 'cre-ins-don', name: 'Donor circle', size: 2834, topology: 'circular',
		sequence: insertDonorSeq,
	};

	const creLoxInsertion: CloningNode = {
		id: 'cre-ins-res', name: 'Integrated locus', size: 8868, topology: 'linear',
		sequence: randSeq(8868, 88),
		source: {
			action: { type: 'cre-lox', label: 'Cre recombinase', subtype: 'insertion', notes: 'loxP target + loxP donor → integration' },
			inputs: [
				{ conditions: 'Target (loxP)', node: insertTarget },
				{ conditions: 'Donor circle (loxP)', node: insertDonor },
			],
		},
	};

	// ────────────────────────────────────────────────────────────────
	// 4d. Cre-loxP Translocation  (2 different loci)
	// ────────────────────────────────────────────────────────────────
	const transLocusASeq = randSeq(4000, 54) + LOXP_FWD + randSeq(2000, 55);
	const transLocusA: CloningNode = {
		id: 'cre-tr-a', name: 'Locus A', size: 6034, topology: 'linear',
		sequence: transLocusASeq,
	};

	const transLocusBSeq = randSeq(3000, 56) + LOXP_FWD + randSeq(3000, 57);
	const transLocusB: CloningNode = {
		id: 'cre-tr-b', name: 'Locus B', size: 6034, topology: 'linear',
		sequence: transLocusBSeq,
	};

	const creLoxTranslocation: CloningNode = {
		id: 'cre-tr-res', name: 'Recombinant 1', size: 7034, topology: 'linear',
		sequence: randSeq(7034, 70),
		source: {
			action: { type: 'cre-lox', label: 'Cre recombinase', subtype: 'translocation', notes: 'loxP on two loci → reciprocal exchange' },
			inputs: [
				{ conditions: 'Locus A (loxP)', node: transLocusA },
				{ conditions: 'Locus B (loxP)', node: transLocusB },
			],
			byproducts: [{
				id: 'cre-tr-bp', name: 'Recombinant 2', size: 5034, topology: 'linear',
				sequence: randSeq(5034, 50),
			}],
		},
	};

	// ────────────────────────────────────────────────────────────────
	// 5. Gateway LR
	// ────────────────────────────────────────────────────────────────
	const gwEntry: CloningNode = {
		id: 'gw-entry', name: 'pENTR-GOI', size: 3800, topology: 'circular',
		sequence: randSeq(3800, 38),
	};
	const gwDest: CloningNode = {
		id: 'gw-dest', name: 'pDEST-AmpR', size: 5600, topology: 'circular',
		sequence: randSeq(5600, 56),
	};
	const gwResult: CloningNode = {
		id: 'gw-res', name: 'pEXP-GOI', size: 6200, topology: 'circular',
		sequence: randSeq(6200, 62),
		source: {
			action: { type: 'gateway', label: 'LR Clonase II', temperature: '25°C', notes: 'attL × attR → attB + attP' },
			inputs: [
				{ conditions: 'Entry clone (attL)', node: gwEntry },
				{ conditions: 'Dest vector (attR)', node: gwDest },
			],
			byproducts: [{
				id: 'gw-bp', name: 'Byproduct', size: 2400, topology: 'circular',
				sequence: randSeq(2400, 24),
				description: 'ccdB counter-selected',
			}],
		},
	};

	// ────────────────────────────────────────────────────────────────
	// 6. CRISPR-Cas9 HDR
	// ────────────────────────────────────────────────────────────────
	const genomicSeq = randSeq(12000, 120);
	const genomicLocus: CloningNode = {
		id: 'cr-locus', name: 'Rosa26 locus', size: 12000, topology: 'linear',
		sequence: genomicSeq,
	};

	const donorSeq = genomicSeq.slice(5000, 5800) + 'ATGGTGAGCAAGGGCGAGGAG' + randSeq(779, 77) + genomicSeq.slice(5820, 6620);
	const donorTemplate: CloningNode = {
		id: 'cr-donor', name: 'HDR donor', size: 2400, topology: 'linear',
		sequence: donorSeq,
	};

	const crisprResult: CloningNode = {
		id: 'cr-res', name: 'Rosa26::GFP', size: 13200, topology: 'linear',
		sequence: randSeq(13200, 132),
		source: {
			action: {
				type: 'crispr-hdr', label: 'CRISPR-Cas9 HDR',
				guide: genomicSeq.slice(5790, 5810),
				pam: genomicSeq.slice(5810, 5813),
				notes: 'sgRNA + Cas9 RNP + HDR donor',
			},
			inputs: [
				{ conditions: 'Cas9 + sgRNA (DSB)', node: genomicLocus },
				{ conditions: 'HDR donor (800bp arms)', node: donorTemplate },
			],
		},
	};

	// ── Tooltip state ──
	let hoverInfo: HoverInfo | null = $state(null);

	function handleHover(info: HoverInfo | null) {
		hoverInfo = info;
	}

	// ────────────────────────────────────────────────────────────────
	const strategies = [
		{ title: '1. Restriction / Ligation', sub: 'EcoRI + BamHI → directional cloning into pUC19', node: reResult },
		{ title: '2. Gibson Assembly', sub: '30bp homology overlaps, exonuclease + polymerase + ligase, 50°C', node: gibsonResult },
		{ title: '3. Golden Gate (BsaI)', sub: 'Type IIS: 4nt overhang codes define fragment order (AATG→TTCG→GCAA→AATG)', node: ggResult },
		{ title: '4a. Cre-loxP Excision', sub: '▷loxP...▷loxP (same orientation) → floxed region excised as circle', node: creLoxExcision },
		{ title: '4b. Cre-loxP Inversion', sub: '▷loxP...◁loxP (opposite orientation) → flanked segment flipped in place', node: creLoxInversion },
		{ title: '4c. Cre-loxP Insertion', sub: 'loxP on target + loxP on donor circle → integration', node: creLoxInsertion },
		{ title: '4d. Cre-loxP Translocation', sub: 'loxP on two loci → reciprocal exchange of segments', node: creLoxTranslocation },
		{ title: '5. Gateway LR', sub: 'attL × attR → attB + attP (LR Clonase II)', node: gwResult },
		{ title: '6. CRISPR-Cas9 HDR', sub: 'sgRNA-guided DSB + homology-directed repair with donor template', node: crisprResult },
	];

	let viewerWidth = $state(1100);
</script>

<div class="page">
	<h1>Cloning Strategy Viewer</h1>
	<p class="subtitle">Sequence-level visualization of cloning paradigms</p>

	{#each strategies as strat}
		<section class="strategy">
			<div class="strategy-header">
				<h2>{strat.title}</h2>
				<span class="strategy-sub">{strat.sub}</span>
			</div>
			<div class="viewer-wrap" bind:clientWidth={viewerWidth}>
				<CloningStrategyViewer node={strat.node} width={viewerWidth} height={160} marginBp={10} onhoverinfo={handleHover} />
			</div>
		</section>
	{/each}
</div>

<Tooltip
	visible={!!hoverInfo}
	x={hoverInfo?.position.x ?? 0}
	y={hoverInfo?.position.y ?? 0}
	title={hoverInfo?.title}
	items={hoverInfo?.items ?? []}
/>

<style>
	.page {
		max-width: 95%;
		margin: 0 auto;
		padding: 32px 0 80px;
	}
	h1 {
		font-size: 22px; font-weight: 700;
		color: var(--hatch-text, #d4dce6);
		margin: 0 0 4px;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
	.subtitle {
		color: var(--hatch-text-dim, #566070);
		font-size: 13px; margin: 0 0 32px;
	}
	.strategy { margin-bottom: 36px; }
	.strategy-header { margin-bottom: 8px; }
	.strategy-header h2 {
		font-size: 15px; font-weight: 700;
		color: var(--hatch-text, #d4dce6); margin: 0 0 2px;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
	.strategy-sub {
		font-size: 11px;
		color: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
	.viewer-wrap {
		border: 1px solid var(--hatch-border, #2a3848);
		border-radius: 6px; overflow: hidden;
	}
</style>
