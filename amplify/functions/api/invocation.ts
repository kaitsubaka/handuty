import { RuleError } from './rules';

/**
 * The event Amplify's function resolver sends: the operation name and its arguments are at the
 * top level, unlike a direct AppSync Lambda resolver (`info.fieldName`).
 */
export interface FunctionInvocation<Args> {
  typeName: string;
  fieldName: string;
  arguments: Args;
  identity: { sub?: string } | null;
}

export interface Invocation<Args> {
  field: string;
  args: Args;
  callerId: string;
}

export function readInvocation<Args>(event: FunctionInvocation<Args>): Invocation<Args> {
  const callerId = event.identity?.sub;
  if (!callerId) {
    throw new RuleError('UNAUTHENTICATED');
  }
  return { field: event.fieldName, args: event.arguments, callerId };
}
