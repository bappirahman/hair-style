/** Site-wide constants. Change `SITE.url` before deploying to a real domain. */
export const SITE = {
	url: 'https://hairstylepreview.com',
	name: 'Hairstyle Preview',
	tagline: 'Find your perfect hairstyle',
	description:
		'Upload a photo, pick from 45 hairstyles and see the result instantly. Every preview is composited in your browser — your photo never leaves your device.',
	locale: 'en_GB',
	twitter: '@hairstylepreview',
} as const;

/** Absolute URL for a site-relative path. */
export const abs = (path: string): string =>
	new URL(path, SITE.url).href.replace(/\/$/, '') || SITE.url;
