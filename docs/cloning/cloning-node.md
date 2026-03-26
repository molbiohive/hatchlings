# CloningNode

A `CloningNode` represents a DNA construct at any stage in a cloning workflow — either a starting material (source vector, insert, donor) or a derived product created by a cloning operation.

## Overview

Cloning data in hatchlings is modeled as a tree of `CloningNode` objects. Each node describes a construct (name, size, topology, features) and optionally a `source` that records how it was made.

- **Leaf nodes** have no `source` — they are starting materials (vectors, inserts, PCR templates)
- **Derived nodes** have a `source` containing the `CloningAction` and input nodes that produced them

```
Final Product (root)
├── source.action: Gibson Assembly
├── source.inputs[0].node: Backbone (leaf)
└── source.inputs[1].node: Insert
    ├── source.action: PCR
    ├── source.inputs[0].node: Template (leaf)
```

## Interface Reference

```ts
import type { CloningNode } from '@molbiohive/hatchlings';
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique identifier for this node |
| `name` | `string` | yes | Construct name (e.g. `'pUC19'`, `'GFP insert'`) |
| `size` | `number` | yes | Total length in base pairs |
| `topology` | `'circular' \| 'linear'` | no | Defaults to `'circular'` for most vectors |
| `sequence` | `string` | no | Full nucleotide sequence (sense strand, 5'→3') |
| `parts` | `Part[]` | no | Feature annotations (genes, promoters, primers) |
| `cutSites` | `CutSite[]` | no | Restriction enzyme cut sites |
| `description` | `string` | no | Free-text description |
| `source` | `CloningSource` | no | How this node was produced (absent for starting materials) |

## Leaf Node (Source Material)

A leaf node has no `source`. It represents raw starting material:

```ts
const backbone: CloningNode = {
  id: 'puc19',
  name: 'pUC19',
  size: 2686,
  topology: 'circular',
  parts: [
    { name: 'AmpR', type: 'CDS', start: 1629, end: 2489, strand: -1, color: '#4dc3ff' },
    { name: 'ori', type: 'rep_origin', start: 836, end: 1424, strand: -1, color: '#9467bd' },
    { name: 'lacZa', type: 'CDS', start: 217, end: 508, strand: 1, color: '#e6a24c' },
  ],
  cutSites: [
    { enzyme: 'EcoRI', position: 396, end: 402, strand: 1, cutPosition: 1, complementCutPosition: 5 },
    { enzyme: 'BamHI', position: 417, end: 423, strand: 1, cutPosition: 1, complementCutPosition: 5 },
  ],
};
```

## Derived Node (Cloned Product)

A derived node has a `source` describing the operation and inputs:

```ts
const product: CloningNode = {
  id: 'puc19-gfp',
  name: 'pUC19-GFP',
  size: 3403,
  topology: 'circular',
  parts: [
    { name: 'AmpR', type: 'CDS', start: 1629, end: 2489, strand: -1, color: '#4dc3ff' },
    { name: 'GFP', type: 'CDS', start: 396, end: 1113, strand: 1, color: '#58b56a' },
    { name: 'ori', type: 'rep_origin', start: 836, end: 1424, strand: -1, color: '#9467bd' },
  ],
  source: {
    action: {
      paradigm: 'restriction',
      enzymes: ['EcoRI', 'BamHI'],
    },
    inputs: [
      { node: backbone, label: 'Vector' },
      { node: gfpInsert, label: 'Insert' },
    ],
  },
};
```

## Relationship to PlasmidData

`CloningNode` shares the same `Part[]` and `CutSite[]` types as `PlasmidData`. A `CloningNode` can be directly rendered by PlasmidViewer by mapping to `PlasmidData`:

```ts
import type { PlasmidData, CloningNode } from '@molbiohive/hatchlings';

function toPlasmidData(node: CloningNode): PlasmidData {
  return {
    name: node.name,
    size: node.size,
    topology: node.topology ?? 'circular',
    seq: node.sequence,
    parts: node.parts ?? [],
    cutSites: node.cutSites ?? [],
  };
}
```

## Related

- **[CloningAction](/cloning/cloning-action)** — the operation that produces a derived node
- **[Cloning Tree](/cloning/cloning-tree)** — multi-step cloning history trees
- **[CloningStrategyViewer](/cloning/cloning-strategy-viewer)** — renders a single cloning step
- **[CloningHistoryViewer](/cloning/cloning-history-viewer)** — renders the full tree
