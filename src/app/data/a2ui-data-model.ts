import { A2uiMessage } from '@a2ui/web_core/v0_9';
import { HttpResourceRequest } from '@angular/common/http';
import { EVALUATE_JSONATA_URL } from '../agents/dashboard/dashboard-agent';

export interface DataModelResponse {
  result: Record<string, unknown>;
}

export function toDataModelRequest(
  expression: string | undefined,
): HttpResourceRequest | undefined {
  if (!expression) {
    return undefined;
  }
  return {
    url: EVALUATE_JSONATA_URL,
    method: 'POST',
    body: { data: { expression } },
  };
}

export function findSurfaceId(messages: A2uiMessage[]): string | undefined {
  const surfaceIds = messages.flatMap((message) =>
    'createSurface' in message ? [message.createSurface.surfaceId] : [],
  );
  return surfaceIds.at(0);
}

export function withDataModel(
  messages: A2uiMessage[],
  response: DataModelResponse | undefined,
): A2uiMessage[] {
  const surfaceId = findSurfaceId(messages);
  if (!response || !surfaceId) {
    return messages;
  }
  return [
    ...messages,
    {
      version: 'v0.9',
      updateDataModel: { surfaceId, path: '/', value: response.result },
    },
  ];
}
