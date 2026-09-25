import type { RequestHandler } from 'express';
import type { SalesDal } from '../data/sales-dal.ts';

export function schemaHandler(dal: SalesDal): RequestHandler {
  return (req, res) => res.json({ table: dal.table, columns: dal.columns });
}
