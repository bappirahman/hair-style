/**
 * Turns a StyleSpec into a layered SVG overlay.
 *
 * The layer stack, back to front:
 *   1. contact shadow  — soft dark band cast onto the forehead, unmasked, so
 *                        the hair sits *on* the face instead of floating over it
 *   2. base tone       — flat mid, then a top light and a perimeter vignette
 *   3. crown sheen     — the broad specular arc that reads as "hair" more than
 *                        any other single cue
 *   4. strands         — curves that drift through the mass rather than tracing
 *                        it, alternating clearly above and below the base tone
 *   5. root depth      — darkening where the hair meets skin, and at the part
 *   6. flyaways        — tangential strokes crossing the boundary so the cutout
 *                        never reads as a sticker
 */

import {
	catmullRom,
	clamp,
	createRng,
	lerp,
	makeNoise1d,
	pt,
	r2,
	rad,
	rayHit,
	sampleKeys,
	seedFrom,
	smoothPath,
	type Point,
} from './geometry.ts';
import {
	CANVAS,
	EYE_Y,
	FACE_CX,
	HAIRLINE,
	HALF,
	LANDMARK,
	SKULL,
	skullPoint,
} from './head.ts';
import { DEFAULT_PALETTE, type HairPalette, type StyleSpec } from './spec.ts';

const ARC_START = -14;
const ARC_END = 194;

