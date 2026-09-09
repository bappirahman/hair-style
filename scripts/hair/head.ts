/**
 * The canonical head space every hairstyle asset is authored in.
 *
 * All 45 styles share this coordinate system, which is what lets the browser
 * align any of them from a single pair of eye clicks: the manifest records
 * where the eyes sit inside each overlay, and the studio solves the similarity
 * transform that maps those two points onto the user's own eyes.
 *
 * Proportions are derived from average adult head measurements, expressed in
 * "PD units" where 100 units = one interpupillary distance.
 */

import { pt, rad, type Point } from './geometry.ts';

/** Interpupillary distance in canvas pixels — the unit of the whole system. */
export const PD = 164;

/** Convert PD units (100 = one PD) to canvas pixels. */
export const u = (units: number): number => (units * PD) / 100;

export const CANVAS = { width: 1024, height: 1280 } as const;

/** Eye anchors. Named from the viewer's perspective, as the user clicks them. */
export const EYE_L: Point = pt(430, 620);
export const EYE_R: Point = pt(594, 620);
export const EYE_Y = EYE_L.y;
export const FACE_CX = (EYE_L.x + EYE_R.x) / 2;

/**
 * Cranial reference ellipse: the scalp surface that hair thickness is measured
 * outward from. Tuned so its silhouette tracks a real skull through the
 * temples and crown.
 */
export const SKULL = {
	cx: FACE_CX,
	cy: 560,
	rx: 192,
	ry: 216,
} as const;

/** Vertical landmarks, in canvas pixels. */
export const LANDMARK = {
	skullTop: SKULL.cy - SKULL.ry, // 344
	hairlineY: EYE_Y - u(118), // 426 — natural mid-forehead hairline
	browY: EYE_Y - u(45), // 546
	noseY: EYE_Y + u(60), // 718 — one third of brow-to-chin
	lipY: EYE_Y + u(96), // 777
	chinY: EYE_Y + u(165), // 891
	// Ears run brow to nose base, the standard proportional rule.
	earTopY: EYE_Y - u(45),
	earBottomY: EYE_Y + u(60),
	jawY: EYE_Y + u(128),
	neckY: EYE_Y + u(200),
	shoulderY: EYE_Y + u(268),
} as const;

/** Horizontal landmarks as half-widths from centre. */
export const HALF = {
	cheek: u(110), // 180
	skull: u(117), // 192
	templeHairline: u(97), // 159
	ear: u(118),
	jaw: u(80),
	neck: u(52),
	shoulder: u(205),
} as const;

/** Polar radius of the cranial ellipse at angle `deg`. */
export function skullRadius(deg: number): number {
	const t = rad(deg);
	const c = Math.cos(t);
	const s = Math.sin(t);
	return (
		(SKULL.rx * SKULL.ry) /
		Math.hypot(SKULL.ry * c, SKULL.rx * s)
	);
}

/**
 * A point on (or offset from) the cranial ellipse.
 * `deg` runs 0 = viewer's right, 90 = crown, 180 = viewer's left.
 */
export function skullPoint(deg: number, offset = 0): Point {
	const t = rad(deg);
	const r = skullRadius(deg) + offset;
	return pt(SKULL.cx + r * Math.cos(t), SKULL.cy - r * Math.sin(t));
}

/**
 * The natural hairline, viewer-left to viewer-right across the forehead and
 * down in front of the ears. Styles with a fringe push this boundary down;
 * styles without it expose forehead exactly here.
 */
export const HAIRLINE: Point[] = [
	pt(FACE_CX - HALF.templeHairline - 14, LANDMARK.browY + 34), // in front of ear
	pt(FACE_CX - HALF.templeHairline - 8, EYE_Y - u(52)),
	pt(FACE_CX - HALF.templeHairline, EYE_Y - u(88)), // temple recession
	pt(FACE_CX - u(79), LANDMARK.hairlineY + 20),
	pt(FACE_CX - u(48), LANDMARK.hairlineY + 4),
	pt(FACE_CX, LANDMARK.hairlineY),
	pt(FACE_CX + u(48), LANDMARK.hairlineY + 4),
	pt(FACE_CX + u(79), LANDMARK.hairlineY + 20),
	pt(FACE_CX + HALF.templeHairline, EYE_Y - u(88)),
	pt(FACE_CX + HALF.templeHairline + 8, EYE_Y - u(52)),
	pt(FACE_CX + HALF.templeHairline + 14, LANDMARK.browY + 34),
];

/**
 * Where the anchors land once the SVG is rasterised and trimmed. The build
 * script offsets these by the trim box so the manifest always describes the
 * final image, not the authoring canvas.
 */
export const ANCHORS = { leftEye: EYE_L, rightEye: EYE_R } as const;
