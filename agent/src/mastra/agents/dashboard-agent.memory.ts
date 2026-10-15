import { Memory } from '@mastra/memory';
import { dashboardSchema } from '@shared/dashboard-schema';

export const dashboardMemory = new Memory({
  options: {
    readOnly: true,
    workingMemory: {
      enabled: true,
      schema: dashboardSchema,
    },
  },
});
