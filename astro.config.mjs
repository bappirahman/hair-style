// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://hairstylepreview.com',
	output: 'static',
	trailingSlash: 'never',
	prefetch: {
		prefetchAll: true,
		defaultStrategy: 'viewport',
	},
	build: {
		inlineStylesheets: 'auto',
	},
	image: {
		responsiveStyles: true,
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
