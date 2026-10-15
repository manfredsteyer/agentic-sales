# Solution

## TODO #1: Activate A2UI with the basic catalog

File: `src/app/app.config.ts`

Import the basic catalog:

```ts
import { basicCatalog } from '@copilotkit/angular/a2ui';
```

Replace the TODO in `provideCopilotKit` with the `a2ui` option:

```ts
provideCopilotKit({
  defaultToolRendering: true,
  enableInspector: false,
  a2ui: { catalog: basicCatalog, includeSchema: false },
}),
```

`includeSchema: false` is set because the agent already puts the catalog into
its prompt on the server side.

## TODO #2: Iterate the items and delegate to `app-a2ui-surface`

File: `src/app/feature-dashboard/dashboard-view/dashboard-view.html`

Replace the TODO inside `<div class="tiles">` with:

```html
@for (item of store.items(); track item.surfaceId) {
<app-a2ui-surface [operations]="item.messages" />
} @empty {
<div class="empty card">
  <span class="empty-icon" aria-hidden="true">
    <img src="icons/grid-plus.svg" width="22" height="22" alt="" />
  </span>
  <p class="empty-title">No tiles yet</p>
  <p class="hint">
    Ask the assistant to add a chart or a table to the dashboard.
  </p>
</div>
}
```

## TODO #3: Call `copilot-a2ui-surface` and handle the explore event

File: `src/app/shared/a2ui-surface.ts`

In the template, replace the TODO inside `<figure>` with:

```html
<copilot-a2ui-surface
  [operations]="operations()"
  [catalog]="catalog"
  (action)="handleAction($event)"
/>
```

Replace the TODO in `handleAction` with:

```ts
protected handleAction(message: A2UIClientEventMessage): void {
  const { name, context } = message.userAction;
  if (name === 'explore') {
    void this.router.navigate([
      '/explorer',
      { filter: toExplorerFilter(context) },
    ]);
  }
}
```

The `a2ui` branch passes `basicCatalog` here (`catalog = basicCatalog`). The
starter already uses `salesCatalog`, so the `catalog` field stays as it is.

## TODO #4: Make `products` an input

File: `src/app/shared/a2ui/product-carousel.ts`

Replace the signal with an input:

```ts
readonly products = input<Product[]>();
```

Remove `signal` from the `@angular/core` import:

```ts
import { Component, computed, input, linkedSignal } from '@angular/core';
```

The renderer sets the resolved component props as inputs, so `products` has to
be an input, not a plain signal.

## TODO #5: Define the `products` prop

File: `shared/a2ui/product-carousel-schema.ts`

Replace the TODOs in `productCarouselSchema` with a union of the literal product
array and the data-model binding, plus the description:

```ts
export const productCarouselSchema = z.object({
  products: z.union([z.array(productSchema), productsBindingSchema]).describe(`
    Products the carousel shows one after another with their image, name and revenue,
    together with the total revenue of all of them
  `),
});
```

## TODO #6: Add the `ProductCarousel` entry to the catalog definitions

File: `shared/a2ui/sales-catalog-definitions.ts`

Import the schema:

```ts
import { productCarouselSchema } from './product-carousel-schema';
```

Replace the TODO with the entry, before `BarChart`:

```ts
export const salesCatalogDefinitions = {
  ProductCarousel: { props: productCarouselSchema as never },
  BarChart: { props: barChartSchema as never },
  PieChart: { props: pieChartSchema as never },
  PivotTable: { props: pivotTableSchema as never },
};
```

## TODO #7: Use the definitions and register the component

File: `src/app/shared/a2ui/sales-catalog.ts`

Extend the imports:

```ts
import {
  SALES_CATALOG_ID,
  salesCatalogDefinitions,
} from '@shared/a2ui/sales-catalog-definitions';
import { ProductCarousel } from './product-carousel';
```

Pass `salesCatalogDefinitions` instead of `{}` and register the
`ProductCarousel` component:

```ts
export const salesCatalog = createAngularCatalog(
  salesCatalogDefinitions,
  {
    ProductCarousel,
    BarChart: A2uiBarChart,
    PieChart: A2uiPieChart,
    PivotTable: A2uiPivotTable,
  },
  { catalogId: SALES_CATALOG_ID, includeBasicCatalog: true },
);
```

## TODO #8: Register the catalog in `app.config.ts`

Files: `src/app/shared/a2ui/sales-catalog.ts` (remove the TODO) and
`src/app/app.config.ts`

In `app.config.ts`, replace the `basicCatalog` import from TODO #1 with the
sales catalog:

```ts
import { salesCatalog } from './shared/a2ui/sales-catalog';
```

Then switch the `a2ui` option to it:

```ts
a2ui: { catalog: salesCatalog, includeSchema: false },
```

Because of `includeBasicCatalog: true`, the sales catalog still contains all
basic components.
