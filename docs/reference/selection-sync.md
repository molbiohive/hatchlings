# Selection & Sync

Hatchlings provides a shared `SelectionState` class that synchronizes selection, caret position, and keyboard navigation across multiple views of the same sequence.

## Overview

When PlasmidViewer and SequenceViewer display the same construct, you often want selection in one view to be reflected in the other. `SelectionState` is a Svelte 5 reactive class that manages this.

```svelte
<script>
  import { PlasmidViewer, SequenceViewer, SelectionState } from '@molbiohive/hatchlings';

  const selection = new SelectionState(2686); // sequence length

  let plasmidData = { ... };
  let sequenceData = { ... };
</script>

<PlasmidViewer data={plasmidData} selectionState={selection} width={500} height={500} />
<SequenceViewer data={sequenceData} selectionState={selection} width={660} height={400} />
```

Click or drag in either view — the selection updates in both.

## SelectionState API

### Constructor

```ts
const selection = new SelectionState(sequenceLength: number);
```

### Reactive Properties

| Property | Type | Description |
|----------|------|-------------|
| `caretPosition` | `number` | Current cursor position (bp) |
| `selectionStart` | `number \| null` | Start of selection range |
| `selectionEnd` | `number \| null` | End of selection range |
| `isDragging` | `boolean` | Whether a drag is in progress |
| `selectedAnnotationIds` | `Set<string>` | IDs of selected features |

### Computed Properties

| Property | Type | Description |
|----------|------|-------------|
| `range` | `{ start, end } \| null` | Current selection range (handles circular wrapping) |
| `hasSelection` | `boolean` | Whether a range is selected |
| `wraps` | `boolean` | Whether selection wraps around origin (circular) |
| `selectionLength` | `number` | Length of selection in bp |

### Methods

| Method | Description |
|--------|-------------|
| `setCaret(position)` | Move cursor without selecting |
| `setSelection(start, end)` | Set explicit selection range |
| `clearSelection()` | Clear all selection |
| `selectAnnotation(id, multi?)` | Select a feature by ID |
| `selectAll()` | Select the entire sequence |
| `moveCaret(delta, extend?)` | Keyboard navigation (extend = shift-held) |
| `startDrag(position)` | Begin drag selection |
| `updateDragLinear(position)` | Update drag for linear topology |
| `updateDragCircular(start, end)` | Update drag for circular topology |
| `endDrag()` | Finish drag selection |

## Event Callbacks

Components emit selection events alongside the shared state:

| Event | Payload | Description |
|-------|---------|-------------|
| `onselect` | `{ start, end }` | Region selected (drag completed) |
| `onselectionchange` | `{ start, end } \| null` | Selection changed (real-time during drag) |
| `oncaretmove` | `number` | Caret position changed |
| `onpartclick` | `Part` | Feature clicked |
| `oncopysequence` | `string` | Sequence copied to clipboard |

```svelte
<PlasmidViewer
  data={plasmidData}
  selectionState={selection}
  onselect={(sel) => console.log(`Selected ${sel.start}..${sel.end}`)}
  onpartclick={(part) => console.log(`Clicked ${part.name}`)}
/>
```

## Circular Wrapping

For circular sequences, selection can wrap around the origin (position 0). When `start > end`, the selection spans from `start` to the end of the sequence and continues from 0 to `end`:

```
Sequence: 0 ──────────── 2686
Selection:     ████               ████
               end=500            start=2400

Wraps: true
Length: (2686 - 2400) + 500 = 786 bp
```

`SelectionState` handles this automatically — both PlasmidViewer (arc selection) and SequenceViewer (highlighted rows) display wrapping correctly.

## Components with Selection Support

| Component | `selectionState` prop | Selection behavior |
|-----------|----------------------|-------------------|
| PlasmidViewer | yes | Arc selection on circular map, range on linear |
| SequenceViewer | yes | Row-based text selection with shift+click |
| TraceViewer | no | Internal scrollbar-based navigation |
| AlignmentViewer | no | Column highlight on hover |
