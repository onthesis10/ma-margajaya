import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const newsCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/news" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    category: z.string(),
    excerpt: z.string(),
    cover: z.string(),
    status: z.enum(['published', 'draft']).default('published'),
  }),
});

export const collections = {
  'news': newsCollection,
};
