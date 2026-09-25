import { z } from 'zod';
import { querySchema } from '../../../data/query-model';

export const runQuerySchema = z.object({
  spec: querySchema,
});

export type RunQueryArgs = z.infer<typeof runQuerySchema>;
