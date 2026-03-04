/** Dark and light theme definitions for hatchlings components */

export type HatchTheme = Record<string, string>;

/** Dark theme — deep blue-grey base, soothing biology-inspired tones */
export const darkTheme: HatchTheme = {
	// Core
	'--hatch-bg': '#0c1018',
	'--hatch-plot-bg': '#141c26',
	'--hatch-text': '#d4dce6',
	'--hatch-text-muted': '#8a95a5',
	'--hatch-text-dim': '#566070',
	'--hatch-border': '#2a3848',
	'--hatch-grid-color': '#1e2a38',
	'--hatch-highlight': '#6ab8e0',

	// Axes
	'--hatch-axis-color': '#3a4858',
	'--hatch-axis-text': '#7a8898',
	'--hatch-axis-label': '#95a3b3',

	// Plasmid ring
	'--hatch-ring-color': '#4a5a6a',
	'--hatch-tick-major': '#5a6a7a',
	'--hatch-tick-minor': '#3a4858',
	'--hatch-cut-site': '#d45858',

	// Semantic
	'--hatch-positive': '#58b56a',
	'--hatch-negative': '#d45858',
	'--hatch-warning': '#d9953a',

	// Controls (buttons, zoom)
	'--hatch-controls-bg': '#1e2a38',
	'--hatch-controls-border': '#3a4858',
	'--hatch-controls-color': '#d4dce6',
	'--hatch-controls-hover': '#2a3848',

	// Legends & titles
	'--hatch-legend-color': '#95a3b3',
	'--hatch-title-color': '#d4dce6',

	// Sequence viewer
	'--hatch-seq-bg': '#0c1018',
	'--hatch-seq-border': '#2a3848',
	'--hatch-ruler-color': '#4a5a6a',
	'--hatch-ruler-text': '#7a8898',
	'--hatch-line-number': '#566070',
	'--hatch-cutsite-color': '#d45858',
	'--hatch-cutsite-text': '#d45858',

	// Selection
	'--hatch-selection-fill': 'rgba(59, 130, 246, 0.15)',
	'--hatch-selection-stroke': 'rgba(59, 130, 246, 0.6)',
	'--hatch-selection-handle': 'rgba(59, 130, 246, 0.8)',
	'--hatch-selection-outline': '#ffffff',
	'--hatch-caret-color': '#ffffff',

	// Plate heatmap
	'--hatch-plate-bg': '#0c1018',
	'--hatch-plate-border': '#2a3848',
	'--hatch-well-border': '#2a3848',
	'--hatch-well-text': '#ffffff',
	'--hatch-empty-well': '#1e2a38',

	// Primers & annotations
	'--hatch-primer-color': '#22d3ee',
	'--hatch-primer-text': '#22d3ee',
	'--hatch-annotation-text': '#ffffff',
	'--hatch-annotation-stroke': '#ffffff',
	'--hatch-annotation-stroke-hover': '#ffffff',

	// Chain steps
	'--hatch-step-completed': '#58b56a',
	'--hatch-step-failed': '#d45858',
	'--hatch-step-running': '#6ab8e0',
	'--hatch-step-skipped': '#566070',
	'--hatch-step-pending': '#3a4858',

	// Status dashboard
	'--hatch-status-ok': '#58b56a',
	'--hatch-status-warning': '#d9953a',
	'--hatch-status-error': '#d45858',
	'--hatch-status-info': '#6ab8e0',

	// Conservation
	'--hatch-conservation-bar': 'rgba(106, 184, 224, 0.6)',

	// Tooltip
	'--hatch-tooltip-bg': '#141c26',
	'--hatch-tooltip-border': '#2a3848',
	'--hatch-tooltip-text': '#d4dce6',
	'--hatch-tooltip-label': '#8a95a5',
};

