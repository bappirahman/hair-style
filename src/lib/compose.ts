/**
 * Pure 2D transform maths for the hairstyle studio.
 *
 * Nothing here touches the DOM, which is deliberate: the same matrix drives the
 * on-screen preview (via CSS/canvas at display scale) and the downloaded file
 * (via canvas at native scale), so what you see is what you get. Any drift
 * between preview and export would come from having two code paths, so there
 * is only one.
 */

export interface Point {
	x: number;
	y: number;
}

/** Canvas/CSS matrix convention: x' = a·x + c·y + e, y' = b·x + d·y + f. */
export interface Matrix {
	a: number;
	b: number;
	c: number;
	d: number;
	e: number;
	f: number;
}

export const IDENTITY: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

/** m ∘ n — apply `n` first, then `m`. */
export function multiply(m: Matrix, n: Matrix): Matrix {
	return {
		a: m.a * n.a + m.c * n.b,
		b: m.b * n.a + m.d * n.b,
		c: m.a * n.c + m.c * n.d,
		d: m.b * n.c + m.d * n.d,
		e: m.a * n.e + m.c * n.f + m.e,
		f: m.b * n.e + m.d * n.f + m.f,
	};
}

export function applyMatrix(m: Matrix, p: Point): Point {
	return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
}

export const translation = (x: number, y: number): Matrix => ({
	...IDENTITY,
	e: x,
	f: y,
});

export const uniformScale = (k: number): Matrix => ({ ...IDENTITY, a: k, d: k });

export function rotation(radians: number): Matrix {
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
}

/** Compose `m` so it acts around `pivot` rather than the origin. */
export function about(pivot: Point, m: Matrix): Matrix {
	return multiply(
		translation(pivot.x, pivot.y),
		multiply(m, translation(-pivot.x, -pivot.y)),
	);
}

/**
 * The similarity transform that maps two source points onto two destination
 * points exactly. This is the whole alignment step: scale, rotation and
 * position all fall out of where the user clicked their two eyes.
 */
export function solveSimilarity(
	srcA: Point,
	srcB: Point,
	dstA: Point,
	dstB: Point,
): Matrix {
	const srcDx = srcB.x - srcA.x;
	const srcDy = srcB.y - srcA.y;
	const dstDx = dstB.x - dstA.x;
	const dstDy = dstB.y - dstA.y;

	const srcLen = Math.hypot(srcDx, srcDy);
	if (srcLen < 1e-6) return translation(dstA.x - srcA.x, dstA.y - srcA.y);

	const scale = Math.hypot(dstDx, dstDy) / srcLen;
	const angle = Math.atan2(dstDy, dstDx) - Math.atan2(srcDy, srcDx);

	const linear = multiply(rotation(angle), uniformScale(scale));
	const mapped = applyMatrix(linear, srcA);
	return { ...linear, e: dstA.x - mapped.x, f: dstA.y - mapped.y };
}

/** User adjustments layered on top of the solved fit. */
export interface Adjustments {
	/** Multiplier on the fitted size. */
	scale: number;
	/** Extra rotation in degrees. */
	rotate: number;
	/** Nudge in destination (photo) pixels. */
	offsetX: number;
	offsetY: number;
	/** Mirror the overlay left-to-right. */
	flip: boolean;
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
	scale: 1,
	rotate: 0,
	offsetX: 0,
	offsetY: 0,
	flip: false,
};

export interface FitInput {
	/** Eye anchors inside the overlay image, in overlay pixels. */
	overlayLeftEye: Point;
	overlayRightEye: Point;
	/** Eye positions the user clicked, in photo pixels. */
	photoLeftEye: Point;
	photoRightEye: Point;
	adjustments: Adjustments;
}

/**
 * The final overlay→photo matrix.
 *
 * Adjustments are applied in the overlay's own space, pivoting on the midpoint
 * between its eye anchors, so scaling and rotating feel like they happen around
 * the face rather than around the image's top-left corner. The nudge is applied
 * afterwards in photo space so a pixel of drag is always a pixel on screen.
 */
export function fitOverlay(input: FitInput): Matrix {
	const { overlayLeftEye, overlayRightEye, adjustments } = input;
	const pivot: Point = {
		x: (overlayLeftEye.x + overlayRightEye.x) / 2,
		y: (overlayLeftEye.y + overlayRightEye.y) / 2,
	};

	const mirror: Matrix = adjustments.flip
		? { ...IDENTITY, a: -1 }
		: IDENTITY;
	const local = about(
		pivot,
		multiply(
			rotation((adjustments.rotate * Math.PI) / 180),
			multiply(uniformScale(adjustments.scale), mirror),
		),
	);

	const fit = solveSimilarity(
		overlayLeftEye,
		overlayRightEye,
		input.photoLeftEye,
		input.photoRightEye,
	);

	return multiply(
		translation(adjustments.offsetX, adjustments.offsetY),
		multiply(fit, local),
	);
}

/**
 * A sensible starting placement when the user has not clicked their eyes —
 * assumes a face occupying the middle of the frame at typical portrait framing.
 */
export function guessEyePositions(width: number, height: number): {
	left: Point;
	right: Point;
} {
	const cx = width / 2;
	const cy = height * 0.42;
	const half = width * 0.115;
	return { left: { x: cx - half, y: cy }, right: { x: cx + half, y: cy } };
}

/** Scale a matrix's output — used to go from photo pixels to display pixels. */
export function scaleOutput(m: Matrix, k: number): Matrix {
	return multiply(uniformScale(k), m);
}
