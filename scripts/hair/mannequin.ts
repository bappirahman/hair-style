/**
 * A neutral head plate, drawn in the same canonical space as every hairstyle
 * overlay so the two composite without any per-style alignment.
 *
 * These are deliberately illustrative rather than photographic: a catalog
 * thumbnail should never imply it is showing a photograph of a real person.
 */

import { catmullRom, pt, r2, type Point } from './geometry.ts';
import {
	CANVAS,
	EYE_L,
	EYE_R,
	EYE_Y,
	FACE_CX,
	HALF,
	LANDMARK,
	skullPoint,
} from './head.ts';

export interface SkinTone {
	id: string;
	base: string;
	shade: string;
	deep: string;
	line: string;
	lip: string;
	backdrop: [string, string];
}

export const SKIN_TONES: readonly SkinTone[] = [
	{
		id: 'fair',
		base: '#e8bd9a',
		shade: '#cf9d7c',
		deep: '#a97555',
		line: '#7c5238',
		lip: '#b87c68',
		backdrop: ['#ece5d9', '#d9cfbf'],
	},
	{
		id: 'olive',
		base: '#cf9f74',
		shade: '#b5865d',
		deep: '#8f6342',
		line: '#684430',
		lip: '#a56b57',
		backdrop: ['#e9e2d6', '#d6ccbc'],
	},
	{
		id: 'deep',
		base: '#8a5c3c',
		shade: '#71482d',
		deep: '#55331d',
		line: '#3b2313',
		lip: '#6d4030',
		backdrop: ['#e5ded1', '#d0c5b4'],
	},
];

/**
 * Face silhouette: cranium arc across the top, then cheek, jaw and chin.
 * The arc is inset from the cranial ellipse the hairstyles are built on, so
 * hair always sits slightly proud of the skin rather than flush with it.
 */
function faceOutline(): Point[] {
	const pts: Point[] = [];
	// Right temple up over the crown to the left temple.
	for (let deg = 6; deg <= 174; deg += 8) pts.push(skullPoint(deg, -9));
	// Down the left cheek and jaw to the chin, then back up the right.
	// Half-widths narrow monotonically from cheekbone to chin; any bulge here
	// reads immediately as a swollen jaw.
	const side = (sgn: number): Point[] => [
		pt(FACE_CX + sgn * (HALF.cheek - 4), EYE_Y + 26),
		pt(FACE_CX + sgn * (HALF.cheek - 14), EYE_Y + 104),
		pt(FACE_CX + sgn * (HALF.cheek - 34), EYE_Y + 168),
		pt(FACE_CX + sgn * HALF.jaw, EYE_Y + 216),
		pt(FACE_CX + sgn * (HALF.jaw - 42), EYE_Y + 254),
		pt(FACE_CX + sgn * 42, LANDMARK.chinY - 16),
	];
	pts.push(...side(-1), pt(FACE_CX, LANDMARK.chinY), ...side(1).reverse());
	return pts;
}

function eye(centre: Point, tone: SkinTone, outward: number): string {
	const w = 33;
	const h = 12;
	// Almond opening, with the outer corner sitting slightly lower than the
	// inner one — the single detail that stops a drawn eye reading as a decal.
	const lid = catmullRom(
		[
			pt(centre.x - w, centre.y + 2 + outward * 2),
			pt(centre.x - w * 0.42, centre.y - h),
			pt(centre.x + w * 0.36, centre.y - h * 0.82),
			pt(centre.x + w, centre.y + 2 - outward * 2),
			pt(centre.x + w * 0.34, centre.y + h * 0.7),
			pt(centre.x - w * 0.46, centre.y + h * 0.62),
		],
		true,
		0.9,
	);
	const crease = catmullRom(
		[
			pt(centre.x - w * 0.86, centre.y - h * 0.5),
			pt(centre.x - w * 0.2, centre.y - h * 1.9),
			pt(centre.x + w * 0.5, centre.y - h * 1.7),
			pt(centre.x + w * 0.92, centre.y - h * 0.3),
		],
		false,
		0.9,
	);
	const cx = r2(centre.x + outward * 1.5);
	const cy = r2(centre.y - 0.5);
	return `<g>
<path d="${crease}" stroke="${tone.deep}" stroke-width="4" stroke-opacity="0.3" fill="none" stroke-linecap="round"/>
<path d="${lid}" fill="#f4efe7"/>
<clipPath id="eyeclip${r2(centre.x)}"><path d="${lid}"/></clipPath>
<g clip-path="url(#eyeclip${r2(centre.x)})">
<circle cx="${cx}" cy="${cy}" r="12.5" fill="#4a3524"/>
<circle cx="${cx}" cy="${cy}" r="5.6" fill="#140d08"/>
<circle cx="${r2(centre.x - 4)}" cy="${r2(centre.y - 5)}" r="3.2" fill="#ffffff" opacity="0.85"/>
</g>
<path d="${lid}" fill="none" stroke="${tone.line}" stroke-width="4.6" stroke-opacity="0.9" stroke-linejoin="round"/>
</g>`;
}

