import { querySchema } from '@shared/query-schema';
import { z } from 'zod';

export const runQuerySchema = z.object({
  spec: querySchema,
});

export type RunQueryArgs = z.infer<typeof runQuerySchema>;
