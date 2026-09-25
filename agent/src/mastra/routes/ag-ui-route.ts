import type { ContextWithMastra } from '@mastra/core/server';
import { streamSSE } from 'hono/streaming';
import { AG_UI_STATE_KEY } from '../config';
import { streamAgentEvents } from './ag-ui-stream';
import { parseRunAgentInput, toAgUiAgent } from './route-utils';
import { stateSnapshots } from './state-snapshots';

export async function agUiRouteHandler(
  c: ContextWithMastra,
): Promise<Response> {
  const agentId = c.req.param('agentId') ?? '';
  const mastraInstance = c.get('mastra');
  const requestContext = c.get('requestContext');

  const parsed = await parseRunAgentInput(c);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { input } = parsed;
  requestContext.set(AG_UI_STATE_KEY, input.state);

  const mastraAgent = mastraInstance.listAgents()[agentId];
  if (!mastraAgent) {
    return c.json(
      { error: 'not_found', message: `Agent ${agentId} not found` },
      404,
    );
  }

  const agUiAgent = toAgUiAgent({
    agentId,
    mastraAgent,
    input,
    requestContext,
    abortSignal: c.req.raw.signal,
  });

  return streamSSE(
    c as unknown as Parameters<typeof streamSSE>[0],
    async (sse) => {
      await streamAgentEvents(sse, agUiAgent, input, {
        onEvent: stateSnapshots(requestContext),
      });
    },
  );
}
