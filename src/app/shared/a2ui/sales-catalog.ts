import { createAngularCatalog } from '@copilotkit/angular/a2ui';
import { A2uiBarChart } from './a2ui-bar-chart';
import { A2uiMcpApp } from './a2ui-mcp-app';
import { A2uiPieChart } from './a2ui-pie-chart';
import { A2uiPivotTable } from './a2ui-pivot-table';
import { ProductCarousel } from './product-carousel';
import {
  SALES_CATALOG_ID,
  salesCatalogDefinitions,
} from './sales-catalog-definitions';

export const salesCatalog = createAngularCatalog(
  salesCatalogDefinitions,
  {
    ProductCarousel,
    BarChart: A2uiBarChart,
    PieChart: A2uiPieChart,
    PivotTable: A2uiPivotTable,
    McpApp: A2uiMcpApp,
  },
  { catalogId: SALES_CATALOG_ID, includeBasicCatalog: true },
);
