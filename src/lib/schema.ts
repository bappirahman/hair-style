/**
 * JSON-LD builders.
 *
 * Every structured-data block on the site comes from here so the entity graph
 * stays consistent: one Organization, one WebSite, and per-page nodes that
 * reference them by @id rather than redeclaring them.
 */

import { abs, SITE } from './site.ts';

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;

export interface Crumb {
	name: string;
	href: string;
}

export function organizationSchema() {
	return {
		'@type': 'Organization',
		'@id': ORG_ID,
		name: SITE.name,
		url: SITE.url,
		description: SITE.description,
	};
}

export function websiteSchema() {
	return {
		'@type': 'WebSite',
		'@id': SITE_ID,
		url: SITE.url,
		name: SITE.name,
		description: SITE.description,
		publisher: { '@id': ORG_ID },
		inLanguage: 'en-GB',
		potentialAction: {
			'@type': 'SearchAction',
			target: {
				'@type': 'EntryPoint',
				urlTemplate: `${SITE.url}/hairstyles?q={search_term_string}`,
			},
			'query-input': 'required name=search_term_string',
		},
	};
}

export function breadcrumbSchema(crumbs: Crumb[]) {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: crumbs.map((c, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: c.name,
			item: abs(c.href),
		})),
	};
}

export function itemListSchema(
	items: Array<{ name: string; href: string; image?: string }>,
	name: string,
) {
	return {
		'@type': 'ItemList',
		name,
		numberOfItems: items.length,
		itemListElement: items.map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			url: abs(item.href),
			name: item.name,
			...(item.image ? { image: abs(item.image) } : {}),
		})),
	};
}

export function faqSchema(faq: Array<{ q: string; a: string }>) {
	return {
		'@type': 'FAQPage',
		mainEntity: faq.map((item) => ({
			'@type': 'Question',
			name: item.q,
			acceptedAnswer: { '@type': 'Answer', text: item.a },
		})),
	};
}

export function articleSchema(input: {
	headline: string;
	description: string;
	href: string;
	image: string;
	updated: Date;
}) {
	return {
		'@type': 'Article',
		headline: input.headline,
		description: input.description,
		image: abs(input.image),
		mainEntityOfPage: { '@type': 'WebPage', '@id': abs(input.href) },
		dateModified: input.updated.toISOString(),
		author: { '@id': ORG_ID },
		publisher: { '@id': ORG_ID },
		isPartOf: { '@id': SITE_ID },
	};
}

export function howToSchema(input: {
	name: string;
	description: string;
	steps: Array<{ title: string; detail: string }>;
}) {
	return {
		'@type': 'HowTo',
		name: input.name,
		description: input.description,
		step: input.steps.map((s, i) => ({
			'@type': 'HowToStep',
			position: i + 1,
			name: s.title,
			text: s.detail,
		})),
	};
}

/** Wrap a set of nodes into a single @graph document. */
export function graph(...nodes: object[]) {
	return JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': nodes,
	});
}