export interface BuiltHair {
	svg: string;
	/** Bounding box of the drawn hair in canvas space, for the build script. */
	bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

/** Replace NaN entries with the nearest real value on either side. */
function backfill(table: number[]): void {
	let last = Number.NaN;
	for (let i = 0; i < table.length; i++) {
		if (Number.isFinite(table[i]!)) last = table[i]!;
		else if (Number.isFinite(last)) table[i] = last;
	}
	last = Number.NaN;
	for (let i = table.length - 1; i >= 0; i--) {
		if (Number.isFinite(table[i]!)) last = table[i]!;
		else if (Number.isFinite(last)) table[i] = last;
	}
	for (let i = 0; i < table.length; i++) {
		if (!Number.isFinite(table[i]!)) table[i] = 1;
	}
}

/** Normalised horizontal position of x, where ±1 is the temple hairline. */
const xNorm = (x: number): number => (x - FACE_CX) / HALF.templeHairline;

export function buildHairSvg(spec: StyleSpec): BuiltHair {
	const rng = createRng(seedFrom(spec.id));
	const noise = makeNoise1d(rng);
	const pal: HairPalette = { ...DEFAULT_PALETTE, ...spec.palette };

	const texture = spec.texture ?? 'straight';
	const density = spec.density ?? 1;
	const curlAmp = spec.curlAmp ?? 0;
	const curlFreq = spec.curlFreq ?? 1;
	const sideburn = spec.sideburn ?? 26;
	const drape = spec.drape ?? 0;
	const focus = spec.focus ?? 90;
	const sheenAt = spec.sheenAt ?? 0.42;

	const thickAt = (deg: number): number => {
		const base = sampleKeys(spec.thickness, deg);
		if (curlAmp === 0) return base;
		// Lumpiness scales with local mass, so a fade stays tight at the skin
		// while the crown of an afro breaks up completely.
		const w = clamp(base / 34, 0, 1);
		return base + noise((deg / 18) * curlFreq, 3) * curlAmp * w;
	};

	// ---- Outer silhouette -------------------------------------------------
	const outer: Point[] = [];
	for (let deg = ARC_START; deg <= ARC_END + 0.001; deg += 6) {
		outer.push(skullPoint(deg, thickAt(deg)));
	}

	// ---- Inner boundary: hairline pushed down by the fringe ---------------
	const inner: Point[] = HAIRLINE.map((p) => {
		const drop = spec.fringe ? sampleKeys(spec.fringe, xNorm(p.x)) : 0;
		// Always jittered: a perfectly smooth hairline is the single strongest
		// tell that an overlay is a sticker rather than hair.
		const wob = noise(p.x / 34, 2) * (4 + curlAmp * 0.5);
		return pt(p.x, p.y + drop + wob);
	});

	const leftEnd = inner[0]!;
	const rightEnd = inner[inner.length - 1]!;
	const outerL = outer[outer.length - 1]!;
	const outerR = outer[0]!;
	const sbL = leftEnd.y + sideburn + drape;
	const sbR = rightEnd.y + sideburn + drape;

	// A sideburn tapers to a point; a drape is a curtain of hair that swings
	// out from the head before falling, and tucks back toward the jaw at the
	// tip. Without the flare, long styles render as two thin straps.
	const flare = drape > 0 ? 16 + drape * 0.16 : 0;
	/**
	 * Points running from the outer silhouette down past the ear and back up
	 * to the hairline. `sgn` is +1 on the viewer's right, -1 on the left, so
	 * `flare` always swings away from the face.
	 */
	const fall = (
		outerX: number,
		innerX: number,
		bottom: number,
		sgn: number,
	): { down: Point[]; up: Point[] } =>
		drape > 0
			? {
					down: [
						pt(outerX + sgn * flare * 0.7, bottom - drape * 0.72),
						pt(outerX + sgn * flare, bottom - drape * 0.3),
						pt(outerX + sgn * flare * 0.55, bottom),
					],
					up: [
						pt(innerX - sgn * 4, bottom - 12),
						pt(innerX - sgn * 2, bottom - drape * 0.55),
					],
				}
			: {
					down: [
						pt(outerX + sgn * 1, bottom - 14),
						pt((outerX + innerX) / 2 + sgn * 1, bottom),
					],
					up: [pt(innerX - sgn * 1, bottom - 14)],
				};

	// Closed loop: outer arc right→left, down the left side, back across the
	// fringe left→right, down the right side, close.
	const fallL = fall(outerL.x, leftEnd.x, sbL, -1);
	const fallR = fall(outerR.x, rightEnd.x, sbR, 1);
	const loop: Point[] = [
		...outer,
		...fallL.down,
		...fallL.up,
		...inner,
		...[...fallR.up].reverse(),
		...[...fallR.down].reverse(),
	];
	const silhouette = catmullRom(loop, true, 0.9);

	// ---- Hair-space fan ---------------------------------------------------
	// Strands are placed in (phi, v) coordinates: phi fans out from a point
	// behind the forehead, and v runs 0 at the inner boundary (hairline or
	// fringe edge) to 1 at the outer silhouette. This fills the whole visible
	// mass — parametrising by offset from the scalp instead piles every strand
	// against the outer edge and leaves the middle a flat void.
	const fanO = pt(FACE_CX, LANDMARK.hairlineY + 90);
	// The fan must span the whole silhouette, including any drape hanging well
	// below the ears — derived from the geometry rather than fixed, so adding a
	// longer style never leaves an untextured slab.
	let phiLo = -25;
	let phiHi = 205;
	for (const q of loop) {
		const a =
			(Math.atan2(fanO.y - q.y, q.x - fanO.x) * 180) / Math.PI;
		const wrapped = a < -90 ? a + 360 : a;
		if (wrapped < phiLo) phiLo = wrapped;
		if (wrapped > phiHi) phiHi = wrapped;
	}
	const PHI_MIN = Math.max(Math.floor(phiLo) - 3, -88);
	const PHI_MAX = Math.min(Math.ceil(phiHi) + 3, 268);

	// Both boundaries include the drape, so rays cast into a curtain of long
	// hair find its real edges instead of missing and leaving the mass flat.
	const outerPoly: Point[] = [
		...[...fallR.down].reverse(),
		...outer,
		...fallL.down,
	];
	const innerPoly: Point[] = [
		fallL.down[fallL.down.length - 1]!,
		...fallL.up,
		...inner,
		...[...fallR.up].reverse(),
		fallR.down[fallR.down.length - 1]!,
	];

	// Precomputed radii, one sample per degree, linearly interpolated.
	// `valid` marks angles where the ray actually crossed both boundaries;
	// past the ends of the hairline it does not, and detail placed there would
	// span the whole forehead.
	const rIn: number[] = [];
	const rOut: number[] = [];
	const valid: boolean[] = [];
	const MAX_MASS = 165;
	for (let d = PHI_MIN; d <= PHI_MAX; d++) {
		const o = rayHit(fanO, d, outerPoly);
		const i = rayHit(fanO, d, innerPoly);
		rOut.push(o ?? Number.NaN);
		rIn.push(i ?? Number.NaN);
		valid.push(o !== null && i !== null);
	}
	// Backfill misses from the nearest hit. A zero radius here would place a
	// point at the fan origin, drawing a stray line clean across the face.
	backfill(rOut);
	backfill(rIn);
	for (let k = 0; k < rIn.length; k++) {
		rIn[k] = clamp(rIn[k]!, rOut[k]! - MAX_MASS, rOut[k]! - 1);
	}
	const validAt = (phi: number): boolean =>
		valid[clamp(Math.round(phi - PHI_MIN), 0, valid.length - 1)] === true;
	const clampPhi = (phi: number): number =>
		clamp(phi, PHI_MIN + 1, PHI_MAX - 1);
	const radiusAt = (table: number[], phi: number): number => {
		const k = clamp(phi - PHI_MIN, 0, table.length - 1.001);
		const i = Math.floor(k);
		return lerp(table[i]!, table[i + 1]!, k - i);
	};

	/** Cartesian point at fan angle `phi` and fill fraction `v`. */
	const hairPoint = (rawPhi: number, v: number): Point => {
		const phi = clampPhi(rawPhi);
		const a = radiusAt(rIn, phi);
		const b = radiusAt(rOut, phi);
		const r = lerp(a, b, v);
		const t = rad(phi);
		return pt(fanO.x + r * Math.cos(t), fanO.y - r * Math.sin(t));
	};

	/** Thickness of the visible mass at `phi`, used to scale detail. */
	const massAt = (phi: number): number =>
		Math.max(0, radiusAt(rOut, phi) - radiusAt(rIn, phi));

	// ---- Strands ----------------------------------------------------------
	const strandCount = Math.round(
		(texture === 'cropped' ? 150 : texture === 'coily' ? 380 : 300) * density,
	);
	const strands: string[] = [];
	for (let i = 0; i < strandCount; i++) {
		const phi0 = lerp(PHI_MIN + 4, PHI_MAX - 4, rng());
		if (!validAt(phi0) || massAt(phi0) < 4) continue;

		// Expressed as arc length rather than degrees: 30deg on the crown is a
		// short stroke, but 30deg out in a drape is a stroke across the face.
		const sweep =
			(lerp(30, 120, rng()) * 180) /
			(Math.PI * Math.max(radiusAt(rOut, phi0), 60));
		// Jitter the convergence point per strand; a single exact focus reads
		// as a hard whorl scar at the crown.
		const f = focus + (rng() - 0.5) * 46;
		let dPhi: number;
		switch (spec.flow) {
			case 'forward':
				dPhi = sweep * Math.sign(phi0 - f || 1);
				break;
			case 'side':
				dPhi = -sweep;
				break;
			case 'down':
				dPhi = sweep * 0.3 * (rng() > 0.5 ? 1 : -1);
				break;
			default:
				dPhi = sweep * Math.sign(f - phi0 || 1);
		}
		const phi1 = clamp(phi0 + dPhi, PHI_MIN + 2, PHI_MAX - 2);

		// Root nearer the scalp, tip nearer the edge — reversed for styles
		// combed down over the face.
		const downward = spec.flow === 'forward' || spec.flow === 'down';
		const vA = downward ? lerp(0.45, 1.02, rng()) : lerp(-0.02, 0.5, rng());
		const vB = downward ? lerp(-0.04, 0.5, rng()) : lerp(0.5, 1.03, rng());

		const steps = 8;
		const pts: Point[] = [];
		for (let s2 = 0; s2 <= steps; s2++) {
			const t = s2 / steps;
			const phi = lerp(phi0, phi1, t);
			let v = lerp(vA, vB, t);
			if (texture === 'wavy') v += Math.sin(t * Math.PI * 2.4 + i) * 0.09;
			if (texture === 'curly') v += Math.sin(t * Math.PI * 4.6 + i) * 0.14;
			if (texture === 'coily') v += Math.sin(t * Math.PI * 8 + i) * 0.16;
			pts.push(hairPoint(phi, clamp(v, -0.06, 1.06)));
		}

		// Alternate decisively light and dark: mid-tone strands vanish into the
		// base fill and only cost bytes.
		const isLight = rng() > 0.5;
		const roll = rng();
		const stroke = isLight
			? roll > 0.7
				? pal.spec
				: pal.sheen
			: roll > 0.45
				? pal.deep
				: pal.mid;
		strands.push(
			`<path d="${smoothPath(pts)}" stroke="${stroke}" stroke-width="${r2(lerp(0.9, 3, rng() * rng()))}" stroke-opacity="${r2(lerp(0.18, isLight ? 0.68 : 0.44, rng()))}" fill="none" stroke-linecap="round"/>`,
		);
	}

	// ---- Boundary wisps ---------------------------------------------------
	// Short strokes that overshoot v=0 or v=1, feathering both the outer
	// silhouette and the hairline so neither edge reads as a cut-out.
	const wisps: string[] = [];
	const wispCount = Math.round((texture === 'cropped' ? 90 : 190) * density);
	for (let i = 0; i < wispCount; i++) {
		const phi0 = lerp(PHI_MIN + 3, PHI_MAX - 3, rng());
		const m = massAt(phi0);
		if (!validAt(phi0) || m < 3) continue;
		const outward = rng() > 0.42;
		// Overshoot is capped in absolute pixels: a fraction of a thick crown
		// is a long stray, a fraction of a thin taper is nothing.
		// In absolute pixels, so a thick crown does not get proportionally
		// longer strays than a tight taper. The hairline gets half the reach —
		// hair feathers onto skin, it does not spike off it.
		const reach = lerp(1.5, outward ? 10 : 5, rng() * rng());
		const overshoot = reach / Math.max(m, 6);
		const vEdge = outward ? 1 : 0;
		const vStart = outward ? lerp(0.6, 0.92, rng()) : lerp(0.08, 0.4, rng());
		const vEnd = outward ? 1 + overshoot : -overshoot;
		const span =
			((lerp(14, 60, rng()) * 180) /
				(Math.PI * Math.max(radiusAt(rOut, phi0), 60))) *
			(rng() > 0.5 ? 1 : -1);

		const pts: Point[] = [];
		for (let s2 = 0; s2 <= 4; s2++) {
			const t = s2 / 4;
			pts.push(
				hairPoint(phi0 + span * t, lerp(vStart, lerp(vEdge, vEnd, t), t)),
			);
		}
		const lit = rng();
		wisps.push(
			`<path d="${smoothPath(pts)}" stroke="${lit > 0.7 ? pal.sheen : lit > 0.38 ? pal.light : pal.mid}" stroke-width="${r2(lerp(0.6, 1.5, rng()))}" stroke-opacity="${r2(lerp(0.1, 0.36, rng()))}" fill="none" stroke-linecap="round"/>`,
		);
	}

	// ---- Part line --------------------------------------------------------
	let partPath = '';
	if (typeof spec.part === 'number') {
		const pts: Point[] = [];
		for (let k = 0; k <= 8; k++) pts.push(hairPoint(spec.part, lerp(0.05, 0.95, k / 8)));
		partPath = `<path d="${smoothPath(pts)}" stroke="${pal.deep}" stroke-width="12" stroke-opacity="0.5" fill="none" stroke-linecap="round" filter="url(#blurS)"/>`;
	}

	// ---- Sheen ------------------------------------------------------------
	const crownMass = clamp(massAt(90) / 130, 0.15, 1);
	const strength = spec.sheenStrength ?? 0.8;
	const sheenPts: Point[] = [];
	const specPts: Point[] = [];
	for (let k = 0; k <= 12; k++) {
		const t = k / 12;
		sheenPts.push(hairPoint(lerp(PHI_MIN + 34, PHI_MAX - 34, t), 1 - sheenAt));
		specPts.push(hairPoint(lerp(PHI_MIN + 62, PHI_MAX - 62, t), 1 - sheenAt * 0.55));
	}
	const sheenW = r2(lerp(20, 58, crownMass));
	const sheen =
		`<path d="${smoothPath(sheenPts)}" stroke="url(#sheenGrad)" stroke-width="${sheenW}" fill="none" stroke-linecap="round" filter="url(#blurL)" opacity="${strength}"/>` +
		`<path d="${smoothPath(specPts)}" stroke="url(#specGrad)" stroke-width="${r2(sheenW * 0.34)}" fill="none" stroke-linecap="round" filter="url(#blurS)" opacity="${r2(strength * 0.85)}"/>`;

	// ---- Contact shadow onto the face -------------------------------------
	const contact = `<path d="${smoothPath(inner.map((p) => pt(p.x, p.y + 10)))}" stroke="#1a1208" stroke-width="30" stroke-opacity="0.32" fill="none" stroke-linecap="round" filter="url(#blurXL)"/>`;

	// Where the hair actually reaches skin, in canvas pixels. Every fade used a
	// fixed gradient before this, which made a low fade and a high fade look
	// identical from the front — the one place the difference should read.
	let fadeLineY = EYE_Y;
	for (let deg = 90; deg <= ARC_END; deg += 2) {
		if (thickAt(deg) <= 11) {
			fadeLineY = skullPoint(deg, thickAt(deg)).y;
			break;
		}
	}
	const skinFadeLayer = spec.skinFade
		? `<path d="${silhouette}" fill="url(#fadeGrad)"/>`
		: '';

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}">
<defs>
<linearGradient id="baseGrad" x1="0" y1="${LANDMARK.skullTop - 30}" x2="0" y2="${EYE_Y + 170 + drape * 1.25}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${pal.light}"/>
<stop offset="0.34" stop-color="${pal.mid}"/>
<stop offset="1" stop-color="${pal.deep}"/>
</linearGradient>
<radialGradient id="topLight" cx="${FACE_CX - 70}" cy="${LANDMARK.skullTop + 40}" r="300" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${pal.sheen}" stop-opacity="0.42"/>
<stop offset="0.6" stop-color="${pal.light}" stop-opacity="0.12"/>
<stop offset="1" stop-color="${pal.light}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="vignette" cx="${FACE_CX}" cy="${SKULL.cy}" r="${360 + drape * 0.7}" gradientUnits="userSpaceOnUse">
<stop offset="0.55" stop-color="${pal.deep}" stop-opacity="0"/>
<stop offset="1" stop-color="${pal.deep}" stop-opacity="0.6"/>
</radialGradient>
<linearGradient id="fadeGrad" x1="0" y1="${r2(fadeLineY - 105)}" x2="0" y2="${r2(fadeLineY + 55)}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${pal.deep}" stop-opacity="0"/>
<stop offset="0.45" stop-color="${pal.deep}" stop-opacity="0.42"/>
<stop offset="1" stop-color="${pal.deep}" stop-opacity="0.9"/>
</linearGradient>
<linearGradient id="sheenGrad" x1="${FACE_CX - 250}" y1="0" x2="${FACE_CX + 250}" y2="0" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${pal.sheen}" stop-opacity="0"/>
<stop offset="0.24" stop-color="${pal.sheen}" stop-opacity="0.7"/>
<stop offset="0.46" stop-color="${pal.spec}" stop-opacity="0.95"/>
<stop offset="0.74" stop-color="${pal.sheen}" stop-opacity="0.6"/>
<stop offset="1" stop-color="${pal.sheen}" stop-opacity="0"/>
</linearGradient>
<linearGradient id="specGrad" x1="${FACE_CX - 160}" y1="0" x2="${FACE_CX + 160}" y2="0" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${pal.spec}" stop-opacity="0"/>
<stop offset="0.4" stop-color="${pal.spec}" stop-opacity="0.95"/>
<stop offset="1" stop-color="${pal.spec}" stop-opacity="0"/>
</linearGradient>
<radialGradient id="rootGrad" cx="${FACE_CX}" cy="${LANDMARK.hairlineY + 6}" r="250" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${pal.deep}" stop-opacity="0.7"/>
<stop offset="0.6" stop-color="${pal.deep}" stop-opacity="0.2"/>
<stop offset="1" stop-color="${pal.deep}" stop-opacity="0"/>
</radialGradient>
<filter id="blurS" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="blurL" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="blurXL" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="soften" x="-12%" y="-12%" width="124%" height="124%"><feGaussianBlur stdDeviation="3"/></filter>
<mask id="hairMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${CANVAS.width}" height="${CANVAS.height}">
<path d="${silhouette}" fill="#fff" filter="url(#soften)"/>
</mask>
<clipPath id="hairClip"><path d="${silhouette}"/></clipPath>
</defs>
${contact}
<g mask="url(#hairMask)">
<path d="${silhouette}" fill="url(#baseGrad)"/>
<path d="${silhouette}" fill="url(#topLight)"/>
<g clip-path="url(#hairClip)">
${sheen}
${strands.join('')}
${partPath}
</g>
<path d="${silhouette}" fill="url(#vignette)"/>
<path d="${silhouette}" fill="url(#rootGrad)"/>
${skinFadeLayer}
</g>
<g>${wisps.join('')}</g>
</svg>`;

	const xs = loop.map((p) => p.x);
	const ys = loop.map((p) => p.y);
	return {
		svg,
		bounds: {
			minX: Math.min(...xs),
			minY: Math.min(...ys),
			maxX: Math.max(...xs),
			maxY: Math.max(...ys),
		},
	};
}
