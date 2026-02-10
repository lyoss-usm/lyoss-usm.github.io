// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [tailwindcss()]
    },
    image: {
        domains: ['avatars.githubusercontent.com', 'github.com']
    },
    output: 'static',
    site: 'https://lyoss.org',
    compressHTML: true,
    integrations: [mdx(), sitemap()]
});