# Cloning Tree

The cloning tree is the data model for multi-step cloning histories. It represents how a final construct was built through successive cloning operations, from source materials to finished product.

## Tree Structure

The tree is a recursive structure of `CloningNode` objects:

- **Root** — the final product
- **Leaves** — source materials (no `source` field)
- **Branches** — each `source.inputs[].node` creates a child branch

```
pUC19-GFP-His (root, final product)
├── action: Golden Gate (BsaI)
├── input: pUC19-GFP (derived)
│   ├── action: Gibson Assembly
│   ├── input: pUC19 (leaf, backbone)
│   └── input: GFP amplicon (derived)
│       ├── action: PCR
│       └── input: GFP template (leaf)
└── input: His-tag cassette (leaf)
```

The tree is read top-down (product → sources) but represents a workflow that executes bottom-up (sources → product).

## Recursive Structure

The recursion is through `CloningNode.source.inputs[].node`:

```ts
interface CloningNode {
  id: string;
  name: string;
  size: number;
  // ...
  source?: {                    // absent for leaves
    action: CloningAction;
    inputs: {
      node: CloningNode;       // ← recurse here
      label?: string;
    }[];
    byproducts?: CloningNode[];
  };
}
```

## Byproducts

Some cloning operations produce secondary outputs alongside the main product:

- **Gateway** — BP/LR reactions produce a byproduct plasmid (e.g. the donor backbone)
- **Cre-lox excision** — produces an excised circular element
- **Restriction digest** — the discarded fragment

Byproducts are stored in `source.byproducts[]`. They are leaf-like nodes (typically no further `source`).

## Building a Multi-Step History

Here's a complete 3-level cloning tree: PCR → Gibson → Golden Gate.

### Step 1: Source Materials (Leaves)

```ts
import type { CloningNode } from '@molbiohive/hatchlings';

const gfpTemplate: CloningNode = {
  id: 'gfp-template',
  name: 'pEGFP-N1',
  size: 4733,
  topology: 'circular',
  parts: [
    { name: 'EGFP', type: 'CDS', start: 679, end: 1398, strand: 1, color: '#58b56a' },
    { name: 'KanR', type: 'CDS', start: 1637, end: 2431, strand: 1, color: '#e6a24c' },
  ],
};

const backbone: CloningNode = {
  id: 'puc19',
  name: 'pUC19',
  size: 2686,
  topology: 'circular',
  parts: [
    { name: 'AmpR', type: 'CDS', start: 1629, end: 2489, strand: -1, color: '#4dc3ff' },
    { name: 'ori', type: 'rep_origin', start: 836, end: 1424, strand: -1, color: '#9467bd' },
  ],
};

const hisCassette: CloningNode = {
  id: 'his-cassette',
  name: '6xHis cassette',
  size: 120,
  topology: 'linear',
  parts: [
    { name: '6xHis', type: 'CDS', start: 10, end: 70, strand: 1, color: '#d45858' },
  ],
};
```

### Step 2: PCR Amplification

```ts
const gfpAmplicon: CloningNode = {
  id: 'gfp-amplicon',
  name: 'GFP amplicon',
  size: 750,
  topology: 'linear',
  parts: [
    { name: 'EGFP', type: 'CDS', start: 15, end: 734, strand: 1, color: '#58b56a' },
  ],
  source: {
    action: {
      paradigm: 'pcr',
      primers: ['GFP_fwd', 'GFP_rev'],
      temperature: '98°C',
      duration: '30 cycles',
    },
    inputs: [
      { node: gfpTemplate, label: 'Template' },
    ],
  },
};
```

### Step 3: Gibson Assembly

```ts
const puc19Gfp: CloningNode = {
  id: 'puc19-gfp',
  name: 'pUC19-GFP',
  size: 3400,
  topology: 'circular',
  parts: [
    { name: 'AmpR', type: 'CDS', start: 1629, end: 2489, strand: -1, color: '#4dc3ff' },
    { name: 'EGFP', type: 'CDS', start: 396, end: 1130, strand: 1, color: '#58b56a' },
    { name: 'ori', type: 'rep_origin', start: 836, end: 1424, strand: -1, color: '#9467bd' },
  ],
  source: {
    action: {
      paradigm: 'gibson',
      temperature: '50°C',
      duration: '60 min',
    },
    inputs: [
      { node: backbone, label: 'Vector' },
      { node: gfpAmplicon, label: 'Insert' },
    ],
  },
};
```

### Step 4: Golden Gate into Final Destination

```ts
const finalProduct: CloningNode = {
  id: 'puc19-gfp-his',
  name: 'pUC19-GFP-His',
  size: 3500,
  topology: 'circular',
  parts: [
    { name: 'AmpR', type: 'CDS', start: 1629, end: 2489, strand: -1, color: '#4dc3ff' },
    { name: 'EGFP', type: 'CDS', start: 396, end: 1130, strand: 1, color: '#58b56a' },
    { name: '6xHis', type: 'CDS', start: 1131, end: 1191, strand: 1, color: '#d45858' },
    { name: 'ori', type: 'rep_origin', start: 836, end: 1424, strand: -1, color: '#9467bd' },
  ],
  source: {
    action: {
      paradigm: 'golden-gate',
      enzymes: ['BsaI'],
      temperature: '37°C / 16°C cycling',
      duration: '5 hours',
    },
    inputs: [
      { node: puc19Gfp, label: 'Acceptor' },
      { node: hisCassette, label: 'Donor' },
    ],
  },
};
```

## Rendering

Pass the root node to the appropriate component:

- **CloningHistoryViewer** — renders the entire tree as an interactive node graph:

```svelte
<CloningHistoryViewer root={finalProduct} width={660} height={450} />
```

- **CloningStrategyViewer** — renders a single step (one node's `source`):

```svelte
<CloningStrategyViewer node={puc19Gfp} width={660} height={160} />
```

## Related

- **[CloningNode](/cloning/cloning-node)** — interface reference for individual nodes
- **[CloningAction](/cloning/cloning-action)** — interface reference for cloning operations
- **[CloningHistoryViewer](/cloning/cloning-history-viewer)** — tree visualization component
- **[CloningStrategyViewer](/cloning/cloning-strategy-viewer)** — single-step visualization
