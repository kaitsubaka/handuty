import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { api } from './functions/api/resource';
import { preTokenGeneration } from './auth/pre-token-generation/resource';

const backend = defineBackend({
  auth,
  data,
  api,
  preTokenGeneration,
});

// Demo mode: nobody can sign up on their own; the owner creates the test accounts in Cognito
// and each one sets its own password on the first sign-in. See SPECS.md (Access).
backend.auth.resources.cfnResources.cfnUserPool.adminCreateUserConfig = {
  allowAdminCreateUserOnly: true,
};

// The trigger must run as version 2 to edit access tokens (needs the Essentials feature plan,
// the default for new user pools). Amplify registers it as version 1.
backend.auth.resources.cfnResources.cfnUserPool.userPoolTier = 'ESSENTIALS';
backend.auth.resources.cfnResources.cfnUserPool.addPropertyOverride(
  'LambdaConfig.PreTokenGenerationConfig',
  {
    LambdaArn: backend.preTokenGeneration.resources.lambda.functionArn,
    LambdaVersion: 'V2_0',
  },
);
