import { describe, expect, it } from 'vitest';
import type { Context, PreTokenGenerationV2TriggerEvent } from 'aws-lambda';
import { SELF_SERVICE_SCOPE, handler } from '../amplify/auth/pre-token-generation/handler';

function eventFor(triggerSource: string): PreTokenGenerationV2TriggerEvent {
  return {
    version: '2',
    triggerSource,
    region: 'us-east-1',
    userPoolId: 'us-east-1_test',
    userName: 'worker',
    callerContext: { awsSdkVersion: 'test', clientId: 'client' },
    request: {
      userAttributes: { sub: 'worker-sub', email: 'worker@handuty.test' },
      groupConfiguration: { groupsToOverride: [], iamRolesToOverride: [] },
      scopes: [SELF_SERVICE_SCOPE],
    },
    response: { claimsAndScopeOverrideDetails: null },
  } as unknown as PreTokenGenerationV2TriggerEvent;
}

describe('pre token generation', () => {
  it.each(['TokenGeneration_Authentication', 'TokenGeneration_RefreshTokens'])(
    'drops the self-service scope on %s',
    async (source) => {
      const result = await handler(eventFor(source), {} as Context, () => undefined);
      expect(
        result?.response.claimsAndScopeOverrideDetails?.accessTokenGeneration?.scopesToSuppress,
      ).toEqual([SELF_SERVICE_SCOPE]);
    },
  );
});
