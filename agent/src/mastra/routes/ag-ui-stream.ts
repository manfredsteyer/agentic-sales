import {
  EventType,
  type AbstractAgent,
  type BaseEvent,
  type RunAgentInput,
} from '@ag-ui/client';
import type { SseWriter } from './route-utils';

export async function streamAgentEvents(
  sse: SseWriter,
  agent: AbstractAgent,
  input: RunAgentInput,
): Promise<void> {
  const send = (event: BaseEvent): Promise<void> =>
    sse.writeSSE({ data: JSON.stringify(event) });

  try {
    await agent.runAgent(input, {
      onEvent: ({ event }) => send(event),
    });
  } catch (err) {
    await send({
      type: EventType.RUN_ERROR,
      message: err instanceof Error ? err.message : String(err),
      code: 'run_error',
    } as BaseEvent).catch(() => undefined);
  }
}
