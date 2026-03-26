import type { AlignmentData, AlignmentSequence, ConservationScore } from '../../src/lib/types/index.js';

const sequences: AlignmentSequence[] = [
	{ id: '1', name: 'Human_HBA', sequence: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH-----GSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR' },
	{ id: '2', name: 'Mouse_HBA', sequence: 'MVLSGEDKSNIKAAWGKIGGHGAEYGAEALERMFASFPTTKTYFPHFDVSH-----GSAQVKGHGKKVADALTNAVAHIDDMPQALSALSDLHAHKLRVDPVNFKLLSHCLLVTLANHLPAEFTPAVHASLDKFLASVSTVLTSKYR' },
	{ id: '3', name: 'Chicken_HBA', sequence: 'MVLSAADKNNVKGIFTKIAGHAEEYGAETLERMFTTYPPTKTYFPHFDLSH-----GSAQIKGHGKKVVAALIEAANHIDDIAGTLSKLSDLHAHKLRVDPVNFKLLGQCFLVVVAIHHPSALTPEVHASLDKFLCAVGTVLTAKYR' },
	{ id: '4', name: 'Zebrafish_HBA', sequence: 'MSLSDKDKAAVRALWSKIGKSADAIGNDALSRMLIVYPQTKTYFSHWPDLS-----PGSAPVKKHGGVIMGALAVKAHIDDIAGALSKLSDLHAQKLRVDPVNFKLLAHCILVVLARHYPGDFTPAHHASLEKFLSHVISALVSKYR' },
	{ id: '5', name: 'Frog_HBA', sequence: 'MLTADDKKLIQQAWEKAASHADEIGHDALSRMIVVYPQTKTYFSHWQDLS-----PGSAPVKKHGITIMAAVGSQAHDDIKNFLSKLSDKHAQKLRVDPANFKILAHCILVVAAAHYPSDFTPAVHASLDKFLANVHTVLTSKYR--' },
];

const conservation: ConservationScore[] = (() => {
	const r: ConservationScore[] = [];
	const l = sequences[0].sequence.length;
	for (let i = 0; i < l; i++) {
		const c: Record<string, number> = {};
		for (const s of sequences) {
			const ch = s.sequence[i]?.toUpperCase() ?? '-';
			c[ch] = (c[ch] ?? 0) + 1;
		}
		let mx = '-', mc = 0;
		for (const [ch, n] of Object.entries(c)) {
			if (ch !== '-' && n > mc) { mx = ch; mc = n; }
		}
		r.push({ position: i, score: mc / sequences.length, consensus: mx });
	}
	return r;
})();

export const alignmentData: AlignmentData = {
	sequences,
	alphabet: 'protein',
	conservation,
	name: 'Hemoglobin alpha subunit',
};
