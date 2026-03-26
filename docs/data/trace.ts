import type { TraceData, TraceChannel, TraceAlignment } from '../../src/lib/types/index.js';

const baseCalls = 'ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG';
const numBases = baseCalls.length;
const ppb = 10;
const tp = numBases * ppb;

function gauss(x: number, c: number, a: number, s: number): number {
	return a * Math.exp(-((x - c) ** 2) / (2 * s * s));
}

// Deterministic quality scores
const qualityScores: number[] = [];
for (let i = 0; i < numBases; i++) {
	let q = 32 + ((i * 7 + 3) % 14);
	if (i === 8 || i === 22 || i === 37 || i === 51) q = 12;
	if (i < 4) q = Math.max(15, q - (4 - i) * 5);
	if (i > numBases - 5) q = Math.max(12, q - (i - numBases + 5) * 4);
	qualityScores.push(q);
}

const peakPositions = Array.from({ length: numBases }, (_, i) => 5 + i * ppb);

const chA = new Array(tp).fill(0);
const chC = new Array(tp).fill(0);
const chG = new Array(tp).fill(0);
const chT = new Array(tp).fill(0);
const chM: Record<string, number[]> = { A: chA, C: chC, G: chG, T: chT };

for (let i = 0; i < numBases; i++) {
	const b = baseCalls[i];
	const ctr = peakPositions[i];
	const amp = 800 * (0.6 + (qualityScores[i] / 60) * 0.4) * 0.95;
	for (let x = Math.max(0, ctr - 12); x < Math.min(tp, ctr + 12); x++) {
		chM[b][x] += gauss(x, ctr, amp, 2.2);
		for (const o of ['A', 'C', 'G', 'T']) {
			if (o !== b) chM[o][x] += gauss(x, ctr, amp * 0.05, 2.86);
		}
	}
}
for (let x = 0; x < tp; x++) {
	for (const c of [chA, chC, chG, chT]) c[x] = Math.max(0, Math.round(c[x] + (x % 5)));
}

const traceChannels: TraceChannel = { A: chA, C: chC, G: chG, T: chT };

const rChars = baseCalls.split('');
rChars[12] = rChars[12] === 'A' ? 'G' : 'A';
rChars[30] = rChars[30] === 'T' ? 'C' : 'T';

const traceAlignment: TraceAlignment = {
	refSeq: rChars.join(''),
	querySeq: baseCalls,
	mismatches: [
		{ pos: 12, type: 'substitution', refBase: rChars[12], queryBase: baseCalls[12] },
		{ pos: 30, type: 'substitution', refBase: rChars[30], queryBase: baseCalls[30] },
	],
	identity: (numBases - 2) / numBases,
};

export const traceData: TraceData = {
	label: 'Forward',
	baseCalls,
	qualityScores,
	channels: traceChannels,
	peakPositions,
	alignment: traceAlignment,
};

// Multi-trace data
function generateTrace(seed: number, label: string, baseStr: string): TraceData {
	const nb = baseStr.length;
	const totalPts = nb * ppb;
	const qs: number[] = [];
	for (let i = 0; i < nb; i++) {
		let q = 28 + ((seed * (i + 1) * 7) % 18);
		if (i < 3) q = Math.max(12, q - (3 - i) * 5);
		if (i > nb - 4) q = Math.max(14, q - (i - nb + 4) * 4);
		qs.push(q);
	}
	const pk = Array.from({ length: nb }, (_, i) => 5 + i * ppb);
	const cA2 = new Array(totalPts).fill(0);
	const cC2 = new Array(totalPts).fill(0);
	const cG2 = new Array(totalPts).fill(0);
	const cT2 = new Array(totalPts).fill(0);
	const cm: Record<string, number[]> = { A: cA2, C: cC2, G: cG2, T: cT2 };
	for (let i = 0; i < nb; i++) {
		const b = baseStr[i];
		const ctr = pk[i];
		const amp = 780 * (0.55 + (qs[i] / 60) * 0.45) * 0.9;
		for (let x = Math.max(0, ctr - 12); x < Math.min(totalPts, ctr + 12); x++) {
			cm[b][x] += gauss(x, ctr, amp, 2.2);
			for (const o of ['A', 'C', 'G', 'T']) {
				if (o !== b) cm[o][x] += gauss(x, ctr, amp * 0.05, 2.9);
			}
		}
	}
	for (let x = 0; x < totalPts; x++) {
		for (const c of [cA2, cC2, cG2, cT2]) c[x] = Math.max(0, Math.round(c[x] + (x % 7)));
	}
	return { label, baseCalls: baseStr, qualityScores: qs, channels: { A: cA2, C: cC2, G: cG2, T: cT2 }, peakPositions: pk };
}

const refSeqStr = baseCalls;

const fwdTrace: TraceData = { ...generateTrace(1, 'Forward', baseCalls), alignment: traceAlignment };

const revQueryBases = baseCalls.split('').map((b, i) =>
	i === 8 || i === 45 ? ({ A: 'C', T: 'G', G: 'T', C: 'A' }[b] ?? b) : b,
).join('');
const revTrace: TraceData = {
	...generateTrace(2, 'Reverse', revQueryBases),
	alignment: {
		refSeq: refSeqStr, querySeq: revQueryBases, mismatches: [
			{ pos: 8, type: 'substitution', refBase: refSeqStr[8], queryBase: revQueryBases[8] },
			{ pos: 45, type: 'substitution', refBase: refSeqStr[45], queryBase: revQueryBases[45] },
		], identity: (numBases - 2) / numBases,
	},
};

const reseqBases = baseCalls.split('').map((b, i) =>
	i === 15 || i === 40 ? ({ A: 'G', T: 'C', G: 'A', C: 'T' }[b] ?? b) : b,
).join('');
const reseqTrace: TraceData = {
	...generateTrace(3, 'Resequencing', reseqBases),
	alignment: {
		refSeq: refSeqStr, querySeq: reseqBases, mismatches: [
			{ pos: 15, type: 'substitution', refBase: refSeqStr[15], queryBase: reseqBases[15] },
			{ pos: 40, type: 'substitution', refBase: refSeqStr[40], queryBase: reseqBases[40] },
		], identity: (numBases - 2) / numBases,
	},
};

export const multiTraceData: TraceData[] = [fwdTrace, revTrace, reseqTrace];
