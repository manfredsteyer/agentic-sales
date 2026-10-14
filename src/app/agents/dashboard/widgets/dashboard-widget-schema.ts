import { z } from 'zod';
import { querySchema } from '../../../shared/query-schema';

export const runQuerySchema = z.object({
  spec: querySchema,
});

export type RunQueryArgs = z.infer<typeof runQuerySchema>;
