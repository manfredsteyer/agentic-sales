import { productCarouselSchema } from './product-carousel-schema';

export const SALES_CATALOG_ID =
  'https://angulararchitects.io/a2ui/sales-catalog.json';

export const salesCatalogDefinitions = {
  ProductCarousel: { props: productCarouselSchema as never },
};
