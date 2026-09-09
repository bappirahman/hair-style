/**
 * The only module that queries the hairstyle collection.
 *
 * Every page, facet listing and related-styles block goes through here, so the
 * shape of the content layer is described in exactly one place.
 */

import { getCollection, type CollectionEntry } from 'astro:content';

import type { Category, FaceShape, HairType, Length } from './taxonomy.ts';

export type Hairstyle = CollectionEntry<'hairstyles'>;
export type CategoryEntry = CollectionEntry<'categories'>;

const byName = (a: Hairstyle, b: Hairstyle) =>
	a.data.name.localeCompare(b.data.name);

/** Ranked entries first, in rank order, then everything else alphabetically. */
const byRank = (a: Hairstyle, b: Hairstyle) => {
	const ra = a.data.rank ?? Number.MAX_SAFE_INTEGER;
	const rb = b.data.rank ?? Number.MAX_SAFE_INTEGER;
	return ra === rb ? byName(a, b) : ra - rb;
};

let cache: Hairstyle[] | null = null;

export async function getAllHairstyles(): Promise<Hairstyle[]> {
	cache ??= (await getCollection('hairstyles')).sort(byRank);
	return cache;
}

export async function getHairstyle(slug: string): Promise<Hairstyle | undefined> {
	return (await getAllHairstyles()).find((h) => h.id === slug);
}

export async function byCategory(category: Category): Promise<Hairstyle[]> {
	return (await getAllHairstyles()).filter((h) =>
		h.data.categories.includes(category),
	);
}

export async function byFaceShape(shape: FaceShape): Promise<Hairstyle[]> {
	return (await getAllHairstyles()).filter((h) =>
		h.data.faceShapes.includes(shape),
	);
}

export async function byHairType(type: HairType): Promise<Hairstyle[]> {
	return (await getAllHairstyles()).filter((h) => h.data.hairTypes.includes(type));
}

export async function byLength(length: Length): Promise<Hairstyle[]> {
	return (await getAllHairstyles()).filter((h) => h.data.length === length);
}

export async function popular(limit?: number): Promise<Hairstyle[]> {
	const list = (await getAllHairstyles()).filter((h) => h.data.popular);
	return limit ? list.slice(0, limit) : list;
}

export async function trending(limit?: number): Promise<Hairstyle[]> {
	const list = (await getAllHairstyles()).filter((h) => h.data.trending);
	return limit ? list.slice(0, limit) : list;
}

export async function getCategories(): Promise<CategoryEntry[]> {
	return (await getCollection('categories')).sort(
		(a, b) => a.data.order - b.data.order,
	);
}

/**
 * Related styles for a detail page.
 *
 * Explicit `related` slugs come first and in the author's order. If there are
 * fewer than `limit`, the remainder is filled by scoring every other style on
 * shared category, face shape, hair type and length — so no page is ever a
 * dead end, however sparse its frontmatter.
 */
export async function relatedTo(
	style: Hairstyle,
	limit = 6,
): Promise<Hairstyle[]> {
	const all = await getAllHairstyles();
	const picked: Hairstyle[] = [];
	const taken = new Set<string>([style.id]);

	for (const slug of style.data.related) {
		const match = all.find((h) => h.id === slug);
		if (match && !taken.has(match.id)) {
			picked.push(match);
			taken.add(match.id);
		}
	}
	if (picked.length >= limit) return picked.slice(0, limit);

	const overlap = <T>(a: readonly T[], b: readonly T[]) =>
		a.filter((v) => b.includes(v)).length;

	const scored = all
		.filter((h) => !taken.has(h.id))
		.map((h) => ({
			style: h,
			score:
				overlap(h.data.categories, style.data.categories) * 4 +
				overlap(h.data.faceShapes, style.data.faceShapes) * 2 +
				overlap(h.data.hairTypes, style.data.hairTypes) +
				(h.data.length === style.data.length ? 3 : 0) +
				(h.data.popular ? 1 : 0),
		}))
		.sort((a, b) => b.score - a.score || byName(a.style, b.style));

	for (const { style: candidate } of scored) {
		if (picked.length >= limit) break;
		picked.push(candidate);
	}
	return picked;
}

/** Every distinct value actually used, for building facet pages and filters. */
export async function facetCounts() {
	const all = await getAllHairstyles();
	const tally = <T extends string>(pick: (h: Hairstyle) => readonly T[]) => {
		const map = new Map<T, number>();
		for (const h of all) for (const v of pick(h)) map.set(v, (map.get(v) ?? 0) + 1);
		return map;
	};
	return {
		categories: tally((h) => h.data.categories),
		faceShapes: tally((h) => h.data.faceShapes),
		hairTypes: tally((h) => h.data.hairTypes),
		lengths: tally((h) => [h.data.length]),
		total: all.length,
	};
}
