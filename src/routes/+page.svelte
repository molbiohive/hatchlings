<script lang="ts">
	// --- Component imports ---
	import { SelectionState } from '$lib/state/index.js';
	import { PlasmidViewer } from '$lib/components/plasmid/index.js';
	import { SequenceViewer, RestrictionMap, DiffViewer } from '$lib/components/sequence/index.js';
	import { GelViewer } from '$lib/components/gel/index.js';
	import { TraceViewer } from '$lib/components/trace/index.js';
	import { AlignmentViewer } from '$lib/components/alignment/index.js';
	import { ProteinViewer } from '$lib/components/protein/index.js';
	import DoseResponseCurve from '$lib/components/charts/DoseResponseCurve.svelte';
	import ChromatogramViewer from '$lib/components/charts/ChromatogramViewer.svelte';
	import PlateHeatmap from '$lib/components/charts/PlateHeatmap.svelte';
	import TimeSeriesPlot from '$lib/components/charts/TimeSeriesPlot.svelte';
	import SpectrumViewer from '$lib/components/charts/SpectrumViewer.svelte';
	import MeltingCurve from '$lib/components/charts/MeltingCurve.svelte';
	import VolcanoPlot from '$lib/components/charts/VolcanoPlot.svelte';
	import HeatmapViewer from '$lib/components/charts/HeatmapViewer.svelte';
	import SeqLogo from '$lib/components/charts/SeqLogo.svelte';
	import BindingKineticsViewer from '$lib/components/charts/BindingKineticsViewer.svelte';
	import CompositionChart from '$lib/components/charts/CompositionChart.svelte';

	import type {
		Part, CutSite, Translation,
		GelLane, StainType, TraceChannel, TraceAlignment,
		AlignmentSequence, ConservationScore,
		DoseResponseCurveData,
		HoverInfo,
	} from '$lib/types/index.js';
	import { InfoBox } from '$lib/components/shared/index.js';

	// ========== PLASMID DATA (pBR322-derived, 4361 bp) ==========
	const plasmidParts: Part[] = [
		{ name: 'AmpR', type: 'CDS', start: 3293, end: 4153, strand: -1, color: '#4dc3ff' },
		{ name: 'TetR', type: 'CDS', start: 86, end: 1276, strand: 1, color: '#e6a24c' },
		{ name: 'ori', type: 'rep_origin', start: 1915, end: 2535, strand: 1, color: '#9467bd' },
		{ name: 'AmpR promoter', type: 'promoter', start: 4154, end: 4258, strand: 1, color: '#31a354' },
		{ name: 'rop', type: 'CDS', start: 1915, end: 2106, strand: -1, color: '#d4915e' },
		{ name: 'bla', type: 'CDS', start: 2778, end: 3293, strand: -1, color: '#7aa3d4' },
		{ name: 'pBR322-F', type: 'primer_bind', start: 3200, end: 3224, strand: 1, tm: 58.1, color: '#bcbd22' },
		{ name: 'pBR322-R', type: 'primer_bind', start: 3400, end: 3424, strand: -1, tm: 57.8, color: '#bcbd22' },
		{ name: 'Tet-seq', type: 'primer_bind', start: 500, end: 522, strand: 1, tm: 56.4, color: '#bcbd22' },
	];
	const plasmidCutSites: CutSite[] = [
		{ enzyme: 'EcoRI', position: 4359, strand: 1, cutPosition: 1, complementCutPosition: 5 },
		{ enzyme: 'HindIII', position: 29, strand: 1, cutPosition: 1, complementCutPosition: 5 },
		{ enzyme: 'BamHI', position: 375, strand: 1, cutPosition: 1, complementCutPosition: 5 },
		{ enzyme: 'SalI', position: 651, strand: 1, cutPosition: 1, complementCutPosition: 5 },
		{ enzyme: 'PstI', position: 3607, strand: 1, cutPosition: 5, complementCutPosition: 1 },
		{ enzyme: 'NdeI', position: 2295, strand: 1, cutPosition: 2, complementCutPosition: 4 },
	];
	let plasmidShowLabels = $state(true);
	let plasmidShowTicks = $state(true);
	let plasmidShowInternal = $state(true);
	let plasmidTopology: 'circular' | 'linear' = $state('circular');

	// Shared selection state for cross-view sync (plasmid + sequence)
	const sharedSelection = new SelectionState(4361);

	// InfoBox hover state
	let hoverInfo: HoverInfo | null = $state(null);

	// ========== SEQUENCE DATA (pBR322, 4361 bp — same construct as plasmid view for cross-view sync) ==========
	// Generate a deterministic pseudo-random pBR322 sequence (Math.imul avoids JS integer overflow)
	const pBR322seq = (() => {
		const bases = 'ATGC';
		let s = '';
		let seed = 322;
		for (let i = 0; i < 4361; i++) {
			seed = (Math.imul(seed, 1103515245) + 12345) | 0;
			s += bases[((seed >>> 16) & 0x7fff) % 4];
		}
		return s;
	})();
	const sequence = pBR322seq;
	// Reuse the same parts and cut sites as the plasmid viewer
	const seqParts: Part[] = plasmidParts;
	const seqCutSites: CutSite[] = plasmidCutSites;
	const codonTable: Record<string, string> = {
		TTT:'F',TTC:'F',TTA:'L',TTG:'L',CTT:'L',CTC:'L',CTA:'L',CTG:'L',
		ATT:'I',ATC:'I',ATA:'I',ATG:'M',GTT:'V',GTC:'V',GTA:'V',GTG:'V',
		TCT:'S',TCC:'S',TCA:'S',TCG:'S',CCT:'P',CCC:'P',CCA:'P',CCG:'P',
		ACT:'T',ACC:'T',ACA:'T',ACG:'T',GCT:'A',GCC:'A',GCA:'A',GCG:'A',
		TAT:'Y',TAC:'Y',TAA:'*',TAG:'*',CAT:'H',CAC:'H',CAA:'Q',CAG:'Q',
		AAT:'N',AAC:'N',AAA:'K',AAG:'K',GAT:'D',GAC:'D',GAA:'E',GAG:'E',
		TGT:'C',TGC:'C',TGA:'*',TGG:'W',CGT:'R',CGC:'R',CGA:'R',CGG:'R',
		AGT:'S',AGC:'S',AGA:'R',AGG:'R',GGT:'G',GGC:'G',GGA:'G',GGG:'G',
	};
	function trDNA(dna: string): string { let p=''; for(let i=0;i+2<dna.length;i+=3) p+=codonTable[dna.slice(i,i+3).toUpperCase()]??'?'; return p; }
	const seqTranslations: Translation[] = [{ start:86,end:1276,strand:1,aminoAcids:trDNA(sequence.slice(86,1276)),frame:0 }];
	let seqAlphabet: 'dna'|'rna'|'protein' = $state('dna');
	let seqShowAnnotations = $state(true);
	let seqShowTranslations = $state(true);
	let seqShowNumbers = $state(true);
	let seqShowComplement = $state(true);
	let seqColorBases = $state(false);

	// ========== GEL DATA ==========
	const ladderPresets: Record<string, GelLane> = {
		'1kb': { label: '1 kb Ladder', isLadder: true, bands: [
			{position:0.08,intensity:0.5,size:10000},{position:0.14,intensity:0.3,size:8000},
			{position:0.18,intensity:0.5,size:6000},{position:0.23,intensity:0.3,size:5000},
			{position:0.28,intensity:0.5,size:4000},{position:0.34,intensity:0.8,size:3000},
			{position:0.42,intensity:0.4,size:2000},{position:0.48,intensity:0.3,size:1500},
			{position:0.55,intensity:0.8,size:1000},{position:0.66,intensity:0.3,size:750},
			{position:0.73,intensity:0.8,size:500},{position:0.85,intensity:0.3,size:250},
		]},
		'100bp': { label: '100 bp Ladder', isLadder: true, bands: [
			{position:0.12,intensity:0.4,size:1500},{position:0.20,intensity:0.3,size:1200},
			{position:0.28,intensity:0.3,size:1000},{position:0.36,intensity:0.3,size:900},
			{position:0.40,intensity:0.3,size:800},{position:0.45,intensity:0.3,size:700},
			{position:0.50,intensity:0.8,size:600},{position:0.56,intensity:0.3,size:500},
			{position:0.63,intensity:0.3,size:400},{position:0.72,intensity:0.3,size:300},
			{position:0.82,intensity:0.3,size:200},{position:0.93,intensity:0.3,size:100},
		]},
		'1kb+': { label: '1 kb Plus', isLadder: true, bands: [
			{position:0.03,intensity:0.3,size:15000},{position:0.06,intensity:0.4,size:10000},
			{position:0.10,intensity:0.3,size:8000},{position:0.14,intensity:0.3,size:7000},
			{position:0.17,intensity:0.3,size:6000},{position:0.21,intensity:0.8,size:5000},
			{position:0.25,intensity:0.3,size:4000},{position:0.31,intensity:0.3,size:3000},
			{position:0.38,intensity:0.8,size:2000},{position:0.44,intensity:0.3,size:1500},
			{position:0.55,intensity:0.8,size:1000},{position:0.64,intensity:0.3,size:700},
			{position:0.73,intensity:0.3,size:500},{position:0.82,intensity:0.3,size:400},
			{position:0.88,intensity:0.3,size:300},{position:0.93,intensity:0.3,size:200},
			{position:0.97,intensity:0.3,size:100},
		]},
	};
	let selectedLadder: '1kb'|'100bp'|'1kb+' = $state('1kb');
	const sampleLanes: GelLane[] = [
		{ label: 'Uncut', bands: [{position:0.35,intensity:1.0,size:4361,name:'supercoiled'}] },
		{ label: 'EcoRI', bands: [{position:0.28,intensity:0.9,size:4361,name:'linear'}] },
		{ label: 'EcoRI+HindIII', bands: [{position:0.28,intensity:0.6,size:4331},{position:0.95,intensity:0.3,size:30}] },
		{ label: 'BamHI+SalI', bands: [{position:0.33,intensity:0.5,size:3085},{position:0.46,intensity:0.5,size:1276}] },
	];
	let gelLanes = $derived([ladderPresets[selectedLadder], ...sampleLanes]);
	let gelBandStyle: 'realistic'|'simple' = $state('realistic');
	let gelStain: StainType = $state('ethidium');
	let gelShowSizeLabels = $state(true);

	// ========== TRACE DATA ==========
	const baseCalls = 'ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG';
	const numBases = baseCalls.length;
	const ppb = 10; const tp = numBases * ppb;
	const qualityScores: number[] = [];
	for(let i=0;i<numBases;i++){let q=32+Math.floor(Math.random()*14);if(i===8||i===22||i===37||i===51)q=10+Math.floor(Math.random()*8);if(i<4)q=Math.max(15,q-(4-i)*5);if(i>numBases-5)q=Math.max(12,q-(i-numBases+5)*4);qualityScores.push(q);}
	const peakPositions = Array.from({length:numBases},(_,i)=>5+i*ppb);
	function gauss(x:number,c:number,a:number,s:number){return a*Math.exp(-((x-c)**2)/(2*s*s));}
	const chA=new Array(tp).fill(0),chC=new Array(tp).fill(0),chG=new Array(tp).fill(0),chT=new Array(tp).fill(0);
	const chM:Record<string,number[]>={A:chA,C:chC,G:chG,T:chT};
	for(let i=0;i<numBases;i++){const b=baseCalls[i],ctr=peakPositions[i],amp=800*(0.6+(qualityScores[i]/60)*0.4)*(0.85+Math.random()*0.3);for(let x=Math.max(0,ctr-12);x<Math.min(tp,ctr+12);x++){chM[b][x]+=gauss(x,ctr,amp,2.2);for(const o of ['A','C','G','T'])if(o!==b)chM[o][x]+=gauss(x,ctr,amp*(0.03+Math.random()*0.07),2.86);}}
	for(let x=0;x<tp;x++)for(const c of [chA,chC,chG,chT])c[x]=Math.max(0,Math.round(c[x]+Math.random()*8));
	const traceChannels:TraceChannel={A:chA,C:chC,G:chG,T:chT};
	const rChars=baseCalls.split(''),qChars=baseCalls.split('');rChars[12]=rChars[12]==='A'?'G':'A';rChars[30]=rChars[30]==='T'?'C':'T';
	const traceAlignment:TraceAlignment={refSeq:rChars.join(''),querySeq:qChars.join(''),mismatches:[{pos:12,type:'substitution',refBase:rChars[12],queryBase:qChars[12]},{pos:30,type:'substitution',refBase:rChars[30],queryBase:qChars[30]}],identity:(numBases-2)/numBases};
	let traceZoom = $state(2);
	let traceShowQuality = $state(true);
	let traceTrimQ = $state(20);

	// ========== ALIGNMENT DATA ==========
	const alignSeqs:AlignmentSequence[]=[
		{id:'1',name:'Human_HBA',sequence:'MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSH-----GSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR'},
		{id:'2',name:'Mouse_HBA',sequence:'MVLSGEDKSNIKAAWGKIGGHGAEYGAEALERMFASFPTTKTYFPHFDVSH-----GSAQVKGHGKKVADALTNAVAHIDDMPQALSALSDLHAHKLRVDPVNFKLLSHCLLVTLANHLPAEFTPAVHASLDKFLASVSTVLTSKYR'},
		{id:'3',name:'Chicken_HBA',sequence:'MVLSAADKNNVKGIFTKIAGHAEEYGAETLERMFTTYPPTKTYFPHFDLSH-----GSAQIKGHGKKVVAALIEAANHIDDIAGTLSKLSDLHAHKLRVDPVNFKLLGQCFLVVVAIHHPSALTPEVHASLDKFLCAVGTVLTAKYR'},
		{id:'4',name:'Zebrafish_HBA',sequence:'MSLSDKDKAAVRALWSKIGKSADAIGNDALSRMLIVYPQTKTYFSHWPDLS-----PGSAPVKKHGGVIMGALAVKAHIDDIAGALSKLSDLHAQKLRVDPVNFKLLAHCILVVLARHYPGDFTPAHHASLEKFLSHVISALVSKYR'},
		{id:'5',name:'Frog_HBA',sequence:'MLTADDKKLIQQAWEKAASHADEIGHDALSRMIVVYPQTKTYFSHWQDLS-----PGSAPVKKHGITIMAAVGSQAHDDIKNFLSKLSDKHAQKLRVDPANFKILAHCILVVAAAHYPSDFTPAVHASLDKFLANVHTVLTSKYR--'},
	];
	const alignCons:ConservationScore[]=(()=>{const r:ConservationScore[]=[];const l=alignSeqs[0].sequence.length;for(let i=0;i<l;i++){const c:Record<string,number>={};for(const s of alignSeqs){const ch=s.sequence[i]?.toUpperCase()??'-';c[ch]=(c[ch]??0)+1;}let mx='-',mc=0;for(const[ch,n]of Object.entries(c))if(ch!=='-'&&n>mc){mx=ch;mc=n;}r.push({position:i,score:mc/alignSeqs.length,consensus:mx});}return r;})();
	let alignShowConservation = $state(true);
	let alignShowNames = $state(true);
	let alignCellW = $state(8);

	// ========== PROTEIN DATA ==========
	const demoPdb=`HEADER    DEMO STRUCTURE
ATOM      1  N   ALA A   1       1.458   0.000   0.000  1.00  0.00           N
ATOM      2  CA  ALA A   1       2.009   1.420   0.000  1.00  0.00           C
ATOM      3  C   ALA A   1       1.528   2.139   1.233  1.00  0.00           C
ATOM      4  O   ALA A   1       0.354   2.553   1.265  1.00  0.00           O
ATOM      5  N   GLY A   2       2.382   2.337   2.245  1.00  0.00           N
ATOM      6  CA  GLY A   2       1.996   3.019   3.481  1.00  0.00           C
ATOM      7  C   GLY A   2       2.590   4.412   3.558  1.00  0.00           C
ATOM      8  O   GLY A   2       3.772   4.587   3.317  1.00  0.00           O
ATOM      9  N   VAL A   3       1.776   5.397   3.898  1.00  0.00           N
ATOM     10  CA  VAL A   3       2.243   6.787   4.004  1.00  0.00           C
ATOM     11  C   VAL A   3       1.330   7.601   4.923  1.00  0.00           C
ATOM     12  O   VAL A   3       0.137   7.337   4.969  1.00  0.00           O
ATOM     13  N   LEU A   4       1.920   8.543   5.670  1.00  0.00           N
ATOM     14  CA  LEU A   4       1.140   9.416   6.553  1.00  0.00           C
ATOM     15  C   LEU A   4       1.899  10.730   6.714  1.00  0.00           C
ATOM     16  O   LEU A   4       3.118  10.732   6.604  1.00  0.00           O
ATOM     17  N   SER A   5       1.177  11.808   6.962  1.00  0.00           N
ATOM     18  CA  SER A   5       1.805  13.120   7.134  1.00  0.00           C
ATOM     19  C   SER A   5       0.931  14.011   8.028  1.00  0.00           C
ATOM     20  O   SER A   5      -0.258  13.748   8.170  1.00  0.00           O
END`;
	let proteinStyle: 'cartoon'|'stick'|'sphere'|'line' = $state('cartoon');
	let proteinColor: 'spectrum'|'chain'|'secondary'|'element' = $state('spectrum');
	let proteinSpin = $state(false);

	// ========== DIFF DATA ==========
	const diffSeqA = 'ATGCGATCGATCGATCGATCGATCGATCGATCGATCG';
	const diffSeqB = 'ATGCGATTGATCAATCGATC---GATCGATCAATCGATCGATCG';
	const diffFeatA: Part[] = [
		{ name: 'CDS', type: 'CDS', start: 0, end: 36, strand: 1, color: '#4dc3ff' },
	];
	const diffFeatB: Part[] = [
		{ name: 'CDS', type: 'CDS', start: 0, end: 18, strand: 1, color: '#4dc3ff' },
		{ name: 'Insert', type: 'misc_feature', start: 18, end: 25, strand: 1, color: '#58b56a' },
		{ name: 'CDS-2', type: 'CDS', start: 25, end: 44, strand: 1, color: '#4dc3ff' },
	];

	// ========== CHARTS DATA ==========
	const doseResponseCurves:DoseResponseCurveData[]=[
		{label:'Compound A',points:[{x:0.001,y:98},{x:0.003,y:97},{x:0.01,y:95},{x:0.03,y:88},{x:0.1,y:72},{x:0.3,y:42},{x:1,y:18},{x:3,y:8},{x:10,y:5}],
		fit:{line:Array.from({length:100},(_,i)=>{const x=0.0001*Math.pow(10,i*5/99);return{x,y:5+(98-5)/(1+Math.pow(x/0.35,1.2))};}),params:{top:98,bottom:5,ic50:0.35,hillSlope:-1.2},r2:0.997,ci95:{ic50:[0.28,0.43] as [number,number]}}},
		{label:'Compound B',points:[{x:0.001,y:99},{x:0.01,y:96},{x:0.1,y:90},{x:0.3,y:75},{x:1,y:50},{x:3,y:25},{x:10,y:12},{x:30,y:8}],
		fit:{line:Array.from({length:100},(_,i)=>{const x=0.0001*Math.pow(10,i*5.5/99);return{x,y:8+(99-8)/(1+Math.pow(x/1.1,1.0))};}),params:{top:99,bottom:8,ic50:1.1,hillSlope:-1.0},r2:0.994}},
	];
	const chromTraces=[
		{name:'UV 280nm',x:Array.from({length:200},(_,i)=>i*0.15),y:Array.from({length:200},(_,i)=>{const x=i*0.15;return 20*Math.exp(-((x-8)**2)/1.5)+80*Math.exp(-((x-12)**2)/2)+5*Math.exp(-((x-18)**2)/3);}),unit:'mAU'},
		{name:'% Buffer B',x:Array.from({length:200},(_,i)=>i*0.15),y:Array.from({length:200},(_,i)=>Math.min(100,Math.max(0,(i-50)*0.8))),yAxis:'right' as const,color:'#ff7f00',unit:'%B'},
	];
	const chromFractions=[{name:'F1',start:6,end:10,color:'#4daf4a'},{name:'F2',start:10,end:15,color:'#e41a1c'},{name:'F3',start:16,end:20,color:'#377eb8'}];
	const plateWells=(()=>{const w=[];for(let r=0;r<8;r++)for(let c=0;c<12;c++){const id=String.fromCharCode(65+r)+(c+1);let v=Math.random()*100,g='sample';if(c===0){v=95+Math.random()*5;g='positive';}if(c===11){v=Math.random()*8;g='negative';}w.push({id,value:v,group:g});}return w;})();
	let plateColorScale: 'viridis'|'plasma'|'blues'|'reds' = $state('viridis');

	const growthSeries=[{name:'OD600',x:Array.from({length:25},(_,i)=>i),y:Array.from({length:25},(_,i)=>0.05*Math.exp(0.3*Math.min(i,12))/(1+(0.05/2.0)*(Math.exp(0.3*Math.min(i,12))-1))+(Math.random()-0.5)*0.02),unit:'OD600'}];
	const specX=Array.from({length:200},(_,i)=>200+i*2);
	const specY=specX.map(w=>0.8*Math.exp(-((w-280)**2)/400)+0.3*Math.exp(-((w-220)**2)/200));
	const meltCurves=[
		{name:'Protein A',temp:Array.from({length:80},(_,i)=>25+i),ratio:Array.from({length:80},(_,i)=>0.6+0.3/(1+Math.exp(-(25+i-58)/2))),derivative:Array.from({length:80},(_,i)=>{const e=Math.exp(-(25+i-58)/2);return 0.3*e/(2*(1+e)**2);}),tm:58},
		{name:'Protein B',temp:Array.from({length:80},(_,i)=>25+i),ratio:Array.from({length:80},(_,i)=>0.55+0.35/(1+Math.exp(-(25+i-72)/3))),derivative:Array.from({length:80},(_,i)=>{const e=Math.exp(-(25+i-72)/3);return 0.35*e/(3*(1+e)**2);}),tm:72},
	];
	const volcanoPoints=Array.from({length:200},(_,i)=>{const x=(Math.random()-0.5)*8,y=Math.random()*6;return{x,y,label:Math.abs(x)>1&&y>1.3?`Gene${i}`:undefined,significant:Math.abs(x)>1&&y>1.3};});
	const heatRows=['Gene1','Gene2','Gene3','Gene4','Gene5','Gene6','Gene7','Gene8'];
	const heatCols=['WT','KO_1','KO_2','OE_1','OE_2','Drug_1','Drug_2'];
	const heatValues=heatRows.map(()=>heatCols.map(()=>(Math.random()-0.5)*4));
	let heatColorScale: 'diverging'|'viridis'|'blues'|'reds' = $state('diverging');

	const logoPositions=[
		{A:0.1,C:0.1,G:0.1,T:0.7},{A:0.8,C:0.05,G:0.1,T:0.05},{A:0.05,C:0.05,G:0.05,T:0.85},{A:0.9,C:0.03,G:0.04,T:0.03},
		{A:0.25,C:0.25,G:0.25,T:0.25},{A:0.05,C:0.8,G:0.1,T:0.05},{A:0.05,C:0.05,G:0.85,T:0.05},{A:0.1,C:0.1,G:0.7,T:0.1},
		{A:0.6,C:0.15,G:0.15,T:0.1},{A:0.25,C:0.25,G:0.25,T:0.25},
	];
	const kineticsCurves=[100,50,25,12.5].map(conc=>{const x=Array.from({length:200},(_,i)=>i*0.5);const ka=1e5,kd=1e-3,rmax=80;const y=x.map(t=>{const cM=conc*1e-9;if(t<30)return 0;if(t<130){const tA=t-30;return rmax*cM*ka/(cM*ka+kd)*(1-Math.exp(-(cM*ka+kd)*tA));}const tA=100;const rEq=rmax*cM*ka/(cM*ka+kd)*(1-Math.exp(-(cM*ka+kd)*tA));return rEq*Math.exp(-kd*(t-130));});return{name:`${conc} nM`,concentration:conc*1e-9,x,y};});
	const compositionCounts={A:58,T:42,G:55,C:48};
	let compAlphabet: 'dna'|'rna'|'protein' = $state('dna');

	// Navigation
	const sections = [
		{ id: 'plasmid', label: 'Plasmid' }, { id: 'sequence', label: 'Sequence' },
		{ id: 'gel', label: 'Gel' }, { id: 'trace', label: 'Trace' },
		{ id: 'alignment', label: 'Alignment' }, { id: 'protein', label: 'Protein 3D' },
		{ id: 'restriction', label: 'Restriction Map' }, { id: 'diff', label: 'Construct Diff' },
		{ id: 'composition', label: 'Composition' },
		{ id: 'dose', label: 'Dose-Response' }, { id: 'chrom', label: 'Chromatogram' },
		{ id: 'plate', label: 'Plate Heatmap' }, { id: 'growth', label: 'Growth Curve' },
		{ id: 'spectrum', label: 'Spectrum' }, { id: 'melting', label: 'Melting Curve' },
		{ id: 'volcano', label: 'Volcano Plot' }, { id: 'heatmap', label: 'Heatmap' },
		{ id: 'seqlogo', label: 'Seq Logo' }, { id: 'kinetics', label: 'Kinetics (SPR)' },
	];
