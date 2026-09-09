/**
 * Hand-rolled sitemap rather than the integration, so lastmod and priority can
 * reflect what each page actually is: detail pages carry their content's
 * `updated` date, hubs carry the newest date beneath them.
 */

import type { APIRoute } from 'astro';

import { getAllHairstyles, getCategories } from '../lib/catalog.ts';
import { abs } from '../lib/site.ts';
import { FACE_SHAPES, HAIR_TYPES } from '../lib/taxonomy.ts';

interface Entry {
	path: string;
	priority: number;
	changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
	lastmod: Date;
}

export const GET: APIRoute = async () => {
	const styles = await getAllHairstyles();
	const categories = await getCategories();
	const newest = styles.reduce(
		(max, s) => (s.data.updated > max ? s.data.updated : max),
		new Date(0),
	);

	const entries: Entry[] = [
		{ path: '/', priority: 1, changefreq: 'weekly', lastmod: newest },
		{ path: '/try', priority: 0.9, changefreq: 'monthly', lastmod: newest },
		{ path: '/hairstyles', priority: 0.9, changefreq: 'weekly', lastmod: newest },
		{ path: '/popular', priority: 0.8, changefreq: 'weekly', lastmod: newest },
		{ path: '/trending', priority: 0.8, changefreq: 'weekly', lastmod: newest },
		{ path: '/categories', priority: 0.7, changefreq: 'monthly', lastmod: newest },
		{ path: '/face-shapes', priority: 0.7, changefreq: 'monthly', lastmod: newest },
		{ path: '/hair-types', priority: 0.7, changefreq: 'monthly', lastmod: newest },
		{ path: '/about', priority: 0.4, changefreq: 'yearly', lastmod: newest },
		{ path: '/privacy', priority: 0.4, changefreq: 'yearly', lastmod: newest },
		...styles.map((s): Entry => ({
			path: `/hairstyles/${s.id}`,
			priority: s.data.popular ? 0.8 : 0.7,
			changefreq: 'monthly',
			lastmod: s.data.updated,
		})),
		...categories.map((c): Entry => ({
			path: `/categories/${c.id}`,
			priority: 0.6,
			changefreq: 'monthly',
			lastmod: newest,
		})),
		...FACE_SHAPES.map((s): Entry => ({
			path: `/face-shapes/${s}`,
			priority: 0.6,
			changefreq: 'monthly',
			lastmod: newest,
		})),
		...HAIR_TYPES.map((t): Entry => ({
			path: `/hair-types/${t}`,
			priority: 0.6,
			changefreq: 'monthly',
			lastmod: newest,
		})),
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		(e) => `\t<url>
\t\t<loc>${abs(e.path)}</loc>
\t\t<lastmod>${e.lastmod.toISOString().slice(0, 10)}</lastmod>
\t\t<changefreq>${e.changefreq}</changefreq>
\t\t<priority>${e.priority.toFixed(1)}</priority>
\t</url>`,
	)
	.join('\n')}
</urlset>
`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
};
