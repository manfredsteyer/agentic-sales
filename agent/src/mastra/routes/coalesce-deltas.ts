import {
  EventType,
  type BaseEvent,
  type TextMessageContentEvent,
  type ToolCallArgsEvent,
  type ToolCallEndEvent,
} from '@ag-ui/client';

const TEXT_FLUSH_INTERVAL_MS = 150;

type SendEvent = (event: BaseEvent) => Promise<void>;

function isTextContent(event: BaseEvent): event is TextMessageContentEvent {
  return event.type === EventType.TEXT_MESSAGE_CONTENT;
}

function isToolCallArgs(event: BaseEvent): event is ToolCallArgsEvent {
  return event.type === EventType.TOOL_CALL_ARGS;
}

function isToolCallEnd(event: BaseEvent): event is ToolCallEndEvent {
  return event.type === EventType.TOOL_CALL_END;
}

export function coalesceDeltas(send: SendEvent): SendEvent {
  let pendingText: TextMessageContentEvent | undefined;
  let pendingTextSince = 0;
  const pendingArgs = new Map<string, ToolCallArgsEvent>();

  const flushText = async (): Promise<void> => {
    if (pendingText) {
      const event = pendingText;
      pendingText = undefined;
      await send(event);
    }
  };

  return async (event) => {
    if (isToolCallArgs(event)) {
      const pending = pendingArgs.get(event.toolCallId);
      pendingArgs.set(
        event.toolCallId,
        pending ? { ...pending, delta: pending.delta + event.delta } : event,
      );
      return;
    }
    if (isTextContent(event)) {
      if (pendingText?.messageId === event.messageId) {
        pendingText = {
          ...pendingText,
          delta: pendingText.delta + event.delta,
        };
      } else {
        await flushText();
        pendingText = event;
        pendingTextSince = Date.now();
      }
      if (Date.now() - pendingTextSince >= TEXT_FLUSH_INTERVAL_MS) {
        await flushText();
      }
      return;
    }
    await flushText();
    if (isToolCallEnd(event)) {
      const args = pendingArgs.get(event.toolCallId);
      pendingArgs.delete(event.toolCallId);
      if (args) {
        await send(args);
      }
    }
    await send(event);
  };
}
