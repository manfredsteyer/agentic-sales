import {
  basicCatalog,
  Catalog,
  extractCatalogComponentSchemas,
} from '@copilotkit/a2ui-renderer/web-components';
import {
  SALES_CATALOG_ID,
  salesCatalogDefinitions,
} from '@shared/a2ui/sales-catalog-definitions';

const salesComponents = Object.entries(salesCatalogDefinitions).map(
  ([name, { props }]) => ({ name, schema: props }),
);

export const salesCatalogSchema = extractCatalogComponentSchemas(
  new Catalog(SALES_CATALOG_ID, [
    ...basicCatalog.components.values(),
    ...salesComponents,
  ]),
);
