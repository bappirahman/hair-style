/**
 * The hairstyle catalog's geometry — 45 specs, one per overlay asset.
 *
 * Adding a hairstyle means adding one entry here and one markdown file in
 * `src/content/hairstyles/`, matched by id. No page, route or component needs
 * to change.
 *
 * Reading the numbers: `thickness` is how far hair stands off the scalp in
 * pixels, at each angle around the head (0 = viewer's right, 90 = crown,
 * 180 = viewer's left). ~3px is skin, ~10px is a buzz, ~35px is a typical
 * short cut's top, 90px is an afro. `fringe` is how far hair hangs below the
 * natural hairline, keyed by horizontal position from -1 (left temple) to 1.
 */

import { sym, type HairPalette, type StyleSpec } from './spec.ts';

const PALETTES: Record<string, HairPalette> = {
	espresso: {
		deep: '#0d0906',
		mid: '#2e1f14',
		light: '#5c3d24',
		sheen: '#9a6c40',
		spec: '#d9ac74',
	},
	jet: {
		deep: '#07070a',
		mid: '#17171f',
		light: '#2f3140',
		sheen: '#5a5d72',
		spec: '#9ea2ba',
	},
	chestnut: {
		deep: '#170e07',
		mid: '#3d2714',
		light: '#6f4826',
		sheen: '#a97a45',
		spec: '#e0bb85',
	},
	sand: {
		deep: '#2a1d0e',
		mid: '#553c1d',
		light: '#8a6531',
		sheen: '#c39a58',
		spec: '#eed9a6',
	},
};

const p = (name: keyof typeof PALETTES) => PALETTES[name]!;

