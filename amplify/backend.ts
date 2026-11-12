import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { api } from './functions/api/resource';

const backend = defineBackend({
  auth,
  data,
  api,
});

// Demo mode: nobody can sign up on their own; the owner creates the test accounts in Cognito
// and each one sets its own password on the first sign-in. See SPECS.md (Access).
backend.auth.resources.cfnResources.cfnUserPool.adminCreateUserConfig = {
  allowAdminCreateUserOnly: true,
};
