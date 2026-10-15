import { createAngularCatalog } from '@copilotkit/angular/a2ui';
import { SALES_CATALOG_ID } from '@shared/a2ui/sales-catalog-definitions';
import { A2uiBarChart } from './a2ui-bar-chart';
import { A2uiPieChart } from './a2ui-pie-chart';
import { A2uiPivotTable } from './a2ui-pivot-table';

export const salesCatalog = createAngularCatalog(
  // TODO #7: Replace {} with salesCatalogDefinitions
  {},
  {
    // TODO #7: Register salesCatalog
    BarChart: A2uiBarChart,
    PieChart: A2uiPieChart,
    PivotTable: A2uiPivotTable,
  },
  { catalogId: SALES_CATALOG_ID, includeBasicCatalog: true },
);

// TODO #8: Register catalog in app.config.ts
