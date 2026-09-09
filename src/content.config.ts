import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

import {
	CATEGORIES,
	FACE_SHAPES,
	HAIR_TYPES,
	LENGTHS,
	MAINTENANCE,
} from './lib/taxonomy.ts';

const hairstyles = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/hairstyles' }),
	schema: z.object({
		name: z.string(),
		/** Card/nav label when the full name is too long. */
		shortName: z.string().optional(),
		/** One-sentence summary; also the meta description fallback. */
		summary: z.string(),

		category: z.enum(CATEGORIES),
		categories: z.array(z.enum(CATEGORIES)).min(1),
		length: z.enum(LENGTHS),
		hairTypes: z.array(z.enum(HAIR_TYPES)).min(1),
		faceShapes: z.array(z.enum(FACE_SHAPES)).min(1),
		maintenance: z.enum(MAINTENANCE),
		maintenanceNote: z.string(),

		/** Id of the overlay asset in `src/data/overlay-manifest.json`. */
		overlay: z.string(),
		/** Descriptive alt text for the catalog image. Never templated. */
		imageAlt: z.string(),

		popular: z.boolean().default(false),
		trending: z.boolean().default(false),
		/** Lower ranks sort first on the popular and trending listings. */
		rank: z.number().optional(),

		/** Explicit related slugs; the catalog falls back to scoring. */
		related: z.array(z.string()).default([]),
		/** What to actually say in the barber's chair. */
		barberAsk: z.string(),
		stylingSteps: z
			.array(z.object({ title: z.string(), detail: z.string() }))
			.default([]),
		products: z.array(z.string()).default([]),
		faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),

		seoTitle: z.string(),
		seoDescription: z.string(),
		updated: z.coerce.date(),
	}),
});

const categories = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/categories' }),
	schema: z.object({
		name: z.string(),
		tagline: z.string(),
		seoTitle: z.string(),
		seoDescription: z.string(),
		order: z.number().default(50),
	}),
});

export const collections = { hairstyles, categories };
