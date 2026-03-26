# CloningAction

A `CloningAction` describes the molecular biology operation used to produce a cloned construct. It is always nested inside a `CloningSource`, which connects an action to its input nodes.

## CloningParadigm

Every action has a `paradigm` — one of 12 supported cloning methods:

```ts
type CloningParadigm =
  | 'restriction' | 'gibson' | 'infusion' | 'slic' | 'cpec'
  | 'golden-gate' | 'gateway' | 'cre-lox' | 'flp-frt'
  | 'crispr' | 'ligation' | 'pcr';
```

## CloningAction Interface

```ts
import type { CloningAction } from '@molbiohive/hatchlings';
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `paradigm` | `CloningParadigm` | yes | Cloning method |
| `label` | `string` | no | Display label (defaults to paradigm name) |
| `enzymes` | `string[]` | no | Restriction enzymes (restriction, golden-gate) |
| `operation` | `CreLoxOperation` | no | Cre-lox operation type |
| `attSites` | `AttSite[]` | no | Gateway att sites |
| `guide` | `string` | no | CRISPR sgRNA guide sequence (20nt) |
| `pam` | `string` | no | CRISPR PAM motif (e.g. `'NGG'` for SpCas9) |
| `primers` | `string[]` | no | Primer names or sequences (PCR) |
| `temperature` | `string` | no | Reaction temperature (e.g. `'50°C'`) |
| `duration` | `string` | no | Reaction duration (e.g. `'60 min'`) |
| `notes` | `string` | no | Free-text notes |

## Paradigm-Specific Fields

Different paradigms use different subsets of fields:

### Restriction / Ligation

Uses `enzymes` to specify which restriction enzymes cut the DNA:

```ts
const action: CloningAction = {
  paradigm: 'restriction',
  enzymes: ['EcoRI', 'BamHI'],
  notes: 'Double digest at 37°C for 1 hour',
};
```

### Gibson / InFusion / SLIC / CPEC

Overlap-based assembly methods. Use `temperature` and `duration`:

```ts
const action: CloningAction = {
  paradigm: 'gibson',
  temperature: '50°C',
  duration: '60 min',
};
```

### Golden Gate

Type IIS restriction enzyme assembly. Uses `enzymes`:

```ts
const action: CloningAction = {
  paradigm: 'golden-gate',
  enzymes: ['BsaI'],
  temperature: '37°C / 16°C cycling',
  duration: '5 hours',
};
```

### Gateway

Site-specific recombination with att sites:

```ts
const action: CloningAction = {
  paradigm: 'gateway',
  attSites: [
    { name: 'attL1', position: 0 },
    { name: 'attL2', position: 1500 },
    { name: 'attR1', position: 0 },
    { name: 'attR2', position: 2800 },
  ],
};
```

### Cre-lox

Cre recombinase with loxP sites. Uses `operation`:

```ts
type CreLoxOperation = 'excision' | 'inversion' | 'insertion' | 'translocation';

const action: CloningAction = {
  paradigm: 'cre-lox',
  operation: 'excision',
  notes: 'Remove floxed selection cassette',
};
```

### CRISPR-Cas9

HDR-mediated editing. Uses `guide` and `pam`:

```ts
const action: CloningAction = {
  paradigm: 'crispr',
  guide: 'ATGCGATCGATCGATCGATC',
  pam: 'NGG',
  notes: 'SpCas9 HDR with donor template',
};
```

### PCR

Amplification with primers:

```ts
const action: CloningAction = {
  paradigm: 'pcr',
  primers: ['GFP_fwd', 'GFP_rev'],
  temperature: '98°C',
  duration: '30 cycles',
};
```

## CloningSource

`CloningSource` wraps an action with its inputs and optional byproducts:

```ts
import type { CloningSource } from '@molbiohive/hatchlings';
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | `CloningAction` | yes | The cloning operation |
| `inputs` | `CloningSourceInput[]` | yes | Input constructs (1 or more) |
| `byproducts` | `CloningNode[]` | no | Secondary outputs (e.g. Gateway byproduct) |

## CloningSourceInput

Each input references a `CloningNode` with an optional display label:

```ts
import type { CloningSourceInput } from '@molbiohive/hatchlings';
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `node` | `CloningNode` | yes | The input construct |
| `label` | `string` | no | Role label (e.g. `'Vector'`, `'Insert'`, `'Donor'`) |

## AttSite

Gateway recombination site:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | yes | Site name (e.g. `'attL1'`, `'attR1'`) |
| `position` | `number` | no | Position on the construct (bp) |

## Related

- **[CloningNode](/cloning/cloning-node)** — the construct that contains a CloningAction via its `source`
- **[Cloning Tree](/cloning/cloning-tree)** — how actions compose into multi-step histories
- **[CloningStrategyViewer](/cloning/cloning-strategy-viewer)** — visualizes a single action