export const STYLE_SPECS: StyleSpec[] = [
	// ---- Fades ----------------------------------------------------------
	{
		id: 'low-fade',
		thickness: sym([[90, 34], [110, 33], [130, 30], [145, 26], [158, 18], [168, 10], [178, 5], [190, 3], [205, 2]]),
		texture: 'straight', flow: 'back', sideburn: 16, skinFade: true, palette: p('espresso'),
	},
	{
		id: 'mid-fade',
		thickness: sym([[90, 34], [110, 32], [128, 27], [142, 18], [154, 10], [166, 5], [180, 3], [205, 2]]),
		texture: 'straight', flow: 'back', sideburn: 12, skinFade: true, palette: p('espresso'),
	},
	{
		id: 'high-fade',
		thickness: sym([[90, 36], [105, 33], [118, 26], [130, 15], [142, 7], [155, 3], [175, 2], [205, 1.5]]),
		texture: 'straight', flow: 'back', sideburn: 8, skinFade: true, palette: p('jet'),
	},
	{
		id: 'skin-fade',
		thickness: sym([[90, 32], [104, 29], [116, 21], [128, 10], [138, 4], [150, 1.5], [175, 1], [205, 0.8]]),
		texture: 'cropped', flow: 'forward', sideburn: 4, skinFade: true, palette: p('espresso'),
	},
	{
		id: 'drop-fade',
		thickness: sym([[90, 34], [110, 32], [126, 27], [140, 19], [152, 11], [164, 5], [176, 4], [190, 5], [205, 4]]),
		texture: 'straight', flow: 'back', sideburn: 14, skinFade: true, palette: p('espresso'),
	},
	{
		id: 'burst-fade',
		thickness: sym([[90, 38], [110, 36], [130, 32], [148, 26], [162, 16], [172, 7], [182, 3], [196, 2], [205, 2]]),
		texture: 'straight', flow: 'back', sideburn: 10, skinFade: true, palette: p('jet'),
	},

	// ---- Tapers ---------------------------------------------------------
	{
		id: 'low-taper-fade',
		thickness: sym([[90, 32], [115, 31], [135, 28], [152, 23], [166, 14], [178, 7], [190, 4], [205, 3]]),
		texture: 'straight', flow: 'forward', sideburn: 20, palette: p('espresso'),
		skinFade: true,
	},
	{
		id: 'mid-taper-fade',
		thickness: sym([[90, 32], [112, 30], [130, 26], [146, 19], [160, 11], [172, 5], [186, 3], [205, 2.5]]),
		texture: 'straight', flow: 'forward', sideburn: 16, palette: p('espresso'),
		skinFade: true,
	},
	{
		id: 'high-taper-fade',
		thickness: sym([[90, 34], [106, 32], [120, 27], [134, 18], [148, 9], [160, 4], [178, 2.5], [205, 2]]),
		texture: 'straight', flow: 'back', sideburn: 10, skinFade: true, palette: p('jet'),
	},
	{
		id: 'classic-taper',
		thickness: sym([[90, 36], [115, 34], [138, 30], [156, 24], [170, 17], [182, 11], [194, 7], [205, 5]]),
		texture: 'straight', flow: 'side', focus: 120, part: 126, sideburn: 30, palette: p('chestnut'),
		skinFade: true,
	},
	{
		id: 'temple-fade',
		thickness: sym([[90, 34], [112, 33], [132, 30], [150, 25], [164, 14], [174, 6], [186, 6], [198, 8], [205, 7]]),
		texture: 'straight', flow: 'forward', sideburn: 22, palette: p('jet'),
		skinFade: true,
	},

	// ---- Buzz -----------------------------------------------------------
	{
		id: 'buzz-cut',
		thickness: sym([[90, 10], [120, 10], [150, 9], [175, 7], [190, 6], [205, 5]]),
		texture: 'cropped', flow: 'forward', density: 0.8, sideburn: 14, sheenStrength: 0.5, palette: p('espresso'),
	},
	{
		id: 'induction-cut',
		thickness: sym([[90, 4.5], [120, 4.5], [150, 4], [175, 3.5], [205, 3]]),
		texture: 'cropped', flow: 'forward', density: 0.6, sideburn: 8, sheenStrength: 0.35, palette: p('jet'),
	},
	{
		id: 'crew-cut',
		thickness: sym([[90, 22], [110, 21], [132, 18], [150, 13], [166, 8], [180, 5], [205, 4]]),
		texture: 'cropped', flow: 'forward', density: 0.9, sideburn: 18, palette: p('chestnut'),
		skinFade: true,
	},

	// ---- Crops ----------------------------------------------------------
	{
		id: 'french-crop',
		thickness: sym([[90, 28], [112, 27], [134, 23], [152, 16], [166, 9], [180, 5], [205, 4]]),
		fringe: [[-1, 20], [-0.75, 52], [-0.4, 84], [0, 90], [0.4, 84], [0.75, 52], [1, 20]],
		texture: 'straight', flow: 'forward', part: false, sideburn: 14, palette: p('espresso'),
		skinFade: true,
	},
	{
		id: 'textured-crop',
		thickness: sym([[90, 34], [110, 33], [132, 27], [150, 18], [164, 10], [178, 5], [205, 4]]),
		fringe: [[-1, 18], [-0.7, 48], [-0.3, 76], [0, 82], [0.3, 78], [0.7, 50], [1, 18]],
		texture: 'straight', flow: 'forward', part: false, curlAmp: 6, sideburn: 14, palette: p('chestnut'),
		skinFade: true,
	},
	{
		id: 'caesar-cut',
		thickness: sym([[90, 24], [115, 23], [138, 20], [156, 14], [170, 8], [184, 5], [205, 4]]),
		fringe: [[-1, 26], [-0.6, 66], [0, 72], [0.6, 66], [1, 26]],
		texture: 'straight', flow: 'forward', part: false, sideburn: 16, palette: p('espresso'),
		skinFade: true,
	},
	{
		id: 'edgar-cut',
		thickness: sym([[90, 26], [104, 25], [118, 20], [132, 10], [144, 4], [158, 2], [180, 1.5], [205, 1.5]]),
		fringe: [[-1, 58], [-0.8, 72], [-0.5, 76], [0, 76], [0.5, 76], [0.8, 72], [1, 58]],
		texture: 'straight', flow: 'forward', part: false, sideburn: 6, skinFade: true, palette: p('jet'),
	},

	// ---- Undercuts ------------------------------------------------------
	{
		id: 'undercut',
		thickness: sym([[90, 44], [110, 43], [126, 40], [136, 38], [141, 10], [150, 7], [168, 5], [186, 4], [205, 3]]),
		texture: 'straight', flow: 'back', sideburn: 8, sheenAt: 0.34, palette: p('espresso'),
		skinFade: true,
	},
	{
		id: 'disconnected-undercut',
		thickness: sym([[90, 52], [108, 51], [124, 49], [134, 47], [138, 8], [150, 6], [170, 4], [205, 3]]),
		texture: 'straight', flow: 'back', sideburn: 6, sheenAt: 0.3, palette: p('jet'),
	},
	{
		id: 'slicked-back-undercut',
		thickness: sym([[90, 44], [108, 43], [124, 40], [134, 36], [139, 9], [152, 6], [172, 4], [205, 3]]),
		texture: 'straight', flow: 'back', sideburn: 6, sheenAt: 0.26, sheenStrength: 1, palette: p('espresso'),
	},

	// ---- Pompadours and quiffs -------------------------------------------
	{
		id: 'pompadour',
		thickness: sym([[90, 108], [100, 103], [112, 84], [124, 54], [136, 30], [148, 15], [160, 8], [176, 5], [205, 4]]),
		texture: 'straight', flow: 'back', sideburn: 18, sheenAt: 0.3, sheenStrength: 1, palette: p('jet'),
	},
	{
		id: 'modern-pompadour',
		thickness: sym([[90, 88], [100, 84], [112, 66], [124, 40], [136, 18], [148, 7], [166, 3], [205, 2.5]]),
		texture: 'straight', flow: 'back', sideburn: 8, sheenAt: 0.32, sheenStrength: 0.95, skinFade: true, palette: p('espresso'),
	},
	{
		id: 'quiff',
		thickness: sym([[90, 78], [104, 73], [118, 56], [132, 36], [148, 20], [164, 10], [180, 5], [205, 4]]),
		texture: 'straight', flow: 'back', sideburn: 14, sheenAt: 0.36, palette: p('chestnut'),
		skinFade: true,
	},
	{
		id: 'textured-quiff',
		thickness: sym([[90, 74], [104, 69], [118, 52], [132, 32], [148, 17], [164, 8], [180, 4], [205, 3.5]]),
		texture: 'straight', flow: 'back', curlAmp: 7, sideburn: 12, sheenAt: 0.4, palette: p('sand'),
		skinFade: true,
	},

	// ---- Slick back and side part ----------------------------------------
	{
		id: 'slick-back',
		thickness: sym([[90, 42], [110, 41], [130, 36], [148, 28], [162, 18], [176, 11], [190, 7], [205, 6]]),
		texture: 'straight', flow: 'back', sideburn: 22, sheenAt: 0.28, sheenStrength: 1, palette: p('jet'),
		skinFade: true,
	},
	{
		id: 'side-part',
		thickness: [[-14, 5], [0, 8], [16, 16], [34, 30], [52, 42], [68, 50], [82, 52], [94, 50], [108, 42], [122, 32], [136, 22], [150, 14], [164, 8], [180, 5], [194, 4]],
		texture: 'straight', flow: 'side', focus: 128, part: 128, sideburn: 24, sheenAt: 0.32, sheenStrength: 0.95, palette: p('chestnut'),
		skinFade: true,
	},

	// ---- Curtains and fringes --------------------------------------------
	{
		id: 'curtains',
		thickness: sym([[90, 40], [108, 40], [126, 38], [144, 34], [158, 26], [170, 18], [184, 12], [205, 10]]),
		fringe: [[-1, 48], [-0.7, 96], [-0.35, 100], [-0.1, 88], [0, 80], [0.1, 88], [0.35, 100], [0.7, 96], [1, 48]],
		texture: 'straight', flow: 'down', part: 90, sideburn: 26, palette: p('chestnut'),
	},
	{
		id: 'middle-part',
		thickness: sym([[90, 44], [108, 44], [126, 42], [144, 38], [158, 32], [172, 24], [186, 18], [205, 15]]),
		fringe: [[-1, 62], [-0.7, 122], [-0.35, 128], [-0.1, 110], [0, 98], [0.1, 110], [0.35, 128], [0.7, 122], [1, 62]],
		texture: 'straight', flow: 'down', part: 90, sideburn: 28, drape: 40, palette: p('espresso'),
	},
	{
		id: 'messy-fringe',
		thickness: sym([[90, 44], [110, 42], [130, 36], [148, 26], [162, 15], [176, 8], [190, 5], [205, 4]]),
		fringe: [[-1, 24], [-0.7, 66], [-0.4, 96], [-0.1, 104], [0.2, 98], [0.5, 86], [0.8, 54], [1, 22]],
		texture: 'straight', flow: 'forward', part: false, curlAmp: 8, sideburn: 16, palette: p('sand'),
		skinFade: true,
	},
	{
		id: 'side-swept-fringe',
		thickness: [[-14, 4], [0, 7], [18, 16], [36, 28], [54, 38], [72, 44], [90, 46], [106, 44], [122, 38], [138, 28], [152, 17], [168, 9], [182, 5], [194, 4]],
		fringe: [[-1, 16], [-0.6, 48], [-0.2, 86], [0.2, 100], [0.6, 86], [1, 34]],
		texture: 'straight', flow: 'side', focus: 120, part: 120, sideburn: 18, palette: p('chestnut'),
	},

	// ---- Long ------------------------------------------------------------
	{
		id: 'long-layers',
		thickness: sym([[90, 52], [108, 52], [126, 53], [144, 54], [158, 54], [172, 54], [186, 52], [205, 50]]),
		texture: 'wavy', flow: 'down', part: 90, sideburn: 30, drape: 250, curlAmp: 6, palette: p('espresso'),
	},
	{
		id: 'shoulder-length',
		thickness: sym([[90, 54], [110, 55], [130, 57], [150, 58], [168, 58], [186, 57], [205, 55]]),
		texture: 'wavy', flow: 'down', part: 90, sideburn: 32, drape: 380, curlAmp: 7, palette: p('chestnut'),
	},
	{
		id: 'man-bun',
		thickness: sym([[90, 20], [106, 20], [124, 19], [142, 18], [158, 17], [174, 16], [190, 15], [205, 14]]),
		texture: 'straight', flow: 'back', part: 90, sideburn: 34, sheenAt: 0.3, sheenStrength: 1, palette: p('jet'),
	},
	{
		id: 'wolf-cut',
		thickness: sym([[90, 54], [108, 52], [126, 50], [144, 46], [158, 42], [172, 38], [188, 34], [205, 32]]),
		fringe: [[-1, 50], [-0.6, 86], [-0.2, 74], [0.2, 78], [0.6, 90], [1, 52]],
		texture: 'wavy', flow: 'down', part: false, curlAmp: 10, sideburn: 26, drape: 120, palette: p('espresso'),
	},

	// ---- Curly -----------------------------------------------------------
	{
		id: 'curly-top',
		thickness: sym([[90, 52], [108, 50], [126, 44], [144, 32], [158, 20], [172, 10], [186, 6], [205, 5]]),
		texture: 'curly', flow: 'back', curlAmp: 16, curlFreq: 1.5, sideburn: 14, palette: p('espresso'),
		skinFade: true,
	},
	{
		id: 'curly-fade',
		thickness: sym([[90, 48], [106, 45], [120, 36], [134, 20], [146, 8], [160, 3], [180, 2], [205, 2]]),
		texture: 'curly', flow: 'back', curlAmp: 15, curlFreq: 1.6, sideburn: 6, skinFade: true, palette: p('jet'),
	},
	{
		id: 'afro',
		thickness: sym([[90, 100], [110, 99], [130, 96], [150, 90], [166, 82], [180, 72], [192, 62], [205, 54]]),
		texture: 'coily', flow: 'back', curlAmp: 14, curlFreq: 2.2, sideburn: 20, sheenStrength: 0.5, palette: p('jet'),
	},
	{
		id: 'twist-out',
		thickness: sym([[90, 62], [110, 61], [130, 58], [150, 52], [166, 42], [180, 30], [192, 20], [205, 15]]),
		texture: 'coily', flow: 'back', curlAmp: 13, curlFreq: 2.4, sideburn: 16, sheenStrength: 0.55, palette: p('jet'),
	},
	{
		id: 'curly-fringe',
		thickness: sym([[90, 46], [110, 44], [130, 38], [148, 28], [162, 17], [176, 9], [190, 6], [205, 5]]),
		fringe: [[-1, 28], [-0.6, 72], [-0.2, 96], [0.2, 98], [0.6, 76], [1, 30]],
		texture: 'curly', flow: 'forward', part: false, curlAmp: 12, sideburn: 16, palette: p('chestnut'),
	},

	// ---- Wavy ------------------------------------------------------------
	{
		id: 'wavy-crop',
		thickness: sym([[90, 34], [110, 33], [130, 28], [148, 19], [162, 11], [176, 6], [190, 4], [205, 3.5]]),
		fringe: [[-1, 14], [-0.6, 40], [-0.2, 58], [0.2, 58], [0.6, 42], [1, 14]],
		texture: 'wavy', flow: 'forward', part: false, curlAmp: 6, sideburn: 16, palette: p('chestnut'),
		skinFade: true,
	},
	{
		id: 'beach-waves',
		thickness: sym([[90, 48], [110, 47], [130, 44], [148, 38], [164, 30], [178, 22], [192, 16], [205, 14]]),
		texture: 'wavy', flow: 'down', part: 100, curlAmp: 9, sideburn: 26, drape: 90, palette: p('sand'),
	},
	{
		id: 'wavy-quiff',
		thickness: sym([[90, 74], [104, 69], [118, 54], [132, 34], [148, 19], [164, 10], [180, 5], [205, 4]]),
		texture: 'wavy', flow: 'back', curlAmp: 8, sideburn: 14, sheenAt: 0.36, palette: p('chestnut'),
		skinFade: true,
	},

	// ---- Medium ----------------------------------------------------------
	{
		id: 'medium-swept',
		thickness: sym([[90, 46], [110, 45], [130, 41], [148, 34], [164, 26], [178, 18], [192, 13], [205, 11]]),
		texture: 'straight', flow: 'back', sideburn: 24, sheenAt: 0.32, palette: p('espresso'),
		skinFade: true,
	},
	{
		id: 'flow',
		thickness: sym([[90, 48], [110, 48], [130, 46], [150, 42], [166, 36], [180, 30], [194, 26], [205, 24]]),
		texture: 'wavy', flow: 'down', part: 96, curlAmp: 6, sideburn: 30, drape: 130, palette: p('chestnut'),
	},
];

export const STYLE_BY_ID = new Map(STYLE_SPECS.map((s) => [s.id, s]));
