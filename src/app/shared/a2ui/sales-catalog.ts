import { createAngularCatalog } from '@copilotkit/angular/a2ui';
import {
  SALES_CATALOG_ID,
  salesCatalogDefinitions,
} from '@shared/a2ui/sales-catalog-definitions';
import { ProductCarousel } from './product-carousel';

export const salesCatalog = createAngularCatalog(
  salesCatalogDefinitions,
  { ProductCarousel },
  { catalogId: SALES_CATALOG_ID, includeBasicCatalog: true },
);
