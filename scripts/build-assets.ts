/**
 * Renders every hairstyle spec to its shipped assets.
 *
 *   bun run assets
 *
 * Outputs, all committed so `astro build` never needs to run this:
 *   public/overlays/{id}-{1024,512}.webp   transparent try-on overlays
 *   src/assets/hairstyles/{id}.webp        catalog master, hair on a head plate
 *   src/data/overlay-manifest.json         size + eye anchors per overlay
 *
 * The manifest is the contract between this script and the studio: it records
 * where the eyes sit inside each trimmed overlay, which is what lets the
 * browser solve alignment from two clicks.
 */

import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

import { CANVAS, EYE_L, EYE_R } from './hair/head.ts';
import { buildMannequinSvg, SKIN_TONES, type SkinTone } from './hair/mannequin.ts';
import { buildHairSvg } from './hair/render.ts';
import { STYLE_SPECS } from './hair/styles.ts';

const OVERLAY_DIR = 'public/overlays';
const THUMB_DIR = 'src/assets/hairstyles';
const DEMO_DIR = 'src/assets/demo';
const FONT_DIR = 'public/fonts';

/**
 * Latin subsets only, copied to a stable path so the layout can preload them.
 * Importing the fontsource CSS instead works, but Vite hashes the emitted
 * filenames, and a font you cannot name is a font you cannot preload.
 */
const FONTS = [
	['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter-latin.woff2'],
	['@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2', 'fraunces-latin.woff2'],
] as const;
const MANIFEST = 'src/data/overlay-manifest.json';

/** Portrait crop applied to the catalog master: 4:5, with headroom for an afro. */
const CROP = { left: 152, top: 158, width: 720, height: 900 } as const;
const THUMB_WIDTH = 1000;

export interface OverlayEntry {
	id: string;
	width: number;
	height: number;
	/** Eye anchors in the overlay's own pixel space, at `width` × `height`. */
	leftEye: [number, number];
	rightEye: [number, number];
}

/** Rasterise an SVG string at the exact canonical canvas size. */
function raster(svg: string) {
	return sharp(Buffer.from(svg), { density: 96 }).resize(
		CANVAS.width,
		CANVAS.height,
		{ fit: 'fill' },
	);
}

/**
 * Tightest box containing any non-transparent pixel. Done by hand rather than
 * with sharp's trim() so the offsets are exact — the eye anchors are shifted
 * by them and a few pixels of drift is a visibly misplaced hairline.
 */
function alphaBounds(data: Buffer, width: number, height: number) {
	let minX = width;
	let minY = height;
	let maxX = -1;
	let maxY = -1;
	for (let y = 0; y < height; y++) {
		const row = y * width * 4;
		for (let x = 0; x < width; x++) {
			if (data[row + x * 4 + 3]! > 2) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	}
	if (maxX < 0) throw new Error('overlay is fully transparent');
	return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** Pair each style with a skin tone that reads naturally against its hair. */
function toneFor(index: number, palette: string | undefined): SkinTone {
	const light = SKIN_TONES.filter((t) => t.id !== 'deep');
	// Blonde and mid-brown hair is paired with fairer tones; the near-black
	// palettes rotate across all three.
	const pool = palette === 'sand' || palette === 'chestnut' ? light : SKIN_TONES;
	return pool[index % pool.length]!;
}

async function main() {
	await mkdir(OVERLAY_DIR, { recursive: true });
	await mkdir(THUMB_DIR, { recursive: true });
	await mkdir(DEMO_DIR, { recursive: true });
	await mkdir(FONT_DIR, { recursive: true });
	for (const [from, to] of FONTS) {
		await copyFile(`node_modules/${from}`, `${FONT_DIR}/${to}`);
	}
	await mkdir('src/data', { recursive: true });

	const manifest: OverlayEntry[] = [];
	const plates = new Map<string, Buffer>();
	for (const tone of SKIN_TONES) {
		plates.set(
			tone.id,
			await raster(buildMannequinSvg(tone)).png().toBuffer(),
		);
	}

	// Bare head plates, used as the "before" half of the homepage comparison.
	for (const tone of SKIN_TONES) {
		await sharp(plates.get(tone.id)!)
			.extract(CROP)
			.resize({ width: THUMB_WIDTH })
			.webp({ quality: 86, effort: 5 })
			.toFile(`${DEMO_DIR}/before-${tone.id}.webp`);
	}

	let i = 0;
	for (const spec of STYLE_SPECS) {
		const { svg } = buildHairSvg(spec);
		const full = await raster(svg).png().toBuffer();

		// ---- Transparent overlay -----------------------------------------
		const { data, info } = await sharp(full)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		const box = alphaBounds(data, info.width, info.height);
		const cropped = sharp(full).extract(box);

		for (const w of [1024, 512]) {
			const scale = w / box.width;
			await cropped
				.clone()
				.resize({ width: w })
				.webp({ quality: 88, alphaQuality: 92, effort: 5 })
				.toFile(`${OVERLAY_DIR}/${spec.id}-${w}.webp`);
			if (w === 1024) {
				manifest.push({
					id: spec.id,
					width: w,
					height: Math.round(box.height * scale),
					leftEye: [
						+((EYE_L.x - box.left) * scale).toFixed(2),
						+((EYE_L.y - box.top) * scale).toFixed(2),
					],
					rightEye: [
						+((EYE_R.x - box.left) * scale).toFixed(2),
						+((EYE_R.y - box.top) * scale).toFixed(2),
					],
				});
			}
		}

		// ---- Catalog master ----------------------------------------------
		const paletteName =
			spec.palette?.spec === '#eed9a6'
				? 'sand'
				: spec.palette?.spec === '#e0bb85'
					? 'chestnut'
					: undefined;
		const tone = toneFor(i, paletteName);
		// Composited in its own pass: sharp resolves extract/resize relative to
		// the *input* size, so chaining them onto a composite crops the plate
		// rather than the finished portrait.
		const plate = await sharp(plates.get(tone.id)!)
			.composite([{ input: full }])
			.png()
			.toBuffer();
		await sharp(plate)
			.extract(CROP)
			.resize({ width: THUMB_WIDTH })
			.webp({ quality: 86, effort: 5 })
			.toFile(`${THUMB_DIR}/${spec.id}.webp`);

		i++;
		process.stdout.write(`\r  ${i}/${STYLE_SPECS.length} ${spec.id.padEnd(24)}`);
	}

	// Social card: three finished previews on the brand ground.
	const cardW = 1200;
	const cardH = 630;
	const tileW = 300;
	const tileH = 375;
	const featured = ['mid-fade', 'textured-crop', 'curly-fade'];
	const tiles = await Promise.all(
		featured.map(async (id, n) => ({
			input: await sharp(`${THUMB_DIR}/${id}.webp`)
				.resize(tileW, tileH, { fit: 'cover' })
				.png()
				.toBuffer(),
			left: 132 + n * (tileW + 12),
			top: Math.round((cardH - tileH) / 2),
		})),
	);
	await sharp({
		create: {
			width: cardW,
			height: cardH,
			channels: 3,
			background: '#faf7f2',
		},
	})
		.composite(tiles)
		.png()
		.toFile('public/og-default.png');

	manifest.sort((a, b) => a.id.localeCompare(b.id));
	await writeFile(MANIFEST, `${JSON.stringify(manifest, null, '\t')}\n`);
	process.stdout.write(`\rBuilt ${manifest.length} overlays and catalog masters.\n`);
}

await main();
