import {
  formatValidationErrors,
  validateA2UIComponents,
} from '@ag-ui/a2ui-toolkit';
import {
  basicCatalog,
  extractCatalogComponentSchemas,
} from '@copilotkit/a2ui-renderer/web-components';

export interface RenderA2uiArgs extends Record<string, unknown> {
  surfaceId: string;
  components: Record<string, unknown>[];
  data?: Record<string, unknown>;
}

export function validateSurface(args: RenderA2uiArgs): void {
  const { valid, errors } = validateA2UIComponents({
    components: args.components,
    data: args.data,
    catalog: extractCatalogComponentSchemas(basicCatalog),
  });
  if (!valid) {
    throw new Error(formatValidationErrors(errors));
  }
}
