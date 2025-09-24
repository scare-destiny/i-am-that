import { defineCollection, z } from 'astro:content';

const quotes = defineCollection({
  type: 'content',
  schema: z.object({
    theme: z.enum([
      'reality','self-inquiry','awareness','consciousness','wisdom',
      'acceptance','unity','being','identity','liberation','presence','truth'
    ]),
    title: z.string(),
    page: z.number().optional(),
    difficulty: z.enum(['beginner','intermediate','advanced']).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { quotes };