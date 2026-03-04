/** Synchronized selection state for PlasmidViewer and SequenceViewer */

export interface SelectionRange {
	start: number;
	end: number;
}

export class SelectionState {
	caretPosition = $state(0);
	selectionStart = $state(-1);
	selectionEnd = $state(-1);
	isDragging = $state(false);
	selectedAnnotationIds = $state<string[]>([]);

	/** Sequence length (needed for circular wrapping) */
	sequenceLength: number;

	constructor(sequenceLength: number) {
		this.sequenceLength = sequenceLength;
	}

	/** Normalized selection range (start < end), or null if no selection */
	get range(): SelectionRange | null {
		if (this.selectionStart < 0 || this.selectionEnd < 0) return null;
		if (this.selectionStart === this.selectionEnd) return null;
		const start = Math.min(this.selectionStart, this.selectionEnd);
		const end = Math.max(this.selectionStart, this.selectionEnd);
		return { start, end };
	}

	/** Whether there is an active selection (not just a caret) */
	get hasSelection(): boolean {
		return this.range !== null;
	}

	/** Length of current selection in bp */
	get selectionLength(): number {
		const r = this.range;
		if (!r) return 0;
		return r.end - r.start;
	}

	setCaret(position: number): void {
		this.caretPosition = Math.max(0, Math.min(position, this.sequenceLength));
		this.selectionStart = -1;
		this.selectionEnd = -1;
	}

	setSelection(start: number, end: number): void {
		this.selectionStart = Math.max(0, Math.min(start, this.sequenceLength));
		this.selectionEnd = Math.max(0, Math.min(end, this.sequenceLength));
		this.caretPosition = this.selectionEnd;
	}

	clearSelection(): void {
		this.selectionStart = -1;
		this.selectionEnd = -1;
	}

	startDrag(position: number): void {
		this.isDragging = true;
		this.selectionStart = Math.max(0, Math.min(position, this.sequenceLength));
		this.selectionEnd = this.selectionStart;
		this.caretPosition = position;
	}

	updateDrag(position: number): void {
		if (!this.isDragging) return;
		this.selectionEnd = Math.max(0, Math.min(position, this.sequenceLength));
		this.caretPosition = this.selectionEnd;
	}

	endDrag(): void {
		this.isDragging = false;
		// If start === end, it was just a click — set caret
		if (this.selectionStart === this.selectionEnd) {
			this.caretPosition = this.selectionStart;
			this.selectionStart = -1;
			this.selectionEnd = -1;
		}
	}

	selectAnnotation(id: string, multi = false): void {
		if (multi) {
			const idx = this.selectedAnnotationIds.indexOf(id);
			if (idx >= 0) {
				this.selectedAnnotationIds = this.selectedAnnotationIds.filter((x) => x !== id);
			} else {
				this.selectedAnnotationIds = [...this.selectedAnnotationIds, id];
			}
		} else {
			this.selectedAnnotationIds = [id];
		}
	}

	selectAll(): void {
		this.setSelection(0, this.sequenceLength);
	}

	/** Move caret by delta bp, optionally extending selection */
	moveCaret(delta: number, extend = false): void {
		const newPos = Math.max(0, Math.min(this.caretPosition + delta, this.sequenceLength));
		if (extend) {
			if (this.selectionStart < 0) {
				this.selectionStart = this.caretPosition;
			}
			this.selectionEnd = newPos;
			this.caretPosition = newPos;
		} else {
			this.setCaret(newPos);
		}
	}
}
