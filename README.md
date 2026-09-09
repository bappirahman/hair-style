# Hairstyle Preview

A hairstyle discovery catalogue with an in-browser virtual try-on. Browse 45
men's cuts, read what each one actually demands of you, then composite any of
them onto your own photo.

**No AI, no APIs, no uploads.** Every hairstyle is a drawn asset with recorded
eye anchors. Clicking your two eyes solves a similarity transform that maps
those anchors onto your face — fixing scale, rotation and position in one step —
and the browser composites the layers on a canvas. Nothing leaves the device.

## Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Dev server on `localhost:4321` |
| `bun run build` | Static build into `dist/` |
| `bun run preview` | Serve the built site |
| `bun run assets` | Regenerate every hairstyle asset (see below) |
| `bun run verify` | Post-build SEO and integrity checks |
| `bun run check` | Astro + TypeScript diagnostics |

## Adding a hairstyle

Two files, no code:

1. **`scripts/hair/styles.ts`** — add a `StyleSpec`. `thickness` is how far the
   hair stands off the scalp at each angle around the head (0 = viewer's right,
   90 = crown, 180 = viewer's left); `fringe` is how far it hangs below the
   natural hairline. Roughly: 3px is skin, 10px a buzz, 35px a typical short
   cut's top, 100px an afro.
2. **`src/content/hairstyles/<slug>.md`** — the catalog entry. `overlay` must
   match the spec's `id`. The schema is in `src/content.config.ts`.

Then `bun run assets` to render it and `bun run verify` after a build. Routes,
category pages, face-shape pages, the studio rail, the sitemap and the related
-styles graph all pick it up automatically.

## How the assets are made

`bun run assets` runs a parametric generator rather than shipping hand-drawn
files. For each style it:

1. builds a layered SVG from the spec (`scripts/hair/render.ts`) — silhouette,
   tonal ramp, crown sheen, strands that drift through the mass, boundary wisps,
   and a contact shadow that lands on the forehead;
2. rasterises it with sharp, trims the transparent margin, and records where the
   eye anchors ended up in `src/data/overlay-manifest.json`;
3. writes `public/overlays/<id>-{1024,512}.webp` for the studio and
   `src/assets/hairstyles/<id>.webp` — the same overlay composited over a
   neutral head plate — for the catalog.

Output is committed, so `bun run build` never needs to run the generator.

All 45 styles share one canonical head space (`scripts/hair/head.ts`), which is
what lets a single pair of eye clicks align every one of them.

## Layout

```
scripts/hair/          the asset generator: geometry, head space, specs, renderer
scripts/build-assets   rasterises everything and writes the manifest
scripts/verify.ts      post-build integrity checks
src/content/           45 hairstyle entries + 15 category entries (markdown)
src/lib/compose.ts     the transform maths — pure, DOM-free, shared by preview and export
src/lib/catalog.ts     the only module that queries the content collections
src/lib/schema.ts      JSON-LD builders
src/components/studio/ the try-on: markup plus one bundled script
```

## Notes

- Previews are **illustrations, not photographs**. They show silhouette, volume
  and hairline position — enough to rule shapes in and out, not a photorealistic
  prediction. The asset schema allows swapping any single style to a
  photographic cut-out PNG without code changes.
- Set `SITE.url` in `src/lib/site.ts` and the `Sitemap:` line in
  `public/robots.txt` before deploying — canonicals, Open Graph tags and the
  sitemap all derive from it.
- Content pages ship no framework JavaScript. The only scripts are Astro's
  viewport prefetch (2.5 kB), the catalog filter, and the studio.
