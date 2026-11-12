import { describe, expect, it } from 'vitest';
import { readInvocation } from '../amplify/functions/api/invocation';

// Shape of the payload built by Amplify's function resolver (graphql-function-transformer).
const event = {
  typeName: 'Mutation',
  fieldName: 'registerProfile',
  arguments: { name: 'Demo Worker', role: 'WORKER' },
  identity: { sub: 'user-1', username: 'user-1' },
  source: null,
  request: { headers: {} },
  prev: null,
};

describe('readInvocation', () => {
  it('reads the field, the arguments and the caller from the top-level payload', () => {
    expect(readInvocation(event)).toEqual({
      field: 'registerProfile',
      args: { name: 'Demo Worker', role: 'WORKER' },
      callerId: 'user-1',
    });
  });

  it('refuses a call without a signed-in user', () => {
    expect(() => readInvocation({ ...event, identity: null })).toThrow('HANDUTY:UNAUTHENTICATED');
  });
});
