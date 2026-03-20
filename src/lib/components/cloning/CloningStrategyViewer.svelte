<script lang="ts">
	import type {
		CloningNode, CloningAction, CloningSourceInput, FragmentEnd, StickyEnd, HomologyEnd,
		TypeIISEnd,
	} from '../../types/cloning.js';
	import type { HoverInfo } from '../../types/utility.js';
	import type { CutSite } from '../../types/sequence.js';

	interface Props {
		node: CloningNode;
		width?: number;
		height?: number;
		/** How many bp to show at each end of a construct */
		marginBp?: number;
		onhoverinfo?: (info: HoverInfo | null) => void;
	}

	let { node, width = 1100, height = 160, marginBp = 10, onhoverinfo }: Props = $props();

	// ── Constants ──
	const CHAR_W = 8.5;         // monospace character width
	const CHAR_H = 14;          // monospace line height
	const STRAND_GAP = 3;       // gap between sense and complement lines
	const ROW_H = CHAR_H * 2 + STRAND_GAP;
	const COLLAPSE_W = 40;      // collapsed middle section width
	const MINI_GAP = 20;        // gap width in windowed middle sections
	const SYMBOL_GAP = 36;      // gap between constructs for + / → symbols
	const PAD_X = 24;           // left padding (room for 5'/3' labels)
	const PAD_TOP = 36;         // space above for enzyme + overhang code labels
	const CONTEXT_BP = 6;       // grey flanking bases beyond fragment ends
	const OVERHANG_COLOR = '#fbbf24';   // amber highlight for single-strand
	const OVERLAP_COLORS = ['#67e8f9', '#c084fc', '#86efac', '#fcd34d', '#fca5a5', '#a5b4fc'];

	const PALETTE = ['#58a6ff', '#f97316', '#22c55e', '#a78bfa', '#f472b6', '#facc15'];
	const OVERLAP_ACTIONS = ['gibson', 'infusion', 'slic', 'cpec'];
	const GOLDEN_GATE_ACTIONS = ['golden-gate', 'goldengate', 'gg', 'moclo'];
	const GATEWAY_ACTIONS = ['gateway', 'lr', 'bp', 'lr-clonase'];
	const CRE_LOX_ACTIONS = ['cre-lox', 'cre', 'flp-frt', 'recombination'];
	const CRISPR_ACTIONS = ['crispr', 'crispr-hdr', 'hdr', 'cas9'];

	/** Recognition site database for grey flanking context rendering */
	const ENZYME_SITES: Record<string, { seq: string; senseCut: number; compCut: number }> = {
		// Type II (cut within recognition site)
		'EcoRI':   { seq: 'GAATTC',   senseCut: 1, compCut: 5 },
		'BamHI':   { seq: 'GGATCC',   senseCut: 1, compCut: 5 },
		'HindIII': { seq: 'AAGCTT',   senseCut: 1, compCut: 5 },
		'XbaI':    { seq: 'TCTAGA',   senseCut: 1, compCut: 5 },
		'SalI':    { seq: 'GTCGAC',   senseCut: 1, compCut: 5 },
		'NcoI':    { seq: 'CCATGG',   senseCut: 1, compCut: 5 },
		'XhoI':    { seq: 'CTCGAG',   senseCut: 1, compCut: 5 },
		'PstI':    { seq: 'CTGCAG',   senseCut: 5, compCut: 1 },
		'SphI':    { seq: 'GCATGC',   senseCut: 5, compCut: 1 },
		'KpnI':    { seq: 'GGTACC',   senseCut: 5, compCut: 1 },
		'NdeI':    { seq: 'CATATG',   senseCut: 2, compCut: 4 },
		'NotI':    { seq: 'GCGGCCGC', senseCut: 2, compCut: 6 },
		'EcoRV':   { seq: 'GATATC',   senseCut: 3, compCut: 3 },
		'SmaI':    { seq: 'CCCGGG',   senseCut: 3, compCut: 3 },
		// Type IIS (cut outside recognition site)
		'BsaI':    { seq: 'GGTCTC',   senseCut: 7, compCut: 11 },
		'BbsI':    { seq: 'GAAGAC',   senseCut: 8, compCut: 12 },
		'BsmBI':   { seq: 'CGTCTC',   senseCut: 7, compCut: 11 },
		'SapI':    { seq: 'GCTCTTC',  senseCut: 8, compCut: 11 },
		'BpiI':    { seq: 'GAAGAC',   senseCut: 8, compCut: 12 },
	};

	// ── Complement base ──
	function complement(base: string): string {
		const map: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G', N: 'N' };
		return map[base.toUpperCase()] ?? 'N';
	}

	// ── Sequence extraction helpers ──
	function getLeftSeq(cn: CloningNode, n: number): string {
		if (cn.sequence) return cn.sequence.slice(0, n).toUpperCase();
		return 'N'.repeat(Math.min(n, cn.size));
	}

	function getRightSeq(cn: CloningNode, n: number): string {
		if (cn.sequence) return cn.sequence.slice(-n).toUpperCase();
		return 'N'.repeat(Math.min(n, cn.size));
	}

	// ── End resolution helpers ──
	function overhangDir(cs: CutSite): '5prime' | '3prime' {
		return (cs.cutPosition ?? 0) < (cs.complementCutPosition ?? 0) ? '5prime' : '3prime';
	}

	function makeStickyEnd(cs: CutSite): StickyEnd {
		return { type: 'sticky', enzyme: cs.enzyme, overhang: cs.overhang ?? '', direction: overhangDir(cs) };
	}

	function makeTypeIISEnd(cs: CutSite): TypeIISEnd {
		return { type: 'type-iis', enzyme: cs.enzyme, overhang: cs.overhang ?? '', direction: overhangDir(cs) };
	}

	const CLOSED: FragmentEnd = { type: 'closed' };
	const BLUNT: FragmentEnd = { type: 'blunt' };

	function getTerminalCutSites(cn: CloningNode): { fivePrime: CutSite | null; threePrime: CutSite | null } {
		if (!cn.cutSites?.length) return { fivePrime: null, threePrime: null };
		const threshold = Math.max(cn.size * 0.02, 10);
		let fp: CutSite | null = null, tp: CutSite | null = null;
		for (const cs of cn.cutSites) {
			if (cs.position <= threshold) fp = cs;
			if (cs.position >= cn.size - threshold || (cs.end != null && cs.end >= cn.size - threshold)) tp = cs;
		}
		return { fivePrime: fp, threePrime: tp };
	}

	function getLinearizationSites(cn: CloningNode, enzymes: string[]): { left: CutSite; right: CutSite } | null {
		if (cn.topology !== 'circular' || !enzymes.length || !cn.cutSites?.length) return null;
		const matching = cn.cutSites.filter(cs => enzymes.includes(cs.enzyme)).sort((a, b) => a.position - b.position);
		return matching.length >= 2 ? { left: matching[0], right: matching[1] } : null;
	}

	function detectParadigm(actionType: string): string {
		const t = actionType.toLowerCase();
		if (GATEWAY_ACTIONS.some(a => t.includes(a))) return 'gateway';
		if (CRE_LOX_ACTIONS.some(a => t.includes(a))) return 'cre-lox';
		if (CRISPR_ACTIONS.some(a => t.includes(a))) return 'crispr';
		if (GOLDEN_GATE_ACTIONS.some(a => t.includes(a))) return 'golden-gate';
		if (OVERLAP_ACTIONS.some(a => t.includes(a))) return 'overlap';
		return 'assembly';
	}

	// ── Sequence block: what to render for one end of a construct ──
	// Each character position has a sense char, comp char, and a type.
	// 'ds' = both strands present, 'oh-s' = only sense (comp missing), 'oh-c' = only comp (sense missing)
	interface SeqBlock {
		sense: string;
		comp: string;
		charType: ('ds' | 'oh-s' | 'oh-c')[];
		bgColor?: (string | null)[];
		ohColor?: string;
	}

	interface SeqWindow {
		block: SeqBlock;
		label: string;
		labelColor: string;
		/** Label rendered in the gap before this window */
		gapLabel?: string;
		gapLabelColor?: string;
		/** How to render gap before this window: 'dashed' (default) or 'dsb' (double-strand break) */
		gapType?: 'dashed' | 'dsb';
		/** Triangle direction for recombination sites: 'forward' (▷) or 'reverse' (◁) */
		direction?: 'forward' | 'reverse';
	}

	interface PlacedConstruct {
		node: CloningNode;
		isResult: boolean;
		isByproduct: boolean;
		conditions?: string;
		color: string;
		opacity: number;
		leftBlock: SeqBlock;
		rightBlock: SeqBlock;
		hasMiddle: boolean;
		middleW: number;
		windows?: SeqWindow[];
		middleColor?: string;
		middleLabel?: string;
		leftEnzyme?: string;
		rightEnzyme?: string;
		/** Greyed-out flanking sequence extending beyond fragment ends */
		leftContext?: SeqBlock;
		rightContext?: SeqBlock;
		/** Label below context sequence (e.g., enzyme rec site name) */
		leftContextLabel?: string;
		rightContextLabel?: string;
		circular: boolean;
		x: number;
		totalW: number;
	}

	/**
	 * Build a sequence block for one end.
	 *
	 * Key biology for sticky ends:
	 * - 5' overhang at LEFT end:  sense strand extends left (overhang on sense)
	 * - 5' overhang at RIGHT end: complement strand extends right (overhang on comp)
	 * - 3' overhang at LEFT end:  complement strand extends left (overhang on comp)
	 * - 3' overhang at RIGHT end: sense strand extends right (overhang on sense)
	 *
	 * This ensures that adjacent compatible fragments show complementary overhangs
	 * on opposite strands — making ligation visually intuitive.
	 */
	function buildEndBlock(seq: string, end: FragmentEnd, side: 'left' | 'right', ohColor?: string): SeqBlock {
		const n = seq.length;
		const compSeq = seq.split('').map(complement).join('');

		if (end.type === 'closed' || end.type === 'blunt') {
			return { sense: seq, comp: compSeq, charType: Array(n).fill('ds') };
		}

		if (end.type === 'sticky' || end.type === 'type-iis') {
			const oh = (end.type === 'sticky' ? end.overhang : end.overhang) ?? '';
			const ohLen = oh.length;
			if (ohLen === 0) return { sense: seq, comp: compSeq, charType: Array(n).fill('ds') };

			const is5p = end.direction === '5prime';
			const ohUpper = oh.toUpperCase();
			const ohComp = ohUpper.split('').map(complement).join('');

			// Both strands filled: extending strand colored (oh-s/oh-c),
			// non-extending strand shows complementary bases rendered in grey.
			if (side === 'left') {
				const senseExtends = is5p;
				const fullSense = ohUpper + seq;
				const fullComp  = ohComp + compSeq;
				const types: SeqBlock['charType'] = [];
				for (let i = 0; i < ohLen; i++) types.push(senseExtends ? 'oh-s' : 'oh-c');
				for (let i = 0; i < n; i++) types.push('ds');
				return { sense: fullSense, comp: fullComp, charType: types, ohColor };
			} else {
				const compExtends = is5p;
				const fullSense = seq + ohUpper;
				const fullComp  = compSeq + ohComp;
				const types: SeqBlock['charType'] = [];
				for (let i = 0; i < n; i++) types.push('ds');
				for (let i = 0; i < ohLen; i++) types.push(compExtends ? 'oh-c' : 'oh-s');
				return { sense: fullSense, comp: fullComp, charType: types, ohColor };
			}
		}

		if (end.type === 'homology') {
			const overlapLen = end.length ?? marginBp;
			const bgColor: (string | null)[] = Array(n).fill(null);
			if (side === 'left') {
				for (let i = 0; i < Math.min(overlapLen, n); i++) bgColor[i] = end.color ?? OVERLAP_COLORS[0];
			} else {
				for (let i = Math.max(0, n - overlapLen); i < n; i++) bgColor[i] = end.color ?? OVERLAP_COLORS[0];
			}
			return { sense: seq, comp: compSeq, charType: Array(n).fill('ds'), bgColor };
		}

		return { sense: seq, comp: compSeq, charType: Array(n).fill('ds') };
	}

	function blockWidth(block: SeqBlock): number {
		return block.sense.length * CHAR_W;
	}

	/** Build a greyed-out context block from raw sequence */
	function buildContextBlock(seq: string): SeqBlock {
		const upper = seq.toUpperCase();
		const comp = upper.split('').map(complement).join('');
		return { sense: upper, comp, charType: Array(upper.length).fill('ds') as ('ds')[] };
	}

	/**
	 * Get flanking context sequences for a circular construct.
	 * Left context: the last N bases (wraps before position 0).
	 * Right context: the first N bases (wraps after the end).
	 */
	function getCircularContext(cn: CloningNode, n: number): { left: string; right: string } | null {
		if (cn.topology !== 'circular' || !cn.sequence) return null;
		const seq = cn.sequence.toUpperCase();
		return {
			left: seq.slice(-n),   // end of circle wraps to before start
			right: seq.slice(0, n), // start of circle wraps to after end
		};
	}

	/**
	 * Build grey context block for a restriction enzyme cut site.
	 * Prefers server-provided CutSite data (recognitionSeq, senseCutOffset, complementCutOffset),
	 * falls back to built-in ENZYME_SITES lookup.
	 * Type II (cuts within rec site): shows the ds cut-off bases (overhang complement is in the end block).
	 * Type IIS (cuts outside rec site): shows the recognition site sequence as ds block.
	 */
	function buildEnzymeCutContext(
		cs: CutSite, side: 'left' | 'right'
	): { block: SeqBlock; label?: string } | null {
		// Resolve recognition site + cut positions from CutSite or ENZYME_SITES
		let recSeq: string | undefined;
		let senseCut: number | undefined;
		let compCut: number | undefined;

		if (cs.recognitionSeq && cs.senseCutOffset != null && cs.complementCutOffset != null) {
			recSeq = cs.recognitionSeq;
			senseCut = cs.senseCutOffset;
			compCut = cs.complementCutOffset;
		} else {
			const site = ENZYME_SITES[cs.enzyme];
			if (!site) return null;
			recSeq = site.seq;
			senseCut = site.senseCut;
			compCut = site.compCut;
		}

		const cutsOutside = senseCut > recSeq.length;

		if (cutsOutside) {
			// Type IIS: rec site is in discarded flanking DNA
			const fwd = recSeq.toUpperCase();
			const rc = fwd.split('').reverse().map(complement).join('');
			const strand = cs.strand ?? 1;
			const seq = (side === 'left')
				? (strand === 1 ? fwd : rc)
				: (strand === -1 ? rc : fwd);
			return { block: buildContextBlock(seq), label: cs.enzyme };
		} else {
			// Type II: only the ds cut-off portion (overhang complement is handled in buildEndBlock)
			if (side === 'left') {
				const cutOff = recSeq.slice(0, Math.min(senseCut, compCut)).toUpperCase();
				return cutOff.length > 0 ? { block: buildContextBlock(cutOff) } : null;
			} else {
				const cutOff = recSeq.slice(Math.max(senseCut, compCut)).toUpperCase();
				return cutOff.length > 0 ? { block: buildContextBlock(cutOff) } : null;
			}
		}
	}

	function buildWindowBlock(seq: string, bgColors: (string | null)[]): SeqBlock {
		const upper = seq.toUpperCase();
		const comp = upper.split('').map(complement).join('');
		return {
			sense: upper,
			comp,
			charType: Array(upper.length).fill('ds') as ('ds')[],
			bgColor: bgColors,
		};
	}

	// ── Derived ──
	let opLabel = $derived.by(() => {
		if (!node.source) return '';
		const a = node.source.action;
		if (a.label) return a.label;
		const t = a.type ?? 'operation';
		return t.charAt(0).toUpperCase() + t.slice(1);
	});

	let paradigm = $derived(node.source ? detectParadigm(node.source.action.type) : 'assembly');

	// Color-match compatible overhangs: same overhang sequence → same color
	const OH_PALETTE = ['#67e8f9', '#a78bfa', '#86efac', '#fcd34d', '#fca5a5', '#f97316'];
	let overhangColors = $derived.by(() => {
		const map = new Map<string, string>();
		let idx = 0;
		function reg(oh: string) {
			const key = oh.toUpperCase();
			if (key && !map.has(key)) { map.set(key, OH_PALETTE[idx % OH_PALETTE.length]); idx++; }
		}
		if (node.source?.inputs) {
			for (const inp of node.source.inputs) {
				for (const cs of inp.node.cutSites ?? []) { if (cs.overhang) reg(cs.overhang); }
			}
		}
		for (const cs of node.cutSites ?? []) { if (cs.overhang) reg(cs.overhang); }
		return map;
	});

	function endOhColor(end: FragmentEnd): string | undefined {
		if ((end.type === 'sticky' || end.type === 'type-iis') && end.overhang) {
			return overhangColors.get(end.overhang.toUpperCase());
		}
	}

	let constructs = $derived.by((): PlacedConstruct[] => {
		const action = node.source?.action;
		const actionEnzymes = action?.enzymes ?? [];
		const isOverlap = paradigm === 'overlap';
		const isGoldenGate = paradigm === 'golden-gate';
		const isGateway = paradigm === 'gateway';
		let overlapIdx = 0;

		const items: Omit<PlacedConstruct, 'x' | 'totalW' | 'middleW'>[] = [];

		if (node.source?.inputs) {
			for (let i = 0; i < node.source.inputs.length; i++) {
				const inp = node.source.inputs[i];
				const cn = inp.node;
				const color = PALETTE[(i + 1) % PALETTE.length];
				const leftSeq = getLeftSeq(cn, marginBp);
				const rightSeq = getRightSeq(cn, marginBp);
				const hasMiddle = cn.size > marginBp * 2 + 10;

				let leftEnd: FragmentEnd = BLUNT;
				let rightEnd: FragmentEnd = BLUNT;
				let leftEnzyme: string | undefined;
				let rightEnzyme: string | undefined;
				let leftContext: SeqBlock | undefined;
				let rightContext: SeqBlock | undefined;
				let leftContextLabel: string | undefined;
				let rightContextLabel: string | undefined;
				let circular = cn.topology === 'circular';

				if (cn.topology === 'circular') {
					const linSites = getLinearizationSites(cn, actionEnzymes);
					if (linSites) {
						leftEnd = makeStickyEnd(linSites.left);
						rightEnd = makeStickyEnd(linSites.right);
						leftEnzyme = linSites.left.enzyme;
						rightEnzyme = linSites.right.enzyme;
						circular = false;
					} else {
						leftEnd = CLOSED;
						rightEnd = CLOSED;
					}
				} else if (isOverlap) {
					const lColor = OVERLAP_COLORS[overlapIdx % OVERLAP_COLORS.length];
					overlapIdx++;
					const rColor = OVERLAP_COLORS[overlapIdx % OVERLAP_COLORS.length];
					overlapIdx++;
					leftEnd = { type: 'homology', color: lColor, length: marginBp };
					rightEnd = { type: 'homology', color: rColor, length: marginBp };
				} else if (isGoldenGate) {
					const terms = getTerminalCutSites(cn);
					leftEnd = terms.fivePrime ? makeTypeIISEnd(terms.fivePrime) : BLUNT;
					rightEnd = terms.threePrime ? makeTypeIISEnd(terms.threePrime) : BLUNT;
					if (terms.fivePrime) leftEnzyme = terms.fivePrime.enzyme;
					if (terms.threePrime) rightEnzyme = terms.threePrime.enzyme;
				} else if (paradigm === 'crispr' && i > 0) {
					// Donor template: highlight ends as homology arms
					const armColor = '#22c55e';
					leftEnd = { type: 'homology', color: armColor, length: marginBp };
					rightEnd = { type: 'homology', color: armColor, length: marginBp };
				} else {
					const terms = getTerminalCutSites(cn);
					if (terms.fivePrime) { leftEnd = makeStickyEnd(terms.fivePrime); leftEnzyme = terms.fivePrime.enzyme; }
					if (terms.threePrime) { rightEnd = makeStickyEnd(terms.threePrime); rightEnzyme = terms.threePrime.enzyme; }
				}

				// Grey flanking context for circular constructs (sequence wraps around the cut)
				if (cn.topology === 'circular' && !circular) {
					const ctx = getCircularContext(cn, CONTEXT_BP);
					if (ctx) {
						leftContext = buildContextBlock(ctx.left);
						rightContext = buildContextBlock(ctx.right);
						// For Golden Gate, label the context as recognition site
						if (isGoldenGate) {
							if (leftEnzyme) leftContextLabel = `${leftEnzyme} rec site`;
							if (rightEnzyme) rightContextLabel = `${rightEnzyme} rec site`;
						}
					}
				}

				// Grey flanking context for linear fragments with terminal enzyme sites
				// Shows cut-off recognition site bases (Type II) or rec site sequence (Type IIS)
				if (cn.topology === 'linear' && !leftContext && !rightContext) {
					const terms = getTerminalCutSites(cn);
					if (terms.fivePrime) {
						const ctx = buildEnzymeCutContext(terms.fivePrime, 'left');
						if (ctx) {
							leftContext = ctx.block;
							if (ctx.label) leftContextLabel = ctx.label;
						}
					}
					if (terms.threePrime) {
						const ctx = buildEnzymeCutContext(terms.threePrime, 'right');
						if (ctx) {
							rightContext = ctx.block;
							if (ctx.label) rightContextLabel = ctx.label;
						}
					}
				}

				items.push({
					node: cn, isResult: false, isByproduct: false,
					conditions: inp.conditions, color, opacity: 1,
					leftBlock: buildEndBlock(leftSeq, leftEnd, 'left', endOhColor(leftEnd)),
					rightBlock: buildEndBlock(rightSeq, rightEnd, 'right', endOhColor(rightEnd)),
					hasMiddle, leftEnzyme, rightEnzyme,
					leftContext, rightContext, leftContextLabel, rightContextLabel,
					circular: cn.topology === 'circular' && !getLinearizationSites(cn, actionEnzymes),
				});
			}
		}

		// Result
		const rn = node;
		let rLeftEnd: FragmentEnd = rn.topology === 'circular' ? CLOSED : BLUNT;
		let rRightEnd: FragmentEnd = rn.topology === 'circular' ? CLOSED : BLUNT;
		if (rn.topology !== 'circular') {
			const rTerms = getTerminalCutSites(rn);
			if (rTerms.fivePrime) rLeftEnd = makeStickyEnd(rTerms.fivePrime);
			if (rTerms.threePrime) rRightEnd = makeStickyEnd(rTerms.threePrime);
		}
		items.push({
			node: rn, isResult: true, isByproduct: false,
			color: PALETTE[0], opacity: 1,
			leftBlock: buildEndBlock(getLeftSeq(rn, marginBp), rLeftEnd, 'left', endOhColor(rLeftEnd)),
			rightBlock: buildEndBlock(getRightSeq(rn, marginBp), rRightEnd, 'right', endOhColor(rRightEnd)),
			hasMiddle: rn.size > marginBp * 2 + 10,
			circular: rn.topology === 'circular',
		});

		// Byproducts
		if ((isGateway || paradigm === 'cre-lox') && node.source?.byproducts?.length) {
			const bp = node.source.byproducts[0];
			items.push({
				node: bp, isResult: false, isByproduct: true,
				color: '#475569', opacity: 0.4,
				leftBlock: buildEndBlock(getLeftSeq(bp, marginBp), CLOSED, 'left'),
				rightBlock: buildEndBlock(getRightSeq(bp, marginBp), CLOSED, 'right'),
				hasMiddle: bp.size > marginBp * 2 + 10,
				circular: bp.topology !== 'linear',
			});
		}

		// Build sequence windows for paradigm-specific internal features
		const LOXP_SEQ = 'ATAACTTCGTATAATGTATGCTATACGAAGTTAT';
		const LOXP_REV = 'ATAACTTCGTATAGCATACATTATACGAAGTTAT';
		const LOXP_LEN = 34; // 13bp arm + 8bp spacer + 13bp arm
		const LOXP_ARM_COLOR = '#9a3412';   // muted dark orange for palindromic arms
		const LOXP_SPACER_COLOR = '#f97316'; // bright orange for asymmetric spacer
		const LOXP_LABEL_COLOR = '#f97316';
		const WINDOW_BP = 10;

		/** Background colors for a 34bp loxP window: arm(13) | spacer(8) | arm(13) */
		function loxpBgColors(): (string | null)[] {
			return [
				...Array(13).fill(LOXP_ARM_COLOR),
				...Array(8).fill(LOXP_SPACER_COLOR),
				...Array(13).fill(LOXP_ARM_COLOR),
			];
		}

		function buildLoxpWindow(seq: string, pos: number, dir: 'forward' | 'reverse', opts?: { gapLabel?: string; gapLabelColor?: string }): SeqWindow {
			return {
				block: buildWindowBlock(seq.slice(pos, pos + LOXP_LEN), loxpBgColors()),
				label: 'loxP', labelColor: LOXP_LABEL_COLOR, direction: dir,
				...opts,
			};
		}

		function detectCreLoxOp(action: CloningAction, inputs: CloningSourceInput[], byproducts?: CloningNode[]): string {
			if (action.subtype) return action.subtype;
			const notes = (action.notes ?? '').toLowerCase();
			if (notes.includes('inversion') || notes.includes('flip')) return 'inversion';
			if (notes.includes('insertion') || notes.includes('integrat')) return 'insertion';
			if (notes.includes('translocation') || notes.includes('exchange')) return 'translocation';
			if (notes.includes('excision')) return 'excision';
			if (inputs.length >= 2) return 'insertion';
			if (inputs.length === 1) {
				const seq = inputs[0].node.sequence?.toUpperCase();
				if (seq) {
					const hasFwd = seq.includes(LOXP_SEQ);
					const hasRev = seq.includes(LOXP_REV);
					if (hasFwd && hasRev) return 'inversion';
				}
				return 'excision';
			}
			return 'excision';
		}

		if (paradigm === 'cre-lox') {
			const creLoxOp = node.source?.action
				? detectCreLoxOp(node.source.action, node.source.inputs, node.source.byproducts)
				: 'excision';

			for (const it of items) {
				if (it.isResult || it.isByproduct || !it.hasMiddle) continue;
				const seq = it.node.sequence?.toUpperCase();
				if (!seq) continue;

				if (creLoxOp === 'excision') {
					// ▷...▷ — two forward loxP sites
					const pos1 = seq.indexOf(LOXP_SEQ);
					if (pos1 < 0) continue;
					const pos2 = seq.indexOf(LOXP_SEQ, pos1 + LOXP_SEQ.length);
					if (pos2 < 0) continue;
					it.windows = [
						buildLoxpWindow(seq, pos1, 'forward'),
						buildLoxpWindow(seq, pos2, 'forward', { gapLabel: 'floxed', gapLabelColor: '#f9731680' }),
					];
				} else if (creLoxOp === 'inversion') {
					// ▷...◁ — one forward + one reverse loxP site
					const posFwd = seq.indexOf(LOXP_SEQ);
					const posRev = seq.indexOf(LOXP_REV);
					if (posFwd < 0 || posRev < 0) continue;
					const first = posFwd < posRev
						? { pos: posFwd, dir: 'forward' as const }
						: { pos: posRev, dir: 'reverse' as const };
					const second = posFwd < posRev
						? { pos: posRev, dir: 'reverse' as const }
						: { pos: posFwd, dir: 'forward' as const };
					it.windows = [
						buildLoxpWindow(seq, first.pos, first.dir),
						buildLoxpWindow(seq, second.pos, second.dir, { gapLabel: 'inverted', gapLabelColor: '#f9731680' }),
					];
				} else {
					// insertion / translocation — each input gets 1 loxP window
					const posFwd = seq.indexOf(LOXP_SEQ);
					const posRev = seq.indexOf(LOXP_REV);
					const pos = posFwd >= 0 ? posFwd : posRev;
					const dir: 'forward' | 'reverse' = posFwd >= 0 ? 'forward' : 'reverse';
					if (pos < 0) continue;
					it.windows = [
						buildLoxpWindow(seq, pos, dir),
					];
				}
			}
		}

		if (paradigm === 'crispr' && node.source?.action) {
			const crisprAction = node.source.action;
			const guide = crisprAction.guide;
			const pam = crisprAction.pam;
			if (guide && pam) {
				for (let idx = 0; idx < items.length; idx++) {
					const it = items[idx];
					if (it.isResult || it.isByproduct || !it.hasMiddle) continue;
					if (idx === 0) {
						// Genomic locus: two windows with DSB gap
						const seq = it.node.sequence?.toUpperCase();
						if (!seq) continue;
						const gU = guide.toUpperCase();
						const pos = seq.indexOf(gU);
						if (pos < 0) continue;
						// Cas9 cuts 3bp upstream of PAM (at position guideLen - 3)
						const cutPos = pos + guide.length - 3;
						// Window 1: 10bp before cut site (guide target region)
						const w1Start = Math.max(0, cutPos - 10);
						const w1Seq = seq.slice(w1Start, cutPos);
						const w1Bg: (string | null)[] = Array(w1Seq.length).fill('#6366f1');
						// Window 2: 3bp guide + PAM + 4bp context after
						const w2Seq = seq.slice(cutPos, cutPos + 3 + pam.length + 4);
						const w2Bg: (string | null)[] = [
							...Array(3).fill('#6366f1'),
							...Array(pam.length).fill('#ef4444'),
							...Array(Math.min(4, w2Seq.length - 3 - pam.length)).fill(null),
						];
						it.windows = [
							{
								block: buildWindowBlock(w1Seq, w1Bg),
								label: 'sgRNA target',
								labelColor: '#6366f1',
							},
							{
								block: buildWindowBlock(w2Seq, w2Bg),
								label: 'PAM',
								labelColor: '#ef4444',
								gapType: 'dsb',
								gapLabel: 'DSB',
								gapLabelColor: '#ef4444',
							},
						];
					} else if (idx > 0) {
						// Donor template: colored insert middle
						it.middleColor = '#a855f7';
						it.middleLabel = 'insert';
					}
				}
			}
		}

		// Layout
		const result: PlacedConstruct[] = [];
		let cx = PAD_X;
		for (let i = 0; i < items.length; i++) {
			const it = items[i];
			const lCtxW = it.leftContext ? blockWidth(it.leftContext) + 4 : 0;
			const rCtxW = it.rightContext ? blockWidth(it.rightContext) + 4 : 0;
			const lw = blockWidth(it.leftBlock);
			const rw = blockWidth(it.rightBlock);
			let mw: number;
			if (it.windows?.length) {
				mw = it.windows.reduce((sum, w) => sum + blockWidth(w.block), 0) + (it.windows.length + 1) * MINI_GAP;
			} else {
				mw = it.hasMiddle ? COLLAPSE_W : 0;
			}
			const totalW = lCtxW + lw + mw + rw + rCtxW;
			cx += lCtxW;
			result.push({ ...it, x: cx, totalW: lw + mw + rw, middleW: mw });
			cx += lw + mw + rw + rCtxW + SYMBOL_GAP;
		}
		return result;
	});

	// Natural (unscaled) content width
	let naturalWidth = $derived.by(() => {
		if (!constructs.length) return width;
		const last = constructs[constructs.length - 1];
		return last.x + last.totalW + rCtxWidth(last) + PAD_X + 16;
	});

	/** Right-context pixel width for a construct (context block + 4px gap) */
	function rCtxWidth(c: PlacedConstruct): number {
		return c.rightContext ? blockWidth(c.rightContext) + 4 : 0;
	}

	let symbols = $derived.by(() => {
		const nonBp = constructs.filter(c => !c.isByproduct);
		const syms: { x: number; type: 'plus' | 'arrow' | 'cross' }[] = [];
		for (let i = 0; i < nonBp.length - 1; i++) {
			const prev = nonBp[i];
			const isLast = i === nonBp.length - 2;
			// Center symbol in the SYMBOL_GAP zone (between right context and next left context)
			syms.push({
				x: prev.x + prev.totalW + rCtxWidth(prev) + SYMBOL_GAP / 2,
				type: isLast ? 'arrow' : (paradigm === 'gateway' ? 'cross' : 'plus'),
			});
		}
		// Byproduct "+" after result
		const bp = constructs.find(c => c.isByproduct);
		const res = constructs.find(c => c.isResult);
		if (bp && res) {
			syms.push({ x: res.x + res.totalW + rCtxWidth(res) + SYMBOL_GAP / 2, type: 'plus' });
		}
		return syms;
	});

	// Right-edge position for 3'/5' labels (after any right context)
	let rightLabelX = $derived.by(() => {
		if (!constructs.length) return 0;
		const last = constructs[constructs.length - 1];
		return last.x + last.totalW + rCtxWidth(last) + 4;
	});

	// ── Paradigm-specific annotations ──
	interface Annotation {
		x: number; y: number; text: string; color: string;
		fontSize: number; anchor: string;
	}

	let annotations = $derived.by((): Annotation[] => {
		if (!constructs.length) return [];
		const anns: Annotation[] = [];
		const by = PAD_TOP;

		if (paradigm === 'golden-gate') {
			// Overhang code labels above each overhang to show assembly order
			for (const c of constructs) {
				if (c.isResult || c.isByproduct) continue;
				// Left overhang
				const lOhLen = c.leftBlock.charType.findIndex(t => t === 'ds');
				if (lOhLen > 0 && c.leftBlock.ohColor) {
					let code = '';
					for (let j = 0; j < lOhLen; j++) {
						const ch = c.leftBlock.sense[j];
						code += ch !== ' ' ? ch : c.leftBlock.comp[j];
					}
					if (code) anns.push({
						x: c.x + lOhLen * CHAR_W / 2, y: by - 20,
						text: code, color: c.leftBlock.ohColor, fontSize: 7, anchor: 'middle',
					});
				}
				// Right overhang
				const rBlock = c.rightBlock;
				const rTotal = rBlock.charType.length;
				let rDsEnd = -1;
				for (let j = rTotal - 1; j >= 0; j--) {
					if (rBlock.charType[j] === 'ds') { rDsEnd = j; break; }
				}
				const rOhStart = rDsEnd + 1;
				const rOhLen = rTotal - rOhStart;
				if (rOhLen > 0 && rBlock.ohColor) {
					let code = '';
					for (let j = rOhStart; j < rTotal; j++) {
						const ch = rBlock.sense[j];
						code += ch !== ' ' ? ch : rBlock.comp[j];
					}
					const rx = c.x + blockWidth(c.leftBlock) + c.middleW;
					if (code) anns.push({
						x: rx + rOhStart * CHAR_W + rOhLen * CHAR_W / 2, y: by - 20,
						text: code, color: rBlock.ohColor, fontSize: 7, anchor: 'middle',
					});
				}
			}
		}

		if (paradigm === 'gateway') {
			for (const c of constructs) {
				let attLabel: string | null = null;
				let color = '#a78bfa';

				if (c.conditions) {
					const match = c.conditions.match(/att([A-Za-z]\d?)/i);
					if (match) attLabel = 'att' + match[1].toUpperCase();
				} else if (c.isResult) {
					attLabel = 'attB';
				} else if (c.isByproduct) {
					attLabel = 'attP';
					color = '#475569';
				}

				if (attLabel && c.circular) {
					// Place att labels just inside the circular arcs at the top
					anns.push({
						x: c.x + 2, y: by - 5,
						text: attLabel, color, fontSize: 7, anchor: 'start',
					});
					anns.push({
						x: c.x + c.totalW - 2, y: by - 5,
						text: attLabel, color, fontSize: 7, anchor: 'end',
					});
				}
			}
		}

		if (paradigm === 'crispr') {
			const inputs = constructs.filter(c => !c.isResult && !c.isByproduct);
			// Homology arm labels on donor (second input)
			if (inputs.length >= 2) {
				const donor = inputs[1];
				anns.push({
					x: donor.x + blockWidth(donor.leftBlock) / 2, y: by - 5,
					text: 'left HA', color: '#22c55e', fontSize: 7, anchor: 'middle',
				});
				if (donor.hasMiddle) {
					const rx = donor.x + blockWidth(donor.leftBlock) + donor.middleW;
					anns.push({
						x: rx + blockWidth(donor.rightBlock) / 2, y: by - 5,
						text: 'right HA', color: '#22c55e', fontSize: 7, anchor: 'middle',
					});
				}
			}
		}

		return anns;
	});

	let svgH = $derived(PAD_TOP + ROW_H + 44);
	let scale = $derived(width / naturalWidth);
	let displayH = $derived(svgH * scale);

	function hoverConstruct(c: PlacedConstruct, e: MouseEvent) {
		const items: { label: string; value: string | number; unit?: string; color?: string }[] = [
			{ label: 'Size', value: c.node.size.toLocaleString(), unit: 'bp' },
		];
		if (c.node.topology) items.push({ label: 'Topology', value: c.node.topology });
		if (c.conditions) items.push({ label: 'Conditions', value: c.conditions });
		if (c.leftEnzyme && c.rightEnzyme && c.leftEnzyme !== c.rightEnzyme) {
			items.push({ label: 'Enzymes', value: `${c.leftEnzyme} + ${c.rightEnzyme}` });
		} else if (c.leftEnzyme) {
			items.push({ label: 'Enzyme', value: c.leftEnzyme });
		}
		if (c.isResult && node.source?.action) {
			const a = node.source.action;
			if (a.temperature) items.push({ label: 'Temperature', value: a.temperature });
			if (a.duration) items.push({ label: 'Duration', value: a.duration });
			if (a.notes) items.push({ label: 'Notes', value: a.notes });
		}
		onhoverinfo?.({
			title: c.node.name + (c.isResult ? ' (result)' : c.isByproduct ? ' (byproduct)' : ''),
			items,
			position: { x: e.clientX, y: e.clientY },
		});
	}

	function hoverLeave() { onhoverinfo?.(null); }

	// ── Selection (per-strand: sense or complement) ──
	interface SelRegion { sense: string; comp: string; bx: number; len: number }

	let selRegions = $derived.by(() => {
		const regions: SelRegion[] = [];
		function addBlock(block: SeqBlock, bx: number) {
			regions.push({ sense: block.sense, comp: block.comp, bx, len: block.sense.length });
		}
		for (const c of constructs) {
			const lw = blockWidth(c.leftBlock);
			if (c.leftContext) addBlock(c.leftContext, c.x - blockWidth(c.leftContext) - 4);
			addBlock(c.leftBlock, c.x);
			if (c.windows?.length) {
				const mx = c.x + lw;
				let precW = 0;
				for (let wi = 0; wi < c.windows.length; wi++) {
					const win = c.windows[wi];
					addBlock(win.block, mx + (wi + 1) * MINI_GAP + precW);
					precW += blockWidth(win.block);
				}
			}
			addBlock(c.rightBlock, c.x + lw + c.middleW);
			if (c.rightContext) addBlock(c.rightContext, c.x + c.totalW + 4);
		}
		return regions;
	});

	let selRi = $state(-1);
	let selStrand: 'sense' | 'comp' = $state('sense');
	let selAnchor = $state(-1);
	let selMin = $state(-1);
	let selMax = $state(-1);
	let selDragging = $state(false);
	let selCopied = $state(false);

	/** Sense strand y-range: PAD_TOP … PAD_TOP + CHAR_H */
	const SENSE_Y0 = PAD_TOP;
	const SENSE_Y1 = PAD_TOP + CHAR_H;
	/** Complement strand y-range */
	const COMP_Y0 = PAD_TOP + CHAR_H + STRAND_GAP;
	const COMP_Y1 = PAD_TOP + ROW_H;

	// Cached SVG rect during drag (avoids getBoundingClientRect on every mousemove)
	let dragRect: DOMRect | null = null;

	function svgXY(e: MouseEvent): { x: number; y: number } {
		const r = dragRect!;
		return {
			x: (e.clientX - r.left) * naturalWidth / r.width,
			y: (e.clientY - r.top) * svgH / r.height,
		};
	}

	function selHit(x: number, y: number): { ri: number; ci: number; strand: 'sense' | 'comp' } | null {
		let strand: 'sense' | 'comp';
		if (y >= SENSE_Y0 - 2 && y <= SENSE_Y1 + 2) strand = 'sense';
		else if (y >= COMP_Y0 - 2 && y <= COMP_Y1 + 2) strand = 'comp';
		else return null;
		for (let ri = 0; ri < selRegions.length; ri++) {
			const r = selRegions[ri];
			if (x >= r.bx && x < r.bx + r.len * CHAR_W) {
				return { ri, ci: Math.max(0, Math.min(Math.floor((x - r.bx) / CHAR_W), r.len - 1)), strand };
			}
		}
		return null;
	}

	function selDown(e: MouseEvent) {
		const svg = (e.currentTarget as Element).closest('svg') as SVGSVGElement;
		if (!svg) return;
		dragRect = svg.getBoundingClientRect();
		const { x, y } = svgXY(e);
		const hit = selHit(x, y);
		if (hit) {
			selDragging = true;
			selRi = hit.ri;
			selStrand = hit.strand;
			selAnchor = hit.ci;
			selMin = hit.ci;
			selMax = hit.ci;
			selCopied = false;
			e.preventDefault();
			window.addEventListener('mousemove', selMove);
			window.addEventListener('mouseup', selUp);
		} else {
			selRi = -1; selMin = -1; selMax = -1;
		}
	}

	function selMove(e: MouseEvent) {
		const { x } = svgXY(e);
		const r = selRegions[selRi];
		const ci = Math.max(0, Math.min(Math.floor((x - r.bx) / CHAR_W), r.len - 1));
		selMin = Math.min(selAnchor, ci);
		selMax = Math.max(selAnchor, ci);
	}

	function selClear() {
		selRi = -1; selMin = -1; selMax = -1; selCopied = false;
	}

	function selUp() {
		window.removeEventListener('mousemove', selMove);
		window.removeEventListener('mouseup', selUp);
		selDragging = false;
		dragRect = null;
		if (selRi >= 0 && selMax > selMin) {
			const r = selRegions[selRi];
			const src = selStrand === 'sense' ? r.sense : r.comp;
			const seq = src.slice(selMin, selMax + 1).replace(/ /g, '');
			if (seq) {
				navigator.clipboard.writeText(seq).then(() => {
					selCopied = true;
					setTimeout(() => { selClear(); }, 1500);
				});
			} else {
				selClear();
			}
		} else {
			selClear();
		}
	}