/** Light theme — warm off-white base, muted biology-inspired tones */
export const lightTheme: HatchTheme = {
	// Core
	'--hatch-bg': '#f5f3f0',
	'--hatch-plot-bg': '#fafaf8',
	'--hatch-text': '#2a2e34',
	'--hatch-text-muted': '#6a7080',
	'--hatch-text-dim': '#9aa0ac',
	'--hatch-border': '#d8d6d2',
	'--hatch-grid-color': '#e8e6e2',
	'--hatch-highlight': '#3a8ab0',

	// Axes
	'--hatch-axis-color': '#c8ccd4',
	'--hatch-axis-text': '#6a7080',
	'--hatch-axis-label': '#5a6070',

	// Plasmid ring
	'--hatch-ring-color': '#8a9098',
	'--hatch-tick-major': '#7a8088',
	'--hatch-tick-minor': '#b8bcc4',
	'--hatch-cut-site': '#c04040',

	// Semantic
	'--hatch-positive': '#3a8a4a',
	'--hatch-negative': '#c04040',
	'--hatch-warning': '#b87a28',

	// Controls (buttons, zoom)
	'--hatch-controls-bg': '#e8e6e2',
	'--hatch-controls-border': '#c8ccd4',
	'--hatch-controls-color': '#2a2e34',
	'--hatch-controls-hover': '#d8d6d2',

	// Legends & titles
	'--hatch-legend-color': '#5a6070',
	'--hatch-title-color': '#2a2e34',

	// Sequence viewer
	'--hatch-seq-bg': '#f5f3f0',
	'--hatch-seq-border': '#d8d6d2',
	'--hatch-ruler-color': '#8a9098',
	'--hatch-ruler-text': '#6a7080',
	'--hatch-line-number': '#9aa0ac',
	'--hatch-cutsite-color': '#c04040',
	'--hatch-cutsite-text': '#c04040',

	// Selection
	'--hatch-selection-fill': 'rgba(59, 130, 246, 0.12)',
	'--hatch-selection-stroke': 'rgba(59, 130, 246, 0.5)',
	'--hatch-selection-handle': 'rgba(59, 130, 246, 0.8)',
	'--hatch-selection-outline': '#000000',
	'--hatch-caret-color': '#000000',

	// Plate heatmap
	'--hatch-plate-bg': '#f5f3f0',
	'--hatch-plate-border': '#d8d6d2',
	'--hatch-well-border': '#d8d6d2',
	'--hatch-well-text': '#2a2e34',
	'--hatch-empty-well': '#e8e6e2',

	// Primers & annotations
	'--hatch-primer-color': '#1a8fa8',
	'--hatch-primer-text': '#1a8fa8',
	'--hatch-annotation-text': '#ffffff',
	'--hatch-annotation-stroke': '#000000',
	'--hatch-annotation-stroke-hover': '#000000',

	// Chain steps
	'--hatch-step-completed': '#3a8a4a',
	'--hatch-step-failed': '#c04040',
	'--hatch-step-running': '#3a8ab0',
	'--hatch-step-skipped': '#9aa0ac',
	'--hatch-step-pending': '#c8ccd4',

	// Status dashboard
	'--hatch-status-ok': '#3a8a4a',
	'--hatch-status-warning': '#b87a28',
	'--hatch-status-error': '#c04040',
	'--hatch-status-info': '#3a8ab0',

	// Conservation
	'--hatch-conservation-bar': 'rgba(58, 138, 176, 0.6)',

	// Tooltip
	'--hatch-tooltip-bg': '#fafaf8',
	'--hatch-tooltip-border': '#d8d6d2',
	'--hatch-tooltip-text': '#2a2e34',
	'--hatch-tooltip-label': '#6a7080',
};

/** OVE-style light theme — matches Open Vector Editor's visual appearance */
export const oveTheme: HatchTheme = {
	// Core
	'--hatch-bg': '#ffffff',
	'--hatch-plot-bg': '#fafafa',
	'--hatch-text': '#333333',
	'--hatch-text-muted': '#666666',
	'--hatch-text-dim': '#999999',
	'--hatch-border': '#cccccc',
	'--hatch-grid-color': '#eeeeee',
	'--hatch-highlight': '#0082fa',

	// Axes
	'--hatch-axis-color': '#cccccc',
	'--hatch-axis-text': '#666666',
	'--hatch-axis-label': '#555555',

	// Plasmid ring
	'--hatch-ring-color': '#888888',
	'--hatch-tick-major': '#666666',
	'--hatch-tick-minor': '#aaaaaa',
	'--hatch-cut-site': '#c04040',

	// Semantic
	'--hatch-positive': '#2ecc71',
	'--hatch-negative': '#e74c3c',
	'--hatch-warning': '#f39c12',

	// Controls
	'--hatch-controls-bg': '#f0f0f0',
	'--hatch-controls-border': '#cccccc',
	'--hatch-controls-color': '#333333',
	'--hatch-controls-hover': '#e0e0e0',

	// Legends & titles
	'--hatch-legend-color': '#555555',
	'--hatch-title-color': '#333333',

	// Sequence viewer
	'--hatch-seq-bg': '#ffffff',
	'--hatch-seq-border': '#cccccc',
	'--hatch-ruler-color': '#888888',
	'--hatch-ruler-text': '#666666',
	'--hatch-line-number': '#999999',
	'--hatch-cutsite-color': '#c04040',
	'--hatch-cutsite-text': '#c04040',

	// Selection (OVE blue)
	'--hatch-selection-fill': 'rgba(0, 130, 250, 0.3)',
	'--hatch-selection-stroke': 'rgba(0, 130, 250, 0.6)',
	'--hatch-selection-handle': 'rgba(0, 130, 250, 0.8)',

	// Caret
	'--hatch-caret-color': '#333333',

	// Context menu
	'--hatch-context-menu-bg': '#ffffff',
	'--hatch-context-menu-hover': '#f0f0f0',

	// Dialog
	'--hatch-dialog-bg': '#ffffff',
	'--hatch-dialog-overlay': 'rgba(0, 0, 0, 0.3)',

	// Plate heatmap
	'--hatch-plate-bg': '#ffffff',
	'--hatch-plate-border': '#cccccc',
	'--hatch-well-border': '#cccccc',
	'--hatch-well-text': '#333333',
	'--hatch-empty-well': '#f0f0f0',

	// Primers & annotations
	'--hatch-primer-color': '#1a8fa8',
	'--hatch-primer-text': '#1a8fa8',
	'--hatch-annotation-text': '#ffffff',
	'--hatch-annotation-stroke': '#000000',
	'--hatch-annotation-stroke-hover': '#000000',

	// Label connector
	'--hatch-label-connector': '#999999',

	// Conservation
	'--hatch-conservation-bar': 'rgba(0, 130, 250, 0.5)',

	// Tooltip
	'--hatch-tooltip-bg': '#ffffff',
	'--hatch-tooltip-border': '#cccccc',
	'--hatch-tooltip-text': '#333333',
	'--hatch-tooltip-label': '#666666',
};

/** Apply a theme to an HTML element by setting CSS custom properties */
export function applyTheme(element: HTMLElement, theme: HatchTheme): void {
	for (const [prop, value] of Object.entries(theme)) {
		element.style.setProperty(prop, value);
	}
}
