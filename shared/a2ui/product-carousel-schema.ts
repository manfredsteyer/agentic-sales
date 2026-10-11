import { z } from 'zod/v3';

const productSchema = z.object({
  name: z.string(),
  imageUrl: z.string(),
  revenue: z.number().describe('Revenue in USD as a number'),
});

const productsBindingSchema = z.object({
  path: z.string().describe('Path of the products in the data model'),
});

export const productCarouselSchema = z.object({
  products: z.union([z.array(productSchema), productsBindingSchema]).describe(`
    Products the carousel shows one after another with their image, name and revenue,
    together with the total revenue of all of them
  `),
});

export type Product = z.infer<typeof productSchema>;
