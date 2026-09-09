/**
 * The authoring vocabulary for a hairstyle asset.
 *
 * A style is described by a handful of readable numbers rather than path data,
 * which is what makes "add a hairstyle" a matter of adding a spec plus its
 * catalog metadata. `thickness` is the whole silhouette: how far the hair
 * stands off the scalp at each angle around the head.
 */

import type { Keys } from './geometry.ts';

export type FlowDirection = 'back' | 'forward' | 'side' | 'down';
export type TextureKind = 'straight' | 'wavy' | 'curly' | 'coily' | 'cropped';

export interface HairPalette {
	deep: string;
	mid: string;
	light: string;
	sheen: string;
	spec: string;
}

export interface StyleSpec {
	/** Stable asset id; matches the `overlay` field in the catalog metadata. */
	id: string;

	/**
	 * Hair standoff from the cranial ellipse, in canvas pixels, keyed by angle
	 * in degrees (0 = viewer's right, 90 = crown, 180 = viewer's left).
	 */
	thickness: Keys;

	/**
	 * How far the hair hangs below the natural hairline, keyed by normalised
	 * horizontal position (-1 = left temple, 0 = centre, 1 = right temple).
	 * Zero everywhere means the forehead is fully exposed.
	 */
	fringe?: Keys;

	/** Length of the sideburn below the hairline, in pixels. */
	sideburn?: number;

	/** Hair that falls past the jaw, in pixels below the hairline endpoints. */
	drape?: number;

	texture?: TextureKind;
	flow?: FlowDirection;

	/**
	 * Where the sweep converges, in degrees. 90 keeps strands symmetric about
	 * the crown; lower values pull the flow to the viewer's right.
	 */
	focus?: number;

	/** Position of the part line in degrees, or `false` for no part. */
	part?: number | false;

	/** Strand count multiplier. Cropped styles need far fewer. */
	density?: number;

	/** Extra silhouette lumpiness — curls and coils need a broken edge. */
	curlAmp?: number;
	curlFreq?: number;

	/** Vertical position of the crown sheen band, 0-1 across the hair mass. */
	sheenAt?: number;
	sheenStrength?: number;

	/** Whether the sides are clipped to skin (fades, undercuts). */
	skinFade?: boolean;

	palette?: Partial<HairPalette>;
}

/**
 * A dark-brown reference palette with a deliberately wide tonal range. Hair
 * only reads as hair when the specular is several stops above the roots, so
 * the ramp runs from near-black to a warm near-blonde highlight.
 */
export const DEFAULT_PALETTE: HairPalette = {
	deep: '#0d0906',
	mid: '#2e1f14',
	light: '#5c3d24',
	sheen: '#9a6c40',
	spec: '#d9ac74',
};

/** Mirror half-keys authored over 90-205 into a symmetric full-head curve. */
export function sym(half: Keys): Keys {
	const out: Array<readonly [number, number]> = [];
	for (let i = half.length - 1; i >= 0; i--) {
		const [a, v] = half[i]!;
		if (a === 90) continue;
		out.push([180 - a, v] as const);
	}
	return [...out, ...half].sort((a, b) => a[0] - b[0]);
}