</script>

<!-- ═══ Render a sequence block as two lines of monospace text ═══ -->
{#snippet seqBlock(block: SeqBlock, bx: number, by: number)}
	{#each block.sense.split('') as ch, i}
		{@const cx = bx + i * CHAR_W}
		{@const ct = block.charType[i]}
		{@const bg = block.bgColor?.[i]}
		{@const ohBg = ct !== 'ds' ? block.ohColor : null}
		{#if bg || ohBg}
			<rect x={cx} y={by} width={CHAR_W} height={ROW_H} fill={bg ?? ohBg ?? OVERHANG_COLOR} opacity={0.15} rx={1} />
		{/if}
		{#if ch !== ' '}
			<text x={cx + CHAR_W / 2} y={by + CHAR_H - 2} text-anchor="middle"
				class="base" fill={ct === 'oh-s' ? (block.ohColor ?? OVERHANG_COLOR) : 'var(--hatch-text, #c9d1d9)'}
				opacity={ct === 'oh-c' ? 0.3 : 1}
				font-weight={ct === 'oh-s' ? 800 : 600}
			>{ch}</text>
		{/if}
		{@const cch = block.comp[i]}
		{#if cch !== ' '}
			<text x={cx + CHAR_W / 2} y={by + CHAR_H + STRAND_GAP + CHAR_H - 2} text-anchor="middle"
				class="base" fill={ct === 'oh-c' ? (block.ohColor ?? OVERHANG_COLOR) : 'var(--hatch-text, #c9d1d9)'}
				opacity={ct === 'oh-s' ? 0.3 : 1}
				font-weight={ct === 'oh-c' ? 800 : 600}
			>{cch}</text>
		{/if}
	{/each}
{/snippet}

<div class="cloning-strategy" style:width="{width}px">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg width={width} height={displayH} viewBox="0 0 {naturalWidth} {svgH}" preserveAspectRatio="xMidYMid meet"
		onmousedown={selDown}>

		<!-- Global 5'/3' labels (left edge) -->
		<text x={4} y={PAD_TOP + CHAR_H - 2} class="strand-dir">5'</text>
		<text x={4} y={PAD_TOP + CHAR_H + STRAND_GAP + CHAR_H - 2} class="strand-dir">3'</text>
		<!-- 3'/5' labels (right edge — strands are antiparallel) -->
		{#if constructs.length}
			<text x={rightLabelX} y={PAD_TOP + CHAR_H - 2} class="strand-dir">3'</text>
			<text x={rightLabelX} y={PAD_TOP + CHAR_H + STRAND_GAP + CHAR_H - 2} class="strand-dir">5'</text>
		{/if}

		{#each constructs as c}
			{@const by = PAD_TOP}
			{@const lw = blockWidth(c.leftBlock)}
			{@const rw = blockWidth(c.rightBlock)}

			<g class="construct" role="img" aria-label={c.node.name} style:opacity={c.opacity}
				onmouseenter={(e: MouseEvent) => hoverConstruct(c, e)}
				onmousemove={(e: MouseEvent) => hoverConstruct(c, e)}
				onmouseleave={hoverLeave}>
				<!-- Hit rect for reliable hover -->
				<rect x={c.x} y={by - PAD_TOP + 4} width={c.totalW} height={svgH - 8}
					fill="transparent" />

				<!-- Left flanking context (greyed-out sequence from the source construct) -->
				{#if c.leftContext}
					{@const ctxW = blockWidth(c.leftContext)}
					{@const ctxX = c.x - ctxW - 4}
					<g opacity={0.2}>
						{@render seqBlock(c.leftContext, ctxX, by)}
					</g>
					{#if c.leftContextLabel}
						<text x={ctxX + ctxW / 2} y={by + ROW_H + 12} text-anchor="middle"
							class="context-label">{c.leftContextLabel}</text>
					{/if}
				{/if}

				<!-- Left sequence block -->
				{@render seqBlock(c.leftBlock, c.x, by)}

				<!-- Middle section -->
				{#if c.middleW > 0}
					{@const mx = c.x + lw}
					{#if c.windows?.length}
						<!-- Windowed middle: sequence at internal features -->
						{#each c.windows as win, wi}
							{@const precW = c.windows.slice(0, wi).reduce((s, w) => s + blockWidth(w.block), 0)}
							{@const gapX = mx + wi * MINI_GAP + precW}
							{@const winX = gapX + MINI_GAP}
							{@const winW = blockWidth(win.block)}
							{@const senseY = by + CHAR_H / 2}
							{@const compY = by + CHAR_H + STRAND_GAP + CHAR_H / 2}
							<!-- Gap before window -->
							{#if win.gapType === 'dsb'}
								<!-- DSB break marks: short red lines at strand ends -->
								<line x1={gapX + 2} y1={senseY - 3} x2={gapX + 2} y2={senseY + 3} stroke="#ef4444" stroke-width={2} />
								<line x1={gapX + 2} y1={compY - 3} x2={gapX + 2} y2={compY + 3} stroke="#ef4444" stroke-width={2} />
								<line x1={gapX + MINI_GAP - 2} y1={senseY - 3} x2={gapX + MINI_GAP - 2} y2={senseY + 3} stroke="#ef4444" stroke-width={2} />
								<line x1={gapX + MINI_GAP - 2} y1={compY - 3} x2={gapX + MINI_GAP - 2} y2={compY + 3} stroke="#ef4444" stroke-width={2} />
								<!-- Scissors icon: two crossing diagonal lines -->
								{@const scX = gapX + MINI_GAP / 2}
								{@const scY = by + ROW_H / 2}
								<line x1={scX - 3} y1={scY - 3} x2={scX + 3} y2={scY + 3} stroke="#ef4444" stroke-width={1.5} opacity={0.7} />
								<line x1={scX + 3} y1={scY - 3} x2={scX - 3} y2={scY + 3} stroke="#ef4444" stroke-width={1.5} opacity={0.7} />
							{:else}
								<!-- Dashed gap -->
								<line x1={gapX + 2} y1={senseY}
									x2={gapX + MINI_GAP - 2} y2={senseY}
									stroke={c.color} stroke-width={1.5} stroke-dasharray="3,3" opacity={0.35} />
								<line x1={gapX + 2} y1={compY}
									x2={gapX + MINI_GAP - 2} y2={compY}
									stroke={c.color} stroke-width={1.5} stroke-dasharray="3,3" opacity={0.35} />
							{/if}
							<!-- Gap label (e.g., "floxed", "DSB") -->
							{#if win.gapLabel}
								<text x={gapX + MINI_GAP / 2} y={by - 4} text-anchor="middle"
									class="window-gap-label" fill={win.gapLabelColor ?? c.color}>{win.gapLabel}</text>
							{/if}
							<!-- Sequence window -->
							{@render seqBlock(win.block, winX, by)}
							<!-- Window label above -->
							{#if win.direction}
								<!-- Direction-aware triangle for loxP — bottom aligns with text baseline -->
								{@const triW = 7}
								{@const triH = 9}
								{@const labelY = by - 7}
								{@const triX = winX + winW / 2 - 20}
								{@const triY = labelY - triH}
								{#if win.direction === 'forward'}
									<polygon points="{triX},{triY} {triX + triW},{triY + triH / 2} {triX},{triY + triH}"
										fill={win.labelColor} opacity={0.9} />
								{:else}
									<polygon points="{triX + triW},{triY} {triX},{triY + triH / 2} {triX + triW},{triY + triH}"
										fill={win.labelColor} opacity={0.9} />
								{/if}
								<text x={winX + winW / 2 + 2} y={labelY} text-anchor="middle"
									class="window-label" fill={win.labelColor}>{win.label}</text>
							{:else}
								<text x={winX + winW / 2} y={by - 4} text-anchor="middle"
									class="window-label" fill={win.labelColor}>{win.label}</text>
							{/if}
						{/each}
						<!-- Final dashed gap after last window -->
						{@const lastGapX = mx + c.middleW - MINI_GAP}
						<line x1={lastGapX + 2} y1={by + CHAR_H / 2}
							x2={lastGapX + MINI_GAP - 2} y2={by + CHAR_H / 2}
							stroke={c.color} stroke-width={1.5} stroke-dasharray="3,3" opacity={0.35} />
						<line x1={lastGapX + 2} y1={by + CHAR_H + STRAND_GAP + CHAR_H / 2}
							x2={lastGapX + MINI_GAP - 2} y2={by + CHAR_H + STRAND_GAP + CHAR_H / 2}
							stroke={c.color} stroke-width={1.5} stroke-dasharray="3,3" opacity={0.35} />
						<!-- sgRNA bar for CRISPR locus -->
						{#if paradigm === 'crispr' && !c.isResult && !c.isByproduct && c.windows && c.windows.length >= 2}
							{@const w0precW = 0}
							{@const w0gapX = mx}
							{@const w0X = w0gapX + MINI_GAP}
							{@const w0W = blockWidth(c.windows[0].block)}
							{@const w1precW = w0W}
							{@const w1gapX = mx + 1 * MINI_GAP + w1precW}
							{@const w1X = w1gapX + MINI_GAP}
							{@const guideEndX = w1X + 3 * CHAR_W}
							{@const barY = by - 16}
							<line x1={w0X} y1={barY} x2={guideEndX} y2={barY}
								stroke="#6366f1" stroke-width={2} opacity={0.6} />
							<!-- Arrowhead on 5' end -->
							<polygon points="{w0X},{barY} {w0X + 5},{barY - 3} {w0X + 5},{barY + 3}"
								fill="#6366f1" opacity={0.6} />
							<text x={(w0X + guideEndX) / 2} y={barY - 4} text-anchor="middle"
								class="window-label" fill="#6366f1">sgRNA</text>
						{/if}
					{:else}
						<!-- Default collapsed middle -->
						{#if c.middleColor}
							<rect x={mx + 2} y={by + 1} width={c.middleW - 4} height={ROW_H - 2}
								fill={c.middleColor} opacity={0.15} rx={3} />
						{/if}
						<line x1={mx + 4} y1={by + CHAR_H / 2}
							x2={mx + c.middleW - 4} y2={by + CHAR_H / 2}
							stroke={c.middleColor ?? c.color} stroke-width={1.5} stroke-dasharray="3,3" opacity={0.35} />
						<line x1={mx + 4} y1={by + CHAR_H + STRAND_GAP + CHAR_H / 2}
							x2={mx + c.middleW - 4} y2={by + CHAR_H + STRAND_GAP + CHAR_H / 2}
							stroke={c.middleColor ?? c.color} stroke-width={1.5} stroke-dasharray="3,3" opacity={0.35} />
						<text x={mx + c.middleW / 2} y={by + ROW_H / 2 + 3} text-anchor="middle"
							class="collapse-label" fill={c.middleColor ?? c.color}>
							{c.middleLabel ?? `${c.node.size.toLocaleString()}bp`}
						</text>
					{/if}
				{/if}

				<!-- Right sequence block -->
				{@render seqBlock(c.rightBlock, c.x + lw + c.middleW, by)}

				<!-- Right flanking context (greyed-out sequence from the source construct) -->
				{#if c.rightContext}
					{@const ctxW = blockWidth(c.rightContext)}
					{@const ctxX = c.x + c.totalW + 4}
					<g opacity={0.2}>
						{@render seqBlock(c.rightContext, ctxX, by)}
					</g>
					{#if c.rightContextLabel}
						<text x={ctxX + ctxW / 2} y={by + ROW_H + 12} text-anchor="middle"
							class="context-label">{c.rightContextLabel}</text>
					{/if}
				{/if}

				<!-- Circular arcs -->
				{#if c.circular}
					{@const ay = by + ROW_H / 2}
					<path d="M{c.x},{by - 1} Q{c.x - 8},{ay} {c.x},{by + ROW_H + 1}"
						fill="none" stroke={c.color} stroke-width={1.5} opacity={0.45} />
					{@const rx = c.x + c.totalW}
					<path d="M{rx},{by - 1} Q{rx + 8},{ay} {rx},{by + ROW_H + 1}"
						fill="none" stroke={c.color} stroke-width={1.5} opacity={0.45} />
				{/if}

				<!-- Enzyme labels (above, centered on the cut position) -->
				{#if c.leftEnzyme}
					<line x1={c.x} y1={by - 3} x2={c.x} y2={by + 3} class="enzyme-tick" />
					<text x={c.x} y={by - 7} text-anchor="middle" class="enzyme-label">{c.leftEnzyme}</text>
				{/if}
				{#if c.rightEnzyme}
					{@const rex = c.x + c.totalW}
					<line x1={rex} y1={by - 3} x2={rex} y2={by + 3} class="enzyme-tick" />
					<text x={rex} y={by - 7} text-anchor="middle" class="enzyme-label">{c.rightEnzyme}</text>
				{/if}

				<!-- Name + size below -->
				<text x={c.x + c.totalW / 2} y={by + ROW_H + 14} text-anchor="middle"
					class="construct-name" class:byproduct-label={c.isByproduct}>
					{c.node.name}{#if c.isByproduct} (killed){/if}
				</text>
				<text x={c.x + c.totalW / 2} y={by + ROW_H + 26} text-anchor="middle"
					class="construct-size">{c.node.size.toLocaleString()} bp</text>
				{#if c.conditions}
					<text x={c.x + c.totalW / 2} y={by + ROW_H + 37} text-anchor="middle"
						class="conditions-label">{c.conditions}</text>
				{/if}
			</g>
		{/each}

		<!-- Symbols between constructs -->
		{#each symbols as sym}
			{@const glyph = sym.type === 'arrow' ? '→' : sym.type === 'cross' ? '×' : '+'}
			<text x={sym.x} y={PAD_TOP + ROW_H / 2 + 4} text-anchor="middle" dominant-baseline="central"
				class="symbol" class:symbol-arrow={sym.type === 'arrow'}
			>{glyph}</text>
			{#if sym.type === 'arrow' && opLabel}
				<text x={sym.x} y={PAD_TOP + ROW_H + 14} text-anchor="middle" class="op-label">{opLabel}</text>
			{/if}
		{/each}

		<!-- Paradigm-specific annotations -->
		{#each annotations as ann}
			<text x={ann.x} y={ann.y} text-anchor={ann.anchor}
				class="annotation" fill={ann.color} font-size={ann.fontSize}>{ann.text}</text>
		{/each}

		<!-- Per-strand selection highlight with whiskers -->
		{#if selRi >= 0 && selMin >= 0 && selMax >= selMin}
			{@const r = selRegions[selRi]}
			{@const hx = r.bx + selMin * CHAR_W}
			{@const hw = (selMax - selMin + 1) * CHAR_W}
			{@const hy = selStrand === 'sense' ? SENSE_Y0 : COMP_Y0}
			{@const hh = CHAR_H}
			{@const wk = 4}
			{@const hc = 'var(--hatch-selection-handle, rgba(0, 130, 250, 0.8))'}
			<rect x={hx} y={hy} width={hw} height={hh}
				fill="var(--hatch-selection-fill, rgba(0, 130, 250, 0.3))" rx={2} pointer-events="none" />
			<line x1={hx} y1={hy} x2={hx} y2={hy + hh}
				stroke={hc} stroke-width={1.5} pointer-events="none" />
			<line x1={hx + hw} y1={hy} x2={hx + hw} y2={hy + hh}
				stroke={hc} stroke-width={1.5} pointer-events="none" />
		{/if}
		{#if selCopied && selRi >= 0}
			{@const r = selRegions[selRi]}
			{@const cx = r.bx + (selMin + selMax + 1) * CHAR_W / 2}
			{@const ty = selStrand === 'sense' ? SENSE_Y0 - 4 : COMP_Y1 + 10}
			<text x={cx} y={ty} text-anchor="middle"
				class="copied-label">Copied</text>
		{/if}

	</svg>
</div>

<style>
	.cloning-strategy {
		display: block;
		background: var(--hatch-bg, #0c1018);
	}

	.construct { cursor: default; }

	.base {
		font-size: 11px;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}
	.copied-label {
		font-size: 8px; font-weight: 600;
		fill: var(--hatch-accent, #58a6ff);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

	.strand-dir {
		font-size: 9px;
		font-weight: 600;
		fill: var(--hatch-text-dim, #566070);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.collapse-label {
		font-size: 8px;
		font-weight: 600;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
	.window-label {
		font-size: 7px; font-weight: 700;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}
	.window-gap-label {
		font-size: 7px; font-weight: 600;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

	.context-label {
		font-size: 6px; font-weight: 600;
		fill: var(--hatch-text-dim, #566070);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

	.enzyme-tick { stroke: var(--hatch-text-muted, #8a95a5); stroke-width: 1.5; }
	.enzyme-label {
		font-size: 9px; font-weight: 600;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.construct-name {
		font-size: 10px; font-weight: 600;
		fill: var(--hatch-text, #c9d1d9);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
	.byproduct-label {
		fill: var(--hatch-text-dim, #566070);
		text-decoration: line-through;
	}
	.construct-size {
		font-size: 9px;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
	.conditions-label {
		font-size: 8px;
		fill: var(--hatch-text-dim, #566070);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}

	.annotation {
		font-weight: 700;
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}

	.symbol {
		font-size: 20px; font-weight: 300;
		fill: var(--hatch-text-muted, #8a95a5);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
		user-select: none;
	}
	.symbol-arrow { fill: var(--hatch-accent, #58a6ff); }
	.op-label {
		font-size: 10px; font-weight: 600;
		fill: var(--hatch-text, #c9d1d9);
		font-family: var(--hatch-font-mono, 'SF Mono', 'Fira Code', monospace);
	}
</style>
