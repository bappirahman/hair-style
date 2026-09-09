/**
 * Deterministic 2D geometry helpers for the hairstyle asset generator.
 *
 * Everything here is pure and seeded: rebuilding the assets from the same
 * style specs must produce byte-identical SVG, otherwise the committed
 * `public/overlays` output churns on every run.
 */

export interface Point {
	x: number;
	y: number;
}

export const pt = (x: number, y: number): Point => ({ x, y });

export const add = (a: Point, b: Point): Point => pt(a.x + b.x, a.y + b.y);
export const sub = (a: Point, b: Point): Point => pt(a.x - b.x, a.y - b.y);
export const mul = (a: Point, k: number): Point => pt(a.x * k, a.y * k);
export const len = (a: Point): number => Math.hypot(a.x, a.y);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerpPt = (a: Point, b: Point, t: number): Point =>
	pt(lerp(a.x, b.x, t), lerp(a.y, b.y, t));

export const clamp = (v: number, lo: number, hi: number): number =>
	v < lo ? lo : v > hi ? hi : v;

export const rad = (deg: number): number => (deg * Math.PI) / 180;

/** Round to 2dp so the emitted path data stays compact and stable. */
export const r2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Mulberry32 — small, fast, fully deterministic from a 32-bit seed.
 * Used for every "random" wisp, notch and strand jitter in the generator.
 */
export function createRng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Turn a string id into a stable seed so each style is reproducibly unique. */
export function seedFrom(id: string): number {
	let h = 2166136261;
	for (let i = 0; i < id.length; i++) {
		h ^= id.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/** Smooth ease used for blending between silhouette keyframes. */
export const smoothstep = (t: number): number => t * t * (3 - 2 * t);

/**
 * A keyframe curve: sorted [position, value] pairs sampled with smooth
 * interpolation and flat extrapolation past either end. This is how a
 * hairstyle's silhouette thickness and fringe depth are authored — a handful
 * of readable control values rather than raw path data.
 */
export type Keys = ReadonlyArray<readonly [number, number]>;

export function sampleKeys(keys: Keys, at: number): number {
	if (keys.length === 0) return 0;
	const first = keys[0]!;
	if (at <= first[0]) return first[1];
	const last = keys[keys.length - 1]!;
	if (at >= last[0]) return last[1];

	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i]!;
		const b = keys[i + 1]!;
		if (at >= a[0] && at <= b[0]) {
			const span = b[0] - a[0];
			const t = span === 0 ? 0 : (at - a[0]) / span;
			return lerp(a[1], b[1], smoothstep(t));
		}
	}
	return last[1];
}

/**
 * Catmull-Rom through `points`, emitted as cubic beziers. Gives a naturally
 * flowing outline from sparse control points without hand-tuning handles.
 */
export function catmullRom(points: Point[], closed = false, tension = 1): string {
	if (points.length < 2) return '';
	const p = points.slice();
	if (closed) {
		p.unshift(points[points.length - 1]!);
		p.push(points[0]!, points[1]!);
	} else {
		p.unshift(points[0]!);
		p.push(points[points.length - 1]!);
	}

	let d = `M ${r2(p[1]!.x)} ${r2(p[1]!.y)}`;
	for (let i = 1; i < p.length - 2; i++) {
		const p0 = p[i - 1]!;
		const p1 = p[i]!;
		const p2 = p[i + 1]!;
		const p3 = p[i + 2]!;
		const k = tension / 6;
		const c1 = pt(p1.x + (p2.x - p0.x) * k, p1.y + (p2.y - p0.y) * k);
		const c2 = pt(p2.x - (p3.x - p1.x) * k, p2.y - (p3.y - p1.y) * k);
		d += ` C ${r2(c1.x)} ${r2(c1.y)} ${r2(c2.x)} ${r2(c2.y)} ${r2(p2.x)} ${r2(p2.y)}`;
	}
	if (closed) d += ' Z';
	return d;
}

/** Open polyline as a bezier-smoothed path (used for strands and wisps). */
export function smoothPath(points: Point[]): string {
	return catmullRom(points, false);
}

/**
 * Layered value noise in 1D. Deterministic given the rng, and continuous, so
 * silhouette edges get organic lumpiness instead of jitter.
 */
export function makeNoise1d(rng: () => number, samples = 64) {
	const table = Array.from({ length: samples }, () => rng() * 2 - 1);
	const at = (x: number): number => {
		const i = Math.floor(x);
		const t = smoothstep(x - i);
		const a = table[((i % samples) + samples) % samples]!;
		const b = table[(((i + 1) % samples) + samples) % samples]!;
		return lerp(a, b, t);
	};
	return (x: number, octaves = 2): number => {
		let sum = 0;
		let amp = 1;
		let freq = 1;
		let norm = 0;
		for (let o = 0; o < octaves; o++) {
			sum += at(x * freq) * amp;
			norm += amp;
			amp *= 0.5;
			freq *= 2.17;
		}
		return sum / norm;
	};
}

/**
 * Distance from `origin` along `dirDeg` to the first intersection with an open
 * polyline, or null if the ray misses. Angles use the head convention:
 * 0 = viewer's right, 90 = straight up.
 */
export function rayHit(
	origin: Point,
	dirDeg: number,
	poly: readonly Point[],
): number | null {
	const t = rad(dirDeg);
	const dx = Math.cos(t);
	const dy = -Math.sin(t);
	let best: number | null = null;
	for (let i = 0; i < poly.length - 1; i++) {
		const a = poly[i]!;
		const b = poly[i + 1]!;
		const ex = b.x - a.x;
		const ey = b.y - a.y;
		const denom = dx * ey - dy * ex;
		if (Math.abs(denom) < 1e-9) continue;
		const ox = a.x - origin.x;
		const oy = a.y - origin.y;
		const s = (ox * ey - oy * ex) / denom; // distance along the ray
		const u = (ox * dy - oy * dx) / denom; // position along the segment
		if (s > 0 && u >= 0 && u <= 1 && (best === null || s < best)) best = s;
	}
	return best;
}
