import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    blurb: z.string(),
    date: z.coerce.date(),
    tag: z.string().default('Engineering'),
    readingTime: z.string().optional(),
    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),
    // If set, also expose this post at /projects/<projectSlug>
    projectSlug: z.string().optional(),
  }),
});

const personal = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/personal' }),
  schema: z.object({
    title: z.string(),
    blurb: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing, personal };
