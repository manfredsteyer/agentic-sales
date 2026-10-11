import {
  formatValidationErrors,
  validateA2UIComponents,
} from '@ag-ui/a2ui-toolkit';
import { salesCatalogSchema } from './sales-catalog';

export interface GenerateA2uiArgs extends Record<string, unknown> {
  surfaceId: string;
  components: Record<string, unknown>[];
  data?: Record<string, unknown>;
}

export function validateSurface(args: GenerateA2uiArgs): void {
  const { valid, errors } = validateA2UIComponents({
    components: args.components,
    data: args.data,
    catalog: salesCatalogSchema,
  });
  if (!valid) {
    throw new Error(formatValidationErrors(errors));
  }
}
