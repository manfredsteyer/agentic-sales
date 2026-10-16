import { randomUUID } from 'node:crypto';
import type { RequestContext } from '@mastra/core/request-context';
import { z } from 'zod';
import { MAX_ROWS } from '../config';

export const approvalSuspendSchema = z.object({
  message: z.string(),
  rowCount: z.number(),
  maxRows: z.number(),
  options: z.array(
    z.object({
      label: z.string(),
      payload: z.object({ approved: z.boolean() }),
    }),
  ),
});

export const approvalResumeSchema = z.object({
  approved: z.boolean(),
});

export const notExecutedSchema = z.object({
  status: z.enum(['awaiting-approval', 'declined']),
  message: z.string(),
});

export type NotExecuted = z.infer<typeof notExecutedSchema>;

export interface ApprovalContext {
  requestContext?: RequestContext;
  agent?: {
    suspend: (payload: z.infer<typeof approvalSuspendSchema>) => Promise<void>;
    resumeData?: z.infer<typeof approvalResumeSchema>;
    suspendPayload?: z.infer<typeof approvalSuspendSchema>;
  };
}

export const DECLINED: NotExecuted = {
  status: 'declined',
  message: 'The user declined this query because of its size.',
};

const numberFormat = new Intl.NumberFormat('en-US');

const RUN_KEY = 'approvalRunKey';

// assume a single server process and no cleanup for simplicity
const approvedRows = new Map<string, number>();

export async function withRowLimit<T>(
  context: ApprovalContext | undefined,
  query: () => Promise<T>,
  rowCount: (result: T) => number,
): Promise<T | NotExecuted> {
  const approval = context?.agent?.resumeData;
  if (approval && !approval.approved) {
    return DECLINED;
  }
  rememberApproval(context);

  const result = await query();
  const rows = rowCount(result);
  if (rows <= MAX_ROWS || approval?.approved || isApproved(context, rows)) {
    return result;
  }
  return askForApproval(context, rows);
}

export function rememberApproval(context: ApprovalContext | undefined): void {
  const rows = context?.agent?.suspendPayload?.rowCount;
  if (rows === undefined || !context?.agent?.resumeData?.approved) {
    return;
  }
  const key = runKey(context);
  approvedRows.set(key, Math.max(approvedRows.get(key) ?? 0, rows));
}

export function isApproved(
  context: ApprovalContext | undefined,
  rows: number,
): boolean {
  const approved = approvedRows.get(runKey(context)) ?? 0;
  return rows <= approved;
}

export async function askForApproval(
  context: ApprovalContext | undefined,
  rows: number,
): Promise<NotExecuted> {
  await context?.agent?.suspend({
    message:
      `The query returns ${numberFormat.format(rows)} rows, more than the limit ` +
      `of ${numberFormat.format(MAX_ROWS)}. Run it anyway?`,
    rowCount: rows,
    maxRows: MAX_ROWS,
    options: [
      { label: 'Run', payload: { approved: true } },
      { label: 'Cancel', payload: { approved: false } },
    ],
  });
  return {
    status: 'awaiting-approval',
    message: `The result has ${rows} rows; waiting for the user's approval.`,
  };
}

function runKey(context: ApprovalContext | undefined): string {
  const requestContext = context?.requestContext;
  const key = requestContext?.get<string, string>(RUN_KEY) ?? randomUUID();
  requestContext?.set(RUN_KEY, key);
  return key;
}
