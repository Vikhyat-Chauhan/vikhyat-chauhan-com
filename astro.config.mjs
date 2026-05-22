import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://vikhyatchauhan.com',
  adapter: netlify(),
  integrations: [mdx(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
