import type { ProteinStructureData, ProteinSequenceData } from '../../src/lib/types/index.js';

export const proteinStructureData: ProteinStructureData = {
	pdbData: `HEADER    DEMO STRUCTURE
ATOM      1  N   ALA A   1       1.458   0.000   0.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       2.009   1.420   0.000  1.00  0.00           C
ATOM      3  C   ALA A   1       1.528   2.139   1.233  1.00  0.00           C
ATOM      4  O   ALA A   1       0.354   2.553   1.265  1.00  0.00           O
ATOM      5  N   GLY A   2       2.382   2.337   2.245  1.00  0.00           N
ATOM      6  CA  GLY A   2       1.996   3.019   3.481  1.00  0.00           C
ATOM      7  C   GLY A   2       2.590   4.412   3.558  1.00  0.00           C
ATOM      8  O   GLY A   2       3.772   4.587   3.317  1.00  0.00           O
ATOM      9  N   VAL A   3       1.776   5.397   3.898  1.00  0.00           N
ATOM     10  CA  VAL A   3       2.243   6.787   4.004  1.00  0.00           C
ATOM     11  C   VAL A   3       1.330   7.601   4.923  1.00  0.00           C
ATOM     12  O   VAL A   3       0.137   7.337   4.969  1.00  0.00           O
ATOM     13  N   LEU A   4       1.920   8.543   5.670  1.00  0.00           N
ATOM     14  CA  LEU A   4       1.140   9.416   6.553  1.00  0.00           C
ATOM     15  C   LEU A   4       1.899  10.730   6.714  1.00  0.00           C
ATOM     16  O   LEU A   4       3.118  10.732   6.604  1.00  0.00           O
ATOM     17  N   SER A   5       1.177  11.808   6.962  1.00  0.00           N
ATOM     18  CA  SER A   5       1.805  13.120   7.134  1.00  0.00           C
ATOM     19  C   SER A   5       0.931  14.011   8.028  1.00  0.00           C
ATOM     20  O   SER A   5      -0.258  13.748   8.170  1.00  0.00           O
END`,
	format: 'pdb',
	name: 'Demo peptide',
};

export const proteinSequenceData: ProteinSequenceData = {
	seq: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH',
	annotations: [
		{ name: 'Helix A', type: 'helix', start: 3, end: 18, color: '#e377c2' },
		{ name: 'Helix B', type: 'helix', start: 20, end: 35, color: '#ff7f0e' },
		{ name: 'Active site', type: 'site', start: 37, end: 38, color: '#d62728' },
		{ name: 'Helix C', type: 'helix', start: 40, end: 49, color: '#2ca02c' },
	],
};
