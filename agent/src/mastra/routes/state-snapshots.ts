import { type BaseEvent, EventType, type StateSnapshotEvent } from '@ag-ui/client';
import type { RequestContext } from '@mastra/core/request-context';

import { AG_UI_STATE_KEY } from '../config';

export function stateSnapshots(requestContext: RequestContext): (event: BaseEvent) => BaseEvent[] {
  let emitted = requestContext.get(AG_UI_STATE_KEY);
  return (event) => {
    const state = requestContext.get(AG_UI_STATE_KEY);
    if (event.type !== EventType.TOOL_CALL_RESULT || state === emitted) {
      return [];
    }
    emitted = state;
    const snapshot: StateSnapshotEvent = { type: EventType.STATE_SNAPSHOT, snapshot: state };
    return [snapshot];
  };
}
