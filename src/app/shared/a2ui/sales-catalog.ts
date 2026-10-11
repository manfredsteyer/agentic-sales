import { createAngularCatalog } from '@copilotkit/angular/a2ui';
import { ProductCarousel } from './product-carousel';
import {
  SALES_CATALOG_ID,
  salesCatalogDefinitions,
} from './sales-catalog-definitions';

export const salesCatalog = createAngularCatalog(
  salesCatalogDefinitions,
  { ProductCarousel },
  { catalogId: SALES_CATALOG_ID, includeBasicCatalog: true },
);
