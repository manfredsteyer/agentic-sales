// Human in the loop for large results: a query with more than MAX_ROWS result
// rows suspends its tool. The AG-UI adapter turns the suspension into an
// interrupt, the chat asks the user, and the answer comes back as resumeData
// when the run is resumed.
import { z } from 'zod';

import { MAX_ROWS } from '../config';

export const approvalSuspendSchema = z.object({
  message: z.string(),
  rowCount: z.number(),
  maxRows: z.number(),
  options: z.array(
    z.object({ label: z.string(), payload: z.object({ approved: z.boolean() }) }),
  ),
});

export const approvalResumeSchema = z.object({
  approved: z.boolean(),
});

/** Tool result when the query was not (yet) executed. */
export const notExecutedSchema = z.object({
  status: z.enum(['awaiting-approval', 'declined']),
  message: z.string(),
});

type NotExecuted = z.infer<typeof notExecutedSchema>;

export interface ApprovalContext {
  agent?: {
    suspend: (payload: z.infer<typeof approvalSuspendSchema>) => Promise<void>;
    resumeData?: z.infer<typeof approvalResumeSchema>;
  };
}

export const DECLINED: NotExecuted = {
  status: 'declined',
  message: 'The user declined this query because of its size.',
};

const numberFormat = new Intl.NumberFormat('en-US');

/**
 * Runs the query and returns its result, unless the result has more than
 * MAX_ROWS rows and the user has not approved it: then the tool suspends and
 * asks. Queries only read, so running one before asking is harmless.
 */
export async function withRowLimit<T>(
  context: ApprovalContext | undefined,
  query: () => Promise<T>,
  rowCount: (result: T) => number,
): Promise<T | NotExecuted> {
  const approval = context?.agent?.resumeData;
  if (approval && !approval.approved) {
    return DECLINED;
  }

  const result = await query();
  const rows = rowCount(result);
  if (rows <= MAX_ROWS || approval?.approved) {
    return result;
  }
  return askForApproval(context, rows);
}

/** Suspends the tool with the approval question for a result of `rows` rows. */
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
