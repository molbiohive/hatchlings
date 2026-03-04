<script lang="ts">
	import type { TraceChannel } from '../../types/index.js';
	import { nucleotideColors } from '../../util/colors.js';

	interface Props {
		/** Four-channel chromatogram data */
		channels: TraceChannel;
		/** Peak positions (data point indices for each base call) */
		peakPositions: number[];
		/** Canvas width in pixels */
		width: number;
		/** Canvas height in pixels */
		height: number;
		/** Horizontal zoom factor */
		zoom?: number;
		/** Horizontal scroll offset in pixels */
		scrollX?: number;
		/** Which channels to display */
		showChannels?: { A: boolean; C: boolean; G: boolean; T: boolean };
		/** Background color override (reads --hatch-bg from theme by default) */
		bgColor?: string;
	}

	let {
		channels,
		peakPositions,
		width,
		height,
		zoom = 1,
		scrollX = 0,
		showChannels = { A: true, C: true, G: true, T: true },
		bgColor,
	}: Props = $props();

	let canvas: HTMLCanvasElement | undefined = $state();

	const channelKeys = ['A', 'C', 'G', 'T'] as const;

	/** Convert a hex color string to an { r, g, b } object */
	function hexToRgb(hex: string): { r: number; g: number; b: number } {
		const val = parseInt(hex.slice(1), 16);
		return {
			r: (val >> 16) & 255,
			g: (val >> 8) & 255,
			b: val & 255,
		};
	}

	/** Find the maximum value across all visible channels for Y-axis scaling */
	function getMaxValue(): number {
		let max = 0;
		for (const key of channelKeys) {
			if (!showChannels[key]) continue;
			const data = channels[key];
			for (let i = 0; i < data.length; i++) {
				if (data[i] > max) max = data[i];
			}
		}
		return max || 1;
	}

	/** Draw a smooth bezier curve through channel data points */
	function drawChannel(
		ctx: CanvasRenderingContext2D,
		data: number[],
		color: string,
		maxVal: number,
	) {
		if (data.length < 2) return;

		const rgb = hexToRgb(color);
		const xScale = zoom;
		const yScale = (height - 10) / maxVal;
		const padding = 5;

		// Determine visible data range for performance
		const startIdx = Math.max(0, Math.floor(scrollX / xScale) - 1);
		const endIdx = Math.min(data.length - 1, Math.ceil((scrollX + width) / xScale) + 1);

		if (startIdx >= endIdx) return;

		// Build the path
		ctx.beginPath();

		const firstX = startIdx * xScale - scrollX;
		const firstY = height - padding - data[startIdx] * yScale;
		ctx.moveTo(firstX, firstY);

		// Draw bezier curves through data points for smooth peaks
		for (let i = startIdx; i < endIdx; i++) {
			const x0 = i * xScale - scrollX;
			const y0 = height - padding - data[i] * yScale;
			const x1 = (i + 1) * xScale - scrollX;
			const y1 = height - padding - data[i + 1] * yScale;

			// Control points: use midpoints with vertical bias for smooth curves
			const cpx0 = (x0 + x1) / 2;
			const cpx1 = (x0 + x1) / 2;
			ctx.bezierCurveTo(cpx0, y0, cpx1, y1, x1, y1);
		}

		// Stroke with full opacity
		ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1.0)`;
		ctx.lineWidth = 1.2;
		ctx.stroke();

		// Fill with transparency: close the path along the bottom
		const lastX = endIdx * xScale - scrollX;
		ctx.lineTo(lastX, height - padding);
		ctx.lineTo(firstX, height - padding);
		ctx.closePath();
		ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
		ctx.fill();
	}

	$effect(() => {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Read reactive dependencies
		const _channels = channels;
		const _zoom = zoom;
		const _scrollX = scrollX;
		const _show = showChannels;
		const _width = width;
		const _height = height;

		// Set canvas resolution for crisp rendering
		const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
		canvas.width = _width * dpr;
		canvas.height = _height * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		// Clear
		ctx.clearRect(0, 0, _width, _height);

		// Background — read from CSS custom property or use fallback
		const resolvedBg = bgColor ?? (getComputedStyle(canvas).getPropertyValue('--hatch-bg').trim() || '#0c1018');
		ctx.fillStyle = resolvedBg;
		ctx.fillRect(0, 0, _width, _height);

		// Draw subtle gridlines at peak positions
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
		ctx.lineWidth = 0.5;
		for (const pos of peakPositions) {
			const x = pos * _zoom - _scrollX;
			if (x < 0 || x > _width) continue;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, _height);
			ctx.stroke();
		}

		const maxVal = getMaxValue();

		// Draw each visible channel
		for (const key of channelKeys) {
			if (!_show[key]) continue;
			drawChannel(ctx, _channels[key], nucleotideColors[key], maxVal);
		}
	});
</script>

<canvas
	bind:this={canvas}
	style="width: {width}px; height: {height}px; display: block; background: var(--hatch-bg, #0c1018); border-radius: 4px 4px 0 0;"
></canvas>
