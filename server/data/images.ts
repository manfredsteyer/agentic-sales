import { join } from 'node:path';
import type { Row } from './sales-dal.ts';

export const IMAGES_DIR = join(import.meta.dirname, '..', 'images');

const imageUrlSources: Record<string, string> = {
  itemimageurl: 'ItemName',
  itemcategoryimageurl: 'ItemCategory',
};

export function findImageUrlSource(column: string): string | undefined {
  return imageUrlSources[column.toLowerCase()];
}

function toImageFileName(name: string): string {
  return `${name.toLowerCase().replaceAll(/[^a-z0-9]/g, '_')}.svg`;
}

export function withImageUrls(row: Row, baseUrl: string): Row {
  const urls: Row = {};
  if (typeof row.ItemName === 'string') {
    urls.ItemImageUrl = `${baseUrl}/products/${toImageFileName(row.ItemName)}`;
  }
  if (typeof row.ItemCategory === 'string') {
    urls.ItemCategoryImageUrl = `${baseUrl}/categories/${toImageFileName(row.ItemCategory)}`;
  }
  return { ...row, ...urls };
}
