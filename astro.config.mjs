// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Domain resmi — digunakan untuk canonical URL dan sitemap
  site: 'https://www.mamargajaya.sch.id',
  integrations: [
    tailwind(),
    sitemap({
      // Kecualikan halaman admin dari sitemap (tidak perlu diindeks Google)
      filter: (page) => !page.includes('/admin'),
    }),
  ],
});

