import type { GelData, GelLane } from '../../src/lib/types/index.js';

const ladder: GelLane = {
	label: '1 kb Ladder', isLadder: true, bands: [
		{ position: 0.08, intensity: 0.5, size: 10000 },
		{ position: 0.14, intensity: 0.3, size: 8000 },
		{ position: 0.18, intensity: 0.5, size: 6000 },
		{ position: 0.23, intensity: 0.3, size: 5000 },
		{ position: 0.28, intensity: 0.5, size: 4000 },
		{ position: 0.34, intensity: 0.8, size: 3000 },
		{ position: 0.42, intensity: 0.4, size: 2000 },
		{ position: 0.48, intensity: 0.3, size: 1500 },
		{ position: 0.55, intensity: 0.8, size: 1000 },
		{ position: 0.66, intensity: 0.3, size: 750 },
		{ position: 0.73, intensity: 0.8, size: 500 },
		{ position: 0.85, intensity: 0.3, size: 250 },
	],
};

const sampleLanes: GelLane[] = [
	{ label: 'Uncut', bands: [{ position: 0.35, intensity: 1.0, size: 4361, name: 'supercoiled' }] },
	{ label: 'EcoRI', bands: [{ position: 0.28, intensity: 0.9, size: 4361, name: 'linear' }] },
	{ label: 'EcoRI+HindIII', bands: [
		{ position: 0.28, intensity: 0.6, size: 4331 },
		{ position: 0.95, intensity: 0.3, size: 30 },
	] },
	{ label: 'BamHI+SalI', bands: [
		{ position: 0.33, intensity: 0.5, size: 3085 },
		{ position: 0.46, intensity: 0.5, size: 1276 },
	] },
];

export const gelData: GelData = {
	lanes: [ladder, ...sampleLanes],
	gelType: 'agarose',
	stain: 'ethidium',
};
