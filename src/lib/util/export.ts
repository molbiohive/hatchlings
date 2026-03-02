/** SVG/PNG export utilities */

/**
 * Serialize an SVG element to a string.
 */
export function svgToString(svgElement: SVGSVGElement): string {
	const serializer = new XMLSerializer();
	let svgString = serializer.serializeToString(svgElement);

	// Ensure xmlns is set
	if (!svgString.includes('xmlns')) {
		svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
	}

	return svgString;
}

/**
 * Download an SVG element as an SVG file.
 */
export function downloadSVG(svgElement: SVGSVGElement, filename: string = 'export.svg'): void {
	const svgString = svgToString(svgElement);
	const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
	downloadBlob(blob, filename);
}

/**
 * Download an SVG element as a PNG file.
 */
export async function downloadPNG(
	svgElement: SVGSVGElement,
	filename: string = 'export.png',
	scale: number = 2,
): Promise<void> {
	const svgString = svgToString(svgElement);
	const width = svgElement.width.baseVal.value || parseInt(svgElement.getAttribute('width') || '500');
	const height = svgElement.height.baseVal.value || parseInt(svgElement.getAttribute('height') || '500');

	const canvas = document.createElement('canvas');
	canvas.width = width * scale;
	canvas.height = height * scale;
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const img = new Image();
	const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
	const url = URL.createObjectURL(svgBlob);

	return new Promise<void>((resolve) => {
		img.onload = () => {
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			URL.revokeObjectURL(url);

			canvas.toBlob((blob) => {
				if (blob) downloadBlob(blob, filename);
				resolve();
			}, 'image/png');
		};
		img.src = url;
	});
}

/**
 * Download a canvas element as a PNG file.
 */
export function downloadCanvasPNG(canvas: HTMLCanvasElement, filename: string = 'export.png'): void {
	canvas.toBlob((blob) => {
		if (blob) downloadBlob(blob, filename);
	}, 'image/png');
}

function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
