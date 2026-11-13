import type { PreTokenGenerationV2TriggerHandler } from 'aws-lambda';

/**
 * Scope that lets a signed-in user call Cognito's self-service operations with the access
 * token: ChangePassword, DeleteUser, UpdateUserAttributes and the like.
 */
export const SELF_SERVICE_SCOPE = 'aws.cognito.signin.user.admin';

/**
 * Demo mode: the demo passwords are public, so access tokens are issued without the
 * self-service scope. Nobody can change a password, an email or delete an account with them;
 * only the owner can, with the admin APIs. The app itself never needs the scope.
 */
export const handler: PreTokenGenerationV2TriggerHandler = async (event) => {
  event.response = {
    claimsAndScopeOverrideDetails: {
      accessTokenGeneration: { scopesToSuppress: [SELF_SERVICE_SCOPE] },
    },
  };
  return event;
};
