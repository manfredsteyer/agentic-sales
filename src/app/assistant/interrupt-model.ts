import { type Interrupt } from '@ag-ui/core';

export interface InterruptOption {
  label: string;
  payload: unknown;
}

/** An open question of the agent, ready for the chat to render. */
export interface InterruptModel {
  id: string;
  message: string;
  options: InterruptOption[];
}

// The Mastra adapter puts the payload of the suspended tool into the metadata.
interface InterruptMetadata {
  mastra?: {
    suspendPayload?: { message?: unknown; options?: unknown };
  };
}

const DEFAULT_OPTIONS: InterruptOption[] = [
  { label: 'Approve', payload: { approved: true } },
  { label: 'Decline', payload: { approved: false } },
];

/** Reads question and options from the suspend payload, with a yes/no fallback. */
export function toInterruptModel(interrupt: Interrupt): InterruptModel {
  const metadata = interrupt.metadata as InterruptMetadata | undefined;
  const payload = metadata?.mastra?.suspendPayload;
  const options = Array.isArray(payload?.options) ? (payload.options as InterruptOption[]) : [];
  return {
    id: interrupt.id,
    message:
      typeof payload?.message === 'string'
        ? payload.message
        : (interrupt.message ?? 'The agent needs your approval.'),
    options: options.length > 0 ? options : DEFAULT_OPTIONS,
  };
}
