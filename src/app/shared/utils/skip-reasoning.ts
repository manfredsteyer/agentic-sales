import { MiddlewareFunction } from '@ag-ui/client';
import { filter } from 'rxjs';

// CopilotKit currently hides its processing indicator while a reasoning message is the last message
export const skipReasoning: MiddlewareFunction = (input, next) =>
  next.run(input).pipe(filter((event) => !event.type.startsWith('REASONING_')));
