/** Types for 3D protein structure visualization */

export interface ProteinSelection {
	chain?: string;
	resi?: string;
	resn?: string;
	atom?: string;
	style?: string;
	color?: string;
}

export interface ProteinLabel {
	resi: number;
	chain?: string;
	text: string;
	color?: string;
	backgroundColor?: string;
}

export interface ProteinStructureData {
	pdbData: string;
	format?: 'pdb' | 'mmcif' | 'sdf';
	style?: 'cartoon' | 'stick' | 'sphere' | 'line' | 'cross' | 'surface';
	colorScheme?: 'chain' | 'secondary' | 'residue' | 'element' | 'spectrum';
	backgroundColor?: string;
	name?: string;
	selection?: ProteinSelection;
	labels?: ProteinLabel[];
}
