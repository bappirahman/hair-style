/**
 * Post-build integrity checks.
 *
 *   bun run build && bun run verify
 *
 * These are the failure modes that a content-driven SEO site actually suffers
 * from and that a type-checker cannot catch: a page with two H1s, a duplicated
 * meta description across 45 near-identical templates, a sitemap that drifted
 * from the routes, a related-styles link to a slug that was renamed.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const failures: string[] = [];
const notes: string[] = [];

const fail = (msg: string) => failures.push(msg);
const note = (msg: string) => notes.push(msg);

function htmlFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) out.push(...htmlFiles(path));
		else if (entry.endsWith('.html')) out.push(path);
	}
	return out;
}

if (!existsSync(DIST)) {
	console.error('No dist/ — run `bun run build` first.');
	process.exit(1);
}

const pages = htmlFiles(DIST);
const route = (file: string) =>
	file.replace(`${DIST}`, '').replace(/\/index\.html$/, '').replace(/\.html$/, '') || '/';

// ---- Content integrity -------------------------------------------------
const contentDir = 'src/content/hairstyles';
const slugs = new Set(
	readdirSync(contentDir)
		.filter((f) => f.endsWith('.md'))
		.map((f) => f.replace('.md', '')),
);
const overlayIds = new Set(
	(JSON.parse(readFileSync('src/data/overlay-manifest.json', 'utf8')) as Array<{ id: string }>)
		.map((entry) => entry.id),
);

for (const slug of slugs) {
	const raw = readFileSync(join(contentDir, `${slug}.md`), 'utf8');
	const frontmatter = raw.split('---')[1] ?? '';
	const overlay = /^overlay: (.+)$/m.exec(frontmatter)?.[1]?.trim();
	if (!overlay || !overlayIds.has(overlay)) {
		fail(`${slug}: overlay "${overlay}" has no asset — run \`bun run assets\``);
	}
	for (const related of /^related: \[(.*)\]$/m.exec(frontmatter)?.[1]?.split(',') ?? []) {
		const target = related.trim();
		if (!target) continue;
		if (!slugs.has(target)) fail(`${slug}: related slug "${target}" does not exist`);
		if (target === slug) fail(`${slug}: relates to itself`);
	}
}
note(`${slugs.size} hairstyles, all overlays present and related links resolve`);

// ---- Per-page head -----------------------------------------------------
const titles = new Map<string, string[]>();
const descriptions = new Map<string, string[]>();
const canonicals = new Map<string, string[]>();

for (const file of pages) {
	const html = readFileSync(file, 'utf8');
	const path = route(file);

	const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;
	if (h1s !== 1) fail(`${path}: ${h1s} <h1> elements, expected exactly 1`);

	const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
	const description = /<meta name="description" content="([^"]*)"/.exec(html)?.[1];
	const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];

	if (!title) fail(`${path}: no <title>`);
	if (!description) fail(`${path}: no meta description`);
	if (!canonical) fail(`${path}: no canonical URL`);
	if (title) titles.set(title, [...(titles.get(title) ?? []), path]);
	if (description) descriptions.set(description, [...(descriptions.get(description) ?? []), path]);
	if (canonical) canonicals.set(canonical, [...(canonicals.get(canonical) ?? []), path]);

	if (!/property="og:image"/.test(html)) fail(`${path}: no og:image`);

	for (const [, block] of html.matchAll(
		/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
	)) {
		try {
			JSON.parse(block);
		} catch (error) {
			fail(`${path}: invalid JSON-LD (${(error as Error).message})`);
		}
	}

	// An <img> without both dimensions is a layout shift waiting to happen.
	for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
		if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) {
			const src = /src="([^"]*)"/.exec(tag)?.[1] ?? tag.slice(0, 60);
			fail(`${path}: <img> without width/height — ${src}`);
		}
	}
}

for (const [key, map, label] of [
	['title', titles, 'title'],
	['description', descriptions, 'meta description'],
	['canonical', canonicals, 'canonical URL'],
] as const) {
	void key;
	for (const [value, where] of map) {
		if (where.length > 1) {
			fail(`duplicate ${label} on ${where.join(', ')}: "${value.slice(0, 60)}…"`);
		}
	}
}
note(`${pages.length} pages: one H1 each, unique title/description/canonical, valid JSON-LD`);

// ---- Internal links ----------------------------------------------------
const broken = new Map<string, number>();
for (const file of pages) {
	const html = readFileSync(file, 'utf8');
	for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
		if (/^\/(_astro|overlays|fonts)\//.test(href)) continue;
		if (/\.[a-z0-9]{2,5}$/i.test(href)) continue;
		const target = href === '/' ? `${DIST}/index.html` : `${DIST}${href}/index.html`;
		if (!existsSync(target)) broken.set(href, (broken.get(href) ?? 0) + 1);
	}
}
for (const [href, count] of broken) fail(`broken internal link ${href} (${count} references)`);
if (!broken.size) note('no broken internal links');

// ---- Sitemap -----------------------------------------------------------
const sitemap = readFileSync(`${DIST}/sitemap.xml`, 'utf8');
const listed = new Set(
	[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname || '/'),
);
for (const path of listed) {
	const target = path === '/' ? `${DIST}/index.html` : `${DIST}${path}/index.html`;
	if (!existsSync(target)) fail(`sitemap lists ${path}, which was not built`);
}
for (const file of pages) {
	const path = route(file);
	if (path === '/404') continue;
	if (!listed.has(path)) fail(`${path} was built but is missing from the sitemap`);
}
note(`sitemap lists ${listed.size} URLs, consistent with the build`);

// ---- Report ------------------------------------------------------------
for (const line of notes) console.log(`  ok   ${line}`);
for (const line of failures) console.error(`  FAIL ${line}`);
console.log(
	failures.length
		? `\n${failures.length} problem${failures.length === 1 ? '' : 's'} found.`
		: '\nAll checks passed.',
);
process.exit(failures.length ? 1 : 0);