/** The full head plate as an SVG string, sized to the shared canvas. */
export function buildMannequinSvg(tone: SkinTone): string {
	const face = catmullRom(faceOutline(), true, 0.9);

	const ear = (sgn: number): string =>
		catmullRom(
			[
				pt(FACE_CX + sgn * (HALF.ear - 14), LANDMARK.earTopY + 4),
				pt(FACE_CX + sgn * (HALF.ear + 12), LANDMARK.earTopY + 40),
				pt(FACE_CX + sgn * (HALF.ear + 6), LANDMARK.earBottomY - 26),
				pt(FACE_CX + sgn * (HALF.ear - 20), LANDMARK.earBottomY),
			],
			true,
			0.9,
		);
	const earL = ear(-1);
	const earR = ear(1);

	const neck = `M ${FACE_CX - HALF.neck - 12} ${EYE_Y + 190} L ${FACE_CX - HALF.neck} ${LANDMARK.neckY} L ${FACE_CX + HALF.neck} ${LANDMARK.neckY} L ${FACE_CX + HALF.neck + 12} ${EYE_Y + 190} Z`;

	const shoulders = catmullRom(
		[
			pt(FACE_CX - HALF.shoulder - 90, CANVAS.height + 40),
			pt(FACE_CX - HALF.shoulder, LANDMARK.shoulderY + 40),
			pt(FACE_CX - HALF.neck - 60, LANDMARK.shoulderY - 46),
			pt(FACE_CX, LANDMARK.neckY + 26),
			pt(FACE_CX + HALF.neck + 60, LANDMARK.shoulderY - 46),
			pt(FACE_CX + HALF.shoulder, LANDMARK.shoulderY + 40),
			pt(FACE_CX + HALF.shoulder + 90, CANVAS.height + 40),
		],
		false,
		0.9,
	);

	const browL = catmullRom(
		[
			pt(EYE_L.x - 40, LANDMARK.browY + 8),
			pt(EYE_L.x - 8, LANDMARK.browY - 6),
			pt(EYE_L.x + 30, LANDMARK.browY - 1),
		],
		false,
		0.9,
	);
	const browR = catmullRom(
		[
			pt(EYE_R.x - 30, LANDMARK.browY - 1),
			pt(EYE_R.x + 8, LANDMARK.browY - 6),
			pt(EYE_R.x + 40, LANDMARK.browY + 8),
		],
		false,
		0.9,
	);

	// Nose read as a cast shadow down one side plus a defined base, rather
	// than an outline — an outlined nose always looks like a cartoon.
	const noseShadow = catmullRom(
		[
			pt(FACE_CX - 14, EYE_Y + 6),
			pt(FACE_CX - 24, LANDMARK.noseY - 46),
			pt(FACE_CX - 33, LANDMARK.noseY - 8),
			pt(FACE_CX - 20, LANDMARK.noseY + 8),
			pt(FACE_CX, LANDMARK.noseY + 13),
			pt(FACE_CX + 20, LANDMARK.noseY + 8),
			pt(FACE_CX + 30, LANDMARK.noseY - 12),
		],
		false,
		0.9,
	);
	const nostrils =
		`<ellipse cx="${FACE_CX - 15}" cy="${LANDMARK.noseY + 4}" rx="7.5" ry="4.6" fill="${tone.line}" opacity="0.5" transform="rotate(-14 ${FACE_CX - 15} ${LANDMARK.noseY + 4})"/>` +
		`<ellipse cx="${FACE_CX + 15}" cy="${LANDMARK.noseY + 4}" rx="7.5" ry="4.6" fill="${tone.line}" opacity="0.5" transform="rotate(14 ${FACE_CX + 15} ${LANDMARK.noseY + 4})"/>`;

	const mouth = catmullRom(
		[
			pt(FACE_CX - 46, LANDMARK.lipY),
			pt(FACE_CX - 16, LANDMARK.lipY - 5),
			pt(FACE_CX, LANDMARK.lipY - 2),
			pt(FACE_CX + 16, LANDMARK.lipY - 5),
			pt(FACE_CX + 46, LANDMARK.lipY),
		],
		false,
		0.9,
	);

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}" viewBox="0 0 ${CANVAS.width} ${CANVAS.height}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="${CANVAS.height}" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${tone.backdrop[0]}"/>
<stop offset="1" stop-color="${tone.backdrop[1]}"/>
</linearGradient>
<radialGradient id="skinLight" cx="${FACE_CX - 70}" cy="${EYE_Y - 120}" r="420" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#fff4e6" stop-opacity="0.2"/>
<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
<linearGradient id="skinShade" x1="${FACE_CX - 200}" y1="0" x2="${FACE_CX + 210}" y2="0" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="${tone.deep}" stop-opacity="0"/>
<stop offset="0.62" stop-color="${tone.shade}" stop-opacity="0.22"/>
<stop offset="1" stop-color="${tone.deep}" stop-opacity="0.58"/>
</linearGradient>
<filter id="soft" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="11"/></filter>
<filter id="softer" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="22"/></filter>
</defs>
<rect width="${CANVAS.width}" height="${CANVAS.height}" fill="url(#bg)"/>
<path d="${shoulders} L ${CANVAS.width} ${CANVAS.height} L 0 ${CANVAS.height} Z" fill="${tone.deep}" opacity="0.9"/>
<path d="${neck}" fill="${tone.base}"/>
<path d="${neck}" fill="${tone.deep}" opacity="0.32" filter="url(#soft)"/>
<path d="${earL}" fill="${tone.base}"/>
<path d="${earL}" fill="${tone.deep}" opacity="0.3" filter="url(#soft)"/>
<path d="${earR}" fill="${tone.base}"/>
<path d="${earR}" fill="${tone.deep}" opacity="0.3" filter="url(#soft)"/>
<path d="${face}" fill="${tone.base}"/>
<path d="${face}" fill="url(#skinShade)"/>
<path d="${face}" fill="url(#skinLight)"/>
<ellipse cx="${FACE_CX - 116}" cy="${EYE_Y + 84}" rx="62" ry="44" fill="${tone.deep}" opacity="0.15" filter="url(#softer)"/>
<ellipse cx="${FACE_CX + 116}" cy="${EYE_Y + 84}" rx="62" ry="44" fill="${tone.deep}" opacity="0.15" filter="url(#softer)"/>
${eye(EYE_L, tone, -1)}
${eye(EYE_R, tone, 1)}
<path d="${browL}" stroke="${tone.line}" stroke-width="11" stroke-opacity="0.72" stroke-linecap="round" fill="none"/>
<path d="${browR}" stroke="${tone.line}" stroke-width="11" stroke-opacity="0.72" stroke-linecap="round" fill="none"/>
<path d="${noseShadow}" stroke="${tone.deep}" stroke-width="16" stroke-opacity="0.3" stroke-linecap="round" fill="none" filter="url(#soft)"/>
${nostrils}
<path d="${mouth}" stroke="${tone.lip}" stroke-width="10" stroke-opacity="0.9" stroke-linecap="round" fill="none"/>
<ellipse cx="${FACE_CX}" cy="${LANDMARK.chinY - 26}" rx="62" ry="22" fill="${tone.deep}" opacity="0.16" filter="url(#softer)"/>
<ellipse cx="${FACE_CX}" cy="${LANDMARK.chinY + 44}" rx="150" ry="52" fill="${tone.deep}" opacity="0.3" filter="url(#softer)"/>
</svg>`;
}
