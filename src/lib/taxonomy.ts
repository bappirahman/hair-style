/**
 * Shared vocabularies. Every facet page, filter and schema validator reads
 * from here, so adding a face shape or hair type is a one-line change that
 * automatically produces its landing page.
 */

export const CATEGORIES = [
	'fade',
	'taper',
	'buzz-cut',
	'french-crop',
	'caesar',
	'undercut',
	'pompadour',
	'quiff',
	'slick-back',
	'curtains',
	'long-hair',
	'curly-hair',
	'wavy-hair',
	'short-hair',
	'medium-hair',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const FACE_SHAPES = [
	'oval',
	'round',
	'square',
	'heart',
	'diamond',
	'oblong',
] as const;
export type FaceShape = (typeof FACE_SHAPES)[number];

export const HAIR_TYPES = [
	'straight',
	'wavy',
	'curly',
	'coily',
	'thick',
	'fine',
] as const;
export type HairType = (typeof HAIR_TYPES)[number];

export const LENGTHS = ['short', 'medium', 'long'] as const;
export type Length = (typeof LENGTHS)[number];

export const MAINTENANCE = ['low', 'medium', 'high'] as const;
export type Maintenance = (typeof MAINTENANCE)[number];

export const FACE_SHAPE_LABEL: Record<FaceShape, string> = {
	oval: 'Oval',
	round: 'Round',
	square: 'Square',
	heart: 'Heart',
	diamond: 'Diamond',
	oblong: 'Oblong',
};

export const HAIR_TYPE_LABEL: Record<HairType, string> = {
	straight: 'Straight',
	wavy: 'Wavy',
	curly: 'Curly',
	coily: 'Coily',
	thick: 'Thick',
	fine: 'Fine',
};

export const LENGTH_LABEL: Record<Length, string> = {
	short: 'Short',
	medium: 'Medium',
	long: 'Long',
};

export const MAINTENANCE_LABEL: Record<Maintenance, string> = {
	low: 'Low upkeep',
	medium: 'Moderate upkeep',
	high: 'High upkeep',
};

/** How often the cut needs revisiting — shown on cards and detail pages. */
export const MAINTENANCE_CADENCE: Record<Maintenance, string> = {
	low: 'Every 6–10 weeks',
	medium: 'Every 3–5 weeks',
	high: 'Every 2–3 weeks',
};