</script>

<div class="page">
	<nav class="toc">
		{#each sections as s}
			<a href="#{s.id}">{s.label}</a>
		{/each}
	</nav>

	<!-- =============================== PLASMID =============================== -->
	<section id="plasmid" class="component-row">
		<div class="info-col">
			<h2>PlasmidViewer</h2>
			<p>Circular plasmid map with feature stacking, tapered directional arcs, internal textPath labels, and relaxed outer label layout with polyline connectors.</p>
			<p class="data-note">pBR322 (4361 bp) &mdash; AmpR, TetR, ori, rop, bla</p>
		</div>
		<div class="component-col">
			<PlasmidViewer name="pBR322" size={4361} topology={plasmidTopology} parts={plasmidParts} cutSites={plasmidCutSites} selectionState={sharedSelection} showLabels={plasmidShowLabels} showTicks={plasmidShowTicks} showInternalLabels={plasmidShowInternal} width={500} height={500} onhoverinfo={(info) => hoverInfo = info} />
		</div>
		<div class="controls-col">
			<label>Topology <select bind:value={plasmidTopology}><option value="circular">Circular</option><option value="linear">Linear</option></select></label>
			<label><input type="checkbox" bind:checked={plasmidShowLabels} /> Labels</label>
			<label><input type="checkbox" bind:checked={plasmidShowTicks} /> Tick marks</label>
			<label><input type="checkbox" bind:checked={plasmidShowInternal} /> Internal labels</label>
		</div>
	</section>

	<!-- =============================== SEQUENCE =============================== -->
	<section id="sequence" class="component-row">
		<div class="info-col">
			<h2>SequenceViewer</h2>
			<p>Linear sequence display with multi-track annotations, translations, primers, cut sites, virtual scrolling, and multi-alphabet support (DNA/RNA/protein).</p>
			<p class="data-note">pBR322 ({sequence.length} bp) &mdash; synced with PlasmidViewer</p>
		</div>
		<div class="component-col">
			<SequenceViewer seq={sequence} alphabet={seqAlphabet} parts={seqParts} cutSites={seqCutSites} translations={seqTranslations} selectionState={sharedSelection} showAnnotations={seqShowAnnotations} showTranslations={seqShowTranslations} showNumbers={seqShowNumbers} showComplement={seqShowComplement} colorBases={seqColorBases} width={560} height={350} charsPerRow={50} onhoverinfo={(info) => hoverInfo = info} />
		</div>
		<div class="controls-col">
			<label>Alphabet <select bind:value={seqAlphabet}><option value="dna">DNA</option><option value="rna">RNA</option><option value="protein">Protein</option></select></label>
			<label><input type="checkbox" bind:checked={seqShowAnnotations} /> Annotations</label>
			<label><input type="checkbox" bind:checked={seqShowTranslations} /> Translations</label>
			<label><input type="checkbox" bind:checked={seqShowNumbers} /> Line numbers</label>
			<label><input type="checkbox" bind:checked={seqShowComplement} /> Complement</label>
			<label><input type="checkbox" bind:checked={seqColorBases} /> Color bases</label>
		</div>
	</section>

	<!-- =============================== GEL =============================== -->
	<section id="gel" class="component-row">
		<div class="info-col">
			<h2>GelViewer</h2>
			<p>Realistic gel electrophoresis visualization with multiple stain types, band styles, and size markers.</p>
			<p class="data-note">pUC19 restriction digest, 1% agarose</p>
		</div>
		<div class="component-col">
			<GelViewer lanes={gelLanes} gelType="agarose" stain={gelStain} showSizeLabels={gelShowSizeLabels} showLaneLabels={true} bandStyle={gelBandStyle} width={380} height={440} onhoverinfo={(info) => hoverInfo = info} />
		</div>
		<div class="controls-col">
			<label>Ladder <select bind:value={selectedLadder}><option value="1kb">1 kb</option><option value="100bp">100 bp</option><option value="1kb+">1 kb Plus</option></select></label>
			<label>Band style <select bind:value={gelBandStyle}><option value="realistic">Realistic</option><option value="simple">Simple</option></select></label>
			<label>Stain <select bind:value={gelStain}><option value="ethidium">Ethidium</option><option value="sybr-safe">SYBR Safe</option><option value="sybr-gold">SYBR Gold</option><option value="coomassie">Coomassie</option><option value="silver">Silver</option></select></label>
			<label><input type="checkbox" bind:checked={gelShowSizeLabels} /> Size labels</label>
		</div>
	</section>

	<!-- =============================== TRACE =============================== -->
	<section id="trace" class="component-row">
		<div class="info-col">
			<h2>TraceViewer</h2>
			<p>Sanger sequencing chromatogram viewer with 4-channel peaks, quality scores, and reference alignment overlay.</p>
			<p class="data-note">{numBases} bases, simulated AB1 data</p>
		</div>
		<div class="component-col">
			<TraceViewer baseCalls={baseCalls} qualityScores={qualityScores} channels={traceChannels} peakPositions={peakPositions} alignment={traceAlignment} width={560} height={260} showQuality={traceShowQuality} trimQuality={traceTrimQ} zoom={traceZoom} onhoverinfo={(info) => hoverInfo = info} />
		</div>
		<div class="controls-col">
			<label>Zoom <input type="range" min="0.5" max="10" step="0.1" bind:value={traceZoom} /><span class="val">{traceZoom.toFixed(1)}x</span></label>
			<label>Trim Q <input type="range" min="0" max="50" step="1" bind:value={traceTrimQ} /><span class="val">Q{traceTrimQ}</span></label>
			<label><input type="checkbox" bind:checked={traceShowQuality} /> Quality sidebar</label>
		</div>
	</section>

	<!-- =============================== ALIGNMENT =============================== -->
	<section id="alignment" class="component-row">
		<div class="info-col">
			<h2>AlignmentViewer</h2>
			<p>Canvas-rendered multiple sequence alignment with per-position conservation bar, virtual scrolling, and synced name panel.</p>
			<p class="data-note">Hemoglobin alpha, 5 species</p>
		</div>
		<div class="component-col">
			<AlignmentViewer sequences={alignSeqs} alphabet="protein" conservation={alignCons} width={560} height={170} cellWidth={alignCellW} cellHeight={18} showConservation={alignShowConservation} showNames={alignShowNames} />
		</div>
		<div class="controls-col">
			<label>Cell width <input type="range" min="4" max="16" step="1" bind:value={alignCellW} /><span class="val">{alignCellW}px</span></label>
			<label><input type="checkbox" bind:checked={alignShowConservation} /> Conservation</label>
			<label><input type="checkbox" bind:checked={alignShowNames} /> Names</label>
		</div>
	</section>

	<!-- =============================== PROTEIN =============================== -->
	<section id="protein" class="component-row">
		<div class="info-col">
			<h2>ProteinViewer</h2>
			<p>3D protein structure viewer powered by 3Dmol.js with dynamic import (SSR-safe). Supports cartoon, stick, sphere, line styles.</p>
			<p class="data-note">Demo peptide ALA-GLY-VAL-LEU-SER</p>
		</div>
		<div class="component-col">
			<ProteinViewer pdbData={demoPdb} name="Demo Peptide" style={proteinStyle} colorScheme={proteinColor} spin={proteinSpin} width={440} height={360} />
		</div>
		<div class="controls-col">
			<label>Style <select bind:value={proteinStyle}><option value="cartoon">Cartoon</option><option value="stick">Stick</option><option value="sphere">Sphere</option><option value="line">Line</option></select></label>
			<label>Color <select bind:value={proteinColor}><option value="spectrum">Spectrum</option><option value="chain">Chain</option><option value="secondary">Secondary</option><option value="element">Element</option></select></label>
			<label><input type="checkbox" bind:checked={proteinSpin} /> Spin</label>
		</div>
	</section>

	<!-- =============================== RESTRICTION MAP =============================== -->
	<section id="restriction" class="component-row">
		<div class="info-col">
			<h2>RestrictionMap</h2>
			<p>Linear restriction enzyme map with staggered cut site labels above/below the backbone and feature blocks.</p>
			<p class="data-note">pUC19 EcoRI, BamHI, HindIII</p>
		</div>
		<div class="component-col">
			<RestrictionMap length={2686} cutSites={plasmidCutSites} features={plasmidParts} width={560} height={170} />
		</div>
		<div class="controls-col">
			<p class="hint">No interactive controls &mdash; data-driven display</p>
		</div>
	</section>

	<!-- =============================== DIFF =============================== -->
	<section id="diff" class="component-row">
		<div class="info-col">
			<h2>DiffViewer</h2>
			<p>Construct-level comparison view showing two sequences side by side with matching regions, mismatches, insertions, and deletions connected visually.</p>
			<p class="data-note">Wild-type vs mutant construct with insertion</p>
		</div>
		<div class="component-col">
			<DiffViewer seqA={diffSeqA} seqB={diffSeqB} nameA="Wild-type" nameB="Mutant + insert" featuresA={diffFeatA} featuresB={diffFeatB} alphabet="dna" width={560} />
		</div>
		<div class="controls-col">
			<p class="hint">No interactive controls &mdash; data-driven display</p>
		</div>
	</section>

	<!-- =============================== COMPOSITION =============================== -->
	<section id="composition" class="component-row">
		<div class="info-col">
			<h2>CompositionChart</h2>
			<p>Donut chart for GC content plus horizontal bar chart showing per-residue counts and percentages.</p>
			<p class="data-note">{Object.values(compositionCounts).reduce((a,b)=>a+b,0)} bp sample</p>
		</div>
		<div class="component-col">
			<CompositionChart counts={compositionCounts} alphabet={compAlphabet} gc={0.507} width={440} height={130} />
		</div>
		<div class="controls-col">
			<label>Alphabet <select bind:value={compAlphabet}><option value="dna">DNA</option><option value="rna">RNA</option><option value="protein">Protein</option></select></label>
		</div>
	</section>

	<!-- =============================== CHARTS =============================== -->

	<section id="dose" class="component-row">
		<div class="info-col"><h2>DoseResponseCurve</h2><p>Log-scale dose-response with 4-parameter fit curves, IC50 markers, and confidence intervals.</p></div>
		<div class="component-col"><DoseResponseCurve curves={doseResponseCurves} xLabel="Concentration (\u00B5M)" yLabel="% Viability" onhoverinfo={(info) => hoverInfo = info} /></div>
		<div class="controls-col"><p class="hint">Data-driven display</p></div>
	</section>

	<section id="chrom" class="component-row">
		<div class="info-col"><h2>ChromatogramViewer</h2><p>SEC/HPLC chromatogram with dual Y axes, gradient overlay, and fraction highlighting.</p></div>
		<div class="component-col"><ChromatogramViewer traces={chromTraces} fractions={chromFractions} xLabel="Volume (mL)" onhoverinfo={(info) => hoverInfo = info} /></div>
		<div class="controls-col"><p class="hint">Data-driven display</p></div>
	</section>

	<section id="plate" class="component-row">
		<div class="info-col"><h2>PlateHeatmap</h2><p>96/384-well plate heatmap with well grouping, Z-factor, and configurable color scale.</p></div>
		<div class="component-col"><PlateHeatmap format={96} wells={plateWells} zFactor={0.62} title="Viability Assay" colorScale={plateColorScale} onhoverinfo={(info) => hoverInfo = info} /></div>
		<div class="controls-col"><label>Color scale <select bind:value={plateColorScale}><option value="viridis">Viridis</option><option value="plasma">Plasma</option><option value="blues">Blues</option><option value="reds">Reds</option></select></label></div>
	</section>

	<section id="growth" class="component-row">
		<div class="info-col"><h2>TimeSeriesPlot</h2><p>Time-series line chart for growth curves, kinetic reads, and multi-series data.</p></div>
		<div class="component-col"><TimeSeriesPlot series={growthSeries} xLabel="Time (h)" showPoints={true} onhoverinfo={(info) => hoverInfo = info} /></div>
		<div class="controls-col"><p class="hint">Data-driven display</p></div>
	</section>

	<section id="spectrum" class="component-row">
		<div class="info-col"><h2>SpectrumViewer</h2><p>UV/Vis absorption spectrum with annotated peaks and axis labels.</p></div>
		<div class="component-col"><SpectrumViewer x={specX} y={specY} peaks={[{x:280,y:0.8,label:'A280'},{x:220,y:0.3,label:'A220'}]} xLabel="Wavelength (nm)" yLabel="Absorbance (AU)" title="BSA UV Spectrum" onhoverinfo={(info) => hoverInfo = info} /></div>
		<div class="controls-col"><p class="hint">Data-driven display</p></div>
	</section>

	<section id="melting" class="component-row">
		<div class="info-col"><h2>MeltingCurve</h2><p>Thermal stability (nanoDSF) with ratio and derivative curves, Tm markers.</p></div>
		<div class="component-col"><MeltingCurve curves={meltCurves} onhoverinfo={(info) => hoverInfo = info} /></div>
		<div class="controls-col"><p class="hint">Data-driven display</p></div>
	</section>

	<section id="volcano" class="component-row">
		<div class="info-col"><h2>VolcanoPlot</h2><p>Differential expression volcano with fold-change vs significance, threshold lines, and gene labels.</p></div>
		<div class="component-col"><VolcanoPlot points={volcanoPoints} onhoverinfo={(info) => hoverInfo = info} /></div>
		<div class="controls-col"><p class="hint">Data-driven display</p></div>
	</section>

	<section id="heatmap" class="component-row">
		<div class="info-col"><h2>HeatmapViewer</h2><p>Clustered expression heatmap with row/column labels and diverging color scale.</p></div>
		<div class="component-col"><HeatmapViewer rows={heatRows} cols={heatCols} values={heatValues} colorScale={heatColorScale} onhoverinfo={(info) => hoverInfo = info} /></div>
		<div class="controls-col"><label>Color scale <select bind:value={heatColorScale}><option value="diverging">Diverging</option><option value="viridis">Viridis</option><option value="blues">Blues</option><option value="reds">Reds</option></select></label></div>
	</section>

	<section id="seqlogo" class="component-row">
		<div class="info-col"><h2>SeqLogo</h2><p>Sequence logo showing position-specific nucleotide frequencies (information content).</p></div>
		<div class="component-col"><SeqLogo positions={logoPositions} title="TATA Box Motif" /></div>
		<div class="controls-col"><p class="hint">Data-driven display</p></div>
	</section>

	<section id="kinetics" class="component-row">
		<div class="info-col"><h2>BindingKineticsViewer</h2><p>SPR/BLI sensorgram with association/dissociation phases and kinetic parameters.</p></div>
		<div class="component-col">
			<BindingKineticsViewer curves={kineticsCurves} steps={[{name:'Baseline',start:0,end:30,type:'baseline'},{name:'Association',start:30,end:130,type:'association'},{name:'Dissociation',start:130,end:200,type:'dissociation'}]} params={{ka:1e5,kd:1e-3,KD:1e-8}} onhoverinfo={(info) => hoverInfo = info} />
		</div>
		<div class="controls-col"><p class="hint">Data-driven display</p></div>
	</section>

	<!-- Universal hover InfoBox -->
	<InfoBox
		visible={!!hoverInfo}
		x={hoverInfo?.position.x ?? 0}
		y={hoverInfo?.position.y ?? 0}
		title={hoverInfo?.title}
		items={hoverInfo?.items ?? []}
	/>
</div>

<style>
	.page {
		max-width: 1280px;
		margin: 0 auto;
		padding: 16px 24px 80px;
	}

	/* Table-of-contents nav */
	.toc {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-bottom: 32px;
		padding: 10px 12px;
		background: var(--hatch-plot-bg, #141c26);
		border: 1px solid var(--hatch-border, #2a3848);
		border-radius: 8px;
	}
	.toc a {
		padding: 3px 9px;
		font-size: 11px;
		color: var(--hatch-text-muted, #8a95a5);
		text-decoration: none;
		background: var(--hatch-grid-color, #1e2a38);
		border-radius: 4px;
		font-family: 'SF Mono', 'Fira Code', monospace;
		transition: background 0.12s, color 0.12s;
	}
	.toc a:hover { background: var(--hatch-border, #2a3848); color: var(--hatch-highlight, #6ab8e0); }

	/* Each component row: 3-column grid */
	.component-row {
		display: grid;
		grid-template-columns: 220px 1fr 180px;
		gap: 20px;
		align-items: start;
		padding: 20px 0;
		border-bottom: 1px solid var(--hatch-border, #2a3848);
		scroll-margin-top: 16px;
	}

	/* Info column */
	.info-col h2 {
		font-size: 16px;
		font-weight: 700;
		color: var(--hatch-text, #d4dce6);
		margin: 0 0 6px;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}
	.info-col p {
		font-size: 12px;
		color: var(--hatch-text-muted, #8a95a5);
		line-height: 1.5;
		margin: 0 0 6px;
	}
	.data-note {
		font-size: 11px !important;
		color: var(--hatch-text-dim, #566070) !important;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	/* Component column */
	.component-col {
		overflow-x: auto;
		min-width: 0;
	}

	/* Controls column */
	.controls-col {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.controls-col label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--hatch-text-muted, #8a95a5);
		cursor: pointer;
		user-select: none;
		flex-wrap: wrap;
	}
	.controls-col input[type='checkbox'] {
		accent-color: var(--hatch-highlight, #6ab8e0);
		width: 14px;
		height: 14px;
	}
	.controls-col select {
		background: var(--hatch-grid-color, #1e2a38);
		color: var(--hatch-text, #d4dce6);
		border: 1px solid var(--hatch-border, #2a3848);
		border-radius: 4px;
		padding: 2px 6px;
		font-size: 11px;
	}
	.controls-col input[type='range'] {
		width: 80px;
		accent-color: var(--hatch-highlight, #6ab8e0);
	}
	.val {
		font-size: 11px;
		color: var(--hatch-highlight, #6ab8e0);
		font-family: 'SF Mono', 'Fira Code', monospace;
		min-width: 30px;
	}
	.hint {
		font-size: 11px;
		color: var(--hatch-text-dim, #566070);
		margin: 0;
		font-style: italic;
	}

</style>
